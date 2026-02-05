
const axios = require('axios');
const log = require('electron-log');
const { db } = require('../database.cjs');
const { machineId } = require('node-machine-id');

const SYNC_URL = 'http://localhost:3000/sync/push';
const CHECK_INTERVAL = 60000; // 1 minute

let isSyncing = false;

async function startSyncService() {
    log.info("Sync Service Started...");

    setInterval(async () => {
        if (isSyncing) return;
        try {
            await processSyncQueue();
        } catch (error) {
            log.error("Sync Error:", error.message);
        }
    }, CHECK_INTERVAL);
}

async function processSyncQueue() {
    // 1. Check Queue
    const queueItems = db.prepare(`SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT 50`).all();
    if (queueItems.length === 0) return;

    isSyncing = true;
    log.info(`Sync: Processing ${queueItems.length} items...`);

    try {
        const myMachineId = await machineId();

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

        // TEMPORARY: Just logging
        // await axios.post(SYNC_URL, payload); 

        log.info("Sync: Batch sent successfully (Simulation).");

        // 4. Delete from Queue
        // const ids = queueItems.map(i => i.id);
        // db.prepare(`DELETE FROM sync_queue WHERE id IN (${ids.join(',')})`).run();

    } catch (e) {
        log.error("Sync Failed:", e.message);
    } finally {
        isSyncing = false;
    }
}

module.exports = { startSyncService };
