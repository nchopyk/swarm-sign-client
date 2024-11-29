const { app, BrowserWindow } = require('electron/main');
const path = require('node:path');
const ipcMain = require('./ipc-main');
const connectionClient = require('../index');


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
  if (process.platform !== 'darwin') {
    app.quit();
  }

  await connectionClient.stop();
  process.exit();
});
