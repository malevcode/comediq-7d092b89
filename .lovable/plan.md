

## Insert Likeable Podcast Sponsor

This is a data insertion task, not a code change. The sponsor infrastructure (SponsorSection, PageHeader placement, click tracking) is already built.

### Action

Insert one row into `banner_ads` via the Supabase insert tool:

| Column | Value |
|--------|-------|
| `label` | `Likeable Podcast` |
| `href` | `https://youtube.com/playlist?list=PLnHfEX5rBprYo7ASx3JK__PLnJCTvNFnx&si=lNB63gdc50CmuJJz` |
| `icon_url` | `/images/likeable-podcast.png` |
| `description` | `{SPONSOR_BLURB}` (placeholder — you'll replace with actual copy) |
| `cta_text` | `Listen Now` |
| `position` | `sponsor` |
| `is_active` | `true` |
| `external` | `true` |
| `start_date` | `2026-04-01` |
| `end_date` | `2026-05-01` |
| `amount_paid` | `140` |
| `client_name` | `Likeable Podcast` |

Once inserted, the sponsor will automatically appear in:
1. **Header** — small logo/link via `PageHeader`
2. **Landing page** — full `SponsorSection` with logo, blurb, and "Listen Now" CTA

Both placements already track clicks to `ad_clicks` with the correct `placement` value.

**Note**: The `{SPONSOR_BLURB}` placeholder will show until you update the `description` with the real 3-5 sentence blurb from the advertiser.

