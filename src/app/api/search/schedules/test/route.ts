import { NextResponse } from 'next/server';

// Simple test endpoint to verify the schedules API is working
export async function GET() {
  try {
    // Test data for development
    const testSchedules = [
      {
        value: "1",
        label: "CS101 • Section A • Monday 09:00-10:30 • John Doe"
      },
      {
        value: "2", 
        label: "CS102 • Section B • Tuesday 10:00-11:30 • Jane Smith"
      },
      {
        value: "3",
        label: "MATH101 • Section C • Wednesday 08:00-09:30 • Bob Johnson"
      }
    ];

    return NextResponse.json({ 
      items: testSchedules,
      message: "Test schedules endpoint working"
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Test endpoint failed",
      items: []
    }, { status: 500 });
  }
}
