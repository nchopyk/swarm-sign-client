const responsesBroker = require('../responses-broker');
const { MESSAGES_TYPES, BROKER_EVENTS } = require('../constants');

class MessagesProcessor {
  constructor() {
    this.handlers = {
      [MESSAGES_TYPES.CONNECT_REQUEST_RESPONSE]: (server, sender, payload) => this._processConnectRequestResponse(server, sender, payload),
    };
  }

  process(server, sender, message) {
    if (this.handlers[message.type]) {
      this.handlers[message.type](server, sender, message.payload);
    }
  }

  _processConnectRequestResponse(server, sender, payload) {
    const response = {
      masterId: payload.masterId, masterAddress: sender.address, masterPort: sender.port,
    };

    responsesBroker.publish(BROKER_EVENTS.CONNECT_REQUEST_RESPONSE, response);
  }

}

module.exports = new MessagesProcessor();
