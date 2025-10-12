const { PrismaClient } = require('@prisma/client');

async function checkSemesters() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking semesters in database...');
    
    // Check if any semesters exist
    const semesterCount = await prisma.semester.count();
    console.log(`Found ${semesterCount} semesters in database`);
    
    if (semesterCount === 0) {
      console.log('No semesters found. Creating a default semester...');
      
      const defaultSemester = await prisma.semester.create({
        data: {
          startDate: new Date('2024-08-01'),
          endDate: new Date('2024-12-31'),
          year: 2024,
          semesterType: 'FIRST_SEMESTER',
          status: 'CURRENT',
          isActive: true,
          notes: 'Default semester for testing'
        }
      });
      
      console.log('Created default semester:', defaultSemester);
    } else {
      // List existing semesters
      const semesters = await prisma.semester.findMany({
        select: {
          semesterId: true,
          year: true,
          semesterType: true,
          status: true,
          isActive: true
        }
      });
      
      console.log('Existing semesters:');
      semesters.forEach(sem => {
        console.log(`- ID: ${sem.semesterId}, Year: ${sem.year}, Type: ${sem.semesterType}, Status: ${sem.status}, Active: ${sem.isActive}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking semesters:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSemesters();
