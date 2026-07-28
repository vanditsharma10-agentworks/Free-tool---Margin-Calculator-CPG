"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

// Replaces the 2 hand-rolled tooltips in sidebar.tsx (lines 91-97, 187-193), both
// `group-hover:block` divs — hover-only, so keyboard focus never revealed them.
// Base UI's Tooltip opens on focus as well as hover, so this fixes that for free.

// Groups tooltips under one shared open/close delay so adjacent icons in the same
// toolbar feel instant once the first one has opened. Optional — Tooltip works
// standalone without it.
const TooltipProvider = TooltipPrimitive.Provider

function Tooltip(props: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger(props: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  children,
  side = "top",
  sideOffset = 8,
  align = "center",
  alignOffset = 0,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, "side" | "sideOffset" | "align" | "alignOffset">) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 origin-(--transform-origin) rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-md outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 duration-100",
            className
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
