const websocketGateway = require('../server/gateway');
const masterGateway = require('../../udp/master');
const Logger = require('../../../modules/Logger');


const logger = new Logger().tag('WEBSOCKET | CLIENT', 'green');


const onStartMasterUPD = async () => {
  logger.info('Starting master UDP gateway');
  await masterGateway.start();
};

const onStopMasterUPD = async () => {
  logger.info('Stopping master UDP gateway');
  await masterGateway.stop();
};

const onStartMasterWS = async () => {
  logger.info('Starting master WS gateway');
  await websocketGateway.start();
};

const onStopMasterWS = async () => {
  logger.info('Stopping master WS gateway');
  await websocketGateway.stop();
};

module.exports = {
  onStartMasterUPD,
  onStopMasterUPD,
  onStartMasterWS,
  onStopMasterWS,
};
