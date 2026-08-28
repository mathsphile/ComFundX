import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[10px] bg-surface-2/80 animate-shimmer bg-[linear-gradient(110deg,transparent,var(--color-shimmer),transparent)] bg-[length:460px_100%] bg-no-repeat",
        className
      )}
    />
  );
}

/** Card-shaped skeleton matching CampaignCard proportions. */
export function CampaignCardSkeleton() {
  return (
    <div className="panel overflow-hidden">
      <Skeleton className="w-full h-48 rounded-none" />
      <div className="p-5 space-y-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="pt-2 space-y-2">
          <Skeleton className="h-2 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-3 w-1/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
