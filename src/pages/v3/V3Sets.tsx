import { Link } from "react-router-dom";
import { AudioLines, ListOrdered } from "lucide-react";

import SEO from "@/components/SEO";
import { VenueBubble, VenueName } from "@/components/v3/V3Primitives";
import { useAuth } from "@/contexts/AuthContext";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useMySets, type MySet } from "@/hooks/useMySets";
import { v3colors, V3_DISPLAY_STYLE } from "@/theme/v3";
import { initialsOf } from "@/utils/venues";

/**
 * Sets, from Main.dc.html's SETS board.
 *
 * Phone keeps the list of rounded rows. Desktop becomes the table-like list
 * the plan asks for — "columns: date, venue, length, recording, set list" —
 * with the same rows underneath.
 */

function setDate(set: MySet): string {
  return new Date(set.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function setName(set: MySet): string {
  return set.title?.trim() || set.venueName?.trim() || "Untitled set";
}

function seedOf(set: MySet): string {
  return set.venueName?.trim() || set.id;
}

export default function V3Sets() {
  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  const { data: sets = [], isLoading } = useMySets();

  if (!user) {
    return (
      <div className="min-h-screen px-6 pb-40 pt-16 font-dmsans" style={{ background: v3colors.cream }}>
        <SEO title="Your sets | Comediq" description="Every mic and show you have done." />
        <h1 style={{ ...V3_DISPLAY_STYLE, fontSize: 40, color: v3colors.ink }}>Sets</h1>
        <p className="mt-2 text-[17px]" style={{ color: v3colors.muted }}>
          Sign in to see every mic and show you have done.
        </p>
        <Link
          to="/auth/sign-in?next=/v3/sets"
          className="mt-5 inline-flex h-12 items-center rounded-full px-6 font-bold text-white"
          style={{ background: v3colors.royal }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen font-dmsans ${isDesktop ? "" : "px-5 pb-40 pt-15"}`}
      style={{ background: v3colors.cream }}
    >
      <SEO title="Your sets | Comediq" description="Every mic and show you have done." />

      <div className={isDesktop ? "mx-auto max-w-4xl px-8 py-8" : ""}>
        <h1 className="mx-1" style={{ ...V3_DISPLAY_STYLE, fontSize: 40, color: v3colors.ink }}>
          Sets
        </h1>
        <p className="mx-1 mb-5 mt-1.5 text-[17px]" style={{ color: v3colors.muted }}>
          Every mic and show you have done
        </p>

        {isLoading && (
          <p className="mx-1" style={{ color: v3colors.muted }}>
            Loading your sets…
          </p>
        )}

        {!isLoading && sets.length === 0 && (
          <div
            className="rounded-[28px] bg-white p-6"
            style={{ border: `1px solid ${v3colors.borderSoft}` }}
          >
            <p className="text-[17px] font-semibold">No sets yet</p>
            <p className="mt-1.5 text-[15px]" style={{ color: v3colors.muted }}>
              Record a set after you check in at a mic and it shows up here.
            </p>
            <Link
              to="/v3/map"
              className="mt-4 inline-flex h-12 items-center rounded-full px-6 font-bold text-white"
              style={{ background: v3colors.royal }}
            >
              Find a mic
            </Link>
          </div>
        )}

        {sets.length > 0 && isDesktop && (
          <div
            className="grid grid-cols-[1fr_180px_120px_100px] gap-4 px-4 pb-2 text-sm font-semibold"
            style={{ color: v3colors.muted }}
          >
            <span>Set</span>
            <span>Venue</span>
            <span>Date</span>
            <span>Has</span>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {sets.map((set) => (
            <Link
              key={set.id}
              to={`/v3/sets/${set.id}`}
              className={
                isDesktop
                  ? "grid grid-cols-[1fr_180px_120px_100px] items-center gap-4 rounded-3xl bg-white px-4 py-3.5 shadow-[0_4px_16px_rgba(18,26,51,0.05)]"
                  : "flex items-center gap-3.5 rounded-3xl bg-white py-3.5 pl-4 pr-3.5 shadow-[0_4px_16px_rgba(18,26,51,0.05)]"
              }
              style={{ border: `1px solid ${v3colors.borderSoft}` }}
            >
              {isDesktop ? (
                <>
                  <span className="flex min-w-0 items-center gap-3">
                    <VenueBubble seed={seedOf(set)} initials={initialsOf(seedOf(set))} size={40} ring={false} />
                    <VenueName className="truncate text-[17px]" style={{ color: v3colors.ink }}>
                      {setName(set)}
                    </VenueName>
                  </span>
                  <span className="truncate text-[15px]" style={{ color: v3colors.muted }}>
                    {set.venueName ?? "—"}
                  </span>
                  <span className="text-[15px]" style={{ color: v3colors.muted }}>
                    {setDate(set)}
                  </span>
                  <span className="flex gap-1.5">
                    {set.fileUrl && (
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{ background: "#DDEBFA", color: v3colors.royal }}
                        title="Has a recording"
                      >
                        <AudioLines className="h-4 w-4" aria-label="Has a recording" />
                      </span>
                    )}
                    {set.transcription && (
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{ background: "#DDEBFA", color: v3colors.royal }}
                        title="Has a transcript"
                      >
                        <ListOrdered className="h-4 w-4" aria-label="Has a transcript" />
                      </span>
                    )}
                  </span>
                </>
              ) : (
                <>
                  <VenueBubble seed={seedOf(set)} initials={initialsOf(seedOf(set))} size={52} ring={false} />
                  <span className="min-w-0 flex-1">
                    <VenueName className="block truncate text-[17px]" style={{ color: v3colors.ink }}>
                      {setName(set)}
                    </VenueName>
                    <span className="mt-0.5 block truncate text-[15px]" style={{ color: v3colors.muted }}>
                      {[setDate(set), set.venueName].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="flex gap-1.5">
                    {set.fileUrl && (
                      <span
                        className="flex h-[34px] w-[34px] items-center justify-center rounded-full"
                        style={{ background: "#DDEBFA", color: v3colors.royal }}
                      >
                        <AudioLines className="h-4 w-4" aria-label="Has a recording" />
                      </span>
                    )}
                    {set.transcription && (
                      <span
                        className="flex h-[34px] w-[34px] items-center justify-center rounded-full"
                        style={{ background: "#DDEBFA", color: v3colors.royal }}
                      >
                        <ListOrdered className="h-4 w-4" aria-label="Has a transcript" />
                      </span>
                    )}
                  </span>
                </>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
