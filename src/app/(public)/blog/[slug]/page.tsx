import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) return { title: 'Article Not Found' };

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || '',
    alternates: { canonical: `https://hotelsherpasoul.com/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || !post.isPublished) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-slate-900">Home</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-slate-900">Blog</Link>
        <span>/</span>
        <span className="text-amber-600 truncate">{post.title}</span>
      </div>

      <header className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>By <strong>{post.author}</strong></span>
          <span>•</span>
          <span>Published on {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </header>

      {post.featuredImage && (
        <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden border border-slate-200 shadow-md">
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            priority
            className="object-cover"
          />
        </div>
      )}

      <div className="prose prose-slate max-w-none text-sm sm:text-base text-slate-700 leading-relaxed space-y-4 whitespace-pre-line">
        {post.content}
      </div>

      <div className="pt-8 border-t border-slate-200 bg-amber-50/60 rounded-2xl p-6 text-center space-y-3">
        <h3 className="font-bold text-slate-900 text-lg">Visiting Thamel Kathmandu?</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Experience our tranquil haven: “No Restaurant. No Noise. Sleep Well.” Book direct from USD $20/night.
        </p>
        <Link
          href="/book"
          className="inline-block px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm"
        >
          Check Room Availability
        </Link>
      </div>
    </article>
  );
}
