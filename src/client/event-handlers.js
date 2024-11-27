const config = require('../config');
const localStorage = require('../modules/local-storage');
const logger = require('../modules/logger');
const ipcMain = require('../../electron/ipc-main');
const ipcCommands = require('../../electron/ipc-commands');
const { CLIENT_EVENTS, ERROR_TYPES } = require('../gateways/websocket/constants');
const { sendMessage } = require('../gateways/websocket/client/internal-utils');
const { buildErrorMessages } = require('./message-builders');


const onConnection = async (connection, address, port, type) => {
  ipcMain.sendCommand(ipcCommands.CONNECTION_ESTABLISHED, { type, address, port });

  await new Promise((resolve) => setTimeout(resolve, 2500));

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

  ipcMain.sendCommand(ipcCommands.SHOW_AUTH_SCREEN, { code });
};

const onAuthSuccess = async (connection, data) => {
  const { screenId } = data;

  logger.info(`received screenId: ${screenId}`, { tag: 'WEBSOCKET CLIENT | EVENT HANDLERS | ON AUTH SUCCESS' });

  await localStorage.setItem('clientId', config.CLIENT_ID);
  await localStorage.setItem('screenId', screenId);

  logger.info(`logging in with screenId: ${screenId}`, { tag: 'WEBSOCKET CLIENT | EVENT HANDLERS | ON AUTH SUCCESS' });
  sendMessage({ connection, clientId: config.CLIENT_ID, event: CLIENT_EVENTS.LOGIN, data: { screenId } });
};

const onLoginSuccess = (connection, data) => {
  logger.info('login successful', { tag: 'WEBSOCKET CLIENT | EVENT HANDLERS | ON LOGIN SUCCESS' });

  ipcMain.sendCommand(ipcCommands.LOGIN_SUCCESS, data);
};

const onLoginFailure = async (connection, data) => {
  logger.warn('login failed', { tag: 'WEBSOCKET CLIENT | EVENT HANDLERS | ON LOGIN FAILURE' });

  ipcMain.sendCommand(ipcCommands.LOGIN_FAILURE, data);

  await localStorage.removeItem('screenId');
  await localStorage.removeItem('clientId');

  logger.info('screenId and clientId removed', { tag: 'WEBSOCKET CLIENT | EVENT HANDLERS | ON LOGIN FAILURE' });

  onConnection(connection);
};

const onSchedule = (connection, data) => {
  logger.info('received schedule', { tag: 'WEBSOCKET CLIENT | EVENT HANDLERS | ON SCHEDULE' });
  ipcMain.sendCommand(ipcCommands.START_PLAYER, data);
};

const onError = (connection, data) => {
  logger.warn(`received error: ${data.message}`, { tag: 'WEBSOCKET CLIENT | EVENT HANDLERS | ON ERROR' });
};

const onReset = async (connection) => {
  await localStorage.removeItem('screenId');
  await localStorage.removeItem('clientId');

  logger.info('screenId and clientId removed', { tag: 'WEBSOCKET CLIENT | EVENT HANDLERS | ON RESET' });
  ipcMain.sendCommand(ipcCommands.RESET_DATA);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  sendMessage({ connection, clientId: config.CLIENT_ID, event: CLIENT_EVENTS.NEW_SCREEN, data: null });
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
  onReset,
};
