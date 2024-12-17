const config = require('../../../config');
const validationSchemas = require('../validation-schemas');
const processMessageBroker = require('../../../modules/message-broker');
const ipcMain = require('../../../app/ipc-main');
const connectionsManager = require('./internal.connections-manager');
const internalHandlers = require('./internal.handlers');
const swarmController = require('./internal.swarm-controller');
const state = require('../../../state');
const { heartbeat, initHealthCheckInterval, sendError, validate } = require('./internal.utils');
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { BROKER_MESSAGES_TYPES, ERROR_TYPES, MASTER_SERVER_EVENTS, SLAVE_CLIENT_EVENTS } = require('../constants');
const { IPC_COMMANDS, SERVER_EVENTS } = require('../../../app/constants');
const Logger = require('../../../modules/Logger');
const { generateRandomNumberInRange } = require('../../../modules/helpers');
const { onScheduleEventInterceptor } = require('./internal.interceptors');
const topologyBuilder = require('../../../modules/topology-builder');
const path = require('path');


const logger = new Logger().tag('WEBSOCKET | MASTER', 'magenta');


class WebsocketGateway {
  constructor() {
    this.internalHandlers = {
      [MASTER_SERVER_EVENTS.SLAVE_INFO]: internalHandlers.onSlaveInfo
    };
    this.incommingHandlers = {};
    this.inteceptors = {
      [SERVER_EVENTS.SCHEDULE]: onScheduleEventInterceptor,
    };

    this.server = null;
    this.httpServer = null;

    this.healthcheckInterval = null;
    this.globalTopologySyncInterval = null;

    // Retry logic configuration
    this.maxRetries = 5; // maximum number of retries
    this.attempt = 0;    // current retry attempt
    this.currentPort = 8002; // start from the configured WebSocket port
  }

  async start() {
    return new Promise((resolve, reject) => {
      const attemptBind = (port) => {
        const app = express();
        app.use(cors());


        // Serve static files from the 'storage' folder
        app.use('/storage', express.static(path.resolve(__dirname, '..', '..', '..', '..', `storage${process.env.INSTANCE_ID ? `-${process.env.INSTANCE_ID}` : ''}`)));
        // Create the HTTP server
        this.httpServer = http.createServer(app);

        // Attach WebSocket server to the HTTP server
        this.server = new WebSocket.Server({ server: this.httpServer });

        this.server.on('listening', () => {
          logger.info(`server is listening on port ${port}`);

          ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_WEB_SOCKET, {
            address: this.server.address().address,
            port: this.server.address().port,
            connections: connectionsManager.getConnectionsCount(),
          });

          config.WS_PORT = this.server.address().port;

          this.healthcheckInterval = initHealthCheckInterval(this.server);
          this.globalTopologySyncInterval = this.initGlobalTopologyInterval();

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
            this.httpServer.close(() => {
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

        this.httpServer.listen(port, config.LOCAL_ADDRESS, () => {
          logger.info(`HTTP server is running on http://${config.LOCAL_ADDRESS}:${port}`);
        });

        this.httpServer.on('close', () => {
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

    if (this.httpServer) {
      this.httpServer.close();
    }

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

      const interceptor = this.inteceptors[outgoingPayload.event];

      if (interceptor) {
        outgoingPayload = await interceptor(outgoingPayload);
      }

      connection.send(JSON.stringify(outgoingPayload));
    } catch (error) {
      logger.error(error);
    }
  }

  async initGlobalTopologyInterval() {
    if (this.globalTopologySyncInterval) {
      clearInterval(this.globalTopologySyncInterval);
    }

    return setInterval(() => {
      if (!state.websocketConnectionType || state.websocketConnectionType !== 'server') {
        return;
      }

      connectionsManager.broadcastMessageBetweenMasters(JSON.stringify({
        event: SLAVE_CLIENT_EVENTS.GLOBAL_MASTER_TOPOLOGY,
        clientId: config.CLIENT_ID,
        data: topologyBuilder.getCurrentTopology(),
      }));
    }, 1000);
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
