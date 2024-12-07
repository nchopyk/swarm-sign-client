class ConnectionsManager {
  constructor() {
    this.connections = {};
  }

  addConnection(clientId, connection) {
    connection.rating = null;
    connection.device = null;
    connection.clientId = clientId;

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
    this.connections[clientId].rating = ratingData;
  }
}


module.exports = new ConnectionsManager();
