import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, Search } from "lucide-react";

import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useMyMicClaims, useClaimMics, micHasNoHost } from "@/hooks/useMicClaims";
import { useOpenMics } from "@/hooks/useOpenMics";
import { v3colors } from "@/theme/v3";
import type { OpenMic } from "@/types/openMic";

/**
 * Claim your mics.
 *
 * One screen: search every mic, tick as many as you host across as many
 * venues as you like, submit once. An admin approves, and approval sets the
 * mic's creator_id so it turns up in Manage.
 *
 * Picks survive the trip through login. A logged-out visitor who ticks three
 * mics is sent to sign in and comes back with the same three ticked, because
 * the ids ride in the URL (?picks=a,b,c) rather than in component state that
 * a navigation would throw away.
 *
 * Fields follow the inverse pyramid: the widest, biggest control first (the
 * search box), then the narrower note field under it.
 */

const PICKS_PARAM = "picks";
const MAX_RESULTS = 40;

function micLabel(mic: OpenMic): string {
  return mic.openMic || mic.venueName || "Untitled mic";
}

function whenLabel(mic: OpenMic): string {
  return [mic.day, mic.startTime].filter(Boolean).join(" ") || "Time to be confirmed";
}

export default function ClaimMics() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [params, setParams] = useSearchParams();
  const { data: mics = [], isLoading } = useOpenMics();
  const { byMicId } = useMyMicClaims();
  const claim = useClaimMics();

  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState<number | null>(null);

  // Picks live in the URL so login round-trips keep them.
  const picks = useMemo(() => {
    const raw = params.get(PICKS_PARAM);
    return new Set(raw ? raw.split(",").filter(Boolean) : []);
  }, [params]);

  const setPicks = (next: Set<string>) => {
    const copy = new URLSearchParams(params);
    if (next.size === 0) copy.delete(PICKS_PARAM);
    else copy.set(PICKS_PARAM, [...next].join(","));
    setParams(copy, { replace: true });
  };

  const toggle = (micId: string) => {
    const next = new Set(picks);
    if (next.has(micId)) next.delete(micId);
    else next.add(micId);
    setPicks(next);
  };

  /** Only mics going spare, and not ones this user already claimed. */
  const claimable = useMemo(
    () =>
      mics.filter((mic) => {
        const existing = byMicId.get(mic.uniqueIdentifier);
        if (existing && existing.status !== "rejected") return false;
        return micHasNoHost(mic);
      }),
    [mics, byMicId],
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const pool = claimable;
    if (!needle) {
      // No search yet: show the picks first so they are never off screen.
      const picked = pool.filter((mic) => picks.has(mic.uniqueIdentifier));
      const rest = pool.filter((mic) => !picks.has(mic.uniqueIdentifier));
      return [...picked, ...rest].slice(0, MAX_RESULTS);
    }
    return pool
      .filter((mic) =>
        [mic.openMic, mic.venueName, mic.neighborhood, mic.borough, mic.hosts]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(needle)),
      )
      .slice(0, MAX_RESULTS);
  }, [claimable, query, picks]);

  // Mics that are picked but filtered out of the current results, so the count
  // on the button is never a surprise.
  const pickedOffList = picks.size - results.filter((m) => picks.has(m.uniqueIdentifier)).length;

  const submit = () => {
    if (picks.size === 0) return;
    if (!user) {
      // Come back here, with the picks, after signing in.
      const back = `/claim-mics?${PICKS_PARAM}=${[...picks].join(",")}`;
      navigate(`/auth/sign-in?next=${encodeURIComponent(back)}`);
      return;
    }
    claim.mutate(
      { micIds: [...picks], note },
      {
        onSuccess: (count) => {
          setSubmitted(count);
          setPicks(new Set());
          setNote("");
        },
      },
    );
  };

  if (submitted !== null) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16 font-dmsans">
        <SEO title="Claim sent | Comediq" description="Your mic claim is with an admin." />
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: v3colors.sky }}
        >
          <Check className="h-8 w-8" strokeWidth={3} style={{ color: v3colors.ink }} aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold" style={{ color: v3colors.ink }}>
          Claim sent
        </h1>
        <p className="mt-2 text-base" style={{ color: v3colors.muted }}>
          You'll see these in Manage once approved.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/manage"
            className="inline-flex h-12 items-center rounded-full px-6 font-bold text-white"
            style={{ background: v3colors.royal }}
          >
            Go to Manage
          </Link>
          <button
            type="button"
            onClick={() => setSubmitted(null)}
            className="inline-flex h-12 items-center rounded-full px-6 font-bold"
            style={{ border: `2px solid ${v3colors.royal}`, color: v3colors.royal }}
          >
            Claim more mics
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pb-32 pt-10 font-dmsans">
      <SEO
        title="Claim your mics | Comediq"
        description="Tell us which open mics you host and we will put them in your Manage tab."
      />

      <h1 className="text-3xl font-bold" style={{ color: v3colors.ink }}>
        Claim your mics
      </h1>
      <p className="mt-2 text-base" style={{ color: v3colors.muted }}>
        Tick every mic you host. You can pick as many as you like, across as many venues as you
        like, and send them all at once.
      </p>

      {/* Inverse pyramid: the search box is the widest, biggest field. */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-4 h-5 w-5"
            style={{ color: v3colors.muted }}
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by mic, venue or neighbourhood"
            aria-label="Search mics"
            className="h-13 w-full rounded-2xl pl-12 pr-4 text-lg outline-none"
            style={{
              height: 52,
              background: v3colors.white,
              border: `2px solid ${v3colors.border}`,
              color: v3colors.ink,
            }}
          />
        </div>

        <input
          type="text"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Anything that helps us check (optional)"
          aria-label="Note for the admin"
          className="w-full rounded-xl px-4 outline-none"
          style={{
            height: 44,
            maxWidth: 420,
            background: v3colors.white,
            border: `1px solid ${v3colors.border}`,
            color: v3colors.ink,
          }}
        />
      </div>

      {isLoading && (
        <p className="mt-6 text-base" style={{ color: v3colors.muted }}>
          Loading mics…
        </p>
      )}

      {!isLoading && results.length === 0 && (
        <p className="mt-6 text-base" style={{ color: v3colors.muted }}>
          {query.trim()
            ? "No mic without a host matches that. Try the venue name."
            : "Every mic already has a host. Nothing to claim."}
        </p>
      )}

      <ul className="mt-5 flex flex-col gap-2">
        {results.map((mic) => {
          const id = mic.uniqueIdentifier;
          const checked = picks.has(id);
          return (
            <li key={id}>
              <label
                className="flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3"
                style={{
                  background: checked ? v3colors.surfaceBlue : v3colors.white,
                  border: `1px solid ${checked ? v3colors.royal : v3colors.border}`,
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(id)}
                  className="h-5 w-5 shrink-0"
                  style={{ accentColor: v3colors.royal }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold" style={{ color: v3colors.ink }}>
                    {micLabel(mic)}
                  </span>
                  <span className="block truncate text-sm" style={{ color: v3colors.muted }}>
                    {[mic.venueName, whenLabel(mic)].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {claim.isError && (
        <p className="mt-4 text-sm" role="alert" style={{ color: "#B3261E" }}>
          {claim.error instanceof Error ? claim.error.message : "Could not send that claim."}
        </p>
      )}

      {/* One button, pinned, so the count is always in view. */}
      <div
        className="fixed inset-x-0 bottom-0 px-5 pb-6 pt-4"
        style={{ background: `linear-gradient(transparent, ${v3colors.cream} 40%)` }}
      >
        <div className="mx-auto max-w-2xl">
          {pickedOffList > 0 && (
            <p className="mb-2 text-center text-sm" style={{ color: v3colors.muted }}>
              {pickedOffList} more picked and not shown by this search
            </p>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={picks.size === 0 || claim.isPending || authLoading}
            className="h-14 w-full rounded-full text-lg font-bold text-white disabled:opacity-50"
            style={{ background: v3colors.royal }}
          >
            {claim.isPending
              ? "Sending…"
              : picks.size === 0
                ? "Pick the mics you host"
                : !user
                  ? `Sign in to claim ${picks.size} ${picks.size === 1 ? "mic" : "mics"}`
                  : `Claim ${picks.size} ${picks.size === 1 ? "mic" : "mics"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
