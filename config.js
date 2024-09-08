const crypto = require('crypto');

const config = {
  BROADCAST_ADDRESS: '255.255.255.255',
  LOCAL_ADDRESS: '0.0.0.0',
  MASTER_PORT: 8001,
  MASTER_ID: crypto.randomUUID(),
  WEBSOCKET_PORT: 8002,
};

module.exports = config;
