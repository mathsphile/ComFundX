import { cn } from "@/lib/utils";

/**
 * Funding progress bar. Solid accent fill over a recessed track —
 * the fill is the one place we allow a subtle horizontal gradient.
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
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  const height = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  return (
    <div
      className={cn("w-full rounded-full bg-surface-3/70 border border-line overflow-hidden", height, className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
