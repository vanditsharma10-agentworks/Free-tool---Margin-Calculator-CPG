import { Accordion } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { FaqItem } from "./faq-item";
import type { FaqItemData } from "./types";

/** The accordion list of FAQ rows. All rows start collapsed; multiple can be
 *  open at once (Base UI defaults to `openMultiple`). */
export function FaqList({
  items,
  className,
}: {
  items: FaqItemData[];
  className?: string;
}) {
  return (
    <Accordion className={cn("gap-4", className)}>
      {items.map((item) => (
        <FaqItem key={item.id} {...item} />
      ))}
    </Accordion>
  );
}
