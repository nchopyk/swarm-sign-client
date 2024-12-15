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
    this.maxRetries = 5; // You can adjust this number as needed
    this.currentPort = 8001; // Start from the configured master port
    this.attempt = 0;
  }

  async start() {
    return new Promise((resolve, reject) => {
      const attemptBind = (port) => {
        this.server = dgram.createSocket('udp4');

        this.server.on('message', async (data, rinfo) => {
          try {
            const message = JSON.parse(data.toString());
            const sender = { address: rinfo.address, port: rinfo.port };

            logger.info(`incoming message from ${sender.address}:${sender.port}: ${data.toString()}`);

            if (!this.server) {
              logger.warn('server is not running');
              return;
            }

            await messagesProcessor.process(this.server, sender, message);
          } catch (error) {
            logger.error(error);
          }
        });

        this.server.on('error', (err) => {
          logger.error(err);

          // If the address is in use and we have retries left, increment the port and try again.
          if (err.code === 'EADDRINUSE' && this.attempt < this.maxRetries) {
            this.attempt += 1;
            this.currentPort += 1;
            logger.warn(`Port ${port} is in use, retrying with port ${this.currentPort} (attempt ${this.attempt}/${this.maxRetries})`);

            // Close the current server and retry
            this.server.close(() => {
              this.server.removeAllListeners();

              attemptBind(this.currentPort);
            });
          } else {
            // If no more retries or error is of different nature, reject
            reject(err);
          }
        });

        this.server.on('close', () => {
          logger.info('server closed');
          config.MASTER_PORT = null;
        });

        this.server.on('listening', () => {
          this.server.setBroadcast(true);


          const address = this.server.address();
          ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_GATEWAY, { address: address.address, port: address.port });

          logger.info(`server listening ${address.address}:${address.port}`);

          config.MASTER_PORT = address.port;
          resolve(this.server);
        });

        this.server.bind(port, config.LOCAL_ADDRESS);
      };

      attemptBind(this.currentPort);
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
