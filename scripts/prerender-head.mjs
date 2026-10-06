/**
 * Build-time head pre-rendering.
 *
 * After `vite build`, writes dist/<route>/index.html for every public route
 * with its own <title>, meta description, self-referencing canonical and full
 * OG/Twitter tags baked into the initial HTML, so crawlers that don't run JS
 * (and social preview bots) see correct per-page tags.
 * Client-side <SEO /> / <CanonicalTag /> still take over after load.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import {
  DAYS, slugify, micPath, venueSlugOf, boroughSlugs, filterMics, listingMeta, summaryText,
  eventSchema, itemListSchema, placeSchema, breadcrumbSchema, graph, formatVerified, ORIGIN as SHARED_ORIGIN,
} from "../src/lib/seoShared.js";
import { resolve, dirname } from "path";

const ORIGIN = "https://comediq.us";
const IMAGE = `${ORIGIN}/comediq_logo.jpg`;
const REGIONS = "NYC, the Hudson Valley, Los Angeles and Austin";

export const PAGES = [
  { path: "/", title: "Comediq! Find Comedy Open Mics in NYC, Hudson Valley, LA & Austin", description: `Discover comedy open mics and shows across ${REGIONS}. Find venues, track your sets, and build your comedy career with Comediq.` },
  { path: "/open-mics", title: "Comedy Open Mics List & Map | Comediq", description: `Browse every comedy open mic in ${REGIONS} by day, time, cost and neighborhood, with a live map and sign-up details.` },
  { path: "/perform", title: "Perform: Open Mics & Mic of the Day | Comediq", description: "Plan tonight's sets: today's Mic of the Day, upcoming open mics near you, and tools for working comedians." },
  { path: "/laugh", title: "Comedy Shows Near You | Comediq", description: `Find stand-up comedy shows to watch across ${REGIONS}, with dates, venues and ticket links.` },
  { path: "/shows", title: "Show Scheduler | Comediq", description: "Plan and organize your upcoming comedy shows, sets and bits in one place." },
  { path: "/free-mics", title: "Free Comedy Open Mics | Comediq", description: `Comedy open mics with no cover or drink minimum in ${REGIONS}.` },
  { path: "/beginner-friendly", title: "Beginner-Friendly Comedy Open Mics | Comediq", description: "Supportive, low-pressure open mics for first-time and newer comedians." },
  { path: "/top-mics", title: "Top Comedy Open Mics This Week | Comediq", description: "The week's highest-rated open mics, ranked by comedian votes on Comediq." },
  { path: "/leaderboard", title: "Open Mic Leaderboard | Comediq", description: "Live comedian voting on the best open mics. See which rooms are leading this month." },
  { path: "/growth", title: "Comedy Growth Opportunities | Comediq", description: "Booking spots, festivals, contests and gigs for comedians looking to grow their careers." },
  { path: "/add-mic", title: "Add an Open Mic | Comediq", description: "Submit a comedy open mic to Comediq so comedians can find it." },
  { path: "/add-show", title: "Submit a Comedy Show | Comediq", description: "List your comedy show on Comediq and reach local audiences." },
  { path: "/advertise", title: "Advertise to Comedians & Fans | Comediq", description: "Reach 1,250+ weekly comedians and comedy fans with banner and sponsor placements on Comediq." },
  { path: "/privacy", title: "Privacy Policy & Terms | Comediq", description: "How Comediq collects, uses and protects your data, plus our terms of use." },
  { path: "/slots", title: "Comediq Slots: Open Mic Sign-Ups | Comediq", description: "Reserve open mic spots and join waitlists with Comediq Slots." },
  { path: "/shows/map", title: "Comedy Shows Map | Comediq", description: "See comedy shows on a map and find one close to you tonight." },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// Remove the tags we own so they appear exactly once.
function stripOwned(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<link[^>]+rel="canonical"[^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name="description"[^>]*>\s*/gi, "")
    .replace(/<meta[^>]+property="og:[^"]+"[^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name="twitter:[^"]+"[^>]*>\s*/gi, "");
}

