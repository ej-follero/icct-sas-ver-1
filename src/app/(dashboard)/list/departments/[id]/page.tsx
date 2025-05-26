"use client";

import { Suspense } from 'react';
import FormModal from "@/components/FormModal";
import { role } from "@/lib/data";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Grid,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { z } from "zod";
import { toast } from "sonner";
import { DepartmentForm } from "@/components/forms/DepartmentForm";

interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: "active" | "inactive";
  students: number;
  sections: number;
}

interface Instructor {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  headOfDepartment: string;
  description: string;
  courses: Course[];
  status: "active" | "inactive";
  totalCourses: number;
  totalInstructors: number;
  instructors: Instructor[];
  coursesList: Course[];
  statistics: {
    attendanceRate: number;
    studentCount: number;
    courseCount: number;
    instructorCount: number;
  };
}

// Mock data - replace with actual data fetching
const departmentsData: Department[] = [
  {
    id: "1",
    name: "College of Information Technology",
    code: "CITE",
    headOfDepartment: "Mr. J. Dela Cruz",
    description: "Department of Information Technology",
    courses: [
      { 
        id: "1", 
        name: "BSIT", 
        code: "BSIT",
        description: "Bachelor of Science in Information Technology",
        status: "active",
        students: 120, 
        sections: 4 
      },
      { 
        id: "2", 
        name: "BSCS", 
        code: "BSCS",
        description: "Bachelor of Science in Computer Science",
        status: "active",
        students: 100, 
        sections: 3 
      },
      { 
        id: "3", 
        name: "BSIS", 
        code: "BSIS",
        description: "Bachelor of Science in Information Systems",
        status: "active",
        students: 80, 
        sections: 3 
      },
    ],
    status: "active",
    totalCourses: 5,
    totalInstructors: 12,
    instructors: [
      { id: "1", name: "John Doe", type: "Full Time", status: "Active" },
      { id: "2", name: "Jane Smith", type: "Part Time", status: "Active" },
    ],
    coursesList: [
      { 
        id: "1", 
        name: "BSIT", 
        code: "BSIT",
        description: "Bachelor of Science in Information Technology",
        status: "active",
        students: 120, 
        sections: 4 
      },
      { 
        id: "2", 
        name: "BSCS", 
        code: "BSCS",
        description: "Bachelor of Science in Computer Science",
        status: "active",
        students: 100, 
        sections: 3 
      },
      { 
        id: "3", 
        name: "BSIS", 
        code: "BSIS",
        description: "Bachelor of Science in Information Systems",
        status: "active",
        students: 80, 
        sections: 3 
      },
    ],
    statistics: {
      attendanceRate: 95,
      studentCount: 300,
      courseCount: 5,
      instructorCount: 12,
    },
  },
];

