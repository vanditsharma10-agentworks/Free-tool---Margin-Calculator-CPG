"use client";

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Fields are pills, exactly like Button — rounded-full at every size, so a field and
// a button sitting in the same row read as one control group instead of two systems.
//
// Padding is deliberately generous and tracks the radius: at h-10 the corner radius is
// 20px, so px-5 starts the text right where the curve ends. Tighter padding would let
// the placeholder collide with the round edge, which is what makes a naive pill input
// look cramped.
//
// The default is h-10 to match Button's default. `sm` (h-8) is the dense pairing for
// admin toolbars — pair it with Button size="sm" and the two line up exactly.
const inputVariants = cva(
  // bg-card, not bg-transparent: a field is a white SURFACE, not a hole showing whatever's
  // behind it. Transparent only looked right because most fields sit on a Card, which is
  // already #fff — put one on the page (--background is #f7f7fb) and it goes grey, which is
  // exactly what happened to the table toolbar. Dark keeps its own tint below.
  "w-full min-w-0 rounded-full border border-input bg-card text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      size: {
        sm: "h-8 px-4 py-1",
        default: "h-10 px-5 py-2",
        // Matches Button's xl — the auth-screen field. The five auth files each wrote
        // "h-14 rounded-2xl px-5 text-base" by hand; note they also forced rounded-2xl
        // back when Input was rounded-lg. It's a pill now, so the shape comes free.
        lg: "h-14 px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function Input({
  className,
  type,
  size,
  ...props
}: Omit<React.ComponentProps<"input">, "size"> & VariantProps<typeof inputVariants>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputVariants({ size, className }))}
      {...props}
    />
  )
}

export { Input, inputVariants }
