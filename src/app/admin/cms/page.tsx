import React from 'react';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import AdminCmsClient from '@/components/admin/AdminCmsClient';

export const revalidate = 0;

export default async function AdminCmsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const settings = await prisma.siteSetting.findMany();
  const offers = await prisma.offer.findMany({ orderBy: { createdAt: 'desc' } });
  const blogs = await prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } });

  const plainSettings = settings.map(s => ({ key: s.key, value: s.value, description: s.description || '' }));
  const plainOffers = offers.map(o => ({
    id: o.id,
    title: o.title,
    code: o.code,
    discountPct: o.discountPct,
    startDate: o.startDate.toISOString().split('T')[0],
    endDate: o.endDate.toISOString().split('T')[0],
    description: o.description,
    isActive: o.isActive,
  }));
  const plainBlogs = blogs.map(b => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
    excerpt: b.excerpt || '',
    author: b.author,
    isPublished: b.isPublished,
    publishedAt: b.publishedAt.toISOString().split('T')[0],
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Website Content Management (CMS)</h1>
        <p className="text-xs text-slate-500">
          Manage hotel contact info, tracking IDs (Pixel, GA4), promotional offers, and SEO blog posts.
        </p>
      </div>

      <AdminCmsClient settings={plainSettings} offers={plainOffers} blogs={plainBlogs} />
    </div>
  );
}
