"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { z } from "zod";
import { Tag, Eye, Pencil, Trash2, FileDown, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import FormModal from "@/components/FormModal";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TAG_TYPE_OPTIONS, TAG_STATUS_OPTIONS } from "../readers/constants";
import RFIDTagTable from "./RFIDTagTable";
import FilterBar from "./FilterBar";
import BulkActionsToolbar from "./BulkActionsToolbar";
import ExportDropdown from "./ExportDropdown";
import TableSkeleton from "../readers/TableSkeleton";

// RFIDTag type based on Prisma schema
export type RFIDTag = {
  tagId: number;
  tagNumber: string;
  tagType: string;
  assignedAt: string;
  lastUsed?: string;
  expiresAt?: string;
  status: string;
  notes?: string;
  student?: {
    studentId: number;
    firstName: string;
    lastName: string;
    studentIdNum: string;
  } | null;
  instructor?: {
    instructorId: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

// Zod schema for create/edit
const rfidTagFormSchema = z.object({
  tagNumber: z.string().min(1, "Tag Number is required"),
  tagType: z.enum(["INSTRUCTOR_CARD", "STUDENT_CARD", "TEMPORARY_PASS", "VISITOR_PASS", "MAINTENANCE", "TEST"]),
  status: z.enum(["ACTIVE", "INACTIVE", "LOST", "DAMAGED", "EXPIRED", "REPLACED", "RESERVED"]),
  notes: z.string().optional(),
});

type RFIDTagFormData = z.infer<typeof rfidTagFormSchema>;

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "LOST", label: "Lost" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REPLACED", label: "Replaced" },
  { value: "RESERVED", label: "Reserved" },
];

// Mock data for demonstration
const mockRFIDTags: RFIDTag[] = [
  {
    tagId: 1,
    tagNumber: "TAG001",
    tagType: "INSTRUCTOR_CARD",
    assignedAt: "2024-01-01T10:00:00Z",
    lastUsed: "2024-06-01T12:00:00Z",
    status: "ACTIVE",
    notes: "Assigned to Instructor 1",
  },
  {
    tagId: 2,
    tagNumber: "TAG002",
    tagType: "STUDENT_CARD",
    assignedAt: "2024-02-01T10:00:00Z",
    lastUsed: "2024-06-01T11:00:00Z",
    status: "INACTIVE",
    notes: "Lost by Student 2",
  },
];

// Default export columns for RFID tags
const DEFAULT_EXPORT_COLUMNS = [
  { key: "tagNumber", label: "Tag Number", checked: true },
  { key: "tagType", label: "Type", checked: true },
  { key: "assignedTo", label: "Assigned To", checked: true },
  { key: "assignedAt", label: "Assigned At", checked: true },
  { key: "lastUsed", label: "Last Used", checked: true },
  { key: "status", label: "Status", checked: true },
  { key: "notes", label: "Notes", checked: false },
];

export default function RFIDTagsPage() {
  const [tags, setTags] = useState<RFIDTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTag, setModalTag] = useState<RFIDTag | undefined>();
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<RFIDTag | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<RFIDTag | null>(null);
  // Pagination, search, filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  // Assignment modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningTag, setAssigningTag] = useState<RFIDTag | null>(null);
  const [assignOptions, setAssignOptions] = useState<any[]>([]);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignSelected, setAssignSelected] = useState<string>("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  // Add user role state for demo/testing
  const [userRole, setUserRole] = useState<'admin' | 'staff' | 'viewer'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('rfidUserRole');
      if (stored && ['admin', 'staff', 'viewer'].includes(stored)) return stored as 'admin' | 'staff' | 'viewer';
    }
    return 'admin';
  });
  const [exportColumns, setExportColumns] = useState(DEFAULT_EXPORT_COLUMNS);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [sortBy, setSortBy] = useState<string>("tagNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Fetch tags from backend
  useEffect(() => {
    setLoading(true);
    fetch("/api/rfid/tags")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTags(data);
        } else {
          setTags([]);
        }
      })
      .catch(() => {
        toast.error("Failed to fetch RFID tags.");
        setTags([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch assign options (students + instructors)
  useEffect(() => {
    if (assignModalOpen) {
      setAssignLoading(true);
      fetch("/api/attendance/filters")
        .then(res => res.json())
        .then(data => {
          // Group and label
          const students = (data.students || []).map((s: any) => ({
            value: `student:${s.id}`,
            label: `Student: ${s.studentName} (${s.studentId})`,
            group: "Students"
          }));
          const instructors = (data.instructors || []).map((i: any) => ({
            value: `instructor:${i.id}`,
            label: `Instructor: ${i.name}`,
            group: "Instructors"
          }));
          setAssignOptions([...students, ...instructors]);
        })
        .catch(() => setAssignOptions([]))
        .finally(() => setAssignLoading(false));
    }
  }, [assignModalOpen]);

  // Create/Edit handlers
  const handleSaveTag = async (data: RFIDTagFormData) => {
    setSubmitting(true);
    try {
      if (modalTag) {
        // Edit
        const response = await fetch(`/api/rfid/tags/${modalTag.tagId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          const updated = await response.json();
          setTags(tags.map(t => t.tagId === updated.tagId ? updated : t));
          toast.success("RFID tag updated successfully!");
        } else {
          toast.error("Failed to update RFID tag.");
        }
      } else {
        // Create
        const response = await fetch("/api/rfid/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          const created = await response.json();
          setTags([...tags, created]);
          toast.success("RFID tag created successfully!");
        } else {
          toast.error("Failed to create RFID tag.");
        }
      }
    } catch (err) {
      toast.error("An error occurred while saving the tag.");
    } finally {
      setSubmitting(false);
      setModalOpen(false);
      setModalTag(undefined);
    }
  };

  // Delete handler
  const handleDeleteTag = async () => {
    if (!tagToDelete) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/rfid/tags/${tagToDelete.tagId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setTags(tags.filter(t => t.tagId !== tagToDelete.tagId));
        toast.success("RFID tag deleted successfully!");
      } else {
        toast.error("Failed to delete RFID tag.");
      }
    } catch (err) {
      toast.error("An error occurred while deleting the tag.");
    } finally {
      setSubmitting(false);
      setDeleteDialogOpen(false);
      setTagToDelete(null);
    }
  };

  // Filtering and search
  const filteredTags = useMemo(() => {
    return tags.filter(tag => {
      const matchesSearch = tag.tagNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || tag.status === statusFilter;
      const matchesType = typeFilter === "all" || tag.tagType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [tags, searchTerm, statusFilter, typeFilter]);

  // Sorting logic
  const sortedTags = useMemo(() => {
    const sorted = [...filteredTags];
    sorted.sort((a, b) => {
      let aVal: string | number | undefined;
      let bVal: string | number | undefined;
      switch (sortBy) {
        case "tagNumber":
          aVal = a.tagNumber;
          bVal = b.tagNumber;
          break;
        case "tagType":
          aVal = a.tagType;
          bVal = b.tagType;
          break;
        case "assignedTo":
          aVal = a.student ? `Student: ${a.student.firstName} ${a.student.lastName}` : a.instructor ? `Instructor: ${a.instructor.firstName} ${a.instructor.lastName}` : "Unassigned";
          bVal = b.student ? `Student: ${b.student.firstName} ${b.student.lastName}` : b.instructor ? `Instructor: ${b.instructor.firstName} ${b.instructor.lastName}` : "Unassigned";
          break;
        case "assignedAt":
          aVal = a.assignedAt;
          bVal = b.assignedAt;
          break;
        case "lastUsed":
          aVal = a.lastUsed || "";
          bVal = b.lastUsed || "";
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "notes":
          aVal = a.notes || "";
          bVal = b.notes || "";
          break;
        default:
          aVal = "";
          bVal = "";
      }
      if (typeof aVal === "string" && typeof bVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (aVal! < bVal!) return sortDir === "asc" ? -1 : 1;
      if (aVal! > bVal!) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredTags, sortBy, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sortedTags.length / itemsPerPage);
  const paginatedTags = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedTags.slice(start, start + itemsPerPage);
  }, [sortedTags, currentPage, itemsPerPage]);

  // Export handlers
  const handleExportToCSV = () => {
    const headers = ["Tag Number", "Type", "Assigned At", "Last Used", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredTags.map(tag => [
        tag.tagNumber,
        TAG_TYPE_OPTIONS.find(opt => opt.value === tag.tagType)?.label || tag.tagType,
        new Date(tag.assignedAt).toLocaleString(),
        tag.lastUsed ? new Date(tag.lastUsed).toLocaleString() : "Never",
        tag.status
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "rfid-tags.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToExcel = () => {
    const headers = ["Tag Number", "Type", "Assigned At", "Last Used", "Status"];
    const rows = filteredTags.map(tag => [
      tag.tagNumber,
      TAG_TYPE_OPTIONS.find(opt => opt.value === tag.tagType)?.label || tag.tagType,
      new Date(tag.assignedAt).toLocaleString(),
      tag.lastUsed ? new Date(tag.lastUsed).toLocaleString() : "Never",
      tag.status
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "RFID Tags");
    XLSX.writeFile(workbook, "rfid-tags.xlsx");
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("RFID Tags List", 14, 15);
    const headers = ["Tag Number", "Type", "Assigned At", "Last Used", "Status"];
    const rows = filteredTags.map(tag => [
      tag.tagNumber,
      TAG_TYPE_OPTIONS.find(opt => opt.value === tag.tagType)?.label || tag.tagType,
      new Date(tag.assignedAt).toLocaleString(),
      tag.lastUsed ? new Date(tag.lastUsed).toLocaleString() : "Never",
      tag.status
    ]);
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });
    doc.save("rfid-tags.pdf");
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    setSubmitting(true);
    try {
      await Promise.all(selectedTagIds.map(async (id) => {
        await fetch(`/api/rfid/tags/${id}`, { method: "DELETE" });
      }));
      setTags(tags.filter(t => !selectedTagIds.includes(t.tagId)));
      setSelectedTagIds([]);
      toast.success("Selected tags deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete selected tags.");
    } finally {
      setSubmitting(false);
      setBulkDeleteDialogOpen(false);
    }
  };

  // Checkbox helpers
  const allSelected = paginatedTags.length > 0 && paginatedTags.every(tag => selectedTagIds.includes(tag.tagId));
  const someSelected = paginatedTags.some(tag => selectedTagIds.includes(tag.tagId));
  const toggleAll = () => {
    if (allSelected) {
      setSelectedTagIds(selectedTagIds.filter(id => !paginatedTags.some(tag => tag.tagId === id)));
    } else {
      setSelectedTagIds([
        ...selectedTagIds,
        ...paginatedTags.filter(tag => !selectedTagIds.includes(tag.tagId)).map(tag => tag.tagId)
      ]);
    }
  };
  const toggleOne = (id: number) => {
    setSelectedTagIds(selectedTagIds.includes(id)
      ? selectedTagIds.filter(tagId => tagId !== id)
      : [...selectedTagIds, id]);
  };

  // Assign handler
  const handleAssign = async () => {
    if (!assigningTag || !assignSelected) return;
    setSubmitting(true);
    let body: any = {};
    if (assignSelected.startsWith("student:")) {
      body.studentId = assignSelected.replace("student:", "");
    } else if (assignSelected.startsWith("instructor:")) {
      body.instructorId = assignSelected.replace("instructor:", "");
    }
    try {
      const response = await fetch(`/api/rfid/tags/${assigningTag.tagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        const updated = await response.json();
        setTags(tags.map(t => t.tagId === updated.tagId ? updated : t));
        toast.success("Tag assigned successfully!");
      } else {
        toast.error("Failed to assign tag.");
      }
    } catch {
      toast.error("Failed to assign tag.");
    } finally {
      setSubmitting(false);
      setAssignModalOpen(false);
      setAssigningTag(null);
      setAssignSelected("");
    }
  };

  // Unassign handler
  const handleUnassign = async () => {
    if (!assigningTag) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/rfid/tags/${assigningTag.tagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unassign: true }),
      });
      if (response.ok) {
        const updated = await response.json();
        setTags(tags.map(t => t.tagId === updated.tagId ? updated : t));
        toast.success("Tag unassigned successfully!");
      } else {
        toast.error("Failed to unassign tag.");
      }
    } catch {
      toast.error("Failed to unassign tag.");
    } finally {
      setSubmitting(false);
      setUnassignDialogOpen(false);
      setAssigningTag(null);
    }
  };

  // Toggle row expand/collapse
  const toggleRow = (tagId: number) => {
    setExpandedRows(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  // Reset preferences handler
  const handleResetPreferences = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
    setExportColumns(DEFAULT_EXPORT_COLUMNS);
    setCurrentPage(1);
    setItemsPerPage(10);
    setExpandedRows([]);
    setFocusedRow(null);
    if (searchInputRef.current) searchInputRef.current.value = "";
  };

  // Status badge renderer
  const renderStatusBadge = (status: string) => {
    let variant: "success" | "warning" | "info" | undefined = "info";
    if (status === "ACTIVE") variant = "success";
    else if (status === "INACTIVE") variant = "warning";
    else if (["LOST", "DAMAGED", "EXPIRED", "REPLACED", "RESERVED"].includes(status)) variant = "info";
    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 bg-white rounded-2xl shadow-md border border-blue-100 animate-fade-in w-full">
      {/* User Role Dropdown for demo/testing */}
      <div className="flex justify-end w-full max-w-6xl mb-2">
        <label htmlFor="userRole" className="mr-2 text-xs text-blue-700 font-semibold">Role:</label>
        <select
          id="userRole"
          className="border border-blue-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={userRole}
          onChange={e => setUserRole(e.target.value as 'admin' | 'staff' | 'viewer')}
          style={{ width: 120 }}
        >
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>
      <span className="bg-blue-100 p-4 rounded-full mb-4 animate-pop">
        <Tag className="w-12 h-12 text-blue-600" />
      </span>
      <h1 className="text-3xl font-extrabold text-blue-800 mb-2">RFID Tags</h1>
      <p className="text-blue-700 text-lg mb-6 text-center max-w-xl">
        Manage and monitor all RFID tags in the ICCT Smart Attendance System. Here you can view, add, and configure RFID tags.
      </p>
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <FilterBar
              search={searchTerm}
              setSearch={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              handleResetPreferences={handleResetPreferences}
              searchInputRef={searchInputRef}
            />
          </div>
          <div className="flex gap-2">
            <ExportDropdown
              exportColumns={exportColumns}
              setExportColumns={setExportColumns}
              handleExportToCSV={handleExportToCSV}
              handleExportToExcel={handleExportToExcel}
              handleExportToPDF={handleExportToPDF}
            />
            <Button
              onClick={() => { setModalTag(undefined); setModalOpen(true); }}
              disabled={userRole === 'viewer'}
              aria-label={userRole !== 'viewer' ? "+ Add RFID Tag" : "You do not have permission to add tags"}
              title={userRole !== 'viewer' ? undefined : "You do not have permission to add tags"}
            >
              + Add RFID Tag
            </Button>
          </div>
        </div>
        <div className="flex gap-2 items-center mb-4">
          <label className="text-xs text-blue-700 mr-1" htmlFor="pageSize">Rows:</label>
          <select
            id="pageSize"
            className="border border-blue-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={itemsPerPage}
            onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            style={{ width: 60 }}
          >
            {[5, 10, 20, 50, 100].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="w-full overflow-x-auto">
          {userRole === 'viewer' && (
            <div className="w-full max-w-6xl mb-4 p-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded text-center">
              You are in viewer mode. Editing and management actions are disabled.
            </div>
          )}
          <BulkActionsToolbar
            selectedTagIds={selectedTagIds}
            userRole={userRole}
            submitting={submitting}
            setBulkDeleteDialogOpen={setBulkDeleteDialogOpen}
            canBulk={userRole !== 'viewer'}
          />
          <RFIDTagTable
            tags={paginatedTags}
            exportColumns={exportColumns}
            selectedTagIds={selectedTagIds}
            toggleOne={toggleOne}
            toggleAll={toggleAll}
            allSelected={allSelected}
            someSelected={someSelected}
            expandedRows={expandedRows}
            toggleRow={toggleRow}
            focusedRow={focusedRow}
            setFocusedRow={setFocusedRow}
            renderStatusBadge={renderStatusBadge}
            userRole={userRole}
            setModalTag={setModalTag}
            setModalOpen={setModalOpen}
            setTagToDelete={setTagToDelete}
            setDeleteDialogOpen={setDeleteDialogOpen}
            setSelectedTag={setSelectedTag}
            setViewDialogOpen={setViewDialogOpen}
            tagsLoading={loading}
            sortBy={sortBy}
            sortDir={sortDir}
            canEdit={userRole !== 'viewer'}
            canDelete={userRole !== 'viewer'}
          />
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6 w-full max-w-5xl mx-auto">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                Prev
              </Button>
              <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveTag}
        title={modalTag ? "Edit RFID Tag" : "Add New RFID Tag"}
        submitLabel={modalTag ? "Update" : "Add"}
        defaultValues={modalTag}
        schema={rfidTagFormSchema}
        fields={[
          { name: "tagNumber", label: "Tag Number", type: "text", placeholder: "e.g. TAG001", helperText: "This must be unique for each tag." },
          {
            name: "tagType",
            label: "Tag Type",
            type: "select",
            options: TAG_TYPE_OPTIONS,
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: TAG_STATUS_OPTIONS,
          },
          { name: "notes", label: "Notes", type: "multiline", placeholder: "Additional information about this tag...", helperText: "Optional: Add any remarks or assignment info." },
        ]}
        submitButtonProps={{ disabled: submitting, children: submitting ? (modalTag ? "Updating..." : "Adding...") : (modalTag ? "Update" : "Add") }}
      />

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={open => { if (!open) { setViewDialogOpen(false); setSelectedTag(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>RFID Tag Details</DialogTitle>
            <DialogDescription>View details of the RFID tag.</DialogDescription>
          </DialogHeader>
          {selectedTag && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Tag className="w-7 h-7 text-blue-600" />
                <span className="text-xl font-bold text-blue-800">{selectedTag.tagNumber}</span>
                <Badge variant={selectedTag.status === "ACTIVE" ? "success" : selectedTag.status === "INACTIVE" ? "warning" : "info"}>{selectedTag.status}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Tag Type</div>
                  <div className="text-base text-gray-900 font-medium">{TAG_TYPE_OPTIONS.find(opt => opt.value === selectedTag.tagType)?.label || selectedTag.tagType.replace("_", " ")}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Assigned At</div>
                  <div className="text-base text-gray-900 font-medium">{new Date(selectedTag.assignedAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Last Used</div>
                  <div className="text-base text-gray-900 font-medium">{selectedTag.lastUsed ? new Date(selectedTag.lastUsed).toLocaleString() : <span className="text-blue-300 italic">Never</span>}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Notes</div>
                  <div className="text-base text-gray-900 font-medium">{selectedTag.notes || <span className="text-blue-300 italic">None</span>}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-gray-500">Assigned To</div>
                  <div className="text-base text-gray-900 font-medium">
                    {selectedTag.student ? (
                      <span className="text-green-700 font-medium">Student: {selectedTag.student.firstName} {selectedTag.student.lastName} (ID: {selectedTag.student.studentIdNum})</span>
                    ) : selectedTag.instructor ? (
                      <span className="text-blue-700 font-medium">Instructor: {selectedTag.instructor.firstName} {selectedTag.instructor.lastName} ({selectedTag.instructor.email})</span>
                    ) : (
                      <span className="text-gray-400 italic">Unassigned</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => { setViewDialogOpen(false); setSelectedTag(null); }}>Close</Button>
            <Button onClick={() => { if (selectedTag) { setModalTag(selectedTag); setModalOpen(true); setViewDialogOpen(false); } }}>Edit</Button>
            {selectedTag && (!selectedTag.student && !selectedTag.instructor) ? (
              <Button variant="outline" onClick={() => { setAssigningTag(selectedTag); setAssignModalOpen(true); setViewDialogOpen(false); }}>Assign</Button>
            ) : selectedTag ? (
              <Button variant="secondary" onClick={() => { setAssigningTag(selectedTag); setUnassignDialogOpen(true); setViewDialogOpen(false); }}>Unassign</Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={open => { if (!open) { setDeleteDialogOpen(false); setTagToDelete(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete RFID Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the RFID tag "{tagToDelete?.tagNumber}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setTagToDelete(null); }} disabled={submitting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteTag} disabled={submitting}>
              {submitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={open => { if (!open) { setBulkDeleteDialogOpen(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected RFID Tags</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedTagIds.length} selected RFID tag(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={submitting}>
              {submitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Modal */}
      <Dialog open={assignModalOpen} onOpenChange={open => { if (!open) { setAssignModalOpen(false); setAssigningTag(null); setAssignSelected(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign RFID Tag</DialogTitle>
            <DialogDescription>Select a student or instructor to assign this tag.</DialogDescription>
          </DialogHeader>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="border border-blue-200 rounded px-3 py-2 text-sm w-full"
                placeholder="Search by name or ID..."
                value={assignSearch}
                onChange={e => setAssignSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto border rounded">
              {assignLoading ? (
                <div className="p-4 text-center text-blue-500">Loading...</div>
              ) : assignOptions.length === 0 ? (
                <div className="p-4 text-center text-gray-400">No options found.</div>
              ) : (
                assignOptions
                  .filter(opt => opt.label.toLowerCase().includes(assignSearch.toLowerCase()))
                  .map(opt => (
                    <div
                      key={opt.value}
                      className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${assignSelected === opt.value ? "bg-blue-100 font-semibold" : ""}`}
                      onClick={() => setAssignSelected(opt.value)}
                    >
                      {opt.label}
                    </div>
                  ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignModalOpen(false); setAssigningTag(null); setAssignSelected(""); }}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!assignSelected || submitting}>{submitting ? "Assigning..." : "Assign"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unassign Confirmation Dialog */}
      <Dialog open={unassignDialogOpen} onOpenChange={open => { if (!open) { setUnassignDialogOpen(false); setAssigningTag(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unassign RFID Tag</DialogTitle>
            <DialogDescription>Are you sure you want to unassign this tag? This will remove its current assignment.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUnassignDialogOpen(false); setAssigningTag(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleUnassign} disabled={submitting}>{submitting ? "Unassigning..." : "Unassign"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeInBg 0.7s ease;
        }
        @keyframes fadeInBg {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-pop {
          animation: popIn 0.5s cubic-bezier(0.23, 1.12, 0.32, 1) both;
        }
        @keyframes popIn {
          0% { transform: scale(0.7); opacity: 0; }
          80% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
} 