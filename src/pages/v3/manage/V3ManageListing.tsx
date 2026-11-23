import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil } from "lucide-react";

import SEO from "@/components/SEO";
import { StageTile, VenueBubble } from "@/components/v3/V3Primitives";
import { useAuth } from "@/contexts/AuthContext";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useListingAnalytics } from "@/hooks/useListingAnalytics";
import { useMyListing } from "@/hooks/useMyListings";
import {
  addMicSkip,
  removeMicSkip,
  requestMicChanges,
  updateMicPresentation,
} from "@/api/listings";
import { EMPTY_LISTING, type ListingForm } from "@/utils/listingForm";
import { changeRequestFromForms, formFromMic } from "@/utils/micRowMapping";
import { formatIsoDate, projectDates, todayIso } from "@/utils/listingSchedule";
import { initialsOf } from "@/utils/venues";
import "./manage.css";

/**
 * A single listing in the host Manage tab.
 *
 * Phone follows HostManage.dc.html boards 2 and 3; desktop follows
 * WebManage.dc.html (photo and details left, dates and analytics right).
 *
 * The save rule is the spec's, and it is enforced by what each call can
 * touch, not by trusting the UI:
 *
 *   banner, map icon, tags, description  -> live right away, through
 *     update_own_mic_presentation_v1, which can only write those four columns.
 *   venue, day, time, price, signup      -> open_mics_requests, for an admin.
 *     The live listing keeps running untouched until approved.
 *   skipped dates                        -> mic_skips, live right away.
 */

const HORIZON_DAYS = 90;
/** The boards show three or four upcoming dates. */
const MAX_DATES_SHOWN = 8;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="h2">{label}</div>
      {children}
    </div>
  );
}

