import { existsSync, readFileSync } from 'node:fs';

// Backend-only/offline coordinate job. Do not run this from the browser.
// Requires SUPABASE_SERVICE_ROLE_KEY because it writes to open_mics_historical.

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
const REFRESH_ALL = process.env.GEOCODE_REFRESH_ALL === 'true' || process.env.FORCE_REGEOCODE === 'true';

if (PLACEHOLDER_VALUES.has(SUPABASE_URL) || PLACEHOLDER_VALUES.has(SERVICE_ROLE_KEY)) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the backend coordinate job.');
}

const REST_URL = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1`;
const SUPABASE_HEADERS = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
};

async function readJsonResponse(response) {
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(body?.message || body?.error || `${response.status} ${response.statusText}`);
    error.code = body?.code;
    error.details = body?.details;
    throw error;
  }

  return body;
}

async function fetchOpenMicRows() {
  const params = new URLSearchParams({
    select: 'unique_identifier,open_mic,venue_name,location,city,borough,latitude,longitude',
    active: 'eq.true',
    limit: String(LIMIT),
  });

  if (!REFRESH_ALL) {
    params.set('or', '(latitude.is.null,longitude.is.null)');
  }

  const response = await fetch(`${REST_URL}/open_mics_historical?${params}`, {
    headers: SUPABASE_HEADERS,
  });

  return readJsonResponse(response);
}

async function updateOpenMicCoordinates(uniqueIdentifier, update) {
  const params = new URLSearchParams({
    unique_identifier: `eq.${uniqueIdentifier}`,
  });

  const response = await fetch(`${REST_URL}/open_mics_historical?${params}`, {
    method: 'PATCH',
    headers: {
      ...SUPABASE_HEADERS,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(update),
  });

  await readJsonResponse(response);
}

const MANUAL_COORDINATE_OVERRIDES = [
  {
    pattern: /merkin/i,
    latitude: 40.6958,
    longitude: -73.9171,
    matchAddress: 'Approximate Bushwick, Brooklyn, NY',
  },
  {
    pattern: /the buddha room/i,
    latitude: 40.749877058319,
    longitude: -73.994731369426,
    matchAddress: '410 8th Ave, New York, New York, 10001',
  },
  {
    pattern: /fear city/i,
    latitude: 40.715262564232,
    longitude: -73.990154598835,
    matchAddress: '17 Essex St, New York, New York, 10002',
  },
];

function buildAddress(row) {
  return [row.venue_name, row.location, row.city, row.city ? null : 'New York', 'USA'].filter(Boolean).join(', ');
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractZipCode(value) {
  return typeof value === 'string' ? value.match(/\b\d{5}\b/)?.[0] ?? null : null;
}

function scoreCandidate(row, matchAddress, baseScore = 0) {
  const normalizedMatch = matchAddress.toLowerCase();
  const rowZip = extractZipCode(row.location);
  const rowCity = typeof row.city === 'string' ? row.city.toLowerCase() : '';
  let score = baseScore;

  if (rowZip && normalizedMatch.includes(rowZip)) score += 0.25;
  if (rowCity && normalizedMatch.includes(rowCity)) score += 0.2;
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
  const searchableFields = [row.open_mic, row.venue_name, row.location, row.borough].filter(Boolean).join(' ');
  const manualOverride = MANUAL_COORDINATE_OVERRIDES.find(({ pattern }) => pattern.test(searchableFields));

  if (manualOverride) {
    return {
      latitude: manualOverride.latitude,
      longitude: manualOverride.longitude,
      provider: 'manual',
      score: 1,
      matchAddress: manualOverride.matchAddress,
    };
  }

  if (!row.location && !row.venue_name) return null;

  try {
    return await geocodeWithArcgis(row);
  } catch (error) {
    console.warn(`Geocoding failed for ${row.unique_identifier}:`, error.message);
    return null;
  }
}

let rows;

try {
  rows = await fetchOpenMicRows();
} catch (error) {
  if (error.code === '42703') {
    throw new Error(
      'Coordinate columns are missing on open_mics_historical. Apply supabase/migrations/20260616000100_add_open_mic_coordinates.sql before running this job.',
    );
  }

  throw error;
}

console.log(
  REFRESH_ALL
    ? `Found ${rows.length} active open mics to refresh coordinates.`
    : `Found ${rows.length} active open mics missing coordinates.`,
);

let updated = 0;
let skipped = 0;

for (const row of rows) {
  const result = await geocodeRow(row);

  if (!result) {
    skipped += 1;
    console.log(`skip ${row.unique_identifier} ${row.venue_name ?? row.open_mic ?? ''}`);
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
    console.log('dry-run', row.unique_identifier, update);
  } else {
    try {
      await updateOpenMicCoordinates(row.unique_identifier, update);
    } catch (updateError) {
      skipped += 1;
      console.warn(`update failed ${row.unique_identifier}:`, updateError.message);
      continue;
    }
  }

  updated += 1;
  console.log(`ok ${row.unique_identifier} ${result.latitude},${result.longitude} ${result.provider}`);
}

console.log(`Done. ${DRY_RUN ? 'Would update' : 'Updated'} ${updated}; skipped ${skipped}.`);
