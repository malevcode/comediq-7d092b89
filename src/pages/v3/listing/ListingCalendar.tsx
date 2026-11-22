import { useMemo, useState } from "react";

import {
  isoOf,
  parseIso,
  todayIso,
  type DateCellState,
} from "@/utils/listingSchedule";

/**
 * The 3-date calendar from ListingFlow.dc.html.
 *
 * SPEC.md: "calendar with up to 3 next dates that auto-fills day + how often,
 * skip dates". The arithmetic is not here — picking, skipping and cadence
 * detection all live in `src/utils/listingSchedule.ts`, shared with the app.
 * This draws the month and reports taps.
 *
 * Cell states, from the board's legend:
 *   picked    the host hand-picked it (up to 3)
 *   scheduled the cadence projects it; tapping skips it
 *   skipped   cancelled, struck through, hidden from Comediq that day
 *   past      before today, not tappable
 */

interface Props {
  picks: string[];
  skips: string[];
  /** Dates the cadence projects, from projectDates(). */
  scheduled: string[];
  onToggle: (iso: string) => void;
  onDone: () => void;
}

function stateOf(
  iso: string,
  today: string,
  picks: string[],
  skips: string[],
  scheduled: string[],
): DateCellState {
  if (iso < today) return "past";
  if (picks.includes(iso)) return "picked";
  if (skips.includes(iso)) return "skipped";
  if (scheduled.includes(iso)) return "scheduled";
  return "empty";
}

const CELL_CLASS: Record<DateCellState, string> = {
  picked: "cal-day cal-day--on",
  skipped: "cal-day cal-day--skip",
  scheduled: "cal-day cal-day--sched",
  empty: "cal-day",
  past: "cal-day",
};

const CELL_HINT: Record<DateCellState, string> = {
  picked: "picked, tap to unpick",
  skipped: "skipped, tap to put it back",
  scheduled: "scheduled, tap to skip it",
  empty: "tap to pick",
  past: "in the past",
};

export function ListingCalendar({ picks, skips, scheduled, onToggle, onDone }: Props) {
  const today = todayIso();
  const todayDate = parseIso(today);
  // Open on the first picked date's month, else this month.
  const [month, setMonth] = useState(() => {
    const first = [...picks].sort()[0];
    const base = first ? parseIso(first) : todayDate;
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  const cells = useMemo(() => {
    const firstOfMonth = new Date(month.year, month.month, 1);
    const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
    const blanks = firstOfMonth.getDay();

    const out: Array<
      | { kind: "blank"; key: string }
      | { kind: "day"; key: string; iso: string; label: number; state: DateCellState }
    > = [];

    for (let i = 0; i < blanks; i += 1) out.push({ kind: "blank", key: `b${i}` });
    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = isoOf(new Date(month.year, month.month, day));
      out.push({
        kind: "day",
        key: iso,
        iso,
        label: day,
        state: stateOf(iso, today, picks, skips, scheduled),
      });
    }
    return out;
  }, [month, today, picks, skips, scheduled]);

  const label = new Date(month.year, month.month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Nothing before the current month is useful: every state there is "past".
  const noPrev =
    month.year === todayDate.getFullYear() && month.month === todayDate.getMonth();

  const step = (delta: number) =>
    setMonth((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });

  return (
    <div className="cal" role="group" aria-label="Pick dates">
      <div className="cal-head">
        <button
          type="button"
          className="cal-nav"
          onClick={() => step(-1)}
          disabled={noPrev}
          aria-label="Previous month"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 5-7 7 7 7" />
          </svg>
        </button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{label}</span>
        <button type="button" className="cal-nav" onClick={() => step(1)} aria-label="Next month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="cal-grid" aria-hidden="true">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((weekday) => (
          <span key={weekday} className="cal-wd">
            {weekday}
          </span>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((cell) =>
          cell.kind === "blank" ? (
            <button key={cell.key} type="button" className="cal-day cal-day--blank" disabled tabIndex={-1} aria-hidden="true" />
          ) : (
            <button
              key={cell.key}
              type="button"
              className={`${CELL_CLASS[cell.state]}${cell.iso === today ? " cal-day--today" : ""}`}
              disabled={cell.state === "past"}
              aria-pressed={cell.state === "picked"}
              aria-label={`${parseIso(cell.iso).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}, ${CELL_HINT[cell.state]}`}
              onClick={() => onToggle(cell.iso)}
            >
              {cell.label}
            </button>
          ),
        )}
      </div>

      <div className="cal-key" aria-hidden="true">
        <span>
          <i style={{ background: "#8FC2F5" }} />
          Picked
        </span>
        <span>
          <i style={{ background: "rgba(143,194,245,.35)" }} />
          Scheduled
        </span>
        <span>
          <i style={{ background: "rgba(255,180,168,.4)" }} />
          Skipped
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "2px 2px 0",
        }}
      >
        <span className="field-hint">
          Pick up to 3 dates. Cancelled one week? Tap a scheduled date to skip it.
        </span>
        <button
          type="button"
          className="field-link"
          onClick={onDone}
          style={{ fontSize: 14, minHeight: 36 }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

export default ListingCalendar;
