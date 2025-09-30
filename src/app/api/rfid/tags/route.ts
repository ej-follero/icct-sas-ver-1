import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all RFID tags
export async function GET() {
  try {
    console.log('Fetching RFID tags...');
    
    const rfidTags = await prisma.rFIDTags.findMany({
      where: {
        status: 'ACTIVE',
        studentId: null,
        instructorId: null,
      },
      select: {
        tagId: true,
        tagNumber: true,
        tagType: true,
        status: true,
        notes: true,
      },
      orderBy: {
        tagNumber: 'asc',
      },
    });

    console.log(`Found ${rfidTags.length} available RFID tags`);

    return NextResponse.json({ 
      data: rfidTags,
      message: 'RFID tags fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching RFID tags:', error);
    return NextResponse.json(
      { error: `Failed to fetch RFID tags: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}