"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, RefreshCw, Info, Plus, CreditCard, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { z } from "zod";
import { toast } from "sonner";
import { TableHeaderSection } from "@/components/reusable/Table/TableHeaderSection";
import { TableCardView } from "@/components/reusable/Table/TableCardView";
import BulkActionsBar from "@/components/reusable/BulkActionsBar";
import { FilterDialog } from "@/components/FilterDialog";
import { SortDialog } from "@/components/reusable/Dialogs/SortDialog";
import { ExportDialog } from "@/components/reusable/Dialogs/ExportDialog";
import { PrintLayout } from "@/components/PrintLayout";
import { TableList, TableListColumn } from "@/components/reusable/Table/TableList";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/Pagination";
import { ViewDialog } from "@/components/reusable/Dialogs/ViewDialog";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import RFIDReaderFormDialog from "@/components/forms/RFIDReaderFormDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CompactPagination } from "@/components/Pagination";
import PageHeader from '@/components/PageHeader/PageHeader';

const readerSchema = z.object({
  id: z.number(),
  deviceId: z.string(),
  deviceName: z.string(),
  roomId: z.number().nullable(),
  ipAddress: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]),
  lastSeen: z.string(), // Using string for simplicity in mock data
});

type RFIDReader = z.infer<typeof readerSchema> & { hasRelatedEntities?: boolean };

// Mock data
// const initialReaders: RFIDReader[] = [
//   {
//     id: 1,
//     deviceId: "RD-001",
//     deviceName: "Main Entrance Reader",
//     roomId: 101,
//     ipAddress: "192.168.1.10",
//     status: "ACTIVE",
//     lastSeen: "2025-06-20T19:30:00.000Z",
//     hasRelatedEntities: true,
//   },
//   {
//     id: 2,
//     deviceId: "RD-002",
//     deviceName: "Lab 1 Reader",
//     roomId: 202,
//     ipAddress: "192.168.1.11",
//     status: "INACTIVE",
//     lastSeen: "2025-06-18T18:30:00.000Z",
//     hasRelatedEntities: false,
//   },
//   {
//     id: 3,
//     deviceId: "RD-003",
//     deviceName: "Library Reader",
//     roomId: null,
//     ipAddress: "192.168.1.12",
//     status: "MAINTENANCE",
//     lastSeen: "2025-06-13T17:30:00.000Z",
//   },
// ];

type SortField = 'deviceId' | 'deviceName' | 'status' | 'lastSeen';
type SortOrder = 'asc' | 'desc';

