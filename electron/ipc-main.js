class IPCMainListener {
  constructor() {
    this.mainWindow = null;
  }

  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  sendCommandToShowAuthScreen(code) {
    if (!this.mainWindow) {
      console.error('[ELECTRON | IPC MAIN LISTENER] main window is not set');
      return;
    }

    this.mainWindow.webContents.send('show-auth-screen', code);
  }

  sendCommandToStartPlayer(schedule) {
    if (!this.mainWindow) {
      console.error('[ELECTRON | IPC MAIN LISTENER] main window is not set');
      return;
    }

    this.mainWindow.webContents.send('start-player', schedule);
  }
}

module.exports = new IPCMainListener();
