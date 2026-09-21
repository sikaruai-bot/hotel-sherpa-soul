# Hotel Sherpa Soul PMS — Chatbot Integration Guide
**(WhatsApp, Facebook Messenger & Instagram DM Booking Integration)**

This guide explains how to connect your external AI Chatbot to the **Hotel Sherpa Soul Property Management System (PMS)** to:
1. Check real-time room availability and rates.
2. Automatically create reservations in the PMS directly from chat conversations.
3. Retrieve booking status and vouchers.

---

## 1. Authentication & Base URL

* **Production Base URL:** `https://pms.hotelsherpasoul.com`
* **Local / Staging:** `http://localhost:3000`
* **Header Requirement:** Every request must include the secret API key in the headers:
  ```http
  x-api-key: sherpa-bot-key-2026
  ```
  *(Or `Authorization: Bearer sherpa-bot-key-2026`)*

---

## 2. Check Room Availability & Rates API

When a guest in WhatsApp, Messenger, or Instagram asks for room rates or availability for specific dates, call this endpoint.

### Request:
```http
GET /api/bot/availability?checkIn=2026-10-05&checkOut=2026-10-08&adults=2&children=0
Headers:
  x-api-key: sherpa-bot-key-2026
```

### Query Parameters:
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `checkIn` | String | **Yes** | Check-in date (`YYYY-MM-DD`) |
| `checkOut` | String | **Yes** | Check-out date (`YYYY-MM-DD`) |
| `adults` | Number | No | Number of adult guests (default: `1`) |
| `children` | Number | No | Number of children (default: `0`) |

### Example Response:
```json
{
  "success": true,
  "data": {
    "hotel": "Hotel Sherpa Soul",
    "checkIn": "2026-10-05",
    "checkOut": "2026-10-08",
    "nights": 3,
    "requestedGuests": { "adults": 2, "children": 0, "totalGuests": 2 },
    "isAnyAvailable": true,
    "totalAvailableRoomsCount": 4,
    "categories": [
      {
        "roomTypeName": "Standard Double",
        "capacity": 2,
        "bedType": "Queen Bed",
        "dailyRateNpr": 3500,
        "dailyRateUsd": 26,
        "totalPriceNpr": 10500,
        "totalPriceUsd": 78,
        "availableCount": 2,
        "availableRoomNumbers": ["201", "202"]
      },
      {
        "roomTypeName": "Deluxe Twin",
        "capacity": 2,
        "bedType": "2 Single Beds",
        "dailyRateNpr": 4200,
        "dailyRateUsd": 31,
        "totalPriceNpr": 12600,
        "totalPriceUsd": 93,
        "availableCount": 1,
        "availableRoomNumbers": ["203"]
      }
    ],
    "rooms": [
      {
        "roomNumber": "203",
        "floor": 2,
        "roomType": "Deluxe Twin",
        "dailyRateNpr": 4200,
        "totalNights": 3,
        "totalPriceNpr": 12600
      }
    ]
  }
}
```

---

## 3. Create Real-Time Booking API

Once the guest confirms the booking details in the chat, the bot calls this endpoint. The PMS immediately locks the room, adds the guest to CRM, emits real-time sound/screen alerts at the hotel front desk, and returns the official reservation number.

### Request:
```http
POST /api/bot/booking
Headers:
  Content-Type: application/json
  x-api-key: sherpa-bot-key-2026
```

### Request Body (JSON):
```json
{
  "channel": "WHATSAPP",
  "guestName": "Sarah Connor",
  "phone": "+977 9851000000",
  "email": "sarah@gmail.com",
  "checkInDate": "2026-10-05",
  "checkOutDate": "2026-10-08",
  "roomNumber": "203",
  "adults": 2,
  "children": 0,
  "totalAmount": 12600,
  "paidAmount": 0,
  "paymentStatus": "UNPAID",
  "specialRequests": "Arriving late evening around 8 PM. Please arrange clean extra towels.",
  "externalMessageId": "WA_MSG_1726912345"
}
```

### Request Body Fields:
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `channel` | String | No | Channel origin: `"WHATSAPP"` \| `"MESSENGER"` \| `"INSTAGRAM"` (default: `"WHATSAPP"`) |
| `guestName` | String | **Yes** | Full name of the guest |
| `phone` | String | **Yes\*** | Contact phone / WhatsApp number (*either phone or email required*) |
| `email` | String | No | Contact email address |
| `checkInDate` | String | **Yes** | Check-in date (`YYYY-MM-DD`) |
| `checkOutDate` | String | **Yes** | Check-out date (`YYYY-MM-DD`) |
| `roomNumber` | String | No | Specific room number (e.g. `"203"`, `"302"`). If omitted, PMS auto-assigns an available room. |
| `roomTypeName` | String | No | Specific category (e.g. `"Deluxe Twin"`). Used if `roomNumber` not given. |
| `adults` | Number | No | Number of adults (default: `1`) |
| `children` | Number | No | Number of children (default: `0`) |
| `totalAmount` | Number | No | Total amount in NPR. If omitted, PMS auto-calculates from `dailyRate * nights`. |
| `paidAmount` | Number | No | Any advance payment collected (default: `0`) |
| `paymentStatus` | String | No | `"UNPAID"` \| `"PARTIAL"` \| `"PAID"` (default: `"UNPAID"`) |
| `specialRequests`| String | No | Any guest notes, arrival time, or flight details |
| `externalMessageId` | String | No | Bot conversation or message reference ID |

