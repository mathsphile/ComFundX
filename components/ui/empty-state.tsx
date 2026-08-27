import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "panel flex flex-col items-center justify-center text-center px-8 py-16 gap-4",
        className
      )}
    >
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line-strong bg-surface-2 text-fg-muted">
          {icon}
        </div>
      )}
      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-lg font-semibold text-fg font-display">{title}</h3>
        {description && <p className="text-sm text-fg-muted leading-relaxed">{description}</p>}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
