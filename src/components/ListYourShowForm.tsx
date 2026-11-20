import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { submitShowListing } from "@/api/audienceShows";

export interface ShowDraft {
  platform: string;
  source_url: string;
  title: string;
  show_date: string;
  show_time: string;
  venue_name: string;
  venue_address: string;
  borough: string;
  image_url: string;
  description: string;
  ticket_url: string;
}

export const DRAFT_KEY = "comediq:list-your-show-draft";

const BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
const BLUE = "#29478F";

const fieldClass =
  "w-full rounded-xl border border-[#29478F]/20 bg-white px-4 py-3 text-base text-[#29478F] placeholder:text-[#29478F]/40 focus:outline-none focus:ring-2 focus:ring-[#29478F]/40";
const labelClass = "mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-[#29478F]/70";

const todayNY = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());

/** Review step: biggest field first (title), then when and where, then the small stuff. Every field is editable. */
export default function ListYourShowForm({
  draft,
  missing,
  onChange,
}: {
  draft: ShowDraft;
  missing: boolean;
  onChange: (d: ShowDraft) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof ShowDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    onChange({ ...draft, [k]: e.target.value });

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!draft.title.trim() || !draft.venue_name.trim() || !draft.show_date || !draft.show_time) {
      setError("Add a title, date, time and venue before posting.");
      return;
    }
    if (draft.show_date < todayNY()) {
      setError("That date has already passed. Check the date and try again.");
      return;
    }
    if (!user) {
      // Keep what they have, send them to log in, and the page restores it on return.
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch { /* storage blocked: they re-paste after logging in */ }
      navigate(`/auth/sign-in?next=${encodeURIComponent("/list-your-show")}`);
      return;
    }
    setPosting(true);
    try {
      await submitShowListing(user.id, {
        title: draft.title.trim(),
        venue_name: draft.venue_name.trim(),
        venue_address: draft.venue_address.trim() || null,
        borough: draft.borough || null,
        show_date: draft.show_date,
        show_time: draft.show_time,
        doors_time: null,
        ticket_price: null,
        ticket_url: draft.ticket_url.trim() || draft.source_url,
        instagram_handle: null,
        show_type: null,
        host_name: null,
        description: draft.description.trim() || null,
        lineup: null,
        image_url: draft.image_url.trim() || null,
        repeat: "none",
        laughpass_free_ticket: false,
        laughpass_ticket_limit: null,
        confirm_active_agreed: false,
        source_platform: draft.platform,
        source_url: draft.source_url,
        is_independently_produced: true,
      });
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch { /* ignore */ }
      toast({ title: "Your show is live!", description: "Fans can now find it on the Laugh tab." });
      navigate("/laugh");
    } catch (err) {
      const code = (err as { code?: string })?.code;
      const message = err instanceof Error ? err.message : String((err as { message?: string })?.message ?? err);
      setError(
        code === "23505" || /source_url/i.test(message)
          ? "This link is already posted on Comediq. Each ticket link can be listed once."
          : /source_platform|source_url|schema cache/i.test(message)
            ? "Show listing is being set up. Please try again soon."
            : message,
      );
    } finally {
      setPosting(false);
    }
  };

  return (
    <form onSubmit={post} className="mx-auto max-w-2xl space-y-5 text-left">
      <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: BLUE }}>
        Review your show
      </p>
      <p className="text-[#29478F]/80">
        {missing
          ? "We couldn't read everything from your link. Fill in what's missing, then post."
          : "Here's what we pulled from your ticket page. Fix anything before it goes live."}
      </p>

      <div>
        <label htmlFor="lys-title" className={labelClass}>Show title</label>
        <input id="lys-title" value={draft.title} onChange={set("title")} className={`${fieldClass} !py-4 text-xl font-extrabold sm:text-2xl`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lys-date" className={labelClass}>Date</label>
          <input id="lys-date" type="date" value={draft.show_date} onChange={set("show_date")} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="lys-time" className={labelClass}>Start time</label>
          <input id="lys-time" type="time" value={draft.show_time} onChange={set("show_time")} className={fieldClass} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lys-venue" className={labelClass}>Venue</label>
          <input id="lys-venue" value={draft.venue_name} onChange={set("venue_name")} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="lys-borough" className={labelClass}>Borough</label>
          <select id="lys-borough" value={draft.borough} onChange={set("borough")} className={fieldClass}>
            <option value="">Select</option>
            {BOROUGHS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="lys-address" className={labelClass}>Address</label>
        <input id="lys-address" value={draft.venue_address} onChange={set("venue_address")} className={fieldClass} />
      </div>

      <div>
        <label htmlFor="lys-desc" className={labelClass}>Description</label>
        <textarea id="lys-desc" rows={5} value={draft.description} onChange={set("description")} className={fieldClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label htmlFor="lys-image" className={labelClass}>Flyer image link</label>
          <input id="lys-image" value={draft.image_url} onChange={set("image_url")} placeholder="https://" className={fieldClass} />
        </div>
        {draft.image_url && (
          <img src={draft.image_url} alt="Flyer preview" className="h-24 w-24 rounded-xl object-cover" referrerPolicy="no-referrer" />
        )}
      </div>

      <div>
        <label htmlFor="lys-ticket" className={labelClass}>Ticket link</label>
        <input id="lys-ticket" value={draft.ticket_url} onChange={set("ticket_url")} className={fieldClass} />
      </div>

      {error && <p role="alert" className="rounded-xl bg-[#29478F]/10 px-4 py-3 text-sm font-semibold text-[#29478F]">{error}</p>}

      <button
        type="submit"
        disabled={posting}
        className="w-full rounded-xl bg-[#29478F] px-6 py-4 text-base font-extrabold text-[#F3ECDF] transition hover:bg-[#223a75] disabled:opacity-60 sm:w-auto"
      >
        {posting ? "Posting…" : user ? "Post my show" : "Log in to post my show"}
      </button>
    </form>
  );
}
