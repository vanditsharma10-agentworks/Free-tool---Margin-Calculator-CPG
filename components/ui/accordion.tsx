"use client";

import { ChevronDownIcon } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A disclosure list: headers you click to open what's under them.
 *
 * From the audit: hand-rolled twice already — app-sidebar's nav sections (an `aria-expanded`
 * button plus a chevron it rotates by hand) and thread-drawer's per-venue email cards, which
 * used a literal "+" and "−" as the affordance. Neither knew the other existed, and the
 * second one wasn't reachable by keyboard as a group at all.
 *
 * `single` by default — opening one closes the rest. That's the right default for a list of
 * long panels (a venue's emails run to a subject plus eight rows of body): letting them all
 * open turns a disclosure list back into the wall of text it was hiding. Pass `multiple` when
 * the panels are short enough to want side by side.
 *
 * Controlled or not. Uncontrolled covers the common case; `value`/`onValueChange` exist for
 * the caller that needs to open a panel from elsewhere — the sidebar remembers its sections
 * across navigations, which an internal state can't do.
 */

type AccordionContextValue = {
  isOpen: (value: string) => boolean
  toggle: (value: string) => void
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null)

function useAccordion() {
  const ctx = React.useContext(AccordionContext)
  if (!ctx) throw new Error("AccordionItem must be used inside an Accordion")
  return ctx
}

function Accordion({
  type = "single",
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "value" | "defaultValue" | "onChange"> & {
  /** `single` closes the others on open. `multiple` leaves them be. */
  type?: "single" | "multiple"
  /** Controlled: the open item(s). Omit for uncontrolled. */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}) {
  const [internal, setInternal] = React.useState<string[]>(defaultValue ?? [])
  const open = value ?? internal

  const toggle = React.useCallback(
    (item: string) => {
      const next = open.includes(item)
        ? open.filter((v) => v !== item)
        : type === "single"
          ? [item]
          : [...open, item]
      if (value === undefined) setInternal(next)
      onValueChange?.(next)
    },
    [open, type, value, onValueChange]
  )

  const ctx = React.useMemo<AccordionContextValue>(
    () => ({ isOpen: (v) => open.includes(v), toggle }),
    [open, toggle]
  )

  return (
    <AccordionContext.Provider value={ctx}>
      <div data-slot="accordion" className={cn("flex flex-col gap-2", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

/**
 * One row. `trigger` is the always-visible header; children are what it reveals.
 *
 * The header is a real <button> with aria-expanded and aria-controls, which is the whole
 * reason this is a component: both hand-rolled versions got the visual right and the
 * announcement wrong, and a screen reader can't guess that a "+" means "expands".
 */
function AccordionItem({
  value,
  trigger,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "value"> & {
  value: string
  trigger: React.ReactNode
}) {
  const { isOpen, toggle } = useAccordion()
  const open = isOpen(value)
  const id = React.useId()

  return (
    <div
      data-slot="accordion-item"
      data-open={open || undefined}
      className={cn("overflow-hidden rounded-xl border border-border", className)}
      {...props}
    >
      <button
        type="button"
        aria-expanded={open}
        // Only when it resolves. The panel isn't rendered while closed — that's deliberate,
        // since these hold real forms and mounting three of them to show one is wasteful —
        // and aria-controls pointing at an id that doesn't exist is invalid rather than
        // merely useless. aria-expanded already carries the state; this adds the target only
        // once there IS one.
        aria-controls={open ? id : undefined}
        onClick={() => toggle(value)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        {trigger}
        {/* One chevron that rotates, not a "+" swapped for a "−": the rotation says which way
            this is going, and it's the same affordance every disclosure in the app uses. */}
        <ChevronDownIcon
          aria-hidden
          className={cn(
            "ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div id={id} data-slot="accordion-content" className="border-t border-border p-3">
          {children}
        </div>
      )}
    </div>
  )
}

export { Accordion, AccordionItem }
