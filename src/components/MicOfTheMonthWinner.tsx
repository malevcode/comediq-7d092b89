import { Link } from "react-router-dom";
import { Trophy, MapPin, Clock, AtSign, ChevronRight } from "lucide-react";
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

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${winner.venueName}, ${winner.address}`,
  )}`;
  const instagramUrl = `https://instagram.com/${winner.hostHandle.replace(/^@/, "")}`;

  return (
    <section className="px-4 pt-8 sm:pt-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] bg-[#1a5fb4] px-6 py-10 text-center text-white shadow-xl sm:px-10 sm:py-12">
          <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.18em] sm:text-sm">
            <Trophy className="h-4 w-4 shrink-0" aria-hidden="true" />
            Comediq's Mic of the Month
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/80 sm:text-base">
            Featured on the Comediq home page for all of {winner.month}, plus $50 to the host.
          </p>

          <h2 className="mt-6 text-4xl font-bold uppercase leading-[1.05] tracking-tight sm:text-6xl">
            {winner.micName}
          </h2>

          <div className="mt-6 flex flex-col items-center gap-2 text-sm text-white/90 sm:text-base">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              {winner.schedule} at {winner.venueName}
            </span>
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 underline underline-offset-4 transition-opacity hover:opacity-80"
            >
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              {winner.address}
            </a>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <AtSign className="h-4 w-4 shrink-0" aria-hidden="true" />
              hosted by {winner.hostHandle}
            </a>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
            <Link
              to={micInListHref}
              className="w-full rounded-full bg-white px-6 py-3 text-sm font-bold text-[#1a5fb4] transition-transform duration-300 hover:scale-105 sm:w-auto sm:px-8"
            >
              See the mic
            </Link>
            <Link
              to="/leaderboard"
              className="w-full rounded-full border-2 border-white/70 px-6 py-3 text-sm font-bold text-white transition-colors duration-300 hover:bg-white/10 sm:w-auto sm:px-8"
            >
              Vote for next month
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MicOfTheMonthWinner;
