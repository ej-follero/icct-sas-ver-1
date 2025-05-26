"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { 
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Work as WorkIcon,
  Bloodtype as BloodtypeIcon,
  Cake as CakeIcon,
  Wc as WcIcon,
  School as SchoolIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import Link from "next/link";
import FormModal from "@/components/FormModal";
import ParentForm from "@/components/forms/ParentForm";

interface Parent {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  bloodType: string;
  birthday: string;
  sex: string;
  occupation: string;
  students: {
    id: number;
    name: string;
    grade: number;
    class: string;
  }[];
}

export default function ParentProfilePage() {
  const params = useParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Mock data - replace with actual API call
  const parent: Parent = {
    id: 1,
    username: "parent123",
    email: "parent@example.com",
    firstName: "John",
    lastName: "Doe",
    phone: "+1234567890",
    address: "123 Parent Street, City",
    bloodType: "O+",
    birthday: "1980-01-01",
    sex: "male",
    occupation: "Engineer",
    students: [
      {
        id: 1,
        name: "Jane Doe",
        grade: 10,
        class: "A"
      },
      {
        id: 2,
        name: "John Doe Jr.",
        grade: 8,
        class: "B"
      }
    ]
  };

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
            <ArrowBackIcon />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {parent.firstName} {parent.lastName}
            </h1>
            <p className="text-sm text-gray-500">Parent ID: {parent.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FormModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title="Update Parent"
            type="update"
          >
            <ParentForm type="update" data={parent} />
          </FormModal>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
          >
            <EditIcon style={{ fontSize: 20 }} />
            Edit
          </button>
          <FormModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            title="Delete Parent"
            type="delete"
            onConfirm={handleDelete}
          >
            <p className="text-gray-600">
              Are you sure you want to delete this parent? This action cannot be undone.
            </p>
          </FormModal>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors duration-200"
          >
            <DeleteIcon style={{ fontSize: 20 }} />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
              <div className="flex items-center gap-2">
                <PersonIcon className="text-blue-600" style={{ fontSize: 20 }} />
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
                <p className="text-gray-900 capitalize">{parent.sex}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Blood Type</p>
                <p className="text-gray-900">{parent.bloodType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Birthday</p>
                <p className="text-gray-900">{new Date(parent.birthday).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Occupation</p>
                <p className="text-gray-900">{parent.occupation}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 bg-green-600 rounded-full"></div>
              <div className="flex items-center gap-2">
                <EmailIcon className="text-green-600" style={{ fontSize: 20 }} />
                <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="text-gray-900">{parent.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="text-gray-900">{parent.phone}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-gray-900">{parent.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Associated Students */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-purple-600 rounded-full"></div>
            <div className="flex items-center gap-2">
              <SchoolIcon className="text-purple-600" style={{ fontSize: 20 }} />
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
                    <p className="text-sm text-gray-500">
                      Grade {student.grade} - Section {student.class}
                    </p>
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