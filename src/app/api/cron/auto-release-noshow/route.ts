import { NextResponse } from 'next/server';
import { autoReleaseExpiredNoShows } from '@/lib/autoReleaseNoShows';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleAutoRelease(request);
}

export async function POST(request: Request) {
  return handleAutoRelease(request);
}

async function handleAutoRelease(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cutOffParam = searchParams.get('cutOffHour');
    const cutOffHour = cutOffParam ? parseInt(cutOffParam, 10) : 18; // Default 6:00 PM

    const result = await autoReleaseExpiredNoShows(cutOffHour);

    return NextResponse.json({
      success: true,
      message: result.releasedCount > 0 
        ? `Successfully auto-released ${result.releasedCount} expired no-show room(s). Rooms are now available.` 
        : 'No expired un-checked-in reservations found. All rooms are up to date.',
      data: result,
    });
  } catch (error: any) {
    console.error('Auto-release no-show error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
