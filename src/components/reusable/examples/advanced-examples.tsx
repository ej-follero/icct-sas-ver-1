"use client";

import React, { useState, useMemo } from 'react';
import { Plus, Download, Edit, Trash2, Users, Mail } from 'lucide-react';
import {
  PageHeader,
  DataTable,
  StatusIndicator,
  EmptyState,
  SearchableSelect,
  BulkActionToolbar,
  FormBuilder,
  StudentBulkToolbar,
} from '@/components/reusable';
import type { Column, TableAction, FormField, SelectOption, FormGroup } from '@/components/reusable/types';
import { Button } from '@/components/ui/button';

// Example data types
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  department: string;
  year: number;
  status: 'active' | 'inactive' | 'suspended';
  enrollmentDate: string;
  gpa: number;
  attendanceRate: number;
}

interface StudentFormValues {
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  department: string;
  year: string;
  status: string;
  enrollmentDate: string;
  parentEmail: string;
  emergencyContact: string;
  hasScholarship: boolean;
  notes: string;
}

// Mock data
const mockStudents: Student[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    studentId: 'STU001',
    department: 'Computer Science',
    year: 2,
    status: 'active',
    enrollmentDate: '2023-09-01',
    gpa: 3.8,
    attendanceRate: 92.5
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@email.com',
    studentId: 'STU002',
    department: 'Information Technology',
    year: 3,
    status: 'active',
    enrollmentDate: '2022-09-01',
    gpa: 3.6,
    attendanceRate: 88.2
  },
  {
    id: '3',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.johnson@email.com',
    studentId: 'STU003',
    department: 'Computer Science',
    year: 1,
    status: 'inactive',
    enrollmentDate: '2024-09-01',
    gpa: 2.9,
    attendanceRate: 65.0
  },
];

const departmentOptions: SelectOption[] = [
  { value: 'cs', label: 'Computer Science', description: 'Software development and programming' },
  { value: 'it', label: 'Information Technology', description: 'Network and systems administration' },
  { value: 'eng', label: 'Engineering', description: 'General engineering disciplines' },
  { value: 'math', label: 'Mathematics', description: 'Pure and applied mathematics' },
];

