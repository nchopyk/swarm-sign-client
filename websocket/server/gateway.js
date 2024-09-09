const config = require('../../config');
const validationSchemas = require('./validation-schemas');
const logger = require('../../modules/logger');
const { WebSocketServer } = require('ws');
const { heartbeat, initHealthCheckInterval, sendError, validate } = require('./internal-utils');
const { BAD_REQUEST, EVENT_HANDLER_NOT_FOUND, INTERNAL_FAILURE } = require('../errors-types');


class WebsocketGateway {
  constructor() {
    this.handlers = {};
    this.server = null;
    this.healthcheckInterval = null;
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = new WebSocketServer({ port: config.WS_PORT });

      this.server.on('listening', () => {
        logger.info(`server is listening on port ${config.WS_PORT}`, { tag: 'WEBSOCKET GATEWAY' });

        this.healthcheckInterval = initHealthCheckInterval(this.server);

        resolve(this.server);
      });

      this.server.on('error', (err) => {
        logger.error(err, { tag: 'WEBSOCKET GATEWAY' });

        reject(err);
      });

      this.server.on('connection', (connection, req) => {
        connection.isAlive = true;
        logger.info(`new connection from ${req.socket.remoteAddress}`, { tag: 'WEBSOCKET GATEWAY' });

        connection.on('message', (msg) => this._onMessage(connection, msg));
        connection.on('pong', () => heartbeat(connection));
        connection.on('error', (err) => logger.error(err, { tag: 'WEBSOCKET GATEWAY' }));
        connection.on('close', () => logger.warn('Connection closed', { tag: 'WEBSOCKET GATEWAY' }));
      });

      this.server.on('close', () => {
        clearInterval(this.healthcheckInterval);
      });
    });
  }

  async stop() {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          reject(err);
          return;
        }

        this.server = null;
        this.healthcheckInterval = null;

        resolve();
      });
    });
  }

  async _onMessage(connection, msg) {
    try {
      const parsedData = JSON.parse(msg.toString());

      const { error, value: payload } = validate({ schema: validationSchemas.incomingMessage, data: parsedData });

      if (error) {
        return sendError({ connection, errorType: BAD_REQUEST, message: error.message });
      }

      const { clientId, event, data } = payload;

      const handler = this.handlers[event];
      if (!handler) {
        return sendError({ connection, errorType: EVENT_HANDLER_NOT_FOUND, message: `No handler for "${event}" event` });
      }

      await handler(connection, data);
    } catch (error) {
      sendError({ connection, errorType: INTERNAL_FAILURE, message: error.message });

      logger.error(error, { tag: 'WEBSOCKET GATEWAY' });
    }
  };
}


module.exports = new WebsocketGateway();
