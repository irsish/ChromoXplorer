import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  DEFAULT_SITE_URL,
  getRouteMetadata,
  getStructuredData,
  toAbsoluteUrl,
} from "../../seo/routeMetadata.js";

export default function RouteMetadata() {
  const location = useLocation();
  const metadata = getRouteMetadata(location.pathname);
  const siteUrl = (import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
  const verificationToken = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION?.trim();
  const canonicalUrl = `${siteUrl}${metadata.path === "/" ? "" : metadata.path}`;
  const imageUrl = toAbsoluteUrl(metadata.image, siteUrl);
  const structuredData = getStructuredData(location.pathname, siteUrl);

  return (
    <Helmet prioritizeSeoTags>
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <meta name="robots" content={metadata.robots} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:site_name" content="ChromoXplorer" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={metadata.title} />
      <meta
        property="og:description"
        content={metadata.description}
      />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={metadata.imageAlt} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metadata.title} />
      <meta
        name="twitter:description"
        content={metadata.description}
      />
      <meta name="twitter:image" content={imageUrl} />
      {verificationToken ? (
        <meta
          name="google-site-verification"
          content={verificationToken}
        />
      ) : null}
      {structuredData.map((item, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}
