/**
 * Texts mic hosts the day before their mic to confirm it is still on.
 * Plan: docs/HOST_TEXT_CONFIRMATION_PLAN.md
 *
 *   npx tsx scripts/send-host-confirmation-texts.ts                 dry run (default): prints, sends nothing, writes nothing
 *   npx tsx scripts/send-host-confirmation-texts.ts --send          really sends (needs the Twilio env vars below)
 *   npx tsx scripts/send-host-confirmation-texts.ts --date 2026-11-01   pretend that is "tomorrow"
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * To send: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM.
 * Swapping providers means replacing sendSms() and nothing else.
 *
 * Who gets a text, and when:
 *  - A host who opted in but has not replied YES yet gets one "reply YES to start" text.
 *  - A verified host gets a text the day before a mic we KNOW runs tomorrow.
 *    Weekly mics: only if not confirmed in the last 28 days (about once a month).
 *    Bi-weekly, monthly, pop-up and custom mics: before every show.
 *  - Never twice for the same mic, number and date. Never after STOP.
 */
import { micKnownToRunOn } from '../src/utils/micOccurrences';

const WEEKLY_QUIET_DAYS = 28;
const args = process.argv.slice(2);
const SEND = args.includes('--send');
const dateArg = args.includes('--date') ? args[args.indexOf('--date') + 1] : null;

const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !KEY) {
  console.error('Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

type Mic = {
  open_mic: string;
  venue_name: string | null;
  day: string | null;
  start_time: string | null;
  frequency: string | null;
  frequency_custom_text: string | null;
  active: boolean | null;
  last_confirmed_at: string | null;
};
type Contact = {
  id: string;
  mic_id: string;
  phone: string;
  verified_at: string | null;
  opted_out_at: string | null;
  open_mics_historical: Mic | null;
};

async function rest(path: string, init: RequestInit = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: KEY!, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`${init.method ?? 'GET'} ${path} failed: ${response.status} ${await response.text()}`);
  return response;
}

const isoOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** "Tomorrow" in New York, as a local date. */
function tomorrowInNewYork(): Date {
  const today = dateArg
    ? dateArg
    : new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  const [y, m, d] = today.split('-').map(Number);
  // dateArg IS tomorrow when given. Otherwise add a day to today.
  return dateArg ? new Date(y, m - 1, d) : new Date(y, m - 1, d + 1);
}

const maskPhone = (phone: string) => `***${phone.slice(-4)}`;

async function sendSms(to: string, body: string): Promise<string> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) throw new Error('No texting provider configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM).');
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });
  const json = (await response.json()) as { sid?: string; message?: string };
  if (!response.ok || !json.sid) throw new Error(`Twilio error ${response.status}: ${json.message ?? 'unknown'}`);
  return json.sid;
}

async function main() {
  if (SEND && !(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM)) {
    console.error('No texting provider configured, so nothing was sent. Run without --send for a dry run.');
    process.exit(1);
  }

  const tomorrow = tomorrowInNewYork();
  const tomorrowIso = isoOf(tomorrow);
  const todayIso = isoOf(new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() - 1));
  const weekday = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
  console.log(`${SEND ? 'SENDING' : 'DRY RUN'}: texts about ${weekday} ${tomorrowIso}`);

  const contacts = (await (await rest(
    'mic_host_contacts?select=id,mic_id,phone,verified_at,opted_out_at,open_mics_historical(open_mic,venue_name,day,start_time,frequency,frequency_custom_text,active,last_confirmed_at)&opted_out_at=is.null',
  )).json()) as Contact[];

  const verifyRows = (await (await rest('mic_confirmation_texts?kind=eq.verify&select=mic_id,phone')).json()) as { mic_id: string; phone: string }[];
  const confirmRows = (await (await rest(`mic_confirmation_texts?kind=eq.confirm&occurrence_date=eq.${tomorrowIso}&select=mic_id,phone`)).json()) as { mic_id: string; phone: string }[];
  const verifySent = new Set(verifyRows.map((r) => `${r.mic_id}|${r.phone}`));
  const confirmSent = new Set(confirmRows.map((r) => `${r.mic_id}|${r.phone}`));

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  const deliver = async (c: Contact, kind: 'verify' | 'confirm', occurrence: string, body: string) => {
    if (!SEND) {
      console.log(`  would text ${maskPhone(c.phone)} (${kind}): ${body}`);
      sent += 1;
      return;
    }
    try {
      const providerId = await sendSms(c.phone, body);
      await rest('mic_confirmation_texts', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ mic_id: c.mic_id, phone: c.phone, kind, occurrence_date: occurrence, body, status: 'sent', provider_id: providerId }),
      });
      console.log(`  texted ${maskPhone(c.phone)} (${kind})`);
      sent += 1;
    } catch (error) {
      console.error(`  FAILED ${maskPhone(c.phone)} (${kind}): ${(error as Error).message}`);
      failed += 1;
    }
  };

  for (const c of contacts) {
    const mic = c.open_mics_historical;
    if (c.opted_out_at || !mic || mic.active === false) { skipped += 1; continue; }
    const key = `${c.mic_id}|${c.phone}`;

    if (!c.verified_at) {
      if (verifySent.has(key)) { skipped += 1; continue; }
      await deliver(c, 'verify', todayIso,
        `Comediq: reply YES to get a text the day before ${mic.open_mic} asking if it is still on. Reply STOP anytime to stop.`);
      continue;
    }

    const mapped = { day: mic.day, frequency: mic.frequency as never, frequencyCustomText: mic.frequency_custom_text };
    if (!micKnownToRunOn(mapped, tomorrow)) { skipped += 1; continue; }
    if (confirmSent.has(key)) { skipped += 1; continue; }

    const frequency = mic.frequency || 'weekly';
    if (frequency === 'weekly' && mic.last_confirmed_at) {
      const ageDays = (Date.now() - new Date(mic.last_confirmed_at).getTime()) / 86400000;
      if (ageDays < WEEKLY_QUIET_DAYS) { skipped += 1; continue; }
    }

    const when = [weekday, mic.start_time].filter(Boolean).join(', ');
    await deliver(c, 'confirm', tomorrowIso,
      `Comediq: is ${mic.open_mic}${mic.venue_name ? ` at ${mic.venue_name}` : ''} still on tomorrow (${when})? Reply YES to confirm or NO if it is off. Reply STOP to stop texts.`);
  }

  console.log(`Done. ${SEND ? 'sent' : 'would send'}: ${sent}, skipped: ${skipped}, failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
