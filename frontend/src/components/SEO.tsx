import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const SITE_URL = 'https://powerdrivesolution.com.np';
const DEFAULT_TITLE = 'Power Drive Solution | Premium Automotive & Industrial Lubricants';
const DEFAULT_DESC = 'High-performance automotive and industrial lubricants engineered for protection, efficiency, and reliability.';
const DEFAULT_IMAGE = `${SITE_URL}/images/logo.png`;

export function SEO({ title, description, canonical, image, noIndex, jsonLd }: SEOProps){
  const fullTitle = title ? `${title}` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESC;
  const img = image || DEFAULT_IMAGE;
  const canon = canonical || SITE_URL;
  const ldArray = Array.isArray(jsonLd) ? jsonLd : (jsonLd ? [jsonLd] : []);
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canon} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canon} />
      <meta property="og:image" content={img} />
      <meta property="og:image:alt" content="Power Drive Solution" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      {ldArray.map((obj,i)=>(<script key={i} type="application/ld+json">{JSON.stringify(obj)}</script>))}
    </Helmet>
  );
}

export function OrganizationLD(){
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Power Drive Solution',
    url: 'https://powerdrivesolution.com.np',
    logo: 'https://powerdrivesolution.com.np/images/logo.png',
    sameAs: [] as string[]
  };
  return <SEO jsonLd={data} />;
}

export default SEO;
