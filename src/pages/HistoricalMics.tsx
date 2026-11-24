import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { List, Map as MapIcon, Search } from "lucide-react";

import SEO from "@/components/SEO";
import HistoricalVenueMap from "@/components/venue/HistoricalVenueMap";
import VenueDealForm from "@/components/venue/VenueDealForm";
import { useAuth } from "@/contexts/AuthContext";
import {
  approvedDealsQueryKey,
  fetchOpenToNew,
  fetchVenueHistory,
  fetchVisibleDeals,
  openToNewQueryKey,
  venueHistoryQueryKey,
  type VenueHistoryRow,
} from "@/api/venueHistory";
import { v3colors, V3_DISPLAY_STYLE } from "@/theme/v3";
import {
  EMPTY_VENUE_FILTERS,
  filterVenues,
  formatDoorPrice,
  formatMonthYear,
  isApproximateDate,
  judgeMinimum,
  judgeSplit,
  lastMicLabel,
  latestDealFor,
  listedForLabel,
  openToNewVerdict,
  sortVenues,
  ACTIVITY_ORDER,
  ACTIVITY_STYLE,
  venueActivity,
  type Judgement,
  type VenueFilters,
  type VenueSort,
} from "@/utils/venueHistory";

/**
 * Historical mics: every venue Comediq has ever tracked.
 *
 * List by default with a map a tap away, the same shape as /open-mics, and the
 * same remembered-choice behaviour.
 *
 * Dates are never invented. Anything we do not hold reads "Unknown", and
 * anything from before the March 2026 import is marked approximate, because
 * the date on those rows is when the spreadsheet was imported rather than when
 * the mic began.
 */

const VIEW_MODE_KEY = "comediq.historicalMics.viewMode";

function readSavedViewMode(): "list" | "map" {
  try {
    return localStorage.getItem(VIEW_MODE_KEY) === "map" ? "map" : "list";
  } catch {
    return "list";
  }
}

function saveViewMode(mode: "list" | "map") {
  try {
    localStorage.setItem(VIEW_MODE_KEY, mode);
  } catch {
    // Private mode throws. Remembering a preference must never break the page.
  }
}

/** Blue and white only, so a judgement is words first and never colour alone. */
const JUDGEMENT_TONE: Record<Judgement, { bg: string; fg: string }> = {
  Great: { bg: v3colors.royal, fg: v3colors.white },
  Fair: { bg: v3colors.surfaceBlue, fg: v3colors.royal },
  None: { bg: v3colors.surfaceSunken, fg: v3colors.muted },
  "Below standard": { bg: v3colors.white, fg: v3colors.royal },
  High: { bg: v3colors.white, fg: v3colors.royal },
};

function Chip({
  children,
  tone = "plain",
}: {
  children: React.ReactNode;
  tone?: "plain" | "blue" | "solid" | "muted";
}) {
  const tones = {
    plain: { background: v3colors.white, color: v3colors.ink, border: `1px solid ${v3colors.border}` },
    blue: { background: v3colors.surfaceBlue, color: v3colors.royal, border: "1px solid transparent" },
    solid: { background: v3colors.royal, color: v3colors.white, border: "1px solid transparent" },
    muted: { background: v3colors.surfaceSunken, color: v3colors.muted, border: "1px solid transparent" },
  } as const;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={tones[tone]}
    >
      {children}
    </span>
  );
}

function JudgementChip({ verdict, text }: { verdict: Judgement; text: string }) {
  const tone = JUDGEMENT_TONE[verdict];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
      style={{ background: tone.bg, color: tone.fg, border: `1px solid ${v3colors.border}` }}
    >
      <span>{text}</span>
      <span className="font-bold">{verdict}</span>
    </span>
  );
}

