export const Skeleton = ({ className }: { className?: string }) => {
    return (
        <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
    );
};

export const TableSkeleton = ({ rows = 5, cols = 5 }: { rows?: number, cols?: number }) => {
    return (
        <div className="w-full">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex gap-4 p-4 border-b border-gray-100 last:border-0">
                    {[...Array(cols)].map((_, j) => (
                        <Skeleton key={j} className="h-6 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
};
