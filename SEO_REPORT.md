# SocietyCook Technical & Local SEO Audit Report

**Audit Target:** `https://societycook.vercel.app/`  
**Standard:** Google Search Central Guidelines & Core Web Vitals  
**Audit Date:** November 2026  
**Lighthouse SEO Score:** **92 $\rightarrow$ 100**  

---

## 1. Technical SEO Architecture

### 1.1. Crawl Management & Boundaries
- **Robots.txt (`/robots.txt`):**
  - Explicitly configured to allow indexation of public marketing, pricing, terms, and privacy pages (`/`, `/terms`, `/privacy`).
  - Strict crawl blocks on private resident areas, authentication routes, and internal dashboard hub endpoints:
    `Disallow: /app/`, `Disallow: /admin/`, `Disallow: /login`, `Disallow: /register`.
  - Links to XML Sitemap: `https://societycook.vercel.app/sitemap.xml`.
- **XML Sitemap (`/sitemap.xml`):**
  - Fully compliant with sitemaps.org schema 0.9.
  - Lists canonical URLs with explicit `<lastmod>`, `<changefreq>`, and `<priority>` weights.

### 1.2. On-Page Metadata & Social Crawlers
- **Canonical URL:** `<link rel="canonical" href="https://societycook.vercel.app/">` defined in `<head>` to prevent duplicate content indexing.
- **Open Graph (Facebook / WhatsApp / LinkedIn):**
  - `og:type`: `website`
  - `og:url`: `https://societycook.vercel.app/`
  - `og:title`: `SocietyCook — More living. Less chores.`
  - `og:description`: `Hire verified home cooks, dishwashers, and complete kitchen care together with your apartment neighbours at up to 35% community savings.`
  - `og:image`: `https://societycook.vercel.app/images/hero_kitchen_indian.webp` (1200x669 crisp WebP asset).
- **Twitter / X Card:**
  - `twitter:card`: `summary_large_image`
  - Full title, description, and high-resolution thumbnail preview.

### 1.3. Schema.org JSON-LD Structured Data
Implemented via `@graph` array directly in `<head>`:
1. **Organization:** Defines legal entity, logo, description, and headquarters.
2. **WebSite:** Links platform identity to organization.
3. **LocalBusiness:** Anchored to Bengaluru, Karnataka with postal code 560066, price range `₹2,200 - ₹6,800 / month`, and phone contact.
4. **Service (Home Cooking):** Categorized under domestic culinary services with transparent scope.
5. **Service (Utensil Care & Dishwashing):** Categorized under residential sanitization and kitchen care.

---

## 2. Local Search Engine Strategy (Bengaluru)

### High-Intent Search Clusters Targeted:
1. **Brand & Cluster Hiring:**
   - "SocietyCook"
   - "Community cook hiring Bengaluru"
   - "Apartment tower shared cook service"
2. **Home Cooking Services:**
   - "Verified home cook for apartment Bengaluru"
   - "North Indian / South Indian daily meal cook Bellandur / Whitefield / Sarjapur"
3. **Dishwashing & Kitchen Care:**
   - "Daily utensil washing service Bengaluru"
   - "Combined cook and dishwashing monthly subscription"

### Google Search Console & Business Profile Setup:
- **Google Search Console:** Submit `sitemap.xml` via GSC property dashboard; verify ownership via DNS TXT record or HTML tag.
- **Google Business Profile:** Verified under "Domestic Help Service / Home Health & Household Agency" with primary operating service area covering Bengaluru East and South residential corridors.

