import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padded?: boolean;
}

/**
 * The primary elevated panel used across the product. Hairline border,
 * subtle top-light, dark surface — no glass blur.
 */
export function Surface({ hover = false, padded = false, className, children, ...rest }: SurfaceProps) {
  return (
    <div className={cn("panel", hover && "panel-hover", padded && "p-6", className)} {...rest}>
      {children}
    </div>
  );
}
