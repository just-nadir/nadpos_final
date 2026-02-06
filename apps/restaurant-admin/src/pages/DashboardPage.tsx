import { useEffect, useState, useMemo } from 'react';
import { DollarSign, ShoppingBag, CreditCard, TrendingUp } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { statsApi, getToday, getMonthStartEnd, getLast7Days } from '../services/stats.service';
import { formatMoney, formatInt, formatDateShort } from '../utils/format';

const DEFAULT_STATS = { todaySales: 0, todayOrders: 0, monthSales: 0, avgCheck: 0 };

function ensureArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object' && 'data' in value && Array.isArray((value as { data: T[] }).data)) return (value as { data: T[] }).data;
    return [];
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [todaySales, setTodaySales] = useState<Array<{ id?: string; date?: string; total_amount?: number; items_json?: string }>>([]);
    const [monthSales, setMonthSales] = useState<Array<{ total_amount?: number }>>([]);
    const [trendData, setTrendData] = useState<Array<{ day?: string; total?: number }>>([]);

    useEffect(() => {
        let cancelled = false;
        const fetchStats = async () => {
            try {
                setError(null);
                const today = getToday();
                const month = getMonthStartEnd();
                const last7 = getLast7Days();

                const [salesTodayRes, salesMonthRes, trendRes] = await Promise.all([
                    statsApi.getSales(today, today),
                    statsApi.getSales(month.startDate, month.endDate),
                    statsApi.getTrend(last7.startDate, last7.endDate),
                ]);

                if (cancelled) return;
                setTodaySales(ensureArray(salesTodayRes?.data));
                setMonthSales(ensureArray(salesMonthRes?.data));
                setTrendData(ensureArray(trendRes?.data));
            } catch (e: unknown) {
                if (cancelled) return;
                let msg = "Ma'lumotlarni yuklab bo'lmadi";
                if (e && typeof e === 'object') {
                    const err = e as { response?: { data?: { message?: string }; status?: number }; message?: string; code?: string };
                    if (err.response?.data?.message) msg = err.response.data.message;
                    else if (err.code === 'ERR_NETWORK' || !err.response) msg = "Serverga ulanib bo'lmadi. Backend (NestJS) ni port 3000 da ishga tushiring.";
                }
                setError(msg);
                setTodaySales([]);
                setMonthSales([]);
                setTrendData([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchStats();
        return () => { cancelled = true; };
    }, []);

    type SaleItem = { total_amount?: number };
    type TrendItem = { day?: string; total?: number };

    const stats = useMemo(() => {
        try {
            const arrToday = ensureArray<SaleItem>(todaySales);
            const arrMonth = ensureArray<SaleItem>(monthSales);
            const todayRevenue = arrToday.reduce((s: number, x) => s + (Number(x?.total_amount) || 0), 0);
            const monthRevenue = arrMonth.reduce((s: number, x) => s + (Number(x?.total_amount) || 0), 0);
            const todayOrders = arrToday.length;
            const avgCheck = todayOrders > 0 ? Math.round(todayRevenue / todayOrders) : 0;
            return { todaySales: todayRevenue, todayOrders, monthSales: monthRevenue, avgCheck };
        } catch {
            return DEFAULT_STATS;
        }
    }, [todaySales, monthSales]);

    const chartData = useMemo(() => {
        const arr = ensureArray<TrendItem>(trendData);
        return arr.map(({ day, total }: TrendItem) => ({
            name: formatDateShort(day),
            sales: formatInt(total),
        }));
    }, [trendData]);

    const topProducts = useMemo(() => {
        const map = new Map<string, { qty: number; revenue: number }>();
        const arr = ensureArray<{ items_json?: string }>(todaySales);
        arr.forEach((sale) => {
            try {
                const raw = sale?.items_json;
                if (!raw || typeof raw !== 'string') return;
                const parsed = JSON.parse(raw);
                const items = (parsed?.items && Array.isArray(parsed.items) ? parsed.items : Array.isArray(parsed) ? parsed : []) as Array<{ product_name?: string; name?: string; quantity?: number; qty?: number; price?: number }>;
                items.forEach((item) => {
                    const name = item.product_name || item.name || "Noma'lum";
                    const qty = item.quantity ?? item.qty ?? 0;
                    const revenue = qty * (item.price || 0);
                    const cur = map.get(name) || { qty: 0, revenue: 0 };
                    map.set(name, { qty: cur.qty + qty, revenue: cur.revenue + revenue });
                });
            } catch (_) {}
        });
        return Array.from(map.entries())
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);
    }, [todaySales]);

    const s = stats ?? DEFAULT_STATS;
    const starCards = [
        { title: "Bugungi Savdo", value: formatMoney(s.todaySales), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
        { title: "Bugungi Buyurtmalar", value: formatInt(s.todayOrders), icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: "Oylik Savdo", value: formatMoney(s.monthSales), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        { title: "O'rtacha Chek", value: formatMoney(s.avgCheck), icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    if (loading) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h2>
                <div className="flex items-center justify-center py-20 text-slate-500">Yuklanmoqda...</div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h2>
            {error && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                    {error}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {starCards.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mb-1">{stat.title}</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Haftalik Savdo Dinamikasi</h3>
                    <div className="w-full" style={{ height: 320, minHeight: 320 }}>
                        {chartData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-400" style={{ minHeight: 280 }}>Ma&apos;lumot yo&apos;q</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Bugun eng ko&apos;p sotilganlar</h3>
                    <div className="space-y-4">
                        {topProducts.length === 0 ? (
                            <div className="text-slate-400">Ma&apos;lumot yo&apos;q</div>
                        ) : (
                            topProducts.map((p, i) => (
                                <div key={p.name} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800">{p.name}</p>
                                            <p className="text-xs text-slate-500">{formatMoney(p.revenue)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-800">{formatInt(p.qty)} ta</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
