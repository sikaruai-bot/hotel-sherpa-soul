import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Check, Users, ShieldCheck, MapPin, CalendarCheck, MessageCircle, ArrowLeft } from 'lucide-react';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.roomCategory.findUnique({
    where: { slug }
  });

  if (!category) return { title: 'Room Not Found' };

  return {
    title: category.seoTitle || `${category.name} in Thamel Kathmandu | Hotel Sherpa Soul`,
    description: category.seoDescription || category.description,
    alternates: { canonical: `https://hotelsherpasoul.com/rooms/${category.slug}` },
    openGraph: {
      title: `${category.name} | Hotel Sherpa Soul Thamel`,
      description: category.description,
      images: ['/images/doubleBedRoom.jpeg']
    }
  };
}

export default async function RoomDetailPage({ params }: Props) {
  const { slug } = await params;
  const category = await prisma.roomCategory.findUnique({
    where: { slug },
    include: {
      rooms: {
        where: { isSellable: true }
      }
    }
  });

  if (!category) {
    notFound();
  }

  let amenities: string[] = [];
  let images: string[] = [];
  try { amenities = JSON.parse(category.amenities); } catch { amenities = []; }
  try { images = JSON.parse(category.images); } catch { images = []; }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-slate-900">Home</Link>
        <span>/</span>
        <Link href="/rooms" className="hover:text-slate-900">Rooms</Link>
        <span>/</span>
        <span className="text-amber-600">{category.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left 2 Cols: Photos & Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Photo */}
          <div className="relative h-80 sm:h-[480px] w-full rounded-3xl overflow-hidden border border-slate-200 shadow-lg bg-slate-100">
            <Image
              src={images[0] || '/images/doubleBedRoom.jpeg'}
              alt={`${category.name} Hotel Sherpa Soul`}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-md text-amber-400 font-extrabold text-lg px-4 py-2 rounded-xl border border-slate-700 shadow-md">
              USD ${category.rateUSD} <span className="text-xs text-white font-normal">/ night</span>
            </div>
          </div>

          {/* Photo Gallery Thumbnails */}
          {images.length > 1 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative h-24 sm:h-32 rounded-xl overflow-hidden border border-slate-200">
                  <Image
                    src={img}
                    alt={`${category.name} view ${i + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Room Description */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {category.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {category.description}
            </p>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Max Occupancy</span>
                <span className="font-bold text-slate-800 text-sm">
                  {category.maxAdults} Adults + {category.maxChildren} Child (Max {category.maxGuests})
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Nightly Rate</span>
                <span className="font-bold text-amber-600 text-sm">USD ${category.rateUSD} / night</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Noise Level</span>
                <span className="font-bold text-emerald-600 text-sm">Quiet (No Restaurant)</span>
              </div>
            </div>
          </div>

          {/* Full Amenities */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Included Room Amenities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
              {amenities.map((amenity, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Booking Widget Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
            <div className="space-y-1 pb-4 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Direct Booking Price</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-600">USD ${category.rateUSD}</span>
                <span className="text-xs text-slate-500">per night</span>
              </div>
              <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                ✓ 10% Direct Booking Discount Included
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Check-in:</span>
                <strong className="text-slate-800">14:00 onwards</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Check-out:</span>
                <strong className="text-slate-800">Until 12:00</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Cancellation:</span>
                <strong className="text-emerald-700">Flexible 24h cancellation</strong>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href={`/book?category=${category.id}`}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm text-center block shadow-md transition-all active:scale-95"
              >
                Book This Room Now
              </Link>

              <a
                href={`https://wa.me/9779851068219?text=Hello%20Hotel%20Sherpa%20Soul,%20I%20am%20interested%20in%20the%20${encodeURIComponent(category.name)}%20at%20USD%20$${category.rateUSD}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl border border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 font-bold text-xs text-center flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Inquire on WhatsApp</span>
              </a>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 text-center leading-relaxed">
              🔒 No credit card required to hold reservation. Pay upon arrival in Cash (NPR/USD) or Bank Transfer.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
