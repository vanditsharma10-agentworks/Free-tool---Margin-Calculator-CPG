"use client";

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"

import { cn } from "@/lib/utils"

// Replaces the ad-hoc `border-t border-border` / raw `<hr>` scattered across 20
// files with one primitive that gets orientation-aware ARIA for free.
function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  )
}

/** A labelled divider — "or" between two auth methods, "Today" between feed groups. */
function SeparatorWithLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-3", className)} role="separator" aria-orientation="horizontal">
      <Separator className="w-auto flex-1" />
      <span className="shrink-0 text-xs text-muted-foreground">{children}</span>
      <Separator className="w-auto flex-1" />
    </div>
  )
}

export { Separator, SeparatorWithLabel }
