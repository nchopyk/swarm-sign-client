const responsesBroker = require('../responses-broker');
const { MESSAGES_TYPES, BROKER_EVENTS } = require('../constants');

class MessagesProcessor {
  constructor() {
    this.handlers = {
      [MESSAGES_TYPES.CONNECTION_REQUEST_RESPONSE]: (server, sender, payload) => this._processConnectRequestResponse(server, sender, payload),
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
      masterAddress: sender.address,
      masterPort: sender.port,
    };

    responsesBroker.publish(BROKER_EVENTS.CONNECTION_REQUEST_RESPONSE, response);
  }

}

module.exports = new MessagesProcessor();
