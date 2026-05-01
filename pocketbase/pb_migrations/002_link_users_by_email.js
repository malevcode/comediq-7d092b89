/// <reference path="../pb_data/types.d.ts" />

// Two-part migration:
//   1. Adds an "email" field to profiles so CSV import can carry the user's email.
//   2. After users exist (they sign in via Google), links each profile to its auth user by email.
//
// Run order:
//   a) Deploy → PocketBase auto-applies this migration (adds the email field).
//   b) Import profiles CSV (must include an "email" column).
//   c) Users sign in via Google at least once.
//   d) Re-run the linkage by calling the /api/link-profiles admin endpoint, OR
//      restart PocketBase after deleting this file from pb_data/migrations to re-trigger.
//      Simplest: just call the linkUsers() logic from a JS hook or admin API.

migrate((app) => {
  // Step 1 — add email column to profiles if absent
  const profilesCollection = app.findCollectionByNameOrId("profiles");
  const hasEmail = profilesCollection.fields.some((f) => f.getName() === "email");
  if (!hasEmail) {
    profilesCollection.fields.add(
      new Field({ name: "email", type: "email" })
    );
    app.save(profilesCollection);
  }

  // Step 2 — link profiles to auth users by email (safe to re-run; skips already-linked rows)
  const authUsers = app.findAllRecords("users");

  const emailToUserId = {};
  for (const u of authUsers) {
    const email = u.getString("email");
    if (email) emailToUserId[email.toLowerCase()] = u.getId();
  }

  const profiles = app.findAllRecords("profiles");
  let linked = 0;

  for (const profile of profiles) {
    if (profile.getString("user")) continue;

    const profileEmail = profile.getString("email");
    if (!profileEmail) continue;

    const userId = emailToUserId[profileEmail.toLowerCase()];
    if (!userId) continue;

    profile.set("user", userId);
    app.save(profile);
    linked++;
  }

  console.log(`002_link_users_by_email: linked ${linked} profiles`);
}, (app) => {
  // Down — remove email field from profiles and unlink all user relations
  const profilesCollection = app.findCollectionByNameOrId("profiles");
  profilesCollection.fields.removeByName("email");
  app.save(profilesCollection);

  const profiles = app.findAllRecords("profiles");
  for (const profile of profiles) {
    profile.set("user", "");
    app.save(profile);
  }
});
