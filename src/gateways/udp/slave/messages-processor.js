const responsesBroker = require('../../../modules/message-broker');
const { MESSAGES_TYPES } = require('../constants');

class MessagesProcessor {
  constructor() {
    this.handlers = {
      [MESSAGES_TYPES.CONNECTION_REQUEST_RESPONSE]: (server, sender, payload) => this._processConnectRequestResponse(server, sender, payload),
      [MESSAGES_TYPES.ACKNOWLEDGE_CONNECT_REQUEST_RESPONSE]: (server, sender, payload) => this._processAcknowledgeConnectRequestResponse(server, sender, payload),
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

  _processConnectRequestResponse(server, sender, payload) {
    const response = {
      masterId: payload.masterId,
      rating: payload.rating,
      address: sender.address,
      port: sender.port,
    };

    responsesBroker.publish(MESSAGES_TYPES.CONNECTION_REQUEST_RESPONSE, response);
  }

  _processAcknowledgeConnectRequestResponse(server, sender, payload) {
    responsesBroker.publish(MESSAGES_TYPES.ACKNOWLEDGE_CONNECT_REQUEST_RESPONSE, payload);
  }

}

module.exports = new MessagesProcessor();
