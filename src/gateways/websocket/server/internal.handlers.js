const connectionsManager = require('./internal.connections-manager');
const ipcMain = require('../../../app/ipc-main');
const topologyBuilder = require('../../../modules/topology-builder');
const swarmController = require('./internal.swarm-controller');
const Logger = require('../../../modules/Logger');
const { IPC_COMMANDS } = require('../../../app/constants');


const logger = new Logger().tag('WEBSOCKET | MASTER | HANDLERS', 'magenta');


const onSlaveInfo = async (ws, incomingMessage) => {
  const { ratingData, topology } = incomingMessage.data;

  logger.info(`received slave info from ${incomingMessage.clientId}`);

  connectionsManager.updateClientRatingData(incomingMessage.clientId, ratingData);
  connectionsManager.updateClientTopology(incomingMessage.clientId, topology);

  const updatedTopology = topologyBuilder.getCurrentTopology();
  ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_TOPOLOGY, updatedTopology);
  await swarmController.control();
};

module.exports = {
  onSlaveInfo,
};
