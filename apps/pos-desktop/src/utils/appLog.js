/**
 * Frontend log yordamchisi.
 * Electron muhitida barcha loglar main process orqali nadpos.log fayliga yoziladi.
 * Brauzerda (dev) console ga ham chiqadi.
 */

function send(level, context, message, stack) {
  const payload = { level, context: context || 'App', message: message || '', stack: stack || '' };
  if (typeof window !== 'undefined' && window.api?.logFromRenderer) {
    window.api.logFromRenderer(payload);
  }
  if (level === 'error' && (typeof window === 'undefined' || !window.api?.logFromRenderer)) {
    console.error(`[${context}]`, message, stack || '');
  } else if (level === 'warn') {
    console.warn(`[${context}]`, message);
  }
}

export const appLog = {
  error(context, message, err) {
    const msg = typeof message === 'string' ? message : (err?.message || String(message));
    const stack = err?.stack || (err && String(err));
    send('error', context, msg, stack);
  },

  warn(context, message) {
    send('warn', context, typeof message === 'string' ? message : JSON.stringify(message));
  },

  info(context, message) {
    send('info', context, typeof message === 'string' ? message : JSON.stringify(message));
  },
};