export default function V3ManageListing() {
  const { listingId = "" } = useParams();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { listing, isLoading } = useMyListing(listingId);
  const { data: analytics } = useListingAnalytics(listingId);

  const [tab, setTab] = useState<"live" | "pending">("live");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ListingForm | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");

  const today = todayIso();

  /** The form as the live row currently stands, for diffing against a draft. */
  const current = useMemo(
    () => (listing ? formFromMic(listing.mic, EMPTY_LISTING) : null),
    [listing],
  );

  const dates = useMemo(() => {
    if (!listing) return [];
    const day = listing.mic.day?.slice(0, 3) ?? "";
    const freq =
      listing.mic.frequency === "bi_weekly"
        ? "Every other week"
        : listing.mic.frequency === "one_off"
          ? "One time"
          : listing.mic.frequency === "custom" || listing.mic.frequency === "last_of_month"
            ? "Monthly"
            : "Weekly";
    return projectDates(
      { dates: [], day: day as ListingForm["day"], freq },
      today,
      HORIZON_DAYS,
    ).slice(0, MAX_DATES_SHOWN);
  }, [listing, today]);

  const skippedDates = useMemo(
    () => new Set((listing?.skips ?? []).map((skip) => skip.skip_date)),
    [listing],
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["my-mics"] });
    queryClient.invalidateQueries({ queryKey: ["my-mic-requests"] });
    queryClient.invalidateQueries({ queryKey: ["mic-skips"] });
    queryClient.invalidateQueries({ queryKey: ["openMics"] });
  };

  if (isLoading) {
    return (
      <div className="mg-root mg-screen px-5 py-20" style={{ color: "#AEB9D6" }}>
        Loading…
      </div>
    );
  }

  if (!listing || !current) {
    return (
      <div className="mg-root mg-screen px-5 py-20">
        <h1 className="text-2xl font-bold">We could not find that listing</h1>
        <p className="mt-2" style={{ color: "#AEB9D6" }}>
          You can only manage a listing you created.
        </p>
        <button type="button" className="btn-outline mt-5" onClick={() => navigate("/manage")}>
          Back to Manage
        </button>
      </div>
    );
  }

  const { mic } = listing;
  const seed = mic.venueName || mic.openMic;
  const form = draft ?? current;

  /* ------------------------------ actions ------------------------------ */

  const toggleDateOnOff = async (iso: string) => {
    if (!user) return;
    setError(null);
    try {
      if (skippedDates.has(iso)) {
        await removeMicSkip(mic.uniqueIdentifier, iso);
        setMessage(`${formatIsoDate(iso)} is back on.`);
      } else {
        await addMicSkip({
          micId: mic.uniqueIdentifier,
          date: iso,
          reason: null,
          userId: user.id,
        });
        setMessage(`${formatIsoDate(iso)} is off. It is hidden from Comediq that day.`);
      }
      refresh();
    } catch (toggleError) {
      setError(
        toggleError instanceof Error ? toggleError.message : "Could not change that date.",
      );
    }
  };

  const startEditing = () => {
    setDraft(current);
    setEditing(true);
    setMessage(null);
    setError(null);
  };

  const cancelEditing = () => {
    setDraft(null);
    setEditing(false);
    setConfirmOpen(false);
  };

  /** What the confirm dialog has to explain before anything is written. */
  const pendingRequest = useMemo(
    () => (draft ? changeRequestFromForms(current, draft) : {}),
    [current, draft],
  );
  const hasPendingChanges = Object.keys(pendingRequest).length > 0;

  const save = async () => {
    if (!user || !draft) return;
    setSaving(true);
    setError(null);
    try {
      // 1. The presentation half goes live at once.
      await updateMicPresentation(mic.uniqueIdentifier, {
        tags: draft.tags,
        description: draft.desc.trim() || null,
        coverImageUrl: draft.bannerSeed || null,
        mapIconUrl: draft.iconSeed || null,
      });

      // 2. Anything that changes what a comic turns up to waits for an admin.
      let dayDropped = false;
      if (hasPendingChanges) {
        const result = await requestMicChanges({
          micId: mic.uniqueIdentifier,
          userId: user.id,
          micName: mic.openMic,
          changes: pendingRequest,
        });
        dayDropped = result.dayDropped;
      }

      setMessage(
        hasPendingChanges
          ? `Saved. Your listing keeps running with the current details until the changes are approved.${
              dayDropped ? " The day change could not be filed and needs doing by hand." : ""
            }`
          : "Saved.",
      );
      setDraft(null);
      setEditing(false);
      setConfirmOpen(false);
      refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save that.");
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------- pieces ------------------------------- */

  const banner = (
    <div className="relative overflow-hidden rounded-[22px]" style={{ height: isDesktop ? 260 : 170 }}>
      {mic.coverImageUrl ? (
        <img src={mic.coverImageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <StageTile seed={seed} className="h-full w-full" />
      )}
      <span className="absolute bottom-3 right-3">
        <VenueBubble
          seed={seed}
          initials={initialsOf(seed)}
          iconUrl={mic.mapIconUrl}
          isComediqRun={mic.isComediqRun}
          size={isDesktop ? 58 : 52}
        />
      </span>
      {editing && (
        <button
          type="button"
          className="pencil absolute bottom-2 left-2"
          aria-label="Change the banner photo"
          onClick={() =>
            setError(
              "Uploading a photo is not wired up yet. The banner and map icon fields are here; the upload is the next piece.",
            )
          }
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );

  const titleRow = (
    <div className="mt-3.5 flex items-center justify-between gap-3">
      {editing ? (
        <input
          className="field lf"
          style={{ fontSize: 22 }}
          aria-label="Listing name"
          value={form.name}
          onChange={(event) => setDraft({ ...form, name: event.target.value })}
        />
      ) : (
        <div className="lf text-2xl">{mic.openMic}</div>
      )}
      {!editing && (
        <span className={`status${listing.isPending ? " status--pending" : ""}`}>
          <i />
          {listing.isPending ? "Pending" : "Live"}
        </span>
      )}
    </div>
  );

  const tags = (
    <div className="mt-2.5 flex flex-wrap gap-2.5">
      {form.tags.map((tag) => (
        <span key={tag} className="chip" style={editing ? { paddingRight: 30, position: "relative" } : undefined}>
          {tag}
          {editing && (
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => setDraft({ ...form, tags: form.tags.filter((t) => t !== tag) })}
              className="absolute right-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-0 text-xs"
              style={{ background: "#0B1530", color: "#FFC9C0" }}
            >
              ×
            </button>
          )}
        </span>
      ))}
      {mic.isComediqRun && !editing && <span className="chip">By Comediq</span>}
      {editing && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = newTag.trim();
            if (!value || form.tags.includes(value)) return;
            setDraft({ ...form, tags: [...form.tags, value] });
            setNewTag("");
          }}
        >
          <input
            className="chip chip--add"
            style={{ width: 120 }}
            placeholder="+ Add tag"
            aria-label="Add a tag"
            value={newTag}
            onChange={(event) => setNewTag(event.target.value)}
          />
        </form>
      )}
    </div>
  );

  const description = editing ? (
    <Field label="Description">
      <textarea
        className="field"
        aria-label="Description"
        value={form.desc}
        onChange={(event) => setDraft({ ...form, desc: event.target.value })}
      />
    </Field>
  ) : (
    (mic.description || mic.otherRules) && (
      <p className="mt-3.5 text-sm leading-relaxed" style={{ color: "#DCE3F2" }}>
        {mic.description || mic.otherRules}
      </p>
    )
  );

  const startTimeField = editing && (
    <Field label="Start time">
      <input
        type="time"
        className="field"
        aria-label="Start time"
        value={form.start}
        onChange={(event) => setDraft({ ...form, start: event.target.value })}
      />
      {form.start !== current.start && (
        <p className="mt-1.5 text-xs" style={{ color: "#B0D4F9" }}>
          was {mic.startTime}, needs approval
        </p>
      )}
    </Field>
  );

  const datesCard = (
    <Field label="Upcoming dates">
      {dates.length === 0 ? (
        <div className="card p-4 text-[15px]" style={{ color: "#AEB9D6" }}>
          This listing has no recurring day set, so there is nothing to project.
        </div>
      ) : (
        <div className="card">
          {dates.map((iso) => {
            const isSkipped = skippedDates.has(iso);
            const reason = listing.skips.find((skip) => skip.skip_date === iso)?.reason;
            return (
              <div key={iso} className="row">
                <span>
                  <span className={isSkipped ? "skip-date" : undefined}>{formatIsoDate(iso)}</span>
                  {isSkipped && (
                    <span className="skip-note">
                      {reason ? `Skipped: ${reason}. ` : "Skipped. "}Hidden from Comediq
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  className={`sw${isSkipped ? " sw--off" : ""}`}
                  role="switch"
                  aria-checked={!isSkipped}
                  aria-label={`${formatIsoDate(iso)}, ${isSkipped ? "off" : "on"}`}
                  onClick={() => void toggleDateOnOff(iso)}
                />
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-2 text-xs" style={{ color: "#AEB9D6" }}>
        Turning a date off cancels it and hides the mic from Comediq that day. It takes effect
        straight away.
      </p>
    </Field>
  );

  const analyticsCard = (
    <Field label="Analytics">
      <div className="card grid grid-cols-2">
        {[
          { label: "Saves", value: analytics?.saves },
          { label: "Likes", value: analytics?.likes },
          { label: "Check-ins", value: analytics?.checkIns },
          { label: "Sign-ups", value: analytics?.signUps },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className="px-4 py-3.5"
            style={{
              borderRight: index % 2 === 0 ? "1px solid rgba(255,255,255,.08)" : undefined,
              borderBottom: index < 2 ? "1px solid rgba(255,255,255,.08)" : undefined,
            }}
          >
            <div className="text-xs" style={{ color: "#AEB9D6" }}>
              {stat.label}
            </div>
            <div className="text-2xl font-bold">{stat.value ?? "—"}</div>
          </div>
        ))}
      </div>
      {/* The boards also draw Views, Map taps and Recorded sets. None of the
          three is recorded anywhere yet, and a row of zeros would read as
          "nobody looked", so they are left out until they are real. */}
      <p className="mt-2 text-xs" style={{ color: "#AEB9D6" }}>
        Views, map taps and recorded sets are not counted yet, so they are not shown.
      </p>
    </Field>
  );

  const pendingPanel = listing.request ? (
    <div className="card mt-3 p-4">
      <p className="text-[15px] font-semibold">Waiting for approval</p>
      <p className="mt-1.5 text-sm" style={{ color: "#DCE3F2" }}>
        Your listing keeps running with the current details until these are approved.
      </p>
      <dl className="mt-3 text-sm">
        {Object.entries(listing.request)
          .filter(
            ([key, value]) =>
              value !== null &&
              value !== "" &&
              !["unique_identifier", "mic_id", "user_id", "reviewed", "created_at", "open_mic", "status"].includes(
                key,
              ),
          )
          .map(([key, value]) => (
            <div key={key} className="flex justify-between gap-3 py-1.5">
              <dt style={{ color: "#AEB9D6" }}>{key.replace(/_/g, " ")}</dt>
              <dd className="m-0 text-right font-semibold">{String(value)}</dd>
            </div>
          ))}
      </dl>
    </div>
  ) : (
    <div className="card mt-3 p-4">
      <p className="text-[15px] font-semibold">Nothing pending</p>
      <p className="mt-1.5 text-sm" style={{ color: "#AEB9D6" }}>
        Changes to the venue, day, time, price or signup method show up here while an admin
        looks at them.
      </p>
    </div>
  );

  const header = (
    <div className="flex items-center justify-between gap-3 pb-3">
      <button
        type="button"
        className="btn-ghost"
        aria-label="Back to Manage"
        onClick={() => navigate("/manage")}
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </button>

      {editing ? (
        <>
          <span className="status">
            <i />
            Edit mode
          </span>
          <div className="flex items-center gap-3">
            <button type="button" className="btn-ghost" onClick={cancelEditing}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-solid"
              onClick={() => setConfirmOpen(true)}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="toggle-pill" role="tablist" aria-label="Live or pending">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "live"}
              onClick={() => setTab("live")}
            >
              <i
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#8FC2F5",
                  display: "inline-block",
                }}
              />
              Live
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "pending"}
              onClick={() => setTab("pending")}
            >
              Pending
            </button>
          </div>
          <button type="button" className="btn-ghost" aria-label="Edit listing" onClick={startEditing}>
            <Pencil className="h-5 w-5" aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );

  const notices = (
    <>
      {message && (
        <p className="mt-3 text-sm" role="status" style={{ color: "#B0D4F9" }}>
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 text-sm" role="alert" style={{ color: "#FFC9C0" }}>
          {error}
        </p>
      )}
    </>
  );

  const confirmDialog = confirmOpen && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(4,9,22,.6)" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Save changes"
        className="w-[300px] overflow-hidden rounded-[22px] text-center"
        style={{ background: "#1C2F5A" }}
      >
        <div className="px-5 pb-4 pt-5">
          <div className="text-lg font-bold">Save changes?</div>
          <div className="mt-2 text-sm leading-snug" style={{ color: "#DCE3F2" }}>
            {hasPendingChanges
              ? `Your banner, map icon, tags and description update right away. ${
                  Object.keys(pendingRequest).length === 1 ? "One change" : "Some changes"
                } need a quick approval, and your mic keeps running with the current details until then.`
              : "Your banner, map icon, tags and description update right away."}
          </div>
        </div>
        <div
          className="grid grid-cols-2"
          style={{ borderTop: "1px solid rgba(255,255,255,.12)" }}
        >
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            className="border-0 bg-transparent py-3.5 text-base"
            style={{ color: "#8FC2F5", borderRight: "1px solid rgba(255,255,255,.12)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="border-0 bg-transparent py-3.5 text-base font-bold"
            style={{ color: "#8FC2F5" }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );

  /* ------------------------------- layout ------------------------------- */

  return (
    <div className="mg-root mg-screen">
      <SEO title={`${mic.openMic} | Manage | Comediq`} description="Manage your listing on Comediq." />

      {isDesktop ? (
        <div className="mx-auto max-w-6xl px-7 py-5" style={{ padding: "22px 28px" }}>
          {header}
          <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-6">
            <section>
              {banner}
              {titleRow}
              {tags}
              {startTimeField}
              {description}
              {notices}
            </section>
            <section className="flex flex-col gap-4">
              {tab === "live" || editing ? (
                <>
                  {datesCard}
                  {analyticsCard}
                </>
              ) : (
                pendingPanel
              )}
            </section>
          </div>
        </div>
      ) : (
        <div style={{ padding: "48px 18px 120px" }}>
          {header}
          {banner}
          {titleRow}
          {tags}
          {startTimeField}
          {description}
          {notices}
          {tab === "live" || editing ? (
            <>
              {datesCard}
              {analyticsCard}
            </>
          ) : (
            pendingPanel
          )}
        </div>
      )}

      {confirmDialog}
    </div>
  );
}
