import { Link } from "react-router-dom";
import { Trophy, ChevronRight } from "lucide-react";
import { MIC_OF_THE_MONTH_WINNER } from "@/config/micOfTheMonthWinner";

/**
 * The Mic of the Month winner's section on the home page.
 *
 * The prize for winning the contest is a month on the front page plus $50 to
 * the host, so this section is what the winner actually won. Everything it
 * shows comes from MIC_OF_THE_MONTH_WINNER; when that is null there is no
 * winner to show and the section renders nothing.
 *
 * Two sizes. The full card is for the signed-out landing page, where being big
 * is the point: it is the prize the host won. The compact line is for the
 * signed-in dashboard, where a full-height card sat between someone and the
 * Perform tab and made finding a mic harder, which is the opposite of what the
 * dashboard is for.
 */
const MicOfTheMonthWinner = ({ variant = "full" }: { variant?: "full" | "compact" }) => {
  const winner = MIC_OF_THE_MONTH_WINNER;
  if (!winner) return null;

  // Opens the mic already expanded in the list, rather than on its own page,
  // because the list is where someone browsing for tonight actually is.
  const micInListHref = `/open-mics?mic=${encodeURIComponent(winner.micUniqueIdentifier)}`;

  if (variant === "compact") {
    return (
      <Link
        to={micInListHref}
        className="mb-4 flex items-center gap-2 rounded-xl bg-[#1a5fb4] px-3 py-2 text-sm text-white transition-opacity hover:opacity-90"
      >
        <Trophy className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="shrink-0 font-semibold">Mic of the Month</span>
        <span className="truncate text-white/90">{winner.micName}</span>
        <ChevronRight className="ml-auto h-4 w-4 shrink-0" aria-hidden="true" />
      </Link>
    );
  }

  // Three lines, not a screen. This was a 512px card on the landing page, which
  // is a whole phone viewport spent telling someone about one mic before they
  // can reach anything they came for. The winner still gets the front page, it
  // just does not get all of it.
  return (
    <section className="px-4 pt-6">
      <div className="mx-auto max-w-6xl">
        <Link
          to={micInListHref}
          className="flex items-center gap-3 rounded-2xl bg-[#1a5fb4] px-4 py-3 text-white transition-opacity hover:opacity-90"
        >
          <Trophy className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
              {winner.month} Mic of the Month
            </span>
            <span className="block truncate text-lg font-bold leading-tight">
              {winner.micName}
            </span>
            <span className="block truncate text-xs text-white/85">
              {winner.schedule} at {winner.venueName} · {winner.hostHandle}
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
};

export default MicOfTheMonthWinner;
