import { Link, useParams } from "react-router-dom";
import SEO from "@/components/SEO";
import PageHeader from "@/components/PageHeader";
import { blogDate, publishedPosts, renderBlogMarkdown } from "@/lib/blogContent";
import { blogPostMeta, blogPostSchema } from "@/lib/seoShared";

const BlogPost = () => {
  const { slug } = useParams();
  const post = publishedPosts().find((item) => item.slug === slug);
  if (!post) return (
    <>
      <SEO title="Blog Post Not Found | Comediq" description="This comedy blog post is not available. Browse published stand-up comedy articles on Comediq." noindex />
      <PageHeader title="Blog" />
      <main className="page-content-offset mx-auto max-w-3xl px-5 pb-16">
        <h1 className="pt-8 text-3xl leading-tight tracking-normal">Post not found</h1>
        <Link to="/blog" className="mt-5 inline-block text-accent underline">Back to the blog</Link>
      </main>
    </>
  );
  return (
    <>
      <SEO {...blogPostMeta(post)} type="article" structuredData={blogPostSchema(post)} />
      <PageHeader title="Blog" />
      <main className="page-content-offset mx-auto max-w-3xl px-5 pb-16 text-foreground">
        <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 pt-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-accent">Home</Link><span aria-hidden="true">/</span>
          <Link to="/blog" className="hover:text-accent">Blog</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{post.title}</span>
        </nav>
        <article>
          <header className="border-b border-border py-8">
            <h1 className="text-4xl leading-tight tracking-normal md:text-5xl">{post.title}</h1>
            <p className="mt-5 text-sm text-muted-foreground">By {post.author} · <time dateTime={post.datePublished}>{blogDate(post.datePublished)}</time></p>
            {post.dateModified !== post.datePublished && <p className="mt-2 text-xs text-muted-foreground">Updated <time dateTime={post.dateModified}>{blogDate(post.dateModified)}</time></p>}
          </header>
          <div className="blog-prose pt-8" dangerouslySetInnerHTML={{ __html: renderBlogMarkdown(post.body) }} />
        </article>
        <Link to="/blog" className="mt-12 inline-block text-accent underline underline-offset-4">All posts</Link>
      </main>
    </>
  );
};
export default BlogPost;