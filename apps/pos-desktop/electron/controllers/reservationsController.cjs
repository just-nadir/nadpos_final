const { db, uuidv4, notify, getRestaurantId } = require('../database.cjs');
const { logger } = require('../logger.cjs');
const RESERVATION_DURATION_MINUTES = 120;

const reservationsController = {
    getReservations: () => {
        try {
            // Get today and future reservations, excluding deleted ones
            const rows = db.prepare(`
                SELECT r.*, t.name as table_name, h.name as hall_name 
                FROM reservations r 
                LEFT JOIN tables t ON r.table_id = t.id 
                LEFT JOIN halls h ON t.hall_id = h.id
                WHERE r.deleted_at IS NULL
                ORDER BY r.reservation_time DESC
            `).all();
            return rows;
        } catch (error) {
            logger.error('Bron', 'getReservations xatosi', error);
            throw error;
        }
    },

    createReservation: (data) => {
        try {
            logger.info('Bron', 'createReservation chaqirildi', { customer_name: data.customer_name });
            const { customer_name, customer_phone, reservation_time, guests, table_id, note } = data;

            // 1. Vaqtga tekshiruv (O'tmishga bron qilmaslik)
            const checkTime = new Date(reservation_time);
            const now = new Date();
            // 5 daqiqa bag'rikenglik (client-server vaqt farqi uchun)
            if (checkTime < new Date(now.getTime() - 5 * 60 * 1000)) {
                throw new Error("O'tgan vaqtga bron qilish mumkin emas");
            }

            const id = uuidv4();
            const created_at = now.toISOString();

            let finalTableId = table_id || null;

            // 2. Avtomatik Stol Tanlash yoki Tanlanganni Tekshirish
            if (finalTableId) {
                // Aniq stol tanlangan -> Bandlikka tekshiramiz
                if (isTableBusy(finalTableId, reservation_time)) {
                    throw new Error("Tanlangan stol ushbu vaqtda band");
                }
            } else {
                // Avtomatik -> Bo'sh stol qidiramiz
                finalTableId = findBestAvailableTable(guests, reservation_time);
                if (!finalTableId) {
                    // Agar stol topilmasa, stolsiz qabul qilamiz (Pending)
                    logger.warn('Bron', 'Avtomatik stol topilmadi, stolsiz saqlanmoqda');
                    // throw new Error("Afsuski, mos keluvchi bo'sh stol topilmadi"); // Oldingi qattiq cheklov
                }
            }

            const restaurantId = getRestaurantId();
            logger.info('Bron', 'Bron yozilmoqda', { id, customer_name, finalTableId });

            db.prepare(`
                INSERT INTO reservations (id, customer_name, customer_phone, reservation_time, guests, table_id, note, status, created_at, updated_at, restaurant_id, is_synced)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, 0)
            `).run(id, customer_name, customer_phone, reservation_time, guests, finalTableId, note, created_at, created_at, restaurantId);

            // Notify clients
            notify('reservation-update', id);

            return { success: true, id, table_id: finalTableId };
        } catch (error) {
            logger.error('Bron', 'createReservation xatosi', error);
            throw error;
        }
    },

    updateReservation: (data) => {
        try {
            logger.info('Bron', 'updateReservation chaqirildi', { id: data.id });
            const { id, customer_name, customer_phone, reservation_time, guests, table_id, note } = data;

            // 1. Vaqtni tekshirish
            const checkTime = new Date(reservation_time);
            const now = new Date();
            if (checkTime < new Date(now.getTime() - 5 * 60 * 1000)) {
                // throw new Error("O'tgan vaqtga o'zgartirish mumkin emas"); // Tahrirlashda yumshoqroq bo'lishi mumkin, lekin hozircha qoldiramiz
            }

            const updated_at = new Date().toISOString();
            let finalTableId = table_id;

            // Avtomatik stol, agar 'auto' kelgan bo'lsa yoki o'zgargan bo'lsa
            if (finalTableId === 'auto' || !finalTableId) {
                // Agar tahrirlashda stol bo'sh qoldirilsa, eski stolni saqlab qolishimiz kerakmi?
                // Yoki qayta avtomatik qidirish kerakmi?
                // Hozirgi mantiq bo'yicha, agar 'auto' bo'lsa, qayta qidiramiz
                finalTableId = findBestAvailableTable(guests, reservation_time);
                if (!finalTableId) {
                    logger.warn('Bron', 'Update: Avtomatik stol topilmadi');
                }
            } else {
                // Aniq stol tanlangan. Bandlikka tekshiramiz (O'ZIDAN TASHQARI)
                if (isTableBusy(finalTableId, reservation_time, id)) {
                    throw new Error("Tanlangan stol ushbu vaqtda band");
                }
            }

            db.prepare(`
                UPDATE reservations 
                SET customer_name = ?, customer_phone = ?, reservation_time = ?, guests = ?, table_id = ?, note = ?, updated_at = ?, is_synced = 0
                WHERE id = ?
            `).run(customer_name, customer_phone, reservation_time, guests, finalTableId, note, updated_at, id);

            notify('reservation-update', id);
            return { success: true, id, table_id: finalTableId };
        } catch (error) {
            logger.error('Bron', 'updateReservation xatosi', error);
            throw error;
        }
    },

    updateReservationStatus: (id, status) => {
        try {
            const updated_at = new Date().toISOString();
            db.prepare(`UPDATE reservations SET status = ?, updated_at = ?, is_synced = 0 WHERE id = ?`)
                .run(status, updated_at, id);

            notify('reservation-update', id);
            return { success: true };
        } catch (error) {
            logger.error('Bron', 'updateReservationStatus xatosi', error);
            throw error;
        }
    },

    deleteReservation: (id) => {
        try {
            const updated_at = new Date().toISOString();
            // Soft delete
            db.prepare(`UPDATE reservations SET deleted_at = ?, updated_at = ?, is_synced = 0 WHERE id = ?`)
                .run(updated_at, updated_at, id);

            notify('reservation-update', id);
            return { success: true };
        } catch (error) {
            logger.error('Bron', 'deleteReservation xatosi', error);
            throw error;
        }
    }
};

