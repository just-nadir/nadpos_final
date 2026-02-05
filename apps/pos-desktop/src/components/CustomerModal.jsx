import React, { useState, useEffect } from 'react';
import { X, Search, Wallet, Percent } from 'lucide-react';

const CustomerModal = ({ isOpen, onClose, onSelectCustomer }) => {
  if (!isOpen) return null;

  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]); // Bazadan keladigan mijozlar

  // Bazadan mijozlarni yuklash
  useEffect(() => {
    const loadCustomers = async () => {
      if (!window.electron) return;
      try {
        const { ipcRenderer } = window.electron;
        const data = await ipcRenderer.invoke('get-customers');
        setCustomers(data);
      } catch (error) {
        console.error("Mijozlarni yuklashda xatolik:", error);
      }
    };

    loadCustomers();
  }, [isOpen]); // Modal ochilganda yuklaydi

  // Qidiruv (Frontendda filter qilamiz hozircha)
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-background w-[500px] h-[550px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Mijozni tanlash</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X size={20} className="text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 bg-secondary/10 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Ism yoki telefon orqali qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background/50 focus:bg-background focus:border-primary outline-none text-foreground placeholder:text-muted-foreground transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => {
                onSelectCustomer(customer);
                onClose();
              }}
              className="flex items-center justify-between p-4 hover:bg-secondary/50 rounded-xl cursor-pointer transition-colors group mb-1 border border-transparent hover:border-border"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                  ${customer.type === 'discount' ? 'bg-purple-500' : 'bg-green-500'}`}>
                  {customer.type === 'discount' ? <Percent size={18} /> : <Wallet size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{customer.name}</h3>
                  <p className="text-sm text-muted-foreground">+998 {customer.phone}</p>
                </div>
              </div>

              <div className="text-right">
                {customer.type === 'discount' ? (
                  <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-1 rounded text-xs font-bold block mb-1 border border-purple-500/20">
                    {customer.value}% Chegirma
                  </span>
                ) : (
                  <div className="flex flex-col items-end">
                    <span className="bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded text-xs font-bold block mb-1 border border-green-500/20">
                      Bonus
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {customer.balance ? customer.balance.toLocaleString() : 0} so'm
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredCustomers.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              Mijoz topilmadi
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;