const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');
const { initDB, onChange } = require('./database.cjs');
const startServer = require('./server.cjs');
const registerIpcHandlers = require('./ipcHandlers.cjs');
const { initUpdater } = require('./services/updaterService.cjs');
const { startSyncService } = require('./services/syncService.cjs');


// --- LOGGER SOZLAMALARI ---
log.transports.file.level = 'info';
log.transports.file.fileName = 'logs.txt';
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
Object.assign(console, log.functions);

process.on('uncaughtException', (error) => {
  log.error('KRITIK XATOLIK (Main):', error);
});
process.on('unhandledRejection', (reason) => {
  log.error('Ushlanmagan Promise:', reason);
});

// app.disableHardwareAcceleration();
if (app) {
  app.disableHardwareAcceleration();
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'NadPOS Restoran',
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
      win.loadURL('http://localhost:5174');
      console.log("Development rejimida: http://localhost:5174 yuklanmoqda...");
    } else {
      win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
  }

  // Initialize Auto Updater
  initUpdater(win);

  win.webContents.on('render-process-gone', (event, details) => {
    log.error('Renderer jarayoni quladi:', details.reason);
    if (details.reason === 'crashed') {
      win.reload();
    }
  });
}

app.whenReady().then(() => {
  try {
    initDB();
    startServer();
    startSyncService();
    registerIpcHandlers(ipcMain); // Handlerlar faqat BIR MARTA ro'yxatdan o'tadi
    log.info("Dastur ishga tushdi. Baza, Server yondi.");
  } catch (err) {
    log.error("Boshlang'ich yuklashda xato:", err);
  }

  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  log.info("Dastur yopildi.");
  if (process.platform !== 'darwin') app.quit();
});