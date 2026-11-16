// Pure parsing helpers for parse-show-link. No Deno APIs here so it can be tested in Node.

export type Platform = "eventbrite" | "posh" | "luma" | "partiful";

export interface ParsedShow {
  title: string | null;
  show_date: string | null; // YYYY-MM-DD, New York time
  show_time: string | null; // HH:MM, New York time
  venue_name: string | null;
  venue_address: string | null;
  borough: string | null;
  image_url: string | null;
  description: string | null;
}

const HOSTS: Record<string, Platform> = {
  "eventbrite.com": "eventbrite",
  "posh.vip": "posh",
  "lu.ma": "luma",
  "luma.com": "luma",
  "partiful.com": "partiful",
};

/** Returns the platform for an allowed host (including subdomains like www.), else null. */
export function platformForHost(hostname: string): Platform | null {
  const host = hostname.toLowerCase();
  for (const [domain, platform] of Object.entries(HOSTS)) {
    if (host === domain || host.endsWith(`.${domain}`)) return platform;
  }
  return null;
}

/** Strips tracking params and hash so the same event always has the same source_url. */
export function normalizeUrl(raw: string): string {
  const u = new URL(raw);
  u.hash = "";
  u.search = "";
  const path = u.pathname.replace(/\/+$/, "");
  return `${u.protocol}//${u.hostname.toLowerCase()}${path}`;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

function stripHtml(s: string): string {
  return decodeEntities(s.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<[^>]+>/g, ""))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// deno-lint-ignore no-explicit-any
type Json = any;

/** All JSON-LD objects in the page, flattened (arrays and @graph unpacked). */
function jsonLdObjects(html: string): Json[] {
  const out: Json[] = [];
  const push = (v: Json) => {
    if (Array.isArray(v)) v.forEach(push);
    else if (v && typeof v === "object") {
      out.push(v);
      if (v["@graph"]) push(v["@graph"]);
    }
  };
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      push(JSON.parse(m[1].trim()));
    } catch { /* ignore malformed block */ }
  }
  if (out.length === 0) {
    // Posh ships its JSON-LD inside an escaped Next.js payload, not as a script tag.
    const un = html.replace(/\\"/g, '"').replace(/\\\\[nt]/g, " ").replace(/\\[nt]/g, " ").replace(/\\\\/g, "\\");
    let from = 0;
    for (let guard = 0; guard < 5; guard++) {
      const at = un.indexOf('"@context"', from);
      if (at < 0) break;
      from = at + 10;
      const start = un.lastIndexOf("{", at);
      const end = balancedEnd(un, start);
      if (start < 0 || end < 0) continue;
      try {
        push(JSON.parse(un.slice(start, end + 1)));
      } catch { /* ignore */ }
    }
  }
  return out;
}

function balancedEnd(s: string, start: number): number {
  let depth = 0;
  let inStr = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === "\\") i++;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return i;
  }
  return -1;
}

function isEvent(o: Json): boolean {
  const t = o?.["@type"];
  return [].concat(t ?? []).some((x: string) => typeof x === "string" && /Event$/.test(x));
}

function meta(html: string, key: string): string | null {
  for (const m of html.matchAll(/<meta\s[^>]*>/gi)) {
    const tag = m[0];
    const name = tag.match(/(?:property|name)=["']([^"']+)["']/i)?.[1];
    if (name?.toLowerCase() !== key) continue;
    const content = tag.match(/content=["']([^"']*)["']/i)?.[1];
    if (content) return decodeEntities(content).trim();
  }
  return null;
}

const NY = "America/New_York";

