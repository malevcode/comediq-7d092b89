/**
 * Export active mics from Supabase → public/mics.json.
 * Run this in CI on a schedule, and optionally once per deploy. After this,
 * all visitors read static JSON from the CDN — zero Supabase egress.
 *
 * If the fetch fails, writes an empty array so the build still succeeds
 * and the app falls back to localStorage cache.
 */

import { writeFileSync } from "fs";
import { join } from "path";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://wwqoztrqprqksdubjwgj.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cW96dHJxcHJxa3NkdWJqd2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDA5NzYsImV4cCI6MjA5MzUxNjk3Nn0.qYBpB5qHDyuHVfzwz6q7yzJgTUB0Xps6t_ezlh9kA9w";

const COLUMNS = [
  "unique_identifier",
  "open_mic",
  "day",
  "start_time",
  "latest_end_time",
  "venue_name",
  "borough",
  "neighborhood",
  "location",
  "venue_type",
  "cost",
  "stage_time",
  "sign_up_instructions",
  "hosts_organizers",
  "changes_updates",
  "last_verified",
  "city",
  "signup_enabled",
  "other_rules",
  "cover_image_url",
  "status",
  "frequency",
  "verification_count",
  "submission_date",
  "legacy_tag",
  "creator_id",
  "signup_method",
  "signup_url",
  "frequency_custom_text",
  "slots_enabled",
  "slot_duration_minutes",
  "latitude",
  "longitude",
  "geocoded_at",
  "geocoding_provider",
  "geocoding_score",
  "geocoding_match_address",
].join(",");

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
    venueType: row.venue_type || "",
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
    verificationCount: row.verification_count || 0,
    submissionDate: row.submission_date || undefined,
    legacyTag: row.legacy_tag || undefined,
    creatorId: row.creator_id || undefined,
    signupMethod: row.signup_method || undefined,
    signupUrl: row.signup_url || undefined,
    frequencyCustomText: row.frequency_custom_text || undefined,
    slotsEnabled: row.slots_enabled || false,
    slotDurationMinutes: row.slot_duration_minutes || 5,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    geocodedAt: row.geocoded_at ?? null,
    geocodingProvider: row.geocoding_provider ?? null,
    geocodingScore: row.geocoding_score ?? null,
    geocodingMatchAddress: row.geocoding_match_address ?? null,
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
  console.warn(`[export-mics] ✗ Fetch failed: ${e.message}`);
  const { readFileSync, existsSync } = await import("fs");
  if (existsSync(OUT_PATH)) {
    try {
      const existing = JSON.parse(readFileSync(OUT_PATH, "utf8"));
      if (Array.isArray(existing) && existing.length > 0) {
        console.warn(`[export-mics]   Keeping existing ${OUT_PATH} (${existing.length} mics)`);
      } else {
        console.warn(`[export-mics]   ⚠ Existing ${OUT_PATH} is empty and fetch failed — site will have no data`);
      }
    } catch {
      // existing file is corrupt, leave it as-is
    }
  } else {
    writeFileSync(OUT_PATH, "[]");
  }
}
