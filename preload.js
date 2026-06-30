const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  exportToPdf: (defaultFilename) => ipcRenderer.invoke('export-to-pdf', defaultFilename)
});