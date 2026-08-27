"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"

interface CommandHeroProps {
  badge?: string
  statusBadge?: string
  statusVariant?: "emerald" | "blue" | "amber" | "purple"
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function CommandHero({
  badge,
  statusBadge,
  statusVariant = "emerald",
  title,
  subtitle,
  actions,
  className = "",
}: CommandHeroProps) {
  const statusColorMap = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {badge && (
          <Badge
            variant="outline"
            className="text-[10px] font-mono-tech border-border bg-muted/30 text-muted-foreground uppercase tracking-wider"
          >
            {badge}
          </Badge>
        )}
        {statusBadge && (
          <Badge
            className={`text-[10px] font-mono-tech border font-bold uppercase tracking-wider ${statusColorMap[statusVariant]}`}
          >
            {statusBadge}
          </Badge>
        )}
      </div>

      {/* Main Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-3xl">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono-tech">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
