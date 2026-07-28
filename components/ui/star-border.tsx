/**
 * Animated "star border" shimmer — two glinting radial dots that trace the top
 * and bottom edges of a button. Adapted from the react-bits StarBorder, but
 * rendered as an overlay so it decorates the site's existing (violet) buttons
 * instead of replacing their styling.
 *
 * Usage: give the button `relative isolate overflow-hidden`, drop <StarBorder />
 * inside it, and wrap the button's label in a `relative z-10` element so the
 * text stays above the shimmer.
 */
type StarBorderProps = {
  /** Star colour — white on filled brand buttons, brand violet on light ones. */
  color?: string;
  /** One full sweep duration (CSS time), e.g. "6s". */
  speed?: string;
};

export function StarBorder({ color = "#ffffff", speed = "6s" }: StarBorderProps) {
  return (
    <>
      {/* Thin — sits right on the button edge like a lit border, not a glow blob. */}
      <span
        aria-hidden
        className="star-anim pointer-events-none absolute right-[-250%] bottom-[-1px] z-0 h-[3px] w-[300%] rounded-full opacity-80"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 12%)`,
          animation: `star-movement-bottom ${speed} linear infinite alternate`,
        }}
      />
      <span
        aria-hidden
        className="star-anim pointer-events-none absolute top-[-1px] left-[-250%] z-0 h-[3px] w-[300%] rounded-full opacity-80"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 12%)`,
          animation: `star-movement-top ${speed} linear infinite alternate`,
        }}
      />
    </>
  );
}
