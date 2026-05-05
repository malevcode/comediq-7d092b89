import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://wwqoztrqprqksdubjwgj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cW96dHJxcHJxa3NkdWJqd2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDA5NzYsImV4cCI6MjA5MzUxNjk3Nn0.qYBpB5qHDyuHVfzwz6q7yzJgTUB0Xps6t_ezlh9kA9w';

const sql = readFileSync('C:/Users/adamm/Downloads/open_mics_historical_rows.sql', 'utf8');

const headerMatch = sql.match(/INSERT INTO[^(]+\(([^)]+)\)/);
if (!headerMatch) { console.error('Could not parse columns'); process.exit(1); }
const columns = headerMatch[1].split(',').map(c => c.trim().replace(/"/g, ''));

function parseSqlValues(valStr) {
  const rows = [];
  let i = 0;
  while (i < valStr.length) {
    if (valStr[i] !== '(') { i++; continue; }
    i++;
    const values = [];
    while (i < valStr.length && valStr[i] !== ')') {
      if (valStr[i] === ' ' || valStr[i] === ',') { i++; continue; }
      if (valStr.slice(i, i + 4) === 'null') {
        values.push(null); i += 4;
      } else if (valStr.slice(i, i + 4) === 'true') {
        values.push(true); i += 4;
      } else if (valStr.slice(i, i + 5) === 'false') {
        values.push(false); i += 5;
      } else if (valStr[i] === "'") {
        i++;
        let str = '';
        while (i < valStr.length) {
          if (valStr[i] === "'" && valStr[i + 1] === "'") { str += "'"; i += 2; }
          else if (valStr[i] === "'") { i++; break; }
          else { str += valStr[i++]; }
        }
        values.push(str);
      } else {
        let num = '';
        while (i < valStr.length && valStr[i] !== ',' && valStr[i] !== ')') num += valStr[i++];
        values.push(num === '' ? null : isNaN(Number(num)) ? num : Number(num));
      }
    }
    if (values.length === columns.length) {
      const obj = {};
      columns.forEach((col, idx) => { obj[col] = values[idx]; });
      rows.push(obj);
    }
    i++;
  }
  return rows;
}

const valuesStart = sql.indexOf(' VALUES ') + 8;
const valuesSql = sql.slice(valuesStart).trim().replace(/;$/, '');

console.log('Parsing rows...');
const records = parseSqlValues(valuesSql);
console.log(`Parsed ${records.length} records`);

const BATCH = 100;
let inserted = 0;
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates'
};

for (let i = 0; i < records.length; i += BATCH) {
  const batch = records.slice(i, i + BATCH);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/open_mics_historical`, {
    method: 'POST',
    headers,
    body: JSON.stringify(batch)
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`\nBatch ${Math.floor(i/BATCH)+1} failed:`, err.slice(0, 200));
  } else {
    inserted += batch.length;
    process.stdout.write(`\rInserted ${inserted}/${records.length}`);
  }
}
console.log(`\nDone! ${inserted}/${records.length} records loaded.`);
