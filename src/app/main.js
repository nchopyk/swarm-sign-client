const { app, BrowserWindow } = require('electron/main');
const path = require('node:path');
const ipcMain = require('./ipc-main');
const connectionClient = require('../index');
const ratingCalculator = require('../modules/rating-calculator');
const topologyBuilder = require('../modules/topology-builder');
const { IPC_COMMANDS } = require('./constants');
const state = require('../state');

const deviceRatingInterval = setInterval(async () => {
  try {
    const ratingData = await ratingCalculator.calculateCurrentDeviceRating();
    const topology = topologyBuilder.getCurrentTopology();

    state.ratingData = ratingData;

    ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_RATING, ratingData);
    ipcMain.sendCommand(IPC_COMMANDS.UPDATE_MASTER_TOPOLOGY, topology);
  } catch (error) {
    console.error(error);
  }
}, 5000);


function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1800,
    height: 1200,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadURL('http://localhost:5173');

  ipcMain.setMainWindow(mainWindow);

  // mainWindow.webContents.openDevTools();
  // start connection client after main window is created

  mainWindow.webContents.on('did-finish-load', async () => {
    await connectionClient.stop();
    await connectionClient.start();
  });

}

app.whenReady().then(async () => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  clearInterval(deviceRatingInterval);

  if (process.platform !== 'darwin') {
    app.quit();
  }

  await connectionClient.stop();
  process.exit();
});
