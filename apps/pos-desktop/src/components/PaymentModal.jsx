import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Banknote, CreditCard, Smartphone, FileText, AlertCircle, Calendar, Delete, ChevronLeft } from 'lucide-react';
import { cn } from '../utils/cn';

const PaymentModal = ({ isOpen, onClose, totalAmount, onPay, selectedCustomer }) => {
  const [amounts, setAmounts] = useState({ cash: 0, card: 0, click: 0, debt: 0 });
  const [activeMethod, setActiveMethod] = useState('cash'); // 'cash' | 'card' | 'click' | 'debt'
  const [shouldOverwrite, setShouldOverwrite] = useState(true);
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  // To'lov turlari
  const paymentMethods = [
    { id: 'cash', label: 'Naqd', icon: <Banknote size={24} /> },
    { id: 'card', label: 'Karta', icon: <CreditCard size={24} /> },
    { id: 'click', label: 'Click / Payme', icon: <Smartphone size={24} /> },
    { id: 'debt', label: 'Nasiya (Qarz)', icon: <FileText size={24} /> },
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Init all to 0
      setAmounts({ cash: 0, card: 0, click: 0, debt: 0 });
      setActiveMethod('cash');
      setShouldOverwrite(true);
      setDueDate('');
      setError('');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, totalAmount]);

  const paidAmount = Object.values(amounts).reduce((a, b) => a + b, 0);
  const remainingAmount = totalAmount - paidAmount;

  const handleMethodClick = (methodId) => {
    setActiveMethod(methodId);
    setShouldOverwrite(true);

    // Auto-fill logic: if selecting a method with 0 amount, fill it with remaining logic
    if (amounts[methodId] === 0) {
      const othersSum = Object.entries(amounts)
        .filter(([key]) => key !== methodId)
        .reduce((sum, [, val]) => sum + val, 0);

      const fillAmount = Math.max(0, totalAmount - othersSum);
      if (fillAmount > 0) {
        setAmounts(prev => ({ ...prev, [methodId]: fillAmount }));
      }
    }
  };

  const updateAmount = (val) => {
    setAmounts(prev => ({ ...prev, [activeMethod]: val }));
    setError('');
  };

  const handleNumpad = (value) => {
    if (value === 'C') {
      updateAmount(0);
      setShouldOverwrite(true);
      return;
    }

    const currentVal = amounts[activeMethod];

    if (value === 'back') {
      if (shouldOverwrite) {
        updateAmount(0);
        setShouldOverwrite(false);
        return;
      }
      const currentStr = currentVal === 0 ? '' : currentVal.toString();
      const newStr = currentStr.slice(0, -1);
      updateAmount(newStr ? parseFloat(newStr) : 0);
      return;
    }

    if (shouldOverwrite) {
      updateAmount(parseFloat(value));
      setShouldOverwrite(false);
    } else {
      const currentVal = amounts[activeMethod];
      const currentStr = currentVal === 0 ? '' : currentVal.toString();

      const newStr = currentStr + value;
      // Prevent excessive length/value
      if (newStr.length > 15) return;

      updateAmount(parseFloat(newStr));
    }
  };

  const handlePay = () => {
    // Validation
    if (paidAmount !== totalAmount) {
      setError(`To'lov summasi to'g'ri kelmadi. Farq: ${(totalAmount - paidAmount).toLocaleString()} so'm`);
      return;
    }

    if (amounts.debt > 0) {
      if (!selectedCustomer) {
        setError("Nasiya uchun mijoz tanlanmagan!");
        return;
      }
      if (!dueDate) {
        setError("Nasiya qaytarish sanasi kiritilmadi!");
        return;
      }
    }

    // Prepare data
    const payments = Object.entries(amounts)
      .filter(([_, val]) => val > 0)
      .map(([method, val]) => ({
        id: method,
        method,
        amount: val,
        dueDate: method === 'debt' ? dueDate : ''
      }));

    onPay(payments, true);
  };

  // Keyboard support for Numpad
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') handlePay();
      if (e.key === 'Backspace') handleNumpad('back');

      if (/^[0-9]$/.test(e.key)) {
        handleNumpad(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeMethod, amounts]); // Add dependencies needed for handlers

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-background w-[800px] h-[600px] rounded-3xl shadow-2xl overflow-hidden border border-border flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border bg-card">
          <h2 className="text-2xl font-black text-foreground">To'lov qilish</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors"><X size={24} className="text-muted-foreground hover:text-foreground" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Column: Methods */}
          <div className="w-1/2 p-6 border-r border-border bg-card/30 overflow-y-auto">
            <h3 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider">To'lov usullari</h3>
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const isActive = activeMethod === method.id;
                const amount = amounts[method.id];
                const displayAmount = amount === 0 ? '' : amount.toLocaleString();

                return (
                  <div key={method.id} className="flex gap-3 h-16">
                    {/* Button Side */}
                    <button
                      onClick={() => handleMethodClick(method.id)}
                      className={cn(
                        "flex-1 flex items-center justify-start gap-3 px-4 rounded-xl border-2 transition-all active:scale-95 outline-none",
                        isActive
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border bg-card text-muted-foreground hover:bg-secondary/50"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        isActive ? "bg-primary/20" : "bg-secondary"
                      )}>
                        {method.icon}
                      </div>
                      <span className="font-bold text-lg">{method.label}</span>
                    </button>

                    {/* Input Side */}
                    <div
                      onClick={() => handleMethodClick(method.id)}
                      className={cn(
                        "w-48 relative rounded-xl border-2 transition-all cursor-pointer bg-card flex items-center px-4",
                        isActive
                          ? "border-primary shadow-sm ring-2 ring-primary/20"
                          : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <input
                        type="text"
                        value={displayAmount}
                        readOnly
                        className={cn(
                          "w-full bg-transparent text-xl font-black outline-none text-right pointer-events-none placeholder:text-muted-foreground/20 transition-all",
                          isActive ? "text-primary" : "text-foreground",
                          (isActive && shouldOverwrite) && "bg-primary/20 rounded px-1"
                        )}
                        placeholder="0"
                      />
                      <span className="absolute right-3 -bottom-1 text-[10px] text-muted-foreground font-medium opacity-50">so'm</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Debt Date Picker */}
            {amounts.debt > 0 && (
              <div className="mt-4 animate-in slide-in-from-top-2">
                <div className={cn(
                  "p-4 rounded-xl border border-orange-500/20 bg-orange-500/10",
                  !selectedCustomer && "border-destructive/50 bg-destructive/10"
                )}>
                  {!selectedCustomer ? (
                    <div className="flex items-center gap-2 text-destructive font-bold text-sm">
                      <AlertCircle size={18} />
                      Mijoz tanlanmagan!
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-2">
                        Nasiya qaytarish sanasi
                      </div>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-orange-500/30 bg-background text-foreground text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/50"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Numpad & Summary */}
          <div className="w-1/2 flex flex-col bg-background">
            {/* Summary */}
            <div className="p-6 bg-secondary/10 border-b border-border">
              <div className="flex justify-between items-end mb-1">
                <span className="text-muted-foreground font-medium">Jami summa</span>
                <span className="text-2xl font-black text-foreground">{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end mb-1">
                <span className="text-muted-foreground font-medium">To'lanmoqda</span>
                <span className={cn("text-xl font-bold transition-colors", paidAmount > totalAmount ? "text-destructive" : "text-green-600")}>
                  {paidAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-end pt-2 border-t border-border mt-2">
                <span className="font-bold text-muted-foreground">Qoldiq</span>
                <span className={cn(
                  "text-xl font-black",
                  remainingAmount === 0 ? "text-green-500" : "text-destructive"
                )}>
                  {Math.abs(remainingAmount).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-6 py-2 bg-destructive/10 text-destructive text-sm font-bold flex items-center justify-center gap-2 animate-pulse">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* Numpad */}
            <div className="flex-1 p-6 grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => handleNumpad(num.toString())}
                  className="rounded-xl bg-card hover:bg-secondary border border-border text-2xl font-bold text-foreground transition-all active:scale-95 shadow-sm"
                >
                  {num}
                </button>
              ))}
              <button onClick={() => handleNumpad('C')} className="rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive font-bold text-xl transition-all active:scale-95 border border-destructive/20">C</button>
              <button onClick={() => handleNumpad('0')} className="rounded-xl bg-card hover:bg-secondary border border-border text-2xl font-bold text-foreground transition-all active:scale-95 shadow-sm">0</button>
              <button onClick={() => handleNumpad('back')} className="rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-all active:scale-95 flex items-center justify-center border border-border">
                <ChevronLeft size={28} />
              </button>
            </div>

            {/* Pay Button */}
            <div className="p-6 pt-0">
              <button
                onClick={handlePay}
                disabled={remainingAmount !== 0}
                className={cn(
                  "w-full py-4 rounded-xl font-black text-xl text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2",
                  remainingAmount === 0
                    ? "bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/25 hover:shadow-green-500/40"
                    : "bg-gray-400 cursor-not-allowed opacity-50"
                )}
              >
                TO'LASH
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PaymentModal;