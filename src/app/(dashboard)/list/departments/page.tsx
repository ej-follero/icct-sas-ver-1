"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import { DepartmentForm } from "@/components/forms/DepartmentForm";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import React from "react";
import { Plus, Filter, SortAsc, Eye, Pencil, Trash2, CheckSquare, Square, Download, Printer, Loader2, ArrowUp, ArrowDown, BadgeInfo, Hash, SortDesc, FileText, FileSpreadsheet, HelpCircle, Settings2, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DepartmentViewDialog } from "@/components/forms/DepartmentViewDialog";

// Minimal shadcn/ui-style Checkbox
interface CheckboxProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function Checkbox({ checked, indeterminate, onCheckedChange, ...props }: CheckboxProps) {
  return (
    <button
      type="button"
      aria-checked={checked}
      onClick={e => {
        e.stopPropagation();
        onCheckedChange?.(!checked);
      }}
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

interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: "active" | "inactive";
  totalStudents: number;
  totalSections: number;
}
interface Department {
  id: string;
  name: string;
  code: string;
  headOfDepartment: string;
  description?: string;
  courseOfferings: Course[];
  status: "active" | "inactive";
  totalInstructors: number;
  logo?: string;
  settings: {
    autoGenerateCode: boolean;
    allowCourseOverlap: boolean;
    maxInstructors: number;
  };
}
type SortFieldKey = 'name' | 'code' | 'totalInstructors' | 'totalCourses' | 'status' | 'head';
type SortOrder = 'asc' | 'desc';
const ITEMS_PER_PAGE = 10;

type MultiSortField = { field: SortFieldKey; order: SortOrder };
const sortFieldOptions: { value: SortFieldKey; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'code', label: 'Code' },
  { value: 'totalInstructors', label: 'Total Instructors' },
  { value: 'totalCourses', label: 'Total Courses' },
  { value: 'status', label: 'Status' },
];

// Helper for highlighting
function highlightMatch(text: string, matches: readonly [number, number][] | undefined) {
  if (!matches || matches.length === 0) return text;
  let result = '';
  let lastIndex = 0;
  matches.forEach(([start, end], i) => {
    result += text.slice(lastIndex, start);
    result += `<mark class='bg-yellow-200 text-yellow-900 rounded px-1'>${text.slice(start, end + 1)}</mark>`;
    lastIndex = end + 1;
  });
  result += text.slice(lastIndex);
  return result;
}

