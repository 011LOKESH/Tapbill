const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const log = require('electron-log');
const { startBackend, startDatabase, stopDatabase } = require('../backend/server');
const isDev = process.env.NODE_ENV === 'development';

// Configure electron-log
log.transports.file.resolvePath = () => path.join(app.getPath('userData'), 'logs', 'main.log');
Object.assign(console, log.functions);

console.log('App starting...');

let mainWindow;

// Function to create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  // Load the React app
  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from backend server (which serves the frontend)
    mainWindow.loadURL('http://localhost:5000');
    // Always open dev tools to see console errors
    mainWindow.webContents.openDevTools();
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle navigation errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorDescription);
    if (errorCode === -6) {
      dialog.showErrorBox('Connection Error', 'Failed to connect to the server. Please restart the application.');
    }
  });
}

// Function to wait for backend to be ready
async function waitForBackend(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const http = require('http');
      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: 5000,
          path: '/api/auth/login',
          method: 'GET',
          timeout: 1000
        }, (res) => {
          resolve(res);
        });

        req.on('error', reject);
        req.on('timeout', reject);
        req.end();
      });
      console.log('Backend is ready!');
      return true;
    } catch (error) {
      console.log(`Waiting for backend... attempt ${i + 1}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

// App event handlers
app.whenReady().then(async () => {
  console.log('App ready, starting services...');
  try {
    // Start database first, then the backend server logic
    await startDatabase();
    startBackend();

    // Wait for backend to be ready before creating window
    const backendReady = await waitForBackend();
    if (!backendReady) {
      throw new Error('Backend failed to start within timeout period');
    }

    // Create the window after services are started and ready
    createWindow();
  } catch (error) {
    console.error('Failed to start services:', error);
    dialog.showErrorBox('Initialization Error', 'Could not start required services. Please check the logs.');
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async (event) => {
  event.preventDefault(); // Prevent quitting immediately
  console.log('Quitting application, stopping services...');
  try {
    await stopDatabase();
    console.log('Services stopped. Exiting.');
  } catch (error) {
    console.error('Error while stopping services:', error);
  } finally {
    process.exit(0); // Force exit
  }
});

// IPC handlers for communication between main and renderer
ipcMain.handle('get-backend-status', async () => {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'GET',
      timeout: 3000
    }, (res) => {
      resolve({ status: 'running', code: res.statusCode });
    });

    req.on('error', () => {
      resolve({ status: 'error' });
    });

    req.on('timeout', () => {
      resolve({ status: 'timeout' });
    });

    req.end();
  });
});

ipcMain.handle('restart-backend', async () => {
  startBackend();

  return { success: true };
});

// Print functionality IPC handlers
ipcMain.handle('print-receipt', async (event, htmlContent, options = {}) => {
  try {
    console.log('Print request received');

    // Create a hidden window for printing
    const printWindow = new BrowserWindow({
      width: 300,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    // Load the HTML content
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    // Print options for thermal receipt printer (dynamic width support)
    const defaultPrintOptions = {
      silent: true, // Don't show print dialog
      printBackground: true,
      margins: {
        marginType: 'custom',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      },
      pageSize: {
        width: 80000, // Default 80mm in micrometers (will be overridden by options)
        height: 200000 // Auto height
      }
    };

    const printOptions = { ...defaultPrintOptions, ...options };

    // Print the content
    const success = await printWindow.webContents.print(printOptions);

    // Close the print window
    printWindow.close();

    console.log('Print result:', success);
    return { success: true, printed: success };
  } catch (error) {
    console.error('Print error:', error);
    return { success: false, error: error.message };
  }
});

// Get available printers
ipcMain.handle('get-printers', async (event) => {
  try {
    const printers = await event.sender.getPrinters();
    console.log('Available printers:', printers.map(p => p.name));
    return { success: true, printers };
  } catch (error) {
    console.error('Error getting printers:', error);
    return { success: false, error: error.message };
  }
});

// Print with specific printer
ipcMain.handle('print-to-printer', async (event, htmlContent, printerName, options = {}) => {
  try {
    console.log('Print to specific printer:', printerName);

    const printWindow = new BrowserWindow({
      width: 300,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    const defaultPrintOptions = {
      silent: true,
      printBackground: true,
      deviceName: printerName,
      margins: {
        marginType: 'custom',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      },
      pageSize: {
        width: 80000, // Default 80mm thermal receipt (will be overridden by options)
        height: 200000
      }
    };

    const printOptions = { ...defaultPrintOptions, ...options };

    const success = await printWindow.webContents.print(printOptions);
    printWindow.close();

    return { success: true, printed: success };
  } catch (error) {
    console.error('Print to printer error:', error);
    return { success: false, error: error.message };
  }
});