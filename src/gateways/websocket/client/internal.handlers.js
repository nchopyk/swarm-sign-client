const websocketGateway = require('../server/gateway');
const masterGateway = require('../../udp/master');


const onMasterStart = async () => {
  await websocketGateway.start();
  await masterGateway.start();
};

module.exports = {
  onMasterStart,
};
