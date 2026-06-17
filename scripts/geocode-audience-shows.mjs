import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';

// Backend-only/offline coordinate job. Do not run this from the browser.
// Requires SUPABASE_SERVICE_ROLE_KEY because it writes to audience_shows.

function loadLocalEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;

    const separatorIndex = trimmedLine.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
}

loadLocalEnvFile('.env.local');
loadLocalEnvFile('.env');

const PLACEHOLDER_VALUES = new Set([
  '',
  'your_supabase_project_url',
  'your_supabase_service_role_key',
]);
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const LIMIT = Number(process.env.GEOCODE_LIMIT || 500);
const DRY_RUN = process.env.DRY_RUN === 'true';

if (PLACEHOLDER_VALUES.has(SUPABASE_URL) || PLACEHOLDER_VALUES.has(SERVICE_ROLE_KEY)) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the audience show coordinate job.');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function buildAddress(row) {
  return [row.venue_name, row.venue_address, row.borough, 'New York', 'USA'].filter(Boolean).join(', ');
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function scoreCandidate(row, matchAddress, baseScore = 0) {
  const normalizedMatch = matchAddress.toLowerCase();
  let score = baseScore;

  if (row.venue_name && normalizedMatch.includes(String(row.venue_name).toLowerCase())) score += 0.25;
  if (row.venue_address && normalizedMatch.includes(String(row.venue_address).split(',')[0].toLowerCase())) score += 0.2;
  if (row.borough && normalizedMatch.includes(String(row.borough).toLowerCase())) score += 0.1;

  return score;
}

async function geocodeWithArcgis(row) {
  const params = new URLSearchParams({
    f: 'json',
    SingleLine: buildAddress(row),
    countryCode: 'USA',
    maxLocations: '5',
    outFields: 'Match_addr,Addr_type',
  });
  const response = await fetch(
    `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?${params}`,
  );

  if (!response.ok) {
    throw new Error(`ArcGIS geocoding failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const best = (data.candidates ?? [])
    .map((candidate) => ({
      latitude: parseNumber(candidate.location?.y),
      longitude: parseNumber(candidate.location?.x),
      provider: 'arcgis',
      score: scoreCandidate(row, candidate.address ?? '', (candidate.score ?? 0) / 100),
      matchAddress: candidate.address ?? null,
    }))
    .filter((candidate) => candidate.latitude !== null && candidate.longitude !== null)
    .sort((a, b) => b.score - a.score)[0];

  return best ?? null;
}

async function geocodeRow(row) {
  if (!row.venue_address && !row.venue_name) return null;

  try {
    return await geocodeWithArcgis(row);
  } catch (error) {
    console.warn(`Geocoding failed for ${row.id}:`, error.message);
    return null;
  }
}

const { data: rows, error } = await supabase
  .from('audience_shows')
  .select('id, title, venue_name, venue_address, borough, latitude, longitude')
  .eq('is_active', true)
  .or('latitude.is.null,longitude.is.null')
  .limit(LIMIT);

if (error) {
  if (error.code === '42703') {
    throw new Error(
      'Coordinate columns are missing on audience_shows. Apply supabase/migrations/20260616000200_add_audience_show_coordinates.sql before running this job.',
    );
  }

  throw error;
}

console.log(`Found ${rows.length} audience shows missing coordinates.`);

let updated = 0;
let skipped = 0;

for (const row of rows) {
  const result = await geocodeRow(row);

  if (!result) {
    skipped += 1;
    console.log(`skip ${row.id} ${row.venue_name ?? row.title ?? ''}`);
    continue;
  }

  const update = {
    latitude: result.latitude,
    longitude: result.longitude,
    geocoded_at: new Date().toISOString(),
    geocoding_provider: result.provider,
    geocoding_score: result.score,
    geocoding_match_address: result.matchAddress,
  };

  if (DRY_RUN) {
    console.log('dry-run', row.id, update);
  } else {
    const { error: updateError } = await supabase
      .from('audience_shows')
      .update(update)
      .eq('id', row.id);

    if (updateError) {
      skipped += 1;
      console.warn(`update failed ${row.id}:`, updateError.message);
      continue;
    }
  }

  updated += 1;
  console.log(`ok ${row.id} ${result.latitude},${result.longitude} ${result.provider}`);
}

console.log(`Done. ${DRY_RUN ? 'Would update' : 'Updated'} ${updated}; skipped ${skipped}.`);