function headFor({ path, title, description, jsonld }) {
  const url = path === "/" ? `${ORIGIN}/` : `${ORIGIN}${path}`;
  const t = esc(title), d = esc(description);
  return [
    `<title>${t}</title>`,
    `<meta name="description" data-rh="true" content="${d}" />`,
    `<link rel="canonical" data-canonical="app" href="${url}" />`,
    `<meta property="og:type" data-rh="true" content="website" />`,
    `<meta property="og:site_name" data-rh="true" content="Comediq" />`,
    `<meta property="og:title" data-rh="true" content="${t}" />`,
    `<meta property="og:description" data-rh="true" content="${d}" />`,
    `<meta property="og:url" data-rh="true" content="${url}" />`,
    `<meta property="og:image" data-rh="true" content="${IMAGE}" />`,
    `<meta name="twitter:card" data-rh="true" content="summary_large_image" />`,
    `<meta name="twitter:site" data-rh="true" content="@comediq" />`,
    `<meta name="twitter:title" data-rh="true" content="${t}" />`,
    `<meta name="twitter:description" data-rh="true" content="${d}" />`,
    `<meta name="twitter:image" data-rh="true" content="${IMAGE}" />`,
    jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script>` : null,
  ].filter(Boolean).map((l) => `    ${l}`).join("\n");
}

const readJson = (f) => { try { return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : []; } catch { return []; } };
const h = (s) => esc(String(s ?? ""));
const micLi = (m) => `<li><a href="${micPath(m)}">${h(m.openMic)}</a> · ${h([m.day, m.startTime, m.venueName, m.cost].filter(Boolean).join(" · "))}${formatVerified(m.lastVerifiedAt) ? ` · Verified ${h(formatVerified(m.lastVerifiedAt))}` : ""}</li>`;
const PAGE_SIZE_STATIC = 24;

/** Dynamic pages built from the exported mic + venue data. */
export function dynamicPages(mics, venues) {
  const pages = [];
  const listing = (filter, path) => {
    const scoped = filterMics(filter, mics);
    const meta = listingMeta(filter, mics, 1);
    const first = scoped.slice(0, PAGE_SIZE_STATIC);
    const crumbs = [{ name: "Home", path: "/" }, { name: "Open Mics", path: "/open-mics" }, ...(filter ? [{ name: filter.value, path }] : [])];
    const h1 = filter ? `${filter.value} comedy open mics` : "Comedy open mics in NYC, the Hudson Valley, LA and Austin";
    pages.push({
      path, title: meta.title, description: meta.description,
      jsonld: graph(breadcrumbSchema(crumbs), itemListSchema(first)),
      body: `<main><h1>${h(h1)}</h1><p>${h(summaryText(scoped, filter ? meta.scope : "listed on Comediq"))}</p><ul>${first.map(micLi).join("")}</ul>${scoped.length > PAGE_SIZE_STATIC ? `<a href="${path}?page=2" rel="next">Show More</a>` : ""}<nav>${DAYS.map((d) => `<a href="/open-mics/${slugify(d)}">${d}</a>`).join(" ")}</nav></main>`,
    });
  };
  listing(null, "/open-mics");
  for (const d of DAYS) listing({ kind: "day", value: d, slug: slugify(d) }, `/open-mics/${slugify(d)}`);
  for (const b of boroughSlugs(mics)) listing({ kind: "borough", value: b.value, slug: b.slug }, `/open-mics/${b.slug}`);

  for (const m of mics) {
    const path = micPath(m);
    const where = [m.neighborhood, m.borough].filter(Boolean).join(", ");
    pages.push({
      path,
      title: `${m.openMic} at ${m.venueName} | Comediq`.slice(0, 70),
      description: `${m.openMic}: comedy open mic at ${m.venueName}${where ? ` (${where})` : ""}${m.day ? ` every ${m.day}` : ""}${m.startTime ? ` at ${m.startTime}` : ""}. ${m.cost ? `Cost: ${m.cost}.` : ""} ${m.stageTime ? `${m.stageTime} stage time.` : ""}`.replace(/\s+/g, " ").trim().slice(0, 300),
      jsonld: graph(eventSchema(m), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Open Mics", path: "/open-mics" }, ...(m.borough ? [{ name: m.borough, path: `/open-mics/${slugify(m.borough)}` }] : []), { name: m.openMic, path }])),
      body: `<main><h1>${h(m.openMic)}</h1><p>${h([m.day, m.startTime, m.cost, m.stageTime].filter(Boolean).join(" · "))}</p><p><a href="/venue/${venueSlugOf(m)}">${h(m.venueName)}</a> ${h(m.location)}</p>${formatVerified(m.lastVerifiedAt) ? `<p>Verified ${h(formatVerified(m.lastVerifiedAt))}</p>` : ""}<p>${h(m.signUpInstructions)}</p></main>`,
    });
  }

  for (const v of venues) {
    const vm = mics.filter((m) => venueSlugOf(m) === v.slug);
    if (!vm.length) continue;
    const path = `/venue/${v.slug}`;
    const summary = summaryText(vm, `at ${v.name}`);
    pages.push({
      path,
      title: `Comedy Open Mics at ${v.name}${v.neighborhood || v.borough ? ` (${v.neighborhood || v.borough})` : ""} | Comediq`,
      description: `${summary} ${v.address ? `Address: ${v.address}.` : ""}`.trim().slice(0, 300),
      jsonld: graph({ ...placeSchema({ ...v, url: `${SHARED_ORIGIN}${path}` }), event: vm.map(eventSchema) }, breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Open Mics", path: "/open-mics" }, { name: v.name, path }])),
      body: `<main><h1>Open mics at ${h(v.name)}</h1><p>${h(v.address)}</p><p>${h(summary)}</p><ul>${vm.map(micLi).join("")}</ul></main>`,
    });
  }
  return pages;
}

export function prerenderHeads(outDir = "dist") {
  const template = stripOwned(readFileSync(resolve(outDir, "index.html"), "utf8"));
  const mics = readJson(resolve(outDir, "mics.json"));
  const venues = readJson(resolve(outDir, "venues.json"));
  const dynamic = dynamicPages(mics, venues);
  const dynPaths = new Set(dynamic.map((p) => p.path));
  const all = [...PAGES.filter((p) => !dynPaths.has(p.path)), ...dynamic];
  for (const page of all) {
    let html = template.replace("</head>", `${headFor(page)}\n  </head>`);
    if (page.body) html = html.replace('<div id="root"></div>', `<div id="root">${page.body}</div>`);
    const file = page.path === "/"
      ? resolve(outDir, "index.html")
      : resolve(outDir, `.${page.path}`, "index.html");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
  }
  console.log(`[prerender-head] wrote ${all.length} pages (${dynamic.length} from mic data)`);
}
