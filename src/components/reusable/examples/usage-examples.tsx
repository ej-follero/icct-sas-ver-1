"use client";

import React, { useState } from 'react';
import { Users, Download, Edit, Trash2, Plus } from 'lucide-react';
import { PageHeader } from '@/components/reusable/PageHeader';
import { DataTable } from '@/components/reusable/Table/Table';
import type { Column, TableAction, BulkActionConfig } from '@/components/reusable/types';

// Example data types
interface Student {
  id: string;
  name: string;
  email: string;
  department: string;
  year: number;
  status: 'active' | 'inactive' | 'suspended';
  attendanceRate: number;
}

// Mock data
const mockStudents: Student[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@email.com',
    department: 'Computer Science',
    year: 2,
    status: 'active',
    attendanceRate: 92.5
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@email.com',
    department: 'Information Technology',
    year: 3,
    status: 'active',
    attendanceRate: 88.2
  },
  // Add more mock data...
];

// Example 1: Basic PageHeader Usage
export const BasicPageHeaderExample = () => {
  return (
    <PageHeader
      title="Student Management"
      subtitle="Manage students, view attendance, and generate reports"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Students", href: "/students" },
        { label: "All Students", active: true }
      ]}
      actions={[
        {
          label: "Add Student",
          variant: "primary",
          icon: <Plus className="w-4 h-4" />,
          onClick: () => console.log("Add student clicked")
        },
        {
          label: "Export Data",
          variant: "secondary",
          icon: <Download className="w-4 h-4" />,
          onClick: () => console.log("Export clicked")
        }
      ]}
    />
  );
};

