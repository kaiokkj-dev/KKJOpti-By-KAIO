window.addEventListener('DOMContentLoaded', () => {
  console.log('KKJOpti iniciado com Electron');
});
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  executarLote: (tipos) => ipcRenderer.send('executar-lote', tipos),
  onStatus: (callback) => ipcRenderer.on('status', (event, msg) => callback(msg))
});