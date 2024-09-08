const EventEmitter = require('node:events');


class ResponsesBroker {
  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  subscribe(event, handler) {
    this.eventEmitter.on(event, handler);
  }

  subscribeOnce(event, handler) {
    this.eventEmitter.once(event, handler);
  }

  unsubscribe(event, handler) {
    this.eventEmitter.removeListener(event, handler);
  }

  publish(event, data) {
    this.eventEmitter.emit(event, data);
  }
}


module.exports = new ResponsesBroker();

