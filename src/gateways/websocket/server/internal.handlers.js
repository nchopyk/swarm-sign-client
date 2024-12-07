const Logger = require('../../../modules/Logger');
const logger = new Logger().tag('WEBSOCKET | MASTER', 'magenta');
const connectionsManager = require('./internal.connections-manager');


const onClientRating = async (ws, incomingMessage) => {
  const ratingData = incomingMessage.data;

  logger.info(`received device rating info: ${JSON.stringify(ratingData)}`);

  connectionsManager.updateClientRatingData(ws, ratingData);

};

module.exports = {
  onClientRating,
};
