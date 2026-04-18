"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "ghost" | "outline" | "subtle" | "danger";
type Size = "sm" | "md" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-hover disabled:bg-brand/40",
  accent:
    "bg-accent text-white hover:bg-accent-hover disabled:bg-accent/40",
  ghost:
    "bg-transparent text-ink hover:bg-surface-muted dark:text-ink-inverse dark:hover:bg-surface-dark-muted",
  outline:
    "border border-line bg-surface text-ink hover:bg-surface-muted dark:border-line-dark dark:bg-surface-dark dark:text-ink-inverse dark:hover:bg-surface-dark-muted",
  subtle:
    "bg-surface-muted text-ink hover:bg-surface-subtle dark:bg-surface-dark-muted dark:text-ink-inverse dark:hover:bg-surface-dark-subtle",
  danger:
    "bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300",
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
