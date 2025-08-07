import { NextResponse } from "next/server";

// GET /api/sections/[id]/subjects
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sectionId = parseInt(params.id);
    // TODO: Replace with actual DB query
    const subjects = [
      {
        code: "ABA-SUBJ1",
        name: "Associate in Business Administration Subject 1",
        units: 3,
        type: "Laboratory",
        status: "Active",
      },
      {
        code: "ABA-SUBJ2",
        name: "Associate in Business Administration Subject 2",
        units: 3,
        type: "Laboratory",
        status: "Active",
      },
      {
        code: "ABA-SUBJ3",
        name: "Associate in Business Administration Subject 3",
        units: 3,
        type: "Lecture",
        status: "Active",
      },
      {
        code: "ABA-SUBJ4",
        name: "Associate in Business Administration Subject 4",
        units: 3,
        type: "Laboratory",
        status: "Active",
      },
      {
        code: "ABA-SUBJ5",
        name: "Associate in Business Administration Subject 5",
        units: 3,
        type: "Laboratory",
        status: "Active",
      },
    ];
    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects for section:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects for section" },
      { status: 500 }
    );
  }
} 