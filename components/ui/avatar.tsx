import Image from "next/image";
import { cn } from "@/lib/utils";

export function Avatar({
  src,
  name,
  size = 32,
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "border border-line-strong bg-surface-2 text-fg-muted font-semibold",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={name || "avatar"} fill className="object-cover" sizes={`${size}px`} />
      ) : (
        <span style={{ fontSize: size * 0.4 }}>{initials}</span>
      )}
    </span>
  );
}
