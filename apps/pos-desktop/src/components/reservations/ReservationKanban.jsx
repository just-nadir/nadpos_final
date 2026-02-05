import React from 'react';
import { useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ReservationCard from './ReservationCard';
import { ClipboardList, CheckCircle2, XCircle, Clock, Loader2, CalendarClock } from 'lucide-react';

const KanbanColumn = ({ status, title, icon: Icon, color, reservations, onUpdateStatus, onDelete, onEdit }) => {
    // Kelajakda DnD qo'shish uchun tayyorgarlik
    return (
        <div className="flex flex-col h-full bg-muted/30 rounded-2xl border border-border/50 overflow-hidden">
            {/* Column Header */}
            <div className={`p-4 border-b border-border/50 flex items-center justify-between bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10 ${color}`}>
                <div className="flex items-center gap-2 font-bold">
                    <Icon size={18} />
                    <h3>{title}</h3>
                </div>
                <span className="bg-background/80 px-2.5 py-0.5 rounded-lg text-xs font-bold shadow-sm border border-border/50">
                    {reservations.length}
                </span>
            </div>

            {/* Column Body */}
            <div className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-3">
                {reservations.map(res => (
                    <ReservationCard
                        key={res.id}
                        reservation={res}
                        onUpdateStatus={onUpdateStatus}
                        onDelete={onDelete}
                        onEdit={onEdit}
                    />
                ))}
                {reservations.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center text-muted-foreground/40 border-2 border-dashed border-border/40 rounded-xl m-2">
                        <p className="text-xs font-medium">Bo'sh</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ReservationKanban = ({ reservations, onUpdateStatus, onDelete, onEdit }) => {
    // Status bo'yicha filtrlash
    const getByStatus = (status) => reservations.filter(r => r.status === status);

    const columns = [
        { id: 'pending', title: 'Kutilmoqda', icon: CalendarClock, color: 'text-blue-600 dark:text-blue-400' },
        { id: 'active', title: 'Tasdiqlangan', icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
        { id: 'completed', title: 'Yakunlandi', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
        { id: 'cancelled', title: 'Bekor', icon: XCircle, color: 'text-red-500 dark:text-red-400' },
    ];

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="h-full overflow-x-auto pb-4">
                <div className="flex gap-4 h-full min-w-[1000px] px-1">
                    <KanbanColumn
                        status="pending"
                        title="Kutilmoqda"
                        icon={Loader2}
                        color="text-blue-600"
                        reservations={getByStatus('pending')}
                        onUpdateStatus={onUpdateStatus}
                        onDelete={onDelete}
                        onEdit={onEdit}
                    />
                    <KanbanColumn
                        status="active"
                        title="Aktiv"
                        icon={Clock}
                        color="text-amber-600"
                        reservations={getByStatus('active')}
                        onUpdateStatus={onUpdateStatus}
                        onDelete={onDelete}
                        onEdit={onEdit}
                    />
                    <KanbanColumn
                        status="completed"
                        title="Yakunlandi"
                        icon={CheckCircle2}
                        color="text-emerald-600"
                        reservations={getByStatus('completed')}
                        onUpdateStatus={onUpdateStatus}
                        onDelete={onDelete}
                        onEdit={onEdit}
                    />
                    <KanbanColumn
                        status="cancelled"
                        title="Bekor qilindi"
                        icon={XCircle}
                        color="text-red-500"
                        reservations={getByStatus('cancelled')}
                        onUpdateStatus={onUpdateStatus}
                        onDelete={onDelete}
                        onEdit={onEdit}
                    />
                </div>
            </div>
        </DndProvider>
    );
};

export default ReservationKanban;
