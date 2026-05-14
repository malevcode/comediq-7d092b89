/**
 * Step 3 (admins only): Create Supabase auth accounts for admin users and apply their
 * profile data immediately. Run AFTER seed-migration-map.mjs.
 *
 * Usage:
 *   NEW_SUPABASE_SERVICE_KEY=xxx node scripts/force-migrate-admin.mjs \
 *     --clerk-id user_2abc... --email adam@example.com
 */

import { createClient } from '@supabase/supabase-js'

const NEW_URL = 'https://wwqoztrqprqksdubjwgj.supabase.co'
const NEW_SERVICE_KEY = process.env.NEW_SUPABASE_SERVICE_KEY || ''

if (!NEW_SERVICE_KEY) {
  console.error('Set NEW_SUPABASE_SERVICE_KEY env var before running.')
  process.exit(1)
}

const args = process.argv.slice(2)
const clerkId = args[args.indexOf('--clerk-id') + 1]
const email   = args[args.indexOf('--email') + 1]

if (!clerkId || !email) {
  console.error('Usage: --clerk-id <clerk_id> --email <email>')
  process.exit(1)
}

const supabase = createClient(NEW_URL, NEW_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// 1. Look up migration data
const { data: mrow, error: mapErr } = await supabase
  .from('_migration_id_map')
  .select('*')
  .eq('clerk_id', clerkId)
  .single()

if (mapErr || !mrow) {
  console.error('Clerk ID not found in _migration_id_map. Run seed-migration-map.mjs first.')
  process.exit(1)
}

// 2. Create Supabase auth user (email confirmed, random temp password)
const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
  email,
  email_confirm: true,
  password: crypto.randomUUID(),
})

if (authErr) {
  if (authErr.message.includes('already registered')) {
    console.log('Auth user already exists — looking up by email...')
    // Find existing user
    const { data: users } = await supabase.auth.admin.listUsers()
    const existing = users?.users?.find(u => u.email === email)
    if (!existing) { console.error('Could not find existing user.'); process.exit(1) }
    console.log(`Found existing user: ${existing.id}`)
    authData = { user: existing }
  } else {
    console.error('Auth creation failed:', authErr.message)
    process.exit(1)
  }
}

const uuid = authData.user.id
console.log(`Supabase UUID: ${uuid}`)

// 3. Upsert profile with isadmin = true
const { error: profileErr } = await supabase.from('profiles').upsert({
  user_id:          uuid,
  username:         mrow.username,
  stage_name:       mrow.stage_name,
  bio:              mrow.bio,
  headshot_url:     mrow.headshot_url,
  phone:            mrow.phone,
  isadmin:          true,
  points_balance:   mrow.points_balance,
  years_performing: mrow.years_performing,
  role:             mrow.role ?? 'admin',
  subscription_plan: 'free',
  credits_balance:  0,
}, { onConflict: 'user_id' })

if (profileErr) console.error('Profile upsert error:', profileErr.message)
else console.log('Profile applied with isadmin=true')

// 4. Update migration map
await supabase.from('_migration_id_map').update({
  supabase_uuid: uuid,
  status: 'admin_forced',
  migrated_at: new Date().toISOString(),
}).eq('clerk_id', clerkId)

// 5. Send password reset so admin can set their own password
await supabase.auth.admin.generateLink({
  type: 'recovery',
  email,
})
console.log(`\nDone. Send ${email} a password reset link from the Supabase Dashboard > Auth > Users.`)
console.log(`Their new Supabase UUID: ${uuid}`)
