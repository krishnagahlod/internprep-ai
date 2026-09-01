"use client"

import React from "react"
import Link from "next/link"
import { ArrowLeft, LogIn } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuthStore } from "@/stores/auth-store"

interface CommandNavProps {
  backHref?: string
  backLabel?: string
  breadcrumb: string
  actions?: React.ReactNode
  className?: string
  maxWidth?: string
}

export function CommandNav({
  backHref = "/dashboard",
  backLabel = "Dashboard",
  breadcrumb,
  actions,
  className = "",
  maxWidth = "max-w-7xl",
}: CommandNavProps) {
  const { user, isGuest } = useAuthStore()
  return (
    <header
      role="banner"
      className={`sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md ${className}`}
    >
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3`}>
        {/* Left: Back Link & Breadcrumb */}
        <nav aria-label="Breadcrumb Navigation" className="flex items-center gap-2.5 min-w-0">
          <Link
            href={backHref}
            aria-label={`Navigate back to ${backLabel}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono-tech text-muted-foreground hover:text-foreground transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-md"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{backLabel}</span>
          </Link>

          <span className="text-muted-foreground/40 font-mono-tech text-xs" aria-hidden="true">/</span>

          <span className="text-xs font-mono-tech font-bold tracking-tight text-foreground truncate" aria-current="page">
            {breadcrumb}
          </span>
        </nav>

        {/* Right: Actions & Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          {(isGuest || !user) && (
            <Link href="/login" aria-label="Sign in to your account">
              <button
                type="button"
                aria-label="Sign In"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono-tech font-semibold bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 shadow-xs hover:bg-emerald-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
              >
                <LogIn className="h-3 w-3" aria-hidden="true" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            </Link>
          )}
          <div className="h-4 w-px bg-border hidden sm:block" aria-hidden="true" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
