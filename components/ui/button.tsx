"use client";

import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "network";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold select-none " +
  "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg " +
  "disabled:opacity-50 disabled:pointer-events-none active:translate-y-px whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-fg-on-accent hover:bg-accent-strong shadow-[0_8px_24px_-8px_rgba(255,106,26,0.5)]",
  secondary: "bg-surface-2 text-fg border border-line-strong hover:bg-surface-3",
  outline: "bg-transparent text-fg border border-line-strong hover:border-line-bright hover:bg-surface",
  ghost: "bg-transparent text-fg-muted hover:text-fg hover:bg-surface-2",
  network: "bg-network/12 text-network border border-network/30 hover:bg-network/20",
  danger: "bg-danger/12 text-danger border border-danger/30 hover:bg-danger/20",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px] rounded-[10px]",
  md: "h-11 px-5 text-sm rounded-[11px]",
  lg: "h-13 px-7 text-[15px] rounded-[12px] min-h-[52px]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  href?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    icon,
    iconPosition = "left",
    href,
    className,
    children,
    disabled,
    ...rest
  },
  ref
) {
  const inner = (
    <>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon && iconPosition === "left" ? icon : null}
      {children}
      {!loading && icon && iconPosition === "right" ? icon : null}
    </>
  );

  const cls = cn(base, variants[variant], sizes[size], className);

  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }

  return (
    <button ref={ref} className={cls} disabled={disabled || loading} {...rest}>
      {inner}
    </button>
  );
});
