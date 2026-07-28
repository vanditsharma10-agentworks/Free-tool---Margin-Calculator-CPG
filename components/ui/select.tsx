"use client";

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon, SearchIcon, XIcon } from "lucide-react"

/** Where the removable chips sit relative to the trigger. */
type ChipsPosition = "below" | "above" | "left" | "right" | "none"

type SelectRootProps = Omit<
  React.ComponentProps<typeof SelectPrimitive.Root>,
  "multiple" | "value" | "defaultValue" | "onValueChange"
> & {
  /** Multi-select. `value` becomes an array. */
  multiple?: boolean
  /** Where the removable chips render. Ignored unless `multiple`. Defaults to "below". */
  chips?: ChipsPosition
  value?: unknown
  defaultValue?: unknown
  onValueChange?: (value: never, event?: Event) => void
  /** Applied to the wrapper that lays out trigger + chips (multiple only). */
  className?: string
}

/**
 * Wraps Base UI's Select.Root.
 *
 * `multiple` is passed straight through — Base UI handles array values natively, so this
 * isn't a fake multi-select. What this adds is the part Base UI doesn't have: the chosen
 * values rendered as removable chips OUTSIDE the trigger. A trigger can only ever say
 * "3 selected"; chips show WHICH three and let you drop one without reopening the menu.
 *
 * Chips need the current value, so this tracks it when uncontrolled — pass `value` +
 * `onValueChange` to drive it yourself and this steps out of the way.
 */
function Select({
  multiple = false,
  chips = "below",
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: SelectRootProps) {
  const isControlled = value !== undefined
  const [internal, setInternal] = React.useState<unknown>(
    defaultValue ?? (multiple ? [] : null)
  )
  const current = isControlled ? value : internal

  const handleChange = React.useCallback(
    (next: unknown, event?: Event) => {
      if (!isControlled) setInternal(next)
      ;(onValueChange as ((v: unknown, e?: Event) => void) | undefined)?.(next, event)
    },
    [isControlled, onValueChange]
  )

  const selected = Array.isArray(current) ? (current as string[]) : []
  const showChips = multiple && chips !== "none" && selected.length > 0

  const root = (
    <SelectPrimitive.Root
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...({ multiple, value: current, defaultValue, onValueChange: handleChange } as any)}
      {...props}
    >
      {children}
    </SelectPrimitive.Root>
  )

  if (!showChips) return root

  const labels = collectLabels(children)
  const chipNode = (
    <SelectChips
      values={selected}
      labels={labels}
      onRemove={(v) => handleChange(selected.filter((x) => x !== v))}
    />
  )

  // "above"/"left" put the chips first in DOM order, which is also the reading order —
  // so a screen reader announces what's already chosen before the control that changes it.
  const horizontal = chips === "left" || chips === "right"
  const chipsFirst = chips === "above" || chips === "left"

  return (
    <div
      className={cn(
        "flex items-start gap-2",
        horizontal ? "flex-row" : "flex-col",
        className
      )}
    >
      {chipsFirst ? chipNode : root}
      {chipsFirst ? root : chipNode}
    </div>
  )
}

/**
 * Maps each item's value to its display text, so a chip can read "San Francisco" rather
 * than echoing a raw value. Walks the whole subtree because the items live inside
 * SelectContent (and possibly a SelectGroup), not directly under the root.
 */
function collectLabels(children: React.ReactNode): Map<string, string> {
  const map = new Map<string, string>()
  const walk = (nodes: React.ReactNode) => {
    React.Children.forEach(nodes, (child) => {
      if (!React.isValidElement(child)) return
      const props = child.props as { value?: string; children?: React.ReactNode }
      if (child.type === SelectItem && typeof props.value === "string") {
        map.set(props.value, itemText(child) || props.value)
        return
      }
      if (props.children) walk(props.children)
    })
  }
  walk(children)
  return map
}

/** The removable chips. Built on Badge so they inherit the library's pill vocabulary. */
function SelectChips({
  values,
  labels,
  onRemove,
  className,
}: {
  values: string[]
  labels?: Map<string, string>
  onRemove: (value: string) => void
  className?: string
}) {
  return (
    <div data-slot="select-chips" className={cn("flex flex-wrap gap-1.5", className)}>
      {values.map((v) => (
        <Badge key={v} variant="secondary" className="gap-1 pr-1">
          {labels?.get(v) ?? v}
          <button
            type="button"
            // The chip's whole point: deselect without reopening the menu.
            onClick={() => onRemove(v)}
            aria-label={`Remove ${labels?.get(v) ?? v}`}
            className="grid size-4 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <XIcon className="size-3" />
          </button>
        </Badge>
      ))}
    </div>
  )
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      // No inset padding: items run edge-to-edge so the popup's own rounded-xl + clipped
      // overflow rounds the first and last rows for free, and every row in between reads
      // as a flat band. An inset would leave the corners floating inside the popup.
      className={cn("scroll-my-1", className)}
      {...props}
    />
  )
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      {...props}
    >
      {/* Base UI hands the raw value to a render function. For a multi-select that value
          is an array, and rendering it verbatim spills "a,b,c" across the trigger and
          truncates. Summarise instead — the chips outside already name each choice, so
          the trigger only has to say how many.

          The empty case renders `placeholder` HERE rather than leaving it to Base UI:
          Base UI only honours its own `placeholder` prop when Value has no children, and
          this wrapper always passes a children function — so the placeholder was silently
          dead for every Select that also passed a render function. */}
      {(value: unknown) => {
        const empty =
          value == null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)

        if (empty) {
          return props.placeholder != null ? (
            <span className="text-muted-foreground">{props.placeholder}</span>
          ) : null
        }
        if (Array.isArray(value)) return `${value.length} selected`
        return typeof props.children === "function"
          ? (props.children as (v: unknown) => React.ReactNode)(value)
          : (props.children ?? (value as React.ReactNode))
      }}
    </SelectPrimitive.Value>
  )
}

// size mirrors Input's h-8/h-10 scale exactly so a Select and an Input (or a
// Select and a Button) sit flush in the same row. `sm` reproduces today's h-8
// default pixel-for-pixel so nothing changes for callers that don't pass a
// size; `default` is the new h-10 that lines up with the new Button default.
function SelectTrigger({
  className,
  // Matches Input's default (h-10) so a Select and an Input in one form align without
  // either call site passing a size.
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        // Pill, matching Input — a Select and an Input in the same form must be the same
        // shape or the row reads as two systems. Leading padding matches Input (pl-4 / pl-5)
        // so labels line up down a stacked form; trailing padding is tighter because the
        // chevron sits inside the curve and doesn't need the full inset.
        // bg-card for the same reason as Input: a control that reads as a FIELD should be a
        // white surface, not transparent. A filter dropdown lives on the page background more
        // often than an input does, and transparent made it grey there.
        "flex w-fit items-center justify-between gap-1.5 rounded-full border border-input bg-card py-2 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-10 data-[size=default]:pl-5 data-[size=default]:pr-3 data-[size=sm]:h-8 data-[size=sm]:pl-4 data-[size=sm]:pr-2.5 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
        }
      />
    </SelectPrimitive.Trigger>
  )
}

/**
 * The text a search matches against. String children are the norm; an item with richer
 * children (an icon + a label) should pass `data-text` so it stays findable.
 */
function itemText(el: React.ReactElement): string {
  const props = el.props as { children?: React.ReactNode; "data-text"?: string }
  if (typeof props["data-text"] === "string") return props["data-text"]
  if (typeof props.children === "string") return props.children
  return ""
}

/**
 * Filters the rendered item tree against a query, preserving groups that still have a
 * surviving item and dropping the ones that don't (a group heading with nothing under it
 * is just noise). Separators are dropped entirely while filtering — they divide groups,
 * and once groups come and go the dividers land in meaningless places.
 */
function filterTree(children: React.ReactNode, needle: string): { nodes: React.ReactNode[]; count: number } {
  let count = 0
  const walk = (nodes: React.ReactNode): React.ReactNode[] =>
    React.Children.toArray(nodes).flatMap((child) => {
      if (!React.isValidElement(child)) return []
      if (child.type === SelectItem) {
        const hit = itemText(child).toLowerCase().includes(needle)
        if (hit) count++
        return hit ? [child] : []
      }
      if (child.type === SelectGroup) {
        const inner = walk((child.props as { children?: React.ReactNode }).children)
        const kept = inner.some((n) => React.isValidElement(n) && n.type === SelectItem)
        return kept ? [React.cloneElement(child, { key: child.key }, inner)] : []
      }
      if (child.type === SelectSeparator) return []
      return [child]
    })
  return { nodes: walk(children), count }
}

function SelectContent({
  className,
  children,
  side = "bottom",
  // Clears the trigger's focus ring (ring-3) instead of sitting on top of it.
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  // FALSE on purpose. Base UI defaults this to true, which is the native-macOS
  // behaviour: the popup floats OVER the trigger so the selected item lands exactly
  // on top of the closed value. It covers the field you just clicked, and the list
  // jumps to a different position depending on which item is selected. A dropdown
  // that opens below the trigger, in the same place every time, is the calmer default.
  alignItemWithTrigger = false,
  // The combobox switch. One boolean: adds a filter field and narrows the list as you
  // type. Everything else is untouched — same Select, same value/onValueChange — so a
  // list can grow past comfortable browsing without a different component or API.
  searchable = false,
  searchPlaceholder = "Search…",
  emptyMessage = "No results.",
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  > & {
    /** Turns the menu into a searchable filter list. */
    searchable?: boolean
    searchPlaceholder?: string
    emptyMessage?: string
  }) {
  const [query, setQuery] = React.useState("")
  const needle = query.trim().toLowerCase()
  const filtered = searchable && needle ? filterTree(children, needle) : null
  const list = filtered ? filtered.nodes : children
  const isEmpty = filtered?.count === 0

  // KNOWN GAP: the field does not take focus when the menu opens — you have to click it.
  // Base UI's Select keeps focus on the trigger and guards it: a manual .focus() on the
  // input is reverted immediately, so no timing trick wins. Select.Popup has no
  // `initialFocus` escape hatch either (its Dialog, Popover and Combobox parts do) —
  // Select simply isn't built to host a focusable child. The real fix is to rebuild this
  // variant on Base UI's `combobox` part, which is designed for it. Filtering itself is
  // unaffected and works.

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          // min-width, NOT width. `w-(--anchor-width)` pinned the popup to exactly its
          // trigger, so every option longer than the trigger's own label got cut — and a
          // filter trigger says "Type" while its options say "Boutique / concept store". A
          // menu that hides the thing you're choosing between is worse than one that's wider
          // than the button that opened it.
          //
          // One `max()` rather than `min-w-(--anchor-width) min-w-36`: those are the same
          // property, so tailwind-merge keeps only the last and would silently drop the
          // anchor width — the bug looks like the fix simply not working.
          //
          // max-w-(--available-width) keeps it inside the viewport. Past THAT an option is
          // still cut (ItemText is whitespace-nowrap shrink-0), but it would have to be
          // wider than the whole window to get there — the real bug was a 71px trigger, not
          // a 1270px one.
          className={cn("relative isolate z-50 max-h-(--available-height) min-w-[max(var(--anchor-width),9rem)] max-w-(--available-width) origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-xl bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className )}
          {...props}
        >
          {searchable && (
            <div
              data-slot="select-search"
              // sticky + bg-popover so the field stays put while the list scrolls under it.
              className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-popover px-5 py-2.5"
            >
              <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                // Base UI's Select does its own typeahead on keypress — it would jump the
                // highlight to a matching item on every letter typed here, fighting the
                // filter. Swallow character keys, but let the navigation keys through so
                // Arrow/Enter/Escape still drive the list from inside the field.
                onKeyDown={(e) => {
                  const nav = ["ArrowDown", "ArrowUp", "Enter", "Escape", "Tab", "Home", "End"]
                  if (!nav.includes(e.key)) e.stopPropagation()
                }}
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          )}
          <SelectScrollUpButton />
          <SelectPrimitive.List>{list}</SelectPrimitive.List>
          {isEmpty && (
            <div className="px-5 py-3 text-sm text-muted-foreground">{emptyMessage}</div>
          )}
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      // px-5 matches SelectItem's inset so a group heading lines up with its own items.
      className={cn("px-5 py-1.5 pt-2.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        // pl-5 = 20px from the popup edge, matching the default trigger's pl-5 exactly,
        // so the closed value and the open list sit on the same line. (At size="sm" the
        // trigger is pl-4/16px, so the list runs 4px wider — the popup can't see the
        // trigger's size, and 4px is imperceptible next to the 10px jump the old pl-1.5
        // produced.) pr-8 reserves the check indicator's lane so long labels never run
        // underneath it.
        //
        // rounded-none: rows are flat bands. The popup clips its own rounded-xl, so the
        // top and bottom rows pick up the corners automatically — including when a search
        // box or scroll arrow takes the top slot, where a hardcoded first:rounded-t would
        // have been wrong.
        "relative flex w-full cursor-default items-center gap-1.5 rounded-none py-2 pr-8 pl-5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      // mx-0, not -mx-1: the group no longer insets its items, so a separator already
      // spans the full popup width. The old negative margin would now overhang the edge.
      className={cn("pointer-events-none mx-0 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon
      />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon
      />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectChips,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
