"use client"

import React from "react"
import { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface SegmentedTabItem<T extends string = string> {
  id: T
  label: string
  count?: number | string
  icon?: LucideIcon
  badge?: string
}

interface SegmentedTabsProps<T extends string = string> {
  tabs: SegmentedTabItem<T>[]
  activeTab: T
  onChange: (tabId: T) => void
  className?: string
  size?: "sm" | "default"
}

export function SegmentedTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = "",
  size = "default",
}: SegmentedTabsProps<T>) {
  const sizeClasses = {
    sm: "p-0.5 text-xs",
    default: "p-1 text-xs sm:text-xs",
  }

  const tabPadding = {
    sm: "px-2.5 py-1",
    default: "px-3.5 py-1.5",
  }

  return (
    <div
      role="tablist"
      aria-label="Section Tabs"
      className={`inline-flex items-center gap-1 rounded-xl bg-muted/40 p-1 border border-border overflow-x-auto custom-scrollbar max-w-full ${sizeClasses[size]} ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg font-mono-tech whitespace-nowrap transition-all select-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
              tabPadding[size]
            } ${
              isActive
                ? "bg-card text-foreground font-bold shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground border border-transparent hover:bg-muted/60"
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] font-mono-tech px-1.5 py-0.2 rounded ${
                  isActive
                    ? "bg-primary/10 text-primary font-bold"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <Badge className="text-[9px] font-mono-tech bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 px-1 py-0">
                {tab.badge}
              </Badge>
            )}
          </button>
        )
      })}
    </div>
  )
}
