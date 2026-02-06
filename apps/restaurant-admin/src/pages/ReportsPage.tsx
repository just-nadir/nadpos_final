import { useState, useEffect, useMemo } from 'react';
import {
    LayoutDashboard,
    Users,
    UtensilsCrossed,
    History,
    Clock,
    Trash2,
    Calendar,
    Filter,
    DollarSign,
    TrendingUp,
    ShoppingBag,
    ChevronLeft,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
} from 'recharts';
import { statsApi, getToday } from '../services/stats.service';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function formatDate(s: string) {
    return new Date(s).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatTime(s: string) {
    return new Date(s).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}

type Sale = {
    id: string;
    date: string;
    total_amount: number;
    subtotal?: number;
    discount?: number;
    payment_method?: string;
    waiter_name?: string;
    guest_count?: number;
    items_json?: string;
    check_number?: number;
    table_name?: string;
};

type Shift = {
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
};

type Cancelled = {
    id: string;
    table_id?: string;
    date: string;
    total_amount: number;
    waiter_name?: string;
    items_json?: string;
    reason?: string;
};

export default function ReportsPage() {
    const today = getToday();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dateRange, setDateRange] = useState({ startDate: today, endDate: today });
    const [salesData, setSalesData] = useState<Sale[]>([]);
    const [trendData, setTrendData] = useState<Array<{ day: string; total: number }>>([]);
    const [shiftsData, setShiftsData] = useState<Shift[]>([]);
    const [cancelledData, setCancelledData] = useState<Cancelled[]>([]);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const [shiftSales, setShiftSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [salesRes, trendRes, shiftsRes, cancelledRes] = await Promise.all([
                statsApi.getSales(dateRange.startDate, dateRange.endDate),
                statsApi.getTrend(dateRange.startDate, dateRange.endDate),
                statsApi.getShifts(dateRange.startDate, dateRange.endDate),
                statsApi.getCancelled(dateRange.startDate, dateRange.endDate),
            ]);
            setSalesData(salesRes.data || []);
            setTrendData(trendRes.data || []);
            setShiftsData(shiftsRes.data || []);
            setCancelledData(cancelledRes.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [dateRange.startDate, dateRange.endDate]);

    const loadShiftDetails = async (shift: Shift) => {
        setLoading(true);
        try {
            const res = await statsApi.getShiftSales(shift.id);
            setShiftSales(res.data || []);
            setSelectedShift(shift);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        let totalRevenue = 0;
        const methodMap: Record<string, number> = {};
        const waiterMap: Record<string, { name: string; revenue: number; count: number; service: number }> = {};
        const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
        const hourlyMap = Array.from({ length: 24 }, (_, i) => ({ hour: i, amount: 0, count: 0 }));

        salesData.forEach((sale) => {
            const amount = sale.total_amount || 0;
            totalRevenue += amount;
            const method = sale.payment_method || 'naqd';
            methodMap[method] = (methodMap[method] || 0) + amount;

            const waiter = sale.waiter_name || "Noma'lum";
            if (!waiterMap[waiter]) waiterMap[waiter] = { name: waiter, revenue: 0, count: 0, service: 0 };
            waiterMap[waiter].revenue += amount;
            waiterMap[waiter].count += 1;

            const hour = new Date(sale.date).getHours();
            if (hourlyMap[hour]) {
                hourlyMap[hour].amount += amount;
                hourlyMap[hour].count += 1;
            }

            try {
                const parsed = JSON.parse(sale.items_json || '[]');
                const items = parsed?.items && Array.isArray(parsed.items) ? parsed.items : (Array.isArray(parsed) ? parsed : []);
                items.forEach((item: { product_name?: string; name?: string; quantity?: number; qty?: number; price?: number }) => {
                    const pName = item.product_name || item.name || 'Noma\'lum';
                    if (!productMap[pName]) productMap[pName] = { name: pName, qty: 0, revenue: 0 };
                    const qty = item.quantity ?? item.qty ?? 0;
                    productMap[pName].qty += qty;
                    productMap[pName].revenue += (item.price || 0) * qty;
                });
            } catch (_) { }
        });

        const paymentMethods = Object.entries(methodMap).map(([name, value]) => ({
            name: name === 'cash' ? 'Naqd' : name === 'card' ? 'Karta' : name === 'debt' ? 'Nasiya' : name,
            value,
        }));
        const waiters = Object.values(waiterMap).sort((a, b) => b.revenue - a.revenue);
        const products = Object.values(productMap).sort((a, b) => b.qty - a.qty);

        return {
            totalRevenue,
            totalOrders: salesData.length,
            avgCheck: salesData.length > 0 ? Math.round(totalRevenue / salesData.length) : 0,
            paymentMethods,
            waiters,
            products,
            hourlySales: hourlyMap,
        };
    }, [salesData]);

    const shiftProducts = useMemo(() => {
        const map: Record<string, { name: string; qty: number; revenue: number }> = {};
        shiftSales.forEach((sale) => {
            try {
                const parsed = JSON.parse(sale.items_json || '[]');
                const items = parsed?.items && Array.isArray(parsed.items) ? parsed.items : (Array.isArray(parsed) ? parsed : []);
                items.forEach((item: { product_name?: string; name?: string; quantity?: number; qty?: number; price?: number }) => {
                    const pName = item.product_name || item.name || 'Noma\'lum';
                    if (!map[pName]) map[pName] = { name: pName, qty: 0, revenue: 0 };
                    const qty = item.quantity ?? item.qty ?? 0;
                    map[pName].qty += qty;
                    map[pName].revenue += (item.price || 0) * qty;
                });
            } catch (_) { }
        });
        return Object.values(map).sort((a, b) => b.qty - a.qty);
    }, [shiftSales]);

    const tabs = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Umumiy' },
        { id: 'staff', icon: Users, label: 'Xodimlar' },
        { id: 'products', icon: UtensilsCrossed, label: 'Menyu' },
        { id: 'history', icon: History, label: 'Tranzaksiyalar' },
        { id: 'shifts', icon: Clock, label: 'Smenalar' },
        { id: 'trash', icon: Trash2, label: 'Bekor Qilingan' },
    ];

    return (
        <div className="flex flex-1 min-h-0">
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">Hisobotlar</h2>
                    <p className="text-sm text-slate-500">Boshqaruv va tahlil</p>
                </div>
                <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 mb-3 flex items-center gap-2">
                            <Calendar size={14} /> Sana oralig&apos;i
                        </p>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange((r) => ({ ...r, startDate: e.target.value }))}
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm mb-2"
                        />
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange((r) => ({ ...r, endDate: e.target.value }))}
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm mb-3"
                        />
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Filter size={16} /> {loading ? 'Yuklanmoqda...' : 'Yangilash'}
                        </button>
                    </div>
                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); if (tab.id === 'shifts') setSelectedShift(null); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                                    activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <tab.icon size={20} /> {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            {activeTab === 'dashboard' && 'Biznes holati'}
                            {activeTab === 'staff' && 'Xodimlar samaradorligi'}
                            {activeTab === 'products' && 'Menyu reytingi'}
                            {activeTab === 'history' && 'Savdo tarixi'}
                            {activeTab === 'shifts' && (selectedShift ? 'Smena tafsilotlari' : 'Smenalar tarixi')}
                            {activeTab === 'trash' && 'Bekor qilinganlar'}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            <Calendar size={14} className="inline mr-1" />
                            {formatDate(dateRange.startDate)} — {formatDate(dateRange.endDate)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500 font-medium">Jami tushum</p>
                        <p className="text-xl font-bold text-slate-800">
                            {selectedShift ? (selectedShift.total_sales || 0).toLocaleString() : stats.totalRevenue.toLocaleString()} so&apos;m
                        </p>
                    </div>
                </div>

                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Jami savdo</p>
                                    <p className="text-2xl font-bold text-slate-800">{stats.totalRevenue.toLocaleString()} so&apos;m</p>
                                </div>
                                <DollarSign className="text-blue-500 h-8 w-8" />
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Cheklar soni</p>
                                    <p className="text-2xl font-bold text-slate-800">{stats.totalOrders}</p>
                                </div>
                                <ShoppingBag className="text-green-500 h-8 w-8" />
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase">O&apos;rtacha chek</p>
                                    <p className="text-2xl font-bold text-slate-800">{stats.avgCheck.toLocaleString()} so&apos;m</p>
                                </div>
                                <TrendingUp className="text-orange-500 h-8 w-8" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-80">
                                <h3 className="font-bold text-slate-800 mb-4">Soatbay savdo</h3>
                                <ResponsiveContainer width="100%" height="90%">
                                    <AreaChart data={stats.hourlySales}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{ fontSize: 11, fill: '#64748b' }} />
                                        <YAxis tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 11, fill: '#64748b' }} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="amount" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-80">
                                <h3 className="font-bold text-slate-800 mb-4">To&apos;lov turlari</h3>
                                <ResponsiveContainer width="100%" height="90%">
                                    <PieChart>
                                        <Pie
                                            data={stats.paymentMethods}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                        >
                                            {stats.paymentMethods.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v: number | undefined) => (v ?? 0).toLocaleString()} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-72">
                            <h3 className="font-bold text-slate-800 mb-4">Savdo dinamikasi (kun)</h3>
                            <ResponsiveContainer width="100%" height="85%">
                                <BarChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="day" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <YAxis tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <Tooltip />
                                    <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {activeTab === 'staff' && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Ofitsiant</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-center">Cheklar</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Jami savdo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats.waiters.length === 0 ? (
                                    <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400">Ma&apos;lumot yo&apos;q</td></tr>
                                ) : (
                                    stats.waiters.map((w) => (
                                        <tr key={w.name} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium text-slate-800">{w.name}</td>
                                            <td className="px-6 py-4 text-center text-slate-600">{w.count} ta</td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-800">{w.revenue.toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Mahsulot</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-center">Sotildi</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Tushum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats.products.length === 0 ? (
                                    <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400">Ma&apos;lumot yo&apos;q</td></tr>
                                ) : (
                                    stats.products.map((p) => (
                                        <tr key={p.name} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                                            <td className="px-6 py-4 text-center text-slate-600">{Math.round(p.qty)} ta</td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-800">{p.revenue.toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">#Chek</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Vaqt</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Stol</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Ofitsiant</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">To&apos;lov</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Summa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {salesData.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Ma&apos;lumot yo&apos;q</td></tr>
                                ) : (
                                    salesData.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-mono text-slate-600">#{s.check_number ?? s.id.slice(0, 8)}</td>
                                            <td className="px-6 py-4 text-sm">{formatTime(s.date)} {formatDate(s.date)}</td>
                                            <td className="px-6 py-4 text-slate-600">{s.table_name ?? '-'}</td>
                                            <td className="px-6 py-4 font-medium text-slate-800">{s.waiter_name ?? 'Kassir'}</td>
                                            <td className="px-6 py-4 text-slate-600">{s.payment_method === 'cash' ? 'Naqd' : s.payment_method === 'card' ? 'Karta' : s.payment_method ?? '-'}</td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-800">{s.total_amount?.toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'shifts' && !selectedShift && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">#</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Kassir</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Ochilishi</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Yopilishi</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Jami savdo</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm w-24"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {shiftsData.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Ma&apos;lumot yo&apos;q</td></tr>
                                ) : (
                                    shiftsData.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-mono text-slate-600">#{s.shift_number ?? '?'}</td>
                                            <td className="px-6 py-4 font-medium text-slate-800">{s.cashier_name ?? "Noma'lum"}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{formatTime(s.start_time)} {formatDate(s.start_time)}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {s.end_time ? `${formatTime(s.end_time)} ${formatDate(s.end_time)}` : 'Ochiq'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-800">{(s.total_sales || 0).toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => loadShiftDetails(s)}
                                                    className="text-slate-600 hover:text-slate-900 text-sm font-medium"
                                                >
                                                    Batafsil
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'shifts' && selectedShift && (
                    <div className="space-y-4">
                        <button
                            onClick={() => { setSelectedShift(null); setShiftSales([]); }}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
                        >
                            <ChevronLeft size={18} /> Ortga
                        </button>
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                            <h3 className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800">
                                Smena #{selectedShift.shift_number ?? selectedShift.id.slice(0, 8)} — {selectedShift.cashier_name}
                            </h3>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-slate-600 text-sm">#Chek</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Vaqt</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Ofitsiant</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Summa</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {shiftSales.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Smenada savdo yo&apos;q</td></tr>
                                    ) : (
                                        shiftSales.map((s) => (
                                            <tr key={s.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 font-mono text-slate-600">#{s.check_number ?? s.id.slice(0, 8)}</td>
                                                <td className="px-6 py-4 text-sm">{formatTime(s.date)} {formatDate(s.date)}</td>
                                                <td className="px-6 py-4 font-medium text-slate-800">{s.waiter_name ?? 'Kassir'}</td>
                                                <td className="px-6 py-4 text-right font-semibold text-slate-800">{s.total_amount?.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {shiftProducts.length > 0 && (
                            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                                <h3 className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800">Smena mahsulotlari</h3>
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Mahsulot</th>
                                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-center">Soni</th>
                                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Summa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {shiftProducts.map((p) => (
                                            <tr key={p.name} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                                                <td className="px-6 py-4 text-center text-slate-600">{Math.round(p.qty)}</td>
                                                <td className="px-6 py-4 text-right font-semibold text-slate-800">{p.revenue.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'trash' && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Stol</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Vaqt</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Ofitsiant</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Sabab</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Summa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cancelledData.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Bekor qilinganlar yo&apos;q</td></tr>
                                ) : (
                                    cancelledData.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-mono text-slate-600">{c.table_id ?? '-'}</td>
                                            <td className="px-6 py-4 text-sm">{formatTime(c.date)} {formatDate(c.date)}</td>
                                            <td className="px-6 py-4 font-medium text-slate-800">{c.waiter_name ?? '-'}</td>
                                            <td className="px-6 py-4 text-slate-600 text-sm">{c.reason ?? '-'}</td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-800">{c.total_amount?.toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
