"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { ArrowRight, Terminal, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function LandingNavbar() {
  const router = useRouter();
  const { user, setGuestMode } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <Link 
            href="/" 
            className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded-md p-1 -m-1"
            aria-label="InternPrep AI Home"
          >
            <div className="h-7 w-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:border-emerald-500/50 transition-colors">
              <Terminal className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground font-mono-tech">
              InternPrep<span className="text-emerald-600 dark:text-emerald-400">.ai</span>
            </span>
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground" aria-label="Main Navigation">
          <Link href="#simulator" className="hover:text-foreground focus-visible:text-foreground focus-visible:outline-none transition-colors">
            Interview Simulator
          </Link>
          <Link href="#resume-intelligence" className="hover:text-foreground focus-visible:text-foreground focus-visible:outline-none transition-colors">
            Resume Intelligence
          </Link>
          <Link href="#tools" className="hover:text-foreground focus-visible:text-foreground focus-visible:outline-none transition-colors">
            ATS & Studio
          </Link>
          <Link href="#pricing" className="hover:text-foreground focus-visible:text-foreground focus-visible:outline-none transition-colors">
            Pricing
          </Link>
          <Link href="#faq" className="hover:text-foreground focus-visible:text-foreground focus-visible:outline-none transition-colors">
            FAQ
          </Link>
        </nav>

        {/* Actions & Theme Toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <Link href="/dashboard">
              <Button 
                size="sm" 
                className="h-8 rounded-md bg-foreground text-background hover:bg-foreground/90 text-xs font-medium px-3.5 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98] transition-all"
              >
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                >
                  Sign In
                </Button>
              </Link>
              <Button
                onClick={handleStartPractice}
                size="sm"
                className="h-8 rounded-md bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 text-xs font-semibold px-3.5 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98] transition-all shadow-xs"
              >
                Launch Sandbox
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background/95 backdrop-blur-xl px-4 py-4 space-y-3 font-mono-tech text-xs">
          <Link
            href="#simulator"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Interview Simulator
          </Link>
          <Link
            href="#resume-intelligence"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Resume Intelligence
          </Link>
          <Link
            href="#tools"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            ATS & Studio
          </Link>
          <Link
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            FAQ
          </Link>
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-muted-foreground hover:text-foreground py-2"
            >
              Sign In
            </Link>
            <Button
              onClick={() => {
                setMobileMenuOpen(false);
                handleStartPractice();
              }}
              size="sm"
              className="h-8 bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 text-xs font-semibold px-3"
            >
              Launch Sandbox
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
