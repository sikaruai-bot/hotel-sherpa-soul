import React from 'react';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Photo Gallery & Authentic Room Pictures',
  description: 'View authentic high-resolution photos of Hotel Sherpa Soul in Thamel, Kathmandu: clean guest rooms, front desk, balcony view, and video tour.',
  alternates: { canonical: 'https://hotelsherpasoul.com/gallery' },
};

export default function GalleryPage() {
  const images = [
    { src: '/images/doubleBedRoom.jpeg', title: 'Budget Family Room', category: 'Rooms' },
    { src: '/images/doubleBed.jpeg', title: 'Family Room Comfort', category: 'Rooms' },
    { src: '/images/singleBedWithSofa.jpeg', title: 'Family Room Seating & Sofa', category: 'Rooms' },
    { src: '/images/room2.jpeg', title: 'Deluxe Room Bedding', category: 'Rooms' },
    { src: '/images/frontend_desk.jpeg', title: 'Reception & Welcome Desk', category: 'Lounge' },
    { src: '/images/balkani.jpeg', title: 'Balcony & Rooftop View', category: 'Views' },
    { src: '/images/singlesitter.jpeg', title: 'Quiet Lounge Seating', category: 'Lounge' },
    { src: '/images/viewSeen.jpeg', title: 'Kathmandu Neighborhood View', category: 'Views' },
    { src: '/images/room.jpeg', title: 'Spacious Guest Room', category: 'Rooms' },
    { src: '/images/intro5.jpeg', title: 'Clean Modern Room Decor', category: 'Rooms' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Authentic Photos
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Hotel Photo Gallery
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Explore genuine, unedited photos of our rooms, reception, and Thamel views.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((item, idx) => (
          <div
            key={idx}
            className="group relative h-72 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm hover:shadow-xl transition-all duration-300"
          >
            <Image
              src={item.src}
              alt={`${item.title} - Hotel Sherpa Soul Thamel Kathmandu`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">{item.category}</span>
                <h3 className="text-white font-bold text-base">{item.title}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Tour */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 text-white space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Watch Our Video Walkthrough</h2>
          <p className="text-xs sm:text-sm text-slate-400">Recorded on site at Hotel Sherpa Soul in Thamel, Kathmandu.</p>
        </div>
        <div className="max-w-4xl mx-auto aspect-video rounded-2xl overflow-hidden border border-slate-700 bg-black">
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
            Your browser does not support video.
          </video>
        </div>
      </div>
    </div>
  );
}
