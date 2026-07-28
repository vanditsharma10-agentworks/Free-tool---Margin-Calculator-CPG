import { CircleHelpIcon } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

/**
 * A "?" beside a term that doesn't explain itself, with the explanation a click away.
 *
 * NOT from the audit — the app had no prior art for this, which is the point of adding it
 * here rather than at the call site. Every jargon number is going to want one, and the first
 * hand-rolled trigger is what guarantees the second one is hand-rolled differently. That's
 * the disease this library exists to treat; this is the one case where getting ahead of it
 * costs nothing.
 *
 * Not a ghost Button: the smallest icon button on the scale is size-6, and this has to sit
 * inline inside an 11px label without pushing the line around — so it's 16px, baseline-aligned,
 * with no hover fill. It stays a real button for keyboard and screen-reader users.
 *
 * Popover rather than Tooltip on purpose: a tooltip is unreachable on touch, and this is
 * explanatory copy a founder may want to sit and read rather than a label gloss.
 */
function InfoHint({
  children,
  label = "More information",
  className,
  contentClassName,
  ...props
}: Omit<React.ComponentProps<typeof PopoverTrigger>, "children"> & {
  children: React.ReactNode
  /** The accessible name — say what it explains, e.g. "What does in market mean?". */
  label?: string
  contentClassName?: string
}) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={label}
        className={cn(
          "inline-grid size-4 shrink-0 place-items-center rounded-full align-text-bottom text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          className
        )}
        {...props}
      >
        <CircleHelpIcon className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className={cn("w-72 text-[13px] leading-relaxed", contentClassName)}>
        {children}
      </PopoverContent>
    </Popover>
  )
}

export { InfoHint }
