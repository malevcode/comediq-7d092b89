

## Fix: Consistent Logo and Clean Admin Header

### 1. PageHeader logo fix (`src/components/PageHeader.tsx`)

The logo image is inside a flex container without `shrink-0`, so it compresses when the title text is long. Also the container uses `h-12` which constrains the logo.

**Changes:**
- Add `shrink-0` to the logo wrapper so it never compresses
- Set a fixed width/height on the image (`h-10 w-auto`) for consistency
- Add `shrink-0` to the hamburger menu wrapper too

### 2. Admin Dashboard header cleanup (`src/pages/AdminInterface.tsx`)

The admin page passes `title="Admin Dashboard"` and `subtitle="Manage open mic requests and content"` into PageHeader, making the fixed nav bar very cluttered on mobile. The header should just show "Comediq" (or nothing extra) like the landing page. Move the admin title/subtitle below the header as a page-level heading.

**Changes:**
- Remove `title` and `subtitle` props from `<PageHeader />` so it defaults to "Comediq"
- Add an inline heading below the header (inside the `pt-28` content area) that says "Admin Dashboard" with the subtitle

### 3. Tab bar overflow (`src/pages/AdminInterface.tsx`)

The 8-column tab grid is overflowing on mobile (visible in screenshot). Switch to `flex flex-wrap` or horizontal scroll.

**Changes:**
- Change `grid grid-cols-8` to `flex flex-wrap` on the TabsList so tabs wrap naturally on small screens

| File | Change |
|------|--------|
| `src/components/PageHeader.tsx` | Add `shrink-0` to logo and menu wrappers |
| `src/pages/AdminInterface.tsx` | Remove title/subtitle from PageHeader, add page heading, fix tab overflow |

