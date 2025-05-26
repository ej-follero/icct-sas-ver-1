import { NextResponse } from "next/server";

// GET /api/sections
export async function GET() {
  try {
    // TODO: Replace with actual database query
    const sections = [
      {
        sectionId: 1,
        sectionName: "BSIT 1-A",
        sectionType: "REGULAR",
        sectionCapacity: 40,
        sectionStatus: "ACTIVE",
        yearLevel: 1,
        courseId: 1,
        Course: {
          courseName: "Bachelor of Science in Information Technology"
        },
        totalStudents: 35,
        totalSubjects: 8,
      },
      {
        sectionId: 2,
        sectionName: "BSIT 1-B",
        sectionType: "REGULAR",
        sectionCapacity: 40,
        sectionStatus: "ACTIVE",
        yearLevel: 1,
        courseId: 1,
        Course: {
          courseName: "Bachelor of Science in Information Technology"
        },
        totalStudents: 38,
        totalSubjects: 8,
      },
    ];

    return NextResponse.json(sections);
  } catch (error) {
    console.error("Error fetching sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch sections" },
      { status: 500 }
    );
  }
}

// POST /api/sections
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // TODO: Replace with actual database insert
    const newSection = {
      sectionId: Math.floor(Math.random() * 1000), // Temporary ID generation
      ...data,
    };

    return NextResponse.json(newSection, { status: 201 });
  } catch (error) {
    console.error("Error creating section:", error);
    return NextResponse.json(
      { error: "Failed to create section" },
      { status: 500 }
    );
  }
} 