"use client";

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// border-2 (rather than padding) is what makes the thumb sit flush against
// the track at both ends — the thumb's own size is the track height minus
// the border, and the checked-state translate distance is the remaining
// horizontal travel. `default` reproduces sending-settings.tsx's hand-rolled
// h-6 w-11 thumb pixel-for-pixel; `sm` is the same ratio scaled down.
// `dark:data-checked:bg-primary` is NOT redundant with `data-checked:bg-primary` — it's the
// bug fix. The unchecked track sets `dark:bg-input/80`, and a single-condition `dark:`
// rule was overriding the single-condition `data-checked:` rule in dark mode: the switch
// rendered the SAME grey on and off, so it never appeared to turn on at all. Light was
// fine, which is exactly why it survived. Stacking both conditions raises the
// specificity so the checked state wins in dark too.
const switchVariants = cva(
  "peer inline-flex shrink-0 items-center rounded-full border-2 border-transparent bg-input transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-disabled:cursor-not-allowed data-disabled:opacity-50 aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-checked:bg-primary dark:bg-input/80 dark:data-checked:bg-primary dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      size: {
        sm: "h-5 w-9",
        default: "h-6 w-11",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const switchThumbVariants = cva(
  "pointer-events-none block rounded-full bg-background shadow-sm ring-0 transition-transform data-unchecked:translate-x-0",
  {
    variants: {
      size: {
        sm: "size-4 data-checked:translate-x-4",
        default: "size-5 data-checked:translate-x-5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function Switch({
  className,
  size,
  ...props
}: SwitchPrimitive.Root.Props & VariantProps<typeof switchVariants>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(switchVariants({ size }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb data-slot="switch-thumb" className={cn(switchThumbVariants({ size }))} />
    </SwitchPrimitive.Root>
  )
}

export { Switch, switchVariants }
