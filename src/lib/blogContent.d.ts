export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  datePublished: string;
  dateModified: string;
  body: string;
  published: boolean;
  metaDescription?: string;
};
export function validBlogDate(value: unknown): boolean;
export function publishedPosts(posts?: BlogPost[]): BlogPost[];
export function blogSitemapEntries(posts?: BlogPost[]): { path: string; lastmod: string | null }[];
export function blogDate(value: string): string;
export function renderBlogMarkdown(body: string): string;