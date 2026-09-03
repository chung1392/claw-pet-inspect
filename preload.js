const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clawPet', {
  onEvent: (callback) => {
    ipcRenderer.on('pet-event', (_event, status) => callback(status));
  },
});
