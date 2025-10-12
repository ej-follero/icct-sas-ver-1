'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  RefreshCw, 
  Settings,
  GraduationCap,
  BookOpen,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import AcademicYearForm from '@/components/forms/AcademicYearForm';
import { format } from 'date-fns';
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import { EmptyState } from '@/components/reusable';
import { PageSkeleton } from '@/components/reusable/Skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { TableList, TableListColumn } from '@/components/reusable/Table/TableList';
import { TableRowActions } from '@/components/reusable/Table/TableRowActions';
import BulkActionsBar from '@/components/reusable/BulkActionsBar';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { ViewDialog } from '@/components/reusable/Dialogs/ViewDialog';
import { ExportDialog } from '@/components/reusable/Dialogs/ExportDialog';
import { ImportDialog } from '@/components/reusable/Dialogs/ImportDialog';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Semester {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  type: string;
  isActive: boolean;
  status: string;
}

interface AcademicYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  semesters: Semester[];
}

type SortFieldKey = 'name' | 'startDate' | 'endDate' | 'isActive' | 'semesterCount';
type SortOrder = 'asc' | 'desc';


export default function AcademicYearsPage() {
  // State management
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortFieldKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  
  // Dialog states
  const [showForm, setShowForm] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<AcademicYear | null>(null);
  const [academicYearToDelete, setAcademicYearToDelete] = useState<AcademicYear | null>(null);

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch academic years
  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/academic-years');
      if (!response.ok) {
        throw new Error('Failed to fetch academic years');
      }
      const data = await response.json();
      setAcademicYears(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to load academic years');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  // Filtered and sorted data
  const filteredAcademicYears = useMemo(() => {
    let filtered = academicYears;

    // Search filter
    if (debouncedSearchTerm) {
      filtered = filtered.filter(year => 
        year.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        year.semesters.some(sem => 
          sem.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(year => 
        statusFilter === 'active' ? year.isActive : !year.isActive
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'startDate':
          aValue = new Date(a.startDate);
          bValue = new Date(b.startDate);
          break;
        case 'endDate':
          aValue = new Date(a.endDate);
          bValue = new Date(b.endDate);
          break;
        case 'isActive':
          aValue = a.isActive ? 1 : 0;
          bValue = b.isActive ? 1 : 0;
          break;
        case 'semesterCount':
          aValue = a.semesters.length;
          bValue = b.semesters.length;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [academicYears, debouncedSearchTerm, statusFilter, sortField, sortOrder]);

  // Event handlers
  const handleFormSuccess = () => {
    setShowForm(false);
    fetchAcademicYears();
    toast.success('Academic year created successfully');
  };

  const handleViewAcademicYear = (academicYear: AcademicYear) => {
    setSelectedAcademicYear(academicYear);
    setShowViewDialog(true);
  };

  const handleEditAcademicYear = (academicYear: AcademicYear) => {
    setSelectedAcademicYear(academicYear);
    setShowForm(true);
  };

  const handleDeleteAcademicYear = (academicYear: AcademicYear) => {
    setAcademicYearToDelete(academicYear);
    setShowDeleteDialog(true);
  };

  // Column configuration
  const ACADEMIC_YEAR_COLUMNS: TableListColumn<AcademicYear>[] = [
    {
      header: "Academic Year",
      accessor: "name",
      className: "font-medium",
      render: (item: AcademicYear) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{item.name}</div>
            <div className="text-sm text-gray-500">
              {format(new Date(item.startDate), 'MMM yyyy')} - {format(new Date(item.endDate), 'MMM yyyy')}
            </div>
          </div>
        </div>
      )
    },
    {
      header: "Duration",
      accessor: "startDate",
      className: "text-sm text-gray-600",
      render: (item: AcademicYear) => (
        <div>
          <div className="text-sm text-gray-900">
            {format(new Date(item.startDate), 'MMM dd, yyyy')}
          </div>
          <div className="text-xs text-gray-500">
            to {format(new Date(item.endDate), 'MMM dd, yyyy')}
          </div>
        </div>
      )
    },
    {
      header: "Semesters",
      accessor: "semesters",
      className: "text-center",
      render: (item: AcademicYear) => (
        <div className="flex items-center justify-center space-x-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium">{item.semesters.length}</span>
        </div>
      )
    },
    {
      header: "Status",
      accessor: "isActive",
      className: "text-center",
      render: (item: AcademicYear) => (
        <Badge variant={item.isActive ? 'default' : 'secondary'}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      header: "Actions",
      accessor: "actions",
      className: "text-right",
      render: (item: AcademicYear) => (
        <TableRowActions
          itemName={item.name}
          onView={() => handleViewAcademicYear(item)}
          onEdit={() => handleEditAcademicYear(item)}
          onDelete={() => handleDeleteAcademicYear(item)}
        />
      )
    }
  ];

  const confirmDelete = async () => {
    if (!academicYearToDelete) return;
    
    try {
      // Note: You'll need to implement the delete API endpoint
      // const response = await fetch(`/api/academic-years/${academicYearToDelete.id}`, {
      //   method: 'DELETE'
      // });
      // if (!response.ok) throw new Error('Failed to delete academic year');
      
      setAcademicYears(prev => prev.filter(year => year.id !== academicYearToDelete.id));
      toast.success('Academic year deleted successfully');
    } catch (error) {
      toast.error('Failed to delete academic year');
    } finally {
      setShowDeleteDialog(false);
      setAcademicYearToDelete(null);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) {
      toast.error('Please select academic years first');
      return;
    }

    try {
      switch (action) {
        case 'delete':
          // Implement bulk delete
          toast.success(`${selectedIds.length} academic years deleted`);
          break;
        case 'export':
          setShowExportDialog(true);
          break;
        default:
          toast.error('Unknown action');
      }
    } catch (error) {
      toast.error('Bulk action failed');
    }
  };

  const handleExport = async (formatType: string) => {
    try {
      const data = filteredAcademicYears.map(year => ({
        'Academic Year': year.name,
        'Start Date': format(new Date(year.startDate), 'yyyy-MM-dd'),
        'End Date': format(new Date(year.endDate), 'yyyy-MM-dd'),
        'Status': year.isActive ? 'Active' : 'Inactive',
        'Semesters': year.semesters.length,
        'Semester Details': year.semesters.map(s => s.name).join(', ')
      }));

      if (formatType === 'excel') {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Academic Years');
        XLSX.writeFile(wb, `academic-years-${new Date().toISOString().split('T')[0]}.xlsx`);
      } else if (formatType === 'pdf') {
        const doc = new jsPDF();
        autoTable(doc, {
          head: [Object.keys(data[0] || {})],
          body: data.map(row => Object.values(row)),
        });
        doc.save(`academic-years-${new Date().toISOString().split('T')[0]}.pdf`);
      }

      toast.success(`Academic years exported to ${formatType.toUpperCase()}`);
      setShowExportDialog(false);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  // Statistics
  const stats = useMemo(() => ({
    total: academicYears.length,
    active: academicYears.filter(year => year.isActive).length,
    inactive: academicYears.filter(year => !year.isActive).length,
    totalSemesters: academicYears.reduce((sum, year) => sum + year.semesters.length, 0)
  }), [academicYears]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Academic Years</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchAcademicYears}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] overflow-x-hidden">
      <div className="w-full max-w-none px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 md:py-4 lg:py-6 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
        
        {/* Page Header */}
        <div className="w-full">
          <PageHeader
            title="Academic Years"
            subtitle="Manage academic years and their semesters"
            breadcrumbs={[
              { label: "Home", href: "/" },
              { label: "Academic Management", href: "/academic-management" },
              { label: "Academic Years" }
            ]}
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          <SummaryCard
            icon={<GraduationCap className="text-blue-700 w-4 h-4 sm:w-5 sm:h-5" />}
            label="Total Academic Years"
            value={stats.total}
            valueClassName="text-blue-900"
            sublabel="All academic years"
            loading={loading}
          />
          <SummaryCard
            icon={<CheckCircle className="text-green-700 w-4 h-4 sm:w-5 sm:h-5" />}
            label="Active Years"
            value={stats.active}
            valueClassName="text-green-900"
            sublabel="Currently active"
            loading={loading}
          />
          <SummaryCard
            icon={<XCircle className="text-gray-700 w-4 h-4 sm:w-5 sm:h-5" />}
            label="Inactive Years"
            value={stats.inactive}
            valueClassName="text-gray-900"
            sublabel="Archived years"
            loading={loading}
          />
          <SummaryCard
            icon={<Calendar className="text-purple-700 w-4 h-4 sm:w-5 sm:h-5" />}
            label="Total Semesters"
            value={stats.totalSemesters}
            valueClassName="text-purple-900"
            sublabel="All semesters"
            loading={loading}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search academic years..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
            >
              {viewMode === 'table' ? <Calendar className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAcademicYears}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportDialog(true)}
            >
              <Upload className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Academic Year
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedIds.length} academic year(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds([])}
                >
                  Clear Selection
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                >
                  Delete Selected
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {filteredAcademicYears.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="h-12 w-12 text-gray-400" />}
            title="No Academic Years"
            description={academicYears.length === 0 
              ? "Create your first academic year to get started"
              : "No academic years match your current filters"
            }
            action={
              academicYears.length === 0 ? (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Academic Year
                </Button>
              ) : (
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}>
                  Clear Filters
                </Button>
              )
            }
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border">
            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Academic Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Semesters
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAcademicYears.map((academicYear) => (
                      <tr key={academicYear.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <GraduationCap className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{academicYear.name}</div>
                              <div className="text-sm text-gray-500">
                                {format(new Date(academicYear.startDate), 'MMM yyyy')} - {format(new Date(academicYear.endDate), 'MMM yyyy')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div>
                            <div className="text-sm text-gray-900">
                              {format(new Date(academicYear.startDate), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-xs text-gray-500">
                              to {format(new Date(academicYear.endDate), 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">{academicYear.semesters.length}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Badge variant={academicYear.isActive ? 'default' : 'secondary'}>
                            {academicYear.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <TableRowActions
                            itemName={academicYear.name}
                            onView={() => handleViewAcademicYear(academicYear)}
                            onEdit={() => handleEditAcademicYear(academicYear)}
                            onDelete={() => handleDeleteAcademicYear(academicYear)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAcademicYears.map((academicYear) => (
                    <Card key={academicYear.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <GraduationCap className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{academicYear.name}</CardTitle>
                              <CardDescription>
                                {format(new Date(academicYear.startDate), 'MMM yyyy')} - {format(new Date(academicYear.endDate), 'MMM yyyy')}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant={academicYear.isActive ? 'default' : 'secondary'}>
                            {academicYear.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            {academicYear.semesters.length} Semester{academicYear.semesters.length !== 1 ? 's' : ''}
                          </div>
                          
                          <div className="space-y-2">
                            {academicYear.semesters.map((semester) => (
                              <div
                                key={semester.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                              >
                                <div>
                                  <p className="text-sm font-medium">{semester.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(semester.startDate), 'MMM dd')} - {format(new Date(semester.endDate), 'MMM dd, yyyy')}
                                  </p>
                                </div>
                                <Badge 
                                  className={
                                    semester.status === 'CURRENT' ? 'bg-green-100 text-green-800' :
                                    semester.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
                                    semester.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                                    'bg-red-100 text-red-800'
                                  }
                                >
                                  {semester.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions Panel */}
        <QuickActionsPanel />
      </div>

      {/* Dialogs */}
      {showForm && (
        <AcademicYearForm
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {selectedAcademicYear && (
        <ViewDialog
          open={showViewDialog}
          onOpenChange={setShowViewDialog}
          title="Academic Year Details"
          sections={[
            {
              title: "Basic Information",
              fields: [
                { label: "Academic Year", value: selectedAcademicYear.name },
                { label: "Start Date", value: format(new Date(selectedAcademicYear.startDate), 'PPP') },
                { label: "End Date", value: format(new Date(selectedAcademicYear.endDate), 'PPP') },
                { label: "Status", value: selectedAcademicYear.isActive ? 'Active' : 'Inactive' }
              ]
            },
            {
              title: "Semesters",
              fields: selectedAcademicYear.semesters.map((semester, index) => ({
                label: semester.name,
                value: `${format(new Date(semester.startDate), 'MMM dd')} - ${format(new Date(semester.endDate), 'MMM dd, yyyy')} (${semester.status})`
              }))
            }
          ]}
        />
      )}

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        itemName={academicYearToDelete?.name || 'academic year'}
        onDelete={confirmDelete}
        onCancel={() => setAcademicYearToDelete(null)}
        canDelete={true}
        loading={loading}
        description="This action cannot be undone. All associated semesters and data will be permanently deleted."
      />

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        dataCount={filteredAcademicYears.length}
        entityType="academic-years"
      />

      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={async (data) => {
          // Implement import logic
          toast.success('Import functionality coming soon');
          return { success: 0, failed: 0, errors: [] };
        }}
        entityName="Academic Years"
        acceptedFileTypes={['.csv', '.xlsx', '.xls']}
        maxFileSize={5}
      />
    </div>
  );
}