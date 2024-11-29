const config = require('../../config');
const localStorage = require('../../modules/local-storage');
const ipcMain = require('../../../electron/ipc-main');
const ipcCommands = require('../../../electron/ipc-commands');
const { CLIENT_EVENTS, ERROR_TYPES } = require('../constants');
const { sendMessage } = require('../../gateways/websocket/client/internal.utils');
const { buildErrorMessages } = require('./message-builders');
const Logger = require('../../modules/Logger');

const logger = new Logger().tag('WEBSOCKET | CLIENT | APP', 'lime');


const onConnection = async (connection, address, port, type) => {
  ipcMain.sendCommand(ipcCommands.CONNECTION_ESTABLISHED, { type, address, port });

  await new Promise((resolve) => setTimeout(resolve, 2500));

  const screenId = localStorage.getItem('screenId');
  const clientId = localStorage.getItem('clientId');

  if (clientId) {
    config.CLIENT_ID = clientId;
  }

  if (screenId) {
    logger.info(`logging in with screenId: ${screenId}`);
    sendMessage({ connection, clientId: config.CLIENT_ID, event: CLIENT_EVENTS.LOGIN, data: { screenId } });
  } else {
    logger.info('no screenId found, sending new screen event');
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
  logger.warn(`no handler found for event: ${event}`);
};

const onAuthCode = (connection, data) => {
  const { code } = data;

  logger.info(`received authCode: ${code}`);

  ipcMain.sendCommand(ipcCommands.SHOW_AUTH_SCREEN, { code });
};

const onAuthSuccess = async (connection, data) => {
  const { screenId } = data;

  logger.info(`received screenId: ${screenId}`);

  await localStorage.setItem('clientId', config.CLIENT_ID);
  await localStorage.setItem('screenId', screenId);

  logger.info(`logging in with screenId: ${screenId}`);
  sendMessage({ connection, clientId: config.CLIENT_ID, event: CLIENT_EVENTS.LOGIN, data: { screenId } });
};

const onLoginSuccess = (connection, data) => {
  logger.info('login successful');

  ipcMain.sendCommand(ipcCommands.LOGIN_SUCCESS, data);
};

const onLoginFailure = async (connection, data) => {
  logger.warn('login failed');

  ipcMain.sendCommand(ipcCommands.LOGIN_FAILURE, data);

  await localStorage.removeItem('screenId');
  await localStorage.removeItem('clientId');

  logger.info('screenId and clientId removed');

  onConnection(connection);
};

const onSchedule = (connection, data) => {
  logger.info('received schedule');
  ipcMain.sendCommand(ipcCommands.START_PLAYER, data);
};

const onError = (connection, data) => {
  logger.warn(`received error: ${data.message}`);
};

const onReset = async (connection) => {
  await localStorage.removeItem('screenId');
  await localStorage.removeItem('clientId');

  logger.info('screenId and clientId removed');
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
