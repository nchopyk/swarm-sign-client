const crypto = require('crypto');


const config = {
  BROADCAST_ADDRESS: '255.255.255.255',
  LOCAL_ADDRESS: '0.0.0.0',

  MASTER_PORT: null,

  MASTER_MAX_CONNECTIONS: 2,
  MASTER_MAX_NESTEDNESS: 3,

  CLIENT_ID: crypto.randomUUID(),

  WS_SERVER_ADDRESS: 'localhost',
  WS_SERVER_PORT: 2010,
  WS_PORT: null,
  WS_CONNECTION_HEALTHCHECK_INTERVAL: 30000,
};


module.exports = config;
