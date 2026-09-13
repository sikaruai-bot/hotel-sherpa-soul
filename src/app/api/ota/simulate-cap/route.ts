import { NextResponse } from 'next/server';
import { 
  checkCategoryCapacity, 
  getAvailableAlternatives, 
  dispatchRoomFullAlert,
  ROOM_CATEGORIES 
} from '@/lib/roomCategoryShield';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      category = 'Deluxe Room',
      guestName = 'Ram Bahadur Shrestha',
      phone = '+977 9841234567',
      checkInDate = '2026-09-15',
      checkOutDate = '2026-09-17',
    } = body;

    // 1. Check capacity for the requested category
    const categoryCheck = await checkCategoryCapacity({
      categoryOrRoom: category,
      checkInDate,
      checkOutDate,
    });

    // 2. Query available alternative room categories
    const alternatives = await getAvailableAlternatives({
      checkInDate,
      checkOutDate,
      excludeCategoryId: categoryCheck.category.id,
    });

    // 3. Dispatch alert (sends WhatsApp/SMS, records in-app PMS notification & logs)
    const alertResult = await dispatchRoomFullAlert({
      guestName,
      phone,
      requestedCategory: categoryCheck.category.name,
      checkInDate,
      checkOutDate,
      alternatives,
      source: 'TEST_SIMULATOR',
    });

    return NextResponse.json({
      success: true,
      simulated: true,
      category: categoryCheck.category.name,
      categoryNepali: categoryCheck.category.nameNepali,
      roomsInCategory: categoryCheck.category.rooms,
      maxCapacityPerDay: categoryCheck.totalCapacity,
      currentlyBooked: categoryCheck.bookedCount,
      isCapExceeded: categoryCheck.bookedCount >= categoryCheck.totalCapacity,
      messageNepali: alertResult.messageNepali,
      fullMessageBilingual: alertResult.fullMessage,
      alternativesAvailable: alternatives,
      dispatchStatus: alertResult.dispatchStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Simulate cap error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
