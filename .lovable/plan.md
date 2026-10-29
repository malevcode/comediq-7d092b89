# Blog section

## Pages and design
- Add `/blog`, listing published posts newest first with a linked title, publication date, and one-line excerpt.
- Add `/blog/:slug` with one readable column, author and date, and formatted headings, paragraphs, lists, links, and images.
- Match the existing header, typography, colors, and footer. Add Blog to the footer only, not the main navigation.
- Show a simple empty state until real posts are supplied; do not invent published articles or authors.

## Search and publishing
- Give the index and each post unique metadata within the existing 60/160-character limits and self-referencing `https://comediq.us` canonicals.
- Include Article markup with headline, author, publication and modification dates, plus Home → Blog → Post breadcrumbs.
- Use the existing pre-rendering mechanism so post content and metadata appear in initial published HTML.
- Extend the existing sitemap with the blog index and all published posts. Use explicit content dates for post lastmod and the latest post change for the index, never generation time.

## Technical details
- Store posts in a shared content catalogue with stable slugs, author, excerpt, publication/modification timestamps, and Markdown body; no database or new administration interface is required.
- Use one Markdown renderer with raw HTML disabled for both live pages and pre-rendered output.
- Keep metadata and structured-data helpers in the existing shared SEO module.
- Test ordering, publication visibility, date handling, metadata limits, schema, sitemap entries, and initial HTML; check index-to-post navigation with a temporary test fixture.