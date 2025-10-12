const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  try {
    // Get one student with linked user
    const student = await prisma.student.findFirst({ include: { User: true } });
    // Get one instructor and its corresponding user via instructorId
    const instructor = await prisma.instructor.findFirst();

    const studentPass = 'Student123!';
    const instructorPass = 'Instructor123!';

    if (student?.User?.email) {
      const sHash = await bcrypt.hash(studentPass, 12);
      await prisma.user.update({
        where: { userId: student.User.userId },
        data: { passwordHash: sHash, failedLoginAttempts: 0 },
      });
      console.log(JSON.stringify({
        type: 'student',
        email: student.User.email,
        studentId: student.studentIdNum,
        password: studentPass,
      }));
    } else {
      console.log(JSON.stringify({ type: 'student', error: 'No student found' }));
    }

    if (instructor?.instructorId) {
      const iHash = await bcrypt.hash(instructorPass, 12);
      const instructorUser = await prisma.user.update({
        where: { userId: instructor.instructorId },
        data: { passwordHash: iHash, failedLoginAttempts: 0 },
      });
      console.log(JSON.stringify({
        type: 'instructor',
        email: instructorUser.email,
        employeeId: String(instructor.instructorId),
        password: instructorPass,
      }));
    } else {
      console.log(JSON.stringify({ type: 'instructor', error: 'No instructor found' }));
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


