const Logger = require('../../../modules/Logger');
const logger = new Logger().tag('WEBSOCKET | MASTER', 'magenta');
const connectionsManager = require('./internal.connections-manager');
const { sendMessage } = require('../client/internal.utils');
const { SLAVE_CLIENT_EVENTS } = require('../constants');


const onClientRating = async (ws, incomingMessage) => {
  const ratingData = incomingMessage.data;

  logger.info(`received device rating info: ${JSON.stringify(ratingData)}`);

  connectionsManager.updateClientRatingData(incomingMessage.clientId, ratingData);

  if (ratingData.connectedDevices !== undefined) {
    logger.info(`received connected devices info: ${ratingData.connectedDevices}`);
    sendMessage({
      connection: ws,
      clientId: incomingMessage.clientId,
      event: SLAVE_CLIENT_EVENTS.START_MASTER,
      data: null
    });
  }
};

module.exports = {
  onClientRating,
};
