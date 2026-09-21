# Hotel Sherpa Soul — Analytics & Digital Marketing Tracking Manual

---

## 1. Integrated Tracking Suite
The website is equipped with a unified event dispatcher supporting:
1. **Google Analytics 4 (GA4)**
2. **Google Tag Manager (GTM)**
3. **Meta Pixel (Facebook/Instagram)**

---

## 2. Configured Conversion Events
| Event Name | Trigger | Tracked Parameters |
| :--- | :--- | :--- |
| `page_view` | Every page change | `page_path`, `page_title` |
| `view_room` | Room detail page loaded | `room_type`, `price_usd` |
| `check_availability` | Search submitted | `check_in`, `check_out`, `adults`, `children` |
| `begin_booking` | Guest starts checkout | `room_type`, `booking_value` |
| `booking_submit` | Form submitted | `room_type`, `booking_value`, `booking_number` |
| `booking_confirmed` | Confirmation page rendered | `booking_number`, `room_type`, `booking_value`, `currency: USD` |
| `whatsapp_click` | WhatsApp CTA clicked | `placement` ('header', 'hero', 'sticky', 'footer') |
| `phone_click` | Phone link clicked | `placement`, `phone_number` |
| `contact_submit` | Contact form submitted | `subject` |

---

## 3. Meta Pixel Configuration
* Existing Pixel ID: `1952950858737501`.
* Can be managed anytime in `/admin/cms` or via `NEXT_PUBLIC_META_PIXEL_ID` environment variable.

---

## 4. UTM Marketing Attribution
The system automatically detects URL parameters (`utm_source`, `utm_medium`, `utm_campaign`) and saves them with incoming bookings, showing you whether bookings came from Facebook, Google Ads, or Organic search.
