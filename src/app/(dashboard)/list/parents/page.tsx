"use client";

import FormModal from "@/components/FormModal";
import Table from "@/components/Table";
import { parentsData, role, Parent } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Filter, SortAsc, Plus, Trash2, Pencil, Mail, Phone, MapPin, School, User, ChevronUp, ChevronDown, Search } from "lucide-react";
import ParentForm from "@/components/forms/ParentForm";
import { z } from 'zod';

type SortField = 'name' | 'students' | 'phone' | 'address';
type SortOrder = 'asc' | 'desc';

const columns = [
  {
    header: "Parent Info",
    accessor: "info",
    className: "w-[300px] text-center",
  },
  {
    header: "Students",
    accessor: "students",
    className: "hidden md:table-cell w-[250px] text-center",
  },
  {
    header: "Contact",
    accessor: "phone",
    className: "hidden lg:table-cell w-[150px] text-center",
  },
  {
    header: "Location",
    accessor: "address",
    className: "hidden lg:table-cell w-[200px] text-center",
  },
  {
    header: "Actions",
    accessor: "action",
    className: "w-[120px] text-center",
  },
];

const sortOptions = [
  { field: 'name' as const, label: 'Sort by Name' },
  { field: 'students' as const, label: 'Sort by Students' },
  { field: 'phone' as const, label: 'Sort by Phone' },
  { field: 'address' as const, label: 'Sort by Address' }
];

const ParentListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    students: [] as string[],
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'update' | 'delete' | null>(null);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);

  // Get unique students for filter options
  const uniqueStudents = useMemo(() => {
    const students = new Set<string>();
    parentsData.forEach(parent => {
      parent.students.forEach(student => students.add(student.name));
    });
    return Array.from(students);
  }, []);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let result = [...parentsData];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(parent => 
        parent.name.toLowerCase().includes(query) ||
        parent.email?.toLowerCase().includes(query) ||
        parent.phone?.includes(query) ||
        parent.address?.toLowerCase().includes(query) ||
        parent.students.some(student => student.name.toLowerCase().includes(query))
      );
    }

    // Apply student filters
    if (filters.students.length > 0) {
      result = result.filter(parent =>
        filters.students.some(studentName => parent.students.some(s => s.name === studentName))
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'students':
          comparison = a.students.map(s => s.name).join(',').localeCompare(b.students.map(s => s.name).join(','));
          break;
        case 'phone':
          comparison = (a.phone || '').localeCompare(b.phone || '');
          break;
        case 'address':
          comparison = (a.address || '').localeCompare(b.address || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [parentsData, searchQuery, sortField, sortOrder, filters]);

  // Calculate pagination
  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAndSortedData.slice(startIndex, endIndex);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setShowSort(false);
  };

  const handleFilterChange = (type: 'students', value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }));
  };

  const clearFilters = () => {
    setFilters({ students: [] });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Define schema and fields for FormModal
  const parentSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email').optional(),
    phone: z.string().min(1, 'Phone is required'),
    address: z.string().min(1, 'Address is required'),
    students: z.array(z.string()),
  });
  const parentFields = [
    { name: 'name', label: 'Name', type: 'text' as const },
    { name: 'email', label: 'Email', type: 'text' as const },
    { name: 'phone', label: 'Phone', type: 'text' as const },
    { name: 'address', label: 'Address', type: 'text' as const },
    // Add students field as needed
  ];

  const renderRow = (item: Parent) => (
    <>
      <td className="p-4 text-center">
        <div className="flex items-center gap-4 justify-center">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-50 ring-1 ring-gray-100 flex-shrink-0 group-hover:ring-2 group-hover:ring-blue-100 transition-all duration-200">
            <div className="w-full h-full flex items-center justify-center">
              <User className="text-gray-300 w-7 h-7" />
            </div>
          </div>
          <div className="flex flex-col min-w-0 text-left">
            <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">{item.name}</h3>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate">{item.email}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="hidden md:table-cell p-4 text-center">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {item.students.map((student, index) => (
            <Badge key={index} variant="info" className="flex items-center gap-1">
              <School className="w-3.5 h-3.5 mr-1 text-blue-700" />
              {student.name}
            </Badge>
          ))}
        </div>
      </td>
      <td className="hidden lg:table-cell p-4 text-center">
        <span className="text-sm text-gray-600 bg-gray-50/50 px-3 py-1.5 rounded-lg block text-center">
          {item.phone}
        </span>
      </td>
      <td className="hidden lg:table-cell p-4 text-center">
        <span className="text-sm text-gray-600 bg-gray-50/50 px-3 py-1.5 rounded-lg block text-center truncate max-w-[180px]">
          {item.address}
        </span>
      </td>
      <td className="p-4 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Link href={`/list/parents/${item.id}`}>
            <Button variant="ghost" size="icon">
              <Eye className="w-5 h-5 text-blue-600" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => { setModalType('update'); setSelectedParent(item); setModalOpen(true); }}>
            <Pencil className="w-5 h-5 text-green-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { setModalType('delete'); setSelectedParent(item); setModalOpen(true); }}>
            <Trash2 className="w-5 h-5 text-red-600" />
          </Button>
        </div>
      </td>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      <div className="max-w-[1920px] mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-100/50 backdrop-blur-sm">
          {/* Header */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">All Parents</h1>
                <p className="text-sm text-gray-500 mt-2">Manage and view all parent information in one place</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    className="pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                    placeholder="Search parents by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button variant={showFilters ? "default" : "outline"} onClick={() => setShowFilters(!showFilters)} className={showFilters ? "ring-1 ring-blue-100 shadow-sm" : ""} size="icon">
                    <Filter className="h-5 w-5" />
                  </Button>
                  {showFilters && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Filters</h3>
                        <Button variant="link" size="sm" onClick={clearFilters} className="text-blue-600 hover:text-blue-700 font-medium">Clear all</Button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Students</h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {uniqueStudents.map(student => (
                              <label key={student} className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200">
                                <input
                                  type="checkbox"
                                  checked={filters.students.includes(student)}
                                  onChange={() => handleFilterChange('students', student)}
                                  className="rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">{student}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <Button variant={showSort ? "default" : "outline"} onClick={() => setShowSort(!showSort)} className={showSort ? "ring-1 ring-blue-100 shadow-sm" : ""} size="icon">
                    <SortAsc className="h-5 w-5" />
                    {sortOrder === 'asc' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  {showSort && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-10">
                      <div className="py-1">
                        {sortOptions.map((option) => (
                          <Button
                            key={option.field}
                            variant={sortField === option.field ? "default" : "ghost"}
                            onClick={() => handleSort(option.field)}
                            className="w-full px-3 py-2.5 text-sm rounded-lg flex items-center justify-between"
                          >
                            <span>{option.label}</span>
                            {sortField === option.field && (
                              sortOrder === 'asc' ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button onClick={() => { setModalType('create'); setSelectedParent(null); setModalOpen(true); }} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Parent</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table columns={columns} renderRow={renderRow} data={currentItems} />
          </div>

          {/* Pagination */}
          <div className="p-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-700">{startIndex + 1}</span> to <span className="font-medium text-gray-700">{Math.min(endIndex, totalItems)}</span> of <span className="font-medium text-gray-700">{totalItems}</span> entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={currentPage === page ? "shadow-sm" : ""}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (data) => {
          // Implement create, update, or delete logic here
          setModalOpen(false);
        }}
        title={modalType === 'create' ? 'Add New Parent' : modalType === 'update' ? 'Edit Parent' : 'Delete Parent'}
        submitLabel={modalType === 'delete' ? 'Delete' : modalType === 'update' ? 'Update' : 'Add'}
        defaultValues={modalType === 'update' && selectedParent ? selectedParent : undefined}
        schema={parentSchema}
        fields={parentFields}
      />
    </div>
  );
};

export default ParentListPage;
