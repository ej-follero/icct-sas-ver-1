"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Users, BookOpen, User2, Info, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { DepartmentForm } from '@/components/forms/DepartmentForm';
import { ViewDialog } from '@/components/reusable/Dialogs/ViewDialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';

// Type definitions
interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: "active" | "inactive";
  totalStudents: number;
  totalSections: number;
}

interface Department {
  id: string;
  name: string;
  code: string;
  headOfDepartment: string;
  headOfDepartmentDetails?: {
    firstName: string;
    lastName: string;
    middleName?: string;
    fullName: string;
    email?: string;
    phoneNumber?: string;
    officeLocation?: string;
    officeHours?: string;
  };
  description?: string;
  courseOfferings: Course[];
  status: "active" | "inactive";
  totalInstructors: number;
  totalStudents?: number;
  logo?: string;
  settings: {
    autoGenerateCode: boolean;
    allowCourseOverlap: boolean;
    maxInstructors: number;
  };
}

const TABS = [
  { label: "Overview", icon: Info },
  { label: "Courses", icon: BookOpen },
  { label: "Instructors", icon: Users },
];

export default function DepartmentDetailPage() {
  const [tab, setTab] = useState(0);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();

  useEffect(() => {
    async function fetchDepartment() {
      try {
        const response = await fetch(`/api/departments/${params.id}`);
        if (!response.ok) {
          throw new Error('Department not found');
        }
        const data = await response.json();
        setDepartment(data);
      } catch (error) {
        console.error('Error fetching department:', error);
        toast.error('Failed to load department details');
      } finally {
        setLoading(false);
      }
    }

    fetchDepartment();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-blue-600">Loading department details...</span>
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8 text-red-600" />
          <span className="text-red-600">Department not found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 py-8 px-6 rounded-2xl shadow-sm ring-1 ring-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{department.name}</h1>
          <p className="text-sm text-gray-600 mt-1">{department.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setViewDialogOpen(true)} aria-label="View Department">
            <Eye className="h-5 w-5 text-blue-600" />
          </Button>
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
          <div className="text-xl font-bold">{department.totalStudents || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <BookOpen className="h-6 w-6 text-green-500 mb-2" />
          <div className="text-xs text-gray-500">Total Courses</div>
          <div className="text-xl font-bold">{department.courseOfferings?.length || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <Users className="h-6 w-6 text-purple-500 mb-2" />
          <div className="text-xs text-gray-500">Total Instructors</div>
          <div className="text-xl font-bold">{department.totalInstructors || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <Info className="h-6 w-6 text-yellow-500 mb-2" />
          <div className="text-xs text-gray-500">Status</div>
          <div className="text-xl font-bold">
            <Badge variant={department.status === "active" ? "success" : "destructive"}>
              {department.status.charAt(0).toUpperCase() + department.status.slice(1)}
            </Badge>
          </div>
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
                  <div><span className="font-medium">Head of Department:</span> {department.headOfDepartment || 'Not Assigned'}</div>
                  <div><span className="font-medium">Status:</span> <Badge variant={department.status === "active" ? "success" : "destructive"}>{department.status}</Badge></div>
                </div>
              </div>
              <div>
                <h2 className="font-semibold mb-2">Description</h2>
                <p className="text-gray-600">{department.description || 'No description available.'}</p>
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
                      <TableHead>Code</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Sections</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {department.courseOfferings?.map((course: Course) => (
                      <TableRow key={course.id}>
                        <TableCell>{course.name}</TableCell>
                        <TableCell>{course.code}</TableCell>
                        <TableCell>{course.totalStudents || 0}</TableCell>
                        <TableCell>{course.totalSections || 0}</TableCell>
                        <TableCell><Badge variant={course.status === "active" ? "success" : "destructive"}>{course.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" aria-label="Edit Course"><Pencil className="h-4 w-4 text-green-600" /></Button>
                            <Button variant="ghost" size="icon" aria-label="Delete Course"><Trash2 className="h-4 w-4 text-red-600" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!department.courseOfferings || department.courseOfferings.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                          No courses available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Dialogs */}
      <ViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        title={department?.name || ''}
        subtitle={department?.code}
        status={department ? {
          value: department.status,
          variant: department.status === "active" ? "success" : "destructive"
        } : undefined}
        sections={[
          {
            title: "Department Information",
            fields: [
              { label: 'Total Courses', value: department?.courseOfferings?.length || 0, type: 'number' },
              { label: 'Total Instructors', value: department?.totalInstructors || 0, type: 'number' },
              { label: 'Total Students', value: department?.totalStudents || 0, type: 'number' }
            ]
          },
          {
            title: "Course Offerings",
            fields: department?.courseOfferings?.map((course: Course) => ({
              label: course.name,
              value: course.status,
              type: 'course-with-status' as const,
              badgeVariant: course.status === 'active' ? 'success' : 'destructive'
            })) || []
          }
        ]}
        departmentHead={department?.headOfDepartment ? {
          name: department.headOfDepartment,
          position: "Department Head",
          department: department.name
        } : undefined}
        description={department?.description}
        tooltipText="View detailed department information"
      />

      <DepartmentForm
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        initialData={department}
        instructors={[]} // TODO: Fetch instructors
        onSuccess={async () => {
          setEditDialogOpen(false);
          // Refresh department data
          const response = await fetch(`/api/departments/${params.id}`);
          if (response.ok) {
            const data = await response.json();
            setDepartment(data);
          }
          toast.success('Department updated successfully');
        }}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={department?.name || ''}
        onDelete={async () => {
          try {
            const response = await fetch(`/api/departments/${params.id}`, {
              method: 'DELETE',
            });
            if (response.ok) {
              toast.success('Department deleted successfully');
              // Redirect to departments list
              window.location.href = '/list/departments';
            } else {
              throw new Error('Failed to delete department');
            }
          } catch (error) {
            toast.error('Failed to delete department');
          }
          setDeleteDialogOpen(false);
        }}
        onCancel={() => setDeleteDialogOpen(false)}
        canDelete={true}
        loading={false}
        description={`Are you sure you want to delete the department "${department?.name}"? This action cannot be undone.`}
      />
    </div>
  );
} 