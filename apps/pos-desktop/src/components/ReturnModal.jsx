import React, { useState, useEffect } from 'react';
import { X, RefreshCcw, Minus, Plus } from 'lucide-react';

const ReturnModal = ({ isOpen, onClose, onConfirm, item }) => {
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReturnQuantity(1);
      setReason('');
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const maxQuantity = item.quantity;

  // Determine if item is by weight/decimal
  // If unit_type is 'kg' or if quantity has decimals.
  // Note: 'item' might not have unit_type if it comes from order_items table joins. 
  // But checking if quantity is float is a good heuristic.
  const isKg = item.unit_type === 'kg' || item.quantity % 1 !== 0;

  const isFullReturn = returnQuantity === maxQuantity;

  const handleIncrement = () => {
    if (returnQuantity < maxQuantity) {
      setReturnQuantity(prev => {
        const next = isKg ? parseFloat((prev + 0.1).toFixed(3)) : prev + 1;
        return next > maxQuantity ? maxQuantity : next;
      });
    }
  };

  const handleDecrement = () => {
    if (returnQuantity > (isKg ? 0.001 : 1)) {
      setReturnQuantity(prev => {
        const next = isKg ? parseFloat((prev - 0.1).toFixed(3)) : prev - 1;
        return next < 0 ? 0 : next;
      });
    }
  };

  const remaining = parseFloat((maxQuantity - returnQuantity).toFixed(3));

  const handleConfirm = () => {
    onConfirm(item.id, returnQuantity, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
      <div className="bg-white w-[450px] rounded-2xl shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
            <RefreshCcw size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Mahsulotni Qaytarish</h2>
          <p className="text-gray-500 text-sm mt-1">{item.product_name}</p>
        </div>

        <div className="space-y-6">
          {/* Quantity Selector */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Qaytarish miqdori:</span>
              <span className="text-xs font-bold bg-gray-200 px-2 py-0.5 rounded text-gray-600">
                Jami: {maxQuantity}
              </span>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleDecrement}
                disabled={returnQuantity <= (isKg ? 0.001 : 1)}
                className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Minus size={18} />
              </button>

              <div className="flex-1 max-w-[120px]">
                <input
                  type="number"
                  step={isKg ? "0.001" : "1"}
                  value={returnQuantity}
                  onChange={(e) => {
                    let val = parseFloat(e.target.value);
                    if (isNaN(val)) val = 0;
                    if (val > maxQuantity) val = maxQuantity;
                    if (val < 0) val = 0;
                    setReturnQuantity(val);
                  }}
                  className="w-full text-center text-2xl font-bold text-gray-800 bg-transparent border-b border-gray-300 focus:border-orange-500 outline-none"
                />
              </div>

              <button
                onClick={handleIncrement}
                disabled={returnQuantity >= maxQuantity}
                className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="text-center mt-3">
              <span className={`text-sm font-bold ${isFullReturn ? 'text-red-500' : 'text-orange-500'}`}>
                {isFullReturn ? "To'liq o'chiriladi" : `${remaining} ta qoladi`}
              </span>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sabab (ixtiyoriy)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Masalan: Mijoz rad etdi"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-200 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors border border-gray-200"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 ${isFullReturn ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}`}
            >
              Qaytarish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnModal;
