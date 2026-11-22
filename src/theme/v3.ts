// Design tokens for the v3 redesign on the web.
//
// Source of truth: docs/design/storytime-redesign-v3/SPEC.md. This mirrors the
// mobile app's `src/theme/v3.ts` so the two platforms cannot drift apart on
// colour.
//
// The spec is strict about two things, so they are encoded here rather than
// left to each screen:
//   1. Comediq blue and white only. No green anywhere. Where the .dc.html
//      boards used green (#3DBE74 for "Live"/"Publish"/the switch's on state)
//      this palette substitutes a Comediq blue.
//   2. Sentence case. No all-caps pill badges. There is deliberately no
//      `uppercase` token here.
//
// These live alongside the site's existing Tailwind theme instead of replacing
// it, so pages that have not been rebuilt keep working.

export const v3colors = {
  /** Primary brand blue. Buttons, active tab, bubbles, links. */
  royal: "#1E4894",
  /** Darker blue. Headers, pressed states, banner fills. */
  deep: "#173A7A",
  /** Light blue. Accents on dark, avatar backgrounds, secondary text on blue. */
  sky: "#8FC2F5",
  /** Page background. */
  cream: "#F4EDE1",
  /** Default text. */
  ink: "#08142B",

  white: "#FFFFFF",

  /** Surfaces that sit on cream. */
  surface: "#FFFFFF",
  /** Inset surfaces, e.g. a stats block. */
  surfaceSunken: "#EDEFF5",
  /** Pale blue chip fill. */
  surfaceBlue: "#EEF2FA",

  /** Hairlines and field borders. */
  border: "#E4E7EE",
  /** The lighter hairline the boards use inside cards. */
  borderSoft: "#EEF0F4",
  borderField: "#D8DCE5",
  /** Dashed outline used by the register sheet's steps. */
  borderDashed: "#9DBDE8",
  /** Tinted surface for the secondary round buttons on mic detail. */
  surfaceTinted: "#F7F2E8",
  /** Body copy that is not a heading. */
  bodyInk: "#4A5160",
  /** Disabled / inactive step numbers. */
  inactive: "#9AA3B2",
  /** A pending button or a step mid-flight. */
  busy: "#7E97C9",

  /** Secondary text. */
  muted: "#5F6675",
  /** Tertiary text, map labels. */
  mutedSoft: "#8A8F99",
  /** Disabled / inactive tab icons. */
  tabInactive: "#6B7280",
} as const;

/**
 * Bubble and avatar fills, cycled by venue so neighbouring venues read as
 * different without leaving the brand. Blue and white only, per the spec.
 * Each entry is [background, foreground].
 */
export const v3bubblePalette: ReadonlyArray<readonly [string, string]> = [
  ["#1E4894", "#FFFFFF"],
  ["#173A7A", "#FFFFFF"],
  ["#2B56A6", "#FFFFFF"],
  ["#0F2A5C", "#FFFFFF"],
  ["#3D6FD1", "#FFFFFF"],
  ["#8FC2F5", "#0F2A5C"],
  ["#FFFFFF", "#1E4894"],
] as const;

/**
 * The "Add a listing" flow runs on a Comediq blue screen rather than cream —
 * see ListingFlow.dc.html. These are that screen's surfaces.
 *
 * Two greens from the boards are swapped for blues here, per "no green
 * anywhere": the switch's on state and the Publish button. The error coral is
 * kept, because it is not green and an unreadable error state would be worse
 * than a strict palette.
 */
export const v3listing = {
  screen: "#1E4894",
  /** Text inputs and chip groups. */
  input: "#2B56A6",
  /** Cards, venue results, the calendar. */
  card: "#173A7A",
  /** The preview card, darkest so it reads as the real page. */
  preview: "#0E1A36",

  text: "#F4EDE1",
  textSoft: "#C9D3EA",
  label: "#DCE3F2",
  hint: "#AEB9D6",

  accent: "#8FC2F5",
  onAccent: "#08142B",

  /** Was #3DBE74 on the boards. */
  switchOn: "#8FC2F5",
  /** Was #3DBE74 on the boards. */
  publish: "#FFFFFF",
  switchOff: "rgba(244,237,225,0.32)",

  errorBorder: "#FFB4A8",
  errorText: "#FFC9C0",

  hairline: "rgba(255,255,255,0.12)",
  hairlineStrong: "rgba(255,255,255,0.35)",
} as const;

/**
 * Archivo, extra bold and slightly expanded. Reserved for the Comediq wordmark
 * and venue names only, per the spec. Everything else is DM Sans, which is the
 * `font-dmsans` Tailwind family.
 */
export const V3_DISPLAY_STYLE = {
  fontFamily: "Archivo, 'DM Sans', system-ui, sans-serif",
  fontStretch: "112%",
  fontWeight: 800,
  letterSpacing: "-0.03em",
} as const;

/** Width breakpoints from WEB_AND_HOST_PLAN.md. */
export const V3_DESKTOP_MIN_WIDTH = 1024;

export type V3ColorKey = keyof typeof v3colors;
