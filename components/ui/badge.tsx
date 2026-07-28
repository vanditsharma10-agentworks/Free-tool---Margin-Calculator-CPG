"use client";

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Every tone the app needs, all tinted (`bg-X/12 text-X`) rather than solid — a
// badge sits inside cards and table rows next to real content, so it reads as a
// label, not another button. `success`/`warning`/`info`/`neutral` are what let the
// ~14 hand-rolled status→colour maps collapse into one component (see StatusBadge).
const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-moss/12 text-moss [a]:hover:bg-moss/20",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        success: "bg-signal/12 text-signal [a]:hover:bg-signal/20",
        warning: "bg-warning/12 text-warning [a]:hover:bg-warning/20",
        info: "bg-info/12 text-info [a]:hover:bg-info/20",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        neutral: "bg-muted text-muted-foreground [a]:hover:bg-muted/70",
      },
      size: {
        default: "h-5 gap-1 px-2 text-xs [&>svg]:size-3",
        sm: "h-4 gap-0.5 px-1.5 text-[11px] [&>svg]:size-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  size = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, size }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
      size,
    },
  })
}

export { Badge, badgeVariants }