// Example 2: Advanced PageHeader with Custom Content
export const AdvancedPageHeaderExample = () => {
  return (
    <PageHeader
      title="Student Analytics"
      subtitle="Comprehensive student performance analytics"
      size="lg"
      actions={[
        {
          label: "Generate Report",
          variant: "primary",
          icon: <Download className="w-4 h-4" />,
          onClick: () => console.log("Generate report")
        }
      ]}
    >
      {/* Custom content in header */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900">Total Students</h3>
          <p className="text-2xl font-bold text-blue-600">1,247</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-900">Present Today</h3>
          <p className="text-2xl font-bold text-green-600">1,156</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="font-semibold text-red-900">Absent Today</h3>
          <p className="text-2xl font-bold text-red-600">91</p>
        </div>
      </div>
    </PageHeader>
  );
};

// Example 3: Basic DataTable Usage
export const BasicDataTableExample = () => {
  const columns: Column<Student>[] = [
    {
      key: 'name',
      header: 'Student Name',
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
      key: 'year',
      header: 'Year',
      accessor: 'year',
      sortable: true,
      align: 'center',
    },
    {
      key: 'status',
      header: 'Status',
      accessor: 'status',
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
          value === 'active' ? 'bg-green-100 text-green-800' :
          value === 'inactive' ? 'bg-gray-100 text-gray-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    {
      key: 'attendanceRate',
      header: 'Attendance Rate',
      accessor: 'attendanceRate',
      sortable: true,
      align: 'right',
      render: (value: number) => `${value}%`
    }
  ];

  return (
    <DataTable
      data={mockStudents}
      columns={columns}
      searchable
      sortable
      striped
    />
  );
};

// Example 4: Advanced DataTable with Selection and Actions
export const AdvancedDataTableExample = () => {
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);

  const columns: Column<Student>[] = [
    {
      key: 'name',
      header: 'Student Name',
      accessor: 'name',
      sortable: true,
      render: (value: string, row: Student) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {value.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-sm text-gray-500">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'department',
      header: 'Department',
      accessor: 'department',
      sortable: true,
    },
    {
      key: 'year',
      header: 'Year',
      accessor: 'year',
      sortable: true,
      align: 'center',
      render: (value: number) => `Year ${value}`
    },
    {
      key: 'attendanceRate',
      header: 'Attendance Rate',
      accessor: 'attendanceRate',
      sortable: true,
      align: 'right',
      render: (value: number) => (
        <div className="flex items-center justify-end space-x-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                value >= 90 ? 'bg-green-500' : 
                value >= 75 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-sm font-medium">{value}%</span>
        </div>
      )
    }
  ];

  const rowActions: TableAction<Student>[] = [
    {
      key: 'view',
      label: 'View Details',
      icon: <Users className="w-4 h-4" />,
      onClick: (rows) => console.log('View:', rows[0]),
    },
    {
      key: 'edit',
      label: 'Edit Student',
      icon: <Edit className="w-4 h-4" />,
      onClick: (rows) => console.log('Edit:', rows[0]),
    },
    {
      key: 'delete',
      label: 'Delete Student',
      icon: <Trash2 className="w-4 h-4" />,
      variant: 'danger',
      onClick: (rows) => console.log('Delete:', rows[0]),
      disabled: (rows) => rows[0].status === 'active', // Can't delete active students
    }
  ];

  const bulkActions: BulkActionConfig<Student> = {
    actions: [
      {
        key: 'export',
        label: 'Export Selected',
        icon: <Download className="w-4 h-4" />,
        variant: 'secondary',
        onClick: (rows) => console.log('Export:', rows),
      },
      {
        key: 'deactivate',
        label: 'Deactivate Selected',
        icon: <Trash2 className="w-4 h-4" />,
        variant: 'danger',
        onClick: (rows) => console.log('Deactivate:', rows),
        disabled: (rows) => rows.some(r => r.status !== 'active'),
      }
    ],
    selectedItems: selectedStudents,
    onSelectionChange: setSelectedStudents,
    totalItems: mockStudents.length,
  };

  return (
    <DataTable
      data={mockStudents}
      columns={columns}
      selectable
      selectedRows={selectedStudents}
      onSelectionChange={setSelectedStudents}
      searchable
      sortable
      striped
      rowActions={rowActions}
      bulkActions={bulkActions}
      onRowClick={(student) => console.log('Row clicked:', student)}
      emptyMessage="No students found. Add some students to get started."
    />
  );
};

// Example 5: Loading State Example
export const LoadingDataTableExample = () => {
  const columns: Column<Student>[] = [
    {
      key: 'name',
      header: 'Student Name',
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
    }
  ];

  return (
    <DataTable
      data={[]}
      columns={columns}
      loading={true}
      searchable
      sortable
    />
  );
};

// Example 6: Complete Page Example
export const CompletePageExample = () => {
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  const columns: Column<Student>[] = [
    {
      key: 'name',
      header: 'Student Name',
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
      key: 'attendanceRate',
      header: 'Attendance Rate',
      accessor: 'attendanceRate',
      sortable: true,
      align: 'right',
      render: (value: number) => `${value}%`
    }
  ];

  const handleAddStudent = () => {
    console.log('Adding new student...');
    // Implement add student logic
  };

  const handleExportData = () => {
    setLoading(true);
    console.log('Exporting data...');
    // Simulate export
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Management"
        subtitle="Manage students, view attendance, and generate reports"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Students", active: true }
        ]}
        actions={[
          {
            label: "Add Student",
            variant: "primary",
            icon: <Plus className="w-4 h-4" />,
            onClick: handleAddStudent
          },
          {
            label: "Export Data",
            variant: "secondary",
            icon: <Download className="w-4 h-4" />,
            onClick: handleExportData,
            disabled: loading
          }
        ]}
        loading={loading}
      />

      <DataTable
        data={mockStudents}
        columns={columns}
        selectable
        selectedRows={selectedStudents}
        onSelectionChange={setSelectedStudents}
        searchable
        sortable
        loading={loading}
        bulkActions={{
          actions: [
            {
              key: 'export-selected',
              label: 'Export Selected',
              icon: <Download className="w-4 h-4" />,
              variant: 'secondary',
              onClick: (rows) => console.log('Export selected:', rows),
            }
          ],
          selectedItems: selectedStudents,
          onSelectionChange: setSelectedStudents,
          totalItems: mockStudents.length,
        }}
      />
    </div>
  );
};

export default {
  BasicPageHeaderExample,
  AdvancedPageHeaderExample,
  BasicDataTableExample,
  AdvancedDataTableExample,
  LoadingDataTableExample,
  CompletePageExample,
}; 