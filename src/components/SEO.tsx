import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { canonicalUrlFor, isNonCanonicalHost } from '@/components/CanonicalTag';
import { boundedMeta, pageMetaFor } from '@/lib/seoShared';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  structuredData?: object;
  noindex?: boolean;
}

const SEO = ({
  title = 'Comedy Open Mics in NYC, Hudson Valley, LA & Austin | Comediq',
  description = 'Find comedy open mics across NYC, the Hudson Valley, Los Angeles and Austin. Real-time schedules, venue details, comedian reviews, and set tracking. By comedians, for comedians.',
  keywords = 'comedy open mics, NYC open mics, Hudson Valley comedy, Los Angeles open mics, Austin comedy, stand up comedy, open mic night, comedian networking',
  image = 'https://comediq.us/comediq_logo.jpg',
  url,
  type = 'website',
  structuredData,
  noindex = false,
}: SEOProps) => {
  const { pathname, search } = useLocation();
  const metadata = pageMetaFor(pathname) && pathname !== '/open-mics'
    ? pageMetaFor(pathname)
    : boundedMeta(title, description);
  const metaTitle = metadata?.title ?? title;
  const metaDescription = metadata?.description ?? description;
  // Always an absolute comediq.us URL, never the preview host, never relative.
  const canonicalBase = url
    ? canonicalUrlFor(new URL(url, 'https://comediq.us').pathname)
    : canonicalUrlFor(pathname);
  const page = Number(new URLSearchParams(search).get('page'));
  const canonicalUrl = canonicalBase + (pathname.startsWith('/open-mics') && Number.isInteger(page) && page > 1 ? `?page=${page}` : '');
  const shouldNoindex = noindex || isNonCanonicalHost();
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={keywords} />
      {/* Canonical link is owned by <CanonicalTag /> so there is exactly one. */}

      {/* Robots */}
      {shouldNoindex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Comediq" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@comediq" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={image} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
