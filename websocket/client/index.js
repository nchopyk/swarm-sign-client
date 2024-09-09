const WebSocket = require('ws');
const logger = require('../../modules/logger');


class Client {
  constructor() {
    this.ws = null;
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

        this.ws.send('something');
      });

      this.ws.on('message', (data) => {
        logger.info(`received message: ${data}`, { tag: 'WEBSOCKET CLIENT' });
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
