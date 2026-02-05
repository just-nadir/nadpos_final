
import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { getSuperAdminStats } from '../services/api';
import type { SuperAdminStats } from '../types/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function DashboardPage() {
    const [statsData, setStatsData] = useState<SuperAdminStats>({
        activeSubscribers: 0,
        monthlyRevenue: 0,
        growth: 0,
        restaurantsGrowth: 0,
        revenueGrowth: 0,
        yearlyGrowth: 0,
        chartData: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getSuperAdminStats();
                setStatsData(data);
            } catch (err) {
                console.error('Stats fetching failed:', err);
                setError('Statistik maʼlumotlarni yuklashda xatolik yuz berdi. Keyinroq yana urinib ko‘ring.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getGrowthColor = (value: number) => {
        if (value > 0) return 'text-green-600 bg-green-50';
        if (value < 0) return 'text-red-600 bg-red-50';
        return 'text-gray-600 bg-gray-50';
    };

    const stats = [
        {
            label: 'Obunachilar',
            value: statsData.activeSubscribers.toLocaleString(),
            icon: Users,
            change: `${statsData.restaurantsGrowth > 0 ? '+' : ''}${statsData.restaurantsGrowth.toFixed(1)}%`,
            growthValue: statsData.restaurantsGrowth,
            color: 'blue'
        },
        {
            label: 'Oylik Daromad',
            value: `${(statsData.monthlyRevenue).toLocaleString()} so'm`,
            icon: DollarSign,
            change: `${statsData.revenueGrowth > 0 ? '+' : ''}${statsData.revenueGrowth.toFixed(1)}%`,
            growthValue: statsData.revenueGrowth,
            color: 'green'
        },
        {
            label: "Yillik O'sish",
            value: `${statsData.yearlyGrowth > 0 ? '+' : ''}${statsData.yearlyGrowth.toFixed(1)}%`,
            icon: TrendingUp,
            change: '', // Removed Badge as per plan
            growthValue: statsData.yearlyGrowth,
            color: 'purple'
        },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold">Dashboard</h2>
                {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 max-w-md">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, index) => {
                    const badgeColorClass = getGrowthColor(stat.growthValue);

                    return (
                        <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                {stat.change && (
                                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${badgeColorClass}`}>
                                        {stat.change}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-800">
                                {loading ? "..." : stat.value}
                            </h3>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border h-80 flex flex-col">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">Daromad Grafigi</h3>
                    <div className="flex-1 min-h-0 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={statsData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} so'm`} />
                                <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="#dcfce7" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Subscribers Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border h-80 flex flex-col">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">Obunachilar Grafigi</h3>
                    <div className="flex-1 min-h-0 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statsData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <Tooltip />
                                <Bar dataKey="subscribers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
