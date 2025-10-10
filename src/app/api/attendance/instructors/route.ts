import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json(
      { 
      success: false,
      error: 'Instructor attendance API has been removed',
      code: 'GONE',
    },
    { status: 410 }
  );
} 