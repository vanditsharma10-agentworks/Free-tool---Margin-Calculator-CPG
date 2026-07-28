"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverClose = PopoverPrimitive.Close

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("font-heading text-sm font-medium text-foreground", className)}
      {...props}
    />
  )
}

function PopoverDescription({ className, ...props }: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("text-[13px] text-muted-foreground", className)}
      {...props}
    />
  )
}

// Inner breathing room, as a prop rather than a className every call site re-invents.
// Every popover in the app was picking its own — p-0 here, p-1 there, p-3 somewhere else —
// which is the same drift the rest of this library exists to stop. Three real cases:
//
//   none    — the content owns the edges. A list whose rows hover as full-width bands.
//   sm      — a menu of pill rows: just enough that the pills don't touch the ring.
//   default — freeform content (a title, a paragraph, a couple of controls).
const popoverPadding = {
  none: "",
  sm: "p-1",
  default: "p-3",
}

function PopoverContent({
  className,
  children,
  padding = "default",
  side = "bottom",
  sideOffset = 8,
  align = "end",
  alignOffset = 0,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset"> & {
    padding?: keyof typeof popoverPadding
  }) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner side={side} sideOffset={sideOffset} align={align} alignOffset={alignOffset} className="isolate z-50">
        <PopoverPrimitive.Popup data-slot="popover-content" className={cn("z-50 origin-(--transform-origin) rounded-xl bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 duration-100", popoverPadding[padding], className)} {...props}>
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent, PopoverClose, PopoverTitle, PopoverDescription }