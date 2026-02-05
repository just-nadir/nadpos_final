import React, { useMemo } from 'react';
import { format, differenceInMinutes, parseISO, setHours, setMinutes, isSameDay } from 'date-fns';
import { uz } from 'date-fns/locale';

const START_HOUR = 9; // 09:00
const END_HOUR = 23; // 23:00
const HOURS_COUNT = END_HOUR - START_HOUR + 1;
const PIXELS_PER_HOUR = 120; // Width of one hour slot

const ReservationTimeline = ({ reservations, tables, onSelectReservation }) => {

    // Group tables by Hall
    const tablesByHall = useMemo(() => {
        const grouped = {};
        if (!tables) return {};

        tables.forEach(table => {
            const hall = table.hall_name || 'Asosiy Zal';
            if (!grouped[hall]) grouped[hall] = [];
            grouped[hall].push(table);
        });
        return grouped;
    }, [tables]);

    const calculatePosition = (startTime, duration = 120) => {
        const start = parseISO(startTime);
        const dayStart = setMinutes(setHours(start, START_HOUR), 0);

        const diffMinutes = differenceInMinutes(start, dayStart);
        const left = (diffMinutes / 60) * PIXELS_PER_HOUR;
        const width = (duration / 60) * PIXELS_PER_HOUR; // Default 2 hours if no duration

        return { left, width };
    };

    return (
        <div className="h-full flex flex-col bg-background/50 overflow-hidden select-none">
            {/* Header: Hours */}
            <div className="flex border-b border-border pl-[120px] bg-background/95 sticky top-0 z-20 shadow-sm">
                {Array.from({ length: HOURS_COUNT }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 border-l border-border/30 flex items-center justify-center text-xs text-muted-foreground font-medium" style={{ width: `${PIXELS_PER_HOUR}px`, height: '40px' }}>
                        {START_HOUR + i}:00
                    </div>
                ))}
            </div>

            {/* Body: Tables and Reservations */}
            <div className="flex-1 overflow-auto custom-scrollbar relative">
                {Object.entries(tablesByHall).map(([hall, hallTables]) => (
                    <div key={hall} className="mb-4">
                        <div className="sticky left-0 bg-muted/30 px-4 py-1 text-xs font-bold text-muted-foreground uppercase tracking-wider border-y border-border/50 z-10">
                            {hall}
                        </div>
                        {hallTables.map(table => (
                            <div key={table.id} className="flex border-b border-border/40 hover:bg-muted/10 transition-colors h-14 relative group">
                                {/* Table Name (Sticky Left) */}
                                <div className="sticky left-0 w-[120px] bg-background border-r border-border/60 flex items-center px-4 font-semibold text-sm text-foreground z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    {table.name}
                                    <span className="text-xs text-muted-foreground ml-auto font-normal">{table.capacity} kishilik</span>
                                </div>

                                {/* Timeline Grid Background */}
                                <div className="absolute inset-0 left-[120px] flex pointer-events-none">
                                    {Array.from({ length: HOURS_COUNT }).map((_, i) => (
                                        <div key={i} className="border-l border-border/20 h-full" style={{ width: `${PIXELS_PER_HOUR}px` }}></div>
                                    ))}
                                </div>

                                {/* Reservations */}
                                <div className="relative flex-1" style={{ marginLeft: '0px' }}>
                                    {reservations
                                        .filter(r => r.table_id === table.id && isSameDay(parseISO(r.reservation_time), new Date())) // Strict date check
                                        .map(res => {
                                            const { left, width } = calculatePosition(res.reservation_time, res.duration || 120);
                                            // Ensure it's within bounds (0 to max width)
                                            if (left < 0) return null; // Before start time

                                            const statusColors = {
                                                active: 'bg-gradient-to-r from-amber-500 to-orange-500 ring-amber-500/30',
                                                completed: 'bg-gradient-to-r from-emerald-500 to-teal-500 ring-emerald-500/30',
                                                cancelled: 'bg-gradient-to-r from-red-500 to-rose-500 ring-red-500/30',
                                                pending: 'bg-gradient-to-r from-blue-500 to-indigo-500 ring-blue-500/30'
                                            };
                                            const bgClass = statusColors[res.status] || statusColors.active;

                                            return (
                                                <div
                                                    key={res.id}
                                                    onClick={() => onSelectReservation(res)}
                                                    className={`absolute top-2 bottom-2 rounded-lg ${bgClass} shadow-md border border-white/20 cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all flex items-center px-2 z-10 overflow-hidden ring-2 ring-offset-0 ring-transparent hover:ring-offset-1`}
                                                    style={{
                                                        left: `${left}px`,
                                                        width: `${width}px`
                                                    }}
                                                    title={`${res.customer_name} (${res.guests} kishi)\n${format(parseISO(res.reservation_time), 'HH:mm')} - ${res.status}`}
                                                >
                                                    <span className="text-white text-xs font-bold truncate drop-shadow-sm w-full">
                                                        {res.customer_name}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReservationTimeline;
