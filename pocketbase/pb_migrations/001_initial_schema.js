/// <reference path="../pb_data/types.d.ts" />

// Comediq PocketBase Schema Migration
// Migrated from Supabase. 35 collections covering all live + planned features.
// Auth is handled by PocketBase's built-in "users" collection (email + Google OAuth).
// The "profiles" collection extends user data and links via the "user" relation field.

migrate((app) => {

  // ─── PROFILES ────────────────────────────────────────────────────────────────
  // Linked to PocketBase auth users. supabase_user_id preserved for data import.
  const profiles = new Collection({
    name: "profiles",
    type: "base",
    fields: [
      { name: "supabase_user_id", type: "text" },
      { name: "user",             type: "relation", options: { collectionId: "_pb_users_auth_", maxSelect: 1, cascadeDelete: true } },
      { name: "username",         type: "text" },
      { name: "stage_name",       type: "text" },
      { name: "bio",              type: "text" },
      { name: "headshot_url",     type: "url" },
      { name: "phone",            type: "text" },
      { name: "isadmin",          type: "bool" },
      { name: "points_balance",   type: "number" },
      { name: "years_performing", type: "number" },
      { name: "credit",           type: "text" },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_profiles_supabase_user_id ON profiles (supabase_user_id)"],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = user",
    deleteRule: null,
  });
  app.save(profiles);

  // ─── OPEN MICS ────────────────────────────────────────────────────────────────
  const openMics = new Collection({
    name: "open_mics_historical",
    type: "base",
    fields: [
      { name: "unique_identifier",      type: "text",   required: true },
      { name: "open_mic",               type: "text",   required: true },
      { name: "venue_name",             type: "text" },
      { name: "location",               type: "text" },
      { name: "borough",                type: "text" },
      { name: "neighborhood",           type: "text" },
      { name: "city",                   type: "text" },
      { name: "day",                    type: "text" },
      { name: "start_time",             type: "text" },
      { name: "latest_end_time",        type: "text" },
      { name: "cost",                   type: "text" },
      { name: "stage_time",             type: "text" },
      { name: "frequency",              type: "text" },
      { name: "frequency_custom_text",  type: "text" },
      { name: "signup_method",          type: "text" },
      { name: "signup_url",             type: "url" },
      { name: "signup_enabled",         type: "bool" },
      { name: "sign_up_instructions",   type: "text" },
      { name: "hosts_organizers",       type: "text" },
      { name: "other_rules",            type: "text" },
      { name: "changes_updates",        type: "text" },
      { name: "sms_response",           type: "text" },
      { name: "venue_type",             type: "text" },
      { name: "status",                 type: "text" },
      { name: "active",                 type: "bool" },
      { name: "last_verified",          type: "date" },
      { name: "verification_count",     type: "number" },
      { name: "legacy_tag",             type: "text" },
      { name: "submission_date",        type: "date" },
      { name: "creator_id",             type: "text" },
      { name: "cover_image_url",        type: "url" },
      { name: "price_per_slot",         type: "number" },
      { name: "slot_duration_minutes",  type: "number" },
      { name: "slots_enabled",          type: "bool" },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_open_mics_uid ON open_mics_historical (unique_identifier)"],
    listRule:   "",
    viewRule:   "",
    createRule: "@request.auth.id != ''",
    updateRule: null,
    deleteRule: null,
  });
  app.save(openMics);

  // ─── AUDIENCE SHOWS ──────────────────────────────────────────────────────────
  const audienceShows = new Collection({
    name: "audience_shows",
    type: "base",
    fields: [
      { name: "title",                    type: "text",   required: true },
      { name: "venue_name",               type: "text",   required: true },
      { name: "venue_address",            type: "text" },
      { name: "borough",                  type: "text" },
      { name: "show_date",                type: "text",   required: true },
      { name: "show_time",                type: "text",   required: true },
      { name: "doors_time",               type: "text" },
      { name: "description",              type: "text" },
      { name: "lineup",                   type: "text" },
      { name: "ticket_url",               type: "url" },
      { name: "external_ticket_url",      type: "url" },
      { name: "ticket_price",             type: "text" },
      { name: "price_cents",              type: "number" },
      { name: "is_paid",                  type: "bool" },
      { name: "allows_rsvp",              type: "bool" },
      { name: "show_type",                type: "text" },
      { name: "host_name",                type: "text" },
      { name: "instagram_handle",         type: "text" },
      { name: "producer_ig_handle",       type: "text" },
      { name: "image_url",                type: "url" },
      { name: "expected_audience",        type: "number" },
      { name: "age_restriction",          type: "text" },
      { name: "is_featured",              type: "bool" },
      { name: "is_active",                type: "bool" },
      { name: "status",                   type: "text" },
      { name: "verified",                 type: "bool" },
      { name: "is_recurring",             type: "bool" },
      { name: "recurrence_pattern",       type: "text" },
      { name: "recurrence_day",           type: "text" },
      { name: "parent_show_id",           type: "text" },
      { name: "rsvp_count",               type: "number" },
      { name: "source",                   type: "text" },
      { name: "source_event_id",          type: "text" },
      { name: "submitted_by",             type: "text" },
      { name: "is_independently_produced",type: "bool" },
      { name: "showtn_eligible",          type: "bool" },
      { name: "showtn_discount_code",     type: "text" },
      { name: "showtn_discount_type",     type: "text" },
      { name: "showtn_discount_value",    type: "number" },
      { name: "showtn_offer_description", type: "text" },
    ],
    listRule:   "",
    viewRule:   "",
    createRule: "@request.auth.id != ''",
    updateRule: null,
    deleteRule: null,
  });
  app.save(audienceShows);

  // ─── VENUE SOURCES (affiliation registry) ────────────────────────────────────
  const venueSources = new Collection({
    name: "venue_sources",
    type: "base",
    fields: [
      { name: "source_key",        type: "text", required: true },
      { name: "venue_name",        type: "text", required: true },
      { name: "permission_status", type: "text" },
      { name: "is_active",         type: "bool" },
      { name: "contact_name",      type: "text" },
      { name: "contact_email",     type: "email" },
      { name: "notes",             type: "text" },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_venue_sources_key ON venue_sources (source_key)"],
    listRule:   "",
    viewRule:   "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
  });
  app.save(venueSources);

  // ─── USER MIC RATINGS ────────────────────────────────────────────────────────
  const micRatings = new Collection({
    name: "user_mic_ratings",
    type: "base",
    fields: [
      { name: "user_id",              type: "text", required: true },
      { name: "mic_unique_identifier",type: "text", required: true },
      { name: "rating",               type: "text", required: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_mic_ratings_user_mic ON user_mic_ratings (user_id, mic_unique_identifier)"],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = user_id",
    deleteRule: "@request.auth.id = user_id",
  });
  app.save(micRatings);

  // ─── PROFILE OPEN MICS (attendance log) ──────────────────────────────────────
  const profileOpenMics = new Collection({
    name: "profile_open_mics",
    type: "base",
    fields: [
      { name: "profile_id",       type: "text" },
      { name: "open_mic_id",      type: "text" },
      { name: "schedule_type",    type: "text" },
      { name: "custom_stage_time",type: "number" },
      { name: "notes",            type: "text" },
      { name: "last_modified",    type: "date" },
    ],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
  });
  app.save(profileOpenMics);

  // ─── PROFILE CUSTOM SHOWS ────────────────────────────────────────────────────
  const profileCustomShows = new Collection({
    name: "profile_custom_shows",
    type: "base",
    fields: [
      { name: "profile_id",         type: "text" },
      { name: "title",              type: "text" },
      { name: "venue",              type: "text" },
      { name: "date",               type: "date" },
      { name: "borough",            type: "text" },
      { name: "schedule_type",      type: "text" },
      { name: "stage_time_minutes", type: "number" },
      { name: "notes",              type: "text" },
      { name: "last_modified",      type: "date" },
    ],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
  });
  app.save(profileCustomShows);

  // ─── SAVED MICS ──────────────────────────────────────────────────────────────
  const savedMics = new Collection({
    name: "saved_mics",
    type: "base",
    fields: [
      { name: "user_id",              type: "text", required: true },
      { name: "mic_unique_identifier",type: "text", required: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_saved_mics_user_mic ON saved_mics (user_id, mic_unique_identifier)"],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: null,
    deleteRule: "@request.auth.id = user_id",
  });
  app.save(savedMics);

  // ─── ANALYTICS EVENTS ────────────────────────────────────────────────────────
  const analyticsEvents = new Collection({
    name: "analytics_events",
    type: "base",
    fields: [
      { name: "event_name", type: "text", required: true },
      { name: "event_type", type: "text", required: true },
      { name: "session_id", type: "text", required: true },
      { name: "user_id",    type: "text" },
      { name: "page_path",  type: "text" },
      { name: "metadata",   type: "json" },
    ],
    listRule:   null,
    viewRule:   null,
    createRule: "",
    updateRule: null,
    deleteRule: null,
  });
  app.save(analyticsEvents);

  // ─── USER VISITS ─────────────────────────────────────────────────────────────
  const userVisits = new Collection({
    name: "user_visits",
    type: "base",
    fields: [
      { name: "user_id",    type: "text" },
      { name: "visit_date", type: "text", required: true },
    ],
    listRule:   null,
    viewRule:   null,
    createRule: "",
    updateRule: null,
    deleteRule: null,
  });
  app.save(userVisits);

  // ─── AD CLICKS ───────────────────────────────────────────────────────────────
  const adClicks = new Collection({
    name: "ad_clicks",
    type: "base",
    fields: [
      { name: "ad_id",     type: "text", required: true },
      { name: "user_id",   type: "text" },
      { name: "placement", type: "text" },
      { name: "clicked_at",type: "date" },
    ],
    listRule:   null,
    viewRule:   null,
    createRule: "",
    updateRule: null,
    deleteRule: null,
  });
  app.save(adClicks);

  // ─── GCAL CLICKS ─────────────────────────────────────────────────────────────
  const gcalClicks = new Collection({
    name: "gcal_clicks",
    type: "base",
    fields: [
      { name: "user_id", type: "text" },
    ],
    listRule:   null,
    viewRule:   null,
    createRule: "",
    updateRule: null,
    deleteRule: null,
  });
  app.save(gcalClicks);

  // ─── MIC VERIFICATIONS ───────────────────────────────────────────────────────
  const micVerifications = new Collection({
    name: "mic_verifications",
    type: "base",
    fields: [
      { name: "mic_unique_identifier", type: "text", required: true },
      { name: "user_id",               type: "text" },
      { name: "ip_hash",               type: "text" },
      { name: "status",                type: "text" },
      { name: "verified_at",           type: "date" },
    ],
    listRule:   "",
    viewRule:   "",
    createRule: "",
    updateRule: null,
    deleteRule: null,
  });
  app.save(micVerifications);

  // ─── POINTS LEDGER ───────────────────────────────────────────────────────────
  const pointsLedger = new Collection({
    name: "points_ledger",
    type: "base",
    fields: [
      { name: "user_id",     type: "text", required: true },
      { name: "action_type", type: "text", required: true },
      { name: "amount",      type: "number", required: true },
      { name: "reason",      type: "text" },
      { name: "metadata",    type: "json" },
    ],
    listRule:   "@request.auth.id = user_id",
    viewRule:   "@request.auth.id = user_id",
    createRule: null,
    updateRule: null,
    deleteRule: null,
  });
  app.save(pointsLedger);

  // ─── COMEDIAN SOCIAL LINKS ───────────────────────────────────────────────────
  const comedianSocialLinks = new Collection({
    name: "comedian_social_links",
    type: "base",
    fields: [
      { name: "user_id",    type: "text", required: true },
      { name: "platform",   type: "text", required: true },
      { name: "handle",     type: "text", required: true },
      { name: "url",        type: "url",  required: true },
      { name: "is_primary", type: "bool" },
    ],
    listRule:   "",
    viewRule:   "",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = user_id",
    deleteRule: "@request.auth.id = user_id",
  });
  app.save(comedianSocialLinks);

  // ─── USER NOTES ──────────────────────────────────────────────────────────────
  const userNotes = new Collection({
    name: "user_notes",
    type: "base",
    fields: [
      { name: "user_id",  type: "text" },
      { name: "title",    type: "text" },
      { name: "content",  type: "text" },
      { name: "is_draft", type: "bool" },
      { name: "updated_at",type: "date" },
    ],
    listRule:   "@request.auth.id = user_id",
    viewRule:   "@request.auth.id = user_id",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = user_id",
    deleteRule: "@request.auth.id = user_id",
  });
  app.save(userNotes);

  // ─── MIC PLAYLISTS ───────────────────────────────────────────────────────────
  const micPlaylists = new Collection({
    name: "mic_playlists",
    type: "base",
    fields: [
      { name: "user_id",     type: "text", required: true },
      { name: "name",        type: "text", required: true },
      { name: "description", type: "text" },
      { name: "is_public",   type: "bool" },
      { name: "updated_at",  type: "date" },
    ],
    listRule:   "@request.auth.id = user_id || is_public = true",
    viewRule:   "@request.auth.id = user_id || is_public = true",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = user_id",
    deleteRule: "@request.auth.id = user_id",
  });
  app.save(micPlaylists);

  // ─── MIC PLAYLIST ITEMS ──────────────────────────────────────────────────────
  const micPlaylistItems = new Collection({
    name: "mic_playlist_items",
    type: "base",
    fields: [
      { name: "playlist_id",          type: "text", required: true },
      { name: "mic_unique_identifier",type: "text", required: true },
      { name: "order_index",          type: "number" },
      { name: "notes",                type: "text" },
      { name: "added_at",             type: "date" },
    ],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
  });
  app.save(micPlaylistItems);

  // ─── OPEN MICS REQUESTS (submissions) ────────────────────────────────────────
  const openMicsRequests = new Collection({
    name: "open_mics_requests",
    type: "base",
    fields: [
      { name: "unique_identifier",    type: "text" },
      { name: "open_mic",             type: "text" },
      { name: "venue_name",           type: "text" },
      { name: "location",             type: "text" },
      { name: "borough",              type: "text" },
      { name: "neighborhood",         type: "text" },
      { name: "city",                 type: "text" },
      { name: "date",                 type: "text" },
      { name: "time",                 type: "text" },
      { name: "latest_end_time",      type: "text" },
      { name: "cost",                 type: "text" },
      { name: "stage_time",           type: "text" },
      { name: "frequency",            type: "text" },
      { name: "frequency_custom_text",type: "text" },
      { name: "signup_method",        type: "text" },
      { name: "signup_url",           type: "url" },
      { name: "sign_up_instructions", type: "text" },
      { name: "hosts_organizers",     type: "text" },
      { name: "host_phone",           type: "text" },
      { name: "other_rules",          type: "text" },
      { name: "changes_updates",      type: "text" },
      { name: "venue_type",           type: "text" },
      { name: "show_title",           type: "text" },
      { name: "status",               type: "text" },
      { name: "reviewed",             type: "bool" },
      { name: "user_id",              type: "text" },
    ],
    listRule:   null,
    viewRule:   null,
    createRule: "",
    updateRule: null,
    deleteRule: null,
  });
  app.save(openMicsRequests);

  // ─── MIC COMMENTS ────────────────────────────────────────────────────────────
  const micComments = new Collection({
    name: "mic_comments",
    type: "base",
    fields: [
      { name: "user_id",              type: "text", required: true },
      { name: "mic_unique_identifier",type: "text", required: true },
      { name: "comment_text",         type: "text", required: true },
      { name: "updated_at",           type: "date" },
    ],
    listRule:   "",
    viewRule:   "",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = user_id",
    deleteRule: "@request.auth.id = user_id",
  });
  app.save(micComments);

  // ─── MIC HOSTS ───────────────────────────────────────────────────────────────
  const micHosts = new Collection({
    name: "mic_hosts",
    type: "base",
    fields: [
      { name: "user_id",     type: "text", required: true },
      { name: "mic_id",      type: "text", required: true },
      { name: "is_verified", type: "bool" },
      { name: "updated_at",  type: "date" },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_mic_hosts_user_mic ON mic_hosts (user_id, mic_id)"],
    listRule:   "",
    viewRule:   "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
  });
  app.save(micHosts);

  // ─── BANNER ADS ──────────────────────────────────────────────────────────────
  const bannerAds = new Collection({
    name: "banner_ads",
    type: "base",
    fields: [
      { name: "label",          type: "text", required: true },
      { name: "href",           type: "url",  required: true },
      { name: "icon_url",       type: "url" },
      { name: "description",    type: "text" },
      { name: "cta_text",       type: "text" },
      { name: "position",       type: "text" },
      { name: "sort_order",     type: "number" },
      { name: "is_active",      type: "bool" },
      { name: "external",       type: "bool" },
      { name: "start_date",     type: "date" },
      { name: "end_date",       type: "date" },
      { name: "client_name",    type: "text" },
      { name: "amount_paid",    type: "number" },
      { name: "payment_method", type: "text" },
    ],
    listRule:   "",
    viewRule:   "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
  });
  app.save(bannerAds);

  // ─── WEEKLY TOP MICS ─────────────────────────────────────────────────────────
  const weeklyTopMics = new Collection({
    name: "weekly_top_mics",
    type: "base",
    fields: [
      { name: "mic_unique_identifier", type: "text", required: true },
      { name: "mic_name",              type: "text", required: true },
      { name: "week_start",            type: "text", required: true },
      { name: "rank",                  type: "number", required: true },
      { name: "like_count",            type: "number" },
      { name: "day",                   type: "text" },
      { name: "start_time",            type: "text" },
      { name: "venue_name",            type: "text" },
      { name: "borough",               type: "text" },
      { name: "neighborhood",          type: "text" },
      { name: "cost",                  type: "text" },
    ],
    listRule:   "",
    viewRule:   "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
  });
  app.save(weeklyTopMics);

  // ─── MIC SIGNUP EVENTS ───────────────────────────────────────────────────────
  const micSignupEvents = new Collection({
    name: "mic_signup_events",
    type: "base",
    fields: [
      { name: "mic_id",           type: "text", required: true },
      { name: "host_id",          type: "text", required: true },
      { name: "event_date",       type: "text", required: true },
      { name: "event_time",       type: "text" },
      { name: "is_active",        type: "bool" },
      { name: "signup_mode",      type: "text" },
      { name: "total_spots",      type: "number" },
      { name: "spots_remaining",  type: "number" },
      { name: "signup_opens_at",  type: "date" },
      { name: "signup_closes_at", type: "date" },
      { name: "notes",            type: "text" },
      { name: "updated_at",       type: "date" },
    ],
    listRule:   "",
    viewRule:   "",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = host_id",
    deleteRule: null,
  });
  app.save(micSignupEvents);

  // ─── MIC SIGNUPS ─────────────────────────────────────────────────────────────
  const micSignups = new Collection({
    name: "mic_signups",
    type: "base",
    fields: [
      { name: "event_id",     type: "text", required: true },
      { name: "user_id",      type: "text" },
      { name: "guest_name",   type: "text" },
      { name: "guest_email",  type: "email" },
      { name: "guest_phone",  type: "text" },
      { name: "status",       type: "text" },
      { name: "signup_order", type: "number" },
      { name: "notes",        type: "text" },
      { name: "updated_at",   type: "date" },
    ],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "",
    updateRule: "@request.auth.id = user_id",
    deleteRule: "@request.auth.id = user_id",
  });
  app.save(micSignups);

  // ─── SHOW RSVPS ──────────────────────────────────────────────────────────────
  const showRsvps = new Collection({
    name: "show_rsvps",
    type: "base",
    fields: [
      { name: "show_id",    type: "text", required: true },
      { name: "user_id",    type: "text", required: true },
      { name: "party_size", type: "number" },
      { name: "status",     type: "text" },
      { name: "updated_at", type: "date" },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_show_rsvps_user_show ON show_rsvps (user_id, show_id)"],
    listRule:   "@request.auth.id = user_id",
    viewRule:   "@request.auth.id = user_id",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = user_id",
    deleteRule: "@request.auth.id = user_id",
  });
  app.save(showRsvps);

  // ─── WAITLIST ────────────────────────────────────────────────────────────────
  const waitlist = new Collection({
    name: "waitlist",
    type: "base",
    fields: [
      { name: "name",               type: "text",  required: true },
      { name: "email",              type: "email", required: true },
      { name: "phone",              type: "text" },
      { name: "instagram_handle",   type: "text" },
      { name: "years_in_comedy",    type: "text" },
      { name: "open_mics_per_month",type: "number" },
      { name: "monthly_spend",      type: "number" },
    ],
    listRule:   null,
    viewRule:   null,
    createRule: "",
    updateRule: null,
    deleteRule: null,
  });
  app.save(waitlist);

  // ─── GROWTH OPPORTUNITIES ────────────────────────────────────────────────────
  const growthOpps = new Collection({
    name: "growth_opportunities",
    type: "base",
    fields: [
      { name: "title",        type: "text",   required: true },
      { name: "type",         type: "text",   required: true },
      { name: "description",  type: "text" },
      { name: "venue_name",   type: "text" },
      { name: "borough",      type: "text" },
      { name: "date",         type: "date" },
      { name: "time",         type: "text" },
      { name: "compensation", type: "text" },
      { name: "contact_info", type: "text" },
      { name: "external_url", type: "url" },
      { name: "image_url",    type: "url" },
      { name: "is_active",    type: "bool" },
      { name: "is_featured",  type: "bool" },
      { name: "status",       type: "text" },
      { name: "submitted_by", type: "text" },
    ],
    listRule:   "",
    viewRule:   "",
    createRule: "@request.auth.id != ''",
    updateRule: null,
    deleteRule: null,
  });
  app.save(growthOpps);

  // ─── MIC OF THE DAY ──────────────────────────────────────────────────────────
  const micOfTheDay = new Collection({
    name: "mic_of_the_day",
    type: "base",
    fields: [
      { name: "mic_unique_identifier", type: "text", required: true },
      { name: "claimed_by",            type: "text", required: true },
      { name: "claim_date",            type: "text", required: true },
      { name: "claimed_at",            type: "date" },
      { name: "is_admin_locked",       type: "bool" },
    ],
    listRule:   "",
    viewRule:   "",
    createRule: "@request.auth.id != ''",
    updateRule: null,
    deleteRule: null,
  });
  app.save(micOfTheDay);

  // ─── MOTD NOMINATIONS ────────────────────────────────────────────────────────
  const motdNominations = new Collection({
    name: "motd_nominations",
    type: "base",
    fields: [
      { name: "mic_unique_identifier", type: "text", required: true },
      { name: "nominated_by",          type: "text", required: true },
      { name: "nomination_date",       type: "text", required: true },
    ],
    listRule:   "",
    viewRule:   "",
    createRule: "@request.auth.id != ''",
    updateRule: null,
    deleteRule: null,
  });
  app.save(motdNominations);

  // ─── MOTD NOMINATION VOTES ───────────────────────────────────────────────────
  const motdVotes = new Collection({
    name: "motd_nomination_votes",
    type: "base",
    fields: [
      { name: "nomination_id", type: "text", required: true },
      { name: "user_id",       type: "text", required: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_motd_votes_user_nom ON motd_nomination_votes (user_id, nomination_id)"],
    listRule:   "",
    viewRule:   "",
    createRule: "@request.auth.id != ''",
    updateRule: null,
    deleteRule: "@request.auth.id = user_id",
  });
  app.save(motdVotes);

  // ─── MOTD WEEKLY DEFAULTS ────────────────────────────────────────────────────
  const motdWeeklyDefaults = new Collection({
    name: "motd_weekly_defaults",
    type: "base",
    fields: [
      { name: "day_of_week",          type: "number", required: true },
      { name: "mic_unique_identifier",type: "text",   required: true },
      { name: "notes",                type: "text" },
      { name: "updated_by",           type: "text" },
      { name: "updated_at",           type: "date" },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_motd_defaults_day ON motd_weekly_defaults (day_of_week)"],
    listRule:   "",
    viewRule:   "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
  });
  app.save(motdWeeklyDefaults);

  // ─── SAVED SHOWS (future feature) ────────────────────────────────────────────
  const savedShows = new Collection({
    name: "saved_shows",
    type: "base",
    fields: [
      { name: "user_id",  type: "text", required: true },
      { name: "show_id",  type: "text", required: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_saved_shows_user_show ON saved_shows (user_id, show_id)"],
    listRule:   "@request.auth.id = user_id",
    viewRule:   "@request.auth.id = user_id",
    createRule: "@request.auth.id != ''",
    updateRule: null,
    deleteRule: "@request.auth.id = user_id",
  });
  app.save(savedShows);

  // ─── SHOW REVIEWS (future feature) ───────────────────────────────────────────
  const showReviews = new Collection({
    name: "show_reviews",
    type: "base",
    fields: [
      { name: "show_id",           type: "text",   required: true },
      { name: "user_id",           type: "text",   required: true },
      { name: "rating",            type: "number", required: true },
      { name: "review_text",       type: "text" },
      { name: "favorite_comedian", type: "text" },
      { name: "attended_date",     type: "date",   required: true },
      { name: "updated_at",        type: "date" },
    ],
    listRule:   "",
    viewRule:   "",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = user_id",
    deleteRule: "@request.auth.id = user_id",
  });
  app.save(showReviews);

  // ─── TICKET PURCHASES (future feature) ───────────────────────────────────────
  const ticketPurchases = new Collection({
    name: "ticket_purchases",
    type: "base",
    fields: [
      { name: "show_id",            type: "text",   required: true },
      { name: "user_id",            type: "text",   required: true },
      { name: "email",              type: "email" },
      { name: "quantity",           type: "number", required: true },
      { name: "total_cents",        type: "number", required: true },
      { name: "status",             type: "text" },
      { name: "stripe_checkout_id", type: "text" },
      { name: "stripe_payment_id",  type: "text" },
      { name: "updated_at",         type: "date" },
    ],
    listRule:   "@request.auth.id = user_id",
    viewRule:   "@request.auth.id = user_id",
    createRule: "@request.auth.id != ''",
    updateRule: null,
    deleteRule: null,
  });
  app.save(ticketPurchases);

  // ─── WORK HISTORY (future feature) ───────────────────────────────────────────
  const workHistory = new Collection({
    name: "work_history",
    type: "base",
    fields: [
      { name: "user_id",               type: "text", required: true },
      { name: "show_title",            type: "text", required: true },
      { name: "show_date",             type: "text", required: true },
      { name: "role_type",             type: "text", required: true },
      { name: "role_category",         type: "text" },
      { name: "show_type",             type: "text" },
      { name: "venue_name",            type: "text" },
      { name: "borough",               type: "text" },
      { name: "compensation_type",     type: "text" },
      { name: "compensation_amount",   type: "number" },
      { name: "producer_id",           type: "text" },
      { name: "producer_notes",        type: "text" },
      { name: "producer_rating",       type: "number" },
      { name: "confirmed_by_producer", type: "bool" },
      { name: "completed_at",          type: "date" },
    ],
    listRule:   "@request.auth.id = user_id",
    viewRule:   "@request.auth.id = user_id",
    createRule: "@request.auth.id != ''",
    updateRule: null,
    deleteRule: null,
  });
  app.save(workHistory);

}, (app) => {
  // Down migration — drop all collections in reverse dependency order
  const names = [
    "work_history", "ticket_purchases", "show_reviews", "saved_shows",
    "motd_weekly_defaults", "motd_nomination_votes", "motd_nominations",
    "mic_of_the_day", "growth_opportunities", "waitlist", "show_rsvps",
    "mic_signups", "mic_signup_events", "weekly_top_mics", "banner_ads",
    "mic_hosts", "mic_comments", "open_mics_requests", "mic_playlist_items",
    "mic_playlists", "user_notes", "comedian_social_links", "points_ledger",
    "mic_verifications", "gcal_clicks", "ad_clicks", "user_visits",
    "analytics_events", "saved_mics", "profile_custom_shows",
    "profile_open_mics", "user_mic_ratings", "venue_sources",
    "audience_shows", "open_mics_historical", "profiles",
  ];
  for (const name of names) {
    try {
      const col = app.findCollectionByNameOrId(name);
      app.delete(col);
    } catch (_) {}
  }
});
