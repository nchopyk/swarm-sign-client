const connectionsManager = require('./internal.connections-manager');
const config = require('../../../config');
const topologyBuilder = require('../../../modules/topology-builder');
const masterGateway = require('../../udp/master');
const { sendMessage } = require('../client/internal.utils');
const { SLAVE_CLIENT_EVENTS } = require('../constants');
const Logger = require('../../../modules/Logger');


const logger = new Logger().tag('WEBSOCKET | MASTER | SWARM CONTROLLER', 'magenta');


class SwarmController {
  constructor() {
  }

  async control() {
    const topology = topologyBuilder.getCurrentTopology();

    if (!topology) {
      logger.info('Current node is not ready to control swarm');
      return;
    }

    const allDevicesReady = topology.connectedClients.every((client) => client.rating);

    if (!allDevicesReady) {
      logger.info('Not all devices are ready to control swarm');
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

}


module.exports = new SwarmController();
