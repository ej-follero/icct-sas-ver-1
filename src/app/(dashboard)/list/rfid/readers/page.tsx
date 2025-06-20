"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { z } from "zod";
import { toast } from "sonner";
import { TableHeaderSection } from "@/components/TableHeaderSection";
import { TableCardView } from "@/components/TableCardView";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { FilterDialog } from "@/components/FilterDialog";
import { SortDialog } from "@/components/SortDialog";
import { ExportDialog } from "@/components/ExportDialog";
import { PrintLayout } from "@/components/PrintLayout";
import { TableList, TableListColumn } from "@/components/TableList";
import { Checkbox } from "@/components/ui/checkbox";
import Pagination from "@/components/Pagination";
import { ViewDialog } from "@/components/ViewDialog";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import RFIDReaderFormDialog from "@/components/forms/RFIDReaderFormDialog";

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
  const [filters, setFilters] = useState({ status: "all", room: "" });
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
        status: filters.status,
        room: filters.room,
      });
      const response = await fetch(`/api/rfid/readers?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch RFID readers');
      }
      const { data, total } = await response.json();
      setReaders(data);
      // Note: We might need to set total pages here if the API provides it
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

  const filteredReaders = useMemo(() => {
    return readers.filter(reader => 
      reader.deviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reader.deviceName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [readers, searchTerm]);

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
          <Button variant="ghost" size="icon" onClick={() => { setSelectedReader(item); setViewDialogOpen(true); }}>
            <Eye className="h-4 w-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { setFormType('update'); setSelectedReaderForForm(item); setFormDialogOpen(true); }}>
            <Pencil className="h-4 w-4 text-green-600" />
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button variant="ghost" size="icon" onClick={() => { setReaderToDelete(item); setDeleteDialogOpen(true); }} disabled={!!item.hasRelatedEntities}>
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

  // TODO: Add other handlers (delete, export, etc.)

  return (
    <div className="flex flex-col h-full">
      <TableHeaderSection
        title="RFID Readers"
        description="Manage all RFID reader devices in the system."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onAddClick={() => { setFormType('create'); setSelectedReaderForForm(undefined); setFormDialogOpen(true); }}
        onFilterClick={() => setFilterDialogOpen(true)}
        onSortClick={() => setSortDialogOpen(true)}
        onExportClick={() => setExportDialogOpen(true)}
        onPrintClick={() => toast.info("Print not implemented yet.")}
        columnOptions={exportableColumns.map(col => ({ accessor: col.key, label: col.label }))}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
      />
      
      {selectedIds.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.length}
          actions={bulkActions}
          onClear={() => setSelectedIds([])}
          entityLabel="reader"
        />
      )}

      <div className="hidden xl:block flex-grow overflow-auto">
        <TableList
          columns={columns}
          data={paginatedReaders}
          loading={loading}
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          isAllSelected={selectedIds.length === paginatedReaders.length && paginatedReaders.length > 0}
          isIndeterminate={selectedIds.length > 0 && selectedIds.length < paginatedReaders.length}
          getItemId={(row: RFIDReader) => row.id.toString()}
        />
      </div>

      <div className="block xl:hidden">
        <TableCardView
          items={paginatedReaders}
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
          getItemId={(item) => item.id.toString()}
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
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

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

      {readerToDelete && (
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onDelete={() => {
            console.log("Deleting reader:", readerToDelete.id);
            toast.info("Delete functionality not yet implemented.");
            setDeleteDialogOpen(false);
          }}
          itemName={readerToDelete.deviceName}
        />
      )}

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

      <FilterDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        statusFilter={filters.status}
        setStatusFilter={(value) => setFilters(prev => ({ ...prev, status: value }))}
        statusOptions={[
          { value: 'all', label: 'All Statuses' },
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' },
          { value: 'MAINTENANCE', label: 'Maintenance' },
        ]}
        advancedFilters={{ room: filters.room }}
        setAdvancedFilters={(advFilters) => setFilters(prev => ({ ...prev, ...advFilters }))}
        fields={[
          { key: 'room', label: 'Room ID', type: 'text', badgeType: 'active' },
        ]}
        onApply={() => setFilterDialogOpen(false)}
        onReset={() => setFilters({ status: "all", room: "" })}
        title="Filter Readers"
      />

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
  );
} 