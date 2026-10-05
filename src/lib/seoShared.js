// Shared by the app (TS) and build scripts (prerender, sitemap). Plain JS on purpose.
export const ORIGIN = "https://comediq.us";
export const PAGE_SIZE = 24;
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const micSlug = (mic) => mic.slug || slugify(mic.openMic) || slugify(mic.venueName);
export const venueSlugOf = (mic) => mic.venueSlug || slugify(mic.venueName);
export const micPath = (mic) => `/mic/${micSlug(mic)}`;
export const venuePath = (mic) => `/venue/${venueSlugOf(mic)}`;

/** Resolve an /open-mics/:filter segment against the mic data. */
export function resolveFilter(segment, mics) {
  const s = slugify(segment);
  const day = DAYS.find((d) => d.toLowerCase() === s);
  if (day) return { kind: "day", value: day, slug: s };
  const borough = [...new Set(mics.map((m) => (m.borough || "").trim()).filter(Boolean))].find((b) => slugify(b) === s);
  if (borough) return { kind: "borough", value: borough, slug: s };
  return null;
}

export function boroughSlugs(mics) {
  return [...new Set(mics.map((m) => (m.borough || "").trim()).filter(Boolean))].map((b) => ({ value: b, slug: slugify(b) }));
}

export function isFree(cost) {
  return /free/i.test(cost || "") || /^\$?0(\.00)?$/.test((cost || "").trim());
}

function priceLabel(cost) {
  const c = (cost || "").trim();
  if (!c) return null;
  if (isFree(c)) return "free";
  const m = c.match(/\$\s?(\d+)/) || c.match(/^(\d+)$/);
  if (m) return `$${m[1]}`;
  if (/drink/i.test(c)) return "a drink minimum";
  return null;
}

/** Live-count summary used at the top of every listing page. */
export function micSummary(mics) {
  const total = mics.length;
  const free = mics.filter((m) => isFree(m.cost)).length;
  const prices = {};
  const days = {};
  for (const m of mics) {
    const p = priceLabel(m.cost);
    if (p) prices[p] = (prices[p] || 0) + 1;
    if (DAYS.includes(m.day)) days[m.day] = (days[m.day] || 0) + 1;
  }
  const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  return { total, free, commonPrice: top(prices), busiestDay: top(days) };
}

export function summaryText(mics, scopeLabel) {
  const s = micSummary(mics);
  if (!s.total) return `No open mics are listed ${scopeLabel} right now.`;
  const parts = [`${s.total} comedy open mic${s.total === 1 ? "" : "s"} ${scopeLabel}.`];
  parts.push(`${s.free} ${s.free === 1 ? "is" : "are"} free`);
  if (s.commonPrice) parts[1] += `, the most common price is ${s.commonPrice}`;
  if (s.busiestDay) parts[1] += `, and ${s.busiestDay} is the busiest night`;
  return `${parts[0]} ${parts[1]}.`;
}

/** Title/description for /open-mics and /open-mics/:filter. */
export function listingMeta(filter, mics, page = 1) {
  const scoped = filterMics(filter, mics);
  const pageSuffix = page > 1 ? ` (Page ${page})` : "";
  if (!filter) {
    return {
      title: `Comedy Open Mics List & Map | Comediq${pageSuffix}`,
      description: summaryText(scoped, "listed on Comediq across NYC, the Hudson Valley, LA and Austin"),
      scope: "listed on Comediq",
    };
  }
  const scope = filter.kind === "day" ? `on ${filter.value}s` : `in ${filter.value}`;
  return {
    title: `${filter.value} Comedy Open Mics${filter.kind === "day" ? "" : ""} | Comediq${pageSuffix}`,
    description: summaryText(scoped, scope).slice(0, 300),
    scope,
  };
}

export function filterMics(filter, mics) {
  if (!filter) return mics;
  if (filter.kind === "day") return mics.filter((m) => m.day === filter.value);
  return mics.filter((m) => (m.borough || "").trim() === filter.value);
}

