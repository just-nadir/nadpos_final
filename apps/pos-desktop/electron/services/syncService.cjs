
const axios = require('axios');
const log = require('electron-log');
const { db } = require('../database.cjs');

const SYNC_URL = process.env.BACKEND_URL ? `${process.env.BACKEND_URL.replace(/\/$/, '')}/sync/push` : 'http://localhost:3000/sync/push';
const CHECK_INTERVAL = 60000; // 1 minute

let isSyncing = false;

async function startSyncService() {
    log.info("Sync Service Started...");

    // Birinchi sinxni 10 soniyadan keyin (60 soniya kutmaslik uchun)
    setTimeout(() => {
        processSyncQueue().catch((err) => log.error("Initial sync error:", err.message));
    }, 10000);

    setInterval(async () => {
        if (isSyncing) return;
        try {
            await processSyncQueue();
        } catch (error) {
            log.error("Sync Error:", error.message);
        }
    }, CHECK_INTERVAL);
}

/** Savdo/bekor/smena yopilgandan keyin darhol sinxni boshlash uchun (60 soniya kutmaslik) */
function triggerSyncNow() {
    setImmediate(() => {
        processSyncQueue().catch((err) => log.error("Trigger sync error:", err.message));
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
        log.warn("Sync: No auth_token in settings, skipping. Login to POS to enable sync.");
        return;
    }

    isSyncing = true;
    log.info(`Sync: Processing ${queueItems.length} items...`);

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

        await axios.post(SYNC_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            timeout: 30000
        });

        const ids = queueItems.map(i => i.id);
        const placeholders = ids.map(() => '?').join(',');
        db.prepare(`DELETE FROM sync_queue WHERE id IN (${placeholders})`).run(...ids);
        log.info("Sync: Batch sent successfully, queue cleared.");
    } catch (e) {
        log.error("Sync Failed:", e.message);
        if (e.response) log.error("Response status:", e.response.status, e.response.data);
    } finally {
        isSyncing = false;
    }
}

module.exports = { startSyncService, triggerSyncNow };
