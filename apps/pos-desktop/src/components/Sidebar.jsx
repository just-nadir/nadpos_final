import React, { useState, useEffect } from 'react';
import { LayoutGrid, UtensilsCrossed, Settings, LogOut, Square, Users, FileText, PieChart, MessageSquare, Lock, Search, Package, Moon, Sun, Monitor, Calendar } from 'lucide-react';
import { APP_INFO } from '../config/appConfig';
import { cn } from '../utils/cn';
import { Button } from './ui/button';
import { useTheme } from '../context/ThemeProvider';

const Sidebar = ({ activePage, onNavigate, onLogout, user, onCloseShift, syncStatus }) => {
  const { theme, setTheme } = useTheme();
  const [appVersion, setAppVersion] = useState(APP_INFO.version);

  useEffect(() => {
    if (window.api && window.api.getAppVersion) {
      window.api.getAppVersion().then(v => setAppVersion(`v${v}`));
    }
  }, []);

  const menuItems = [
    { id: 'pos', icon: <LayoutGrid />, label: "Kassa" },
    { id: 'reservations', icon: <Calendar />, label: "Bronlar" },
    { id: 'customers', icon: <Users />, label: "Mijozlar" },
    { id: 'tables', icon: <Square />, label: "Zallar" },
    { id: 'menu', icon: <UtensilsCrossed />, label: "Menyu" },
    { id: 'inventory', icon: <Package />, label: "Ombor" },
    { id: 'reports', icon: <PieChart />, label: "Xisobot" },
    { id: 'settings', icon: <Settings />, label: "Sozlama" },
  ];

  // Ruxsatlar mantiqi
  let filteredItems = menuItems.filter(item => {
    // Agar permissions array mavjud bo'lsa, shundan foydalanamiz
    if (user?.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
      return user.permissions.includes(item.id);
    }

    // FALLBACK: Agar permissionlar yo'q bo'lsa (eski userlar uchun), rolga qarab
    // Admin: Hammasi
    if (user?.role === 'admin') return true;

    // Kassir: Ombordan boshqa hammasi
    if (user?.role === 'cashier') {
      return item.id !== 'inventory';
    }

    // Ofitsiant: Faqat ruxsat etilganlar (Default)
    // Legacy ofitsiantlar uchun minimal
    if (user?.role === 'waiter') {
      return ['pos', 'tables', 'menu'].includes(item.id);
    }

    return false;
  });

  // Sidebar menyu hech qachon bo'sh bo'lmasin: noma'lum rol/permissions da barcha bo'limlar ko'rinsin
  if (filteredItems.length === 0) {
    filteredItems = menuItems;
  }

  return (
    <div className="w-[100px] bg-card border-r border-border h-screen flex flex-col items-center py-4 z-10 transition-colors duration-300">

      {/* Brand / Logo Area could go here */}

      <div className="flex-1 flex flex-col gap-2 w-full px-2 overflow-y-auto scrollbar-hide mt-2">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "flex flex-col items-center justify-center py-3 px-1 rounded-xl transition-all duration-200 group w-full min-h-[70px]",
              activePage === item.id
                ? "bg-primary text-primary-foreground shadow-md transform scale-[1.02]"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
            title={item.label}
          >
            <div className="mb-1 [&>svg]:w-7 [&>svg]:h-7">
              {item.icon}
            </div>
            <span className="text-[11px] font-semibold text-center leading-tight">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 w-full px-2 mb-2 border-t border-border pt-4 bg-card">

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex flex-col items-center justify-center p-3 text-muted-foreground hover:bg-secondary rounded-xl transition-colors"
          title="Mavzuni o'zgartirish"
        >
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>


        {onCloseShift && (
          <button
            onClick={onCloseShift}
            className="flex flex-col items-center justify-center p-3 text-orange-500 hover:text-orange-600 hover:bg-orange-100/10 rounded-xl transition-colors"
            title="Smenani Yopish"
          >
            <Lock size={24} />
          </button>
        )}

        {/* Sinx holati — chiziq, holat faqat hover da */}
        {syncStatus && (
          <div
            className={cn(
              'w-full h-1 rounded-full transition-colors cursor-default',
              syncStatus.status === 'syncing' && 'bg-amber-500 animate-pulse',
              syncStatus.status === 'synced' && 'bg-emerald-500',
              syncStatus.status === 'error' && 'bg-destructive',
              syncStatus.status === 'offline' && 'bg-muted-foreground/40'
            )}
            title={
              syncStatus.status === 'syncing'
                ? 'Sinxronlashmoqda...'
                : syncStatus.status === 'synced'
                  ? (syncStatus.lastSync ? `Oxirgi sinx: ${new Date(syncStatus.lastSync).toLocaleTimeString('uz')}` : 'Sinxron')
                  : syncStatus.status === 'error'
                    ? (syncStatus.error || 'Xato')
                    : 'Serverga ulanmagan (login qiling)'
            }
          />
        )}

        <div className="flex flex-col items-center gap-3 mb-2">

          <button onClick={onLogout} className="p-3 text-destructive hover:bg-destructive/10 rounded-xl transition-all" title="Chiqish">
            <LogOut size={24} />
          </button>
          <span className="text-[10px] text-muted-foreground font-mono">{appVersion}</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;