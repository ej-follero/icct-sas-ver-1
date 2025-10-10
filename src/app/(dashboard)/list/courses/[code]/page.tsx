"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageSkeleton } from "@/components/reusable/Skeleton";
import { School, User, Book, Users, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import FormModal from "@/components/FormModal";
import { courseSchema } from "@/lib/validations/course";
import { z } from "zod";
import CourseFormDialog from '@/components/forms/CourseFormDialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';

export default function CourseViewPage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    async function fetchCourse() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/courses/${params.code}`);
        if (!res.ok) throw new Error("Course not found");
        const data = await res.json();
        const parsed = courseSchema.safeParse(data);
        if (!parsed.success) throw new Error("Invalid course data");
        setCourse(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (params.code) fetchCourse();
  }, [params.code]);

  const handleEditSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/courses/${params.code}`, {
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
      const response = await fetch(`/api/courses/${params.code}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete course");

      router.push("/list/courses");
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  if (loading) return <PageSkeleton />;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!course) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Courses
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
              <button
                  onClick={() => setEditModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                <Pencil className="w-5 h-5" />
                  Edit
              </button>
              <button
                  onClick={() => setDeleteModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
                >
                <Trash2 className="w-5 h-5" />
                  Delete
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main Info */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-gray-50/50 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Course Information</h2>
                    <div className="space-y-4">
                      <div>
                    <p className="text-sm text-gray-500 font-medium">Description</p>
                    <p className="text-gray-900">{course.description}</p>
                      </div>
                      <div>
                    <p className="text-sm text-gray-500 font-medium">Department</p>
                    <p className="text-gray-900">{course.department}</p>
                      </div>
                      <div>
                    <p className="text-sm text-gray-500 font-medium">Status</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${course.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{course.status}</span>
                  </div>
                      </div>
                    </div>

              <div className="bg-gray-50/50 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Course Objectives</h2>
                <ul className="space-y-2 list-none">
                      {course.objectives && course.objectives.length > 0 ? course.objectives.map((objective: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <Book className="w-5 h-5 text-blue-500" />
                      <span>{objective}</span>
                    </li>
                      )) : <li className="text-gray-500">No objectives listed.</li>}
                </ul>
              </div>

              <div className="bg-gray-50/50 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Requirements</h2>
                <ul className="space-y-2 list-none">
                      {course.requirements && course.requirements.length > 0 ? course.requirements.map((requirement: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <School className="w-5 h-5 text-blue-500" />
                      <span>{requirement}</span>
                    </li>
                      )) : <li className="text-gray-500">No requirements listed.</li>}
                </ul>
              </div>
            </div>

              {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-gray-50/50 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Course Details</h2>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                      <Book className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                      <p className="text-sm text-gray-500 font-medium">Units</p>
                      <p className="text-gray-900">{course.units}</p>
                        </div>
                      </div>
                  <div className="border-t border-gray-200 my-2" />
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                      <Users className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                      <p className="text-sm text-gray-500 font-medium">Total Students</p>
                      <p className="text-gray-900">{course.totalStudents}</p>
                        </div>
                      </div>
                  <div className="border-t border-gray-200 my-2" />
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                      <User className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                      <p className="text-sm text-gray-500 font-medium">Total Instructors</p>
                      <p className="text-gray-900">{course.totalInstructors}</p>
                    </div>
                        </div>
                      </div>
                    </div>

              <div className="bg-gray-50/50 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Timeline</h2>
                    <div className="space-y-4">
                      <div>
                    <p className="text-sm text-gray-500 font-medium">Created</p>
                    <p className="text-gray-900">{new Date(course.createdAt).toLocaleDateString()}</p>
                      </div>
                  <div className="border-t border-gray-200 my-2" />
                      <div>
                    <p className="text-sm text-gray-500 font-medium">Last Updated</p>
                    <p className="text-gray-900">{new Date(course.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                      </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <CourseFormDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        type="update"
        data={course}
        id={course?.id}
        onSuccess={() => {
          setEditModalOpen(false);
          // Optionally refetch course data here
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        itemName={course?.name}
        onDelete={handleDeleteSubmit}
        onCancel={() => setDeleteModalOpen(false)}
        canDelete={true}
        description={course ? `Are you sure you want to delete the course "${course.name}"? This action cannot be undone.` : undefined}
      />
      </div>
    </div>
  );
} 