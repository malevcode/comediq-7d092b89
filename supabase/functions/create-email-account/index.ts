import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }

  return fallback
}

const isDuplicateEmailError = (error: unknown) => {
  const message = getErrorMessage(error, '').toLowerCase()
  return message.includes('already registered')
    || message.includes('already exists')
    || message.includes('user already')
}

async function findUserIdByEmail(
  admin: ReturnType<typeof createClient>,
  email: string,
) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    })

    if (error) throw error

    const match = data.users.find((user) => user.email?.toLowerCase() === email)
    if (match) return match.id
    if (data.users.length < 1000) break
  }

  return null
}

const createTemporaryPassword = () =>
  `${crypto.randomUUID()}-${crypto.randomUUID()}`

async function confirmExistingUser(admin: ReturnType<typeof createClient>, email: string) {
  const userId = await findUserIdByEmail(admin, email)
  if (!userId) return false

  const { error } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
    password: createTemporaryPassword(),
  })

  if (error) throw error
  return true
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Create email account function is missing required environment variables')
    return json({ error: 'Signup is not configured' }, 500)
  }

  const { email, prepareExisting } = await req.json().catch(() => ({ email: '' }))
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const shouldPrepareExisting = prepareExisting === true

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return json({ error: 'A valid email is required' }, 400)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { error } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    password: createTemporaryPassword(),
  })

  if (error) {
    if (isDuplicateEmailError(error)) {
      if (shouldPrepareExisting) {
        await confirmExistingUser(admin, normalizedEmail)
      }
      return json({ status: 'exists' })
    }

    console.error('Create email account error:', error)
    return json({ error: 'Could not create account' }, 500)
  }

  return json({ status: 'created' })
})
