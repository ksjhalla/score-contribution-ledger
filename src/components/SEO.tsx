import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description?: string;
  url?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  noindex?: boolean;
}

export function SEO({
  title,
  description,
  url,
  ogTitle,
  ogDescription,
  twitterTitle,
  twitterDescription,
  noindex,
}: SEOProps) {
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:title" content={ogTitle ?? title} />
      {(ogDescription ?? description) && (
        <meta property="og:description" content={ogDescription ?? description} />
      )}
      <meta property="og:type" content="website" />
      {url && <meta property="og:url" content={url} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={twitterTitle ?? title} />
      {(twitterDescription ?? description) && (
        <meta name="twitter:description" content={twitterDescription ?? description} />
      )}
    </Helmet>
  );
}
