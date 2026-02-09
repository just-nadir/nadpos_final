const { db, notify } = require('../database.cjs');
const { logger } = require('../logger.cjs');
const crypto = require('crypto');

module.exports = {
    getCategories: () => db.prepare('SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY sort_order ASC, name ASC').all(),

    updateCategoriesOrder: (categories) => {
        const updateStmt = db.prepare('UPDATE categories SET sort_order = ?, is_synced = 0 WHERE id = ?');
        const transaction = db.transaction((items) => {
            items.forEach((cat, index) => {
                updateStmt.run(index, cat.id);
                // addToSyncQueue removed
            });
        });
        transaction(categories);
        notify('categories', null);
        return { success: true };
    },

    addCategory: (name) => {
        const id = crypto.randomUUID();
        // Get max sort_order
        const maxOrder = db.prepare("SELECT MAX(sort_order) as maxVal FROM categories WHERE deleted_at IS NULL").get();
        const nextOrder = (maxOrder && maxOrder.maxVal !== null) ? maxOrder.maxVal + 1 : 0;

        const res = db.prepare('INSERT INTO categories (id, name, sort_order) VALUES (?, ?, ?)').run(id, name, nextOrder);
        // addToSyncQueue removed
        notify('products', null);
        notify('categories', null);
        return res;
    },

    updateCategory: (id, name) => {
        const res = db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id);
        notify('products', null);
        notify('categories', null);
        return res;
    },

    deleteCategory: (id) => {
        // Soft Delete: avval kategoriyaga tegishli barcha mahsulotlarni o'chirish
        db.prepare("UPDATE products SET deleted_at = ?, is_synced = 0 WHERE category_id = ?").run(new Date().toISOString(), id);

        // Keyin kategoriyani o'chirish
        const res = db.prepare("UPDATE categories SET deleted_at = ?, is_synced = 0 WHERE id = ?").run(new Date().toISOString(), id);

        notify('products', null);
        notify('categories', null);
        return res;
    },

    getProducts: () => db.prepare(`
    SELECT p.*, c.name as category_name, k.name as kitchen_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    LEFT JOIN kitchens k ON p.destination = CAST(k.id AS TEXT)
    WHERE p.deleted_at IS NULL
    ORDER BY p.sort_order ASC, p.name ASC
  `).all(),

    updateProductsOrder: (products) => {
        const updateStmt = db.prepare('UPDATE products SET sort_order = ?, is_synced = 0 WHERE id = ?');
        const transaction = db.transaction((items) => {
            items.forEach((prod, index) => {
                updateStmt.run(index, prod.id);
                // addToSyncQueue removed
            });
        });
        transaction(products);
        notify('products', null);
        return { success: true };
    },

    addProduct: (p) => {
        const id = crypto.randomUUID();
        // Get max sort_order within category
        const maxOrder = db.prepare("SELECT MAX(sort_order) as maxVal FROM products WHERE category_id = ? AND deleted_at IS NULL").get(p.category_id);
        const nextOrder = (maxOrder && maxOrder.maxVal !== null) ? maxOrder.maxVal + 1 : 0;

        const res = db.prepare('INSERT INTO products (id, category_id, name, price, destination, unit_type, track_stock, is_active, sort_order, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)').run(
            id, p.category_id, p.name, p.price, String(p.destination), p.unit_type || 'item', (p.track_stock !== undefined ? p.track_stock : 1), 1, nextOrder
        );
        // addToSyncQueue removed
        notify('products', null);
        return res;
    },

    updateProduct: (p) => {
        const res = db.prepare(`
            UPDATE products 
            SET category_id = ?, name = ?, price = ?, destination = ?, unit_type = ?, track_stock = ?, is_synced = 0, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(p.category_id, p.name, p.price, String(p.destination), p.unit_type || 'item', (p.track_stock !== undefined ? p.track_stock : 1), p.id);
        // addToSyncQueue removed
        notify('products', null);
        return res;
    },

    toggleProductStatus: (id, status) => {
        const res = db.prepare('UPDATE products SET is_active = ?, is_synced = 0 WHERE id = ?').run(status, id);
        notify('products', null);
        return res;
    },

    deleteProduct: (id) => {
        const res = db.prepare("UPDATE products SET deleted_at = ?, is_synced = 0 WHERE id = ?").run(new Date().toISOString(), id);
        addToSyncQueue('products', id, 'DELETE', { deleted_at: new Date().toISOString() });
        notify('products', null);
        return res;
    },

    addSupply: (productId, quantity, type, reason, userName) => {
        try {
            const transaction = db.transaction(() => {
                // 1. Get current stock
                const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId);
                if (!product) throw new Error("Mahsulot topilmadi");

                const currentStock = product.stock || 0;
                let newStock = currentStock;

                // 2. Calculate new stock
                const qtyInfo = Number(quantity);
                if (type === 'in' || type === 'return') {
                    newStock += qtyInfo;
                } else if (type === 'out' || type === 'sale' || type === 'cancel') {
                    newStock -= qtyInfo;
                }

                // 3. Update product
                db.prepare('UPDATE products SET stock = ?, is_synced = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStock, productId);

                // 4. Log history
                db.prepare(`INSERT INTO stock_history (
                    id, product_id, quantity, current_stock, type, reason, date, user_name, server_id, restaurant_id, is_synced
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`).run(
                    crypto.randomUUID(), productId, quantity, newStock, type, reason, new Date().toISOString(), userName || 'System', null, require('../database.cjs').RESTAURANT_ID
                );

                return { newStock };
            });

            const result = transaction();
            notify('products', null);
            return result;
        } catch (err) {
            logger.error('Menyu', 'addSupply xatosi', err);
            throw err;
        }
    },

    getStockHistory: () => {
        try {
            return db.prepare(`
                SELECT h.*, p.name as product_name, p.unit_type 
                FROM stock_history h
                LEFT JOIN products p ON h.product_id = p.id
                ORDER BY h.date DESC
                LIMIT 500
            `).all();
        } catch (err) {
            logger.error('Menyu', 'getStockHistory xatosi', err);
            return [];
        }
    }
};
