import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('RFID Dashboard test endpoint called');
    
    return NextResponse.json({
      success: true,
      message: 'RFID Dashboard API is accessible',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { error: 'Test endpoint failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
