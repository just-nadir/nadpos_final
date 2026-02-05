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
}
