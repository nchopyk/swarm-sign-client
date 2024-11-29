const ipcCommands = require('./ipc-commands');
const Logger = require('../src/modules/Logger');

const logger = new Logger().tag('ELECTRON | IPC MAIN LISTENER', 'cyan');


class IPCMainListener {
  constructor() {
    this.mainWindow = null;
  }

  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  sendCommand(command, data) {
    logger.info(`sending command ${command}`);

    if (!this.mainWindow) {
      logger.error(new Error('mainWindow is not set'));
      return;
    }

    if (!Object.values(ipcCommands).includes(command)) {
      logger.error(new Error('invalid command'));
      return;
    }

    this.mainWindow.webContents.send(command, data);
  }
}

module.exports = new IPCMainListener();
