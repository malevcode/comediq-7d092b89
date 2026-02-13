

# Ads Manager Expansion: CRM, Outreach, and Advertiser Management

## Overview
Expand the existing Ads tab in the Admin Dashboard into a full-featured advertising management platform with CRM capabilities, outreach tracking, and advertiser/business management -- all within the existing admin interface.

## What You'll Get

### 1. Advertisers CRM
A contacts database for managing all advertisers, comedy clubs, and comedy businesses:
- **Contact cards** with: business name, contact person, email, phone, Instagram, website, type (comedy club, podcast, school, brand, other), borough/location
- **Status pipeline**: Lead -> Contacted -> Negotiating -> Active Client -> Churned
- **Notes/activity log** per contact: timestamped notes for tracking conversations, meetings, follow-ups
- **Quick filters** by status, type, and search by name

### 2. Outreach Tracker
Track sales outreach efforts tied to each advertiser contact:
- **Outreach log entries**: date, method (email, DM, in-person, call), subject/message summary, outcome (no reply, interested, declined, deal closed)
- **Follow-up reminders**: mark a contact as "needs follow-up" with a target date; see overdue follow-ups highlighted
- **Outreach stats**: total outreach attempts, response rate, conversion rate displayed as summary cards

### 3. Enhanced Ads Manager
Upgrade the existing banner ads tab with sub-navigation:
- **Sub-tabs**: "Active Ads" | "All Ads" | "Advertisers" | "Outreach"
- **Revenue dashboard cards** at the top: total revenue, active ads count, total clicks, avg CTR
- **Link ads to advertisers**: each banner ad can be associated with an advertiser contact from the CRM
- **Invoice/payment history** on each advertiser card showing all their ads and total spend

---

## Technical Details

### Database: New Tables

**`ad_contacts`** -- CRM for advertisers and comedy businesses:
```text
id              uuid PK
business_name   text NOT NULL
contact_name    text
email           text
phone           text
instagram       text
website         text
business_type   text (comedy_club, podcast, school, brand, venue, other)
borough         text
status          text (lead, contacted, negotiating, active, churned) DEFAULT 'lead'
notes           text
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

**`ad_contact_notes`** -- Activity log per contact:
```text
id              uuid PK
contact_id      uuid FK -> ad_contacts.id ON DELETE CASCADE
note            text NOT NULL
created_by      uuid (nullable, admin user id)
created_at      timestamptz DEFAULT now()
```

**`ad_outreach`** -- Outreach log:
```text
id              uuid PK
contact_id      uuid FK -> ad_contacts.id ON DELETE CASCADE
outreach_date   date DEFAULT CURRENT_DATE
method          text (email, dm, in_person, call, other)
subject         text
outcome         text (no_reply, interested, declined, closed) DEFAULT 'no_reply'
follow_up_date  date (nullable)
notes           text
created_by      uuid (nullable)
created_at      timestamptz DEFAULT now()
```

**Schema change to `banner_ads`**: Add `contact_id uuid` column (nullable FK to `ad_contacts.id`) to link ads to advertiser contacts.

RLS policies: All tables admin-only for full CRUD (via `user_admin` check). Read-only not needed since these are internal management tables.

### New Files

- **`src/components/admin/ads/AdsManagerTabs.tsx`** -- Sub-tab container replacing the current flat `AdminBannerAdsManager`. Renders 4 sub-tabs: Active Ads, All Ads, Advertisers, Outreach
- **`src/components/admin/ads/AdsDashboardCards.tsx`** -- Summary cards showing total revenue, active ads, total clicks, conversion rate
- **`src/components/admin/ads/AdvertisersList.tsx`** -- CRM list with filters, search, status badges, and inline add/edit
- **`src/components/admin/ads/AdvertiserDetail.tsx`** -- Expandable detail view for a single contact showing notes, outreach history, and linked ads
- **`src/components/admin/ads/OutreachLog.tsx`** -- Outreach entries list with filters by method/outcome, follow-up date highlighting
- **`src/components/admin/ads/AddContactModal.tsx`** -- Modal form for adding/editing an advertiser contact
- **`src/components/admin/ads/AddOutreachModal.tsx`** -- Modal form for logging an outreach attempt
- **`src/hooks/useAdContacts.ts`** -- React Query hooks for CRUD on `ad_contacts`, `ad_contact_notes`, and `ad_outreach`

### Edited Files

- **`src/components/admin/AdminBannerAdsManager.tsx`** -- Refactored: wrap existing ad list content into the new sub-tab structure; add advertiser linking dropdown to ad edit form
- **`src/pages/AdminInterface.tsx`** -- No structural changes needed (already renders `AdminBannerAdsManager` in the Ads tab)
- **`src/hooks/useBannerAds.ts`** -- Add `contact_id` to the `BannerAd` interface

### Migration File
A single migration with:
1. Create `ad_contacts` table with trigger for `updated_at`
2. Create `ad_contact_notes` table
3. Create `ad_outreach` table
4. Add `contact_id` column to `banner_ads`
5. RLS policies (admin-only) for all three new tables
6. Database view `ad_revenue_summary` aggregating total revenue, active ads count

