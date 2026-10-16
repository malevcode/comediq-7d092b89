import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search as SearchIcon, X, Mic as MicIcon, Calendar as CalendarIcon, MapPin } from "lucide-react";
import SEO from "@/components/SEO";
import { useOpenMics } from "@/hooks/useOpenMics";
import { useAudienceShows } from "@/hooks/useAudienceShows";
import { slugify } from "@/utils/slugify";

const RECENT_SEARCHES_KEY = "comediq-recent-searches";
const RECENT_CHIPS = ["Free mics tonight", "The Stand", "Grisly Pear", "Knockouts"];

type ResultType = "all" | "mics" | "shows" | "venues";

function saveRecentSearch(query: string) {
  if (!query.trim()) return;
  try {
    const existing: string[] = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
    const next = [query, ...existing.filter((q) => q !== query)].slice(0, 6);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // Not worth failing a search over.
  }
}

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  } catch {
    return [];
  }
}

const filterChips: Array<{ key: ResultType; label: string }> = [
  { key: "all", label: "All" },
  { key: "mics", label: "Mics" },
  { key: "shows", label: "Shows" },
  { key: "venues", label: "Venues" },
];

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ResultType>("all");
  const { data: mics = [] } = useOpenMics();
  const { data: shows = [] } = useAudienceShows();

  const q = query.trim().toLowerCase();
  const searching = q.length >= 2;

  const micResults = useMemo(() => {
    if (!searching) return [];
    return mics
      .filter((m) =>
        [m.openMic, m.venueName, m.neighborhood, m.borough].filter(Boolean).some((f) =>
          String(f).toLowerCase().includes(q),
        ),
      )
      .slice(0, 20);
  }, [mics, q, searching]);

  const showResults = useMemo(() => {
    if (!searching) return [];
    return shows
      .filter((s) =>
        [s.title, s.venue_name, s.borough].filter(Boolean).some((f) => String(f).toLowerCase().includes(q)),
      )
      .slice(0, 20);
  }, [shows, q, searching]);

  const venueResults = useMemo(() => {
    if (!searching) return [];
    const byName = new Map<string, { name: string; neighborhood?: string; borough?: string }>();
    for (const m of mics) {
      if (m.venueName && m.venueName.toLowerCase().includes(q) && !byName.has(m.venueName)) {
        byName.set(m.venueName, { name: m.venueName, neighborhood: m.neighborhood, borough: m.borough });
      }
    }
    for (const s of shows) {
      if (s.venue_name && s.venue_name.toLowerCase().includes(q) && !byName.has(s.venue_name)) {
        byName.set(s.venue_name, { name: s.venue_name, borough: s.borough ?? undefined });
      }
    }
    return Array.from(byName.values()).slice(0, 20);
  }, [mics, shows, q, searching]);

  const recent = getRecentSearches();

  const showMics = filter === "all" || filter === "mics";
  const showShows = filter === "all" || filter === "shows";
  const showVenues = filter === "all" || filter === "venues";
  const noResults =
    searching &&
    (!showMics || micResults.length === 0) &&
    (!showShows || showResults.length === 0) &&
    (!showVenues || venueResults.length === 0);

  return (
    <>
      <SEO title="Search | Comediq" description="Search NYC open mics, comedy shows and venues on Comediq." />
      <div className="min-h-screen bg-transparent pb-28">
        <div className="sticky top-0 z-10 bg-comediq-blue px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <label className="flex h-[50px] flex-1 items-center gap-2.5 rounded-full bg-comediq-cream px-4 text-[#0A1128]">
              <SearchIcon className="h-[19px] w-[19px] shrink-0" />
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveRecentSearch(query);
                }}
                placeholder="Search mics, shows and venues"
                aria-label="Search mics, shows and venues"
                className="min-w-0 flex-1 bg-transparent font-sans text-base outline-none placeholder:text-[#0A1128]/50"
              />
              {query && (
                <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="flex shrink-0">
                  <X className="h-[18px] w-[18px]" />
                </button>
              )}
            </label>
            <button type="button" onClick={() => navigate(-1)} className="shrink-0 px-1 py-3 text-[15px] font-semibold text-comediq-cream">
              Cancel
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                aria-pressed={filter === chip.key}
                onClick={() => setFilter(chip.key)}
                className={`h-9 rounded-full px-3.5 text-sm font-medium transition-colors ${
                  filter === chip.key
                    ? "border border-comediq-cream bg-comediq-cream text-[#0A1128] font-semibold"
                    : "border border-comediq-cream/40 text-comediq-cream hover:bg-white/10"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pb-3">
          {!searching && (
            <div className="flex flex-col gap-2.5 px-4 pt-5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#D2DCF0]">Recent</span>
              <div className="flex flex-wrap gap-2">
                {(recent.length > 0 ? recent : RECENT_CHIPS).map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setQuery(chip)}
                    className="h-[34px] rounded-full border border-comediq-cream/40 px-3 text-[13px] font-medium text-comediq-cream hover:bg-white/10"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showMics && micResults.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between px-4 pb-2 pt-5">
                <h2 className="font-display text-xl">Mics</h2>
                <span className="text-[13px] text-[#D2DCF0]">{micResults.length} results</span>
              </div>
              {micResults.map((m) => (
                <Link
                  key={m.id}
                  to={`/mics/${slugify(m.venueName || m.openMic)}-${slugify(m.neighborhood || "")}?id=${m.id}`}
                  onClick={() => saveRecentSearch(query)}
                  className="flex items-center gap-3.5 border-t border-white/10 px-4 py-3 text-comediq-cream"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#1A3F85] text-[#E2E8F5]">
                    <MicIcon className="h-[19px] w-[19px]" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="block truncate text-[15px] font-semibold">{m.openMic}</span>
                    <span className="block truncate text-[13px] text-[#D2DCF0]">
                      {[m.venueName, `${m.day} ${m.startTime}`].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.1em] text-[#D2DCF0]">Mic</span>
                </Link>
              ))}
            </section>
          )}

          {showShows && showResults.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between px-4 pb-2 pt-5">
                <h2 className="font-display text-xl">Shows</h2>
                <span className="text-[13px] text-[#D2DCF0]">{showResults.length} results</span>
              </div>
              {showResults.map((s) => (
                <Link
                  key={s.id}
                  to="/laugh"
                  onClick={() => saveRecentSearch(query)}
                  className="flex items-center gap-3.5 border-t border-white/10 px-4 py-3 text-comediq-cream"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#1A3F85] text-[#E2E8F5]">
                    <CalendarIcon className="h-[19px] w-[19px]" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="block truncate text-[15px] font-semibold">{s.title}</span>
                    <span className="block truncate text-[13px] text-[#D2DCF0]">{s.venue_name}</span>
                  </span>
                  <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.1em] text-[#D2DCF0]">Show</span>
                </Link>
              ))}
            </section>
          )}

          {showVenues && venueResults.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between px-4 pb-2 pt-5">
                <h2 className="font-display text-xl">Venues</h2>
                <span className="text-[13px] text-[#D2DCF0]">{venueResults.length} results</span>
              </div>
              {venueResults.map((v) => (
                <Link
                  key={v.name}
                  to={`/venue/${slugify(v.name)}`}
                  onClick={() => saveRecentSearch(query)}
                  className="flex items-center gap-3.5 border-t border-white/10 px-4 py-3 text-comediq-cream"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#1A3F85] text-[#E2E8F5]">
                    <MapPin className="h-[19px] w-[19px]" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="block truncate text-[15px] font-semibold">{v.name}</span>
                    <span className="block truncate text-[13px] text-[#D2DCF0]">
                      {[v.neighborhood, v.borough].filter(Boolean).join(", ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.1em] text-[#D2DCF0]">Venue</span>
                </Link>
              ))}
            </section>
          )}

          {noResults && (
            <p className="px-4 pt-8 text-center text-sm text-[#D2DCF0]">No results for "{query}".</p>
          )}
        </div>
      </div>
    </>
  );
}
