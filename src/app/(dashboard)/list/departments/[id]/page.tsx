"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Users, BookOpen, User2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Mock data
const mockDepartment = {
  id: "1",
  name: "College of Information Technology",
  code: "CITE",
  headOfDepartment: "Mr. J. Dela Cruz",
  description: "Department of Information Technology",
  status: "active",
  statistics: {
    attendanceRate: 95,
    studentCount: 300,
    courseCount: 5,
    instructorCount: 12,
  },
  courses: [
    { id: "1", name: "BSIT", code: "BSIT", description: "Bachelor of Science in Information Technology", status: "active", students: 120, sections: 4 },
    { id: "2", name: "BSCS", code: "BSCS", description: "Bachelor of Science in Computer Science", status: "active", students: 100, sections: 3 },
    { id: "3", name: "BSIS", code: "BSIS", description: "Bachelor of Science in Information Systems", status: "active", students: 80, sections: 3 },
  ],
  instructors: [
    { id: "1", name: "John Doe", type: "Full Time", status: "Active" },
    { id: "2", name: "Jane Smith", type: "Part Time", status: "Active" },
  ],
};

const TABS = [
  { label: "Overview", icon: Info },
  { label: "Courses", icon: BookOpen },
  { label: "Instructors", icon: Users },
];

export default function DepartmentDetailPage() {
  const [tab, setTab] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const department = mockDepartment;

  return (
    <div className="flex-1 p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 py-8 px-6 rounded-2xl shadow-sm ring-1 ring-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{department.name}</h1>
          <p className="text-sm text-gray-600 mt-1">{department.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setEditDialogOpen(true)} aria-label="Edit Department">
            <Pencil className="h-5 w-5" />
          </Button>
          <Button variant="destructive" size="icon" onClick={() => setDeleteDialogOpen(true)} aria-label="Delete Department">
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <User2 className="h-6 w-6 text-blue-500 mb-2" />
          <div className="text-xs text-gray-500">Total Students</div>
          <div className="text-xl font-bold">{department.statistics.studentCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <BookOpen className="h-6 w-6 text-green-500 mb-2" />
          <div className="text-xs text-gray-500">Total Courses</div>
          <div className="text-xl font-bold">{department.statistics.courseCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <Users className="h-6 w-6 text-purple-500 mb-2" />
          <div className="text-xs text-gray-500">Total Instructors</div>
          <div className="text-xl font-bold">{department.statistics.instructorCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <Info className="h-6 w-6 text-yellow-500 mb-2" />
          <div className="text-xs text-gray-500">Attendance Rate</div>
          <div className="text-xl font-bold">{department.statistics.attendanceRate}%</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2 mb-4 border-b">
          {TABS.map((tabItem, i) => (
            <button
              key={tabItem.label}
              className={`flex items-center gap-1 px-4 py-2 border-b-2 transition-all duration-150 ${tab === i ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-500'}`}
              onClick={() => setTab(i)}
            >
              <tabItem.icon className="h-4 w-4" />
              {tabItem.label}
            </button>
          ))}
        </div>
        <div>
          {tab === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="font-semibold mb-2">Department Information</h2>
                <div className="space-y-2">
                  <div><span className="font-medium">Department Code:</span> {department.code}</div>
                  <div><span className="font-medium">Head of Department:</span> {department.headOfDepartment}</div>
                  <div><span className="font-medium">Status:</span> <Badge variant={department.status === "active" ? "success" : "error"}>{department.status}</Badge></div>
                </div>
              </div>
              <div>
                <h2 className="font-semibold mb-2">Attendance Overview</h2>
                <div className="flex flex-col items-center justify-center h-40">
                  <div className="text-4xl font-bold text-blue-600">{department.statistics.attendanceRate}%</div>
                  <div className="text-xs text-gray-500 mt-2">Attendance Rate</div>
                </div>
              </div>
            </div>
          )}
          {tab === 1 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Course List</h2>
                <Button variant="default" size="sm" className="gap-1">
                  <Plus className="h-4 w-4" /> Add Course
                </Button>
              </div>
              <div className="overflow-x-auto rounded-lg border bg-white shadow">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Sections</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {department.courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>{course.name}</TableCell>
                        <TableCell>{course.students}</TableCell>
                        <TableCell>{course.sections}</TableCell>
                        <TableCell><Badge variant={course.status === "active" ? "success" : "error"}>{course.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" aria-label="Edit Course"><Pencil className="h-4 w-4 text-green-600" /></Button>
                            <Button variant="ghost" size="icon" aria-label="Delete Course"><Trash2 className="h-4 w-4 text-red-600" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          {tab === 2 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Instructor List</h2>
                <Button variant="default" size="sm" className="gap-1">
                  <Plus className="h-4 w-4" /> Add Instructor
                </Button>
              </div>
              <div className="overflow-x-auto rounded-lg border bg-white shadow">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {department.instructors.map((instructor) => (
                      <TableRow key={instructor.id}>
                        <TableCell>{instructor.name}</TableCell>
                        <TableCell>{instructor.type}</TableCell>
                        <TableCell><Badge variant={instructor.status === "Active" ? "success" : "error"}>{instructor.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" aria-label="Edit Instructor"><Pencil className="h-4 w-4 text-green-600" /></Button>
                            <Button variant="ghost" size="icon" aria-label="Delete Instructor"><Trash2 className="h-4 w-4 text-red-600" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog (structure only) */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          {/* Add edit form here */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Dialog (structure only) */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete the department "{department.name}"? This action cannot be undone.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(false)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 