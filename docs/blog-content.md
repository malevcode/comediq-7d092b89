# Blog content

Posts live in `src/content/blog-posts.json`, an array shared by the browser, prerenderer and sitemap. The catalogue is intentionally empty until editorial content is supplied. There is no blog administration UI.

Each entry uses this shape (example only, not a published article):

```json
{
  "slug": "your-stable-post-slug",
  "title": "Your comedy article title",
  "excerpt": "A one-line summary of this article.",
  "metaDescription": "Optional search description; otherwise the excerpt is used.",
  "author": "Actual author name",
  "datePublished": "2026-10-29",
  "dateModified": "2026-10-29",
  "published": false,
  "body": "## Section heading\n\nA paragraph.\n\n- A list item\n\n[Open mics](/open-mics)\n\n![Descriptive image alt text](/path-to-existing-image.jpg)"
}
```

Use real publication and significant-content-change dates, either `YYYY-MM-DD` or UTC ISO timestamps. Modification cannot precede publication. Never populate dates from the current build time. Keep slugs stable and unique. Only `published: true` entries appear in public pages and the sitemap.

Markdown supports headings, paragraphs, ordered/unordered lists, links and images. Raw HTML is escaped and unsafe links are rejected. Body H1s render as H2s because the article title is the page's sole H1. Add images through the project's asset flow and supply descriptive alt text.

Titles and descriptions use the existing 60/160-character limits. The index date is the publication date; post pages also show the modification date when different. Sitemap lastmod is the explicit modification date; the index uses the latest published post modification, or omits lastmod when empty.

Publish after adding or changing content so the pre-rendered HTML and sitemap reach the live site. Run `node --test scripts/test-blog.mjs` to check the blog rules.