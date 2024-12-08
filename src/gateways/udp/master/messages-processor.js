const messagesBuilder = require('./messages-builder');
const config = require('../../../config');
const Logger = require('../../../modules/logger');
const { MESSAGES_TYPES } = require('../constants');

const logger = new Logger().tag('UDP SERVER | MASTER | MESSAGE PROCESSOR', 'cyan');

class MessagesProcessor {
  constructor() {
    this.handlers = {
      [MESSAGES_TYPES.CONNECTION_REQUEST]: (server, sender, payload) => this._processConnectRequest(server, sender, payload),
      [MESSAGES_TYPES.ACKNOWLEDGE_CONNECT_REQUEST]: (server, sender, payload) => this._processAcknowledgeConnectRequest(server, sender, payload),
    };
  }

  process(server, sender, message) {
    const { type, payload } = message;
    const handler = this.handlers[type];

    if (!handler) {
      throw new Error(`No handler for message type ${type}`);
    }

    handler(server, sender, payload);
  }

  _processConnectRequest(server, sender) {
    const response = messagesBuilder.connectRequestResponse({ masterId: config.CLIENT_ID });

    server.send(JSON.stringify(response), sender.port, sender.address, (err) => {
      if (err) {
        logger.error(err);
      }

      logger.info(`sent connect request response to ${sender.address}:${sender.port}`);
    });
  }

  _processAcknowledgeConnectRequest(server, sender) {
    const response = messagesBuilder.acknowledgeConnectRequestResponse({
      masterId: config.CLIENT_ID,
      websocketPort: config.WS_PORT,
    });

    server.send(JSON.stringify(response), sender.port, sender.address, (err) => {
      if (err) {
        logger.error(err);
      }

      logger.info(`sent acknowledge connect request response to ${sender.address}:${sender.port}`);
    });
  }
}

module.exports = new MessagesProcessor();
