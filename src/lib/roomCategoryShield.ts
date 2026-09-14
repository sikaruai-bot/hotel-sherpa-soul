import { prisma } from './prisma';
import { ReservationStatus } from '@prisma/client';

export const USD_TO_NPR_RATE = 135;

export interface RoomCategoryConfig {
  id: 'DELUXE' | 'FAMILY' | 'BUDGET_FAMILY';
  name: string;
  nameNepali: string;
  rooms: string[];
  capacity: number; // Exactly 2 rooms per category
  dailyRateUsd: number; // in USD ($)
  dailyRate: number; // in NPR (रू.)
}

export const ROOM_CATEGORIES: Record<string, RoomCategoryConfig> = {
  DELUXE: {
    id: 'DELUXE',
    name: 'Deluxe Room',
    nameNepali: 'डिलक्स रुम (Deluxe Room)',
    rooms: ['201', '301'],
    capacity: 2,
    dailyRateUsd: 20,
    dailyRate: 2700, // $20 USD * 135
  },
  FAMILY: {
    id: 'FAMILY',
    name: 'Family Room',
    nameNepali: 'फैमिली रुम (Family Room)',
    rooms: ['202', '302'],
    capacity: 2,
    dailyRateUsd: 30,
    dailyRate: 4050, // $30 USD * 135
  },
  BUDGET_FAMILY: {
    id: 'BUDGET_FAMILY',
    name: 'Budget Family Room',
    nameNepali: 'बजेट फैमिली रुम (Budget Family Room)',
    rooms: ['203', '303'],
    capacity: 2,
    dailyRateUsd: 20,
    dailyRate: 2700, // $20 USD * 135
  },
};

/**
 * Identify the category from a room number (e.g. '201') or type string ('Deluxe Room')
 */
export function getCategoryForRoomOrType(input: string): RoomCategoryConfig | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();

  // Match by room number
  if (clean === '201' || clean === '301') return ROOM_CATEGORIES.DELUXE;
  if (clean === '202' || clean === '302') return ROOM_CATEGORIES.FAMILY;
  if (clean === '203' || clean === '303') return ROOM_CATEGORIES.BUDGET_FAMILY;

  // Match by category name
  if (clean.includes('budget')) return ROOM_CATEGORIES.BUDGET_FAMILY;
  if (clean.includes('family')) return ROOM_CATEGORIES.FAMILY;
  if (clean.includes('deluxe')) return ROOM_CATEGORIES.DELUXE;

  return null;
}

export interface CategoryAvailabilityResult {
  isAvailable: boolean;
  category: RoomCategoryConfig;
  totalCapacity: number;
  bookedCount: number;
  availableRooms: string[];
  bookedRooms: string[];
  recommendedRoom?: string;
  conflictReason?: string;
}

/**
 * Validates category-level capacity (Max 2 rooms per category per day).
 * If 2 rooms in that category are already booked for the requested dates, it blocks the booking!
 */
export async function checkCategoryCapacity(options: {
  categoryOrRoom: string;
  checkInDate: Date | string;
  checkOutDate: Date | string;
  excludeReservationId?: string;
}): Promise<CategoryAvailabilityResult> {
  const { categoryOrRoom, checkInDate, checkOutDate, excludeReservationId } = options;

  const category = getCategoryForRoomOrType(categoryOrRoom) || ROOM_CATEGORIES.DELUXE;
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);

  // 1. Find all active reservations in this category's rooms that overlap the dates
  const overlappingReservations = await prisma.reservation.findMany({
    where: {
      room: {
        roomNumber: { in: category.rooms },
      },
      status: {
        in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN, ReservationStatus.PENDING],
      },
      ...(excludeReservationId && {
        id: { not: excludeReservationId },
      }),
      AND: [
        { checkInDate: { lt: end } },
        { checkOutDate: { gt: start } },
      ],
    },
    include: {
      room: true,
      guest: true,
    },
  });

  // 2. Find active Long Stay contracts in this category's rooms
  const overlappingContracts = await prisma.longStayContract.findMany({
    where: {
      room: {
        roomNumber: { in: category.rooms },
      },
      status: 'ACTIVE',
      AND: [
        { startDate: { lt: end } },
        { endDate: { gt: start } },
      ],
    },
    include: {
      room: true,
      guest: true,
    },
  });

  // Collect which room numbers are booked
  const bookedRoomSet = new Set<string>();
  const conflictDetails: string[] = [];

  for (const r of overlappingReservations) {
    bookedRoomSet.add(r.room.roomNumber);
    conflictDetails.push(
      `Room ${r.room.roomNumber} (${r.guest.name}, ${r.checkInDate.toISOString().split('T')[0]} to ${r.checkOutDate.toISOString().split('T')[0]})`
    );
  }

  for (const c of overlappingContracts) {
    bookedRoomSet.add(c.room.roomNumber);
    conflictDetails.push(
      `Room ${c.room.roomNumber} under Long Stay by ${c.guest.name}`
    );
  }

  const bookedRooms = Array.from(bookedRoomSet);
  const availableRooms = category.rooms.filter((rm) => !bookedRoomSet.has(rm));
  const bookedCount = bookedRooms.length;

  // RULE: Exactly 2 rooms per category. If bookedCount >= 2, BLOCK!
  if (bookedCount >= category.capacity) {
    const conflictReason = `CATEGORY_CAP_EXCEEDED: ${category.nameNepali} को लागि अधिकतम २ वटा कोठाहरू (${category.rooms.join(' र ')}) उपलब्ध छन्। यो मितिमा २ वटै कोठाहरू पहिल्यै बुक भइसकेका छन् (${conflictDetails.join(', ')}). नयाँ बुकिङ स्वतः BLOCKED भयो।`;

    return {
      isAvailable: false,
      category,
      totalCapacity: category.capacity,
      bookedCount,
      availableRooms: [],
      bookedRooms,
      conflictReason,
    };
  }

  // Choose recommended room
  let recommendedRoom = availableRooms[0];
  // If user requested a specific room and it's available, prioritize it
  if (availableRooms.includes(categoryOrRoom)) {
    recommendedRoom = categoryOrRoom;
  }

  return {
    isAvailable: true,
    category,
    totalCapacity: category.capacity,
    bookedCount,
    availableRooms,
    bookedRooms,
    recommendedRoom,
  };
}

