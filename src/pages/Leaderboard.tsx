import { Link } from "react-router-dom";
import { Trophy, ArrowUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SEO from "@/components/SEO";
import { useMicLeaderboard } from "@/hooks/useMicLeaderboard";
import { slugify } from "@/utils/slugify";
import {
  MIC_OF_THE_MONTH_LABEL,
  isExternalVotingLink,
  votingHref,
} from "@/config/micOfTheMonth";

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
  "group flex items-center gap-3 rounded-2xl border border-[#07111f]/10 bg-white/50 p-3 text-[#07111f] shadow-[0_14px_44px_rgba(4,20,55,0.10)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-[#102a53]/50 dark:text-white dark:hover:bg-[#102a53]/70 md:p-4";

export default function Leaderboard() {
  const { rows, isLoading, error, totalVotes } = useMicLeaderboard();

  return (
    <>
      <SEO
        title="Open Mic Leaderboard | Comediq"
        description="NYC open mics ranked by comedian upvotes. See which rooms the city actually rates."
        url="https://comediq.us/leaderboard"
      />
      <PageHeader title="Leaderboard" />

      <div className="min-h-screen bg-transparent page-content-offset-flush pb-24">
        <div className="mx-auto max-w-3xl px-4">
          <section className={`${panelClass} rounded-3xl p-4 md:p-6`}>
            <div className={`mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.25em] ${mutedTextClass}`}>
              <span>upvoted mics</span>
              <span>{rows.length.toString().padStart(2, "0")} ranked</span>
            </div>

            <h1 className={`mb-1 text-3xl font-bold leading-tight tracking-tight sm:text-4xl ${titleTextClass}`}>
              Most upvoted mics
            </h1>
            <p className={`mb-4 text-sm ${mutedTextClass}`}>
              Ranked by comedian upvotes, the same arrows on every mic card.
              {totalVotes > 0 && ` ${totalVotes} upvotes counted.`}
            </p>

            <a
              href={isExternalVotingLink() ? votingHref() : undefined}
              {...(isExternalVotingLink()
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="mb-5 flex items-center gap-2 rounded-xl bg-[#1a5fb4] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a7bd5]"
            >
              <Trophy className="h-4 w-4" />
              {isExternalVotingLink()
                ? `Vote in ${MIC_OF_THE_MONTH_LABEL}`
                : `${MIC_OF_THE_MONTH_LABEL} voting opens soon`}
            </a>

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
                  The upvote counts did not come back. Try again in a moment.
                </p>
              </div>
            ) : rows.length === 0 ? (
              <div className="py-12 text-center">
                <Trophy className={`mx-auto mb-3 h-8 w-8 ${mutedTextClass}`} />
                <p className={`font-medium ${titleTextClass}`}>No upvotes yet</p>
                <p className={`mt-1 text-sm ${mutedTextClass}`}>
                  Upvote mics from the Perform tab and they show up here.
                </p>
              </div>
            ) : (
              <ol className="space-y-2">
                {rows.map(({ rank, upvotes, mic }) => (
                  <li key={mic.uniqueIdentifier}>
                    <Link
                      to={`/mics/${slugify(mic.venueName || mic.openMic)}-${slugify(mic.neighborhood || "")}?id=${mic.uniqueIdentifier}`}
                      className={rowClass}
                      style={{
                        borderLeftWidth: 4,
                        borderLeftColor: BOROUGH_COLOR[(mic.borough || "").trim()] || "#9ca3af",
                      }}
                    >
                      <span className={`w-7 shrink-0 text-center text-lg font-bold tabular-nums ${rank <= 3 ? "text-[#1a5fb4] dark:text-[#8ec5ff]" : mutedTextClass}`}>
                        {rank}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate font-semibold ${titleTextClass}`}>{mic.openMic}</span>
                        <span className={`block truncate text-xs ${mutedTextClass}`}>
                          {[mic.venueName, mic.borough, `${mic.day} ${mic.startTime}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#1a5fb4]/10 px-2.5 py-1 text-sm font-bold text-[#1a5fb4] dark:bg-white/10 dark:text-white">
                        <ArrowUp className="h-3.5 w-3.5" />
                        {upvotes}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
