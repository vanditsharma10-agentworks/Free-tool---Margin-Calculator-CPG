import { cn } from "@/lib/utils";

/**
 * Centered, max-width content wrapper with consistent horizontal gutters.
 * Width and padding come from the theme layer (`--container-max`,
 * `--container-padding`) so the whole site shares one content rhythm.
 */
export function Container({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-container px-[var(--container-padding)]",
        className,
      )}
      {...props}
    />
  );
}
