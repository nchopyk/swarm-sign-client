const config = require('../../../config');
const validationSchemas = require('../validation-schemas');
const logger = require('../../../modules/logger');
const processMessageBroker = require('../../../modules/message-broker');
const { WebSocketServer } = require('ws');
const { heartbeat, initHealthCheckInterval, sendError, validate } = require('./internal-utils');
const { BROKER_MESSAGES_TYPES, ERROR_TYPES } = require('../constants');


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
      this.server = new WebSocketServer({ port: config.WS_PORT });

      this.server.on('listening', () => {
        logger.info(`server is listening on port ${config.WS_PORT}`, { tag: 'WEBSOCKET GATEWAY' });

        this.healthcheckInterval = initHealthCheckInterval(this.server);
        processMessageBroker.subscribe(BROKER_MESSAGES_TYPES.PROXY_SERVER_EVENT, (payload) => this._proxyEventToClient(payload));

        resolve(this.server);
      });

      this.server.on('error', (err) => {
        logger.error(err, { tag: 'WEBSOCKET GATEWAY' });

        reject(err);
      });

      this.server.on('connection', (connection, req) => {
        connection.isAlive = true;
        logger.info(`new connection from ${req.socket.remoteAddress}`, { tag: 'WEBSOCKET GATEWAY' });

        connection.on('message', (buffer) => this._proxyEventToServer(connection, buffer));
        connection.on('pong', () => heartbeat(connection));
        connection.on('error', (err) => logger.error(err, { tag: 'WEBSOCKET GATEWAY' }));
        connection.on('close', () => logger.warn('Connection closed', { tag: 'WEBSOCKET GATEWAY' }));
      });

      this.server.on('close', () => {
        clearInterval(this.healthcheckInterval);
      });
    });
  }

  async _proxyEventToServer(connection, buffer) {
    try {
      const parsedData = JSON.parse(buffer.toString());

      const { error, value: incomingPayload } = validate({ schema: validationSchemas.incomingMessage, data: parsedData });

      if (error) {
        return sendError({ connection, errorType: ERROR_TYPES.INVALID_DATA_FORMAT, message: error.message });
      }

      const handler = this.incommingHandlers[incomingPayload.event];

      if (handler) {
        const payload = await handler(connection, incomingPayload);
        processMessageBroker.publish(BROKER_MESSAGES_TYPES.PROXY_CLIENT_EVENT, payload);
        return;
      }

      processMessageBroker.publish(BROKER_MESSAGES_TYPES.PROXY_CLIENT_EVENT, incomingPayload);
    } catch (error) {
      sendError({ connection, errorType: ERROR_TYPES.INTERNAL_FAILURE, message: error.message });
      logger.error(error, { tag: 'WEBSOCKET GATEWAY' });
    }
  };

  async _proxyEventToClient(outgoingPayload) {
    try {
      const connection = this.connections[outgoingPayload.clientId];

      if (!connection) {
        return logger.error(`No connection found for clientId: ${outgoingPayload.clientId}`, { tag: 'WEBSOCKET GATEWAY' });
      }

      const handler = this.outgoungHandlers[outgoingPayload.event];

      if (handler) {
        const payload = await handler(connection, outgoingPayload);
        connection.send(JSON.stringify(payload));
        return;
      }

      connection.send(JSON.stringify(outgoingPayload));
    } catch (error) {
      logger.error(error, { tag: 'WEBSOCKET GATEWAY' });
    }
  }

  async stop() {
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
