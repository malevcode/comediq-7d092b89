/**
 * Comediq's own vote arrow.
 *
 * Drawn here rather than pulled from the icon set for two reasons. The thin
 * stroked chevron the app used reads as "expand this section", not "vote", and
 * it is the same glyph every template ships with. A solid wedge is both more
 * obviously a vote and recognisably ours.
 *
 * `filled` is the voted state: same shape, no hollow centre.
 */
export function VoteArrow({
  direction = "up",
  filled = false,
  className,
}: {
  direction?: "up" | "down";
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={direction === "down" ? { transform: "rotate(180deg)" } : undefined}
    >
      {/* A broad arrowhead on a short stem. Wider than a chevron so it still
          reads as an arrow at 16px, and unmistakably pointing rather than
          merely angled. */}
      <path
        d="M12 2.8 L22 13.4 H16.2 V20.4 H7.8 V13.4 H2 Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 1.6 : 2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default VoteArrow;
