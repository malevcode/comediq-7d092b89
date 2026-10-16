import { lazy, Suspense, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, Menu, Mic, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import AppWaitlistSection from "@/components/AppWaitlistSection";
import { useOpenMics } from "@/hooks/useOpenMics";
import { isExternalVotingLink, votingHref } from "@/config/micOfTheMonth";
import {
  getUpcomingOccurrences,
  isListedDate,
  parseBiweeklyAnchor,
  parseDateList,
  runsOnBiweeklyDate,
} from "@/utils/micOccurrences";
import type { OpenMic } from "@/types/openMic";
import "./landing.css";

const OpenMicsMap = lazy(() => import("@/components/map/OpenMicsMapRefactored"));

const INSTAGRAM = "https://instagram.com/comediq.us";
const MALEV_INSTAGRAM = "https://instagram.com/malevcomedy";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// Same list the Beginner Friendly page uses.
const BEGINNER_VENUES = ["laughing buddha", "luxor", "comediq", "easy lover", "westside comedy club"];

type Filter = "all" | "free" | "beginner";

function startMinutes(time: string): number {
  const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hour = Number(match[1]);
  const period = match[3]?.toLowerCase();
  if (period === "pm" && hour < 12) hour += 12;
  if (period === "am" && hour === 12) hour = 0;
  return hour * 60 + Number(match[2] ?? 0);
}

/** "4:00 PM" becomes "4 PM", "4:30 PM" stays. */
function shortTime(time: string): string {
  const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return time;
  const minutes = match[2] && match[2] !== "00" ? `:${match[2]}` : "";
  return `${match[1]}${minutes}${match[3] ? ` ${match[3].toUpperCase()}` : ""}`;
}

function isFree(mic: OpenMic): boolean {
  const cost = mic.cost.toLowerCase();
  return cost.includes("free") || cost === "$0";
}

function isBeginnerFriendly(mic: OpenMic): boolean {
  const venue = mic.venueName.toLowerCase();
  const name = mic.openMic.toLowerCase();
  return BEGINNER_VENUES.some((v) => venue.includes(v) || name.includes(v));
}

/** Does this mic actually run on this calendar day (not just this weekday)? */
function runsOn(mic: OpenMic, date: Date): boolean {
  if (mic.day !== DAYS[date.getDay()]) return false;
  const frequency = mic.frequency || "weekly";
  if (frequency === "bi_weekly") {
    const anchor = parseBiweeklyAnchor(mic.frequencyCustomText);
    return anchor ? runsOnBiweeklyDate(anchor, date) : true;
  }
  if (frequency === "one_off" || frequency === "custom") {
    const listed = parseDateList(mic.frequencyCustomText);
    return listed.length > 0 ? isListedDate(listed, date) : true;
  }
  const [next] = getUpcomingOccurrences(mic.day, frequency, 1, date);
  return next ? next.toDateString() === date.toDateString() : true;
}

function verifiedLabel(mic: OpenMic): string {
  const iso = mic.lastVerifiedAt || mic.lastConfirmedAt;
  let date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) {
    const match = mic.lastVerified?.match(/^(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?$/);
    if (!match) return "";
    const year = match[3] ? (match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3])) : new Date().getFullYear();
    date = new Date(year, Number(match[1]) - 1, Number(match[2]));
  }
  if (Number.isNaN(date.getTime())) return "";
  return `Verified ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function detailLine(mic: OpenMic): string {
  const where = [mic.venueName, mic.neighborhood].filter(Boolean).join(", ");
  const stage = /^\d+$/.test(mic.stageTime.trim()) ? `${mic.stageTime.trim()} min` : mic.stageTime;
  return [where, mic.cost, stage].filter(Boolean).join(" · ");
}

function micHref(mic: OpenMic): string {
  return mic.slug ? `/mic/${mic.slug}` : "/open-mics";
}

const Logo = () => (
  <Link to="/" className="flex items-center gap-2" aria-label="Comediq home">
    <img src="/landing/logo-mark.png" alt="" className="h-7 w-auto" />
    <span className="lp-wordmark text-2xl">Comediq</span>
  </Link>
);

const Nav = () => {
  const [open, setOpen] = useState(false);
  const vote = votingHref();
  const voteClass = "hover:text-[var(--lp-accent)]";
  const items = [
    <Link key="perform" to="/perform" className={voteClass}>Perform</Link>,
    <Link key="laugh" to="/laugh" className={voteClass}>Laugh</Link>,
    isExternalVotingLink() ? (
      <a key="motm" href={vote} target="_blank" rel="noopener noreferrer" className={voteClass}>Mic of the Month</a>
    ) : (
      <Link key="motm" to={vote} className={voteClass}>Mic of the Month</Link>
    ),
    <a key="hosts" href="#for-hosts" className={voteClass}>For hosts</a>,
  ];

  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
      <Logo />
      <nav className="hidden items-center gap-7 text-sm font-medium md:flex" aria-label="Main">
        {items}
        <Link to="/auth/sign-in" className="lp-btn lp-btn-ghost !px-4 !py-1.5 !text-sm">Log in</Link>
      </nav>
      <button
        type="button"
        className="md:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      {open && (
        <nav
          className="absolute inset-x-0 top-[68px] z-30 flex flex-col gap-4 border-y border-[var(--lp-line)] bg-[var(--lp-bg-deep)] px-5 py-5 text-lg font-medium md:hidden"
          aria-label="Mobile"
          onClick={() => setOpen(false)}
        >
          {items}
          <Link to="/auth/sign-in" className="lp-btn lp-btn-ghost self-start">Log in</Link>
        </nav>
      )}
    </header>
  );
};

const Hero = () => (
  <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-4 sm:px-8 md:grid-cols-2 md:gap-14 md:pb-20">
    <div>
      <p className="lp-eyebrow">NYC's comedy platform</p>
      <h1 className="lp-wordmark mt-4 text-[4.5rem] sm:text-[6.5rem]">Comediq</h1>
      <p className="mt-5 max-w-md text-lg leading-snug text-[var(--lp-ink)]">
        Whether you're on stage or in the audience, Comediq is your home for live comedy.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link to="/perform" className="lp-btn lp-btn-solid"><Mic className="h-4 w-4" aria-hidden="true" />I Perform</Link>
        <Link to="/laugh" className="lp-btn lp-btn-ghost"><Eye className="h-4 w-4" aria-hidden="true" />I Watch</Link>
      </div>
      <div className="mt-7 flex flex-col gap-2 text-sm">
        <a className="lp-link w-fit" href={MALEV_INSTAGRAM} target="_blank" rel="noopener noreferrer">
          Made and maintained by Adam Malev @malevcomedy
        </a>
        <a className="lp-link w-fit" href={INSTAGRAM} target="_blank" rel="noopener noreferrer">
          Questions or new mics? DM @comediq.us
        </a>
      </div>
    </div>
    <div className="aspect-[4/4.4] overflow-hidden rounded-md md:order-last">
      <img src="/landing/hero.jpg" alt="A comedy crowd facing an empty stage and microphone" className="lp-photo" />
    </div>
  </section>
);

const Stats = () => (
  <section className="border-y border-[var(--lp-line)]">
    <div className="mx-auto grid max-w-6xl gap-0 px-5 sm:px-8 md:grid-cols-3 md:gap-8">
      {[
        ["1,250+", "comedians visit weekly"],
        ["500+", "open mics tracked"],
        ["4 scenes", "NYC, Hudson Valley, LA and Austin"],
      ].map(([big, small]) => (
        <div key={big} className="flex flex-col gap-1 border-b border-[var(--lp-line)] py-6 last:border-b-0 md:flex-row md:items-baseline md:gap-3 md:border-b-0 md:py-9">
          <span className="lp-display text-4xl">{big}</span>
          <span className="text-sm text-[var(--lp-muted)]">{small}</span>
        </div>
      ))}
    </div>
  </section>
);

const Tonight = () => {
  const navigate = useNavigate();
  const { data: mics = [] } = useOpenMics();
  const [filter, setFilter] = useState<Filter>("all");

  const today = useMemo(() => new Date(), []);
  const dayName = DAYS[today.getDay()];

  const todays = useMemo(
    () =>
      mics
        .filter((mic) => mic.city === "New York" && runsOn(mic, today))
        .sort((a, b) => startMinutes(a.startTime) - startMinutes(b.startTime)),
    [mics, today],
  );

  const filtered = useMemo(() => {
    const matching = todays.filter((mic) => (filter === "free" ? isFree(mic) : filter === "beginner" ? isBeginnerFriendly(mic) : true));
    const nowMinutes = today.getHours() * 60 + today.getMinutes();
    const upcoming = matching.filter((mic) => startMinutes(mic.startTime) >= nowMinutes - 30);
    return upcoming.length > 0 ? upcoming : matching;
  }, [todays, filter, today]);

  const freeCount = todays.filter(isFree).length;
  const chips: Array<[Filter, string]> = [["all", "All"], ["free", "Free"], ["beginner", "Beginner friendly"]];

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20" aria-labelledby="tonight-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="tonight-heading" className="lp-display text-5xl sm:text-6xl">What's on tonight</h2>
          <p className="mt-2 text-sm text-[var(--lp-ink)]">
            {todays.length} open mics on {dayName}s. {freeCount} of them are free.
          </p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Filter tonight's mics">
          {chips.map(([key, label]) => (
            <button key={key} type="button" className="lp-chip" aria-pressed={filter === key} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
        <div className="relative h-72 overflow-hidden rounded-md bg-[var(--lp-bg-deep)] md:h-auto md:min-h-[26rem]">
          <Suspense fallback={null}>
            {filtered.length > 0 && (
              <OpenMicsMap
                mics={filtered}
                variant="boxed"
                onMicSelect={(mic: OpenMic) => navigate(micHref(mic))}
              />
            )}
          </Suspense>
        </div>
        <div>
          {filtered.length === 0 ? (
            <p className="border-t border-[var(--lp-line)] py-6 text-[var(--lp-muted)]">
              No mics match yet. Try All, or see the full list.
            </p>
          ) : (
            filtered.slice(0, 4).map((mic) => (
              <Link key={mic.uniqueIdentifier || mic.id} to={micHref(mic)} className="lp-row">
                <span className="lp-display text-2xl">{shortTime(mic.startTime)}</span>
                <span>
                  <span className="block font-semibold">{mic.openMic}</span>
                  <span className="mt-0.5 block text-sm text-[var(--lp-muted)]">{detailLine(mic)}</span>
                </span>
                <span className="lp-row-verified text-xs font-semibold uppercase tracking-wide text-[var(--lp-accent)]">
                  {verifiedLabel(mic)}
                </span>
              </Link>
            ))
          )}
          <div className="border-t border-[var(--lp-line)] pt-5">
            <Link to={`/open-mics/${dayName.toLowerCase()}`} className="lp-link text-sm font-semibold">
              See all {todays.length} {dayName} mics
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

const TwoDoors = () => (
  <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-14 sm:px-8 md:grid-cols-2 md:pb-20">
    {[
      {
        img: "/landing/watch.jpg",
        alt: "An audience laughing at a candlelit comedy show",
        title: "Here to watch",
        body: "Browse upcoming shows across NYC, keep a list of the comedians you've seen live, and rate shows like Letterboxd for comedy.",
        cta: "Browse shows",
        to: "/shows",
      },
      {
        img: "/landing/perform.jpg",
        alt: "A comedian performing on stage",
        title: "Here to get up",
        body: "Find a mic by day, borough or price, sign up, and track your sets. Listings are verified by hosts and confirmed by comics.",
        cta: "Find a mic",
        to: "/open-mics",
      },
    ].map((door) => (
      <div key={door.title}>
        <div className="aspect-[1.45/1] overflow-hidden rounded-md">
          <img src={door.img} alt={door.alt} className="lp-photo" loading="lazy" />
        </div>
        <h2 className="lp-display mt-5 text-4xl">{door.title}</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed">{door.body}</p>
        <Link to={door.to} className="lp-link mt-4 inline-block text-sm font-semibold">{door.cta}</Link>
      </div>
    ))}
  </section>
);

const PROOF_ROWS: Array<Array<[string, number, string]>> = [
  [
    ["proof-1", 1.55, "Friends laughing on a couch at a show"],
    ["proof-2", 1, "A comedian mid-set in front of neon letters"],
    ["proof-3", 1, "A comedian on stage with a drink in the foreground"],
  ],
  [
    ["proof-4", 1, "A comedian with a microphone in front of poster art"],
    ["proof-5", 1, "An audience member watching the stage"],
    ["proof-6", 1.55, "A packed, dimly lit comedy room"],
  ],
];

const Proof = () => (
  <section className="mx-auto max-w-6xl px-5 pb-14 sm:px-8 md:pb-20" aria-labelledby="proof-heading">
    <div className="flex items-end justify-between gap-4">
      <h2 id="proof-heading" className="lp-display text-5xl sm:text-6xl">Proof of laughs</h2>
      <p className="text-xs text-[var(--lp-muted)]">Photos from Malev and Friends</p>
    </div>
    <div className="mt-6 flex flex-col gap-3">
      {PROOF_ROWS.map((row, i) => (
        <div key={i} className="flex h-28 gap-3 sm:h-44 md:h-60">
          {row.map(([name, grow, alt]) => (
            <div key={name} className="min-w-0 overflow-hidden rounded-md" style={{ flex: `${grow} 1 0%` }}>
              <img src={`/landing/${name}.jpg`} alt={alt} className="lp-photo" loading="lazy" />
            </div>
          ))}
        </div>
      ))}
    </div>
  </section>
);

const Hosts = () => (
  <section id="for-hosts" className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 sm:px-8 md:grid-cols-[1.1fr_1fr] md:pb-20">
    <div className="aspect-[1.5/1] overflow-hidden rounded-md">
      <img src="/landing/hosts.jpg" alt="Inside a comedy room before a show" className="lp-photo" loading="lazy" />
    </div>
    <div>
      <p className="lp-eyebrow">For hosts</p>
      <h2 className="lp-display mt-3 text-5xl">Run a mic? Get it listed right.</h2>
      <p className="mt-4 max-w-sm text-sm leading-relaxed">
        New mic, new time, new cover? Message us and we'll update the listing, so comics stop asking you.
      </p>
      <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-ghost mt-5">
        DM @comediq.us
      </a>
    </div>
  </section>
);

const Waitlist = () => {
  const [open, setOpen] = useState(false);
  return (
    <section className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-5 pb-0 sm:px-8 md:flex-row md:items-end">
      <div className="pb-14 md:pb-20">
        <h2 className="lp-display max-w-2xl text-5xl sm:text-7xl">Be first in line when the app drops.</h2>
        <button type="button" className="lp-btn lp-btn-solid mt-7" onClick={() => setOpen(true)}>
          Join the app waitlist <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <img src="/landing/character.png" alt="" className="mx-auto h-72 w-auto self-end md:mx-0 md:h-96" loading="lazy" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto p-0">
          <DialogTitle className="sr-only">Join the app waitlist</DialogTitle>
          <AppWaitlistSection />
        </DialogContent>
      </Dialog>
    </section>
  );
};

const Footer = () => (
  <footer className="border-t border-[var(--lp-line)]">
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Logo />
        <p className="text-sm text-[var(--lp-muted)]">
          By comedians, for comedians. Started as a Google Sheet tracking all of NYC's open mics.
        </p>
      </div>
      <nav className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Footer">
        <Link to="/open-mics" className="hover:text-[var(--lp-accent)]">All open mics</Link>
        <Link to="/shows" className="hover:text-[var(--lp-accent)]">Shows</Link>
        <Link to="/privacy" className="hover:text-[var(--lp-accent)]">Privacy &amp; Terms</Link>
        <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--lp-accent)]">@comediq.us</a>
      </nav>
    </div>
  </footer>
);

const Landing = () => (
  <div className="lp relative overflow-x-hidden">
    <Nav />
    <main>
      <Hero />
      <Stats />
      <Tonight />
      <TwoDoors />
      <Proof />
      <Hosts />
      <Waitlist />
    </main>
    <Footer />
  </div>
);

export default Landing;