export default function RFIDReadersPage() {
  const [readers, setReaders] = useState<RFIDReader[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('deviceId');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedReader, setSelectedReader] = useState<RFIDReader | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [readerToDelete, setReaderToDelete] = useState<RFIDReader | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formType, setFormType] = useState<'create' | 'update'>('create');
  const [selectedReaderForForm, setSelectedReaderForForm] = useState<RFIDReader | undefined>();
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  // Update filters state to be arrays
  const [filters, setFilters] = useState<{ status: string[]; room: string[] }>({ status: [], room: [] });
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const exportableColumns = [
    { key: 'deviceId', label: 'Device ID' },
    { key: 'deviceName', label: 'Device Name' },
    { key: 'status', label: 'Status' },
    { key: 'roomId', label: 'Assigned Room ID' },
    { key: 'ipAddress', label: 'IP Address' },
    { key: 'lastSeen', label: 'Last Seen' },
  ];
  const [visibleColumns, setVisibleColumns] = useState<string[]>(exportableColumns.map(c => c.key));
  const [exportColumns, setExportColumns] = useState<string[]>(exportableColumns.map(c => c.key));
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchReaders = async () => {
    try {
      setLoading(true);
      // Construct query params based on state
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: itemsPerPage.toString(),
        search: searchTerm,
        sortBy: sortField,
        sortDir: sortOrder,
        status: filters.status.join(','),
        room: filters.room.join(','),
      });
      const response = await fetch(`/api/rfid/readers?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch RFID readers');
      }
      const { data, total } = await response.json();
      setReaders(data);
      // Note: We might need to set total pages here if the API provides it
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching readers:', error);
      toast.error('Failed to fetch RFID readers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReaders();
  }, [currentPage, itemsPerPage, searchTerm, sortField, sortOrder, filters]);

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedReaders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedReaders.map(r => r.id.toString()));
    }
  };

  // Update filteredReaders to use new filters
  const filteredReaders = useMemo(() => {
    return readers.filter(reader => {
      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(reader.status)) return false;
      // Room filter
      if (filters.room.length > 0 && (!reader.roomId || !filters.room.includes(String(reader.roomId)))) return false;
      // Search
      if (
        searchTerm &&
        !reader.deviceId.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !reader.deviceName.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [readers, filters, searchTerm]);

  const sortedReaders = useMemo(() => {
    return [...filteredReaders].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }, [filteredReaders, sortField, sortOrder]);

  const paginatedReaders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedReaders.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedReaders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedReaders.length / itemsPerPage);
  
  const getStatusBadge = (status: "ACTIVE" | "INACTIVE" | "MAINTENANCE") => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="default" className="bg-green-500 text-white">Active</Badge>;
      case "INACTIVE":
        return <Badge variant="secondary">Inactive</Badge>;
      case "MAINTENANCE":
        return <Badge variant="destructive">Maintenance</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const columns: TableListColumn<RFIDReader>[] = [
    {
      header: (
        <div className="flex justify-center items-center">
          <Checkbox
            checked={selectedIds.length > 0 && selectedIds.length === paginatedReaders.length}
            onCheckedChange={handleSelectAll}
            aria-label="Select all readers"
          />
        </div>
      ),
      accessor: 'select',
      className: 'w-12 text-center',
    },
    { header: "Device ID", accessor: "deviceId" },
    { header: "Device Name", accessor: "deviceName" },
    { header: "Status", accessor: "status", render: (item) => getStatusBadge(item.status) },
    { header: "Assigned Room", accessor: "roomId", render: (item) => item.roomId || "N/A" },
    { header: "IP Address", accessor: "ipAddress" },
    { header: "Last Seen", accessor: "lastSeen", render: (item) => isClient ? new Date(item.lastSeen).toLocaleString() : '...' },
    {
      header: "Actions",
      accessor: "actions",
      className: "text-center",
      render: (item) => (
        <div className="flex gap-2 justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="View details" onClick={() => { setSelectedReader(item); setViewDialogOpen(true); }}>
                  <Eye className="h-4 w-4 text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Edit reader" onClick={() => { setFormType('update'); setSelectedReaderForForm(item); setFormDialogOpen(true); }}>
                  <Pencil className="h-4 w-4 text-green-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button variant="ghost" size="icon" aria-label="Delete reader" onClick={() => { setReaderToDelete(item); setDeleteDialogOpen(true); }} disabled={!!item.hasRelatedEntities}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{item.hasRelatedEntities ? "Cannot delete reader with assigned entities." : "Delete reader"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
    },
  ];

  const handleRefresh = () => {
    fetchReaders();
  };
  
  const handleBulkDelete = async () => {
    toast.info("Bulk delete functionality not yet implemented.");
    console.log("Deleting:", selectedIds);
  }

  const handleExport = async () => {
    if (!exportFormat) {
      toast.error("Please select an export format");
      return;
    }
    const selectedColumnsData = exportableColumns.filter(col => exportColumns.includes(col.key));
    const headers = selectedColumnsData.map(col => col.label);
    const rows = readers.map(reader => selectedColumnsData.map(col => String(reader[col.key as keyof RFIDReader] ?? '')));

    try {
      if (exportFormat === 'pdf') {
        const doc = new jsPDF();
        doc.text("RFID Readers", 14, 16);
        autoTable(doc, { head: [headers], body: rows, startY: 20 });
        doc.save('rfid-readers.pdf');
      } else if (exportFormat === 'excel') {
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "RFID Readers");
        XLSX.writeFile(wb, "rfid-readers.xlsx");
      } else if (exportFormat === 'csv') {
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "rfid-readers.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      toast.success(`Successfully exported to ${exportFormat.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export data.");
    } finally {
      setExportDialogOpen(false);
    }
  };

  const bulkActions = [
    {
      key: "delete",
      label: "Delete",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      onClick: handleBulkDelete,
      variant: "destructive" as const,
    },
  ];

  // Analytics summary
  const summary = useMemo(() => {
    const total = filteredReaders.length;
    const online = filteredReaders.filter(r => r.status === "ACTIVE").length;
    const offline = filteredReaders.filter(r => r.status === "INACTIVE").length;
    const maintenance = filteredReaders.filter(r => r.status === "MAINTENANCE").length;
    return { total, online, offline, maintenance };
  }, [filteredReaders]);

  // Build filterSections for FilterDialog
  const filterSections = [
    {
      key: "status",
      title: "Status",
      options: [
        { value: "ACTIVE", label: "Active", count: readers.filter(r => r.status === "ACTIVE").length },
        { value: "INACTIVE", label: "Inactive", count: readers.filter(r => r.status === "INACTIVE").length },
        { value: "MAINTENANCE", label: "Maintenance", count: readers.filter(r => r.status === "MAINTENANCE").length },
      ],
    },
    {
      key: "room",
      title: "Room ID",
      options: Array.from(new Set(readers.map(r => r.roomId).filter(Boolean))).map(roomId => ({
        value: String(roomId),
        label: `Room ${roomId}`,
        count: readers.filter(r => String(r.roomId) === String(roomId)).length,
      })),
    },
  ];

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <PageHeader
          title="RFID Readers"
          subtitle="Manage all RFID reader devices in the system."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'RFID Management', href: '/rfid' },
            { label: 'Readers' }
          ]}
        />

        {/* Sticky Top Bar */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-blue-100 pb-2 mb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pt-2">
            <div className="flex items-center gap-3 text-sm text-muted-foreground" aria-live="polite">
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              <Button onClick={handleRefresh} variant="outline" size="sm" aria-label="Refresh readers" disabled={loading} className="gap-2">
                <RefreshCw className={loading ? "animate-spin" : ""} />
                Refresh
              </Button>
            </div>
            <Button onClick={() => { setFormType('create'); setFormDialogOpen(true); setSelectedReaderForForm(undefined); }} size="sm" className="gap-2" aria-label="Add new reader">
              <Plus className="h-4 w-4" />
              Add Reader
            </Button>
          </div>
        </div>

        {/* Analytics Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-4">
            <CreditCard className="h-6 w-6 text-blue-500" aria-label="Total Readers" />
            <span className="font-semibold text-blue-900">{summary.total}</span>
            <span className="text-sm text-blue-700">Total</span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 rounded-lg p-4">
            <Wifi className="h-6 w-6 text-green-500" aria-label="Online Readers" />
            <span className="font-semibold text-green-900">{summary.online}</span>
            <span className="text-sm text-green-700">Online</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-4">
            <WifiOff className="h-6 w-6 text-gray-500" aria-label="Offline Readers" />
            <span className="font-semibold text-gray-900">{summary.offline}</span>
            <span className="text-sm text-gray-700">Offline</span>
          </div>
          <div className="flex items-center gap-2 bg-yellow-50 rounded-lg p-4">
            <AlertTriangle className="h-6 w-6 text-yellow-500" aria-label="Maintenance Readers" />
            <span className="font-semibold text-yellow-900">{summary.maintenance}</span>
            <span className="text-sm text-yellow-700">Maintenance</span>
          </div>
        </div>

        {/* Table/List Section with divider */}
        <div className="bg-white rounded-xl shadow border border-border overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden xl:block">
            {loading ? (
              <div className="p-8">
                <Skeleton className="h-8 w-full mb-4" />
                <Skeleton className="h-8 w-full mb-4" />
                <Skeleton className="h-8 w-full mb-4" />
                <Skeleton className="h-8 w-full mb-4" />
              </div>
            ) : paginatedReaders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <CreditCard className="h-12 w-12 text-blue-200 mb-4" />
                <div className="font-semibold text-lg text-blue-700 mb-2">No RFID Readers Found</div>
                <div className="text-sm text-muted-foreground mb-4">Get started by adding your first reader.</div>
                <Button onClick={() => { setFormType('create'); setFormDialogOpen(true); setSelectedReaderForForm(undefined); }} size="sm" className="gap-2" aria-label="Add new reader">
                  <Plus className="h-4 w-4" />
                  Add Reader
                </Button>
              </div>
            ) : (
              <TableList
                columns={columns}
                data={paginatedReaders.filter(r => r && r.id !== undefined)}
                loading={loading}
                selectedIds={selectedIds}
                onSelectRow={handleSelectRow}
                onSelectAll={handleSelectAll}
                isAllSelected={selectedIds.length === paginatedReaders.length && paginatedReaders.length > 0}
                isIndeterminate={selectedIds.length > 0 && selectedIds.length < paginatedReaders.length}
                getItemId={(row: RFIDReader) => (row && row.id !== undefined ? row.id.toString() : "")}
                className="transition-all duration-150 [&_tr:hover]:bg-blue-50 [&_tr.selected]:bg-blue-100"
              />
            )}
          </div>
          {/* Mobile Card View */}
          <div className="block xl:hidden">
            {loading ? (
              <div className="p-8">
                <Skeleton className="h-8 w-full mb-4" />
                <Skeleton className="h-8 w-full mb-4" />
                <Skeleton className="h-8 w-full mb-4" />
                <Skeleton className="h-8 w-full mb-4" />
              </div>
            ) : paginatedReaders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <CreditCard className="h-12 w-12 text-blue-200 mb-4" />
                <div className="font-semibold text-lg text-blue-700 mb-2">No RFID Readers Found</div>
                <div className="text-sm text-muted-foreground mb-4">Get started by adding your first reader.</div>
                <Button onClick={() => { setFormType('create'); setFormDialogOpen(true); setSelectedReaderForForm(undefined); }} size="sm" className="gap-2" aria-label="Add new reader">
                  <Plus className="h-4 w-4" />
                  Add Reader
                </Button>
              </div>
            ) : (
              <TableCardView
                items={paginatedReaders.filter(r => r && r.id !== undefined)}
                selectedIds={selectedIds}
                onSelect={handleSelectRow}
                onView={(item) => {
                  setSelectedReader(item);
                  setViewDialogOpen(true);
                }}
                onEdit={(item) => {
                  setFormType('update');
                  setSelectedReaderForForm(item);
                  setFormDialogOpen(true);
                }}
                onDelete={(item) => {
                  setReaderToDelete(item);
                  setDeleteDialogOpen(true);
                }}
                getItemId={(item: RFIDReader) => (item && item.id !== undefined ? item.id.toString() : "")}
                getItemName={(item) => item.deviceName}
                getItemCode={(item) => item.deviceId}
                getItemStatus={(item) => item.status === 'ACTIVE' ? 'active' : 'inactive'}
                getItemDetails={(item) => [
                  { label: 'IP Address', value: item.ipAddress },
                  { label: 'Room ID', value: item.roomId || 'N/A' },
                  { label: 'Last Seen', value: isClient ? new Date(item.lastSeen).toLocaleString() : '...' },
                ]}
                isLoading={loading}
                deleteTooltip={(item) => item.hasRelatedEntities ? "Cannot delete reader with assigned entities." : "Delete reader"}
              />
            )}
            {/* Compact Pagination for mobile */}
            <CompactPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <BulkActionsBar
            selectedCount={selectedIds.length}
            actions={bulkActions}
            onClear={() => setSelectedIds([])}
            entityLabel="reader"
          />
        )}

        {/* Pagination for desktop */}
        <div className="hidden xl:block">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredReaders.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* View Dialog */}
        {selectedReader && (
          <ViewDialog
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
            title="Reader Details"
            subtitle={`Details for ${selectedReader.deviceName}`}
            sections={[
              {
                title: "Device Information",
                columns: 2,
                fields: [
                  { label: "Device ID", value: selectedReader.deviceId },
                  { label: "Device Name", value: selectedReader.deviceName },
                  { label: "IP Address", value: selectedReader.ipAddress },
                  { label: "Status", value: selectedReader.status, type: 'badge', badgeVariant: selectedReader.status === 'ACTIVE' ? 'success' : selectedReader.status === 'INACTIVE' ? 'secondary' : 'destructive' },
                  { label: "Assigned Room ID", value: selectedReader.roomId ?? "N/A" },
                  { label: "Last Seen", value: isClient ? new Date(selectedReader.lastSeen).toLocaleString() : '...', type: 'date' },
                ]
              }
            ]}
          />
        )}

        {/* Delete Dialog */}
        {readerToDelete && (
          <ConfirmDeleteDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onDelete={() => {
              toast.info("Delete functionality not yet implemented.");
              setDeleteDialogOpen(false);
            }}
            itemName={readerToDelete.deviceName}
          />
        )}

        {/* Add/Edit Dialog */}
        <RFIDReaderFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          type={formType}
          data={selectedReaderForForm}
          id={selectedReaderForForm?.id}
          onSuccess={(newReader) => {
            if (formType === 'create') {
              setReaders(prev => [...prev, newReader as RFIDReader]);
            } else {
              setReaders(prev => prev.map(r => r.id === (newReader as RFIDReader).id ? (newReader as RFIDReader) : r));
            }
            fetchReaders(); // to get the latest data
          }}
        />

        {/* Filter Dialog */}
        <FilterDialog
          filters={filters}
          filterSections={filterSections}
          onApplyFilters={(newFilters) => setFilters({ status: newFilters.status ?? [], room: newFilters.room ?? [] })}
          onClearFilters={() => setFilters({ status: [], room: [] })}
        />

        {/* Sort Dialog */}
        <SortDialog
          open={sortDialogOpen}
          onOpenChange={setSortDialogOpen}
          sortField={sortField}
          setSortField={setSortField as any}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          sortFieldOptions={[
            { value: 'deviceId', label: 'Device ID' },
            { value: 'deviceName', label: 'Device Name' },
            { value: 'status', label: 'Status' },
            { value: 'lastSeen', label: 'Last Seen' },
          ]}
          onApply={() => setSortDialogOpen(false)}
          onReset={() => {
            setSortField('deviceId');
            setSortOrder('asc');
          }}
          title="Sort Readers"
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
          title="Export RFID Readers"
          tooltip="Export the current list of readers."
        />
      </div>
    </TooltipProvider>
  );
} 