"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, SortAsc, FileDown, Printer, Eye, Pencil, Trash2, Building2, DoorOpen } from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";
import { z } from "zod";
import { toast } from "sonner";
import FormModal from "@/components/FormModal";

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

type Room = z.infer<typeof roomSchema>;

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
  },
  {
    roomId: 2,
    roomNo: "202",
    roomType: "LABORATORY",
    roomCapacity: 30,
    roomBuildingLoc: "Science Wing",
    roomFloorLoc: "2nd Floor",
    readerId: "RFID002",
  },
];

type SortField = 'roomNo' | 'roomType' | 'roomCapacity' | 'roomBuildingLoc' | 'roomFloorLoc';
type SortOrder = 'asc' | 'desc';

export default function RoomsPage() {
  const [rooms, setRooms] = useState(initialRooms);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortField, setSortField] = useState<SortField>('roomNo');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRoom, setModalRoom] = useState<Room | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    building: "all",
    floor: "all",
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState<null | HTMLElement>(null);

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

  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchorEl(null);
  };

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

  const handleExportToCSV = () => {
    const headers = ["Room No.", "Type", "Capacity", "Building", "Floor", "RFID Reader"];
    const csvContent = [
      headers.join(","),
      ...rooms.map(room => [
        room.roomNo,
        room.roomType,
        room.roomCapacity,
        room.roomBuildingLoc,
        room.roomFloorLoc,
        room.readerId
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "rooms.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToExcel = () => {
    const headers = ["Room No.", "Type", "Capacity", "Building", "Floor", "RFID Reader"];
    const rows = rooms.map(room => [
      room.roomNo,
      room.roomType,
      room.roomCapacity,
      room.roomBuildingLoc,
      room.roomFloorLoc,
      room.readerId
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rooms");
    
    XLSX.writeFile(workbook, "rooms.xlsx");
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Rooms List", 14, 15);
    
    const headers = ["Room No.", "Type", "Capacity", "Building", "Floor", "RFID Reader"];
    const rows = rooms.map(room => [
      room.roomNo,
      room.roomType,
      room.roomCapacity.toString(),
      room.roomBuildingLoc,
      room.roomFloorLoc,
      room.readerId
    ]);

    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save("rooms.pdf");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Rooms List</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .print-header { text-align: center; margin-bottom: 20px; }
              .print-header h1 { font-size: 24px; margin: 0; color: #1a1a1a; }
              .print-header p { font-size: 14px; color: #666; margin: 5px 0 0 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #f3f4f6; color: #374151; font-weight: 600; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; }
              td { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937; }
              .room-info { display: flex; align-items: center; gap: 12px; }
              .room-code { background-color: #2563eb; color: white; padding: 8px 12px; border-radius: 8px; font-weight: 600; }
              .room-name { font-weight: 500; }
              .room-code-text { font-size: 12px; color: #6b7280; }
              @media print {
                body { margin: 0; padding: 20px; }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
                thead { display: table-header-group; }
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1>Rooms List</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Room Info</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Building</th>
                  <th>Floor</th>
                  <th>RFID Reader</th>
                </tr>
              </thead>
              <tbody>
                ${rooms.map(room => `
                  <tr>
                    <td>
                      <div class="room-info">
                        <div class="room-code">${room.roomNo}</div>
                        <div>
                          <div class="room-name">${room.roomType}</div>
                          <div class="room-code-text">${room.roomBuildingLoc}</div>
                        </div>
                      </div>
                    </td>
                    <td>${room.roomType}</td>
                    <td>${room.roomCapacity}</td>
                    <td>${room.roomBuildingLoc}</td>
                    <td>${room.roomFloorLoc}</td>
                    <td>${room.readerId}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
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

  return (
    <div className="min-h-screen bg-background p-3">
      <Card>
        <CardContent>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">All Rooms</h1>
              <p className="text-muted-foreground text-sm">Manage and view all room information</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  className="pl-9"
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => setFilterDialogOpen(true)} className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
              <Button variant="outline" onClick={() => setSortDialogOpen(true)} className="flex items-center gap-2">
                <SortAsc className="h-4 w-4" />
                <span className="hidden sm:inline">Sort</span>
              </Button>
              <Button onClick={() => { setModalRoom(undefined); setModalOpen(true); }} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Room</span>
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border bg-white shadow">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-100/60">
                  <TableHead>Room Info</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Building</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>RFID Reader</TableHead>
                  <TableHead className="text-center w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRooms.map((item) => (
                  <TableRow key={item.roomId} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium">{item.roomNo}</div>
                      <div className="text-xs text-muted-foreground">{item.roomBuildingLoc}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.roomType === "CLASSROOM" ? "success" : item.roomType === "LABORATORY" ? "warning" : "info"}>{item.roomType}</Badge>
                    </TableCell>
                    <TableCell>{item.roomCapacity}</TableCell>
                    <TableCell>{item.roomBuildingLoc}</TableCell>
                    <TableCell>{item.roomFloorLoc}</TableCell>
                    <TableCell>
                      <Badge variant="info">{item.readerId}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setSelectedRoom(item); setViewDialogOpen(true); }}>
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setModalRoom(item); setModalOpen(true); }}>
                          <Pencil className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setRoomToDelete(item); setDeleteDialogOpen(true); }}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Export/Print and Pagination */}
          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedRooms.length)} of {sortedRooms.length} entries
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileDown className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportToCSV}>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportToExcel}>Export as Excel</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportToPDF}>Export as PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" className="flex items-center gap-2" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <div className="inline-flex items-center gap-2">
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
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={open => { if (!open) { setDeleteDialogOpen(false); setRoomToDelete(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Room</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the room "{roomToDelete?.roomNo}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setRoomToDelete(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => roomToDelete && handleDeleteRoom(roomToDelete.roomId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Form Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (data: RoomFormData) => {
          try {
            const url = modalRoom ? `/api/rooms/${modalRoom.roomId}` : "/api/rooms";
            const method = modalRoom ? "PUT" : "POST";
            const response = await fetch(url, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Failed to save room");

            if (modalRoom) {
              setRooms(rooms.map(room => 
                room.roomId === modalRoom.roomId ? { ...room, ...data } : room
              ));
              toast.success("Room updated successfully");
            } else {
              const newRoom = await response.json();
              setRooms([...rooms, newRoom]);
              toast.success("Room created successfully");
            }

            setModalOpen(false);
          } catch (error) {
            console.error("Error saving room:", error);
            toast.error("Failed to save room");
          }
        }}
        title={modalRoom ? "Edit Room" : "Add New Room"}
        submitLabel={modalRoom ? "Update" : "Add"}
        defaultValues={modalRoom}
        schema={roomFormSchema}
        fields={[
          {
            name: "roomNo",
            label: "Room Number",
            type: "text",
          },
          {
            name: "roomType",
            label: "Type",
            type: "select",
            options: [
              { value: "CLASSROOM", label: "Classroom" },
              { value: "LABORATORY", label: "Laboratory" },
              { value: "OFFICE", label: "Office" },
              { value: "CONFERENCE", label: "Conference Room" },
            ],
          },
          {
            name: "roomCapacity",
            label: "Capacity",
            type: "number",
          },
          {
            name: "roomBuildingLoc",
            label: "Building Location",
            type: "text",
          },
          {
            name: "roomFloorLoc",
            label: "Floor Location",
            type: "text",
          },
          {
            name: "readerId",
            label: "RFID Reader ID",
            type: "text",
          },
        ]}
      />

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={open => setFilterDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Rooms</DialogTitle>
            <DialogDescription>Filter the list of rooms by the following criteria.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="filter-type">Type</Label>
                <Select value={filters.type} onValueChange={value => handleFilterChange('type', value)}>
                  <SelectTrigger id="filter-type">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="CLASSROOM">Classroom</SelectItem>
                    <SelectItem value="LABORATORY">Laboratory</SelectItem>
                    <SelectItem value="OFFICE">Office</SelectItem>
                    <SelectItem value="CONFERENCE">Conference Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filter-building">Building</Label>
                <Select value={filters.building} onValueChange={value => handleFilterChange('building', value)}>
                  <SelectTrigger id="filter-building">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Main Building">Main Building</SelectItem>
                    <SelectItem value="Science Wing">Science Wing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filter-floor">Floor</Label>
                <Select value={filters.floor} onValueChange={value => handleFilterChange('floor', value)}>
                  <SelectTrigger id="filter-floor">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="1st Floor">1st Floor</SelectItem>
                    <SelectItem value="2nd Floor">2nd Floor</SelectItem>
                    <SelectItem value="3rd Floor">3rd Floor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleResetFilters}>Reset</Button>
            <Button variant="ghost" onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApplyFilters}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sort Dialog */}
      <Dialog open={sortDialogOpen} onOpenChange={open => setSortDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sort Rooms</DialogTitle>
            <DialogDescription>Sort the list of rooms by the following fields.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-4">
            <Button variant={sortField === 'roomNo' ? 'default' : 'outline'} className="justify-start" onClick={() => handleSort('roomNo')}>
              <SortAsc className="mr-2 h-4 w-4" />
              Room Number {sortField === 'roomNo' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
            <Button variant={sortField === 'roomType' ? 'default' : 'outline'} className="justify-start" onClick={() => handleSort('roomType')}>
              <SortAsc className="mr-2 h-4 w-4" />
              Type {sortField === 'roomType' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
            <Button variant={sortField === 'roomCapacity' ? 'default' : 'outline'} className="justify-start" onClick={() => handleSort('roomCapacity')}>
              <SortAsc className="mr-2 h-4 w-4" />
              Capacity {sortField === 'roomCapacity' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
            <Button variant={sortField === 'roomBuildingLoc' ? 'default' : 'outline'} className="justify-start" onClick={() => handleSort('roomBuildingLoc')}>
              <SortAsc className="mr-2 h-4 w-4" />
              Building {sortField === 'roomBuildingLoc' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
            <Button variant={sortField === 'roomFloorLoc' ? 'default' : 'outline'} className="justify-start" onClick={() => handleSort('roomFloorLoc')}>
              <SortAsc className="mr-2 h-4 w-4" />
              Floor {sortField === 'roomFloorLoc' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSortDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={open => { if (!open) { setViewDialogOpen(false); setSelectedRoom(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <DoorOpen className="h-6 w-6 text-blue-600" />
                Room Details
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedRoom && (
            <div className="mt-4 space-y-6">
              <div className="rounded-lg border bg-muted p-4">
                <h2 className="text-xl font-bold mb-1">{selectedRoom.roomNo}</h2>
                <div className="text-sm text-muted-foreground mb-2">{selectedRoom.roomBuildingLoc}</div>
                <div className="flex gap-2 mt-2">
                  <Badge variant={selectedRoom.roomType === 'CLASSROOM' ? 'success' : selectedRoom.roomType === 'LABORATORY' ? 'warning' : 'info'}>{selectedRoom.roomType}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-background p-4">
                  <div className="font-semibold text-sm mb-1">Building</div>
                  <div className="text-base">{selectedRoom.roomBuildingLoc}</div>
                </div>
                <div className="rounded-lg border bg-background p-4">
                  <div className="font-semibold text-sm mb-1">Floor</div>
                  <div className="text-base">{selectedRoom.roomFloorLoc}</div>
                </div>
                <div className="rounded-lg border bg-background p-4">
                  <div className="font-semibold text-sm mb-1">Capacity</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-blue-600">{selectedRoom.roomCapacity}</span>
                    <span className="text-muted-foreground">students</span>
                  </div>
                </div>
                <div className="rounded-lg border bg-background p-4">
                  <div className="font-semibold text-sm mb-1">RFID Reader</div>
                  <div className="text-base">{selectedRoom.readerId}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => { setViewDialogOpen(false); setSelectedRoom(null); }}>Close</Button>
            <Button onClick={() => { if (selectedRoom) { setModalRoom(selectedRoom); setModalOpen(true); setViewDialogOpen(false); } }}>Edit Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 