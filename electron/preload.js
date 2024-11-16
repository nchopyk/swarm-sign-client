const ipcCommands = require('./ipc-commands');
const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('IPC', {
  onLoginSuccess: (callback) => ipcRenderer.on(ipcCommands.LOGIN_SUCCESS, (_event, data) => callback(data)),
  onLoginFail: (callback) => ipcRenderer.on(ipcCommands.LOGIN_FAILURE, (_event, data) => callback(data)),
  onShowAuthScreen: (callback) => ipcRenderer.on(ipcCommands.SHOW_AUTH_SCREEN, (_event, data) => callback(data)),
  onPlayerStart: (callback) => ipcRenderer.on(ipcCommands.START_PLAYER, (_event, data) => callback(data)),
});
