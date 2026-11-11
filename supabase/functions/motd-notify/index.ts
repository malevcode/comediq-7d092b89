// Emails the Mic of the Day winner when a win has to be paid for (from Dec 1, 2026).
// Called by the database right after a draw (motd_draw). Safe to call any time: it only
// emails winners who are still waiting to pay and have not been emailed yet.
//
// Comediq had no email sender before this. Sending needs ONE secret, RESEND_API_KEY
// (resend.com, free tier). Without it this function does nothing and the winner only sees
// the "pay to pin" button on the site. MOTD_FROM_EMAIL sets the from address.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''
const fromEmail = Deno.env.get('MOTD_FROM_EMAIL') ?? 'Comediq <hello@comediq.us>'
const siteUrl = Deno.env.get('SITE_URL') ?? 'https://comediq.us'

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async () => {
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Not configured' }, 500)
  if (!resendKey) return json({ ok: true, sent: 0, note: 'RESEND_API_KEY is not set, no email sent' })

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: winners, error } = await admin
    .from('mic_of_the_day_entries')
    .select('id, target_date, host_user_id, pay_by, open_mics_historical(open_mic)')
    .eq('status', 'won')
    .not('pay_by', 'is', null)
    .is('notified_at', null)
    .gt('pay_by', new Date().toISOString())
  if (error) return json({ error: error.message }, 500)

  const { data: config } = await admin.from('mic_of_the_day_config').select('price_cents').maybeSingle()
  const price = `$${((config?.price_cents ?? 2500) / 100).toFixed(0)}`

  let sent = 0
  for (const w of winners ?? []) {
    const { data: userData } = await admin.auth.admin.getUserById(w.host_user_id)
    const email = userData?.user?.email
    if (!email) continue

    const micName = (w as any).open_mics_historical?.open_mic ?? 'Your mic'
    const deadline = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit',
    }).format(new Date(w.pay_by))

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: `${micName} won Mic of the Day. Pay by ${deadline} ET to pin it`,
        text:
          `${micName} was drawn as today's Mic of the Day on Comediq.\n\n` +
          `Pay ${price} by ${deadline} ET today and it is pinned to the top of the listings ` +
          `for everyone, all day. If it is not paid by then, the spot goes to another host.\n\n` +
          `Pay here: ${siteUrl}/open-mics\n(Sign in, then tap "Pay to pin" at the top of the list.)`,
      }),
    })
    if (!res.ok) {
      console.error('Mic of the Day email failed', w.id, await res.text())
      continue
    }
    await admin.from('mic_of_the_day_entries').update({ notified_at: new Date().toISOString() }).eq('id', w.id)
    sent += 1
  }

  return json({ ok: true, sent })
})
