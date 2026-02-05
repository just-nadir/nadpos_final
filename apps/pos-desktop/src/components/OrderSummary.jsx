import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CreditCard, User, Wallet, X, Printer, Hash, Trash2, PlusCircle, ArrowRightLeft } from 'lucide-react';
import PaymentModal from './PaymentModal';
import CustomerModal from './CustomerModal';
import ConfirmModal from './ConfirmModal';
import ReturnModal from './ReturnModal';
import MoveTableModal from './MoveTableModal';
import { useGlobal } from '../context/GlobalContext';
import { cn } from '../utils/cn';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const OrderSummary = ({ table, onDeselect }) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToReturn, setItemToReturn] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [bonusToUse, setBonusToUse] = useState(0);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [printingCheck, setPrintingCheck] = useState(false);

  const { settings, showToast } = useGlobal();

  const loadOrderItems = useCallback(async (tableId) => {
    if (!window.electron) return;
    setLoading(true);
    try {
      const { ipcRenderer } = window.electron;
      const items = await ipcRenderer.invoke('get-table-items', tableId);
      setOrderItems(items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelectedCustomer(null);
    setBonusToUse(0);
    setOrderItems([]);
    if (table) {
      loadOrderItems(table.id);
    }
  }, [table, loadOrderItems]);

  // Hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Space - Open Payment (only if not typing in input)
      if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (table && orderItems.length > 0) {
          setIsPaymentModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [table, orderItems]);

  const handlePrintCheck = useCallback(async () => {
    if (!table || !window.electron || printingCheck) return;

    setPrintingCheck(true);
    try {
      const { ipcRenderer } = window.electron;
      const result = await ipcRenderer.invoke('print-check', table.id);

      if (result.success) {
        showToast('success', `Chek chop etildi: #${result.checkNumber}`);
      }
    } catch (error) {
      console.error('HISOB chiqarishda xato:', error);
      showToast('error', `Xato: ${error.message}`);
    } finally {
      setPrintingCheck(false);
    }
  }, [table, printingCheck, showToast]);

  const handleRemoveItem = useCallback((item) => {
    setItemToReturn(item);
  }, []);

  const handleReturnItem = useCallback(async (itemId, quantity, reason) => {
    if (!window.electron) return;
    try {
      const { ipcRenderer } = window.electron;
      const result = await ipcRenderer.invoke('return-order-item', { itemId, quantity, reason });

      if (result.success) {
        showToast('success', 'Mahsulot muvaffaqiyatli qaytarildi');
        loadOrderItems(table.id);
      }
      setItemToReturn(null);
    } catch (error) {
      console.error("Return item error:", error);
      showToast('error', "Qaytarishda xatolik: " + error.message);
    }
  }, [table, showToast, loadOrderItems]);

  const confirmRemoveItem = useCallback(async () => {
    if (!itemToDelete || !window.electron) return;
    try {
      const { ipcRenderer } = window.electron;
      const result = await ipcRenderer.invoke('remove-order-item', itemToDelete.id);
      if (result.success) {
        showToast('success', 'Mahsulot o\'chirildi');
        loadOrderItems(table.id);
      }
      setItemToDelete(null);
    } catch (error) {
      console.error("Remove item error:", error);
      showToast('error', "Xatolik: " + error.message);
    }
  }, [itemToDelete, table, showToast, loadOrderItems]);

  const handleCancelOrder = useCallback(async () => {
    if (!table || !window.electron) return;
    try {
      const { ipcRenderer } = window.electron;
      const result = await ipcRenderer.invoke('cancel-order', table.id);
      if (result.success) {
        if (onDeselect) onDeselect();
      }
    } catch (error) {
      console.error("Cancel error:", error);
      showToast('error', "Xatolik yuz berdi: " + error.message);
    }
  }, [table, onDeselect, showToast]);

  const handlePrintCheckDisabled = useCallback(() => {
    return !table || orderItems.length === 0 || printingCheck || loading;
  }, [table, orderItems.length, printingCheck, loading]);

  const subtotal = useMemo(() => {
    return orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [orderItems]);

  const guestsCount = table?.guests || 0;

  const service = useMemo(() => {
    const svcValue = Number(settings.serviceChargeValue) || 0;
    // Always calculate as percentage
    return (subtotal * svcValue) / 100;
  }, [subtotal, settings.serviceChargeValue]);

  const preTotal = subtotal + service;

  const discountAmount = useMemo(() => {
    let amount = 0;
    if (selectedCustomer) {
      if (selectedCustomer.type === 'discount') {
        amount = (subtotal * selectedCustomer.value) / 100;
      } else if (selectedCustomer.type === 'cashback') {
        amount = bonusToUse;
      }
    }
    return amount;
  }, [subtotal, selectedCustomer, bonusToUse]);

  const finalTotal = preTotal - discountAmount;

  const handlePaymentSuccess = useCallback(async (methodOrPayments, dueDateOrIsSplit) => {
    if (!table || !window.electron) return;
    try {
      const { ipcRenderer } = window.electron;

      let checkoutData;
      const isSplitPayment = Array.isArray(methodOrPayments);

      if (isSplitPayment) {
        const splitPayments = methodOrPayments;
        const paymentDetails = splitPayments.map(p => ({
          method: p.method,
          amount: p.amount,
          dueDate: p.dueDate || null
        }));

        checkoutData = {
          tableId: table.id,
          total: finalTotal,
          subtotal: subtotal,
          discount: discountAmount,
          paymentMethod: 'split',
          customerId: selectedCustomer ? selectedCustomer.id : null,
          items: orderItems,
          dueDate: null,
          paymentDetails: paymentDetails
        };
      } else {
        const method = methodOrPayments;
        const dueDate = dueDateOrIsSplit;

        checkoutData = {
          tableId: table.id,
          total: finalTotal,
          subtotal: subtotal,
          discount: discountAmount,
          paymentMethod: method,
          customerId: selectedCustomer ? selectedCustomer.id : null,
          items: orderItems,
          dueDate: dueDate || null
        };
      }

      await ipcRenderer.invoke('checkout', checkoutData);

      setIsPaymentModalOpen(false);
      if (onDeselect) onDeselect();

    } catch (error) {
      console.error(error);
    }
  }, [table, finalTotal, subtotal, discountAmount, selectedCustomer, orderItems, onDeselect]);

  const handleBonusChange = (e) => {
    const valueStr = e.target.value;
    if (valueStr === '') {
      setBonusToUse(0);
      return;
    }
    let val = Number(valueStr);
    if (val < 0) return;
    if (val > selectedCustomer.balance) val = selectedCustomer.balance;
    if (val > preTotal) val = preTotal;
    setBonusToUse(val);
  };

  if (!table) {
    return (
      <div className="h-full w-full bg-card flex flex-col items-center justify-center text-muted-foreground p-10 text-center select-none animate-in fade-in">
        <div className="bg-secondary/50 p-8 rounded-full mb-6">
          <CreditCard size={64} strokeWidth={1.5} />
        </div>
        <h3 className="font-bold text-2xl text-foreground mb-2">Buyurtma yaratish uchun stol tanlang</h3>
        <p className="text-base max-w-xs opacity-70">Chap tomondagi ro'yxatdan stolni tanlang yoki yangi stol oching.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 w-full bg-card h-full flex flex-col border-none shadow-xl z-20">
        {/* HEADER */}
        <div className={cn(
          "p-6 border-b border-border transition-colors relative z-10",
          table.status === 'payment' ? 'bg-yellow-50 dark:bg-yellow-950/20' :
            table.status === 'free' ? 'bg-green-50 dark:bg-green-950/20' : 'bg-secondary/40 dark:bg-secondary/10'
        )}>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-3xl font-black text-foreground">{table.displayName || table.name}</h2>

            <div className="flex items-center gap-2">
              {/* Move Table Button (NEW) */}
              {table.status !== 'free' && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsMoveModalOpen(true)}
                  className="h-10 w-10 rounded-xl border-primary/20 bg-background hover:bg-primary hover:text-white transition-all shadow-sm"
                  title="Stolni ko'chirish / Birlashtirish"
                >
                  <ArrowRightLeft size={18} />
                </Button>
              )}

              {/* CHEK RAQAMI */}
              {table.current_check_number > 0 && (
                <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-xl shadow-sm border border-border">
                  <Hash size={18} className="text-muted-foreground" />
                  <span className="font-black text-2xl text-foreground">{table.current_check_number}</span>
                </div>
              )}
            </div>

            {table.status === 'free' && (
              <div className="bg-green-100 dark:bg-green-900/50 px-4 py-1.5 rounded-lg border border-green-200 dark:border-green-800">
                <span className="font-bold text-sm text-green-700 dark:text-green-300 uppercase tracking-wider">YANGI BUYURTMA</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            {table.status !== 'free' && (
              <Badge variant={table.status === 'occupied' ? 'default' : 'secondary'} className={cn(
                "px-3 py-1 text-sm font-bold",
                table.status === 'occupied' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200'
              )}>
                {table.status === 'occupied' ? 'Band Stol' : 'To\'lov Kutilmoqda'}
              </Badge>
            )}
          </div>
        </div>

        {/* CUSTOMER */}
        {selectedCustomer && (
          <div className="px-6 py-4 bg-primary/5 border-b border-primary/10">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <User size={20} />
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg">{selectedCustomer.name}</p>
                  <p className="text-sm font-medium text-primary">
                    {selectedCustomer.type === 'discount'
                      ? `VIP: ${selectedCustomer.value}% Chegirma`
                      : `Bonus: ${selectedCustomer.balance.toLocaleString()} so'm`}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="h-8 w-8 flex items-center justify-center hover:bg-background rounded-full text-muted-foreground hover:text-destructive transition-colors"><X size={20} /></button>
            </div>
            {selectedCustomer.type === 'cashback' && selectedCustomer.balance > 0 && (
              <div className="bg-background p-3 rounded-xl border border-border mt-2 shadow-sm">
                <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  <span>Bonusdan to'lash:</span><span>Max: {selectedCustomer.balance.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet size={20} className="text-green-500" />
                  <input
                    type="number"
                    value={bonusToUse === 0 ? '' : bonusToUse}
                    onChange={handleBonusChange}
                    placeholder="Summa kiriting"
                    className="w-full outline-none text-lg font-bold text-foreground bg-transparent placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ITEMS LIST */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin bg-secondary/5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground animate-pulse">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="font-medium">Yuklanmoqda...</p>
            </div>
          ) : orderItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground/40 select-none">
              <PlusCircle size={80} strokeWidth={0.5} className="mb-4 text-muted-foreground/20" />
              <p className="text-xl font-bold">Hech narsa yo'q</p>
              <p className="text-sm">Menyudan mahsulot tanlang</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {orderItems.map((item, index) => (
                <div key={index} className="bg-background rounded-2xl p-4 shadow-sm border border-border/50 hover:border-primary/20 transition-all group flex items-center justify-between gap-3">
                  {/* Left: Name */}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-lg text-foreground truncate leading-tight mb-1" title={item.product_name}>
                      {item.product_name}
                    </p>
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-secondary/50 text-secondary-foreground text-sm font-medium">
                      {item.quantity} x {item.price.toLocaleString()}
                    </div>
                  </div>

                  {/* Right: Total & Delete */}
                  <div className="flex items-center gap-4">
                    <p className="font-black text-xl text-primary tabular-nums">
                      {(item.price * item.quantity).toLocaleString()}
                    </p>

                    <button
                      onClick={() => handleRemoveItem(item)}
                      className="h-12 w-12 flex items-center justify-center rounded-xl bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all active:scale-95"
                      title="O'chirish"
                    >
                      <Trash2 size={22} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TOTALS SECTION */}
        <div className="p-6 bg-card border-t border-border space-y-3 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-10">
          <div className="space-y-1.5">
            <div className="flex justify-between text-base font-medium text-muted-foreground">
              <span>Stol hisobi:</span>
              <span className="text-foreground">{subtotal.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-base font-medium text-muted-foreground">
              <span>Xizmat ({settings.serviceChargeValue || 0}%):</span>
              <span className="text-foreground">{service.toLocaleString()}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-orange-500 font-bold text-base">
                <span>Chegirma:</span>
                <span>- {discountAmount.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-end border-t border-dashed border-border pt-4 mt-2">
            <span className="text-lg font-bold text-muted-foreground uppercase tracking-wider mb-1">Jami to'lov:</span>
            <span className="text-4xl font-black text-primary pointer-events-none tabular-nums tracking-tight">{finalTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="p-4 pt-0 border-t-0 bg-card">
          <div className="grid grid-cols-4 gap-3 mb-3">
            {/* Delete Order */}
            <Button
              variant="outline"
              onClick={() => setIsCancelModalOpen(true)}
              disabled={!table || orderItems.length === 0}
              className="h-14 flex-col gap-1 rounded-2xl border-destructive/20 text-destructive hover:bg-destructive hover:text-white hover:border-destructive active:scale-95 transition-all"
              title="Buyurtmani bekor qilish"
            >
              <Trash2 size={20} />
            </Button>

            {/* Customer */}
            <Button
              variant="outline"
              onClick={() => setIsCustomerModalOpen(true)}
              className={cn(
                "col-span-1 h-14 flex-col gap-1 rounded-2xl border-border bg-secondary/10 hover:bg-secondary hover:border-primary/20 hover:text-primary active:scale-95 transition-all",
                selectedCustomer && "border-primary text-primary bg-primary/5"
              )}
            >
              <User size={20} />
            </Button>

            {/* Print Check */}
            <Button
              variant="outline"
              onClick={handlePrintCheck}
              disabled={handlePrintCheckDisabled()}
              className="col-span-2 h-14 rounded-2xl border-border bg-secondary/10 font-bold text-lg hover:bg-secondary hover:text-foreground active:scale-95 transition-all gap-2"
            >
              <Printer size={22} /> {printingCheck ? 'Chop etilmoqda...' : 'Chek Chiqarish'}
            </Button>
          </div>

          <Button
            size="lg"
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-full h-16 text-xl font-bold shadow-xl shadow-primary/25 rounded-2xl gap-3 active:scale-[0.98] transition-all"
          >
            <CreditCard size={24} strokeWidth={2.5} /> To'lovni Yopish
          </Button>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={finalTotal}
        onPay={handlePaymentSuccess}
        selectedCustomer={selectedCustomer}
      />
      <CustomerModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} onSelectCustomer={setSelectedCustomer} />

      {/* MOVE TABLE MODAL */}
      <MoveTableModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        fromTable={table}
        onMoveSuccess={() => {
          if (onDeselect) onDeselect(); // Deselect after moving/merging
        }}
      />

      <ConfirmModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelOrder}
        title="Buyurtmani bekor qilish"
        message="Haqiqatan ham bu stol buyurtmasini butunlay o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
        confirmText="Ha, o'chirish"
        cancelText="Yo'q, qolsin"
        isDanger={true}
      />

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmRemoveItem}
        title="Mahsulotni o'chirish"
        message={`Haqiqatan ham "${itemToDelete?.product_name}" ni buyurtmadan o'chirmoqchimisiz?`}
        confirmText="Ha, o'chirish"
        cancelText="Bekor qilish"
        isDanger={true}
      />

      <ReturnModal
        isOpen={!!itemToReturn}
        onClose={() => setItemToReturn(null)}
        onConfirm={handleReturnItem}
        item={itemToReturn}
      />
    </>
  );
};

export default OrderSummary;