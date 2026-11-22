// Add a listing v2 (Storytime-style redesign)
// UI preview only: nothing here writes to the database yet. Hosts' listings and
// skipped dates live in local state so the flow can be tried end to end.
// Design source: docs/design/storytime-redesign/ListingFlow.dc.html
// Build notes: docs/design/storytime-redesign/IMPLEMENTATION.md
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";

/* ------------------------------------------------------------------ */
/* Data and helpers (same rules as the design file)                    */
/* ------------------------------------------------------------------ */

type Venue = { name: string; address: string; hood: string };
const VENUES: Venue[] = [
  { name: "The Rusty Mic", address: "214 E 12th St", hood: "East Village" },
  { name: "Basement Lab", address: "88 Avenue A", hood: "Alphabet City" },
  { name: "Corner Stage", address: "301 E 9th St", hood: "East Village" },
  { name: "Pickle Room", address: "57 2nd Ave", hood: "East Village" },
  { name: "Late Set Bar", address: "12 Avenue B", hood: "Alphabet City" },
  { name: "Second Floor", address: "140 E 14th St", hood: "Union Square" },
];
const DAYS: [string, string][] = [
  ["Sun", "Sunday"], ["Mon", "Monday"], ["Tue", "Tuesday"], ["Wed", "Wednesday"],
  ["Thu", "Thursday"], ["Fri", "Friday"], ["Sat", "Saturday"],
];

const EMPTY: any = {
  name: "", venueQuery: "", venue: null, addVenue: false, newVenueName: "", newVenueAddress: "",
  day: "", start: "", end: "", freq: "Weekly", date: "", dates: [], calOpen: false, calMonth: "",
  autoNote: "", verify: false, emailOk: false, skips: [], skipReasons: {}, note: "",
  setLen: "", otherMins: "", cost: "", price: "", signup: "", link: "", order: "", host: "",
  remind: true, doors: "", ticket: "", ig: "", desc: "", image: false, lineup: "Public", laughpass: false,
};
const MIC_SAMPLE = {
  ...EMPTY, name: "Rusty Thursdays", venue: VENUES[0], day: "Thu", start: "19:00", end: "21:00",
  freq: "Weekly", dates: ["2026-11-05", "2026-11-12", "2026-11-19"], skips: ["2026-11-26"],
  skipReasons: { "2026-11-26": "Holiday" }, verify: true, emailOk: true, setLen: "5", cost: "Free",
  signup: "Online link", link: "comediq.com/r/rusty-thursdays", host: "@rustymicnyc",
};
const SHOW_SAMPLE = {
  ...EMPTY, name: "Basement Bangers", venue: VENUES[1], date: "2026-11-06", start: "20:00", doors: "19:30",
  freq: "Weekly", price: "$15", ticket: "posh.vip/e/basement-bangers", ig: "@basementbangers",
  desc: "Six comics, one tight hour, cheap drinks.", image: true, laughpass: true,
  skips: ["2026-11-27"], skipReasons: { "2026-11-27": "Venue closed" },
};
const SEED = [
  { id: "rusty", kind: "mic", f: MIC_SAMPLE },
  { id: "bangers", kind: "show", f: SHOW_SAMPLE },
];
const LOOK: Record<string, [string, string]> = {
  "The Rusty Mic": ["#6E2B22", "#121A33"], "Basement Lab": ["#2E3A4F", "#1E4894"],
  "Corner Stage": ["#5B4A2E", "#B4472E"], "Pickle Room": ["#2F4A3A", "#2F6B45"],
  "Late Set Bar": ["#3B2F4F", "#5B3FA0"], "Second Floor": ["#4F3A2A", "#0E7C86"],
};

