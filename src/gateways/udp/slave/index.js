const dgram = require('dgram');
const config = require('../../../config');
const messagesProcessor = require('./messages-processor');
const messagesBuilder = require('./messages-builder');
const responsesBroker = require('../../../modules/message-broker');
const { IPC_COMMANDS } = require('../../../app/constants');
const ipcMain = require('../../../app/ipc-main');
const { MESSAGES_TYPES } = require('../constants');
const Logger = require('../../../modules/Logger');

const logger = new Logger().tag('UDP SERVER | SLAVE', 'yellow');

class SlaveUDPGateway {
  constructor() {
    this.server = dgram.createSocket('udp4');
  }

  async start() {
    if (!this.server) {
      this.server = dgram.createSocket('udp4');
    }

    this.server.on('error', (err) => {
      logger.error(err);
      this.server.close();
    });

    this.server.on('message', (msg, rinfo) => {
      try {
        logger.info(`Received message from ${rinfo.address}:${rinfo.port}: ${msg}`);

        const message = JSON.parse(msg.toString());
        const sender = { address: rinfo.address, port: rinfo.port };

        messagesProcessor.process(this.server, sender, message);

      } catch (error) {
        logger.error(error);
      }
    });

    return new Promise((resolve, reject) => {
      this.server.on('error', (err) => {
        reject(err);
      });

      this.server.on('listening', () => {
        this.server.setBroadcast(true);

        const address = this.server.address();

        logger.info(`server listening ${address.address}:${address.port}`);
        resolve(this.server);
      });

      const port = this._getRandomPort();
      this.server.bind(port, config.LOCAL_ADDRESS);
    });
  }

  async stop() {
    return new Promise((resolve, reject) => {
      this.server.removeAllListeners();

      this.server.close((err) => {
        if (err) {
          reject(err);
          this.server = null;
          return;
        }

        logger.info('server closed');
        this.server = null;
        resolve();
      });
    });
  }

  async scanForMasters(waitTime = 2000) {
    if (!this.server) {
      throw new Error('Server is not running');
    }

    const message = messagesBuilder.connectRequest();

    const masters = {};

    ipcMain.sendCommand(IPC_COMMANDS.UPDATE_AVAILABLE_MASTERS, masters);

    const responseHandler = (payload) => {
      const { masterId, address, port, rating } = payload;

      masters[masterId] = {
        id: masterId,
        address,
        port,
        rating,
      };

      ipcMain.sendCommand(IPC_COMMANDS.UPDATE_AVAILABLE_MASTERS, masters);
    };

    responsesBroker.subscribe(MESSAGES_TYPES.CONNECTION_REQUEST_RESPONSE, responseHandler);

    const connectRequestInterval = setInterval(() => this.sendBroadcastMessage(message), 500);

    return new Promise((resolve) => setTimeout(() => {
      clearInterval(connectRequestInterval);
      responsesBroker.unsubscribe(MESSAGES_TYPES.CONNECTION_REQUEST_RESPONSE, responseHandler);

      return resolve(Object.values(masters));
    }, waitTime));
  }

  async acknowledgeMaster(masterServer) {
    if (!this.server) {
      throw new Error('Server is not running');
    }

    const message = messagesBuilder.acknowledgeConnectRequest({ masterId: masterServer.id });

    ipcMain.sendCommand(IPC_COMMANDS.UPDATE_SELECTED_MASTER, masterServer);

    return new Promise((resolve, reject) => {
      let timeout;

      const responseHandler = (payload) => {
        clearTimeout(timeout);
        resolve({ address: masterServer.address, port: payload.websocketPort });
      };

      responsesBroker.subscribeOnce(MESSAGES_TYPES.ACKNOWLEDGE_CONNECT_REQUEST_RESPONSE, responseHandler);

      timeout = setTimeout(() => {
        responsesBroker.unsubscribe(MESSAGES_TYPES.ACKNOWLEDGE_CONNECT_REQUEST_RESPONSE, responseHandler);
        reject(new Error('Master did not respond'));
      }, 5000);

      this.sendUnicastMessage(message, masterServer);
    });
  }

  sendBroadcastMessage(message) {
    if (!this.server) {
      throw new Error('Server is not running');
    }

    const msg = Buffer.from(JSON.stringify(message));

    const masterPortRange = { min: 8000, max: 8100 };

    for (let i = masterPortRange.min; i <= masterPortRange.max; i++) {
      this.server.send(msg, 0, msg.length, i, config.BROADCAST_ADDRESS, (err) => {
        if (err) {
          logger.error(err);
          return;
        }

        // logger.info(`sent broadcast message: ${JSON.stringify(message)}`);
      });
    }

    logger.info(`sent broadcast message: ${JSON.stringify(message)}`);
  }

  sendUnicastMessage(message, masterServer) {
    if (!this.server) {
      throw new Error('Server is not running');
    }

    const msg = Buffer.from(JSON.stringify(message));

    this.server.send(msg, 0, msg.length, masterServer.port, masterServer.address, (err) => {
      if (err) {
        logger.error(err);
        return;
      }

      logger.info(`sent unicast message to ${masterServer.address}:${masterServer.port}: ${JSON.stringify(message)}`);
    });
  }

  _getRandomPort() {
    // PORT RANGE: 49152 - 65535

    return Math.floor(Math.random() * (65535 - 49152) + 49152);
  }
}


module.exports = new SlaveUDPGateway();
