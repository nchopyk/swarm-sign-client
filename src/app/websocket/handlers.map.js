const { SERVER_EVENTS } = require('../constants');
const { onAuthCode, onAuthSuccess, onLoginSuccess, onLoginFailure, onSchedule, onError, onReset } = require('./handlers');

module.exports = {
  [SERVER_EVENTS.AUTH_CODE]: onAuthCode,
  [SERVER_EVENTS.AUTH_SUCCESS]: onAuthSuccess,
  [SERVER_EVENTS.LOGIN_SUCCESS]: onLoginSuccess,
  [SERVER_EVENTS.LOGIN_FAILURE]: onLoginFailure,
  [SERVER_EVENTS.SCHEDULE]: onSchedule,
  [SERVER_EVENTS.ERROR]: onError,
  [SERVER_EVENTS.RESET]: onReset,
};
