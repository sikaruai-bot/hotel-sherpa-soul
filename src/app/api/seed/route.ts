import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seedDatabase';

export async function POST() {
  try {
    const result = await seedDatabase();
    return NextResponse.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await seedDatabase();
    return NextResponse.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
