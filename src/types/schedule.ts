export interface Schedule {
  subjectSchedId: number;
  subject: { subjectName: string; subjectCode: string; subjectId: number };
  section: { sectionName: string; sectionId: number };
  instructor: { firstName: string; lastName: string; instructorId: number } | null;
  room: { roomNo: string; roomId: number; roomCapacity: number };
  day: string;
  startTime: string;
  endTime: string;
  slots: number;
  scheduleType: string;
  status: string;
  semester: { semesterName: string; semesterId: number };
  academicYear: string;
  maxStudents: number;
  currentEnrollment: number;
  notes?: string;
  conflicts?: string[];
}
