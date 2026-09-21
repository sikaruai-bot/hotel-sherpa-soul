# Hotel Sherpa Soul — Technical & Local SEO Manual

---

## 1. On-Page SEO Architecture
Every page is rendered server-side (SSR) with clean HTML, fast Core Web Vitals, and unique metadata:
* **Home:** `A Peaceful & Affordable Stay in Thamel, Kathmandu | Hotel Sherpa Soul`
* **Rooms:** `Guest Rooms & Rates in Thamel Kathmandu | Hotel Sherpa Soul`
* **Categories:** Dynamic slugs `/rooms/budget-family-room`, `/rooms/family-room`, `/rooms/deluxe-room`.
* **Sitemap:** Automatically generated at `https://hotelsherpasoul.com/sitemap.xml`.
* **Robots:** Configured at `https://hotelsherpasoul.com/robots.txt`.

---

## 2. JSON-LD Structured Data
The website automatically injects Schema.org compliant structured data:
* `Hotel` & `LocalBusiness`
* `FAQPage`
* `BreadcrumbList`
* `OfferCatalog`

---

## 3. Connecting Google Search Console (For Owner Mr. Mingma Sherpa)
1. Open [Google Search Console](https://search.google.com/search-console).
2. Sign in with the owner email: `mingmasaino@gmail.com`.
3. Add property: `https://hotelsherpasoul.com`.
4. Verification: Add the HTML tag provided by Google into the CMS or DNS TXT record.
5. In the left menu, click **Sitemaps**, enter `sitemap.xml`, and click **Submit**.
