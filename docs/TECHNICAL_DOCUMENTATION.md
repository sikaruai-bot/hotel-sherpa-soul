# Hotel Sherpa Soul — Technical Software Documentation

---

## 1. System Architecture
* **Framework:** Next.js 16 (App Router) with React 19 and TypeScript 5.
* **Database ORM:** Prisma 6.19 with SQLite (production-portable and PostgreSQL compatible).
* **Styling:** Tailwind CSS with responsive, mobile-first design.
* **Authentication:** Stateless, secure bcryptjs password hashing and signed HTTP-only session cookies.
* **Analytics:** Unified dispatcher supporting GA4, GTM dataLayer, and Meta Pixel.

---

## 2. Key Modules
* `/src/lib/bookingEngine.ts`: Transaction-safe availability search, physical room allocation, and double-booking conflict prevention.
* `/src/lib/auth.ts`: Session token generator and verifier.
* `/src/lib/analytics.ts`: Unified client event dispatcher.
* `/src/app/(public)/*`: Public guest-facing pages.
* `/src/app/admin/*`: Owner CMS and direct reservation portal.
* `/src/app/admin/pms/*`: Integrated property management modules.
