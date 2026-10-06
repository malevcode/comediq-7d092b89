/**
 * Generates public/sitemap.xml.
 *
 * Runs before `vite dev` and `vite build` (predev/prebuild hooks).
 * Base host is always the canonical domain, never a *.lovable.app URL.
 *
 * <lastmod> comes from the date of the last commit that touched the source
 * file rendering the route (page-specific, never the build/generation time).
 * Routes with no reliable timestamp ship without <lastmod>.
 * No <changefreq> / <priority>, search engines ignore them.
 */

import { execFileSync } from "child_process";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { DAYS, slugify, micPath, venueSlugOf, boroughSlugs } from "../src/lib/seoShared.js";
import { resolve } from "path";

const BASE_URL = "https://comediq.us";

// path -> source file whose mtime is the page's last meaningful change
const routes = [
  { path: "/", source: "src/pages/Index.tsx" },
  { path: "/open-mics", source: "src/pages/OpenMics.tsx" },
  { path: "/perform", source: "src/pages/Perform.tsx" },
  { path: "/laugh", source: "src/pages/Laugh.tsx" },
  { path: "/shows", source: "src/pages/Shows.tsx" },
  { path: "/free-mics", source: "src/pages/FreeMics.tsx" },
  { path: "/beginner-friendly", source: "src/pages/BeginnerMics.tsx" },
  { path: "/top-mics", source: "src/pages/Leaderboard.tsx" },
  { path: "/leaderboard", source: "src/pages/Leaderboard.tsx" },
  { path: "/growth", source: "src/pages/GrowthOpportunities.tsx" },
  { path: "/add-mic", source: "src/pages/AddMic.tsx" },
  { path: "/add-show", source: "src/pages/AddShow.tsx" },
  { path: "/advertise", source: "src/pages/AdvertiseWithUs.tsx" },
  { path: "/privacy", source: "src/pages/PrivacyPolicy.tsx" },
];

function lastmodFor(source) {
  if (!source) return null;
  if (!existsSync(resolve(source))) return null;
  try {
    const date = execFileSync("git", ["log", "-1", "--format=%cs", "--", source], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
  } catch {
    return null;
  }
}

const readJson = (f) => { try { return JSON.parse(readFileSync(resolve(f), "utf8")); } catch { return []; } };
const mics = readJson("public/mics.json");
const venues = readJson("public/venues.json");
const day = (iso) => (iso ? String(iso).slice(0, 10) : null);
const newest = (list) => list.map((m) => day(m.lastVerifiedAt)).filter(Boolean).sort().pop() || null;
const listingSource = "src/pages/OpenMics.tsx";
for (const d of DAYS) routes.push({ path: `/open-mics/${slugify(d)}`, lastmod: newest(mics.filter((m) => m.day === d)) || lastmodFor(listingSource) });
for (const b of boroughSlugs(mics)) routes.push({ path: `/open-mics/${b.slug}`, lastmod: newest(mics.filter((m) => (m.borough || "").trim() === b.value)) || lastmodFor(listingSource) });
const seen = new Set();
for (const m of mics) {
  const path = micPath(m);
  if (seen.has(path)) continue;
  seen.add(path);
  routes.push({ path, lastmod: day(m.lastVerifiedAt) });
}
for (const v of venues) {
  const vm = mics.filter((m) => venueSlugOf(m) === v.slug);
  if (vm.length) routes.push({ path: `/venue/${v.slug}`, lastmod: newest(vm) });
}

const urls = routes.map(({ path, source, lastmod: given }) => {
  const lastmod = given !== undefined ? given : lastmodFor(source);
  return [
    "  <url>",
    `    <loc>${BASE_URL}${path}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
});

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls,
  "</urlset>",
  "",
].join("\n");

writeFileSync(resolve("public/sitemap.xml"), xml);
console.log(`sitemap.xml written (${routes.length} entries, base ${BASE_URL})`);
