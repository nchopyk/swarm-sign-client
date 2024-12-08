/*
Example of a topology object:
  {
    'ip': '192.168.0.104',
    'port': 8002,
    'rating': 0.3250,
    'connectedClients': [
      {
        'ip': '192.168.0.105',
        'port': 8003,
        'rating': 0.362,
        'connectedClients': [
          {
            'ip': '192.168.0.111',
            'port': null,
            'rating': null,
            'connectedClients': null
          },
          {
            'ip': '192.168.0.112',
            'port': null,
            'rating': null,
            'connectedClients': null
          }
        ]
      },
    ]
  };
 */

const websocketConnectionsManager = require('../gateways/websocket/server/internal.connections-manager');
const state = require('../state');
const { LOCAL_ADDRESS, WS_PORT } = require('../config');

const getCurrentTopology = () => {
  if (!state.ratingData) {
    return null;
  }

  const topology = {
    ip: LOCAL_ADDRESS,
    port: WS_PORT,
    rating: state.ratingData.rating,
    connectedClients: []
  };

  const connections = websocketConnectionsManager.getConnections();

  for (const clientId in connections) {
    const connection = connections[clientId];

    const clientTopology = connection.topology ?
      {
        ip: connection.address, // connection._socket.remoteAddress
        port: connection.topology.port,
        rating: connection.ratingData.rating,
        connectedClients: connection.topology.connectedClients
      } : {
        ip: connection.address,
        port: null,
        rating: null,
        connectedClients: []
      };

    topology.connectedClients.push(clientTopology);
  }

  return topology;
};

module.exports = {
  getCurrentTopology,
};
