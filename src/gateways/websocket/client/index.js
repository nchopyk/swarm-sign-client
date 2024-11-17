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
  onAuthSuccess,
  onLoginSuccess,
  onLoginFailure,
  onConnection,
  onError,
  onSchedule
} = require('../../../client/event-handlers');


class Client {
  constructor() {
    this.ws = null;
    this.handlers = {
      [SERVER_EVENTS.AUTH_CODE]: onAuthCode,
      [SERVER_EVENTS.AUTH_SUCCESS]: onAuthSuccess,
      [SERVER_EVENTS.LOGIN_SUCCESS]: onLoginSuccess,
      [SERVER_EVENTS.LOGIN_FAILURE]: onLoginFailure,
      [SERVER_EVENTS.SCHEDULE]: onSchedule,
      [SERVER_EVENTS.ERROR]: onError
    };
    this.port = null;
    this.address = null;
  }

  async start({ address, port, type }) {
    this.address = address;
    this.port = port;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`ws://${address}:${port}`);

      this.ws.on('error', (error) => {
        logger.error(error, { tag: 'WEBSOCKET CLIENT' });
        reject(error);
      });

      this.ws.on('open', () => {
        logger.info('connected to server', { tag: 'WEBSOCKET CLIENT' });
        resolve();

        onConnection(this.ws, address, port, type);
      });

      this.ws.on('message', async (buffer) => {
        try {
          const parsedData = JSON.parse(buffer.toString());

          logger.info(`received message: ${JSON.stringify(parsedData)}`, { tag: 'WEBSOCKET CLIENT' });

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

          await handler(this.ws, incomingPayload.data);
        } catch (error) {
          logger.error(error, { tag: 'WEBSOCKET CLIENT' });
        }
      });

      this.ws.on('close', () => {
        logger.warn('connection closed', { tag: 'WEBSOCKET CLIENT' });
        this.retryConnection();
      });
    });
  }

  async stop() {
    if (!this.ws) {
      return;
    }

    this.ws.removeAllListeners();
    this.ws.close();
  }

  async retryConnection() {
    if (!this.address || !this.port) {
      throw new Error('address and port must be set before restarting');
    }

    setTimeout(() => {
      this.start(this.address, this.port).catch((error) => {
        logger.warn(`failed to reconnect: ${error.message}`, { tag: 'WEBSOCKET CLIENT' });
      });
    }, 1000);
  }
}

module.exports = new Client();
