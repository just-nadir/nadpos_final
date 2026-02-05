import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, Send, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

export const CartBottomSheet = ({
    isOpen,
    onClose,
    cart,
    onUpdateQty,
    onClear,
    onSend,
    sending,
    total
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)] rounded-t-3xl border-t border-[var(--border)] max-h-[85vh] flex flex-col shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Handle */}
                        <div className="w-full flex justify-center pt-4 pb-2" onPointerDown={(e) => e.preventDefault()}>
                            <div className="w-12 h-1.5 rounded-full bg-slate-700/50" />
                        </div>

                        {/* Header */}
                        <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--border)]">
                            <div>
                                <h2 className="text-xl font-bold text-white">Savatcha</h2>
                                <p className="text-sm text-slate-400">{cart.length} ta mahsulot</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={onClose} className="!p-2 -mr-2">
                                <X size={24} />
                            </Button>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                            {cart.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50"
                                >
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white text-sm truncate">{item.name}</h3>
                                        <p className="text-indigo-400 text-sm font-bold mt-1">
                                            {item.price.toLocaleString()} so'm
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-slate-900/50 rounded-xl p-1 border border-slate-700/50">
                                        <button
                                            onClick={() => onUpdateQty(item.id, -1)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="w-6 text-center text-white font-bold text-sm">{item.qty}</span>
                                        <button
                                            onClick={() => onUpdateQty(item.id, 1)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-[var(--border)] bg-[var(--background)] safe-bottom">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-slate-400 font-medium">Jami summa:</span>
                                <span className="text-2xl font-bold text-white tracking-tight">{total.toLocaleString()} so'm</span>
                            </div>
                            <div className="flex gap-4">
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    onClick={onClear}
                                    className="!w-auto !px-6"
                                >
                                    <Trash2 size={20} />
                                </Button>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={onSend}
                                    disabled={sending}
                                    isLoading={sending}
                                    className="flex-1"
                                >
                                    {!sending && <Send size={20} className="mr-2" />}
                                    Oshxonaga yuborish
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
