const { db, notify, addToSyncQueue } = require('../database.cjs');
const crypto = require('crypto');
const { logger } = require('../logger.cjs');

module.exports = {
  getHalls: () => db.prepare('SELECT * FROM halls WHERE deleted_at IS NULL ORDER BY sort_order ASC, name ASC').all(),

  updateHallsOrder: (halls) => {
    // Transactional update
    const updateStmt = db.prepare('UPDATE halls SET sort_order = ?, is_synced = 0 WHERE id = ?');
    const transaction = db.transaction((items) => {
      items.forEach((hall, index) => {
        updateStmt.run(index, hall.id);
        // addToSyncQueue removed
      });
    });
    transaction(halls);
    notify('halls', null);
    return { success: true };
  },

  addHall: (name) => {
    const id = crypto.randomUUID();
    // Get max sort_order
    const maxOrder = db.prepare("SELECT MAX(sort_order) as maxVal FROM halls WHERE deleted_at IS NULL").get();
    const nextOrder = (maxOrder && maxOrder.maxVal !== null) ? maxOrder.maxVal + 1 : 0;

    const res = db.prepare('INSERT INTO halls (id, name, sort_order) VALUES (?, ?, ?)').run(id, name, nextOrder);
    // addToSyncQueue removed
    notify('halls', null);
    return res;
  },

  deleteHall: (id) => {
    // Soft Delete tables
    db.prepare("UPDATE tables SET deleted_at = ?, is_synced = 0 WHERE hall_id = ?").run(new Date().toISOString(), id);
    // addToSyncQueue removed // Special op needed or loop update? Loop update is safer.
    // Simplifying: Just let tables update themselves if accessed, but here massive update.
    // Ideally we fetch tables and queue individual updates.
    const tables = db.prepare('SELECT id FROM tables WHERE hall_id = ?').all(id);
    tables.forEach(t => addToSyncQueue('tables', t.id, 'DELETE', { deleted_at: new Date().toISOString() }));

    // Soft Delete hall
    const res = db.prepare("UPDATE halls SET deleted_at = ?, is_synced = 0 WHERE id = ?").run(new Date().toISOString(), id);
    addToSyncQueue('halls', id, 'DELETE', { deleted_at: new Date().toISOString() });

    notify('halls', null);
    notify('tables', null);
    return res;
  },

  getTables: () => {
    const rows = db.prepare(`
        SELECT t.*, h.name as hall_name 
        FROM tables t 
        LEFT JOIN halls h ON t.hall_id = h.id 
        WHERE t.deleted_at IS NULL
    `).all();
    logger.info('Stollar', 'getTables natijasi', { count: rows.length });
    return rows;
  },

  getTablesByHall: (id) => db.prepare('SELECT * FROM tables WHERE hall_id = ? AND deleted_at IS NULL').all(id),

  addTable: (hallId, name) => {
    const id = crypto.randomUUID();
    const res = db.prepare('INSERT INTO tables (id, hall_id, name, is_synced) VALUES (?, ?, ?, 0)').run(id, hallId, name);
    // addToSyncQueue removed
    notify('tables', null);
    return res;
  },

  deleteTable: (id) => {
    const res = db.prepare("UPDATE tables SET deleted_at = ?, is_synced = 0 WHERE id = ?").run(new Date().toISOString(), id);
    addToSyncQueue('tables', id, 'DELETE', { deleted_at: new Date().toISOString() });
    notify('tables', null);
    return res;
  },

  updateTableGuests: (id, count) => {
    const res = db.prepare("UPDATE tables SET guests = ?, status = 'occupied', start_time = COALESCE(start_time, ?), is_synced = 0 WHERE id = ?")
      .run(count, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), id);
    notify('tables', null);
    return res;
  },

  updateTableStatus: (id, status) => {
    const res = db.prepare('UPDATE tables SET status = ?, is_synced = 0 WHERE id = ?').run(status, id);
    // addToSyncQueue removed
    notify('tables', null);
    return res;
  },

  closeTable: (id) => {
    // Buyurtmalarni o'chirish
    db.prepare('DELETE FROM order_items WHERE table_id = ?').run(id);
    // addToSyncQueue removed

    const res = db.prepare(`UPDATE tables SET status = 'free', guests = 0, start_time = NULL, total_amount = 0, is_synced = 0 WHERE id = ?`).run(id);
    // addToSyncQueue removed

    notify('tables', null);
    notify('table-items', id);
    return res;
  }
};