const config = require('../../../config');
const validationSchemas = require('../validation-schemas');
const processMessageBroker = require('../../../modules/message-broker');
const { WebSocketServer } = require('ws');
const { heartbeat, initHealthCheckInterval, sendError, validate } = require('./internal.utils');
const { BROKER_MESSAGES_TYPES, ERROR_TYPES } = require('../constants');
const ipcMain = require('../../../app/ipc-main');
const { IPC_COMMANDS } = require('../../../app/constants');
const Logger = require('../../../modules/Logger');

const logger = new Logger().tag('WEBSOCKET | MASTER', 'magenta');

class WebsocketGateway {
  constructor() {
    this.incommingHandlers = {};
    this.outgoungHandlers = {};
    this.connections = {};
    this.server = null;
    this.healthcheckInterval = null;
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = new WebSocketServer({ port: config.WS_PORT, host: config.LOCAL_ADDRESS });

      this.server.on('listening', () => {
        logger.info(`server is listening on port ${config.WS_PORT}`);

        ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_WEB_SOCKET, {
          address: this.server.address().address,
          port: this.server.address().port,
          connections: Object.keys(this.connections).length
        });

        this.healthcheckInterval = initHealthCheckInterval(this.server);
        processMessageBroker.subscribe(BROKER_MESSAGES_TYPES.PROXY_SERVER_EVENT, (payload) => this._proxyEventToClient(payload));

        resolve(this.server);
      });

      this.server.on('error', (err) => {
        logger.error(err);

        reject(err);
      });

      this.server.on('connection', (connection, req) => {
        connection.isAlive = true;
        logger.info(`new connection from ${req.socket.remoteAddress}`);

        connection.on('message', (buffer) => this._proxyEventToServer(connection, buffer));
        connection.on('pong', () => heartbeat(connection));
        connection.on('error', (err) => logger.error(err));
        connection.on('close', () => {
          logger.warn('connection closed');
          if (this.connections[connection.clientId]) {
            delete this.connections[connection.clientId];
            ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_WEB_SOCKET, {
              address: this.server.address().address,
              port: this.server.address().port,
              connections: Object.keys(this.connections).length
            });
          }
        });
      });

      this.server.on('close', () => {
        clearInterval(this.healthcheckInterval);
        this.healthcheckInterval = null;
        ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_WEB_SOCKET, { address: null, port: null, connections: 0 });
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

      if (!this.connections[incomingPayload.clientId]) {
        this.connections[incomingPayload.clientId] = connection;
        connection.clientId = incomingPayload.clientId;
        ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_WEB_SOCKET, {
          address: this.server.address().address,
          port: this.server.address().port,
          connections: Object.keys(this.connections).length
        });
      }

      const handler = this.incommingHandlers[incomingPayload.event];

      if (handler) {
        const payload = await handler(connection, incomingPayload);
        processMessageBroker.publish(BROKER_MESSAGES_TYPES.PROXY_CLIENT_EVENT, payload);
        return;
      }

      logger.warn(`no additional handler found for event: ${incomingPayload.event}`);
      processMessageBroker.publish(BROKER_MESSAGES_TYPES.PROXY_CLIENT_EVENT, incomingPayload);
    } catch (error) {
      sendError({ connection, errorType: ERROR_TYPES.INTERNAL_FAILURE, message: error.message });
      logger.error(error);
    }
  }

  async _proxyEventToClient(outgoingPayload) {
    try {
      const connection = this.connections[outgoingPayload.clientId];

      if (!connection) {
        return logger.error(`no connection found for clientId: ${outgoingPayload.clientId}`);
      }

      const handler = this.outgoungHandlers[outgoingPayload.event];

      if (handler) {
        const payload = await handler(connection, outgoingPayload);
        connection.send(JSON.stringify(payload));
        return;
      }

      connection.send(JSON.stringify(outgoingPayload));
    } catch (error) {
      logger.error(error);
    }
  }

  async stop() {
    Object.values(this.connections).forEach((connection) => connection.close());
    this.connections = {};

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
}


module.exports = new WebsocketGateway();
