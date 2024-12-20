const config = require('./config');
const helpers = require('./modules/helpers');
const slaveGateway = require('./gateways/udp/slave');
const masterGateway = require('./gateways/udp/master');
const websocketGateway = require('./gateways/websocket/server/gateway');
const websocketClient = require('./gateways/websocket/client');
const localStorage = require('./modules/local-storage');
const { IPC_COMMANDS } = require('./app/constants');
const ipcMain = require('./app/ipc-main');
const Logger = require('./modules/Logger');
const messageBroker = require('./modules/message-broker');
const swarmController = require('./gateways/websocket/server/internal.swarm-controller');

const logger = new Logger().tag('INDEX', 'blue');


function selectBestMaster(masters) {
  return masters.filter((master) => !!master.rating).sort((a, b) => b.rating - a.rating)[0];
}

const start = async () => {
  try {
    logger.info(`Starting application${process.env.INSTANCE_ID ? ` instance #${process.env.INSTANCE_ID}` : ''}`);

    if (process.env.INSTANCE_ID) {
      ipcMain.sendCommand(IPC_COMMANDS.SET_INSTANCE_ID, process.env.INSTANCE_ID);
    }

    await localStorage.init();

    ipcMain.sendCommand(IPC_COMMANDS.INIT_SERVER_SEARCH);

    let connectionMode = 'proxy';

    ipcMain.sendCommand(IPC_COMMANDS.UPDATE_CONNECTION_MODE, { mode: connectionMode });

    logger.info('Scanning for masters');
    await slaveGateway.start();

    const timeout = (swarmController.currentDepth === -1) ?
      helpers.generateRandomNumberInRange(4000, 6000) :
      helpers.generateRandomNumberInRange(1000, 2000) + (swarmController.currentDepth * 1000);
    const masters = await slaveGateway.scanForMasters(timeout);

    // console.log('MASTERS', masters);

    let serverConnectionParams = {
      type: 'server',
      address: config.WS_SERVER_ADDRESS,
      port: config.WS_SERVER_PORT
    };

    if (!masters.length) {
      logger.info('No masters found, becoming master');
      await new Promise((resolve) => setTimeout(resolve, 2500));

      await websocketGateway.start();
      await masterGateway.start();

      connectionMode = 'direct';
      ipcMain.sendCommand(IPC_COMMANDS.UPDATE_CONNECTION_MODE, { mode: connectionMode });

    } else {
      const masterToConnect = selectBestMaster(masters);
      logger.info(`Selected master ${masterToConnect.id} with ${masterToConnect.rating} rating`);

      const { address, port } = await slaveGateway.acknowledgeMaster(masterToConnect);

      serverConnectionParams = { address, port, type: 'master' };
    }

    await slaveGateway.stop();

    await websocketClient.start(serverConnectionParams);
  } catch (error) {
    console.log(error);

    if (error.message === 'Master did not respond') {
      logger.error('Master did not respond, trying again');
      await slaveGateway.stop();
      await start();
      return;
    }

    process.exit(1);
  }
};

const stop = async () => {
  await masterGateway.stop();
  await websocketGateway.stop();
  await websocketClient.stop();
};



messageBroker.subscribe('RESTART', async () => {
  logger.info('Restarting application');
  await stop();
  await start();
});

module.exports = {
  start,
  stop,
};