const pad = (n: number) => (n < 10 ? "0" : "") + n;
const isoOf = (d: Date) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const parseIso = (s: string) => new Date(s + "T12:00:00");
const md = (s: string) => { const d = parseIso(s); return d.getMonth() + 1 + "/" + d.getDate(); };
function fmtTime(t: string) {
  if (!t) return "";
  const [hh, mm] = t.split(":");
  let h = parseInt(hh, 10);
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return h + ":" + mm + ap;
}
function fmtDate(d: string) {
  if (!d) return "";
  const x = parseIso(d);
  if (isNaN(x.getTime())) return d;
  return x.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// Picked dates -> guessed day and cadence
function detectCadence(dates: string[]) {
  if (!dates.length) return { autoNote: "" };
  const ds = dates.map(parseIso);
  const wds = new Set(ds.map((d) => d.getDay()));
  if (wds.size !== 1) return { autoNote: "" };
  const wd = ds[0].getDay();
  const out: any = { day: DAYS[wd][0] };
  if (ds.length < 2) { out.autoNote = "Set day to " + DAYS[wd][1] + " from your date"; return out; }
  const gaps = ds.slice(1).map((d, i) => Math.round((d.getTime() - ds[i].getTime()) / 86400000));
  if (gaps.every((g) => g === 7)) { out.freq = "Weekly"; out.autoNote = "Set to weekly on " + DAYS[wd][1] + "s from your dates"; }
  else if (gaps.every((g) => g === 14)) { out.freq = "Every other week"; out.autoNote = "Set to every other " + DAYS[wd][1] + " from your dates"; }
  else {
    const ord = ["1st", "2nd", "3rd", "4th", "5th"];
    const nths: string[] = [];
    ds.forEach((d) => { const n = ord[Math.ceil(d.getDate() / 7) - 1]; if (!nths.includes(n)) nths.push(n); });
    out.freq = "Monthly";
    out.note = nths.join(" and ") + " " + DAYS[wd][0];
    out.autoNote = "Set to monthly, " + out.note + ", from your dates";
  }
  return out;
}

// Every upcoming date from picks + cadence (skips are NOT removed here)
function projectDates(f: any, todayIso: string, horizonDays: number) {
  const picks: string[] = [...(f.dates || [])].sort();
  const out = new Set<string>(picks.filter((p) => p >= todayIso));
  const wd = DAYS.findIndex((d) => d[0] === f.day);
  if (f.freq === "One time" || wd < 0) return [...out].sort();
  const a = parseIso(picks[0] || todayIso);
  while (a.getDay() !== wd) a.setDate(a.getDate() + 1);
  const end = new Date(parseIso(todayIso).getTime() + horizonDays * 86400000);
  if (f.freq === "Weekly" || f.freq === "Every other week") {
    const step = f.freq === "Weekly" ? 7 : 14;
    for (const d = new Date(a); d <= end; d.setDate(d.getDate() + step)) { const s = isoOf(d); if (s >= todayIso) out.add(s); }
  } else if (f.freq === "Monthly") {
    const src = picks.length ? picks.map(parseIso) : [a];
    const nths: number[] = [];
    src.forEach((d) => { const n = Math.ceil(d.getDate() / 7); if (!nths.includes(n)) nths.push(n); });
    for (let m = 0; m < 5; m++) {
      const monthStart = new Date(a.getFullYear(), a.getMonth() + m, 1);
      nths.forEach((n) => {
        const d = new Date(monthStart);
        while (d.getDay() !== wd) d.setDate(d.getDate() + 1);
        d.setDate(d.getDate() + (n - 1) * 7);
        const s = isoOf(d);
        if (d.getMonth() === monthStart.getMonth() && s >= todayIso && d <= end) out.add(s);
      });
    }
  }
  return [...out].sort();
}
function summarizeDates(dates: string[]) {
  if (!dates.length) return "Pick the next 1 to 3 times it happens";
  let lastM = "";
  return dates.map((s) => {
    const d = parseIso(s);
    const m = d.toLocaleDateString("en-US", { month: "short" });
    const t = m === lastM ? String(d.getDate()) : m + " " + d.getDate();
    lastM = m;
    return t;
  }).join(", ");
}

function validate(path: string, f: any) {
  const e: any = {};
  if (!f.name.trim()) e.name = "Add a name";
  if (f.addVenue) {
    if (!f.newVenueName.trim()) e.newVenueName = "Add the venue name";
    if (!f.newVenueAddress.trim()) e.newVenueAddress = "Add the address";
  } else if (!f.venue) e.venue = "Pick a venue or add a new one";
  if (!f.start) e.start = "Add a start time";
  if (path === "mic") {
    if (f.freq !== "One time" && !f.day) e.day = "Pick the day it runs";
    if (f.freq !== "Weekly" && !(f.dates || []).length) e.dates = "Pick the date or dates on the calendar";
    if (!f.setLen) e.setLen = "Pick a length";
    if (f.setLen === "Other" && !f.otherMins) e.otherMins = "How many minutes?";
    if (!f.cost) e.cost = "Pick a cost";
    if (f.cost === "Paid" && !f.price.trim()) e.price = "Add the price";
    if (!f.signup) e.signup = "Pick how comics sign up";
    if (f.signup === "Online link" && !f.link.trim()) e.link = "Paste the signup link";
    if (!f.verify) e.verify = "Turn this on so comics can trust the listing";
  } else {
    if (!f.date) e.date = "Pick a date";
    if (!f.price.trim()) e.price = "Add the price";
    if (!f.ticket.trim()) e.ticket = "Paste the ticket link";
  }
  return e;
}

/* ------------------------------------------------------------------ */
/* Styles (class names match the design components)                    */
/* ------------------------------------------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
.lv2{font-family:'DM Sans',system-ui,sans-serif;color:#F4EDE1;background:#1E4894;min-height:100vh}
.lv2 *{box-sizing:border-box}
.lv2 .wrap{max-width:520px;margin:0 auto;min-height:100vh;position:relative;padding:20px 16px 120px}
.lv2 .logo-font{font-family:Archivo,'DM Sans',sans-serif;font-stretch:112%;font-weight:800;letter-spacing:-.03em;line-height:1.05}
.lv2 .icon-button{width:44px;height:44px;border-radius:50%;border:1px solid transparent;background:none;color:#F4EDE1;display:flex;align-items:center;justify-content:center;cursor:pointer}
.lv2 .icon-button--ring{border-color:rgba(255,255,255,.35)}
.lv2 .step-dots{display:flex;gap:6px;align-items:center}
.lv2 .step-dot{width:8px;height:8px;border-radius:4px;background:rgba(244,237,225,.3)}
.lv2 .step-dot--done{background:#8FC2F5}.lv2 .step-dot--on{width:24px;background:#8FC2F5}
.lv2 .row-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.lv2 .row-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.lv2 .row-price{display:grid;grid-template-columns:104px minmax(0,1fr);gap:10px}
.lv2 .row-desc{display:grid;grid-template-columns:minmax(0,1fr) 112px;gap:10px}
.lv2 .field{display:flex;flex-direction:column;gap:5px;min-width:0}
.lv2 .field-label{font-size:13px;font-weight:600;color:#DCE3F2;display:flex;justify-content:space-between;align-items:baseline;gap:6px;white-space:nowrap}
.lv2 .field-optional{font-size:12px;font-weight:400;color:#AEB9D6}
.lv2 .field-link{background:none;border:0;padding:0;color:#8FC2F5;font:inherit;font-size:12px;font-weight:600;cursor:pointer;text-decoration:underline;text-underline-offset:2px}
.lv2 .text-input{width:100%;height:44px;border-radius:12px;border:2px solid transparent;background:#2B56A6;color:#F4EDE1;font:inherit;font-size:15px;padding:0 12px;outline:none;color-scheme:dark}
.lv2 .text-input[type=time],.lv2 .text-input[type=date]{font-size:14px;padding:0 8px}
.lv2 .text-input::placeholder{color:rgba(244,237,225,.6)}
.lv2 .text-input:focus{border-color:#8FC2F5}
.lv2 .text-input--error{border-color:#FFB4A8}
.lv2 .field-hint{margin:0;font-size:12px;color:#AEB9D6;line-height:1.35}
.lv2 .field-error{margin:0;font-size:12px;color:#FFC9C0}
.lv2 .chip-group{display:flex;gap:2px;padding:3px;border-radius:12px;background:#2B56A6;border:2px solid transparent;min-height:44px}
.lv2 .chip-group--error{border-color:#FFB4A8}
.lv2 .chip{flex:1 1 0;min-width:0;height:34px;border-radius:9px;border:0;background:none;color:#F4EDE1;font:inherit;font-size:13px;font-weight:600;cursor:pointer;padding:0 4px;white-space:nowrap}
.lv2 .chip--on{background:#8FC2F5;color:#08142B}
.lv2 .card-row{display:flex;align-items:center;gap:12px;width:100%;min-height:52px;padding:8px 12px;background:none;border:0;color:#F4EDE1;font:inherit;text-align:left;cursor:pointer}
.lv2 .switch{flex:0 0 44px;width:44px;height:26px;border-radius:13px;background:rgba(244,237,225,.32);position:relative;transition:background .2s}
.lv2 .switch::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s}
.lv2 .switch--on{background:#3DBE74}.lv2 .switch--on::after{left:21px}
.lv2 .checkbox{flex:0 0 22px;width:22px;height:22px;border-radius:6px;border:2px solid rgba(244,237,225,.7);display:flex;align-items:center;justify-content:center}
.lv2 .checkbox--on{background:#8FC2F5;border-color:#8FC2F5}
.lv2 .panel{border-radius:12px;background:#173A7A;border:1px solid rgba(255,255,255,.12)}
.lv2 .primary-button{width:100%;height:52px;border-radius:999px;border:0;background:#8FC2F5;color:#08142B;font:inherit;font-size:17px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}
.lv2 .primary-button--publish{background:#3DBE74}
.lv2 .text-link{background:none;border:0;padding:0;color:#8FC2F5;font:inherit;font-size:15px;font-weight:600;min-height:44px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.lv2 .bottom-bar{position:fixed;left:0;right:0;bottom:0;z-index:20;padding:18px 16px 24px;background:linear-gradient(rgba(30,72,148,0),#1E4894 24%)}
.lv2 .bottom-bar>div{max-width:488px;margin:0 auto}
.lv2 .choice-card{display:flex;flex-direction:column;align-items:flex-start;gap:6px;width:100%;padding:22px;border-radius:24px;background:#173A7A;border:1px solid rgba(255,255,255,.14);color:#F4EDE1;font:inherit;text-align:left;cursor:pointer}
.lv2 .venue-option{display:flex;gap:10px;align-items:center;width:100%;min-height:48px;padding:6px 12px;background:none;border:0;border-top:1px solid rgba(255,255,255,.1);color:#F4EDE1;text-align:left;font:inherit;cursor:pointer}
.lv2 .cal{background:#173A7A;border-radius:14px;padding:10px;display:flex;flex-direction:column;gap:6px}
.lv2 .cal-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px}
.lv2 .cal-wd{font-size:11px;font-weight:600;color:#AEB9D6;text-align:center}
.lv2 .cal-nav{width:36px;height:36px;border-radius:50%;border:0;background:#2B56A6;color:#F4EDE1;cursor:pointer}
.lv2 .cal-nav:disabled{opacity:.35;cursor:default}
.lv2 .cal-day{height:38px;border-radius:10px;border:0;background:none;color:#F4EDE1;font:inherit;font-size:14px;font-weight:600;cursor:pointer;padding:0}
.lv2 .cal-day--today{box-shadow:inset 0 0 0 1.5px #8FC2F5}
.lv2 .cal-day--on{background:#8FC2F5;color:#08142B}
.lv2 .cal-day--sched{background:rgba(143,194,245,.22);color:#B0D4F9}
.lv2 .cal-day--skip{background:rgba(255,180,168,.16);color:#FFC9C0;text-decoration:line-through}
.lv2 .cal-day:disabled{opacity:.3;cursor:default}
.lv2 .spin{width:22px;height:22px;border-radius:50%;border:3px solid rgba(8,20,43,.25);border-top-color:#08142B;animation:lv2spin .8s linear infinite}
@keyframes lv2spin{to{transform:rotate(360deg)}}
@media (min-width: 900px){.lv2 .wrap{padding-top:48px}}
`;

/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */

const Icon = {
  back: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>,
  close: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>,
  pin: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8FC2F5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  check: (c = "#08142B") => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>,
};

function Label({ htmlFor, children, optional, right }: any) {
  return (
    <div className="field-label">
      {htmlFor ? <label htmlFor={htmlFor}>{children}</label> : <span>{children}</span>}
      {optional ? <span className="field-optional">{optional}</span> : null}
      {right || null}
    </div>
  );
}
function Err({ msg }: any) { return msg ? <p className="field-error" role="alert">{msg}</p> : null; }

function ChipGroup({ value, options, labels, onPick, error }: any) {
  return (
    <div className={"chip-group" + (error ? " chip-group--error" : "")}>
      {options.map((o: string, i: number) => (
        <button key={o} type="button" aria-pressed={value === o} className={"chip" + (value === o ? " chip--on" : "")} onClick={(e) => onPick(o, e.currentTarget)}>
          {labels ? labels[i] : o}
        </button>
      ))}
    </div>
  );
}

function Stage({ wall, h = 170 }: any) {
  return (
    <svg viewBox="0 0 300 170" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: h, display: "block" }} aria-hidden="true">
      <rect width="300" height="170" fill={wall} />
      <path d="M0 22H300M0 44H300M0 66H300M0 88H300M0 110H300M0 132H300M0 154H300" stroke="rgba(0,0,0,.18)" strokeWidth="1.5" />
      <path d="M110 0H190L240 170H60Z" fill="rgba(255,236,190,.16)" />
      <path d="M150 156V86M136 158H164" stroke="#111" strokeWidth="4" strokeLinecap="round" />
      <rect x="143" y="66" width="14" height="24" rx="7" fill="#111" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ListingV2() {
  const navigate = useNavigate();
  const auth: any = useAuth();
  const user = auth?.user;
  const hostName = user?.user_metadata?.username || user?.username || user?.email?.split("@")[0] || "you";

  const [step, setStep] = useState(0); // 0 chooser, 1 form, 2 preview, 3 success, 4 my listings, 5 manage dates
  const [path, setPath] = useState<"mic" | "show">("mic");
  const [f, setF] = useState<any>({ ...EMPTY });
  const [errors, setErrors] = useState<any>({});
  const [publishing, setPublishing] = useState(false);
  const [listings, setListings] = useState<any[]>(SEED);
  const [manageId, setManageId] = useState("rusty");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  const patch = (o: any) => {
    setF((prev: any) => ({ ...prev, ...o }));
    setErrors((prev: any) => {
      const n = { ...prev };
      Object.keys(o).forEach((k) => delete n[k]);
      if (o.venue || o.addVenue !== undefined) delete n.venue;
      return n;
    });
  };

  // Jump to the next empty field after the one just finished
  const advance = (fromEl: Element | null) => {
    setTimeout(() => {
      const form = formRef.current;
      if (!form) return;
      const inputs = Array.from(form.querySelectorAll("input, textarea")) as HTMLInputElement[];
      const visible = inputs.filter((x) => !x.disabled && x.offsetParent !== null);
      const after = fromEl && fromEl.isConnected ? visible.filter((x) => fromEl.compareDocumentPosition(x) & 4) : visible;
      const next = after.find((x) => !x.value);
      if (next) next.focus();
    }, 60);
  };
  const pick = (k: string) => (o: string, el: Element) => { patch({ [k]: o }); advance(el); };
  const text = (k: string) => (e: any) => patch({ [k]: e.target.value });
  const timeJump = (k: string) => (e: any) => { patch({ [k]: e.target.value }); if (e.target.value) advance(e.target); };
  const cls = (k: string) => "text-input" + (errors[k] ? " text-input--error" : "");

  const isMic = path === "mic";
  const todayIso = isoOf(new Date());

  /* calendar + projection */
  const picks: string[] = f.dates || [];
  const skips: string[] = f.skips || [];
  const sched = projectDates(f, todayIso, 150);
  const upcoming = sched.filter((s) => !skips.includes(s)).slice(0, 4);
  const futureSkips = skips.filter((s) => s >= todayIso).sort();
  const calMonth = f.calMonth || (picks[0] ? picks[0].slice(0, 7) : todayIso.slice(0, 7));
  const cy = parseInt(calMonth.slice(0, 4), 10);
  const cm = parseInt(calMonth.slice(5, 7), 10);
  const firstOfMonth = new Date(cy, cm - 1, 1);
  const daysIn = new Date(cy, cm, 0).getDate();
  const toggleDate = (iso: string) => {
    if (picks.includes(iso)) { const cur = picks.filter((x) => x !== iso); patch({ dates: cur, ...detectCadence(cur) }); return; }
    if (skips.includes(iso)) { patch({ skips: skips.filter((x) => x !== iso) }); return; }
    if (sched.includes(iso)) { patch({ skips: [...skips, iso] }); return; }
    if (picks.length >= 3) return;
    const cur = [...picks, iso].sort();
    patch({ dates: cur, ...detectCadence(cur) });
  };

  /* venue */
  const q = (f.venueQuery || "").trim().toLowerCase();
  const results = q ? VENUES.filter((v) => v.name.toLowerCase().includes(q) || v.address.toLowerCase().includes(q)) : [];
  const v: Venue = f.addVenue ? { name: f.newVenueName || "New venue", address: f.newVenueAddress, hood: "New York" } : f.venue || { name: "", address: "", hood: "" };

  /* preview data */
  const dayFull = (DAYS.find((d) => d[0] === f.day) || ["", ""])[1];
  const lenText = f.setLen === "Other" ? (f.otherMins || "?") + " min" : f.setLen ? f.setLen + " min" : "";
  const costText = f.cost === "Paid" ? f.price : f.cost;
  const timeRange = fmtTime(f.start) + (f.end ? " to " + fmtTime(f.end) : "");
  const firstDate = picks[0] || "";
  let micWhen = "";
  if (f.freq === "Weekly") micWhen = "Every " + dayFull + (firstDate ? ", starting " + fmtDate(firstDate) : "");
  else if (f.freq === "Every other week") micWhen = "Every other " + dayFull + " from " + fmtDate(firstDate);
  else if (f.freq === "Monthly") micWhen = "Monthly, " + (f.note || summarizeDates(picks));
  else micWhen = "One time, " + fmtDate(firstDate);
  const look = LOOK[v.name] || ["#3A3F55", "#1E4894"];
  const short = (v.name || "New venue").replace(/^The\s+/i, "").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const reasonsNow = f.skipReasons || {};
  const skipBanner = futureSkips.length ? "Skipped on " + futureSkips.map((s) => fmtDate(s) + (reasonsNow[s] ? " (" + reasonsNow[s].toLowerCase() + ")" : "")).join(", ") + ". Not listed on Comediq that day." : "";
  const rows = isMic
    ? [
        { k: "When", v: micWhen },
        { k: "Next up", v: upcoming.length ? upcoming.slice(0, 3).map(md).join(", ") : "TBD" },
        ...(futureSkips.length ? [{ k: "Skipping", v: futureSkips.map(md).join(", ") }] : []),
        { k: "Time", v: timeRange || "TBD" },
        { k: "Set length", v: lenText || "TBD" },
        { k: "Cost", v: costText || "TBD" },
      ]
    : [
        { k: "Date", v: fmtDate(f.date) + (f.freq !== "One time" ? ", " + f.freq.toLowerCase() : "") },
        { k: "Doors", v: fmtTime(f.doors) || "Not listed" },
        { k: "Show", v: fmtTime(f.start) || "TBD" },
        { k: "Price", v: f.price || "TBD" },
      ];
  const badges = isMic
    ? f.signup === "Lineup order" && f.order ? ["Lineup: " + f.order] : f.signup === "In person" ? ["In person signup"] : []
    : [f.lineup === "Secret" ? "Secret lineup" : "Lineup listed", ...(f.laughpass ? ["Free for LaughPass members"] : [])];
  const signupLine = f.signup === "Online link" ? "Online at " + f.link : f.signup === "In person" ? "In person at the venue" : f.signup === "Lineup order" ? "Lineup order" + (f.order ? ": " + f.order : "") : "Not set yet";

  /* host tools */
  const occOf = (l: any) => projectDates(l.kind === "show" ? { dates: l.f.date ? [l.f.date] : [], day: l.f.date ? DAYS[parseIso(l.f.date).getDay()][0] : "", freq: l.f.freq } : l.f, todayIso, 120);
  const dayNameOf = (l: any) => (l.kind === "show" ? (l.f.date ? DAYS[parseIso(l.f.date).getDay()][1] : "") : (DAYS.find((d) => d[0] === l.f.day) || ["", ""])[1]);
  const cadenceOf = (l: any) => (l.f.freq === "One time" ? "One time, " + fmtDate(l.kind === "show" ? l.f.date : (l.f.dates || [])[0]) : l.f.freq + " on " + dayNameOf(l) + "s");
  const venueOf = (l: any) => (l.f.venue ? l.f.venue.name : l.f.newVenueName || "New venue");
  const updateListing = (id: string, fn: (f2: any) => any) => setListings((ls) => ls.map((l) => (l.id === id ? { ...l, f: fn({ ...l.f }) } : l)));
  const ml = listings.find((l) => l.id === manageId) || listings[0];

  /* actions */
  const reset = () => { setStep(0); setF({ ...EMPTY }); setErrors({}); setPublishing(false); };
  const start = (p: "mic" | "show") => { setPath(p); setF(p === "show" ? { ...EMPTY, freq: "One time" } : { ...EMPTY }); setErrors({}); setStep(1); };
  const toPreview = () => {
    const e = validate(path, f);
    if (Object.keys(e).length) {
      setErrors(e);
      setTimeout(() => {
        const bad = formRef.current?.querySelector(".text-input--error, .chip-group--error") as HTMLElement | null;
        if (bad) { bad.scrollIntoView({ block: "center", behavior: "smooth" }); if (bad.tagName === "INPUT") bad.focus(); }
      }, 50);
      return;
    }
    setStep(2);
  };
  const publish = () => {
    if (publishing) return;
    setPublishing(true);
    setTimeout(() => {
      setListings((ls) => [{ id: "new-" + ls.length, kind: path, f: { ...f } }, ...ls]);
      setPublishing(false);
      setStep(3);
    }, 1000);
  };

  /* ---------------- render helpers ---------------- */

  const Header = ({ onBack, dots }: any) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
      <button className="icon-button" onClick={onBack} aria-label="Back">{Icon.back}</button>
      {dots ? (
        <div className="step-dots" role="img" aria-label={"Step " + dots + " of 2"}>
          {[1, 2].map((i) => <span key={i} className={"step-dot" + (i === dots ? " step-dot--on" : i < dots ? " step-dot--done" : "")} />)}
        </div>
      ) : <span />}
      <button className="icon-button" onClick={reset} aria-label="Close">{Icon.close}</button>
    </div>
  );

  const VenueField = () =>
    !f.addVenue ? (
      <div className="field">
        <Label htmlFor="lv2-venue" right={<button type="button" className="field-link" onClick={() => { patch({ addVenue: true, newVenueName: f.newVenueName || f.venueQuery, venue: null }); advance(null); }}>Not listed? Add it</button>}>Venue</Label>
        {f.venue ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, height: 44, padding: "0 6px 0 12px", borderRadius: 12, background: "#2B56A6" }}>
            {Icon.pin}
            <div style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 15 }}>
              <strong style={{ fontWeight: 600 }}>{f.venue.name}</strong> <span style={{ color: "#C9D3EA", fontSize: 13 }}>{f.venue.address}</span>
            </div>
            <button type="button" className="field-link" style={{ fontSize: 13, padding: "0 8px", minHeight: 36 }} onClick={() => patch({ venue: null })}>Change</button>
          </div>
        ) : (
          <>
            <input id="lv2-venue" className={cls("venue")} placeholder="Search venue name or address" value={f.venueQuery} onChange={text("venueQuery")} autoComplete="off" />
            {results.length > 0 && (
              <div className="panel" role="listbox" aria-label="Matching venues" style={{ overflow: "hidden" }}>
                {results.map((r) => (
                  <button key={r.name} type="button" role="option" aria-selected={false} className="venue-option" onClick={() => { patch({ venue: r, venueQuery: "" }); advance(null); }}>
                    {Icon.pin}<span style={{ fontSize: 15, fontWeight: 600 }}>{r.name}</span><span style={{ fontSize: 13, color: "#C9D3EA" }}>{r.address}</span>
                  </button>
                ))}
              </div>
            )}
            {q && results.length === 0 && (
              <div role="status" className="panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 8px 8px 12px" }}>
                <span style={{ fontSize: 13, color: "#DCE3F2" }}>No venue matches "{f.venueQuery}"</span>
                <button type="button" className="chip chip--on" style={{ flex: "0 0 auto", padding: "0 12px" }} onClick={() => patch({ addVenue: true, newVenueName: f.venueQuery, venue: null })}>Add it</button>
              </div>
            )}
            <Err msg={errors.venue} />
          </>
        )}
      </div>
    ) : (
      <div className="field">
        <Label right={<button type="button" className="field-link" onClick={() => patch({ addVenue: false })}>Search instead</button>}>New venue</Label>
        <div className="row-2">
          <div className="field"><input aria-label="Venue name" className={cls("newVenueName")} placeholder="Venue name" value={f.newVenueName} onChange={text("newVenueName")} /><Err msg={errors.newVenueName} /></div>
          <div className="field"><input aria-label="Address" className={cls("newVenueAddress")} placeholder="Street address" value={f.newVenueAddress} onChange={text("newVenueAddress")} /><Err msg={errors.newVenueAddress} /></div>
        </div>
      </div>
    );

  const HostBar = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "-4px 0 12px", fontSize: 13, color: "#DCE3F2" }}>
      <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#8FC2F5", color: "#08142B", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{hostName.slice(0, 2).toUpperCase()}</span>
      <span>Listing as <strong style={{ color: "#F4EDE1", fontWeight: 600 }}>{hostName}</strong>. Only you can edit or cancel dates.</span>
    </div>
  );

  const Calendar = () => {
    const cells: any[] = [];
    for (let i = 0; i < firstOfMonth.getDay(); i++) cells.push(<span key={"b" + i} />);
    for (let d = 1; d <= daysIn; d++) {
      const iso = cy + "-" + pad(cm) + "-" + pad(d);
      const on = picks.includes(iso);
      const skip = !on && skips.includes(iso);
      const sch = !on && !skip && sched.includes(iso);
      const off = iso < todayIso || (!on && !skip && !sch && picks.length >= 3);
      cells.push(
        <button key={iso} type="button" disabled={off} aria-pressed={on}
          aria-label={fmtDate(iso) + (on ? ", picked" : skip ? ", skipped" : sch ? ", scheduled, tap to skip" : "")}
          className={"cal-day" + (on ? " cal-day--on" : skip ? " cal-day--skip" : sch ? " cal-day--sched" : "") + (iso === todayIso ? " cal-day--today" : "")}
          onClick={() => toggleDate(iso)}>{d}</button>
      );
    }
    const shift = (n: number) => { const d = new Date(cy, cm - 1 + n, 1); patch({ calMonth: d.getFullYear() + "-" + pad(d.getMonth() + 1) }); };
    return (
      <div className="cal" role="group" aria-label="Pick dates">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button type="button" className="cal-nav" disabled={calMonth <= todayIso.slice(0, 7)} onClick={() => shift(-1)} aria-label="Previous month">‹</button>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{firstOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
          <button type="button" className="cal-nav" onClick={() => shift(1)} aria-label="Next month">›</button>
        </div>
        <div className="cal-grid" aria-hidden="true">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((w) => <span key={w} className="cal-wd">{w}</span>)}</div>
        <div className="cal-grid">{cells}</div>
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#AEB9D6" }}>
          <span>■ <span style={{ color: "#8FC2F5" }}>Picked</span></span><span>■ <span style={{ color: "#B0D4F9" }}>Scheduled</span></span><span>■ <span style={{ color: "#FFC9C0" }}>Skipped</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span className="field-hint">Pick up to 3 dates. Cancelled one week? Tap a scheduled date to skip it.</span>
          <button type="button" className="field-link" style={{ fontSize: 14, minHeight: 36 }} onClick={() => { patch({ calOpen: false }); advance(null); }}>Done</button>
        </div>
      </div>
    );
  };

  const MicForm = () => (
    <form ref={formRef} noValidate onSubmit={(e) => e.preventDefault()} onKeyDown={(e: any) => { if (e.key === "Enter" && e.target.tagName === "INPUT") { e.preventDefault(); advance(e.target); } }} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <div className="row-2">
        <div className="field"><Label htmlFor="lv2-name">Mic name</Label><input id="lv2-name" className={cls("name")} placeholder="Rusty Thursdays" value={f.name} onChange={text("name")} /><Err msg={errors.name} /></div>
        <div className="field"><Label htmlFor="lv2-host" optional="Optional">Host Instagram</Label><input id="lv2-host" className="text-input" placeholder="@host" value={f.host} onChange={text("host")} /></div>
      </div>
      {VenueField()}
      <div className="field">
        <Label optional={f.freq === "Weekly" ? "Optional" : ""}>Next dates</Label>
        <button type="button" className={cls("dates")} style={{ display: "flex", alignItems: "center", gap: 8, textAlign: "left", cursor: "pointer" }} aria-expanded={!!f.calOpen} onClick={() => patch({ calOpen: !f.calOpen })}>
          <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{summarizeDates(picks)}</span>▾
        </button>
        <Err msg={errors.dates} />
        {f.calOpen && Calendar()}
        {f.autoNote ? <p className="field-hint" style={{ color: "#DCE3F2", display: "flex", gap: 6, alignItems: "center" }}>{Icon.check("#3DBE74")}{f.autoNote}</p> : null}
      </div>
      <div className="field">
        <Label>Day</Label>
        <ChipGroup value={f.day} options={DAYS.map((d) => d[0])} onPick={pick("day")} error={errors.day} />
        <Err msg={errors.day} />
      </div>
      <div className="row-2">
        <div className="field"><Label htmlFor="lv2-start">Start</Label><input id="lv2-start" type="time" className={cls("start")} value={f.start} onChange={timeJump("start")} /><Err msg={errors.start} /></div>
        <div className="field"><Label htmlFor="lv2-end" optional="Optional">End</Label><input id="lv2-end" type="time" className="text-input" value={f.end} onChange={timeJump("end")} /></div>
      </div>
      <div className="field">
        <Label>How often</Label>
        <ChipGroup value={f.freq} options={["Weekly", "Every other week", "Monthly", "One time"]} labels={["Weekly", "Biweekly", "Monthly", "Once"]} onPick={pick("freq")} />
        {upcoming.length > 0 && f.freq !== "One time" && <p className="field-hint" style={{ color: "#DCE3F2" }}>(So the next {upcoming.length} dates your mic will happen are {upcoming.map(md).join(", ")})</p>}
        {futureSkips.length > 0 && <p className="field-hint" style={{ color: "#FFC9C0" }}>Skipping {futureSkips.map(md).join(", ")} (tap it on the calendar to bring it back)</p>}
      </div>
      {f.freq === "Monthly" && <div className="field"><Label htmlFor="lv2-note" optional="Optional">Pattern</Label><input id="lv2-note" className="text-input" placeholder="1st and 3rd Thu" value={f.note} onChange={text("note")} /></div>}
      <div className="row-2">
        <div className="field"><Label>Set length</Label><ChipGroup value={f.setLen} options={["3", "5", "7", "Other"]} onPick={pick("setLen")} error={errors.setLen} /><Err msg={errors.setLen} /></div>
        <div className="field"><Label>Cost</Label><ChipGroup value={f.cost} options={["Free", "Paid", "Bringer"]} onPick={pick("cost")} error={errors.cost} /><Err msg={errors.cost} /></div>
      </div>
      {(f.setLen === "Other" || f.cost === "Paid") && (
        <div className="row-2">
          <div className="field">{f.setLen === "Other" && <><Label htmlFor="lv2-mins">Minutes</Label><input id="lv2-mins" type="number" inputMode="numeric" className={cls("otherMins")} placeholder="4" value={f.otherMins} onChange={text("otherMins")} /><Err msg={errors.otherMins} /></>}</div>
          <div className="field">{f.cost === "Paid" && <><Label htmlFor="lv2-price">Price</Label><input id="lv2-price" className={cls("price")} placeholder="$5 or 1 drink" value={f.price} onChange={text("price")} /><Err msg={errors.price} /></>}</div>
        </div>
      )}
      <div className="field"><Label>Signup</Label><ChipGroup value={f.signup} options={["Online link", "In person", "Lineup order"]} onPick={pick("signup")} error={errors.signup} /><Err msg={errors.signup} /></div>
      {f.signup === "Online link" && <div className="field"><Label htmlFor="lv2-link">Signup link</Label><input id="lv2-link" type="url" className={cls("link")} placeholder="Paste the link" value={f.link} onChange={text("link")} /><Err msg={errors.link} /></div>}
      {f.signup === "Lineup order" && <div className="field"><Label>How is the order set?</Label><ChipGroup value={f.order} options={["Order of arrival", "Bucket / random", "Host chooses"]} labels={["Arrival", "Bucket", "Host picks"]} onPick={pick("order")} /></div>}
      <div className="panel" style={{ border: errors.verify ? "2px solid #FFB4A8" : undefined }}>
        <button type="button" role="switch" aria-checked={f.verify} className="card-row" onClick={() => patch({ verify: !f.verify })}>
          <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>I'll verify this mic is still active</span><span style={{ display: "block", fontSize: 12, color: "#C9D3EA" }}>Confirm it's running at least once a month</span></span>
          <span className={"switch" + (f.verify ? " switch--on" : "")} aria-hidden="true" />
        </button>
        <div style={{ height: 1, background: "rgba(255,255,255,.1)", margin: "0 12px" }} />
        <button type="button" role="checkbox" aria-checked={f.emailOk} className="card-row" onClick={() => patch({ emailOk: !f.emailOk })}>
          <span className={"checkbox" + (f.emailOk ? " checkbox--on" : "")} aria-hidden="true">{f.emailOk && Icon.check()}</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>Email me reminders to confirm my mic is active</span>
        </button>
      </div>
      <Err msg={errors.verify} />
    </form>
  );

  const ShowForm = () => (
    <form ref={formRef} noValidate onSubmit={(e) => e.preventDefault()} onKeyDown={(e: any) => { if (e.key === "Enter" && e.target.tagName === "INPUT") { e.preventDefault(); advance(e.target); } }} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <div className="row-2">
        <div className="field"><Label htmlFor="lv2-sname">Show name</Label><input id="lv2-sname" className={cls("name")} placeholder="Basement Bangers" value={f.name} onChange={text("name")} /><Err msg={errors.name} /></div>
        <div className="field"><Label htmlFor="lv2-ig" optional="Optional">Instagram</Label><input id="lv2-ig" className="text-input" placeholder="@instagram" value={f.ig} onChange={text("ig")} /></div>
      </div>
      {VenueField()}
      <div className="row-3">
        <div className="field"><Label htmlFor="lv2-date">Date</Label><input id="lv2-date" type="date" className={cls("date")} value={f.date} onChange={timeJump("date")} /><Err msg={errors.date} /></div>
        <div className="field"><Label htmlFor="lv2-sstart">Show starts</Label><input id="lv2-sstart" type="time" className={cls("start")} value={f.start} onChange={timeJump("start")} /><Err msg={errors.start} /></div>
        <div className="field"><Label htmlFor="lv2-doors" optional="Optional">Doors</Label><input id="lv2-doors" type="time" className="text-input" value={f.doors} onChange={timeJump("doors")} /></div>
      </div>
      <div className="row-price">
        <div className="field"><Label htmlFor="lv2-tprice">Price</Label><input id="lv2-tprice" className={cls("price")} placeholder="$15" value={f.price} onChange={text("price")} /><Err msg={errors.price} /></div>
        <div className="field"><Label htmlFor="lv2-tlink">Ticket link</Label><input id="lv2-tlink" type="url" className={cls("ticket")} placeholder="Eventbrite, Posh or your site" value={f.ticket} onChange={text("ticket")} /><Err msg={errors.ticket} /></div>
      </div>
      <div className="row-2">
        <div className="field"><Label>How often</Label><ChipGroup value={f.freq} options={["One time", "Weekly", "Monthly"]} labels={["Once", "Weekly", "Monthly"]} onPick={pick("freq")} /></div>
        <div className="field"><Label>Lineup</Label><ChipGroup value={f.lineup} options={["Public", "Secret"]} onPick={pick("lineup")} /></div>
      </div>
      <p className="field-hint" style={{ marginTop: -5, textAlign: "right" }}>{f.lineup === "Secret" ? "Names are revealed to people who check in" : "Shows with names listed get more check-ins"}</p>
      <div className="row-desc">
        <div className="field"><Label htmlFor="lv2-desc" optional="Optional">Description</Label><input id="lv2-desc" className="text-input" placeholder="One line about the show" value={f.desc} onChange={text("desc")} /></div>
        <div className="field"><Label optional="Suggested">Image</Label>
          <button type="button" onClick={() => patch({ image: !f.image })} style={{ height: 44, borderRadius: 12, border: 0, font: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer", background: f.image ? "#8FC2F5" : "#2B56A6", color: f.image ? "#08142B" : "#F4EDE1" }}>{f.image ? "Added" : "+ Add"}</button>
        </div>
      </div>
      <div className="panel">
        <button type="button" role="checkbox" aria-checked={f.laughpass} className="card-row" onClick={() => patch({ laughpass: !f.laughpass })}>
          <span className={"checkbox" + (f.laughpass ? " checkbox--on" : "")} aria-hidden="true">{f.laughpass && Icon.check()}</span>
          <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>Offer LaughPass members a free ticket.</span><span style={{ display: "block", fontSize: 12, color: "#C9D3EA" }}>Members get in free while regular tickets are left, until the show sells out. Fills seats on slow nights.</span></span>
        </button>
      </div>
      <div className="panel">
        <button type="button" role="switch" aria-checked={f.remind} className="card-row" onClick={() => patch({ remind: !f.remind })}>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Remind me to confirm this is still happening</span>
          <span className={"switch" + (f.remind ? " switch--on" : "")} aria-hidden="true" />
        </button>
      </div>
      <p className="field-hint" style={{ textAlign: "center" }}>Free through Dec 31. From January: $100/month for weekly shows, $45/month for monthly shows.</p>
    </form>
  );

  const chip = { background: "#fff", border: "1px solid #E4E7EE", borderRadius: 999, padding: "5px 10px", fontSize: 13, fontWeight: 500 } as const;
  const Preview = () => (
    <article style={{ background: "#F4EDE1", color: "#08142B", borderRadius: 28, padding: "16px 16px 18px", boxShadow: "0 16px 40px rgba(0,0,0,.25)" }}>
      <div style={{ position: "relative", borderRadius: 22, overflow: "hidden" }}>
        <Stage wall={look[0]} />
        <div style={{ position: "absolute", right: 12, bottom: 12, width: 56, height: 56, borderRadius: "50%", border: "3px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 17, background: look[1] }}>{short}</div>
      </div>
      <h2 className="logo-font" style={{ margin: "16px 0 10px", fontSize: 26 }}>{f.name || (isMic ? "Untitled mic" : "Untitled show")}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        <span style={chip}>{v.hood || "New York"}</span>
        <span style={chip}>Starts {fmtTime(f.start) || "TBD"}</span>
        {badges.map((b) => <span key={b} style={chip}>{b}</span>)}
      </div>
      {!isMic && f.desc && <p style={{ margin: "0 0 10px", fontSize: 14, lineHeight: 1.5, color: "#4A5160" }}>{f.desc}</p>}
      {skipBanner && <div role="note" style={{ background: "#FCEBD2", color: "#6B3A00", borderRadius: 14, padding: "10px 12px", marginBottom: 10, fontSize: 13, fontWeight: 600 }}>{skipBanner}</div>}
      <div style={{ background: "#fff", borderRadius: 20, padding: 14, border: "1px solid #EEF0F4" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid #E4E7EE" }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{isMic ? "Open mic" : "Show"}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1E4894" }}>New</span>
        </div>
        {isMic && <><div style={{ marginTop: 10, fontSize: 15, fontWeight: 600 }}>Signup</div><div style={{ fontSize: 14, color: "#4A5160", marginTop: 2 }}>{signupLine}</div></>}
        <div style={{ marginTop: 10, fontSize: 15, fontWeight: 600 }}>Details</div>
        <dl style={{ margin: "2px 0 0", fontSize: 14 }}>
          {rows.map((r) => (
            <div key={r.k} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "7px 0", borderBottom: "1px solid #EEF0F4" }}>
              <dt style={{ color: "#5F6675" }}>{r.k}</dt><dd style={{ margin: 0, fontWeight: 600, textAlign: "right" }}>{r.v}</dd>
            </div>
          ))}
        </dl>
        <div style={{ marginTop: 12, height: 46, borderRadius: 999, background: "#1E4894", color: "#F4EDE1", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{isMic ? (f.signup === "Online link" ? "Register" : "Details") : "Get tickets"}</div>
      </div>
    </article>
  );

  /* ---------------- screens ---------------- */

  let body: any = null;
  let bottom: any = null;

  if (step === 0) {
    body = (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginTop: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, lineHeight: 1.15 }}>What are you listing?</h1>
            <p style={{ margin: "8px 0 0", fontSize: 15, color: "#E2E8F5" }}>Pick one. It takes about a minute.</p>
          </div>
          <button className="icon-button icon-button--ring" aria-label="Close" onClick={() => navigate(-1)}>{Icon.close}</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 28 }}>
          <button className="choice-card" onClick={() => start("mic")}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#8FC2F5" }}>For comedians</span>
            <span style={{ fontSize: 24, fontWeight: 700 }}>An open mic</span>
            <span style={{ fontSize: 15, lineHeight: 1.45, color: "#C9D3EA" }}>Comics find it, register and get up. Add the venue, day, time, set length and cover.</span>
          </button>
          <button className="choice-card" onClick={() => start("show")}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#8FC2F5" }}>For audiences</span>
            <span style={{ fontSize: 24, fontWeight: 700 }}>A show</span>
            <span style={{ fontSize: 15, lineHeight: 1.45, color: "#C9D3EA" }}>People find it and RSVP or grab tickets. Add the venue, date, time and ticket link.</span>
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 18 }}><button className="text-link" onClick={() => setStep(4)}>Manage my listings</button></div>
        <p style={{ margin: "10px 0 0", textAlign: "center", fontSize: 15, color: "#C9D3EA" }}>Questions? <a href="https://instagram.com/comediq.us" style={{ color: "#8FC2F5" }}>DM @comediq.us</a></p>
      </>
    );
  } else if (step === 1) {
    body = (
      <>
        <Header onBack={() => setStep(0)} dots={1} />
        <h1 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 700 }}>{isMic ? "List an open mic" : "List a show"}</h1>
        {HostBar()}
        {isMic ? MicForm() : ShowForm()}
      </>
    );
    bottom = <button className="primary-button" onClick={toPreview}>Preview listing</button>;
  } else if (step === 2) {
    body = (
      <>
        <Header onBack={() => setStep(1)} dots={2} />
        <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700 }}>Preview</h1>
        <p style={{ margin: "0 0 16px", fontSize: 15, color: "#C9D3EA" }}>{isMic ? "This is the page comics will see when they open your mic." : "This is the page people will see when they open your show."}</p>
        {Preview()}
        <div style={{ textAlign: "center", marginTop: 8 }}><button className="text-link" onClick={() => setStep(1)}>Edit</button></div>
      </>
    );
    bottom = (
      <>
        <p style={{ margin: "0 0 10px", textAlign: "center", fontSize: 14, color: "#C9D3EA" }}>Your listing goes live right away. Please double-check the details.</p>
        <button className="primary-button primary-button--publish" onClick={publish} disabled={publishing}>{publishing ? <span className="spin" role="status" aria-label="Publishing" /> : "Publish"}</button>
      </>
    );
  } else if (step === 3) {
    body = (
      <>
        <div style={{ display: "flex", justifyContent: "flex-end" }}><button className="icon-button" onClick={reset} aria-label="Close">{Icon.close}</button></div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", margin: "8px 0 24px" }}>
          <span style={{ width: 72, height: 72, borderRadius: "50%", background: "#3DBE74", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#08142B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
          </span>
          <h1 style={{ margin: "18px 0 6px", fontSize: 28, fontWeight: 700 }}>{isMic ? "Your mic is live" : "Your show is live"}</h1>
          <p style={{ margin: 0, fontSize: 15, color: "#C9D3EA", maxWidth: 300 }}>{isMic ? "Comics can find it in Find Mics right now. Share it so your regulars know." : "People can find it in Laugh right now. Share it to fill seats."}</p>
        </div>
        <div style={{ background: "#F4EDE1", color: "#08142B", borderRadius: 24, padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: "0 0 84px", borderRadius: 18, overflow: "hidden" }}><Stage wall={look[0]} h={84} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="logo-font" style={{ fontSize: 18 }}>{f.name}</div>
            <div style={{ fontSize: 14, color: "#4A5160", marginTop: 4 }}>{v.name}, {v.hood}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{isMic ? micWhen : fmtDate(f.date)}</div>
          </div>
        </div>
      </>
    );
    bottom = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <button className="primary-button">Share to Instagram</button>
        <div style={{ display: "flex", gap: 20 }}>
          <button className="text-link" onClick={() => navigate("/perform")}>Back to mics</button>
          <button className="text-link" onClick={() => setStep(4)}>Manage dates</button>
        </div>
      </div>
    );
  } else if (step === 4) {
    body = (
      <>
        <Header onBack={reset} />
        <h1 style={{ margin: "4px 0 10px", fontSize: 26, fontWeight: 700 }}>My listings</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {listings.map((l) => {
            const occ = occOf(l);
            const sk = (l.f.skips || []).filter((x: string) => x >= todayIso).sort();
            const nx = occ.filter((x) => !sk.includes(x)).slice(0, 3);
            return (
              <article key={l.id} className="panel" style={{ padding: 14, borderRadius: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span className="logo-font" style={{ fontSize: 18 }}>{l.f.name || "Untitled"}</span>
                  <span style={{ padding: "4px 10px", borderRadius: 999, background: "#2B56A6", fontSize: 12, fontWeight: 600 }}>{l.kind === "mic" ? "Open mic" : "Show"}</span>
                </div>
                <div style={{ fontSize: 13, color: "#C9D3EA", marginTop: 6 }}>{cadenceOf(l)} · {venueOf(l)}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{nx.length ? "Next: " + nx.map(md).join(", ") : "No upcoming dates"}</div>
                {sk.length > 0 && <div style={{ fontSize: 13, color: "#FFC9C0", marginTop: 2 }}>Skipping {sk.map(md).join(", ")}</div>}
                <button className="chip chip--on" style={{ width: "100%", height: 42, marginTop: 12, fontSize: 14 }} onClick={() => { setManageId(l.id); setStep(5); }}>Manage dates</button>
              </article>
            );
          })}
        </div>
        <div style={{ textAlign: "center", marginTop: 12 }}><button className="text-link" onClick={reset}>List something new</button></div>
      </>
    );
  } else if (step === 5) {
    const mSkips: string[] = ml.f.skips || [];
    const mReasons = ml.f.skipReasons || {};
    body = (
      <>
        <Header onBack={() => setStep(4)} />
        <div style={{ fontSize: 14, color: "#C9D3EA" }}>Manage dates</div>
        <h1 className="logo-font" style={{ margin: "4px 0", fontSize: 24 }}>{ml.f.name}</h1>
        <div style={{ fontSize: 13, color: "#C9D3EA" }}>{cadenceOf(ml)} · {venueOf(ml)}</div>
        <p className="field-hint" style={{ margin: "12px 0 14px", fontSize: 13, color: "#DCE3F2" }}>Turn a date off if it's cancelled. It won't be listed on Comediq that day, and your page will show it's skipped.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {occOf(ml).slice(0, 6).map((iso) => {
            const off = mSkips.includes(iso);
            return (
              <div key={iso} className="panel" style={{ borderRadius: 14, padding: "6px 0" }}>
                <button type="button" role="switch" aria-checked={!off} className="card-row" style={{ minHeight: 44 }}
                  onClick={() => updateListing(ml.id, (f2) => { const s = [...(f2.skips || [])]; const i = s.indexOf(iso); if (i >= 0) s.splice(i, 1); else s.push(iso); f2.skips = s; return f2; })}>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: 15, fontWeight: 600, ...(off ? { textDecoration: "line-through", color: "#FFC9C0" } : {}) }}>{fmtDate(iso)}</span>
                    <span style={{ display: "block", fontSize: 12, color: off ? "#FFC9C0" : "#AEB9D6" }}>{off ? "Cancelled" + (mReasons[iso] ? ": " + mReasons[iso].toLowerCase() : "") + ". Hidden from Comediq this day" : "Happening"}</span>
                  </span>
                  <span className={"switch" + (off ? "" : " switch--on")} aria-hidden="true" />
                </button>
                {off && (
                  <div style={{ padding: "0 12px 6px" }}>
                    <ChipGroup value={mReasons[iso]} options={["Holiday", "Host away", "Venue closed", "Other"]} onPick={(r: string) => updateListing(ml.id, (f2) => { f2.skipReasons = { ...(f2.skipReasons || {}), [iso]: r }; return f2; })} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
    bottom = <button className="primary-button" onClick={() => setStep(4)}>Done</button>;
  }

  return (
    <div className="lv2">
      <SEO title="Add a listing | Comediq" description="List an open mic for comedians, or a show for audiences." />
      <style>{CSS}</style>
      <div className="wrap">{body}</div>
      {bottom && <div className="bottom-bar"><div>{bottom}</div></div>}
    </div>
  );
}
