import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trophy, ChevronUp, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SEO from "@/components/SEO";
import { useMicLeaderboard } from "@/hooks/useMicLeaderboard";
import { useOpenMics } from "@/hooks/useOpenMics";
import {
  useMicRatings,
  useSharedMicRatingData,
  type SharedMicRatingData,
} from "@/hooks/useMicRatings";
import { useAuth } from "@/contexts/AuthContext";
import { slugify } from "@/utils/slugify";
import { MIC_OF_THE_MONTH_LABEL, currentVotingMonth } from "@/config/micOfTheMonth";
import { cn } from "@/lib/utils";
import type { OpenMic } from "@/types/openMic";

// Card left-border colours, matching getBoroughOutline in OpenMicsDetailedList
// so a mic reads the same colour here as it does on the Perform tab.
const BOROUGH_COLOR: Record<string, string> = {
  Manhattan: "#1a5fb4",
  Brooklyn: "#92400e",
  Queens: "#9333ea",
  Bronx: "#ea580c",
  "Staten Island": "#6b7280",
};

const titleTextClass = "text-[#07111f] dark:text-white";
const mutedTextClass = "text-[#07111f]/60 dark:text-white/60";
const panelClass =
  "border border-[#07111f]/10 bg-white/50 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#102a53]/60 dark:text-white dark:shadow-[0_18px_60px_rgba(4,20,55,0.24)]";
const rowClass =
  "flex items-center gap-3 rounded-2xl border border-[#07111f]/10 bg-white/50 p-3 text-[#07111f] shadow-[0_14px_44px_rgba(4,20,55,0.10)] backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-[#102a53]/50 dark:text-white md:p-4";

/**
 * The vote control, and the whole point of this page.
 *
 * Voting used to be impossible here: the arrow was a decorative span inside a
 * link, and the page's call to action sent people to the Perform tab to hunt
 * for a 24px grey chevron inside an expanded mic row. That is why so few votes
 * came in. This is a real button, at the 44px minimum tap target, sitting next
 * to the number it changes.
 */
