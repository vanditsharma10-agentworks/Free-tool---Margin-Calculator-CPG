import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "flex items-center gap-2 font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
  {
    variants: {
      variant: {
        /** Sits directly above its control, in the reading voice. */
        default: "text-sm leading-none",
        /**
         * The small-caps section caption — "NAME", "GOAL", "TARGETING".
         *
         * From the audit: `text-xs font-medium uppercase tracking-wide text-muted-foreground`
         * is hand-written 59 times across 12+ files, which makes it the most-copied string
         * found so far — the app's actual form language, just never named. It reads as
         * structure rather than as a sentence, which is why it can label a whole section
         * (a group of chips, a table column) and not only an input.
         */
        caption: "text-xs tracking-wide uppercase text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Label({
  className,
  variant,
  required,
  children,
  ...props
}: React.ComponentProps<"label"> &
  VariantProps<typeof labelVariants> & {
    /** Appends a destructive asterisk. Purely visual — pair with an actual `required` on the control. */
    required?: boolean
  }) {
  return (
    <label
      data-slot="label"
      data-variant={variant ?? "default"}
      className={cn(labelVariants({ variant }), className)}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" className="text-destructive">
          *
        </span>
      )}
    </label>
  )
}

export { Label, labelVariants }
