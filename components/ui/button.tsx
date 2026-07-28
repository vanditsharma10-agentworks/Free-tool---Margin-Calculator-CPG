"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Every button in the app is a pill — `rounded-full`, no exceptions, no shape axis.
// This is the design language the app had already chosen by hand: two files
// (new-campaign-modal.tsx, experiments-picker.tsx) hand-rolled the identical
// `rounded-full bg-moss px-5 py-2.5` string rather than use the thin stock button.
// Dense surfaces get a smaller pill (size="sm"/"xs"), never a squarer one.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-moss text-moss-contrast hover:opacity-90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30",
        // SOLID, unlike destructive's tint — the founder's call. These exist for
        // /campaigns/[id]'s Pause and Resume, which hand-rolled
        // `bg-amber-500/12 text-amber-700 dark:text-amber-300` and the emerald equivalent
        // because the scale had no warning/success and no --warning token to reach for.
        //
        // Paired with -contrast, never a literal white: --warning inverts from #b06f16 to a
        // light #e8b061 in dark, so hardcoded white text would be unreadable there.
        // --warning-contrast flips to #1f1405 to follow it. Same story for --signal.
        warning: "bg-warning text-warning-contrast hover:opacity-90",
        success: "bg-signal text-signal-contrast hover:opacity-90",
        link: "text-moss underline-offset-4 hover:underline",
      },
      // Horizontal padding scales with height so the pill keeps its proportions —
      // a short pill with wide padding reads as a lozenge, a tall one with tight
      // padding reads as a rectangle with rounded ends.
      size: {
        xs: "h-6 gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3.5 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        default: "h-10 gap-1.5 px-5 text-sm [&_svg:not([class*='size-'])]:size-4",
        lg: "h-11 gap-2 px-6 text-sm [&_svg:not([class*='size-'])]:size-4",
        // The auth-screen size. login/signup/forgot/reset all hand-wrote
        // "h-14 w-full rounded-full text-base" because the scale stopped at h-11 —
        // the same story as the PRIMARY_BTN pill. A focused single-purpose screen
        // wants a bigger target than a dense app row.
        xl: "h-14 gap-2 px-7 text-base [&_svg:not([class*='size-'])]:size-5",
        // Icon-only buttons are perfect circles: square box, no padding.
        icon: "size-10 [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-11 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
