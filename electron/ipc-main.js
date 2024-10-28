const ipcCommands = require('./ipc-commands');


class IPCMainListener {
  constructor() {
    this.mainWindow = null;
  }

  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  sendCommand(command, data) {
    if (!this.mainWindow) {
      console.error('[ELECTRON | IPC MAIN LISTENER] main window is not set');
      return;
    }

    if (!Object.values(ipcCommands).includes(command)) {
      console.error(`[ELECTRON | IPC MAIN LISTENER] command ${command} is not valid`);
      return;
    }

    this.mainWindow.webContents.send(command, data);
  }
}

module.exports = new IPCMainListener();
