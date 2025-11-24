import { Helmet } from 'react-helmet-async';

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
  title = 'NYC Comedy Open Mics - Complete Guide 2025 | Comediq',
  description = 'Find every comedy open mic in NYC. Real-time schedules, venue details, comedian reviews, and set tracking. By comedians, for comedians.',
  keywords = 'NYC comedy open mics, New York comedy venues, stand up comedy NYC, open mic night, comedy shows NYC, comedian networking',
  image = 'https://comediq.us/comediq_logo.jpg',
  url = 'https://comediq.us',
  type = 'website',
  structuredData,
  noindex = false,
}: SEOProps) => {
  const canonicalUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      
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
