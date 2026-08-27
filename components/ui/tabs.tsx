"use client";

import { cn } from "@/lib/utils";

export interface TabItem<T extends string = string> {
  value: T;
  label: string;
  count?: number;
}

/**
 * Underline tab bar. Active item gets an accent underline.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-line overflow-x-auto", className)}>
      <div className="flex gap-1 min-w-max">
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className={cn(
                "relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                active ? "text-fg" : "text-fg-faint hover:text-fg-muted"
              )}
            >
              <span className="flex items-center gap-2">
                {item.label}
                {typeof item.count === "number" && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular",
                      active ? "bg-accent/15 text-accent-strong" : "bg-surface-2 text-fg-muted"
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "absolute left-2 right-2 -bottom-px h-[2px] rounded-full transition-opacity",
                  active ? "bg-accent opacity-100" : "opacity-0"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
