import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { basename, join } from "path";

const INPUT = "scripts/austin_mics.csv";
const OUT_DIR = "scripts/generated";
const CSV_OUT = join(OUT_DIR, "austin_open_mics_supabase_import.csv");
const SQL_OUT = join(OUT_DIR, "create_austin_open_mics_table.sql");

const OUTPUT_COLUMNS = [
  "unique_identifier",
  "source_unique_identifier",
  "open_mic",
  "venue_name",
  "location",
  "neighborhood",
  "city",
  "day",
  "day_of_week",
  "frequency",
  "frequency_custom_text",
  "schedule_occurrence",
  "start_time",
  "start_time_24h",
  "latest_end_time",
  "cost",
  "stage_time",
  "signup_method",
  "signup_url",
  "signup_enabled",
  "sign_up_instructions",
  "hosts_organizers",
  "instagram_handle",
  "status",
  "active",
  "other_rules",
  "changes_updates",
  "source_file",
  "source_row_number",
  "import_batch",
  "city_slug",
  "venue_slug",
  "mic_slug",
];

const SQL = `create table if not exists public.austin_open_mics_import (
  unique_identifier text primary key,
  source_unique_identifier text not null,
  open_mic text not null,
  venue_name text,
  location text,
  neighborhood text,
  city text default 'Austin',
  day text,
  day_of_week smallint check (day_of_week between 0 and 6),
  frequency text not null default 'weekly',
  frequency_custom_text text,
  schedule_occurrence text,
  start_time text,
  start_time_24h time,
  latest_end_time text,
  cost text,
  stage_time text,
  signup_method text,
  signup_url text,
  signup_enabled boolean not null default false,
  sign_up_instructions text,
  hosts_organizers text,
  instagram_handle text,
  status text,
  active boolean not null default true,
  other_rules text,
  changes_updates text,
  source_file text not null,
  source_row_number integer not null,
  import_batch text not null,
  city_slug text,
  venue_slug text,
  mic_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists austin_open_mics_import_day_idx
  on public.austin_open_mics_import (day_of_week, start_time_24h);

create index if not exists austin_open_mics_import_frequency_idx
  on public.austin_open_mics_import (frequency);

create index if not exists austin_open_mics_import_venue_idx
  on public.austin_open_mics_import (venue_slug);
`;

const DAY_TO_NUMBER = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

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

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
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

  const [headers, ...data] = rows;
  return data
    .filter((values) => values.some((value) => value.trim()))
    .map((values, index) => {
      const record = { __source_row_number: index + 2 };
      headers.forEach((header, headerIndex) => {
        record[header] = values[headerIndex] ?? "";
      });
      record.__extra_fields = values.slice(headers.length);
      return record;
    });
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function to24Hour(time) {
  const match = String(time || "")
    .trim()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return "";

  let hour = Number(match[1]);
  const minute = match[2] || "00";
  const meridian = match[3].toUpperCase();

  if (meridian === "AM" && hour === 12) hour = 0;
  if (meridian === "PM" && hour !== 12) hour += 12;

  return `${String(hour).padStart(2, "0")}:${minute}:00`;
}

function sourceIdentifier(row) {
  return [
    row.open_mic,
    row.venue_name,
    row.day,
    row.start_time || "time-tbd",
  ]
    .map(slugify)
    .filter(Boolean)
    .join("-");
}

function frequencySplits(row) {
  const text = `${row.frequency || ""} ${row.other_rules || ""} ${row.changes_updates || ""}`;

  if (/\b1st\b/i.test(text) && /\b3rd\b/i.test(text)) {
    return [
      { frequency: "1st_of_month", schedule_occurrence: "1st" },
      { frequency: "3rd_of_month", schedule_occurrence: "3rd" },
    ];
  }

  if (/\b2nd\b/i.test(text) && /\b4th\b/i.test(text)) {
    return [
      { frequency: "2nd_of_month", schedule_occurrence: "2nd" },
      { frequency: "4th_of_month", schedule_occurrence: "4th" },
    ];
  }

  return [
    {
      frequency: row.frequency || "weekly",
      schedule_occurrence: scheduleOccurrenceFromFrequency(row.frequency),
    },
  ];
}

function scheduleOccurrenceFromFrequency(frequency) {
  const match = String(frequency || "").match(/^(\d(?:st|nd|rd|th))_of_month$/);
  if (match) return match[1];
  return frequency === "weekly" ? "weekly" : "";
}

function normalizeSignupMethod(value) {
  return String(value || "").trim();
}

function normalizeBoolean(value) {
  return /^true$/i.test(String(value || "").trim());
}

function normalizeRows(rows) {
  return rows.map(repairShiftedVenueRow).flatMap((row) => {
    const baseId = sourceIdentifier(row);
    const splits = frequencySplits(row);

    return splits.map((split, splitIndex) => {
      const uniqueId =
        splits.length > 1 ? `${baseId}-${split.schedule_occurrence}` : baseId;

      return {
        unique_identifier: uniqueId,
        source_unique_identifier: baseId,
        open_mic: row.open_mic,
        venue_name: row.venue_name,
        location: row.location,
        neighborhood: row.neighborhood,
        city: row.city || "Austin",
        day: row.day,
        day_of_week: DAY_TO_NUMBER[row.day] ?? "",
        frequency: split.frequency,
        frequency_custom_text: splits.length > 1 ? row.other_rules : "",
        schedule_occurrence: split.schedule_occurrence || String(splitIndex + 1),
        start_time: row.start_time,
        start_time_24h: to24Hour(row.start_time),
        latest_end_time: "",
        cost: row.cost,
        stage_time: row.stage_time,
        signup_method: normalizeSignupMethod(row.signup_method),
        signup_url: "",
        signup_enabled: false,
        sign_up_instructions: row.sign_up_instructions,
        hosts_organizers: row.hosts_organizers,
        instagram_handle: row.instagram_handle,
        status: row.status,
        active: normalizeBoolean(row.active),
        other_rules: row.other_rules,
        changes_updates: row.changes_updates,
        source_file: basename(INPUT),
        source_row_number: row.__source_row_number,
        import_batch: "austin-mics-2026-08-20",
        city_slug: slugify(row.city || "Austin"),
        venue_slug: slugify(row.venue_name),
        mic_slug: slugify(row.open_mic),
      };
    });
  });
}

function repairShiftedVenueRow(row) {
  const cityLikeCost = ["Austin", "San Marcos"].includes(row.cost);
  if (row.venue_name || !row.location || !cityLikeCost) return row;

  return {
    ...row,
    venue_name: row.location,
    location: row.neighborhood,
    neighborhood: row.city,
    city: row.cost,
    cost: row.stage_time,
    stage_time: row.sign_up_instructions,
    sign_up_instructions: row.hosts_organizers,
    hosts_organizers: row.signup_method,
    signup_method: row.status,
    status: row.frequency,
    frequency: row.active,
    active: row.other_rules,
    other_rules: row.changes_updates,
    changes_updates: row.instagram_handle,
    instagram_handle: row.__extra_fields?.[0] || "",
  };
}

const rows = parseCsv(readFileSync(INPUT, "utf8"));
const normalized = normalizeRows(rows);

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

console.log(`Read ${rows.length} rows from ${INPUT}`);
console.log(`Wrote ${normalized.length} normalized rows to ${CSV_OUT}`);
console.log(`Wrote table schema to ${SQL_OUT}`);
