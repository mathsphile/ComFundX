"use client";

import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "network";
type Size = "sm" | "md" | "lg";

/**
 * Buttons follow design.md: 14px/500 labels, 8px radii, 40px control
 * height. Primary is black in light mode and white in dark — the only
 * brand voltage. No glows, no gradients.
 */
const base =
  "inline-flex items-center justify-center gap-2 font-medium select-none " +
  "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-fg/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg " +
  "disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-fg-on-accent hover:bg-accent-strong",
  secondary:
    "bg-surface text-fg border border-line-strong hover:border-line-bright hover:bg-bg-soft",
  outline: "bg-transparent text-fg border border-line-strong hover:border-line-bright",
  ghost: "bg-transparent text-fg-muted hover:text-fg hover:bg-surface-2",
  network: "bg-transparent text-network border border-network/30 hover:bg-network/8",
  danger: "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/15",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px] rounded-lg",
  md: "h-10 px-[18px] text-sm rounded-lg",
  lg: "h-11 px-6 text-[15px] rounded-lg",
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
