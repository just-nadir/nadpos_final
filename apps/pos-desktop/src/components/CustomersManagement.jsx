import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, Wallet, Percent, Users, Calendar, Gift, X, Search, ArrowDownLeft, ArrowUpRight, CheckCircle, FileText, CreditCard } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import SaleDetailModal from './SaleDetailModal';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { cn } from '../utils/cn';
import { Button } from './ui/button';
import { Input } from './ui/input';

// --- MODAL KOMPONENT (Dark Mode Optimized) ---
const CustomerModal = ({ isOpen, onClose, onSubmit, newCustomer, setNewCustomer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
      <div className="bg-background w-[500px] rounded-2xl shadow-2xl p-6 relative border border-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-2">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-foreground mb-6">Yangi Mijoz</h2>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">Ism Familiya</label>
              <input required type="text" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} className="w-full p-4 bg-secondary/20 rounded-xl border border-transparent focus:border-primary outline-none text-foreground font-medium transition-all" placeholder="Ali Valiyev" autoFocus />
            </div>
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">Telefon</label>
              <input required type="text" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="w-full p-4 bg-secondary/20 rounded-xl border border-transparent focus:border-primary outline-none text-foreground font-medium transition-all" placeholder="90 123 45 67" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">Mijoz Turi</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setNewCustomer({ ...newCustomer, type: 'discount' })}
                className={cn("p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all font-bold", newCustomer.type === 'discount' ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400' : 'bg-card border-border text-muted-foreground hover:bg-secondary')}>
                <Percent size={20} /> Chegirma (VIP)
              </button>
              <button type="button" onClick={() => setNewCustomer({ ...newCustomer, type: 'cashback' })}
                className={cn("p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all font-bold", newCustomer.type === 'cashback' ? 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400' : 'bg-card border-border text-muted-foreground hover:bg-secondary')}>
                <Wallet size={20} /> Bonus
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">
              {newCustomer.type === 'discount' ? 'Chegirma Foizi (%)' : 'Bonus Yig\'ish Foizi (%)'}
            </label>
            <input required type="number" value={newCustomer.value} onChange={e => setNewCustomer({ ...newCustomer, value: e.target.value })} className="w-full p-4 bg-secondary/20 rounded-xl border border-transparent focus:border-primary outline-none text-foreground font-medium transition-all" placeholder="Masalan: 5" />
          </div>

          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">Tug'ilgan kun (Ixtiyoriy)</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input type="date" value={newCustomer.birthday} onChange={e => setNewCustomer({ ...newCustomer, birthday: e.target.value })} className="w-full pl-12 pr-4 py-4 bg-secondary/20 rounded-xl border border-transparent focus:border-primary outline-none text-foreground font-medium transition-all" />
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 mt-2 text-lg active:scale-95 transition-transform">Saqlash</button>
        </form>
      </div>
    </div>
  );
};

// --- ASOSIY KOMPONENT ---
const CustomersManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, debtor, discount, cashback
  const [searchQuery, setSearchQuery] = useState('');

  // History & Payment
  const [history, setHistory] = useState([]);
  const [payAmount, setPayAmount] = useState('');
  const [isPaySuccess, setIsPaySuccess] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '', phone: '', type: 'cashback', value: '', birthday: ''
  });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  // Sale Detail Modal
  const [detailModal, setDetailModal] = useState({ isOpen: false, sale: null, checkNumber: 0 });

  const loadCustomers = async () => {
    if (!window.electron) return;
    try {
      const { ipcRenderer } = window.electron;
      const data = await ipcRenderer.invoke('get-customers');
      setCustomers(data);
      if (selectedCustomer) {
        const updated = data.find(c => c.id === selectedCustomer.id);
        if (updated) setSelectedCustomer(updated);
      }
    } catch (err) { console.error(err); }
  };

  const loadHistory = async (id) => {
    if (!window.electron) return;
    try {
      const { ipcRenderer } = window.electron;
      const data = await ipcRenderer.invoke('get-debt-history', id); // Keep consistent with existing backend
      setHistory(data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadCustomers(); }, []);
  useEffect(() => {
    if (selectedCustomer) {
      loadHistory(selectedCustomer.id);
      setPayAmount('');
    }
  }, [selectedCustomer?.id]); // Only reload history if ID changes

  // Filter Logic
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'debtor') return c.debt > 0;
    return c.type === filterType;
  });

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      const { ipcRenderer } = window.electron;
      await ipcRenderer.invoke('add-customer', { ...newCustomer, value: Number(newCustomer.value) });
      setIsModalOpen(false);
      setNewCustomer({ name: '', phone: '', type: 'cashback', value: '', birthday: '' });
      loadCustomers();
    } catch (err) { console.error(err); }
  };

  const confirmDelete = (id) => setConfirmModal({ isOpen: true, id });

  const performDelete = async () => {
    try {
      const { ipcRenderer } = window.electron;
      await ipcRenderer.invoke('delete-customer', confirmModal.id);
      if (selectedCustomer?.id === confirmModal.id) setSelectedCustomer(null);
      loadCustomers();
    } catch (err) { console.error(err); }
  };

  const handlePayDebt = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0 || !selectedCustomer) return;

    try {
      const { ipcRenderer } = window.electron;
      await ipcRenderer.invoke('pay-debt', {
        customerId: selectedCustomer.id,
        amount: Number(payAmount),
        comment: "Qarz to'lovi"
      });
      setPayAmount('');
      setIsPaySuccess(true);
      setTimeout(() => setIsPaySuccess(false), 3000);
      loadCustomers();
      loadHistory(selectedCustomer.id);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex w-full h-full relative bg-background">
      {/* 2-QISM: SIDEBAR (List & Filters) */}
      <div className="w-96 bg-card border-r border-border flex flex-col h-full shadow-sm z-10 transition-colors">

        {/* Header & Tabs */}
        <div className="p-5 border-b border-border bg-card">
          <h2 className="text-2xl font-black text-foreground mb-5 px-1 tracking-tight">Mijozlar</h2>

          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-secondary/20 rounded-2xl border-transparent focus:bg-background focus:border-primary border-2 outline-none text-foreground font-bold text-lg transition-all"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'all', icon: Users, label: 'Barchasi' },
              { id: 'debtor', icon: ArrowDownLeft, label: 'Qarzdorlar', color: 'text-destructive' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-base font-bold whitespace-nowrap transition-all border shadow-sm active:scale-95",
                  filterType === tab.id
                    ? "bg-primary text-primary-foreground border-primary shadow-primary/25"
                    : "bg-background text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                )}
              >
                <tab.icon size={18} className={filterType !== tab.id ? tab.color : ''} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/5 scrollbar-thin">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full h-16 border-2 border-dashed border-border rounded-2xl text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all font-bold text-lg flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <Plus size={24} /> Yangi Mijoz
          </button>

          {filteredCustomers.map(customer => (
            <div
              key={customer.id}
              onClick={() => setSelectedCustomer(customer)}
              className={cn(
                "w-full p-5 rounded-2xl cursor-pointer transition-all border text-left group relative min-h-[80px]",
                selectedCustomer?.id === customer.id
                  ? "bg-primary/10 border-primary shadow-lg shadow-primary/10 scale-[1.02] z-10"
                  : "bg-card border-border hover:border-primary/50 hover:shadow-md"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={cn("font-bold text-xl truncate pr-8 tracking-tight", selectedCustomer?.id === customer.id ? "text-primary" : "text-foreground")}>
                  {customer.name}
                </span>
                {selectedCustomer?.id !== customer.id && (
                  <button
                    disabled={customer.debt > 0}
                    onClick={(e) => { e.stopPropagation(); if (customer.debt <= 0) confirmDelete(customer.id); }}
                    className={cn(
                      "absolute right-3 top-3 p-2 rounded-xl transition-all active:scale-90",
                      customer.debt > 0 ? "text-muted-foreground/30 cursor-not-allowed hidden group-hover:block" : "text-muted-foreground hover:text-white hover:bg-destructive opacity-0 group-hover:opacity-100"
                    )}
                    title={customer.debt > 0 ? "Qarzdor mijozni o'chirib bo'lmaydi" : "O'chirish"}
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5"><User size={14} /> {customer.phone}</span>
                <span className={cn(
                  "font-bold px-2.5 py-1 rounded-lg text-sm",
                  customer.debt > 0 ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"
                )}>
                  {customer.debt > 0 ? `-${customer.debt.toLocaleString()}` : customer.balance.toLocaleString()}
                </span>
              </div>

              {customer.birthday && (
                <div className="text-orange-500 flex items-center gap-1.5 text-xs font-bold mt-2 opacity-90 bg-orange-500/10 w-fit px-2 py-0.5 rounded-md">
                  <Gift size={12} /> {formatDate(customer.birthday)}
                </div>
              )}
            </div>
          ))}

          {filteredCustomers.length === 0 && (
            <div className="text-center py-20 text-muted-foreground opacity-50 flex flex-col items-center">
              <Users size={64} strokeWidth={1} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">Mijozlar topilmadi</p>
            </div>
          )}
        </div>
      </div>

      {/* 3-QISM: CONTENT (Detail View) */}
      <div className="flex-1 bg-background flex flex-col h-full overflow-hidden relative">
        {selectedCustomer ? (
          <>
            <div className="bg-card p-8 lg:p-10 border-b border-border shadow-sm z-20">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-4xl font-black text-foreground tracking-tight">{selectedCustomer.name}</h1>
                    {selectedCustomer.type === 'discount' && <span className="px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-600 text-sm font-bold border border-purple-500/20">VIP {selectedCustomer.value}%</span>}
                    {selectedCustomer.type === 'cashback' && <span className="px-4 py-1.5 rounded-full bg-green-500/10 text-green-600 text-sm font-bold border border-green-500/20">Bonus {selectedCustomer.value}%</span>}
                  </div>
                  <p className="text-muted-foreground text-xl flex items-center gap-2 font-medium">
                    <User size={20} /> {selectedCustomer.phone}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={selectedCustomer.debt > 0}
                      onClick={() => confirmDelete(selectedCustomer.id)}
                      className={cn(
                        "h-10 w-10 transition-all rounded-xl",
                        selectedCustomer.debt > 0
                          ? "text-muted-foreground/20 cursor-not-allowed"
                          : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      )}
                      title={selectedCustomer.debt > 0 ? "Qarzdor mijozni o'chirib bo'lmaydi" : "O'chirish"}
                    >
                      <Trash2 size={24} />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-70">
                      {selectedCustomer.debt > 0 ? "Joriy Qarz" : "Joriy Balans"}
                    </p>
                    <div className={cn("text-5xl font-black tracking-tighter", selectedCustomer.debt > 0 ? "text-destructive" : "text-green-600")}>
                      {selectedCustomer.debt > 0 ? selectedCustomer.debt.toLocaleString() : selectedCustomer.balance.toLocaleString()}
                      <span className="text-xl text-muted-foreground font-bold ml-2">so'm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTIONS BAR - Only show if pay form is needed */}
              {selectedCustomer.debt > 0 && (
                <div className="flex gap-4 mt-8">
                  <form onSubmit={handlePayDebt} className="flex-1 bg-secondary/30 p-2 rounded-2xl border border-border flex gap-2 shadow-inner">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs uppercase tracking-wider">So'ndirish</span>
                      <input
                        type="number"
                        placeholder="Summa..."
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="w-full h-full pl-28 pr-4 bg-transparent outline-none font-black text-2xl text-foreground"
                        autoFocus
                      />
                    </div>
                    <Button type="submit" disabled={!payAmount} className="bg-green-600 hover:bg-green-700 text-white shadow-lg h-14 px-8 text-lg font-bold rounded-xl active:scale-95 transition-all">
                      <CheckCircle size={20} className="mr-2" /> To'lash
                    </Button>
                  </form>
                </div>
              )}
            </div>

            {/* HISTORY */}
            <div className="flex-1 overflow-y-auto p-8 bg-secondary/5 scrollbar-thin">
              <h3 className="font-black text-muted-foreground mb-6 flex items-center gap-2 text-sm uppercase tracking-wider pl-2">
                <FileText size={16} /> Operatsiyalar Tarixi
              </h3>

              <div className="space-y-4 max-w-5xl mx-auto">
                {isPaySuccess && (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-600 p-6 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 mb-6 shadow-sm">
                    <CheckCircle size={28} />
                    <span className="font-bold text-xl">To'lov muvaffaqiyatli qabul qilindi!</span>
                  </div>
                )}

                {history.map((item) => {
                  const hasDetails = item.items_json || item.sale_id;
                  return (
                    <div
                      key={item.id}
                      onDoubleClick={() => {
                        if (item.items_json) {
                          try {
                            const items = JSON.parse(item.items_json);
                            setDetailModal({
                              isOpen: true,
                              sale: { items, amount: item.amount, date: item.date },
                              checkNumber: item.check_number
                            });
                          } catch (e) { console.error(e); }
                        }
                      }}
                      className={cn(
                        "bg-card p-6 rounded-3xl shadow-sm border border-border flex justify-between items-center hover:shadow-lg hover:border-primary/30 transition-all group",
                        hasDetails && "cursor-pointer active:scale-[0.99] hover:bg-secondary/20"
                      )}
                    >
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-transform group-hover:scale-110",
                          item.type === 'debt' ? "bg-destructive/10 border-destructive/10 text-destructive"
                            : item.type === 'payment' ? "bg-green-500/10 border-green-500/10 text-green-600"
                              : "bg-blue-500/10 border-blue-500/10 text-blue-600"
                        )}>
                          {item.type === 'debt' ? <ArrowDownLeft size={28} />
                            : item.type === 'payment' ? <ArrowUpRight size={28} />
                              : <CreditCard size={28} />}
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-xl mb-1">
                            {item.comment || (item.type === 'debt' ? 'Nasiya Savdo' : 'Qarz To\'lovi')}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium bg-secondary/50 px-3 py-1 rounded-lg w-fit">
                            <Calendar size={14} />
                            {formatDateTime(item.date)}
                          </div>
                        </div>
                      </div>
                      <div className={cn(
                        "font-black text-2xl tabular-nums tracking-tight",
                        item.type === 'debt' ? "text-destructive" : "text-green-600"
                      )}>
                        {item.type === 'debt' ? '+' : '-'}{item.amount.toLocaleString()} <span className="text-sm opacity-50 font-bold text-muted-foreground">so'm</span>
                      </div>
                    </div>
                  ); // End return
                })}

                {history.length === 0 && (
                  <div className="text-center py-24 opacity-40">
                    <FileText size={64} className="mx-auto mb-4 stroke-1" />
                    <p className="text-2xl font-bold">Tarix mavjud emas</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-40">
            <div className="w-32 h-32 bg-secondary rounded-full flex items-center justify-center mb-6">
              <User size={64} strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-bold mb-2">Mijoz tanlanmagan</p>
            <p className="text-lg">Tafsilotlarni ko'rish uchun ro'yxatdan tanlang</p>
          </div>
        )}
      </div>

      <CustomerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddCustomer} newCustomer={newCustomer} setNewCustomer={setNewCustomer} />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={performDelete}
        message="Haqiqatan ham bu mijozni o'chirmoqchimisiz?"
        isDanger={true}
      />
      <SaleDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal(prev => ({ ...prev, isOpen: false }))}
        sale={detailModal.sale}
        checkNumber={detailModal.checkNumber}
      />
    </div>
  );
};

export default CustomersManagement;