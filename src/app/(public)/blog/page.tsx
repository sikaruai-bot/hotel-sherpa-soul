import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kathmandu Travel Guides & Trekking Tips | Hotel Sherpa Soul Blog',
  description: 'Expert Kathmandu travel guides: how to find a quiet hotel in Thamel, airport transport advice, and Nepal travel tips from Hotel Sherpa Soul.',
  alternates: { canonical: 'https://hotelsherpasoul.com/blog' },
};

export const revalidate = 60;

export default async function BlogListPage() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Kathmandu Travel Insights
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Hotel Sherpa Soul Blog & Guides
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Practical advice from local Sherpa hosts to help you enjoy an authentic, restful stay in Nepal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts.map(post => (
          <article
            key={post.id}
            className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group"
          >
            <div className="relative h-60 w-full overflow-hidden bg-slate-100">
              <Image
                src={post.featuredImage || '/images/viewSeen.jpeg'}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  By {post.author}
                </span>
                <h2 className="text-xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1"
                >
                  Read Travel Guide →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
