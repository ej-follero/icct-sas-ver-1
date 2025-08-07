const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyOptimizations() {
  try {
    console.log('🚀 Applying database optimizations...');

    // Apply indexes with correct table names (PascalCase)
    console.log('📊 Creating strategic indexes...');
    
    const indexes = [
      // Attendance table indexes
      'CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON "Attendance"("studentId", "timestamp")',
      'CREATE INDEX IF NOT EXISTS idx_attendance_status_date ON "Attendance"("status", "timestamp")',
      'CREATE INDEX IF NOT EXISTS idx_attendance_subject_date ON "Attendance"("subjectSchedId", "timestamp")',
      'CREATE INDEX IF NOT EXISTS idx_attendance_student_status_date ON "Attendance"("studentId", "status", "timestamp")',
      
      // Student table indexes
      'CREATE INDEX IF NOT EXISTS idx_student_department_status ON "Student"("departmentId", "status")',
      'CREATE INDEX IF NOT EXISTS idx_student_course_year ON "Student"("courseId", "yearLevel")',
      'CREATE INDEX IF NOT EXISTS idx_student_search ON "Student"("firstName", "lastName", "studentIdNum")',
      'CREATE INDEX IF NOT EXISTS idx_student_department_course_status ON "Student"("departmentId", "courseId", "status")',
      
      // Related table indexes
      'CREATE INDEX IF NOT EXISTS idx_department_code ON "Department"("departmentCode")',
      'CREATE INDEX IF NOT EXISTS idx_course_code ON "CourseOffering"("courseCode")',
      'CREATE INDEX IF NOT EXISTS idx_subject_code ON "Subjects"("subjectCode")',
      
      // Partial indexes for active records
      'CREATE INDEX IF NOT EXISTS idx_student_active ON "Student"("status") WHERE "status" = \'ACTIVE\'',
      'CREATE INDEX IF NOT EXISTS idx_attendance_recent ON "Attendance"("timestamp") WHERE "timestamp" > NOW() - INTERVAL \'30 days\''
    ];

    for (const index of indexes) {
      try {
        await prisma.$executeRawUnsafe(index);
        console.log(`✅ Created index: ${index.split(' ')[2]}`);
      } catch (error) {
        console.log(`⚠️  Index already exists or error: ${index.split(' ')[2]} - ${error.message}`);
      }
    }

    // Create views with correct table names
    console.log('📈 Creating optimized views...');
    
    const views = [
      // Student attendance summary view
      `CREATE OR REPLACE VIEW student_attendance_summary AS
       SELECT 
           s."studentId",
           s."firstName",
           s."lastName",
           s."middleName",
           s."suffix",
           s."studentIdNum",
           s."email",
           s."phoneNumber",
           s."yearLevel",
           s."gender",
           s."status" as studentStatus,
           s."studentType",
           s."rfidTag",
           s."address",
           s."createdAt" as studentCreatedAt,
           s."updatedAt" as studentUpdatedAt,
           
           -- Department information
           d."departmentId",
           d."departmentName",
           d."departmentCode",
           
           -- Course information
           c."courseId",
           c."courseName",
           c."courseCode",
           
           -- Guardian information
           g."firstName" as guardianFirstName,
           g."lastName" as guardianLastName,
           g."email" as guardianEmail,
           g."phoneNumber" as guardianPhone,
           g."relationshipToStudent",
           
           -- Attendance statistics
           COUNT(CASE WHEN a."status" = 'PRESENT' THEN 1 END) as present_count,
           COUNT(CASE WHEN a."status" = 'LATE' THEN 1 END) as late_count,
           COUNT(CASE WHEN a."status" = 'ABSENT' THEN 1 END) as absent_count,
           COUNT(CASE WHEN a."status" = 'EXCUSED' THEN 1 END) as excused_count,
           COUNT(a."attendanceId") as total_attendance,
           
           -- Calculated attendance rate
           CASE 
               WHEN COUNT(a."attendanceId") > 0 THEN 
                   ROUND(
                       (COUNT(CASE WHEN a."status" IN ('PRESENT', 'LATE') THEN 1 END) * 100.0 / 
                        COUNT(a."attendanceId")), 1
                   )
               ELSE 0 
           END as attendance_rate,
           
           -- Risk level calculation
           CASE 
               WHEN COUNT(a."attendanceId") = 0 THEN 'NONE'
               WHEN (COUNT(CASE WHEN a."status" IN ('PRESENT', 'LATE') THEN 1 END) * 100.0 / COUNT(a."attendanceId")) >= 90 THEN 'NONE'
               WHEN (COUNT(CASE WHEN a."status" IN ('PRESENT', 'LATE') THEN 1 END) * 100.0 / COUNT(a."attendanceId")) >= 75 THEN 'LOW'
               WHEN (COUNT(CASE WHEN a."status" IN ('PRESENT', 'LATE') THEN 1 END) * 100.0 / COUNT(a."attendanceId")) >= 60 THEN 'MEDIUM'
               ELSE 'HIGH'
           END as risk_level,
           
           -- Last attendance information
           MAX(a."timestamp") as last_attendance_date,
           MAX(CASE WHEN a."status" = 'PRESENT' THEN a."timestamp" END) as last_present_date,
           MAX(CASE WHEN a."status" = 'ABSENT' THEN a."timestamp" END) as last_absent_date
           
       FROM "Student" s
       LEFT JOIN "Department" d ON s."departmentId" = d."departmentId"
       LEFT JOIN "CourseOffering" c ON s."courseId" = c."courseId"
       LEFT JOIN "Guardian" g ON s."guardianId" = g."guardianId"
       LEFT JOIN "Attendance" a ON s."studentId" = a."studentId"
       
       GROUP BY 
           s."studentId", s."firstName", s."lastName", s."middleName", s."suffix", s."studentIdNum", 
           s."email", s."phoneNumber", s."yearLevel", s."gender", s."status", s."studentType", 
           s."rfidTag", s."address", s."createdAt", s."updatedAt",
           d."departmentId", d."departmentName", d."departmentCode",
           c."courseId", c."courseName", c."courseCode",
           g."firstName", g."lastName", g."email", g."phoneNumber", g."relationshipToStudent"`,

      // Daily attendance summary view
      `CREATE OR REPLACE VIEW daily_attendance_summary AS
       SELECT 
           DATE(a."timestamp") as attendance_date,
           COUNT(DISTINCT a."studentId") as total_students,
           COUNT(CASE WHEN a."status" = 'PRESENT' THEN 1 END) as present_count,
           COUNT(CASE WHEN a."status" = 'LATE' THEN 1 END) as late_count,
           COUNT(CASE WHEN a."status" = 'ABSENT' THEN 1 END) as absent_count,
           COUNT(CASE WHEN a."status" = 'EXCUSED' THEN 1 END) as excused_count,
           COUNT(a."attendanceId") as total_attendance,
           ROUND(
               (COUNT(CASE WHEN a."status" IN ('PRESENT', 'LATE') THEN 1 END) * 100.0 / 
                NULLIF(COUNT(a."attendanceId"), 0)), 1
           ) as daily_attendance_rate,
           d."departmentId",
           d."departmentName",
           d."departmentCode"
       FROM "Attendance" a
       LEFT JOIN "Student" s ON a."studentId" = s."studentId"
       LEFT JOIN "Department" d ON s."departmentId" = d."departmentId"
       WHERE a."studentId" IS NOT NULL
       GROUP BY DATE(a."timestamp"), d."departmentId", d."departmentName", d."departmentCode"`
    ];

    for (const view of views) {
      try {
        await prisma.$executeRawUnsafe(view);
        console.log('✅ Created view successfully');
      } catch (error) {
        console.log(`⚠️  View creation error: ${error.message}`);
      }
    }

    console.log('🎉 Database optimizations applied successfully!');
    
    // Verify optimizations
    console.log('🔍 Verifying optimizations...');
    
    const indexCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE tablename IN ('Attendance', 'Student', 'Department', 'CourseOffering', 'Subjects')
    `;
    
    const viewCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM pg_views 
      WHERE viewname LIKE '%attendance%'
    `;
    
    console.log(`📊 Found ${indexCount[0].count} indexes and ${viewCount[0].count} views`);

    // Test the new view
    try {
      const viewTest = await prisma.$queryRaw`SELECT COUNT(*) as count FROM student_attendance_summary`;
      console.log(`✅ View test successful: ${viewTest[0].count} records in view`);
    } catch (error) {
      console.log(`❌ View test failed: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Error applying optimizations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyOptimizations(); 