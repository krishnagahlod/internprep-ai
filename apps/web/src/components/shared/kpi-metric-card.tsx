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
  badgeVariant?: "emerald" | "blue" | "amber" | "rose" | "purple" | "teal" | "indigo" | "muted"
  accentColor?: "emerald" | "blue" | "amber" | "rose" | "purple" | "teal" | "indigo"
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
  accentColor,
  onClick,
  className = "",
}: KpiMetricCardProps) {
  const badgeClasses = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    muted: "bg-muted/50 text-muted-foreground border-border",
  }

  const accentStyles = {
    amber: {
      icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      glow: "hover:border-amber-500/40 hover:shadow-amber-500/5",
      accentBar: "from-amber-500/0 via-amber-500/50 to-amber-500/0",
    },
    emerald: {
      icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      glow: "hover:border-emerald-500/40 hover:shadow-emerald-500/5",
      accentBar: "from-emerald-500/0 via-emerald-500/50 to-emerald-500/0",
    },
    blue: {
      icon: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      glow: "hover:border-blue-500/40 hover:shadow-blue-500/5",
      accentBar: "from-blue-500/0 via-blue-500/50 to-blue-500/0",
    },
    indigo: {
      icon: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      glow: "hover:border-indigo-500/40 hover:shadow-indigo-500/5",
      accentBar: "from-indigo-500/0 via-indigo-500/50 to-indigo-500/0",
    },
    purple: {
      icon: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      glow: "hover:border-purple-500/40 hover:shadow-purple-500/5",
      accentBar: "from-purple-500/0 via-purple-500/50 to-purple-500/0",
    },
    teal: {
      icon: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
      glow: "hover:border-teal-500/40 hover:shadow-teal-500/5",
      accentBar: "from-teal-500/0 via-teal-500/50 to-teal-500/0",
    },
    rose: {
      icon: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
      glow: "hover:border-rose-500/40 hover:shadow-rose-500/5",
      accentBar: "from-rose-500/0 via-rose-500/50 to-rose-500/0",
    },
  }

  const selectedAccent = accentColor ? accentStyles[accentColor] : null
  const isClickable = Boolean(onClick)

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-card border border-border/80 flex flex-col justify-between shadow-xs transition-all duration-200 ${
        selectedAccent ? selectedAccent.glow : "hover:border-primary/40 hover:shadow-xs"
      } ${isClickable ? "cursor-pointer hover:-translate-y-0.5" : ""} ${className}`}
    >
      {/* Top Accent Gradient Line on Hover */}
      {selectedAccent && (
        <div
          className={`absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r ${selectedAccent.accentBar} opacity-60 group-hover:opacity-100 transition-opacity`}
        />
      )}

      <div>
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono-tech leading-tight">
            {label}
          </span>
          {Icon && (
            <div
              className={`p-1.5 rounded-xl border shrink-0 transition-transform group-hover:scale-105 ${
                selectedAccent
                  ? selectedAccent.icon
                  : "bg-muted/40 border-border text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
        </div>

        <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground font-outfit">
          {value}
        </div>
      </div>

      <div className="flex items-center justify-between gap-1.5 pt-2.5 mt-1 border-t border-border/40">
        {subtext && (
          <span className="text-[10px] text-muted-foreground font-mono-tech leading-tight truncate">
            {subtext}
          </span>
        )}
        {badge && (
          <Badge
            className={`text-[9px] font-mono-tech px-1.5 py-0 border shrink-0 font-bold ${
              badgeClasses[badgeVariant]
            }`}
          >
            {badge}
          </Badge>
        )}
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
