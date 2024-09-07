const messagesBuilder = require('./messages-builder');
const config = require('../../config');
const logger = require('../../modules/logger');
const { MESSAGES_TYPES } = require('../constants');

class MessagesProcessor {
  constructor() {
    this.handlers = {
      [MESSAGES_TYPES.CONNECTION_REQUEST]: (server, sender, payload) => this._processConnectRequest(server, sender, payload),
    };
  }

  process(server, sender, message) {
    if (this.handlers[message.type]) {
      this.handlers[message.type](server, sender, message.payload);
    }

  }

  _processConnectRequest(server, sender) {
    const response = messagesBuilder.connectRequestResponse({ masterId: config.MASTER_ID });

    server.send(JSON.stringify(response), sender.port, sender.address, (err) => {
      if (err) {
        logger.error(err, { tag: 'UDP SERVER | MASTER | MESSAGE PROCESSOR' });
      }

      logger.info(`sent connect request response to ${sender.address}:${sender.port}`, { tag: 'UDP SERVER | MASTER | MESSAGE PROCESSOR' });
    });
  }
}

module.exports = new MessagesProcessor();
