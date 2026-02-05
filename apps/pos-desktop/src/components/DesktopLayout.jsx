import React, { useState, Suspense, lazy } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import { useGlobal } from '../context/GlobalContext';
import { useIpcListener } from '../hooks/useIpcListener';
import Sidebar from './Sidebar';
import TablesGrid from './TablesGrid';
import OrderSummary from './OrderSummary';
import Login from './Login';


import ShiftModal from './ShiftModal'; // YANGI

// --- OPTIMIZATSIYA: Dangasa Yuklash (Lazy Loading) ---
// --- OPTIMIZATSIYA: Dangasa Yuklash (Lazy Loading) ---
const MenuManagement = lazy(() => import('./MenuManagement'));
const TablesManagement = lazy(() => import('./TablesManagement'));
const CustomersManagement = lazy(() => import('./CustomersManagement'));
const Reports = lazy(() => import('./Reports'));
const Settings = lazy(() => import('./Settings'));
const InventoryManagement = lazy(() => import('./InventoryManagement'));
const ReservationsManagement = lazy(() => import('./ReservationsManagement'));

// Yuklanayotganda ko'rsatiladigan chiroyli spinner
const PageLoader = () => (
  <div className="flex items-center justify-center h-full w-full bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

const DesktopLayout = () => {
  const { user, logout, loading, toast, showToast, shift, checkShift } = useGlobal(); // shift, checkShift qo'shildi
  const [activePage, setActivePage] = useState('pos');
  const [selectedTable, setSelectedTable] = useState(null);
  const [showShiftModal, setShowShiftModal] = useState(false); // Smena yopish modali uchun

  const [syncStatus, setSyncStatus] = useState({ status: 'offline', lastSync: null });

  // Printer xatolarini global eshitish
  useIpcListener('db-change', (event, data) => {
    if (data.type === 'printer-error') {
      showToast('error', `Printer Xatosi: ${data.id}`);
    }
    if (data.type === 'shift-status') {
      checkShift();
    }
  });

  useIpcListener('sync-status', (event, data) => {
    setSyncStatus(data);
  });

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-500 font-bold bg-gray-100">Tizim yuklanmoqda...</div>;
  }

  // YANGI: Litsenziya tekshiruvi (PAUSED)


  if (!user) {
    return <Login />;
  }

  const handleLogout = () => {
    logout();
    setSelectedTable(null);
    setActivePage('pos');
  };

  // YANGI: Smena yopiq bo'lsa va user loginda bo'lsa -> ShiftModal (Open)
  // shift null bo'lsa ham (startda) bloklash kerak
  if (user && (!shift || shift.status === 'closed')) {
    return (
      <>
        <ShiftModal mode="open" onClose={() => { }} />
        {/* Orqa fon uchun xira layout */}
        <div className="flex h-screen bg-gray-100 overflow-hidden font-sans blur-sm pointer-events-none">
          <Sidebar activePage={activePage} onNavigate={() => { }} onLogout={handleLogout} user={user} />
          <div className="flex-1 flex items-center justify-center p-4">
            <h1 className="text-4xl font-black text-gray-300">SMENA OCHILMAGAN</h1>
          </div>
        </div>
      </>
    );
  }

  // YANGI: Smenani yopish modali
  const renderShiftModal = () => (
    showShiftModal && <ShiftModal mode="close" onClose={() => setShowShiftModal(false)} />
  );

  const renderContent = () => {
    // XAVFSIZLIK: Kassir cheklovi
    if (user.role === 'cashier') {
      if (activePage === 'inventory') {
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ShieldAlert size={64} className="mb-4 text-orange-400" />
            <h2 className="text-2xl font-bold text-gray-700">Ruxsat yo'q</h2>
            <p>Sizga Ombor bo'limiga kirish uchun ruxsat berilmagan.</p>
          </div>
        );
      }
    }

    // Suspense orqali yuklanish holatini boshqaramiz
    return (
      <Suspense fallback={<PageLoader />}>
        {(() => {
          switch (activePage) {
            case 'pos':
              return (
                <div className="flex flex-1 overflow-hidden divide-x divide-border">
                  <div className="flex-1 min-w-0">
                    <TablesGrid onSelectTable={setSelectedTable} selectedTableId={selectedTable?.id} />
                  </div>
                  <div className="flex-1 min-w-0 border-l border-border shadow-lg z-10">
                    <OrderSummary table={selectedTable} onDeselect={() => setSelectedTable(null)} />
                  </div>
                </div>
              );
            case 'menu': return <MenuManagement />;
            case 'tables': return <TablesManagement />;
            case 'customers': return <CustomersManagement />;
            case 'reports': return <Reports />;
            case 'settings': return <Settings />;
            case 'inventory': return <InventoryManagement />;
            case 'reservations': return <ReservationsManagement />;
            default: return <div>Sahifa topilmadi</div>;
          }
        })()}
      </Suspense>
    );
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans relative transition-colors duration-300">

      {/* Global Toast */}
      {toast && (
        <div className={cn(
          "absolute top-6 right-6 z-[9999] px-6 py-4 rounded-2xl shadow-2xl text-white font-bold flex items-center gap-3 animate-in slide-in-from-top duration-300",
          toast.type === 'success' ? 'bg-green-600' : 'bg-destructive'
        )}>
          {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
          <span className="text-lg">{toast.msg}</span>
        </div>
      )}

      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={handleLogout}
        user={user}
        onCloseShift={() => setShowShiftModal(true)} // YANGI
        syncStatus={syncStatus}
      />

      {renderShiftModal()}

      {/* Layout o'zgarishi: POS bo'lsa grid, boshqa bo'lsa to'liq ekran */}
      {activePage === 'pos' ? renderContent() : <div className="flex-1 flex flex-col w-full overflow-hidden">{renderContent()}</div>}
    </div>
  );
};

export default DesktopLayout;