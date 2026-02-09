const { app } = require('electron');
const { db, notify } = require('./database.cjs');
const log = require('electron-log');

// Controllerlarni import qilish
const tableController = require('./controllers/tableController.cjs');
const productController = require('./controllers/productController.cjs');
const orderController = require('./controllers/orderController.cjs');
const settingsController = require('./controllers/settingsController.cjs');
const staffController = require('./controllers/staffController.cjs');
const userController = require('./controllers/userController.cjs'); // Customers & Debtors

const inventoryController = require('./controllers/inventoryController.cjs'); // YANGI

const printerService = require('./services/printerService.cjs');
const reservationsController = require('./controllers/reservationsController.cjs');



function registerIpcHandlers(ipcMain) {

    // ==========================================
    // 1. AUTH (Tizimga kirish)
    // ==========================================
    ipcMain.handle('login', async (event, pin) => {
        try {
            console.log('ipcHandlers: pin received:', pin);
            const res = staffController.login(pin);
            console.log('ipcHandlers: login result:', res);
            return res;
        } catch (error) {
            log.warn('Login failed:', error.message);
            throw error; // Frontendga xatoni qaytaramiz
        }
    });

    // ==========================================
    // 2. TABLES & HALLS (Zallar va Stollar)
    // ==========================================
    ipcMain.handle('get-halls', () => tableController.getHalls());
    ipcMain.handle('add-hall', (e, name) => tableController.addHall(name));
    ipcMain.handle('delete-hall', (e, id) => tableController.deleteHall(id));
    ipcMain.handle('update-halls-order', (e, halls) => tableController.updateHallsOrder(halls));

    ipcMain.handle('get-tables', () => tableController.getTables());
    ipcMain.handle('get-tables-by-hall', (e, id) => tableController.getTablesByHall(id));
    ipcMain.handle('add-table', async (e, { hallId, name }) => {
        try {
            return tableController.addTable(hallId, name);
        } catch (error) {
            log.error('add-table error:', error);
            throw error;
        }
    });
    ipcMain.handle('delete-table', (e, id) => tableController.deleteTable(id));
    ipcMain.handle('update-table-status', (e, { id, status }) => tableController.updateTableStatus(id, status));
    ipcMain.handle('move-table', (e, { fromTableId, toTableId }) => orderController.moveTable(fromTableId, toTableId));

    // ==========================================
    // 3. MENU (Kategoriya va Mahsulotlar)
    // ==========================================
    ipcMain.handle('get-categories', () => productController.getCategories());
    ipcMain.handle('add-category', (e, name) => productController.addCategory(name));
    ipcMain.handle('update-category', (e, { id, name }) => productController.updateCategory(id, name));
    ipcMain.handle('delete-category', (e, id) => productController.deleteCategory(id));
    ipcMain.handle('update-categories-order', (e, categories) => productController.updateCategoriesOrder(categories));

    ipcMain.handle('get-products', () => productController.getProducts());
    ipcMain.handle('add-product', (e, product) => productController.addProduct(product));
    ipcMain.handle('update-product', (e, product) => productController.updateProduct(product));
    ipcMain.handle('update-products-order', (e, products) => productController.updateProductsOrder(products));
    ipcMain.handle('toggle-product-status', (e, { id, status }) => productController.toggleProductStatus(id, status));
    ipcMain.handle('delete-product', (e, id) => productController.deleteProduct(id));

    // YANGI: Ombor V2 (Hujjatlar Tizimi)
    ipcMain.handle('get-supplies', (e, status) => inventoryController.getSupplies(status));
    ipcMain.handle('get-supply-details', (e, id) => inventoryController.getSupplyDetails(id));
    ipcMain.handle('create-supply', (e, { supplier, date, note }) => inventoryController.createDraftSupply(supplier, date, note));
    ipcMain.handle('add-supply-item', (e, { supplyId, productId, quantity, price }) => inventoryController.addSupplyItem(supplyId, productId, quantity, price));
    ipcMain.handle('remove-supply-item', (e, itemId) => inventoryController.removeSupplyItem(itemId));
    ipcMain.handle('complete-supply', (e, supplyId) => inventoryController.completeSupply(supplyId));
    ipcMain.handle('delete-supply', (e, supplyId) => inventoryController.deleteSupply(supplyId));

    // Tarix (Eski tarix ham ishlataveramiz)
    ipcMain.handle('get-stock-history', () => productController.getStockHistory());



    // ==========================================
    // 4. ORDERS & CHECKOUT (Buyurtma va To'lov)
    // ==========================================
    ipcMain.handle('get-table-items', (e, tableId) => orderController.getTableItems(tableId));

    // Desktopdan buyurtma qo'shish (OrderSummary.jsx da ishlatilishi mumkin, lekin hozir asosan waiterapp da)
    // Agar OrderSummary da 'add-order-item' ishlatilayotgan bo'lsa:
    ipcMain.handle('add-order-item', (e, item) => orderController.addItem(item));

    // YANGI: Bulk Items (Waiter App logikasi kabi)
    ipcMain.handle('add-bulk-items', (e, { tableId, items, waiterId }) => orderController.addBulkItems(tableId, items, waiterId));

    // YANGI: HISOB chiqarish (Pre-check)
    ipcMain.handle('print-check', async (e, tableId) => {
        try {
            return await orderController.printCheck(tableId);
        } catch (error) {
            log.error('print-check xatosi:', error);
            throw error;
        }
    });

    ipcMain.handle('checkout', async (e, data) => {
        return await orderController.checkout(data);
    });

    // YANGI: Buyurtmani bekor qilish
    ipcMain.handle('cancel-order', async (e, tableId) => {
        return orderController.cancelOrder(tableId);
    });

    // YANGI: Alohida mahsulotni o'chirish
    ipcMain.handle('remove-order-item', async (e, itemId) => {
        return orderController.removeItem(itemId);
    });

    // YANGI: Qisman qaytarish
    ipcMain.handle('return-order-item', async (e, { itemId, quantity, reason }) => {
        return orderController.returnItem(itemId, quantity, reason);
    });

    // Hisobotlar uchun
    ipcMain.handle('get-sales', (e, { startDate, endDate }) => orderController.getSales(startDate, endDate));
    ipcMain.handle('get-sales-by-shift', (e, shiftId) => orderController.getSalesByShift(shiftId));
    ipcMain.handle('get-sales-trend', (e, { startDate, endDate } = {}) => orderController.getSalesTrend(startDate, endDate)); // YANGI (Dynamic)
    ipcMain.handle('get-cancelled-orders', (e, { startDate, endDate }) => orderController.getCancelledOrders(startDate, endDate));
    ipcMain.handle('get-sale-details', (e, saleId) => orderController.getSaleDetails(saleId));
    ipcMain.handle('reprint-receipt', (e, sale) => orderController.reprintReceipt(sale));

    // ==========================================
    // 5. CUSTOMERS & DEBTORS (Mijozlar va Qarzdorlar)
    // ==========================================
    ipcMain.handle('get-customers', () => userController.getCustomers());
    ipcMain.handle('add-customer', (e, customer) => userController.addCustomer(customer));
    ipcMain.handle('delete-customer', (e, id) => userController.deleteCustomer(id));

    ipcMain.handle('get-debtors', () => userController.getDebtors());
    ipcMain.handle('get-debt-history', (e, id) => userController.getDebtHistory(id));
    ipcMain.handle('pay-debt', (e, { customerId, amount, comment }) => userController.payDebt(customerId, amount, comment));

    // ==========================================
    // 6. SETTINGS & STAFF (Sozlamalar va Xodimlar)
    // ==========================================
    ipcMain.handle('get-settings', () => settingsController.getSettings());
    ipcMain.handle('save-settings', (e, settings) => settingsController.saveSettings(settings));

    ipcMain.handle('get-kitchens', () => settingsController.getKitchens());
    ipcMain.handle('save-kitchen', (e, kitchen) => settingsController.saveKitchen(kitchen));
    ipcMain.handle('delete-kitchen', (e, id) => settingsController.deleteKitchen(id));

    ipcMain.handle('get-users', () => staffController.getUsers());
    ipcMain.handle('save-user', (e, user) => staffController.saveUser(user));
    ipcMain.handle('delete-user', (e, id) => staffController.deleteUser(id));

    ipcMain.handle('printer-test', (e, { printerName, type, port }) => printerService.testPrint(printerName, type, port));
    ipcMain.handle('get-system-printers', () => printerService.getPrinters()); // Added handler



    // ==========================================
    // 10. SHIFT MANAGEMENT (Smena) - YANGI
    // ==========================================
    const shiftController = require('./controllers/shiftController.cjs');
    ipcMain.handle('shift-open', (e, { cashierName, startCash }) => shiftController.openShift(cashierName, startCash));
    ipcMain.handle('shift-close', (e, endCash) => shiftController.closeShift(endCash));
    ipcMain.handle('shift-status', () => shiftController.getShiftStatus());
    ipcMain.handle('get-shifts', (e, { startDate, endDate }) => shiftController.getShifts(startDate, endDate));
    ipcMain.handle('print-shift-products', async (e, { shift, products }) => {
        return await printerService.printShiftProducts(shift, products);
    });

    // ==========================================
    // 11. RESERVATIONS (Bronlar) - YANGI
    // ==========================================
    ipcMain.handle('get-reservations', () => reservationsController.getReservations());
    ipcMain.handle('create-reservation', (e, data) => reservationsController.createReservation(data));
    ipcMain.handle('update-reservation', (e, data) => reservationsController.updateReservation(data)); // Added handler
    ipcMain.handle('update-reservation-status', (e, { id, status }) => reservationsController.updateReservationStatus(id, status));
    ipcMain.handle('delete-reservation', (e, id) => reservationsController.deleteReservation(id));

    // SYSTEM INFO (QR Code uchun)
    const os = require('os');
    ipcMain.handle('get-network-ip', () => {
        const interfaces = os.networkInterfaces();
        const addresses = [];
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                // Skip internal (i.e. 127.0.0.1) and non-ipv4 addresses
                if (iface.family === 'IPv4' && !iface.internal) {
                    addresses.push({ name, ip: iface.address });
                }
            }
        }
        // Waiter PWA va API Electron serverda 3001 portda ishlaydi (server.cjs)
        return { ips: addresses, port: 3001 };
    });

    // MACHINE ID (Litsenziya uchun)
    const { machineId } = require('node-machine-id');
    ipcMain.handle('get-machine-id', async () => {
        try {
            const id = await machineId();
            return id;
        } catch (error) {
            log.error('Machine ID error:', error);
            throw error;
        }
    });
}

module.exports = registerIpcHandlers;