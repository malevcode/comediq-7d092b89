// Reads an Eventbrite / Posh / Luma / Partiful link and returns show details for the
// /list-your-show review form. One fetch per call. Nothing is saved here.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { normalizeUrl, parseShowHtml, platformForHost } from "./parse.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_PARSES_PER_HOUR = 10;
const MAX_HOPS = 4;
const MAX_BYTES = 3_000_000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** Follows redirects by hand so every hop stays on an allowed platform (no server-side request forgery). */
async function fetchAllowed(start: string): Promise<{ html: string; finalUrl: string }> {
  let url = start;
  for (let hop = 0; hop <= MAX_HOPS; hop++) {
    const u = new URL(url);
    if (u.protocol !== "https:" || !platformForHost(u.hostname)) throw new Error("redirected off platform");
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ComediqBot/1.0; +https://comediq.com)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url).toString();
      continue;
    }
    if (!res.ok) throw new Error(`page returned ${res.status}`);
    const html = (await res.text()).slice(0, MAX_BYTES);
    return { html, finalUrl: url };
  }
  throw new Error("too many redirects");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let raw = "";
  try {
    raw = String((await req.json())?.url ?? "").trim();
  } catch { /* handled below */ }
  if (raw && !/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return json({ error: "That doesn't look like a link. Paste the full link to your show." }, 400);
  }
  const platform = platformForHost(parsed.hostname);
  if (!platform || parsed.protocol !== "https:") {
    return json({ error: "We can read Eventbrite, Posh, Luma and Partiful links. Paste a link from one of those." }, 400);
  }

  // Rate limit: about 10 parses per signed-in user, or per IP when logged out, per hour.
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let key = "";
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (token) {
    const { data } = await admin.auth.getUser(token);
    if (data?.user) key = `user:${data.user.id}`;
  }
  if (!key) {
    const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    key = `ip:${ip}`;
  }
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await admin
    .from("show_parse_requests")
    .select("id", { count: "exact", head: true })
    .eq("key", key)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_PARSES_PER_HOUR) {
    return json({ error: "That's a lot of links in a short time. Try again in an hour, or fill the form in by hand." }, 429);
  }
  await admin.from("show_parse_requests").insert({ key });
  await admin.from("show_parse_requests").delete().lt("created_at", new Date(Date.now() - 86400_000).toISOString());

  const sourceUrl = normalizeUrl(parsed.toString());
  try {
    const { html, finalUrl } = await fetchAllowed(parsed.toString());
    const fields = parseShowHtml(html);
    return json({ platform, source_url: normalizeUrl(finalUrl), fields });
  } catch (e) {
    // Never a dead end: the page still gets the link and an empty form to fill by hand.
    console.error("parse-show-link fetch failed:", e instanceof Error ? e.message : e);
    return json({
      platform,
      source_url: sourceUrl,
      fields: null,
      error: "We couldn't read that page, so fill in the details below.",
    });
  }
});