// --- HELPER FUNCTIONS ---

function isTableBusy(tableId, timeStr, excludeId = null) {
    const checkTime = new Date(timeStr).getTime();
    const durationMs = RESERVATION_DURATION_MINUTES * 60 * 1000;
    const endTime = checkTime + durationMs;

    // Ushbu stol uchun barcha AKTIV bronlarni olamiz
    // Status: active bo'lishi kerak.
    let query = `
        SELECT id, reservation_time FROM reservations 
        WHERE table_id = ? 
        AND status = 'active' 
        AND deleted_at IS NULL
    `;
    const params = [tableId];

    if (excludeId) {
        query += ` AND id != ?`;
        params.push(excludeId);
    }

    const reservations = db.prepare(query).all(...params);

    return reservations.some(res => {
        const existingStart = new Date(res.reservation_time).getTime();
        const existingEnd = existingStart + durationMs;

        // Overlap logic: (StartA < EndB) and (EndA > StartB)
        return (checkTime < existingEnd && endTime > existingStart);
    });
}

function findBestAvailableTable(guests, timeStr) {
    // 1. Sig'imi yetadigan barcha stollarni olamiz
    // Kichik stollarni birinchi, kattalarini keyin (Optimallashtirish)
    const tables = db.prepare(`
        SELECT id, guests as capacity FROM tables 
        WHERE guests >= ? 
        ORDER BY guests ASC
    `).all(guests);

    // 2. Har birini tekshirib chiqamiz
    for (const table of tables) {
        if (!isTableBusy(table.id, timeStr)) {
            return table.id; // Birinchi topilgan bo'sh stol eng yaxshisi (chunki sorted ASC)
        }
    }

    return null;
}

module.exports = reservationsController;
