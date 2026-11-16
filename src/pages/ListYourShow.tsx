import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Link2 } from "lucide-react";
import SEO from "@/components/SEO";
import Wordmark from "@/components/Wordmark";
import ListYourShowForm, { DRAFT_KEY, type ShowDraft } from "@/components/ListYourShowForm";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LIST_YOUR_SHOW_STATS, isAcceptedLink } from "@/config/listYourShow";

const BLUE = "#29478F";
const CREAM = "#F3ECDF";
const LIGHT = "#9DB8F0";
const FONT = "'Potato Sans', 'Nunito', sans-serif";

const Label = ({ children, color = LIGHT }: { children: React.ReactNode; color?: string }) => (
  <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color }}>{children}</p>
);

const STEPS = [
  ["Paste your ticket link.", "Eventbrite, Posh, Luma or Partiful."],
  ["We fill in the details.", "Title, date, time, venue, flyer and description. Fix anything before it goes live."],
  ["Go live on Comediq.", "Fans find it next to the mics and shows they already check, and buy tickets on your page."],
] as const;

const PERKS = [
  ["You keep your ticketing.", "Paid tickets still sell on your own page."],
  ["Members fill the gaps.", "Free seats stop once your show sells out."],
  ["Fans see your show first.", "LaughPass members pay us to browse independently produced shows on Comediq.com every week."],
] as const;

const emptyDraft = (platform: string, source_url: string): ShowDraft => ({
  platform, source_url, title: "", show_date: "", show_time: "", venue_name: "", venue_address: "",
  borough: "", image_url: "", description: "", ticket_url: source_url,
});

