import React, { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import { Calendar, Clock, Users, User, Phone, ChevronRight, Loader2, X } from "lucide-react";
import { format, roundToNearestMinutes } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const CreateReservationSheet = ({ open, onOpenChange, onSave, editingReservation }) => {
    const [loading, setLoading] = useState(false);
    const [tables, setTables] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_phone: '',
        reservation_time: '',
        guests: 2,
        table_id: 'auto',
        note: ''
    });

    // Load initial data
    useEffect(() => {
        if (open) {
            if (editingReservation) {
                setFormData({
                    ...editingReservation,
                    table_id: editingReservation.table_id || 'auto'
                });
            } else {
                const now = new Date();
                const rounded = roundToNearestMinutes(now, { nearestTo: 30, roundingMethod: 'ceil' });
                setFormData({
                    customer_name: '',
                    customer_phone: '',
                    reservation_time: format(rounded, "yyyy-MM-dd'T'HH:mm"),
                    guests: 2,
                    table_id: 'auto',
                    note: ''
                });
            }
            loadTables();
        }
    }, [open, editingReservation]);

    const loadTables = async () => {
        if (window.electron && window.electron.ipcRenderer) {
            try {
                const result = await window.electron.ipcRenderer.invoke('get-tables');
                setTables(Array.isArray(result) ? result : []);
            } catch (e) {
                console.error("Failed to load tables", e);
            }
        } else {
            // Mock
            setTables([
                { id: '1', name: '1', hall_name: 'Asosiy Zal', capacity: 4 },
                { id: '2', name: '2', hall_name: 'Asosiy Zal', capacity: 4 },
                { id: '3', name: 'VIP 1', hall_name: 'Terrasa', capacity: 8 },
            ]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData };
            if (payload.table_id === 'auto') payload.table_id = null;

            await onSave(payload);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Prevent scrolling when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [open]);

    const renderInput = (label, icon, component) => (
        <div className="space-y-1.5 pointer-events-auto">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>
            <div className="relative">
                {component}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    {icon}
                </div>
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onOpenChange(false)}
                        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                    />

                    {/* Sheet Content */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="fixed inset-y-0 right-0 z-50 h-full w-full sm:max-w-md bg-background shadow-2xl border-l p-0 flex flex-col"
                    >
                        <div className="h-full flex flex-col">
                            {/* Header */}
                            <div className="p-6 border-b flex justify-between items-start bg-muted/20">
                                <div className="space-y-1">
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {editingReservation ? 'Bronni Tahrirlash' : 'Yangi Bron'}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Mehmon ma'lumotlarini kiriting va stol band qiling.
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="-mt-1">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Form Scrollable Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Customer Info Group */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <User size={14} /> Mijoz Ma'lumotlari
                                    </h4>
                                    <div className="grid gap-4">
                                        {renderInput("Ism Familiya", <User size={16} />,
                                            <input
                                                placeholder="Masalan: Sardor"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                                                value={formData.customer_name}
                                                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                            />
                                        )}
                                        {renderInput("Telefon Raqam", <Phone size={16} />,
                                            <input
                                                placeholder="+998 90 123 45 67"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                                                value={formData.customer_phone}
                                                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="h-px bg-border my-2" />

                                {/* Reservation Details Group */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Calendar size={14} /> Bron Tafsilotlari
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            {renderInput("Kelish Vaqti", <Clock size={16} />,
                                                <input
                                                    type="datetime-local"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                                                    value={formData.reservation_time}
                                                    onChange={(e) => setFormData({ ...formData, reservation_time: e.target.value })}
                                                />
                                            )}
                                        </div>
                                        <div>
                                            {renderInput("Mehmonlar", <Users size={16} />,
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                                                    value={formData.guests}
                                                    onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                                                />
                                            )}
                                        </div>
                                        <div className="space-y-1.5 pointer-events-auto">
                                            <label className="text-sm font-medium leading-none">Stol</label>
                                            <select
                                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={formData.table_id}
                                                onChange={(e) => setFormData({ ...formData, table_id: e.target.value })}
                                            >
                                                <option value="auto">Avtomatik</option>
                                                {tables.map(t => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.hall_name} - {t.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 pointer-events-auto">
                                    <label className="text-sm font-medium leading-none">Izoh (Ixtiyoriy)</label>
                                    <textarea
                                        placeholder="Masalan: Tug'ilgan kun, deraza oldida..."
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                        value={formData.note}
                                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 border-t bg-muted/20 flex gap-3">
                                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                                    Bekor qilish
                                </Button>
                                <Button onClick={handleSubmit} disabled={loading} className="flex-[2]">
                                    {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <ChevronRight className="mr-2 h-4 w-4" />}
                                    {editingReservation ? 'Saqlash' : 'Bron Qilish'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CreateReservationSheet;
