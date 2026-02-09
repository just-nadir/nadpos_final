import React, { useState, useEffect } from 'react';
import {
  Users, Clock, Receipt, Hash, User, Search, ArrowRight, Calendar, AlertCircle
} from 'lucide-react';
import { useIpcListener } from '../hooks/useIpcListener';
import { appLog } from '../utils/appLog';
import { useGlobal } from '../context/GlobalContext';
import { formatDate, formatTime } from '../utils/dateUtils';
import { cn } from '../utils/cn';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

/* ... Imports remain ... */
/* ... Imports remain ... */
import MenuModal from './MenuModal';



// --- NEW ORDER MODAL ---


const TablesGrid = ({ onSelectTable, selectedTableId }) => { // Accepted selectedTableId prop
  const [tables, setTables] = useState([]);
  const [halls, setHalls] = useState([]);
  const [reservations, setReservations] = useState([]); // New State
  const [activeHallId, setActiveHallId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showFree, setShowFree] = useState(false);
  // Modal State
  const [menuModal, setMenuModal] = useState({ isOpen: false, table: null });


  const { settings } = useGlobal();

  const loadData = async () => {
    try {
      if (window.electron && window.electron.ipcRenderer) {
        const [hallsData, tablesData, reservationsData] = await Promise.all([
          window.electron.ipcRenderer.invoke('get-halls'),
          window.electron.ipcRenderer.invoke('get-tables'),
          window.electron.ipcRenderer.invoke('get-reservations'), // Fetch reservations
        ]);

        setHalls(hallsData || []);
        setTables(tablesData || []);
        setReservations(reservationsData || []);
      }
    } catch (error) {
      appLog.error('TablesGrid', 'Ma\'lumot yuklash xatosi', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useIpcListener('db-change', (event, data) => {
    if (['halls', 'tables', 'sales', 'table-items', 'reservations'].includes(data.type)) {
      loadData();
    }
  });

  useIpcListener('reservation-update', () => { // Listen for explicit reservation updates
    loadData();
  });

  const filteredTables = tables.filter(table => {
    const isHallMatch = activeHallId === 'all' || table.hall_id === activeHallId;
    const isActiveStatus = showFree ? table.status === 'free' : table.status !== 'free';
    return isHallMatch && isActiveStatus;
  });

  // Sort: Hall Order -> Status -> Name
  const sortedTables = [...filteredTables].sort((a, b) => {
    // 1. Hall Order
    const hallAIndex = halls.findIndex(h => h.id === a.hall_id);
    const hallBIndex = halls.findIndex(h => h.id === b.hall_id);
    if (hallAIndex !== hallBIndex) return hallAIndex - hallBIndex;

    // 2. Status Priority
    const statusOrder = { 'payment': 0, 'occupied': 1, 'reserved': 2, 'free': 3 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }

    // 3. Name (Numeric awareness)
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });

  /* ... Helper functions ... */

  const handleTableClick = (table) => {
    const hall = halls.find(h => h.id === table.hall_id);
    const displayName = hall ? `${hall.name} ${table.name}` : table.name;
    onSelectTable({ ...table, displayName });
  };

  const handleTableDoubleClick = (table) => {
    // Agar stol bo'sh, band yoki to'lov holatida bo'lsa (qo'shimcha buyurtma uchun)
    if (table.status === 'free' || table.status === 'occupied' || table.status === 'payment') {
      const hall = halls.find(h => h.id === table.hall_id);
      const displayName = hall ? `${hall.name} ${table.name}` : table.name;
      setMenuModal({ isOpen: true, table: { ...table, name: displayName } });
    }
  };

  const handleMenuClose = () => {
    setMenuModal({ isOpen: false, table: null });
    if (showFree) {
      setShowFree(false);
    }
    if (menuModal.table) {
      onSelectTable(menuModal.table);
    }
  };

  const getStatusColor = (status, isSelected) => {
    if (isSelected) return 'bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2 ring-offset-background';
    switch (status) {
      case 'occupied': return 'bg-blue-50/50 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:border-blue-800 dark:hover:bg-blue-900/50';
      case 'payment': return 'bg-yellow-50/50 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-950/40 dark:border-yellow-800 dark:hover:bg-yellow-900/50';
      case 'reserved': return 'bg-purple-50/50 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/40 dark:border-purple-800 dark:hover:bg-purple-900/50';
      case 'free': return 'bg-card border-border hover:bg-secondary/50 dark:hover:bg-secondary/20';
      default: return 'bg-card';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'occupied': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">BAND</Badge>;
      case 'payment': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">TO'LOV</Badge>;
      case 'reserved': return <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">BAND QILINGAN</Badge>;
      case 'free': return <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">BO'SH</Badge>;
      default: return null;
    }
  };


  if (loading) return <div className="p-10 text-center text-muted-foreground">Yuklanmoqda...</div>;

  return (
    <div className="flex-1 bg-background h-full flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="p-4 border-b border-border bg-card shrink-0 shadow-sm z-20">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black tracking-tight text-foreground">Stollar</h1>

          <Button
            variant={showFree ? "default" : "outline"}
            size="lg"
            onClick={() => setShowFree(!showFree)}
            className="gap-2 text-sm font-bold h-12 rounded-xl"
          >
            {showFree ? "Faqat faollar" : "Bo'sh stollar"}
          </Button>
        </div>

        <div className="flex gap-3 mb-1 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={activeHallId === 'all' ? 'default' : 'secondary'}
            onClick={() => setActiveHallId('all')}
            size="lg"
            className={cn(
              "rounded-full px-6 h-12 text-base font-bold transition-all shadow-sm",
              activeHallId === 'all' ? "shadow-primary/25" : "bg-secondary hover:bg-secondary/80 text-foreground"
            )}
          >
            Hammasi
          </Button>
          {halls.map(hall => (
            <Button
              key={hall.id}
              variant={activeHallId === hall.id ? 'default' : 'secondary'}
              onClick={() => setActiveHallId(hall.id)}
              size="lg"
              className={cn(
                "rounded-full whitespace-nowrap px-6 h-12 text-base font-bold transition-all shadow-sm",
                activeHallId === hall.id ? "shadow-primary/25" : "bg-secondary hover:bg-secondary/80 text-foreground"
              )}
            >
              {hall.name}
            </Button>
          ))}
        </div>
      </div>

      {/* LIST VIEW */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin bg-secondary/5">
        <div className="flex flex-col gap-3 pb-20">
          {sortedTables.map((table) => {
            const isSelected = selectedTableId === table.id;
            const hall = halls.find(h => h.id === table.hall_id);
            const displayName = hall ? `${hall.name} ${table.name}` : table.name;

            return (
              <div
                key={table.id}
                onClick={() => handleTableClick(table)}
                onDoubleClick={() => handleTableDoubleClick(table)}
                className={cn(
                  "flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer select-none min-h-[90px] relative overflow-hidden", // added relative overflow-hidden
                  getStatusColor(table.status, isSelected),
                  isSelected ? "shadow-lg z-10 scale-[1.01] border-primary" : "shadow-sm active:scale-[0.99] border-transparent hover:border-border"
                )}
              >
                {/* RESERVATION INDICATOR */}
                {(() => {
                  // Find upcoming reservation (next 3 hours)
                  const now = new Date();
                  const upcomingRes = reservations.find(r => {
                    if (r.table_id !== table.id || r.status !== 'active') return false;
                    const resTime = new Date(r.reservation_time);
                    const diffMinutes = (resTime - now) / (1000 * 60);
                    return diffMinutes > -30 && diffMinutes < 180; // From -30m ago (late) to +3 hours
                  });

                  if (upcomingRes) {
                    const resTime = new Date(upcomingRes.reservation_time);
                    const isClose = (resTime - now) / (1000 * 60) < 30; // Less than 30 mins

                    return (
                      <div className={cn(
                        "absolute top-0 right-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl flex items-center gap-1 z-20",
                        isClose ? "bg-red-500 text-white animate-pulse" : "bg-purple-500 text-white"
                      )}>
                        <Clock size={10} />
                        {formatTime(upcomingRes.reservation_time)} - {upcomingRes.customer_name}
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="flex items-center gap-5">
                  {/* Table Icon/Number Container */}
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm transition-colors",
                    isSelected
                      ? "bg-background text-primary shadow-none"
                      : table.status === 'free' ? "bg-secondary text-muted-foreground" : "bg-white dark:bg-slate-800 text-foreground"
                  )}>
                    {table.current_check_number > 0 ? `${table.current_check_number}` : (table.name.replace(/\D/g, '') || <Hash size={24} />)}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col gap-1">
                    <h3 className={cn("font-bold text-xl leading-none", isSelected ? "text-primary-foreground" : "text-foreground")}>
                      {displayName}
                    </h3>
                    <div className="flex items-center gap-3 text-sm opacity-90 font-medium">
                      {table.waiter_name ? (
                        <span className="flex items-center gap-1.5 p-1 px-2 rounded-md bg-white/10"><User size={14} /> {table.waiter_name}</span>
                      ) : <span className="text-xs italic opacity-70">Ofitsiant yo'q</span>}

                      {table.status !== 'free' && (
                        <>
                          <span className="opacity-50">•</span>
                          <span className="flex items-center gap-1 font-mono"><Clock size={14} /> {formatTime(table.start_time)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Status & Total */}
                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(table.status)}


                  {table.total_amount > 0 && (
                    <div className={cn("font-black text-2xl tabular-nums mt-1 tracking-tight", isSelected ? "text-white" : "text-primary")}>
                      {(table.total_amount * (1 + (Number(settings?.serviceChargeValue) || 0) / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-sm font-bold opacity-70">so'm</span>
                    </div>
                  )}
                  {table.status === 'free' && <span className="text-sm text-muted-foreground opacity-50 font-bold">--</span>}
                </div>
              </div>
            )
          })}

          {sortedTables.length === 0 && (
            <div className="py-20 text-center text-muted-foreground flex flex-col items-center opacity-60">
              <p className="font-bold text-xl">Faol buyurtmalar yo'q</p>
              {!showFree && (
                <Button variant="link" onClick={() => setShowFree(true)} className="text-primary mt-2 text-lg">
                  + Yangi buyurtma ochish
                </Button>
              )}
            </div>
          )}
        </div>
      </div>


      <MenuModal
        isOpen={menuModal.isOpen}
        onClose={handleMenuClose}
        tableId={menuModal.table?.id}
        tableName={menuModal.table?.name}
      />


    </div>
  );
};

export default TablesGrid;