### Success Response (`201 Created`):
```json
{
  "success": true,
  "message": "Reservation confirmed successfully!",
  "data": {
    "id": "7bf3b3a1-12a5-48b8-b1fc-298da7c191a2",
    "reservationNumber": "HSS-202610-8F12AC",
    "guestName": "Sarah Connor",
    "phone": "+977 9851000000",
    "email": "sarah@gmail.com",
    "roomNumber": "203",
    "roomType": "Deluxe Twin",
    "checkInDate": "2026-10-05",
    "checkOutDate": "2026-10-08",
    "nights": 3,
    "adults": 2,
    "children": 0,
    "totalAmount": 12600,
    "paidAmount": 0,
    "dueAmount": 12600,
    "currency": "NPR",
    "status": "CONFIRMED",
    "paymentStatus": "UNPAID",
    "channel": "WHATSAPP",
    "voucherUrl": "https://pms.hotelsherpasoul.com/self-checkin?token=...",
    "supportContact": {
      "hotel": "Hotel Sherpa Soul",
      "phone": "+977 9851068219",
      "landline": "+977-1 4530311",
      "location": "Thamel, Kathmandu, Nepal"
    }
  }
}
```

---

## 4. Booking Lookup API

When a guest asks in chat: *"Can you check my booking status?"* or *"What is my confirmation number?"*, the bot calls this endpoint with the reservation number, phone number, or booking ID.

### Request:
```http
GET /api/bot/booking/HSS-202610-8F12AC
Headers:
  x-api-key: sherpa-bot-key-2026
```

*(You can also pass phone number, e.g. `/api/bot/booking/9851000000`)*

### Example Response:
```json
{
  "success": true,
  "data": {
    "id": "7bf3b3a1-12a5-48b8-b1fc-298da7c191a2",
    "reservationNumber": "HSS-202610-8F12AC",
    "guestName": "Sarah Connor",
    "phone": "+977 9851000000",
    "roomNumber": "203",
    "roomType": "Deluxe Twin",
    "checkInDate": "2026-10-05",
    "checkOutDate": "2026-10-08",
    "status": "CONFIRMED",
    "paymentStatus": "UNPAID",
    "totalAmount": 12600,
    "dueAmount": 12600,
    "voucherUrl": "https://pms.hotelsherpasoul.com/self-checkin?token=..."
  }
}
```

---

## 5. Code Integration Examples

### Node.js / TypeScript Example:
```typescript
import axios from 'axios';

const PMS_API = 'https://pms.hotelsherpasoul.com';
const API_KEY = 'sherpa-bot-key-2026';

// 1. Check availability
async function checkAvailability(checkIn: string, checkOut: string, guests: number) {
  const res = await axios.get(`${PMS_API}/api/bot/availability`, {
    params: { checkIn, checkOut, adults: guests },
    headers: { 'x-api-key': API_KEY }
  });
  return res.data;
}

// 2. Create booking
async function createBooking(data: {
  guestName: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  roomNumber?: string;
  channel: 'WHATSAPP' | 'MESSENGER' | 'INSTAGRAM';
}) {
  const res = await axios.post(`${PMS_API}/api/bot/booking`, {
    guestName: data.guestName,
    phone: data.phone,
    checkInDate: data.checkIn,
    checkOutDate: data.checkOut,
    roomNumber: data.roomNumber,
    channel: data.channel
  }, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    }
  });
  return res.data;
}
```

### Python Example:
```python
import requests

PMS_API = "https://pms.hotelsherpasoul.com"
HEADERS = {
    "x-api-key": "sherpa-bot-key-2026",
    "Content-Type": "application/json"
}

def book_room(name, phone, check_in, check_out, room="203", channel="WHATSAPP"):
    payload = {
        "guestName": name,
        "phone": phone,
        "checkInDate": check_in,
        "checkOutDate": check_out,
        "roomNumber": room,
        "channel": channel
    }
    response = requests.post(f"{PMS_API}/api/bot/booking", json=payload, headers=HEADERS)
    return response.json()
```

---

## 6. What Happens in PMS Front Desk
1. **Instant Calendar Lock:** The room is immediately blocked for those dates; OTA channels and website visitors cannot double-book it.
2. **Audio & Visual Bell:** A sound alert and popup will ring on the hotel receptionist's PMS dashboard: *"New WhatsApp / DM Booking: [Guest Name] (Room [Number])"*.
3. **Guest Folio Created:** A digital invoice/folio is automatically prepared for the guest at check-in.
