import { Helmet } from 'react-helmet-async';

import { SITE } from '../lib/constants.js';

export function Seo({ title, description = SITE.description, path }) {
  const fullTitle = title ? `${title} · ${SITE.name}` : `${SITE.name} — MBBS & MDCAT Study Resources`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {path && <link rel="canonical" href={`https://medihub.pk${path}`} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
    </Helmet>
  );
}
