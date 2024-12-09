const IPC_COMMANDS = {
  CONNECTION_ESTABLISHED: 'connection-established',
  CONNECTION_CLOSED: 'connection-closed',
  SHOW_AUTH_SCREEN: 'show-auth-screen',
  START_PLAYER: 'start-player',
  LOGIN_SUCCESS: 'login-success',
  LOGIN_FAILURE: 'login-fail',
  UPDATE_CONNECTION_MODE: 'update-connection-mode',
  UPDATE_AVAILABLE_MASTERS: 'update-available-masters',
  UPDATE_SELECTED_MASTER: 'update-selected-master',
  UPDATE_MASTER_GATEWAY: 'update-master-gateway',
  UPDATE_MASTER_WEB_SOCKET: 'update-master-web-socket',
  RESET_DATA: 'reset-data',
  UPDATE_MASTER_TOPOLOGY: 'update-master-topology',
  UPDATE_MASTER_RATING: 'update-master-rating',
  INIT_SERVER_SEARCH: 'init-server-search',
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
  LOGIN_FAILURE: 'login_failed',
  SCHEDULE: 'schedule',
  RESET: 'reset',
};


module.exports = {
  IPC_COMMANDS,
  ERROR_TYPES,
  CLIENT_EVENTS,
  SERVER_EVENTS,
};
