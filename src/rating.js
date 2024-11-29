const os = require('os');


function calculateMasterRatingData(device, maxValues, weights) {
  const { Ni, Ci, Mifree, Mimax, Ui, Ti, Si } = device;
  const { Nmax, Umax, Smin, Smax } = maxValues;
  const { wN, wC, wM, wU, wT, wsMax, wsMin } = weights;

  const roundToFour = (value) => Math.round(value * 10000) / 10000;

  const normalizedConnectedDevices = roundToFour(1 - Ni / Nmax);
  const normalizedProcessorLoad = roundToFour(1 - Ci / 100);
  const normalizedFreeRam = roundToFour(Mifree / Mimax);
  const normalizedUptime = roundToFour(Ui / Umax);
  const normalizedInternetConnection = Ti; // 1 для провідного, 0 для Wi-Fi
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
      mb: roundToFour(Mifree / (1024 * 1024)), // Переведення у мегабайти
      normalized: normalizedFreeRam,
    },
    totalRam: {
      mb: roundToFour(Mimax / (1024 * 1024)), // Переведення у мегабайти
      normalized: 1, // Загальний обсяг пам'яті завжди = 1
    },
    uptime: {
      seconds: Ui,
      normalized: normalizedUptime,
    },
    internetConnection: {
      type: Ti === 1 ? 'wired' : 'wireless',
      normalized: normalizedInternetConnection,
    },
    rating,
  };
}

// Приклад даних
const device = {
  Ni: 2, // Кількість під'єднаних slave-пристроїв
  Ci: 17, // Завантаження процесора (%)
  Mifree: os.freemem(), // Вільний обсяг оперативної пам'яті (байти)
  Mimax: os.totalmem(), // Максимальний обсяг оперативної пам'яті (байти)
  Ui: os.uptime(), // Час роботи системи (с)
  Ti: 0, // Тип підключення (0 - Wi-Fi, 1 - провідний)
  Si: -43, // Рівень сигналу Wi-Fi (дБм)
};

const maxValues = {
  Nmax: 3, // Максимальна кількість slave-пристроїв
  Umax: os.uptime(), // Час роботи системи (с)
  Smin: -90, // Мінімальний рівень сигналу Wi-Fi (дБм)
  Smax: -30, // Максимальний рівень сигналу Wi-Fi (дБм)
};

const weights = {
  wN: 0.20,
  wC: 0.15,
  wM: 0.10,
  wU: 0.10,
  wT: 0.20,
  wsMax: 0.15, // Вага для Wi-Fi
  wsMin: 0.00, // Вага для провідного з'єднання
};


const result = calculateMasterRatingData(device, maxValues, weights);

module.exports = result;
