const dgram = require('dgram');
const config = require('../../../config');
const logger = require('../../../modules/logger');
const messagesProcessor = require('./messages-processor');


class MasterUDPGateway {
  constructor() {
    this.server = dgram.createSocket('udp4');

    this.server.on('message', async (data, rinfo) => {
      try {
        const message = JSON.parse(data.toString());
        const sender = { address: rinfo.address, port: rinfo.port };

        logger.info(`incoming message from ${sender.address}:${sender.port}: ${data.toString()}`, { tag: 'UDP SERVER | MASTER | ON MESSAGE' });

        await messagesProcessor.process(this.server, sender, message);
      } catch (error) {
        logger.error(error, { tag: 'UDP SERVER | MASTER | ON MESSAGE' });
      }
    });

    this.server.on('error', (err) => {
      logger.error(err, { tag: 'UDP SERVER | MASTER | ON ERROR' });
      this.server.close();
    });
  }

  async start() {
    if (!this.server) {
      this.server = dgram.createSocket('udp4');
    }

    return new Promise((resolve, reject) => {
      this.server.on('error', (err) => {
        reject(err);
      });

      this.server.on('listening', () => {
        this.server.setBroadcast(true);

        const address = this.server.address();

        logger.info(`server listening ${address.address}:${address.port}`, { tag: 'UDP SERVER | MASTER | ON LISTENING' });
        resolve(this.server);
      });

      this.server.bind(config.MASTER_PORT, config.LOCAL_ADDRESS);
    });
  }

  async stop() {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          reject(err);
          return;
        }

        this.server = null;

        logger.info('server closed', { tag: 'UDP SERVER | MASTER | ON CLOSE' });
        resolve();
      });
    });
  }
}


module.exports = new MasterUDPGateway();