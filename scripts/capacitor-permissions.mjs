/**
 * Adds the location permissions Comediq's check-in needs to the native projects.
 *
 * Capacitor generates ios/ and android/ from templates that know nothing about
 * what our app does, so the permission entries have to be added afterwards.
 * Doing it by hand is the kind of step everyone forgets once and then spends an
 * afternoon debugging a permission prompt that never appears.
 *
 * Run it after `npx cap add ios` / `npx cap add android`. It is idempotent:
 * running it twice changes nothing the second time.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";

const WHY = "Comediq uses your location to confirm you are at the open mic when you check in.";

const IOS_PLIST = "ios/App/App/Info.plist";
const ANDROID_MANIFEST = "android/app/src/main/AndroidManifest.xml";

const IOS_KEYS = [
  "NSLocationWhenInUseUsageDescription",
  // Required by the plugin's underlying library even though the prompt never shows.
  "NSLocationAlwaysAndWhenInUseUsageDescription",
];

const ANDROID_ENTRIES = [
  '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
  '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
];

let changed = 0;
let skipped = 0;

function patchInfoPlist() {
  if (!existsSync(IOS_PLIST)) {
    console.log(`  skip  ${IOS_PLIST} (run "npx cap add ios" first)`);
    skipped++;
    return;
  }

  let plist = readFileSync(IOS_PLIST, "utf8");
  const missing = IOS_KEYS.filter((key) => !plist.includes(`<key>${key}</key>`));

  if (missing.length === 0) {
    console.log(`  ok    ${IOS_PLIST} already has both location keys`);
    return;
  }

  // Info.plist is <plist><dict> ... </dict></plist>. Insert right after the
  // opening <dict> so we never have to understand the rest of the file.
  const anchor = plist.indexOf("<dict>");
  if (anchor === -1) {
    throw new Error(`${IOS_PLIST} has no <dict> element; refusing to guess where to write`);
  }

  const insertAt = anchor + "<dict>".length;
  const block = missing
    .map((key) => `\n\t<key>${key}</key>\n\t<string>${WHY}</string>`)
    .join("");

  plist = plist.slice(0, insertAt) + block + plist.slice(insertAt);
  writeFileSync(IOS_PLIST, plist);
  console.log(`  added ${missing.join(", ")} to ${IOS_PLIST}`);
  changed++;
}

function patchAndroidManifest() {
  if (!existsSync(ANDROID_MANIFEST)) {
    console.log(`  skip  ${ANDROID_MANIFEST} (run "npx cap add android" first)`);
    skipped++;
    return;
  }

  let manifest = readFileSync(ANDROID_MANIFEST, "utf8");
  const missing = ANDROID_ENTRIES.filter((entry) => {
    const permission = entry.match(/android:name="([^"]+)"/)[1];
    return !manifest.includes(permission);
  });

  if (missing.length === 0) {
    console.log(`  ok    ${ANDROID_MANIFEST} already has both location permissions`);
    return;
  }

  // Insert after the opening <manifest ...> tag.
  const open = manifest.match(/<manifest\b[^>]*>/);
  if (!open) {
    throw new Error(`${ANDROID_MANIFEST} has no <manifest> element; refusing to guess where to write`);
  }

  const insertAt = open.index + open[0].length;
  const block = "\n\n    <!-- Comediq mic check-in verifies you are at the venue. -->\n" +
    missing.map((entry) => `    ${entry}`).join("\n");

  manifest = manifest.slice(0, insertAt) + block + manifest.slice(insertAt);
  writeFileSync(ANDROID_MANIFEST, manifest);
  console.log(`  added ${missing.length} permission(s) to ${ANDROID_MANIFEST}`);
  changed++;
}

console.log("Capacitor location permissions:");
patchInfoPlist();
patchAndroidManifest();

if (skipped === 2) {
  console.log("\nNo native projects found. Nothing to do yet.");
} else {
  console.log(`\n${changed} file(s) changed.`);
}
