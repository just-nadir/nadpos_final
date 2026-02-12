/**
 * Hech qachon throw qilmaydigan formatlash funksiyalari.
 * undefined/null yoki noto'g'ri qiymatda ham xavfsiz ishlaydi.
 */
export function formatMoney(val: unknown): string {
    try {
        const n = typeof val === 'number' && !Number.isNaN(val) ? val : Number(val) || 0;
        return `${n.toLocaleString()} so'm`;
    } catch {
        return "0 so'm";
    }
}

export function formatInt(val: unknown): number {
    const n = typeof val === 'number' && !Number.isNaN(val) ? val : Number(val) || 0;
    return Math.floor(n);
}

/** Hafta kunlari qisqartmasi o'zbekcha */
const UZ_WEEKDAY_SHORT: Record<number, string> = {
    0: 'Yak', 1: 'Dush', 2: 'Sesh', 3: 'Chor', 4: 'Pay', 5: 'Jum', 6: 'Shan',
};

export function formatDateShort(val: unknown): string {
    if (val == null || val === '') return '';
    try {
        const d = typeof val === 'string' || typeof val === 'number' ? new Date(val + (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val) ? 'T12:00:00Z' : '')) : null;
        if (!d || Number.isNaN(d.getTime())) return '';
        const dayIndex = d.getUTCDay();
        return UZ_WEEKDAY_SHORT[dayIndex] ?? '';
    } catch {
        return '';
    }
}

/** Sana dd.mm ko‘rinishida (grafik o‘qi va boshqalar uchun) */
export function formatDateDdMm(val: unknown): string {
    if (val == null || val === '') return '';
    try {
        const d = typeof val === 'string' || typeof val === 'number' ? new Date(val + (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val) ? 'T12:00:00Z' : '')) : null;
        if (!d || Number.isNaN(d.getTime())) return '';
        const day = String(d.getUTCDate()).padStart(2, '0');
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        return `${day}.${month}`;
    } catch {
        return '';
    }
}
