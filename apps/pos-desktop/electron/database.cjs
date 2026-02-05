const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const log = require('electron-log');
const crypto = require('crypto');

// --- Baza manzilini aniqlash ---
const { dbPath } = require('./config.cjs');

console.log("📂 BAZA MANZILI (V2):", dbPath);

const db = new Database(dbPath, { verbose: null });
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = OFF'); // Migratsiya paytida o'chirib turamiz

let changeListeners = [];

function onChange(callback) {
    changeListeners.push(callback);
}

function notify(type, id = null) {
    changeListeners.forEach(cb => cb(type, id));
}

// Hashlash funksiyasi
function hashPIN(pin, salt) {
    if (!salt) salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(pin, salt, 1000, 64, 'sha512').toString('hex');
    return { salt, hash };
}

// UUID Generator
const uuidv4 = () => crypto.randomUUID();

// --- DATA TYPES & CONSTANTS ---
const config = require('./config.cjs');

// RESTAURANT_ID ni aniqlash (Lazy load later inside functions or init)
// Lekin konstantalar global bo'lgani yaxshi.
// Biz database init bo'lganda settingdan o'qiymiz.
// Keling, bu yerni o'zgartiramiz:
let RESTAURANT_ID = config.DEFAULT_RESTAURANT_ID;

// Initializatsiyadan oldin aniq bo'lmasligi mumkin, shuning uchun
// funksiya ichida ishlatganda ehtiyot bo'lish kerak.
// Yoki initDB da o'qib olamiz.

// Hozircha hardcoded ID o'rniga:
if (!RESTAURANT_ID) {
    // Agar env da bo'lmasa, hardcoded fallback (migration successful bo'lishi uchun)
    // Lekin eng to'g'risi - settings jadvalidan o'qish.
    // Hozircha V1 migratsiyasi uchun default qoldiramiz, lekin keyinroq settingsdan olamiz.
    RESTAURANT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
}