function DepartmentPageContent() {
  const params = useParams();
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [department, setDepartment] = useState(departmentsData[0]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [createCourseModalOpen, setCreateCourseModalOpen] = useState(false);
  const [createInstructorModalOpen, setCreateInstructorModalOpen] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const attendanceData = [
    { name: 'Present', value: 95 },
    { name: 'Absent', value: 5 },
  ];

  const departmentSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Department Name is required"),
    code: z.string().min(1, "Department Code is required"),
    headOfDepartment: z.string().min(1, "Head of Department is required"),
    description: z.string().optional(),
    courseOfferings: z.array(z.object({
      id: z.string(),
      name: z.string().min(1, "Course name is required"),
      code: z.string().min(1, "Course code is required"),
      description: z.string().optional(),
      status: z.enum(["active", "inactive"]),
      totalStudents: z.number(),
      totalSections: z.number()
    })),
    status: z.enum(["active", "inactive"]),
    totalInstructors: z.number(),
  });

  const courseSchema = z.object({
    name: z.string().min(1, "Course Name is required"),
    code: z.string().min(1, "Course Code is required"),
    description: z.string().min(1, "Description is required"),
    status: z.enum(["active", "inactive"]),
  });

  const instructorSchema = z.object({
    name: z.string().min(1, "Instructor Name is required"),
    type: z.enum(["Full Time", "Part Time"]),
    status: z.enum(["Active", "Inactive"]),
  });

  const handleEditSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/departments/${department.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update department');
      }

      const updatedDepartment = await response.json();
      setDepartment(updatedDepartment);
      setEditModalOpen(false);
      toast.success('Department updated successfully');
    } catch (error) {
      console.error('Error updating department:', error);
      toast.error('Failed to update department');
    }
  };

  const handleDeleteSubmit = async () => {
    try {
      const response = await fetch(`/api/departments/${department.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete department');
      }

      setDeleteModalOpen(false);
      toast.success('Department deleted successfully');
      // Redirect to departments list
      router.push('/list/departments');
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Failed to delete department');
    }
  };

  const handleCreateCourseSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          departmentId: department.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create course');
      }

      const newCourse = await response.json();
      setDepartment(prev => ({
        ...prev,
        courses: [...prev.courses, newCourse],
        totalCourses: prev.totalCourses + 1,
      }));
      setCreateCourseModalOpen(false);
      toast.success('Course created successfully');
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
    }
  };

  const handleCreateInstructorSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/instructors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          departmentId: department.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create instructor');
      }

      const newInstructor = await response.json();
      setDepartment(prev => ({
        ...prev,
        instructors: [...prev.instructors, newInstructor],
        totalInstructors: prev.totalInstructors + 1,
      }));
      setCreateInstructorModalOpen(false);
      toast.success('Instructor created successfully');
    } catch (error) {
      console.error('Error creating instructor:', error);
      toast.error('Failed to create instructor');
    }
  };

  const renderEditModal = () => (
    <DepartmentForm
      open={editModalOpen}
      onOpenChange={setEditModalOpen}
      initialData={{
        id: department.id,
        name: department.name,
        code: department.code,
        headOfDepartment: department.headOfDepartment,
        description: department.description,
        courseOfferings: department.courses.map(course => ({
          id: course.id,
          name: course.name,
          code: course.code,
          description: course.description,
          status: course.status,
          totalStudents: course.students,
          totalSections: course.sections
        })),
        status: department.status,
        totalInstructors: department.totalInstructors
      }}
      instructors={department.instructors}
      onSuccess={() => {
        setEditModalOpen(false);
        // Refresh department data
        handleEditSubmit(department);
      }}
    />
  );

  if (!department) {
    return (
      <div className="flex-1 p-4">
        <div className="bg-white rounded-md p-4">
          <h1 className="text-xl font-semibold text-red-600">Department not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 py-8 px-6 rounded-2xl shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{department.name}</h1>
            <p className="text-sm text-gray-600 mt-1">{department.description}</p>
          </div>
          {role === "admin" && (
            <div className="flex gap-2">
              {renderEditModal()}
              <FormModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onSubmit={handleDeleteSubmit}
                title="Delete Department"
                submitLabel="Delete"
                schema={z.object({})}
                fields={[]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm ring-1 ring-gray-100">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Students
            </Typography>
            <Typography variant="h4" component="div">
              {department.statistics.studentCount}
            </Typography>
          </CardContent>
        </Card>
        <Card className="shadow-sm ring-1 ring-gray-100">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Courses
            </Typography>
            <Typography variant="h4" component="div">
              {department.statistics.courseCount}
            </Typography>
          </CardContent>
        </Card>
        <Card className="shadow-sm ring-1 ring-gray-100">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Instructors
            </Typography>
            <Typography variant="h4" component="div">
              {department.statistics.instructorCount}
            </Typography>
          </CardContent>
        </Card>
        <Card className="shadow-sm ring-1 ring-gray-100">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Attendance Rate
            </Typography>
            <Typography variant="h4" component="div">
              {department.statistics.attendanceRate}%
            </Typography>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="shadow-sm ring-1 ring-gray-100">
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Overview" />
            <Tab label="Courses" />
            <Tab label="Instructors" />
          </Tabs>
        </Box>
        <CardContent>
          {tabValue === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Typography variant="h6" gutterBottom>
                  Department Information
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Department Code</TableCell>
                        <TableCell>{department.code}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Head of Department</TableCell>
                        <TableCell>{department.headOfDepartment}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Status</TableCell>
                        <TableCell>
                          <Chip
                            label={department.status}
                            color={department.status === "active" ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>
              <div>
                <Typography variant="h6" gutterBottom>
                  Attendance Overview
                </Typography>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendanceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {attendanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {tabValue === 1 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <Typography variant="h6">Course List</Typography>
                {role === "admin" && (
                  <FormModal
                    open={createCourseModalOpen}
                    onClose={() => setCreateCourseModalOpen(false)}
                    onSubmit={handleCreateCourseSubmit}
                    title="Add New Course"
                    submitLabel="Add"
                    schema={courseSchema}
                    fields={[
                      {
                        name: "name",
                        label: "Course Name",
                        type: "text",
                      },
                      {
                        name: "code",
                        label: "Course Code",
                        type: "text",
                      },
                      {
                        name: "description",
                        label: "Description",
                        type: "multiline",
                      },
                      {
                        name: "status",
                        label: "Status",
                        type: "select",
                        options: [
                          { value: "active", label: "Active" },
                          { value: "inactive", label: "Inactive" },
                        ],
                      },
                    ]}
                  />
                )}
              </div>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Course Name</TableCell>
                      <TableCell>Students</TableCell>
                      <TableCell>Sections</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {department.courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>{course.name}</TableCell>
                        <TableCell>{course.students}</TableCell>
                        <TableCell>{course.sections}</TableCell>
                        <TableCell align="right">
                          {role === "admin" && (
                            <>
                              <IconButton size="small" color="primary">
                                <EditIcon />
                              </IconButton>
                              <IconButton size="small" color="error">
                                <DeleteIcon />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          )}

          {tabValue === 2 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <Typography variant="h6">Instructor List</Typography>
                {role === "admin" && (
                  <FormModal
                    open={createInstructorModalOpen}
                    onClose={() => setCreateInstructorModalOpen(false)}
                    onSubmit={handleCreateInstructorSubmit}
                    title="Add New Instructor"
                    submitLabel="Add"
                    schema={instructorSchema}
                    fields={[
                      {
                        name: "name",
                        label: "Instructor Name",
                        type: "text",
                      },
                      {
                        name: "type",
                        label: "Type",
                        type: "select",
                        options: [
                          { value: "Full Time", label: "Full Time" },
                          { value: "Part Time", label: "Part Time" },
                        ],
                      },
                      {
                        name: "status",
                        label: "Status",
                        type: "select",
                        options: [
                          { value: "Active", label: "Active" },
                          { value: "Inactive", label: "Inactive" },
                        ],
                      },
                    ]}
                  />
                )}
              </div>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {department.instructors.map((instructor) => (
                      <TableRow key={instructor.id}>
                        <TableCell>{instructor.name}</TableCell>
                        <TableCell>{instructor.type}</TableCell>
                        <TableCell>
                          <Chip
                            label={instructor.status}
                            color={instructor.status === "Active" ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {role === "admin" && (
                            <>
                              <IconButton size="small" color="primary">
                                <EditIcon />
                              </IconButton>
                              <IconButton size="small" color="error">
                                <DeleteIcon />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DepartmentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DepartmentPageContent />
    </Suspense>
  );
} 