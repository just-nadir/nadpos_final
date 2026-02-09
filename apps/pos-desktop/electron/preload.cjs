const { contextBridge, ipcRenderer } = require('electron');

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

// Frontend loglari main process orqali nadpos.log ga yoziladi
contextBridge.exposeInMainWorld('api', {
  logFromRenderer: (payload) => {
    ipcRenderer.invoke('log-from-renderer', payload).catch(() => {});
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