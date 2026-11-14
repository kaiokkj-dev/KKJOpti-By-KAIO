const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('kkj', {
  getCatalog: () => ipcRenderer.invoke('catalog:list'),
  getStatus: () => ipcRenderer.invoke('catalog:status'),
  isAdmin: () => ipcRenderer.invoke('app:is-admin'),
  relaunchAsAdmin: () => ipcRenderer.invoke('app:relaunch-admin'),
  getDetails: (id) => ipcRenderer.invoke('catalog:details', id),
  getSystemInfo: () => ipcRenderer.invoke('system:info'),
  getSystemStats: () => ipcRenderer.invoke('system:stats'),
  apply: (ids) => ipcRenderer.invoke('run:apply', ids),
  restore: (ids) => ipcRenderer.invoke('run:restore', ids),
  openLog: () => ipcRenderer.invoke('log:open'),
  getHistory: () => ipcRenderer.invoke('history:list'),
  restoreSnapshot: (runId, itemId) => ipcRenderer.invoke('history:restore-snapshot', runId, itemId),
  openWebsite: () => ipcRenderer.invoke('external:open', 'https://kaiohenrique.dev/'),
  onProgress: (callback) => { const listener = (_event, payload) => callback(payload); ipcRenderer.on('run:progress', listener); return () => ipcRenderer.removeListener('run:progress', listener); }
});
