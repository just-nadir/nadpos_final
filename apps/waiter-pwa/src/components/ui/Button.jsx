import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const Button = ({
    children,
    variant = 'primary', // primary, secondary, ghost, danger
    size = 'md', // sm, md, lg
    className = '',
    isLoading = false,
    disabled = false,
    icon: Icon,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none rounded-2xl";

    const variants = {
        primary: "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 active:scale-95",
        secondary: "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 active:bg-slate-700 active:scale-95",
        ghost: "text-slate-400 hover:text-white hover:bg-white/5 active:scale-95",
        danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 active:scale-95"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-5 py-3 text-base",
        lg: "px-6 py-4 text-lg w-full"
    };

    return (
        <motion.button
            whileTap={{ scale: 0.97 }}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="animate-spin mr-2" size={20} />
            ) : Icon ? (
                <Icon className="mr-2" size={20} />
            ) : null}
            {children}
        </motion.button>
    );
};
