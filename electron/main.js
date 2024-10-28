const { app, BrowserWindow } = require('electron/main');
const path = require('node:path');
const ipcMain = require('./ipc-main');
const connectionClient = require('../src/index');


function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1800,
    height: 1200,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('electron/index.html');

  ipcMain.setMainWindow(mainWindow);

  mainWindow.webContents.openDevTools();
  // start connection client after main window is created

  mainWindow.on('ready-to-show', async () => {
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
