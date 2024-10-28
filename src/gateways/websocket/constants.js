const BROKER_MESSAGES_TYPES = {
  PROXY_CLIENT_EVENT: 'proxy_client_event',
  PROXY_SERVER_EVENT: 'proxy_server_event',
};

const ERROR_TYPES = {
  INTERNAL_FAILURE: 'ERR_INTERNAL_FAILURE',
  INVALID_DATA_FORMAT: 'ERR_INVALID_DATA_FORMAT',
  UNKNOWN_EVENT: 'ERR_UNKNOWN_EVENT',
  UNAUTHORISED: 'ERR_UNAUTHORISED',
  FORBIDDEN: 'ERR_FORBIDDEN',
  NOT_FOUND: 'ERR_NOT_FOUND',
  CONFLICT: 'ERR_CONFLICT',
  REQUEST_TIMED_OUT: 'ERR_REQUEST_TIMED_OUT',
  PROCESSING_FAILED: 'ERR_PROCESSING_FAILED',
};

const CLIENT_EVENTS = {
  ERROR: 'error',
  NEW_SCREEN: 'new_screen',
  LOGIN: 'login',
};

const SERVER_EVENTS = {
  ERROR: 'error',
  AUTH_CODE: 'auth_code',
  AUTH_SUCCESS: 'auth_success',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  SCHEDULE: 'schedule',
};


module.exports = {
  BROKER_MESSAGES_TYPES,
  ERROR_TYPES,
  CLIENT_EVENTS,
  SERVER_EVENTS,
};
