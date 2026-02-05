import React from 'react';
import { motion } from 'framer-motion';

export const ProductCard = ({ product, qty, onAdd }) => {
    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onAdd(product)}
            className={`
                relative text-left p-4 rounded-2xl border transition-all duration-200 w-full flex items-center justify-between gap-4
                ${qty > 0
                    ? 'bg-indigo-900/20 border-indigo-500/50 shadow-[0_0_0_1px_rgba(99,102,241,0.5)]'
                    : 'bg-[#1e293b]/50 border-slate-800 hover:border-slate-700'
                }
            `}
        >
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-base leading-tight mb-1 truncate">
                    {product.name}
                </h3>
                <p className="text-indigo-400 font-bold text-sm">
                    {product.price.toLocaleString()}
                    <span className="text-xs font-medium text-slate-500 ml-1">so'm</span>
                </p>
            </div>

            {qty > 0 && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/40"
                >
                    {qty}
                </motion.div>
            )}

            {/* Optional: Add a subtle 'Plus' icon if qty is 0 to indicate action, or keep it clean */}
            {qty === 0 && (
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
            )}
        </motion.button>
    );
};
