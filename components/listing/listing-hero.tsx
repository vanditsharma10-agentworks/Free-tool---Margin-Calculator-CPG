import { Container } from "@/components/layout";

/**
 * Listing-page hero: a solid brand-colour band (like the individual blog-post
 * hero) carrying a static H1 + one subhead line. No typing effect — this is a
 * hub page, not the homepage. The dot-grid texture lives below, behind the
 * cards (see <ListingGrid>), not here.
 */
export function ListingHero({
  badge,
  title,
  subtitle,
}: {
  badge?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="bg-primary text-primary-foreground">
      <Container className="flex flex-col items-center gap-5 py-20 text-center md:py-28">
        {badge ? (
          <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-sm font-medium">
            {badge}
          </span>
        ) : null}
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-[3.25rem] md:leading-[1.05]">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-2xl text-lg text-primary-foreground/80 text-pretty">
            {subtitle}
          </p>
        ) : null}
      </Container>
    </section>
  );
}
