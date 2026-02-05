import React from 'react';

export const Badge = ({
    children,
    variant = 'default',
    className = ''
}) => {
    const variants = {
        default: "bg-slate-800 text-slate-300 border-slate-700",
        primary: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
        success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
        warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
        danger: "bg-red-500/15 text-red-400 border-red-500/20"
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};
