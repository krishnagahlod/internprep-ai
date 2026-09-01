import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-2xl bg-muted/60 dark:bg-muted/40",
        className
      )}
      {...props}
    />
  );
}

/**
 * High-Fidelity Zero-CLS Skeleton for 4-6 Column KPI Grids
 */
export function KpiGridSkeleton({ columns = 6 }: { columns?: 4 | 5 | 6 }) {
  const colClass =
    columns === 4
      ? "grid-cols-2 lg:grid-cols-4"
      : columns === 5
      ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";

  return (
    <div
      aria-label="Loading platform telemetry metrics"
      role="region"
      className={cn("grid gap-3 sm:gap-4", colClass)}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-border bg-card p-4 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-20 rounded-md" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-3 w-24 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/**
 * Zero-CLS Skeleton for Data Tables (Candidate Directory, JAF Lists, Audit Logs)
 */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div
      aria-label="Loading data records"
      role="region"
      className="rounded-3xl border border-border bg-card p-4 sm:p-6 space-y-4 shadow-xs"
    >
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <Skeleton className="h-5 w-36 rounded-lg" />
        <Skeleton className="h-8 w-48 rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/50 gap-4"
          >
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn(
                  "h-4 rounded-md",
                  c === 0 ? "w-1/4" : c === cols - 1 ? "w-20 ml-auto" : "w-1/6"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Zero-CLS Skeleton for Detail Cards (Resumes, Mock Interviews, JAF detail)
 */
export function CardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      aria-label="Loading item details"
      role="region"
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-border bg-card p-5 space-y-3.5 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-12 w-full rounded-2xl" />
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
