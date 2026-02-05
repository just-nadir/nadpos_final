const { db, notify } = require('../database.cjs');
const crypto = require('crypto');

module.exports = {
  getCustomers: () => db.prepare('SELECT * FROM customers WHERE deleted_at IS NULL').all(),

  addCustomer: (c) => {
    const id = crypto.randomUUID();
    const res = db.prepare('INSERT INTO customers (id, name, phone, type, value, balance, birthday, debt, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)').run(id, c.name, c.phone, c.type, c.value, 0, c.birthday);
    // addToSyncQueue removed
    notify('customers', null);
    return res;
  },

  deleteCustomer: (id) => {
    const customer = db.prepare("SELECT debt FROM customers WHERE id = ?").get(id);
    if (customer && customer.debt > 0) {
      throw new Error("Qarzdor mijozni o'chirib bo'lmaydi!");
    }
    const res = db.prepare("UPDATE customers SET deleted_at = ?, is_synced = 0 WHERE id = ?").run(new Date().toISOString(), id);
    addToSyncQueue('customers', id, 'DELETE', { deleted_at: new Date().toISOString() });
    notify('customers', null);
    return res;
  },

  getDebtors: () => {
    const query = `
          SELECT 
              c.*,
              MIN(CASE WHEN cd.is_paid = 0 THEN cd.due_date ELSE NULL END) as next_due_date
          FROM customers c
          LEFT JOIN customer_debts cd ON c.id = cd.customer_id
          WHERE c.debt > 0 AND c.deleted_at IS NULL
          GROUP BY c.id
      `;
    return db.prepare(query).all();
  },

  getDebtHistory: (id) => db.prepare(`
    SELECT dh.*, s.check_number, s.items_json 
    FROM debt_history dh 
    LEFT JOIN sales s ON dh.sale_id = s.id 
    WHERE dh.customer_id = ? 
    ORDER BY dh.date DESC, dh.id DESC
  `).all(id),

  payDebt: (customerId, amount, comment) => {
    const date = new Date().toISOString();
    const updateDebt = db.transaction(() => {
      db.prepare('UPDATE customers SET debt = debt - ?, is_synced = 0 WHERE id = ?').run(amount, customerId);
      // addToSyncQueue removed // Simplified payload logic, ideally sync full state or op

      const historyId = crypto.randomUUID();
      db.prepare('INSERT INTO debt_history (id, customer_id, amount, type, date, comment, is_synced) VALUES (?, ?, ?, ?, ?, ?, 0)').run(historyId, customerId, amount, 'payment', date, comment);
      // addToSyncQueue removed
    });
    const res = updateDebt();
    notify('customers', null);
    notify('debtors', null);
    return res;
  }
};