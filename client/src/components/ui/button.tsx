import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "accent";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md",
      accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-md shadow-accent/20",
      outline: "border-2 border-input bg-transparent hover:bg-muted text-foreground",
      ghost: "hover:bg-muted text-foreground",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md",
    };

    const sizes = {
      default: "h-12 px-6 py-2 rounded-xl text-base font-semibold",
      sm: "h-9 px-4 rounded-lg text-sm font-medium",
      lg: "h-14 px-8 rounded-2xl text-lg font-bold",
      icon: "h-12 w-12 rounded-xl flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
