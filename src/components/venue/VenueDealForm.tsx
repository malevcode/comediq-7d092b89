import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { reportDeal } from "@/api/venueHistory";
import { useAuth } from "@/contexts/AuthContext";
import { v3colors } from "@/theme/v3";

/**
 * "Add deal info", for a producer who knows what a room pays.
 *
 * Inverse pyramid: the widest, biggest controls first (venue, which is fixed,
 * then show type), then the two-up money rows, then the narrow optional ones,
 * then notes.
 *
 * Submits as pending. Nothing a producer types appears on the page until an
 * admin approves it.
 */

const dollarsToCents = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
};

const toPct = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(100, Math.max(0, parsed));
};

const toHours = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

interface Props {
  venueSlug: string;
  venueName: string;
  onDone: () => void;
}

export default function VenueDealForm({ venueSlug, venueName, onDone }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showType, setShowType] = useState<"open mic" | "show">("open mic");
  const [door, setDoor] = useState("");
  const [producer, setProducer] = useState("");
  const [bar, setBar] = useState("");
  const [minimum, setMinimum] = useState("");
  const [minimumHours, setMinimumHours] = useState("");
  const [notes, setNotes] = useState("");
  const [sent, setSent] = useState(false);

  // The venue's share is whatever the producer does not take.
  const producerPct = toPct(producer);
  const venuePct = producerPct === null ? null : 100 - producerPct;

  const submit = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Sign in to add deal info.");
      return reportDeal(
        {
          venueSlug,
          showType,
          doorPriceCents: dollarsToCents(door),
          producerSplitPct: producerPct,
          venueSplitPct: venuePct,
          barSplitPct: toPct(bar),
          minimumCents: dollarsToCents(minimum),
          minimumHours: toHours(minimumHours),
          notes,
        },
        user.id,
      );
    },
    onSuccess: () => {
      setSent(true);
      queryClient.invalidateQueries({ queryKey: ["venue-deals"] });
    },
  });

  if (sent) {
    return (
      <div className="rounded-2xl p-4" style={{ background: v3colors.surfaceBlue }}>
        <p className="text-sm font-semibold" style={{ color: v3colors.ink }}>
          Thanks. We'll add it once it's checked.
        </p>
        <button
          type="button"
          onClick={onDone}
          className="mt-3 h-10 rounded-full px-4 text-sm font-bold text-white"
          style={{ background: v3colors.royal }}
        >
          Close
        </button>
      </div>
    );
  }

  const fieldStyle = {
    background: v3colors.white,
    border: `1.5px solid ${v3colors.border}`,
    color: v3colors.ink,
  } as const;
  const labelClass = "mb-1 block text-xs font-semibold";
  const labelStyle = { color: v3colors.muted } as const;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit.mutate();
      }}
      className="rounded-2xl p-4"
      style={{ background: v3colors.surfaceSunken }}
    >
      {/* Widest first. */}
      <div>
        <span className={labelClass} style={labelStyle}>
          Venue
        </span>
        <div
          className="flex h-12 items-center rounded-xl px-3 text-base font-semibold"
          style={{ ...fieldStyle, color: v3colors.ink }}
        >
          {venueName}
        </div>
      </div>

      <div className="mt-3">
        <span className={labelClass} style={labelStyle}>
          What kind of night
        </span>
        <div className="flex gap-2">
          {(["open mic", "show"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setShowType(option)}
              aria-pressed={showType === option}
              className="h-11 flex-1 rounded-xl text-sm font-semibold capitalize"
              style={
                showType === option
                  ? { background: v3colors.royal, color: v3colors.white }
                  : { ...fieldStyle }
              }
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Narrower: the two numbers that matter most. */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label>
          <span className={labelClass} style={labelStyle}>
            Door price
          </span>
          <input
            inputMode="decimal"
            placeholder="$10"
            value={door}
            onChange={(event) => setDoor(event.target.value)}
            className="h-11 w-full rounded-xl px-3 text-sm outline-none"
            style={fieldStyle}
          />
        </label>
        <label>
          <span className={labelClass} style={labelStyle}>
            Producer keeps
          </span>
          <input
            inputMode="numeric"
            placeholder="70"
            value={producer}
            onChange={(event) => setProducer(event.target.value)}
            className="h-11 w-full rounded-xl px-3 text-sm outline-none"
            style={fieldStyle}
          />
        </label>
      </div>

      <p className="mt-1.5 text-xs" style={{ color: v3colors.muted }}>
        {venuePct === null
          ? "The venue's share fills in from the producer's."
          : `Venue keeps ${venuePct}%.`}
      </p>

      {/* Narrower still: the optional ones. */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <label>
          <span className={labelClass} style={labelStyle}>
            Bar %
          </span>
          <input
            inputMode="numeric"
            placeholder="None"
            value={bar}
            onChange={(event) => setBar(event.target.value)}
            className="h-10 w-full rounded-xl px-2.5 text-sm outline-none"
            style={fieldStyle}
          />
        </label>
        <label>
          <span className={labelClass} style={labelStyle}>
            Minimum
          </span>
          <input
            inputMode="decimal"
            placeholder="None"
            value={minimum}
            onChange={(event) => setMinimum(event.target.value)}
            className="h-10 w-full rounded-xl px-2.5 text-sm outline-none"
            style={fieldStyle}
          />
        </label>
        <label>
          <span className={labelClass} style={labelStyle}>
            Over hours
          </span>
          <input
            inputMode="decimal"
            placeholder="2"
            value={minimumHours}
            onChange={(event) => setMinimumHours(event.target.value)}
            className="h-10 w-full rounded-xl px-2.5 text-sm outline-none"
            style={fieldStyle}
          />
        </label>
      </div>

      <label className="mt-3 block">
        <span className={labelClass} style={labelStyle}>
          Anything else
        </span>
        <input
          placeholder="Optional"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="h-10 w-full rounded-xl px-3 text-sm outline-none"
          style={fieldStyle}
        />
      </label>

      {submit.isError && (
        <p className="mt-2 text-sm" role="alert" style={{ color: "#B3261E" }}>
          {submit.error instanceof Error ? submit.error.message : "Could not send that."}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={submit.isPending}
          className="h-11 flex-1 rounded-full text-sm font-bold text-white disabled:opacity-50"
          style={{ background: v3colors.royal }}
        >
          {submit.isPending ? "Sending…" : "Send deal info"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="h-11 rounded-full px-4 text-sm font-bold"
          style={{ border: `2px solid ${v3colors.royal}`, color: v3colors.royal }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
