import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Helper function to generate realistic college data
function generateRealisticCollegeData() {
  // Philippine addresses in Cainta, Rizal and nearby Metro Manila areas
  const philippineAddresses = [
    // Cainta, Rizal addresses
    'Blk 1, Lot 15, Phase 1, Valley Golf Subdivision, Cainta, Rizal',
    '123 Rizal Avenue, Barangay San Juan, Cainta, Rizal',
    '45 Ortigas Avenue Extension, Barangay Sto. Domingo, Cainta, Rizal',
    '78 A. Bonifacio Avenue, Barangay San Andres, Cainta, Rizal',
    'Unit 15B, Green Valley Condominium, Ortigas Avenue, Cainta, Rizal',
    'Blk 3, Lot 8, Green Meadows Subdivision, Cainta, Rizal',
    '156 Sumulong Highway, Barangay San Roque, Cainta, Rizal',
    '89 Felix Avenue, Barangay San Isidro, Cainta, Rizal',
    'Unit 7C, Eastwood Residences, Ortigas Avenue, Cainta, Rizal',
    'Blk 5, Lot 12, Valley View Subdivision, Cainta, Rizal',
    
    // Pasig City addresses
    '234 Meralco Avenue, Ortigas Center, Pasig City',
    '67 Shaw Boulevard, Barangay Kapitolyo, Pasig City',
    'Unit 12A, The Residences at Greenbelt, Ortigas Avenue, Pasig City',
    'Blk 2, Lot 10, Valle Verde 1, Pasig City',
    '456 C. Raymundo Avenue, Barangay San Miguel, Pasig City',
    
    // Marikina City addresses
    '789 Marikina-Infanta Highway, Barangay Concepcion Uno, Marikina City',
    '123 Gil Fernando Avenue, Barangay Sto. Niño, Marikina City',
    'Unit 8B, Riverbanks Center, Marikina City',
    'Blk 4, Lot 6, Provident Village, Marikina City',
    '567 Sumulong Highway, Barangay San Roque, Marikina City',
    
    // Quezon City addresses
    '890 Katipunan Avenue, Barangay Loyola Heights, Quezon City',
    '234 Commonwealth Avenue, Barangay Batasan Hills, Quezon City',
    'Unit 15C, UP Town Center, Katipunan Avenue, Quezon City',
    'Blk 6, Lot 9, Teachers Village, Quezon City',
    '456 Aurora Boulevard, Barangay Cubao, Quezon City',
    
    // Mandaluyong City addresses
    '567 EDSA, Barangay Wack-Wack, Mandaluyong City',
    '123 Boni Avenue, Barangay Plainview, Mandaluyong City',
    'Unit 9A, The Residences at Greenbelt, EDSA, Mandaluyong City',
    'Blk 7, Lot 11, Greenfield District, Mandaluyong City',
    '890 Shaw Boulevard, Barangay Highway Hills, Mandaluyong City',
    
    // San Juan City addresses
    '123 P. Guevarra Street, Barangay Balong-Bato, San Juan City',
    '456 N. Domingo Street, Barangay Greenhills, San Juan City',
    'Unit 10B, Greenhills Shopping Center, San Juan City',
    'Blk 8, Lot 14, Greenhills West, San Juan City',
    '789 Wilson Street, Barangay Corazon de Jesus, San Juan City',
    
    // Makati City addresses
    '234 Ayala Avenue, Barangay San Lorenzo, Makati City',
    '567 Paseo de Roxas, Barangay Bel-Air, Makati City',
    'Unit 11C, The Residences at Greenbelt, Makati City',
    'Blk 9, Lot 13, Forbes Park, Makati City',
    '890 McKinley Road, Barangay Forbes Park, Makati City',
    
    // Taguig City addresses
    '123 McKinley Parkway, Bonifacio Global City, Taguig City',
    '456 32nd Street, Bonifacio Global City, Taguig City',
    'Unit 12D, The Residences at Greenbelt, BGC, Taguig City',
    'Blk 10, Lot 16, McKinley West, Taguig City',
    '789 5th Avenue, Bonifacio Global City, Taguig City',
    
    // Antipolo City addresses
    '234 Sumulong Highway, Barangay San Roque, Antipolo City',
    '567 Marcos Highway, Barangay Mayamot, Antipolo City',
    'Unit 13A, Robinsons Place Antipolo, Antipolo City',
    'Blk 11, Lot 17, Valley Golf Subdivision, Antipolo City',
    '890 Ortigas Avenue Extension, Barangay Dela Paz, Antipolo City'
  ];

  // Philippine phone number prefixes
  const phonePrefixes = ['0915', '0916', '0917', '0918', '0919', '0920', '0921', '0922', '0923', '0924', '0925', '0926', '0927', '0928', '0929', '0930', '0931', '0932', '0933', '0934', '0935', '0936', '0937', '0938', '0939', '0940', '0941', '0942', '0943', '0944', '0945', '0946', '0947', '0948', '0949', '0950', '0951', '0952', '0953', '0954', '0955', '0956', '0957', '0958', '0959', '0960', '0961', '0962', '0963', '0964', '0965', '0966', '0967', '0968', '0969', '0970', '0971', '0972', '0973', '0974', '0975', '0976', '0977', '0978', '0979', '0980', '0981', '0982', '0983', '0984', '0985', '0986', '0987', '0988', '0989', '0990', '0991', '0992', '0993', '0994', '0995', '0996', '0997', '0998', '0999'];

  // Philippine surnames
  const philippineSurnames = [
    'Santos', 'Dela Cruz', 'Reyes', 'Mendoza', 'Garcia', 'Torres', 'Rodriguez', 'Lopez', 'Fernandez', 'Silva',
    'Morales', 'Ramos', 'Cruz', 'Martinez', 'Gomez', 'Ruiz', 'Diaz', 'Vega', 'Herrera', 'Luna',
    'Castro', 'Ortega', 'Navarro', 'Jimenez', 'Moreno', 'Valdez', 'Soto', 'Campos', 'Rivera', 'Flores',
    'Ortiz', 'Vargas', 'Romero', 'Medina', 'Aguilar', 'Guerrero', 'Pena', 'Rojas', 'Acosta', 'Figueroa',
    'Alvarado', 'Sandoval', 'Carrillo', 'Salazar', 'Galvan', 'Espinoza', 'Maldonado', 'Valencia', 'Mejia', 'Guzman',
    'Velazquez', 'Padilla', 'Contreras', 'Rivas', 'Miranda', 'Estrada', 'Bautista', 'Villanueva', 'Molina', 'Perez',
    'Gutierrez', 'Castillo', 'Ramirez', 'Reyes', 'Flores', 'Gonzalez', 'Torres', 'Diaz', 'Cruz', 'Morales',
    'Vasquez', 'Jimenez', 'Ramos', 'Ruiz', 'Herrera', 'Medina', 'Aguilar', 'Vargas', 'Castro', 'Mendoza',
    'Salazar', 'Guzman', 'Vega', 'Velazquez', 'Rojas', 'Diaz', 'Reyes', 'Morales', 'Cruz', 'Ortiz'
  ];

  // Philippine first names
  const philippineFirstNames = [
    // Male names
    'Jose', 'Juan', 'Antonio', 'Francisco', 'Manuel', 'Pedro', 'Carlos', 'Miguel', 'Luis', 'Ramon',
    'Fernando', 'Roberto', 'Eduardo', 'Alberto', 'Ricardo', 'Guillermo', 'Javier', 'Alejandro', 'Daniel', 'Andres',
    'Gabriel', 'Rafael', 'Santiago', 'Mateo', 'Sebastian', 'Diego', 'Adrian', 'Nicolas', 'Christian', 'David',
    'Jose Maria', 'Juan Carlos', 'Antonio Jose', 'Francisco Javier', 'Manuel Antonio', 'Pedro Jose', 'Carlos Miguel', 'Miguel Angel', 'Luis Fernando', 'Ramon Antonio',
    
    // Female names
    'Maria', 'Ana', 'Carmen', 'Isabel', 'Rosa', 'Teresa', 'Elena', 'Patricia', 'Monica', 'Adriana',
    'Beatriz', 'Claudia', 'Diana', 'Eva', 'Gabriela', 'Helena', 'Iris', 'Julia', 'Laura', 'Natalia',
    'Olivia', 'Paula', 'Raquel', 'Sofia', 'Valentina', 'Wendy', 'Ximena', 'Yolanda', 'Zara', 'Angela',
    'Maria Ana', 'Ana Maria', 'Carmen Elena', 'Isabel Rosa', 'Rosa Teresa', 'Teresa Elena', 'Elena Patricia', 'Patricia Monica', 'Monica Adriana', 'Adriana Beatriz'
  ];

  // Philippine middle names
  const philippineMiddleNames = [
    'Santos', 'Dela Cruz', 'Reyes', 'Mendoza', 'Garcia', 'Torres', 'Rodriguez', 'Lopez', 'Fernandez', 'Silva',
    'Morales', 'Ramos', 'Cruz', 'Martinez', 'Gomez', 'Ruiz', 'Diaz', 'Vega', 'Herrera', 'Luna',
    'Castro', 'Ortega', 'Navarro', 'Jimenez', 'Moreno', 'Valdez', 'Soto', 'Campos', 'Rivera', 'Flores'
  ];

  // Philippine occupations
  const philippineOccupations = [
    'Teacher', 'Nurse', 'Engineer', 'Accountant', 'Doctor', 'Lawyer', 'Business Owner', 'Government Employee',
    'Sales Representative', 'Customer Service Representative', 'IT Professional', 'Marketing Manager',
    'Human Resources Manager', 'Financial Analyst', 'Project Manager', 'Administrative Assistant',
    'Designer', 'Writer', 'Chef', 'Driver', 'Security Guard', 'Janitor', 'Factory Worker', 'Construction Worker',
    'Electrician', 'Plumber', 'Carpenter', 'Mechanic', 'Technician', 'Supervisor', 'Manager', 'Director',
    'President', 'Vice President', 'CEO', 'CFO', 'CTO', 'COO', 'Secretary', 'Receptionist', 'Cashier', 'Waiter'
  ];

  // Philippine workplaces
  const philippineWorkplaces = [
    'SM Mall', 'Robinsons Mall', 'Ayala Malls', 'Megamall', 'Glorietta', 'Greenbelt', 'Bonifacio High Street',
    'UP Diliman', 'Ateneo de Manila University', 'De La Salle University', 'University of Santo Tomas',
    'FEU', 'UE', 'Mapua University', 'San Beda University', 'Letran College', 'Adamson University',
    'Makati Medical Center', 'St. Luke\'s Medical Center', 'Philippine General Hospital', 'East Avenue Medical Center',
    'BDO', 'BPI', 'Metrobank', 'Unionbank', 'Security Bank', 'RCBC', 'PNB', 'Landbank',
    'PLDT', 'Globe', 'Smart', 'Sun Cellular', 'DITO Telecommunity',
    'Jollibee', 'McDonald\'s', 'KFC', 'Chowking', 'Greenwich', 'Mang Inasal', 'Red Ribbon', 'Goldilocks',
    'Nestle Philippines', 'Unilever Philippines', 'Procter & Gamble', 'Coca-Cola Philippines', 'Pepsi Philippines',
    'San Miguel Corporation', 'Ayala Corporation', 'SM Investments Corporation', 'JG Summit Holdings',
    'Government Office', 'Public School', 'Private School', 'Hospital', 'Clinic', 'Pharmacy', 'Bank', 'Restaurant'
  ];

  // Departments and courses as per user specification
  const departments = [
    { name: 'College of Arts & Sciences', code: 'CAS', type: 'ACADEMIC' },
    { name: 'College of Business & Accountancy', code: 'CBA', type: 'ACADEMIC' },
    { name: 'College of Computer Studies', code: 'CCS', type: 'ACADEMIC' },
    { name: 'College of Teacher Education', code: 'CTE', type: 'ACADEMIC' },
    { name: 'College of Maritime Education & Training', code: 'CMET', type: 'ACADEMIC' },
    { name: 'College of Criminology & Administration', code: 'CCA', type: 'ACADEMIC' },
    { name: 'College of Engineering', code: 'COE', type: 'ACADEMIC' },
    { name: 'College of Health Sciences', code: 'CHS', type: 'ACADEMIC' },
    { name: 'International School of Hospitality & Tourism Management', code: 'ISHTM', type: 'ACADEMIC' },
  ];

  // Map of department code to courses (with majors as array if needed)
  const courses = [
    // College of Arts & Sciences (CAS)
    { code: 'ABCom', name: 'Bachelor of Arts in Communication (Masscom)', dept: 'CAS', units: 150 },
    { code: 'ABEng', name: 'Bachelor of Arts in English', dept: 'CAS', units: 150 },
    { code: 'BSM', name: 'Bachelor of Sciences in Mathematics', dept: 'CAS', units: 150 },
    { code: 'BSP', name: 'Bachelor of Sciences in Psychology', dept: 'CAS', units: 150 },

    // College of Business & Accountancy (CBA)
    { code: 'ABA', name: 'Associate in Business Administration', dept: 'CBA', units: 150 },
    { code: 'BSAIS', name: 'Bachelor of Science in Accounting Information System', dept: 'CBA', units: 150 },
    { code: 'BSA', name: 'Bachelor of Sciences in Accountancy', dept: 'CBA', units: 150 },
    { code: 'BSMA', name: 'Bachelor of Science in Management Accounting', dept: 'CBA', units: 150 },
    { code: 'BSREM', name: 'Bachelor of Science in Real Estate Management', dept: 'CBA', units: 150 },
    { code: 'BSIA', name: 'Bachelor of Science in Internal Auditing', dept: 'CBA', units: 150 },
    { code: 'BSBA', name: 'Bachelor of Science in Business Administration', dept: 'CBA', units: 150, majors: [
      'Major in Information Management',
      'Major in Marketing Management',
      'Major in Financial Management',
      'Major in Operations Management',
      'Major in Human Resources Management',
      'Major in Legal Management',
      'Major in Business Economics',
    ] },

    // College of Computer Studies (CCS)
    { code: 'ACT', name: 'Associate in Computer Technology', dept: 'CCS', units: 150 },
    { code: 'BSCS', name: 'Bachelor of Science in Computer Science', dept: 'CCS', units: 150 },
    { code: 'BSIT', name: 'Bachelor of Science in Information Technology', dept: 'CCS', units: 150 },
    { code: 'BSIS', name: 'Bachelor of Science in Information System', dept: 'CCS', units: 150 },

    // College of Teacher Education (CTE)
    { code: 'BECEd', name: 'Bachelor in Early Childhood Education', dept: 'CTE', units: 150 },
    { code: 'BEEd', name: 'Bachelor in Elementary Education', dept: 'CTE', units: 150, majors: [
      'Major in Early Childhood Education',
    ] },
    { code: 'BSEd', name: 'Bachelor in Secondary Education', dept: 'CTE', units: 150, majors: [
      'Major in Information Management',
      'Major in English',
      'Major in Filipino',
      'Major in Mathematics',
      'Major in Science',
    ] },
    { code: 'BTVTEd', name: 'Bachelor in Technical Vocational Teacher Education', dept: 'CTE', units: 150, majors: [
      'Major in Home Economics and Livelihood Education / HELE',
      'Major in Information Communication Technology / ICT',
    ] },

    // College of Maritime Education & Training (CMET)
    { code: 'BSMT', name: 'Bachelor of Sciences in Marine Transportation', dept: 'CMET', units: 150 },

    // College of Criminology & Administration (CCA)
    { code: 'BSC', name: 'Bachelor of Sciences in Criminology', dept: 'CCA', units: 150 },
    { code: 'BSISM', name: 'Bachelor of Sciences in Industrial Security Management', dept: 'CCA', units: 150 },
    { code: 'BSPA', name: 'Bachelor of Sciences in Public Administration', dept: 'CCA', units: 150 },

    // College of Engineering (COE)
    { code: 'BSCE', name: 'Bachelor of Science in Computer Engineering', dept: 'COE', units: 150, majors: [
      'Specializes in CISCO Networking and Robotics Technology',
    ] },
    { code: 'BSELE', name: 'Bachelor of Sciences in Electronics Engineering', dept: 'COE', units: 150, majors: [
      'Specializes in Telecommunication and Broadcasting',
    ] },

    // College of Health Sciences (CHS)
    { code: 'BSMedTech', name: 'Bachelor of Sciences in Medical Technology', dept: 'CHS', units: 150 },

    // International School of Hospitality & Tourism Management (ISHTM)
    { code: 'BSHM', name: 'Bachelor of Sciences in Hospitality Management', dept: 'ISHTM', units: 150 },
    { code: 'BSTM', name: 'Bachelor of Sciences in Tourism Management', dept: 'ISHTM', units: 150 },
  ];

  const subjects = [
    // Computer Science subjects
    { name: 'Programming Fundamentals', code: 'CS101', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Data Structures and Algorithms', code: 'CS201', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Database Management Systems', code: 'CS301', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Web Development', code: 'CS401', type: 'LABORATORY', units: 2, hours: 36 },
    { name: 'Software Engineering', code: 'CS501', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Computer Networks', code: 'CS601', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Operating Systems', code: 'CS701', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Programming Laboratory', code: 'CS102', type: 'LABORATORY', units: 1, hours: 18 },
    
    // Information Technology subjects
    { name: 'IT Fundamentals', code: 'IT101', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'System Analysis and Design', code: 'IT201', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Network Administration', code: 'IT301', type: 'LABORATORY', units: 2, hours: 36 },
    { name: 'Cybersecurity', code: 'IT401', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'IT Project Management', code: 'IT501', type: 'LECTURE', units: 3, hours: 54 },
    
    // Business subjects
    { name: 'Principles of Management', code: 'BA101', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Business Ethics', code: 'BA201', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Marketing Management', code: 'BA301', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Financial Management', code: 'BA401', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Business Law', code: 'BA501', type: 'LECTURE', units: 3, hours: 54 },
    
    // Accountancy subjects
    { name: 'Financial Accounting', code: 'ACC101', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Managerial Accounting', code: 'ACC201', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Cost Accounting', code: 'ACC301', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Auditing', code: 'ACC401', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Taxation', code: 'ACC501', type: 'LECTURE', units: 3, hours: 54 },
    
    // Engineering subjects
    { name: 'Engineering Mathematics', code: 'ENG101', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Engineering Mechanics', code: 'ENG201', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Engineering Drawing', code: 'ENG301', type: 'LABORATORY', units: 2, hours: 36 },
    { name: 'Strength of Materials', code: 'ENG401', type: 'LECTURE', units: 3, hours: 54 },
    
    // Education subjects
    { name: 'Educational Psychology', code: 'EDU101', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Teaching Methods', code: 'EDU201', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Curriculum Development', code: 'EDU301', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Student Teaching', code: 'EDU401', type: 'LABORATORY', units: 2, hours: 36 },
    
    // Nursing subjects
    { name: 'Anatomy and Physiology', code: 'NUR101', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Nursing Fundamentals', code: 'NUR201', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Medical-Surgical Nursing', code: 'NUR301', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Nursing Laboratory', code: 'NUR102', type: 'LABORATORY', units: 1, hours: 18 },
    
    // General Education subjects
    { name: 'English Communication', code: 'GE101', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Mathematics in the Modern World', code: 'GE102', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Science, Technology and Society', code: 'GE103', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Philippine History', code: 'GE104', type: 'LECTURE', units: 3, hours: 54 },
    { name: 'Physical Education', code: 'GE105', type: 'LABORATORY', units: 2, hours: 36 },
  ];

  const rooms = [
    { no: 'A101', type: 'LECTURE', capacity: 40, building: 'Academic Building A', floor: '1st Floor' },
    { no: 'A102', type: 'LECTURE', capacity: 40, building: 'Academic Building A', floor: '1st Floor' },
    { no: 'A201', type: 'LECTURE', capacity: 40, building: 'Academic Building A', floor: '2nd Floor' },
    { no: 'A202', type: 'LECTURE', capacity: 40, building: 'Academic Building A', floor: '2nd Floor' },
    { no: 'B101', type: 'LECTURE', capacity: 50, building: 'Academic Building B', floor: '1st Floor' },
    { no: 'B102', type: 'LECTURE', capacity: 50, building: 'Academic Building B', floor: '1st Floor' },
    { no: 'C101', type: 'LABORATORY', capacity: 30, building: 'Computer Lab Building', floor: '1st Floor' },
    { no: 'C102', type: 'LABORATORY', capacity: 30, building: 'Computer Lab Building', floor: '1st Floor' },
    { no: 'C201', type: 'LABORATORY', capacity: 25, building: 'Computer Lab Building', floor: '2nd Floor' },
    { no: 'C202', type: 'LABORATORY', capacity: 25, building: 'Computer Lab Building', floor: '2nd Floor' },
    { no: 'D101', type: 'CONFERENCE', capacity: 100, building: 'Administrative Building', floor: '1st Floor' },
    { no: 'E101', type: 'LABORATORY', capacity: 20, building: 'Engineering Lab', floor: '1st Floor' },
    { no: 'N101', type: 'LABORATORY', capacity: 15, building: 'Nursing Lab', floor: '1st Floor' },
    { no: 'N102', type: 'LABORATORY', capacity: 15, building: 'Nursing Lab', floor: '1st Floor' },
  ];

  return { 
    departments, 
    courses, 
    subjects, 
    rooms,
    philippineAddresses,
    phonePrefixes,
    philippineSurnames,
    philippineFirstNames,
    philippineMiddleNames,
    philippineOccupations,
    philippineWorkplaces
  };
}

// Helper function to generate attendance dates for a semester
function generateAttendanceDates(startDate: Date, endDate: Date, daysOfWeek: string[]) {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    if (daysOfWeek.includes(dayName)) {
      dates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

// Helper function to generate realistic attendance status with patterns
function generateAttendanceStatus(studentId: number, date: Date, isRegularStudent: boolean): string {
  const random = Math.random();
  
  // Regular students have better attendance
  if (isRegularStudent) {
    if (random < 0.85) return 'PRESENT';
    if (random < 0.92) return 'LATE';
    if (random < 0.95) return 'EXCUSED';
    return 'ABSENT';
  } else {
    // Irregular students have more varied attendance
    if (random < 0.70) return 'PRESENT';
    if (random < 0.80) return 'LATE';
    if (random < 0.85) return 'EXCUSED';
    return 'ABSENT';
  }
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.rFIDTagAssignmentLog.deleteMany({});
  await prisma.attendanceNotification.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.systemLogs.deleteMany({});
  await prisma.reportLog.deleteMany({});
  await prisma.rFIDReaderLogs.deleteMany({});
  await prisma.rFIDLogs.deleteMany({});
  await prisma.rFIDReader.deleteMany({});
  await prisma.rFIDTags.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.studentSchedule.deleteMany({});
  await prisma.subjectSchedule.deleteMany({});
  await prisma.studentSection.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.subjects.deleteMany({});
  await prisma.section.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.guardian.deleteMany({});
  await prisma.instructor.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.courseOffering.deleteMany({});
  await prisma.semester.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});

  const collegeData = generateRealisticCollegeData();

  // 1. Create Admin Users
  console.log('👥 Creating admin users...');
  const adminUsers = [];
  for (let i = 0; i < 5; i++) {
    adminUsers.push(await prisma.user.create({
      data: {
        userName: `admin${i + 1}`,
        email: `admin${i + 1}@icct.edu.ph`,
        passwordHash: '$2b$10$hashedpassword',
        role: 'ADMIN',
        status: 'ACTIVE',
        isEmailVerified: true,
      }
    }));
  }

  // 2. Create Departments
  console.log('🏢 Creating departments...');
  const departments = [];
  for (const dept of collegeData.departments) {
    departments.push(await prisma.department.create({
      data: {
        departmentName: dept.name,
        departmentCode: dept.code,
        departmentType: dept.type as any,
        departmentDescription: `${dept.name} Department`,
        departmentStatus: 'ACTIVE',
        headOfDepartment: adminUsers[0].userId,
        location: `${dept.name} Building`,
        contactEmail: `${dept.code.toLowerCase()}@icct.edu.ph`,
        contactPhone: faker.phone.number(),
      }
    }));
  }

  // 3. Create Trimesters
  console.log('📅 Creating trimesters...');
  const trimesters = [
    {
      name: 'First Trimester',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-06-30'),
      year: 2025,
      semesterType: 'FIRST_SEMESTER',
      registrationStart: new Date('2025-03-01'),
      registrationEnd: new Date('2025-03-31'),
      enrollmentStart: new Date('2025-03-15'),
      enrollmentEnd: new Date('2025-03-31'),
    },
    {
      name: 'Second Trimester',
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-09-30'),
      year: 2025,
      semesterType: 'SECOND_SEMESTER',
      registrationStart: new Date('2025-06-01'),
      registrationEnd: new Date('2025-06-30'),
      enrollmentStart: new Date('2025-06-15'),
      enrollmentEnd: new Date('2025-06-30'),
    },
    {
      name: 'Third Trimester',
      startDate: new Date('2025-10-01'),
      endDate: new Date('2025-12-31'),
      year: 2025,
      semesterType: 'THIRD_SEMESTER',
      registrationStart: new Date('2025-09-01'),
      registrationEnd: new Date('2025-09-30'),
      enrollmentStart: new Date('2025-09-15'),
      enrollmentEnd: new Date('2025-09-30'),
    }
  ];

  const createdTrimesters = [];
  for (const trimester of trimesters) {
    createdTrimesters.push(await prisma.semester.create({
      data: {
        startDate: trimester.startDate,
        endDate: trimester.endDate,
        year: trimester.year,
        semesterType: trimester.semesterType as any,
        status: trimester.name === 'First Trimester' ? 'CURRENT' : 'UPCOMING',
        isActive: trimester.name === 'First Trimester',
        registrationStart: trimester.registrationStart,
        registrationEnd: trimester.registrationEnd,
        enrollmentStart: trimester.enrollmentStart,
        enrollmentEnd: trimester.enrollmentEnd,
      }
    }));
  }

  const currentTrimester = createdTrimesters[0]; // First Trimester is current

  // 4. Create Course Offerings for all trimesters
  console.log('📚 Creating course offerings for all trimesters...');
  const allCourseOfferings = [];
  const usedCourseCodes = new Set();
  const stopwords = ['in', 'and', 'of', 'the', 'specializes', 'major', 'management', 'education', 'livelihood', 'communication', 'technology', 'broadcasting', 'cisco', 'networking', 'robotics'];
  
  for (const trimester of createdTrimesters) {
    for (const course of collegeData.courses) {
      const dept = departments.find(d => d.departmentCode === course.dept);
      if (!dept) continue; // skip if department not found
      if (course.majors && Array.isArray(course.majors)) {
        for (const major of course.majors) {
          // Generate a cleaned code for each major
          let majorSuffix = major
            .replace(/Major in |Specializes in |\//gi, '')
            .split(' ')
            .filter(word => word && !stopwords.includes(word.toLowerCase()))
            .map(word => word[0])
            .join('')
            .toUpperCase();
          if (majorSuffix.length < 2) {
            const words = major.trim().split(' ');
            majorSuffix = words[words.length - 1].substring(0, 3).toUpperCase();
          }
          let uniqueCourseCode = `${course.code}-${majorSuffix}-${trimester.semesterType}`;
          let idx = 1;
          while (usedCourseCodes.has(uniqueCourseCode)) {
            uniqueCourseCode = `${course.code}-${majorSuffix}-${trimester.semesterType}${idx}`;
            idx++;
          }
          usedCourseCodes.add(uniqueCourseCode);
          allCourseOfferings.push(await prisma.courseOffering.create({
      data: {
              courseCode: uniqueCourseCode,
              courseName: course.name,
        courseType: 'MANDATORY',
        courseStatus: 'ACTIVE',
              description: `${course.name} program (${major}) - ${trimester.semesterType}`,
              departmentId: dept.departmentId,
              academicYear: '2024-2025',
              semester: trimester.semesterType as any,
              totalUnits: course.units,
              semesterId: trimester.semesterId,
              major: major,
      }
    }));
        }
      } else {
        let uniqueCourseCode = `${course.code}-${trimester.semesterType}`;
        let idx = 1;
        while (usedCourseCodes.has(uniqueCourseCode)) {
          uniqueCourseCode = `${course.code}-${trimester.semesterType}${idx}`;
          idx++;
        }
        usedCourseCodes.add(uniqueCourseCode);
        allCourseOfferings.push(await prisma.courseOffering.create({
          data: {
            courseCode: uniqueCourseCode,
            courseName: course.name,
            courseType: 'MANDATORY',
            courseStatus: 'ACTIVE',
            description: `${course.name} program - ${trimester.semesterType}`,
            departmentId: dept.departmentId,
            academicYear: '2024-2025',
            semester: trimester.semesterType as any,
            totalUnits: course.units,
            semesterId: trimester.semesterId,
            major: null,
          }
        }));
      }
    }
  }

  // 5. Create Instructors (at least 10 per department)
  console.log('👨‍🏫 Creating instructors...');
  const instructors: any[] = [];
  for (const dept of departments) {
    for (let i = 0; i < 10; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const user = await prisma.user.create({
        data: {
          userName: `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@icct.edu.ph`,
          passwordHash: '$2b$10$hashedpassword',
          role: 'TEACHER',
          status: 'ACTIVE',
          isEmailVerified: true,
        }
      });
      instructors.push(await prisma.instructor.create({
      data: {
        instructorId: user.userId,
          email: user.email,
        phoneNumber: faker.phone.number(),
          firstName: firstName,
        middleName: faker.person.middleName(),
          lastName: lastName,
          gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
          instructorType: faker.helpers.arrayElement(['FULL_TIME', 'PART_TIME']),
        status: 'ACTIVE',
          departmentId: dept.departmentId,
          officeLocation: `${dept.departmentName} Building, Room ${faker.number.int({ min: 100, max: 300 })}`,
          officeHours: `${faker.number.int({ min: 8, max: 10 })}:00 AM - ${faker.number.int({ min: 4, max: 6 })}:00 PM`,
          specialization: faker.helpers.arrayElement(['Programming', 'Database', 'Networking', 'Web Development', 'Software Engineering', 'Cybersecurity']),
          rfidTag: `INSTR${dept.departmentCode}${String(i + 1).padStart(3, '0')}`,
        }
      }));
    }
  }

  // 6. Create Guardians
  console.log('👨‍👩‍👧‍👦 Creating guardians...');
  const guardians = [];
  const guardianRelationships = ['Parent', 'Grandparent', 'Legal Guardian', 'Uncle', 'Aunt', 'Sibling', 'Other Relative'];

  for (let i = 0; i < 50; i++) {
    const firstName = collegeData.philippineFirstNames[Math.floor(Math.random() * collegeData.philippineFirstNames.length)];
    const lastName = collegeData.philippineSurnames[Math.floor(Math.random() * collegeData.philippineSurnames.length)];
    const middleName = collegeData.philippineMiddleNames[Math.floor(Math.random() * collegeData.philippineMiddleNames.length)];
    const address = collegeData.philippineAddresses[Math.floor(Math.random() * collegeData.philippineAddresses.length)];
    const phonePrefix = collegeData.phonePrefixes[Math.floor(Math.random() * collegeData.phonePrefixes.length)];
    const phoneNumber = `${phonePrefix}${String(i + 1).padStart(7, '0')}`;
    const occupation = collegeData.philippineOccupations[Math.floor(Math.random() * collegeData.philippineOccupations.length)];
    const workplace = collegeData.philippineWorkplaces[Math.floor(Math.random() * collegeData.philippineWorkplaces.length)];
    const relationship = guardianRelationships[Math.floor(Math.random() * guardianRelationships.length)];
    
    const user = await prisma.user.create({
      data: {
        userName: `guardian${i + 1}`,
        email: `guardian${i + 1}@email.com`,
        passwordHash: '$2b$10$hashedpassword',
        role: 'GUARDIAN',
        status: 'ACTIVE',
        isEmailVerified: true,
      }
    });

    guardians.push(await prisma.guardian.create({
      data: {
        guardianId: user.userId,
        email: user.email,
        phoneNumber: phoneNumber,
        firstName: firstName,
        middleName: middleName,
        lastName: lastName,
        gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
        guardianType: 'PARENT',
        status: 'ACTIVE',
        address: address,
        occupation: occupation,
        workplace: workplace,
        emergencyContact: phoneNumber,
        relationshipToStudent: relationship,
        totalStudents: 1,
      }
    }));
  }

  // 7. Create Students (enough for 20 per section * 5 sections * course offerings)
  console.log('👨‍🎓 Creating students...');
  const students: any[] = [];
  const totalSections = allCourseOfferings.length * 5; // Reduced from 30 to 5
  const totalStudents = totalSections * 20; // Reduced from 100 to 20
  for (let i = 0; i < totalStudents; i++) {
    const firstName = collegeData.philippineFirstNames[Math.floor(Math.random() * collegeData.philippineFirstNames.length)];
    const lastName = collegeData.philippineSurnames[Math.floor(Math.random() * collegeData.philippineSurnames.length)];
    const middleName = collegeData.philippineMiddleNames[Math.floor(Math.random() * collegeData.philippineMiddleNames.length)];
    const address = collegeData.philippineAddresses[Math.floor(Math.random() * collegeData.philippineAddresses.length)];
    const phonePrefix = collegeData.phonePrefixes[Math.floor(Math.random() * collegeData.phonePrefixes.length)];
    // Guarantee unique phone number by appending index
    const phoneNumber = `${phonePrefix}${String(i + 1).padStart(7, '0')}`;
    
    const user = await prisma.user.create({
      data: {
        userName: `${firstName.toLowerCase()}${lastName.toLowerCase()}${i + 1}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@student.icct.edu.ph`,
        passwordHash: '$2b$10$hashedpassword',
        role: 'STUDENT',
        status: 'ACTIVE',
        isEmailVerified: true,
      }
    });
    students.push(await prisma.student.create({
      data: {
        studentIdNum: `2025-${String(i + 1).padStart(5, '0')}`,
        rfidTag: `STUD${String(i + 1).padStart(5, '0')}`,
        firstName: firstName,
        middleName: middleName,
        lastName: lastName,
        email: user.email,
        phoneNumber: phoneNumber,
        address: address,
        gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
        studentType: faker.helpers.arrayElement(['REGULAR', 'IRREGULAR']),
        status: 'ACTIVE',
        yearLevel: faker.helpers.arrayElement(['FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR']),
        userId: user.userId,
        guardianId: guardians[i % guardians.length].guardianId,
      }
    }));
  }

  // 8. Create Sections (5 per course offering)
  console.log('📋 Creating sections...');
  const sections: any[] = [];
  for (const course of allCourseOfferings) {
    for (let j = 0; j < 5; j++) { // Reduced from 30 to 5
      sections.push(await prisma.section.create({
      data: {
          sectionName: `${course.courseCode}-S${String(j + 1).padStart(2, '0')}`,
          sectionType: 'LECTURE',
          sectionCapacity: 20, // Reduced from 100 to 20
          sectionStatus: 'ACTIVE',
          yearLevel: faker.number.int({ min: 1, max: 4 }),
          academicYear: '2024-2025',
          semester: course.semester as any,
          currentEnrollment: 20, // Reduced from 100 to 20
          courseId: course.courseId,
          semesterId: course.semesterId,
        }
      }));
    }
  }

  // 9. Assign students to sections (20 per section, assign department/courseId)
  console.log('📝 Enrolling students in sections...');
  let studentIdx = 0;
  for (const section of sections) {
    const course = allCourseOfferings.find(c => c.courseId === section.courseId);
    const deptId = course ? course.departmentId : undefined;
    const trimester = createdTrimesters.find(t => t.semesterId === section.semesterId);
    for (let i = 0; i < 20; i++) { // Reduced from 100 to 20
      if (studentIdx >= students.length) break;
      const student = students[studentIdx];
      await prisma.studentSection.create({
      data: {
          studentId: student.studentId,
          sectionId: section.sectionId,
          enrollmentStatus: 'ACTIVE',
          enrollmentDate: faker.date.between({ from: trimester!.registrationStart!, to: trimester!.enrollmentEnd! }),
          isRegular: student.studentType === 'REGULAR',
        }
      });
      // Assign department and courseId to student
      await prisma.student.update({
        where: { studentId: student.studentId },
        data: { departmentId: deptId, courseId: section.courseId },
      });
      studentIdx++;
    }
  }

  // 10. Create Subjects (5 per course offering)
  console.log('📖 Creating subjects...');
  const subjects: any[] = [];
  for (const course of allCourseOfferings) {
    for (let k = 0; k < 5; k++) { // Reduced from 10 to 5
      subjects.push(await prisma.subjects.create({
      data: {
          subjectName: `${course.courseName} Subject ${k + 1}`,
          subjectCode: `${course.courseCode}-SUBJ${k + 1}`,
          subjectType: faker.helpers.arrayElement(['LECTURE', 'LABORATORY']),
          status: 'ACTIVE',
          description: `${course.courseName} Subject ${k + 1}`,
          lectureUnits: 3,
          labUnits: 2,
          creditedUnits: 3,
          totalHours: 54,
        prerequisites: '',
          courseId: course.courseId,
          departmentId: course.departmentId,
          academicYear: '2024-2025',
          semester: course.semester as any,
          maxStudents: 20, // Reduced from 100 to 20
        }
      }));
    }
  }

  // 11. Create Rooms (100 rooms shared across all schedules)
  console.log('🏫 Creating rooms...');
  const rooms: any[] = [];
  const totalRooms = 100; // realistic number for a college campus
  for (let i = 0; i < totalRooms; i++) {
    const roomType = i < 60 ? 'LECTURE' : i < 85 ? 'LABORATORY' : i < 95 ? 'CONFERENCE' : 'OFFICE';
    const capacity = roomType === 'LECTURE' ? faker.number.int({ min: 30, max: 80 }) :
                   roomType === 'LABORATORY' ? faker.number.int({ min: 20, max: 40 }) :
                   roomType === 'CONFERENCE' ? faker.number.int({ min: 50, max: 150 }) :
                   faker.number.int({ min: 25, max: 35 });
    // Use enums for building and floor
    const buildingEnum = ['BuildingA', 'BuildingB', 'BuildingC', 'BuildingD', 'BuildingE'][i % 5];
    const floorEnum = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'][i % 6];
    rooms.push(await prisma.room.create({
        data: {
        roomNo: `${roomType === 'LECTURE' ? 'L' : roomType === 'LABORATORY' ? 'LAB' : roomType === 'CONFERENCE' ? 'CONF' : 'OFF'}${String(i + 1).padStart(3, '0')}`,
        roomType: roomType as any,
        roomCapacity: capacity,
        roomBuildingLoc: buildingEnum,
        roomFloorLoc: floorEnum,
        readerId: `READER-${String(i + 1).padStart(3, '0')}`,
        status: 'AVAILABLE',
        isActive: true,
        lastMaintenance: faker.date.past(),
        nextMaintenance: faker.date.future(),
      }
    }));
  }

  // 12. Create Subject Schedules (multiple schedules per subject for different time slots)
  console.log('📅 Creating subject schedules...');
  const subjectSchedules: any[] = [];
  const timeSlots = [
    { start: '07:30', end: '09:30', label: 'MORNING' },
    { start: '11:00', end: '13:00', label: 'NOON' },
    { start: '17:00', end: '19:00', label: 'EVENING' },
  ];
  const daysOfWeek: ('MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY')[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  
  for (const subject of subjects) {
    const course = allCourseOfferings.find(c => c.courseId === subject.courseId);
    if (!course) continue; // skip if course not found
    const trimester = createdTrimesters.find(t => t.semesterId === course.semesterId);
    if (!trimester) continue;
    const deptInstructors = instructors.filter(i => i.departmentId === course.departmentId);
    const courseSections = sections.filter(s => s.courseId === course.courseId);
    if (deptInstructors.length === 0 || courseSections.length === 0) continue;
    
    // Create multiple schedules for each subject (morning, noon, evening)
    for (let timeSlotIndex = 0; timeSlotIndex < timeSlots.length; timeSlotIndex++) {
      const timeSlot = timeSlots[timeSlotIndex];
      const section = courseSections[timeSlotIndex % courseSections.length];
      const instructor = deptInstructors[timeSlotIndex % deptInstructors.length];
      const day = daysOfWeek[timeSlotIndex % daysOfWeek.length];

      // Find a room that is not already booked for this day/time
      let availableRoom = null;
      for (const room of rooms) {
        const overlap = subjectSchedules.find(s =>
          s.roomId === room.roomId &&
          s.day === day &&
          !(
            timeSlot.end <= s.startTime || // ends before existing starts
            timeSlot.start >= s.endTime    // starts after existing ends
          )
        );
        if (!overlap) {
          availableRoom = room;
          break;
        }
      }
      if (!availableRoom) {
        console.warn('No available room for', day, timeSlot, 'skipping schedule');
        continue;
      }

      subjectSchedules.push(await prisma.subjectSchedule.create({
        data: {
          subjectId: subject.subjectId,
          sectionId: section.sectionId,
          instructorId: instructor.instructorId,
          roomId: availableRoom.roomId,
          day: day,
          startTime: timeSlot.start,
          endTime: timeSlot.end,
          slots: 100,
          scheduleType: 'REGULAR',
          status: 'ACTIVE',
          semesterId: course.semesterId,
          academicYear: '2024-2025',
          isRecurring: true,
          startDate: trimester.startDate,
          endDate: trimester.endDate,
          maxStudents: 100,
        }
      }));
    }
  }

  // 12.5. Create Student Schedules (enroll students in subject schedules)
  console.log('📚 Enrolling students in subject schedules...');
  const studentSchedules: any[] = [];
  let studentScheduleIdx = 0;
  
  // Get all student-section enrollments to properly align students with their sections
  const studentSectionEnrollments = await prisma.studentSection.findMany({
    include: {
      Student: true,
      Section: true
    }
  });
  
  for (const subjectSchedule of subjectSchedules) {
    // Get students enrolled in the same section as this subject schedule
    const sectionStudents = studentSectionEnrollments
      .filter(enrollment => enrollment.sectionId === subjectSchedule.sectionId)
      .map(enrollment => enrollment.Student);
    
    // Enroll each student in this subject schedule
    for (const student of sectionStudents) {
      studentSchedules.push(await prisma.studentSchedule.create({
        data: {
          studentId: student.studentId,
          scheduleId: subjectSchedule.subjectSchedId,
          status: 'ACTIVE',
          enrolledAt: faker.date.between({ 
            from: currentTrimester.registrationStart!, 
            to: currentTrimester.enrollmentEnd! 
          }),
          notes: `Enrolled in subject schedule`,
        }
      }));
      studentScheduleIdx++;
    }
  }

  // 13. Generate Attendance Data for 1 month for all students and instructors (reduced from 3 months)
  console.log('📊 Generating attendance data...');
  const attendanceRecords = [];
  
  for (const subjectSchedule of subjectSchedules) {
    // Get students enrolled in the same section as this subject schedule
    const scheduleStudents = studentSectionEnrollments
      .filter(enrollment => enrollment.sectionId === subjectSchedule.sectionId)
      .map(enrollment => enrollment.Student);
    const course = allCourseOfferings.find(c => c.courseId === sections.find(s => s.sectionId === subjectSchedule.sectionId)?.courseId);
    const trimester = course ? createdTrimesters.find(t => t.semesterId === course.semesterId) : null;
    if (!trimester) continue;
    
    // Generate attendance for only 1 month instead of 3 months
    const oneMonthEnd = new Date(trimester.startDate);
    oneMonthEnd.setMonth(oneMonthEnd.getMonth() + 1);
    
    const dayName = subjectSchedule.day;
    const attendanceDates = generateAttendanceDates(
      trimester.startDate,
      oneMonthEnd,
      [dayName]
    );

    for (const date of attendanceDates) {
      for (const student of scheduleStudents) {
        const isRegularStudent = student.studentType === 'REGULAR';
        const status = generateAttendanceStatus(student.studentId, date, isRegularStudent);
        
        // Skip some dates to create realistic absence patterns
        if (status === 'ABSENT' && Math.random() < 0.3) continue;
        
        const timestamp = new Date(date);
        timestamp.setHours(
          parseInt(subjectSchedule.startTime.split(':')[0]),
          parseInt(subjectSchedule.startTime.split(':')[1]),
          0,
          0
        );

        // Add some variation to arrival times
        if (status === 'LATE') {
          timestamp.setMinutes(timestamp.getMinutes() + faker.number.int({ min: 5, max: 30 }));
        } else if (status === 'PRESENT') {
          timestamp.setMinutes(timestamp.getMinutes() + faker.number.int({ min: -10, max: 5 }));
        }

        attendanceRecords.push({
          subjectSchedId: subjectSchedule.subjectSchedId,
          studentId: student.studentId,
          instructorId: subjectSchedule.instructorId,
          userId: student.userId,
          userRole: 'STUDENT' as const,
          status: status as any,
          attendanceType: 'RFID_SCAN' as const,
          verification: 'VERIFIED' as const,
          timestamp: timestamp,
          semesterId: trimester.semesterId,
          academicYear: '2024-2025',
        });
      }
    }
  }

  // Generate instructor attendance for 1 month
  console.log('👨‍🏫 Generating instructor attendance...');
  for (const subjectSchedule of subjectSchedules) {
    const instructor = instructors.find(i => i.instructorId === subjectSchedule.instructorId);
    if (!instructor) continue;
    
    const course = allCourseOfferings.find(c => c.courseId === sections.find(s => s.sectionId === subjectSchedule.sectionId)?.courseId);
    const trimester = course ? createdTrimesters.find(t => t.semesterId === course.semesterId) : null;
    if (!trimester) continue;
    
    // Generate attendance for only 1 month instead of 3 months
    const oneMonthEnd = new Date(trimester.startDate);
    oneMonthEnd.setMonth(oneMonthEnd.getMonth() + 1);
    
    const dayName = subjectSchedule.day;
    const attendanceDates = generateAttendanceDates(
      trimester.startDate,
      oneMonthEnd,
      [dayName]
    );

    for (const date of attendanceDates) {
      const status = Math.random() < 0.95 ? 'PRESENT' : Math.random() < 0.5 ? 'LATE' : 'ABSENT';
      
      const timestamp = new Date(date);
      timestamp.setHours(
        parseInt(subjectSchedule.startTime.split(':')[0]),
        parseInt(subjectSchedule.startTime.split(':')[1]),
        0,
        0
      );

      if (status === 'LATE') {
        timestamp.setMinutes(timestamp.getMinutes() + faker.number.int({ min: 5, max: 15 }));
      }

      attendanceRecords.push({
        subjectSchedId: subjectSchedule.subjectSchedId,
        studentId: null,
        instructorId: instructor.instructorId,
        userId: instructor.instructorId,
        userRole: 'TEACHER' as const,
        status: status as any,
        attendanceType: 'RFID_SCAN' as const,
        verification: 'VERIFIED' as const,
        timestamp: timestamp,
        semesterId: trimester.semesterId,
        academicYear: '2024-2025',
      });
    }
  }

  // Insert attendance records in batches
  const batchSize = 100;
  for (let i = 0; i < attendanceRecords.length; i += batchSize) {
    const batch = attendanceRecords.slice(i, i + batchSize);
    await prisma.attendance.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }

  // 15. Create RFID Tags
  console.log('🏷️ Creating RFID tags...');
  for (const student of students) {
    await prisma.rFIDTags.create({
      data: {
        tagNumber: student.rfidTag,
        tagType: 'STUDENT_CARD',
        assignedAt: faker.date.past(),
        status: 'ACTIVE',
        studentId: student.studentId,
        assignedBy: adminUsers[0].userId,
        assignmentReason: 'Initial assignment',
      }
    });
  }

  for (const instructor of instructors) {
    await prisma.rFIDTags.create({
      data: {
        tagNumber: instructor.rfidTag,
        tagType: 'INSTRUCTOR_CARD',
        assignedAt: faker.date.past(),
        status: 'ACTIVE',
        instructorId: instructor.instructorId,
        assignedBy: adminUsers[0].userId,
        assignmentReason: 'Initial assignment',
      }
    });
  }

  // 16. Create RFID Readers
  console.log('📡 Creating RFID readers...');
  for (const room of rooms) {
    await prisma.rFIDReader.create({
      data: {
        roomId: room.roomId,
        deviceId: room.readerId,
        deviceName: `RFID Reader ${room.roomNo}`,
        components: { antenna: 'Omni-directional', power: 'AC' },
        assemblyDate: faker.date.past(),
        lastCalibration: faker.date.past(),
        nextCalibration: faker.date.future(),
        ipAddress: faker.internet.ip(),
        status: 'ACTIVE',
        lastSeen: faker.date.recent(),
        testResults: { signal: 'Strong', battery: 'Good' },
      }
    });
  }

  // 17. Create some events
  console.log('📅 Creating events...');
  const events = [
    {
      title: 'Freshman Orientation',
      description: 'Welcome event for new students',
      eventType: 'ORIENTATION',
      eventDate: new Date('2024-08-26'),
      location: 'Main Auditorium',
      capacity: 500,
    },
    {
      title: 'Midterm Examinations',
      description: 'Midterm examination period',
      eventType: 'ACADEMIC',
      eventDate: new Date('2024-10-15'),
      location: 'Various Classrooms',
      capacity: 1000,
    },
    {
      title: 'Christmas Party',
      description: 'Annual Christmas celebration',
      eventType: 'SOCIAL',
      eventDate: new Date('2024-12-15'),
      location: 'Gymnasium',
      capacity: 800,
    },
  ];

  for (const event of events) {
    await prisma.event.create({
      data: {
        createdBy: adminUsers[0].userId,
        title: event.title,
        description: event.description,
        eventType: event.eventType as any,
        eventDate: event.eventDate,
        location: event.location,
        capacity: event.capacity,
        isPublic: true,
        requiresRegistration: false,
        status: 'SCHEDULED',
        priority: 'NORMAL',
      }
    });
  }

  // 18. Create some announcements
  console.log('📢 Creating announcements...');
  
  // Admin-created general announcements
  const adminAnnouncements = [
    {
      title: 'Welcome to First Semester 2024-2025',
      content: 'Welcome back students! Classes begin on August 26, 2024.',
      isGeneral: true,
    },
    {
      title: 'Midterm Examination Schedule',
      content: 'Midterm examinations will be held from October 15-19, 2024.',
      isGeneral: true,
    },
    {
      title: 'Christmas Break Announcement',
      content: 'Classes will be suspended from December 20, 2024 to January 5, 2025.',
      isGeneral: true,
    },
  ];

  for (const announcement of adminAnnouncements) {
    await prisma.announcement.create({
      data: {
        createdby: adminUsers[0].userId,
        userType: 'ADMIN',
        title: announcement.title,
        content: announcement.content,
        isGeneral: announcement.isGeneral,
        status: 'ACTIVE',
        priority: 'NORMAL',
      }
    });
  }

  // Instructor-created subject-specific announcements
  const instructorAnnouncements = [
    {
      title: 'Programming Fundamentals - Assignment Due',
      content: 'Please submit your programming assignment by Friday. Late submissions will not be accepted.',
      isGeneral: false,
    },
    {
      title: 'Database Management - Lab Schedule Change',
      content: 'Next week\'s lab session will be moved to Wednesday due to system maintenance.',
      isGeneral: false,
    },
    {
      title: 'Web Development - Project Guidelines',
      content: 'Project guidelines and requirements have been posted. Please review before starting your project.',
      isGeneral: false,
    },
    {
      title: 'Software Engineering - Team Formation',
      content: 'Team formation for the final project will begin next week. Please prepare your team proposals.',
      isGeneral: false,
    },
    {
      title: 'Computer Networks - Exam Review',
      content: 'Exam review session will be held on Thursday. Bring your questions!',
      isGeneral: false,
    },
    {
      title: 'Business Ethics - Case Study Discussion',
      content: 'Prepare for tomorrow\'s case study discussion on corporate social responsibility.',
      isGeneral: false,
    },
    {
      title: 'Financial Accounting - Quiz Reminder',
      content: 'Quiz on Chapter 3 will be held next Monday. Study the material thoroughly.',
      isGeneral: false,
    },
    {
      title: 'Engineering Mathematics - Office Hours',
      content: 'Additional office hours available this week for students needing help with calculus.',
      isGeneral: false,
    },
  ];

  // Create instructor announcements linked to their subjects
  for (let i = 0; i < instructorAnnouncements.length; i++) {
    const announcement = instructorAnnouncements[i];
    const subject = subjects[i % subjects.length];
    const instructor = instructors.find(inst => 
      inst.departmentId === subject.departmentId
    ) || instructors[i % instructors.length];
    
    await prisma.announcement.create({
      data: {
        createdby: instructor.instructorId, // instructorId is the same as userId
        userType: 'TEACHER',
        title: announcement.title,
        content: announcement.content,
        isGeneral: announcement.isGeneral,
        subjectId: subject.subjectId,
        instructorId: instructor.instructorId,
        status: 'ACTIVE',
        priority: faker.helpers.arrayElement(['LOW', 'NORMAL', 'HIGH']),
      }
    });
  }

  // 19. Populate RFIDLogs
  console.log('📋 Populating RFIDLogs...');
  const allTags = await prisma.rFIDTags.findMany();
  const allReaders = await prisma.rFIDReader.findMany();
  for (let i = 0; i < 200; i++) {
    const tag = faker.helpers.arrayElement(allTags);
    const reader = faker.helpers.arrayElement(allReaders);
    const userId = tag.studentId ? (await prisma.student.findUnique({ where: { studentId: tag.studentId } }))?.userId : tag.instructorId ? (await prisma.instructor.findUnique({ where: { instructorId: tag.instructorId } }))?.instructorId : null;
    if (!userId) continue;
    await prisma.rFIDLogs.create({
      data: {
        rfidTag: tag.tagNumber,
        readerId: reader.readerId,
        scanType: faker.helpers.arrayElement(['CHECK_IN', 'CHECK_OUT', 'VERIFICATION']),
        scanStatus: faker.helpers.arrayElement(['SUCCESS', 'FAILED', 'DUPLICATE']),
        location: String(reader.deviceName ?? 'Unknown Location'),
        timestamp: faker.date.between({ from: currentTrimester.startDate, to: currentTrimester.endDate }),
        userId: userId,
        userRole: tag.studentId ? 'STUDENT' : 'TEACHER',
        deviceInfo: { device: reader.deviceName },
        ipAddress: faker.internet.ip(),
      }
    });
  }

  // 20. Populate RFIDReaderLogs
  console.log('📋 Populating RFIDReaderLogs...');
  for (const reader of allReaders) {
    for (let i = 0; i < 5; i++) {
    await prisma.rFIDReaderLogs.create({
      data: {
          readerId: reader.readerId,
          eventType: faker.helpers.arrayElement(['SCAN_SUCCESS', 'SCAN_ERROR', 'CONNECTION_LOST', 'MAINTENANCE_REQUIRED']),
          severity: faker.helpers.arrayElement(['INFO', 'WARNING', 'ERROR']),
        message: faker.lorem.sentence(),
          details: { note: faker.lorem.words(3) },
        ipAddress: faker.internet.ip(),
          timestamp: faker.date.between({ from: currentTrimester.startDate, to: currentTrimester.endDate }),
        resolvedAt: faker.datatype.boolean() ? faker.date.recent() : null,
        resolution: faker.lorem.sentence(),
      }
    });
    }
  }

  // 21. Populate ReportLog
  console.log('📋 Populating ReportLog...');
  for (let i = 0; i < 10; i++) {
    await prisma.reportLog.create({
      data: {
        generatedBy: adminUsers[0].userId,
        reportType: faker.helpers.arrayElement(['ATTENDANCE_SUMMARY', 'USER_ACTIVITY', 'SYSTEM_ACTIVITY']),
        reportName: faker.lorem.words(3),
        description: faker.lorem.sentence(),
        startDate: faker.date.between({ from: currentTrimester.startDate, to: currentTrimester.endDate }),
        endDate: faker.date.between({ from: currentTrimester.startDate, to: currentTrimester.endDate }),
        status: faker.helpers.arrayElement(['PENDING', 'COMPLETED', 'FAILED']),
        filepath: `/reports/report${i + 1}.pdf`,
        fileSize: faker.number.int({ min: 1000, max: 100000 }),
        fileFormat: 'PDF',
        parameters: { filter: 'all' },
        error: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      }
    });
  }

  // 22. Populate SystemLogs
  console.log('📋 Populating SystemLogs...');
  for (let i = 0; i < 50; i++) {
    await prisma.systemLogs.create({
      data: {
        userId: faker.helpers.arrayElement(adminUsers).userId,
        actionType: faker.helpers.arrayElement(['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE']),
        module: faker.helpers.arrayElement(['USER', 'ATTENDANCE', 'COURSE', 'SYSTEM']),
        entityId: faker.number.int({ min: 1, max: 200 }) || 0,
        details: faker.lorem.sentence(),
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        timestamp: faker.date.between({ from: currentTrimester.startDate, to: currentTrimester.endDate }),
      }
    });
  }

  // 23. Populate RFIDTagAssignmentLog
  console.log('📋 Populating RFIDTagAssignmentLog...');
  for (const tag of allTags) {
    await prisma.rFIDTagAssignmentLog.create({
      data: {
        tagId: tag.tagId,
        action: faker.helpers.arrayElement(['ASSIGN', 'UNASSIGN']),
        assignedToType: tag.studentId ? 'STUDENT' : 'INSTRUCTOR',
        assignedToId: tag.studentId || tag.instructorId,
        assignedToName: tag.studentId
          ? ((await prisma.student.findUnique({ where: { studentId: tag.studentId } }))?.firstName ?? 'Student')
          : tag.instructorId
          ? ((await prisma.instructor.findUnique({ where: { instructorId: tag.instructorId } }))?.firstName ?? 'Instructor')
          : 'Unknown',
        performedBy: adminUsers[0].userId,
        performedByName: 'Admin',
        timestamp: faker.date.between({ from: currentTrimester.startDate, to: currentTrimester.endDate }),
        notes: faker.lorem.sentence(),
      }
    });
  }

  // 24. Populate AttendanceNotification
  console.log('📋 Populating AttendanceNotification...');
  const absences = await prisma.attendance.findMany({ where: { status: 'ABSENT' } });
  for (const absence of absences.slice(0, 30)) { // limit to 30 notifications
    await prisma.attendanceNotification.create({
      data: {
        studentId: absence.studentId!,
        attendanceId: absence.attendanceId,
        type: 'ABSENCE',
        message: String(`Student was absent on ${(absence.timestamp && absence.timestamp.toDateString()) || 'Unknown date'}`),
        recipient: faker.helpers.arrayElement(['PARENT', 'STUDENT', 'BOTH']),
        method: faker.helpers.arrayElement(['EMAIL', 'SMS', 'BOTH']),
        status: faker.helpers.arrayElement(['PENDING', 'SENT', 'FAILED']),
        sentAt: faker.date.between({ from: absence.timestamp, to: new Date() }) || absence.timestamp,
        createdAt: absence.timestamp,
      }
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log(`📊 Created ${students.length} students with attendance data spanning all three trimesters`);
  console.log(`👨‍🏫 Created ${instructors.length} instructors`);
  console.log(`📚 Created ${subjects.length} subjects with ${subjectSchedules.length} schedules`);
  console.log(`📋 Created ${sections.length} sections across ${allCourseOfferings.length} courses`);
  console.log(`📚 Created ${studentSchedules.length} student enrollments in subject schedules`);
  console.log(`📊 Generated ${attendanceRecords.length} attendance records`);
}

main()
  .catch(e => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });