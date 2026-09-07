import prisma from './prisma';

export interface AvailabilityResult {
  category: {
    id: string;
    code: string;
    slug: string;
    name: string;
    rateUSD: number;
    maxAdults: number;
    maxChildren: number;
    maxGuests: number;
    description: string;
    amenities: string[];
    images: string[];
  };
  availableRoomsCount: number;
  totalAssignedRooms: number;
  isAvailable: boolean;
  totalPriceUSD: number;
  totalNights: number;
}

export async function checkAvailability(
  checkInDateStr: string,
  checkOutDateStr: string,
  adults: number,
  children: number
): Promise<{
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  categories: AvailabilityResult[];
}> {
  const checkIn = new Date(checkInDateStr);
  const checkOut = new Date(checkOutDateStr);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut <= checkIn) {
    throw new Error('Invalid check-in and check-out dates.');
  }

  const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
  const totalGuests = adults + children;

  // 1. Fetch categories
  const categories = await prisma.roomCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      rooms: {
        where: { isSellable: true } // Exactly 6 sellable physical rooms
      }
    }
  });

  // 2. Fetch conflicting active bookings
  const conflictingBookings = await prisma.booking.findMany({
    where: {
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      AND: [
        { checkIn: { lt: checkOut } },
        { checkOut: { gt: checkIn } }
      ]
    },
    select: {
      id: true,
      categoryId: true,
      physicalRoomId: true,
    }
  });

  const results: AvailabilityResult[] = categories.map(cat => {
    // Capacity check
    const satisfiesGuests = adults <= cat.maxAdults && children <= cat.maxChildren && totalGuests <= cat.maxGuests;

    // Physical rooms mapped to this category
    const physicalRooms = cat.rooms;
    const bookedForCat = conflictingBookings.filter(b => b.categoryId === cat.id);
    const availableRoomsCount = Math.max(0, physicalRooms.length - bookedForCat.length);

    let amenities: string[] = [];
    try { amenities = JSON.parse(cat.amenities); } catch { amenities = []; }

    let images: string[] = [];
    try { images = JSON.parse(cat.images); } catch { images = []; }

    return {
      category: {
        id: cat.id,
        code: cat.code,
        slug: cat.slug,
        name: cat.name,
        rateUSD: cat.rateUSD,
        maxAdults: cat.maxAdults,
        maxChildren: cat.maxChildren,
        maxGuests: cat.maxGuests,
        description: cat.description,
        amenities,
        images,
      },
      availableRoomsCount,
      totalAssignedRooms: physicalRooms.length,
      isAvailable: satisfiesGuests && availableRoomsCount > 0,
      totalPriceUSD: cat.rateUSD * nights,
      totalNights: nights,
    };
  });

  return {
    checkIn: checkInDateStr,
    checkOut: checkOutDateStr,
    nights,
    adults,
    children,
    categories: results,
  };
}

export function generateBookingNumber(): string {
  const yr = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `HSS-${yr}-${rand}`;
}

export function buildWhatsAppBookingUrl(booking: {
  bookingNumber: string;
  categoryName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestName: string;
  totalUSD: number;
}): string {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '9779851068219';
  const text = `Hello Hotel Sherpa Soul! I have made a direct reservation:
` +
    `*Booking Ref:* ${booking.bookingNumber}
` +
    `*Guest:* ${booking.guestName}
` +
    `*Room:* ${booking.categoryName}
` +
    `*Dates:* ${booking.checkIn} to ${booking.checkOut} (${booking.nights} nights)
` +
    `*Total:* USD $${booking.totalUSD}
` +
    `Please confirm my booking. Thank you!`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
