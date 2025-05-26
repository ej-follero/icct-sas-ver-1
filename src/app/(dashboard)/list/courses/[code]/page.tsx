"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SchoolIcon from "@mui/icons-material/School";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import BookIcon from "@mui/icons-material/Book";
import FormModal from "@/components/FormModal";
import { z } from "zod";

// Define the course schema
const courseSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  code: z.string().min(1, "Course code is required"),
  department: z.string().min(1, "Department is required"),
  description: z.string().optional(),
  units: z.number().min(1, "Units must be at least 1"),
  status: z.enum(["active", "inactive"]),
});

// Mock data - replace with actual API call later
const mockCourse = {
  id: "1",
  name: "Bachelor of Science in Information Technology",
  code: "BSIT",
  department: "College of Information Technology",
  description: "A program focused on information technology and computer systems",
  units: 144,
  status: "active",
  totalStudents: 150,
  totalInstructors: 12,
  createdAt: "2024-01-01",
  updatedAt: "2024-03-15",
  objectives: [
    "Develop technical skills in programming and software development",
    "Understand computer systems and networks",
    "Learn database management and information systems",
    "Gain practical experience through projects and internships"
  ],
  requirements: [
    "High school diploma or equivalent",
    "Passing grade in mathematics and science",
    "English proficiency",
    "Computer literacy"
  ]
};

export default function CourseViewPage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState(mockCourse);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // In a real application, you would fetch the course data here
  useEffect(() => {
    // Fetch course data based on params.code
    console.log("Fetching course with code:", params.code);
  }, [params.code]);

  const handleEditSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/courses/${course.code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update course");

      const updatedCourse = await response.json();
      setCourse(updatedCourse);
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error updating course:", error);
    }
  };

  const handleDeleteSubmit = async () => {
    try {
      const response = await fetch(`/api/courses/${course.code}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete course");

      router.push("/list/courses");
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-[1920px] mx-auto p-6">
        <div className="mb-6">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            Back to Courses
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-xl bg-blue-50 ring-1 ring-gray-100 flex-shrink-0">
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <span className="text-2xl font-semibold text-white">
                      {course.code.slice(0, 2)}
                    </span>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">{course.name}</h1>
                  <p className="text-sm text-gray-500 mt-1">{course.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setEditModalOpen(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteModalOpen(true)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <Grid container spacing={4}>
              {/* Main Info */}
              <Grid item xs={12} md={8}>
                <Card className="bg-gray-50/50">
                  <CardContent>
                    <Typography variant="h6" className="mb-4">Course Information</Typography>
                    <div className="space-y-4">
                      <div>
                        <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                        <Typography variant="body1">{course.description}</Typography>
                      </div>
                      <div>
                        <Typography variant="subtitle2" color="textSecondary">Department</Typography>
                        <Typography variant="body1">{course.department}</Typography>
                      </div>
                      <div>
                        <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                        <Chip
                          label={course.status}
                          className={`mt-1 ${
                            course.status === "active"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-4 bg-gray-50/50">
                  <CardContent>
                    <Typography variant="h6" className="mb-4">Course Objectives</Typography>
                    <List>
                      {course.objectives.map((objective, index) => (
                        <ListItem key={index} className="py-1">
                          <ListItemIcon>
                            <BookIcon className="text-blue-500" />
                          </ListItemIcon>
                          <ListItemText primary={objective} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>

                <Card className="mt-4 bg-gray-50/50">
                  <CardContent>
                    <Typography variant="h6" className="mb-4">Requirements</Typography>
                    <List>
                      {course.requirements.map((requirement, index) => (
                        <ListItem key={index} className="py-1">
                          <ListItemIcon>
                            <SchoolIcon className="text-blue-500" />
                          </ListItemIcon>
                          <ListItemText primary={requirement} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Sidebar */}
              <Grid item xs={12} md={4}>
                <Card className="bg-gray-50/50">
                  <CardContent>
                    <Typography variant="h6" className="mb-4">Course Details</Typography>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <BookIcon className="text-blue-500" />
                        </div>
                        <div>
                          <Typography variant="subtitle2" color="textSecondary">Units</Typography>
                          <Typography variant="body1">{course.units}</Typography>
                        </div>
                      </div>
                      <Divider />
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <GroupIcon className="text-blue-500" />
                        </div>
                        <div>
                          <Typography variant="subtitle2" color="textSecondary">Total Students</Typography>
                          <Typography variant="body1">{course.totalStudents}</Typography>
                        </div>
                      </div>
                      <Divider />
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <PersonIcon className="text-blue-500" />
                        </div>
                        <div>
                          <Typography variant="subtitle2" color="textSecondary">Total Instructors</Typography>
                          <Typography variant="body1">{course.totalInstructors}</Typography>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-4 bg-gray-50/50">
                  <CardContent>
                    <Typography variant="h6" className="mb-4">Timeline</Typography>
                    <div className="space-y-4">
                      <div>
                        <Typography variant="subtitle2" color="textSecondary">Created</Typography>
                        <Typography variant="body1">{new Date(course.createdAt).toLocaleDateString()}</Typography>
                      </div>
                      <Divider />
                      <div>
                        <Typography variant="subtitle2" color="textSecondary">Last Updated</Typography>
                        <Typography variant="body1">{new Date(course.updatedAt).toLocaleDateString()}</Typography>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <FormModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        title="Edit Course"
        submitLabel="Update"
        defaultValues={course}
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
            name: "department",
            label: "Department",
            type: "text",
          },
          {
            name: "units",
            label: "Units",
            type: "number",
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

      {/* Delete Confirmation Modal */}
      <FormModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSubmit={handleDeleteSubmit}
        title="Delete Course"
        submitLabel="Delete"
        schema={z.object({})}
        fields={[]}
      />
    </div>
  );
} 