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
  eventSchema, itemListSchema, placeSchema, breadcrumbSchema, graph, formatVerified, micTitle, ORIGIN as SHARED_ORIGIN, PUBLIC_PAGE_META, boundedMeta, micMeta, venueMeta, neighborhoodMeta, micDescription, micFaqs, faqSchema, venueDescription,
} from "../src/lib/seoShared.js";
import { resolve, dirname } from "path";

const ORIGIN = "https://comediq.us";
const IMAGE = `${ORIGIN}/comediq_logo.jpg`;

export const PAGES = [
  ...PUBLIC_PAGE_META,
  { path: "/setbuild-privacy", title: "SetBuild Privacy Policy", description: "Read the SetBuild privacy policy for stand-up recordings, transcripts and analysis, including data storage and deletion requests.", noindex: true },
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

function headFor({ path, title, description, jsonld, noindex }) {
  const url = path === "/" ? `${ORIGIN}/` : `${ORIGIN}${path}`;
  const meta = boundedMeta(title, description);
  const t = esc(meta.title), d = esc(meta.description);
  return [
    `<title>${t}</title>`,
    `<meta name="description" data-rh="true" content="${d}" />`,
    noindex ? `<meta name="robots" data-rh="true" content="noindex,nofollow" />` : null,
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

  // Neighborhood routes are public search pages too.
  const neighborhoods = [...new Set(mics.map((m) => m.neighborhood).filter(Boolean))];
  for (const name of neighborhoods) {
    const nm = mics.filter((m) => m.neighborhood === name);
    const path = `/neighborhoods/${slugify(name)}`;
    pages.push({
      path, ...neighborhoodMeta(name, nm),
      jsonld: graph(itemListSchema(nm), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Open Mics", path: "/open-mics" }, { name, path }])),
      body: `<main><h1>Comedy open mics in ${h(name)}</h1><p>${h(summaryText(nm, `in ${name}`))}</p><ul>${nm.map(micLi).join("")}</ul></main>`,
    });
  }

  for (const m of mics) {
    const path = micPath(m);
    const faqs = micFaqs(m);
    const faqBody = faqs.length ? `<section><h2>Frequently asked questions</h2><dl>${faqs.map(({ question, answer }) => `<dt>${h(question)}</dt><dd>${h(answer)}</dd>`).join("")}</dl></section>` : "";
    pages.push({
      path,
      ...micMeta(m),
      jsonld: graph(eventSchema(m), faqSchema(faqs), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Open Mics", path: "/open-mics" }, ...(m.borough ? [{ name: m.borough, path: `/open-mics/${slugify(m.borough)}` }] : []), { name: m.openMic, path }])),
      body: `<main><h1>${h(m.openMic)}</h1><p>${h(micDescription(m, mics))}</p>${faqBody}<p><a href="/venue/${venueSlugOf(m)}">${h(m.venueName)}</a> ${h(m.location)}</p>${formatVerified(m.lastVerifiedAt) ? `<p>Verified ${h(formatVerified(m.lastVerifiedAt))}</p>` : ""}</main>`,
    });
  }

  for (const v of venues) {
    const vm = mics.filter((m) => venueSlugOf(m) === v.slug);
    if (!vm.length) continue;
    const path = `/venue/${v.slug}`;
    const summary = summaryText(vm, `at ${v.name}`);
    pages.push({
      path,
      ...venueMeta(v, vm),
      jsonld: graph({ ...placeSchema({ ...v, url: `${SHARED_ORIGIN}${path}` }), event: vm.map(eventSchema) }, breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Open Mics", path: "/open-mics" }, { name: v.name, path }])),
      body: `<main><h1>Open mics at ${h(v.name)}</h1><p>${h(v.address)}</p><p>${h(summary)}</p>${venueDescription(v, vm) ? `<p>${h(venueDescription(v, vm))}</p>` : ""}<ul>${vm.map(micLi).join("")}</ul></main>`,
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
