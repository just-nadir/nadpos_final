import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  LayoutDashboard, Users, UtensilsCrossed, History, Calendar,
  Filter, TrendingUp, DollarSign, CreditCard,
  ShoppingBag, Trash2, ArrowUpRight, ArrowDownRight, Printer, Clock,
  ChevronLeft, Search
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { formatDate, formatTime, formatDateTime } from '../utils/dateUtils';
import { cn } from '../utils/cn';
import { Button } from './ui/button';
import SaleDetailModal from './SaleDetailModal';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 rounded-xl shadow-xl text-popover-foreground text-sm">
        <p className="font-bold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="font-medium text-xs">
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Reports = () => {
  const { settings, showToast } = useGlobal();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [salesData, setSalesData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [cancelledData, setCancelledData] = useState([]);
  const [shiftsData, setShiftsData] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [shiftSales, setShiftSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shiftViewMode, setShiftViewMode] = useState('orders');

  const [dateRange, setDateRange] = useState({
    startDate: getTodayDate(),
    endDate: getTodayDate()
  });

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    if (!window.electron) return;
    setLoading(true);
    try {
      const { ipcRenderer } = window.electron;

      // Convert local date string (YYYY-MM-DD) to Date object at start of day
      const start = new Date(dateRange.startDate);
      start.setHours(0, 0, 0, 0);

      // Convert local date string to Date object at end of day
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);

      const range = {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      };

      const [sData, cData, tData, shifts] = await Promise.all([
        ipcRenderer.invoke('get-sales', range),
        ipcRenderer.invoke('get-cancelled-orders', range),
        ipcRenderer.invoke('get-sales-trend', range),
        ipcRenderer.invoke('get-shifts', range)
      ]);

      setSalesData(sData || []);
      setCancelledData(cData || []);
      setTrendData(tData || []);
      setShiftsData(shifts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadShiftDetails = async (shift) => {
    console.log("loadShiftDetails called for shift:", shift);
    if (!window.electron) {
      console.error("Window.electron is missing!");
      return;
    }
    setLoading(true);
    try {
      const { ipcRenderer } = window.electron;
      console.log("Invoking get-sales-by-shift...");
      const sales = await ipcRenderer.invoke('get-sales-by-shift', shift.id);
      console.log("Sales received:", sales);
      setShiftSales(sales || []);
      setSelectedShift(shift);
    } catch (err) {
      console.error("loadShiftDetails error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- ANALYTICS ---
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalOrders = salesData.length;
    let methodMap = {};
    let waiterMap = {};
    let productMap = {};
    let hourlyMap = new Array(24).fill(0).map((_, i) => ({ hour: i, amount: 0, count: 0 }));

    salesData.forEach(sale => {
      const amount = sale.total_amount || 0;
      totalRevenue += amount;
      const subtotal = sale.subtotal || amount;
      const discount = sale.discount || 0;
      const serviceCharge = amount - subtotal + discount;

      const method = sale.payment_method || 'naqd';

      if (method === 'split') {
        try {
          const parsed = JSON.parse(sale.items_json || '{}');
          if (parsed.paymentDetails && Array.isArray(parsed.paymentDetails)) {
            parsed.paymentDetails.forEach(d => {
              const m = d.method || 'boshqa';
              methodMap[m] = (methodMap[m] || 0) + (d.amount || 0);
            });
          } else {
            // Fallback if structure is missing
            methodMap['split'] = (methodMap['split'] || 0) + amount;
          }
        } catch (e) {
          methodMap['split'] = (methodMap['split'] || 0) + amount;
        }
      } else {
        methodMap[method] = (methodMap[method] || 0) + amount;
      }

      const waiter = sale.waiter_name || "Noma'lum";
      if (!waiterMap[waiter]) {
        waiterMap[waiter] = { name: waiter, revenue: 0, count: 0, guests: 0, service: 0 };
      }
      waiterMap[waiter].revenue += amount;
      waiterMap[waiter].count += 1;
      waiterMap[waiter].guests += (sale.guest_count || 0);
      waiterMap[waiter].service += serviceCharge;

      const hour = new Date(sale.date).getHours();
      if (hourlyMap[hour]) {
        hourlyMap[hour].amount += amount;
        hourlyMap[hour].count += 1;
      }

      try {
        let items = [];
        const parsed = JSON.parse(sale.items_json || '[]');

        // Handle split payment structure { items: [], paymentDetails: [] }
        if (parsed.items && Array.isArray(parsed.items)) {
          items = parsed.items;
        } else if (Array.isArray(parsed)) {
          items = parsed;
        }

        items.forEach(item => {
          const pName = item.product_name || item.name;
          if (!productMap[pName]) productMap[pName] = { name: pName, qty: 0, revenue: 0 };
          productMap[pName].qty += (item.quantity || item.qty);
          productMap[pName].revenue += (item.price * (item.quantity || item.qty));
        });
      } catch (e) { }
    });

    return {
      totalRevenue,
      totalOrders,
      avgCheck: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      paymentMethods: Object.entries(methodMap).map(([name, value]) => ({ name: name === 'cash' ? 'Naqd' : name === 'card' ? 'Karta' : name === 'debt' ? 'Nasiya' : name, value })),
      waiters: Object.values(waiterMap).sort((a, b) => b.revenue - a.revenue),
      products: Object.values(productMap).sort((a, b) => b.qty - a.qty),
      hourlySales: hourlyMap
    };
  }, [salesData]);

  const shiftProducts = useMemo(() => {
    if (!shiftSales || shiftSales.length === 0) return [];
    let productMap = {};
    shiftSales.forEach(sale => {
      try {
        let items = [];
        const parsed = JSON.parse(sale.items_json || '[]');
        if (parsed.items && Array.isArray(parsed.items)) {
          items = parsed.items;
        } else if (Array.isArray(parsed)) {
          items = parsed;
        }
        items.forEach(item => {
          const pName = item.product_name || item.name;
          if (!productMap[pName]) productMap[pName] = { name: pName, qty: 0, revenue: 0 };
          productMap[pName].qty += (item.quantity || item.qty);
          productMap[pName].revenue += (item.price * (item.quantity || item.qty));
        });
      } catch (e) { }
    });
    return Object.values(productMap).sort((a, b) => b.qty - a.qty);
  }, [shiftSales]);

  // --- RENDERERS ---

  // --- SORTING STATE ---
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Reset sort when tab changes
  useEffect(() => {
    setSortConfig({ key: null, direction: 'asc' });
  }, [activeTab]);

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortedData = (data, config) => {
    if (!config.key) return data;

    return [...data].sort((a, b) => {
      let aValue = a[config.key];
      let bValue = b[config.key];

      // Handle nested values or special keys if needed (e.g. date string vs object)
      // Custom sorting for specific fields can be handled here or by normalizing data before

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return config.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // --- RENDERERS ---

  const KPICard = ({ title, value, subValue, icon: Icon, colorClass, delay = 0 }) => (
    <div className={cn(
      "bg-card p-6 rounded-2xl border border-border shadow-sm flex justify-between items-start hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2",
      `delay-[${delay}ms]`
    )}>
      <div>
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-black text-foreground">{value}</h3>
        {subValue && <p className="text-xs text-muted-foreground mt-1 font-medium">{subValue}</p>}
      </div>
      <div className={cn("p-3 rounded-xl", colorClass)}>
        <Icon size={24} />
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          title="Jami Savdo"
          value={`${stats.totalRevenue.toLocaleString()} so'm`}
          icon={DollarSign}
          colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <KPICard
          title="Cheklar Soni"
          value={stats.totalOrders}
          subValue="ta savdo qilindi"
          icon={ShoppingBag}
          colorClass="bg-green-500/10 text-green-600 dark:text-green-400"
          delay={100}
        />
        <KPICard
          title="O'rtacha Chek"
          value={`${stats.avgCheck.toLocaleString()} so'm`}
          icon={TrendingUp}
          colorClass="bg-orange-500/10 text-orange-600 dark:text-orange-400"
          delay={200}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Hourly Trend */}
        <div className="xl:col-span-2 bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col h-[400px]">
          <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
            <Calendar size={18} className="text-primary" /> Soatbay Savdo Dinamikasi
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.hourlySales}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tickFormatter={(val) => `${val / 1000}k`} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" stroke="#3B82F6" fillOpacity={1} fill="url(#colorAmount)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col h-[400px]">
          <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
            <CreditCard size={18} className="text-primary" /> To'lov Turlari
          </h3>
          <div className="flex-1 w-full min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
              <div className="text-center">
                <span className="text-[10px] text-muted-foreground font-bold block uppercase">JAMI</span>
                <span className="text-lg font-black text-foreground">{stats.totalRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Trend (30 Days) */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col h-[350px]">
        <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" /> Savdo Dinamikasi (Kuny)
        </h3>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tickFormatter={(val) => `${val / 1000}k`} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
              <Bar dataKey="total" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const handleSaleClick = (sale) => {
    // Normalize data structure for Modal if needed
    const modalData = {
      ...sale,
      amount: sale.total_amount,
      items: sale.items_json // Passed as generic items JSON string or object
    };
    setSelectedSale(modalData);
    setIsSaleModalOpen(true);
  };

  const SortableTable = ({ columns, data, emptyMessage, onRowDoubleClick }) => {
    const sortedData = getSortedData(data, sortConfig);

    return (
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm animate-in fade-in duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className={cn(
                      "px-6 py-4 font-bold text-muted-foreground text-xs uppercase tracking-wider cursor-pointer hover:bg-muted/80 transition-colors select-none group",
                      col.className
                    )}
                    onClick={() => col.key && handleSort(col.key)}
                  >
                    <div className={cn("flex items-center gap-2", col.headerAlign || "justify-start")}>
                      {col.label}
                      {col.key && (
                        <div className="flex flex-col opacity-0 group-hover:opacity-50 data-[active=true]:opacity-100" data-active={sortConfig.key === col.key}>
                          {sortConfig.key === col.key && sortConfig.direction === 'desc' ? (
                            <ArrowDownRight size={14} className="text-primary" />
                          ) : sortConfig.key === col.key && sortConfig.direction === 'asc' ? (
                            <ArrowUpRight size={14} className="text-primary" />
                          ) : (
                            <ArrowUpRight size={14} />
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedData.length > 0 ? sortedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn("hover:bg-muted/50 transition-colors", onRowDoubleClick && "cursor-pointer active:bg-muted/70")}
                  onDoubleClick={() => onRowDoubleClick && onRowDoubleClick(row)}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={cn("px-6 py-4", col.cellClassName)}>
                      {col.render ? col.render(row, rowIndex) : row[col.key]}
                    </td>
                  ))}
                </tr>
              )) : (
                <tr>
                  <td colSpan={columns.length} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <History size={48} strokeWidth={1} className="opacity-20" />
                      <p>{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderStaff = () => {
    const columns = [
      {
        label: "Ofitsiant Ismi",
        key: "name",
        render: (w) => (
          <div className="font-bold text-foreground flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
              {w.name.charAt(0)}
            </div>
            {w.name}
          </div>
        )
      },
      { label: "Cheklar", key: "count", className: "text-center", headerAlign: "justify-center", cellClassName: "text-center text-muted-foreground font-medium", render: (w) => `${w.count} ta` },
      // settings.serviceChargeType === 'fixed' check removed, so we hide guests column as it was hidden for 'percent' before.
      // If we want to show it always, we could, but let's stick to removal to match 'percent' behavior.
      // Actually, let's just remove the line.

      { label: "Xizmat Haqi", key: "service", className: "text-right", headerAlign: "justify-end", cellClassName: "text-right font-medium text-orange-500", render: (w) => Math.round(w.service).toLocaleString() },
      { label: "Jami Savdo", key: "revenue", className: "text-right", headerAlign: "justify-end", cellClassName: "text-right font-bold text-foreground", render: (w) => w.revenue.toLocaleString() }
    ].filter(Boolean);

    return <SortableTable columns={columns} data={stats.waiters} emptyMessage="Xodimlar bo'yicha ma'lumot yo'q" />;
  };

  const renderProducts = () => {
    const columns = [
      {
        label: "Taom Nomi",
        key: "name",
        render: (p, i) => (
          <div className="font-bold text-foreground flex items-center gap-3">
            <span className="text-muted-foreground/50 w-6 text-sm font-mono">#{i + 1}</span>
            {p.name}
          </div>
        )
      },
      { label: "Sotildi (soni)", key: "qty", className: "text-center", headerAlign: "justify-center", cellClassName: "text-center text-muted-foreground font-medium" },
      { label: "Jami Tushum", key: "revenue", className: "text-right", headerAlign: "justify-end", cellClassName: "text-right font-bold text-primary", render: (p) => p.revenue.toLocaleString() }
    ];
    return <SortableTable columns={columns} data={stats.products} emptyMessage="Mahsulotlar bo'yicha ma'lumot yo'q" />;
  };

  const renderHistory = () => {
    const columns = [
      { label: "#Chek", key: "check_number", className: "w-24", cellClassName: "font-mono text-muted-foreground text-sm", render: (s) => `#${s.check_number || s.id}` },
      {
        label: "Vaqt",
        key: "date",
        render: (s) => (
          <div className="text-sm">
            <div className="font-bold text-foreground">{formatTime(s.date)}</div>
            <div className="text-xs text-muted-foreground">{formatDate(s.date)}</div>
          </div>
        )
      },
      { label: "Stol", key: "table_name", cellClassName: "text-sm text-foreground font-medium", render: (s) => s.table_name || "-" },
      { label: "Ofitsiant", key: "waiter_name", cellClassName: "font-medium text-foreground", render: (s) => s.waiter_name || "Kassir" },
      { label: "Mijoz", key: "customer_name", cellClassName: "text-sm text-muted-foreground", render: (s) => s.customer_name || "-" },
      {
        label: "To'lov Turi",
        key: "payment_method",
        render: (s) => {
          if (s.payment_method === 'split') {
            try {
              const parsed = JSON.parse(s.items_json || '{}');
              const details = parsed.paymentDetails || [];

              return (
                <div className="flex flex-col gap-1.5 items-start">
                  {details.map((d, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border flex items-center gap-1.5",
                        d.method === 'cash' ? "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-500" :
                          d.method === 'card' ? "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-500" :
                            d.method === 'debt' ? "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-500" :
                              "bg-secondary text-muted-foreground border-border"
                      )}
                    >
                      <span>{d.method === 'cash' ? 'Naqd' : d.method === 'card' ? 'Karta' : d.method === 'click' ? 'Click' : d.method}:</span>
                      <span className="font-black opacity-80">{(d.amount || 0).toLocaleString()}</span>
                    </span>
                  ))}
                </div>
              );
            } catch (e) {
              return <span className="bg-secondary px-2 py-1 rounded text-xs">Split</span>;
            }
          }

          return (
            <span className={cn(
              "px-2.5 py-1 rounded-md text-xs font-bold uppercase border",
              s.payment_method === 'cash' ? "bg-green-500/10 text-green-600 border-green-500/20" :
                s.payment_method === 'card' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                  s.payment_method === 'debt' ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-secondary text-muted-foreground border-border"
            )}>
              {s.payment_method === 'cash' ? 'Naqd' : s.payment_method === 'card' ? 'Karta' : s.payment_method === 'debt' ? 'Nasiya' : s.payment_method}
            </span>
          );
        }
      },
      { label: "Summa", key: "total_amount", className: "text-right", headerAlign: "justify-end", cellClassName: "text-right font-black text-foreground", render: (s) => s.total_amount?.toLocaleString() }

    ];
    return <SortableTable columns={columns} data={salesData} emptyMessage="Hech qanday savdo tarixi yo'q" onRowDoubleClick={handleSaleClick} />;
  };

  const renderCancelledOrders = () => {
    // Need to normalize data slightly for cleaner sorting if needed, but table_id work
    const columns = [
      { label: "Nomi", key: "table_id", className: "w-24", cellClassName: "font-mono text-muted-foreground text-sm" },
      {
        label: "Vaqt",
        key: "date",
        render: (order) => (
          <div className="text-sm">
            <div className="font-bold text-foreground">{formatTime(order.date)}</div>
            <div className="text-xs text-muted-foreground">{formatDate(order.date)}</div>
          </div>
        )
      },
      { label: "Ofitsiant", key: "waiter_name", cellClassName: "font-medium text-foreground" },
      { label: "Sabab", key: "reason", cellClassName: "text-sm text-destructive font-medium italic", render: (o) => `"${o.reason}"` },
      {
        label: "Tarkibi",
        key: "items_json", // Sort by json string... not ideal but workable, or custom sort logic
        cellClassName: "text-sm text-foreground max-w-xs break-words",
        render: (order) => {
          let items = [];
          try { items = JSON.parse(order.items_json); } catch (e) { }
          return items.map(i => `${i.product_name || i.name} x${i.quantity || i.qty}`).join(', ');
        }
      },
      { label: "Summa", key: "total_amount", className: "text-right", headerAlign: "justify-end", cellClassName: "text-right font-black text-foreground", render: (o) => o.total_amount?.toLocaleString() }
    ];
    return <SortableTable columns={columns} data={cancelledData} emptyMessage="Bekor qilingan buyurtmalar yo'q" />;
  };

  const renderShifts = () => {
    const columns = [
      {
        label: "#",
        key: "shift_number",
        className: "w-16 text-center",
        headerAlign: "justify-center",
        cellClassName: "font-mono font-bold text-center text-muted-foreground",
        render: (s) => `#${s.shift_number || '?'}`
      },
      {
        label: "Kassir",
        key: "cashier_name",
        render: (s) => (
          <div className="font-bold text-foreground flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
              {(s.cashier_name || 'K').charAt(0)}
            </div>
            {s.cashier_name || "Noma'lum"}
          </div>
        )
      },
      {
        label: "Ochilishi",
        key: "start_time",
        render: (s) => (
          <div className="text-sm">
            <div className="font-bold text-foreground">{formatTime(s.start_time)}</div>
            <div className="text-xs text-muted-foreground">{formatDate(s.start_time)}</div>
          </div>
        )
      },
      {
        label: "Yopilishi",
        key: "end_time",
        render: (s) => s.end_time ? (
          <div className="text-sm">
            <div className="font-bold text-foreground">{formatTime(s.end_time)}</div>
            <div className="text-xs text-muted-foreground">{formatDate(s.end_time)}</div>
          </div>
        ) : <span className="bg-green-500/10 text-green-600 px-2 py-1 rounded text-xs font-bold uppercase">Ochiq</span>
      },
      { label: "Naqd", key: "total_cash", className: "text-right", headerAlign: "justify-end", cellClassName: "text-right font-medium text-muted-foreground", render: (s) => (s.total_cash || 0).toLocaleString() },
      { label: "Karta", key: "total_card", className: "text-right", headerAlign: "justify-end", cellClassName: "text-right font-medium text-muted-foreground", render: (s) => (s.total_card || 0).toLocaleString() },
      { label: "Click", key: "total_transfer", className: "text-right", headerAlign: "justify-end", cellClassName: "text-right font-medium text-muted-foreground", render: (s) => (s.total_transfer || 0).toLocaleString() },
      {
        label: "Qarz",
        key: "debt",
        className: "text-right",
        headerAlign: "justify-end",
        cellClassName: "text-right font-medium text-red-500",
        render: (s) => (s.total_debt || 0).toLocaleString()
      },
      { label: "Jami Savdo", key: "total_sales", className: "text-right", headerAlign: "justify-end", cellClassName: "text-right font-black text-foreground", render: (s) => (s.total_sales || 0).toLocaleString() },
      {
        label: "",
        key: "actions",
        className: "w-12",
        render: (s) => (
          <Button variant="ghost" size="icon" onClick={() => loadShiftDetails(s)}>
            <Search size={16} className="text-muted-foreground" />
          </Button>
        )
      }
    ];

    // SortableTable likely doesn't support onRowDoubleClick directly from here without checking props, 
    // so we added an explicit action button for clarity and reliability.
    return <SortableTable columns={columns} data={shiftsData} emptyMessage="Smenalar tarixi topilmadi" />;
  };

  const renderShiftDetails = () => {
    // Reuse renderHistory columns/logic but for shiftSales
    // This is a simplified version of renderHistory tailored for this view
    if (!selectedShift) return null;

    const columns = [
      { label: "#Chek", key: "check_number", className: "w-20 font-bold text-muted-foreground", render: (s) => `#${s.check_number || s.id.slice(0, 8)}` },
      {
        label: "Vaqt",
        key: "date",
        render: (s) => (
          <div className="flex flex-col">
            <span className="font-bold text-foreground">{formatTime(s.date)}</span>
            <span className="text-[10px] text-muted-foreground">{formatDate(s.date)}</span>
          </div>
        )
      },
      { label: "Ofitsiant", key: "waiter_name", cellClassName: "font-medium text-foreground", render: (s) => s.waiter_name || "Kassir" },
      { label: "Mijoz", key: "customer_name", cellClassName: "text-sm text-muted-foreground", render: (s) => s.customer_name || "-" },
      {
        label: "To'lov Turi",
        key: "payment_method",
        render: (s) => {
          if (s.payment_method === 'split') {
            try {
              const parsed = JSON.parse(s.items_json || '{}');
              const details = parsed.paymentDetails || [];

              return (
                <div className="flex flex-col gap-1.5 items-start">
                  {details.map((d, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border flex items-center gap-1.5",
                        d.method === 'cash' ? "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-500" :
                          d.method === 'card' ? "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-500" :
                            d.method === 'debt' ? "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-500" :
                              "bg-secondary text-muted-foreground border-border"
                      )}
                    >
                      <span>{d.method === 'cash' ? 'Naqd' : d.method === 'card' ? 'Karta' : d.method === 'click' ? 'Click' : d.method}:</span>
                      <span className="font-black opacity-80">{(d.amount || 0).toLocaleString()}</span>
                    </span>
                  ))}
                </div>
              );
            } catch (e) {
              return <span className="bg-secondary px-2 py-1 rounded text-xs">Split</span>;
            }
          }

          return (
            <span className={cn(
              "px-2.5 py-1 rounded-md text-xs font-bold uppercase border",
              s.payment_method === 'cash' ? "bg-green-500/10 text-green-600 border-green-500/20" :
                s.payment_method === 'card' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                  s.payment_method === 'debt' ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-secondary text-muted-foreground border-border"
            )}>
              {s.payment_method === 'cash' ? 'Naqd' : s.payment_method === 'card' ? 'Karta' : s.payment_method === 'debt' ? 'Nasiya' : s.payment_method}
            </span>
          );
        }
      },
      { label: "Summa", key: "total_amount", className: "text-right", headerAlign: "justify-end", cellClassName: "text-right font-black text-foreground", render: (s) => s.total_amount?.toLocaleString() }
    ];

    const handlePrintShiftProducts = async () => {
      if (!window.electron) return;
      try {
        await window.electron.ipcRenderer.invoke('print-shift-products', { shift: selectedShift, products: shiftProducts });
        showToast('success', "Smena mahsulotlari chop etilmoqda...");
      } catch (error) {
        console.error(error);
        showToast('error', "Chop etishda xatolik yuz berdi");
      }
    };

    const productColumns = [
      {
        label: "Mahsulot Nomi",
        key: "name",
        render: (p, i) => (
          <div className="font-bold text-foreground flex items-center gap-3">
            <span className="text-muted-foreground/50 w-6 text-sm font-mono">#{i + 1}</span>
            {p.name}
          </div>
        )
      },
      { label: "Sotilgan Soni", key: "qty", className: "text-center", headerAlign: "justify-center", cellClassName: "text-center font-bold text-muted-foreground" },
      { label: "Jami Summa", key: "revenue", className: "text-right", headerAlign: "justify-end", cellClassName: "text-right font-black text-primary", render: (p) => p.revenue.toLocaleString() }
    ];

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setSelectedShift(null)} className="gap-2">
              <ChevronLeft size={16} /> Ortga
            </Button>
            <div>
              <h3 className="text-lg font-bold">Smena Tafsilotlari <span className="text-muted-foreground ml-2">#{selectedShift.shift_number || selectedShift.id.substring(0, 6)}</span></h3>
              <p className="text-sm text-muted-foreground">
                Kassir: {selectedShift.cashier_name} | {formatDateTime(selectedShift.start_time)}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex bg-secondary p-1 rounded-lg border border-border">
              <button
                onClick={() => setShiftViewMode('orders')}
                className={cn("px-4 py-1.5 rounded-md text-sm font-bold transition-all", shiftViewMode === 'orders' ? "bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground")}
              >Cheklar</button>
              <button
                onClick={() => setShiftViewMode('products')}
                className={cn("px-4 py-1.5 rounded-md text-sm font-bold transition-all", shiftViewMode === 'products' ? "bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground")}
              >Mahsulotlar</button>
            </div>

            {shiftViewMode === 'products' && (
              <Button onClick={handlePrintShiftProducts} variant="default" className="gap-2 shadow-lg shadow-primary/20">
                <Printer size={16} /> Chop etish
              </Button>
            )}
          </div>
        </div>

        {shiftViewMode === 'orders' ? (
          <SortableTable columns={columns} data={shiftSales} emptyMessage="Bu smenada savdo bo'lmagan" onRowDoubleClick={handleSaleClick} />
        ) : (
          <SortableTable columns={productColumns} data={shiftProducts} emptyMessage="Smenada mahsulotlar sotilmagan" />
        )}
      </div>
    );
  };

  return (
    <div className="flex w-full h-full bg-background font-sans relative">
      {/* SIDEBAR FILTERS */}
      <div className="w-80 bg-card border-r border-border flex flex-col h-full shadow-sm z-20 shrink-0 transition-all">
        <div className="p-6 pb-2 border-b border-border/50">
          <h2 className="text-3xl font-black text-foreground mb-1 tracking-tight">Hisobotlar</h2>
          <p className="text-sm text-muted-foreground font-bold">Boshqaruv va Tahlil</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          <div className="bg-secondary/10 p-5 rounded-2xl border border-border">
            <p className="text-xs font-black text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
              <Calendar size={14} /> Sana Oralig'i
            </p>
            <div className="space-y-3">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-border bg-card text-lg font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-border bg-card text-lg font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              />
            </div>
            <Button
              onClick={loadData}
              disabled={loading}
              className="w-full mt-5 font-bold h-12 text-lg shadow-lg shadow-primary/20 active:scale-95"
            >
              {loading ? "Yuklanmoqda..." : <><Filter size={20} className="mr-2" /> Yangilash</>}
            </Button>
          </div>

          <div className="space-y-2">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: "Umumiy" },
              { id: 'staff', icon: Users, label: "Xodimlar" },
              { id: 'products', icon: UtensilsCrossed, label: "Menyu" },
              { id: 'history', icon: History, label: "Tranzaksiyalar" },
              { id: 'shifts', icon: Clock, label: "Smenalar" },
              { id: 'trash', icon: Trash2, label: "Bekor Qilingan" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full text-left px-5 h-14 rounded-2xl font-bold text-lg flex items-center gap-4 transition-all",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:translate-x-1"
                )}
              >
                <tab.icon size={24} strokeWidth={2.5} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <div className="bg-card h-24 px-8 flex items-center justify-between border-b border-border shrink-0 z-10 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
              {activeTab === 'dashboard' && "Biznes Holati"}
              {activeTab === 'staff' && "Xodimlar Samaradorligi"}
              {activeTab === 'products' && "Menyu Reytingi"}
              {activeTab === 'history' && "Savdo Tarixi"}
              {activeTab === 'shifts' && "Smenalar Tarixi"}
              {activeTab === 'trash' && "Bekor Qilinganlar"}
            </h1>
            <p className="text-muted-foreground text-sm font-bold mt-1 flex items-center gap-2 bg-secondary/30 px-3 py-1 rounded-lg w-fit">
              <Calendar size={14} /> {formatDate(dateRange.startDate)} — {formatDate(dateRange.endDate)}
            </p>
          </div>

          <div className="flex gap-8 bg-secondary/10 p-2 rounded-2xl border border-border">
            <div className="text-right px-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                {selectedShift ? "Smena Tushumi" : "Jami Tushum"}
              </p>
              <p className="text-2xl font-black text-primary">
                {selectedShift
                  ? (selectedShift.total_sales || 0).toLocaleString()
                  : stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="text-right border-l border-border pl-8 pr-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                {selectedShift ? "Smena Cheklari" : "Cheklar"}
              </p>
              <p className="text-2xl font-black text-foreground">
                {selectedShift ? shiftSales.length : stats.totalOrders}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-8 pb-32 bg-secondary/5 scrollbar-thin">
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'staff' && renderStaff()}
            {activeTab === 'products' && renderProducts()}
            {activeTab === 'history' && renderHistory()}
            {activeTab === 'shifts' && !selectedShift && renderShifts()}
            {activeTab === 'shifts' && selectedShift && renderShiftDetails()}
            {activeTab === 'trash' && renderCancelledOrders()}
          </div>
        </div>
      </div>

      <SaleDetailModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        sale={selectedSale}
        checkNumber={selectedSale?.check_number || selectedSale?.id?.slice(0, 8)}
      />
    </div>
  );
};

export default Reports;