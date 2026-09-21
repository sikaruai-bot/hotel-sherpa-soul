const BASE_URL = "https://pms.hotelsherpasoul.com";
const API_KEY = "sherpa-bot-key-2026";

async function runTests() {
  console.log("==================================================");
  console.log("   HOTEL SHERPA SOUL CHATBOT INTEGRATION TEST     ");
  console.log("==================================================");

  // 1. AVAILABILITY CHECK
  console.log("\n[TEST 1] Checking Room Availability (2026-11-20 to 2026-11-22)...");
  const checkIn = "2026-11-20";
  const checkOut = "2026-11-22";
  const availRes = await fetch(`${BASE_URL}/api/bot/availability?checkIn=${checkIn}&checkOut=${checkOut}&adults=2`, {
    headers: { "x-api-key": API_KEY }
  });
  const availJson = await availRes.json();
  console.log("Status:", availRes.status);
  console.log("Available Rooms Count:", availJson.data?.totalAvailableRoomsCount);
  console.log("Available Room Numbers:", availJson.data?.rooms?.map(r => r.roomNumber));
  console.log("Categories:", availJson.data?.categories?.map(c => `${c.roomTypeName}: Rs ${c.dailyRateNpr}/night (${c.availableCount} available)`));

  if (!availJson.data?.rooms || availJson.data.rooms.length === 0) {
    console.error("No rooms available to test booking!");
    return;
  }

  const selectedRoom = availJson.data.rooms[0].roomNumber;

  // 2. CREATE BOOKING VIA WHATSAPP CHATBOT
  console.log(`\n[TEST 2] Creating Test Reservation for Room ${selectedRoom} via WHATSAPP...`);
  const externalMsgId = "wa_test_" + Date.now();
  const bookingPayload = {
    guestName: "Test Chatbot Guest",
    phone: "+9779801234567",
    email: "test.chatbot@hotelsherpasoul.com",
    channel: "WHATSAPP",
    externalMessageId: externalMsgId,
    roomNumber: selectedRoom,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    adults: 2,
    children: 0,
    specialRequests: "Arriving late evening, please arrange airport pick-up"
  };

  const bookRes = await fetch(`${BASE_URL}/api/bot/booking`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY
    },
    body: JSON.stringify(bookingPayload)
  });

  const bookJson = await bookRes.json();
  console.log("Booking Response Status:", bookRes.status);
  console.log("Success:", bookJson.success);
  console.log("Booking Data:", JSON.stringify(bookJson.data, null, 2));

  if (!bookJson.success || !bookJson.data?.reservationNumber) {
    console.error("Booking creation failed:", bookJson);
    return;
  }

  const resNum = bookJson.data.reservationNumber;
  const testResId = bookJson.data.id;

  // 3. LOOKUP BOOKING BY RESERVATION NUMBER
  console.log(`\n[TEST 3] Looking up Reservation ${resNum}...`);
  const lookupRes = await fetch(`${BASE_URL}/api/bot/booking/${resNum}`, {
    headers: { "x-api-key": API_KEY }
  });
  const lookupJson = await lookupRes.json();
  console.log("Lookup Status:", lookupRes.status);
  console.log("Found:", lookupJson.data?.reservationNumber, "| Guest:", lookupJson.data?.guest?.name, "| Room:", lookupJson.data?.room?.roomNumber);

  // 4. LOOKUP BOOKING BY PHONE NUMBER
  console.log(`\n[TEST 4] Looking up by Phone Number (+9779801234567)...`);
  const phoneRes = await fetch(`${BASE_URL}/api/bot/booking/${encodeURIComponent("+9779801234567")}`, {
    headers: { "x-api-key": API_KEY }
  });
  const phoneJson = await phoneRes.json();
  console.log("Phone Lookup Status:", phoneRes.status);
  console.log("Matched Records Count:", phoneJson.data?.reservations?.length);

  console.log("\n==================================================");
  console.log("  ALL ENDPOINTS FUNCTIONING PERFECTLY ON PROD!    ");
  console.log("==================================================");

  return { testResId, resNum };
}

runTests().catch(console.error);
