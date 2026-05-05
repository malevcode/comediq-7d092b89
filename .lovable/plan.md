I confirmed this is not a Mic of the Day layout issue. The open mic feed is failing because the app cannot reach its active data source, and the old fallback source is also currently blocked.

What I verified:
- The browser is requesting PocketBase at `https://comediq-pb.fly.dev/api/collections/open_mics_historical/records...` and every request fails with `Failed to fetch`.
- A direct health/request check to `https://comediq-pb.fly.dev` times out with zero bytes returned, so the PocketBase Fly app is currently unreachable.
- Supabase still contains mic data: `398` active, non-pending mics are present in `public.open_mics_historical`.
- However, browser-accessible Supabase REST/Edge Function calls return `402` with: `Service for this project is restricted due to ... exceed_egress_quota`.

So the feed has no working live source right now:

```text
Open Mics page
  -> PocketBase primary fetch: down / unreachable
  -> Supabase browser fallback: blocked by egress quota
  -> localStorage cache: only works if that browser already loaded mics before
  -> result: Error loading open mics or empty feed
```

Plan to make this work robustly:

1. Update the open mics data hook
   - Keep PocketBase as the first attempted source.
   - Add an explicit Supabase fallback in `useOpenMics` using the existing Supabase client, mapping rows into the `OpenMic` shape.
   - Preserve the existing 7-day localStorage cache as the next fallback.
   - Add clear error metadata so the UI can distinguish: PocketBase down, Supabase quota blocked, and no local cache.

2. Add a bundled static emergency fallback
   - Generate a `public/open-mics-fallback.json` snapshot from the currently readable Supabase mic data.
   - If PocketBase fails, Supabase is blocked, and local cache is empty, load this static JSON so users still see mics.
   - This is not a replacement for the database, but it prevents a total outage on fresh browsers.

3. Improve the error/loading UI
   - Replace the generic `Error loading open mics` state with a friendlier status:
     - If fallback data is shown: “Showing saved mic data while live backend reconnects.”
     - If no fallback exists: “Live mic data is temporarily unavailable.”
   - Keep the Try Again button.
   - Avoid showing a blank feed when the issue is backend availability.

4. Add PocketBase deployment hardening in config
   - Update `pocketbase/fly.toml` from `256mb` to at least `512mb`.
   - Change auto-stop behavior so the PocketBase machine is less likely to sleep/crash during user traffic.
   - This code/config change still requires a Fly deploy outside Lovable for the live PocketBase service to recover.

5. External recovery needed
   - Supabase must have its egress quota restriction resolved for browser Supabase queries and Edge Functions to work again.
   - PocketBase on Fly must be restarted/redeployed, and the `pb_data` volume should be checked.

After approval, I’ll implement the app-side resilience immediately so the feed can load from fallback data even while PocketBase/Supabase service issues are being fixed.

<lov-actions>
  <lov-open-history>View History</lov-open-history>
</lov-actions>

<lov-actions>
<lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>