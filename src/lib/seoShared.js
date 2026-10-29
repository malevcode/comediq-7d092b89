// Shared by the app (TS) and build scripts (prerender, sitemap). Plain JS on purpose.
export const ORIGIN = "https://comediq.us";
export const PAGE_SIZE = 24;
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Search snippets use maximum lengths, not padded character targets.
export function snippet(text, limit) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (value.length <= limit) return value;
  const prefix = value.slice(0, limit - 1);
  const boundary = prefix.lastIndexOf(" ");
  return `${prefix.slice(0, boundary > prefix.length * 0.6 ? boundary : prefix.length).replace(/[ ,;:.–-]+$/, "")}…`;
}

export function boundedMeta(title, description) {
  const suffix = " | Comediq";
  const branded = String(title).endsWith(suffix);
  return {
    title: branded ? `${snippet(title.slice(0, -suffix.length), 60 - suffix.length)}${suffix}` : snippet(title, 60),
    description: snippet(description, 160),
  };
}

// One metadata catalogue for both initial HTML and client navigation.
export const PUBLIC_PAGE_META = [
  ["/", "Comediq | Where comedy happens", "Where comedy happens. Find shows to watch and stages to get on."],
  ["/open-mics", "Comedy Open Mics List & Map | Comediq", "Browse comedy open mics in NYC, the Hudson Valley, Los Angeles and Austin. Compare schedules, venues, prices and sign-up details on Comediq's list and map."],
  ["/perform", "Comedy Open Mics & Mic of the Day | Comediq", "Find comedy open mics, discover the Mic of the Day and plan your next stand-up set. Explore schedules, venues and tools for comedians on Comediq."],
  ["/laugh", "Stand-Up Comedy Shows in NYC, LA & Austin | Comediq", "Discover stand-up comedy shows in NYC, the Hudson Valley, Los Angeles and Austin. Find show dates, comedy venues and ticket links on Comediq."],
  ["/shows", "Comedy Show Scheduler & Set Planning | Comediq", "Organize your upcoming comedy shows, stand-up sets and bits. Keep performance dates and set plans together with the Comediq show scheduler."],
  ["/free-mics", "Free Comedy Open Mics in NYC, LA & Austin | Comediq", "Find free comedy open mics in NYC, the Hudson Valley, Los Angeles and Austin. Browse venues and schedules with no cover charge or drink minimum."],
  ["/beginner-friendly", "Beginner-Friendly Comedy Open Mics | Comediq", "Find beginner-friendly comedy open mics for your first stand-up set. Explore supportive rooms, venue details and schedules for new comedians on Comediq."],
  ["/top-mics", "Top Comedy Open Mics & Comedian Rankings | Comediq", "Discover top comedy open mics ranked by comedian votes. Compare popular stand-up rooms and vote for NYC's Mic of the Month on Comediq."],
  ["/leaderboard", "Comedy Open Mic Leaderboard & Monthly Voting | Comediq", "Vote for NYC's Mic of the Month and follow the comedy open mic leaderboard. See live comedian voting totals and find popular stand-up rooms on Comediq."],
  ["/growth", "Comedy Gigs, Festivals & Booking Opportunities | Comediq", "Find comedy booking opportunities, stand-up gigs, festivals and contests. Explore opportunities to grow your career as a comedian on Comediq."],
  ["/add-mic", "Submit a Comedy Open Mic & Venue Details | Comediq", "Add a comedy open mic to Comediq. Submit venue details, schedules, stage time, costs and sign-up instructions so local comedians can find your room."],
  ["/add-show", "Submit a Stand-Up Comedy Show | Comediq", "List your stand-up comedy show on Comediq. Add event dates, venue details and ticket links to help local comedy fans discover your next show."],
  ["/advertise", "Advertise to Comedians & Comedy Fans | Comediq", "Promote your comedy venue, event or brand to comedians and comedy fans. Explore Comediq banner advertising and sponsor placements for your campaign."],
  ["/privacy", "Comediq Privacy Policy & Terms of Service", "Read Comediq's privacy policy and terms of service. Learn how comedian data is collected, used and protected, including SMS notification disclosures."],
  ["/blog", "Stand-Up Comedy Blog & Open Mic Guides | Comediq", "Read Comediq's stand-up comedy blog for open mic guides, performance tips and stories for comedians in NYC, Hudson Valley, Los Angeles and Austin."],
  ["/slots", "Comedy Open Mic Sign-Ups & Waitlists | Comediq", "Reserve comedy open mic spots and join waitlists with Comediq Slots. Explore available sign-ups and manage your next stand-up performance."],
  ["/shows/map", "Stand-Up Comedy Shows Map & Venue Locations | Comediq", "Find stand-up comedy shows on a map. Explore comedy venue locations, upcoming events and ticket links to plan a night of live comedy with Comediq."],
].map(([path, title, description]) => ({ path, ...boundedMeta(title, description) }));

