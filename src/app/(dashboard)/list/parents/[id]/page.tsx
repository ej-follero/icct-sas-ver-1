"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Droplet,
  Cake,
  School,
  Pencil,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import FormModal from "@/components/FormModal";
import ParentForm from "@/components/forms/ParentForm";
import { parentsData, Parent } from "@/lib/data";

export default function ParentProfilePage() {
  const params = useParams();
  const parentId = Number(params.id);
  const parent = parentsData.find(p => p.id === parentId);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (!parent) {
    return <div className="p-8 text-center text-gray-500">Parent not found.</div>;
  }

  const handleDelete = async () => {
    try {
      // Add delete API call here
      console.log("Deleting parent:", parent.id);
      // Redirect to parents list after successful deletion
    } catch (error) {
      console.error("Error deleting parent:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/list/parents"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {parent.firstName || ""} {parent.lastName || ""} {(!parent.firstName && !parent.lastName) ? parent.name : ""}
            </h1>
            <p className="text-sm text-gray-500">Parent ID: {parent.username || parent.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Edit Modal Trigger */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
          >
            <Pencil className="w-5 h-5" />
            Edit
          </button>
          {/* TODO: Implement Edit Modal with correct FormModal props and schema */}
          {/* {isEditModalOpen && (
          <FormModal
              open={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSubmit={() => {}}
              title="Update Parent"
              schema={parentSchema}
              fields={parentFields}
            />
          )} */}
          {/* Delete Modal Trigger */}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors duration-200"
          >
            <Trash2 className="w-5 h-5" />
            Delete
          </button>
          {/* TODO: Implement Delete Modal with correct FormModal props and schema */}
          {/* {isDeleteModalOpen && (
            <FormModal
              open={isDeleteModalOpen}
              onClose={() => setIsDeleteModalOpen(false)}
              onSubmit={handleDelete}
              title="Delete Parent"
              schema={deleteSchema}
              fields={deleteFields}
            />
          )} */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
              <div className="flex items-center gap-2">
                <User className="text-blue-600 w-5 h-5" />
                <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="text-gray-900">{parent.firstName} {parent.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sex</p>
                <p className="text-gray-900 capitalize flex items-center gap-1">
                  <User className="w-4 h-4 text-blue-500" />
                  {parent.sex}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Blood Type</p>
                <p className="text-gray-900 flex items-center gap-1"><Droplet className="w-4 h-4 text-red-500" />{parent.bloodType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Birthday</p>
                <p className="text-gray-900 flex items-center gap-1"><Cake className="w-4 h-4 text-yellow-500" />{parent.birthday ? new Date(parent.birthday).toLocaleDateString() : "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Occupation</p>
                <p className="text-gray-900 flex items-center gap-1"><Briefcase className="w-4 h-4 text-gray-500" />{parent.occupation}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 bg-green-600 rounded-full"></div>
              <div className="flex items-center gap-2">
                <Mail className="text-green-600 w-5 h-5" />
                <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="text-gray-900 flex items-center gap-1"><Mail className="w-4 h-4 text-green-500" />{parent.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="text-gray-900 flex items-center gap-1"><Phone className="w-4 h-4 text-blue-500" />{parent.phone}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-gray-900 flex items-center gap-1"><MapPin className="w-4 h-4 text-gray-500" />{parent.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Associated Students */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-purple-600 rounded-full"></div>
            <div className="flex items-center gap-2">
              <School className="text-purple-600 w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900">Associated Students</h2>
            </div>
          </div>
          <div className="space-y-4">
            {parent.students.map((student) => (
              <Link
                key={student.id}
                href={`/list/students/${student.id}`}
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    {(student.grade || student.class) && (
                      <p className="text-sm text-gray-500">
                        {student.grade ? `Grade ${student.grade}` : ""}{student.grade && student.class ? " - " : ""}{student.class ? `Section ${student.class}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 