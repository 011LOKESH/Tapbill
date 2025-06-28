const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Print functions
  printReceipt: (htmlContent, options) => ipcRenderer.invoke('print-receipt', htmlContent, options),
  printToPrinter: (htmlContent, printerName, options) => ipcRenderer.invoke('print-to-printer', htmlContent, printerName, options),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  
  // Backend functions (existing)
  getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
  restartBackend: () => ipcRenderer.invoke('restart-backend')
});
