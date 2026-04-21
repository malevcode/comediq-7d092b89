export interface ParsedShow {
  date: string | null;    // YYYY-MM-DD
  time: string | null;    // HH:MM (24h)
  venue: string | null;
  borough: string | null;
  stageTime: number;      // minutes, default 5
  rating: number | null;  // 1–10
  notes: string;
}

export interface VenueEntry {
  venue_name: string;
  borough: string | null;
}

// Sentiment phrases → numeric rating
const SENTIMENTS: [RegExp, number][] = [
  [/\b(killed it|crushed|murdered|destroyed|slayed|slew)\b/i, 9],
  [/\b(great|solid|really good|nailed it)\b/i, 8],
  [/\b(good|decent|worked|landed)\b/i, 7],
  [/\b(okay|meh|alright|fine)\b/i, 6],
  [/\b(rough|struggled|tough crowd)\b/i, 4],
  [/\b(bombed|died|tanked|crickets)\b/i, 3],
];

function parseDate(input: string): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const shifted = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return fmt(d);
  };

  if (/\blast\s+night\b/i.test(input) || /\byesterday\b/i.test(input)) return shifted(-1);
  if (/\btonight\b|\btoday\b/i.test(input)) return fmt(today);

  const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  for (let i = 0; i < DAY_NAMES.length; i++) {
    if (new RegExp(`\\b${DAY_NAMES[i]}\\b`, 'i').test(input)) {
      const diff = ((today.getDay() - i) + 7) % 7 || 7;
      return shifted(-diff);
    }
  }

  // MM/DD or MM/DD/YY or MM/DD/YYYY
  let m = input.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (m) {
    let year = today.getFullYear();
    if (m[3]) { year = parseInt(m[3]); if (year < 100) year += 2000; }
    return `${year}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`;
  }

  // "Dec 28" / "December 28"
  const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const SHORT = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  m = input.match(new RegExp(`\\b(${[...MONTHS,...SHORT].join('|')})\\.?\\s+(\\d{1,2})\\b`, 'i'));
  if (m) {
    const lc = m[1].toLowerCase();
    const idx = MONTHS.indexOf(lc) !== -1 ? MONTHS.indexOf(lc) : SHORT.findIndex(s => lc.startsWith(s));
    if (idx !== -1) {
      return `${today.getFullYear()}-${(idx+1).toString().padStart(2,'0')}-${parseInt(m[2]).toString().padStart(2,'0')}`;
    }
  }

  return null;
}

function parseTime(input: string): string | null {
  // "8:30 PM", "8:30PM"
  let m = input.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)\b/i);
  if (m) {
    let h = parseInt(m[1]);
    const period = m[3].toLowerCase();
    if (period === 'pm' && h !== 12) h += 12;
    if (period === 'am' && h === 12) h = 0;
    return `${h.toString().padStart(2,'0')}:${m[2]}`;
  }
  // "8pm", "8 PM"
  m = input.match(/\b(\d{1,2})\s*(am|pm)\b/i);
  if (m) {
    let h = parseInt(m[1]);
    const period = m[2].toLowerCase();
    if (period === 'pm' && h !== 12) h += 12;
    if (period === 'am' && h === 12) h = 0;
    return `${h.toString().padStart(2,'0')}:00`;
  }
  // 24-hour "20:00"
  m = input.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (m) return `${m[1].padStart(2,'0')}:${m[2]}`;
  // "at 8" — assume PM for comedy
  m = input.match(/\bat\s+(\d{1,2})\b/i);
  if (m) {
    let h = parseInt(m[1]);
    if (h < 12) h += 12;
    return `${h.toString().padStart(2,'0')}:00`;
  }
  return null;
}

function parseStageTime(input: string): number {
  // "5 min", "5 minutes", "5m"
  let m = input.match(/\b(\d+)\s*(?:min(?:utes?)?|m)\b/i);
  if (m) return parseInt(m[1]);
  // "did 5", "got 7"
  m = input.match(/\b(?:did|got)\s+(\d+)\b/i);
  if (m) return parseInt(m[1]);
  return 5;
}

function parseRating(input: string): number | null {
  // "8.5/10", "8/10"
  let m = input.match(/\b(\d+(?:\.\d+)?)\/10\b/);
  if (m) return parseFloat(m[1]);
  // Sentiment
  for (const [re, rating] of SENTIMENTS) {
    if (re.test(input)) return rating;
  }
  // Standalone number at end of string (only if 1–10)
  m = input.match(/\b(\d+(?:\.\d+)?)\s*$/);
  if (m) {
    const v = parseFloat(m[1]);
    if (v >= 1 && v <= 10) return v;
  }
  return null;
}

function matchVenue(input: string, venues: VenueEntry[]): { venue: string | null; borough: string | null } {
  if (!venues.length) return { venue: null, borough: null };
  const lower = input.toLowerCase();
  let best: VenueEntry | null = null;
  let bestLen = 0;

  for (const v of venues) {
    const name = v.venue_name.toLowerCase();
    // Try progressively shorter prefixes of the venue name
    for (let len = Math.min(name.length, 30); len >= 3; len--) {
      const segment = name.slice(0, len);
      if (lower.includes(segment) && len > bestLen) {
        bestLen = len;
        best = v;
        break;
      }
    }
    // Also match on individual words from the venue name
    for (const word of name.split(/\s+/)) {
      if (word.length >= 4 && lower.includes(word) && word.length > bestLen) {
        bestLen = word.length;
        best = v;
      }
    }
  }

  return best ? { venue: best.venue_name, borough: best.borough } : { venue: null, borough: null };
}

export function parseShow(input: string, venues: VenueEntry[] = []): ParsedShow {
  return {
    date: parseDate(input),
    time: parseTime(input),
    stageTime: parseStageTime(input),
    rating: parseRating(input),
    notes: '',
    ...matchVenue(input, venues),
  };
}
