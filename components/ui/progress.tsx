"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DUR, EASE } from "@/lib/motion";

/**
 * Funding progress bar. Solid accent fill over a recessed track —
 * the fill is the one place we allow a subtle horizontal gradient.
 * The fill sweeps in with the shared ease whenever it scrolls into
 * view, so funding status reads as motion, not static text.
 */
export function Progress({
  value,
  className,
  size = "md",
}: {
  value: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const reducedMotion = useReducedMotion();
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  const height = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  return (
    <div
      className={cn("w-full rounded-full bg-surface-2 border border-line overflow-hidden", height, className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="h-full rounded-full bg-accent"
        initial={reducedMotion ? { width: `${pct}%` } : { width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: DUR.crawl, ease: EASE, delay: 0.1 }}
      />
    </div>
  );
}
