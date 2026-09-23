/**
 * Generates public/sitemap.xml.
 *
 * Runs before `vite dev` and `vite build` (predev/prebuild hooks).
 * Base host is always the canonical domain, never a *.lovable.app URL.
 *
 * <lastmod> comes from the real last-modified time of the source file that
 * renders the route (page-specific, not the sitemap generation time).
 * Routes with no reliable timestamp ship without <lastmod>.
 * No <changefreq> / <priority> — search engines ignore them.
 */

import { statSync, writeFileSync, existsSync } from "fs";
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
  const file = resolve(source);
  if (!existsSync(file)) return null;
  try {
    return statSync(file).mtime.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

const urls = routes.map(({ path, source }) => {
  const lastmod = lastmodFor(source);
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