export default function ListYourShow() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<ShowDraft | null>(null);
  const [missing, setMissing] = useState(false);

  // Coming back from log in: restore what they had.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        setDraft(JSON.parse(saved));
        setTimeout(() => reviewRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch { /* ignore */ }
  }, []);

  const scrollToInput = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => inputRef.current?.focus(), 400);
  };

  const parse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const url = link.trim();
    setError("");
    if (!url) return setError("Paste the link to your show first.");
    if (!isAcceptedLink(url)) {
      return setError("We can read Eventbrite, Posh, Luma and Partiful links. Paste a link from one of those.");
    }
    setBusy(true);
    try {
      // One call per paste. Nothing is refetched while they edit.
      const { data, error: fnError } = await supabase.functions.invoke("parse-show-link", { body: { url } });
      if (fnError || !data) {
        let message = "We couldn't read that link right now. Try again in a moment.";
        try {
          const body = await (fnError as { context?: Response }).context?.json();
          if (body?.error) message = body.error;
        } catch { /* keep default */ }
        setError(message);
        return;
      }
      const f = data.fields ?? {};
      const d: ShowDraft = {
        ...emptyDraft(data.platform, data.source_url),
        title: f.title ?? "", show_date: f.show_date ?? "", show_time: f.show_time ?? "",
        venue_name: f.venue_name ?? "", venue_address: f.venue_address ?? "", borough: f.borough ?? "",
        image_url: f.image_url ?? "", description: f.description ?? "",
      };
      setMissing(!d.title || !d.show_date || !d.show_time || !d.venue_name);
      if (data.error) setError(data.error);
      setDraft(d);
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* ignore */ }
      setTimeout(() => reviewRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="lys min-h-screen overflow-x-hidden pb-20 md:pb-0" style={{ background: CREAM, color: BLUE, fontFamily: FONT }}>
      {/* The site stylesheet sets headings to condensed Archivo and forces dark form fields; undo both here. */}
      <style>{`
        .lys h1, .lys h2 { font-family: ${FONT} !important; font-stretch: 100% !important; text-transform: none !important; letter-spacing: -0.01em !important; }
        .lys form input, .lys form textarea, .lys form select { color: ${BLUE} !important; background-color: #fff !important; border-width: 1px !important; box-shadow: none !important; backdrop-filter: none !important; }
        .lys form input::placeholder, .lys form textarea::placeholder { color: rgba(41,71,143,0.55) !important; opacity: 1 !important; }
        .lys form .lys-link { background-color: transparent !important; border-width: 0 !important; }
      `}</style>
      <SEO
        title="List Your Indie Comedy Show on Comediq | Comediq"
        description="Paste your Eventbrite, Posh, Luma or Partiful link and list your show on Comediq.com. Free through the end of 2026."
      />

      {/* 1. Hero */}
      <section className="relative" style={{ background: BLUE, color: CREAM }}>
        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Wordmark />
          <nav className="flex items-center gap-4 text-sm font-bold sm:gap-6" aria-label="Main">
            <Link to="/perform" className="hidden sm:inline">Perform</Link>
            {!user && <Link to={`/auth/sign-in?next=${encodeURIComponent("/list-your-show")}`}>Log in</Link>}
            <button type="button" onClick={scrollToInput} className="rounded-xl px-4 py-2" style={{ background: CREAM, color: BLUE }}>
              List your show
            </button>
          </nav>
        </header>

        <div className="mx-auto max-w-6xl px-5 pb-10 pt-8 sm:px-8 sm:pt-12 md:pb-16">
          <div className="max-w-2xl">
            <Label>For independent comedy producers</Label>
            <h1 className="mt-4 text-5xl font-black leading-[1.02] sm:text-6xl md:text-7xl">
              Fill your indie show with NYC comedy fans.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed opacity-95">
              Keep selling on Eventbrite, Posh, Luma or Partiful. Paste your link and we pull in the title, date, venue, flyer and ticket link, then list it as a show on Comediq.com.
            </p>

            <form onSubmit={parse} className="mt-8 flex flex-col gap-2 rounded-2xl p-2 shadow-lg sm:flex-row sm:items-center" style={{ background: CREAM }}>
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <Link2 className="h-5 w-5 shrink-0" style={{ color: BLUE }} aria-hidden="true" />
                <input
                  ref={inputRef}
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="Paste your Eventbrite, Posh, Luma or Partiful link"
                  aria-label="Link to your show"
                  inputMode="url"
                  className="lys-link min-w-0 flex-1 py-3 text-base outline-none"
                  style={{ color: BLUE }}
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl px-6 py-3 text-base font-extrabold text-[#F3ECDF] disabled:opacity-60"
                style={{ background: BLUE }}
              >
                {busy ? "Reading your link…" : "Post my show →"}
              </button>
            </form>
            {error && <p role="alert" className="mt-3 text-sm font-semibold">{error}</p>}
            <p className="mt-3 text-sm" style={{ color: LIGHT }}>Free to list through the end of 2026.</p>
          </div>
        </div>
        <img
          src="/landing/character.png"
          alt="The Comediq mascot"
          className="ml-auto block h-44 w-auto pr-5 sm:h-56 md:absolute md:bottom-0 md:right-8 md:h-72 md:pr-0 lg:h-80"
        />
      </section>

      {/* Review step, once a link has been read */}
      {draft && (
        <section ref={reviewRef} className="px-5 py-12 sm:px-8" style={{ background: CREAM }}>
          <ListYourShowForm draft={draft} missing={missing} onChange={(d) => setDraft(d)} />
        </section>
      )}

      {/* 2. How it works */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 sm:px-8 md:grid-cols-[auto_1fr] md:gap-16 md:py-20">
        <div className="mx-auto w-[240px] rounded-[2.2rem] p-2.5 shadow-2xl" style={{ background: "#0B1B3F" }} aria-hidden="true">
          <div className="overflow-hidden rounded-[1.7rem]" style={{ background: "#0F2554" }}>
            <div className="px-4 pb-8 pt-6 text-center" style={{ background: BLUE, color: CREAM }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: LIGHT }}>Weekly Comediq bringer</p>
              <p className="mt-3 text-3xl font-black leading-none">Sundays Show</p>
              <p className="mt-3 text-[11px] font-bold">Rodney's Comedy Club</p>
            </div>
            <div className="space-y-2 p-4" style={{ color: CREAM }}>
              <p className="text-base font-extrabold">Sundays Show</p>
              <p className="text-[10px] opacity-80">Rodney's Comedy Club · Upper East Side<br />Sundays at 5:30 PM</p>
              <p className="rounded-lg bg-white/10 p-2 text-[10px] leading-snug">Pulled from your ticket page: title, time, venue, flyer and description.</p>
              <p className="text-center text-[10px] opacity-70">Tickets on Eventbrite ↗</p>
              <p className="rounded-lg py-2.5 text-center text-xs font-extrabold" style={{ background: CREAM, color: BLUE }}>Get tickets</p>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-4xl font-black leading-tight sm:text-5xl">One link in. A Comediq show page out.</h2>
          <ol className="mt-8 space-y-6">
            {STEPS.map(([head, body], i) => (
              <li key={head} className="flex gap-4">
                <span className="text-4xl font-black leading-none">{i + 1}</span>
                <p className="text-base leading-relaxed"><strong className="font-extrabold">{head}</strong> {body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 3. LaughPass */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-8 rounded-[2rem] p-6 sm:p-10 md:grid-cols-2 md:gap-12" style={{ background: BLUE, color: CREAM }}>
          <div>
            <Label>LaughPass</Label>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Empty seats? We'll send you a crowd.</h2>
            <p className="mt-5 leading-relaxed opacity-95">
              LaughPass members get free entry to indie shows that need seats filled, as long as regular tickets are still available. You get a fuller room and a better show. They get a reason to come back every week.
            </p>
          </div>
          <div className="space-y-3">
            {PERKS.map(([head, body], i) => (
              <div key={head} className="rounded-2xl p-4" style={i === 2 ? { background: CREAM, color: BLUE } : { background: "rgba(255,255,255,0.12)" }}>
                <p className="font-extrabold">{head}</p>
                <p className="mt-1 text-sm opacity-90">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Stats */}
      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-12 sm:px-8 md:grid-cols-3">
        {LIST_YOUR_SHOW_STATS.map((s, i) => (
          <div key={s.value} className="rounded-3xl p-6 sm:p-8" style={i === 2 ? { background: BLUE, color: CREAM } : { background: "#fff" }}>
            <p className="text-5xl font-black sm:text-6xl">{s.value}</p>
            <p className="mt-3 font-bold">{s.label}</p>
          </div>
        ))}
      </section>

      {/* 5. Closing CTA */}
      <section className="mx-auto max-w-3xl px-5 pb-20 pt-6 text-center sm:px-8">
        <h2 className="text-4xl font-black leading-tight sm:text-5xl">We built the comedy audience so you don't have to.</h2>
        <p className="mx-auto mt-5 max-w-lg leading-relaxed">
          Comedians and fans already use Comediq to find what's on tonight. Your show belongs in that list.
        </p>
        <button type="button" onClick={scrollToInput} className="mt-8 rounded-xl px-8 py-4 text-base font-extrabold" style={{ background: BLUE, color: CREAM }}>
          Paste your link
        </button>
      </section>
    </main>
  );
}
