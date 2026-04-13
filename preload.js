const { contextBridge, ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  console.log('KKJOpti iniciado com Electron');
});

contextBridge.exposeInMainWorld('electronAPI', {
  executarLote: (tipos) => ipcRenderer.send('executar-lote', tipos),
  instalarProgramas: (tipos) => ipcRenderer.send('instalar-programas', tipos),
  abrirLog: () => ipcRenderer.send('abrir-log'),
  onStatus: (callback) => ipcRenderer.on('status', (_, msg) => callback(msg))
});

contextBridge.exposeInMainWorld('api', {
  abrirLink: (url) => ipcRenderer.send('abrir-link', url)
});