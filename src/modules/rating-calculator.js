const CONFIG = require('../config');
const deviceInfoRetriever = require('./device-info-retriever');

const MAX_VALUES = {
  Nmax: CONFIG.MASTER_MAX_CONNECTIONS, // Максимальна кількість slave-пристроїв
  Smin: -90, // Мінімальний рівень сигналу Wi-Fi (дБм)
  Smax: -30, // Максимальний рівень сигналу Wi-Fi (дБм)
};

const WEIGHTS = {
  wN: 0.20,
  wC: 0.15,
  wM: 0.10,
  wU: 0.10,
  wT: 0.20,
  wsMax: 0.15, // Вага для Wi-Fi
  wsMin: 0, // Вага для провідного з'єднання
};

function calculateDeviceRating({ Ni, Ci, Mifree, Mimax, Ui, Ti, Si, Umax }) {
  const { Nmax, Smin, Smax } = MAX_VALUES;
  const { wN, wC, wM, wU, wT, wsMax, wsMin } = WEIGHTS;

  const roundToFour = (value) => Math.round(value * 10000) / 10000;

  const normalizedConnectedDevices = roundToFour(1 - Ni / Nmax);
  const normalizedProcessorLoad = roundToFour(1 - Ci / 100);
  const normalizedFreeRam = roundToFour(Mifree / Mimax);
  const normalizedUptime = roundToFour(Ui / Umax);
  const normalizedInternetConnection = Ti === 'Wi-Fi' ? 0 : 1;
  const normalizedWifiSignal = roundToFour((Si - Smin) / (Smax - Smin));

  const ws = Ti === 1 ? wsMin : wsMax;

  const rating = roundToFour(
    wN * normalizedConnectedDevices +
    wC * normalizedProcessorLoad +
    wM * normalizedFreeRam +
    wU * normalizedUptime +
    wT * normalizedInternetConnection +
    ws * normalizedWifiSignal
  );

  return {
    connectedDevices: {
      count: Ni,
      normalized: normalizedConnectedDevices,
    },
    wifiSignal: {
      dbm: Si,
      normalized: normalizedWifiSignal,
    },
    processorLoad: {
      percent: Ci,
      normalized: normalizedProcessorLoad,
    },
    freeRam: {
      mb: Mifree,
      normalized: normalizedFreeRam,
    },
    totalRam: {
      mb: Mimax,
      normalized: 1, // Загальний обсяг пам'яті завжди = 1
    },
    uptime: {
      seconds: Ui,
      normalized: normalizedUptime,
    },
    internetConnection: {
      type: Ti === 'Wi-Fi' ? 'wireless' : 'wired',
      normalized: normalizedInternetConnection,
    },
    rating,
  };
}

async function calculateCurrentDeviceRating() {
  const deviceInfo = await deviceInfoRetriever.getDeviceInfo();

  const rating = calculateDeviceRating({
    Ni: deviceInfo.connectedDevices,
    Ci: deviceInfo.cpuLoad,
    Mifree: deviceInfo.freeRam,
    Mimax: deviceInfo.totalRam,
    Ui: deviceInfo.processUptime,
    Si: deviceInfo.wifiSignal,
    Ti: deviceInfo.networkType,
    Umax: deviceInfo.maxUptimeAmongClients || deviceInfo.processUptime,
  });

  return rating;
}


module.exports = {
  calculateDeviceRating,
  calculateCurrentDeviceRating,
};
