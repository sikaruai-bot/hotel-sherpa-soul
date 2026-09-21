# Hotel Sherpa Soul — Direct Booking Management Manual

This guide explains how reservations are processed, confirmed, and managed to maximize direct conversions and avoid OTA commissions.

---

## 1. Direct Booking Flow (Guest Journey)
1. **Search & Selection:** A guest visits `hotelsherpasoul.com/book` or selects dates from the homepage search bar.
2. **Category & Capacity Selection:** The guest selects between:
   * **Budget Family Room:** USD $20/night (Max 3 Adults + 1 Child, Max 4 total)
   * **Family Room:** USD $30/night (Max 3 Adults + 1 Child, Max 4 total)
   * **Deluxe Room:** USD $20/night (Max 2 Adults + 1 Child, Max 3 total)
3. **Availability & Double-Booking Check:** The engine automatically checks conflicting dates against all 6 sellable physical rooms (201-203, 301-303).
4. **Allocation & Confirmation:** Upon submission:
   * A unique Booking Reference is generated (e.g. `HSS-2026-1042`).
   * An available physical room is assigned automatically.
   * The guest is shown their confirmation screen with an instant **WhatsApp Confirmation Button**.
   * A pre-filled WhatsApp message is sent to owner Mingma Sherpa for immediate 1-on-1 communication.

---

## 2. Managing Bookings in the Admin Portal
1. Navigate to `/admin/bookings`.
2. Filter bookings by status: `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`, `NO_SHOW`.
3. Search by guest name, phone number, or booking reference.
4. Click **Manage** on any reservation to:
   * Reassign to a different physical room.
   * Update stay dates.
   * Record payments (Cash NPR, Cash USD, Bank Transfer, Online QR/eSewa, or OTA Virtual Card).
   * Print a standardized Booking Voucher.

---

## 3. Creating Walk-in or Phone Reservations
1. In `/admin/bookings`, click **+ Add Walk-In / Manual Booking**.
2. Select Check-in / Check-out dates and Room Category.
3. Enter the guest's name, contact number, and agreed rate in USD.
4. Select the source (`WALK_IN`, `WHATSAPP`, `PHONE`, `BOOKING_COM`, `AGODA`).
5. Click **Save Reservation**. The room is instantly locked in the database to prevent double bookings.
