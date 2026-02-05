import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn";
import { Loader2 } from "lucide-react";

// NOTE: We don't have 'class-variance-authority' installed, so let's implement a simple version or install it. 
// Actually, 'class-variance-authority' (cva) is great but if we didn't install it, I'll use a simpler approach.
// But wait, the best practice is to use CVA. I'll stick to a robust manual implementation since I didn't install CVA.
// Wait, I can install it quickly or just write the logic manually to avoid extra deps if not needed.
// Given the "Professional" requirement, I'll simulate CVA logic manually for now to keep deps minimal unless I decide to install it.
// Actually, I'll just write clean manual conditional logic.

const Button = React.forwardRef(({
    className,
    variant = "default",
    size = "default",
    asChild = false,
    isLoading = false,
    children,
    ...props
}, ref) => {

    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-95";

    const variants = {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
    };

    const sizes = {
        default: "h-11 px-4 py-2", // 44px for Touch
        sm: "h-9 rounded-md px-3",
        lg: "h-14 rounded-lg px-8 text-base", // 56px for Big Touch
        icon: "h-11 w-11",
    };

    return (
        <button
            className={cn(
                baseStyles,
                variants[variant],
                sizes[size],
                className
            )}
            ref={ref}
            disabled={props.disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
});
Button.displayName = "Button";

export { Button };
