const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('IPC', {
  onShowAuthScreen: (callback) => ipcRenderer.on('show-auth-screen', (_event, code) => callback(code)),
  onPlayerStart: (callback) => ipcRenderer.on('start-player', (_event, schedule) => callback(schedule)),
});
