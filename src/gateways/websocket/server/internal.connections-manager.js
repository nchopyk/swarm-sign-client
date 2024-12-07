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

  updateRating(clientId, rating) {
    this.connections[clientId].rating = rating;
  }

  updateDeviceInfo(clientId, device) {
    this.connections[clientId].device = device;
  }
}


module.exports = new ConnectionsManager();
