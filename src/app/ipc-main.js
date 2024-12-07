const { IPC_COMMANDS } = require('./constants');
const Logger = require('../modules/Logger');

const logger = new Logger().tag('ELECTRON | IPC MAIN LISTENER', 'cyan');


class IPCMainListener {
  constructor() {
    this.mainWindow = null;
  }

  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  sendCommand(command, data) {
    logger.info(`sending command "${command}"`);

    if (!this.mainWindow) {
      logger.error(new Error('mainWindow is not set'));
      return;
    }

    if (!Object.values(IPC_COMMANDS).includes(command)) {
      logger.error(new Error('invalid command'));
      return;
    }

    // check if mainWindow is not destroyed
    if (this.mainWindow.isDestroyed()) {
      logger.error(`can't send command "${command}" because mainWindow is destroyed`);
      return;
    }

    this.mainWindow.webContents.send(command, data);
  }
}

module.exports = new IPCMainListener();
