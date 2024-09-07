const slaveGateway = require('./slave/index');
const masterGateway = require('./master/index');

// 1. Init UDP client
// 1. Get all master server
// 2. Acknowledge the master server
// 3. Wait for webSocket server data
// 4. Close the connection

(async () => {
  await masterGateway.start();
  await slaveGateway.start();

  const masters = await slaveGateway.scanForMasters();

  console.log(masters);
})();



