const dgram = require('dgram');
const config = require('../../../config');
const logger = require('../../../modules/logger');
const messagesProcessor = require('./messages-processor');
const messagesBuilder = require('./messages-builder');
const responsesBroker = require('../../../modules/message-broker');
const ipcCommands = require('../../../../electron/ipc-commands');
const ipcMain = require('../../../../electron/ipc-main');
const { MESSAGES_TYPES } = require('../constants');


class SlaveUDPGateway {
  constructor() {
    this.server = dgram.createSocket('udp4');

    this.server.on('error', (err) => {
      logger.error(err, { tag: 'UDP SERVER | SLAVE | ON ERROR' });
      this.server.close();
    });

    this.server.on('message', (msg, rinfo) => {
      try {
        logger.info(`Received message from ${rinfo.address}:${rinfo.port}: ${msg}`, { tag: 'UDP SERVER | SLAVE | ON MESSAGE' });

        const message = JSON.parse(msg.toString());
        const sender = { address: rinfo.address, port: rinfo.port };

        messagesProcessor.process(this.server, sender, message);

      } catch (error) {
        logger.error(error, { tag: 'UDP SERVER | SLAVE | ON MESSAGE' });
      }
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

        logger.info(`server listening ${address.address}:${address.port}`, { tag: 'UDP SERVER | SLAVE | ON LISTENING' });
        resolve(this.server);
      });

      const port = this._getRandomPort();
      this.server.bind(port, config.LOCAL_ADDRESS);
    });
  }

  async stop() {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          reject(err);
          return;
        }

        logger.info('server closed', { tag: 'UDP SERVER | SLAVE | ON CLOSE' });
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

    const responseHandler = (payload) => {
      const { masterId, address, port } = payload;

      masters[masterId] = {
        id: masterId,
        address,
        port,
        connections: Math.floor(Math.random() * 100),
      };

      ipcMain.sendCommand(ipcCommands.UPDATE_AVAILABLE_MASTERS, masters);
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

    ipcMain.sendCommand(ipcCommands.UPDATE_SELECTED_MASTER, masterServer);

    return new Promise((resolve) => {
      const responseHandler = (payload) => resolve({ address: masterServer.address, port: payload.websocketPort });

      responsesBroker.subscribeOnce(MESSAGES_TYPES.ACKNOWLEDGE_CONNECT_REQUEST_RESPONSE, responseHandler);

      this.sendUnicastMessage(message, masterServer);
    });
  }

  sendBroadcastMessage(message) {
    if (!this.server) {
      throw new Error('Server is not running');
    }

    const msg = Buffer.from(JSON.stringify(message));

    this.server.send(msg, 0, msg.length, config.MASTER_PORT, config.BROADCAST_ADDRESS, (err) => {
      if (err) {
        logger.error(err, { tag: 'UDP SERVER | SLAVE | BROADCAST MESSAGE' });
        return;
      }

      logger.info(`sent broadcast message: ${JSON.stringify(message)}`, { tag: 'UDP SERVER | SLAVE | BROADCAST MESSAGE' });
    });
  }

  sendUnicastMessage(message, masterServer) {
    if (!this.server) {
      throw new Error('Server is not running');
    }

    const msg = Buffer.from(JSON.stringify(message));

    this.server.send(msg, 0, msg.length, masterServer.port, masterServer.address, (err) => {
      if (err) {
        logger.error(err, { tag: 'UDP SERVER | SLAVE | UNICAST MESSAGE' });
        return;
      }

      logger.info(`sent unicast message to ${masterServer.address}:${masterServer.port}: ${JSON.stringify(message)}`, {
        tag: 'UDP SERVER | SLAVE | UNICAST MESSAGE'
      });
    });
  }

  _getRandomPort() {
    // PORT RANGE: 49152 - 65535

    return Math.floor(Math.random() * (65535 - 49152) + 49152);
  }
}


module.exports = new SlaveUDPGateway();
