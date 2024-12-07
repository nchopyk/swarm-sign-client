class ConnectionsManager {
  constructor() {
    this.connections = {};

    setInterval(() => {
      for (const clientId in this.connections) {
        console.log({ clientId, rating: this.connections[clientId].rating });
      }
    }, 5000);
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
    this.connections[clientId].ratingData = ratingData;
  }
}


module.exports = new ConnectionsManager();
