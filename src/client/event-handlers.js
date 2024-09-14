const config = require('../../config');
const { CLIENT_EVENTS, ERROR_TYPES } = require('../../gateways/websocket/constants');
const { sendMessage } = require('../../gateways/websocket/client/internal-utils');
const { buildErrorMessages } = require('./message-builders');


const onConnectionOpen = (connection) => {

};

const onConnectionClose = (connection) => {

};

const onInvalidIncomingMessage = (connection, error) => {
  return sendMessage({
    connection,
    clientId: config.CLIENT_ID,
    event: CLIENT_EVENTS.ERROR,
    data: buildErrorMessages({ errorType: ERROR_TYPES.INVALID_DATA_FORMAT, message: error.message }),
  });
};

const onHandlerMissing = (connection, event) => {
  sendMessage({
    connection,
    clientId: config.CLIENT_ID,
    event: CLIENT_EVENTS.ERROR,
    data: buildErrorMessages({ errorType: ERROR_TYPES.UNKNOWN_EVENT, message: `No handler for event: ${event}` }),
  });
};

const onAuthCode = (connection, data) => {

};

const onLoginSuccess = (connection, data) => {

};

const onLoginFailure = (connection, data) => {

};

const onPlaylist = (connection, data) => {

};


module.exports = {
  onConnectionOpen,
  onConnectionClose,
  onInvalidIncomingMessage,
  onHandlerMissing,
  onAuthCode,
  onLoginSuccess,
  onLoginFailure,
  onPlaylist,
}
