"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"

export interface CommandHeroProps {
  badge?: string
  statusBadge?: string
  statusVariant?: "emerald" | "blue" | "amber" | "purple"
  title: string
  titleHighlight?: string
  subtitle?: string
  actions?: React.ReactNode
  badges?: React.ReactNode
  watermark?: string
  variant?: "default" | "card"
  className?: string
}

export function CommandHero({
  badge,
  statusBadge,
  statusVariant = "emerald",
  title,
  titleHighlight,
  subtitle,
  actions,
  badges,
  watermark,
  variant = "card",
  className = "",
}: CommandHeroProps) {
  const statusColorMap = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  }

  const content = (
    <>
      {/* Ambient background glows for card variant */}
      {variant === "card" && (
        <>
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#8882_1px,transparent_1px)] [background-size:18px_18px] opacity-25" />
          {watermark && (
            <div className="pointer-events-none absolute right-4 bottom-2 text-4xl sm:text-6xl font-black text-foreground/[0.03] dark:text-foreground/[0.05] font-mono-tech select-none tracking-widest uppercase">
              {watermark}
            </div>
          )}
        </>
      )}

      {/* Top Badges Row */}
      <div className="relative z-10 flex flex-wrap items-center gap-2">
        {badge && (
          <Badge
            variant="outline"
            className="text-[10px] font-mono-tech border-border bg-muted/40 text-muted-foreground uppercase tracking-wider px-2.5 py-0.5"
          >
            {badge}
          </Badge>
        )}
        {statusBadge && (
          <Badge
            className={`text-[10px] font-mono-tech border font-bold uppercase tracking-wider px-2.5 py-0.5 ${statusColorMap[statusVariant]}`}
          >
            {statusBadge}
          </Badge>
        )}
        {badges}
      </div>

      {/* Main Title & Action Row */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 pt-1">
        <div className="space-y-1.5 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-outfit">
            {title}
            {titleHighlight && (
              <span className="ml-2 bg-gradient-to-r from-primary via-purple-500 to-amber-500 bg-clip-text text-transparent">
                {titleHighlight}
              </span>
            )}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
            {actions}
          </div>
        )}
      </div>
    </>
  )

  if (variant === "card") {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/95 to-card/75 p-6 sm:p-8 shadow-sm backdrop-blur-xl space-y-4 ${className}`}
      >
        {content}
      </div>
    )
  }

  return <div className={`space-y-3 ${className}`}>{content}</div>
}
