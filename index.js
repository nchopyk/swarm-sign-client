const logger = require('./modules/logger');
const helpers = require('./modules/helpers');
const slaveGateway = require('./gateways/swarm/slave');
const masterGateway = require('./gateways/swarm/master');
const websocketGateway = require('./gateways/websocket/server/gateway');
const websocketClient = require('./gateways/websocket/client');

// 1. Init UDP client
// 1. Get all master server
// 2. Acknowledge the master server
// 3. Wait for webSocket server data
// 4. Close the connection

function selectBestMaster(masters) {
  return masters.sort((a, b) => a.connections - b.connections)[0];
}


(async () => {
  await slaveGateway.start();

  const masters = await slaveGateway.scanForMasters(helpers.generateRandomNumberInRange(2, 6) * 1000);

  if (!masters.length) {
    logger.info('No masters found, becoming master', { tag: 'INDEX' });
    await websocketGateway.start();
    await masterGateway.start();
    await slaveGateway.stop();
    return;
  }

  const masterToConnect = selectBestMaster(masters);

  const websocketInfo = await slaveGateway.acknowledgeMaster(masterToConnect);

  console.log(websocketInfo);

  await websocketClient.start(websocketInfo.address, websocketInfo.port);
})();



