// Initialize CURRENT active semester and ensure a live schedule for a section and student
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['warn', 'error'] });

function getTodayMeta() {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return { now, day, time: `${hh}:${mm}` };
}

async function ensureActiveSemester() {
  const year = new Date().getFullYear();
  // Try find an existing CURRENT active semester
  let semester = await prisma.semester.findFirst({ where: { status: 'CURRENT', isActive: true } });
  if (semester) return semester;

  // Otherwise create one spanning ~4 months from today
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 4);
  semester = await prisma.semester.create({
    data: {
      startDate,
      endDate,
      year,
      semesterType: 'FIRST_SEMESTER',
      status: 'CURRENT',
      isActive: true,
    },
  });
  return semester;
}

async function main() {
  const studentIdNum = process.argv[2] || '051421';
  const sectionName = process.argv[3] || 'CS-3A';
  const { day, time } = getTodayMeta();

  const semester = await ensureActiveSemester();
  console.log('Active semester:', semester.semesterId);

  const student = await prisma.student.findUnique({
    where: { studentIdNum: String(studentIdNum) },
    select: { studentId: true, firstName: true, lastName: true, status: true }
  });
  if (!student) throw new Error(`Student ${studentIdNum} not found`);

  let section = await prisma.section.findFirst({
    where: { sectionName: String(sectionName) },
    select: { sectionId: true, semesterId: true }
  });
  if (!section) throw new Error(`Section ${sectionName} not found`);

  if (section.semesterId !== semester.semesterId) {
    section = await prisma.section.update({
      where: { sectionId: section.sectionId },
      data: { semesterId: semester.semesterId, sectionStatus: 'ACTIVE' },
      select: { sectionId: true, semesterId: true }
    });
    console.log('Updated section semesterId to CURRENT');
  }

  // Ensure an ACTIVE schedule for right now for this section
  let sched = await prisma.subjectSchedule.findFirst({
    where: {
      sectionId: section.sectionId,
      day,
      startTime: { lte: time },
      endTime: { gte: time },
      status: 'ACTIVE',
      semesterId: semester.semesterId,
    },
    select: { subjectSchedId: true }
  });

  if (!sched) {
    // Create a placeholder subject if needed for THIS section's course
    const sec = await prisma.section.findUnique({ where: { sectionId: section.sectionId }, select: { courseId: true } });
    let subject = await prisma.subjects.findFirst({ where: { courseId: sec.courseId }, select: { subjectId: true } });
    if (!subject) {
      subject = await prisma.subjects.create({
        data: {
          subjectName: 'Temp Subject',
          subjectCode: `TMP-${Date.now()}`,
          totalHours: 1,
          courseId: sec.courseId,
          departmentId: 1,
          academicYear: String(semester.year),
          semester: semester.semesterType,
        },
        select: { subjectId: true }
      });
    }

    // Find any room and semesterId
    const room = await prisma.room.findFirst({ select: { roomId: true } });
    const startTime = time; // now
    // end time +60 minutes
    const [hh, mm] = time.split(':').map(Number);
    const endH = String((hh + 1) % 24).padStart(2, '0');
    const endTime = `${endH}:${String(mm).padStart(2, '0')}`;

    sched = await prisma.subjectSchedule.create({
      data: {
        subjectId: subject.subjectId,
        sectionId: section.sectionId,
        roomId: room ? room.roomId : 1,
        day,
        startTime,
        endTime,
        status: 'ACTIVE',
        semesterId: semester.semesterId,
        academicYear: String(semester.year),
      },
      select: { subjectSchedId: true }
    });
    console.log('Created active schedule for now:', sched.subjectSchedId);
  }

  // Ensure StudentSchedule link ACTIVE
  await prisma.studentSchedule.upsert({
    where: { studentId_scheduleId: { studentId: student.studentId, scheduleId: sched.subjectSchedId } },
    update: { status: 'ACTIVE' },
    create: { studentId: student.studentId, scheduleId: sched.subjectSchedId, status: 'ACTIVE' },
  });
  console.log('Ensured StudentSchedule ACTIVE');

  // Ensure StudentSection ACTIVE
  await prisma.studentSection.upsert({
    where: { studentId_sectionId: { studentId: student.studentId, sectionId: section.sectionId } },
    update: { enrollmentStatus: 'ACTIVE' },
    create: { studentId: student.studentId, sectionId: section.sectionId, enrollmentStatus: 'ACTIVE' },
  });
  console.log('Ensured StudentSection ACTIVE');
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });


