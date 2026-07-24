# Open Mic Map Coordinates

The open mic and audience show maps render stored `latitude` and `longitude`
values from Supabase. The browser should not geocode addresses on map load.

`VITE_MAPBOX_TOKEN` is the public browser token for map rendering only. Put it in
`.env.local` for local development and in the deployment environment for
production.

## One-time setup

Apply the coordinate migration:

```sh
supabase db push
```

or run:

```sql
supabase/migrations/20260616000100_add_open_mic_coordinates.sql
```

## Populate coordinates

Run the backend/offline coordinate job from `comediq-web`. The job uses ArcGIS
geocoding and does not call Mapbox's paid permanent geocoding API.

```sh
SUPABASE_URL="..." \
SUPABASE_SERVICE_ROLE_KEY="..." \
npm run geocode:open-mics
```

Populate audience show coordinates separately:

```sh
SUPABASE_URL="..." \
SUPABASE_SERVICE_ROLE_KEY="..." \
npm run geocode:audience-shows
```

Test without writing first:

```sh
DRY_RUN=true GEOCODE_LIMIT=10 npm run geocode:open-mics
```

After the tables are populated, the web maps read stored coordinates only.
Open mic pins render from `public/map-pins`.
