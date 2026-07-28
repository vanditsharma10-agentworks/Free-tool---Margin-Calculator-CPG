import * as React from "react"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function StatTile({
  label,
  value,
  delta,
  icon,
  hint,
  className,
}: {
  label: string
  value: React.ReactNode
  /** Signed string, e.g. "+12%" or "-4". The leading sign drives the icon + tone. */
  delta?: string
  icon?: React.ReactNode
  hint?: string
  className?: string
}) {
  const isZero = value === 0 || value === "0"
  const isNegative = delta?.trim().startsWith("-") ?? false

  return (
    <div data-slot="stat-tile" className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
        {icon && (
          <span className="shrink-0 text-muted-foreground/80 [&_svg]:size-3.5">{icon}</span>
        )}
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "truncate font-heading text-2xl font-semibold tracking-tight tabular-nums",
            isZero ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {value}
        </span>
        {delta && (
          <span
            className={cn(
              "flex shrink-0 items-center gap-0.5 text-xs font-medium",
              isNegative ? "text-destructive" : "text-signal"
            )}
          >
            {isNegative ? <ArrowDownIcon className="size-3" /> : <ArrowUpIcon className="size-3" />}
            {delta}
          </span>
        )}
      </div>
      {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function StatTileGroup({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-slot="stat-tile-group"
      className={cn("grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4", className)}
    >
      {children}
    </div>
  )
}

export { StatTile, StatTileGroup }