function VoteButton({
  mic,
  shared,
}: {
  mic: OpenMic;
  shared: SharedMicRatingData;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userRating, ratingCounts, rateMic, removeRating, isRating } = useMicRatings(
    mic.uniqueIdentifier,
    shared,
  );

  const voted = userRating === "like";
  const likes = ratingCounts.likes || 0;

  const handleClick = () => {
    if (!user) {
      // Come back here afterwards, so signing in finishes the vote they started
      // instead of dropping them on the mic list.
      navigate(`/auth?next=${encodeURIComponent("/leaderboard")}`);
      return;
    }
    if (voted) removeRating(mic.uniqueIdentifier);
    else rateMic({ micUniqueIdentifier: mic.uniqueIdentifier, rating: "like" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isRating}
      aria-pressed={voted}
      aria-label={voted ? `Remove your vote for ${mic.openMic}` : `Vote for ${mic.openMic}`}
      className={cn(
        "flex min-h-[44px] min-w-[44px] shrink-0 flex-col items-center justify-center rounded-xl px-2 py-1 transition-colors disabled:opacity-50",
        voted
          ? "bg-[#1a5fb4] text-white"
          : "bg-[#1a5fb4]/10 text-[#1a5fb4] hover:bg-[#1a5fb4]/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20",
      )}
    >
      <ChevronUp className={cn("h-4 w-4", voted && "fill-current")} strokeWidth={2.5} />
      <span className="text-xs font-bold tabular-nums">{likes}</span>
    </button>
  );
}

function MicRow({
  mic,
  rank,
  shared,
}: {
  mic: OpenMic;
  rank?: number;
  shared: SharedMicRatingData;
}) {
  return (
    <li
      className={rowClass}
      style={{
        borderLeftWidth: 4,
        borderLeftColor: BOROUGH_COLOR[(mic.borough || "").trim()] || "#9ca3af",
      }}
    >
      {rank !== undefined && (
        <span
          className={`w-7 shrink-0 text-center text-lg font-bold tabular-nums ${
            rank <= 3 ? "text-[#1a5fb4] dark:text-[#8ec5ff]" : mutedTextClass
          }`}
        >
          {rank}
        </span>
      )}
      <Link
        to={`/mics/${slugify(mic.venueName || mic.openMic)}-${slugify(mic.neighborhood || "")}?id=${mic.uniqueIdentifier}`}
        className="min-w-0 flex-1"
      >
        <span className={`block truncate font-semibold ${titleTextClass}`}>{mic.openMic}</span>
        <span className={`block truncate text-xs ${mutedTextClass}`}>
          {[mic.venueName, mic.borough, `${mic.day} ${mic.startTime}`].filter(Boolean).join(" · ")}
        </span>
      </Link>
      <VoteButton mic={mic} shared={shared} />
    </li>
  );
}

export default function Leaderboard() {
  const { rows, isLoading, error, totalVotes } = useMicLeaderboard();
  const { data: allMics } = useOpenMics();
  const shared = useSharedMicRatingData();
  const [query, setQuery] = useState("");

  const month = currentVotingMonth();

  // Anything not on the board yet is still votable: type a name and the first
  // vote for a mic can be cast from here.
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const ranked = new Set(rows.map((r) => r.mic.uniqueIdentifier));
    return (allMics ?? [])
      .filter(
        (m) =>
          !ranked.has(m.uniqueIdentifier) &&
          [m.openMic, m.venueName, m.neighborhood, m.borough]
            .filter(Boolean)
            .some((f) => String(f).toLowerCase().includes(q)),
      )
      .slice(0, 10);
  }, [query, allMics, rows]);

  return (
    <>
      <SEO
        title={`${month} Mic of the Month Voting | Comediq`}
        description="Vote for NYC's Mic of the Month. Rankings update live as comedians vote."
      />
      <PageHeader title="Mic of the Month" />

      <div className="min-h-screen bg-transparent page-content-offset-flush pb-24">
        <div className="mx-auto max-w-3xl px-4">
          <section className={`${panelClass} rounded-3xl p-4 md:p-6`}>
            <div
              className={`mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.25em] ${mutedTextClass}`}
            >
              <span>{month} voting</span>
              <span>{rows.length.toString().padStart(2, "0")} ranked</span>
            </div>

            <h1
              className={`mb-1 text-3xl font-bold leading-tight tracking-tight sm:text-4xl ${titleTextClass}`}
            >
              {month} {MIC_OF_THE_MONTH_LABEL}
            </h1>

            {/* The instruction people never had. Voting was two taps away on a
                different page, with nothing anywhere saying how it worked. */}
            <div className="mb-5 rounded-xl bg-contest-live px-4 py-3 text-sm text-contest-live-foreground">
              <p className="flex items-center gap-2 font-bold">
                <Trophy className="h-4 w-4 shrink-0" />
                Tap the arrow to vote
              </p>
              <p className="mt-1 opacity-90">
                One vote per mic, and you can take it back. The winner gets the Comediq
                home page for a month, plus $50 to the host.
                {totalVotes > 0 && ` ${totalVotes} votes so far.`}
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/40 dark:bg-white/5" />
                ))}
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <Trophy className={`mx-auto mb-3 h-8 w-8 ${mutedTextClass}`} />
                <p className={`font-medium ${titleTextClass}`}>Could not load the rankings</p>
                <p className={`mt-1 text-sm ${mutedTextClass}`}>
                  The vote counts did not come back. Try again in a moment.
                </p>
              </div>
            ) : rows.length === 0 ? (
              <div className="py-10 text-center">
                <Trophy className={`mx-auto mb-3 h-8 w-8 ${mutedTextClass}`} />
                <p className={`font-medium ${titleTextClass}`}>No votes yet this month</p>
                <p className={`mt-1 text-sm ${mutedTextClass}`}>
                  Search for a mic below and cast the first one.
                </p>
              </div>
            ) : (
              <ol className="space-y-2">
                {rows.map(({ rank, mic }) => (
                  <MicRow key={mic.uniqueIdentifier} mic={mic} rank={rank} shared={shared} />
                ))}
              </ol>
            )}

            {/* Every mic is votable, not just the ones already on the board. */}
            <div className="mt-6 border-t border-[#07111f]/10 pt-4 dark:border-white/10">
              <label htmlFor="mic-vote-search" className={`mb-2 block text-sm font-semibold ${titleTextClass}`}>
                Don't see your mic?
              </label>
              <div className="relative">
                <Search
                  className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedTextClass}`}
                />
                <input
                  id="mic-vote-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by mic, venue or neighborhood"
                  className="h-11 w-full rounded-xl border border-[#07111f]/10 bg-white/60 pl-9 pr-3 text-sm text-[#07111f] outline-none focus:border-[#1a5fb4] dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-white/40"
                />
              </div>
              {searchResults.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {searchResults.map((mic) => (
                    <MicRow key={mic.uniqueIdentifier} mic={mic} shared={shared} />
                  ))}
                </ul>
              )}
              {query.trim().length >= 2 && searchResults.length === 0 && (
                <p className={`mt-3 text-sm ${mutedTextClass}`}>No mics match that.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
