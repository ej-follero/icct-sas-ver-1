"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserGender, InstructorType, Status } from "@/types/enums";
import { Teacher } from "@/types/teacher";
import { instructorsData } from "@/lib/data";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Edit, Trash2, User, Mail, Phone, Building2, BadgeCheck, Clock, QrCode } from "lucide-react";

export default function InstructorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [instructor, setInstructor] = useState<Teacher | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    // In a real application, this would be an API call
    const foundInstructor = instructorsData.find(
      (i) => i.instructorId === Number(params.id)
    );
    setInstructor(foundInstructor || null);
  }, [params.id]);

  const handleDelete = () => {
    // In a real application, this would be an API call
    toast.success("Instructor deleted successfully");
    router.push("/list/instructors");
  };

  if (!instructor) {
    return (
      <div className="p-6">
        <p className="text-lg text-gray-600">Instructor not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <button
          className="flex items-center gap-1 text-blue-600 hover:underline"
          onClick={() => router.push("/list/instructors")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Instructors
        </button>
        <span className="mx-2">/</span>
        <span className="text-gray-700 font-medium">Instructor Details</span>
      </div>
      <Card>
        <CardContent>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold">
                {instructor.firstName.charAt(0)}{instructor.lastName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {instructor.lastName}, {instructor.firstName} {instructor.middleName || ''} {instructor.suffix || ''}
                </h1>
                <div className="text-gray-500 text-sm">ID: {instructor.instructorId}</div>
                <Badge variant={instructor.status === Status.ACTIVE ? "success" : "error"} className="capitalize mt-1">
                  {instructor.status}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                className="flex items-center gap-2"
                onClick={() => router.push(`/list/instructors/${instructor.instructorId}/edit`)}
              >
                <Edit className="w-4 h-4" /> Edit
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </div>
          </div>
          {/* Content Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4 text-blue-700 font-semibold">
                <User className="w-5 h-5" /> Personal Information
              </div>
              <div className="mb-2">
                <div className="text-xs text-gray-500">Full Name</div>
                <div className="text-base text-gray-900 font-medium">
                  {instructor.firstName} {instructor.middleName || ''} {instructor.lastName} {instructor.suffix || ''}
                </div>
              </div>
              <div className="mb-2">
                <div className="text-xs text-gray-500">Gender</div>
                <div className="text-base text-gray-900 font-medium">{instructor.gender}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Instructor Type</div>
                <div className="text-base text-gray-900 font-medium">{instructor.instructorType}</div>
              </div>
            </div>
            {/* Contact Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4 text-blue-700 font-semibold">
                <Mail className="w-5 h-5" /> Contact Information
              </div>
              <div className="mb-2">
                <div className="text-xs text-gray-500">Email Address</div>
                <div className="text-base text-gray-900 font-medium">{instructor.email}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Phone Number</div>
                <div className="text-base text-gray-900 font-medium">{instructor.phoneNumber}</div>
              </div>
            </div>
            {/* Department Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4 text-blue-700 font-semibold">
                <Building2 className="w-5 h-5" /> Department Information
              </div>
              <div className="mb-2">
                <div className="text-xs text-gray-500">Department</div>
                <div className="text-base text-gray-900 font-medium">{instructor.departmentName}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Department ID</div>
                <div className="text-base text-gray-900 font-medium">{instructor.departmentId}</div>
              </div>
            </div>
            {/* RFID Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4 text-blue-700 font-semibold">
                <QrCode className="w-5 h-5" /> RFID Information
              </div>
              <div className="mb-2">
                <div className="text-xs text-gray-500">RFID Tag</div>
                <div className="text-base text-gray-900 font-medium">{instructor.rfidTag}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Tag Number</div>
                <div className="text-base text-gray-900 font-medium">{instructor.rfidtagNumber}</div>
              </div>
            </div>
            {/* Additional Information */}
            <div className="bg-gray-50 rounded-xl p-6 md:col-span-2">
              <div className="flex items-center gap-2 mb-4 text-blue-700 font-semibold">
                <Clock className="w-5 h-5" /> Additional Information
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-gray-500">Created At</div>
                  <div className="text-base text-gray-900 font-medium">{instructor.createdAt.toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Last Updated</div>
                  <div className="text-base text-gray-900 font-medium">{instructor.updatedAt.toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Instructor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the instructor "{instructor.firstName} {instructor.lastName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 