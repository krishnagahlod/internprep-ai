"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { ArrowRight, Terminal } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function LandingNavbar() {
  const router = useRouter();
  const { user, setGuestMode } = useAuthStore();

  const handleStartPractice = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      setGuestMode();
      router.push("/dashboard");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-7 w-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:border-emerald-500/50 transition-colors">
              <Terminal className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground font-mono-tech">
              InternPrep<span className="text-emerald-600 dark:text-emerald-400">.ai</span>
            </span>
          </Link>

          {/* System Status Chip */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded border border-border bg-muted/50 text-[11px] font-mono-tech text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span>Cerebras Llama-3.3 Live</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
          <Link href="#simulator" className="hover:text-foreground transition-colors">
            Case Simulator
          </Link>
          <Link href="#resume-intelligence" className="hover:text-foreground transition-colors">
            Resume Intelligence
          </Link>
          <Link href="#tools" className="hover:text-foreground transition-colors">
            ATS & Studio
          </Link>
          <Link href="#pricing" className="hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </Link>
        </nav>

        {/* Actions & Theme Toggle */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          {user ? (
            <Link href="/dashboard">
              <Button size="sm" className="h-8 rounded-md bg-foreground text-background hover:bg-foreground/90 text-xs font-medium px-3.5">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Button
                onClick={handleStartPractice}
                size="sm"
                className="h-8 rounded-md bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 text-xs font-semibold px-3.5 transition-all shadow-sm"
              >
                Launch Sandbox
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
