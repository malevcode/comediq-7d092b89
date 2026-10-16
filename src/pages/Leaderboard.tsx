import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trophy, Search } from "lucide-react";
import VoteArrow from "@/components/icons/VoteArrow";
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

const titleTextClass = "text-comediq-cream";
const mutedTextClass = "text-[#D2DCF0]";
const panelClass = "text-comediq-cream";
const rowClass =
  "flex items-center gap-3.5 border-t border-white/16 py-3 text-comediq-cream transition-colors";

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
      aria-label={voted ? `Remove your vote, ${likes} votes` : `Vote, ${likes} votes`}
      className={cn(
        "flex h-[52px] w-[52px] shrink-0 flex-col items-center justify-center gap-0 rounded-xl border transition-colors disabled:opacity-50",
        voted
          ? "border-comediq-cream bg-comediq-cream text-[#0A1128]"
          : "border-white/40 bg-transparent text-comediq-cream hover:bg-white/10",
      )}
    >
      <VoteArrow filled={voted} className="h-[18px] w-[18px]" />
      <span className="text-sm font-bold tabular-nums leading-tight">{likes}</span>
    </button>
  );
}

/**
 * A vote that does not count, so people can try the gesture before spending a
 * real one. The contest has had the opposite problem all along: the control was
 * hidden, unlabelled and two pages away, so nobody learned it. This one sits
 * directly under the instructions and writes nothing anywhere.
 */
function PracticeVote() {
  const [tried, setTried] = useState(false);

  return (
    <div className="mt-3 rounded-xl bg-black/15 p-3">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] opacity-80">
        Try it, this one does not count
      </p>
      <div className="flex items-center gap-3 rounded-lg bg-white/15 p-2.5">
        <span className="w-7 shrink-0 text-center text-lg font-bold tabular-nums opacity-70">1</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">Practice Mic</span>
          <span className="block truncate text-xs opacity-80">Anywhere · Any night</span>
        </span>
        <button
          type="button"
          onClick={() => setTried((v) => !v)}
          aria-pressed={tried}
          aria-label={tried ? "Undo the practice vote" : "Try a practice vote"}
          className={cn(
            "flex h-[52px] w-[52px] shrink-0 flex-col items-center justify-center gap-0 rounded-xl border transition-colors",
            tried ? "border-comediq-cream bg-comediq-cream text-[#0A1128]" : "border-white/40 bg-transparent text-white hover:bg-white/10",
          )}
        >
          <VoteArrow filled={tried} className="h-[18px] w-[18px]" />
          <span className="text-sm font-bold tabular-nums leading-tight">{tried ? 1 : 0}</span>
        </button>
      </div>
      <p className="mt-2 text-xs opacity-90">
        {tried
          ? "That is all it is. Tap again to take it back, then vote for real below."
          : "Tap the arrow above to see how it works."}
      </p>
    </div>
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
    <li className={rowClass}>
      {rank !== undefined && (
        <span
          className={`font-display shrink-0 text-center leading-none ${
            rank <= 3 ? "w-10 text-[40px] text-comediq-accent" : `w-10 text-2xl ${mutedTextClass}`
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
        <span className={`block truncate text-[13px] ${mutedTextClass}`}>
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
          <section className={`${panelClass} p-4 md:p-6`}>
            <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.14em] text-comediq-accent">
              {month} voting &middot; Live
            </span>

            <h1 className="font-display mb-2 text-[44px] uppercase leading-[0.9] text-comediq-cream sm:text-5xl">
              {MIC_OF_THE_MONTH_LABEL}
            </h1>

            <p className="max-w-xl text-base text-[#E2E8F5]">
              One vote per mic, and you can take it back. The winner gets the Comediq
              home page for a month, plus $50 to the host.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex h-9 items-center rounded-full border border-white/16 bg-[#1A3F85] px-3.5 text-sm text-comediq-cream">
                <b className="mr-1.5">{totalVotes}</b> votes so far
              </span>
              <span className="inline-flex h-9 items-center rounded-full border border-white/16 bg-[#1A3F85] px-3.5 text-sm text-comediq-cream">
                <b className="mr-1.5">{rows.length}</b> mics ranked
              </span>
            </div>

            {/* The instruction people never had. Voting was two taps away on a
                different page, with nothing anywhere saying how it worked. */}
            <div className="mt-2">
              <PracticeVote />
            </div>

            {isLoading ? (
              <div className="mt-2 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-white/10" />
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
              <ol className="mt-1">
                {rows.map(({ rank, mic }) => (
                  <MicRow key={mic.uniqueIdentifier} mic={mic} rank={rank} shared={shared} />
                ))}
              </ol>
            )}

            {/* Every mic is votable, not just the ones already on the board. */}
            <div className="mt-6 border-t border-white/16 pt-4">
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
                  placeholder="Find a mic to vote for"
                  className="h-12 w-full rounded-full border border-white/16 bg-[#1A3F85] pl-9 pr-3 text-sm text-comediq-cream outline-none placeholder:text-[#D2DCF0] focus:border-comediq-accent"
                />
              </div>
              {searchResults.length > 0 && (
                <ul className="mt-2">
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
