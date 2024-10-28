const config = require('../config');
const localStorage = require('../modules/local-storage');
const logger = require('../modules/logger');
const ipcMain = require('../../electron/ipc-main');
const { CLIENT_EVENTS, ERROR_TYPES } = require('../gateways/websocket/constants');
const { sendMessage } = require('../gateways/websocket/client/internal-utils');
const { buildErrorMessages } = require('./message-builders');


const onConnection = (connection) => {
  const screenId = localStorage.getItem('screenId');
  const clientId = localStorage.getItem('clientId');

  if (clientId) {
    config.CLIENT_ID = clientId;
  }

  if (screenId) {
    logger.info(`logging in with screenId: ${screenId}`, { tag: 'WEBSOCKET CLIENT | EVENT HANDLERS | ON CONNECTION' });
    sendMessage({ connection, clientId: config.CLIENT_ID, event: CLIENT_EVENTS.LOGIN, data: { screenId } });
  } else {
    logger.info('no screenId found, sending new screen event', { tag: 'WEBSOCKET CLIENT | EVENT HANDLERS | ON CONNECTION' });
    sendMessage({ connection, clientId: config.CLIENT_ID, event: CLIENT_EVENTS.NEW_SCREEN, data: null });
  }
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
  const { code } = data;

  logger.info(`received authCode: ${code}`, { tag: 'WEBSOCKET CLIENT | EVENT HANDLERS | ON AUTH CODE' });

  ipcMain.sendCommandToShowAuthScreen(code);
};

const onAuthSuccess = async (connection, data) => {
  const { screenId } = data;

  logger.info(`received screenId: ${screenId}`, { tag: 'WEBSOCKET CLIENT | EVENT HANDLERS | ON AUTH SUCCESS' });

  console.log('setting screenId', screenId);
  console.log('setting clientId', config.CLIENT_ID);
  await localStorage.setItem('clientId', config.CLIENT_ID);
  await localStorage.setItem('screenId', screenId);

  logger.info(`logging in with screenId: ${screenId}`, { tag: 'WEBSOCKET CLIENT | EVENT HANDLERS | ON AUTH SUCCESS' });
  sendMessage({ connection, clientId: config.CLIENT_ID, event: CLIENT_EVENTS.LOGIN, data: { screenId } });
};

const onLoginSuccess = (connection, data) => {

};

const onLoginFailure = (connection, data) => {

};

const onSchedule = (connection, data) => {
  ipcMain.sendCommandToStartPlayer(data);
};

const onError = (connection, data) => {
  logger.warn(`received error: ${data.message}`, { tag: 'WEBSOCKET CLIENT | EVENT HANDLERS | ON ERROR' });
};


module.exports = {
  onConnection,
  onInvalidIncomingMessage,
  onHandlerMissing,
  onAuthCode,
  onAuthSuccess,
  onLoginSuccess,
  onLoginFailure,
  onSchedule,
  onError,
};
