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

type AuthUser = {
  id: string
  email?: string
}

const authHeaders = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  'Content-Type': 'application/json',
}

async function parseAuthError(response: Response, fallback: string) {
  const text = await response.text()
  if (!text) return new Error(fallback)

  try {
    const body = JSON.parse(text) as { message?: string; error?: string; msg?: string }
    return new Error(body.message ?? body.error ?? body.msg ?? text)
  } catch {
    return new Error(text)
  }
}

async function findUserIdByEmail(email: string) {
  for (let page = 1; page <= 10; page += 1) {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=1000`, {
      method: 'GET',
      headers: authHeaders,
    })

    if (!response.ok) throw await parseAuthError(response, 'Could not list users')

    const data = await response.json() as { users?: AuthUser[] }
    const users = data.users ?? []

    const match = users.find((user) => user.email?.toLowerCase() === email)
    if (match) return match.id
    if (users.length < 1000) break
  }

  return null
}

const createTemporaryPassword = () =>
  `${crypto.randomUUID()}-${crypto.randomUUID()}`

async function confirmExistingUser(email: string) {
  const userId = await findUserIdByEmail(email)
  if (!userId) return false

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      email_confirm: true,
      password: createTemporaryPassword(),
    }),
  })

  if (!response.ok) throw await parseAuthError(response, 'Could not prepare existing account')
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

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      email: normalizedEmail,
      email_confirm: true,
      password: createTemporaryPassword(),
    }),
  })

  if (!response.ok) {
    const error = await parseAuthError(response, 'Could not create account')

    if (isDuplicateEmailError(error)) {
      if (shouldPrepareExisting) {
        await confirmExistingUser(normalizedEmail)
      }
      return json({ status: 'exists' })
    }

    const message = getErrorMessage(error, 'Could not create account')
    console.error('Create email account error:', message, error)
    return json({ error: `Could not create account: ${message}` }, 500)
  }

  return json({ status: 'created' })
})
