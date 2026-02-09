const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const { onChange } = require('./database.cjs');
const ip = require('ip');
const path = require('path');
const { logger } = require('./logger.cjs');

// OPTIMIZATSIYA: Simple in-memory cache
const cache = new Map();

function getCachedData(key, fetcher, ttl = 60000) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.time < ttl) {
    return cached.data;
  }
  const data = fetcher();
  cache.set(key, { data, time: Date.now() });
  return data;
}

// Cache ni tozalash (har 5 daqiqada)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.time > 300000) { // 5 daqiqa
      cache.delete(key);
    }
  }
}, 300000);

// Controllerlar
const tableController = require('./controllers/tableController.cjs');
const productController = require('./controllers/productController.cjs');
const orderController = require('./controllers/orderController.cjs');
const settingsController = require('./controllers/settingsController.cjs');
const staffController = require('./controllers/staffController.cjs');


function startServer() {
  const app = express();
  const PORT = 3001;

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json());



  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  // OPTIMIZATSIYA: Room-based broadcasting
  // Har bir hall uchun alohida room yaratamiz
  io.on('connection', (socket) => {
    logger.info('Server', 'Yangi qurilma ulandi', { socketId: socket.id });

    socket.on('join-hall', (hallId) => {
      socket.join(`hall-${hallId}`);
      logger.info('Server', `Socket hall-${hallId} ga qo'shildi`, { socketId: socket.id });
    });

    socket.on('join-global', () => {
      socket.join('global');
      logger.info('Server', 'Socket global yangilanishlariga qo\'shildi', { socketId: socket.id });
    });

    socket.on('disconnect', () => {
      logger.info('Server', 'Qurilma uzildi', { socketId: socket.id });
    });
  });

  // OPTIMIZATSIYA: Intelligent broadcasting
  // Faqat kerakli room'ga yuborish
  onChange((type, id) => {
    logger.info('Server', 'Ma\'lumot yangilandi', { type, id: id || '' });

    // Table yangilanishi - faqat tegishli hallga
    if (type === 'table' && id) {
      const table = tableController.getTables().find(t => t.id == id);
      if (table && table.hall_id) {
        io.to(`hall-${table.hall_id}`).emit('update', { type, id });
        io.to('global').emit('update', { type, id }); // Admin uchun
        return;
      }
    }

    // Boshqa barcha yangilanishlar - hammaga
    io.emit('update', { type, id });
  });

  // OPTIMIZATSIYA: Cache invalidation on DB changes
  // Ma'lumotlar o'zgarganda cache ni tozalash
  onChange((type, id) => {
    if (type === 'products' || type === 'categories') {
      cache.delete('products');
      cache.delete('categories');
    } else if (type === 'settings' || type === 'kitchens') {
      cache.delete('settings');
    }
  });

  // --- API ---

  // YANGI: LOGIN API
  app.post('/api/login', (req, res) => {
    try {
      const { pin } = req.body;
      const user = staffController.login(pin);
      res.json(user);
    } catch (e) {
      logger.warn('Server', "API login: Noto'g'ri PIN", e.message);
      res.status(401).json({ error: "Noto'g'ri PIN kod" });
    }
  });

  // SYSTEM INFO API (QR Code uchun)
  app.get('/api/system/info', (req, res) => {
    try {
      const localIp = ip.address();
      res.json({ ip: localIp, port: PORT });
    } catch (e) {
      logger.error('Server', 'System info xatosi', e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/halls', (req, res) => {
    try { res.json(tableController.getHalls()); } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/tables', (req, res) => {
    try { res.json(tableController.getTables()); } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/categories', (req, res) => {
    try {
      const categories = getCachedData('categories', () => productController.getCategories(), 120000);
      res.json(categories);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/products', (req, res) => {
    try {
      const products = getCachedData('products', () =>
        productController.getProducts().filter(p => p.is_active === 1),
        90000
      );
      res.json(products);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/tables/:id/items', (req, res) => {
    try { res.json(orderController.getTableItems(req.params.id)); } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/orders/add', (req, res) => {
    try {
      orderController.addItem(req.body);
      res.json({ success: true });
    } catch (e) {
      logger.error('Server', 'API orders/add xatosi', e);
      res.status(500).json({ error: e.message });
    }
  });

  // --- TUZATILGAN JOY ---
  app.post('/api/orders/bulk-add', (req, res) => {
    try {
      const { tableId, items, waiterId } = req.body;
      if (!tableId || !items || !Array.isArray(items)) throw new Error("Noto'g'ri ma'lumot");
      orderController.addBulkItems(tableId, items, waiterId);
      res.json({ success: true });
    } catch (e) {
      logger.error('Server', 'API orders/bulk-add xatosi', e);
      res.status(500).json({ error: e.message });
    }
  });
  // ---------------------

  app.get('/api/settings', (req, res) => {
    try {
      const settings = getCachedData('settings', () => settingsController.getSettings(), 300000);
      res.json(settings);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/tables/guests', (req, res) => {
    try {
      const { tableId, count } = req.body;
      tableController.updateTableGuests(tableId, count);
      res.json({ success: true });
    } catch (e) {
      logger.error('Server', 'API tables/guests xatosi', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Static fayllarni ulash (Waiter PWA - mobile-dist). PWA va API bir xil serverda (PORT 3001).
  app.use(express.static(path.join(__dirname, '../mobile-dist')));

  // Barcha boshqa so'rovlar uchun index.html qaytarish (SPA uchun)
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../mobile-dist/index.html'));
  });



  httpServer.listen(PORT, '0.0.0.0', () => {
    const localIp = ip.address();
    logger.info('Server', `Real-time server ishga tushdi: http://${localIp}:${PORT}`);
  });
}

module.exports = startServer;