import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import SEO from "@/components/SEO";
import { blogDate, publishedPosts } from "@/lib/blogContent";
import { breadcrumbSchema, graph } from "@/lib/seoShared";

const Blog = () => {
  const posts = publishedPosts();
  return (
    <>
      <SEO structuredData={graph(breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]))} />
      <PageHeader title="Blog" />
      <main className="page-content-offset mx-auto max-w-3xl px-5 pb-16 text-foreground">
        <header className="border-b border-border pb-8 pt-6">
          <p className="mb-3 text-sm font-semibold uppercase text-muted-foreground">Comediq</p>
          <h1 className="text-4xl leading-tight tracking-normal md:text-5xl">Comedy blog</h1>
        </header>
        {posts.length === 0 ? <p className="py-10 text-muted-foreground">No posts published yet.</p> : (
          <ul className="divide-y divide-border">
            {posts.map((post) => (
              <li key={post.slug} className="py-8">
                <time dateTime={post.datePublished} className="text-sm text-muted-foreground">{blogDate(post.datePublished)}</time>
                <h2 className="mb-3 mt-3 text-2xl leading-tight tracking-normal md:text-3xl">
                  <Link to={`/blog/${post.slug}`} className="transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">{post.title}</Link>
                </h2>
                <p className="line-clamp-1 text-base text-muted-foreground">{post.excerpt}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
};
export default Blog;