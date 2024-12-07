const WebSocket = require('ws');
const config = require('../../../config');
const validationSchemas = require('../validation-schemas');
const processMessageBroker = require('../../../modules/message-broker');
const ipcMain = require('../../../app/ipc-main');
const { validate, sendMessage } = require('./internal.utils');
const { getDeviceInfo } = require('../../../modules/device-info-retriever');
const { IPC_COMMANDS } = require('../../../app/constants');
const { BROKER_MESSAGES_TYPES, MASTER_SERVER_EVENTS } = require('../constants');
const { onInvalidIncomingMessage, onHandlerMissing, onConnection } = require('../../../app/websocket/handlers');
const handlersMap = require('../../../app/websocket/handlers.map');
const Logger = require('../../../modules/Logger');

const logger = new Logger().tag('WEBSOCKET | CLIENT', 'green');


class Client {
  constructor() {
    this.ws = null;
    this.port = null;
    this.address = null;
    this.deviceInfoInterval = null;
  }

  async start({ address, port, type }) {
    this.address = address;
    this.port = port;
    this.type = type;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`ws://${address}:${port}`);

      this.ws.on('error', (error) => {
        logger.error(error);
        reject(error);
      });

      this.ws.on('open', () => {
        logger.info('connected to server');
        resolve();

        onConnection(this.ws, address, port, type);

        if (type === 'master') {
          this.initDeviceInfoInterval();
        }

        processMessageBroker.subscribe(BROKER_MESSAGES_TYPES.PROXY_CLIENT_EVENT, (payload) => {
          logger.info(`sending message: ${JSON.stringify(payload)}`);
          this.ws.send(JSON.stringify(payload));
        });
      });

      this.ws.on('message', async (buffer) => {
        try {
          const parsedData = JSON.parse(buffer.toString());

          logger.info(`received message: ${buffer.length > 150 ? `${buffer.toString().slice(0, 150)}...` : buffer.toString()}`);

          const { error, value: incomingPayload } = validate({ schema: validationSchemas.incomingMessage, data: parsedData });
          if (error) {
            return onInvalidIncomingMessage(this.ws, error);
          }

          const handler = handlersMap[incomingPayload.event];
          if (!handler) {
            return onHandlerMissing(this.ws, incomingPayload.event);
          }

          if (incomingPayload.clientId !== config.CLIENT_ID) {
            return processMessageBroker.publish(BROKER_MESSAGES_TYPES.PROXY_SERVER_EVENT, incomingPayload);
          }

          await handler(this.ws, incomingPayload.data);
        } catch (error) {
          logger.error(error);
        }
      });

      this.ws.on('close', () => {
        logger.warn('connection closed');

        clearInterval(this.deviceInfoInterval);
        this.deviceInfoInterval = null;

        ipcMain.sendCommand(IPC_COMMANDS.CONNECTION_CLOSED, { type });

        this.retryConnection();
      });
    });
  }

  async initDeviceInfoInterval() {
    if (this.deviceInfoInterval) {
      clearInterval(this.deviceInfoInterval);
      this.deviceInfoInterval = null;
    }

    this.deviceInfoInterval = setInterval(async () => {
      const deviceInfo = await getDeviceInfo();

      sendMessage({
        connection: this.ws,
        clientId: config.CLIENT_ID,
        event: MASTER_SERVER_EVENTS.DEVICE_INFO,
        data: deviceInfo
      });
    }, 1000 * 15);
  }

  async stop() {
    if (!this.ws) {
      return;
    }

    this.ws.removeAllListeners();
    this.ws.close();
  }

  async retryConnection() {
    if (!this.address || !this.port) {
      throw new Error('address and port must be set before restarting');
    }

    setTimeout(() => {
      this.start({ address: this.address, port: this.port, type: this.type }).catch((error) => {
        logger.warn(`failed to reconnect: ${error.message}`);
      });
    }, 1000);
  }
}

module.exports = new Client();
