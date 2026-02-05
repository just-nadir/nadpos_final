import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RefreshCw, LogOut, Users, Clock, Coffee,
    CreditCard, CheckCircle2, UtensilsCrossed, Plus, ChefHat
} from 'lucide-react';
import { getHalls, getTables } from '../services/api';
import { getUser, removeUser } from '../utils/storage';
import { useSocket } from '../hooks/useSocket';
import { Button } from '../components/ui/Button';

// Minimalist Table Card
// Minimalist Table Card
const TableCard = ({ table, hallName, showHallName, onClick }) => {
    const getStatusConfig = (status) => {
        switch (status) {
            case 'occupied':
                return {
                    borderColor: 'border-blue-500/50',
                    shadow: 'shadow-blue-900/20',
                    iconColor: 'text-blue-400',
                    accentBg: 'bg-blue-500/10',
                    glow: 'after:bg-blue-500/20',
                    statusText: 'Band'
                };
            case 'payment':
                return {
                    borderColor: 'border-amber-500/50',
                    shadow: 'shadow-amber-900/20',
                    iconColor: 'text-amber-400',
                    accentBg: 'bg-amber-500/10',
                    glow: 'after:bg-amber-500/20',
                    statusText: "To'lov"
                };
            case 'free':
                return {
                    borderColor: 'border-emerald-500/50',
                    shadow: 'shadow-emerald-900/20',
                    iconColor: 'text-emerald-400',
                    accentBg: 'bg-emerald-500/10',
                    glow: 'after:bg-emerald-500/20',
                    statusText: "Bo'sh"
                };
            default:
                return {
                    borderColor: 'border-slate-700',
                    shadow: 'shadow-slate-900/20',
                    iconColor: 'text-slate-500',
                    accentBg: 'bg-slate-800',
                    glow: 'after:bg-slate-700/10',
                    statusText: "Noma'lum"
                };
        }
    };

    const config = getStatusConfig(table.status);

    const formatTime = (time) => {
        if (!time) return '';
        try {
            return new Date(time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
        } catch { return time; }
    };

    return (
        <div
            onClick={() => onClick(table)}
            className={`
                relative p-5 rounded-2xl cursor-pointer transition-none
                bg-[#0f172a] border ${config.borderColor} shadow-lg ${config.shadow}
                overflow-hidden group
                ${table.status !== 'free' ? 'card-minimal' : 'card-minimal opacity-80 hover:opacity-100'}
            `}
        >
            {/* Status Indicator Line */}
            <div className={`absolute top-0 bottom-0 left-0 w-1 ${config.accentBg.replace('/10', '')} opacity-80`} />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full min-h-[120px]">

                {/* Header: Hall & Table Number */}
                <div className="flex justify-between items-start mb-3">
                    <div>
                        {showHallName && (
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{hallName}</span>
                        )}
                        <h3 className="text-2xl font-bold text-white tracking-tight mt-0.5">{table.name}</h3>
                    </div>
                    {/* Status Icon / Badge */}
                    <div className={`p-2 rounded-xl ${config.accentBg} ${config.iconColor} backdrop-blur-sm`}>
                        {table.status === 'occupied' && <Coffee size={18} />}
                        {table.status === 'payment' && <CreditCard size={18} />}
                    </div>
                </div>

                {/* Body: Info or Call to Action */}
                <div className="flex-1 flex flex-col justify-end">
                    {table.status !== 'free' ? (
                        <>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700/50">
                                    <Clock size={12} />
                                    <span>{formatTime(table.start_time)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700/50">
                                    <Users size={12} />
                                    <span className="truncate max-w-[70px]">{table.waiter_name}</span>
                                </div>
                            </div>

                            {table.total_amount > 0 && (
                                <div className="pt-3 border-t border-slate-800/50 flex items-baseline gap-1">
                                    <span className={`text-lg font-bold ${config.iconColor}`}>
                                        {table.total_amount.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium">so'm</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-30 group-hover:opacity-100 transition-opacity">
                            <Plus size={32} className="text-slate-600" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};



// Simplified Filter Tab
const FilterTab = ({ active, children, onClick }) => (
    <button
        onClick={onClick}
        className={`
            relative px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap z-10
            ${active
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }
        `}
    >
        {active && (
            <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-slate-800 border border-slate-700/50 rounded-xl shadow-sm -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
        )}
        {children}
    </button>
);

export default function TablesPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [halls, setHalls] = useState([]);
    const [tables, setTables] = useState([]);
    const [activeHall, setActiveHall] = useState('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Initial user check
    useEffect(() => {
        const storedUser = getUser();
        if (!storedUser) {
            navigate('/login', { replace: true });
            return;
        }
        setUser(storedUser);
        loadData(true);
    }, [navigate]);

    // Data loading function
    const loadData = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const [hallsData, tablesData] = await Promise.all([getHalls(), getTables()]);
            setHalls(hallsData || []);
            setTables(tablesData || []);
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            if (showLoading) setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Socket handler with debounce
    const handleSocketData = useCallback((data) => {
        if (data.type === 'tables' || data.type === 'table-items') {
            // Simple debounce logic is implicitly handled by React state updates for simple cases,
            // but if we want to be safe, we can just call loadData(false)
            // For heavy flickering, we can use a timeout, but loadData(false) should be fast enough.
            // We will rely on loadData(false) not setting loading=true to avoid full flicker.
            loadData(false);
        }
    }, [loadData]);

    useSocket(handleSocketData);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData(false);
    };

    const handleLogout = () => {
        removeUser();
        navigate('/login', { replace: true });
    };

    const handleTableClick = (table) => {
        navigate(`/order/${table.id}`, {
            state: {
                table,
                hallName: halls.find(h => h.id === table.hall_id)?.name || ''
            }
        });
    };

    const filteredTables = tables.filter(t => activeHall === 'all' || t.hall_id === activeHall);

    // Simple Stats
    const stats = {
        total: filteredTables.length,
        occupied: filteredTables.filter(t => t.status === 'occupied').length,
        payment: filteredTables.filter(t => t.status === 'payment').length,
        free: filteredTables.filter(t => t.status === 'free').length,
    };

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col">
            {/* Minimal Header */}
            <header className="sticky top-0 z-50 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 safe-top">
                <div className="px-5 pt-4 pb-0">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
                                <ChefHat size={20} className="text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white leading-none">NadPOS</h1>
                                <p className="text-xs text-slate-500 font-medium mt-1">{user?.name}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing} className="!w-10 !h-10 !p-0 !rounded-full bg-slate-900 border-slate-800">
                                <RefreshCw size={18} className={`text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button variant="danger" size="sm" onClick={handleLogout} className="!w-10 !h-10 !p-0 !rounded-full bg-red-500/10 border-red-500/20 text-red-400">
                                <LogOut size={18} />
                            </Button>
                        </div>
                    </div>

                    {/* Stats Bar (Minimal) */}
                    <div className="flex justify-between items-center px-1 mb-6 text-sm">
                        <div className="text-slate-400">Jami: <span className="text-white font-bold">{stats.total}</span></div>
                        <div className="h-4 w-[1px] bg-slate-800"></div>
                        <div className="text-blue-400">Band: <span className="font-bold">{stats.occupied}</span></div>
                        <div className="h-4 w-[1px] bg-slate-800"></div>
                        <div className="text-amber-400">To'lov: <span className="font-bold">{stats.payment}</span></div>
                        <div className="h-4 w-[1px] bg-slate-800"></div>
                        <div className="text-emerald-400">Bo'sh: <span className="font-bold">{stats.free}</span></div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1 overflow-x-auto px-5 pb-3 scrollbar-hide border-b border-white/5 bg-[#020617]">
                    <FilterTab active={activeHall === 'all'} onClick={() => setActiveHall('all')}>
                        Barchasi
                    </FilterTab>
                    {halls.map(hall => (
                        <FilterTab
                            key={hall.id}
                            active={activeHall === hall.id}
                            onClick={() => setActiveHall(hall.id)}
                        >
                            {hall.name}
                        </FilterTab>
                    ))}
                </div>
            </header>

            {/* Tables Grid */}
            <main className="flex-1 p-5 safe-bottom overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                ) : filteredTables.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredTables.map((table) => (
                            <TableCard
                                key={table.id}
                                table={table}
                                hallName={halls.find(h => h.id === table.hall_id)?.name}
                                showHallName={activeHall === 'all'}
                                onClick={handleTableClick}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                        <UtensilsCrossed size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium opacity-50">Stollar topilmadi</p>
                    </div>
                )}
            </main>
        </div>
    );
}
