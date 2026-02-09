
const axios = require('axios');
const { logger } = require('../logger.cjs');
const { db } = require('../database.cjs');

/** Backend manzili: avval login da saqlangan, keyin .env, keyin localhost (VPS da build qilinganda login dan keladi) */
function getSyncUrl() {
    const fromSettings = db.prepare("SELECT value FROM settings WHERE key = 'backend_url'").get();
    const base = (fromSettings?.value || process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    return `${base}/sync/push`;
}
const CHECK_INTERVAL = 60000; // 1 minute

let isSyncing = false;

async function startSyncService() {
    logger.info('Sinx', 'Sinx xizmati ishga tushdi');

    // Birinchi sinxni 10 soniyadan keyin (60 soniya kutmaslik uchun)
    setTimeout(() => {
        processSyncQueue().catch((err) => logger.error('Sinx', 'Birinchi sinx xatosi', err));
    }, 10000);

    setInterval(async () => {
        if (isSyncing) return;
        try {
            await processSyncQueue();
        } catch (error) {
            logger.error('Sinx', 'Sinx xatosi', error);
        }
    }, CHECK_INTERVAL);
}

/** Savdo/bekor/smena yopilgandan keyin darhol sinxni boshlash uchun (60 soniya kutmaslik) */
function triggerSyncNow() {
    setImmediate(() => {
        processSyncQueue().catch((err) => logger.error('Sinx', 'Trigger sinx xatosi', err));
    });
}

function getAuthToken() {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'auth_token'").get();
    return row ? row.value : null;
}

async function processSyncQueue() {
    const queueItems = db.prepare(`SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT 50`).all();
    if (queueItems.length === 0) return;

    const token = getAuthToken();
    if (!token) {
        logger.warn('Sinx', 'auth_token yo\'q, sinx o\'tkazilmaydi. POS da login qiling.');
        return;
    }

    isSyncing = true;
    logger.info('Sinx', 'Navbat qayta ishlanmoqda', { count: queueItems.length });

    try {

        // 2. Format Payload
        const payload = {
            items: queueItems.map(item => ({
                id: item.data_id, // Original UUID of the record
                action: item.action,
                dataType: item.table_name,
                payload: JSON.parse(item.data_payload)
            }))
        };

        // 3. Send to Server (Need JWT Token? For now we trust machineID or need logic to get token from Main process storage)
        // Since this is background process, getting Token from Renderer localStorage is hard.
        // We will assume Server accepts MachineID authentificated requests strictly or we store Token in Electron-Store.
        // For MVP: Let's assume we send MachineID in headers and Server trusts it for Sync (if we modify Backend guard).
        // Or better: We use the Token that was saved during Login in Electron Store.

        // For now, let's just log sending. Implementation of Token storage in Electron is needed.
        // Assuming we pass "x-machine-id" header and Backend validates it.

        await axios.post(getSyncUrl(), payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            timeout: 30000
        });

        const ids = queueItems.map(i => i.id);
        const placeholders = ids.map(() => '?').join(',');
        db.prepare(`DELETE FROM sync_queue WHERE id IN (${placeholders})`).run(...ids);
        logger.info('Sinx', 'Batch yuborildi, navbat tozalandi');
    } catch (e) {
        logger.error('Sinx', 'Sinx muvaffaqiyatsiz', e);
        if (e.response) logger.error('Sinx', 'Server javobi', { status: e.response.status, data: e.response.data });
    } finally {
        isSyncing = false;
    }
}

module.exports = { startSyncService, triggerSyncNow };
