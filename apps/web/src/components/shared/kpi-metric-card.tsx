"use client"

import React from "react"
import { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface KpiMetricItem {
  label: string
  value: string | number
  subtext?: string
  icon?: LucideIcon
  badge?: string
  badgeVariant?: "emerald" | "blue" | "amber" | "rose" | "purple" | "muted"
  onClick?: () => void
}

interface KpiMetricCardProps extends KpiMetricItem {
  className?: string
}

export function KpiMetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  badge,
  badgeVariant = "emerald",
  onClick,
  className = "",
}: KpiMetricCardProps) {
  const badgeClasses = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    muted: "bg-muted/50 text-muted-foreground border-border",
  }

  const isClickable = Boolean(onClick)

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl bg-card border border-border flex flex-col justify-between shadow-xs transition-all ${
        isClickable ? "cursor-pointer hover:border-primary/40 hover:shadow-sm" : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono-tech truncate">
          {label}
        </span>
        {Icon && (
          <div className="p-1.5 rounded-lg bg-muted/40 border border-border text-foreground shrink-0">
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono-tech">
          {value}
        </div>
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          {subtext && (
            <span className="text-[10px] text-muted-foreground font-mono-tech truncate">
              {subtext}
            </span>
          )}
          {badge && (
            <Badge className={`text-[9px] font-mono-tech px-1.5 py-0 border ${badgeClasses[badgeVariant]}`}>
              {badge}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

interface KpiMetricGridProps {
  metrics?: KpiMetricItem[]
  children?: React.ReactNode
  columns?: 2 | 3 | 4 | 5 | 6
  className?: string
}

export function KpiMetricGrid({
  metrics,
  children,
  columns = 4,
  className = "",
}: KpiMetricGridProps) {
  const colMap = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  }

  return (
    <div className={`grid gap-3 ${colMap[columns]} ${className}`}>
      {children
        ? children
        : metrics?.map((metric, i) => (
            <KpiMetricCard key={i} {...metric} />
          ))}
    </div>
  )
}
