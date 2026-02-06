import api from './api';

const UZBEKISTAN_TZ = 'Asia/Tashkent';

/** Bugungi sana O'zbekiston (Toshkent) vaqtida YYYY-MM-DD */
export function getTodayUz(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: UZBEKISTAN_TZ });
}

export const statsApi = {
    getSales: (startDate: string, endDate: string) =>
        api.get<Array<{
            id: string;
            date: string;
            total_amount: number;
            check_number?: number;
            waiter_name?: string;
            items_json?: string;
        }>>('/stats/restaurant/sales', { params: { startDate, endDate } }),

    getTrend: (startDate: string, endDate: string) =>
        api.get<Array<{ day: string; total: number }>>('/stats/restaurant/trend', { params: { startDate, endDate } }),

    getShifts: (startDate: string, endDate: string) =>
        api.get<Array<{
            id: string;
            shift_number?: number;
            cashier_name?: string;
            start_time: string;
            end_time?: string | null;
            total_cash: number;
            total_card: number;
            total_transfer: number;
            total_debt: number;
            total_sales: number;
        }>>('/stats/restaurant/shifts', { params: { startDate, endDate } }),

    getShiftSales: (shiftId: string) =>
        api.get<Array<{
            id: string;
            date: string;
            total_amount: number;
            check_number?: number;
            waiter_name?: string;
            items_json?: string;
        }>>(`/stats/restaurant/shifts/${shiftId}/sales`),

    getCancelled: (startDate: string, endDate: string) =>
        api.get<Array<{
            id: string;
            table_id?: string;
            date: string;
            total_amount: number;
            waiter_name?: string;
            reason?: string;
        }>>('/stats/restaurant/cancelled', { params: { startDate, endDate } }),
};

export function getToday() {
    return getTodayUz();
}

export function getMonthStartEnd() {
    const today = getTodayUz();
    const [y, m] = today.split('-').map(Number);
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    return { startDate, endDate: today };
}

export function getLast7Days() {
    const endDate = getTodayUz();
    const [y, m, d] = endDate.split('-').map(Number);
    const startD = new Date(y, m - 1, d - 6);
    const startDate = startD.getFullYear() + '-' + String(startD.getMonth() + 1).padStart(2, '0') + '-' + String(startD.getDate()).padStart(2, '0');
    return { startDate, endDate };
}
