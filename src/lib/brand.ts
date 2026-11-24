/**
 * The Comediq Q mark.
 *
 * One constant, because this image is referenced from the map layers, the
 * bubble markers, the preview and venue cards, the tab bar and the city pill.
 * Eight places used to hold the path as a literal, which is how half of them
 * ended up still pointing at the old asset.
 *
 * The file is square (256x256), so anywhere it is drawn must keep that: use
 * `object-contain` in a square box, or a background at ~62% of a round
 * container. Never set a width and height that are not equal.
 *
 * The previous mark, `/map-pins/comediq_logo_pin.png`, is still in the repo
 * and is deliberately no longer referenced. Do not point new code at it.
 */
export const COMEDIQ_Q_LOGO = "/brand/comediq-q-logo.png";

/**
 * How much of a round bubble the Q fills, per the v3 spec's map rules. A
 * host's own photo bleeds to the edge; the Q is a logo, so it is inset.
 */
export const COMEDIQ_Q_INSET = "62%";
