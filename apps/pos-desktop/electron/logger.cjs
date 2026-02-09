/**
 * NadPOS — Markaziy log tizimi
 * Barcha loglar faylga yoziladi. Xatolar aniq ajratib ko'rsatiladi.
 */
const electronLog = require('electron-log');

// --- SOZLAMALAR ---
electronLog.transports.file.level = 'info';
electronLog.transports.file.fileName = 'nadpos.log';
electronLog.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
electronLog.transports.console.level = false; // Konsolga chiqarmaymiz (faqat fayl)

const LEVEL = { ERROR: 'ERROR', WARN: 'WARN', INFO: 'INFO', DEBUG: 'DEBUG' };

function formatPayload(moduleName, message, data) {
    const prefix = moduleName ? `[${moduleName}] ` : '';
    if (data === undefined || data === null) return `${prefix}${message}`;
    if (data instanceof Error) return `${prefix}${message} | Xato: ${data.message}${data.stack ? '\n' + data.stack : ''}`;
    if (typeof data === 'object') return `${prefix}${message} | ${JSON.stringify(data)}`;
    return `${prefix}${message} | ${String(data)}`;
}

const logger = {
    /**
     * Oddiy ma'lumot (muvaffaqiyat, boshlash, tugash)
     * @param {string} moduleName - Modul yoki joy nomi (masalan: "Smena", "Baza", "Server")
     * @param {string} message - Tushunarli xabar
     * @param {any} [data] - Ixtiyoriy ma'lumot (obyekt, string)
     */
    info(moduleName, message, data) {
        electronLog.info(formatPayload(moduleName, message, data));
    },

    /**
     * Ogohlantirish (kutilmagan, lekin kritik emas)
     */
    warn(moduleName, message, data) {
        electronLog.warn(formatPayload(moduleName, message, data));
    },

    /**
     * Xato — barcha xatolar shu orqali. Stack trace avtomatik qo'shiladi.
     * @param {string} moduleName - Modul nomi
     * @param {string} message - Qisqa tavsif
     * @param {Error|string} [err] - Xato obyekti yoki qo'shimcha matn
     */
    error(moduleName, message, err) {
        const text = formatPayload(moduleName, message, err);
        electronLog.error(text);
        if (err && err instanceof Error && err.stack) {
            electronLog.error(`  Stack: ${err.stack}`);
        }
    },

    /**
     * Debug (faqat rivojlantirishda kerak bo'lsa)
     */
    debug(moduleName, message, data) {
        electronLog.debug(formatPayload(moduleName, message, data));
    }
};

/**
 * Renderer (frontend) dan kelgan loglarni yozish
 * IPC orqali chaqiriladi: invoke('log-from-renderer', { level, context, message, stack })
 */
function logFromRenderer({ level, context, message, stack }) {
    const ctx = context || 'Frontend';
    const msg = stack ? `${message}\n  Stack: ${stack}` : message;
    switch (level) {
        case 'error':
            electronLog.error(`[${ctx}] ${msg}`);
            break;
        case 'warn':
            electronLog.warn(`[${ctx}] ${msg}`);
            break;
        case 'info':
            electronLog.info(`[${ctx}] ${msg}`);
            break;
        default:
            electronLog.info(`[${ctx}] ${msg}`);
    }
}

module.exports = { logger, logFromRenderer, LEVEL };
