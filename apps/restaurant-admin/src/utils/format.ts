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

export function formatDateShort(val: unknown): string {
    if (val == null || val === '') return '';
    try {
        const d = typeof val === 'string' || typeof val === 'number' ? new Date(val) : null;
        if (!d || Number.isNaN(d.getTime())) return '';
        return d.toLocaleDateString('uz-UZ', { weekday: 'short' });
    } catch {
        return '';
    }
}
