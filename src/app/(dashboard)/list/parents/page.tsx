"use client";

import FormModal from "@/components/FormModal";
import Table from "@/components/Table";
import { parentsData, role } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import ParentForm from "@/components/forms/ParentForm";

type Parent = {
  id: number;
  name: string;
  email?: string;
  students: string[];
  phone: string;
  address: string;
};

type SortField = 'name' | 'students' | 'phone' | 'address';
type SortOrder = 'asc' | 'desc';

const columns = [
  {
    header: "Parent Info",
    accessor: "info",
    className: "w-[300px]",
  },
  {
    header: "Students",
    accessor: "students",
    className: "hidden md:table-cell w-[250px]",
  },
  {
    header: "Contact",
    accessor: "phone",
    className: "hidden lg:table-cell w-[150px]",
  },
  {
    header: "Location",
    accessor: "address",
    className: "hidden lg:table-cell w-[200px]",
  },
  {
    header: "Actions",
    accessor: "action",
    className: "w-[120px]",
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

  // Get unique students for filter options
  const uniqueStudents = useMemo(() => {
    const students = new Set<string>();
    parentsData.forEach(parent => {
      parent.students.forEach(student => students.add(student));
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
        parent.phone.includes(query) ||
        parent.address.toLowerCase().includes(query) ||
        parent.students.some(student => student.toLowerCase().includes(query))
      );
    }

    // Apply student filters
    if (filters.students.length > 0) {
      result = result.filter(parent =>
        filters.students.some(student => parent.students.includes(student))
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
          comparison = a.students.join(',').localeCompare(b.students.join(','));
          break;
        case 'phone':
          comparison = a.phone.localeCompare(b.phone);
          break;
        case 'address':
          comparison = a.address.localeCompare(b.address);
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

  const renderRow = (item: Parent) => (
    <tr
      key={item.id}
      className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200 group"
    >
      <td className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-50 ring-1 ring-gray-100 flex-shrink-0 group-hover:ring-2 group-hover:ring-blue-100 transition-all duration-200">
            <div className="w-full h-full flex items-center justify-center">
              <PersonIcon className="text-gray-300" style={{ fontSize: 28 }} />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">{item.name}</h3>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <EmailIcon style={{ fontSize: 14 }} />
              <span className="truncate">{item.email}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="hidden md:table-cell p-4">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {item.students.map((student, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-100 hover:bg-blue-100 transition-colors duration-200"
            >
              <SchoolIcon style={{ fontSize: 14, marginRight: 4 }} />
              {student}
            </span>
          ))}
        </div>
      </td>
      <td className="hidden lg:table-cell p-4">
        <span className="text-sm text-gray-600 bg-gray-50/50 px-3 py-1.5 rounded-lg block text-center">
          {item.phone}
        </span>
      </td>
      <td className="hidden lg:table-cell p-4">
        <span className="text-sm text-gray-600 bg-gray-50/50 px-3 py-1.5 rounded-lg block text-center truncate max-w-[180px]">
          {item.address}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center justify-center gap-1.5">
          <Link href={`/list/parents/${item.id}`}>
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors duration-200">
              <VisibilityIcon style={{ fontSize: 20 }} />
            </button>
          </Link>
          {role === "admin" && (
            <>
              <FormModal
                table="parent"
                type="update"
                data={item}
              />
              <FormModal
                table="parent"
                type="delete"
                id={item.id}
              />
            </>
          )}
        </div>
      </td>
    </tr>
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
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:w-80">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="text-gray-400" style={{ fontSize: 20 }} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search parents by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className={`p-3 rounded-xl transition-all duration-200 ${
                        showFilters 
                          ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-100 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <FilterListIcon style={{ fontSize: 20 }} />
                    </button>
                    {showFilters && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-10">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-900">Filters</h3>
                          <button 
                            onClick={clearFilters}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                          >
                            Clear all
                          </button>
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
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setShowSort(!showSort)}
                      className={`p-3 rounded-xl transition-all duration-200 ${
                        showSort 
                          ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-100 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <SortIcon style={{ fontSize: 20 }} />
                        {sortOrder === 'asc' ? (
                          <ArrowUpwardIcon style={{ fontSize: 16 }} />
                        ) : (
                          <ArrowDownwardIcon style={{ fontSize: 16 }} />
                        )}
                      </div>
                    </button>
                    {showSort && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-10">
                        <div className="py-1">
                          {sortOptions.map((option) => (
                            <button
                              key={option.field}
                              onClick={() => handleSort(option.field)}
                              className={`w-full px-3 py-2.5 text-sm rounded-lg flex items-center justify-between transition-colors duration-200 ${
                                sortField === option.field
                                  ? 'bg-blue-50 text-blue-600 font-medium'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span>{option.label}</span>
                              {sortField === option.field && (
                                sortOrder === 'asc' ? (
                                  <ArrowUpwardIcon style={{ fontSize: 16 }} />
                                ) : (
                                  <ArrowDownwardIcon style={{ fontSize: 16 }} />
                                )
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {role === "admin" && (
                    <div className="relative">
                      <FormModal
                        table="parent"
                        type="create"
                      />
                    </div>
                  )}
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
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        currentPage === page
                          ? 'bg-blue-50 text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentListPage;
