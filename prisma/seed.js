const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Hotel Sherpa Soul database...');

  // 1. Password Hash
  const passwordHash = bcrypt.hashSync('SherpaSoul@2026!', 10);

  // 2. Users
  await prisma.user.deleteMany();
  const owner = await prisma.user.create({
    data: {
      id: 'usr_owner',
      email: 'mingmasaino@gmail.com',
      name: 'Mingma Sherpa (Owner)',
      passwordHash: passwordHash,
      role: 'OWNER',
      isActive: true,
    }
  });

  const staff = await prisma.user.create({
    data: {
      id: 'usr_staff',
      email: 'info@hotelsherpasoul.com',
      name: 'Sherpa Soul Front Desk',
      passwordHash: passwordHash,
      role: 'STAFF',
      isActive: true,
    }
  });
  console.log('Created Users: Owner & Staff');

  // 3. Room Categories (Authoritative Categories A, B, C)
  await prisma.booking.deleteMany();
  await prisma.physicalRoom.deleteMany();
  await prisma.roomCategory.deleteMany();

  const catA = await prisma.roomCategory.create({
    data: {
      id: 'cat_budget_family',
      code: 'CATEGORY_A',
      slug: 'budget-family-room',
      name: 'Budget Family Room',
      rateUSD: 20.0,
      maxAdults: 3,
      maxChildren: 1,
      maxGuests: 4,
      description: 'A spacious, quiet, and affordable family room designed for small families, backpackers, or groups traveling together in Thamel. Features comfortable bedding, peaceful ambiance, and essential amenities.',
      amenities: JSON.stringify([
        'Queen Bed + Single Bed', 'High-Speed Wi-Fi', 'Private Bathroom', 'Hot Water 24/7',
        'Fresh Linens & Towels', 'Baggage Storage Drawer', 'Quiet Sleep Environment', 'Daily Housekeeping'
      ]),
      images: JSON.stringify([
        '/images/doubleBedRoom.jpeg', '/images/room.jpeg', '/images/balkani.jpeg', '/images/viewSeen.jpeg'
      ]),
      seoTitle: 'Budget Family Room in Thamel Kathmandu | Hotel Sherpa Soul',
      seoDescription: 'Book the Budget Family Room at Hotel Sherpa Soul in Thamel, Kathmandu. USD 20/night. Sleeps up to 3 Adults + 1 Child. Quiet, clean, and peaceful.',
      sortOrder: 1,
    }
  });

  const catB = await prisma.roomCategory.create({
    data: {
      id: 'cat_family_room',
      code: 'CATEGORY_B',
      slug: 'family-room',
      name: 'Family Room',
      rateUSD: 30.0,
      maxAdults: 3,
      maxChildren: 1,
      maxGuests: 4,
      description: 'Our premier family accommodation offering enhanced comfort, generous floor space, multiple bed configurations, and an ultra-quiet sleep sanctuary in the center of Thamel.',
      amenities: JSON.stringify([
        'King Bed + Single Bed', 'High-Speed Wi-Fi', 'Ensuite Bathroom', 'Balcony / City View',
        'Hot Water 24/7', 'Work Desk & Seating', 'Toothpaste & Essentials Kit', 'Baggage Storage Drawer'
      ]),
      images: JSON.stringify([
        '/images/doubleBed.jpeg', '/images/singleBedWithSofa.jpeg', '/images/singlesitter.jpeg', '/images/balkani.jpeg'
      ]),
      seoTitle: 'Family Room Accommodation in Thamel | Hotel Sherpa Soul',
      seoDescription: 'Spacious Family Room in Thamel, Kathmandu at USD 30/night. Accommodates 3 Adults + 1 Child. Quiet stay with no restaurant noise.',
      sortOrder: 2,
    }
  });

  const catC = await prisma.roomCategory.create({
    data: {
      id: 'cat_deluxe_room',
      code: 'CATEGORY_C',
      slug: 'deluxe-room',
      name: 'Deluxe Room',
      rateUSD: 20.0,
      maxAdults: 2,
      maxChildren: 1,
      maxGuests: 3,
      description: 'Perfect for solo travelers, couples, or digital nomads seeking a clean, restful haven in Thamel. Enjoy total peace and quiet after exploring Kathmandu.',
      amenities: JSON.stringify([
        'Queen Bed', 'High-Speed Wi-Fi', 'Private Modern Bathroom', 'Hot Water 24/7',
        'Reading Lamps', 'Complimentary Toiletries', 'Quiet Atmosphere', 'Long-Stay Ready'
      ]),
      images: JSON.stringify([
        '/images/room2.jpeg', '/images/intro5.jpeg', '/images/doubleBedRoom.jpeg', '/images/viewSeen.jpeg'
      ]),
      seoTitle: 'Deluxe Room in Thamel Kathmandu | Hotel Sherpa Soul',
      seoDescription: 'Affordable Deluxe Room in Thamel at USD 20/night. Max 2 Adults + 1 Child. Clean, quiet, and peaceful hotel stay.',
      sortOrder: 3,
    }
  });
  console.log('Created 3 Room Categories (Budget Family, Family, Deluxe)');

  // 4. Physical Rooms (EXACTLY 6 SELLABLE ROOMS: Floor 2: 201-203, Floor 3: 301-303)
  const roomsData = [
    { id: 'rm_201', roomNumber: '201', floor: 2, categoryId: catA.id, status: 'AVAILABLE', isSellable: true, notes: 'Floor 2 - Peaceful inner courtyard view' },
    { id: 'rm_202', roomNumber: '202', floor: 2, categoryId: catB.id, status: 'AVAILABLE', isSellable: true, notes: 'Floor 2 - Spacious corner room with balcony' },
    { id: 'rm_203', roomNumber: '203', floor: 2, categoryId: catC.id, status: 'AVAILABLE', isSellable: true, notes: 'Floor 2 - Deluxe room with premium bedding' },
    { id: 'rm_301', roomNumber: '301', floor: 3, categoryId: catA.id, status: 'AVAILABLE', isSellable: true, notes: 'Floor 3 - Upper floor quiet room' },
    { id: 'rm_302', roomNumber: '302', floor: 3, categoryId: catC.id, status: 'AVAILABLE', isSellable: true, notes: 'Floor 3 - Deluxe room with city rooftop view' },
    { id: 'rm_303', roomNumber: '303', floor: 3, categoryId: catB.id, status: 'AVAILABLE', isSellable: true, notes: 'Floor 3 - Large family room with ample natural light' },
  ];

  for (const r of roomsData) {
    await prisma.physicalRoom.create({ data: r });
  }
  console.log('Created EXACTLY 6 Sellable Physical Rooms (201, 202, 203, 301, 302, 303)');

  // 5. Facility: Shared Kitchen (Room 102) - NOT SELLABLE, NEVER IN OCCUPANCY / ADR / REVPAR
  await prisma.facility.deleteMany();
  await prisma.facility.create({
    data: {
      id: 'fac_kitchen_102',
      code: 'KITCHEN_102',
      name: 'Shared Kitchen (Room 102)',
      floor: 1,
      isSellable: false, // NOT SELLABLE!
      minStayDays: 14, // Recommended for long-stay guests (2+ weeks)
      description: 'Fully equipped shared guest kitchen dedicated for our valued long-stay guests. Features gas cookers, refrigerator, cookware, dinnerware, and food storage drawers. Prepare your own meals and feel at home in Kathmandu.',
      images: JSON.stringify(['/images/singlesitter.jpeg', '/images/viewSeen.jpeg']),
      amenities: JSON.stringify(['Gas Stove', 'Refrigerator', 'Pots & Pans', 'Utensils & Cutlery', 'Personal Food Storage', 'Filtered Water', 'Dining Table']),
    }
  });
  console.log('Created Shared Kitchen (Room 102) facility (non-sellable)');

  // 6. Site Settings
  await prisma.siteSetting.deleteMany();
  const settings = [
    { key: 'hotel_name', value: 'Hotel Sherpa Soul', description: 'Official Business Name' },
    { key: 'tagline', value: 'A Peaceful & Affordable Stay in the Heart of Thamel', description: 'Brand Tagline' },
    { key: 'usp', value: 'No Restaurant. No Noise. Sleep Well.', description: 'Primary USP' },
    { key: 'address', value: 'Thamel, Kathmandu, Nepal', description: 'Hotel Location' },
    { key: 'phone', value: '+977 9851068219', description: 'Primary Mobile Phone' },
    { key: 'landline', value: '+977-1 4530311', description: 'Official Landline Phone' },
    { key: 'whatsapp', value: '9779851068219', description: 'WhatsApp Contact Number' },
    { key: 'email', value: 'info@hotelsherpasoul.com', description: 'Official Business Email' },
    { key: 'check_in_time', value: '14:00', description: 'Standard Check-in Time' },
    { key: 'check_out_time', value: '12:00', description: 'Standard Check-out Time' },
    { key: 'meta_pixel_id', value: '1952950858737501', description: 'Meta Pixel ID' },
    { key: 'ga4_id', value: '', description: 'Google Analytics 4 Measurement ID' },
    { key: 'gtm_id', value: '', description: 'Google Tag Manager ID' },
    { key: 'hero_title', value: 'A Peaceful & Affordable Stay in Thamel', description: 'Hero Main Heading' },
    { key: 'hero_subtitle', value: 'No Restaurant. No Noise. Sleep Well. Enjoy clean, comfortable rooms in Kathmandu at direct booking rates.', description: 'Hero Subheading' }
  ];

  for (const s of settings) {
    await prisma.siteSetting.create({ data: s });
  }

  // 7. Initial Offers
  await prisma.offer.deleteMany();
  await prisma.offer.create({
    data: {
      id: 'off_direct10',
      title: 'Book Direct & Save 10%',
      code: 'DIRECT10',
      discountPct: 10.0,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      description: 'Save 10% on your entire stay when booking directly through our website or WhatsApp. Best rate guarantee with zero middleman commissions.',
      isActive: true,
    }
  });

  await prisma.offer.create({
    data: {
      id: 'off_longstay',
      title: 'Long Stay Comfort (2+ Weeks)',
      code: 'LONGSTAY15',
      discountPct: 15.0,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      description: 'Special discounted rates for stays of 14 nights or longer. Includes full access to our Shared Kitchen (Room 102).',
      isActive: true,
    }
  });

  // 8. Verified Authentic Reviews
  await prisma.review.deleteMany();
  await prisma.review.createMany({
    data: [
      {
        id: 'rev_1',
        guestName: 'David K.',
        guestOrigin: 'Australia',
        rating: 5,
        comment: 'Cleanest and quietest place I stayed in Thamel. Most hotels in Thamel are right above noisy bars and restaurants, but Sherpa Soul was quiet, the beds were great, and Mingma was super helpful.',
        source: 'GOOGLE',
        isPublished: true,
      },
      {
        id: 'rev_2',
        guestName: 'Elena R.',
        guestOrigin: 'Spain',
        rating: 5,
        comment: 'Great location in Thamel, close to everything but in a calm alleyway. Hot water was continuous and the Wi-Fi was fast enough for my remote work calls. Highly recommend the family room!',
        source: 'DIRECT',
        isPublished: true,
      },
      {
        id: 'rev_3',
        guestName: 'Marcus T.',
        guestOrigin: 'Germany',
        rating: 5,
        comment: 'Stayed for three weeks using the shared kitchen. Saved a lot on food and felt very welcome. True Nepalese hospitality without the unnecessary hotel hype.',
        source: 'DIRECT',
        isPublished: true,
      }
    ]
  });

  // 9. SEO Blog Posts
  await prisma.blogPost.deleteMany();
  await prisma.blogPost.createMany({
    data: [
      {
        id: 'post_1',
        slug: 'where-to-stay-in-thamel-kathmandu-quiet-hotel-guide',
        title: 'Where to Stay in Thamel: How to Find a Quiet, Peaceful Hotel',
        excerpt: 'A comprehensive guide to choosing the best, quiet accommodation in Thamel Kathmandu for trekkers, couples, and digital nomads.',
        content: `Thamel is the bustling heartbeat of Kathmandu, brimming with gear shops, cafes, bakeries, and trekking agencies. However, many first-time travelers to Nepal discover that many hotels in Thamel are situated directly above loud pubs, restaurants, and busy streets.

If you are a trekker preparing for the Everest Base Camp or Annapurna Circuit, or returning exhausted after weeks in the mountains, a good night's sleep is essential.

### Why Choose a Hotel Without an In-House Restaurant?
Many hotels in Kathmandu operate their own noisy ground-floor restaurants, with cooking smells, kitchen clatter, and bar music lasting until midnight. At Hotel Sherpa Soul, our philosophy is simple: **"No Restaurant. No Noise. Sleep Well."** By keeping our property peaceful and residential, guests enjoy undisturbed sleep while being just a 1-minute walk from Thamel's finest dining establishments.

### Key Tips for Staying in Thamel:
1. **Choose an Inner Alley Property:** Always select accommodations situated slightly off the main vehicular thoroughfares.
2. **Confirm 24/7 Hot Water:** Kathmandu winters require reliable solar and electric hot water systems.
3. **Book Direct for Best Assistance:** Booking directly with local owners guarantees flexible check-in and luggage storage while you are on trek.`,
        featuredImage: '/images/viewSeen.jpeg',
        seoTitle: 'Where to Stay in Thamel: Quiet Hotel Guide Kathmandu | Hotel Sherpa Soul',
        seoDescription: 'Find a quiet, peaceful hotel in Thamel Kathmandu. Learn why a hotel with no restaurant noise ensures the best sleep for travelers and trekkers.',
        author: 'Mingma Sherpa',
        isPublished: true,
      },
      {
        id: 'post_2',
        slug: 'kathmandu-airport-to-thamel-transport-guide',
        title: 'Kathmandu Airport (TIA) to Thamel: Complete Travel Guide',
        excerpt: 'Step-by-step instructions on traveling from Tribhuvan International Airport to Thamel Kathmandu safely, affordably, and smoothly.',
        content: `Arriving at Tribhuvan International Airport (TIA) in Kathmandu can be exciting yet overwhelming for international visitors. Here is what you need to know about getting from TIA to Thamel:

### Distance & Approximate Travel Time
- **Distance:** Approximately 6 to 7 kilometers.
- **Travel Time:** Typically 20 to 30 minutes depending on Kathmandu traffic conditions. During peak rush hours (9:00 AM - 11:00 AM and 5:00 PM - 7:00 PM), traffic along Ring Road and Lazimpat can add 15 minutes.

### Transport Options
1. **Pre-Paid Airport Taxi:** Located immediately outside the international arrival terminal exit. Fixed rates are posted (usually around NPR 800 - 1,000 / USD 7 - 9).
2. **Ride-Sharing Apps:** Popular local apps like *Pathao* or *InDrive* work well if you purchase a local Ncell or Nepal Telecom SIM card at the airport arrival hall.
3. **Direct Assistance:** Guests staying at Hotel Sherpa Soul can easily message us on WhatsApp with their flight number for arrival guidance.`,
        featuredImage: '/images/frontend_desk.jpeg',
        seoTitle: 'Kathmandu Airport to Thamel: Taxi & Travel Guide | Hotel Sherpa Soul',
        seoDescription: 'How to get from Kathmandu Airport (TIA) to Thamel. Approximate travel times, taxi costs, and tips from Hotel Sherpa Soul.',
        author: 'Hotel Sherpa Soul Team',
        isPublished: true,
      }
    ]
  });

  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
