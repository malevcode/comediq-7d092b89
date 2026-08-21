import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const INPUTS = [
  {
    path: "/Users/siaqiu/Downloads/NYC Comedy Shows by Malev - Monday.csv",
    sourceDay: "Monday",
  },
  {
    path: "/Users/siaqiu/Downloads/NYC Comedy Shows by Malev - Tuesday.csv",
    sourceDay: "Tuesday",
  },
  {
    path: "/Users/siaqiu/Downloads/NYC Comedy Shows by Malev - Wednesday.csv",
    sourceDay: "Wednesday",
  },
  {
    path: "/Users/siaqiu/Downloads/NYC Comedy Shows by Malev - Thursday.csv",
    sourceDay: "Thursday",
  },
  {
    path: "/Users/siaqiu/Downloads/NYC Comedy Shows by Malev - Friday.csv",
    sourceDay: "Friday",
  },
  {
    path: "/Users/siaqiu/Downloads/NYC Comedy Shows by Malev - Saturday .csv",
    sourceDay: "Saturday",
  },
  {
    path: "/Users/siaqiu/Downloads/NYC Comedy Shows by Malev - Sunday.csv",
    sourceDay: "Sunday",
  },
  {
    path: "/Users/siaqiu/Downloads/NYC Comedy Shows by Malev - Pop up Shows.csv",
    sourceDay: "",
    defaultFrequency: "pop_up",
  },
];

const OUT_DIR = "scripts/generated";
const CSV_OUT = join(OUT_DIR, "nyc_comedy_shows_supabase_import.csv");
const SQL_OUT = join(OUT_DIR, "create_nyc_comedy_shows_table.sql");

const OUTPUT_COLUMNS = [
  "active",
  "show_name",
  "venue_name",
  "location_detail",
  "day",
  "frequency",
  "frequency_custom_text",
  "start_time",
  "booker",
  "borough",
  "instagram_url",
  "show_type",
  "import_batch",
  "notes",
];

const SQL = `create table if not exists public.nyc_comedy_shows_import (
  id uuid primary key default gen_random_uuid(),
  active boolean not null default false,
  show_name text not null,
  venue_name text,
  location_detail text,
  day text,
  frequency text not null default 'weekly',
  frequency_custom_text text,
  start_time text,
  booker text,
  borough text,
  instagram_url text,
  show_type text,
  import_batch text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nyc_comedy_shows_import_day_idx
  on public.nyc_comedy_shows_import (day, start_time);

create index if not exists nyc_comedy_shows_import_frequency_idx
  on public.nyc_comedy_shows_import (frequency);

create index if not exists nyc_comedy_shows_import_venue_idx
  on public.nyc_comedy_shows_import (venue_name);

create index if not exists nyc_comedy_shows_import_active_idx
  on public.nyc_comedy_shows_import (active);
`;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return clean(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeBorough(value) {
  const raw = clean(value);
  const key = raw.toLowerCase();
  if (!raw) return "";
  if (["bk", "brookyln", "brooklyn"].includes(key)) return "Brooklyn";
  if (["man", "manhatan", "manhattan"].includes(key)) return "Manhattan";
  if (["bk/ man", "bk/man", "brooklyn/manhattan"].includes(key)) return "Brooklyn / Manhattan";
  if (["midtown", "mcdougle", "macdougal"].includes(key)) return "Manhattan";
  if (key === "astoria") return "Queens";
  if (key === "queens") return "Queens";
  if (key === "harlem") return "Harlem";
  if (key === "bronx") return "Bronx";
  if (key === "nj") return "New Jersey";
  return raw;
}

function normalizeBoolean(value) {
  return /^true$/i.test(clean(value));
}

function inferFrequency(showName, fallback = "weekly") {
  const name = clean(showName).toLowerCase();
  if (/\b1st\s*&\s*3rd\b|\b1st\s+and\s+3rd\b/.test(name)) return "1st_and_3rd";
  if (/\bbi[\s-]?weekly\b|\(bi\)|\bbi\)/.test(name)) return "bi_weekly";
  if (/\bmonthly\b|\(\s*mon\s*\)|\(\s*monthly\s*\)/.test(name)) return "monthly";
  if (/\bpop[\s-]?up\b/.test(name)) return "pop_up";
  if (/\bweekly\b/.test(name)) return "weekly";
  return fallback;
}