/** Splits an ISO string into New York date and time. Offsets are honoured; bare times are kept as written. */
export function toNewYork(iso: string): { date: string; time: string } | null {
  if (!iso) return null;
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(iso);
  if (!hasZone) {
    const m = iso.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/);
    return m ? { date: m[1], time: m[2] ?? "" } : null;
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: NY, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(d).map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export function guessBorough(text: string): string | null {
  const t = text.toLowerCase();
  if (/staten island/.test(t)) return "Staten Island";
  if (/brooklyn/.test(t)) return "Brooklyn";
  if (/bronx/.test(t)) return "Bronx";
  if (/queens|astoria|long island city|flushing|jamaica, ny|ridgewood|sunnyside/.test(t)) return "Queens";
  if (/manhattan|new york, ny|new york, new york/.test(t)) return "Manhattan";
  return null;
}

function firstImage(img: Json): string | null {
  const v = Array.isArray(img) ? img[0] : img;
  const url = typeof v === "string" ? v : v?.url;
  return typeof url === "string" && /^https?:\/\//.test(url) ? url : null;
}

function addressText(addr: Json): string | null {
  if (!addr) return null;
  if (typeof addr === "string") return addr;
  const street = String(addr.streetAddress ?? "").trim();
  // Some platforms already put the whole address in streetAddress.
  if (street && /\b[A-Z]{2}\b.*\d{5}|,/.test(street) && addr.addressLocality && street.toLowerCase().includes(String(addr.addressLocality).toLowerCase())) return street;
  const parts = [street, addr.addressLocality, addr.addressRegion, addr.postalCode].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function empty(): ParsedShow {
  return { title: null, show_date: null, show_time: null, venue_name: null, venue_address: null, borough: null, image_url: null, description: null };
}

function fromJsonLd(ev: Json): ParsedShow {
  const r = empty();
  r.title = ev.name ? decodeEntities(String(ev.name)).trim() : null;
  const start = typeof ev.startDate === "string" ? toNewYork(ev.startDate) : null;
  if (start) {
    r.show_date = start.date;
    r.show_time = start.time || null;
  }
  const loc = Array.isArray(ev.location) ? ev.location[0] : ev.location;
  if (loc && typeof loc === "object") {
    r.venue_name = loc.name ? decodeEntities(String(loc.name)).trim() : null;
    r.venue_address = addressText(loc.address);
    // Some platforms put only a street in the address and no venue name.
    if (r.venue_name && r.venue_address && r.venue_name === r.venue_address) r.venue_name = null;
  } else if (typeof loc === "string") {
    r.venue_name = loc;
  }
  r.image_url = firstImage(ev.image);
  r.description = ev.description ? stripHtml(String(ev.description)) : null;
  return r;
}

/** Partiful's event lives in __NEXT_DATA__, and its JSON-LD is not reliable. */
function fromNextData(html: string): ParsedShow | null {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  try {
    const ev = JSON.parse(m[1])?.props?.pageProps?.event;
    if (!ev?.title) return null;
    const r = empty();
    r.title = String(ev.title);
    const start = typeof ev.startDate === "string" ? toNewYork(ev.startDate) : null;
    if (start) {
      r.show_date = start.date;
      r.show_time = start.time || null;
    }
    const info = ev.locationInfo ?? {};
    r.venue_name = info.mapsInfo?.name || info.displayName || null;
    const lines = info.mapsInfo?.addressLines;
    r.venue_address = Array.isArray(lines) ? lines.join(", ") : null;
    r.description = ev.description ? String(ev.description).trim() : null;
    r.image_url = ev.image?.url ?? null;
    return r;
  } catch {
    return null;
  }
}

/** Reads the page in order: JSON-LD Event, platform data, Open Graph tags, <title>. */
export function parseShowHtml(html: string): ParsedShow {
  const merged = empty();
  const fill = (src: ParsedShow | null) => {
    if (!src) return;
    for (const k of Object.keys(merged) as (keyof ParsedShow)[]) {
      if (!merged[k] && src[k]) merged[k] = src[k];
    }
  };

  const ev = jsonLdObjects(html).find(isEvent);
  if (ev) fill(fromJsonLd(ev));
  fill(fromNextData(html));

  const og = empty();
  og.title = meta(html, "og:title");
  og.image_url = meta(html, "og:image");
  og.description = meta(html, "og:description");
  fill(og);

  if (!merged.title) {
    const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    if (t) merged.title = decodeEntities(t).trim();
  }

  // Platform suffixes on titles: "Show · Luma", "Show | Partiful".
  if (merged.title) merged.title = merged.title.replace(/\s+[·|–-]\s+(Luma|Partiful|Posh|Eventbrite)\s*$/i, "").trim() || null;
  if (merged.description && merged.description.length > 2000) merged.description = merged.description.slice(0, 2000);
  merged.borough = guessBorough(`${merged.venue_address ?? ""} ${merged.venue_name ?? ""}`);
  return merged;
}
