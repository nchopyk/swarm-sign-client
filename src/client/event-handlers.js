const config = require('../../config');
const localStorage = require('../../modules/local-storage');
const logger = require('../../modules/logger');
const { CLIENT_EVENTS, ERROR_TYPES } = require('../../gateways/websocket/constants');
const { sendMessage } = require('../../gateways/websocket/client/internal-utils');
const { buildErrorMessages } = require('./message-builders');


const onConnection = (connection) => {
  const screenId = localStorage.getItem('screenId');

  if (screenId) {
    logger.info(`Logging in with screenId: ${screenId}`, { tag: 'WEBSOCKET CLIENT | EVENT HANDLERS | ON CONNECTION' });
    sendMessage({ connection, clientId: config.CLIENT_ID, event: CLIENT_EVENTS.LOGIN, data: { screenId } });
  } else {
    logger.info('no screenId found, sending new screen event', { tag: 'WEBSOCKET CLIENT | EVENT HANDLERS | ON CONNECTION' });
    sendMessage({ connection, clientId: config.CLIENT_ID, event: CLIENT_EVENTS.NEW_SCREEN, data: null });
  }
};

const onConnectionClose = (connection) => {

};

const onInvalidIncomingMessage = (connection, error) => sendMessage({
  connection,
  clientId: config.CLIENT_ID,
  event: CLIENT_EVENTS.ERROR,
  data: buildErrorMessages({ errorType: ERROR_TYPES.INVALID_DATA_FORMAT, message: error.message }),
});

const onHandlerMissing = (connection, event) => {
  logger.warn(`no handler found for event: ${event}`, { tag: 'WEBSOCKET CLIENT | EVENT HANDLERS | ON HANDLER MISSING' });
};

const onAuthCode = (connection, data) => {

};

const onLoginSuccess = (connection, data) => {

};

const onLoginFailure = (connection, data) => {

};

const onPlaylist = (connection, data) => {

};

const onError = (connection, data) => {
  console.log(data);
  logger.warn(`received error: ${data.message}`, { tag: 'WEBSOCKET CLIENT | EVENT HANDLERS | ON ERROR' });
};


module.exports = {
  onConnection,
  onConnectionClose,
  onInvalidIncomingMessage,
  onHandlerMissing,
  onAuthCode,
  onLoginSuccess,
  onLoginFailure,
  onPlaylist,
  onError,
};
