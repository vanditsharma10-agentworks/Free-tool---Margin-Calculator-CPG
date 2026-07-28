import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Radius: rounded-xl is the one card radius the library ships. The audit counted 66
// hand-rolled rounded-xl divs against 43 rounded-lg and 36 rounded-2xl — xl was already
// the plurality choice in the wild, so standardizing on it keeps the shape most of the
// app already reached for instead of asking 59 files to adopt a fourth number.
const cardVariants = cva(
  // The has-[] rules zero the card's own padding wherever media meets an edge, so an
  // image always bleeds to the card's corners instead of floating in a padded box.
  "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl border border-transparent py-(--card-spacing) text-sm text-card-foreground transition-colors [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 has-[>[data-slot=card-media]:first-child]:pt-0 has-[>[data-slot=card-media]:last-child]:pb-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
  {
    variants: {
      variant: {
        // Solid surface — the default everywhere a card sits directly on the page bg.
        default: "bg-card ring-1 ring-foreground/10",
        // Nested / secondary panel, e.g. a settings block inside a campaign card. No
        // ring of its own so it doesn't double up against the parent card's ring.
        muted: "bg-muted/40",
        // Transparent fill, hairline border only — for surfaces that already sit on a
        // card (dialogs, sheets) where a filled bg-card would stack two surfaces.
        outline: "border-border bg-transparent",
        // Clickable cards (pipeline rows, candidate/venue/product pickers). Same resting
        // look as default, but signals affordance on hover instead of only on a child button.
        interactive: "cursor-pointer bg-card ring-1 ring-foreground/10 hover:border-moss/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Card({
  className,
  variant,
  size = "default",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
}

const mediaVariants = cva(
  // A ratio box, not an intrinsic image — a fixed aspect keeps a grid of cards aligned
  // no matter what the source images measure. Corners round only where the media meets
  // the card's edge, so it works as a top image, a bottom image, or the whole card.
  "relative overflow-hidden bg-muted first:rounded-t-xl last:rounded-b-xl only:rounded-xl [&>img]:size-full [&>img]:object-cover",
  {
    variants: {
      ratio: {
        "21/9": "aspect-[21/9]",
        "16/9": "aspect-video",
        "3/2": "aspect-[3/2]",
        "4/3": "aspect-[4/3]",
        "1/1": "aspect-square",
        /** Let the image set its own height — for known-uniform sources only. */
        auto: "",
      },
      /** How hard the image is darkened so overlay text stays legible. */
      scrim: {
        none: "",
        // Bottom-anchored gradient: the default for a title sitting at the foot of a photo.
        bottom:
          "after:pointer-events-none after:absolute after:inset-0 after:bg-gradient-to-t after:from-black/75 after:via-black/25 after:to-transparent",
        // Full even wash: for text that sits centred, or busy images.
        full: "after:pointer-events-none after:absolute after:inset-0 after:bg-black/45",
      },
    },
    defaultVariants: { ratio: "16/9", scrim: "none" },
  }
)

/**
 * The image slot. Pass an <img> (or any element) as children; pass `overlay` to lay
 * content on top of it. This is the ONLY way to put an image in a Card — the scrim,
 * ratio and corner-rounding all live here so no call site hand-rolls them.
 */
function CardMedia({
  className,
  ratio,
  scrim,
  overlay,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof mediaVariants> & {
    /** Content laid over the image. Pair with a scrim or it won't be legible. */
    overlay?: React.ReactNode
  }) {
  return (
    <div
      data-slot="card-media"
      // An overlay with no scrim is unreadable on a light photo — default it on.
      className={cn(mediaVariants({ ratio, scrim: scrim ?? (overlay ? "bottom" : "none") }), className)}
      {...props}
    >
      {children}
      {overlay && (
        // z-10 clears the ::after scrim. text-on-media is fixed in both themes because
        // the scrim underneath is always dark.
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1 p-(--card-spacing) text-on-media [&_[data-slot=card-description]]:text-on-media-muted [&_[data-slot=card-title]]:text-on-media">
          {overlay}
        </div>
      )}
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardMedia,
}
