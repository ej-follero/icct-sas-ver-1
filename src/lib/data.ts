// TEMPORARY DATA

import { UserGender, InstructorType, Status } from "@/types/enums";
import { Teacher } from "@/types/teacher";

// Removed hardcoded role - now using actual user role from database

type StudentType = "regular" | "irregular" | "transferee";

type Student = {
  studentId: number;
  studentIdNum: string;
  rfidTag: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  email: string;
  phoneNumber: string;
  address: string;
  img?: string;
  gender: "MALE" | "FEMALE";
  studentType: "REGULAR" | "IRREGULAR";
  status: "ACTIVE" | "INACTIVE";
  yearLevel: "FIRST_YEAR" | "SECOND_YEAR" | "THIRD_YEAR" | "FOURTH_YEAR";
  courseId?: number;
  departmentId?: number;
  guardianId: number;
  userId: number;
  section_name?: string;
  guardian_name?: string;
};

export const instructorsData: Teacher[] = [
  {
    instructorId: 1,
    email: "john.doe@example.com",
    phoneNumber: "+1234567890",
    firstName: "John",
    middleName: "Robert",
    lastName: "Doe",
    suffix: "Jr.",
    img: "/images/instructors/john-doe.jpg",
    gender: UserGender.MALE,
    instructorType: InstructorType.FULL_TIME,
    status: Status.ACTIVE,
    departmentId: 1,
    departmentName: "Computer Science",
    rfidTag: "RFID001",
    rfidtagNumber: "TAG001",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Add more mock data as needed
];

export const teachersData = [
  {
    id: 1,
    teacherId: "1234567890",
    name: "John Doe",
    email: "john@doe.com",
    photo:
      "https://images.pexels.com/photos/2888150/pexels-photo-2888150.jpeg?auto=compress&cs=tinysrgb&w=1200",
    phone: "1234567890",
    subjects: ["Math", "Geometry"],
    classes: ["1B", "2A", "3C"],
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 2,
    teacherId: "1234567890",
    name: "Jane Doe",
    email: "jane@doe.com",
    photo:
      "https://images.pexels.com/photos/936126/pexels-photo-936126.jpeg?auto=compress&cs=tinysrgb&w=1200",
    phone: "1234567890",
    subjects: ["Physics", "Chemistry"],
    classes: ["5A", "4B", "3C"],
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 3,
    teacherId: "1234567890",
    name: "Mike Geller",
    email: "mike@geller.com",
    photo:
      "https://images.pexels.com/photos/428328/pexels-photo-428328.jpeg?auto=compress&cs=tinysrgb&w=1200",
    phone: "1234567890",
    subjects: ["Biology"],
    classes: ["5A", "4B", "3C"],
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 4,
    teacherId: "1234567890",
    name: "Jay French",
    email: "jay@gmail.com",
    photo:
      "https://images.pexels.com/photos/1187765/pexels-photo-1187765.jpeg?auto=compress&cs=tinysrgb&w=1200",
    phone: "1234567890",
    subjects: ["History"],
    classes: ["5A", "4B", "3C"],
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 5,
    teacherId: "1234567890",
    name: "Jane Smith",
    email: "jane@gmail.com",
    photo:
      "https://images.pexels.com/photos/1102341/pexels-photo-1102341.jpeg?auto=compress&cs=tinysrgb&w=1200",
    phone: "1234567890",
    subjects: ["Music", "History"],
    classes: ["5A", "4B", "3C"],
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 6,
    teacherId: "1234567890",
    name: "Anna Santiago",
    email: "anna@gmail.com",
    photo:
      "https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=1200",
    phone: "1234567890",
    subjects: ["Physics"],
    classes: ["5A", "4B", "3C"],
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 7,
    teacherId: "1234567890",
    name: "Allen Black",
    email: "allen@black.com",
    photo:
      "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=1200",
    phone: "1234567890",
    subjects: ["English", "Spanish"],
    classes: ["5A", "4B", "3C"],
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 8,
    teacherId: "1234567890",
    name: "Ophelia Castro",
    email: "ophelia@castro.com",
    photo:
      "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=1200",
    phone: "1234567890",
    subjects: ["Math", "Geometry"],
    classes: ["5A", "4B", "3C"],
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 9,
    teacherId: "1234567890",
    name: "Derek Briggs",
    email: "derek@briggs.com",
    photo:
      "https://images.pexels.com/photos/842980/pexels-photo-842980.jpeg?auto=compress&cs=tinysrgb&w=1200",
    phone: "1234567890",
    subjects: ["Literature", "English"],
    classes: ["5A", "4B", "3C"],
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 10,
    teacherId: "1234567890",
    name: "John Glover",
    email: "john@glover.com",
    photo:
      "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=1200",
    phone: "1234567890",
    subjects: ["Biology"],
    classes: ["5A", "4B", "3C"],
    address: "123 Main St, Anytown, USA",
  },
];

export const studentsData: Student[] = [
  {
    studentId: 1,
    studentIdNum: "STU001",
    rfidTag: "RFID001",
    firstName: "John",
    middleName: "Smith",
    lastName: "Doe",
    suffix: "Jr",
    email: "john.doe@example.com",
    phoneNumber: "+1234567890",
    address: "123 Main St",
    img: "/images/students/student1.jpg",
    gender: "MALE",
    studentType: "REGULAR",
    status: "ACTIVE",
    yearLevel: "FIRST_YEAR",
    courseId: 1,
    departmentId: 1,
    guardianId: 1,
    userId: 1,
    section_name: "Section A",
    guardian_name: "Jane Doe"
  },
  {
    studentId: 2,
    studentIdNum: "STU002",
    rfidTag: "RFID002",
    firstName: "Jane",
    middleName: "",
    lastName: "Smith",
    suffix: "",
    email: "jane.smith@example.com",
    phoneNumber: "+1987654321",
    address: "456 Oak St",
    img: "/images/students/student2.jpg",
    gender: "FEMALE",
    studentType: "IRREGULAR",
    status: "ACTIVE",
    yearLevel: "SECOND_YEAR",
    courseId: 2,
    departmentId: 1,
    guardianId: 2,
    userId: 2,
    section_name: "Section B",
    guardian_name: "John Smith"
  },
  {
    studentId: 3,
    studentIdNum: "STU003",
    rfidTag: "RFID003",
    firstName: "Michael",
    middleName: "James",
    lastName: "Johnson",
    suffix: "",
    email: "michael.j@example.com",
    phoneNumber: "+1122334455",
    address: "789 Pine St",
    img: "/images/students/student3.jpg",
    gender: "MALE",
    studentType: "REGULAR",
    status: "ACTIVE",
    yearLevel: "THIRD_YEAR",
    courseId: 3,
    departmentId: 1,
    guardianId: 3,
    userId: 3,
    section_name: "Section A",
    guardian_name: "Sarah Johnson"
  },
  {
    studentId: 4,
    studentIdNum: "STU004",
    rfidTag: "RFID004",
    firstName: "Jay",
    middleName: "",
    lastName: "French",
    suffix: "",
    email: "jay.french@example.com",
    phoneNumber: "+1234567890",
    address: "123 Main St",
    img: "/images/students/student4.jpg",
    gender: "MALE",
    studentType: "REGULAR",
    status: "ACTIVE",
    yearLevel: "FIRST_YEAR",
    courseId: 4,
    departmentId: 1,
    guardianId: 4,
    userId: 4,
    section_name: "Section B",
    guardian_name: "Mary French"
  },
  {
    studentId: 5,
    studentIdNum: "STU005",
    rfidTag: "RFID005",
    firstName: "Jane",
    middleName: "",
    lastName: "Smith",
    suffix: "",
    email: "jane.smith@example.com",
    phoneNumber: "+1234567890",
    address: "123 Main St",
    img: "/images/students/student5.jpg",
    gender: "FEMALE",
    studentType: "REGULAR",
    status: "ACTIVE",
    yearLevel: "FIRST_YEAR",
    courseId: 5,
    departmentId: 1,
    guardianId: 5,
    userId: 5,
    section_name: "Section A",
    guardian_name: "Robert Smith"
  },
  {
    studentId: 6,
    studentIdNum: "STU006",
    rfidTag: "RFID006",
    firstName: "Anna",
    middleName: "",
    lastName: "Santiago",
    suffix: "",
    email: "anna.santiago@example.com",
    phoneNumber: "+1234567890",
    address: "123 Main St",
    img: "/images/students/student6.jpg",
    gender: "FEMALE",
    studentType: "REGULAR",
    status: "ACTIVE",
    yearLevel: "FIRST_YEAR",
    courseId: 6,
    departmentId: 1,
    guardianId: 6,
    userId: 6,
    section_name: "Section A",
    guardian_name: "Carlos Santiago"
  },
  {
    studentId: 7,
    studentIdNum: "STU007",
    rfidTag: "RFID007",
    firstName: "Allen",
    middleName: "",
    lastName: "Black",
    suffix: "",
    email: "allen.black@example.com",
    phoneNumber: "+1234567890",
    address: "123 Main St",
    img: "/images/students/student7.jpg",
    gender: "MALE",
    studentType: "REGULAR",
    status: "ACTIVE",
    yearLevel: "FIRST_YEAR",
    courseId: 7,
    departmentId: 1,
    guardianId: 7,
    userId: 7,
    section_name: "Section B",
    guardian_name: "Patricia Black"
  },
];

export interface Parent {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  phone?: string;
  address: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  img?: string;
  gender?: string;
  guardianType?: string;
  status?: 'active' | 'inactive';
  occupation?: string;
  workplace?: string;
  emergencyContact?: string;
  relationshipToStudent?: string;
  totalStudents?: number;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  username?: string;
  bloodType?: string;
  birthday?: string;
  sex?: string;
  students: {
    id: number;
    name: string;
    studentIdNum?: string;
    yearLevel?: string;
    status?: string;
    grade?: number;
    class?: string;
    course?: {
      name: string;
      code: string;
    };
    department?: {
      name: string;
      code: string;
    };
  }[];
}

export const parentsData: Parent[] = [
  {
    id: 1,
    name: "John Doe",
    username: "parent123",
    firstName: "John",
    lastName: "Doe",
    email: "john@doe.com",
    phone: "1234567890",
    address: "123 Main St, Anytown, USA",
    bloodType: "O+",
    birthday: "1980-01-01",
    sex: "male",
    occupation: "Engineer",
    students: [
      { id: 1, name: "Sarah Brewer", grade: 10, class: "A" },
    ],
  },
  {
    id: 2,
    name: "Jane Doe",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@doe.com",
    students: [
      { id: 2, name: "Cecilia Bradley", grade: 9, class: "B" },
    ],
    phone: "1234567890",
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 3,
    name: "Mike Geller",
    firstName: "Mike",
    lastName: "Geller",
    email: "mike@geller.com",
    students: [
      { id: 3, name: "Fanny Caldwell", grade: 8, class: "C" },
    ],
    phone: "1234567890",
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 4,
    name: "Jay French",
    firstName: "Jay",
    lastName: "French",
    email: "jay@french.com",
    students: [
      { id: 4, name: "Mollie Fitzgerald", grade: 7, class: "A" },
      { id: 5, name: "Ian Bryant", grade: 7, class: "B" },
    ],
    phone: "1234567890",
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 5,
    name: "Jane Smith",
    firstName: "Jane",
    lastName: "Smith",
    students: [
      { id: 6, name: "Mable Harvey", grade: 6, class: "A" },
    ],
    email: "jane@smith.com",
    phone: "1234567890",
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 6,
    name: "Anna Santiago",
    firstName: "Anna",
    lastName: "Santiago",
    students: [
      { id: 7, name: "Joel Lambert", grade: 5, class: "A" },
    ],
    email: "anna@santiago.com",
    phone: "1234567890",
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 7,
    name: "Allen Black",
    firstName: "Allen",
    lastName: "Black",
    students: [
      { id: 8, name: "Carrie Tucker", grade: 4, class: "A" },
      { id: 9, name: "Lilly Underwood", grade: 4, class: "B" },
    ],
    email: "allen@black.com",
    phone: "1234567890",
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 8,
    name: "Ophelia Castro",
    firstName: "Ophelia",
    lastName: "Castro",
    students: [
      { id: 10, name: "Alexander Blair", grade: 3, class: "A" },
    ],
    email: "ophelia@castro.com",
    phone: "1234567890",
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 9,
    name: "Derek Briggs",
    firstName: "Derek",
    lastName: "Briggs",
    students: [
      { id: 11, name: "Susan Webster", grade: 2, class: "A" },
      { id: 12, name: "Maude Stone", grade: 2, class: "B" },
    ],
    email: "derek@briggs.com",
    phone: "1234567890",
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 10,
    name: "John Glover",
    firstName: "John",
    lastName: "Glover",
    students: [
      { id: 13, name: "Stella Scott", grade: 1, class: "A" },
    ],
    email: "john@glover.com",
    phone: "1234567890",
    address: "123 Main St, Anytown, USA",
  },
];

export const subjectsData = [
  {
    id: 1,
    name: "Math",
    instructors: ["Alice Phelps", "Russell Davidson"],
  },
  {
    id: 2,
    name: "English",
    instructors: ["Manuel Becker", "Eddie Chavez"],
  },
  {
    id: 3,
    name: "Physics",
    instructors: ["Lola Newman", "Darrell Delgado"],
  },
  {
    id: 4,
    name: "Chemistry",
    instructors: ["Nathan Kelly", "Benjamin Snyder"],
  },
  {
    id: 5,
    name: "Biology",
    instructors: ["Alma Benson", "Lina Collier"],
  },
  {
    id: 6,
    name: "History",
    instructors: ["Hannah Bowman", "Betty Obrien"],
  },
  {
    id: 7,
    name: "Geography",
    instructors: ["Lora French", "Sue Brady"],
  },
  {
    id: 8,
    name: "Art",
    instructors: ["Harriet Alvarado", "Mayme Keller"],
  },
  {
    id: 9,
    name: "Music",
    instructors: ["Gertrude Roy", "Rosa Singleton"],
  },
  {
    id: 10,
    name: "Literature",
    instructors: ["Effie Lynch", "Brett Flowers"],
  },
];

export const classesData = [
  {
    id: 1,
    name: "1A",
    capacity: 20,
    grade: 1,
    supervisor: "Joseph Padilla",
  },
  {
    id: 2,
    name: "2B",
    capacity: 22,
    grade: 2,
    supervisor: "Blake Joseph",
  },
  {
    id: 3,
    name: "3C",
    capacity: 20,
    grade: 3,
    supervisor: "Tom Bennett",
  },
  {
    id: 4,
    name: "4B",
    capacity: 18,
    grade: 4,
    supervisor: "Aaron Collins",
  },
  {
    id: 5,
    name: "5A",
    capacity: 16,
    grade: 5,
    supervisor: "Iva Frank",
  },
  {
    id: 6,
    name: "5B",
    capacity: 20,
    grade: 5,
    supervisor: "Leila Santos",
  },
  {
    id: 7,
    name: "7A",
    capacity: 18,
    grade: 7,
    supervisor: "Carrie Walton",
  },
  {
    id: 8,
    name: "6B",
    capacity: 22,
    grade: 6,
    supervisor: "Christopher Butler",
  },
  {
    id: 9,
    name: "6C",
    capacity: 18,
    grade: 6,
    supervisor: "Marc Miller",
  },
  {
    id: 10,
    name: "6D",
    capacity: 20,
    grade: 6,
    supervisor: "Ophelia Marsh",
  },
];

export const lessonsData = [
  {
    id: 1,
    subject: "Math",
    class: "1A",
    teacher: "Tommy Wise",
  },
  {
    id: 2,
    subject: "English",
    class: "2A",
    teacher: "Rhoda Frank",
  },
  {
    id: 3,
    subject: "Science",
    class: "3A",
    teacher: "Della Dunn",
  },
  {
    id: 4,
    subject: "Social Studies",
    class: "1B",
    teacher: "Bruce Rodriguez",
  },
  {
    id: 5,
    subject: "Art",
    class: "4A",
    teacher: "Birdie Butler",
  },
  {
    id: 6,
    subject: "Music",
    class: "5A",
    teacher: "Bettie Oliver",
  },
  {
    id: 7,
    subject: "History",
    class: "6A",
    teacher: "Herman Howard",
  },
  {
    id: 8,
    subject: "Geography",
    class: "6B",
    teacher: "Lucinda Thomas",
  },
  {
    id: 9,
    subject: "Physics",
    class: "6C",
    teacher: "Ronald Roberts",
  },
  {
    id: 10,
    subject: "Chemistry",
    class: "4B",
    teacher: "Julia Pittman",
  },
];

export const examsData = [
  {
    id: 1,
    subject: "Math",
    class: "1A",
    teacher: "Martha Morris",
    date: "2025-01-01",
  },
  {
    id: 2,
    subject: "English",
    class: "2A",
    teacher: "Randall Garcia",
    date: "2025-01-01",
  },
  {
    id: 3,
    subject: "Science",
    class: "3A",
    teacher: "Myrtie Scott",
    date: "2025-01-01",
  },
  {
    id: 4,
    subject: "Social Studies",
    class: "1B",
    teacher: "Alvin Swanson",
    date: "2025-01-01",
  },
  {
    id: 5,
    subject: "Art",
    class: "4A",
    teacher: "Mabelle Wallace",
    date: "2025-01-01",
  },
  {
    id: 6,
    subject: "Music",
    class: "5A",
    teacher: "Dale Thompson",
    date: "2025-01-01",
  },
  {
    id: 7,
    subject: "History",
    class: "6A",
    teacher: "Allie Conner",
    date: "2025-01-01",
  },
  {
    id: 8,
    subject: "Geography",
    class: "6B",
    teacher: "Hunter Fuller",
    date: "2025-01-01",
  },
  {
    id: 9,
    subject: "Physics",
    class: "7A",
    teacher: "Lois Lindsey",
    date: "2025-01-01",
  },
  {
    id: 10,
    subject: "Chemistry",
    class: "8A",
    teacher: "Vera Soto",
    date: "2025-01-01",
  },
];

export const assignmentsData = [
  {
    id: 1,
    subject: "Math",
    class: "1A",
    teacher: "Anthony Boone",
    dueDate: "2025-01-01",
  },
  {
    id: 2,
    subject: "English",
    class: "2A",
    teacher: "Clifford Bowen",
    dueDate: "2025-01-01",
  },
  {
    id: 3,
    subject: "Science",
    class: "3A",
    teacher: "Catherine Malone",
    dueDate: "2025-01-01",
  },
  {
    id: 4,
    subject: "Social Studies",
    class: "1B",
    teacher: "Willie Medina",
    dueDate: "2025-01-01",
  },
  {
    id: 5,
    subject: "Art",
    class: "4A",
    teacher: "Jose Ruiz",
    dueDate: "2025-01-01",
  },
  {
    id: 6,
    subject: "Music",
    class: "5A",
    teacher: "Katharine Owens",
    dueDate: "2025-01-01",
  },
  {
    id: 7,
    subject: "History",
    class: "6A",
    teacher: "Shawn Norman",
    dueDate: "2025-01-01",
  },
  {
    id: 8,
    subject: "Geography",
    class: "6B",
    teacher: "Don Holloway",
    dueDate: "2025-01-01",
  },
  {
    id: 9,
    subject: "Physics",
    class: "7A",
    teacher: "Franklin Gregory",
    dueDate: "2025-01-01",
  },
  {
    id: 10,
    subject: "Chemistry",
    class: "8A",
    teacher: "Danny Nguyen",
    dueDate: "2025-01-01",
  },
];

export const resultsData = [
  {
    id: 1,
    subject: "Math",
    class: "1A",
    teacher: "John Doe",
    student: "John Doe",
    date: "2025-01-01",
    type: "exam",
    score: 90,
  },
  {
    id: 2,
    subject: "English",
    class: "2A",
    teacher: "John Doe",
    student: "John Doe",
    date: "2025-01-01",
    type: "exam",
    score: 90,
  },
  {
    id: 3,
    subject: "Science",
    class: "3A",
    teacher: "John Doe",
    student: "John Doe",
    date: "2025-01-01",
    type: "exam",
    score: 90,
  },
  {
    id: 4,
    subject: "Social Studies",
    class: "1B",
    teacher: "John Doe",
    student: "John Doe",
    date: "2025-01-01",
    type: "exam",
    score: 90,
  },
  {
    id: 5,
    subject: "Art",
    class: "4A",
    teacher: "John Doe",
    student: "John Doe",
    date: "2025-01-01",
    type: "exam",
    score: 90,
  },
  {
    id: 6,
    subject: "Music",
    class: "5A",
    teacher: "John Doe",
    student: "John Doe",
    date: "2025-01-01",
    type: "exam",
    score: 90,
  },
  {
    id: 7,
    subject: "History",
    class: "6A",
    teacher: "John Doe",
    student: "John Doe",
    date: "2025-01-01",
    type: "exam",
    score: 90,
  },
  {
    id: 8,
    subject: "Geography",
    class: "6B",
    teacher: "John Doe",
    student: "John Doe",
    date: "2025-01-01",
    type: "exam",
    score: 90,
  },
  {
    id: 9,
    subject: "Physics",
    class: "7A",
    teacher: "John Doe",
    student: "John Doe",
    date: "2025-01-01",
    type: "exam",
    score: 90,
  },
  {
    id: 10,
    subject: "Chemistry",
    class: "8A",
    teacher: "John Doe",
    student: "John Doe",
    date: "2025-01-01",
    type: "exam",
    score: 90,
  },
];

export const eventsData = [
  {
    id: 1,
    title: "Lake Trip",
    class: "1A",
    date: "2025-01-01",
    startTime: "10:00",
    endTime: "11:00",
  },
  {
    id: 2,
    title: "Picnic",
    class: "2A",
    date: "2025-01-01",
    startTime: "10:00",
    endTime: "11:00",
  },
  {
    id: 3,
    title: "Beach Trip",
    class: "3A",
    date: "2025-01-01",
    startTime: "10:00",
    endTime: "11:00",
  },
  {
    id: 4,
    title: "Museum Trip",
    class: "4A",
    date: "2025-01-01",
    startTime: "10:00",
    endTime: "11:00",
  },
  {
    id: 5,
    title: "Music Concert",
    class: "5A",
    date: "2025-01-01",
    startTime: "10:00",
    endTime: "11:00",
  },
  {
    id: 6,
    title: "Magician Show",
    class: "1B",
    date: "2025-01-01",
    startTime: "10:00",
    endTime: "11:00",
  },
  {
    id: 7,
    title: "Lake Trip",
    class: "2B",
    date: "2025-01-01",
    startTime: "10:00",
    endTime: "11:00",
  },
  {
    id: 8,
    title: "Cycling Race",
    class: "3B",
    date: "2025-01-01",
    startTime: "10:00",
    endTime: "11:00",
  },
  {
    id: 9,
    title: "Art Exhibition",
    class: "4B",
    date: "2025-01-01",
    startTime: "10:00",
    endTime: "11:00",
  },
  {
    id: 10,
    title: "Sports Tournament",
    class: "5B",
    date: "2025-01-01",
    startTime: "10:00",
    endTime: "11:00",
  },
];

export const announcementsData = [
  {
    id: 1,
    title: "End of Semester Examination Schedule",
    class: "All Classes",
    date: "2024-03-15",
    status: "important",
    description: "Final examination schedules for all courses have been posted. Please check your respective class schedules for the exact time and venue.",
    createdAt: "2024-03-01T08:00:00Z",
    updatedAt: "2024-03-10T15:30:00Z"
  },
  {
    id: 2,
    title: "Campus Maintenance Notice",
    class: "General",
    date: "2024-03-20",
    status: "normal",
    description: "The main library will be closed for maintenance from March 20-22. Alternative study spaces will be available in Building B.",
    createdAt: "2024-03-05T10:15:00Z"
  },
  {
    id: 3,
    title: "Student Council Elections",
    class: "All Students",
    date: "2024-04-01",
    status: "important",
    description: "Student council elections will be held on April 1st. All students are encouraged to participate and cast their votes.",
    createdAt: "2024-03-08T09:00:00Z"
  },
  {
    id: 4,
    title: "Holiday Notice",
    class: "All",
    date: "2024-03-25",
    status: "normal",
    description: "The campus will be closed on March 25th for the spring holiday. Regular classes will resume on March 26th.",
    createdAt: "2024-02-28T14:20:00Z"
  },
  {
    id: 5,
    title: "Library Extended Hours",
    class: "All Students",
    date: "2024-03-18",
    status: "normal",
    description: "The library will extend its operating hours during the final examination period. New hours: 7 AM - 11 PM",
    createdAt: "2024-03-12T11:45:00Z"
  },
  {
    id: 6,
    title: "System Maintenance",
    class: "All Users",
    date: "2024-03-16",
    status: "archived",
    description: "The student portal will be undergoing maintenance on March 16th from 2 AM to 5 AM. Services will be temporarily unavailable.",
    createdAt: "2024-03-02T16:30:00Z",
    updatedAt: "2024-03-15T09:00:00Z"
  }
];


// YOU SHOULD CHANGE THE DATES OF THE EVENTS TO THE CURRENT DATE TO SEE THE EVENTS ON THE CALENDAR
export const calendarEvents = [
  {
    id: 1,
    title: "Math",
    allDay: false,
    start: new Date(2024, 7, 12, 8, 0),
    end: new Date(2024, 7, 12, 8, 45),
  },
  {
    id: 2,
    title: "English",
    allDay: false,
    start: new Date(2024, 7, 12, 9, 0),
    end: new Date(2024, 7, 12, 9, 45),
  },
  {
    id: 3,
    title: "Biology",
    allDay: false,
    start: new Date(2024, 7, 12, 10, 0),
    end: new Date(2024, 7, 12, 10, 45),
  },
  {
    id: 4,
    title: "Physics",
    allDay: false,
    start: new Date(2024, 7, 12, 11, 0),
    end: new Date(2024, 7, 12, 11, 45),
  },
  {
    id: 5,
    title: "Chemistry",
    allDay: false,
    start: new Date(2024, 7, 12, 13, 0),
    end: new Date(2024, 7, 12, 13, 45),
  },
  {
    id: 6,
    title: "History",
    allDay: false,
    start: new Date(2024, 7, 12, 14, 0),
    end: new Date(2024, 7, 12, 14, 45),
  },
  {
    id: 7,
    title: "English",
    allDay: false,
    start: new Date(2024, 7, 13, 9, 0),
    end: new Date(2024, 7, 13, 9, 45),
  },
  {
    id: 8,
    title: "Biology",
    allDay: false,
    start: new Date(2024, 7, 13, 10, 0),
    end: new Date(2024, 7, 13, 10, 45),
  },
  {
    id: 9,
    title: "Physics",
    allDay: false,
    start: new Date(2024, 7, 13, 11, 0),
    end: new Date(2024, 7, 13, 11, 45),
  },
  {
    id: 10,
    title: "History",
    allDay: false,
    start: new Date(2024, 7, 13, 14, 0),
    end: new Date(2024, 7, 13, 14, 45),
  },
  {
    id: 11,
    title: "Math",
    allDay: false,
    start: new Date(2024, 7, 14, 8, 0),
    end: new Date(2024, 7, 14, 8, 45),
  },
  {
    id: 12,
    title: "Biology",
    allDay: false,
    start: new Date(2024, 7, 14, 10, 0),
    end: new Date(2024, 7, 14, 10, 45),
  },
  {
    id: 13,
    title: "Chemistry",
    allDay: false,
    start: new Date(2024, 7, 14, 13, 0),
    end: new Date(2024, 7, 14, 13, 45),
  },
  {
    id: 14,
    title: "History",
    allDay: false,
    start: new Date(2024, 7, 14, 14, 0),
    end: new Date(2024, 7, 13, 14, 45),
  },
  {
    id: 15,
    title: "English",
    allDay: false,
    start: new Date(2024, 7, 15, 9, 0),
    end: new Date(2024, 7, 15, 9, 45),
  },
  {
    id: 16,
    title: "Biology",
    allDay: false,
    start: new Date(2024, 7, 15, 10, 0),
    end: new Date(2024, 7, 15, 10, 45),
  },
  {
    id: 17,
    title: "Physics",
    allDay: false,
    start: new Date(2024, 7, 15, 11, 0),
    end: new Date(2024, 7, 15, 11, 45),
  },
  {
    id: 18,
    title: "History",
    allDay: false,
    start: new Date(2024, 7, 15, 14, 0),
    end: new Date(2024, 7, 15, 14, 45),
  },
  {
    id: 19,
    title: "Math",
    allDay: false,
    start: new Date(2024, 7, 16, 8, 0),
    end: new Date(2024, 7, 16, 8, 45),
  },
  {
    id: 20,
    title: "English",
    allDay: false,
    start: new Date(2024, 7, 16, 9, 0),
    end: new Date(2024, 7, 16, 9, 45),
  },
  {
    id: 21,
    title: "Physics",
    allDay: false,
    start: new Date(2024, 7, 16, 11, 0),
    end: new Date(2024, 7, 16, 11, 45),
  },
  {
    id: 22,
    title: "Chemistry",
    allDay: false,
    start: new Date(2024, 7, 16, 13, 0),
    end: new Date(2024, 7, 16, 13, 45),
  },
  {
    id: 23,
    title: "History",
    allDay: false,
    start: new Date(2024, 7, 16, 14, 0),
    end: new Date(2024, 7, 16, 14, 45),
  },
];