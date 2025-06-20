"use client";

import { useState, useMemo, useEffect } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";
import { z } from "zod";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, Pencil, Trash2, Loader2, BadgeInfo, CheckSquare, Square } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Checkbox as SharedCheckbox } from "@/components/ui/checkbox";
import { TableHeaderSection } from "@/components/TableHeaderSection";
import { TableList, TableListColumn } from "@/components/TableList";
import { TableCardView } from "@/components/TableCardView";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { FilterDialog } from "@/components/FilterDialog";
import { ExportDialog } from "@/components/ExportDialog";
import { SortDialog } from "@/components/SortDialog";
import { PrintLayout } from "@/components/PrintLayout";
import { TableRowActions } from "@/components/TableRowActions";
import Pagination from "@/components/Pagination";
import Fuse from "fuse.js";
import SubjectForm from "@/components/forms/SubjectForm";
import { ViewDialog } from "@/components/ViewDialog";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import SubjectFormDialog from '@/components/forms/SubjectFormDialog';
import { useDebounce } from '@/hooks/use-debounce';
import { subjectsApi } from '@/services/api/subjects';
import { Subject } from '@/types/subject';

type SortField = 'name' | 'code' | 'type' | 'units' | 'semester' | 'year_level' | 'department';
type SortOrder = 'asc' | 'desc';

function Checkbox({ checked, indeterminate, onChange, ...props }: any) {
  return (
    <button
      type="button"
      aria-checked={checked}
      onClick={onChange}
      className={`w-5 h-5 flex items-center justify-center border rounded transition-colors ${checked ? 'bg-primary border-primary' : 'bg-white border-gray-300'} ${indeterminate ? 'bg-gray-200' : ''}`}
      {...props}
    >
      {indeterminate ? (
        <span className="w-3 h-0.5 bg-gray-500 rounded" />
      ) : checked ? (
        <CheckSquare className="w-4 h-4 text-primary" />
      ) : (
        <Square className="w-4 h-4 text-gray-400" />
      )}
    </button>
  );
}

// Centralized badge variant logic
function getTypeBadgeVariant(type: string) {
  switch (type) {
    case 'both': return 'secondary';
    case 'lecture': return 'success';
    case 'laboratory': return 'warning';
    default: return 'default';
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'active': return 'success';
    case 'inactive': return 'destructive';
    default: return 'default';
  }
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubject, setModalSubject] = useState<Subject | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [canDelete, setCanDelete] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    semester: "all",
    year_level: "all",
    department: "all",
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | null>(null);
  const [showPrint, setShowPrint] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add sortFields state and setSortFields function
  const [sortFields, setSortFields] = useState<{ field: SortField; order: SortOrder }[]>([
    { field: 'name', order: 'asc' }
  ]);

  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setSortDialogOpen(false);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await subjectsApi.fetchSubjects({
        page: currentPage,
        pageSize: itemsPerPage,
        search: debouncedSearchTerm,
        type: filters.type,
        semester: filters.semester,
        year_level: filters.year_level,
        department: filters.department,
        status: statusFilter,
        sortField,
        sortOrder,
      });
      setSubjects(data.subjects);
      setTotalSubjects(data.total);
    } catch (err: any) {
      setError(err.message);
      setSubjects([]);
      setTotalSubjects(0);
    } finally {
      setLoading(false);
    }
  };

  async function handleDeleteSubject(id: string) {
    try {
      await subjectsApi.deleteSubject(id);
      setSubjects(subjects.filter(subject => subject.id !== id));
      toast.success("Subject deleted successfully");
      setDeleteDialogOpen(false);
      setSubjectToDelete(null);
    } catch (error: any) {
      console.error("Error deleting subject:", error);
      toast.error(error.message || "Failed to delete subject");
    }
  }

  const handleExportToCSV = () => {
    const headers = ["Subject Name", "Code", "Type", "Units", "Semester", "Year Level", "Department", "Instructors"];
    const csvContent = [
      headers.join(","),
      ...subjects.map(subject => [
        subject.name,
        subject.code,
        subject.type,
        subject.units,
        subject.semester,
        subject.year_level,
        subject.department,
        subject.instructors?.join("; ") || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "subjects.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToExcel = () => {
    const headers = ["Subject Name", "Code", "Type", "Units", "Semester", "Year Level", "Department", "Instructors"];
    const rows = (subjects || []).map(subject => [
      subject.name,
      subject.code,
      subject.type,
      subject.units,
      subject.semester,
      subject.year_level,
      subject.department,
      subject.instructors?.join("; ") || ""
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Subjects");
    
    XLSX.writeFile(workbook, "subjects.xlsx");
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Subjects List", 14, 15);
    
    const headers = ["Subject Name", "Code", "Type", "Units", "Semester", "Year Level", "Department"];
    const rows = (subjects || []).map(subject => [
      subject.name,
      subject.code,
      subject.type,
      subject.units.toString(),
      subject.semester,
      subject.year_level,
      subject.department
    ]);

    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save("subjects.pdf");
  };

  const handlePrint = () => {
    const printColumns = [
      { header: 'Subject Name', accessor: 'name' },
      { header: 'Code', accessor: 'code' },
      { header: 'Type', accessor: 'type' },
      { header: 'Units', accessor: 'units' },
      { header: 'Semester', accessor: 'semester' },
      { header: 'Year Level', accessor: 'year_level' },
      { header: 'Department', accessor: 'department' },
    ];

    const printFunction = PrintLayout({
      title: 'Subjects List',
      data: subjects || [],
      columns: printColumns,
      totalItems: (subjects || []).length,
    });

    printFunction();
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    setFilterDialogOpen(false);
  };

  const handleResetFilters = () => {
    setFilters({
      type: "all",
      semester: "all",
      year_level: "all",
      department: "all",
    });
  };

  // Fetch on page/filter/search/sort change
  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, debouncedSearchTerm, filters, statusFilter, sortField, sortOrder]);

  // No need for client-side pagination, use server-side data
  const paginatedSubjects = subjects;
  const safeItemsPerPage = itemsPerPage > 0 ? itemsPerPage : 10;
  const safeTotalSubjects = Number.isFinite(totalSubjects) ? totalSubjects : 0;
  const totalPages = Math.max(1, Math.ceil(safeTotalSubjects / safeItemsPerPage));
  const safeCurrentPage = Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1;

  // Reset currentPage to 1 if it exceeds totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages]);

  const isAllSelected = paginatedSubjects?.length > 0 && paginatedSubjects.every(s => selectedIds.includes(s.id));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedSubjects.map(s => s.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const refreshSubjects = async () => {
    try {
      setIsRefreshing(true);
      const data = await subjectsApi.fetchSubjects({
        page: currentPage,
        pageSize: itemsPerPage,
      });
      setSubjects(data.subjects);
      setTotalSubjects(data.total);
      toast.success('Subjects refreshed successfully');
    } catch (err: any) {
      console.error('Error refreshing subjects:', err);
      toast.error(err.message || 'Failed to refresh subjects. Please try again later.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected subject(s)? This action cannot be undone.`)) return;
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(res => setTimeout(res, 1000));
      setSubjects(prev => prev.filter(s => !selectedIds.includes(s.id)));
      setSelectedIds([]);
      toast.success(`${selectedIds.length} subject(s) deleted successfully.`);
    } catch (err) {
      toast.error("Failed to delete subjects.");
    }
    setLoading(false);
  };

  const handleExport = () => {
    if (!exportFormat) {
      toast.error("Please select an export format");
      return;
    }

    const selectedColumns = exportableColumns.filter(col => exportColumns.includes(col.key));
    const headers = selectedColumns.map(col => col.label);
    const rows = (subjects || []).map((subject) =>
      selectedColumns.map((col) => {
        return String(subject[col.key as keyof Subject] || '');
      })
    );

    switch (exportFormat) {
      case 'csv':
        handleExportToCSV();
        break;
      case 'excel':
        handleExportToExcel();
        break;
      case 'pdf':
        handleExportToPDF();
        break;
    }
  };

  // Centralized subject columns definition
  const subjectColumns = [
    { key: 'name', label: 'Subject Name', accessor: 'name', className: 'text-blue-900' },
    { key: 'code', label: 'Code', accessor: 'code', className: 'text-blue-900' },
    { key: 'type', label: 'Type', accessor: 'type', className: 'text-center' },
    { key: 'units', label: 'Units', accessor: 'units', className: 'text-center text-blue-900' },
    { key: 'semester', label: 'Semester', accessor: 'semester', className: 'text-center text-blue-900' },
    { key: 'year_level', label: 'Year Level', accessor: 'year_level', className: 'text-center text-blue-900' },
    { key: 'department', label: 'Department', accessor: 'department', className: 'text-center align-middle text-blue-900' },
  ];

  const exportableColumns: { key: string; label: string }[] = subjectColumns.map((col) => ({ key: col.key, label: col.label }));

  const columns: TableListColumn<Subject>[] = [
    {
      header: (
        <div className="flex justify-center items-center">
          <SharedCheckbox checked={isAllSelected} indeterminate={isIndeterminate} onCheckedChange={handleSelectAll} aria-label="Select all subjects" />
        </div>
      ),
      accessor: 'select',
      className: 'w-12 text-center',
    },
    ...subjectColumns.map(col => {
      if (col.key === 'type') {
        return {
          header: col.label,
          accessor: col.accessor,
          className: col.className,
          render: (item: Subject) => (
            <Badge variant={getTypeBadgeVariant(item.type)}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Badge>
          )
        };
      }
      if (col.key === 'status') {
        return {
          header: col.label,
          accessor: col.accessor,
          className: col.className,
          render: (item: Subject) => (
            <Badge variant={getStatusBadgeVariant(item.status)}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Badge>
          )
        };
      }
      return {
        header: col.label,
        accessor: col.accessor,
        className: col.className
      };
    }),
    {
      header: "Actions",
      accessor: "actions",
      className: "text-center",
      render: (item: Subject) => (
        <TableRowActions
          onView={() => { setSelectedSubject(item); setViewDialogOpen(true); }}
          onEdit={() => { setModalSubject(item); setModalOpen(true); }}
          onDelete={() => handleDeleteClick(item)}
          itemName={item.name}
          viewAriaLabel={`View subject ${item.name}`}
          editAriaLabel={`Edit subject ${item.name}`}
          deleteAriaLabel={`Delete subject ${item.name}`}
        />
      )
    },
  ];

  const [exportColumns, setExportColumns] = useState(exportableColumns.map(col => col.key));
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const checkSubjectDeletable = async (subject: Subject) => {
    try {
      const result = await subjectsApi.checkSubjectDeletable(subject.id);
      setCanDelete(result.canDelete);
      if (!result.canDelete && result.details) {
        let message = "This subject cannot be deleted because it has:";
        if (result.details.hasSchedules) message += "\n• Active schedules";
        if (result.details.hasAnnouncements) message += "\n• Related announcements";
        if (result.details.hasInstructors) message += "\n• Assigned instructors";
        if (result.details.hasEnrolledStudents) message += "\n• Enrolled students";
        setDeleteError(message);
      } else {
        setDeleteError(null);
      }
    } catch (error) {
      console.error("Error checking subject status:", error);
      setCanDelete(false);
      setDeleteError("Failed to check if subject can be deleted");
    }
  };

  const handleDeleteClick = (subject: Subject) => {
    setSubjectToDelete(subject);
    setDeleteDialogOpen(true);
    checkSubjectDeletable(subject);
  };

  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-xl border border-blue-100 flex-1 m-4 mt-0" aria-busy={loading}>
      {/* Error State */}
      {error && (
        <div className="p-4 text-red-600 bg-red-50 rounded mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" aria-label="Loading" />
        </div>
      )}

      {/* Header */}
      <TableHeaderSection
        title="All Subjects"
        description="Manage and view all subject information"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={refreshSubjects}
        isRefreshing={isRefreshing}
        onFilterClick={() => setFilterDialogOpen(true)}
        onSortClick={() => setSortDialogOpen(true)}
        onExportClick={() => setExportDialogOpen(true)}
        onPrintClick={handlePrint}
        onAddClick={() => { setModalSubject(undefined); setModalOpen(true); }}
        searchPlaceholder="Search subjects..."
        addButtonLabel="Add Subject"
      />

      {/* Table layout for xl+ only */}
      <div className="hidden xl:block">
        <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white/70 shadow-md relative">
          {/* Loader overlay when refreshing */}
          {isRefreshing && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            </div>
          )}
          <div className="print-content">
            <TableList
              columns={columns}
              data={paginatedSubjects || []}
              loading={loading}
              selectedIds={selectedIds}
              onSelectRow={handleSelectRow}
              onSelectAll={handleSelectAll}
              isAllSelected={isAllSelected}
              isIndeterminate={isIndeterminate}
              getItemId={(item) => item.id}
            />
          </div>
        </div>
      </div>

      {/* Card layout for small screens */}
      <div className="block xl:hidden">
        <TableCardView
          items={paginatedSubjects || []}
          selectedIds={selectedIds}
          onSelect={handleSelectRow}
          onView={(item) => {
            setSelectedSubject(item);
            setViewDialogOpen(true);
          }}
          onEdit={(item) => {
            setModalSubject(item);
            setModalOpen(true);
          }}
          onDelete={(item) => {
            setSubjectToDelete(item);
            setDeleteDialogOpen(true);
          }}
          getItemId={(item) => item.id}
          getItemName={(item) => item.name}
          getItemCode={(item) => item.code}
          getItemStatus={(item) => item.status || "active"}
          getItemDescription={(item) => item.description}
          getItemDetails={(item) => [
            { label: 'Type', value: item.type },
            { label: 'Units', value: item.units },
            { label: 'Semester', value: item.semester },
            { label: 'Year Level', value: item.year_level },
            { label: 'Department', value: item.department },
          ]}
          isLoading={loading}
        />
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.length}
          entityLabel="subject"
          actions={[
            {
              key: 'delete',
              label: 'Delete Selected',
              icon: loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />,
              onClick: handleBulkDelete,
              loading: loading,
              disabled: loading,
              tooltip: 'Delete selected subjects',
              variant: 'destructive',
            },
          ]}
          onClear={() => setSelectedIds([])}
          className="mt-4 mb-2"
        />
      )}

      {/* Pagination */}
      <div className="mt-6">
        <Pagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Filter Dialog */}
      <FilterDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        statusFilter={filters.type}
        setStatusFilter={(value) => setFilters(prev => ({ ...prev, type: value }))}
        statusOptions={[
          { value: 'all', label: 'All' },
          { value: 'lecture', label: 'Lecture' },
          { value: 'laboratory', label: 'Laboratory' },
          { value: 'both', label: 'Both' },
        ]}
        advancedFilters={{
          semester: filters.semester,
          year_level: filters.year_level,
          department: filters.department,
        }}
        setAdvancedFilters={(filters) => setFilters(prev => ({ ...prev, ...filters }))}
        fields={[
          { key: 'semester', label: 'Semester', type: 'text', badgeType: 'active' },
          { key: 'year_level', label: 'Year Level', type: 'text', badgeType: 'active' },
          { key: 'department', label: 'Department', type: 'text', badgeType: 'active' },
        ]}
        onReset={() => setFilters({
          type: 'all',
          semester: 'all',
          year_level: 'all',
          department: 'all',
        })}
        onApply={() => setFilterDialogOpen(false)}
        activeAdvancedCount={Object.values(filters).filter(f => f !== "all").length}
        title="Filter Subjects"
        tooltip="Filter subjects by multiple criteria. Use advanced filters for more specific conditions."
      />

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        exportableColumns={exportableColumns}
        exportColumns={exportColumns}
        setExportColumns={setExportColumns}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        onExport={handleExport}
        title="Export Subjects"
        tooltip="Export subject data in various formats. Choose your preferred export options."
      />

      {/* Sort Dialog */}
      <SortDialog
        open={sortDialogOpen}
        onOpenChange={setSortDialogOpen}
        sortField={sortField}
        setSortField={field => setSortField(field as SortField)}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        sortFieldOptions={[
          { value: 'name', label: 'Subject Name' },
          { value: 'code', label: 'Subject Code' },
          { value: 'type', label: 'Type' },
          { value: 'units', label: 'Units' },
          { value: 'semester', label: 'Semester' },
          { value: 'year_level', label: 'Year Level' },
          { value: 'department', label: 'Department' },
        ]}
        onApply={() => {
          setSortFields([{ field: sortField, order: sortOrder }]);
        }}
        onReset={() => {
          setSortField('name');
          setSortOrder('asc');
          setSortFields([{ field: 'name', order: 'asc' }]);
        }}
        title="Sort Subjects"
        tooltip="Sort subjects by different fields. Choose the field and order to organize your list."
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={open => {
          if (!open) {
            setDeleteDialogOpen(false);
            setSubjectToDelete(null);
            setCanDelete(true);
            setDeleteError(null);
          }
        }}
        itemName={subjectToDelete?.name}
        onDelete={() => subjectToDelete && handleDeleteSubject(subjectToDelete.id)}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSubjectToDelete(null);
          setCanDelete(true);
          setDeleteError(null);
        }}
        canDelete={canDelete}
        deleteError={deleteError}
      />

      {/* Subject Form Modal */}
      <SubjectFormDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        type={modalSubject ? "update" : "create"}
        data={modalSubject}
        id={modalSubject?.id}
        onSuccess={() => {
          setModalOpen(false);
          refreshSubjects();
        }}
      />

      {/* View Dialog */}
      <ViewDialog
        open={viewDialogOpen}
        onOpenChange={(open: boolean) => {
          setViewDialogOpen(open);
          if (!open) setSelectedSubject(null);
        }}
        title={selectedSubject?.name || ''}
        subtitle={selectedSubject?.code}
        status={selectedSubject ? {
          value: selectedSubject.status || 'active',
          variant: getStatusBadgeVariant(selectedSubject.status || 'active')
        } : undefined}
        sections={[
          {
            title: "Basic Information",
            fields: [
              { label: 'Type', value: selectedSubject?.type ? selectedSubject.type.charAt(0).toUpperCase() + selectedSubject.type.slice(1) : '', type: 'badge', badgeVariant: getTypeBadgeVariant(selectedSubject?.type || '') },
              { label: 'Department', value: selectedSubject?.department || '', type: 'text' },
            ],
            columns: 2
          },
          {
            title: "Units",
            fields: [
              { label: 'Total Units', value: selectedSubject?.units || 0, type: 'number' as const },
              ...(selectedSubject?.type === "both" ? [
                { label: 'Lecture Units', value: selectedSubject?.lecture_units || 0, type: 'number' as const },
                { label: 'Laboratory Units', value: selectedSubject?.laboratory_units || 0, type: 'number' as const }
              ] : []),
            ],
            columns: 2
          },
          {
            title: "Schedule",
            fields: [
              { label: 'Semester', value: selectedSubject?.semester || '', type: 'text' },
              { label: 'Year Level', value: selectedSubject?.year_level || '', type: 'text' }
            ],
            columns: 2
          },
          {
            title: "Instructors",
            fields: selectedSubject?.instructors?.map(instructor => ({
              label: 'Instructor',
              value: instructor,
              type: 'text'
            })) || []
          }
        ]}
        description={selectedSubject?.description}
        tooltipText="View detailed subject information"
      />
    </div>
  );
}
