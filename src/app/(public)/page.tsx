import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShieldCheck, 
  Wifi, 
  Sparkles, 
  MapPin, 
  Clock, 
  CalendarCheck, 
  MessageCircle, 
  Phone, 
  ChevronRight, 
  Check, 
  Users, 
  Coffee, 
  VolumeX, 
  BedDouble, 
  Maximize2,
  UtensilsCrossed,
  Luggage,
  Award,
  HelpCircle,
  Car
} from 'lucide-react';
import prisma from '@/lib/prisma';
import HeroBookingBar from '@/components/public/HeroBookingBar';

export const revalidate = 60; // ISR cache revalidation every 60s

export default async function HomePage() {
  // Fetch room categories from database
  const categories = await prisma.roomCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      rooms: {
        where: { isSellable: true }
      }
    }
  });

  // Fetch reviews
  const reviews = await prisma.review.findMany({
    where: { isPublished: true },
    take: 3,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-16 lg:space-y-24">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[640px] lg:min-h-[720px] flex items-center justify-center overflow-hidden bg-slate-950">
        {/* Background Hero Image with Optimized Next.js Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/doubleBedRoom.jpeg"
            alt="Hotel Sherpa Soul Thamel Kathmandu Guest Room"
            fill
            priority
            className="object-cover object-center opacity-40 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
          {/* Location & USP pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-md">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Thamel, Kathmandu, Nepal</span>
            <span className="text-amber-500">•</span>
            <span>6 Quiet Guest Rooms</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight sm:leading-tight">
            A Peaceful & Affordable Stay in the Heart of Thamel
          </h1>

          {/* Primary USP Highlight */}
          <div className="inline-block px-5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-amber-400 font-bold text-lg sm:text-2xl shadow-xl backdrop-blur-md">
            “No Restaurant. No Noise. Sleep Well.”
          </div>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            Welcome to Hotel Sherpa Soul. We intentionally run without an in-house restaurant so you experience total quiet in Kathmandu. Clean rooms, hot water 24/7, high-speed Wi-Fi, and genuine Sherpa hospitality.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/book"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-base shadow-lg hover:shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <CalendarCheck className="w-5 h-5 text-slate-950" />
              <span>Book Direct & Save 10%</span>
            </Link>

            <a
              href="https://wa.me/9779851068219?text=Hello%20Hotel%20Sherpa%20Soul,%20I%20would%20like%20to%20inquire%20about%20booking%20a%20room"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>WhatsApp Us Now</span>
            </a>
          </div>

          {/* Interactive Booking Search Bar */}
          <div className="pt-6">
            <HeroBookingBar />
          </div>
        </div>
      </section>

      {/* 2. TRUST HIGHLIGHTS BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-12 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <VolumeX className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">No Restaurant Noise</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Quiet sleep haven away from loud bars and kitchen clatter</p>
          </div>

          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Spotlessly Clean</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Fresh linens, spotless bathrooms, and daily housekeeping</p>
          </div>

          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Direct Booking Perks</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Guaranteed best rate from USD $20/night with zero OTA commission</p>
          </div>

          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Sherpa Hospitality</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Personal owner care, trekking advice & flexible luggage storage</p>
          </div>
        </div>
      </section>

      {/* 3. ROOMS SECTION (AUTHORITATIVE 3 CATEGORIES) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Comfortable Accommodations
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Our Guest Room Categories
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Hotel Sherpa Soul features exactly <strong>6 sellable rooms</strong> on Floor 2 and Floor 3, organized into 3 transparent categories. No hidden charges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map(cat => {
            let amenities: string[] = [];
            let images: string[] = [];
            try { amenities = JSON.parse(cat.amenities); } catch { amenities = []; }
            try { images = JSON.parse(cat.images); } catch { images = []; }

            const mainImage = images[0] || '/images/doubleBedRoom.jpeg';

            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Room Image */}
                <div className="relative h-60 w-full overflow-hidden bg-slate-100">
                  <Image
                    src={mainImage}
                    alt={`${cat.name} at Hotel Sherpa Soul Thamel`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-amber-400 font-extrabold text-sm px-3 py-1.5 rounded-lg border border-slate-700 shadow-md">
                    USD ${cat.rateUSD} <span className="text-xs text-white font-normal">/ night</span>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-md shadow">
                    Max: {cat.maxAdults} Adults {cat.maxChildren > 0 ? `+ ${cat.maxChildren} Child` : ''}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  {/* Amenities Pills */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-600">
                      {amenities.slice(0, 4).map((amenity, i) => (
                        <div key={i} className="flex items-center gap-1.5 truncate">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="pt-4 flex items-center gap-2 border-t border-slate-100">
                    <Link
                      href={`/rooms/${cat.slug}`}
                      className="flex-1 py-2.5 px-3 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold text-center transition-colors"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/book?category=${cat.id}`}
                      className="flex-1 py-2.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold text-center transition-all shadow-sm active:scale-95"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Long Stay & Shared Kitchen Highlight Box */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50 rounded-2xl p-6 sm:p-8 border border-amber-200/80 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wide bg-amber-200/60 px-2.5 py-1 rounded-md">
              Special Facility: Area 102
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Shared Guest Kitchen for Long-Stay Guests (2+ Weeks)
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Planning to stay in Kathmandu for trekking preparation, remote work, or volunteering? Eligible long-stay guests (minimum recommended 14 days) get full access to our fully equipped Shared Kitchen on Floor 1. Cook your own food, store groceries, and save on daily expenses.
            </p>
          </div>
          <Link
            href="/long-stay"
            className="shrink-0 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-md transition-colors flex items-center gap-2"
          >
            <span>Learn About Shared Kitchen</span>
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </Link>
        </div>
      </section>

      {/* 4. WHY CHOOSE HOTEL SHERPA SOUL */}
      <section className="bg-slate-900 text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Honest Hospitality
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Why Travelers Choose Hotel Sherpa Soul
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              We focus on what truly matters to international travelers and trekkers: clean beds, real quiet, fast Wi-Fi, and honest local hospitality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <VolumeX className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Genuine Quiet in Central Thamel</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Most hotels in Thamel have ground-floor bars and restaurants that play loud music until midnight. By having <strong>no restaurant</strong>, Hotel Sherpa Soul remains a tranquil residential sanctuary.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Wifi className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Reliable Wi-Fi & Hot Showers</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Dual solar and electric water heating systems ensure 24-hour hot water even during cold Kathmandu mornings. High-speed optical fiber Wi-Fi throughout all rooms.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Luggage className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Trekking Luggage Storage</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Heading into the Himalayas for Everest or Annapurna treks? Leave your excess bags securely in our locked storage area free of charge until you return.
              </p>
            </div>
          </div>

          {/* Honest Note: What We DO NOT have (No restaurant, No private parking) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 sm:p-6 text-xs sm:text-sm text-slate-400 flex items-start gap-3 max-w-3xl mx-auto">
            <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Honest Transparency Notice:</strong> Hotel Sherpa Soul does NOT operate an in-house restaurant and does NOT have private vehicle parking. We are located in an authentic pedestrian-friendly Thamel alleyway, just steps away from Kathmandu's best organic cafes, bakeries, and Nepali restaurants.
            </div>
          </div>
        </div>
      </section>

      {/* 5. LOCATION & APPROXIMATE TRANSIT TIMES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Kathmandu Accessibility
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Prime Location in Thamel
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Located right in Thamel, within walking distance of gear shops, money exchanges, and ATMs, with easy taxi access to Kathmandu's UNESCO heritage monuments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-center space-y-2">
            <span className="text-3xl font-extrabold text-amber-600 block">~ 20 min</span>
            <h3 className="font-bold text-slate-900 text-base">Tribhuvan Int'l Airport (TIA)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Approx. 20-30 minutes by taxi depending on Kathmandu traffic conditions. Pre-paid airport taxis available 24/7.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-center space-y-2">
            <span className="text-3xl font-extrabold text-amber-600 block">~ 15 min</span>
            <h3 className="font-bold text-slate-900 text-base">Pashupatinath Temple</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Approx. 15-20 minutes by taxi. Sacred Hindu temple along the holy Bagmati River.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-center space-y-2">
            <span className="text-3xl font-extrabold text-amber-600 block">~ 20 min</span>
            <h3 className="font-bold text-slate-900 text-base">Boudhanath Stupa</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Approx. 20-25 minutes by taxi. One of the largest spherical stupas in Nepal and Tibetan Buddhist center.
            </p>
          </div>
        </div>

        <div className="text-center pt-2">
          <Link
            href="/location"
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-800"
          >
            <span>View Full Map & Directions Guide</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 6. VIRTUAL TOUR VIDEO SECTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Video Walkthrough</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Virtual Tour of Hotel Sherpa Soul</h2>
          <p className="text-xs sm:text-sm text-slate-600">Take a virtual walk inside our reception desk, rooms, and peaceful balcony view.</p>
        </div>

        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-slate-900">
          <video
            controls
            preload="metadata"
            poster="/images/frontend_desk.jpeg"
            className="w-full h-full object-cover"
          >
            <source
              src="https://res.cloudinary.com/dobakybbu/video/upload/v1781170404/WhatsApp_Video_2026-06-11_at_3.06.54_PM_nkhxsw.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>
      </section>

      {/* 7. VERIFIED GUEST REVIEWS */}
      <section className="bg-slate-50 border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Verified Feedback</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">What Our Guests Say</h2>
            <p className="text-xs sm:text-sm text-slate-600">Real, unedited experiences from travelers who stayed at Hotel Sherpa Soul.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map(rev => (
              <div
                key={rev.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <span key={i} className="text-lg">★</span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 italic leading-relaxed">
                    “{rev.comment}”
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-slate-800">{rev.guestName}</span>
                  <span>{rev.guestOrigin ? `from ${rev.guestOrigin}` : 'Verified Guest'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Helpful Questions</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-slate-600">Everything you need to know about staying at Hotel Sherpa Soul.</p>
        </div>

        <div className="space-y-4">
          <details className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-bold text-slate-900 text-sm sm:text-base">
              <span>Where exactly is Hotel Sherpa Soul located?</span>
              <span className="shrink-0 transition duration-300 group-open:-rotate-180 text-amber-600">▼</span>
            </summary>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              We are located in Thamel, Kathmandu, Nepal, tucked inside a quiet alleyway just a minute from the main tourist streets. You get the convenience of Thamel without the street traffic and bar noise.
            </p>
          </details>

          <details className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-bold text-slate-900 text-sm sm:text-base">
              <span>Does Hotel Sherpa Soul have an on-site restaurant?</span>
              <span className="shrink-0 transition duration-300 group-open:-rotate-180 text-amber-600">▼</span>
            </summary>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              No. We deliberately do NOT operate a restaurant on the property. This is our core brand commitment: <strong>“No Restaurant. No Noise. Sleep Well.”</strong> Hundreds of bakeries, cafes, and restaurants serving Nepali, Western, Indian, and Tibetan food are located within a 1 to 5 minute walk.
            </p>
          </details>

          <details className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-bold text-slate-900 text-sm sm:text-base">
              <span>Is there vehicle parking at the hotel?</span>
              <span className="shrink-0 transition duration-300 group-open:-rotate-180 text-amber-600">▼</span>
            </summary>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              No, we do not have private vehicle parking. We are located in a pedestrian-friendly Thamel alleyway. Taxis can drop you off nearby at the entrance of the alley.
            </p>
          </details>

          <details className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-bold text-slate-900 text-sm sm:text-base">
              <span>How does the Shared Kitchen (Room 102) work?</span>
              <span className="shrink-0 transition duration-300 group-open:-rotate-180 text-amber-600">▼</span>
            </summary>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Room 102 on Floor 1 is a dedicated, fully equipped shared kitchen intended for our long-stay guests staying 14 days or longer. It features a gas stove, refrigerator, cookware, dinnerware, and food storage so you can prepare your own meals.
            </p>
          </details>

          <details className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-bold text-slate-900 text-sm sm:text-base">
              <span>Why should I book directly on this website instead of an OTA?</span>
              <span className="shrink-0 transition duration-300 group-open:-rotate-180 text-amber-600">▼</span>
            </summary>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              When you book directly on our website or through WhatsApp, you avoid third-party commission markups, get a 10% direct discount, receive immediate WhatsApp confirmation directly with owner Mingma Sherpa, and enjoy flexible check-in assistance.
            </p>
          </details>
        </div>

        <div className="text-center pt-2">
          <Link
            href="/faq"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-800"
          >
            <span>View All Frequently Asked Questions</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 9. FINAL CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Instant Direct Reservation
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready for a Quiet Sleep in Kathmandu?
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Only 6 rooms available. Lock in your direct booking rate today with no booking fees and instant WhatsApp confirmation.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/book"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm shadow-lg transition-transform active:scale-95"
              >
                Reserve Your Room Now
              </Link>
              <a
                href="https://wa.me/9779851068219?text=Hello%20Hotel%20Sherpa%20Soul,%20I%20would%20like%20to%20book%20a%20room"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
