import MarkdownIt from "markdown-it";
import catalogue from "../content/blog-posts.json";

// Dates are editorial content dates, never file times or generation dates.
export function validBlogDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)?$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value.slice(0, 10);
}

export function publishedPosts(posts = catalogue) {
  const seen = new Set();
  return posts.filter((post) => {
    if (post.published !== true) return false;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || seen.has(post.slug)) throw new Error("Blog slugs must be unique and URL-safe");
    if (![post.title, post.excerpt, post.author, post.body].every((value) => typeof value === "string" && value.trim())) throw new Error(`Missing blog content: ${post.slug}`);
    if (!validBlogDate(post.datePublished) || !validBlogDate(post.dateModified) || Date.parse(post.dateModified) < Date.parse(post.datePublished)) throw new Error(`Invalid editorial dates: ${post.slug}`);
    seen.add(post.slug);
    return true;
  }).sort((a, b) => Date.parse(b.datePublished) - Date.parse(a.datePublished) || a.slug.localeCompare(b.slug));
}

export function blogSitemapEntries(posts = publishedPosts()) {
  const latest = posts.map((post) => post.dateModified).sort((a, b) => Date.parse(a) - Date.parse(b)).pop();
  return [{ path: "/blog", lastmod: latest ?? null }, ...posts.map((post) => ({ path: `/blog/${post.slug}`, lastmod: post.dateModified }))];
}

export function blogDate(value) {
  return new Date(value).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

const markdown = new MarkdownIt({ html: false, linkify: true });
// The page supplies its sole H1; Markdown headings belong to the article body.
markdown.renderer.rules.heading_open = (tokens, index) => `<h${Math.max(2, Number(tokens[index].tag.slice(1)))}>`;
markdown.renderer.rules.heading_close = (tokens, index) => `</h${Math.max(2, Number(tokens[index].tag.slice(1)))}>`;
export const renderBlogMarkdown = (body) => markdown.render(body);