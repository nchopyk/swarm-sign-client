const logger = require('./modules/logger');
const config = require('./config');
const helpers = require('./modules/helpers');
const slaveGateway = require('./gateways/swarm/slave');
const masterGateway = require('./gateways/swarm/master');
const websocketGateway = require('./gateways/websocket/server/gateway');
const websocketClient = require('./gateways/websocket/client');
const localStorage = require('./modules/local-storage');

function selectBestMaster(masters) {
  return masters.sort((a, b) => a.connections - b.connections)[0];
}

const start = async () => {
  await localStorage.init();

  // logger.info('Scanning for masters', { tag: 'INDEX' });
  // await slaveGateway.start();
  //
  // const masters = await slaveGateway.scanForMasters(helpers.generateRandomNumberInRange(600, 5000));

  const serverConnectionParams = {
    address: config.WS_SERVER_ADDRESS,
    port: config.WS_SERVER_PORT
  };

  // if (!masters.length) {
  //   logger.info('No masters found, becoming master', { tag: 'INDEX' });
  //   await websocketGateway.start();
  //   await masterGateway.start();
  //
  //   return; // TODO: remove this line when server will be implemented
  // } else {
  //   const masterToConnect = selectBestMaster(masters);
  //   logger.info(`Selected master ${masterToConnect.id} with ${masterToConnect.connections} connections`, { tag: 'INDEX' });
  //   const { address, port } = await slaveGateway.acknowledgeMaster(masterToConnect);
  //
  //   serverConnectionParams = { address, port };
  // }
  // await slaveGateway.stop();

  await websocketClient.start(serverConnectionParams.address, serverConnectionParams.port);
};

const stop = async () => {
  // await masterGateway.stop();
  await websocketGateway.stop();
  await websocketClient.stop();
};


module.exports = {
  start,
  stop,
};



