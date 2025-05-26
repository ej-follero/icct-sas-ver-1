import { NextResponse } from "next/server";

// GET /api/sections/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // TODO: Replace with actual database query
    const section = {
      sectionId: id,
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
    };

    return NextResponse.json(section);
  } catch (error) {
    console.error("Error fetching section:", error);
    return NextResponse.json(
      { error: "Failed to fetch section" },
      { status: 500 }
    );
  }
}

// PUT /api/sections/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    
    // TODO: Replace with actual database update
    const updatedSection = {
      sectionId: id,
      ...data,
    };

    return NextResponse.json(updatedSection);
  } catch (error) {
    console.error("Error updating section:", error);
    return NextResponse.json(
      { error: "Failed to update section" },
      { status: 500 }
    );
  }
}

// DELETE /api/sections/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // TODO: Replace with actual database delete
    return NextResponse.json({ message: "Section deleted successfully" });
  } catch (error) {
    console.error("Error deleting section:", error);
    return NextResponse.json(
      { error: "Failed to delete section" },
      { status: 500 }
    );
  }
} 