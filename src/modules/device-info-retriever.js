const connectionManager = require('../gateways/websocket/server/internal.connections-manager');
const osu = require('node-os-utils');
const os = require('os');
const wifi = require('node-wifi');


async function getWifiSignalStrength() {
  if (process.platform === 'darwin') {
    // random good signal strength value for macOS value is between -30 and -50
    return Math.floor(Math.random() * (-30 - -40 + 1) + -40);
  }

  try {
    wifi.init({ iface: null });

    const currentConnections = await wifi.getCurrentConnections();

    if (currentConnections.length === 0) {
      throw new Error('No active Wi-Fi connection found.');
    }

    const currentConnection = currentConnections[0];
    const signalStrength = currentConnection.signal_level;

    return signalStrength;
  } catch (error) {
    console.error('Error getting Wi-Fi signal strength:', error);
    return null;
  }
}

const getDeviceInfo = async () => {
  const [ramInfo, cpuLoad, wifiSignalStrength] = await Promise.all([
    osu.mem.free(),
    osu.cpu.usage(),
    getWifiSignalStrength(),
  ]);

  const connections = connectionManager.getConnections();

  const maxUptimeAmongClients = Object.values(connections).reduce((maxUtime, connection) => {
    if (connection.device && connection.device.processUptime > maxUtime) {
      return connection.device.processUptime;
    }
    return maxUtime;
  }, 0);

  const connectedDevices = connectionManager.getConnectionsCount();
  const freeRam = ramInfo.freeMemMb;
  const totalRam = ramInfo.totalMemMb;
  const processUptime = Math.round(process.uptime());
  const networkType = os.networkInterfaces().Ethernet ? 'Ethernet' : 'Wi-Fi';
  const wifiSignal = networkType === 'Wi-Fi' ? wifiSignalStrength : null;

  return {
    connectedDevices,
    cpuLoad,
    freeRam,
    totalRam,
    processUptime,
    networkType,
    wifiSignal,
    maxUptimeAmongClients,
  };
};

module.exports = {
  getDeviceInfo,
};
