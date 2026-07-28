import { cn } from "@/lib/utils";

/**
 * Primary content region. `flex-1` lets it grow to fill the viewport between
 * the top nav and footer (the body is a flex column), keeping the footer
 * pinned to the bottom on short pages.
 */
export function Main({
  className,
  children,
  ...props
}: React.ComponentProps<"main">) {
  return (
    <main id="main-content" className={cn("flex-1", className)} {...props}>
      {children}
    </main>
  );
}
