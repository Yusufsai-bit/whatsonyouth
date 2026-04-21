import { Helmet } from 'react-helmet-async';

const SITE_NAME = "What's On Youth";
const BASE_URL = 'https://www.whatsonyouth.org.au';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-default.png`;
const DEFAULT_TITLE = "What's On Youth \u2014 Opportunities for Young Victorians";
const DEFAULT_DESCRIPTION = "Discover events, jobs, grants, programs, and wellbeing support for young Victorians aged 15\u201325. Victoria-wide, free to use.";

type JsonLdObject = Record<string, unknown>;

interface SEOProps {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  noindex?: boolean;
  jsonLd?: JsonLdObject | JsonLdObject[];
}

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  ogTitle,
  ogDescription,
  ogUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  canonical,
  noindex = false,
  jsonLd,
}: SEOProps) {
  const resolvedOgTitle = ogTitle || title;
  const resolvedOgDescription = ogDescription || description;
  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDescription} />
      {ogUrl && <meta property="og:url" content={ogUrl} />}
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedOgTitle} />
      <meta name="twitter:description" content={resolvedOgDescription} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLdArray.map((obj, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(obj)}</script>
      ))}
    </Helmet>
  );
}
