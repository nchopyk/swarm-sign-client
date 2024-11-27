const dgram = require('dgram');
const config = require('../../../config');
const logger = require('../../../modules/logger');
const messagesProcessor = require('./messages-processor');
const ipcCommands = require('../../../../electron/ipc-commands');
const ipcMain = require('../../../../electron/ipc-main');


class MasterUDPGateway {
  constructor() {
    this.server = null;
  }

  async start() {
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

    return new Promise((resolve, reject) => {
      this.server.on('error', (err) => {
        reject(err);
      });

      this.server.on('listening', () => {
        this.server.setBroadcast(true);

        const address = this.server.address();

        ipcMain.sendCommand(ipcCommands.UPDATE_MASTER_GATEWAY, { address: config.LOCAL_ADDRESS, port: address.port });

        logger.info(`server listening ${address.address}:${address.port}`, { tag: 'UDP SERVER | MASTER | ON LISTENING' });
        resolve(this.server);
      });

      this.server.bind(config.MASTER_PORT, config.LOCAL_ADDRESS);
    });
  }

  async stop() {
    if (!this.server) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          reject(err);
          return;
        }

        this.server.removeAllListeners();
        this.server = null;

        ipcMain.sendCommand(ipcCommands.UPDATE_MASTER_GATEWAY, { address: null, port: null });

        logger.info('server closed', { tag: 'UDP SERVER | MASTER | ON CLOSE' });
        resolve();
      });
    });
  }
}


module.exports = new MasterUDPGateway();
