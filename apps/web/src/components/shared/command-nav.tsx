"use client"

import React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

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
  return (
    <header className={`sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md ${className}`}>
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3`}>
        {/* Left: Back Link & Breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-mono-tech text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{backLabel}</span>
          </Link>

          <span className="text-muted-foreground/40 font-mono-tech text-xs">/</span>

          <span className="text-xs font-mono-tech font-bold tracking-tight text-foreground truncate">
            {breadcrumb}
          </span>
        </div>

        {/* Right: Actions & Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          <div className="h-4 w-px bg-border hidden sm:block" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
