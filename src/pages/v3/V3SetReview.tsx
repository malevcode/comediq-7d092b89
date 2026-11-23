import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import SEO from "@/components/SEO";
import { V3Card, VenueBubble, VenueName } from "@/components/v3/V3Primitives";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useMySet } from "@/hooks/useMySets";
import { v3colors, V3_DISPLAY_STYLE } from "@/theme/v3";
import { initialsOf } from "@/utils/venues";

/**
 * Set review, from Main.dc.html's SET REVIEW board: the recording on top, then
 * the set list and the notes.
 *
 * Desktop puts the set list and notes side by side, per the Set review row of
 * WEB_AND_HOST_PLAN.md.
 *
 * The boards draw a bespoke waveform. This uses the browser's own audio
 * element instead: the file lives in Supabase storage and there is no stored
 * waveform, so drawing one would mean decoding every recording in the page.
 */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[17px] font-semibold" style={{ color: v3colors.ink }}>
      {children}
    </span>
  );
}

/** The AI pass stores a list of bits under a few possible keys. */
function bitsFrom(aiSummary: unknown): string[] {
  if (!aiSummary || typeof aiSummary !== "object") return [];
  const record = aiSummary as Record<string, unknown>;
  for (const key of ["bits", "setList", "set_list", "jokes", "topics"]) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value
        .map((item) =>
          typeof item === "string"
            ? item
            : typeof item === "object" && item !== null
              ? String((item as Record<string, unknown>).title ?? (item as Record<string, unknown>).text ?? "")
              : "",
        )
        .filter((item) => item.length > 0);
    }
  }
  return [];
}

export default function V3SetReview() {
  const { setId = "" } = useParams();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { set, isLoading } = useMySet(setId);

  if (isLoading) {
    return (
      <div className="px-6 py-20 font-dmsans" style={{ color: v3colors.muted }}>
        Loading…
      </div>
    );
  }

  if (!set) {
    return (
      <div className="px-6 py-20 font-dmsans">
        <h1 className="text-2xl font-bold">We could not find that set</h1>
        <button
          type="button"
          onClick={() => navigate("/sets")}
          className="mt-5 h-12 rounded-full px-6 font-bold text-white"
          style={{ background: v3colors.royal }}
        >
          Back to sets
        </button>
      </div>
    );
  }

  const seed = set.venueName?.trim() || set.id;
  const name = set.title?.trim() || set.venueName?.trim() || "Untitled set";
  const date = new Date(set.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const bits = bitsFrom(set.aiSummary);

  const recording = (
    <V3Card>
      <Label>Recording</Label>
      {set.fileUrl ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio controls src={set.fileUrl} className="mt-3.5 w-full">
          Your browser cannot play this recording.
        </audio>
      ) : (
        <p className="mt-3 text-[15px]" style={{ color: v3colors.muted }}>
          No recording was saved for this set.
        </p>
      )}
    </V3Card>
  );

  const setList = (
    <V3Card>
      <Label>Set list</Label>
      {bits.length > 0 ? (
        <ol className="m-0 mt-2 flex list-none flex-col gap-2.5 p-0">
          {bits.map((bit, index) => (
            <li key={`${bit}-${index}`} className="flex items-center gap-3 text-[17px]">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: "#DDEBFA", color: v3colors.royal }}
              >
                {index + 1}
              </span>
              <span>{bit}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-[15px]" style={{ color: v3colors.muted }}>
          No set list saved for this one yet.
        </p>
      )}
    </V3Card>
  );

  const notes = (
    <V3Card>
      <Label>Transcript</Label>
      {set.transcription ? (
        <p
          className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed"
          style={{ color: v3colors.bodyInk }}
        >
          {set.transcription}
        </p>
      ) : (
        <p className="mt-3 text-[15px]" style={{ color: v3colors.muted }}>
          {set.status === "processing"
            ? "The transcript is still being made."
            : "No transcript for this set."}
        </p>
      )}
    </V3Card>
  );

  return (
    <div className="min-h-screen font-dmsans" style={{ background: v3colors.cream }}>
      <SEO title={`${name} | Comediq`} description={`Your set at ${set.venueName ?? "a mic"}.`} />

      <div className={isDesktop ? "mx-auto max-w-5xl px-8 py-8" : "px-5 pb-40 pt-13"}>
        <button
          type="button"
          onClick={() => navigate("/sets")}
          aria-label="Back to sets"
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white shadow"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="mx-1 my-5 flex items-center gap-3.5">
          <VenueBubble seed={seed} initials={initialsOf(seed)} size={60} ring={false} />
          <div className="min-w-0">
            <VenueName className="block text-2xl" style={{ color: v3colors.ink }}>
              {name}
            </VenueName>
            <div className="mt-1 text-base" style={{ color: v3colors.muted }}>
              {[date, set.venueName].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>

        {recording}

        {isDesktop ? (
          <div className="mt-3.5 grid grid-cols-2 gap-3.5">
            {setList}
            {notes}
          </div>
        ) : (
          <div className="mt-3.5 flex flex-col gap-3.5">
            {setList}
            {notes}
          </div>
        )}
      </div>
    </div>
  );
}
