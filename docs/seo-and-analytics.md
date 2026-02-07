# SEO & Analytics

## Google Analytics 4 (GA4)

- **Location**: `src/layouts/Layout.astro` (in `<head>`).
- **Measurement ID**: `G-48TP59450X`.
- **Scope**: All pages using the layout load gtag.js and send page views to GA4.
- **Implementation**: Inline script with `is:inline` so Astro does not bundle it; `window.dataLayer` and `gtag` work in the browser.

## SEO (Layout)

All pages pass `title` and `description` to `Layout`. The layout also provides:

| Item | Purpose |
|------|--------|
| **Canonical URL** | `<link rel="canonical" href={canonicalUrl}>` — one canonical URL per page (from `Astro.site` + `Astro.url.pathname`). |
| **Robots** | `<meta name="robots" content="index, follow">` — allow indexing and following links. |
| **Open Graph** | `og:type`, `og:title`, `og:description`, `og:url`, `og:locale` (zh_HK), `og:site_name`. Optional: `image` prop → `og:image`. |
| **Twitter Card** | `twitter:card`, `twitter:title`, `twitter:description`. Optional: `twitter:image` when `image` is set. |
| **theme-color** | `#f8fafc` (slate-50) for browser UI. |

### Optional per-page share image

In any page that uses `Layout`, you can pass an `image` prop for social previews:

```astro
<Layout
  title="…"
  description="…"
  image="/path/to/og-image.png"
>
```

- Use an absolute URL or a path (e.g. `/mpflogs/og.png`). Recommended size for OG/Twitter: ~1200×630.

## Sitemap

- **Integration**: `@astrojs/sitemap` in `astro.config.mjs`.
- **Output**: Build generates `sitemap-index.xml`.
- **URL**: `https://mpflogs.github.io/mpflogs/sitemap-index.xml`.
- **Usage**: Submit this URL in [Google Search Console](https://search.google.com/search-console) for indexing.

## Keywords (search-friendly)

GA4, Google Analytics, gtag, SEO, canonical, Open Graph, Twitter Card, sitemap, mpflogs, Astro Layout.
