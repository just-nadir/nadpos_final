const { db, uuidv4, notify } = require('../database.cjs');

const inventoryController = {
    // 1. Yangi hujjat yaratish (Draft)
    createDraftSupply: (supplierName, date, note) => {
        try {
            const id = uuidv4();
            const created_at = new Date().toISOString();

            db.prepare(`INSERT INTO supplies (id, supplier_name, date, status, note, created_at, restaurant_id, is_synced) 
                        VALUES (?, ?, ?, 'draft', ?, ?, ?, 0)`)
                .run(id, supplierName, date, note, created_at, require('../database.cjs').RESTAURANT_ID);

            return { id, status: 'draft' };
        } catch (err) {
            console.error("createDraftSupply error:", err);
            throw err;
        }
    },

    // 2. Hujjatga tovar qo'shish
    addSupplyItem: (supplyId, productId, quantity, price) => {
        try {
            const supply = db.prepare('SELECT status FROM supplies WHERE id = ?').get(supplyId);
            if (!supply || supply.status !== 'draft') throw new Error("Hujjat topilmadi yoki yopilgan");

            const total = quantity * price;
            const itemId = uuidv4();

            const transaction = db.transaction(() => {
                // Item qo'shish
                db.prepare(`INSERT INTO supply_items (id, supply_id, product_id, quantity, price, total, restaurant_id, is_synced)
                            VALUES (?, ?, ?, ?, ?, ?, ?, 0)`)
                    .run(itemId, supplyId, productId, quantity, price, total, require('../database.cjs').RESTAURANT_ID);

                // Supply totalini yangilash
                const currentTotal = db.prepare('SELECT SUM(total) as total FROM supply_items WHERE supply_id = ?').get(supplyId).total || 0;
                db.prepare('UPDATE supplies SET total_amount = ?, is_synced = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                    .run(currentTotal, supplyId);

                return { itemId, totalAmount: currentTotal };
            });

            return transaction();
        } catch (err) {
            console.error("addSupplyItem error:", err);
            throw err;
        }
    },

    // 3. Hujjatdan tovar o'chirish
    removeSupplyItem: (itemId) => {
        try {
            const item = db.prepare('SELECT supply_id FROM supply_items WHERE id = ?').get(itemId);
            if (!item) throw new Error("Item topilmadi");

            const supplyId = item.supply_id;
            const supply = db.prepare('SELECT status FROM supplies WHERE id = ?').get(supplyId);
            if (!supply || supply.status !== 'draft') throw new Error("Hujjat yopilgan");

            const transaction = db.transaction(() => {
                db.prepare('DELETE FROM supply_items WHERE id = ?').run(itemId);

                // Supply totalini yangilash
                const currentTotal = db.prepare('SELECT SUM(total) as total FROM supply_items WHERE supply_id = ?').get(supplyId).total || 0;
                db.prepare('UPDATE supplies SET total_amount = ?, is_synced = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                    .run(currentTotal, supplyId);

                return { success: true, totalAmount: currentTotal };
            });

            return transaction();
        } catch (err) {
            console.error("removeSupplyItem error:", err);
            throw err;
        }
    },

    // 4. Hujjatni tasdiqlash (Omborga o'tkazish)
    completeSupply: (supplyId) => {
        try {
            const supply = db.prepare('SELECT * FROM supplies WHERE id = ?').get(supplyId);
            if (!supply) throw new Error("Hujjat topilmadi");
            if (supply.status === 'completed') throw new Error("Hujjat allaqachon tasdiqlangan");

            const items = db.prepare('SELECT * FROM supply_items WHERE supply_id = ?').all(supplyId);
            if (items.length === 0) throw new Error("Hujjat bo'sh");

            const transaction = db.transaction(() => {
                // 1. Har bir item uchun stockni oshirish va history yozish
                for (const item of items) {
                    // Get current stock
                    const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(item.product_id);
                    const currentStock = product ? (product.stock || 0) : 0;
                    const newStock = currentStock + item.quantity;

                    // Update Product Stock
                    db.prepare('UPDATE products SET stock = ?, is_synced = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                        .run(newStock, item.product_id);

                    // Write History
                    db.prepare(`INSERT INTO stock_history (
                        id, product_id, quantity, current_stock, type, reason, date, user_name, restaurant_id, is_synced
                    ) VALUES (?, ?, ?, ?, 'in', ?, ?, 'Admin', ?, 0)`).run(
                        uuidv4(), item.product_id, item.quantity, newStock, `Kirim: ${supply.supplier_name}`, new Date().toISOString(), require('../database.cjs').RESTAURANT_ID
                    );
                }

                // 2. Supply statusini o'zgartirish
                db.prepare("UPDATE supplies SET status = 'completed', completed_at = CURRENT_TIMESTAMP, is_synced = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
                    .run(supplyId);

                return { success: true };
            });

            const res = transaction();
            notify('products', null); // Mahsulotlar yangilangani haqida xabar berish
            return res;
        } catch (err) {
            console.error("completeSupply error:", err);
            throw err;
        }
    },

    // 5. Ro'yxat olish
    getSupplies: (statusFilter) => {
        try {
            let query = `SELECT * FROM supplies WHERE deleted_at IS NULL`;
            const params = [];

            if (statusFilter && statusFilter !== 'all') {
                query += ` AND status = ?`;
                params.push(statusFilter);
            }

            query += ` ORDER BY created_at DESC LIMIT 100`;
            return db.prepare(query).all(...params);
        } catch (err) {
            console.error("getSupplies error:", err);
            return [];
        }
    },

    // 6. Hujjat detallari
    getSupplyDetails: (supplyId) => {
        try {
            const supply = db.prepare('SELECT * FROM supplies WHERE id = ?').get(supplyId);
            if (!supply) return null;

            const items = db.prepare(`
                SELECT si.*, p.name as product_name, p.unit_type 
                FROM supply_items si
                LEFT JOIN products p ON si.product_id = p.id
                WHERE si.supply_id = ?
            `).all(supplyId);

            return { ...supply, items };
        } catch (err) {
            console.error("getSupplyDetails error:", err);
            return null;
        }
    },

    // 7. Qoralama hujjatni o'chirish
    deleteSupply: (supplyId) => {
        try {
            const supply = db.prepare('SELECT status FROM supplies WHERE id = ?').get(supplyId);
            if (!supply) throw new Error("Hujjat topilmadi");
            if (supply.status === 'completed') throw new Error("Tasdiqlangan hujjatni o'chirib bo'lmaydi"); // Hozircha taqiqlaymiz

            // Soft delete emas, hard delete (draft bo'lgani uchun)
            // Yoki soft delete qilsak ham bo'ladi. Keling hard delete qilamiz, chunki baribir draft.
            const transaction = db.transaction(() => {
                db.prepare('DELETE FROM supply_items WHERE supply_id = ?').run(supplyId);
                db.prepare('DELETE FROM supplies WHERE id = ?').run(supplyId);
            });

            transaction();
            return { success: true };
        } catch (err) {
            console.error("deleteSupply error:", err);
            throw err;
        }
    }
};

module.exports = inventoryController;
