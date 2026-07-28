import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqItemData } from "./types";

/** One FAQ row: a rounded card with a question trigger and a collapsible
 *  answer. The ＋/✕ toggle is provided by the accordion primitive. */
export function FaqItem({ id, question, answer }: FaqItemData) {
  return (
    <AccordionItem value={id} className="rounded-2xl bg-muted/40 px-6">
      <AccordionTrigger className="py-5 text-base font-semibold">
        {question}
      </AccordionTrigger>
      <AccordionContent className="pb-5 leading-relaxed text-muted-foreground">
        {answer}
      </AccordionContent>
    </AccordionItem>
  );
}
