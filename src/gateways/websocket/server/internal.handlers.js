const Logger = require('../../../modules/Logger');
const logger = new Logger().tag('WEBSOCKET | MASTER', 'magenta');
const connectionsManager = require('./internal.connections-manager');


const onDeviceInfo = async (ws, incomingMessage) => {
  const { device } = incomingMessage.data;

  logger.info(`received device rating info: ${JSON.stringify(device)}`);

  connectionsManager.updateDeviceInfo(ws, device);
};

module.exports = {
  onDeviceInfo,
};
