import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    console.log('Template API: Generating departments template');
    
    // Sample data for the template - matches exact Prisma schema
    const templateData = [
      {
        departmentName: "Computer Science",
        departmentCode: "CS",
        departmentDescription: "Department of Computer Science and Informatics",
        departmentStatus: "ACTIVE"
      },
      {
        departmentName: "Business Administration",
        departmentCode: "BA",
        departmentDescription: "Department of Business Administration and Management",
        departmentStatus: "ACTIVE"
      },
      {
        departmentName: "Engineering",
        departmentCode: "ENG",
        departmentDescription: "Department of Engineering and Technology",
        departmentStatus: "ACTIVE"
      },
      {
        departmentName: "Arts and Sciences",
        departmentCode: "AS",
        departmentDescription: "Department of Arts and Sciences",
        departmentStatus: "INACTIVE"
      }
    ];

    // Create worksheet with explicit headers (lowercase for better compatibility)
    const ws = XLSX.utils.json_to_sheet(templateData, {
      header: ['departmentName', 'departmentCode', 'departmentDescription', 'departmentStatus']
    });

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // departmentName
      { wch: 10 }, // departmentCode
      { wch: 40 }, // departmentDescription
      { wch: 10 }, // departmentStatus
    ];

    // Style the header row
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellRef]) continue;
      
      // Style headers (keep original case, just make bold)
      ws[cellRef].s = {
        font: { bold: true },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: "CCCCCC" } }
      };
    }

    // Style data rows
    for (let R = 1; R <= headerRange.e.r; ++R) {
      for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellRef]) continue;
        
        ws[cellRef].s = {
          alignment: { horizontal: 'left', vertical: 'center' }
        };
      }
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Departments Template");

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    console.log('Template API: Template generated successfully with data:', templateData);

    // Return the file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="departments-import-template.xlsx"',
      },
    });

  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json({
      success: false,
      error: "Failed to generate template",
      message: error instanceof Error ? error.message : "An unexpected error occurred"
    }, { status: 500 });
  }
} 