const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { logger, logFromRenderer } = require('./logger.cjs');
const { initDB, onChange } = require('./database.cjs');
const startServer = require('./server.cjs');
const registerIpcHandlers = require('./ipcHandlers.cjs');
const { initUpdater } = require('./services/updaterService.cjs');
const { startSyncService } = require('./services/syncService.cjs');

process.on('uncaughtException', (error) => {
  logger.error('Main', 'Kritik xatolik (uncaughtException)', error);
});
process.on('unhandledRejection', (reason) => {
  logger.error('Main', 'Ushlanmagan Promise', reason);
});

// app.disableHardwareAcceleration();
if (app) {
  app.disableHardwareAcceleration();
}

function createWindow() {
  const iconPath = path.join(__dirname, '../icon.png');
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'NadPOS Restoran',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#f3f4f6',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
  });

  onChange((type, id) => {
    if (!win.isDestroyed()) {
      win.webContents.send('db-change', { type, id });
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    if (!app.isPackaged) {
      win.loadURL('http://localhost:5180');
      logger.info('Main', "Development rejimida: http://localhost:5180 yuklanmoqda");
    } else {
      win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
  }

  // Initialize Auto Updater
  initUpdater(win);

  win.webContents.on('render-process-gone', (event, details) => {
    logger.error('Main', 'Renderer jarayoni quladi', details.reason);
    if (details.reason === 'crashed') {
      win.reload();
    }
  });
}

ipcMain.handle('log-from-renderer', (e, payload) => {
  logFromRenderer(payload);
});

app.whenReady().then(() => {
  try {
    initDB();
    startServer();
    startSyncService();
    registerIpcHandlers(ipcMain);
    logger.info('Main', 'Dastur ishga tushdi. Baza va server yondi.');
  } catch (err) {
    logger.error('Main', "Boshlang'ich yuklashda xato", err);
  }

  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  logger.info('Main', 'Dastur yopildi.');
  if (process.platform !== 'darwin') app.quit();
});