import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { publishedPosts, blogSitemapEntries, validBlogDate, renderBlogMarkdown } from "../src/lib/blogContent.js";
import { blogPostMeta, blogPostSchema } from "../src/lib/seoShared.js";
import { prerenderHeads } from "./prerender-head.mjs";

const post = { slug: "first-open-mic", title: "Preparing for Your First Comedy Open Mic", excerpt: "Plan your first stand-up set, find a comedy open mic and prepare for the stage.", author: "Test Author", datePublished: "2026-10-01", dateModified: "2026-10-03", published: true, body: "## Prepare your set\n\nWrite your ideas.\n\n- Start short\n- Listen\n\n[Find open mics](/open-mics)\n\n![Comediq mascot](/mascot.png)" };

test("blog index sorts published posts newest first", () => {
  assert.deepEqual(publishedPosts([post, { ...post, slug: "new-post", datePublished: "2026-10-05", dateModified: "2026-10-05" }]).map(p => p.slug), ["new-post", "first-open-mic"]);
});
test("unpublished posts are absent from the public catalogue", () => {
  assert.equal(publishedPosts([{ ...post, published: false }]).length, 0);
});
test("each blog sitemap lastmod uses its content modification date", () => {
  assert.deepEqual(blogSitemapEntries([post]), [{ path: "/blog", lastmod: "2026-10-03" }, { path: "/blog/first-open-mic", lastmod: "2026-10-03" }]);
  assert.deepEqual(blogSitemapEntries([]), [{ path: "/blog", lastmod: null }]);
});
test("editorial dates are real dates with modification not before publication", () => {
  assert.equal(validBlogDate("2026-02-30"), false);
  assert.throws(() => publishedPosts([{ ...post, dateModified: "2026-09-01" }]), /Invalid editorial dates/);
});
test("blog titles and descriptions respect 60 and 160 character limits", () => {
  const metadata = blogPostMeta({ ...post, title: "Comedy open mic guide ".repeat(12), excerpt: "Stand-up performance tips ".repeat(30) });
  assert.ok(metadata.title.length <= 60);
  assert.ok(metadata.description.length <= 160);
  assert.ok(metadata.title.endsWith(" | Comediq"));
});
test("Article and Home to Blog to Post breadcrumbs use the post's fields", () => {
  const [article, crumbs] = blogPostSchema(post)["@graph"];
  assert.equal(article.headline, post.title);
  assert.equal(article.author.name, "Test Author");
  assert.equal(article.datePublished, "2026-10-01");
  assert.equal(article.dateModified, "2026-10-03");
  assert.equal(article.url, "https://comediq.us/blog/first-open-mic");
  assert.deepEqual(crumbs.itemListElement.map(i => i.item), ["https://comediq.us/", "https://comediq.us/blog", "https://comediq.us/blog/first-open-mic"]);
});
test("Markdown rejects executable HTML and unsafe links", () => {
  const html = renderBlogMarkdown('<script>alert(1)</script>\n\n[bad](javascript:alert(1))');
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes('href="javascript:'));
});
test("initial article HTML includes its own metadata and complete content", () => {
  const dir = mkdtempSync(join(tmpdir(), "comediq-blog-"));
  try {
    writeFileSync(join(dir, "index.html"), '<html><head><title>Fallback</title></head><body><div id="root"></div></body></html>');
    prerenderHeads(dir, [post]);
    const html = readFileSync(join(dir, "blog/first-open-mic/index.html"), "utf8");
    assert.ok(html.includes('href="https://comediq.us/blog/first-open-mic"'));
    assert.ok(html.includes('property="og:type" data-rh="true" content="article"'));
    assert.ok(html.includes(`content="${post.excerpt}"`));
    assert.ok(html.includes('"@type":"Article"'));
    assert.ok(html.includes('"@type":"BreadcrumbList"'));
    assert.ok(html.includes("Write your ideas."));
    assert.ok(html.includes('src="/mascot.png"'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});