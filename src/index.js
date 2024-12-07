const config = require('./config');
const helpers = require('./modules/helpers');
const slaveGateway = require('./gateways/udp/slave');
const masterGateway = require('./gateways/udp/master');
const websocketGateway = require('./gateways/websocket/server/gateway');
const websocketClient = require('./gateways/websocket/client');
const localStorage = require('./modules/local-storage');
const { IPC_COMMANDS } = require('./app/constants');
const ipcMain = require('./app/ipc-main');
const topology = require('./topology');
const Logger = require('./modules/Logger');

const logger = new Logger().tag('INDEX', 'blue');


function selectBestMaster(masters) {
  return masters.sort((a, b) => a.connections - b.connections)[0];
}

const start = async () => {
  logger.info(`Starting application${process.env.INSTANCE_ID ? ` instance #${process.env.INSTANCE_ID}` : ''}`);
  await localStorage.init();

  let connectionMode = 'proxy';

  ipcMain.sendCommand(IPC_COMMANDS.UPDATE_CONNECTION_MODE, { mode: connectionMode });

  logger.info('Scanning for masters');
  await slaveGateway.start();


  const masters = await slaveGateway.scanForMasters(helpers.generateRandomNumberInRange(600, 5000));

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

    ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_TOPOLOGY, topology);
  } else {
    const masterToConnect = selectBestMaster(masters);
    logger.info(`Selected master ${masterToConnect.id} with ${masterToConnect.connections} connections`);
    const { address, port } = await slaveGateway.acknowledgeMaster(masterToConnect);

    serverConnectionParams = { address, port, type: 'master' };
  }
  await slaveGateway.stop();

  await websocketClient.start(serverConnectionParams);
};

const stop = async () => {
  await masterGateway.stop();
  await websocketGateway.stop();
  await websocketClient.stop();
};


module.exports = {
  start,
  stop,
};



