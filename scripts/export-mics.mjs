/**
 * Prebuild script: export active mics from Supabase → public/mics.json
 * Runs once per Vercel deploy. After this, all visitors read static JSON
 * from Vercel's CDN — zero Supabase egress.
 *
 * If the fetch fails, writes an empty array so the build still succeeds
 * and the app falls back to localStorage cache.
 */

import { writeFileSync } from "fs";
import { join } from "path";

const SUPABASE_URL = "https://wwqoztrqprqksdubjwgj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cW96dHJxcHJxa3NkdWJqd2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDA5NzYsImV4cCI6MjA5MzUxNjk3Nn0.qYBpB5qHDyuHVfzwz6q7yzJgTUB0Xps6t_ezlh9kA9w";

const COLUMNS = "unique_identifier,open_mic,day,start_time,latest_end_time,venue_name,borough,neighborhood,location,cost,stage_time,sign_up_instructions,hosts_organizers,changes_updates,last_verified,city,signup_enabled,other_rules,cover_image_url,status,frequency,submission_date,legacy_tag,signup_method,slots_enabled,slot_duration_minutes";

const OUT_PATH = join(process.cwd(), "public", "mics.json");

function mapRow(row) {
  return {
    id: row.unique_identifier,
    openMic: row.open_mic || "",
    day: row.day || "",
    startTime: row.start_time || "",
    latestEndTime: row.latest_end_time || "",
    venueName: row.venue_name || "",
    borough: (row.borough || "").trim(),
    neighborhood: row.neighborhood || "",
    location: row.location || "",
    cost: row.cost || "",
    stageTime: row.stage_time || "",
    signUpInstructions: row.sign_up_instructions || "",
    hosts: row.hosts_organizers || "",
    instagramHandle: row.changes_updates || "",
    lastVerified: row.last_verified || "",
    uniqueIdentifier: row.unique_identifier || "",
    city: row.city || "",
    signupEnabled: row.signup_enabled || false,
    otherRules: row.other_rules || "",
    coverImageUrl: row.cover_image_url || undefined,
    status: row.status || "verified",
    frequency: row.frequency || "weekly",
    submissionDate: row.submission_date || undefined,
    legacyTag: row.legacy_tag || undefined,
    signupMethod: row.signup_method || undefined,
    slotsEnabled: row.slots_enabled || false,
    slotDurationMinutes: row.slot_duration_minutes || 5,
  };
}

async function fetchPage(from, size) {
  const params = new URLSearchParams({
    select: COLUMNS,
    active: "eq.true",
    status: "neq.pending",
    offset: String(from),
    limit: String(size),
  });

  const res = await fetch(`${SUPABASE_URL}/rest/v1/open_mics_historical?${params}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

try {
  const pageSize = 1000;
  const allRows = [];

  for (let i = 0; i < 5; i++) {
    const rows = await fetchPage(i * pageSize, pageSize);
    allRows.push(...rows);
    if (rows.length < pageSize) break;
  }

  const mics = allRows.map(mapRow);
  writeFileSync(OUT_PATH, JSON.stringify(mics));

  const sizeKB = (Buffer.byteLength(JSON.stringify(mics)) / 1024).toFixed(1);
  console.log(`[export-mics] ✓ ${mics.length} mics → public/mics.json (${sizeKB} KB)`);
} catch (e) {
  console.warn(`[export-mics] ✗ Fetch failed, writing empty array: ${e.message}`);
  writeFileSync(OUT_PATH, "[]");
}