// ---------- JSON-LD ----------
function parseTime(t) {
  const m = String(t || "").trim().toLowerCase().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?/);
  if (!m) return null;
  let h = +m[1];
  const min = m[2] ? +m[2] : 0;
  const ap = m[3];
  if (ap && ap.startsWith("p") && h !== 12) h += 12;
  if (ap && ap.startsWith("a") && h === 12) h = 0;
  if (!ap && h < 12 && h >= 1 && h <= 11) h += 12; // mics without am/pm are evening
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
}

const REPEAT = { weekly: "P1W", bi_weekly: "P2W", "1st_of_month": "P1M", "2nd_of_month": "P1M", "3rd_of_month": "P1M", "4th_of_month": "P1M", last_of_month: "P1M" };
const WEEK_OF_MONTH = { "1st_of_month": 1, "2nd_of_month": 2, "3rd_of_month": 3, "4th_of_month": 4, last_of_month: -1 };

function nextDate(day) {
  const target = DAYS.indexOf(day);
  const d = new Date();
  if (target < 0) return d.toISOString().slice(0, 10);
  d.setDate(d.getDate() + ((target - d.getDay() + 7) % 7));
  return d.toISOString().slice(0, 10);
}

export function placeSchema(v) {
  const place = {
    "@type": "Place",
    name: v.name,
    address: { "@type": "PostalAddress", streetAddress: v.address || undefined, addressLocality: v.neighborhood || v.borough || v.city || undefined, addressRegion: /los angeles|inland|riverside|rancho/i.test(`${v.city} ${v.borough}`) ? "CA" : /austin/i.test(v.city || "") ? "TX" : "NY", addressCountry: "US" },
  };
  if (v.latitude != null && v.longitude != null) place.geo = { "@type": "GeoCoordinates", latitude: v.latitude, longitude: v.longitude };
  if (v.url) place.url = v.url;
  return place;
}

export function eventSchema(mic) {
  const url = `${ORIGIN}${micPath(mic)}`;
  const start = parseTime(mic.startTime);
  const end = parseTime(mic.latestEndTime);
  const date = nextDate(mic.day);
  const ev = {
    "@type": "Event",
    name: mic.openMic,
    url,
    description: `Comedy open mic at ${mic.venueName}${mic.day ? ` on ${mic.day}s` : ""}${mic.startTime ? ` at ${mic.startTime}` : ""}.`,
    startDate: start ? `${date}T${start}` : date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: placeSchema({ name: mic.venueName, address: mic.location, borough: mic.borough, neighborhood: mic.neighborhood, city: mic.city, latitude: mic.latitude, longitude: mic.longitude, url: `${ORIGIN}${venuePath(mic)}` }),
    organizer: { "@type": "Organization", name: mic.hosts || mic.venueName },
  };
  if (end && start) ev.endDate = `${date}T${end}`;
  const freq = mic.frequency || "weekly";
  if (REPEAT[freq] && DAYS.includes(mic.day)) {
    const sched = { "@type": "Schedule", repeatFrequency: REPEAT[freq], byDay: `https://schema.org/${mic.day}`, startDate: date, scheduleTimezone: /CA/.test(ev.location.address.addressRegion) ? "America/Los_Angeles" : /TX/.test(ev.location.address.addressRegion) ? "America/Chicago" : "America/New_York" };
    if (start) sched.startTime = start;
    if (end) sched.endTime = end;
    if (WEEK_OF_MONTH[freq]) sched.byMonthWeek = WEEK_OF_MONTH[freq];
    ev.eventSchedule = sched;
  }
  if (mic.cost) {
    const price = isFree(mic.cost) ? "0" : (mic.cost.match(/\d+(\.\d+)?/) || [null])[0];
    if (price != null) ev.offers = { "@type": "Offer", price, priceCurrency: "USD", availability: "https://schema.org/InStock", url };
  }
  return ev;
}

export function itemListSchema(mics, startIndex = 0) {
  return {
    "@type": "ItemList",
    numberOfItems: mics.length,
    itemListElement: mics.map((m, i) => ({ "@type": "ListItem", position: startIndex + i + 1, url: `${ORIGIN}${micPath(m)}`, name: m.openMic })),
  };
}

export function breadcrumbSchema(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${ORIGIN}${it.path}` })),
  };
}

export const graph = (...nodes) => ({ "@context": "https://schema.org", "@graph": nodes.filter(Boolean) });

export function formatVerified(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" });
}
