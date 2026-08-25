"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { ArrowRight, Terminal } from "lucide-react";

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
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#08090A]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-7 w-7 rounded-md bg-white/10 border border-white/15 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/50 transition-colors">
              <Terminal className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white font-mono-tech">
              InternPrep<span className="text-emerald-400">.ai</span>
            </span>
          </Link>

          {/* System Chip */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.02] text-[11px] font-mono-tech text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span>Rubric v2.4 Live</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
          <Link href="#simulator" className="hover:text-white transition-colors">
            Mock Simulator
          </Link>
          <Link href="#resume-intelligence" className="hover:text-white transition-colors">
            Resume Intelligence
          </Link>
          <Link href="#casebooks" className="hover:text-white transition-colors">
            Casebooks
          </Link>
          <Link href="#pricing" className="hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="#faq" className="hover:text-white transition-colors">
            FAQ
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard">
              <Button size="sm" className="h-8 rounded-md bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-medium px-3">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm" className="h-8 text-xs text-zinc-400 hover:text-white hover:bg-white/[0.05]">
                  Sign In
                </Button>
              </Link>
              <Button
                onClick={handleStartPractice}
                size="sm"
                className="h-8 rounded-md bg-emerald-500 text-zinc-950 hover:bg-emerald-400 text-xs font-semibold px-3.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
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