export interface AlternativeCategoryOption {
  id: string;
  name: string;
  nameNepali: string;
  availableRooms: string[];
  availableCount: number;
  dailyRateUsd: number;
  dailyRate: number;
}

/**
 * Finds which other categories have available rooms for the requested date range
 */
export async function getAvailableAlternatives(options: {
  checkInDate: Date | string;
  checkOutDate: Date | string;
  excludeCategoryId?: string;
}): Promise<AlternativeCategoryOption[]> {
  const { checkInDate, checkOutDate, excludeCategoryId } = options;
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);

  const alternatives: AlternativeCategoryOption[] = [];

  for (const catKey of Object.keys(ROOM_CATEGORIES)) {
    const cat = ROOM_CATEGORIES[catKey];
    if (excludeCategoryId && cat.id === excludeCategoryId) continue;

    // Check reservations for this category
    const overlapReservations = await prisma.reservation.findMany({
      where: {
        room: { roomNumber: { in: cat.rooms } },
        status: { in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN, ReservationStatus.PENDING] },
        AND: [
          { checkInDate: { lt: end } },
          { checkOutDate: { gt: start } },
        ],
      },
      select: { room: { select: { roomNumber: true } } },
    });

    const overlapContracts = await prisma.longStayContract.findMany({
      where: {
        room: { roomNumber: { in: cat.rooms } },
        status: 'ACTIVE',
        AND: [
          { startDate: { lt: end } },
          { endDate: { gt: start } },
        ],
      },
      select: { room: { select: { roomNumber: true } } },
    });

    const booked = new Set<string>();
    overlapReservations.forEach((r) => booked.add(r.room.roomNumber));
    overlapContracts.forEach((c) => booked.add(c.room.roomNumber));

    const freeRooms = cat.rooms.filter((rm) => !booked.has(rm));

    if (freeRooms.length > 0) {
      alternatives.push({
        id: cat.id,
        name: cat.name,
        nameNepali: cat.nameNepali,
        availableRooms: freeRooms,
        availableCount: freeRooms.length,
        dailyRateUsd: cat.dailyRateUsd,
        dailyRate: cat.dailyRate,
      });
    }
  }

  return alternatives;
}

/**
 * Generates automated Room Full message with alternative room recommendations
 */
