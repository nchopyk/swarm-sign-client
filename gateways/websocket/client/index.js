const WebSocket = require('ws');
const logger = require('../../../modules/logger');
const config = require('../../../config');
const validationSchemas = require('../validation-schemas');
const processMessageBroker = require('../../../modules/message-broker');
const { validate } = require('./internal-utils');
const { BROKER_MESSAGES_TYPES, SERVER_EVENTS } = require('../constants');
const {
  onInvalidIncomingMessage,
  onHandlerMissing,
  onAuthCode,
  onLoginSuccess,
  onLoginFailure,
} = require('../../../src/client/event-handlers');


class Client {
  constructor() {
    this.ws = null;
    this.handlers = {
      [SERVER_EVENTS.AUTH_CODE]: onAuthCode,
      [SERVER_EVENTS.LOGIN_SUCCESS]: onLoginSuccess,
      [SERVER_EVENTS.LOGIN_FAILURE]: onLoginFailure,
    };
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
        try {
          const parsedData = JSON.parse(buffer.toString());

          const { error, value: incomingPayload } = validate({ schema: validationSchemas.incomingMessage, data: parsedData });
          if (error) {
            return onInvalidIncomingMessage(this.ws, error);
          }

          const handler = this.handlers[incomingPayload.event];
          if (!handler) {
            return onHandlerMissing(this.ws, incomingPayload.event);
          }

          if (incomingPayload.clientId !== config.CLIENT_ID) {
            return processMessageBroker.publish(BROKER_MESSAGES_TYPES.PROXY_SERVER_EVENT, incomingPayload);
          }

          await handler(this.ws, incomingPayload.payload);
        } catch (error) {
          logger.error(error, { tag: 'WEBSOCKET CLIENT' });
        }
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
}

module.exports = new Client();
