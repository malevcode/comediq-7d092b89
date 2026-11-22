import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, Check, ChevronDown, MapPin, Search, X } from "lucide-react";

import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { publishListing } from "@/api/listings";
import {
  costText,
  EMPTY_LISTING,
  EMPTY_SHOW_LISTING,
  resolvedVenue,
  setLengthText,
  validateListing,
  type ListingErrors,
  type ListingForm,
  type ListingKind,
} from "@/utils/listingForm";
import {
  DAY_FULL,
  DAY_SHORT,
  describeWhen,
  formatClock,
  formatIsoDate,
  MAX_PICKS,
  projectDates,
  summarizeDates,
  toggleDate,
  todayIso,
  type DayShort,
  type Frequency,
} from "@/utils/listingSchedule";
import { initialsOf } from "@/utils/venues";
import { paletteFor } from "@/components/v3/V3Primitives";
import ListingCalendar from "./ListingCalendar";
import { useVenueSearch } from "./useVenueSearch";
import "./listing.css";

/**
 * Add a listing, from docs/design/storytime-redesign-v3 (ListingFlow,
 * ListingMicPath, ListingShowPath, ListingStates, ListingComponents) and
 * ListingDesktop.dc.html for the wide layout.
 *
 * Chooser -> one-page form -> preview -> success. Nothing is a wizard: the
 * form is one page, in the inverse pyramid the spec asks for.
 *
 * All the date maths is in src/utils/listingSchedule.ts and all the validation
 * in src/utils/listingForm.ts, both ported from the app, so the two platforms
 * cannot disagree about "every other Thursday".
 *
 * Saving goes where the app sends it: a new mic is an `open_mics_historical`
 * row with status 'trial' and creator_id set, and the presentation columns
 * (tags, description, banner, map icon) are written afterwards through the
 * creator-only function. Skipped dates picked here are kept with the form and
 * written on the host's Manage screen, which is where a date can also be
 * skipped later.
 */

/** How far ahead the calendar projects, matching the app. */
const HORIZON_DAYS = 120;

type Step = "chooser" | "form" | "preview" | "success";

const SET_LENGTHS = ["3", "4", "5", "Other"];
const COSTS = ["Free", "Bringer", "Paid"];
const SIGNUPS = ["In person", "Online link", "Lineup order"];
const ORDERS = ["First come", "Lottery", "Host picks"];
const MIC_FREQUENCIES: Frequency[] = ["Weekly", "Every other week", "Monthly", "One time"];

