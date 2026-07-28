"use client";

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"

import { cn } from "@/lib/utils"

// Segmented only. There is no `variant` axis — tabs are a pill track with a raised
// active pill, everywhere, full stop.
//
// The app had 8 hand-rolled tab bars in two languages: underline (5) and segmented (3).
// Underline was the plurality, but plurality isn't a design decision — a library with
// both just relocates the inconsistency behind a prop. Segmented also matches the rest
// of the system, which is pills the whole way down: Button, Input, Select, Badge.
//
// Everything renders on Base UI's Tabs, so real role="tab"/aria-selected and arrow-key
// navigation come free — of the 8 hand-rolled versions, only settings.tsx had that.

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  )
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      // The track: a muted pill the active tab sits inside. Full-width on mobile so the
      // tabs divide the row evenly; shrink-wrapped to the triggers from sm up.
      //
      // sm:w-fit, NOT sm:w-auto. Tabs root is `flex flex-col`, so the list is a flex item
      // with align-items:stretch — and stretch only backs off when the cross-size is
      // something other than auto. `w-auto` therefore still filled the parent's full
      // width. An explicit fit-content opts out of stretch, and also shrink-wraps if the
      // track is ever dropped into a plain block parent.
      className={cn(
        "flex w-full items-center gap-1 rounded-full bg-muted p-0.5 sm:w-fit",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  count,
  children,
  ...props
}: TabsPrimitive.Tab.Props & { count?: React.ReactNode }) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      // `group` sits on the trigger so the count badge (a child) can read the trigger's
      // own data-active via group-data-[active]:* without another wrapper element.
      // The active pill must read as RAISED off the track, which means lighter than it.
      // On light that's bg-card (#fff) against a muted track — fine. On dark it is NOT:
      // muted resolves to surface-2 (L2) while card resolves to surface (L1), so bg-card
      // would put the pill a step BELOW its own track and it reads sunken. Dark therefore
      // lifts it to surface-3 (L3), the interactive step, which sits above the track.
      // shadow-sm does almost nothing on a dark canvas, so the lightness step is the
      // whole signal there — it has to be the right direction.
      className={cn(
        "group relative flex flex-1 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] font-normal text-muted-foreground transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 not-data-[active]:hover:text-foreground data-[active]:bg-card data-[active]:font-medium data-[active]:text-foreground data-[active]:shadow-sm sm:flex-none sm:px-3.5 sm:text-sm dark:data-[active]:bg-[var(--surface-3)]",
        className
      )}
      {...props}
    >
      {children}
      {count != null && (
        <span className="shrink-0 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground transition-colors group-data-[active]:bg-moss/12 group-data-[active]:text-moss">
          {count}
        </span>
      )}
    </TabsPrimitive.Tab>
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
