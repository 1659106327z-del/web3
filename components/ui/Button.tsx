"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "ghost" | "outline" | "subtle" | "danger";
type Size = "sm" | "md" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-soft hover:bg-brand-hover disabled:bg-brand/40",
  accent:
    "bg-accent text-white shadow-soft hover:bg-accent-hover disabled:bg-accent/40",
  ghost:
    "bg-transparent text-ink hover:bg-ink/5 dark:text-ink-inverse dark:hover:bg-white/5",
  outline:
    "border border-ink/10 bg-white/40 text-ink backdrop-blur-sm hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-ink-inverse dark:hover:bg-white/10",
  subtle:
    "bg-ink/5 text-ink hover:bg-ink/10 dark:bg-white/5 dark:text-ink-inverse dark:hover:bg-white/10",
  danger:
    "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  icon: "h-9 w-9 p-0",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "outline", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
