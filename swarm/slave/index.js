const dgram = require('dgram');
const config = require('../../config');
const logger = require('../../modules/logger');
const messagesProcessor = require('./messages-processor');
const messagesBuilder = require('./messages-builder');
const responsesBroker = require('../responses-broker');
const { BROKER_EVENTS } = require('../constants');


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
      const { masterId, masterAddress, masterPort } = payload;

      masters[masterId] = {
        address: masterAddress,
        port: masterPort,
      };
    };

    responsesBroker.subscribe(BROKER_EVENTS.CONNECTION_REQUEST_RESPONSE, responseHandler);

    const connectRequestInterval = setInterval(() => this.sendBroadcastMessage(message), 1000);


    return new Promise((resolve) => setTimeout(() => {
      clearInterval(connectRequestInterval);
      responsesBroker.unsubscribe(BROKER_EVENTS.CONNECT_REQUEST_RESPONSE, responseHandler);

      resolve(masters);
    }, waitTime));
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

      logger.info(`sent unicast message: ${JSON.stringify(message)}`, { tag: 'UDP SERVER | SLAVE | UNICAST MESSAGE' });
    });
  }

  _getRandomPort() {
    // PORT RANGE: 49152 - 65535

    return Math.floor(Math.random() * (65535 - 49152) + 49152);
  }
}


module.exports = new SlaveUDPGateway();
