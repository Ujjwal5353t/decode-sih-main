"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "text-white shadow-[var(--shadow-brand)] hover:shadow-[0_8px_32px_rgba(37,99,235,0.35)]",
  secondary:
    "bg-surface text-text-primary border border-border-primary hover:bg-surface-hover hover:border-[var(--border-brand)]",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover",
  outline:
    "bg-transparent text-brand border border-[var(--border-brand)] hover:bg-brand/5",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm gap-1.5",
  md: "px-6 py-2.5 text-sm gap-2",
  lg: "px-8 py-3.5 text-base gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = "primary", size = "md", className, children, style, ...props }, ref) {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-[var(--radius-lg)] cursor-pointer",
          "transition-all duration-300 ease-out",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
          "disabled:opacity-50 disabled:pointer-events-none",
          "font-[family-name:var(--font-display)]",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        style={variant === "primary" ? { background: "var(--gradient-brand)", ...style } : style}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
