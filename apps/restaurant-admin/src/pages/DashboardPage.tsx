import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, CreditCard, TrendingUp } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
// import api from '../services/api';

// Fake Data for Initial View (until backend is fully populated)
const fakeData = [
    { name: 'Du', sales: 4000 },
    { name: 'Se', sales: 3000 },
    { name: 'Ch', sales: 2000 },
    { name: 'Pa', sales: 2780 },
    { name: 'Ju', sales: 1890 },
    { name: 'Sha', sales: 2390 },
    { name: 'Ya', sales: 3490 },
];

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        todaySales: 0,
        todayOrders: 0,
        monthSales: 0
    });

    useEffect(() => {
        // Fetch stats from backend
        const fetchStats = async () => {
            try {
                // Mock API calls for now or real ones if endpoint exists
                // const res = await api.get('/stats/dashboard');
                // setStats(res.data);

                // Simulation
                setTimeout(() => {
                    setStats({
                        todaySales: 1250000,
                        todayOrders: 45,
                        monthSales: 34000000
                    });
                    setLoading(false);
                }, 1000);
            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const starCards = [
        { title: "Bugungi Savdo", value: `${stats.todaySales.toLocaleString()} so'm`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
        { title: "Bugungi Buyurtmalar", value: stats.todayOrders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: "Oylik Savdo", value: `${stats.monthSales.toLocaleString()} so'm`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        { title: "O'rtacha Chek", value: "25,000 so'm", icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {starCards.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mb-1">{stat.title}</p>
                        <h3 className="text-2xl font-bold text-slate-800">
                            {loading ? <span className="animate-pulse bg-slate-200 h-8 w-24 block rounded"></span> : stat.value}
                        </h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Chart */}
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Haftalik Savdo Dinamikasi</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={fakeData}>
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
                    </div>
                </div>

                {/* Top Products or Recent Orders */}
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Eng ko'p sotilganlar</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold">
                                        {i}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800">Lavash Mini</p>
                                        <p className="text-xs text-slate-500">Fast Food</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-800">145 ta</p>
                                    <p className="text-xs text-green-600">+12%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
