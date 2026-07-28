import { Container } from "@/components/layout";
import { FaqHeader } from "./faq-header";
import { FaqList } from "./faq-list";
import type { FaqSectionData } from "./types";

/**
 * The full FAQ compound: centered header (badge + heading + subheading) over an
 * accordion list. Entirely data-driven from src/data/faqs.json.
 */
export function FaqSection({
  badge,
  heading,
  subheading,
  items,
}: FaqSectionData) {
  return (
    <section id="faq" className="scroll-mt-24 py-20 md:py-28">
      <Container className="flex flex-col items-center gap-12">
        <FaqHeader badge={badge} heading={heading} subheading={subheading} />
        <FaqList items={items} className="w-full max-w-3xl" />
      </Container>
    </section>
  );
}
