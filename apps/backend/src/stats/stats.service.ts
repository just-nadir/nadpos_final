import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StatsService {
    constructor(private prisma: PrismaService) { }

    async getSuperAdminStats() {
        // 1. Total Restaurants
        const totalRestaurants = await this.prisma.restaurant.count();

        // 2. Active Subscribers
        // User Logic: Subscribers = Total Restaurants
        const activeSubscribers = totalRestaurants;

        // 3. Monthly Revenue
        // Logic: Total Restaurants * 300,000 UZS
        const monthlyRevenue = totalRestaurants * 300000;

        // 4. Growth Calculation (Month over Month)
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const totalLastMonth = await this.prisma.restaurant.count({
            where: {
                createdAt: {
                    lt: startOfCurrentMonth
                }
            }
        });

        let restaurantsGrowth = 0;
        let revenueGrowth = 0;

        if (totalLastMonth === 0) {
            restaurantsGrowth = totalRestaurants > 0 ? 100 : 0;
            revenueGrowth = monthlyRevenue > 0 ? 100 : 0;
        } else {
            restaurantsGrowth = ((totalRestaurants - totalLastMonth) / totalLastMonth) * 100;
            // Since revenue is linear to restaurants for now:
            const revenueLastMonth = totalLastMonth * 300000;
            revenueGrowth = ((monthlyRevenue - revenueLastMonth) / revenueLastMonth) * 100;
        }

        // 5. Yearly Growth (YoY - Year over Year)
        // Compare Total Restaurants NOW vs Total Restaurants 1 Year Ago
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const totalOneYearAgo = await this.prisma.restaurant.count({
            where: {
                createdAt: {
                    lt: oneYearAgo
                }
            }
        });

        let yearlyGrowth = 0;
        if (totalOneYearAgo === 0) {
            yearlyGrowth = totalRestaurants > 0 ? 100 : 0;
        } else {
            yearlyGrowth = ((totalRestaurants - totalOneYearAgo) / totalOneYearAgo) * 100;
        }

        // 6. Chart Data (Last 6 Months)
        const chartData = await this.getChartData();

        return {
            totalRestaurants,
            activeSubscribers,
            monthlyRevenue,
            restaurantsGrowth,
            revenueGrowth,
            yearlyGrowth,
            chartData
        };
    }

    private async getChartData() {
        // Wait, "Obunachilar Grafigi" usually implies Total Active. 
        // Let's re-calculate logic to be Cumulative Active Subscribers at end of that month.
        const cumulativeData: any[] = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleString('default', { month: 'short' });
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const totalAtEndOfMonth = await this.prisma.restaurant.count({
                where: {
                    createdAt: {
                        lte: endOfMonth
                    }
                }
            });

            cumulativeData.push({
                name: monthName,
                subscribers: totalAtEndOfMonth,
                revenue: totalAtEndOfMonth * 300000 // Monthly recurring revenue snapshot
            });
        }

        return cumulativeData;
    }

    /** Sana parametrini YYYY-MM-DD ga normalizatsiya (DD/MM/YYYY yoki boshqa formatdan) */
    private normalizeDateParam(d: string): string {
        if (!d || typeof d !== 'string') return new Date().toISOString().slice(0, 10);
        const trimmed = d.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
        const parts = trimmed.split(/[/.-]/);
        if (parts.length === 3 && parts[0].length <= 2 && parts[1].length <= 2) {
            const [a, b, c] = parts.map((x) => x.padStart(2, '0'));
            if (Number(a) > 12) return `${c}-${b}-${a}`;
            return `${c}-${b}-${a}`;
        }
        return new Date(trimmed).toISOString().slice(0, 10);
    }

    /** O'zbekiston (Toshkent UTC+5) bo'yicha YYYY-MM-DD dan UTC Date oralig'i 
     * Masalan: "2026-02-07" → 2026-02-06 19:00 UTC dan 2026-02-07 18:59:59.999 UTC gacha */
    private dateRangeTashkent(startDate: string, endDate: string): { start: Date; end: Date } {
        const startNorm = this.normalizeDateParam(startDate);
        const endNorm = this.normalizeDateParam(endDate);
        const TZ_OFFSET_MS = 5 * 60 * 60 * 1000;

        // UTC da kun boshiga 5 soat ayiramiz → Toshkent kun boshi
        const startUtc = new Date(new Date(startNorm + 'T00:00:00.000Z').getTime() - TZ_OFFSET_MS);
        const endUtc = new Date(new Date(endNorm + 'T23:59:59.999Z').getTime() - TZ_OFFSET_MS);

        return { start: startUtc, end: endUtc };
    }

    // --- Restaurant-scoped stats (mirror tables) ---
    async getRestaurantSales(restaurantId: string, startDate: string, endDate: string) {
        const { start, end } = this.dateRangeTashkent(startDate, endDate);
        const sales = await this.prisma.sale.findMany({
            where: {
                restaurantId,
                date: { gte: start, lte: end },
            },
            orderBy: { date: 'desc' },
            select: {
                id: true, date: true, total_amount: true, subtotal: true, discount: true,
                payment_method: true, waiter_name: true, guest_count: true, items_json: true,
                check_number: true, table_name: true,
            },
        });
        // Debug: hisobot sababini topish uchun (keyin o'chirish mumkin)
        if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_STATS === '1') {
            console.log('[Stats] getRestaurantSales', {
                restaurantId,
                startDate,
                endDate,
                rangeStart: start.toISOString(),
                rangeEnd: end.toISOString(),
                count: sales.length,
                firstSaleDate: sales[0]?.date?.toISOString?.(),
            });
        }
        return sales;
    }

    async getRestaurantTrend(restaurantId: string, startDate: string, endDate: string) {
        const { start, end } = this.dateRangeTashkent(startDate, endDate);
        const sales = await this.prisma.sale.findMany({
            where: { restaurantId, date: { gte: start, lte: end } },
            select: { date: true, total_amount: true },
        });
        const TZ_OFFSET_MS = 5 * 60 * 60 * 1000;
        const byDay = new Map<string, number>();
        for (const s of sales) {
            const dayUtc = new Date(s.date.getTime() + TZ_OFFSET_MS);
            const day = dayUtc.toISOString().slice(0, 10);
            byDay.set(day, (byDay.get(day) ?? 0) + s.total_amount);
        }
        return Array.from(byDay.entries())
            .map(([day, total]) => ({ day, total }))
            .sort((a, b) => a.day.localeCompare(b.day));
    }

    async getRestaurantShifts(restaurantId: string, startDate: string, endDate: string) {
        const { start, end } = this.dateRangeTashkent(startDate, endDate);
        return this.prisma.shift.findMany({
            where: {
                restaurantId,
                start_time: { gte: start, lte: end },
            },
            orderBy: { start_time: 'desc' },
        });
    }

    async getRestaurantShiftSales(restaurantId: string, shiftId: string) {
        return this.prisma.sale.findMany({
            where: { restaurantId, shift_id: shiftId },
            orderBy: { date: 'desc' },
        });
    }

    async getRestaurantCancelled(restaurantId: string, startDate: string, endDate: string) {
        const { start, end } = this.dateRangeTashkent(startDate, endDate);
        return this.prisma.cancelledOrder.findMany({
            where: {
                restaurantId,
                date: { gte: start, lte: end },
            },
            orderBy: { date: 'desc' },
        });
    }
}
