import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "network" | "success" | "warning" | "danger" | "outline";

/**
 * Badges follow the design.md badge-pill: uppercase micro-caps inside a
 * pill. Pills are reserved for badges — never CTAs.
 */
const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-fg border-transparent",
  accent: "bg-accent text-fg-on-accent border-transparent",
  network: "bg-network/10 text-network border-network/25",
  success: "bg-success/10 text-success border-success/25",
  warning: "bg-warning/10 text-warning border-warning/25",
  danger: "bg-danger/10 text-danger border-danger/25",
  outline: "bg-transparent text-fg-muted border-line-strong",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  icon?: ReactNode;
}

export function Badge({ tone = "neutral", icon, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] leading-none",
        tones[tone],
        className
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}
