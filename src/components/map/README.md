# Map Components

The web maps render with Mapbox GL.

Address geocoding must not run in browser map components. Open mic and audience
show maps read stored `latitude` and `longitude` values from Supabase and render
those coordinates directly.

## Components

- `OpenMicsMapRefactored.tsx` renders open mic pins from `open_mics_historical`.
- `AudienceShowsMap.tsx` renders Laugh show venues from `audience_shows`.
- `MicMiniMap.tsx` renders a small non-interactive Mapbox preview from stored mic coordinates.
- `MapInitializer.ts` retrieves the public Mapbox rendering token.

## Tokens

- `VITE_MAPBOX_TOKEN` is public and used for browser Mapbox rendering.
- Coordinate jobs do not use Mapbox tokens; they use ArcGIS geocoding.

## Coordinate Jobs

Run backend/offline jobs from the project root after applying the coordinate
migration:

```sh
npm run geocode:open-mics
npm run geocode:audience-shows
```

See `MAP_COORDINATES.md` for required environment variables and dry-run commands.

## Egress Notes

- Fetch the open mic catalog once through `useOpenMics`, then filter/search it in memory.
- Search, day toggles, borough/city filters, and map camera moves should not query Supabase again.
- Keep map components rendering from the `mics` prop and stored coordinates only.
