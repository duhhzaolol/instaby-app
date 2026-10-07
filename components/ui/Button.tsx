"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white font-semibold hover:brightness-110 active:brightness-95",
  secondary:
    "bg-card text-text border border-border hover:bg-hover",
  ghost: "bg-transparent text-muted hover:text-text hover:bg-hover",
  danger: "bg-danger/10 text-danger-text border border-danger/20 hover:bg-danger/20",
};

const sizes: Record<Size, string> = {
  sm: "min-h-11 px-3 text-sm rounded-lg sm:min-h-9 sm:text-xs",
  md: "min-h-11 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-sm rounded-xl",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text disabled:opacity-40 disabled:pointer-events-none motion-reduce:transition-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
