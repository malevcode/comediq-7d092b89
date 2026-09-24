import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { canonicalUrlFor, isNonCanonicalHost } from '@/components/CanonicalTag';

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
  const { pathname } = useLocation();
  // Always an absolute comediq.us URL — never the preview host, never relative.
  const canonicalUrl = url
    ? canonicalUrlFor(new URL(url, 'https://comediq.us').pathname)
    : canonicalUrlFor(pathname);
  const shouldNoindex = noindex || isNonCanonicalHost();
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {/* Canonical link is owned by <CanonicalTag /> so there is exactly one. */}

      {/* Robots */}
      {shouldNoindex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Comediq" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@comediq" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
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
