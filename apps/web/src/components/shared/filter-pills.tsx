"use client"

import React from "react"

export interface FilterPillItem<T extends string = string> {
  id: T
  label: string
  count?: number | string
}

interface FilterPillsProps<T extends string = string> {
  options: (FilterPillItem<T> | string)[]
  selected: T
  onSelect: (id: T) => void
  className?: string
  wrap?: boolean
}

export function FilterPills<T extends string = string>({
  options,
  selected,
  onSelect,
  className = "",
  wrap = false,
}: FilterPillsProps<T>) {
  return (
    <div
      className={`flex items-center gap-1.5 ${
        wrap ? "flex-wrap" : "overflow-x-auto pb-1 custom-scrollbar"
      } ${className}`}
    >
      {options.map((opt) => {
        const id = (typeof opt === "string" ? opt : opt.id) as T
        const label = typeof opt === "string" ? opt : opt.label
        const count = typeof opt === "string" ? undefined : opt.count
        const isSelected = selected === id

        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono-tech whitespace-nowrap transition-all border ${
              isSelected
                ? "bg-card text-foreground font-bold shadow-xs border-border ring-1 ring-primary/20"
                : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/40"
            }`}
          >
            <span>{label}</span>
            {count !== undefined && (
              <span
                className={`ml-1.5 text-[10px] px-1 py-0.2 rounded font-mono-tech ${
                  isSelected
                    ? "bg-primary/10 text-primary font-bold"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