export function pageMetaFor(path) {
  return PUBLIC_PAGE_META.find((page) => page.path === path.replace(/\/+$/, "") || (page.path === "/" && path === "/"));
}

export function micMeta(mic) {
  const area = mic.neighborhood || mic.borough || mic.city;
  const name = /^open mic$/i.test(mic.openMic || "") ? mic.venueName : mic.openMic || mic.venueName;
  const schedule = [mic.day?.slice(0, 3), mic.startTime].filter(Boolean).join(" ");
  const suffix = ` Open Mic${schedule ? ` ${schedule}` : ""} | Comediq`;
  const title = `${snippet(name.replace(/\s+(comedy\s+)?open mic$/i, ""), Math.max(12, 60 - suffix.length))}${suffix}`;
  return boundedMeta(
    title,
    [`Comedy open mic: ${mic.openMic || mic.venueName} at ${mic.venueName}${area ? ` in ${area}` : ""}.`, [mic.day, mic.startTime, mic.cost, mic.stageTime && `${mic.stageTime} stage time`].filter(Boolean).join(" · "), "See venue and sign-up details."].filter(Boolean).join(" "),
  );
}

export function venueMeta(venue, mics) {
  const area = venue.neighborhood || venue.borough || venue.city;
  return boundedMeta(
    `${venue.name} Comedy Open Mics | Comediq`,
    `Find ${mics.length} comedy open mic${mics.length === 1 ? "" : "s"} at ${venue.name}${area ? ` in ${area}` : ""}. Browse stand-up schedules, prices and sign-up details.${venue.address ? ` Address: ${venue.address}.` : ""}`,
  );
}

export function blogPostMeta(post) {
  return boundedMeta(`${post.title} | Comediq`, post.metaDescription || post.excerpt);
}

export function blogPostSchema(post) {
  const url = `${ORIGIN}/blog/${post.slug}`;
  return graph(
    {
      "@type": "Article",
      headline: post.title,
      description: blogPostMeta(post).description,
      datePublished: post.datePublished,
      dateModified: post.dateModified,
      author: { "@type": "Person", name: post.author },
      publisher: { "@type": "Organization", name: "Comediq", url: ORIGIN },
      url,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    },
    breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }]),
  );
}

export function neighborhoodMeta(name, mics) {
  return boundedMeta(`${name} Comedy Open Mics & Stand-Up | Comediq`, `Find ${mics.length} comedy open mics in ${name}. Browse stand-up venues, weekly schedules, costs and sign-up details to plan your next set on Comediq.`);
}

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
  return { total, free, commonPrice: top(prices), busiestDay: Object.keys(days).length > 1 ? top(days) : null };
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
      ...boundedMeta(`Comedy Open Mics List & Map${pageSuffix} | Comediq`, `Find ${scoped.length} comedy open mics across NYC, the Hudson Valley, LA and Austin. Compare stand-up venues, schedules, prices and sign-up details.${page > 1 ? ` Page ${page}.` : ""}`),
      scope: "listed on Comediq",
    };
  }
  const scope = filter.kind === "day" ? `on ${filter.value}s` : `in ${filter.value}`;
  return {
    ...boundedMeta(`${filter.value} Comedy Open Mics${pageSuffix} | Comediq`, `Find ${scoped.length} comedy open mics ${scope}${page > 1 ? `, page ${page}` : ""}. ${micSummary(scoped).free} are free. Compare stand-up venues, schedules, prices and sign-up details on Comediq.`),
    scope,
  };
}

