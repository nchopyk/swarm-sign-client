const Logger = require('../../../modules/Logger');
const logger = new Logger().tag('WEBSOCKET | MASTER', 'magenta');
const connectionsManager = require('./internal.connections-manager');
const ipcMain = require('../../../app/ipc-main');
const { IPC_COMMANDS } = require('../../../app/constants');
const topologyBuilder = require('../../../modules/topology-builder');
const config = require('../../../config');
const masterGateway = require('../../udp/master');
const { SLAVE_CLIENT_EVENTS } = require('../constants');
const { sendMessage } = require('../client/internal.utils');


const runNewMaster = (topology) => {
  const isMasterExistsBetweenClients = topology.connectedClients.some((client) => client.port);

  if (isMasterExistsBetweenClients) {
    logger.info('Master already exists between clients');
    return;
  }

  const master = topology.connectedClients.sort((a, b) => a.rating - b.rating)[0];

  console.log(master);


  logger.info(`Selected master ${master.ip} with ${master.rating} rating`);
  const connection = connectionsManager.getConnection(master.clientId);

  sendMessage({ connection, clientId: config.CLIENT_ID, event: SLAVE_CLIENT_EVENTS.START_MASTER_UDP, data: null });
  sendMessage({ connection, clientId: config.CLIENT_ID, event: SLAVE_CLIENT_EVENTS.START_MASTER_WS, data: null });
};

const controlSwarm = async () => {
  const topology = topologyBuilder.getCurrentTopology();

  if (!topology) {
    return;
  }

  if (topology.connectedClients.length === config.MASTER_MAX_CONNECTIONS && config.MASTER_PORT) {
    logger.info('Maximum number of connections reached, stopping udp master server');
    await masterGateway.stop();

    const isMasterExistsBetweenClients = topology.connectedClients.some((client) => client.port);

    if (!isMasterExistsBetweenClients) {
      runNewMaster(topology);
    }
  } else if (topology.connectedClients.length < config.MASTER_MAX_CONNECTIONS && !config.MASTER_PORT) {
    logger.info('Starting udp master server');
    await masterGateway.start();
  }
};


const onSlaveInfo = async (ws, incomingMessage) => {
  const { ratingData, topology } = incomingMessage.data;

  logger.info(`received slave info from ${incomingMessage.clientId}`);

  connectionsManager.updateClientRatingData(incomingMessage.clientId, ratingData);
  connectionsManager.updateClientTopology(incomingMessage.clientId, topology);

  const updatedTopology = topologyBuilder.getCurrentTopology();
  ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_TOPOLOGY, updatedTopology);
  await controlSwarm(updatedTopology);
};

module.exports = {
  onSlaveInfo,
  controlSwarm,
};
