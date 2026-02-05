import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({
    children,
    className = '',
    onClick,
    ...props
}) => {
    const Component = onClick ? motion.div : 'div';

    return (
        <Component
            className={`bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 ${className}`}
            {...(onClick ? {
                whileTap: { scale: 0.98 },
                onClick: onClick,
                role: "button",
                tabIndex: 0
            } : {})}
            {...props}
        >
            {children}
        </Component>
    );
};
