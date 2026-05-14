/**
 * Step 1: Export all user data from the OLD Supabase project (cotfweyhlglpjmgqxwqx).
 * Run from the repo root: node scripts/export-old-profiles.mjs
 *
 * Requires: OLD project service role key (from old project Settings > API).
 * Set OLD_SERVICE_KEY below before running.
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync } from 'fs'

const OLD_URL = 'https://cotfweyhlglpjmgqxwqx.supabase.co'
const OLD_SERVICE_KEY = process.env.OLD_SUPABASE_SERVICE_KEY || ''

if (!OLD_SERVICE_KEY) {
  console.error('Set OLD_SUPABASE_SERVICE_KEY env var before running.')
  process.exit(1)
}

const supabase = createClient(OLD_URL, OLD_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

mkdirSync('./migration-data', { recursive: true })

async function exportTable(table, columns = '*') {
  const rows = []
  let from = 0
  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + 999)
    if (error) { console.error(`  Error on ${table}:`, error.message); break }
    if (!data?.length) break
    rows.push(...data)
    from += 1000
    if (data.length < 1000) break
  }
  return rows
}

const tables = [
  'profiles',
  'user_visits',
  'saved_mics',
  'mic_playlists',
  'mic_playlist_items',
  'mic_comments',
  'points_ledger',
  'comedian_social_links',
  'recordings',
  'mic_signups',
]

for (const table of tables) {
  process.stdout.write(`Exporting ${table}...`)
  const rows = await exportTable(table)
  writeFileSync(`./migration-data/${table}.json`, JSON.stringify(rows, null, 2))
  console.log(` ${rows.length} rows`)
}

// Print admin accounts (critical — save these)
const profiles = JSON.parse(require('fs').readFileSync('./migration-data/profiles.json', 'utf8'))
const admins = profiles.filter(p => p.isadmin)
console.log('\n=== ADMIN ACCOUNTS (save these!) ===')
admins.forEach(a => console.log(JSON.stringify({ clerk_id: a.user_id, username: a.username, phone: a.phone })))
console.log('\nDone. Run scripts/seed-migration-map.mjs next.')
