import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Compass, Home, LayoutDashboard, FileText, 
  Briefcase, MessageSquare, ArrowRight 
} from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle tech background grid */}
      <div className="absolute inset-0 tech-grid opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full text-center space-y-8">
        {/* Top Monospace Code Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card text-xs font-mono-tech text-emerald-600 dark:text-emerald-400 font-bold shadow-xs">
          <span>HTTP 404</span>
          <span className="text-muted-foreground/60">•</span>
          <span>RESOURCE NOT LOCATED</span>
        </div>

        {/* Big Code & Title */}
        <div className="space-y-3">
          <h1 className="text-6xl sm:text-8xl font-extrabold tracking-tight text-foreground font-mono-tech">
            404
          </h1>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Vector Not Found in Registry
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            The page or workspace URL you requested does not exist or has been relocated to another route.
          </p>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-lg mx-auto">
          <Link
            href="/dashboard"
            className="p-4 rounded-xl border border-border bg-card hover:border-emerald-500/40 hover:bg-muted/40 transition-all group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <LayoutDashboard className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Dashboard
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Candidate Workspace
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>

          <Link
            href="/interview"
            className="p-4 rounded-xl border border-border bg-card hover:border-emerald-500/40 hover:bg-muted/40 transition-all group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Mock Simulator
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Case & Technical Prep
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>

          <Link
            href="/resume"
            className="p-4 rounded-xl border border-border bg-card hover:border-emerald-500/40 hover:bg-muted/40 transition-all group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Resume Studio
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    ATS Audit & Scoring
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>

          <Link
            href="/placement-analysis"
            className="p-4 rounded-xl border border-border bg-card hover:border-emerald-500/40 hover:bg-muted/40 transition-all group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Placement Data
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Day 1 Intelligence
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        </div>

        {/* Return Home Action */}
        <div className="pt-2">
          <Link href="/">
            <Button
              variant="outline"
              className="h-10 px-6 rounded-lg border-border bg-card hover:bg-muted text-foreground font-mono-tech text-xs font-semibold"
            >
              <Home className="mr-2 h-4 w-4" />
              Return to Landing Page
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
