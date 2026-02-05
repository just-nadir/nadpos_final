import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, ArrowRightLeft, User, Hash, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '../utils/cn';
import { useGlobal } from '../context/GlobalContext';

const MoveTableModal = ({ isOpen, onClose, fromTable, onMoveSuccess }) => {
    const [halls, setHalls] = useState([]);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeHallId, setActiveHallId] = useState('all');
    const [targetTable, setTargetTable] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useGlobal();

    useEffect(() => {
        if (isOpen) {
            loadData();
            setTargetTable(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (window.electron) {
                const [hallsData, tablesData] = await Promise.all([
                    window.electron.ipcRenderer.invoke('get-halls'),
                    window.electron.ipcRenderer.invoke('get-tables')
                ]);
                setHalls(hallsData || []);
                // Filter out current table from list
                setTables((tablesData || []).filter(t => t.id !== fromTable?.id));
            }
        } catch (err) {
            console.error(err);
            showToast('error', "Stollar ma'lumotini olishda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleMove = async () => {
        if (!targetTable || !window.electron) return;

        setIsSubmitting(true);
        try {
            await window.electron.ipcRenderer.invoke('move-table', {
                fromTableId: fromTable.id,
                toTableId: targetTable.id
            });

            showToast('success', `${fromTable.displayName || fromTable.name} -> ${targetTable.displayName} ga ko'chirildi`);
            onMoveSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            showToast('error', `Xatolik: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredTables = tables.filter(t => activeHallId === 'all' || t.hall_id === activeHallId);

    // Sort tables: Free ones first, then occupied, then others? Or just by name?
    // User might want to merge, so Show ALL tables.

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
                <DialogHeader className="p-6 pb-2 border-b border-border bg-card">
                    <DialogTitle className="text-2xl font-black flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-xl text-primary"><ArrowRightLeft size={24} /></div>
                        Stol Ko'chirish / Birlashtirish
                    </DialogTitle>
                    <div className="text-muted-foreground font-medium text-base mt-2 flex items-center gap-3">
                        <span className="bg-secondary px-3 py-1 rounded-lg text-foreground font-bold">{fromTable?.displayName || fromTable?.name}</span>
                        <ArrowRight size={18} />
                        <span className={cn("px-3 py-1 rounded-lg font-bold border", targetTable ? "bg-primary text-primary-foreground border-primary" : "border-dashed border-border text-muted-foreground")}>
                            {targetTable ? targetTable.displayName || targetTable.name : "Tanlanmagan"}
                        </span>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* SIDEBAR: Halls */}
                    <div className="w-64 bg-secondary/20 border-r border-border p-4 flex flex-col gap-2 overflow-y-auto">
                        <Button
                            variant={activeHallId === 'all' ? 'default' : 'ghost'}
                            onClick={() => setActiveHallId('all')}
                            className="justify-start h-12 text-lg font-bold w-full"
                        >
                            Barcha Zallar
                        </Button>
                        {halls.map(hall => (
                            <Button
                                key={hall.id}
                                variant={activeHallId === hall.id ? 'default' : 'ghost'}
                                onClick={() => setActiveHallId(hall.id)}
                                className="justify-start h-12 text-lg font-bold w-full"
                            >
                                {hall.name}
                            </Button>
                        ))}
                    </div>

                    {/* MAIN: Tables Grid */}
                    <div className="flex-1 p-6 overflow-y-auto bg-secondary/5">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="animate-spin text-primary" size={48} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-4">
                                {filteredTables.map(table => {
                                    const isSelected = targetTable?.id === table.id;
                                    const hall = halls.find(h => h.id === table.hall_id);
                                    const displayName = hall ? `${hall.name} ${table.name}` : table.name;
                                    table.displayName = displayName; // For easy access

                                    return (
                                        <div
                                            key={table.id}
                                            onClick={() => setTargetTable(table)}
                                            className={cn(
                                                "relative flex flex-col justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer select-none h-40",
                                                isSelected
                                                    ? "border-primary bg-primary/5 shadow-lg transform scale-105"
                                                    : "border-border bg-card hover:border-primary/50 hover:bg-secondary/50"
                                            )}
                                        >
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-xl text-foreground">{displayName}</h3>
                                                <Badge variant="outline" className={cn(
                                                    "font-bold border-0",
                                                    table.status === 'free' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                                )}>
                                                    {table.status === 'free' ? 'BO\'SH' : 'BAND'}
                                                </Badge>
                                            </div>

                                            {table.status !== 'free' && (
                                                <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium bg-background/50 p-2 rounded-lg backdrop-blur-sm">
                                                    <User size={14} /> {table.waiter_name || "Noma'lum"}
                                                    <span className="mx-1">•</span>
                                                    {table.total_amount?.toLocaleString()} so'm
                                                </div>
                                            )}

                                            {isSelected && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-2xl backdrop-blur-[2px]">
                                                    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-lg shadow-xl animate-in zoom-in-50 duration-200">
                                                        TANLANDI
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 border-t border-border bg-card flex justify-between items-center sm:justify-between">
                    <div className="flex items-center gap-3 text-muted-foreground">
                        {targetTable && targetTable.status !== 'free' && (
                            <div className="flex items-center gap-2 text-orange-600 bg-orange-100 px-4 py-2 rounded-xl border border-orange-200">
                                <AlertTriangle size={20} />
                                <span className="font-bold">Diqqat: Ushbu stollar birlashtiriladi!</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={onClose} className="h-14 px-8 text-lg font-bold rounded-xl" disabled={isSubmitting}>Bekor qilish</Button>
                        <Button
                            onClick={handleMove}
                            disabled={!targetTable || isSubmitting}
                            className="h-14 px-10 text-lg font-bold rounded-xl shadow-lg shadow-primary/25"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="mr-2 animate-spin" /> Bajarilmoqda...</>
                            ) : (
                                targetTable?.status === 'free' ? "Stolni Ko'chirish" : "Stollarni Birlashtirish"
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MoveTableModal;
