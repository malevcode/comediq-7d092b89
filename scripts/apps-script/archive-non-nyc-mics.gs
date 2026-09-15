/**
 * Archive non-NYC mics out of the public "open NYC Mics" Google Sheet.
 *
 * The public sheet has no `city` or `active` column (those live in Supabase,
 * see scripts/export-mics.mjs). The only location signal in the sheet is the
 * "Location" column, so that is what this script filters on.
 *
 * Rows are MOVED to an "Archive - Non NYC" tab, never hard-deleted, so a bad
 * match can be pasted back.
 *
 * How to run:
 *   1. Open the sheet > Extensions > Apps Script
 *   2. Paste this file, Save
 *   3. Run `previewNonNycMics` first. It only logs, it changes nothing.
 *   4. If the list looks right, run `archiveNonNycMics`.
 */

// A location counts as NYC if it names a borough, "New York", or the NY state code.
var NYC = /\b(NY|New York|NYC|Brooklyn|Queens|Astoria|Bronx|Manhattan|Staten Island)\b/i;

// A location counts as out-of-town if it names another metro or state code.
var NOT_NYC = /\b(Los Angeles|California|Hollywood|Burbank|Riverside|Rancho Cucamonga|Austin|Chicago|Philadelphia|Boston|CA|TX|IL|PA|MA|NJ|CT|SC|FL|GA|WA|OR|CO|AZ)\b/i;

var ARCHIVE_TAB = "Archive - Non NYC";
var HEADER_CELL = "Open Mic";     // column A of the header row on every mic tab
var LOCATION_HEADER = "Location";

/** True only when the location clearly names somewhere other than New York. */
function isOutOfTown(location) {
  var text = String(location || "").trim();
  if (!text) return false;                  // blank stays put
  if (NYC.test(text)) return false;         // any NYC marker wins
  return NOT_NYC.test(text);                // otherwise, only leave on a clear hit
}

/** Finds the header row index (1-based) and the Location column index (1-based). */
function locateHeader(sheet) {
  var values = sheet.getDataRange().getValues();
  for (var r = 0; r < Math.min(values.length, 20); r++) {
    var row = values[r];
    for (var c = 0; c < row.length; c++) {
      if (String(row[c]).trim() === HEADER_CELL) {
        for (var k = 0; k < row.length; k++) {
          if (String(row[k]).trim() === LOCATION_HEADER) {
            return { headerRow: r + 1, locationCol: k + 1, values: values };
          }
        }
      }
    }
  }
  return null;                               // not a mic tab
}

/** Logs what would be archived. Changes nothing. */
function previewNonNycMics() {
  var report = collect_(false);
  Logger.log(report);
  SpreadsheetApp.getUi().alert(report);
}

/** Moves out-of-town rows to the archive tab. */
function archiveNonNycMics() {
  var report = collect_(true);
  Logger.log(report);
  SpreadsheetApp.getUi().alert(report);
}

function collect_(apply) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var archive = apply ? getArchiveTab_(ss) : null;
  var lines = [];
  var total = 0;

  ss.getSheets().forEach(function (sheet) {
    if (sheet.getName() === ARCHIVE_TAB) return;
    var found = locateHeader(sheet);
    if (!found) return;                      // skip the email log and any non-mic tab

    var values = found.values;
    var hits = [];                           // row numbers, 1-based
    for (var r = found.headerRow; r < values.length; r++) {
      var location = values[r][found.locationCol - 1];
      if (isOutOfTown(location)) {
        hits.push(r + 1);
        lines.push(sheet.getName() + " row " + (r + 1) + ": " +
                   values[r][0] + "  [" + location + "]");
      }
    }
    if (!hits.length) return;
    total += hits.length;

    if (apply) {
      // Copy to the archive first, then delete bottom-up so indexes stay valid.
      hits.forEach(function (rowNum) {
        archive.appendRow([sheet.getName()].concat(values[rowNum - 1]));
      });
      hits.slice().reverse().forEach(function (rowNum) {
        sheet.deleteRow(rowNum);
      });
    }
  });

  var head = apply ? ("Archived " + total + " non-NYC rows:\n\n")
                   : ("Would archive " + total + " non-NYC rows:\n\n");
  return head + (lines.join("\n") || "(none found)");
}

function getArchiveTab_(ss) {
  var tab = ss.getSheetByName(ARCHIVE_TAB);
  if (!tab) {
    tab = ss.insertSheet(ARCHIVE_TAB);
    tab.appendRow(["Came from tab", "Open Mic", "Day", "Start Time", "Latest End Time",
                   "Venue Name", "Borough", "Neighborhood", "Location", "Venue type",
                   "Cost", "Stage time", "Sign-Up Instructions", "Host(s) / Organizer",
                   "Changes/updates", "Last verified", "This Month's Changes",
                   "Other Rules", "Reviews", "unique identifier"]);
  }
  return tab;
}
