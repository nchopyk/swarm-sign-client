class ConnectionsManager {
  constructor() {
    this.connections = {};
  }

  addConnection(clientId, connection) {
    connection.clientId = clientId;

    connection.ratingData = null;
    connection.topology = null;

    connection.address = connection._socket.remoteAddress;
    connection.port = connection._socket.remotePort;

    this.connections[clientId] = connection;
  }

  removeConnection(clientId) {
    delete this.connections[clientId];
  }

  closeAllConnections() {
    for (const clientId in this.connections) {
      this.connections[clientId].close();
    }

    this.connections = {};
  }

  getConnection(clientId) {
    return this.connections[clientId];
  }

  getConnections() {
    return this.connections;
  }

  getConnectionsCount() {
    return Object.keys(this.connections).length;
  }

  updateClientRatingData(clientId, ratingData) {
    this.connections[clientId].ratingData = ratingData;
  }

  updateClientTopology(clientId, topology) {
    this.connections[clientId].topology = topology;
  }

  broadcastMessage(message) {
    for (const clientId in this.connections) {
      this.connections[clientId].send(message);
    }
  }

  broadcastMessageBetweenMasters(message) {
    for (const clientId in this.connections) {
      if (this.connections[clientId].topology.port) {
        this.connections[clientId].send(message);
      }
    }
  }
}


module.exports = new ConnectionsManager();
