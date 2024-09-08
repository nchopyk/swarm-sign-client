const logger = require('./modules/logger');
const helpers = require('./modules/helpers');
const slaveGateway = require('./swarm/slave');
const masterGateway = require('./swarm/master');

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

  const masters = await slaveGateway.scanForMasters(helpers.generateRandomNumberInRange(2, 5) * 1000);

  if (!masters.length) {
    logger.info('No masters found, becoming master', { tag: 'INDEX' });
    await masterGateway.start();
    await slaveGateway.stop();
    return;
  }

  const masterToConnect = selectBestMaster(masters);

  const websocketInfo = await slaveGateway.acknowledgeMaster(masterToConnect);

  console.log(websocketInfo);
})();