function VenueCard({
  row,
  openToNew,
  deal,
  canSeeDeals,
  isOpen,
  onToggleForm,
}: {
  row: VenueHistoryRow;
  openToNew: ReturnType<typeof openToNewVerdict>;
  deal: ReturnType<typeof latestDealFor>;
  canSeeDeals: boolean;
  isOpen: boolean;
  onToggleForm: () => void;
}) {
  const where = [row.neighborhood, row.borough].filter(Boolean).join(", ");
  const lastMic = lastMicLabel(row);
  const split = deal ? judgeSplit(deal) : null;
  const minimum = deal ? judgeMinimum(deal) : null;
  const door = deal ? formatDoorPrice(deal) : null;
  const listed = listedForLabel(row);
  const approximate = isApproximateDate(row.first_listed_at);

  return (
    <article
      className="rounded-2xl bg-white p-4"
      style={{ border: `1px solid ${v3colors.border}` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-lg" style={{ ...V3_DISPLAY_STYLE, color: v3colors.ink }}>
            {row.name}
          </h2>
          {where && (
            <p className="mt-0.5 text-sm" style={{ color: v3colors.muted }}>
              {where}
            </p>
          )}
        </div>
        <Chip tone={row.currently_running ? "solid" : "muted"}>
          {row.currently_running ? "Running now" : "No current mic"}
        </Chip>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip>
          Open mics run: {row.total_open_mics}
        </Chip>
        <Chip>Shows: {row.total_shows}</Chip>
        <Chip>
          Listed on Comediq: {listed}
          {approximate ? " (approx)" : ""}
        </Chip>
        {openToNew && (
          <Chip tone={openToNew.label === "Likely" ? "blue" : "plain"}>
            Open to a new mic: {openToNew.label}
            {openToNew.estimated ? " (estimated)" : ""}
          </Chip>
        )}
      </div>

      {lastMic && (
        <p className="mt-3 text-sm" style={{ color: v3colors.bodyInk }}>
          <span className="font-semibold">Last mic:</span> {lastMic}
          {row.last_mic_ended_reason ? `. ${row.last_mic_ended_reason}` : ""}
        </p>
      )}

      {canSeeDeals && (
        <div className="mt-3">
          {deal ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {door && <Chip>{door}</Chip>}
              {split && <JudgementChip verdict={split.verdict} text={split.text} />}
              {minimum && <JudgementChip verdict={minimum.verdict} text={minimum.text} />}
              <span className="text-xs" style={{ color: v3colors.mutedSoft }}>
                reported {formatMonthYear(deal.reported_at) ?? "recently"}
              </span>
            </div>
          ) : (
            <p className="text-sm" style={{ color: v3colors.muted }}>
              No deal info yet.
            </p>
          )}

          {isOpen ? (
            <div className="mt-3">
              <VenueDealForm venueSlug={row.slug} venueName={row.name} onDone={onToggleForm} />
            </div>
          ) : (
            <button
              type="button"
              onClick={onToggleForm}
              className="mt-2 text-sm font-semibold underline underline-offset-2"
              style={{ color: v3colors.royal }}
            >
              Add deal info
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export default function HistoricalMics() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"list" | "map">(() => readSavedViewMode());
  const [filters, setFilters] = useState<VenueFilters>(EMPTY_VENUE_FILTERS);
  const [sort, setSort] = useState<VenueSort>("most-mics");
  const [formSlug, setFormSlug] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: venueHistoryQueryKey,
    queryFn: fetchVenueHistory,
    staleTime: 5 * 60 * 1000,
  });

  const { data: openToNewMap = {} } = useQuery({
    queryKey: openToNewQueryKey,
    queryFn: fetchOpenToNew,
    staleTime: 5 * 60 * 1000,
  });

  // Deal terms are for signed-in users only.
  const { data: deals = [] } = useQuery({
    queryKey: approvedDealsQueryKey,
    queryFn: fetchVisibleDeals,
    enabled: Boolean(user),
    staleTime: 60 * 1000,
  });

  const dealSlugs = useMemo(
    () => new Set(deals.filter((deal) => deal.status === "approved").map((deal) => deal.venue_slug)),
    [deals],
  );

  const boroughs = useMemo(
    () =>
      [...new Set(rows.map((row) => row.borough).filter((b): b is string => Boolean(b)))].sort(),
    [rows],
  );

  const visible = useMemo(
    () =>
      sortVenues(filterVenues(rows, filters, { openToNew: openToNewMap, dealSlugs }), sort),
    [rows, filters, openToNewMap, dealSlugs, sort],
  );

  const listOnly = visible.filter((row) => row.latitude === null).length;

  const toggleView = () =>
    setViewMode((mode) => {
      const next = mode === "list" ? "map" : "list";
      saveViewMode(next);
      return next;
    });

  const set = <K extends keyof VenueFilters>(key: K, value: VenueFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const fieldStyle = {
    background: v3colors.white,
    border: `1.5px solid ${v3colors.border}`,
    color: v3colors.ink,
  } as const;

  return (
    <div className="min-h-screen font-dmsans" style={{ background: v3colors.cream }}>
      <SEO
        title="Historical mics: every venue Comediq has tracked | Comediq"
        description="Every venue that has ever run a comedy open mic or show on Comediq, how long it ran, and whether it might take a new mic."
      />

      <div className="mx-auto max-w-5xl px-5 pb-20 pt-8">
        <h1 style={{ ...V3_DISPLAY_STYLE, fontSize: 34, color: v3colors.ink }}>Historical mics</h1>
        <p className="mt-2 max-w-2xl text-base" style={{ color: v3colors.muted }}>
          Every venue we have ever tracked that has run an open mic or a show. {rows.length} venues
          in total.
        </p>
        <p className="mt-1 max-w-2xl text-sm" style={{ color: v3colors.mutedSoft }}>
          Listing dates before March 2026 come from our original sheet and are approximate.
        </p>

        {/* Filters */}
        <div className="mt-5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-3 h-4 w-4"
                style={{ color: v3colors.muted }}
                aria-hidden="true"
              />
              <input
                type="search"
                value={filters.search}
                onChange={(event) => set("search", event.target.value)}
                placeholder="Search by venue name"
                aria-label="Search venues"
                className="h-11 w-full rounded-xl pl-9 pr-3 text-sm outline-none"
                style={fieldStyle}
              />
            </div>

            <select
              value={filters.borough}
              onChange={(event) => set("borough", event.target.value)}
              aria-label="Borough"
              className="h-11 rounded-xl px-3 text-sm outline-none"
              style={fieldStyle}
            >
              <option value="">All boroughs</option>
              {boroughs.map((borough) => (
                <option key={borough} value={borough}>
                  {borough}
                </option>
              ))}
            </select>

            <select
              value={filters.running}
              onChange={(event) => set("running", event.target.value as VenueFilters["running"])}
              aria-label="Running now or not"
              className="h-11 rounded-xl px-3 text-sm outline-none"
              style={fieldStyle}
            >
              <option value="all">Running now and past</option>
              <option value="running">Running now</option>
              <option value="not-running">Not running</option>
            </select>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as VenueSort)}
              aria-label="Sort"
              className="h-11 rounded-xl px-3 text-sm outline-none"
              style={fieldStyle}
            >
              <option value="most-mics">Most mics run</option>
              <option value="longest-listed">Longest listed</option>
              <option value="recently-ended">Most recently ended</option>
            </select>

            <button
              type="button"
              onClick={toggleView}
              aria-pressed={viewMode === "map"}
              aria-label={viewMode === "list" ? "Switch to map view" : "Switch to list view"}
              className="flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold"
              style={{ background: v3colors.royal, color: v3colors.white }}
            >
              {viewMode === "list" ? (
                <>
                  <MapIcon className="h-4 w-4" aria-hidden="true" /> Map
                </>
              ) : (
                <>
                  <List className="h-4 w-4" aria-hidden="true" /> List
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => set("likelyOpen", !filters.likelyOpen)}
              aria-pressed={filters.likelyOpen}
              className="rounded-full px-3 py-1.5 text-xs font-semibold"
              style={
                filters.likelyOpen
                  ? { background: v3colors.royal, color: v3colors.white }
                  : { ...fieldStyle, borderWidth: 1 }
              }
            >
              Likely open to a new mic
            </button>
            <button
              type="button"
              onClick={() => set("hasDeal", !filters.hasDeal)}
              aria-pressed={filters.hasDeal}
              disabled={!user}
              title={user ? undefined : "Sign in to see deal info"}
              className="rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              style={
                filters.hasDeal
                  ? { background: v3colors.royal, color: v3colors.white }
                  : { ...fieldStyle, borderWidth: 1 }
              }
            >
              Has deal info
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm" style={{ color: v3colors.muted }}>
          {isLoading
            ? "Loading venues…"
            : `${visible.length} ${visible.length === 1 ? "venue" : "venues"}`}
          {viewMode === "map" && listOnly > 0
            ? `. ${listOnly} without a map position appear in the list only.`
            : ""}
        </p>

        {!user && (
          <p className="mt-2 text-sm" style={{ color: v3colors.muted }}>
            <Link to="/auth/sign-in?next=/historical-mics" style={{ color: v3colors.royal }}>
              Sign in
            </Link>{" "}
            to see what these rooms pay, and to add what you know.
          </p>
        )}

        {viewMode === "map" ? (
          <>
          <div
            className="mt-5 overflow-hidden rounded-2xl"
            style={{ border: `1px solid ${v3colors.border}`, height: 560 }}
          >
            <HistoricalVenueMap
              venues={visible}
              onSelect={(slug) => {
                setViewMode("list");
                saveViewMode("list");
                setFilters({ ...EMPTY_VENUE_FILTERS, search: rows.find((r) => r.slug === slug)?.name ?? "" });
              }}
            />
          </div>

          {/* What the colours mean. Counts included because they say plainly
              how much of the map is unconfirmed rather than leaving someone to
              guess from the picture. */}
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {ACTIVITY_ORDER.map((key) => {
              const style = ACTIVITY_STYLE[key];
              const count = visible.filter(
                (row) => row.latitude !== null && venueActivity(row) === key,
              ).length;
              return (
                <li key={key} className="flex items-center gap-2 text-sm">
                  <span
                    aria-hidden="true"
                    className="inline-block h-4 w-4 shrink-0 rounded-full"
                    style={{
                      background: style.bg,
                      border: `1.5px solid ${
                        key === "inactive" ? v3colors.border : style.bg
                      }`,
                    }}
                  />
                  <span style={{ color: v3colors.bodyInk }}>
                    {style.label}
                    <span style={{ color: v3colors.mutedSoft }}> ({count})</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs" style={{ color: v3colors.mutedSoft }}>
            A venue Comediq runs itself keeps the Q mark, with its status as a ring around it.
          </p>
          </>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {!isLoading && visible.length === 0 && (
              <p className="text-base" style={{ color: v3colors.muted }}>
                No venue matches those filters.
              </p>
            )}
            {visible.map((row) => (
              <VenueCard
                key={row.slug}
                row={row}
                openToNew={openToNewVerdict(row, openToNewMap[row.slug])}
                deal={latestDealFor(deals, row.slug)}
                canSeeDeals={Boolean(user)}
                isOpen={formSlug === row.slug}
                onToggleForm={() => setFormSlug(formSlug === row.slug ? null : row.slug)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
