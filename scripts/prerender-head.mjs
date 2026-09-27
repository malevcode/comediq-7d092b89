/**
 * Build-time head pre-rendering.
 *
 * After `vite build`, writes dist/<route>/index.html for every public route
 * with its own <title>, meta description, self-referencing canonical and full
 * OG/Twitter tags baked into the initial HTML, so crawlers that don't run JS
 * (and social preview bots) see correct per-page tags.
 * Client-side <SEO /> / <CanonicalTag /> still take over after load.
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
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

function headFor({ path, title, description }) {
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
  ].map((l) => `    ${l}`).join("\n");
}

export function prerenderHeads(outDir = "dist") {
  const template = stripOwned(readFileSync(resolve(outDir, "index.html"), "utf8"));
  for (const page of PAGES) {
    const html = template.replace("</head>", `${headFor(page)}\n  </head>`);
    const file = page.path === "/"
      ? resolve(outDir, "index.html")
      : resolve(outDir, `.${page.path}`, "index.html");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
  }
  console.log(`[prerender-head] wrote ${PAGES.length} pages`);
}
