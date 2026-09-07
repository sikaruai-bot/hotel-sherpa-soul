import { NextRequest, NextResponse } from 'next/server';

interface ChatResponse {
  reply: string;
  actions?: { label: string; url: string; isWhatsApp?: boolean }[];
}

const KNOWLEDGE_BASE = {
  hotelName: 'Hotel Sherpa Soul',
  location: 'Thamel, Kathmandu, Nepal (near Mandala Street & Garden of Dreams)',
  owner: 'Mr. Mingma Sherpa',
  phone: '+977 9851068219',
  landline: '+977-1 4530311',
  whatsappUrl: 'https://wa.me/9779851068219?text=Hello%20Hotel%20Sherpa%20Soul',
  usp: 'No Restaurant. No Noise. Sleep Well.',
  rooms: [
    {
      category: 'Category A — Budget Family Room',
      rate: '$20 USD / night',
      capacity: 'Max 3 Adults + 1 Child (Up to 4 guests)',
      features: 'High-speed Wi-Fi, private attached bathroom with 24/7 hot water, clean linens, double + single bedding.'
    },
    {
      category: 'Category B — Family Room',
      rate: '$30 USD / night',
      capacity: 'Max 3 Adults + 1 Child (Up to 4 guests)',
      features: 'Spacious corner layout, city / balcony view, premium bedding, private modern bathroom with 24/7 solar + electric hot water.'
    },
    {
      category: 'Category C — Deluxe Room',
      rate: '$20 USD / night',
      capacity: 'Max 2 Adults + 1 Child (Up to 3 guests)',
      features: 'Peaceful garden/courtyard side, queen bed, quiet workspace, private attached bathroom with continuous hot shower.'
    }
  ],
  sharedKitchen: 'Room 102 (Floor 1) is a dedicated Shared Guest Kitchen for guests staying 14 nights or longer. It is completely free of charge for qualifying long-stay guests.',
  noRestaurantRule: 'We do NOT have an in-house restaurant. This is our core brand commitment to guarantee deep, uninterrupted sleep with zero kitchen clatter, cooking odors, or morning noise. Over 50 world-class cafes and restaurants are within a 2-minute walk in Thamel!',
  noParkingRule: 'We do NOT have dedicated private vehicle parking. Paid public parking is available nearby in Thamel.',
  checkIn: '14:00 PM (24/7 front desk, luggage storage available if arriving early)',
  checkOut: '12:00 PM'
};

