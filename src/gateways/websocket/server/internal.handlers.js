const Logger = require('../../../modules/Logger');
const logger = new Logger().tag('WEBSOCKET | MASTER', 'magenta');
const connectionsManager = require('./internal.connections-manager');
const ipcMain = require('../../../app/ipc-main');
const { IPC_COMMANDS } = require('../../../app/constants');
const topologyBuilder = require('../../../modules/topology-builder');


const onSlaveInfo = async (ws, incomingMessage) => {
  const { ratingData, topology } = incomingMessage.data;

  logger.info(`received slave info from ${incomingMessage.clientId}: ${JSON.stringify(incomingMessage.data)}`);

  connectionsManager.updateClientRatingData(incomingMessage.clientId, ratingData);
  connectionsManager.updateClientTopology(incomingMessage.clientId, topology);

  ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_TOPOLOGY, topologyBuilder.getCurrentTopology());
};

module.exports = {
  onSlaveInfo,
};
