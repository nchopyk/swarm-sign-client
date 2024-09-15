const crypto = require('crypto');


const config = {
  BROADCAST_ADDRESS: '255.255.255.255',
  LOCAL_ADDRESS: '0.0.0.0',

  MASTER_PORT: 8001,

  CLIENT_ID: crypto.randomUUID(),

  WS_SERVER_ADDRESS: 'localhost',
  WS_SERVER_PORT: 2010,
  WS_PORT: 8002,
  WS_CONNECTION_HEALTHCHECK_INTERVAL: 30000,
};


module.exports = config;
