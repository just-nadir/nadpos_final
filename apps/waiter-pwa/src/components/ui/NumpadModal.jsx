import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Delete } from 'lucide-react';
import { Button } from './Button';
import { motion, AnimatePresence } from 'framer-motion';

export const NumpadModal = ({ isOpen, onClose, onConfirm, title = "Miqdor kiriting", initialValue = "", suffix = "kg" }) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        if (isOpen) {
            setValue(initialValue);
        }
    }, [isOpen, initialValue]);

    const handleNumPad = (btn) => {
        if (btn === 'C') {
            setValue('');
        } else if (btn === '.') {
            if (!value.includes('.')) setValue(prev => prev + '.');
        } else if (btn === 'back') {
            setValue(prev => prev.slice(0, -1));
        } else {
            // Agar nuqtadan keyin 3 xona bo'lsa, boshqa yozilmasin
            if (value.includes('.') && value.split('.')[1].length >= 3) return;
            setValue(prev => prev + btn);
        }
    };

    const handleConfirm = () => {
        const num = parseFloat(value);
        if (num > 0) {
            onConfirm(num);
            onClose();
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#020617] w-full max-w-[350px] rounded-3xl shadow-2xl p-6 border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-2xl mb-6 text-center border border-white/5">
                    <span className="text-4xl font-mono font-bold text-white">{value || '0'}</span>
                    <span className="text-slate-500 ml-2 font-medium">{suffix}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(btn => (
                        <button
                            key={btn}
                            onClick={() => handleNumPad(btn)}
                            className="h-16 rounded-xl bg-slate-800 text-white text-2xl font-bold hover:bg-slate-700 active:scale-95 transition-all border border-white/5"
                        >
                            {btn}
                        </button>
                    ))}
                    <button
                        onClick={() => handleNumPad('back')}
                        className="h-16 rounded-xl bg-slate-800/50 text-red-400 text-2xl font-bold hover:bg-slate-800 hover:text-red-300 active:scale-95 transition-all border border-white/5 flex items-center justify-center"
                    >
                        <Delete size={28} />
                    </button>
                </div>

                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setValue('')} className="flex-1 !h-14 !text-lg !font-bold">
                        Tozalash
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        className="flex-[2] !h-14 !text-lg !font-bold"
                        disabled={!value || parseFloat(value) <= 0}
                    >
                        Tasdiqlash
                    </Button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};