export function filterMics(filter, mics) {
  if (!filter) return mics;
  if (filter.kind === "day") return mics.filter((m) => m.day === filter.value);
  return mics.filter((m) => (m.borough || "").trim() === filter.value);
}

const fieldText = (value) => String(value ?? "").trim();
const sentence = (value) => `${value.replace(/[.!?]+$/, "")}.`;
const stageText = (value) => /^\d+(\.\d+)?$/.test(value) ? `${value} minutes` : value;

/** Read-only detail copy; use the listing filters and totals rather than a separate count source. */
export function micDescription(mic, mics = []) {
  const name = fieldText(mic.openMic);
  const day = fieldText(mic.day);
  const time = fieldText(mic.startTime);
  const venue = fieldText(mic.venueName);
  const address = fieldText(mic.location);
  const area = [mic.neighborhood, mic.borough].map(fieldText).filter(Boolean).join(", ");
  const cost = fieldText(mic.cost);
  const stage = stageText(fieldText(mic.stageTime));
  const schedule = [day && `${!mic.frequency || mic.frequency === "weekly" ? "every" : "on"} ${day}`, time && `at ${time}`].filter(Boolean).join(" ");
  const place = [venue && `at ${venue}`, address].filter(Boolean).join(", ");
  const details = [name, schedule && `runs ${schedule}`, place, area && `in ${area}`].filter(Boolean).join(" ");
  const parts = details ? [sentence(details)] : [];
  if (cost && stage) parts.push(sentence(`It costs ${cost} and each comic gets ${stage}`));
  else if (cost) parts.push(sentence(`It costs ${cost}`));
  else if (stage) parts.push(sentence(`Each comic gets ${stage}`));
  const counts = [];
  if (day) {
    const total = micSummary(filterMics({ kind: "day", value: mic.day }, mics)).total;
    if (total) counts.push(`${total} open mics running on ${day}s`);
  }
  const borough = fieldText(mic.borough);
  if (borough) {
    const total = micSummary(filterMics({ kind: "borough", value: borough }, mics)).total;
    if (total) counts.push(`${total} in ${borough}`);
  }
  if (counts.length) parts.push(sentence(`This is one of ${counts.join(" and one of ")}`));
  return parts.join(" ");
}

export function micFaqs(mic) {
  const cost = fieldText(mic.cost);
  const stage = stageText(fieldText(mic.stageTime));
  const signup = fieldText(mic.signUpInstructions);
  return [
    cost && { question: "How much does the mic cost?", answer: sentence(`It costs ${cost}`) },
    stage && { question: "How long is the set?", answer: sentence(`Each comic gets ${stage}`) },
    signup && { question: "How does sign-up work?", answer: signup },
  ].filter(Boolean);
}

export function faqSchema(faqs) {
  if (!faqs.length) return null;
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question", name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

export function venueDescription(venue, mics) {
  const area = [venue.neighborhood, venue.borough].map(fieldText).filter(Boolean).join(", ");
  const parts = area ? [sentence(`${fieldText(venue.name) || "This venue"} is in ${area}`)] : [];
  const costs = [...new Set(mics.map((mic) => fieldText(mic.cost)).filter(Boolean))];
  const amount = (cost) => isFree(cost) ? 0 : Number(cost.match(/\$\s*(\d+(?:\.\d+)?)/)?.[1] ?? (/^\d+(?:\.\d+)?$/.test(cost) ? cost : NaN));
  const priced = costs.filter((cost) => Number.isFinite(amount(cost))).sort((a, b) => amount(a) - amount(b));
  const other = costs.filter((cost) => !Number.isFinite(amount(cost)));
  if (costs.length === 1) parts.push(sentence(`Listed mic cost: ${costs[0]}`));
  else if (priced.length > 1 && amount(priced[0]) !== amount(priced[priced.length - 1])) {
    parts.push(sentence(`Listed mic prices range from ${priced[0]} to ${priced[priced.length - 1]}`));
    if (other.length) parts.push(sentence(`Other listed costs include ${other.join("; ")}`));
  } else if (costs.length) parts.push(sentence(`Listed mic costs include ${costs.join("; ")}`));
  return parts.join(" ");
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

export function micTitle(mic) {
  return micMeta(mic).title;
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