function answerQuery(query: string): ChatResponse {
  const q = query.toLowerCase();

  // 1. Room Rates & Pricing
  if (q.includes('rate') || q.includes('price') || q.includes('cost') || q.includes('how much') || q.includes('charge') || q.includes('भाडा') || q.includes('मूल्य') || q.includes('पैसा') || q.includes('kati')) {
    return {
      reply: 'Here are our direct booking rates at Hotel Sherpa Soul (Best Rate Guaranteed):\n\n' +
        '• **Budget Family Room (Category A):** $20 USD / night (Up to 4 guests)\n' +
        '• **Family Room (Category B):** $30 USD / night (Up to 4 guests, spacious layout)\n' +
        '• **Deluxe Room (Category C):** $20 USD / night (Up to 3 guests, peaceful & quiet)\n\n' +
        'All rates include high-speed Wi-Fi, 24/7 hot water, and clean linen.',
      actions: [
        { label: 'Book Direct Online', url: '/book' },
        { label: 'View All Rooms', url: '/rooms' },
        { label: 'Ask on WhatsApp', url: KNOWLEDGE_BASE.whatsappUrl, isWhatsApp: true }
      ]
    };
  }

  // 2. Restaurant / Food / Breakfast
  if (q.includes('restaurant') || q.includes('food') || q.includes('breakfast') || q.includes('dinner') || q.includes('lunch') || q.includes('eat') || q.includes('खाना') || q.includes('खाजा')) {
    return {
      reply: 'We deliberately operate with **NO in-house restaurant**!\n\n' +
        'Our core promise is **"No Restaurant. No Noise. Sleep Well."** By keeping restaurant noise, morning breakfast clatter, and cooking smoke out of the building, our guests enjoy deep, undisturbed sleep.\n\n' +
        'Thamel\'s finest bakeries, coffee shops, and multi-cuisine restaurants are located just a 1 to 2-minute walk from our doorstep!',
      actions: [
        { label: 'Read Our Sleep Promise', url: '/about' },
        { label: 'Explore Rooms', url: '/rooms' }
      ]
    };
  }

  // 3. Shared Kitchen / Long Stay
  if (q.includes('kitchen') || q.includes('cook') || q.includes('cooking') || q.includes('long stay') || q.includes('monthly') || q.includes('किचेन') || q.includes('पकाउने')) {
    return {
      reply: 'Yes! We have a dedicated **Shared Guest Kitchen (Room 102, Floor 1)**.\n\n' +
        '• Dedicated exclusively for long-stay guests (**minimum 14 nights**).\n' +
        '• Equipped with gas stove, cooking utensils, cookware, and refrigerator.\n' +
        '• Completely free of charge for qualifying long-stay guests.',
      actions: [
        { label: 'Long Stay Kitchen Details', url: '/long-stay' },
        { label: 'Inquire on WhatsApp', url: 'https://wa.me/9779851068219?text=Hello%20Mingma,%20I%20am%20interested%20in%20a%20long%20stay%20with%20kitchen%20access', isWhatsApp: true }
      ]
    };
  }

  // 4. Location / Airport Pickup / Directions
  if (q.includes('location') || q.includes('where') || q.includes('address') || q.includes('airport') || q.includes('direction') || q.includes('map') || q.includes('कहाँ') || q.includes('ठेगाना') || q.includes('एयरपोर्ट')) {
    return {
      reply: 'Hotel Sherpa Soul is located right in the heart of **Thamel, Kathmandu, Nepal**.\n\n' +
        '• Just 2-3 minutes from Mandala Street and Garden of Dreams.\n' +
        '• ~6-7 km from Tribhuvan International Airport (KTM) (~25-35 mins drive).\n' +
        '• Owner Mingma Sherpa can coordinate reliable airport pickup if requested in advance on WhatsApp!',
      actions: [
        { label: 'View Location & Map', url: '/location' },
        { label: 'Request Airport Pickup', url: 'https://wa.me/9779851068219?text=Hello%20Mingma,%20I%20would%20like%20to%20request%20airport%20pickup%20to%20Hotel%20Sherpa%20Soul', isWhatsApp: true }
      ]
    };
  }

  // 5. Parking
  if (q.includes('parking') || q.includes('car') || q.includes('park') || q.includes('गाडी') || q.includes('पार्किङ')) {
    return {
      reply: 'In accordance with our strict transparency policy, Hotel Sherpa Soul does **not have private vehicle parking** on-site. However, paid public parking facilities are available within short walking distance in Thamel.',
      actions: [
        { label: 'View Location Guide', url: '/location' },
        { label: 'Contact Owner', url: KNOWLEDGE_BASE.whatsappUrl, isWhatsApp: true }
      ]
    };
  }

  // 6. Check-in / Check-out times & Luggage
  if (q.includes('check-in') || q.includes('check in') || q.includes('check out') || q.includes('check-out') || q.includes('luggage') || q.includes('bag') || q.includes('समय')) {
    return {
      reply: '• **Standard Check-in:** 14:00 PM\n' +
        '• **Standard Check-out:** 12:00 PM\n' +
        '• **Front Desk:** Operates 24/7.\n' +
        '• **Early Arrival / Luggage Storage:** We gladly hold your trekking bags and backpacks safely before check-in or while you are in the mountains at no extra charge!',
      actions: [
        { label: 'Book Direct', url: '/book' },
        { label: 'Message Front Desk', url: KNOWLEDGE_BASE.whatsappUrl, isWhatsApp: true }
      ]
    };
  }

  // 7. Booking / Reservation
  if (q.includes('book') || q.includes('reserve') || q.includes('availability') || q.includes('reservation') || q.includes('बुकिङ') || q.includes('कोठा')) {
    return {
      reply: 'You can book directly on our website in 3 simple steps with **zero OTA commission markups**!\n\n' +
        '1. Select your Check-in and Check-out dates\n' +
        '2. Choose your preferred room category ($20 or $30)\n' +
        '3. Confirm instantly — you will receive an official booking confirmation voucher and 1-click WhatsApp sync.',
      actions: [
        { label: 'Instant Direct Booking', url: '/book' },
        { label: 'Direct WhatsApp Reservation', url: 'https://wa.me/9779851068219?text=Hello%20Hotel%20Sherpa%20Soul,%20I%20would%20like%20to%20reserve%20a%20room', isWhatsApp: true }
      ]
    };
  }

  // 8. Contact & Owner info
  if (q.includes('contact') || q.includes('phone') || q.includes('number') || q.includes('email') || q.includes('mingma') || q.includes('owner') || q.includes('सम्पर्क')) {
    return {
      reply: 'You can reach owner Mr. Mingma Sherpa and our front desk directly:\n\n' +
        '• **Mobile / WhatsApp:** +977 9851068219\n' +
        '• **Official Landline:** +977-1 4530311\n' +
        '• **Email:** info@hotelsherpasoul.com\n' +
        '• **Address:** Thamel, Kathmandu, Nepal',
      actions: [
        { label: 'WhatsApp Owner', url: KNOWLEDGE_BASE.whatsappUrl, isWhatsApp: true },
        { label: 'Contact Page & Inquiry Form', url: '/contact' }
      ]
    };
  }

  // 9. Wi-Fi / Hot Water / Amenities
  if (q.includes('wifi') || q.includes('internet') || q.includes('hot water') || q.includes('shower') || q.includes('amenit') || q.includes('सुविधा')) {
    return {
      reply: 'Every room at Hotel Sherpa Soul includes:\n\n' +
        '• High-speed fiber Wi-Fi throughout all floors\n' +
        '• 24/7 continuous hot water (solar + backup heating)\n' +
        '• Attached private modern bathroom with western toilet\n' +
        '• Clean linens, fresh towels & daily housekeeping\n' +
        '• Power backup for lights & charging during Kathmandu outages',
      actions: [
        { label: 'View Room Details', url: '/rooms' },
        { label: 'Book Now', url: '/book' }
      ]
    };
  }

  // Default response
  return {
    reply: 'Namaste! Hotel Sherpa Soul is a peaceful boutique hotel in Thamel, Kathmandu offering clean rooms ($20–$30/night) with 24/7 hot water, high-speed Wi-Fi, and a strict **"No Restaurant. No Noise. Sleep Well"** environment.\n\n' +
      'How may I assist your stay today?',
    actions: [
      { label: 'Check Room Rates', url: '/rooms' },
      { label: 'Direct Online Booking', url: '/book' },
      { label: 'Chat with Owner on WhatsApp', url: KNOWLEDGE_BASE.whatsappUrl, isWhatsApp: true }
    ]
  };
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const response = answerQuery(message);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        reply: 'I am here to assist with your stay at Hotel Sherpa Soul. Please message us directly on WhatsApp (+977 9851068219) for immediate personal assistance!',
        actions: [{ label: 'WhatsApp Owner', url: KNOWLEDGE_BASE.whatsappUrl, isWhatsApp: true }]
      },
      { status: 200 }
    );
  }
}
