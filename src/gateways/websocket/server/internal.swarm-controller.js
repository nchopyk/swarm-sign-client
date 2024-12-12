const connectionsManager = require('./internal.connections-manager');
const config = require('../../../config');
const topologyBuilder = require('../../../modules/topology-builder');
const masterGateway = require('../../udp/master');
const state = require('../../../state');
const { sendMessage } = require('../client/internal.utils');
const { SLAVE_CLIENT_EVENTS } = require('../constants');
const Logger = require('../../../modules/Logger');


const logger = new Logger().tag('WEBSOCKET | MASTER | SWARM CONTROLLER', 'magenta');


class SwarmController {
  constructor() {
    this.currentDepth = -1;
  }

  async control() {
    const topology = topologyBuilder.getCurrentTopology();

    if (!topology) {
      logger.info('Current node is not ready to control swarm');
      return;
    }

    const allDevicesReady = topology.connectedClients.every((client) => client.rating);

    if (!allDevicesReady) {
      logger.info('Not all devices are ready to control swarm, waiting for all devices to be ready');
      return;
    }

    if (state.websocketConnectionType !== 'server' && this.currentDepth === -1) {
      logger.info('No depth, swarm control is not possible');
      return;
    }

    if (topology.connectedClients.length === config.MASTER_MAX_CONNECTIONS && config.MASTER_PORT) {
      logger.info('Maximum number of connections reached, stopping udp master server');
      await masterGateway.stop();

      const isMasterExistsBetweenClients = topology.connectedClients.some((client) => client.port);

      if (!isMasterExistsBetweenClients) {
        this.runNewMaster(topology);
      }
    } else if (topology.connectedClients.length < config.MASTER_MAX_CONNECTIONS && !config.MASTER_PORT) {
      logger.info('Starting udp master server');
      await masterGateway.start();
    }
  }

  runNewMaster(topology) {
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
  }

  findCurrentNodeDepth(topology, targetClientId, currentDepth = 0) {
    if (topology.clientId === targetClientId) {
      return currentDepth;
    }

    if (!topology.connectedClients || topology.connectedClients.length === 0) {
      return -1;
    }

    for (const connectedClient of topology.connectedClients) {
      const depth = this.findCurrentNodeDepth(connectedClient, targetClientId, currentDepth + 1);
      if (depth !== -1) {
        return depth;
      }
    }

    return -1;
  }

  setDepth(depth) {
    this.currentDepth = depth;
  }
}


module.exports = new SwarmController();
