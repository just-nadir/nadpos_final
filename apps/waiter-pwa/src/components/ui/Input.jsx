import React from 'react';

export const Input = ({
    icon: Icon,
    className = '',
    ...props
}) => {
    return (
        <div className="relative w-full">
            {Icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Icon size={20} />
                </div>
            )}
            <input
                className={`w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-500 ${Icon ? 'pl-11' : ''} ${className}`}
                {...props}
            />
        </div>
    );
};
