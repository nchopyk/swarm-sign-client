const dgram = require('dgram');
const config = require('../../../config');
const messagesProcessor = require('./messages-processor');
const { IPC_COMMANDS } = require('../../../app/constants');
const ipcMain = require('../../../app/ipc-main');
const Logger = require('../../../modules/Logger');

const logger = new Logger().tag('UDP SERVER | MASTER | MESSAGE PROCESSOR', 'yellow');

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

        logger.info(`incoming message from ${sender.address}:${sender.port}: ${data.toString()}`);

        await messagesProcessor.process(this.server, sender, message);
      } catch (error) {
        logger.error(error);
      }
    });

    this.server.on('error', (err) => {
      logger.error(err);
      this.server.close();
    });

    return new Promise((resolve, reject) => {
      this.server.on('error', (err) => {
        reject(err);
      });

      this.server.on('listening', () => {
        this.server.setBroadcast(true);

        const address = this.server.address();

        ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_GATEWAY, { address: this.server.address().address, port: this.server.address().port });

        logger.info(`server listening ${address.address}:${address.port}`);
        resolve(this.server);
      });

      this.server.bind(config.MASTER_PORT, config.LOCAL_ADDRESS);
    });
  }

  async stop() {
    if (!this.server) {
      logger.warn('server is not running');
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

        ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_GATEWAY, { address: null, port: null });

        logger.info('server closed');
        resolve();
      });
    });
  }
}


module.exports = new MasterUDPGateway();