function Field({
  label,
  optional,
  htmlFor,
  error,
  action,
  children,
}: {
  label: string;
  optional?: string;
  htmlFor?: string;
  error?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <div className="field-label">
        {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : <span>{label}</span>}
        {action ?? (optional ? <span className="field-optional">{optional}</span> : null)}
      </div>
      {children}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function ChipGroup({
  options,
  value,
  onPick,
  error,
  labels,
}: {
  options: string[];
  value: string;
  onPick: (next: string) => void;
  error?: boolean;
  labels?: Record<string, string>;
}) {
  return (
    <div className={`chip-group${error ? " chip-group--error" : ""}`}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`chip${value === option ? " chip--on" : ""}`}
          aria-pressed={value === option}
          aria-label={labels?.[option] ?? option}
          onClick={() => onPick(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default function V3AddListing() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  const [params] = useSearchParams();

  // ?kind=show jumps straight to the show form, which is what the old
  // "Add a show" button links to.
  const initialKind = params.get("kind") === "show" ? "show" : null;

  const [kind, setKind] = useState<ListingKind | null>(initialKind);
  const [step, setStep] = useState<Step>(initialKind ? "form" : "chooser");
  const [form, setForm] = useState<ListingForm>(
    initialKind === "show" ? EMPTY_SHOW_LISTING : EMPTY_LISTING,
  );
  const [errors, setErrors] = useState<ListingErrors>({});
  const [calOpen, setCalOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  const venueSearch = useVenueSearch(form.venueQuery);
  const today = todayIso();

  const set = <K extends keyof ListingForm>(key: K, value: ListingForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  /** Every date the cadence projects, for the calendar and the hints. */
  const scheduled = useMemo(
    () =>
      projectDates(
        { dates: form.dates, day: form.day, freq: form.freq },
        today,
        HORIZON_DAYS,
      ),
    [form.dates, form.day, form.freq, today],
  );

  const upcoming = useMemo(
    () => scheduled.filter((date) => !form.skips.includes(date)).slice(0, 4),
    [scheduled, form.skips],
  );

  const startFlow = (nextKind: ListingKind) => {
    setKind(nextKind);
    setForm(nextKind === "show" ? EMPTY_SHOW_LISTING : EMPTY_LISTING);
    setErrors({});
    setStep("form");
  };

  /** A calendar tap: pick, unpick, skip or un-skip, plus cadence detection. */
  const onCalendarToggle = (iso: string) => {
    const next = toggleDate(iso, form.dates, form.skips, scheduled);
    setForm((current) => ({
      ...current,
      dates: next.dates,
      skips: next.skips,
      // detectCadence returns null when the tap was a skip, which must not
      // wipe the day and frequency the host already has.
      ...(next.cadence
        ? {
            day: next.cadence.day ?? current.day,
            freq: next.cadence.freq ?? current.freq,
            note: next.cadence.note ?? current.note,
            autoNote: next.cadence.autoNote,
          }
        : {}),
    }));
  };

  const goToPreview = () => {
    if (!kind) return;
    const found = validateListing(kind, form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setStep("preview");
  };

  const publish = async () => {
    if (!kind) return;
    if (!user) {
      navigate(`/auth/sign-in?next=${encodeURIComponent("/v3/listing")}`);
      return;
    }
    setPublishing(true);
    setPublishError(null);
    try {
      const result = await publishListing(form, kind, user.id);
      setPublishedId(result.micId);
      setStep("success");
    } catch (error) {
      setPublishError(
        error instanceof Error ? error.message : "Could not publish that listing.",
      );
    } finally {
      setPublishing(false);
    }
  };

  /* -------------------------------- chooser ------------------------------- */

  if (step === "chooser") {
    return (
      <div className={`lf-root ${isDesktop ? "min-h-screen" : "min-h-screen"}`}>
        <SEO
          title="Add a listing | Comediq"
          description="List an open mic or a show on Comediq. It takes about a minute."
        />
        <div className={isDesktop ? "mx-auto max-w-xl px-6 py-14" : "px-5 pb-10 pt-14"}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="m-0 text-3xl font-bold leading-tight">What are you listing?</h1>
              <p className="mt-2 text-[15px]" style={{ color: "#E2E8F5" }}>
                Pick one. It takes about a minute.
              </p>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Close"
              onClick={() => navigate("/v3")}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-7 flex flex-col gap-3.5">
            {(
              [
                {
                  kind: "mic" as const,
                  audience: "For comedians",
                  title: "An open mic",
                  body: "Comics find it, register and get up. Add the venue, day, time, set length and cover.",
                },
                {
                  kind: "show" as const,
                  audience: "For audiences",
                  title: "A show",
                  body: "People find it and RSVP or grab tickets. Add the venue, date, time and ticket link.",
                },
              ]
            ).map((choice) => (
              <button
                key={choice.kind}
                type="button"
                className="choice-card"
                onClick={() => startFlow(choice.kind)}
              >
                <span
                  className="mb-2 flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: "#8FC2F5", color: "#08142B" }}
                >
                  {choice.kind === "mic" ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="3" width="6" height="11" rx="3" />
                      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 8.5V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.5a2.5 2.5 0 0 0 0 5V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4.5a2.5 2.5 0 0 0 0-5Z" />
                      <path d="M14 5v14" />
                    </svg>
                  )}
                </span>
                <span className="text-[15px] font-semibold" style={{ color: "#8FC2F5" }}>
                  {choice.audience}
                </span>
                <span className="text-2xl font-bold">{choice.title}</span>
                <span className="pr-7 text-[15px] leading-snug" style={{ color: "#C9D3EA" }}>
                  {choice.body}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 text-center">
            <button type="button" className="text-link" onClick={() => navigate("/v3/manage")}>
              Manage my listings
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------- success ------------------------------- */

  if (step === "success") {
    const venue = resolvedVenue(form);
    const [wall] = paletteFor(venue.name || form.name);
    const whenText =
      kind === "mic"
        ? describeWhen({ ...form, note: form.note }, form.dates[0] ?? "")
        : `${formatIsoDate(form.date)} · ${formatClock(form.start)}`;

    return (
      <div className="lf-root min-h-screen">
        <SEO title="Listing published | Comediq" description="Your listing is live on Comediq." />
        <div className={isDesktop ? "mx-auto max-w-xl px-6 py-14" : "px-5 pb-10 pt-13"}>
          <div className="flex justify-end">
            <button
              type="button"
              className="icon-button icon-button--ghost"
              aria-label="Close"
              onClick={() => navigate("/v3")}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="my-6 flex flex-col items-center text-center">
            {/* The board's tick circle is #3DBE74; sky blue here, per the spec. */}
            <span
              className="flex h-18 w-18 items-center justify-center rounded-full"
              style={{ width: 72, height: 72, background: "#8FC2F5" }}
            >
              <Check className="h-9 w-9" strokeWidth={3} style={{ color: "#08142B" }} aria-hidden="true" />
            </span>
            <h1 className="mb-1.5 mt-4 text-[28px] font-bold">
              {kind === "mic" ? "Your mic is live" : "Your show is live"}
            </h1>
            <p className="m-0 max-w-[300px] text-[15px]" style={{ color: "#C9D3EA" }}>
              Comics can find it now. It shows as new until an admin verifies it.
            </p>
          </div>

          <article
            className="flex items-center gap-3 rounded-[24px] p-3"
            style={{ background: "#F4EDE1", color: "#08142B" }}
          >
            <div
              className="h-21 w-21 shrink-0 overflow-hidden rounded-[18px]"
              style={{ width: 84, height: 84, background: wall }}
            />
            <div className="min-w-0 flex-1">
              <div className="logo-font text-lg">{form.name}</div>
              <div className="mt-1 text-sm" style={{ color: "#4A5160" }}>
                {venue.name}
              </div>
              <div className="mt-0.5 text-sm font-semibold">{whenText}</div>
            </div>
          </article>

          <div className="mt-6 flex flex-col items-center gap-3">
            {publishedId && (
              <button
                type="button"
                className="primary-button"
                onClick={() => navigate(`/v3/mic/${encodeURIComponent(publishedId)}`)}
              >
                View the listing
              </button>
            )}
            <div className="flex gap-5">
              <button type="button" className="text-link" onClick={() => navigate("/v3/map")}>
                Back to mics
              </button>
              <button type="button" className="text-link" onClick={() => navigate("/v3/manage")}>
                Manage dates
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------- form and preview -------------------------- */

  const venue = resolvedVenue(form);
  const venuePicked = form.venue !== null;
  const isPreview = step === "preview";
  const [wall] = paletteFor(venue.name || form.name || "comediq");

  const previewBadges = [
    kind === "mic" ? setLengthText(form) : null,
    costText(form) || (kind === "show" ? form.price : null),
    kind === "mic" && form.signup ? form.signup : null,
  ].filter((badge): badge is string => Boolean(badge));

  const previewRows: Array<{ k: string; v: string }> = (
    kind === "mic"
      ? [
          { k: "Cost", v: costText(form) || "—" },
          { k: "Set length", v: setLengthText(form) || "—" },
          { k: "How often", v: form.freq },
          form.end ? { k: "Ends", v: formatClock(form.end) } : null,
        ]
      : [
          { k: "Price", v: form.price || "—" },
          form.doors ? { k: "Doors", v: formatClock(form.doors) } : null,
          { k: "Date", v: formatIsoDate(form.date) },
        ]
  ).filter((row): row is { k: string; v: string } => row !== null);

  const skippedUpcoming = form.skips.filter((date) => date >= today).sort();

  return (
    <div className="lf-root min-h-screen">
      <SEO
        title="Add a listing | Comediq"
        description="List an open mic or a show on Comediq. It takes about a minute."
      />

      <div className={isDesktop ? "mx-auto max-w-[560px] px-6 pb-40 pt-10" : "px-4 pb-40 pt-12"}>
        {/* Step header: back, dots, close. */}
        <header className="mb-3 flex items-center justify-between">
          <button
            type="button"
            className="icon-button icon-button--ghost"
            aria-label="Back"
            onClick={() => (isPreview ? setStep("form") : setStep("chooser"))}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </button>
          <div
            className="step-dots"
            role="img"
            aria-label={`Step ${isPreview ? 2 : 1} of 2`}
          >
            <span className={isPreview ? "step-dot step-dot--done" : "step-dot step-dot--on"} />
            <span className={isPreview ? "step-dot step-dot--on" : "step-dot"} />
          </div>
          <button
            type="button"
            className="icon-button icon-button--ghost"
            aria-label="Close"
            onClick={() => navigate("/v3")}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <h1 className="mb-3 text-[22px] font-bold leading-tight">
          {isPreview
            ? "Does this look right?"
            : kind === "mic"
              ? "Add an open mic"
              : "Add a show"}
        </h1>

        {!isPreview && user && (
          <div className="mb-3 flex items-center gap-2.5 text-[13px]" style={{ color: "#DCE3F2" }}>
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ background: "#8FC2F5", color: "#08142B" }}
            >
              {initialsOf(user.email?.split("@")[0] ?? "You")}
            </span>
            <span>
              Listing as{" "}
              <strong style={{ color: "#F4EDE1", fontWeight: 600 }}>
                {user.email?.split("@")[0]}
              </strong>
              . Only you can edit or cancel dates.
            </span>
          </div>
        )}

        {/* ------------------------------ the form ----------------------------- */}
        {!isPreview && (
          <form
            onSubmit={(event) => event.preventDefault()}
            noValidate
            className="flex flex-col gap-2.5"
          >
            {/* Widest first: name and host. */}
            <div className="row-2">
              <Field label={kind === "mic" ? "Mic name" : "Show name"} htmlFor="lf-name" error={errors.name}>
                <input
                  id="lf-name"
                  className={`text-input${errors.name ? " text-input--error" : ""}`}
                  placeholder={kind === "mic" ? "Rusty Thursdays" : "Basement Bangers"}
                  value={form.name}
                  onChange={(event) => set("name", event.target.value)}
                />
              </Field>
              <Field label="Host Instagram" optional="Optional" htmlFor="lf-host">
                <input
                  id="lf-host"
                  className="text-input"
                  placeholder="@host"
                  value={form.host}
                  onChange={(event) => set("host", event.target.value)}
                />
              </Field>
            </div>

            {/* Venue: search the venues we already have, or add a new one. */}
            {form.addVenue ? (
              <Field
                label="New venue"
                action={
                  <button
                    type="button"
                    className="field-link"
                    onClick={() => set("addVenue", false)}
                  >
                    Search instead
                  </button>
                }
              >
                <div className="row-2">
                  <div className="field">
                    <input
                      aria-label="Venue name"
                      className={`text-input${errors.newVenueName ? " text-input--error" : ""}`}
                      placeholder="Venue name"
                      value={form.newVenueName}
                      onChange={(event) => set("newVenueName", event.target.value)}
                    />
                    {errors.newVenueName && (
                      <p className="field-error" role="alert">
                        {errors.newVenueName}
                      </p>
                    )}
                  </div>
                  <div className="field">
                    <input
                      aria-label="Address"
                      className={`text-input${errors.newVenueAddress ? " text-input--error" : ""}`}
                      placeholder="Street address"
                      value={form.newVenueAddress}
                      onChange={(event) => set("newVenueAddress", event.target.value)}
                    />
                    {errors.newVenueAddress && (
                      <p className="field-error" role="alert">
                        {errors.newVenueAddress}
                      </p>
                    )}
                  </div>
                </div>
                <p className="field-hint">
                  A new venue has no map position until it is geocoded, so it may not appear on
                  the map straight away.
                </p>
              </Field>
            ) : (
              <Field
                label="Venue"
                htmlFor={venuePicked ? undefined : "lf-venue"}
                error={errors.venue}
                action={
                  <button type="button" className="field-link" onClick={() => set("addVenue", true)}>
                    Not listed? Add it
                  </button>
                }
              >
                {venuePicked ? (
                  <div
                    className="flex h-11 items-center gap-2.5 rounded-xl pl-3 pr-1.5"
                    style={{ background: "#2B56A6" }}
                  >
                    <MapPin className="h-4 w-4 shrink-0" style={{ color: "#8FC2F5" }} aria-hidden="true" />
                    <div className="min-w-0 flex-1 truncate text-[15px]">
                      <strong style={{ fontWeight: 600 }}>{form.venue?.name}</strong>{" "}
                      <span style={{ color: "#C9D3EA", fontSize: 13 }}>{form.venue?.address}</span>
                    </div>
                    <button
                      type="button"
                      className="field-link"
                      style={{ fontSize: 13, padding: "0 8px", minHeight: 36 }}
                      onClick={() => {
                        set("venue", null);
                        set("venueQuery", "");
                      }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-3 h-4 w-4"
                        style={{ color: "#C9D3EA" }}
                        aria-hidden="true"
                      />
                      <input
                        id="lf-venue"
                        className={`text-input${errors.venue ? " text-input--error" : ""}`}
                        style={{ paddingLeft: 38 }}
                        placeholder="Search venue name or address"
                        value={form.venueQuery}
                        onChange={(event) => set("venueQuery", event.target.value)}
                        autoComplete="off"
                      />
                    </div>
                    {venueSearch.results.length > 0 && (
                      <div className="venue-results" role="listbox" aria-label="Matching venues">
                        {venueSearch.results.map((result) => (
                          <button
                            key={result.key}
                            type="button"
                            className="venue-option"
                            onClick={() => {
                              set("venue", {
                                name: result.name,
                                address: result.address,
                                hood: result.hood,
                                latitude: result.latitude,
                                longitude: result.longitude,
                              });
                              set("venueQuery", result.name);
                            }}
                          >
                            <MapPin className="h-4 w-4 shrink-0" style={{ color: "#8FC2F5" }} aria-hidden="true" />
                            <span className="text-[15px] font-semibold">{result.name}</span>
                            <span className="text-[13px]" style={{ color: "#C9D3EA" }}>
                              {result.address}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {venueSearch.noResults && (
                      <div
                        role="status"
                        className="flex items-center justify-between gap-2.5 rounded-xl py-2 pl-3 pr-2"
                        style={{ background: "#173A7A" }}
                      >
                        <span className="text-[13px]" style={{ color: "#DCE3F2" }}>
                          No venue matches "{form.venueQuery}"
                        </span>
                        <button
                          type="button"
                          className="chip chip--on"
                          style={{ flex: "0 0 auto", padding: "0 12px" }}
                          onClick={() => set("addVenue", true)}
                        >
                          Add it
                        </button>
                      </div>
                    )}
                  </>
                )}
              </Field>
            )}

            {/* The calendar, for mics. A show has one date. */}
            {kind === "mic" ? (
              <Field
                label="Next dates"
                optional={form.freq === "Weekly" ? "Optional" : `Up to ${MAX_PICKS}`}
                error={errors.dates}
              >
                <button
                  type="button"
                  className={`text-input date-button${errors.dates ? " text-input--error" : ""}`}
                  onClick={() => setCalOpen((open) => !open)}
                  aria-expanded={calOpen}
                >
                  <Calendar className="h-4 w-4 shrink-0" style={{ color: "#8FC2F5" }} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{summarizeDates(form.dates)}</span>
                  <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "#C9D3EA" }} aria-hidden="true" />
                </button>
                {calOpen && (
                  <ListingCalendar
                    picks={form.dates}
                    skips={form.skips}
                    scheduled={scheduled}
                    onToggle={onCalendarToggle}
                    onDone={() => setCalOpen(false)}
                  />
                )}
                {form.autoNote && (
                  <p className="field-hint flex items-center gap-1.5" style={{ color: "#DCE3F2" }}>
                    {/* Board draws this tick green; sky blue here. */}
                    <Check className="h-3.5 w-3.5" strokeWidth={3} style={{ color: "#8FC2F5" }} aria-hidden="true" />
                    {form.autoNote}
                  </p>
                )}
              </Field>
            ) : (
              <Field label="Date" htmlFor="lf-date" error={errors.date}>
                <input
                  id="lf-date"
                  type="date"
                  min={today}
                  className={`text-input${errors.date ? " text-input--error" : ""}`}
                  value={form.date}
                  onChange={(event) => set("date", event.target.value)}
                />
              </Field>
            )}

            {kind === "mic" && (
              <Field label="Day" error={errors.day}>
                <ChipGroup
                  options={[...DAY_SHORT]}
                  value={form.day}
                  onPick={(next) => set("day", next as DayShort)}
                  error={Boolean(errors.day)}
                  labels={Object.fromEntries(DAY_SHORT.map((short, i) => [short, DAY_FULL[i]]))}
                />
              </Field>
            )}

            <div className="row-2">
              <Field label="Start" htmlFor="lf-start" error={errors.start}>
                <input
                  id="lf-start"
                  type="time"
                  className={`text-input${errors.start ? " text-input--error" : ""}`}
                  value={form.start}
                  onChange={(event) => set("start", event.target.value)}
                />
              </Field>
              <Field
                label={kind === "mic" ? "End" : "Doors"}
                optional="Optional"
                htmlFor="lf-end"
              >
                <input
                  id="lf-end"
                  type="time"
                  className="text-input"
                  value={kind === "mic" ? form.end : form.doors}
                  onChange={(event) =>
                    kind === "mic" ? set("end", event.target.value) : set("doors", event.target.value)
                  }
                />
              </Field>
            </div>

            {kind === "mic" && (
              <>
                <Field label="How often">
                  <ChipGroup
                    options={MIC_FREQUENCIES}
                    value={form.freq}
                    onPick={(next) => set("freq", next as Frequency)}
                  />
                  {upcoming.length > 0 && (
                    <p className="field-hint" style={{ color: "#DCE3F2" }}>
                      Next: {upcoming.map((date) => formatIsoDate(date)).join(", ")}
                    </p>
                  )}
                  {skippedUpcoming.length > 0 && (
                    <p className="field-hint" style={{ color: "#FFC9C0" }}>
                      Skipping {skippedUpcoming.map((date) => formatIsoDate(date)).join(", ")}
                    </p>
                  )}
                </Field>

                {form.freq === "Monthly" && (
                  <Field label="Pattern" optional="Optional" htmlFor="lf-note">
                    <input
                      id="lf-note"
                      className="text-input"
                      placeholder="1st and 3rd Thu"
                      value={form.note}
                      onChange={(event) => set("note", event.target.value)}
                    />
                  </Field>
                )}

                {/* Narrower rows as the pyramid descends. */}
                <div className="row-2">
                  <Field label="Set length" error={errors.setLen}>
                    <ChipGroup
                      options={SET_LENGTHS}
                      value={form.setLen}
                      onPick={(next) => set("setLen", next)}
                      error={Boolean(errors.setLen)}
                    />
                  </Field>
                  <Field label="Cost" error={errors.cost}>
                    <ChipGroup
                      options={COSTS}
                      value={form.cost}
                      onPick={(next) => set("cost", next)}
                      error={Boolean(errors.cost)}
                    />
                  </Field>
                </div>

                {(form.setLen === "Other" || form.cost === "Paid") && (
                  <div className="row-2">
                    <div className="field">
                      {form.setLen === "Other" && (
                        <Field label="Minutes" htmlFor="lf-mins" error={errors.otherMins}>
                          <input
                            id="lf-mins"
                            type="number"
                            inputMode="numeric"
                            className={`text-input${errors.otherMins ? " text-input--error" : ""}`}
                            placeholder="4"
                            value={form.otherMins}
                            onChange={(event) => set("otherMins", event.target.value)}
                          />
                        </Field>
                      )}
                    </div>
                    <div className="field">
                      {form.cost === "Paid" && (
                        <Field label="Price" htmlFor="lf-price" error={errors.price}>
                          <input
                            id="lf-price"
                            className={`text-input${errors.price ? " text-input--error" : ""}`}
                            placeholder="$5 or 1 drink"
                            value={form.price}
                            onChange={(event) => set("price", event.target.value)}
                          />
                        </Field>
                      )}
                    </div>
                  </div>
                )}

                <Field label="Signup" error={errors.signup}>
                  <ChipGroup
                    options={SIGNUPS}
                    value={form.signup}
                    onPick={(next) => set("signup", next)}
                    error={Boolean(errors.signup)}
                  />
                </Field>

                {form.signup === "Online link" && (
                  <Field label="Signup link" htmlFor="lf-link" error={errors.link}>
                    <input
                      id="lf-link"
                      type="url"
                      className={`text-input${errors.link ? " text-input--error" : ""}`}
                      placeholder="Paste the link"
                      value={form.link}
                      onChange={(event) => set("link", event.target.value)}
                    />
                  </Field>
                )}

                {form.signup === "Lineup order" && (
                  <Field label="How is the order set?">
                    <ChipGroup
                      options={ORDERS}
                      value={form.order}
                      onPick={(next) => set("order", next)}
                    />
                  </Field>
                )}

                {/* Keeping the listing active. */}
                <div
                  className="overflow-hidden rounded-xl"
                  style={{
                    background: "#173A7A",
                    border: `1px solid ${errors.verify ? "#FFB4A8" : "rgba(255,255,255,.12)"}`,
                  }}
                >
                  <button
                    type="button"
                    className="toggle-card"
                    role="switch"
                    aria-checked={form.verify}
                    onClick={() => set("verify", !form.verify)}
                    style={{ border: 0, background: "none" }}
                  >
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">
                        I'll verify this mic is still active
                      </span>
                      <span className="block text-xs" style={{ color: "#C9D3EA" }}>
                        Confirm it's running at least once a month
                      </span>
                    </span>
                    <span className={`switch${form.verify ? " switch--on" : ""}`} aria-hidden="true" />
                  </button>
                  <div style={{ height: 1, background: "rgba(255,255,255,.1)", margin: "0 12px" }} />
                  <button
                    type="button"
                    className="checkbox-card"
                    role="checkbox"
                    aria-checked={form.emailOk}
                    onClick={() => set("emailOk", !form.emailOk)}
                    style={{ border: 0, background: "none" }}
                  >
                    <span className={`checkbox${form.emailOk ? " checkbox--on" : ""}`} aria-hidden="true">
                      {form.emailOk && (
                        <Check className="h-3.5 w-3.5" strokeWidth={3.4} style={{ color: "#08142B" }} aria-hidden="true" />
                      )}
                    </span>
                    <span className="flex-1 text-sm font-medium">
                      Email me reminders to confirm my mic is active
                    </span>
                  </button>
                </div>
                {errors.verify && (
                  <p className="field-error" role="alert" style={{ marginTop: -5 }}>
                    {errors.verify}
                  </p>
                )}
              </>
            )}

            {kind === "show" && (
              <>
                <div className="row-price">
                  <Field label="Price" htmlFor="lf-price" error={errors.price}>
                    <input
                      id="lf-price"
                      className={`text-input${errors.price ? " text-input--error" : ""}`}
                      placeholder="$15"
                      value={form.price}
                      onChange={(event) => set("price", event.target.value)}
                    />
                  </Field>
                  <Field label="Ticket link" htmlFor="lf-ticket" error={errors.ticket}>
                    <input
                      id="lf-ticket"
                      type="url"
                      className={`text-input${errors.ticket ? " text-input--error" : ""}`}
                      placeholder="Paste the ticket link"
                      value={form.ticket}
                      onChange={(event) => set("ticket", event.target.value)}
                    />
                  </Field>
                </div>

                <div className="row-desc">
                  <Field label="Description" optional="Optional" htmlFor="lf-desc">
                    <textarea
                      id="lf-desc"
                      className="text-input"
                      placeholder="Six comics, one tight hour, cheap drinks."
                      value={form.desc}
                      onChange={(event) => set("desc", event.target.value)}
                    />
                  </Field>
                  <Field label="Instagram" optional="Optional" htmlFor="lf-ig">
                    <input
                      id="lf-ig"
                      className="text-input"
                      placeholder="@show"
                      value={form.ig}
                      onChange={(event) => set("ig", event.target.value)}
                    />
                  </Field>
                </div>
              </>
            )}

            {kind === "mic" && (
              <Field label="Description" optional="Optional" htmlFor="lf-desc">
                <textarea
                  id="lf-desc"
                  className="text-input"
                  placeholder="Basement mic under a dive bar. Small room, honest crowd."
                  value={form.desc}
                  onChange={(event) => set("desc", event.target.value)}
                />
              </Field>
            )}
          </form>
        )}

        {/* ------------------------------ preview ------------------------------ */}
        {isPreview && (
          <>
            <p className="mb-4 text-[15px]" style={{ color: "#C9D3EA" }}>
              This is the page comics will see.
            </p>
            <article
              className="rounded-[28px] p-4 pb-4.5"
              style={{ background: "#F4EDE1", color: "#08142B", boxShadow: "0 16px 40px rgba(0,0,0,.25)" }}
            >
              <div
                className="relative overflow-hidden rounded-[22px]"
                style={{ height: 170, background: wall }}
              >
                <span
                  className="absolute bottom-3 right-3 flex items-center justify-center rounded-full border-[3px] border-white text-[17px] font-extrabold text-white"
                  style={{ width: 56, height: 56, background: wall }}
                >
                  {initialsOf(venue.name || form.name)}
                </span>
              </div>
              <h2 className="logo-font mb-2.5 mt-4 text-[26px]">{form.name}</h2>
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {venue.hood && (
                  <span className="flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-1.5 text-[13px] font-medium" style={{ borderColor: "#E4E7EE" }}>
                    <MapPin className="h-3 w-3" style={{ color: "#1E4894" }} aria-hidden="true" />
                    {venue.hood}
                  </span>
                )}
                <span className="rounded-full border bg-white px-2.5 py-1.5 text-[13px] font-medium" style={{ borderColor: "#E4E7EE" }}>
                  Starts {formatClock(form.start)}
                </span>
                {previewBadges.map((badge) => (
                  <span key={badge} className="rounded-full border bg-white px-2.5 py-1.5 text-[13px] font-medium" style={{ borderColor: "#E4E7EE" }}>
                    {badge}
                  </span>
                ))}
              </div>
              {form.desc && (
                <p className="mb-2.5 text-sm leading-relaxed" style={{ color: "#4A5160" }}>
                  {form.desc}
                </p>
              )}
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-extrabold text-white"
                  style={{ background: wall }}
                >
                  {initialsOf(venue.name || form.name)}
                </span>
                <span className="flex-1">
                  <span className="logo-font block text-sm">{venue.name}</span>
                  <span className="block text-[13px]" style={{ color: "#5F6675" }}>
                    {form.host || venue.address}
                  </span>
                </span>
              </div>

              {skippedUpcoming.length > 0 && (
                <div
                  role="note"
                  className="mb-2.5 flex items-start gap-2 rounded-[14px] px-3 py-2.5 text-[13px] font-semibold"
                  style={{ background: "#FCEBD2", color: "#6B3A00" }}
                >
                  <span>
                    No mic on {skippedUpcoming.map((date) => formatIsoDate(date)).join(", ")}
                  </span>
                </div>
              )}

              <div className="rounded-[20px] border bg-white p-3.5" style={{ borderColor: "#EEF0F4" }}>
                <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: "#E4E7EE" }}>
                  <span className="text-[15px] font-semibold">
                    {kind === "mic" ? "Open mic" : "Show"}
                  </span>
                  <span className="text-[13px] font-semibold" style={{ color: "#1E4894" }}>
                    New
                  </span>
                </div>
                {kind === "mic" && form.signup && (
                  <>
                    <div className="mt-2.5 text-[15px] font-semibold">Signup</div>
                    <div className="mt-0.5 text-sm" style={{ color: "#4A5160" }}>
                      {form.signup === "Online link"
                        ? form.link
                        : form.signup === "Lineup order"
                          ? `${form.order || "Order set by the host"}`
                          : "In person at the room"}
                    </div>
                  </>
                )}
                <div className="mt-2.5 text-[15px] font-semibold">Details</div>
                <dl className="m-0 mt-0.5 text-sm">
                  {previewRows.map((row) => (
                    <div
                      key={row.k}
                      className="flex justify-between gap-2.5 border-b py-1.5"
                      style={{ borderColor: "#EEF0F4" }}
                    >
                      <dt style={{ color: "#5F6675" }}>{row.k}</dt>
                      <dd className="m-0 text-right font-semibold">{row.v}</dd>
                    </div>
                  ))}
                </dl>
                <div
                  className="mt-3 flex h-[46px] items-center justify-center rounded-full text-[15px] font-bold"
                  style={{ background: "#1E4894", color: "#F4EDE1" }}
                >
                  {kind === "mic" ? "Register" : "Get tickets"}
                </div>
              </div>
            </article>
            <div className="mt-2 text-center">
              <button type="button" className="text-link" onClick={() => setStep("form")}>
                Edit
              </button>
            </div>
          </>
        )}

        {publishError && (
          <p className="field-error mt-3" role="alert">
            {publishError}
          </p>
        )}
      </div>

      {/* Bottom bar: one button. */}
      <div
        className="fixed inset-x-0 bottom-0 z-10 px-4 pb-6 pt-4"
        style={{ background: "linear-gradient(rgba(30,72,148,0), #1E4894 24%)" }}
      >
        <div className={isDesktop ? "mx-auto max-w-[560px]" : ""}>
          {isPreview && (
            <p className="mb-2.5 text-center text-sm" style={{ color: "#C9D3EA" }}>
              Your listing goes live right away. Please double-check the details.
            </p>
          )}
          <button
            type="button"
            className={`primary-button${isPreview ? " primary-button--publish" : ""}`}
            onClick={isPreview ? publish : goToPreview}
            disabled={publishing}
          >
            {publishing ? (
              <span className="lf-spin" role="status" aria-label="Publishing" />
            ) : (
              <span>{isPreview ? "Publish listing" : "Preview listing"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
