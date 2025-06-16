"use client";

import { useState, useEffect, Fragment, useRef } from "react";
import { z } from "zod";
import { ScanLine, Eye, Pencil, Trash2, FileDown, AlertTriangle, CheckCircle2, Wrench, Power, Info, RefreshCw, XCircle, ChevronDown, ChevronRight, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import FormModal from "@/components/FormModal";
import Loading from "@/components/Loading";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import useSWR from "swr";
import { useDebounce } from "use-debounce";
import RFIDReaderTable from "./RFIDReaderTable";
import BulkActionsToolbar from "./BulkActionsToolbar";
import FilterBar from "./FilterBar";
import ExportDropdown from "./ExportDropdown";
import TableSkeleton from "./TableSkeleton";
import { RFIDReader, rfidReaderFormSchema, RFIDReaderFormData } from "./types";
import { STATUS_OPTIONS, DEFAULT_EXPORT_COLUMNS, USER_ROLE_OPTIONS } from "./constants";
import { permissions, canPerform } from "./permissions";

// Mock data for demonstration
const mockRFIDReaders: RFIDReader[] = [
  {
    readerId: 1,
    roomId: 101,
    deviceId: "READER001",
    deviceName: "Main Entrance Reader",
    components: { rfidModule: "Default", microcontroller: "Default" },
    assemblyDate: "2024-01-01T10:00:00Z",
    lastCalibration: "2024-05-01T10:00:00Z",
    nextCalibration: "2024-11-01T10:00:00Z",
    ipAddress: "192.168.1.100",
    status: "ACTIVE",
    lastSeen: "2024-06-01T12:00:00Z",
    notes: "Operational",
    testResults: { passed: true },
  },
  {
    readerId: 2,
    roomId: 202,
    deviceId: "READER002",
    deviceName: "Lab Reader",
    components: { rfidModule: "Default", microcontroller: "Default" },
    assemblyDate: "2024-02-01T10:00:00Z",
    lastCalibration: "2024-05-15T10:00:00Z",
    nextCalibration: "2024-11-15T10:00:00Z",
    ipAddress: "192.168.1.101",
    status: "INACTIVE",
    lastSeen: "2024-06-01T11:00:00Z",
    notes: "Needs maintenance",
    testResults: { passed: false },
  },
];

// Mock room options for select
const mockRooms = [
  { value: 101, label: "Main Entrance (Room 101)" },
  { value: 202, label: "Lab (Room 202)" },
];

/**
 * RFIDReadersPage is the main page for managing RFID readers.
 * It supports listing, searching, filtering, sorting, pagination, role-based permissions, and CRUD operations.
 * All major UI blocks are split into their own components for maintainability.
 */
export default function RFIDReadersPage() {
  const { data: roomsData, error: roomsError, isLoading: roomsLoading } = useSWR("/api/rooms", (url) => fetch(url).then(res => res.json()));

  const [rooms, setRooms] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalReader, setModalReader] = useState<RFIDReader | undefined>();
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedReader, setSelectedReader] = useState<RFIDReader | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [readerToDelete, setReaderToDelete] = useState<RFIDReader | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReaderIds, setSelectedReaderIds] = useState<number[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [sortBy, setSortBy] = useState<string>("deviceId");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [bulkStatus, setBulkStatus] = useState("");
  const [exportColumns, setExportColumns] = useState(DEFAULT_EXPORT_COLUMNS);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [confirmBulkStatus, setConfirmBulkStatus] = useState(false);
  const [pendingBulkStatus, setPendingBulkStatus] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Accessibility: ARIA live region for announcements
  const [ariaAnnouncement, setAriaAnnouncement] = useState("");
  const ariaLiveRef = useRef<HTMLDivElement>(null);
  // Keyboard navigation state
  const [focusedRow, setFocusedRow] = useState<number | null>(null);

  // Persistent preferences keys
  const PREF_KEY = 'rfidReadersPrefs';

  // Add user role state for demo/testing
  const [userRole, setUserRole] = useState<'admin' | 'staff' | 'viewer'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('rfidUserRole');
      if (stored && ['admin', 'staff', 'viewer'].includes(stored)) return stored as 'admin' | 'staff' | 'viewer';
    }
    return USER_ROLE_OPTIONS[0].value as 'admin' | 'staff' | 'viewer';
  });

  // Load preferences from localStorage
  useEffect(() => {
    const prefs = typeof window !== 'undefined' ? localStorage.getItem(PREF_KEY) : null;
    if (prefs) {
      try {
        const parsed = JSON.parse(prefs);
        if (parsed.search !== undefined) setSearch(parsed.search);
        if (parsed.statusFilter !== undefined) setStatusFilter(parsed.statusFilter);
        if (parsed.roomFilter !== undefined) setRoomFilter(parsed.roomFilter);
        if (parsed.sortBy !== undefined) setSortBy(parsed.sortBy);
        if (parsed.sortDir !== undefined) setSortDir(parsed.sortDir);
        if (parsed.exportColumns !== undefined) setExportColumns(parsed.exportColumns);
        if (parsed.pageSize !== undefined) setPageSize(parsed.pageSize);
      } catch {}
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    const prefs = {
      search,
      statusFilter,
      roomFilter,
      sortBy,
      sortDir,
      exportColumns,
      pageSize,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    }
  }, [search, statusFilter, roomFilter, sortBy, sortDir, exportColumns, pageSize]);

  // Sync SWR data to local state for compatibility with existing logic
  useEffect(() => {
    if (Array.isArray(roomsData)) setRooms(roomsData);
  }, [roomsData]);

  // Readers SWR fetcher with query params
  const readersKey = `/api/rfid/readers?page=${currentPage}&pageSize=${pageSize}&search=${encodeURIComponent(debouncedSearch)}&status=${statusFilter}&room=${roomFilter}&sortBy=${sortBy}&sortDir=${sortDir}`;
  const { data: readersResp, error: readersError, isLoading: readersLoading, mutate: mutateReaders } = useSWR(readersKey, (url) => fetch(url).then(res => res.json()));
  const readers = Array.isArray(readersResp?.data) ? readersResp.data : [];
  const total = typeof readersResp?.total === "number" ? readersResp.total : 0;

  // Helper to get room name
  const getRoomName = (roomId: number): string => {
    const room = rooms.find(r => r.id === roomId || r.roomId === roomId || r.roomNo === roomId);
    return room ? `${room.roomName || room.roomType || "Room"} (${room.roomNo || room.id || roomId})` : String(roomId);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

  // Helper for aria-sort
  const ariaSort = (column: string) => {
    if (sortBy === column) return sortDir === "asc" ? "ascending" : "descending";
    return "none";
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Bulk selection helpers
  const allSelected = readers.length > 0 && readers.every((reader: RFIDReader) => selectedReaderIds.includes(reader.readerId));
  const someSelected = readers.some((reader: RFIDReader) => selectedReaderIds.includes(reader.readerId));
  const toggleAll = () => {
    if (allSelected) {
      setSelectedReaderIds(selectedReaderIds.filter(id => !readers.some((reader: RFIDReader) => reader.readerId === id)));
    } else {
      setSelectedReaderIds([
        ...selectedReaderIds,
        ...readers.filter((reader: RFIDReader) => !selectedReaderIds.includes(reader.readerId)).map((reader: RFIDReader) => reader.readerId)
      ]);
    }
  };
  const toggleOne = (id: number) => {
    setSelectedReaderIds(selectedReaderIds.includes(id)
      ? selectedReaderIds.filter(readerId => readerId !== id)
      : [...selectedReaderIds, id]);
  };

  /**
   * Handles bulk deletion of selected RFID readers.
   * Uses optimistic UI updates and SWR mutate for performance.
   */
  const handleBulkDelete = async () => {
    setSubmitting(true);
    try {
      await Promise.all(selectedReaderIds.map(async (id) => {
        await fetch(`/api/rfid/readers/${id}`, { method: "DELETE" });
      }));
      setSelectedReaderIds([]);
      toast.success("Selected readers deleted successfully!");
      mutateReaders();
    } catch (err) {
      toast.error("Failed to delete selected readers.");
    } finally {
      setSubmitting(false);
      setBulkDeleteDialogOpen(false);
    }
  };

  const getExportRows = () => {
    const base = selectedReaderIds.length > 0
      ? readers.filter((r: RFIDReader) => selectedReaderIds.includes(r.readerId))
      : readers;
    return base;
  };
  const getExportHeaders = () => exportColumns.filter(c => c.checked).map(c => c.label);
  const getExportFields = () => exportColumns.filter(c => c.checked).map(c => c.key);

  // Helper for export field value
  const getExportValue = (reader: RFIDReader, field: string) => {
    switch (field) {
      case "deviceId": return reader.deviceId;
      case "deviceName": return reader.deviceName || "";
      case "room": return String(getRoomName(reader.roomId));
      case "status": return reader.status;
      case "ipAddress": return reader.ipAddress || "";
      case "lastSeen": return new Date(reader.lastSeen).toLocaleString();
      default: return "";
    }
  };

  // Updated export handlers
  const handleExportToCSV = () => {
    const headers = getExportHeaders();
    const fields = getExportFields();
    const rows = getExportRows().map((reader: RFIDReader) =>
      fields.map(f => getExportValue(reader, f))
    );
    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) => row.join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "rfid-readers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToExcel = () => {
    const headers = getExportHeaders();
    const fields = getExportFields();
    const rows = getExportRows().map((reader: RFIDReader) =>
      fields.map(f => getExportValue(reader, f))
    );
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "RFID Readers");
    XLSX.writeFile(workbook, "rfid-readers.xlsx");
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("RFID Readers List", 14, 15);
    const headers = getExportHeaders();
    const fields = getExportFields();
    const rows = getExportRows().map((reader: RFIDReader) =>
      fields.map(f => getExportValue(reader, f))
    );
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });
    doc.save("rfid-readers.pdf");
  };

  /**
   * Handles saving (creating or editing) an RFID reader.
   * Uses optimistic UI updates and SWR mutate for performance.
   * @param data - The form data for the RFID reader.
   */
  const handleSaveReader = async (data: RFIDReaderFormData) => {
    setSubmitting(true);
    if (modalReader) {
      // Edit
      const optimisticReaders = readers.map((r: RFIDReader) =>
        r.readerId === modalReader.readerId ? { ...r, ...data } : r
      );
      mutateReaders(async (current: any) => {
        const previous = current;
        try {
          const response = await fetch(`/api/rfid/readers/${modalReader.readerId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (response.ok) {
            const updated = await response.json();
            toast.success("RFID reader updated successfully!");
            return { ...current, data: optimisticReaders.map((r: RFIDReader) => r.readerId === updated.readerId ? updated : r) };
          } else {
            let errorMsg = "Failed to update RFID reader.";
            try {
              const errJson = await response.json();
              if (errJson?.error) errorMsg = errJson.error;
            } catch {}
            if (response.status === 401 || response.status === 403) errorMsg = "You do not have permission to update this reader.";
            toast.error(errorMsg);
            return previous;
          }
        } catch (err: any) {
          toast.error(err?.message ? `Network error: ${err.message}` : "An error occurred while saving the reader.");
          return previous;
        }
      }, { optimisticData: { ...readersResp, data: optimisticReaders }, rollbackOnError: true, revalidate: true });
    } else {
      // Create
      const tempId = Math.max(0, ...readers.map((r: RFIDReader) => r.readerId)) + 1;
      const optimisticReader = { ...data, readerId: tempId, assemblyDate: new Date().toISOString(), lastSeen: new Date().toISOString(), status: data.status, components: {}, testResults: {} };
      mutateReaders(async (current: any) => {
        const previous = current;
        try {
          const response = await fetch("/api/rfid/readers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (response.ok) {
            const created = await response.json();
            toast.success("RFID reader created successfully!");
            return { ...current, data: [...readers, created] };
          } else {
            let errorMsg = "Failed to create RFID reader.";
            try {
              const errJson = await response.json();
              if (errJson?.error) errorMsg = errJson.error;
            } catch {}
            if (response.status === 401 || response.status === 403) errorMsg = "You do not have permission to create a reader.";
            toast.error(errorMsg);
            return previous;
          }
        } catch (err: any) {
          toast.error(err?.message ? `Network error: ${err.message}` : "An error occurred while saving the reader.");
          return previous;
        }
      }, { optimisticData: { ...readersResp, data: [...readers, optimisticReader] }, rollbackOnError: true, revalidate: true });
    }
    setSubmitting(false);
    setModalOpen(false);
    setModalReader(undefined);
  };

  /**
   * Handles deleting a single RFID reader.
   * Uses optimistic UI updates and SWR mutate for performance.
   */
  const handleDeleteReader = async () => {
    if (!readerToDelete) return;
    setSubmitting(true);
    const optimisticReaders = readers.filter((r: RFIDReader) => r.readerId !== readerToDelete.readerId);
    mutateReaders(async (current: any) => {
      const previous = current;
      try {
        const response = await fetch(`/api/rfid/readers/${readerToDelete.readerId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          toast.success("RFID reader deleted successfully!");
          return { ...current, data: optimisticReaders };
        } else {
          let errorMsg = "Failed to delete RFID reader.";
          try {
            const errJson = await response.json();
            if (errJson?.error) errorMsg = errJson.error;
          } catch {}
          if (response.status === 401 || response.status === 403) errorMsg = "You do not have permission to delete this reader.";
          toast.error(errorMsg);
          return previous;
        }
      } catch (err: any) {
        toast.error(err?.message ? `Network error: ${err.message}` : "An error occurred while deleting the reader.");
        return previous;
      }
    }, { optimisticData: { ...readersResp, data: optimisticReaders }, rollbackOnError: true, revalidate: true });
    setSubmitting(false);
    setDeleteDialogOpen(false);
    setReaderToDelete(null);
  };

  /**
   * Handles bulk status update for selected RFID readers.
   * Uses SWR mutate for performance.
   */
  const handleBulkStatusUpdate = async () => {
    setConfirmBulkStatus(false);
    if (!pendingBulkStatus || selectedReaderIds.length === 0) return;
    setSubmitting(true);
    try {
      await Promise.all(selectedReaderIds.map(async (id) => {
        await fetch(`/api/rfid/readers/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: pendingBulkStatus }),
        });
      }));
      mutateReaders();
    } catch (err) {
      toast.error("Failed to update status for selected readers.");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Renders a status badge with icon and tooltip for a given status.
   * @param status - The status string (e.g., 'ACTIVE', 'INACTIVE').
   * @returns JSX.Element
   */
  const renderStatusBadge = (status: string) => {
    let icon = null;
    let tooltip = "";
    let variant: any = "info";
    switch (status) {
      case "ACTIVE":
        icon = <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />;
        tooltip = "Active and operational";
        variant = "success";
        break;
      case "INACTIVE":
        icon = <Power className="w-4 h-4 mr-1 text-amber-500" />;
        tooltip = "Inactive or powered off";
        variant = "warning";
        break;
      case "ERROR":
        icon = <AlertTriangle className="w-4 h-4 mr-1 text-red-600" />;
        tooltip = "Error detected";
        variant = "error";
        break;
      case "OFFLINE":
        icon = <XCircle className="w-4 h-4 mr-1 text-gray-500" />;
        tooltip = "Device is offline";
        variant = "outline";
        break;
      case "REPAIR":
        icon = <Wrench className="w-4 h-4 mr-1 text-red-500" />;
        tooltip = "Under repair";
        variant = "destructive";
        break;
      case "CALIBRATION":
        icon = <RefreshCw className="w-4 h-4 mr-1 text-blue-500" />;
        tooltip = "Under calibration";
        variant = "info";
        break;
      case "TESTING":
        icon = <Info className="w-4 h-4 mr-1 text-blue-400" />;
        tooltip = "In testing mode";
        variant = "secondary";
        break;
      default:
        icon = <Info className="w-4 h-4 mr-1 text-blue-400" />;
        tooltip = status;
        variant = "info";
    }
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center">
              <Badge variant={variant}>{icon}{status}</Badge>
            </span>
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const toggleRow = (readerId: number) => {
    if (expandedRows.includes(readerId)) {
      setExpandedRows(expandedRows.filter(id => id !== readerId));
    } else {
      setExpandedRows([...expandedRows, readerId]);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "a" && !modalOpen && (canPerform(userRole, 'canCreate') || canPerform(userRole, 'canEdit'))) {
        setModalReader(undefined);
        setModalOpen(true);
      }
      if (e.key === "Escape") {
        setModalOpen(false);
        setViewDialogOpen(false);
        setDeleteDialogOpen(false);
        setBulkDeleteDialogOpen(false);
        setConfirmBulkStatus(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen, userRole]);

  // Reset preferences handler
  const handleResetPreferences = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PREF_KEY);
    }
    setSearch("");
    setStatusFilter("all");
    setRoomFilter("all");
    setSortBy("deviceId");
    setSortDir("asc");
    setExportColumns(DEFAULT_EXPORT_COLUMNS);
    setPageSize(10);
    setCurrentPage(1);
    toast.success("Preferences reset to default.");
  };

  // Announce helper
  const announce = (msg: string) => {
    setAriaAnnouncement(msg);
    if (ariaLiveRef.current) {
      ariaLiveRef.current.textContent = msg;
    }
  };

  // Keyboard navigation for table rows
  useEffect(() => {
    const handleTableKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement && (document.activeElement as HTMLElement).tagName === "INPUT") return;
      if (readers.length === 0) return;
      if (focusedRow === null) return;
      const idx = readers.findIndex((r: RFIDReader) => r.readerId === focusedRow);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIdx = idx < readers.length - 1 ? idx + 1 : 0;
        setFocusedRow(readers[nextIdx].readerId);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIdx = idx > 0 ? idx - 1 : readers.length - 1;
        setFocusedRow(readers[prevIdx].readerId);
      } else if (e.key === "Enter") {
        e.preventDefault();
        toggleRow(readers[idx].readerId);
        announce(
          expandedRows.includes(readers[idx].readerId)
            ? `Row collapsed for ${readers[idx].deviceId}`
            : `Row expanded for ${readers[idx].deviceId}`
        );
      } else if (e.key === " ") {
        e.preventDefault();
        toggleOne(readers[idx].readerId);
        announce(
          selectedReaderIds.includes(readers[idx].readerId)
            ? `Row deselected for ${readers[idx].deviceId}`
            : `Row selected for ${readers[idx].deviceId}`
        );
      }
    };
    window.addEventListener("keydown", handleTableKeyDown);
    return () => window.removeEventListener("keydown", handleTableKeyDown);
  }, [readers, focusedRow, expandedRows, selectedReaderIds]);

  // Focus first row on page change
  useEffect(() => {
    if (readers.length > 0) setFocusedRow(readers[0].readerId);
    else setFocusedRow(null);
  }, [currentPage, readers.length]);

  if (readersLoading) return <TableSkeleton />;
  if (roomsLoading) return (
    <div className="flex justify-center items-center py-16">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      <span className="ml-4 text-blue-700 font-semibold">Loading rooms...</span>
    </div>
  );
  if (readersError || roomsError) return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="text-red-600 text-center mb-4">{readersError?.message || roomsError?.message}</div>
      <Button variant="outline" onClick={() => { mutateReaders(); }} aria-label="Retry loading data">Retry</Button>
    </div>
  );

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
          {USER_ROLE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <span className="bg-blue-100 p-4 rounded-full mb-4 animate-pop">
        <ScanLine className="w-12 h-12 text-blue-600" />
      </span>
      <h1 className="text-3xl font-extrabold text-blue-800 mb-2">RFID Readers</h1>
      <p className="text-blue-700 text-lg mb-6 text-center max-w-xl">
        Manage and monitor all RFID readers connected to the ICCT Smart Attendance System. Here you can view, add, and configure RFID reader devices.
      </p>
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <FilterBar
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              roomFilter={roomFilter}
              setRoomFilter={setRoomFilter}
              rooms={rooms}
              setCurrentPage={setCurrentPage}
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
              onClick={() => { setModalReader(undefined); setModalOpen(true); }}
              disabled={!canPerform(userRole, 'canCreate')}
              aria-label={canPerform(userRole, 'canCreate') ? "+ Add RFID Reader" : "You do not have permission to add readers"}
              title={canPerform(userRole, 'canCreate') ? undefined : "You do not have permission to add readers"}
            >
              + Add RFID Reader
            </Button>
          </div>
        </div>
        <div className="flex gap-2 items-center mb-4">
          <label className="text-xs text-blue-700 mr-1" htmlFor="pageSize">Rows:</label>
          <select
            id="pageSize"
            className="border border-blue-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            style={{ width: 60 }}
          >
            {[5, 10, 20, 50, 100].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="w-full overflow-x-auto">
          {!canPerform(userRole, 'canEdit') && (
            <div className="w-full max-w-6xl mb-4 p-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded text-center">
              You are in viewer mode. Editing and management actions are disabled.
            </div>
          )}
          <BulkActionsToolbar
            selectedReaderIds={selectedReaderIds}
            userRole={userRole}
            submitting={submitting}
            setBulkDeleteDialogOpen={setBulkDeleteDialogOpen}
            bulkStatus={bulkStatus}
            setBulkStatus={setBulkStatus}
            handleBulkStatusUpdate={handleBulkStatusUpdate}
            setPendingBulkStatus={setPendingBulkStatus}
            setConfirmBulkStatus={setConfirmBulkStatus}
            canBulk={canPerform(userRole, 'canBulk')}
          />
          <RFIDReaderTable
            readers={readers}
            exportColumns={exportColumns}
            selectedReaderIds={selectedReaderIds}
            toggleOne={toggleOne}
            toggleAll={toggleAll}
            allSelected={allSelected}
            someSelected={someSelected}
            expandedRows={expandedRows}
            toggleRow={toggleRow}
            focusedRow={focusedRow}
            setFocusedRow={setFocusedRow}
            getRoomName={getRoomName}
            renderStatusBadge={renderStatusBadge}
            userRole={userRole}
            setModalReader={setModalReader}
            setModalOpen={setModalOpen}
            setReaderToDelete={setReaderToDelete}
            setDeleteDialogOpen={setDeleteDialogOpen}
            setSelectedReader={setSelectedReader}
            setViewDialogOpen={setViewDialogOpen}
            readersLoading={readersLoading}
            sortBy={sortBy}
            sortDir={sortDir}
            canEdit={canPerform(userRole, 'canEdit')}
            canDelete={canPerform(userRole, 'canDelete')}
          />
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6 w-full max-w-5xl mx-auto">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveReader}
        title={modalReader ? "Edit RFID Reader" : "Add New RFID Reader"}
        submitLabel={modalReader ? "Update" : "Add"}
        defaultValues={{ status: "ACTIVE", ...modalReader }}
        schema={rfidReaderFormSchema}
        fields={[
          { name: "deviceId", label: "Device ID", type: "text", placeholder: "e.g. READER001" },
          { name: "deviceName", label: "Device Name", type: "text", placeholder: "e.g. Main Entrance Reader" },
          {
            name: "roomId",
            label: "Room",
            type: "select",
            options: rooms.map(r => ({ value: (r.roomNo || r.id || r.roomId).toString(), label: `${r.roomName || r.roomType || "Room"} (${r.roomNo || r.id || r.roomId})` })),
          },
          { name: "ipAddress", label: "IP Address", type: "text", placeholder: "e.g. 192.168.1.100" },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: STATUS_OPTIONS,
          },
          { name: "notes", label: "Notes", type: "multiline", placeholder: "Additional information about this reader..." },
        ]}
      />

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={open => { if (!open) { setViewDialogOpen(false); setSelectedReader(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>RFID Reader Details</DialogTitle>
            <DialogDescription>View details of the RFID reader.</DialogDescription>
          </DialogHeader>
          {selectedReader && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <ScanLine className="w-7 h-7 text-blue-600" />
                <span className="text-xl font-bold text-blue-800">{selectedReader.deviceName || selectedReader.deviceId}</span>
                {renderStatusBadge(selectedReader.status)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Device ID</div>
                  <div className="text-base text-gray-900 font-medium">{selectedReader.deviceId}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Room ID</div>
                  <div className="text-base text-gray-900 font-medium">{selectedReader.roomId}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">IP Address</div>
                  <div className="text-base text-gray-900 font-medium">{selectedReader.ipAddress || <span className="text-blue-300 italic">N/A</span>}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Last Seen</div>
                  <div className="text-base text-gray-900 font-medium">{new Date(selectedReader.lastSeen).toLocaleString()}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-gray-500">Notes</div>
                  <div className="text-base text-gray-900 font-medium">{selectedReader.notes || <span className="text-blue-300 italic">None</span>}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => { setViewDialogOpen(false); setSelectedReader(null); }}>Close</Button>
            <Button onClick={() => { if (selectedReader) { setModalReader(selectedReader); setModalOpen(true); setViewDialogOpen(false); } }}>Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={open => { if (!open) { setDeleteDialogOpen(false); setReaderToDelete(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete RFID Reader</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the RFID reader "{readerToDelete?.deviceName || readerToDelete?.deviceId}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setReaderToDelete(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteReader}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={open => { if (!open) { setBulkDeleteDialogOpen(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected RFID Readers</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedReaderIds.length} selected RFID reader(s)? This action cannot be undone.
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

      {/* Bulk Status Update Confirmation Dialog */}
      <Dialog open={confirmBulkStatus} onOpenChange={open => { if (!open) { setConfirmBulkStatus(false); setPendingBulkStatus(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status for Selected Readers</DialogTitle>
            <DialogDescription>
              Are you sure you want to set the status to "{pendingBulkStatus}" for {selectedReaderIds.length} selected RFID reader(s)?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmBulkStatus(false); setPendingBulkStatus(""); }} disabled={submitting}>Cancel</Button>
            <Button variant="default" onClick={handleBulkStatusUpdate} disabled={submitting}>
              {submitting ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ARIA live region for screen reader announcements */}
      <div
        ref={ariaLiveRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {ariaAnnouncement}
      </div>

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

// Add AuditLog component at the end of the file
const AuditLog = ({ readerId }: { readerId: number }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [eventType, setEventType] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [view, setView] = useState<'table' | 'timeline'>('table');

  useEffect(() => {
    fetch(`/api/rfid/readers/${readerId}/logs`)
      .then(res => res.json())
      .then(data => {
        setLogs(Array.isArray(data) ? data : []);
      })
  }, [readerId]);

  // Filtering
  const filteredLogs = logs.filter(log => {
    const matchesEvent = eventType === 'all' || log.eventType === eventType;
    const matchesSeverity = severity === 'all' || log.severity === severity;
    const logDate = log.timestamp ? new Date(log.timestamp) : null;
    const matchesFrom = !dateFrom || (logDate && logDate >= new Date(dateFrom));
    const matchesTo = !dateTo || (logDate && logDate <= new Date(dateTo));
    return matchesEvent && matchesSeverity && matchesFrom && matchesTo;
  });

  // Get unique event types and severities for filter dropdowns
  const eventTypes = Array.from(new Set(logs.map(l => l.eventType))).filter(Boolean);
  const severities = Array.from(new Set(logs.map(l => l.severity))).filter(Boolean);

  return (
    <div className="mt-8">
      <div className="font-semibold text-xs text-blue-700 mb-2">Audit/History Log</div>
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <select className="border rounded px-2 py-1 text-xs" value={eventType} onChange={e => setEventType(e.target.value)}>
          <option value="all">All Events</option>
          {eventTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <select className="border rounded px-2 py-1 text-xs" value={severity} onChange={e => setSeverity(e.target.value)}>
          <option value="all">All Severities</option>
          {severities.map(sev => <option key={sev} value={sev}>{sev}</option>)}
        </select>
        <input type="date" className="border rounded px-2 py-1 text-xs" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <input type="date" className="border rounded px-2 py-1 text-xs" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <button className={`text-xs px-2 py-1 rounded ${view === 'table' ? 'bg-blue-200' : 'bg-white border'}`} onClick={() => setView('table')}>Table</button>
        <button className={`text-xs px-2 py-1 rounded ${view === 'timeline' ? 'bg-blue-200' : 'bg-white border'}`} onClick={() => setView('timeline')}>Timeline</button>
      </div>
      {filteredLogs.length === 0 ? (
        <div className="text-blue-300 italic">No history found for this reader.</div>
      ) : view === 'table' ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border border-blue-100 rounded">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-2 py-2 text-left">Time</th>
                <th className="px-2 py-2 text-left">Event</th>
                <th className="px-2 py-2 text-left">Severity</th>
                <th className="px-2 py-2 text-left">User</th>
                <th className="px-2 py-2 text-left">Message</th>
                <th className="px-2 py-2 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => (
                <tr key={log.id || i} className="border-t border-blue-50">
                  <td className="px-2 py-2 whitespace-nowrap">{log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}</td>
                  <td className="px-2 py-2">{log.eventType}</td>
                  <td className="px-2 py-2">{log.severity}</td>
                  <td className="px-2 py-2">{log.userName || log.user || <span className="text-blue-300 italic">-</span>}</td>
                  <td className="px-2 py-2">{log.message || <span className="text-blue-300 italic">-</span>}</td>
                  <td className="px-2 py-2 whitespace-pre-wrap break-all">{log.details ? (typeof log.details === "string" ? log.details : JSON.stringify(log.details, null, 2)) : <span className="text-blue-300 italic">-</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col gap-4 border-l-2 border-blue-200 pl-4">
          {filteredLogs.map((log, i) => (
            <div key={log.id || i} className="relative">
              <div className="absolute -left-4 top-2 w-2 h-2 rounded-full bg-blue-400" />
              <div className="text-xs text-blue-700 font-semibold">{log.eventType} <span className="text-gray-400 font-normal">({log.severity})</span></div>
              <div className="text-xs text-gray-600">{log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"} {log.userName || log.user ? `by ${log.userName || log.user}` : ''}</div>
              <div className="text-xs text-gray-900 mt-1">{log.message || <span className="text-blue-300 italic">-</span>}</div>
              {log.details && <div className="text-xs text-gray-500 mt-1 whitespace-pre-wrap break-all">{typeof log.details === "string" ? log.details : JSON.stringify(log.details, null, 2)}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 