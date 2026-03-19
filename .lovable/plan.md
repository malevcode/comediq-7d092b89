

## Fix: Add 'sponsor' to banner_ads position check constraint

The `banner_ads` table has a CHECK constraint that only allows `position` values of `'top'` or `'bottom'`. The sponsor feature requires `'sponsor'` as a valid position.

### Action

Create a migration that drops the old constraint and adds an updated one:

```sql
ALTER TABLE public.banner_ads DROP CONSTRAINT banner_ads_position_check;
ALTER TABLE public.banner_ads ADD CONSTRAINT banner_ads_position_check
  CHECK (position = ANY (ARRAY['top', 'bottom', 'sponsor']));
```

After the migration runs, re-run the INSERT in the Supabase SQL Editor to add the Likeable Podcast row.

### Files

| File | Change |
|------|--------|
| New migration | Drop and recreate `banner_ads_position_check` to include `'sponsor'` |

