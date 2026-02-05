import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Phone, Users, Clock, Check, ChevronRight, ChevronLeft, Armchair, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, roundToNearestMinutes, addMinutes } from 'date-fns';

const CreateReservationModal = ({ onClose, onSave }) => {
    // --- STATE ---
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [tables, setTables] = useState([]);
    const [errors, setErrors] = useState({});

    // Default Time
    const getDefaultTime = () => {
        const now = new Date();
        const rounded = roundToNearestMinutes(now, { nearestTo: 30, roundingMethod: 'ceil' });
        return format(rounded, "yyyy-MM-dd'T'HH:mm");
    };

    const [formData, setFormData] = useState({
        customer_name: '',
        customer_phone: '',
        reservation_time: getDefaultTime(),
        guests: 2,
        table_id: '',
        note: ''
    });

    // --- DATA LOADING ---
    useEffect(() => {
        const loadTables = async () => {
            if (window.electron && window.electron.ipcRenderer) {
                try {
                    const result = await window.electron.ipcRenderer.invoke('get-tables');
                    setTables(Array.isArray(result) ? result : []);
                } catch (e) {
                    console.error("Failed to load tables", e);
                }
            } else {
                // Mock Data
                setTables([
                    { id: '1', name: '1', hall_name: 'Asosiy Zal', capacity: 4, status: 'free' },
                    { id: '2', name: '2', hall_name: 'Asosiy Zal', capacity: 4, status: 'busy' },
                    { id: '3', name: 'VIP 1', hall_name: 'Terrasa', capacity: 6, status: 'free' },
                ]);
            }
        };
        loadTables();
    }, []);

    // --- HANDLERS ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));

        if (name === 'customer_phone') {
            // Phone formatting
            let raw = value.replace(/\D/g, '');
            if (raw.startsWith('998')) raw = raw.slice(3);
            raw = raw.slice(0, 9);

            let fmt = '+998 ';
            if (raw.length > 0) fmt += raw.slice(0, 2);
            if (raw.length > 2) fmt += ' ' + raw.slice(2, 5);
            if (raw.length > 5) fmt += ' ' + raw.slice(5, 7);
            if (raw.length > 7) fmt += ' ' + raw.slice(7, 9);

            setFormData(prev => ({ ...prev, [name]: raw.length > 0 ? fmt : '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleNext = () => {
        const newErrors = {};
        if (step === 1) {
            if (!formData.customer_name.trim()) newErrors.customer_name = "Ismni kiriting";
            if (!formData.customer_phone || formData.customer_phone.length < 17) newErrors.customer_phone = "Telefon raqam to'liq emas";
            if (!formData.reservation_time) newErrors.reservation_time = "Vaqtni tanlang";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setStep(prev => prev + 1);
    };

    const handleBack = () => setStep(prev => prev - 1);

    const handleSubmit = async () => {
        setLoading(true);
        setErrors({});
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            let message = error.message || "Xatolik yuz berdi";
            if (message.includes("Error invoking remote method")) {
                message = message.split("Error: ")[1] || message;
            }
            setErrors({ general: message });
            // Agar vaqt band bo'lsa orqaga qaytmaymiz, xatoni ko'rsatamiz
        } finally {
            setLoading(false);
        }
    };

    // --- STEPS CONTENT ---

    // STEP 1: INFO
    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5">
                {/* NAME */}
                <div className="relative">
                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1 mb-1.5 block">Mijoz Ismi</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <input
                            name="customer_name"
                            value={formData.customer_name}
                            onChange={handleChange}
                            autoFocus
                            placeholder="Ism Familiya"
                            className={`w-full h-14 pl-12 rounded-2xl bg-gray-50 dark:bg-zinc-900 border ${errors.customer_name ? 'border-red-500' : 'border-transparent'} focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-lg transition-all`}
                        />
                    </div>
                </div>

                {/* PHONE */}
                <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1 mb-1.5 block">Telefon</label>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <input
                            name="customer_phone"
                            value={formData.customer_phone}
                            onChange={handleChange}
                            placeholder="+998 90 123 45 67"
                            className={`w-full h-14 pl-12 rounded-2xl bg-gray-50 dark:bg-zinc-900 border ${errors.customer_phone ? 'border-red-500' : 'border-transparent'} focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-lg transition-all`}
                        />
                    </div>
                </div>

                {/* TIME & GUESTS ROW */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase ml-1 mb-1.5 block">Vaqt</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                type="datetime-local"
                                name="reservation_time"
                                min={new Date().toISOString().slice(0, 16)}
                                value={formData.reservation_time}
                                onChange={handleChange}
                                className="w-full h-14 pl-9 pr-2 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-transparent focus:border-indigo-500 outline-none font-semibold text-sm sm:text-base text-center"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase ml-1 mb-1.5 block">Mehmonlar</label>
                        <div className="flex items-center gap-2 h-14 bg-gray-50 dark:bg-zinc-900 rounded-2xl px-2">
                            <button
                                onClick={() => setFormData(p => ({ ...p, guests: Math.max(1, p.guests - 1) }))}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 shadow-sm active:scale-90 transition-transform"
                            >-</button>
                            <span className="flex-1 text-center font-bold text-lg">{formData.guests}</span>
                            <button
                                onClick={() => setFormData(p => ({ ...p, guests: p.guests + 1 }))}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 active:scale-90 transition-transform"
                            >+</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // STEP 2: TABLE SELECTION
    const renderStep2 = () => (
        <div className="h-full flex flex-col">
            <h4 className="text-sm font-bold text-muted-foreground uppercase mb-4">Stol Tanlash</h4>

            <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* AUTO OPTION */}
                    <button
                        onClick={() => setFormData(p => ({ ...p, table_id: '' }))}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.table_id === ''
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-dashed border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.table_id === '' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-zinc-800'}`}>
                            Auto
                        </div>
                        <span className="font-semibold text-sm">Avtomatik</span>
                    </button>

                    {/* TABLES */}
                    {tables.map(t => {
                        const isBusy = t.status === 'busy' || t.status === 'active'; // Adjust based on DB structure
                        const isSelected = formData.table_id === t.id;

                        return (
                            <button
                                key={t.id}
                                disabled={isBusy}
                                onClick={() => setFormData(p => ({ ...p, table_id: t.id }))}
                                className={`relative h-20 px-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${isSelected
                                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-md shadow-indigo-500/10'
                                    : isBusy
                                        ? 'border-transparent bg-gray-100 dark:bg-zinc-900/50 opacity-60 cursor-not-allowed'
                                        : 'border-transparent bg-white dark:bg-zinc-900 shadow-sm hover:border-indigo-200 border border-gray-100'
                                    }`}
                            >
                                {/* Combined Name: "Zal 1" */}
                                <span className="text-lg font-bold leading-none text-center w-full truncate px-1">
                                    {t.hall_name || 'Zal'} <span className="text-indigo-600 dark:text-indigo-400">{t.name}</span>
                                </span>

                                {/* Capacity Badge - Minimal */}
                                <span className="text-[11px] font-medium text-muted-foreground bg-gray-100 dark:bg-zinc-800/50 px-2 py-0.5 rounded-md">
                                    {t.capacity}
                                </span>

                                {/* Selection Check - Absolute Positioned (Optional, keeping it subtle) */}
                                {isSelected && (
                                    <div className="absolute top-1 right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Izoh (Ixtiyoriy)</label>
                <textarea
                    value={formData.note}
                    onChange={(e) => setFormData(p => ({ ...p, note: e.target.value }))}
                    placeholder="Masalan: Deraza oldida, tug'ilgan kun..."
                    className="w-full h-20 p-3 rounded-xl bg-gray-50 dark:bg-zinc-900 border-none outline-none resize-none text-sm"
                />
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* HEAD */}
                <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Yangi Bron</h2>
                        <div className="flex gap-1 mt-1">
                            <div className={`h-1 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                            <div className={`h-1 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* ERROR BANNER */}
                {errors.general && (
                    <div className="mx-5 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-semibold border border-red-100 dark:border-red-800 flex items-center gap-2">
                        <AlertCircle size={16} />
                        {errors.general}
                    </div>
                )}

                {/* BODY */}
                <div className="flex-1 p-5 overflow-hidden flex flex-col">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ x: step === 1 ? -20 : 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: step === 1 ? 20 : -20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {step === 1 ? renderStep1() : renderStep2()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* FOOTER */}
                <div className="p-5 bg-gray-50 dark:bg-zinc-900/50 flex gap-3">
                    {step === 2 && (
                        <button
                            onClick={handleBack}
                            disabled={loading}
                            className="px-6 py-3.5 rounded-xl font-bold bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}

                    <button
                        onClick={step === 1 ? handleNext : handleSubmit}
                        disabled={loading}
                        className="flex-1 py-3.5 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Saqlanmoqda...' : (step === 1 ? 'Davom Etish' : 'Tasdiqlash')}
                        {!loading && step === 1 && <ChevronRight size={18} />}
                        {!loading && step === 2 && <Check size={18} />}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default CreateReservationModal;
