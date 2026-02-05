import api from './api';

function dateStr(d: Date) {
    return d.toISOString().slice(0, 10);
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
    const t = new Date();
    return dateStr(t);
}

export function getMonthStartEnd() {
    const t = new Date();
    const start = new Date(t.getFullYear(), t.getMonth(), 1);
    return { startDate: dateStr(start), endDate: dateStr(t) };
}

export function getLast7Days() {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return { startDate: dateStr(start), endDate: dateStr(end) };
}
