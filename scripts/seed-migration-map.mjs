/**
 * Step 2: Seed the _migration_id_map table in the NEW project with old profile data.
 * Run after export-old-profiles.mjs: node scripts/seed-migration-map.mjs
 *
 * Requires: NEW project service role key (from new project Settings > API).
 * Set NEW_SUPABASE_SERVICE_KEY env var before running.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const NEW_URL = 'https://wwqoztrqprqksdubjwgj.supabase.co'
const NEW_SERVICE_KEY = process.env.NEW_SUPABASE_SERVICE_KEY || ''

if (!NEW_SERVICE_KEY) {
  console.error('Set NEW_SUPABASE_SERVICE_KEY env var before running.')
  process.exit(1)
}

const supabase = createClient(NEW_URL, NEW_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const profiles = JSON.parse(readFileSync('./migration-data/profiles.json', 'utf8'))
console.log(`Seeding ${profiles.length} profiles into _migration_id_map...`)

const rows = profiles.map(p => ({
  clerk_id:        p.user_id,
  email:           p.email ?? null,
  phone:           p.phone ?? null,
  stage_name:      p.stage_name ?? null,
  bio:             p.bio ?? null,
  headshot_url:    p.headshot_url ?? null,
  username:        p.username ?? null,
  isadmin:         p.isadmin ?? false,
  points_balance:  p.points_balance ?? 0,
  years_performing: p.years_performing ?? null,
  role:            p.role ?? null,
  status:          'pending',
}))

for (let i = 0; i < rows.length; i += 100) {
  const batch = rows.slice(i, i + 100)
  const { error } = await supabase
    .from('_migration_id_map')
    .upsert(batch, { onConflict: 'clerk_id' })
  if (error) console.error(`Batch ${i}-${i + 100} error:`, error.message)
  else process.stdout.write('.')
}

console.log(`\nSeeded ${rows.length} rows.`)

// Print admins for verification
const admins = rows.filter(r => r.isadmin)
if (admins.length) {
  console.log('\n=== Admins in migration map ===')
  admins.forEach(a => console.log(`  clerk_id=${a.clerk_id}  phone=${a.phone}  username=${a.username}`))
  console.log('\nNext: force-migrate admin accounts via Supabase Dashboard > Auth > Invite User')
  console.log('Then run the admin SQL in supabase/migrations/20260514120000_migration_infrastructure.sql comments.')
}
