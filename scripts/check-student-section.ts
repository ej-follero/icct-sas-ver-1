import { prisma } from '../src/lib/prisma';

function getTodayMeta() {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(); // MONDAY..SUNDAY
  const time = now.toTimeString().slice(0, 5); // HH:MM
  return { day, time };
}

async function main() {
  const studentIdNum = process.argv[2] || '051421';
  const sectionName = process.argv[3] || 'CS-3A';

  console.log(`Checking student ${studentIdNum} in section ${sectionName} ...`);

  // 1) Resolve student
  const student = await prisma.student.findUnique({
    where: { studentIdNum },
    select: { studentId: true, firstName: true, lastName: true, status: true, yearLevel: true }
  });
  if (!student) {
    console.log(`Student ${studentIdNum} not found`);
    return;
  }

  // 2) Resolve section
  const section = await prisma.section.findFirst({
    where: { sectionName },
    select: { sectionId: true, sectionName: true, yearLevel: true, semesterId: true, sectionStatus: true, courseId: true }
  });
  if (!section) {
    console.log(`Section ${sectionName} not found`);
    return;
  }

  // 3) Check active semester (required by attendance API)
  const semester = await prisma.semester.findFirst({
    where: { semesterId: section.semesterId, status: 'CURRENT', isActive: true },
    select: { semesterId: true, status: true, isActive: true }
  });

  // 4) Check enrollment (ACTIVE)
  const enrollment = await prisma.studentSection.findUnique({
    where: { studentId_sectionId: { studentId: student.studentId, sectionId: section.sectionId } },
    select: { enrollmentStatus: true, createdAt: true, updatedAt: true }
  });

  // 5) Check if there is an active schedule RIGHT NOW for the section (and student also linked)
  const { day, time } = getTodayMeta();
  const currentSched = await prisma.subjectSchedule.findFirst({
    where: {
      sectionId: section.sectionId,
      day: day as any,
      startTime: { lte: time },
      endTime: { gte: time },
      status: 'ACTIVE',
      semesterId: section.semesterId,
      StudentSchedule: {
        some: {
          studentId: student.studentId,
          status: 'ACTIVE'
        }
      }
    },
    select: {
      subjectSchedId: true,
      subject: { select: { subjectCode: true, subjectName: true } },
      room: { select: { roomNo: true } },
      startTime: true,
      endTime: true,
      day: true
    }
  });

  console.log({ student, section, enrollment, semester, currentSched });

  const enrolledActive = enrollment?.enrollmentStatus === 'ACTIVE';
  const scheduleNow = !!currentSched;
  console.log('\nSummary:');
  console.log(`- Enrolled in ${sectionName}: ${enrolledActive ? 'YES' : 'NO'}`);
  console.log(`- Has active schedule right now: ${scheduleNow ? 'YES' : 'NO'}`);
  if (!semester) console.log('- Warning: No CURRENT active semester; attendance API will fail.');
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });


