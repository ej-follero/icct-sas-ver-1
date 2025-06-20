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
import RoomFormDialog from "@/components/forms/RoomFormDialog";
import { ViewDialog } from "@/components/ViewDialog";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

// Define the room schema
const roomSchema = z.object({
  roomId: z.number(),
  roomNo: z.string().min(1, "Room number is required"),
  roomType: z.enum(["CLASSROOM", "LABORATORY", "OFFICE", "CONFERENCE"]),
  roomCapacity: z.number().min(1, "Room capacity must be at least 1"),
  roomBuildingLoc: z.string().min(1, "Building location is required"),
  roomFloorLoc: z.string().min(1, "Floor location is required"),
  readerId: z.string().min(1, "RFID reader ID is required"),
});

type Room = z.infer<typeof roomSchema> & { hasRelatedEntities?: boolean };

// Update the form schema to match the form fields
const roomFormSchema = z.object({
  roomNo: z.string().min(1, "Room number is required"),
  roomType: z.enum(["CLASSROOM", "LABORATORY", "OFFICE", "CONFERENCE"]),
  roomCapacity: z.number().min(1, "Room capacity must be at least 1"),
  roomBuildingLoc: z.string().min(1, "Building location is required"),
  roomFloorLoc: z.string().min(1, "Floor location is required"),
  readerId: z.string().min(1, "RFID reader ID is required"),
});

type RoomFormData = z.infer<typeof roomFormSchema>;

// Mock data - replace with actual API calls later
const initialRooms: Room[] = [
  {
    roomId: 1,
    roomNo: "101",
    roomType: "CLASSROOM",
    roomCapacity: 40,
    roomBuildingLoc: "Main Building",
    roomFloorLoc: "1st Floor",
    readerId: "RFID001",
    hasRelatedEntities: true,
  },
  {
    roomId: 2,
    roomNo: "202",
    roomType: "LABORATORY",
    roomCapacity: 30,
    roomBuildingLoc: "Science Wing",
    roomFloorLoc: "2nd Floor",
    readerId: "RFID002",
    hasRelatedEntities: false,
  },
];

type SortField = 'roomNo' | 'roomType' | 'roomCapacity' | 'roomBuildingLoc' | 'roomFloorLoc';
type SortOrder = 'asc' | 'desc';

export default function RoomsPage() {
  const [rooms, setRooms] = useState(initialRooms);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('roomNo');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    building: "all",
    floor: "all",
  });

  // Export state
  const exportableColumns = [
    { key: 'roomNo', label: 'Room Number' },
    { key: 'roomType', label: 'Type' },
    { key: 'roomCapacity', label: 'Capacity' },
    { key: 'roomBuildingLoc', label: 'Building' },
    { key: 'roomFloorLoc', label: 'Floor' },
    { key: 'readerId', label: 'RFID Reader' },
  ];
  const [exportColumns, setExportColumns] = useState<string[]>(exportableColumns.map(col => col.key));
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | null>(null);

  // Memoized filtered and sorted rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = room.roomNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          room.roomBuildingLoc.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filters.type === "all" || room.roomType === filters.type;
      const matchesBuilding = filters.building === "all" || room.roomBuildingLoc === filters.building;
      const matchesFloor = filters.floor === "all" || room.roomFloorLoc === filters.floor;
      
      return matchesSearch && matchesType && matchesBuilding && matchesFloor;
    });
  }, [rooms, searchTerm, filters]);

  const sortedRooms = useMemo(() => {
    return [...filteredRooms].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }, [filteredRooms, sortField, sortOrder]);

  const paginatedRooms = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedRooms.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedRooms, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedRooms.length / itemsPerPage);

  // Table columns
  const columns: TableListColumn<Room>[] = [
    {
      header: (
        <div className="flex justify-center items-center">
          <Checkbox
            checked={selectedIds.length === paginatedRooms.length}
            onCheckedChange={(checked: boolean) => {
              if (checked) {
                setSelectedIds(paginatedRooms.map(room => room.roomId.toString()));
              } else {
                setSelectedIds([]);
              }
            }}
          />
        </div>
      ),
      accessor: 'select',
      className: 'w-12 text-center',
    },
    { header: "Room Info", accessor: "roomNo", className: "text-blue-900 align-middle" },
    { header: "Type", accessor: "roomType", className: "text-blue-800 align-middle" },
    { header: "Capacity", accessor: "roomCapacity", className: "text-blue-800 text-center align-middle" },
    { header: "Building", accessor: "roomBuildingLoc", className: "text-blue-800 align-middle" },
    { header: "Floor", accessor: "roomFloorLoc", className: "text-blue-800 align-middle" },
    { header: "RFID Reader", accessor: "readerId", className: "text-blue-800 align-middle" },
    {
      header: "Actions",
      accessor: "actions",
      className: "text-center align-middle",
      render: (item) => (
        <div className="flex gap-2 justify-center">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedRoom(item); setViewDialogOpen(true); }}>
            <Eye className="h-4 w-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { setRoomFormType('update'); setRoomFormData(item); setRoomFormDialogOpen(true); }}>
            <Pencil className="h-4 w-4 text-green-600" />
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button variant="ghost" size="icon" onClick={() => { setRoomToDelete(item); setDeleteDialogOpen(true); }} disabled={!!item.hasRelatedEntities}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{getDeleteTooltip(item)}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
    },
  ];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setSortDialogOpen(false);
  };
  // Unified export handler
  const handleExport = async () => {
    if (!exportFormat) {
      toast.error("Please select an export format");
      return;
    }
    const selectedColumns = exportableColumns.filter(col => exportColumns.includes(col.key));
    const headers = selectedColumns.map(col => col.label);
    const rows = filteredRooms.map(room => selectedColumns.map(col => String(room[col.key as keyof Room] ?? '')));
    try {
      switch (exportFormat) {
        case 'pdf': {
          const doc = new jsPDF();
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(12, 37, 86);
          doc.text('Rooms List', doc.internal.pageSize.width / 2, 20, { align: 'center' });
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(128, 128, 128);
          const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          doc.text(`Generated on ${currentDate}`, doc.internal.pageSize.width / 2, 28, { align: 'center' });
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(12);
          autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 35,
            styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', cellWidth: 'wrap' },
            headStyles: { fillColor: [12, 37, 86], textColor: [255, 255, 255], halign: 'center', fontStyle: 'bold' },
            margin: { top: 16, right: 10, bottom: 10, left: 10 },
            theme: 'grid',
          });
          doc.save('rooms.pdf');
          break;
        }
        case 'excel': {
          const wsData = [headers, ...rows];
          const ws = XLSX.utils.aoa_to_sheet(wsData);
          const colWidths = headers.map((_, idx) => {
            const maxLength = Math.max(...wsData.map(row => (row[idx] || '').toString().length), headers[idx].length);
            return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
          });
          ws['!cols'] = colWidths;
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Rooms');
          XLSX.writeFile(wb, 'rooms.xlsx');
          break;
        }
        case 'csv': {
          const csvRows = [headers, ...rows];
          const csvContent = csvRows.map(row => row.map(cell => '"' + cell.replace(/"/g, '""') + '"').join(",")).join("\n");
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'rooms.csv';
          a.click();
          URL.revokeObjectURL(url);
          break;
        }
      }
      toast.success(`Successfully exported rooms to ${exportFormat.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export rooms');
    }
  };

  // Print handler using PrintLayout
  const printColumns = exportableColumns.map(col => ({ header: col.label, accessor: col.key }));
  const handlePrint = () => {
    const printData = filteredRooms.map(room => ({ ...room }));
    const printFunction = PrintLayout({
      title: 'Rooms List',
      data: printData,
      columns: printColumns,
      totalItems: filteredRooms.length,
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
      building: "all",
      floor: "all",
    });
  };

  // Fetch rooms on component mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/rooms');
        if (!response.ok) {
          throw new Error('Failed to fetch rooms');
        }
        const data = await response.json();
        setRooms(data);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        toast.error('Failed to fetch rooms');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  // Update refreshRooms function
  const refreshRooms = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/rooms');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setRooms(data);
      toast.success('Rooms refreshed successfully');
    } catch (err) {
      console.error('Error refreshing rooms:', err);
      toast.error('Failed to refresh rooms. Please try again later.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      const promises = selectedIds.map(id => 
        fetch(`/api/rooms/${id}`, { method: 'DELETE' })
      );
      await Promise.all(promises);
      setRooms(rooms.filter(room => !selectedIds.includes(room.roomId.toString())));
      setSelectedIds([]);
      toast.success('Selected rooms deleted successfully');
    } catch (error) {
      console.error('Error deleting rooms:', error);
      toast.error('Failed to delete some rooms');
    }
  };

  // Update handleDeleteRoom function
  async function handleDeleteRoom(id: number) {
    try {
      const response = await fetch(`/api/rooms/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete room");
      }

      setRooms(rooms.filter(room => room.roomId !== id));
      toast.success("Room deleted successfully");
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Failed to delete room");
    }
  }

  const [roomFormDialogOpen, setRoomFormDialogOpen] = useState(false);
  const [roomFormType, setRoomFormType] = useState<'create' | 'update'>('create');
  const [roomFormData, setRoomFormData] = useState<Room | undefined>();

  // Helper for delete tooltip
  function getDeleteTooltip(room: Room) {
    if (room.hasRelatedEntities) return "Cannot delete: Room has related schedules, assignments, or other dependencies.";
    return "Delete";
  }

  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-xl border border-blue-100 flex-1 m-4 mt-0">
      {/* Header */}
      <TableHeaderSection
        title="All Rooms"
        description="Manage and view all room information"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={refreshRooms}
        isRefreshing={isRefreshing}
        onFilterClick={() => setFilterDialogOpen(true)}
        onSortClick={() => setSortDialogOpen(true)}
        onExportClick={() => setExportDialogOpen(true)}
        onPrintClick={handlePrint}
        onAddClick={() => {
          setRoomFormType('create');
          setRoomFormData(undefined);
          setRoomFormDialogOpen(true);
        }}
        activeFilterCount={Object.values(filters).filter(f => f !== "all").length}
        searchPlaceholder="Search rooms..."
        addButtonLabel="Add Room"
      />

      {/* Table layout for xl+ only */}
      <div className="hidden xl:block">
        <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white/70 shadow-md relative">
          {isRefreshing && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            </div>
          )}
          <TableList
            columns={columns}
            data={paginatedRooms}
            loading={loading}
            selectedIds={selectedIds}
            onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onSelectAll={() => {
              if (selectedIds.length === paginatedRooms.length) {
                setSelectedIds([]);
              } else {
                setSelectedIds(paginatedRooms.map(room => room.roomId.toString()));
              }
            }}
            isAllSelected={selectedIds.length === paginatedRooms.length}
            isIndeterminate={selectedIds.length > 0 && selectedIds.length < paginatedRooms.length}
            getItemId={(item) => item.roomId.toString()}
          />
        </div>
      </div>

      {/* Card layout for small screens */}
      <div className="block xl:hidden">
        <TableCardView
          items={paginatedRooms}
          selectedIds={selectedIds}
          onSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          onView={(item) => {
            setSelectedRoom(item);
            setViewDialogOpen(true);
          }}
          onEdit={(item) => {
            setRoomFormType('update');
            setRoomFormData(item);
            setRoomFormDialogOpen(true);
          }}
          onDelete={(item) => {
            setRoomToDelete(item);
            setDeleteDialogOpen(true);
          }}
          getItemId={(item) => item.roomId.toString()}
          getItemName={(item) => item.roomNo}
          getItemCode={(item) => item.roomType}
          getItemStatus={(item) => item.roomType === 'CLASSROOM' ? 'active' : 'inactive'}
          getItemDescription={(item) => item.roomBuildingLoc}
          getItemDetails={(item) => [
            { label: 'Capacity', value: item.roomCapacity },
            { label: 'Building', value: item.roomBuildingLoc },
            { label: 'Floor', value: item.roomFloorLoc },
            { label: 'RFID Reader', value: item.readerId },
          ]}
          isLoading={loading}
        />
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.length}
          entityLabel="room"
          actions={[
            {
              key: 'delete',
              label: 'Delete Selected',
              icon: loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />,
              onClick: handleBulkDelete,
              loading: loading,
              disabled: loading,
              tooltip: 'Delete selected rooms',
              variant: 'destructive',
            },
          ]}
          onClear={() => setSelectedIds([])}
          className="mt-4 mb-2"
        />
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
      <FilterDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        statusFilter={filters.type}
        setStatusFilter={(value) => setFilters(prev => ({ ...prev, type: value }))}
        statusOptions={[
          { value: 'all', label: 'All' },
          { value: 'CLASSROOM', label: 'Classroom' },
          { value: 'LABORATORY', label: 'Laboratory' },
          { value: 'OFFICE', label: 'Office' },
          { value: 'CONFERENCE', label: 'Conference Room' },
        ]}
        advancedFilters={{
          building: filters.building,
          floor: filters.floor,
        }}
        setAdvancedFilters={(filters) => setFilters(prev => ({ ...prev, ...filters }))}
        fields={[
          { key: 'building', label: 'Building', type: 'text', badgeType: 'active' },
          { key: 'floor', label: 'Floor', type: 'text', badgeType: 'active' },
        ]}
        onReset={handleResetFilters}
        onApply={handleApplyFilters}
        activeAdvancedCount={Object.values(filters).filter(f => f !== "all").length}
        title="Filter Rooms"
        tooltip="Filter rooms by multiple criteria. Use advanced filters for more specific conditions."
      />

      {/* Sort Dialog */}
      <SortDialog
        open={sortDialogOpen}
        onOpenChange={setSortDialogOpen}
        sortField={sortField}
        setSortField={setSortField}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        sortFieldOptions={[
          { value: 'roomNo', label: 'Room Number' },
          { value: 'roomType', label: 'Type' },
          { value: 'roomCapacity', label: 'Capacity' },
          { value: 'roomBuildingLoc', label: 'Building' },
          { value: 'roomFloorLoc', label: 'Floor' },
        ]}
        onApply={() => setSortDialogOpen(false)}
        onReset={() => {
          setSortField('roomNo');
          setSortOrder('asc');
        }}
        title="Sort Rooms"
        tooltip="Sort rooms by different fields. Choose the field and order to organize your list."
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
        title="Export Rooms"
        tooltip="Export room data in various formats. Choose your preferred export options."
      />

      {/* View Dialog */}
      <ViewDialog
        open={viewDialogOpen}
        onOpenChange={open => { if (!open) { setViewDialogOpen(false); setSelectedRoom(null); } }}
        title={selectedRoom ? `Room: ${selectedRoom.roomNo}` : "Room Details"}
        status={selectedRoom ? {
          value: selectedRoom.roomType,
          variant: selectedRoom.roomType === 'CLASSROOM' ? 'success' : selectedRoom.roomType === 'LABORATORY' ? 'warning' : 'secondary',
        } : undefined}
        sections={selectedRoom ? [
          {
            title: "Room Information",
            columns: 2,
            fields: [
              { label: "Room Number", value: selectedRoom.roomNo },
              { label: "Type", value: selectedRoom.roomType },
              { label: "Capacity", value: selectedRoom.roomCapacity, type: 'number' },
              { label: "Building", value: selectedRoom.roomBuildingLoc },
              { label: "Floor", value: selectedRoom.roomFloorLoc },
              { label: "RFID Reader", value: selectedRoom.readerId },
            ],
          },
        ] : []}
        isLoading={false}
        actions={[]}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={open => { if (!open) { setDeleteDialogOpen(false); setRoomToDelete(null); } }}
        itemName={roomToDelete?.roomNo}
        onDelete={() => { if (roomToDelete) { handleDeleteRoom(roomToDelete.roomId); } }}
        onCancel={() => { setDeleteDialogOpen(false); setRoomToDelete(null); }}
        canDelete={roomToDelete ? !roomToDelete.hasRelatedEntities : true}
        description={roomToDelete && roomToDelete.hasRelatedEntities ? getDeleteTooltip(roomToDelete) : undefined}
        loading={loading}
      />

      {/* Room Form Dialog */}
      <RoomFormDialog
        open={roomFormDialogOpen}
        onOpenChange={setRoomFormDialogOpen}
        type={roomFormType}
        data={roomFormData}
        id={roomFormData?.roomId}
        onSuccess={async (formData) => {
          try {
            const url = roomFormType === 'update' ? `/api/rooms/${roomFormData?.roomId}` : '/api/rooms';
            const method = roomFormType === 'update' ? 'PUT' : 'POST';
            const response = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData),
            });
            if (!response.ok) throw new Error('Failed to save room');
            const result = await response.json();
            if (roomFormType === 'update') {
              setRooms(rooms.map(room => room.roomId === roomFormData?.roomId ? result : room));
            } else {
              setRooms([...rooms, result]);
            }
            setRoomFormDialogOpen(false);
          } catch (error) {
            toast.error('Failed to save room');
          }
        }}
      />
    </div>
  );
} 