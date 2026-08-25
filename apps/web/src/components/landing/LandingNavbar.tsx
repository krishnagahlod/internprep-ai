"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Menu, X, ArrowRight, ShieldCheck, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/stores/auth-store";
import { motion, AnimatePresence } from "framer-motion";

export function LandingNavbar() {
  const router = useRouter();
  const { user, isGuest, setGuestMode } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleStartPractice = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      setGuestMode();
      router.push("/dashboard");
    }
  };

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Live Demo", href: "#demo" },
    { label: "Why Us", href: "#comparison" },
    { label: "Pricing", href: "#pricing" },
    { label: "Casebooks", href: "/casebooks" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300 px-4 sm:px-6 lg:px-8 py-3">
      <div
        className={`max-w-7xl mx-auto rounded-2xl transition-all duration-300 ${
          isScrolled
            ? "glass-panel bg-white/80 dark:bg-black/75 shadow-lg shadow-black/5 border border-black/10 dark:border-white/10 px-4 sm:px-6 py-2.5"
            : "bg-transparent px-2 sm:px-4 py-2"
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-premium p-[1.5px] flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="h-full w-full bg-white dark:bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-foreground font-outfit">
                  InternPrep<span className="text-gradient">.AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                  <Flame className="w-2.5 h-2.5 fill-violet-500 text-violet-500" />
                  Day 1
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Button
                onClick={() => router.push("/dashboard")}
                className="bg-gradient-premium hover:opacity-95 text-white font-medium rounded-full px-5 py-2 text-sm shadow-md shadow-violet-500/25 transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                Go to Dashboard
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full px-4"
                  >
                    Log In
                  </Button>
                </Link>
                <Button
                  onClick={handleStartPractice}
                  className="bg-gradient-premium hover:opacity-95 text-white font-medium rounded-full px-5 py-2 text-sm shadow-md shadow-violet-500/25 transition-all hover:shadow-lg hover:-translate-y-0.5 group"
                >
                  Start Practice
                  <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-2 max-w-7xl mx-auto rounded-2xl glass-panel bg-white/95 dark:bg-zinc-950/95 border border-black/10 dark:border-white/10 p-5 shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all"
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-border my-1" />
              {user ? (
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/dashboard");
                  }}
                  className="w-full bg-gradient-premium text-white font-semibold rounded-xl py-3"
                >
                  Go to Dashboard
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full rounded-xl py-2.5 font-medium">
                      Log In
                    </Button>
                  </Link>
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleStartPractice();
                    }}
                    className="w-full bg-gradient-premium text-white font-semibold rounded-xl py-2.5 shadow-md shadow-violet-500/25"
                  >
                    Start Free Practice
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
