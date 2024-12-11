const config = require('../../../config');
const validationSchemas = require('../validation-schemas');
const processMessageBroker = require('../../../modules/message-broker');
const ipcMain = require('../../../app/ipc-main');
const connectionsManager = require('./internal.connections-manager');
const internalHandlers = require('./internal.handlers');
const swarmController = require('./internal.swarm-controller');
const { heartbeat, initHealthCheckInterval, sendError, validate } = require('./internal.utils');
const { WebSocketServer } = require('ws');
const { BROKER_MESSAGES_TYPES, ERROR_TYPES, MASTER_SERVER_EVENTS } = require('../constants');
const { IPC_COMMANDS } = require('../../../app/constants');
const Logger = require('../../../modules/Logger');
const { generateRandomNumberInRange } = require('../../../modules/helpers');
const topologyBuilder = require('../../../modules/topology-builder');

const logger = new Logger().tag('WEBSOCKET | MASTER', 'magenta');


class WebsocketGateway {
  constructor() {
    this.internalHandlers = {
      [MASTER_SERVER_EVENTS.SLAVE_INFO]: internalHandlers.onSlaveInfo
    };
    this.incommingHandlers = {};
    this.outgoungHandlers = {};
    this.server = null;
    this.healthcheckInterval = null;

    // Retry logic configuration
    this.maxRetries = 5; // maximum number of retries
    this.attempt = 0;    // current retry attempt
    this.currentPort = 8002; // start from the configured WebSocket port
  }

  async start() {
    return new Promise((resolve, reject) => {
      const attemptBind = (port) => {
        this.server = new WebSocketServer({ port, host: config.LOCAL_ADDRESS });

        this.server.on('listening', () => {
          logger.info(`server is listening on port ${port}`);

          ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_WEB_SOCKET, {
            address: this.server.address().address,
            port: this.server.address().port,
            connections: connectionsManager.getConnectionsCount(),
          });

          config.WS_PORT = this.server.address().port;

          this.healthcheckInterval = initHealthCheckInterval(this.server);
          processMessageBroker.subscribe(BROKER_MESSAGES_TYPES.PROXY_SERVER_EVENT, (payload) => this._proxyEventToClient(payload));

          ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_TOPOLOGY, topologyBuilder.getCurrentTopology());

          resolve(this.server);
        });

        this.server.on('error', (err) => {
          logger.error(err);

          // Check if it's EADDRINUSE and we haven't exceeded max retries
          if (err.code === 'EADDRINUSE' && this.attempt < this.maxRetries) {
            this.attempt += 1;
            this.currentPort = generateRandomNumberInRange(4000, 9000);
            logger.warn(`Port ${port} is in use, retrying with port ${this.currentPort} (attempt ${this.attempt}/${this.maxRetries})`);

            // Close current server before retrying
            this.server.close(() => {
              // remove all event listeners before retrying
              this.server.removeAllListeners();

              attemptBind(this.currentPort);
            });
          } else {
            reject(err);
          }
        });

        this.server.on('connection', (connection, req) => {
          connection.isAlive = true;
          logger.info(`new connection from ${req.socket.remoteAddress}`);

          connection.on('message', (buffer) => this._proxyEventToServer(connection, buffer));
          connection.on('pong', () => heartbeat(connection));
          connection.on('error', (err) => logger.error(err));

          connection.on('close', async () => {
            logger.warn('connection closed');
            if (connectionsManager.getConnection(connection.clientId)) {
              connectionsManager.removeConnection(connection.clientId);

              ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_WEB_SOCKET, {
                address: null,
                port: null,
                connections: connectionsManager.getConnectionsCount(),
              });

              ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_TOPOLOGY, topologyBuilder.getCurrentTopology());

              await swarmController.control();
            }
          });
        });

        this.server.on('close', () => {
          clearInterval(this.healthcheckInterval);
          this.healthcheckInterval = null;
          config.WS_PORT = null;
          ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_WEB_SOCKET, { address: null, port: null, connections: 0 });
          ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_TOPOLOGY, topologyBuilder.getCurrentTopology());
        });
      };

      // Initial attempt to bind
      attemptBind(this.currentPort);
    });
  }

  async stop() {
    connectionsManager.closeAllConnections();

    if (!this.server) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          reject(err);
          return;
        }

        clearInterval(this.healthcheckInterval);

        this.server = null;
        this.healthcheckInterval = null;

        resolve();
      });
    });
  }

  async _proxyEventToServer(connection, buffer) {
    try {
      const parsedData = JSON.parse(buffer.toString());

      logger.info(`incoming message: ${buffer.toString()}`);

      const { error, value: incomingPayload } = validate({ schema: validationSchemas.incomingMessage, data: parsedData });

      if (error) {
        logger.error(error);
        return sendError({ connection, errorType: ERROR_TYPES.INVALID_DATA_FORMAT, message: error.message });
      }

      if (!connection.clientId && !connectionsManager.getConnection(incomingPayload.clientId)) {
        connectionsManager.addConnection(incomingPayload.clientId, connection);

        ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_WEB_SOCKET, {
          address: this.server.address().address,
          port: this.server.address().port,
          connections: connectionsManager.getConnectionsCount(),
        });

        ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_TOPOLOGY, topologyBuilder.getCurrentTopology());
      }

      const internalHandler = this.internalHandlers[incomingPayload.event];

      if (internalHandler) {
        await internalHandler(connection, incomingPayload);
        return;
      }

      const handler = this.incommingHandlers[incomingPayload.event];

      if (handler) {
        const payload = await handler.handler(incomingPayload.data);
        processMessageBroker.publish(BROKER_MESSAGES_TYPES.PROXY_CLIENT_EVENT, payload);
        return;
      }

      logger.warn(`no handler found for event: ${incomingPayload.event}`);
      processMessageBroker.publish(BROKER_MESSAGES_TYPES.PROXY_CLIENT_EVENT, incomingPayload);
    } catch (error) {
      sendError({ connection, errorType: ERROR_TYPES.INTERNAL_FAILURE, message: error.message });
      logger.error(error);
    }
  }

  async _proxyEventToClient(outgoingPayload) {
    try {
      const connection = connectionsManager.getConnection(outgoingPayload.clientId);

      if (!connection) {
        logger.error(`no connection found for clientId: ${outgoingPayload.clientId}, sending between all masters`);
        connectionsManager.broadcastMessageBetweenMasters(JSON.stringify(outgoingPayload));
        return;
      }

      connection.send(JSON.stringify(outgoingPayload));
    } catch (error) {
      logger.error(error);
    }
  }

  getServerAddress() {
    if (!this.server) {
      return null;
    }

    const { address, port } = this.server ? this.server.address() : { address: config.LOCAL_ADDRESS, port: null };

    return { address, port };
  }
}


module.exports = new WebsocketGateway();