function frequencyText(showName) {
  const matches = clean(showName).match(/\(([^)]+)\)/g);
  if (!matches) return "";

  return matches
    .map((match) => match.slice(1, -1).trim())
    .filter((text) => /\b(?:1st|2nd|3rd|4th|5th|first|second|third|fourth|fifth)\b|1st\s*&\s*3rd/i.test(text))
    .join("; ");
}

function stripFrequencyText(showName) {
  return clean(showName).replace(/\s*\(\s*(?:weekly|bi[\s-]?weekly|bi|monthly|mon|pop[\s-]?up|1st\s*&\s*3rd|headliner series|house shows?|spring and summer)[^)]*\)\s*/gi, " ").trim();
}

function splitTimes(value) {
  const raw = clean(value);
  if (!raw || /^various$/i.test(raw)) return [{ display: raw, time24: "" }];

  const normalized = raw
    .replace(/\./g, "")
    .replace(/\s*,\s*and\s+/gi, ", ")
    .replace(/\s+and\s+/gi, ", ")
    .replace(/\s+/g, " ")
    .trim();

  const defaultMeridian = normalized.match(/\b(pm|am)\b/i)?.[1]?.toUpperCase() || "";
  const parts = normalized
    .split(/\s*,\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.map((part) => {
    const withMeridian = /\b(am|pm)\b/i.test(part) || !defaultMeridian ? part : `${part} ${defaultMeridian}`;
    return {
      display: formatDisplayTime(withMeridian),
      time24: to24Hour(withMeridian),
    };
  });
}

function formatDisplayTime(value) {
  const cleaned = clean(value).replace(/\./g, "");
  const time24 = cleaned.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (time24) return from24Hour(Number(time24[1]), time24[2]);

  const compact = cleaned.match(/^(\d{1,2})(\d{2})\s*(am|pm)$/i);
  if (compact) return `${Number(compact[1])}:${compact[2]} ${compact[3].toUpperCase()}`;

  const bareHourMeridian = cleaned.match(/^(\d{1,2})\s*(am|pm)$/i);
  if (bareHourMeridian) return `${Number(bareHourMeridian[1])}:00 ${bareHourMeridian[2].toUpperCase()}`;

  const bareHour = cleaned.match(/^(\d{1,2})$/);
  if (bareHour) return `${Number(bareHour[1])}:00 PM`;

  const timeMeridian = cleaned.match(/^(\d{1,2})(?::(\d{2})(?::\d{2})?)?\s*(am|pm)$/i);
  if (timeMeridian) {
    return `${Number(timeMeridian[1])}:${timeMeridian[2] || "00"} ${timeMeridian[3].toUpperCase()}`;
  }

  return cleaned;
}

function from24Hour(hour, minute) {
  const meridian = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${meridian}`;
}

function to24Hour(value) {
  const cleaned = clean(value).replace(/\./g, "");
  const explicit24 = cleaned.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (explicit24) return `${explicit24[1].padStart(2, "0")}:${explicit24[2]}:00`;

  const compact = cleaned.match(/^(\d{1,2})(\d{2})\s*(am|pm)$/i);
  if (compact) return meridianTo24(Number(compact[1]), compact[2], compact[3]);

  const bareHourMeridian = cleaned.match(/^(\d{1,2})\s*(am|pm)$/i);
  if (bareHourMeridian) return meridianTo24(Number(bareHourMeridian[1]), "00", bareHourMeridian[2]);

  const bareHour = cleaned.match(/^(\d{1,2})$/);
  if (bareHour) return meridianTo24(Number(bareHour[1]), "00", "PM");

  const timeMeridian = cleaned.match(/^(\d{1,2})(?::(\d{2})(?::\d{2})?)?\s*(am|pm)$/i);
  if (timeMeridian) return meridianTo24(Number(timeMeridian[1]), timeMeridian[2] || "00", timeMeridian[3]);

  return "";
}

function meridianTo24(hour, minute, meridianRaw) {
  const meridian = meridianRaw.toUpperCase();
  let hour24 = hour;
  if (meridian === "AM" && hour24 === 12) hour24 = 0;
  if (meridian === "PM" && hour24 !== 12) hour24 += 12;
  return `${String(hour24).padStart(2, "0")}:${minute}:00`;
}

function sourceIdentifier(row, time) {
  return [
    row.showName,
    row.venueName,
    row.day || "day-tbd",
    time.time24 || time.display || "time-tbd",
  ]
    .map(slugify)
    .filter(Boolean)
    .join("-");
}

function readRows(input) {
  const parsed = parseCsv(readFileSync(input.path, "utf8"));
  const header = parsed[0] || [];
  const sourceHeader = clean(header[0]);
  const showNameHeader = sourceHeader || "Comedy Show";
  let section = sourceHeader.toLowerCase().includes("pop up") ? "pop_up_shows" : "independent_comedy_shows";

  return parsed.slice(1).flatMap((values, index) => {
    const sourceRowNumber = index + 2;
    const nonEmpty = values.map(clean).filter(Boolean);
    if (!nonEmpty.length) return [];

    if (nonEmpty.length === 1 && /club\s*house/i.test(nonEmpty[0])) {
      section = "club_house_shows";
      return [];
    }

    const showName = clean(values[0]);
    const venueName = clean(values[1]);
    const showTimeRaw = clean(values[2]);
    if (!showName || !venueName || !showTimeRaw || /club\s*house/i.test(showName)) return [];

    const extraValues = values.slice(7).map(clean).filter(Boolean);
    const secondaryUrl = extraValues.find((value) => /^https?:\/\//i.test(value)) || "";

    return [
      {
        showName,
        venueName,
        showTimeRaw,
        booker: clean(values[3]),
        boroughRaw: clean(values[4]),
        instagramUrl: clean(values[5]),
        active: normalizeBoolean(values[6]),
        secondaryUrl,
        sourceRowNumber,
        sourceHeader: showNameHeader,
        sourceSection: section,
        day: input.sourceDay,
        defaultFrequency: input.defaultFrequency || "weekly",
      },
    ];
  });
}

function normalizeRow(row) {
  const frequency = inferFrequency(row.showName, row.defaultFrequency);
  const times = splitTimes(row.showTimeRaw);
  const cleanShowName = stripFrequencyText(row.showName);
  const sourceBase = [
    cleanShowName,
    row.venueName,
    row.day || "day-tbd",
    row.showTimeRaw || "time-tbd",
  ]
    .map(slugify)
    .filter(Boolean)
    .join("-");
  const isClubShow = row.sourceSection === "club_house_shows";
  const isPopUp = frequency === "pop_up" || row.sourceSection === "pop_up_shows";

  return times.map((time, timeIndex) => {
    const uniqueIdentifier = sourceIdentifier({ ...row, showName: cleanShowName }, time);
    return {
      unique_identifier: uniqueIdentifier,
      source_unique_identifier: sourceBase,
      show_name: cleanShowName,
      venue_name: row.venueName,
      location_detail: locationDetail(row.venueName),
      day: row.day,
      frequency,
      frequency_custom_text: frequencyText(row.showName),
      start_time: time.display,
      booker: row.booker,
      borough: normalizeBorough(row.boroughRaw),
      instagram_url: row.instagramUrl,
      active: row.active,
      show_type: isClubShow ? "club_house" : isPopUp ? "pop_up" : "independent",
      import_batch: "nyc-comedy-shows-2026-08-20",
      notes: notesFor(row),
    };
  });
}

function locationDetail(venueName) {
  const match = clean(venueName).match(/\(([^)]+)\)/);
  return match ? match[1].trim() : "";
}

function notesFor(row) {
  const notes = [];
  if (/dm for|dm location|dm locatioins|dm for address|dm for adress/i.test(row.venueName)) notes.push("DM for location/address");
  if (/various/i.test(row.showTimeRaw)) notes.push("Time varies");
  if (row.secondaryUrl) notes.push(`Additional URL: ${row.secondaryUrl}`);
  return notes.join("; ");
}

const sourceRows = INPUTS.flatMap(readRows);
const normalizedWithDuplicates = sourceRows.flatMap(normalizeRow);
const normalized = [];
const seenIdentifiers = new Set();
for (const row of normalizedWithDuplicates) {
  if (seenIdentifiers.has(row.unique_identifier)) continue;
  seenIdentifiers.add(row.unique_identifier);
  normalized.push(row);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(
  CSV_OUT,
  [
    OUTPUT_COLUMNS.join(","),
    ...normalized.map((row) =>
      OUTPUT_COLUMNS.map((column) => csvEscape(row[column])).join(","),
    ),
    "",
  ].join("\n"),
);
writeFileSync(SQL_OUT, SQL);

console.log(`Read ${sourceRows.length} source show rows from ${INPUTS.length} CSV files`);
console.log(`Wrote ${normalized.length} normalized show rows to ${CSV_OUT}`);
console.log(`Skipped ${normalizedWithDuplicates.length - normalized.length} duplicate normalized rows`);
console.log(`Wrote table schema to ${SQL_OUT}`);
