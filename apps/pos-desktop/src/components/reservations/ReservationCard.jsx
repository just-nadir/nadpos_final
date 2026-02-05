import React from 'react';
import { format, parseISO } from 'date-fns';
import { uz } from 'date-fns/locale';
import {
    Calendar,
    Clock,
    Users,
    CheckCircle,
    XCircle,
    MoreVertical,
    Phone,
    Armchair,
    Edit,
    Trash2,
    CalendarCheck,
    AlertCircle
} from 'lucide-react';
import { Button } from "../ui/button";

const StatusBadge = ({ status }) => {
    const config = {
        active: { color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', label: 'Aktiv' },
        completed: { color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', label: 'Yakunlandi' },
        cancelled: { color: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', label: 'Bekor' },
        pending: { color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', label: 'Kutilmoqda' },
    };

    const style = config[status] || config.active;

    return (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${style.color}`}>
            <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current`}></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
            </span>
            {style.label}
        </span>
    );
};

const ReservationCard = ({ reservation, onUpdateStatus, onDelete, onEdit }) => {

    // Status update helper
    const nextStatus = {
        'pending': 'active',
        'active': 'completed',
    };

    return (
        <div className="group relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-border/60 hover:border-primary/50 rounded-xl p-4 shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col gap-3">

            {/* Header: Name & Status */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                        {reservation.customer_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-foreground text-sm truncate">{reservation.customer_name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone size={10} />
                            <span className="truncate">{reservation.customer_phone}</span>
                        </div>
                    </div>
                </div>
                <StatusBadge status={reservation.status} />
            </div>

            {/* Content: Time, Table, Guests */}
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/50 p-2 rounded-lg border border-border/50 flex items-center gap-2">
                    <Clock size={14} className="text-primary" />
                    <span className="font-medium text-foreground">
                        {format(parseISO(reservation.reservation_time), 'HH:mm')}
                    </span>
                </div>
                <div className="bg-muted/50 p-2 rounded-lg border border-border/50 flex items-center gap-2">
                    <Users size={14} className="text-primary" />
                    <span className="font-medium text-foreground">{reservation.guests} kishi</span>
                </div>
                <div className="col-span-2 bg-muted/50 p-2 rounded-lg border border-border/50 flex items-center gap-2">
                    <Armchair size={14} className="text-orange-500" />
                    <span className="font-medium text-foreground truncate">
                        {reservation.table_name ? `${reservation.hall_name || ''} - ${reservation.table_name}` : 'Stol tanlanmagan'}
                    </span>
                </div>
            </div>

            {/* Note if exists */}
            {reservation.note && (
                <div className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-900/10 dark:text-amber-400 p-2 rounded-lg border border-amber-100 dark:border-amber-900/20 flex gap-1.5">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{reservation.note}</span>
                </div>
            )}

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-auto">
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => onEdit(reservation)}
                        title="Tahrirlash"
                    >
                        <Edit size={14} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => onDelete(reservation.id)}
                        title="O'chirish"
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>

                {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors ml-auto"
                        onClick={() => onUpdateStatus(reservation.id, nextStatus[reservation.status] || 'completed')}
                    >
                        {reservation.status === 'pending' ? (
                            <> <CheckCircle size={12} /> Tasdiqlash </>
                        ) : (
                            <> <CheckCircle size={12} /> Yakunlash </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ReservationCard;
