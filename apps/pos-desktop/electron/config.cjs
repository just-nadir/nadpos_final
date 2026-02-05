const path = require('path');
const { app } = require('electron');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const isDev = app && app.isPackaged !== undefined ? !app.isPackaged : process.env.NODE_ENV === 'development';

module.exports = {
    isDev,
    // Database Config
    dbPath: isDev
        ? path.join(__dirname, '../pos.db')
        : path.join(app ? app.getPath('userData') : __dirname, 'pos.db'),

    // Default Restaurant ID (agar .env da bo'lmasa, database dan olinadi yoki yangi generatsiya qilinadi)
    DEFAULT_RESTAURANT_ID: process.env.RESTAURANT_ID || null,
};
