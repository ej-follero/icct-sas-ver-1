-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'BLOCKED');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('LECTURE', 'LABORATORY', 'CONFERENCE', 'OFFICE', 'OTHER');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SemesterStatus" AS ENUM ('UPCOMING', 'CURRENT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'DROPPED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "DepartmentType" AS ENUM ('ACADEMIC', 'ADMINISTRATIVE');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('LECTURE', 'LABORATORY', 'HYBRID', 'THESIS', 'RESEARCH', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "SubjectStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('REGULAR', 'MAKEUP', 'SPECIAL', 'REVIEW', 'EXAM');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'POSTPONED', 'COMPLETED', 'CONFLICT');

-- CreateEnum
CREATE TYPE "AttendanceType" AS ENUM ('RFID_SCAN', 'MANUAL_ENTRY', 'ONLINE');

-- CreateEnum
CREATE TYPE "AttendanceVerification" AS ENUM ('PENDING', 'VERIFIED', 'DISPUTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "StudentType" AS ENUM ('IRREGULAR', 'REGULAR');

-- CreateEnum
CREATE TYPE "InstructorType" AS ENUM ('FULL_TIME', 'PART_TIME');

-- CreateEnum
CREATE TYPE "GuardianType" AS ENUM ('PARENT', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "UserGender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "yearLevel" AS ENUM ('FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR');

-- CreateEnum
CREATE TYPE "SemesterType" AS ENUM ('FIRST_SEMESTER', 'SECOND_SEMESTER', 'THIRD_SEMESTER');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('LECTURE', 'LAB');

-- CreateEnum
CREATE TYPE "SectionStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('MANDATORY', 'ELECTIVE');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "InstructorAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('ATTENDANCE_SUMMARY', 'STUDENT_ATTENDANCE', 'INSTRUCTOR_ATTENDANCE', 'COURSE_ATTENDANCE', 'DEPARTMENT_ATTENDANCE', 'RFID_ACTIVITY', 'SYSTEM_ACTIVITY', 'USER_ACTIVITY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RFIDStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOST', 'DAMAGED', 'EXPIRED', 'REPLACED', 'RESERVED');

-- CreateEnum
CREATE TYPE "idtype" AS ENUM ('STUDENT', 'INSTRUCTOR');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RFIDEventType" AS ENUM ('SCAN_SUCCESS', 'SCAN_ERROR', 'CONNECTION_LOST', 'CONNECTION_RESTORED', 'BATTERY_LOW', 'BATTERY_CRITICAL', 'SIGNAL_WEAK', 'SIGNAL_LOST', 'RESTART', 'CONFIGURATION_CHANGE', 'FIRMWARE_UPDATE', 'MAINTENANCE_REQUIRED', 'SYSTEM_ERROR');

-- CreateEnum
CREATE TYPE "LogSeverity" AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ScanType" AS ENUM ('CHECK_IN', 'CHECK_OUT', 'VERIFICATION', 'TEST_SCAN', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('SUCCESS', 'FAILED', 'DUPLICATE', 'INVALID_TAG', 'EXPIRED_TAG', 'UNAUTHORIZED', 'SYSTEM_ERROR');

-- CreateEnum
CREATE TYPE "ReaderStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TESTING', 'CALIBRATION', 'REPAIR', 'OFFLINE', 'ERROR');

-- CreateEnum
CREATE TYPE "TagType" AS ENUM ('STUDENT_CARD', 'INSTRUCTOR_CARD', 'TEMPORARY_PASS', 'VISITOR_PASS', 'MAINTENANCE', 'TEST');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ACADEMIC', 'SOCIAL', 'SPORTS', 'ORIENTATION', 'GRADUATION', 'MEETING', 'WORKSHOP', 'SEMINAR', 'OTHER');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateTable
CREATE TABLE "User" (
    "userId" SERIAL NOT NULL,
    "userName" TEXT NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLogin" TIMESTAMP(3),
    "lastPasswordChange" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Student" (
    "studentId" SERIAL NOT NULL,
    "studentIdNum" TEXT NOT NULL,
    "rfidTag" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "suffix" TEXT,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "img" TEXT,
    "gender" "UserGender" NOT NULL,
    "birthDate" TIMESTAMP(3),
    "nationality" TEXT,
    "studentType" "StudentType" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "yearLevel" "yearLevel" NOT NULL,
    "courseId" INTEGER,
    "departmentId" INTEGER,
    "totalSubjects" INTEGER NOT NULL DEFAULT 0,
    "totalAttendance" INTEGER NOT NULL DEFAULT 0,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "guardianId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("studentId")
);

-- CreateTable
CREATE TABLE "Guardian" (
    "guardianId" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "suffix" TEXT,
    "address" TEXT NOT NULL,
    "img" TEXT,
    "gender" "UserGender" NOT NULL,
    "guardianType" "GuardianType" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "occupation" TEXT,
    "workplace" TEXT,
    "emergencyContact" TEXT,
    "relationshipToStudent" TEXT NOT NULL,
    "totalStudents" INTEGER NOT NULL DEFAULT 0,
    "lastLogin" TIMESTAMP(3),
    "notificationPreferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("guardianId")
);

-- CreateTable
CREATE TABLE "Instructor" (
    "instructorId" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "suffix" TEXT,
    "img" TEXT,
    "gender" "UserGender" NOT NULL,
    "instructorType" "InstructorType" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "departmentId" INTEGER NOT NULL,
    "officeLocation" TEXT,
    "officeHours" TEXT,
    "specialization" TEXT,
    "totalSubjects" INTEGER NOT NULL DEFAULT 0,
    "totalStudents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rfidTag" TEXT NOT NULL,

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("instructorId")
);

-- CreateTable
CREATE TABLE "Room" (
    "roomId" SERIAL NOT NULL,
    "roomNo" TEXT NOT NULL,
    "roomType" "RoomType" NOT NULL,
    "roomCapacity" INTEGER NOT NULL,
    "roomBuildingLoc" TEXT NOT NULL,
    "roomFloorLoc" TEXT NOT NULL,
    "readerId" TEXT NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastMaintenance" TIMESTAMP(3),
    "nextMaintenance" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("roomId")
);

-- CreateTable
CREATE TABLE "Semester" (
    "semesterId" SERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "year" INTEGER NOT NULL,
    "semesterType" "SemesterType" NOT NULL,
    "status" "SemesterStatus" NOT NULL DEFAULT 'UPCOMING',
    "registrationStart" TIMESTAMP(3),
    "registrationEnd" TIMESTAMP(3),
    "enrollmentStart" TIMESTAMP(3),
    "enrollmentEnd" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("semesterId")
);

-- CreateTable
CREATE TABLE "StudentSection" (
    "studentSectionId" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "enrollmentStatus" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dropDate" TIMESTAMP(3),
    "isRegular" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentSection_pkey" PRIMARY KEY ("studentId","sectionId")
);

-- CreateTable
CREATE TABLE "Section" (
    "sectionId" SERIAL NOT NULL,
    "sectionName" TEXT NOT NULL,
    "sectionType" "SectionType" NOT NULL,
    "sectionCapacity" INTEGER NOT NULL,
    "sectionStatus" "SectionStatus" NOT NULL,
    "yearLevel" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" "SemesterType" NOT NULL,
    "currentEnrollment" INTEGER NOT NULL DEFAULT 0,
    "roomAssignment" TEXT,
    "scheduleNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId" INTEGER NOT NULL,
    "semesterId" INTEGER NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("sectionId")
);

-- CreateTable
CREATE TABLE "CourseOffering" (
    "courseId" SERIAL NOT NULL,
    "courseCode" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "courseType" "CourseType" NOT NULL,
    "courseStatus" "CourseStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "departmentId" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" "SemesterType" NOT NULL,
    "totalUnits" INTEGER NOT NULL,
    "totalSections" INTEGER NOT NULL DEFAULT 0,
    "totalStudents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "semesterId" INTEGER NOT NULL,
    "major" TEXT,

    CONSTRAINT "CourseOffering_pkey" PRIMARY KEY ("courseId")
);

-- CreateTable
CREATE TABLE "Department" (
    "departmentId" SERIAL NOT NULL,
    "departmentName" TEXT NOT NULL,
    "departmentCode" TEXT NOT NULL,
    "departmentType" "DepartmentType" NOT NULL DEFAULT 'ACADEMIC',
    "departmentDescription" TEXT NOT NULL,
    "departmentStatus" "Status" NOT NULL DEFAULT 'ACTIVE',
    "headOfDepartment" INTEGER,
    "location" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "totalInstructors" INTEGER NOT NULL DEFAULT 0,
    "totalStudents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("departmentId")
);

-- CreateTable
CREATE TABLE "Subjects" (
    "subjectId" SERIAL NOT NULL,
    "subjectName" TEXT NOT NULL,
    "subjectCode" TEXT NOT NULL,
    "subjectType" "SubjectType" NOT NULL DEFAULT 'LECTURE',
    "status" "SubjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "lectureUnits" INTEGER NOT NULL DEFAULT 0,
    "labUnits" INTEGER NOT NULL DEFAULT 0,
    "creditedUnits" INTEGER NOT NULL DEFAULT 0,
    "totalHours" INTEGER NOT NULL,
    "prerequisites" TEXT,
    "courseId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" "SemesterType" NOT NULL,
    "maxStudents" INTEGER NOT NULL DEFAULT 30,
    "currentEnrollment" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subjects_pkey" PRIMARY KEY ("subjectId")
);

-- CreateTable
CREATE TABLE "SubjectSchedule" (
    "subjectSchedId" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "day" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slots" INTEGER NOT NULL DEFAULT 0,
    "scheduleType" "ScheduleType" NOT NULL DEFAULT 'REGULAR',
    "status" "ScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
    "semesterId" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "maxStudents" INTEGER NOT NULL DEFAULT 30,
    "currentEnrollment" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectSchedule_pkey" PRIMARY KEY ("subjectSchedId")
);

-- CreateTable
CREATE TABLE "StudentSchedule" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "droppedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "StudentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "attendanceId" SERIAL NOT NULL,
    "eventId" INTEGER,
    "scheduleId" INTEGER,
    "userId" INTEGER NOT NULL,
    "userRole" "Role" NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "attendanceType" "AttendanceType" NOT NULL,
    "verification" "AttendanceVerification" NOT NULL DEFAULT 'PENDING',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutTime" TIMESTAMP(3),
    "duration" INTEGER,
    "notes" TEXT,
    "deviceInfo" JSONB,
    "location" TEXT,
    "verifiedBy" INTEGER,
    "verificationTime" TIMESTAMP(3),
    "verificationNotes" TEXT,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("attendanceId")
);

-- CreateTable
CREATE TABLE "Event" (
    "eventId" SERIAL NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "capacity" INTEGER,
    "registeredCount" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "requiresRegistration" BOOLEAN NOT NULL DEFAULT false,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "imageUrl" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "RFIDTags" (
    "tagId" SERIAL NOT NULL,
    "tagNumber" TEXT NOT NULL,
    "tagType" "TagType" NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" "RFIDStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "studentId" INTEGER,
    "instructorId" INTEGER,
    "assignedBy" INTEGER,
    "assignmentReason" TEXT,

    CONSTRAINT "RFIDTags_pkey" PRIMARY KEY ("tagId")
);

-- CreateTable
CREATE TABLE "RFIDReader" (
    "readerId" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT,
    "components" JSONB NOT NULL,
    "assemblyDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCalibration" TIMESTAMP(3),
    "nextCalibration" TIMESTAMP(3),
    "ipAddress" TEXT,
    "status" "ReaderStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "testResults" JSONB,

    CONSTRAINT "RFIDReader_pkey" PRIMARY KEY ("readerId")
);

-- CreateTable
CREATE TABLE "RFIDLogs" (
    "logsId" SERIAL NOT NULL,
    "rfidTag" TEXT NOT NULL,
    "readerId" INTEGER NOT NULL,
    "scanType" "ScanType" NOT NULL,
    "scanStatus" "ScanStatus" NOT NULL DEFAULT 'SUCCESS',
    "location" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "userRole" "Role" NOT NULL,
    "deviceInfo" JSONB,
    "ipAddress" TEXT,

    CONSTRAINT "RFIDLogs_pkey" PRIMARY KEY ("logsId")
);

-- CreateTable
CREATE TABLE "RFIDReaderLogs" (
    "id" SERIAL NOT NULL,
    "readerId" INTEGER NOT NULL,
    "eventType" "RFIDEventType" NOT NULL,
    "severity" "LogSeverity" NOT NULL DEFAULT 'INFO',
    "message" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,

    CONSTRAINT "RFIDReaderLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportLog" (
    "reportId" SERIAL NOT NULL,
    "generatedBy" INTEGER NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "reportName" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "filepath" TEXT,
    "fileSize" INTEGER,
    "fileFormat" TEXT,
    "parameters" JSONB,
    "error" TEXT,

    CONSTRAINT "ReportLog_pkey" PRIMARY KEY ("reportId")
);

-- CreateTable
CREATE TABLE "SystemLogs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "actionType" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "entityId" INTEGER,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "announcementId" SERIAL NOT NULL,
    "createdby" INTEGER NOT NULL,
    "userType" "Role" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isGeneral" BOOLEAN NOT NULL DEFAULT false,
    "subjectId" INTEGER,
    "sectionId" INTEGER,
    "instructorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("announcementId")
);

-- CreateTable
CREATE TABLE "_InstructorToSubjects" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_InstructorToSubjects_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AttendanceToInstructor" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AttendanceToInstructor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AttendanceToStudent" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AttendanceToStudent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AttendanceToSubjectSchedule" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AttendanceToSubjectSchedule_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "User_lastLogin_idx" ON "User"("lastLogin");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentIdNum_key" ON "Student"("studentIdNum");

-- CreateIndex
CREATE UNIQUE INDEX "Student_rfidTag_key" ON "Student"("rfidTag");

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_phoneNumber_key" ON "Student"("phoneNumber");

-- CreateIndex
CREATE INDEX "Student_studentIdNum_idx" ON "Student"("studentIdNum");

-- CreateIndex
CREATE INDEX "Student_rfidTag_idx" ON "Student"("rfidTag");

-- CreateIndex
CREATE INDEX "Student_courseId_yearLevel_idx" ON "Student"("courseId", "yearLevel");

-- CreateIndex
CREATE INDEX "Student_departmentId_status_idx" ON "Student"("departmentId", "status");

-- CreateIndex
CREATE INDEX "Student_studentType_status_idx" ON "Student"("studentType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_email_key" ON "Guardian"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_phoneNumber_key" ON "Guardian"("phoneNumber");

-- CreateIndex
CREATE INDEX "Guardian_guardianType_status_idx" ON "Guardian"("guardianType", "status");

-- CreateIndex
CREATE INDEX "Guardian_email_idx" ON "Guardian"("email");

-- CreateIndex
CREATE INDEX "Guardian_phoneNumber_idx" ON "Guardian"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_email_key" ON "Instructor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_phoneNumber_key" ON "Instructor"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_rfidTag_key" ON "Instructor"("rfidTag");

-- CreateIndex
CREATE INDEX "Instructor_departmentId_status_idx" ON "Instructor"("departmentId", "status");

-- CreateIndex
CREATE INDEX "Instructor_instructorType_idx" ON "Instructor"("instructorType");

-- CreateIndex
CREATE INDEX "Instructor_rfidTag_idx" ON "Instructor"("rfidTag");

-- CreateIndex
CREATE UNIQUE INDEX "Room_roomNo_key" ON "Room"("roomNo");

-- CreateIndex
CREATE UNIQUE INDEX "Room_readerId_key" ON "Room"("readerId");

-- CreateIndex
CREATE INDEX "Room_roomNo_idx" ON "Room"("roomNo");

-- CreateIndex
CREATE INDEX "Room_roomType_status_idx" ON "Room"("roomType", "status");

-- CreateIndex
CREATE INDEX "Room_roomBuildingLoc_roomFloorLoc_idx" ON "Room"("roomBuildingLoc", "roomFloorLoc");

-- CreateIndex
CREATE INDEX "Room_readerId_idx" ON "Room"("readerId");

-- CreateIndex
CREATE INDEX "Semester_year_semesterType_idx" ON "Semester"("year", "semesterType");

-- CreateIndex
CREATE INDEX "Semester_status_idx" ON "Semester"("status");

-- CreateIndex
CREATE INDEX "Semester_startDate_endDate_idx" ON "Semester"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "StudentSection_studentId_enrollmentStatus_idx" ON "StudentSection"("studentId", "enrollmentStatus");

-- CreateIndex
CREATE INDEX "StudentSection_sectionId_enrollmentStatus_idx" ON "StudentSection"("sectionId", "enrollmentStatus");

-- CreateIndex
CREATE INDEX "StudentSection_enrollmentDate_idx" ON "StudentSection"("enrollmentDate");

-- CreateIndex
CREATE UNIQUE INDEX "Section_sectionName_key" ON "Section"("sectionName");

-- CreateIndex
CREATE INDEX "Section_sectionName_idx" ON "Section"("sectionName");

-- CreateIndex
CREATE INDEX "Section_courseId_sectionStatus_idx" ON "Section"("courseId", "sectionStatus");

-- CreateIndex
CREATE INDEX "Section_yearLevel_academicYear_idx" ON "Section"("yearLevel", "academicYear");

-- CreateIndex
CREATE INDEX "Section_roomAssignment_idx" ON "Section"("roomAssignment");

-- CreateIndex
CREATE UNIQUE INDEX "CourseOffering_courseCode_key" ON "CourseOffering"("courseCode");

-- CreateIndex
CREATE INDEX "CourseOffering_courseCode_idx" ON "CourseOffering"("courseCode");

-- CreateIndex
CREATE INDEX "CourseOffering_departmentId_courseStatus_idx" ON "CourseOffering"("departmentId", "courseStatus");

-- CreateIndex
CREATE INDEX "CourseOffering_academicYear_semester_idx" ON "CourseOffering"("academicYear", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "Department_departmentCode_key" ON "Department"("departmentCode");

-- CreateIndex
CREATE INDEX "Department_departmentCode_idx" ON "Department"("departmentCode");

-- CreateIndex
CREATE INDEX "Department_departmentType_departmentStatus_idx" ON "Department"("departmentType", "departmentStatus");

-- CreateIndex
CREATE INDEX "Department_headOfDepartment_idx" ON "Department"("headOfDepartment");

-- CreateIndex
CREATE UNIQUE INDEX "Subjects_subjectCode_key" ON "Subjects"("subjectCode");

-- CreateIndex
CREATE INDEX "Subjects_subjectCode_idx" ON "Subjects"("subjectCode");

-- CreateIndex
CREATE INDEX "Subjects_courseId_status_idx" ON "Subjects"("courseId", "status");

-- CreateIndex
CREATE INDEX "Subjects_departmentId_status_idx" ON "Subjects"("departmentId", "status");

-- CreateIndex
CREATE INDEX "Subjects_academicYear_semester_idx" ON "Subjects"("academicYear", "semester");

-- CreateIndex
CREATE INDEX "SubjectSchedule_subjectId_day_startTime_idx" ON "SubjectSchedule"("subjectId", "day", "startTime");

-- CreateIndex
CREATE INDEX "SubjectSchedule_instructorId_day_startTime_idx" ON "SubjectSchedule"("instructorId", "day", "startTime");

-- CreateIndex
CREATE INDEX "SubjectSchedule_roomId_day_startTime_idx" ON "SubjectSchedule"("roomId", "day", "startTime");

-- CreateIndex
CREATE INDEX "SubjectSchedule_sectionId_status_idx" ON "SubjectSchedule"("sectionId", "status");

-- CreateIndex
CREATE INDEX "SubjectSchedule_semesterId_academicYear_idx" ON "SubjectSchedule"("semesterId", "academicYear");

-- CreateIndex
CREATE INDEX "StudentSchedule_studentId_status_idx" ON "StudentSchedule"("studentId", "status");

-- CreateIndex
CREATE INDEX "StudentSchedule_scheduleId_status_idx" ON "StudentSchedule"("scheduleId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSchedule_studentId_scheduleId_key" ON "StudentSchedule"("studentId", "scheduleId");

-- CreateIndex
CREATE INDEX "Attendance_userId_timestamp_idx" ON "Attendance"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "Attendance_eventId_timestamp_idx" ON "Attendance"("eventId", "timestamp");

-- CreateIndex
CREATE INDEX "Attendance_scheduleId_timestamp_idx" ON "Attendance"("scheduleId", "timestamp");

-- CreateIndex
CREATE INDEX "Attendance_status_verification_idx" ON "Attendance"("status", "verification");

-- CreateIndex
CREATE INDEX "Attendance_attendanceType_timestamp_idx" ON "Attendance"("attendanceType", "timestamp");

-- CreateIndex
CREATE INDEX "Event_eventDate_idx" ON "Event"("eventDate");

-- CreateIndex
CREATE INDEX "Event_eventType_idx" ON "Event"("eventType");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_createdBy_status_idx" ON "Event"("createdBy", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDTags_tagNumber_key" ON "RFIDTags"("tagNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDTags_studentId_key" ON "RFIDTags"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDTags_instructorId_key" ON "RFIDTags"("instructorId");

-- CreateIndex
CREATE INDEX "RFIDTags_status_idx" ON "RFIDTags"("status");

-- CreateIndex
CREATE INDEX "RFIDTags_tagType_idx" ON "RFIDTags"("tagType");

-- CreateIndex
CREATE INDEX "RFIDTags_expiresAt_idx" ON "RFIDTags"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDTags_studentId_instructorId_key" ON "RFIDTags"("studentId", "instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDReader_roomId_key" ON "RFIDReader"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDReader_deviceId_key" ON "RFIDReader"("deviceId");

-- CreateIndex
CREATE INDEX "RFIDReader_status_idx" ON "RFIDReader"("status");

-- CreateIndex
CREATE INDEX "RFIDReader_lastSeen_idx" ON "RFIDReader"("lastSeen");

-- CreateIndex
CREATE INDEX "RFIDReader_deviceId_status_idx" ON "RFIDReader"("deviceId", "status");

-- CreateIndex
CREATE INDEX "RFIDLogs_rfidTag_timestamp_idx" ON "RFIDLogs"("rfidTag", "timestamp");

-- CreateIndex
CREATE INDEX "RFIDLogs_userId_userRole_idx" ON "RFIDLogs"("userId", "userRole");

-- CreateIndex
CREATE INDEX "RFIDLogs_readerId_timestamp_idx" ON "RFIDLogs"("readerId", "timestamp");

-- CreateIndex
CREATE INDEX "RFIDReaderLogs_readerId_eventType_idx" ON "RFIDReaderLogs"("readerId", "eventType");

-- CreateIndex
CREATE INDEX "RFIDReaderLogs_timestamp_idx" ON "RFIDReaderLogs"("timestamp");

-- CreateIndex
CREATE INDEX "RFIDReaderLogs_severity_idx" ON "RFIDReaderLogs"("severity");

-- CreateIndex
CREATE INDEX "ReportLog_generatedBy_reportType_idx" ON "ReportLog"("generatedBy", "reportType");

-- CreateIndex
CREATE INDEX "ReportLog_createdAt_idx" ON "ReportLog"("createdAt");

-- CreateIndex
CREATE INDEX "SystemLogs_userId_actionType_idx" ON "SystemLogs"("userId", "actionType");

-- CreateIndex
CREATE INDEX "SystemLogs_module_entityId_idx" ON "SystemLogs"("module", "entityId");

-- CreateIndex
CREATE INDEX "Announcement_createdby_userType_idx" ON "Announcement"("createdby", "userType");

-- CreateIndex
CREATE INDEX "_InstructorToSubjects_B_index" ON "_InstructorToSubjects"("B");

-- CreateIndex
CREATE INDEX "_AttendanceToInstructor_B_index" ON "_AttendanceToInstructor"("B");

-- CreateIndex
CREATE INDEX "_AttendanceToStudent_B_index" ON "_AttendanceToStudent"("B");

-- CreateIndex
CREATE INDEX "_AttendanceToSubjectSchedule_B_index" ON "_AttendanceToSubjectSchedule"("B");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "CourseOffering"("courseId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("departmentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("guardianId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSection" ADD CONSTRAINT "StudentSection_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("sectionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSection" ADD CONSTRAINT "StudentSection_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("studentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "CourseOffering"("courseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("semesterId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("semesterId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_headOfDepartment_fkey" FOREIGN KEY ("headOfDepartment") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subjects" ADD CONSTRAINT "Subjects_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "CourseOffering"("courseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subjects" ADD CONSTRAINT "Subjects_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectSchedule" ADD CONSTRAINT "SubjectSchedule_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("instructorId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectSchedule" ADD CONSTRAINT "SubjectSchedule_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("roomId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectSchedule" ADD CONSTRAINT "SubjectSchedule_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("sectionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectSchedule" ADD CONSTRAINT "SubjectSchedule_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("semesterId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectSchedule" ADD CONSTRAINT "SubjectSchedule_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subjects"("subjectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSchedule" ADD CONSTRAINT "StudentSchedule_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "SubjectSchedule"("subjectSchedId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSchedule" ADD CONSTRAINT "StudentSchedule_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("studentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("eventId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdByAdmin_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDTags" ADD CONSTRAINT "RFIDTags_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDTags" ADD CONSTRAINT "RFIDTags_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("instructorId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDTags" ADD CONSTRAINT "RFIDTags_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("studentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDReader" ADD CONSTRAINT "RFIDReader_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("roomId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDLogs" ADD CONSTRAINT "RFIDLogs_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "RFIDReader"("readerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDLogs" ADD CONSTRAINT "RFIDLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDReaderLogs" ADD CONSTRAINT "RFIDReaderLogs_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "RFIDReader"("readerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportLog" ADD CONSTRAINT "ReportLog_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemLogs" ADD CONSTRAINT "SystemLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdby_fkey" FOREIGN KEY ("createdby") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("instructorId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("sectionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subjects"("subjectId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstructorToSubjects" ADD CONSTRAINT "_InstructorToSubjects_A_fkey" FOREIGN KEY ("A") REFERENCES "Instructor"("instructorId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstructorToSubjects" ADD CONSTRAINT "_InstructorToSubjects_B_fkey" FOREIGN KEY ("B") REFERENCES "Subjects"("subjectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttendanceToInstructor" ADD CONSTRAINT "_AttendanceToInstructor_A_fkey" FOREIGN KEY ("A") REFERENCES "Attendance"("attendanceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttendanceToInstructor" ADD CONSTRAINT "_AttendanceToInstructor_B_fkey" FOREIGN KEY ("B") REFERENCES "Instructor"("instructorId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttendanceToStudent" ADD CONSTRAINT "_AttendanceToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "Attendance"("attendanceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttendanceToStudent" ADD CONSTRAINT "_AttendanceToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("studentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttendanceToSubjectSchedule" ADD CONSTRAINT "_AttendanceToSubjectSchedule_A_fkey" FOREIGN KEY ("A") REFERENCES "Attendance"("attendanceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttendanceToSubjectSchedule" ADD CONSTRAINT "_AttendanceToSubjectSchedule_B_fkey" FOREIGN KEY ("B") REFERENCES "SubjectSchedule"("subjectSchedId") ON DELETE CASCADE ON UPDATE CASCADE;
