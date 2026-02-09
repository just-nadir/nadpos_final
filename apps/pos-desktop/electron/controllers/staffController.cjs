const { db, notify, addToSyncQueue } = require('../database.cjs');
const { logger } = require('../logger.cjs');
const crypto = require('crypto');

// Yordamchi: Hashlash funksiyasi
function hashPIN(pin, salt) {
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(pin, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

module.exports = {
  getUsers: () => db.prepare('SELECT id, name, role, permissions FROM users WHERE deleted_at IS NULL').all(), // permissions return

  saveUser: (user) => {
    // PIN kod validatsiyasi (faqat raqamlar)
    if (user.pin && !/^\d+$/.test(user.pin)) {
      throw new Error("PIN faqat raqamlardan iborat bo'lishi kerak!");
    }

    // Permissions ni stringify qilish
    const perms = user.permissions && Array.isArray(user.permissions) ? JSON.stringify(user.permissions) : null;

    if (user.id) {
      // Userni yangilash
      if (user.pin) { // Agar yangi PIN kiritilgan bo'lsa
        const { salt, hash } = hashPIN(user.pin);
        db.prepare('UPDATE users SET name = ?, pin = ?, role = ?, salt = ?, permissions = ? WHERE id = ?')
          .run(user.name, hash, user.role, salt, perms, user.id);
        // addToSyncQueue removed
      } else { // Faqat ism, rol yoki permission
        db.prepare('UPDATE users SET name = ?, role = ?, permissions = ? WHERE id = ?')
          .run(user.name, user.role, perms, user.id);
        // addToSyncQueue removed
      }
      logger.info('Xodim', 'Xodim ma\'lumotlari o\'zgartirildi', { name: user.name, role: user.role });
    } else {
      // Yangi user qo'shish
      const allUsers = db.prepare('SELECT pin, salt FROM users WHERE deleted_at IS NULL').all();
      const isDuplicate = allUsers.some(u => {
        const { hash } = hashPIN(user.pin, u.salt);
        return hash === u.pin;
      });

      if (isDuplicate) throw new Error('Bu PIN kod band!');

      const { salt, hash } = hashPIN(user.pin);
      const id = crypto.randomUUID();
      db.prepare('INSERT INTO users (id, name, pin, role, salt, permissions) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, user.name, hash, user.role, salt, perms);
      // addToSyncQueue removed

      logger.info('Xodim', 'Yangi xodim qo\'shildi', { name: user.name, role: user.role });
    }
    notify('users', null);
  },

  deleteUser: (id) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (user && user.role === 'admin') {
      const adminCount = db.prepare("SELECT count(*) as count FROM users WHERE role = 'admin' AND deleted_at IS NULL").get().count;
      if (adminCount <= 1) throw new Error("Oxirgi adminni o'chirib bo'lmaydi!");
    }

    const res = db.prepare("UPDATE users SET deleted_at = ?, is_synced = 0 WHERE id = ?").run(new Date().toISOString(), id);
    addToSyncQueue('users', id, 'DELETE', { deleted_at: new Date().toISOString() });
    logger.warn('Xodim', 'Xodim o\'chirildi', { id, name: user?.name });
    notify('users', null);
    return res;
  },

  login: (pin) => {
    // Barcha userlarni olamiz va tekshiramiz
    const users = db.prepare('SELECT * FROM users WHERE deleted_at IS NULL').all();

    const foundUser = users.find(u => {
      // Agar eski formatda (salt yo'q) bo'lsa
      if (!u.salt) return u.pin === pin;
      // Hashlab ko'ramiz
      const { hash } = hashPIN(pin, u.salt);
      return hash === u.pin;
    });

    if (!foundUser) {
      // Debug log logic kept minimal for brevity, but original had it
      throw new Error("Noto'g'ri PIN kod");
    }

    logger.info('Auth', 'Tizimga kirish muvaffaqiyatli', { name: foundUser.name, role: foundUser.role });

    // Parse permissions if string
    let parsedPerms = null;
    try {
      parsedPerms = foundUser.permissions ? JSON.parse(foundUser.permissions) : null;
    } catch (e) { }

    // Agar permissions bo'lmasa, default ro'lga qarab beramiz (Migration fallback)
    if (!parsedPerms) {
      if (foundUser.role === 'admin') parsedPerms = ['pos', 'tables', 'menu', 'customers', 'reports', 'inventory', 'settings', 'reservations'];
      else if (foundUser.role === 'cashier') parsedPerms = ['pos', 'tables', 'customers', 'reports', 'reservations'];
      else parsedPerms = ['pos', 'tables'];
    }

    return { id: foundUser.id, name: foundUser.name, role: foundUser.role, permissions: parsedPerms };
  }
};