export default function DepartmentListPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortFields, setSortFields] = useState<MultiSortField[]>([
    { field: 'name', order: 'asc' }
  ]);
  const [sortField, setSortField] = useState<SortFieldKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDepartment, setModalDepartment] = useState<Department | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [columnStatusFilter, setColumnStatusFilter] = useState("all");
  const [instructors, setInstructors] = useState<any[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState({
    head: '',
    minCourses: '',
    maxCourses: '',
    minInstructors: '',
    maxInstructors: ''
  });
  const [columnNameFilter, setColumnNameFilter] = useState('');
  const [columnCodeFilter, setColumnCodeFilter] = useState('');
  const [columnHeadFilter, setColumnHeadFilter] = useState('');
  const [columnLocationFilter, setColumnLocationFilter] = useState('');
  const router = useRouter();
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | null>(null);
  const [showPrint, setShowPrint] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewDepartment, setViewDepartment] = useState<Department | undefined>();
  const [isPrinting, setIsPrinting] = useState(false);

  const fuse = React.useMemo(() => new Fuse(departments, {
    keys: ["name", "code"],
    threshold: 0.4,
    includeMatches: true,
  }), [departments]);

  const fuzzyResults = React.useMemo(() => {
    if (!search) return departments.map((d, i) => ({ item: d, refIndex: i }));
    return fuse.search(search);
  }, [search, fuse]);

  const filteredDepartments = useMemo(() => {
    let result = fuzzyResults.map(r => r.item);
    if (columnStatusFilter !== 'all') {
      result = result.filter((dept) => dept.status === columnStatusFilter);
    }
    // Advanced filters
    if (advancedFilters.head) {
      result = result.filter(dept => dept.headOfDepartment?.toLowerCase().includes(advancedFilters.head.toLowerCase()));
    }
    if (advancedFilters.minCourses) {
      result = result.filter(dept => (dept.courseOfferings?.length || 0) >= Number(advancedFilters.minCourses));
    }
    if (advancedFilters.maxCourses) {
      result = result.filter(dept => (dept.courseOfferings?.length || 0) <= Number(advancedFilters.maxCourses));
    }
    if (advancedFilters.minInstructors) {
      result = result.filter(dept => (dept.totalInstructors || 0) >= Number(advancedFilters.minInstructors));
    }
    if (advancedFilters.maxInstructors) {
      result = result.filter(dept => (dept.totalInstructors || 0) <= Number(advancedFilters.maxInstructors));
    }
    if (columnNameFilter) {
      result = result.filter(dept => dept.name.toLowerCase().includes(columnNameFilter.toLowerCase()));
    }
    if (columnCodeFilter) {
      result = result.filter(dept => dept.code.toLowerCase().includes(columnCodeFilter.toLowerCase()));
    }
    if (columnHeadFilter) {
      result = result.filter(dept => dept.headOfDepartment?.toLowerCase().includes(columnHeadFilter.toLowerCase()));
    }
    // Multi-column sort
    result.sort((a, b) => {
      for (const { field, order } of sortFields) {
      let aValue: string | number;
      let bValue: string | number;
        if (field === 'totalCourses') {
        aValue = a.courseOfferings?.length || 0;
        bValue = b.courseOfferings?.length || 0;
      } else {
          aValue = a[field as keyof Department] as string | number;
          bValue = b[field as keyof Department] as string | number;
      }
        const modifier = order === 'asc' ? 1 : -1;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
          const cmp = aValue.localeCompare(bValue);
          if (cmp !== 0) return cmp * modifier;
        } else {
          const cmp = (aValue as number) - (bValue as number);
          if (cmp !== 0) return cmp * modifier;
        }
      }
      return 0;
    });
    return result;
  }, [fuzzyResults, columnStatusFilter, sortFields, advancedFilters, columnNameFilter, columnCodeFilter, columnHeadFilter]);

  const totalPages = Math.ceil(filteredDepartments.length / ITEMS_PER_PAGE);
  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Checkbox logic
  const isAllSelected = paginatedDepartments.length > 0 && paginatedDepartments.every(d => selectedIds.includes(d.id));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedDepartments.map(d => d.id));
    }
  };
  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Table columns
  const columns = [
    { header: <div className="flex justify-center items-center"><Checkbox checked={isAllSelected} indeterminate={isIndeterminate} onCheckedChange={handleSelectAll} /></div>, accessor: "select", className: "w-12 text-center" },
    { header: <div className="text-left">Department Name</div>, accessor: "name" },
    { header: <div className="text-center">Code</div>, accessor: "code" },
    { header: <div className="text-center">Head of Department</div>, accessor: "headOfDepartment" },
    { header: <div className="text-center">Description</div>, accessor: "description" },
    { header: <div className="text-center">Total Courses</div>, accessor: "totalCourses" },
    { header: <div className="text-center">Total Instructors</div>, accessor: "totalInstructors" },
    { header: <div className="text-center">Status</div>, accessor: "status" },
    { header: <div className="text-center">Actions</div>, accessor: "actions" },
  ];

  // Table row renderer
  const renderRow = (item: Department) => {
    // Find the fuzzy result for this item (if any)
    const fuseResult = fuzzyResults.find(r => r.item.id === item.id);
    const nameMatches = (fuseResult && (fuseResult as any).matches)
      ? (fuseResult as any).matches.find((m: any) => m.key === "name")?.indices
      : undefined;
    const codeMatches = (fuseResult && (fuseResult as any).matches)
      ? (fuseResult as any).matches.find((m: any) => m.key === "code")?.indices
      : undefined;

    return (
      <TableRow
        key={item.id}
        className={
          `${selectedIds.includes(item.id) ? "bg-blue-50" : ""} hover:bg-blue-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400`
        }
        tabIndex={0}
        role="row"
        aria-label={`View details for department ${item.name}`}
        onClick={() => router.push(`/dashboard/list/departments/${item.id}`)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            router.push(`/dashboard/list/departments/${item.id}`);
          }
        }}
      >
        {columns.map((col, colIdx) => {
          if (col.accessor === "select") {
            return (
              <TableCell key={colIdx} className="w-12 text-center align-middle">
                <div className="flex justify-center items-center">
                  <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => handleSelectRow(item.id)} aria-label={`Select department ${item.name}`} />
                </div>
              </TableCell>
            );
          }
          if (col.accessor === "name") {
            return (
              <TableCell key={colIdx} className="text-left align-middle">
                <span
                  dangerouslySetInnerHTML={{
                    __html: highlightMatch(item.name, (fuzzyResults.find(r => r.item.id === item.id) as any)?.matches),
                  }}
                />
              </TableCell>
            );
          }
          if (col.accessor === "code") {
            return (
              <TableCell key={colIdx} className="text-center align-middle">
                <span
                  dangerouslySetInnerHTML={{
                    __html: highlightMatch(item.code, (fuzzyResults.find(r => r.item.id === item.id) as any)?.matches),
                  }}
                />
              </TableCell>
            );
          }
          if (col.accessor === "headOfDepartment") {
            return (
              <TableCell key={colIdx} className="text-center align-middle">
                {item.headOfDepartment}
              </TableCell>
            );
          }
          if (col.accessor === "description") {
            return (
              <TableCell key={colIdx} className="text-center align-middle">
                {item.description}
              </TableCell>
            );
          }
          if (col.accessor === "totalCourses") {
            return (
              <TableCell key={colIdx} className="text-center align-middle">
                {item.courseOfferings?.length || 0}
              </TableCell>
            );
          }
          if (col.accessor === "totalInstructors") {
            return (
              <TableCell key={colIdx} className="text-center align-middle">
                {item.totalInstructors}
              </TableCell>
            );
          }
          if (col.accessor === "status") {
            return (
              <TableCell key={colIdx} className="text-center align-middle">
                <Badge variant={item.status === "active" ? "success" : "destructive"}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Badge>
              </TableCell>
            );
          }
          if (col.accessor === "actions") {
            return (
              <TableCell key={colIdx} className="text-center align-middle">
                {/* Actions (edit, delete, etc.) go here */}
              </TableCell>
            );
          }
          // Default fallback
          return <TableCell key={colIdx} />;
        })}
      </TableRow>
    );
  };

  // Add export columns state
  const exportableColumns = [
    { key: 'name', label: 'Department Name' },
    { key: 'code', label: 'Code' },
    { key: 'headOfDepartment', label: 'Head of Department' },
    { key: 'description', label: 'Description' },
    { key: 'totalCourses', label: 'Total Courses' },
    { key: 'totalInstructors', label: 'Total Instructors' },
    { key: 'status', label: 'Status' },
  ];
  const [exportColumns, setExportColumns] = useState(exportableColumns.map(col => col.key));
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Export handlers
  const handleExport = () => {
    if (!exportFormat) {
      toast.error("Please select an export format");
      return;
    }

    const selectedColumns = exportableColumns.filter(col => exportColumns.includes(col.key));
    const headers = selectedColumns.map(col => col.label);
    const rows = filteredDepartments.map((dept) =>
      selectedColumns.map((col) => {
        if (col.key === 'totalCourses') return String(dept.courseOfferings?.length || 0);
        if (col.key === 'totalInstructors') return String(dept.totalInstructors || 0);
        return String(dept[col.key as keyof Department] || '');
      })
    );

    switch (exportFormat) {
      case 'pdf':
        const doc = new jsPDF();
        // Add title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(12, 37, 86); // Dark blue color
        doc.text('Department List', doc.internal.pageSize.width / 2, 20, { align: 'center' });
        
        // Add subtitle with date
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128); // Light gray color
        const currentDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        doc.text(`Generated on ${currentDate}`, doc.internal.pageSize.width / 2, 28, { align: 'center' });

        // Reset text color for table
        doc.setTextColor(0, 0, 0);

        // Add some spacing
        doc.setFontSize(12);
        autoTable(doc, {
          head: [headers] as string[][],
          body: rows as string[][],
          startY: 35,
          styles: { 
            fontSize: 8,
            cellPadding: 3,
            overflow: 'linebreak',
            cellWidth: 'wrap',
          },
          headStyles: { 
            fillColor: [12, 37, 86],
            textColor: [255, 255, 255],
            halign: 'center',
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 'auto' }, // Department Name
            1: { cellWidth: 'auto' }, // Code
            2: { cellWidth: 'auto' }, // Head of Department
            3: { cellWidth: 'auto' }, // Description
            4: { cellWidth: 'auto', halign: 'center' }, // Total Courses
            5: { cellWidth: 'auto', halign: 'center' }, // Total Instructors
            6: { cellWidth: 'auto', halign: 'center' }, // Status
          },
          margin: { top: 16, right: 10, bottom: 10, left: 10 },
          theme: 'grid',
        });
        doc.save("departments.pdf");
        break;

      case 'excel':
        const wsData = [headers, ...rows] as string[][];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Set column widths based on content
        const colWidths = headers.map((_, index) => {
          const maxLength = Math.max(
            ...wsData.map(row => (row[index] || '').toString().length),
            headers[index].length
          );
          return { wch: Math.min(Math.max(maxLength + 2, 10), 50) }; // Min width 10, max width 50
        });
        ws['!cols'] = colWidths;

        // Style the header row
        const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
          const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
          if (!ws[cellRef]) continue;
          
          // Make headers uppercase and bold
          ws[cellRef].v = ws[cellRef].v.toString().toUpperCase();
          ws[cellRef].s = {
            font: { bold: true },
            alignment: { horizontal: 'center', vertical: 'center' }
          };
        }

        // Center align data cells (without bold)
        for (let R = 1; R <= headerRange.e.r; ++R) {
          for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellRef]) continue;
            
            // Apply styling to data cells
            ws[cellRef].s = {
              alignment: { horizontal: 'center', vertical: 'center' }
            };
          }
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Departments");
        XLSX.writeFile(wb, "departments.xlsx");
        break;

      case 'csv':
        const csvRows = [headers, ...rows] as string[][];
    const csvContent = csvRows.map((row) => row.map(String).map(cell => '"' + cell.replace(/"/g, '""') + '"').join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'departments.csv';
    a.click();
    URL.revokeObjectURL(url);
        break;
    }

    toast.success(`Exported to ${exportFormat.toUpperCase()}`);
    setExportDialogOpen(false);
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected department(s)? This action cannot be undone.`)) return;
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(res => setTimeout(res, 1000));
      setDepartments(prev => prev.filter(d => !selectedIds.includes(d.id)));
      setSelectedIds([]);
      toast.success(`${selectedIds.length} department(s) deleted successfully.`);
    } catch (err) {
      toast.error("Failed to delete departments.");
    }
    setLoading(false);
  };

  // Export selected to CSV handler
  const handleExportSelected = () => {
    if (selectedIds.length === 0) return;
    const selectedDepartments = departments.filter(d => selectedIds.includes(d.id));
    const csvRows = [
      [
        'Department Name',
        'Code',
        'Head of Department',
        'Description',
        'Total Courses',
        'Total Instructors',
        'Status',
      ],
      ...selectedDepartments.map((dept) => [
        dept.name,
        dept.code,
        dept.headOfDepartment,
        dept.description || '',
        dept.courseOfferings?.length || 0,
        dept.totalInstructors || 0,
        dept.status,
      ]),
    ];
    const csvContent = csvRows.map((row) => row.map(String).map(cell => '"' + cell.replace(/"/g, '""') + '"').join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'selected-departments.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${selectedIds.length} department(s) exported to CSV.`);
  };

  // Count active advanced filters
  const activeAdvancedFilterCount = Object.values(advancedFilters).filter(Boolean).length;

  // Add handleSort function
  const handleSort = () => {
    setSortFields([{ field: sortField, order: sortOrder }]);
  };

  // Fetch departments from API
  useEffect(() => {
    setLoading(true);
    fetch('/api/departments')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch departments');
        return res.json();
      })
      .then(data => {
        setDepartments(data);
        setLoading(false);
      })
      .catch(err => {
        setDepartments([]);
        setLoading(false);
      });
  }, []);

  // Reset pagination on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, columnStatusFilter, columnNameFilter, columnCodeFilter, columnHeadFilter, advancedFilters]);

  useEffect(() => {
    if (showPrint) {
      const timer = setTimeout(() => {
        window.print();
        setShowPrint(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showPrint]);

  useEffect(() => {
    const mediaQueryList = window.matchMedia('print');
    const handlePrint = (e: MediaQueryListEvent) => setIsPrinting(e.matches);
    mediaQueryList.addEventListener('change', handlePrint);
    return () => mediaQueryList.removeEventListener('change', handlePrint);
  }, []);

  return (
    <>
    <style jsx global>{`
      @media print {
        body * {
          visibility: hidden !important;
        }
        .print-content, .print-content * {
          visibility: visible !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          min-height: 0 !important;
          font-family: Arial, Helvetica, sans-serif !important;
        }
        #__next, .print-wrapper, .main-container {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        .print-content, .print-header, .print-content > *, .print-header > *, .w-full, .min-w-full, .max-w-full, .container, .main-container, .rounded-xl, .border, .shadow-md, .flex, .items-stretch, .justify-center, .m-0, .p-0 {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          float: none !important;
          display: block !important;  Removed to avoid breaking table, tr, th, td
          text-align: center !important;
          box-sizing: border-box !important;
        }
        .print-content {
          position: static !important;
          top: 0 !important;
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
        table, th, td {
          border: 1px solid #e5e7eb !important;
          border-collapse: collapse !important;
        }
        th, td {
          border-width: 1px !important;
          border-style: solid !important;
          border-color: #e5e7eb !important;
          padding: 10px 8px !important;
          font-size: 10pt !important;
          font-family: Arial, Helvetica, sans-serif !important;
          font-weight: normal !important;
          white-space: normal !important;
          text-align: left !important;
        }
        .print-header {
          margin-top: 0 !important;
          margin-bottom: 16px !important;
          text-align: center !important;
        }
        .print-header h1 {
          color: #183153 !important;
          font-size: 16pt !important;
          font-weight: bold !important;
          margin: 0 0 4px 0 !important;
          padding: 0 !important;
        }
        .print-header p {
          color: #888 !important;
          font-size: 10pt !important;
          font-weight: normal !important;
          margin: 0 0 16px 0 !important;
          padding: 0 !important;
        }
        td.status-cell {
          text-align: center !important;
        }
        .print-content .badge, .print-content [class*="badge"], .print-content [class*="Badge"] {
          color: #222 !important;
          background: none !important;
          font-size: 10pt !important;
          font-weight: normal !important;
          border: none !important;
          padding: 0 !important;
          box-shadow: none !important;
          text-transform: none !important;
        }
        a, a:visited, a:active {
          color: #222 !important;
          text-decoration: none !important;
          font-weight: normal !important;
        }
        @page {
          margin: 0.5cm !important;
          size: auto;
        }
        @media print and (orientation: landscape) {
          @page {
            margin: 0.3cm !important;
          }
        }
        th:last-child, td:last-child {
          display: none !important;
        }
      }
    `}</style>
    {/* Normal UI */}
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-xl border border-blue-100 flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="print:hidden">
        {/* Responsive header row for small screens */}
        <div className="flex flex-col gap-4 mb-6 lg:hidden">
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-blue-900">All Departments</h1>
              <p className="text-sm text-blue-700/80">Manage and view all department information</p>
            </div>
            {/* Controls: sort, filter, export, print, add */}
            <div className="flex flex-row gap-1 items-center">
              <TooltipProvider delayDuration={0}>
                {/* Filter Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded border-0 hover:bg-blue-50" aria-label="Filter" onClick={() => setFilterDialogOpen(true)}>
                      <Filter className="h-4 w-4 text-blue-700/70" />
                      {activeAdvancedFilterCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">{activeAdvancedFilterCount}</span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-blue-900 text-white">
                    Filter
                  </TooltipContent>
                </Tooltip>
                {/* Sort Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded border-0 hover:bg-blue-50" aria-label="Sort" onClick={() => setSortDialogOpen(true)}>
                      <SortAsc className="h-4 w-4 text-blue-700" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-blue-900 text-white">
                    Sort
                  </TooltipContent>
                </Tooltip>
                {/* Export Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded border-0 hover:bg-blue-50" aria-label="Export" onClick={() => setExportDialogOpen(true)}>
                      <Download className="h-4 w-4 text-blue-700" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-blue-900 text-white">
                    Export
                  </TooltipContent>
                </Tooltip>
                {/* Print Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Print" onClick={handlePrint}>
                      <Printer className="h-4 w-4 text-blue-700" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-blue-900 text-white">
                    Print
                  </TooltipContent>
                </Tooltip>
                {/* Add Department Button (icon only) */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="default" size="icon" className="bg-blue-700 hover:bg-blue-800 text-white shadow ml-1" aria-label="Add Department" onClick={() => { setModalDepartment(undefined); setModalOpen(true); }}>
                      <Plus className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-blue-900 text-white">
                    Create a new department
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          {/* Search bar for small screens */}
          <TableSearch value={search} onChange={setSearch} placeholder="Search departments..." className="h-10 w-full px-3 rounded-full shadow-sm border border-blue-200 focus:border-blue-400 focus:ring-blue-400 mt-2" />
        </div>
        {/* Existing layout for large screens and up */}
        <div className="hidden lg:block relative flex flex-col gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-blue-900">All Departments</h1>
            <p className="text-sm text-blue-700/80">Manage and view all department information</p>
          </div>
          {/* Controls: stacked below label on mobile, absolutely right-aligned on lg+ */}
          <div className="flex flex-col gap-2 mt-2 w-full lg:absolute lg:right-0 lg:top-0 lg:flex-row lg:items-center lg:justify-end lg:w-auto">
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <TableSearch value={search} onChange={setSearch} placeholder="Search departments..." className="h-10 w-full sm:w-64 px-3 rounded-full shadow-sm border border-blue-200 focus:border-blue-400 focus:ring-blue-400" />
              <div className="flex flex-row gap-0 rounded-lg shadow-sm overflow-hidden">
                <TooltipProvider delayDuration={0}>
                  {/* Filter Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-none border-0 hover:bg-blue-50 relative" aria-label="Filter" onClick={() => setFilterDialogOpen(true)}>
                        <Filter className="h-4 w-4 text-blue-700/70" />
                        {activeAdvancedFilterCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">{activeAdvancedFilterCount}</span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-blue-900 text-white">
                      Filter
                    </TooltipContent>
                  </Tooltip>
                  {/* Sort Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-none border-0 hover:bg-blue-50" aria-label="Sort" onClick={() => setSortDialogOpen(true)}>
                        <SortAsc className="h-4 w-4 text-blue-700" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-blue-900 text-white">
                      Sort
                    </TooltipContent>
                  </Tooltip>
                  {/* Export Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-none border-0 hover:bg-blue-50" aria-label="Export" onClick={() => setExportDialogOpen(true)}>
                        <Download className="h-4 w-4 text-blue-700" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-blue-900 text-white">
                      Export
                    </TooltipContent>
                  </Tooltip>
                  {/* Print Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Print" onClick={handlePrint}>
                        <Printer className="h-4 w-4 text-blue-700" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-blue-900 text-white">
                      Print
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" className="bg-blue-700 hover:bg-blue-800 text-white shadow flex items-center gap-2 px-3 py-1 text-sm font-semibold w-full lg:w-auto" aria-label="Add Department" onClick={() => { setModalDepartment(undefined); setModalOpen(true); }}>
                    <Plus className="h-2 w-2" />
                    Add Department
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-blue-900 text-white">
                  Create a new department
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Print Header and Table - Only visible when printing */}
      <div className="print-content">
        <div className="hidden print:block mb-6 print-header">
          <h1 className="text-xl font-bold text-blue-900">Department List</h1>
          <p className="text-sm text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
        </div>
        {/* Table layout for xl+ only */}
        <div className="hidden xl:block w-full min-w-0 rounded-xl border border-blue-100 bg-white/70 shadow-md min-h-[200px] flex items-stretch justify-center p-0 print:border-none print:shadow-none overflow-x-auto">
          <div className="w-full min-w-0 overflow-x-auto m-0 p-0 print:block">
            <div className="inline-block align-middle m-0 p-0 w-full min-w-0">
              <div className="overflow-hidden m-0 p-0 min-w-0">
                <table className="min-w-[900px] w-full table-auto min-w-0">
                  <thead className="bg-blue-50 sticky top-0 z-10 print:table-header-group">
                    <tr className="print:table-row">
                      <th className="text-center px-1 py-1 sm:px-2 sm:py-2 lg:px-3 lg:py-3 print:hidden text-blue-900">
                        <div className="flex justify-center items-center">
                          <Checkbox checked={isAllSelected} indeterminate={isIndeterminate} onCheckedChange={handleSelectAll} />
                        </div>
                      </th>
                      <th className="text-left truncate text-blue-900 px-1 py-1 sm:px-2 sm:py-2 lg:px-3 lg:py-3 print:table-cell">Department Name</th>
                      <th className="text-center truncate text-blue-900 px-1 py-1 sm:px-2 sm:py-2 lg:px-3 lg:py-3 print:table-cell">Code</th>
                      <th className="text-center truncate text-blue-900 px-1 py-1 sm:px-2 sm:py-2 lg:px-3 lg:py-3 print:table-cell">Head of Department</th>
                      <th className="text-center truncate text-blue-900 px-1 py-1 sm:px-2 sm:py-2 lg:px-3 lg:py-3 print:table-cell">Description</th>
                      <th className="text-center truncate text-blue-900 px-1 py-1 sm:px-2 sm:py-2 lg:px-3 lg:py-3 print:table-cell">Courses</th>
                      <th className="text-center truncate text-blue-900 px-1 py-1 sm:px-2 sm:py-2 lg:px-3 lg:py-3 print:table-cell">Instructors</th>
                      <th className="text-center truncate text-blue-900 px-1 py-1 sm:px-2 sm:py-2 lg:px-3 lg:py-3 print:table-cell">Status</th>
                      {!isPrinting && (
                        <th className="text-center truncate text-blue-900 px-1 py-1 sm:px-2 sm:py-2 lg:px-3 lg:py-3 print:hidden">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="print:table-row-group">
                    {paginatedDepartments.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`${selectedIds.includes(item.id) ? "bg-blue-50" : idx % 2 === 0 ? "bg-white" : "bg-blue-50/40"} hover:bg-blue-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow duration-150 print:table-row`}
                        tabIndex={0}
                        role="button"
                        aria-pressed={selectedIds.includes(item.id)}
                        aria-label={`View details for department ${item.name}`}
                        onClick={() => router.push(`/dashboard/list/departments/${item.id}`)}
                        onKeyDown={e => {
                          if (e.key === "Enter" || e.key === " ") {
                            router.push(`/dashboard/list/departments/${item.id}`);
                          }
                        }}
                      >
                        {/* Checkbox column */}
                        <td className="text-center align-middle px-1 py-1 sm:px-2 sm:py-2 lg:px-3 lg:py-3 print:hidden">
                          <div className="flex justify-center items-center">
                            <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => handleSelectRow(item.id)} aria-label={`Select department ${item.name}`} />
                          </div>
                        </td>
                        {/* Department Name */}
                        <td className="text-left truncate min-w-0 font-medium text-blue-900 px-1 py-1 sm:px-2 sm:py-2 lg:px-3 lg:py-3 print:table-cell">
                          {item.name}
                        </td>
                        {/* Code */}
                        <td className="text-center truncate min-w-0 text-blue-800 px-1 py-1 sm:px-2 sm:py-2 lg:px-3 lg:py-3 print:table-cell">
                          {item.code}
                        </td>
                        {/* Head of Department */}
                        <td className="text-center truncate min-w-0 text-blue-800 px-1 py-1 sm:px-2 sm:py-2 lg:px-3 lg:py-3 print:table-cell">
                          {item.headOfDepartment || <span className="italic text-gray-400">Not Assigned</span>}
                        </td>
                        {/* Description */}
                        <td className="text-center truncate min-w-0 text-blue-800 px-1 py-1 sm:px-2 sm:py-2 lg:px-3 lg:py-3 print:table-cell">
                          {item.description || <span className="italic text-gray-400">No description</span>}
                        </td>
                        {/* Total Courses */}
                        <td className="text-center truncate min-w-0 text-blue-800 px-1 py-1 sm:px-2 sm:py-2 lg:px-3 lg:py-3 print:table-cell">
                          {item.courseOfferings?.length || 0}
                        </td>
                        {/* Total Instructors */}
                        <td className="text-center truncate min-w-0 text-blue-800 whitespace-nowrap px-3 py-2 print:table-cell">
                          {item.totalInstructors || 0}
                        </td>
                        {/* Status */}
                        <td className="text-center truncate min-w-0 text-xs sm:text-sm md:text-base px-3 py-2 print:table-cell status-cell">
                          <Badge variant={item.status === "active" ? "success" : "destructive"}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                        </td>
                        {/* Actions */}
                        {!isPrinting && (
                          <td className="text-center truncate min-w-0 px-3 py-2 print:hidden">
                            <div className="hidden 2xl:flex gap-2 justify-center">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label={`View Department ${item.name}`} onClick={e => {
                                      e.stopPropagation();
                                      setViewDepartment(item);
                                      setViewDialogOpen(true);
                                    }}>
                                      <Eye className="h-4 w-4 text-blue-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View department details</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label={`Edit Department ${item.name}`} onClick={(e) => { e.stopPropagation(); setModalDepartment(item); setModalOpen(true); }}>
                                      <Pencil className="h-4 w-4 text-green-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit department</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      style={{ display: 'inline-block' }}
                                      onClick={e => {
                                        e.stopPropagation();
                                        if (item.courseOfferings?.length > 0 || item.totalInstructors > 0) {
                                          toast.error('Cannot delete department', {
                                            description: 'This department has active courses or instructors. Please remove them first.',
                                            duration: 4000,
                                            position: 'top-center',
                                          });
                                          return;
                                        }
                                        setDepartmentToDelete(item);
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Delete Department ${item.name}`}
                                        disabled={item.courseOfferings?.length > 0 || item.totalInstructors > 0}
                                        className="relative pointer-events-none"
                                        tabIndex={-1}
                                      >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                      </Button>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-red-50 text-red-700 border border-red-200">
                                    {item.courseOfferings?.length > 0 || item.totalInstructors > 0
                                      ? "Cannot delete department with active courses or instructors"
                                      : "Delete department"}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="2xl:hidden flex justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label="More actions" onClick={(e) => e.stopPropagation()}>
                                    <MoreHorizontal className="h-5 w-5 text-blue-700" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={e => {
                                    e.stopPropagation();
                                    setViewDepartment(item);
                                    setViewDialogOpen(true);
                                  }}>
                                    <Eye className="h-4 w-4 text-blue-600 mr-2" /> View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setModalDepartment(item); setModalOpen(true); }}>
                                    <Pencil className="h-4 w-4 text-green-600 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={item.courseOfferings?.length > 0 || item.totalInstructors > 0}
                                    className="relative"
                                  >
                                    <TooltipProvider delayDuration={0}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div
                                            className="flex items-center w-full"
                                            onClick={e => {
                                              e.stopPropagation();
                                              if (item.courseOfferings?.length > 0 || item.totalInstructors > 0) {
                                                toast.error('Cannot delete department', {
                                                  description: 'This department has active courses or instructors. Please remove them first.',
                                                  duration: 4000,
                                                  position: 'top-center',
                                                });
                                                return;
                                              }
                                              setDepartmentToDelete(item);
                                              setDeleteDialogOpen(true);
                                            }}
                                          >
                                            <span className="pointer-events-none">
                                              <Trash2 className="h-4 w-4 text-red-600 mr-2" /> Delete
                                            </span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="bg-red-50 text-red-700 border border-red-200">
                                          {item.courseOfferings?.length > 0 || item.totalInstructors > 0
                                            ? "Cannot delete department with active courses or instructors"
                                            : "Delete department"}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card layout for small screens */}
      <div className="block xl:hidden w-full space-y-4">
        {paginatedDepartments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No departments found.</div>
        ) : (
          paginatedDepartments.map((item) => (
            <div
              key={item.id}
              className={`relative bg-white border border-blue-200 rounded-2xl shadow-lg p-4 flex flex-col gap-3 transition-shadow duration-150 active:shadow-xl focus-within:ring-2 focus-within:ring-blue-400 ${selectedIds.includes(item.id) ? 'ring-2 ring-blue-400' : ''}`}
              tabIndex={0}
              role="button"
              aria-label={`View details for department ${item.name}`}
              onClick={() => router.push(`/dashboard/list/departments/${item.id}`)}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  router.push(`/dashboard/list/departments/${item.id}`);
                }
              }}
            >
              {/* Checkbox and Status */}
              <div className="flex items-center justify-between">
                <Checkbox
                  checked={selectedIds.includes(item.id)}
                  onCheckedChange={() => handleSelectRow(item.id)}
                  aria-label={`Select department ${item.name}`}
                />
                <Badge
                  variant={item.status === "active" ? "success" : "destructive"}
                  className="text-xs px-2 py-1 rounded-full"
                >
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Badge>
              </div>

              {/* Department Name */}
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-blue-900">{item.name}</span>
                <span className="ml-2 text-xs font-mono text-blue-500 bg-blue-50 rounded px-2 py-0.5">
                  {item.code}
                </span>
              </div>

              {/* Info Section */}
              <div className="flex flex-wrap gap-3 text-sm text-blue-800">
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Head:</span>
                  <span>{item.headOfDepartment || <span className="italic text-gray-400">Not Assigned</span>}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Courses:</span>
                  <span>{item.courseOfferings?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Instructors:</span>
                  <span>{item.totalInstructors || 0}</span>
                </div>
              </div>

              {/* Description */}
              {item.description && (
                <div className="text-xs text-gray-500 border-t border-blue-50 pt-2 mt-2">
                  {item.description}
                </div>
              )}

              {/* Actions */}
              {!isPrinting && (
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`View Department ${item.name}`}
                    onClick={e => {
                      e.stopPropagation();
                      setViewDepartment(item);
                      setViewDialogOpen(true);
                    }}
                    className="hover:bg-blue-50"
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Edit Department ${item.name}`}
                    onClick={e => { e.stopPropagation(); setModalDepartment(item); setModalOpen(true); }}
                    className="hover:bg-green-50"
                  >
                    <Pencil className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Delete Department ${item.name}`}
                    onClick={e => { e.stopPropagation(); setDepartmentToDelete(item); setDeleteDialogOpen(true); }}
                    disabled={item.courseOfferings?.length > 0 || item.totalInstructors > 0}
                    className="hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg mt-2 mb-2 border border-blue-100">
          <span className="font-medium text-blue-900">{selectedIds.length} selected</span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={loading}>
            {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
            Delete Selected
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportSelected} disabled={loading}>
            Export Selected
          </Button>
        </div>
      )}

      {/* PAGINATION */}
      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white/90 border border-blue-100 shadow-lg rounded-xl py-8 px-6">
          <DialogHeader>
            <DialogTitle className="text-blue-900 text-xl flex items-center gap-2 mb-6">
              Filter Departments
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-blue-400 cursor-pointer">
                      <BadgeInfo className="w-4 h-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-blue-900 text-white">
                    Filter departments by multiple criteria. Use advanced filters for more specific conditions.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8">
            {/* Status Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-md font-semibold text-blue-900">Status</h3>
                </div>
                <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-700 border-blue-200">
                  {columnStatusFilter === 'all' ? 'All' : columnStatusFilter.charAt(0).toUpperCase() + columnStatusFilter.slice(1)}
                </Badge>
              </div>
              <div className="h-px bg-blue-100 w-full mb-8"></div>
              <div className="grid grid-cols-3 gap-2 mt-6">
                <Button
                  variant={columnStatusFilter === 'all' ? "default" : "outline"}
                  size="sm"
                  className={`w-full ${columnStatusFilter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                  onClick={() => setColumnStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={columnStatusFilter === 'active' ? "default" : "outline"}
                  size="sm"
                  className={`w-full ${columnStatusFilter === 'active' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                  onClick={() => setColumnStatusFilter('active')}
                >
                  Active
                </Button>
                <Button
                  variant={columnStatusFilter === 'inactive' ? "default" : "outline"}
                  size="sm"
                  className={`w-full ${columnStatusFilter === 'inactive' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                  onClick={() => setColumnStatusFilter('inactive')}
                >
                  Inactive
                </Button>
              </div>
            </div>
            {/* Advanced Filters Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-md font-semibold text-blue-900">Advanced Filters</h3>
                </div>
                {Object.values(advancedFilters).some(Boolean) && (
                  <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-700 border-blue-200">
                    {Object.values(advancedFilters).filter(Boolean).length} active
                  </Badge>
                )}
              </div>
              <div className="h-px bg-blue-100 w-full mb-8"></div>
              <div className="space-y-6">
                {/* Department Name */}
                <div className="space-y-2">
                  <Label htmlFor="name-filter" className="text-sm text-blue-900 flex items-center gap-2">
                    Department Name
                    {columnNameFilter && (
                      <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-700 border-blue-200">
                        Active
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="name-filter"
                    placeholder="Filter by department name..."
                    value={columnNameFilter}
                    onChange={(e) => setColumnNameFilter(e.target.value)}
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>

                {/* Department Code */}
                <div className="space-y-2">
                  <Label htmlFor="code-filter" className="text-sm text-blue-900 flex items-center gap-2">
                    Department Code
                    {columnCodeFilter && (
                      <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-700 border-blue-200">
                        Active
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="code-filter"
                    placeholder="Filter by department code..."
                    value={columnCodeFilter}
                    onChange={(e) => setColumnCodeFilter(e.target.value)}
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>

                {/* Head of Department */}
                <div className="space-y-2">
                  <Label htmlFor="head-filter" className="text-sm text-blue-900 flex items-center gap-2">
                    Head of Department
                    {columnHeadFilter && (
                      <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-700 border-blue-200">
                        Active
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="head-filter"
                    placeholder="Filter by head of department..."
                    value={columnHeadFilter}
                    onChange={(e) => setColumnHeadFilter(e.target.value)}
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  >
                  </Input>
                </div>

                {/* Total Courses Range */}
                <div className="space-y-2">
                  <Label className="text-sm text-blue-900 flex items-center gap-2">
                    Total Courses
                    {(advancedFilters.minCourses || advancedFilters.maxCourses) && (
                      <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-700 border-blue-200">
                        Range
                      </Badge>
                    )}
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Input
                    type="number"
                        placeholder="Min courses"
                    value={advancedFilters.minCourses}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minCourses: e.target.value }))}
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 pr-8"
                  />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">min</span>
                </div>
                    <div className="relative">
                      <Input
                    type="number"
                        placeholder="Max courses"
                    value={advancedFilters.maxCourses}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxCourses: e.target.value }))}
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 pr-8"
                  />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">max</span>
                </div>
              </div>
                </div>

                {/* Total Instructors Range */}
                <div className="space-y-2">
                  <Label className="text-sm text-blue-900 flex items-center gap-2">
                    Total Instructors
                    {(advancedFilters.minInstructors || advancedFilters.maxInstructors) && (
                      <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-700 border-blue-200">
                        Range
                      </Badge>
                    )}
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Input
                    type="number"
                        placeholder="Min instructors"
                    value={advancedFilters.minInstructors}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minInstructors: e.target.value }))}
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 pr-8"
                  />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">min</span>
                </div>
                    <div className="relative">
                      <Input
                    type="number"
                        placeholder="Max instructors"
                    value={advancedFilters.maxInstructors}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxInstructors: e.target.value }))}
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 pr-8"
                  />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">max</span>
                </div>
              </div>
            </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-4 mt-10">
            <Button
              variant="outline"
              onClick={() => {
                setColumnStatusFilter('all');
                setAdvancedFilters({
                  head: '',
                  minCourses: '',
                  maxCourses: '',
                  minInstructors: '',
                  maxInstructors: ''
                });
                setColumnNameFilter('');
                setColumnCodeFilter('');
                setColumnHeadFilter('');
                setColumnLocationFilter('');
              }}
              className="w-32 border border-blue-300 text-blue-500"
            >
              Reset
            </Button>
            <Button 
              onClick={() => setFilterDialogOpen(false)}
              className="w-32 bg-blue-600 hover:bg-blue-700 text-white">
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="backdrop-blur-md bg-white/90 border border-blue-100 rounded-xl">
          <DialogTitle className="sr-only">Delete Department</DialogTitle>
          <DialogHeader>
            <DialogTitle className="text-blue-900">Delete Department</DialogTitle>
          </DialogHeader>
          <div className="text-blue-900">Are you sure you want to delete the department "{departmentToDelete?.name}"? This action cannot be undone.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDepartmentToDelete(null); }}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={async () => {
                if (!departmentToDelete) return;
                try {
                  const response = await fetch(`/api/departments/${parseInt(departmentToDelete.id)}`, {
                    method: 'DELETE',
                  });
                  
                  if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to delete department');
                  }

                  // Update the departments list
                  setDepartments(prev => prev.filter(d => d.id !== departmentToDelete.id));
                  toast.success('Department deleted successfully');
                  setDeleteDialogOpen(false);
                  setDepartmentToDelete(null);
                } catch (error) {
                  console.error('Error deleting department:', error);
                  toast.error('Failed to delete department', {
                    description: error instanceof Error ? error.message : 'An unexpected error occurred',
                    duration: 4000,
                  });
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* MODAL FOR CREATE/EDIT */}
    <DepartmentForm
      open={modalOpen}
      onOpenChange={setModalOpen}
      initialData={modalDepartment}
      instructors={instructors}
      onSuccess={async () => {
        setModalOpen(false);
        // Refresh department list after create/edit
        setLoading(true);
        try {
          const res = await fetch('/api/departments');
          if (!res.ok) throw new Error('Failed to fetch departments');
          const data = await res.json();
          setDepartments(data);
        } catch {
          setDepartments([]);
        }
        setLoading(false);
      }}
    />
    {/* Export Dialog */}
    <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
      <DialogContent className="sm:max-w-[500px] bg-white/90 border border-blue-100 shadow-lg rounded-xl py-8 px-6">
        <DialogHeader>
          <DialogTitle className="text-blue-900 text-xl flex items-center gap-2 mb-6">
            Export Departments
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-blue-400 cursor-pointer">
                    <BadgeInfo className="w-4 h-4" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-blue-900 text-white">
                  Export department data in various formats. Choose your preferred export options.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-8">
          {/* Export Format Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-md font-semibold text-blue-900">Export Format</h3>
              </div>
            </div>
            <div className="h-px bg-blue-100 w-full mb-8"></div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <Button
                variant={exportFormat === 'pdf' ? "default" : "outline"}
                size="sm"
                className={`w-full flex flex-col items-center gap-1 py-3 ${exportFormat === 'pdf' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                onClick={() => setExportFormat('pdf')}
              >
                <FileText className="h-5 w-5 text-blue-700" />
                <span className="text-xs">PDF</span>
              </Button>
              <Button
                variant={exportFormat === 'excel' ? "default" : "outline"}
                size="sm"
                className={`w-full flex flex-col items-center gap-1 py-3 ${exportFormat === 'excel' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                onClick={() => setExportFormat('excel')}
              >
                <FileSpreadsheet className="h-5 w-5 text-blue-700" />
                <span className="text-xs">Excel</span>
              </Button>
              <Button
                variant={exportFormat === 'csv' ? "default" : "outline"}
                size="sm"
                className={`w-full flex flex-col items-center gap-1 py-3 ${exportFormat === 'csv' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                onClick={() => setExportFormat('csv')}
              >
                <FileSpreadsheet className="h-5 w-5 text-blue-700" />
                <span className="text-xs">CSV</span>
              </Button>
            </div>
          </div>

          {/* Export Options Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-md font-semibold text-blue-900">Export Options</h3>
              </div>
            </div>
            <div className="h-px bg-blue-100 w-full mb-8"></div>
            <div className="space-y-6">
              {exportableColumns.map((column) => (
                <div key={column.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`export-${column.key}`}
                    checked={exportColumns.includes(column.key)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setExportColumns([...exportColumns, column.key]);
                      } else {
                        setExportColumns(exportColumns.filter((c) => c !== column.key));
                      }
                    }}
                    className="border-blue-200 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label
                    htmlFor={`export-${column.key}`}
                    className="text-sm text-blue-900 cursor-pointer"
                  >
                    {column.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-4 mt-10">
          <Button
            variant="outline"
            onClick={() => {
              setExportFormat(null);
              setExportColumns(exportableColumns.map(col => col.key));
            }}
            className="w-32 border border-blue-300 text-blue-500"
          >
            Reset
          </Button>
          <Button 
            onClick={handleExport}
            className="w-32 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!exportFormat}
          >
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {/* Sort Dialog */}
    <Dialog open={sortDialogOpen} onOpenChange={setSortDialogOpen}>
      <DialogContent className="sm:max-w-[500px] bg-white/90 border border-blue-100 shadow-lg rounded-xl py-8 px-6">
        <DialogHeader>
          <DialogTitle className="text-blue-900 text-xl flex items-center gap-2 mb-6">
            Sort Departments
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-blue-400 cursor-pointer">
                    <BadgeInfo className="w-4 h-4" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-blue-900 text-white">
                  Sort departments by different fields. Choose the field and order to organize your list.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-8">
          {/* Sort By Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-md font-semibold text-blue-900">Sort By</h3>
              </div>
            </div>
            <div className="h-px bg-blue-100 w-full mb-8"></div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button
                variant={sortField === 'name' ? "default" : "outline"}
                size="sm"
                className={`w-full ${sortField === 'name' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                onClick={() => setSortField('name')}
              >
                Department Name
              </Button>
              <Button
                variant={sortField === 'code' ? "default" : "outline"}
                size="sm"
                className={`w-full ${sortField === 'code' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                onClick={() => setSortField('code')}
              >
                Department Code
              </Button>
              <Button
                variant={sortField === 'head' ? "default" : "outline"}
                size="sm"
                className={`w-full ${sortField === 'head' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                onClick={() => setSortField('head')}
              >
                Head of Department
              </Button>
              <Button
                variant={sortField === 'totalCourses' ? "default" : "outline"}
                size="sm"
                className={`w-full ${sortField === 'totalCourses' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                onClick={() => setSortField('totalCourses')}
              >
                Total Courses
              </Button>
              <Button
                variant={sortField === 'totalInstructors' ? "default" : "outline"}
                size="sm"
                className={`w-full ${sortField === 'totalInstructors' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                onClick={() => setSortField('totalInstructors')}
              >
                Total Instructors
              </Button>
              <Button
                variant={sortField === 'status' ? "default" : "outline"}
                size="sm"
                className={`w-full ${sortField === 'status' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                onClick={() => setSortField('status')}
              >
                Status
              </Button>
            </div>
          </div>

          {/* Sort Order Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-md font-semibold text-blue-900">Sort Order</h3>
              </div>
            </div>
            <div className="h-px bg-blue-100 w-full mb-8"></div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button
                variant={sortOrder === 'asc' ? "default" : "outline"}
                size="sm"
                className={`w-full ${sortOrder === 'asc' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                onClick={() => setSortOrder('asc')}
              >
                Ascending
              </Button>
              <Button
                variant={sortOrder === 'desc' ? "default" : "outline"}
                size="sm"
                className={`w-full ${sortOrder === 'desc' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                onClick={() => setSortOrder('desc')}
              >
                Descending
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-4 mt-10">
          <Button
            variant="outline"
            onClick={() => {
              setSortField('name');
              setSortOrder('asc');
              setSortFields([{ field: 'name', order: 'asc' }]);
            }}
            className="w-32 border border-blue-300 text-blue-500"
          >
            Reset
          </Button>
          <Button 
            onClick={() => {
              handleSort();
              setSortDialogOpen(false);
            }}
            className="w-32 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Apply Sort
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <DepartmentViewDialog
      open={viewDialogOpen}
      onOpenChange={(open) => {
        setViewDialogOpen(open);
        if (!open) setViewDepartment(undefined);
      }}
      department={viewDepartment}
    />
    </div>
    </>
  );
}
