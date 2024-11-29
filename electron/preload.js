const ipcCommands = require('./ipc-commands');
const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('IPC', {
  onConnectionEstablished: (callback) => ipcRenderer.on(ipcCommands.CONNECTION_ESTABLISHED, (_event, data) => callback(data)),
  onConnectionClosed: (callback) => ipcRenderer.on(ipcCommands.CONNECTION_CLOSED, (_event, data) => callback(data)),
  onLoginSuccess: (callback) => ipcRenderer.on(ipcCommands.LOGIN_SUCCESS, (_event, data) => callback(data)),
  onLoginFail: (callback) => ipcRenderer.on(ipcCommands.LOGIN_FAILURE, (_event, data) => callback(data)),
  onShowAuthScreen: (callback) => ipcRenderer.on(ipcCommands.SHOW_AUTH_SCREEN, (_event, data) => callback(data)),
  onPlayerStart: (callback) => ipcRenderer.on(ipcCommands.START_PLAYER, (_event, data) => callback(data)),
  onConnectionModeUpdate: (callback) => ipcRenderer.on(ipcCommands.UPDATE_CONNECTION_MODE, (_event, data) => callback(data)),
  onAvailableMastersUpdate: (callback) => ipcRenderer.on(ipcCommands.UPDATE_AVAILABLE_MASTERS, (_event, data) => callback(data)),
  onSelectedMasterUpdate: (callback) => ipcRenderer.on(ipcCommands.UPDATE_SELECTED_MASTER, (_event, data) => callback(data)),
  onMasterGatewayUpdate: (callback) => ipcRenderer.on(ipcCommands.UPDATE_MASTER_GATEWAY, (_event, data) => callback(data)),
  onMasterWebSocketUpdate: (callback) => ipcRenderer.on(ipcCommands.UPDATE_MASTER_WEB_SOCKET, (_event, data) => callback(data)),
  onResetData: (callback) => ipcRenderer.on(ipcCommands.RESET_DATA, (_event, data) => callback(data)),
  onMasterTopologyUpdate: (callback) => ipcRenderer.on(ipcCommands.UPDATE_MASTER_TOPOLOGY, (_event, data) => callback(data)),
  onMasterRatingUpdate: (callback) => ipcRenderer.on(ipcCommands.UPDATE_MASTER_RATING, (_event, data) => callback(data)),
});