export function generateRoomFullMessage(options: {
  guestName?: string;
  requestedCategory: string;
  checkInDate: string;
  checkOutDate: string;
  alternatives: AlternativeCategoryOption[];
  hotelContact?: string;
}): { messageNepali: string; messageEnglish: string; fullMessage: string } {
  const {
    guestName = 'Guest',
    requestedCategory,
    checkInDate,
    checkOutDate,
    alternatives,
    hotelContact = '+977-1-4530311 / 9851068219',
  } = options;

  let altListNepali = '';
  let altListEnglish = '';

  if (alternatives.length > 0) {
    altListNepali = alternatives
      .map(
        (a) =>
          `• ${a.nameNepali} (Rooms ${a.availableRooms.join(', ')}) — $${a.dailyRateUsd} USD (रु. ${a.dailyRate.toLocaleString()} NPR) [${a.availableCount} कोठा उपलब्ध]`
      )
      .join('\n');

    altListEnglish = alternatives
      .map(
        (a) =>
          `• ${a.name} (Rooms ${a.availableRooms.join(', ')}) — $${a.dailyRateUsd} USD / NPR ${a.dailyRate.toLocaleString()} [${a.availableCount} room(s) available]`
      )
      .join('\n');
  } else {
    altListNepali = 'हाल उक्त मितिमा अन्य क्याटागोरीका कोठाहरू पनि व्यस्त छन्।';
    altListEnglish = 'Currently, all other categories are also fully booked for these dates.';
  }

  const messageNepali = `[होटल शेर्पा सोल - रूम फुल सूचना]\nनमस्ते ${guestName}!\nतपाईंले मिति ${checkInDate} देखि ${checkOutDate} सम्मका लागि रोज्नुभएको '${requestedCategory}' (२ वटै कोठा) भरिइसकेको छ (Sold Out)।\n\nतर खुसीको खबर! तपाईंका लागि निम्न विकल्पहरू उपलब्ध छन्:\n${altListNepali}\n\nकृपया अर्को कोठा सुरक्षित गर्न हामीलाई तुरुन्तै WhatsApp वा फोनमा सम्पर्क गर्नुहोस्: ${hotelContact}`;

  const messageEnglish = `[Hotel Sherpa Soul - Room Full Notification]\nDear ${guestName},\nWe regret that '${requestedCategory}' is fully booked (2/2 rooms occupied) for ${checkInDate} to ${checkOutDate}.\n\nGood news! The following alternative room categories are currently available:\n${altListEnglish}\n\nTo reserve an alternative room, please contact us via WhatsApp/Phone: ${hotelContact}`;

  return {
    messageNepali,
    messageEnglish,
    fullMessage: `${messageNepali}\n\n---\n${messageEnglish}`,
  };
}

/**
 * Dispatches the Room Full notification to the guest and logs it in the PMS
 */
export async function dispatchRoomFullAlert(options: {
  guestName?: string;
  phone?: string | null;
  email?: string | null;
  requestedCategory: string;
  checkInDate: string;
  checkOutDate: string;
  alternatives: AlternativeCategoryOption[];
  source?: string;
}) {
  const { guestName, phone, requestedCategory, checkInDate, checkOutDate, alternatives, source } = options;

  const { messageNepali, fullMessage } = generateRoomFullMessage({
    guestName,
    requestedCategory,
    checkInDate,
    checkOutDate,
    alternatives,
  });

  // 1. Send WhatsApp / SMS if phone is provided
  let dispatchStatus = 'Logged In-App';
  if (phone && phone.trim()) {
    try {
      const { sendWhatsAppMessage, sendSparrowSms } = await import('./smsWhatsappAdapter');
      await sendWhatsAppMessage(phone, messageNepali);
      await sendSparrowSms(phone, messageNepali.slice(0, 160));
      dispatchStatus = 'Sent via WhatsApp / SMS';
    } catch (e: any) {
      console.warn('Error sending external message:', e);
      dispatchStatus = 'SMS/WhatsApp Dispatch Failed';
    }
  }

  // 2. Create in-app notification in PMS database for staff
  const altText = alternatives.length > 0 
    ? `विकल्प उपलब्ध: ${alternatives.map((a) => a.name).join(', ')}` 
    : 'सबै कोठा भरिएको';

  await prisma.notification.create({
    data: {
      title: `⚠️ Room Full Alert: ${requestedCategory} (2/2 Booked)`,
      detail: `${guestName || 'Guest'} (${phone || 'OTA Channel'}) को बुकिङ ब्लक भयो। ${altText}। पाहुनालाई जानकारी पठाइयो (${dispatchStatus})।`,
      type: 'Channel',
      channel: phone ? 'WhatsApp' : 'In-App',
      status: 'Action Required',
    },
  }).catch((err) => console.warn('Notification create error:', err));

  // 3. Log in OTA Sync Log
  await prisma.otaSyncLog.create({
    data: {
      channel: source || 'DIRECT',
      roomNumber: requestedCategory,
      action: 'ROOM_FULL_ALERT',
      status: 'CONFLICT_PREVENTED',
      message: `Room Full Message Dispatched to ${guestName || 'Guest'}. Alternatives: ${alternatives.map((a) => a.name).join(', ') || 'None'}`,
      details: JSON.stringify({ guestName, phone, requestedCategory, alternatives }),
    },
  }).catch((err) => console.warn('OtaSyncLog create error:', err));

  return {
    dispatchStatus,
    fullMessage,
    messageNepali,
    alternatives,
  };
}

