import { v3bubblePalette, v3colors, V3_DISPLAY_STYLE } from "@/theme/v3";

/**
 * The small shared pieces every v3 screen uses.
 *
 * Mirrors the mobile app's `src/components/v3/V3Primitives.tsx` and
 * `StageTile.tsx` so a venue gets the same colour and the same artwork on both
 * platforms.
 */

/** Stable per-venue colour, so the same room is never two different blues. */
export function hashSeed(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 100000;
  }
  return hash;
}

export function paletteFor(seed: string): readonly [string, string] {
  return v3bubblePalette[hashSeed(seed) % v3bubblePalette.length];
}

/**
 * The stage illustration the boards use as venue artwork: a back wall with
 * panel lines, a spotlight cone, and a mic on a stand.
 *
 * The boards reference photos at /_blob/ URLs that only resolve on the design
 * canvas, and almost no mic row has a cover photo yet (0 of 804 as of
 * 2026-11-22), so this stands in. Drawn rather than bundled, so there is no
 * new asset to ship, and tinted from the venue's own palette entry so two
 * venues side by side do not look identical.
 */
export function StageTile({
  seed,
  className,
  radius = 0,
}: {
  seed: string;
  className?: string;
  radius?: number;
}) {
  const [wall] = paletteFor(seed);

  return (
    <svg
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <rect width="200" height="200" fill={wall} rx={radius} />
      <g opacity={0.18}>
        {[22, 44, 66, 88, 110, 132, 154, 176].map((y) => (
          <path key={y} d={`M0 ${y}H200`} stroke="#000000" strokeWidth={1.5} />
        ))}
      </g>
      {/* Spotlight cone and floor pool, cream at low opacity. */}
      <path d="M64 0H136L182 200H18Z" fill="#FFECBE" opacity={0.16} />
      <ellipse cx={100} cy={178} rx={78} ry={18} fill="#FFECBE" opacity={0.22} />
      {/* Mic stand. */}
      <path d="M100 178V96M84 180H116" stroke="#111111" strokeWidth={4} strokeLinecap="round" />
      <rect x={93} y={76} width={14} height={24} rx={7} fill="#111111" />
    </svg>
  );
}

/** Venue artwork: the host's banner photo if there is one, else the stage. */
export function VenueArtwork({
  seed,
  bannerUrl,
  className,
  alt,
}: {
  seed: string;
  bannerUrl?: string | null;
  className?: string;
  alt?: string;
}) {
  if (bannerUrl) {
    return <img src={bannerUrl} alt={alt ?? ""} className={`${className ?? ""} object-cover`} />;
  }
  return <StageTile seed={seed} className={className} />;
}

const LOGO_URL = "/map-pins/comediq_logo_pin.png";

/**
 * The round venue badge: the host's circular map icon, else the Q mark for a
 * Comediq-run room, else initials on the venue's palette blue.
 */
export function VenueBubble({
  seed,
  initials,
  size = 44,
  iconUrl,
  isComediqRun = false,
  ring = true,
  className,
}: {
  seed: string;
  initials: string;
  size?: number;
  iconUrl?: string | null;
  isComediqRun?: boolean;
  ring?: boolean;
  className?: string;
}) {
  const [fill, textColor] = paletteFor(seed);
  const image = iconUrl ?? (isComediqRun ? LOGO_URL : null);

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full ${
        ring ? "border-[3px] border-white shadow-md" : ""
      } ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        backgroundColor: image ? v3colors.white : fill,
        color: image ? undefined : textColor,
        backgroundImage: image ? `url("${image.replace(/"/g, "%22")}")` : undefined,
        // A host photo fills the circle; the Q is a logo, so it is inset.
        backgroundSize: iconUrl ? "cover" : "62%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        ...(image ? {} : { ...V3_DISPLAY_STYLE, fontSize: Math.round(size * 0.34) }),
      }}
    >
      {image ? "" : initials}
    </span>
  );
}

/** Venue names use Archivo; everything else is DM Sans. Per the spec. */
export function VenueName({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={className} style={{ ...V3_DISPLAY_STYLE, ...style }}>
      {children}
    </span>
  );
}

/** A plain outlined chip. Sentence case, never all-caps, per the spec. */
export function V3Chip({
  children,
  tone = "plain",
}: {
  children: React.ReactNode;
  tone?: "plain" | "blue" | "solid";
}) {
  const tones = {
    plain: { background: v3colors.white, color: v3colors.ink, border: `1px solid ${v3colors.border}` },
    blue: { background: v3colors.surfaceBlue, color: v3colors.royal, border: "1px solid transparent" },
    solid: { background: v3colors.royal, color: v3colors.white, border: "1px solid transparent" },
  } as const;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
      style={tones[tone]}
    >
      {children}
    </span>
  );
}

/** The white rounded card the boards use for every panel. */
export function V3Card({
  children,
  className,
  faded = false,
}: {
  children: React.ReactNode;
  className?: string;
  faded?: boolean;
}) {
  return (
    <section
      className={`rounded-[28px] bg-white p-5 shadow-[0_8px_24px_rgba(18,26,51,0.07)] transition-opacity ${
        className ?? ""
      }`}
      style={{ border: `1px solid ${v3colors.borderSoft}`, opacity: faded ? 0.45 : 1 }}
    >
      {children}
    </section>
  );
}
