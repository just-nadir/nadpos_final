const { autoUpdater } = require('electron-updater');
const electronLog = require('electron-log');
const { ipcMain, app } = require('electron');
const { logger } = require('../logger.cjs');

autoUpdater.logger = electronLog;
autoUpdater.logger.transports.file.level = 'info';

// Auto download is set to false to allow manual control
autoUpdater.autoDownload = false;

/**
 * Initialize the updater service
 * @param {BrowserWindow} mainWindow - The main window to send events to
 */
function initUpdater(mainWindow) {
  logger.info('Yangilash', 'Yangilash xizmati ishga tushdi');

  function sendStatusToWindow(text) {
    logger.info('Yangilash', text);
  }

  autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for update...');
    // We can send this to UI if we want to show a spinner
  });

  autoUpdater.on('update-available', (info) => {
    sendStatusToWindow('Update available.');
    mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    sendStatusToWindow('Update not available.');
    // mainWindow.webContents.send('update-not-available', info);
  });

  autoUpdater.on('error', (err) => {
    sendStatusToWindow('Error in auto-updater. ' + err);
    mainWindow.webContents.send('update-error', err.toString());
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    sendStatusToWindow(log_message);

    // Send progress to frontend
    mainWindow.webContents.send('download-progress', progressObj);
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendStatusToWindow('Update downloaded');
    mainWindow.webContents.send('update-downloaded', info);
  });

  // Listen for restart signal from frontend
  ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall(true, true); // Silent install
  });

  // Listen for manual download signal from frontend
  ipcMain.on('start-download', () => {
    autoUpdater.downloadUpdate();
  });

  // Manual check for updates
  ipcMain.handle('check-for-updates', async () => {
    try {
      return await autoUpdater.checkForUpdates();
    } catch (error) {
      logger.error('Yangilash', 'Qo\'lda tekshirish muvaffaqiyatsiz', error);
      throw error;
    }
  });

  // Get app version
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // Check for updates immediately
  // Use try-catch to avoid crashing if checking fail (e.g. no internet)
  try {
    autoUpdater.checkForUpdatesAndNotify();
  } catch (error) {
    logger.error('Yangilash', 'Yangilanishlarni tekshirishda xato', error);
  }
}

module.exports = { initUpdater };
