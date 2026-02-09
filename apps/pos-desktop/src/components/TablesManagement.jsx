import React, { useState, useEffect } from 'react';
import { Reorder } from 'framer-motion';
import { Plus, Trash2, Layout, Square, Armchair, X, Edit2, Check, MapPin } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { cn } from '../utils/cn'; // Assuming cn utility exists from previous edits or standard codebase
import { Button } from './ui/button'; // Assuming button component exists
import { Input } from './ui/input'; // Assuming input component exists
import { useIpcListener } from '../hooks/useIpcListener';

// --- MODAL KOMPONENT ---
const TableModal = ({ isOpen, onClose, onSubmit, newTableName, setNewTableName, activeHallName }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
      <div className="bg-background w-[450px] rounded-2xl shadow-2xl p-6 relative border border-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-2"><X size={24} /></button>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Yangi Stol</h2>
          <p className="text-sm text-muted-foreground">Zal: <span className="font-bold text-primary text-base">{activeHallName}</span></p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">Stol Nomi</label>
            <input
              autoFocus
              required
              type="text"
              value={newTableName}
              onChange={e => setNewTableName(e.target.value)}
              className="w-full p-4 bg-secondary/30 rounded-xl border border-transparent focus:border-primary outline-none text-foreground text-lg font-medium transition-all text-center"
              placeholder="Masalan: 15"
            />
          </div>
          <button type="submit" className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 text-lg transition-transform active:scale-95">Saqlash</button>
        </form>
      </div>
    </div>
  );
};

