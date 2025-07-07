"use client";

import React, { useState } from 'react';
import { Plus, Download, Users, Mail } from 'lucide-react';
import {
  PageHeader,
  DataTable,
  StatusIndicator,
  EmptyState,
  SearchableSelect,
  BulkActionToolbar,
  FormBuilder,
} from '@/components/reusable';
import type { Column, TableAction } from '@/components/reusable/types';
import { Button } from '@/components/ui/button';

interface Student {
  id: string;
  name: string;
  email: string;
  department: string;
  status: string;
  attendanceRate: number;
}

// Example: Complete Student Management with all components
export const CompleteStudentExample = () => {
  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      department: 'Computer Science',
      status: 'active',
      attendanceRate: 92.5
    }
  ]);
  
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [showForm, setShowForm] = useState(false);

  const columns: Column<Student>[] = [
    {
      key: 'name',
      header: 'Name',
      accessor: 'name',
      sortable: true,
    },
    {
      key: 'email',
      header: 'Email',
      accessor: 'email',
      sortable: true,
    },
    {
      key: 'department',
      header: 'Department',
      accessor: 'department',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: 'status',
      render: (value: string) => (
        <StatusIndicator
          status={value === 'active' ? 'success' : 'warning'}
          label={value}
          variant="badge"
          size="sm"
        />
      )
    }
  ];

  const departmentOptions = [
    { value: 'cs', label: 'Computer Science' },
    { value: 'it', label: 'Information Technology' },
    { value: 'eng', label: 'Engineering' },
  ];

  const formFields = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter student name'
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email' as const,
      required: true,
      placeholder: 'student@example.com'
    },
    {
      name: 'department',
      label: 'Department',
      type: 'select' as const,
      required: true,
      options: departmentOptions
    }
  ];

  const [formValues, setFormValues] = useState<Partial<Student>>({});

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <PageHeader
        title="Student Management"
        subtitle="Manage students and track attendance"
        actions={[
          {
            label: "Add Student",
            variant: "primary",
            icon: <Plus className="w-4 h-4" />,
            onClick: () => setShowForm(true)
          }
        ]}
      />

      {/* Bulk Actions */}
      <BulkActionToolbar
        selectedItems={selectedStudents}
        onSelectionChange={setSelectedStudents}
        totalItems={students.length}
        actions={[
          {
            key: 'export',
            label: 'Export',
            icon: <Download className="w-4 h-4" />,
            onClick: (items) => console.log('Export:', items)
          },
          {
            key: 'email',
            label: 'Send Email',
            icon: <Mail className="w-4 h-4" />,
            onClick: (items) => console.log('Email:', items)
          }
        ]}
        hideWhenEmpty
      />

      {/* Data Table or Empty State */}
      {students.length > 0 ? (
        <DataTable<Student>
          data={students}
          columns={columns}
          selectable
          selectedRows={selectedStudents}
          onSelectionChange={setSelectedStudents}
          searchable
          sortable
        />
      ) : (
        <EmptyState
          scenario="students"
          variant="card"
          actionLabel="Add First Student"
          onAction={() => setShowForm(true)}
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Student</h3>
            <FormBuilder
              fields={formFields}
              values={formValues}
              onValuesChange={setFormValues}
              onSubmit={(values) => {
                console.log('Submit:', values);
                setShowForm(false);
              }}
              submitLabel="Add Student"
            />
            <button
              onClick={() => setShowForm(false)}
              className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompleteStudentExample; 