import { cn } from "@/lib/utils/cn";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-tertiary", className)} />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 rounded-2xl border border-border bg-secondary space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function SkeletonBalance() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}
