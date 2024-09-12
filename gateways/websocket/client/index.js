const WebSocket = require('ws');
const logger = require('../../../modules/logger');
const config = require('../../../config');
const validationSchemas = require('../validation-schemas');
const processMessageBroker = require('../../../modules/message-broker');
const { validate, sendError, sendMessage } = require('./internal-utils');
const { ERROR_TYPES, BROKER_MESSAGES_TYPES } = require('../constants');


class Client {
  constructor() {
    this.ws = null;
    this.handlers = {};
  }

  async start(address, port) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`ws://${address}:${port}`);

      this.ws.on('error', (error) => {
        logger.error(error, { tag: 'WEBSOCKET CLIENT' });
        reject(error);
      });

      this.ws.on('open', () => {
        logger.info('connected to server', { tag: 'WEBSOCKET CLIENT' });
        resolve();
      });

      this.ws.on('message', async (buffer) => {
        const parsedData = JSON.parse(buffer.toString());

        const { error, value: incomingPayload } = validate({ schema: validationSchemas.incomingMessage, data: parsedData });

        if (error) {
          return sendError({ connection: this.ws, errorType: ERROR_TYPES.INVALID_DATA_FORMAT, message: error.message });
        }

        const handler = this.handlers[incomingPayload.event];

        if (!handler) {
          return sendError({ connection: this.ws, errorType: ERROR_TYPES.UNKNOWN_EVENT, message: `Unknown event: ${incomingPayload.event}` });
        }

        if (incomingPayload.clientId !== config.CLIENT_ID) {
          processMessageBroker.publish(BROKER_MESSAGES_TYPES.PROXY_SERVER_EVENT, incomingPayload);
          return;
        }

        await handler(incomingPayload.payload);
      });
    });
  }

  async stop() {
    return new Promise((resolve, reject) => {
      this.ws.close((err) => {
        if (err) {
          reject(err);
          return;
        }

        this.ws = null;
        resolve();
      });

    });
  }

  async login(){
    sendMessage({ connection: this.ws, event: 'login', data: { clientId: config.CLIENT_ID } });
  }
}

module.exports = new Client();