// Example 1: Complete Student Management Page
export const StudentManagementPage = () => {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Table columns
  const columns: Column<Student>[] = [
    {
      key: 'name',
      header: 'Student Name',
      accessor: (row) => `${row.firstName} ${row.lastName}`,
      sortable: true,
      render: (value: string, row: Student) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {row.firstName[0]}{row.lastName[0]}
            </span>
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-sm text-muted-foreground">{row.studentId}</div>
          </div>
        </div>
      )
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
      render: (value: number) => `Year ${value}`
    },
    {
      key: 'status',
      header: 'Status',
      accessor: 'status',
      render: (value: string) => (
        <StatusIndicator
          status={value === 'active' ? 'success' : value === 'inactive' ? 'warning' : 'error'}
          label={value.charAt(0).toUpperCase() + value.slice(1)}
          variant="badge"
          size="sm"
        />
      )
    },
    {
      key: 'gpa',
      header: 'GPA',
      accessor: 'gpa',
      sortable: true,
      align: 'center',
      render: (value: number) => value.toFixed(1)
    },
    {
      key: 'attendanceRate',
      header: 'Attendance',
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

  // Row actions
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
      onClick: (rows) => handleDeleteStudents(rows.map(r => r.id)),
      disabled: (rows) => rows[0].status === 'active',
    }
  ];

  // Handlers
  const handleAddStudent = () => {
    setShowAddForm(true);
  };

  const handleExportData = () => {
    setLoading(true);
    setTimeout(() => {
      console.log('Exporting students...');
      setLoading(false);
    }, 2000);
  };

  const handleDeleteStudents = (studentIds: string[]) => {
    setStudents(prev => prev.filter(s => !studentIds.includes(s.id)));
    setSelectedStudents([]);
  };

  const handleEmailStudents = (students: Student[]) => {
    console.log('Emailing students:', students.map(s => s.email));
  };

  const handleExportSelected = (students: Student[]) => {
    console.log('Exporting selected students:', students);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
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
            label: "Export All",
            variant: "secondary",
            icon: <Download className="w-4 h-4" />,
            onClick: handleExportData,
            disabled: loading
          }
        ]}
        loading={loading}
      >
        {/* Quick stats in header */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">Total Students</h3>
            <p className="text-2xl font-bold text-blue-600">{students.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">Active Students</h3>
            <p className="text-2xl font-bold text-green-600">
              {students.filter(s => s.status === 'active').length}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900">Avg. Attendance</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {(students.reduce((acc, s) => acc + s.attendanceRate, 0) / students.length).toFixed(1)}%
            </p>
          </div>
        </div>
      </PageHeader>

      {/* Bulk Action Toolbar */}
      <StudentBulkToolbar
        selectedItems={selectedStudents}
        onSelectionChange={setSelectedStudents}
        totalItems={students.length}
        onExport={handleExportSelected}
        onDelete={handleDeleteStudents}
        onEmail={handleEmailStudents}
        quickStats={[
          {
            label: "Avg GPA",
            value: selectedStudents.length > 0 
              ? (selectedStudents.reduce((acc, s) => acc + s.gpa, 0) / selectedStudents.length).toFixed(1)
              : "0.0"
          }
        ]}
        hideWhenEmpty
      />

      {/* Data Table */}
      {students.length > 0 ? (
        <DataTable
          data={students}
          columns={columns}
          selectable
          selectedRows={selectedStudents}
          onSelectionChange={setSelectedStudents}
          searchable
          sortable
          loading={loading}
          rowActions={rowActions}
          onRowClick={(student) => console.log('Row clicked:', student)}
          striped
        />
      ) : (
        <EmptyState
          scenario="students"
          variant="card"
          actionLabel="Add First Student"
          onAction={handleAddStudent}
        />
      )}

      {/* Add Student Form Modal (simplified) */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <StudentFormExample onClose={() => setShowAddForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

// Example 2: Advanced Form with SearchableSelect
export const StudentFormExample: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const initialFormValues: StudentFormValues = {
    firstName: '',
    lastName: '',
    email: '',
    studentId: '',
    department: '',
    year: '',
    status: 'active',
    enrollmentDate: '',
    parentEmail: '',
    emergencyContact: '',
    hasScholarship: false,
    notes: '',
  };

  const [formValues, setFormValues] = useState<StudentFormValues>(initialFormValues);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Form configuration
  const personalInfoFields: FormField[] = [
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      required: true,
      placeholder: 'Enter first name',
      validation: { min: 2, max: 50 }
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      required: true,
      placeholder: 'Enter last name',
      validation: { min: 2, max: 50 }
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'student@example.com',
      validation: { 
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        custom: (value) => {
          if (!value?.includes('@')) return 'Please enter a valid email address';
          return undefined;
        }
      }
    },
    {
      name: 'studentId',
      label: 'Student ID',
      type: 'text',
      required: true,
      placeholder: 'STU001',
      helperText: 'Unique identifier for the student'
    },
  ];

  const academicInfoFields: FormField[] = [
    {
      name: 'department',
      label: 'Department',
      type: 'select',
      required: true,
      options: departmentOptions.map(dept => ({
        value: dept.value,
        label: dept.label
      }))
    },
    {
      name: 'year',
      label: 'Academic Year',
      type: 'select',
      required: true,
      options: [
        { value: '1', label: 'Year 1' },
        { value: '2', label: 'Year 2' },
        { value: '3', label: 'Year 3' },
        { value: '4', label: 'Year 4' },
      ]
    },
    {
      name: 'enrollmentDate',
      label: 'Enrollment Date',
      type: 'date',
      required: true,
    },
    {
      name: 'hasScholarship',
      label: 'Has Scholarship',
      type: 'checkbox',
      placeholder: 'Student has a scholarship'
    },
  ];

  const contactInfoFields: FormField[] = [
    {
      name: 'parentEmail',
      label: 'Parent Email',
      type: 'email',
      placeholder: 'parent@example.com',
    },
    {
      name: 'emergencyContact',
      label: 'Emergency Contact',
      type: 'text',
      placeholder: 'Phone number or contact person',
    },
    {
      name: 'notes',
      label: 'Additional Notes',
      type: 'textarea',
      placeholder: 'Any additional information about the student...',
    },
  ];

  const formGroups: FormGroup[] = [
    {
      title: 'Personal Information',
      description: 'Basic student details',
      fields: personalInfoFields
    },
    {
      title: 'Academic Information',
      description: 'Student academic details',
      fields: academicInfoFields
    },
    {
      title: 'Contact Information',
      description: 'Parent and emergency contact details',
      fields: contactInfoFields,
      collapsible: true,
      defaultCollapsed: false
    }
  ];

  const handleSubmit = (values: Record<string, any>) => {
    console.log('Submitting student:', values);
    // Simulate API call
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleValuesChange = (values: Record<string, any>) => {
    setFormValues(prev => ({
      ...prev,
      ...values
    }));
  };

  const handleReset = () => {
    setFormValues(initialFormValues);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Add New Student</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <FormBuilder
        groups={formGroups}
        values={formValues}
        onValuesChange={handleValuesChange}
        onSubmit={handleSubmit}
        errors={formErrors}
        touched={touched}
        columns="double"
        layout="compact"
        submitLabel="Add Student"
        showReset
        onReset={handleReset}
      />
    </div>
  );
};

// Example 3: Department Filter with SearchableSelect
export const DepartmentFilterExample = () => {
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCreateDepartment = (inputValue: string) => {
    console.log('Creating new department:', inputValue);
    // Add to options or trigger API call
  };

  const handleValueChange = (value: string | string[]) => {
    if (Array.isArray(value)) {
      setSelectedDepartments(value);
    } else {
      setSelectedDepartments([value]);
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      <h3 className="text-lg font-semibold">Filter by Departments</h3>
      
      <SearchableSelect
        label="Select Departments"
        options={departmentOptions}
        value={selectedDepartments}
        onValueChange={handleValueChange}
        placeholder="Choose departments..."
        searchPlaceholder="Search departments..."
        multiple
        clearable
        maxSelected={3}
        groupBy={false}
        onCreate={handleCreateDepartment}
        createLabel="Create Department"
        helperText="You can select up to 3 departments"
        renderOption={(option) => (
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-muted-foreground">{option.description}</div>
            </div>
          </div>
        )}
      />

      <div className="text-sm text-muted-foreground">
        Selected: {selectedDepartments.length} department(s)
      </div>
    </div>
  );
};

// Example 4: Status Indicators Showcase
export const StatusIndicatorsExample = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Status Indicators</h3>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Default variant */}
        <div className="space-y-3">
          <h4 className="font-medium">Default Variant</h4>
          <div className="space-y-2">
            <StatusIndicator status="online" label="System Online" />
            <StatusIndicator status="offline" label="System Offline" />
            <StatusIndicator status="pending" label="Processing" animated />
            <StatusIndicator status="error" label="Connection Error" />
            <StatusIndicator status="success" label="All Good" />
            <StatusIndicator status="warning" label="Low Storage" />
          </div>
        </div>

        {/* Badge variant */}
        <div className="space-y-3">
          <h4 className="font-medium">Badge Variant</h4>
          <div className="space-y-2">
            <StatusIndicator status="online" label="Active" variant="badge" size="sm" />
            <StatusIndicator status="warning" label="Inactive" variant="badge" size="sm" />
            <StatusIndicator status="error" label="Suspended" variant="badge" size="sm" />
            <StatusIndicator status="success" label="Enrolled" variant="badge" size="sm" />
          </div>
        </div>

        {/* Card variant */}
        <div className="space-y-3">
          <h4 className="font-medium">Card Variant</h4>
          <div className="grid grid-cols-1 gap-2">
            <StatusIndicator 
              status="online" 
              label="RFID System" 
              variant="card" 
              showDot 
            >
              <div className="text-xs text-muted-foreground">Last ping: 2 seconds ago</div>
            </StatusIndicator>
            <StatusIndicator 
              status="warning" 
              label="Attendance Server" 
              variant="card" 
              showDot 
            >
              <div className="text-xs text-muted-foreground">High CPU usage</div>
            </StatusIndicator>
          </div>
        </div>

        {/* Interactive status */}
        <div className="space-y-3">
          <h4 className="font-medium">Interactive Status</h4>
          <div className="space-y-2">
            <StatusIndicator 
              status="online" 
              label="View Details" 
              variant="badge"
              onClick={() => console.log('Status clicked')}
            />
            <StatusIndicator 
              status="error" 
              label="Check Logs" 
              variant="badge"
              href="/logs"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default {
  StudentManagementPage,
  StudentFormExample,
  DepartmentFilterExample,
  StatusIndicatorsExample,
}; 