import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
      include: {
        booking: {
          include: { category: true, physicalRoom: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      hotel: {
        name: 'Hotel Sherpa Soul',
        tagline: 'No Restaurant. No Noise. Sleep Well.',
        address: 'Thamel, Kathmandu, Nepal',
        phone: '+977 9851068219',
        landline: '+977-1 4530311',
        email: 'info@hotelsherpasoul.com',
        website: 'https://hotelsherpasoul.com',
        owner: 'Mr. Mingma Sherpa',
      },
      invoice: {
        ...invoice,
        parsedItems: JSON.parse(invoice.items || '[]'),
      },
    });
  } catch (error: any) {
    console.error('Invoice detail error:', error);
    return NextResponse.json({ error: error?.message || 'Error fetching invoice' }, { status: 500 });
  }
}
