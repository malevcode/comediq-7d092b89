
# Fix Laugh Tab - Missing RLS SELECT Policy for audience_shows

## Problem Found
The Laugh tab shows "No Shows Found" even though there is data in the database. After investigation:

1. The database HAS shows (verified: 5 upcoming shows exist)
2. The API query IS working (returns HTTP 200)  
3. The response body is EMPTY (`[]`) due to **missing RLS policy**

The `audience_shows` table has Row Level Security (RLS) enabled but lacks a SELECT policy for public viewing. Current policies only allow:
- Admins to manage (all operations)
- Authenticated users to insert their own shows
- Users to update their own submissions

**No policy exists for READING shows**, so the API returns an empty array.

---

## Solution
Add a SELECT policy that allows anyone (anonymous or authenticated) to read verified, active shows.

### Database Migration
```sql
-- Add policy to allow public read access to verified active shows
CREATE POLICY "Anyone can view verified active shows"
ON audience_shows FOR SELECT
USING (
  verified = true 
  AND status = 'active'
);
```

This policy:
- Allows SELECT (read) operations for everyone
- Only exposes rows where `verified = true` AND `status = 'active'`
- Keeps unverified or inactive shows hidden from public view

---

## Summary

| Item | Change |
|------|--------|
| Database | Add SELECT RLS policy on `audience_shows` table |
| Code | No changes needed - the API logic is correct |

After this migration, the Laugh tab will immediately start showing the 5 upcoming comedy shows that are verified and active.