// --- V2 SCHEMA DEFINITION (UUID) ---
function createV2Tables() {

    // 1. Zallar va Stollar
    db.prepare(`CREATE TABLE IF NOT EXISTS halls (
        id TEXT PRIMARY KEY, 
        name TEXT NOT NULL,
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, deleted_at TEXT,
        sort_order INTEGER DEFAULT 0
    )`).run();

    // Hotfix: Add sort_order to halls if missing
    try {
        db.prepare("ALTER TABLE halls ADD COLUMN sort_order INTEGER DEFAULT 0").run();
    } catch (e) { /* Column likely exists */ }

    db.prepare(`CREATE TABLE IF NOT EXISTS tables (
        id TEXT PRIMARY KEY,
        hall_id TEXT,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'free',
        start_time TEXT,
        total_amount REAL DEFAULT 0,
        current_check_number INTEGER DEFAULT 0,
        waiter_id TEXT, -- User UUID
        waiter_name TEXT,
        guests INTEGER DEFAULT 0,
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, deleted_at TEXT,
        FOREIGN KEY(hall_id) REFERENCES halls(id) ON DELETE CASCADE
    )`).run();

    // 2. Kategoriyalar va Mahsulotlar
    db.prepare(`CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY, 
        name TEXT NOT NULL,
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, deleted_at TEXT,
        sort_order INTEGER DEFAULT 0
    )`).run();

    // Hotfix: Add sort_order to categories if missing
    try {
        db.prepare("ALTER TABLE categories ADD COLUMN sort_order INTEGER DEFAULT 0").run();
    } catch (e) { /* Column likely exists */ }

    db.prepare(`CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        category_id TEXT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        destination TEXT DEFAULT '1', -- Kitchen ID (UUID)
        is_active INTEGER DEFAULT 1,
        unit_type TEXT DEFAULT 'item', -- 'item' | 'kg'
        stock REAL DEFAULT 0, -- YANGI: Qoldiq
        track_stock INTEGER DEFAULT 1, -- YANGI: Ombor hisobi (1=Ha, 0=Yo'q)
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, deleted_at TEXT,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY(category_id) REFERENCES categories(id)
    )`).run();

    // Hotfix: Add sort_order to products if missing
    try {
        db.prepare("ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 0").run();
    } catch (e) { /* Column likely exists */ }

    // Hotfix: Add unit_type and stock if missing (for existing V2 DBs)
    try {
        db.prepare("ALTER TABLE products ADD COLUMN unit_type TEXT DEFAULT 'item'").run();
    } catch (e) { /* Column likely exists */ }

    try {
        db.prepare("ALTER TABLE products ADD COLUMN stock REAL DEFAULT 0").run();
    } catch (e) { /* Column likely exists */ }

    try {
        db.prepare("ALTER TABLE products ADD COLUMN track_stock INTEGER DEFAULT 1").run();
    } catch (e) { /* Column likely exists */ }

    // 2.1 Stock History (Ombor Tarixi)
    db.prepare(`CREATE TABLE IF NOT EXISTS stock_history (
        id TEXT PRIMARY KEY,
        product_id TEXT,
        quantity REAL,
        current_stock REAL,
        type TEXT, -- 'in' (Kirim), 'out' (Chiqim - spidaniya), 'sale' (Sotuv), 'return' (Qaytarish), 'cancel' (Bekor qilish)
        reason TEXT,
        date TEXT,
        user_name TEXT,
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    )`).run();

    // 2.2 Supplies (Kirim Hujjatlari)
    db.prepare(`CREATE TABLE IF NOT EXISTS supplies (
        id TEXT PRIMARY KEY,
        supplier_name TEXT,
        date TEXT,
        status TEXT DEFAULT 'draft', -- 'draft' | 'completed'
        total_amount REAL DEFAULT 0,
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT,
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT
    )`).run();

    db.prepare(`CREATE TABLE IF NOT EXISTS supply_items (
        id TEXT PRIMARY KEY,
        supply_id TEXT,
        product_id TEXT,
        quantity REAL,
        price REAL,
        total REAL,
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(supply_id) REFERENCES supplies(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id)
    )`).run();

    // 3. Buyurtmalar
    db.prepare(`CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        table_id TEXT,
        product_id TEXT,
        product_name TEXT,
        price REAL,
        quantity REAL,
        destination TEXT DEFAULT 'kitchen',
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(table_id) REFERENCES tables(id) ON DELETE CASCADE
    )`).run();

    // Hotfix: order_items updates
    try {
        db.prepare("ALTER TABLE order_items ADD COLUMN quantity REAL").run();
    } catch (e) { /* Column likely exists */ }

    try {
        db.prepare("ALTER TABLE order_items ADD COLUMN product_id TEXT").run();
    } catch (e) { /* Column likely exists */ }

    // 4. Savdolar
    db.prepare(`CREATE TABLE IF NOT EXISTS sales(
        id TEXT PRIMARY KEY,
        check_number INTEGER,
        date TEXT,
        total_amount REAL,
        subtotal REAL,
        discount REAL,
        payment_method TEXT,
        customer_id TEXT,
        waiter_name TEXT,
        guest_count INTEGER,
        items_json TEXT,
        shift_id TEXT,
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`).run();

    try {
        db.prepare("ALTER TABLE sales ADD COLUMN table_name TEXT").run();
    } catch (e) { /* Column likely exists */ }

    db.prepare(`CREATE TABLE IF NOT EXISTS sale_items(
        id TEXT PRIMARY KEY,
        sale_id TEXT,
        product_name TEXT,
        category_name TEXT,
        price REAL,
        quantity REAL,
        total_price REAL,
        date TEXT,
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE
    )`).run();

    // 5. Mijozlar
    db.prepare(`CREATE TABLE IF NOT EXISTS customers(
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        debt REAL DEFAULT 0,
        notes TEXT,
        type TEXT DEFAULT 'standard',
        value INTEGER DEFAULT 0,
        balance REAL DEFAULT 0,
        birthday TEXT,
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, deleted_at TEXT
    )`).run();

    db.prepare(`CREATE TABLE IF NOT EXISTS debt_history(
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        sale_id TEXT, --Linked Sale
        amount REAL,
        type TEXT,
        date TEXT,
        comment TEXT,
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`).run();

    // Hotfix: Add sale_id if missing
    try {
        db.prepare("ALTER TABLE debt_history ADD COLUMN sale_id TEXT").run();
    } catch (e) { /* Column likely exists */ }

    db.prepare(`CREATE TABLE IF NOT EXISTS customer_debts(
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        amount REAL,
        due_date TEXT,
        last_sms_date TEXT,
        is_paid INTEGER DEFAULT 0,
        created_at TEXT,
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`).run();

    // 5.1 Bekor qilingan buyurtmalar
    db.prepare(`CREATE TABLE IF NOT EXISTS cancelled_orders(
        id TEXT PRIMARY KEY,
        table_id TEXT,
        date TEXT,
        total_amount REAL,
        waiter_name TEXT,
        items_json TEXT,
        reason TEXT,
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`).run();

    // 6. Xodimlar
    db.prepare(`CREATE TABLE IF NOT EXISTS users(
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        pin TEXT UNIQUE,
        role TEXT DEFAULT 'waiter',
        permissions TEXT, -- JSON array of allowed pages
        salt TEXT,
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, deleted_at TEXT
    )`).run();

    // Hotfix: Add permissions if missing
    try {
        db.prepare("ALTER TABLE users ADD COLUMN permissions TEXT").run();
    } catch (e) { /* Column likely exists */ }

    // 7. Sozlamalar (KEY-VALUE bo'lgani uchun ID UUID bo'lishi shart emas, lekin sync uchun kerak)
    db.prepare(`CREATE TABLE IF NOT EXISTS settings(
        key TEXT PRIMARY KEY,
        value TEXT,
        is_synced INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`).run();

    // 8. Oshxona
    db.prepare(`CREATE TABLE IF NOT EXISTS kitchens(
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        printer_ip TEXT,
        printer_port INTEGER DEFAULT 9100,
        printer_type TEXT DEFAULT 'driver',
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, deleted_at TEXT
    )`).run();

    // 9. SMS
    db.prepare(`CREATE TABLE IF NOT EXISTS sms_templates(
        id TEXT PRIMARY KEY,
        type TEXT UNIQUE,
        title TEXT,
        content TEXT,
        is_active INTEGER DEFAULT 1,
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`).run();

    db.prepare(`CREATE TABLE IF NOT EXISTS sms_logs(
        id TEXT PRIMARY KEY,
        phone TEXT,
        message TEXT,
        status TEXT,
        date TEXT,
        type TEXT,
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`).run();

    // 11. SHIFTS
    db.prepare(`CREATE TABLE IF NOT EXISTS shifts(
        id TEXT PRIMARY KEY,
        start_time TEXT NOT NULL,
        end_time TEXT,
        start_cash REAL DEFAULT 0,
        end_cash REAL DEFAULT 0,
        declared_cash REAL DEFAULT 0,
        declared_card REAL DEFAULT 0,
        difference_cash REAL DEFAULT 0,
        difference_card REAL DEFAULT 0,
        status TEXT DEFAULT 'open',
        cashier_name TEXT,
        total_sales REAL DEFAULT 0,
        total_cash REAL DEFAULT 0,
        total_card REAL DEFAULT 0,
        total_transfer REAL DEFAULT 0,
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        shift_number INTEGER
    )`).run();

    // Hotfix: Add shift_number if missing
    try {
        db.prepare("ALTER TABLE shifts ADD COLUMN shift_number INTEGER").run();
    } catch (e) { /* Column likely exists */ }

    // Backfill shift_number for existing shifts
    try {
        const nullShifts = db.prepare("SELECT COUNT(*) as count FROM shifts WHERE shift_number IS NULL").get();
        if (nullShifts.count > 0) {
            console.log("🔄 Backfilling shift_number for existing shifts...");
            const allShifts = db.prepare("SELECT id FROM shifts ORDER BY start_time ASC").all();
            const updateStmt = db.prepare("UPDATE shifts SET shift_number = ? WHERE id = ?");

            const transaction = db.transaction((shifts) => {
                shifts.forEach((shift, index) => {
                    updateStmt.run(index + 1, shift.id);
                });
            });

            transaction(allShifts);
            console.log("✅ Shift numbers backfilled.");
        }
    } catch (e) {
        console.error("Error backfilling shift numbers:", e);
    }

    // 2.3 Bronlar (Reservations)
    db.prepare(`CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY,
        table_id TEXT,
        customer_name TEXT,
        customer_phone TEXT,
        reservation_time TEXT, -- IOS 8601 date string
        guests INTEGER DEFAULT 1,
        note TEXT,
        status TEXT DEFAULT 'active', -- 'active' | 'completed' | 'cancelled'
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        server_id TEXT, restaurant_id TEXT, is_synced INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, deleted_at TEXT,
        FOREIGN KEY(table_id) REFERENCES tables(id) ON DELETE CASCADE
    )`).run();

    // Hotfix: Add restaurant_id if missing in reservations (for local dev iterations)
    try {
        db.prepare("ALTER TABLE reservations ADD COLUMN restaurant_id TEXT").run();
    } catch (e) { /* Column likely exists */ }

    // Hotfix: Add guests if missing (Fix for 'no column named guests' error)
    try {
        db.prepare("ALTER TABLE reservations ADD COLUMN guests INTEGER DEFAULT 1").run();
    } catch (e) { /* Column likely exists */ }

    // Hotfix: Add note if missing (Fix for 'no column named note' error)
    try {
        db.prepare("ALTER TABLE reservations ADD COLUMN note TEXT").run();
    } catch (e) { /* Column likely exists */ }




    // --- Indexes (Updated) ---
    // Indexes need valid syntax. createV2Tables calls run multiple times.
    const tablesList = ['tables', 'products', 'order_items', 'sales', 'sale_items', 'debt_history', 'customer_debts', 'customers', 'reservations'];

    // Simple Index creations
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_tables_hall ON tables(hall_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_products_cat ON products(category_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_order_items_table ON order_items(table_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_debt_history_customer ON debt_history(customer_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_debt_history_sale ON debt_history(sale_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_customer_debts_status ON customer_debts(is_paid, due_date)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_sales_payment ON sales(payment_method)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_sales_waiter ON sales(waiter_name)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)`).run();

    // Reservations Indexes
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_time)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_reservations_table ON reservations(table_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status)`).run();

    // Performance Sync Indexes
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_sales_sync ON sales(is_synced)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_products_sync ON products(is_synced)`).run();

    // Supplies Indexes
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_supplies_status ON supplies(status)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_supply_items_supply ON supply_items(supply_id)`).run();

    // ==========================================
    // 12. SYNC QUEUE (Offline-first data sync)
    // ==========================================
    db.prepare(`CREATE TABLE IF NOT EXISTS sync_queue(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT,
        data_id TEXT,
        action TEXT, -- 'create', 'update', 'delete'
        data_payload TEXT, -- JSON
        restaurant_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`).run();



    // --- NEW: Sync & Update Performance Indexes (V2.0.1) ---
    const tablesToSync = [
        'users', 'kitchens', 'halls', 'tables', 'categories', 'products', 'customers', 'shifts',
        'sales', 'sale_items', 'order_items', 'debt_history', 'customer_debts', 'cancelled_orders', 'settings',
        'sms_templates', 'sms_logs', 'supplies', 'supply_items', 'reservations'
    ];

    for (const tbl of tablesToSync) {
        try {
            db.prepare(`CREATE INDEX IF NOT EXISTS idx_${tbl}_sync ON ${tbl}(is_synced)`).run();
            db.prepare(`CREATE INDEX IF NOT EXISTS idx_${tbl}_updated ON ${tbl}(updated_at)`).run();
            db.prepare(`CREATE INDEX IF NOT EXISTS idx_${tbl}_rid ON ${tbl}(restaurant_id)`).run();
        } catch (e) {
            // Ignore if table doesn't exist or index error (e.g. settings has no restaurant_id? settings table def has restaurant_id? checking schema...)
            // Schema check: 
            // settings: `is_synced INTEGER DEFAULT 0, updated_at TEXT ...` - NO restaurant_id in schema above for settings!
            // settings has KEY, VALUE.
            // users, kitchens... have restaurant_id.
            // Let's be safe.
        }
    }
}

// --- MIGRATION LOGIC (V1 -> V2) ---
function migrateToV2() {
    console.log("-----------------------------------------");
    console.log("🚀 MIGRATION START: V1 (Integer) -> V2 (UUID)");

    const migTransaction = db.transaction(() => {
        const tables = [
            'halls', 'categories', 'kitchens', 'users', 'customers', 'shifts',
            'tables', 'products', 'sales', 'sale_items',
            'order_items', 'debt_history', 'customer_debts',
            'cancelled_orders', 'sms_templates', 'sms_logs'
        ];

        // 1. Rename and Map
        for (const table of tables) {
            const exists = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = '${table}'`).get();
            if (exists) {
                console.log(`Processing table: ${table}`);
                db.prepare(`ALTER TABLE ${table} RENAME TO ${table}_old`).run();
                db.prepare(`CREATE TABLE _map_${table}(old_id INTEGER PRIMARY KEY, new_id TEXT)`).run();
            }
        }

        // 2. Create New Tables
        createV2Tables();

        // 3. Migrate Data
        // Helper to get new ID
        const getNewId = (table, oldId) => {
            if (!oldId) return null;
            try {
                const res = db.prepare(`SELECT new_id FROM _map_${table} WHERE old_id = ? `).get(oldId);
                return res ? res.new_id : null;
            } catch (e) {
                // Map table might not exist if source table was missing
                return null;
            }
        };

        // Helper to safely migrate data if table exists
        const migrateIfExists = (table, callback) => {
            const exists = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = '${table}_old'`).get();
            if (exists) {
                const rows = db.prepare(`SELECT * FROM ${table}_old`).all();
                if (rows.length > 0) callback(rows);
            }
        };

        // --- PHASE 1: Independent Tables ---
        const simpleMigrate = (table) => {
            migrateIfExists(table, (rows) => {
                const insertMap = db.prepare(`INSERT INTO _map_${table}(old_id, new_id) VALUES(?, ?)`);
                for (const row of rows) {
                    insertMap.run(row.id, uuidv4());
                }
                console.log(`Migrated IDs for ${table}: ${rows.length} records`);
            });
        };

        ['halls', 'categories', 'kitchens', 'users', 'customers', 'shifts', 'sms_templates', 'sms_logs'].forEach(simpleMigrate);

        // Copy Data for Simple Tables (with mapped IDs)

        // -> Users
        migrateIfExists('users', (rows) => {
            rows.forEach(r => {
                const newId = getNewId('users', r.id);
                db.prepare(`INSERT INTO users(id, name, pin, role, salt, restaurant_id) VALUES(?, ?, ?, ?, ?, ?)`).run(newId, r.name, r.pin, r.role, r.salt, RESTAURANT_ID);
            });
        });

        // -> Kitchens
        migrateIfExists('kitchens', (rows) => {
            rows.forEach(r => {
                const newId = getNewId('kitchens', r.id);
                db.prepare(`INSERT INTO kitchens(id, name, printer_ip, printer_port, printer_type, restaurant_id) VALUES(?, ?, ?, ?, ?, ?)`).run(newId, r.name, r.printer_ip, r.printer_port || 9100, r.printer_type || 'driver', RESTAURANT_ID);
            });
        });

        // -> Categories
        migrateIfExists('categories', (rows) => {
            rows.forEach(r => {
                const newId = getNewId('categories', r.id);
                db.prepare(`INSERT INTO categories(id, name, restaurant_id) VALUES(?, ?, ?)`).run(newId, r.name, RESTAURANT_ID);
            });
        });

        // -> Halls
        migrateIfExists('halls', (rows) => {
            rows.forEach(r => {
                const newId = getNewId('halls', r.id);
                db.prepare(`INSERT INTO halls(id, name, restaurant_id) VALUES(?, ?, ?)`).run(newId, r.name, RESTAURANT_ID);
            });
        });

        // -> Customers
        migrateIfExists('customers', (rows) => {
            rows.forEach(r => {
                const newId = getNewId('customers', r.id);
                db.prepare(`INSERT INTO customers(id, name, phone, debt, notes, type, value, balance, birthday, restaurant_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(newId, r.name, r.phone, r.debt, r.notes, r.type || 'standard', r.value || 0, r.balance || 0, r.birthday, RESTAURANT_ID);
            });
        });

        // -> SMS Templates
        migrateIfExists('sms_templates', (rows) => {
            rows.forEach(r => {
                const newId = getNewId('sms_templates', r.id);
                db.prepare(`INSERT INTO sms_templates(id, type, title, content, is_active, restaurant_id) VALUES(?, ?, ?, ?, ?, ?)`).run(newId, r.type, r.title, r.content, r.is_active, RESTAURANT_ID);
            });
        });

        // -> Shifts
        migrateIfExists('shifts', (rows) => {
            rows.forEach(r => {
                const newId = getNewId('shifts', r.id);
                db.prepare(`INSERT INTO shifts(id, start_time, end_time, start_cash, end_cash, declared_cash, declared_card, difference_cash, difference_card, status, cashier_name, total_sales, total_cash, total_card, total_transfer, restaurant_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
                    newId, r.start_time, r.end_time, r.start_cash, r.end_cash,
                    r.declared_cash || 0, r.declared_card || 0, r.difference_cash || 0, r.difference_card || 0,
                    r.status, r.cashier_name, r.total_sales, r.total_cash, r.total_card, r.total_transfer, RESTAURANT_ID
                );
            });
        });

        // --- PHASE 2: Dependent Tables ---

        // -> Tables
        migrateIfExists('tables', (rows) => {
            rows.forEach(r => {
                const newId = uuidv4();
                db.prepare(`INSERT INTO _map_tables(old_id, new_id) VALUES(?, ?)`).run(r.id, newId);

                const hallId = getNewId('halls', r.hall_id);
                const waiterId = r.waiter_id && r.waiter_id !== 0 ? getNewId('users', r.waiter_id) : null;

                db.prepare(`INSERT INTO tables(id, hall_id, name, status, start_time, total_amount, current_check_number, waiter_id, waiter_name, guests, restaurant_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
                    newId, hallId, r.name, r.status, r.start_time, r.total_amount, r.current_check_number, waiterId, r.waiter_name, r.guests, RESTAURANT_ID
                );
            });
        });

        // -> Products
        migrateIfExists('products', (rows) => {
            rows.forEach(r => {
                const newId = uuidv4();
                db.prepare(`INSERT INTO _map_products(old_id, new_id) VALUES(?, ?)`).run(r.id, newId);

                const catId = getNewId('categories', r.category_id);
                let destId = '1';
                if (r.destination) {
                    const kid = parseInt(r.destination);
                    if (!isNaN(kid)) {
                        const kNew = getNewId('kitchens', kid);
                        if (kNew) destId = kNew;
                    }
                }

                db.prepare(`INSERT INTO products(id, category_id, name, price, destination, is_active, restaurant_id) VALUES(?, ?, ?, ?, ?, ?, ?)`).run(
                    newId, catId, r.name, r.price, destId, r.is_active, RESTAURANT_ID
                );
            });
        });

        // -> Sales
        migrateIfExists('sales', (rows) => {
            rows.forEach(r => {
                const newId = uuidv4();
                db.prepare(`INSERT INTO _map_sales(old_id, new_id) VALUES(?, ?)`).run(r.id, newId);

                const custId = r.customer_id ? getNewId('customers', r.customer_id) : null;
                const shiftId = r.shift_id ? getNewId('shifts', r.shift_id) : null;

                db.prepare(`INSERT INTO sales(id, check_number, date, total_amount, subtotal, discount, payment_method, customer_id, waiter_name, guest_count, items_json, shift_id, restaurant_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
                    newId, r.check_number, r.date, r.total_amount, r.subtotal, r.discount, r.payment_method, custId, r.waiter_name, r.guest_count, r.items_json, shiftId, RESTAURANT_ID
                );
            });
        });

        // --- PHASE 3: Deep Dependencies ---

        // -> Order Items
        migrateIfExists('order_items', (rows) => {
            rows.forEach(r => {
                const tableId = getNewId('tables', r.table_id);
                if (tableId) {
                    db.prepare(`INSERT INTO order_items(id, table_id, product_name, price, quantity, destination, restaurant_id) VALUES(?, ?, ?, ?, ?, ?, ?)`).run(
                        uuidv4(), tableId, r.product_name, r.price, r.quantity, r.destination, RESTAURANT_ID
                    );
                }
            });
        });

        // -> Sale Items
        migrateIfExists('sale_items', (rows) => {
            rows.forEach(r => {
                const saleId = getNewId('sales', r.sale_id);
                if (saleId) {
                    db.prepare(`INSERT INTO sale_items(id, sale_id, product_name, category_name, price, quantity, total_price, date, restaurant_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
                        uuidv4(), saleId, r.product_name, r.category_name, r.price, r.quantity, r.total_price, r.date, RESTAURANT_ID
                    );
                }
            });
        });

        // -> Debt History
        migrateIfExists('debt_history', (rows) => {
            rows.forEach(r => {
                const custId = getNewId('customers', r.customer_id);
                if (custId) {
                    db.prepare(`INSERT INTO debt_history(id, customer_id, amount, type, date, comment, restaurant_id) VALUES(?, ?, ?, ?, ?, ?, ?)`).run(
                        uuidv4(), custId, r.amount, r.type, r.date, r.comment, RESTAURANT_ID
                    );
                }
            });
        });

        // -> Customer Debts
        migrateIfExists('customer_debts', (rows) => {
            rows.forEach(r => {
                const custId = getNewId('customers', r.customer_id);
                if (custId) {
                    db.prepare(`INSERT INTO customer_debts(id, customer_id, amount, due_date, last_sms_date, is_paid, created_at, restaurant_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`).run(
                        uuidv4(), custId, r.amount, r.due_date, r.last_sms_date, r.is_paid, r.created_at, RESTAURANT_ID
                    );
                }
            });
        });

        console.log("✅ Data Migration Completed.");

        // Clean up _map tables? (Optional, kept usually for safety)
        // db.prepare(`DROP TABLE ...`).run();
    });

    try {
        migTransaction();
        db.pragma('user_version = 2');
        console.log("🎉 MIGRATION SUCCESSFUL! DB is now V2 (UUID).");
    } catch (e) {
        console.error("❌ MIGRATION FAILED. Transactions rolled back.");
        console.error(e);
        throw e;
    }
}

// --- INITIALIZATION ---
function initDB() {
    try {
        const userVersion = db.pragma('user_version', { simple: true });
        console.log(`ℹ️ Current DB Version: ${userVersion} `);

        if (userVersion < 2) {
            // Check if we have V1 tables (e.g., 'users' exists and has INT id?)
            // Simplest check: does 'users' table exist?
            const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();

            if (tableExists) {
                // Determine if it is V1 (INT) or V2 (UUID) but version was not set (unlikely)
                // We assume if version < 2 and table exists, it is legacy V1.
                migrateToV2();
            } else {
                console.log("✨ Fresh Install detected. Creating V2 tables directly.");
                createV2Tables();
                seedDefaults();
                db.pragma('user_version = 2');
            }
        } else {
            console.log("✅ DB is up to date (V2). Verifying tables...");
            createV2Tables(); // Idempotent check
            seedTables(); // Check and seed tables if empty
        }

        // --- Foreign Keys Enable (After migration) ---
        db.pragma('foreign_keys = ON');

        // --- Optimizatsiya (Startup) ---
        runOptimize();

    } catch (err) {
        log.error("InitDB Error:", err);
        console.error(err);
    }

    // --- RESTAURANT_ID ni aniqlashtirish ---
    try {
        const ridSetting = db.prepare("SELECT value FROM settings WHERE key = 'restaurant_id'").get();
        if (ridSetting) {
            RESTAURANT_ID = ridSetting.value;
            console.log("🏢 RESTAURANT_ID (Settings):", RESTAURANT_ID);
        } else {
            // Agar settingda yo'q bo'lsa, joriy qiymatni yozib qo'yamiz (agar u default bo'lsa ham)
            // Yoki yangi generatsiya qilamiz agar env da ham yo'q bo'lsa.
            if (config.DEFAULT_RESTAURANT_ID) {
                RESTAURANT_ID = config.DEFAULT_RESTAURANT_ID;
            }
            // Agar hali ham default bo'lsa (hardcoded), uni saqlaymiz
            db.prepare("INSERT OR IGNORE INTO settings (key, value, is_synced) VALUES ('restaurant_id', ?, 0)").run(RESTAURANT_ID);
            console.log("🏢 RESTAURANT_ID (Saved):", RESTAURANT_ID);
        }
    } catch (e) {
        console.error("Failed to load RESTAURANT_ID:", e);
    }
}

function seedDefaults() {
    const OLD_DATE = '2000-01-01T00:00:00.000Z';

    // Admin seeding restored per user request
    const ADMIN_ID = uuidv4();
    const adminExists = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
    if (!adminExists) {
        const { salt, hash } = hashPIN('0000', null);
        db.prepare(`INSERT INTO users(id, name, pin, role, salt, restaurant_id, is_synced, updated_at) 
            VALUES(?, ?, ?, ?, ?, ?, 0, ?)`).run(
            ADMIN_ID, 'Admin', hash, 'admin', salt, RESTAURANT_ID, OLD_DATE
        );
        console.log("✅ Default Admin created: PIN 0000");
    }

    // Settings
    const nextCheck = db.prepare("SELECT value FROM settings WHERE key = 'next_check_number'").get();
    if (!nextCheck) {
        db.prepare(`INSERT INTO settings(key, value, updated_at, is_synced) VALUES('next_check_number', '1', ?, 0)`).run(OLD_DATE);
    }

    seedTables();
}

function seedTables() {
    const tableCount = db.prepare('SELECT count(*) as count FROM tables').get().count;
    if (tableCount === 0) {
        console.log("⚠️ No tables found. Seeding demo tables...");
        const hallId = uuidv4();
        // Create Hall
        db.prepare("INSERT INTO halls (id, name, restaurant_id, is_synced) VALUES (?, ?, ?, 0)").run(hallId, 'Asosiy Zal', RESTAURANT_ID);

        // Create Tables
        for (let i = 1; i <= 5; i++) {
            const tableId = uuidv4();
            db.prepare("INSERT INTO tables (id, hall_id, name, guests, status, restaurant_id, is_synced) VALUES (?, ?, ?, ?, 'free', ?, 0)")
                .run(tableId, hallId, `Stol ${i}`, 4, RESTAURANT_ID);
        }
        console.log("✅ Demo tables created: 'Asosiy Zal' with 5 tables.");
    }
}

// --- OPTIMIZATSIYA VA TOZALASH ---
function runOptimize() {
    try {
        console.log("🧹 Database Optimizatsiyasi boshlandi...");

        // Query plannerini yangilash
        db.pragma('optimize'); // SQLite auto-optimize

        console.log("✅ Database Optimizatsiyasi yakunlandi.");
    } catch (e) {
        log.error("Database Optimize Error:", e);
    }
}

// --- SYNC HELPER ---
function addToSyncQueue(tableName, dataId, action, payload) {
    try {
        const stmt = db.prepare(`INSERT INTO sync_queue (table_name, data_id, action, data_payload, restaurant_id) VALUES (?, ?, ?, ?, ?)`);
        stmt.run(tableName, dataId, action, JSON.stringify(payload), RESTAURANT_ID);
    } catch (e) {
        log.error(`addToSyncQueue Error (${tableName}, ${action}):`, e);
    }
}

module.exports = {
    db,
    initDB,
    onChange,
    notify,
    hashPIN,
    uuidv4,
    getRestaurantId,
    RESTAURANT_ID,
    runOptimize,
    addToSyncQueue // Export
};

