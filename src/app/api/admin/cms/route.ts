import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { type } = body;

    if (type === 'setting') {
      const { settings } = body; // Array of { key, value }
      for (const s of settings) {
        await prisma.siteSetting.upsert({
          where: { key: s.key },
          update: { value: s.value },
          create: { key: s.key, value: s.value, description: s.description || '' }
        });
      }
      return NextResponse.json({ success: true });
    }

    if (type === 'offer') {
      const { title, code, discountPct, startDate, endDate, description, isActive } = body;
      const offer = await prisma.offer.create({
        data: {
          title,
          code: code.trim().toUpperCase(),
          discountPct: parseFloat(discountPct),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          description,
          isActive: isActive !== false,
        }
      });
      return NextResponse.json({ success: true, offer });
    }

    if (type === 'blog') {
      const { title, slug, excerpt, content, featuredImage, seoTitle, seoDescription, author, isPublished } = body;
      const post = await prisma.blogPost.create({
        data: {
          title,
          slug,
          excerpt,
          content,
          featuredImage,
          seoTitle,
          seoDescription,
          author: author || user.name,
          isPublished: isPublished !== false,
        }
      });
      return NextResponse.json({ success: true, post });
    }

    return NextResponse.json({ error: 'Unknown CMS type' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error processing CMS update' }, { status: 500 });
  }
}
