export default function RootLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Subtle tech background grid */}
      <div className="absolute inset-0 tech-grid opacity-30 pointer-events-none" />

      {/* Top Navbar Skeleton */}
      <header className="h-14 border-b border-border bg-card/60 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-28 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-20 rounded-md bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
        </div>
      </header>

      {/* Main Content Area Skeleton */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 relative z-10">
        {/* Header Skeleton */}
        <div className="space-y-3 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 rounded-full bg-muted/80 animate-pulse" />
            <div className="h-4 w-32 rounded-full bg-muted/60 animate-pulse" />
          </div>
          <div className="h-8 sm:h-10 w-64 sm:w-96 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-48 sm:w-80 rounded bg-muted/70 animate-pulse" />
        </div>

        {/* 3 Metric Card Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card/70 p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
                <div className="h-4 w-4 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-7 w-28 rounded bg-muted animate-pulse" />
              <div className="h-3 w-36 rounded bg-muted/60 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Main Grid / Bento Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/70 p-6 space-y-4 min-h-[320px]">
            <div className="h-5 w-44 rounded bg-muted animate-pulse" />
            <div className="space-y-3 pt-2">
              <div className="h-16 w-full rounded-xl bg-muted/60 animate-pulse" />
              <div className="h-16 w-full rounded-xl bg-muted/60 animate-pulse" />
              <div className="h-16 w-full rounded-xl bg-muted/60 animate-pulse" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-6 space-y-4 min-h-[320px]">
            <div className="h-5 w-36 rounded bg-muted animate-pulse" />
            <div className="h-40 w-full rounded-xl bg-muted/40 animate-pulse flex items-center justify-center">
              <div className="h-24 w-24 rounded-full border-4 border-muted/80 border-t-emerald-500/60 animate-spin" />
            </div>
            <div className="h-4 w-full rounded bg-muted/60 animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
