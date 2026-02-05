import { format, isSameDay, parseISO, addDays, startOfDay } from 'date-fns';
import { uz } from 'date-fns/locale';
import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    Plus,
    Search,
    LayoutGrid,
    List as ListIcon,
    ChevronLeft,
    ChevronRight,
    Columns,
    Kanban as KanbanIcon,
    Filter
} from 'lucide-react';
import { Button } from './ui/button';
import { useGlobal } from '../context/GlobalContext';

// New Components
import ReservationTimeline from './reservations/ReservationTimeline';
import ReservationKanban from './reservations/ReservationKanban';
import ReservationCard from './reservations/ReservationCard';
import CreateReservationSheet from './reservations/CreateReservationSheet';

const ReservationsManagement = () => {
    // --- STATE ---
    const { user } = useGlobal();
    const [reservations, setReservations] = useState([]);
    const [tables, setTables] = useState([]);

    // View State
    const [viewMode, setViewMode] = useState('grid'); // 'grid', 'timeline', 'kanban'
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed', 'cancelled'

    // Modal State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingReservation, setEditingReservation] = useState(null);

    // --- EFFECT: LOAD DATA ---
    useEffect(() => {
        fetchData();

        // Listen for updates
        let cleanup = () => { };
        if (window.electron && window.electron.ipcRenderer) {
            cleanup = window.electron.ipcRenderer.on('reservation-update', () => {
                fetchData();
            });
        }
        return () => cleanup();
    }, [selectedDate]); // Re-fetch when date changes (optional optimization)

    const fetchData = async () => {
        if (window.electron && window.electron.ipcRenderer) {
            try {
                // Parallel fetch
                const [resData, tablesData] = await Promise.all([
                    window.electron.ipcRenderer.invoke('get-reservations'), // Might need date filter in future
                    window.electron.ipcRenderer.invoke('get-tables')
                ]);

                if (Array.isArray(resData)) setReservations(resData);
                if (Array.isArray(tablesData)) setTables(tablesData);
            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        } else {
            // Mock Data
            const now = new Date();
            setReservations([
                { id: 1, customer_name: 'Sardor', customer_phone: '+998 90 123 45 67', reservation_time: now.toISOString(), guests: 4, table_name: 'Stol 5', table_id: '1', status: 'active', note: 'Tug\'ilgan kun', hall_name: 'Asosiy Zal' },
                { id: 2, customer_name: 'Aziz', customer_phone: '+998 99 888 77 66', reservation_time: addDays(now, 1).toISOString(), guests: 2, table_name: 'VIP 1', table_id: '3', status: 'pending', hall_name: 'Terrasa' },
            ]);
            setTables([
                { id: '1', name: '5', hall_name: 'Asosiy Zal', capacity: 4 },
                { id: '2', name: '6', hall_name: 'Asosiy Zal', capacity: 4 },
                { id: '3', name: 'VIP 1', hall_name: 'Terrasa', capacity: 8 },
            ]);
        }
    };

    // --- HANDLERS ---
    const handleSaveReservation = async (data) => {
        try {
            if (window.electron && window.electron.ipcRenderer) {
                if (data.id) {
                    // TODO: Update logic
                    await window.electron.ipcRenderer.invoke('update-reservation', data);
                } else {
                    await window.electron.ipcRenderer.invoke('create-reservation', data);
                }
                fetchData();
            } else {
                // Mock save
                const newRes = { ...data, id: Date.now(), status: 'active', table_name: 'Auto' };
                setReservations(prev => [newRes, ...prev]);
            }
        } catch (error) {
            console.error("Save error", error);
            throw error; // Rethrow for form error handling
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            if (window.electron && window.electron.ipcRenderer) {
                await window.electron.ipcRenderer.invoke('update-reservation-status', { id, status });
                fetchData();
            } else {
                setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
            }
        } catch (error) {
            console.error("Update status error", error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("O'chirilsinmi?")) return;
        try {
            if (window.electron && window.electron.ipcRenderer) {
                await window.electron.ipcRenderer.invoke('delete-reservation', id);
                fetchData();
            } else {
                setReservations(prev => prev.filter(r => r.id !== id));
            }
        } catch (error) {
            console.error("Delete error", error);
        }
    };

    const handleEdit = (res) => {
        setEditingReservation(res);
        setIsSheetOpen(true);
    };

    const openNewSheet = () => {
        setEditingReservation(null);
        setIsSheetOpen(true);
    };

    // --- FILTERING ---
    const filteredReservations = reservations.filter(res => {
        const matchesSearch = res.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
            res.customer_phone?.includes(search);

        let matchesDate = true;
        // Kanban viewda sana muhim emas (yoki alohida mantiq bo'lishi mumkin)
        // Ammo Timeline va Grid uchun sana asosiy filtr
        if (viewMode !== 'kanban') {
            matchesDate = isSameDay(parseISO(res.reservation_time), selectedDate);
        }

        const matchesFilter = filter === 'all' || res.status === filter;

        return matchesSearch && matchesDate && matchesFilter;
    });

    // --- RENDER HELPERS ---
    const changeDate = (days) => {
        const newDate = days === 0 ? new Date() : addDays(selectedDate, days);
        setSelectedDate(newDate);
    };

    return (
        <div className="w-full h-full flex flex-col bg-background text-foreground animate-in fade-in duration-300">
            {/* Header Toolbar */}
            <div className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-30 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">

                {/* Left: Title & Date Nav */}
                <div className="flex items-center gap-4">
                    {/* Date Nav */}
                    <div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border/50">
                        <Button variant="ghost" size="icon" onClick={() => changeDate(-1)} className="h-8 w-8 rounded-lg">
                            <ChevronLeft size={16} />
                        </Button>
                        <div className="flex flex-col items-center px-3 min-w-[140px]">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {isSameDay(selectedDate, new Date()) ? 'Bugun' : format(selectedDate, 'EEEE', { locale: uz })}
                            </span>
                            <span className="text-sm font-bold text-foreground leading-none">
                                {format(selectedDate, 'd MMMM', { locale: uz })}
                            </span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => changeDate(1)} className="h-8 w-8 rounded-lg">
                            <ChevronRight size={16} />
                        </Button>
                    </div>

                    <div className="h-8 w-px bg-border/60 mx-2 hidden md:block"></div>

                    {/* Quick Stats (Optional) */}
                    <div className="hidden lg:flex gap-3 text-sm">
                        <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg font-medium border border-blue-100 dark:border-blue-900/30">
                            {filteredReservations.length} ta bron
                        </div>
                    </div>
                </div>


                {/* Right: Actions & View Switcher */}
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            placeholder="Qidirish..."
                            className="pl-9 h-10 w-full rounded-xl border border-border bg-background hover:bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* View Switcher */}
                    {/* View Switcher - REMOVED AS REQUESTED (Only Grid view remains) */}
                    {/* <div className="flex bg-muted/50 rounded-xl p-1 border border-border/50">
                        {[
                            { id: 'grid', icon: LayoutGrid },
                        ].map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setViewMode(mode.id)}
                                className={`p-2 rounded-lg transition-all text-muted-foreground hover:text-foreground ${viewMode === mode.id ? 'bg-background shadow-sm text-primary' : ''}`}
                            >
                                <mode.icon size={18} />
                            </button>
                        ))}
                    </div> */}

                    <Button
                        onClick={openNewSheet}
                        className="h-10 px-5 bg-gradient-to-r from-indigo-600 to-primary text-white shadow-lg shadow-primary/25 rounded-xl hover:brightness-110 transition-all font-semibold"
                    >
                        <Plus size={18} className="mr-2" /> Yangi Bron
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden p-4 relative">

                {viewMode === 'grid' && (
                    <div className="h-full overflow-y-auto custom-scrollbar pb-20">
                        {filteredReservations.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                {filteredReservations.map(res => (
                                    <ReservationCard
                                        key={res.id}
                                        reservation={res}
                                        onUpdateStatus={handleUpdateStatus}
                                        onDelete={handleDelete}
                                        onEdit={handleEdit}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState onAdd={openNewSheet} />
                        )}
                    </div>
                )}

                {viewMode === 'timeline' && (
                    <div className="h-full">
                        <ReservationTimeline
                            reservations={filteredReservations}
                            tables={tables}
                            onSelectReservation={handleEdit}
                        />
                    </div>
                )}

                {viewMode === 'kanban' && (
                    <ReservationKanban
                        reservations={filteredReservations} // Use all reservations or filtered by date depending on logic
                        onUpdateStatus={handleUpdateStatus}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                    />
                )}
            </div>

            {/* Create/Edit Sheet */}
            <CreateReservationSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                onSave={handleSaveReservation}
                editingReservation={editingReservation}
            />
        </div>
    );
};

const EmptyState = ({ onAdd }) => (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center opacity-0 animate-in fade-in duration-500 fill-mode-forwards" style={{ animationDelay: '100ms' }}>
        <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mb-6">
            <Calendar className="w-10 h-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Bronlar topilmadi</h3>
        <p className="text-muted-foreground mt-2 max-w-sm mb-8">
            Ushbu sana uchun bronlar mavjud emas. Yangi mehmon qo'shish uchun tugmani bosing.
        </p>
        <Button onClick={onAdd} variant="outline" className="border-dashed border-2">
            Yangi bron qo'shish
        </Button>
    </div>
);

export default ReservationsManagement;
