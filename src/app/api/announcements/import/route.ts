import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status, Priority, Role } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // Authorization: allow ADMIN and INSTRUCTOR
    const role = request.headers.get('x-user-role');
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      if (!role || (role !== 'ADMIN' && role !== 'INSTRUCTOR')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const optionsStr = formData.get('options') as string;
    const options = optionsStr ? JSON.parse(optionsStr) : {};

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read the file content
    const fileContent = await file.text();
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'File must contain at least a header and one data row' }, { status: 400 });
    }

    // Parse CSV header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const dataRows = lines.slice(1);

    // Expected columns mapping
    const columnMapping: Record<string, string> = {
      'title': 'title',
      'description': 'content',
      'content': 'content',
      'class': 'class',
      'section': 'class',
      'status': 'status',
      'priority': 'priority',
      'date': 'date',
      'created_at': 'date',
    };

    let importedCount = 0;
    const errors: string[] = [];

    // For now, we'll use a default admin user ID (you might want to get this from the session)
    // Get user ID from middleware headers
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as Role;
    
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    for (let i = 0; i < dataRows.length; i++) {
      try {
        const values = dataRows[i].split(',').map(v => v.trim());
        const rowData: Record<string, string> = {};

        // Map CSV columns to our data structure
        headers.forEach((header, index) => {
          const mappedKey = columnMapping[header] || header;
          rowData[mappedKey] = values[index] || '';
        });

        // Validate required fields
        if (!rowData.title || !rowData.content) {
          errors.push(`Row ${i + 2}: Missing required fields (title, content)`);
          continue;
        }

        // Create announcement
        await prisma.announcement.create({
          data: {
            title: rowData.title,
            content: rowData.content,
            isGeneral: !rowData.class || rowData.class.toLowerCase() === 'general',
            status: (rowData.status || 'normal').toUpperCase() as Status,
            priority: (rowData.priority || 'normal').toUpperCase() as Priority,
            createdby: parseInt(userId),
            userType: userRole,
          },
        });

        importedCount++;
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      count: importedCount,
      errors: errors.slice(0, 10), // Limit errors to first 10
      totalErrors: errors.length,
    });
  } catch (error) {
    console.error('POST /api/announcements/import error', error);
    return NextResponse.json({ error: 'Failed to import announcements' }, { status: 500 });
  }
}