// --- ASOSIY ---
const TablesManagement = () => {
  const [halls, setHalls] = useState([]);
  const [tables, setTables] = useState([]);
  const [activeHall, setActiveHall] = useState(null);

  const [isAddingHall, setIsAddingHall] = useState(false);
  const [newHallName, setNewHallName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');

  // Delete Modal State
  const [modal, setModal] = useState({ isOpen: false, type: null, id: null, message: '' });

  const loadHalls = async () => {
    if (!window.electron) return;
    try {
      const { ipcRenderer } = window.electron;
      const data = await ipcRenderer.invoke('get-halls');
      setHalls(data);
      if (!activeHall && data.length > 0) setActiveHall(data[0].id);
    } catch (err) { console.error(err); }
  };

  const loadTables = async () => {
    if (!activeHall || !window.electron) return;
    try {
      const { ipcRenderer } = window.electron;
      const data = await ipcRenderer.invoke('get-tables-by-hall', activeHall);
      setTables(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadHalls(); }, []);
  useEffect(() => { loadTables(); }, [activeHall]);

  // Realtime: zal/stol qo'shilganda yoki o'chirilganda ro'yxat darhol yangilansin
  useIpcListener('db-change', (event, data) => {
    if (data.type === 'halls') loadHalls();
    if (data.type === 'tables') loadTables();
  });

  const handleReorder = async (newOrder) => {
    setHalls(newOrder);
    if (window.electron && window.electron.ipcRenderer) {
      try {
        await window.electron.ipcRenderer.invoke('update-halls-order', newOrder);
      } catch (error) {
        console.error("Failed to save order", error);
        loadHalls(); // Revert on error
      }
    }
  };

  const handleAddHall = async (e) => {
    e.preventDefault();
    if (!newHallName.trim()) return;
    const { ipcRenderer } = window.electron;
    await ipcRenderer.invoke('add-hall', newHallName);
    setNewHallName('');
    setIsAddingHall(false);
    loadHalls();
  };

  const confirmDeleteHall = (id) => {
    setModal({ isOpen: true, type: 'hall', id, message: "DIQQAT: Zal va unga tegishli barcha stollar o'chiriladi!" });
  };

  const confirmDeleteTable = (id) => {
    setModal({ isOpen: true, type: 'table', id, message: "Stolni o'chirmoqchimisiz?" });
  };

  const performDelete = async () => {
    try {
      const { ipcRenderer } = window.electron;
      if (modal.type === 'hall') {
        await ipcRenderer.invoke('delete-hall', modal.id);
        if (activeHall === modal.id) setActiveHall(null);
        loadHalls();
      } else if (modal.type === 'table') {
        await ipcRenderer.invoke('delete-table', modal.id);
        loadTables();
      }
    } catch (err) { console.error(err); }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTableName.trim() || !activeHall) return;
    try {
      const { ipcRenderer } = window.electron;
      await ipcRenderer.invoke('add-table', { hallId: activeHall, name: newTableName });
      setIsModalOpen(false);
      setNewTableName('');
      loadTables();
    } catch (err) { console.error(err); }
  };

  const activeHallObj = halls.find(h => h.id === activeHall);

  return (
    <div className="flex w-full h-full relative bg-background">
      {/* 2-QISM: ZALLAR (SIDEBAR) */}
      <div className="w-80 bg-card border-r border-border flex flex-col h-full z-10 shadow-sm transition-all duration-300">
        <div className="p-6 border-b border-border flex justify-between items-center bg-card">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Layout className="text-primary" size={24} />
            Zallar
          </h2>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full w-12 h-12 hover:bg-secondary active:scale-95 transition-transform"
            onClick={() => setIsAddingHall(true)}
          >
            <Plus className="text-primary" size={28} />
          </Button>
        </div>

        {isAddingHall && (
          <form onSubmit={handleAddHall} className="p-4 bg-secondary/10 border-b border-border animate-in slide-in-from-top duration-300">
            <input
              autoFocus
              type="text"
              placeholder="Zal nomi..."
              value={newHallName}
              onChange={(e) => setNewHallName(e.target.value)}
              className="w-full p-4 rounded-xl border border-border bg-background focus:border-primary outline-none mb-3 text-lg text-foreground shadow-sm"
            />
            <div className="flex gap-3">
              <Button type="button" variant="secondary" size="lg" onClick={() => setIsAddingHall(false)} className="flex-1 h-12 text-muted-foreground font-bold">Bekor</Button>
              <Button type="submit" size="lg" className="flex-1 h-12 font-bold shadow-md shadow-primary/20">Qo'shish</Button>
            </div>
          </form>
        )}



        <div className="flex-1 overflow-y-auto p-4 bg-secondary/5 scrollbar-thin">
          <Reorder.Group axis="y" values={halls} onReorder={handleReorder} className="space-y-3">
            {halls.map(hall => (
              <Reorder.Item key={hall.id} value={hall}>
                <div className="relative group">
                  <div
                    onClick={() => setActiveHall(hall.id)}
                    className={cn(
                      "w-full px-5 py-4 rounded-2xl font-bold text-lg transition-all cursor-pointer flex items-center justify-between min-h-[64px] shadow-sm select-none active:scale-[0.98]",
                      activeHall === hall.id
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1"
                        : "bg-background text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent hover:border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Drag Handle Indicator (Optional - dots) */}
                      <div className="opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing transition-opacity mr-1">
                        <svg width="6" height="14" viewBox="0 0 6 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 2C2 2.55228 1.55228 3 1 3C0.447715 3 0 2.55228 0 2C0 1.44772 0.447715 1 1 1C1.55228 1 2 1.44772 2 2Z" />
                          <path d="M2 7C2 7.55228 1.55228 8 1 8C0.447715 8 0 7.55228 0 7C0 6.44772 0.447715 6 1 6C1.55228 6 2 6.44772 2 7Z" />
                          <path d="M2 12C2 12.5523 1.55228 13 1 13C0.447715 13 0 12.5523 0 12C0 11.4477 0.447715 11 1 11C1.55228 11 2 11.4477 2 12Z" />
                          <path d="M6 2C6 2.55228 5.55228 3 5 3C4.44772 3 4 2.55228 4 2C4 1.44772 4.44772 1 5 1C5.55228 1 6 1.44772 6 2Z" />
                          <path d="M6 7C6 7.55228 5.55228 8 5 8C4.44772 8 4 7.55228 4 7C4 6.44772 4.44772 6 5 6C5.55228 6 6 6.44772 6 7Z" />
                          <path d="M6 12C6 12.5523 5.55228 13 5 13C4.44772 13 4 12.5523 4 12C4 11.4477 4.44772 11 5 11C5.55228 11 6 11.4477 6 12Z" />
                        </svg>
                      </div>
                      <MapPin size={24} className={activeHall === hall.id ? 'opacity-100' : 'opacity-50'} />
                      <span className="truncate tracking-wide">{hall.name}</span>
                    </div>

                    {/* Delete Button */}
                    {activeHall === hall.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); confirmDeleteHall(hall.id); }}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-colors active:scale-90"
                        title="O'chirish"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      </div>

      {/* 3-QISM: STOLLAR (CONTENT) */}
      <div className="flex-1 bg-background flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <div className="bg-card px-8 py-6 border-b border-border flex justify-between items-center shadow-sm z-20 sticky top-0">
          <div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-3 tracking-tight">
              {activeHallObj?.name || "Zallar"}
              {activeHallObj && <span className="text-sm font-bold px-3 py-1 bg-secondary text-foreground rounded-full border border-border">{tables.length} ta stol</span>}
            </h1>
          </div>

          {activeHall && (
            <Button onClick={() => setIsModalOpen(true)} size="lg" className="rounded-2xl shadow-xl shadow-primary/20 gap-3 h-14 px-8 text-lg font-bold hover:scale-105 transition-transform">
              <Plus size={24} /> Yangi Stol
            </Button>
          )}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-8 bg-secondary/5 scrollbar-thin">
          {activeHall ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
              {tables.map(table => (
                <div
                  key={table.id}
                  className="bg-card dark:bg-card p-6 rounded-3xl shadow-sm border border-border hover:border-primary/50 hover:shadow-lg transition-all group flex flex-col items-center justify-center text-center relative aspect-square cursor-pointer active:scale-[0.98]"
                >
                  <div className="mb-4 p-5 rounded-full bg-secondary/50 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <Square size={40} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold text-foreground text-3xl mb-2 tracking-tight">{table.name}</h3>
                  <div className="text-muted-foreground text-sm flex items-center gap-1.5 font-medium bg-secondary/50 px-3 py-1 rounded-lg">
                    <Armchair size={16} /> Standard
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); confirmDeleteTable(table.id); }}
                    className="absolute top-4 right-4 p-3 rounded-2xl text-muted-foreground bg-secondary/30 hover:bg-destructive hover:text-white transition-all active:scale-95"
                    title="Stolni o'chirish"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}

              {/* Empty State */}
              {tables.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed border-border rounded-3xl bg-card/50">
                  <Layout size={80} className="mb-6 opacity-20 stroke-1" />
                  <p className="text-2xl font-bold">Bu zalda stollar yo'q</p>
                  <p className="text-lg opacity-60 mt-2">"Yangi Stol" tugmasini bosib qo'shing</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <MapPin size={96} className="mb-8 opacity-20 animate-bounce stroke-1" />
              <p className="text-3xl font-bold">Ishlash uchun chap tomondan zalni tanlang</p>
            </div>
          )}
        </div>
      </div>

      <TableModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddTable} newTableName={newTableName} setNewTableName={setNewTableName} activeHallName={activeHallObj?.name} />

      <ConfirmModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={performDelete}
        message={modal.message}
      />
    </div>
  );
};

export default TablesManagement;