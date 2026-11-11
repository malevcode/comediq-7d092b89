/**
 * The hand-cut sticker used for "By Comediq" and "Mic of the Day".
 * Blue and white only, tilted, with an uneven edge and a hard offset shadow so it reads as
 * something stuck on the card rather than a pill.
 */
export function ComediqSticker({
  label = "By Comediq",
  tone = "white",
  className = "",
}: {
  label?: string;
  /** white: white sticker, blue ink. blue: blue sticker, white ink. */
  tone?: "white" | "blue";
  className?: string;
}) {
  const colors =
    tone === "blue"
      ? "bg-[#1a5fb4] text-white border-white shadow-[2px_2px_0_#ffffff]"
      : "bg-white text-[#1a5fb4] border-[#1a5fb4] shadow-[2px_2px_0_#1a5fb4]";

  return (
    <span
      className={`inline-block -rotate-6 select-none whitespace-nowrap border-2 px-2 py-0.5 text-[11px] font-extrabold leading-tight tracking-tight ${colors} ${className}`}
      style={{ borderRadius: "11px 4px 13px 5px / 5px 12px 4px 11px" }}
    >
      {label}
    </span>
  );
}

export default ComediqSticker;
