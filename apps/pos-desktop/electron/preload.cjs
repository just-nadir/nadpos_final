const { contextBridge, ipcRenderer } = require('electron');
const log = require('electron-log');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    // Backendga so'rov yuborish va javob kutish (Promise)
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

    // Backenddan kelgan xabarlarni tinglash
    on: (channel, listener) => {
      const subscription = (event, ...args) => listener(event, ...args);
      ipcRenderer.on(channel, subscription);

      // Listenerni o'chirish uchun funksiya qaytaradi (React useEffect uchun qulay)
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },

    // Barcha listenerlarni o'chirish
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  }
});

// YANGI: Frontend Logging API
contextBridge.exposeInMainWorld('api', {
  log: (level, message) => {
    log[level](message);
  },
  logError: (error, stack) => {
    log.error('Frontend Error:', error);
    if (stack) {
      log.error('Stack:', stack);
    }
  },
  // Auto Updater API
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, ...args) => callback(...args)),
  onUpdateProgress: (callback) => ipcRenderer.on('download-progress', (event, ...args) => callback(...args)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, ...args) => callback(...args)),
  startDownload: () => ipcRenderer.send('start-download'),
  triggerRestart: () => ipcRenderer.send('restart_app'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
});