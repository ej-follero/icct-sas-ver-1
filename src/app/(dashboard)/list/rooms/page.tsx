"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  TextField,
  Pagination,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Menu,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  FileDownload as FileDownloadIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Sort as SortIcon,
  MeetingRoom as MeetingRoomIcon,
} from "@mui/icons-material";
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
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 3 }}>
      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box>
              <Typography variant="h5" component="h1" gutterBottom>
                All Rooms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and view all room information
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                size="small"
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: "action.active", mr: 1 }} />,
                }}
              />
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFilterDialogOpen(true)}
              >
                Filter
              </Button>
              <Button
                variant="outlined"
                startIcon={<SortIcon />}
                onClick={() => setSortDialogOpen(true)}
              >
                Sort
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setModalRoom(undefined);
                  setModalOpen(true);
                }}
              >
                Add Room
              </Button>
            </Box>
          </Box>

          {/* Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: 'rgba(25, 118, 210, 0.2)', // Light blue with 20% opacity
                  '& .MuiTableCell-head': {
                    color: 'text.primary',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    padding: '12px 16px',
                  }
                }}>
                  <TableCell>Room Info</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Building</TableCell>
                  <TableCell>Floor</TableCell>
                  <TableCell>RFID Reader</TableCell>
                  <TableCell align="center" sx={{ width: '120px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRooms.map((item) => (
                  <TableRow 
                    key={item.roomId} 
                    hover
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.02)', // Light gray with 2% opacity
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)', // Slightly darker on hover
                      },
                      '& .MuiTableCell-root': {
                        borderBottom: '1px solid rgba(0, 0, 0, 0.08)', // Lighter border
                      }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body1">{item.roomNo}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.roomBuildingLoc}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.roomType}
                        color={item.roomType === "CLASSROOM" ? "primary" : item.roomType === "LABORATORY" ? "warning" : "success"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.roomCapacity}</TableCell>
                    <TableCell>{item.roomBuildingLoc}</TableCell>
                    <TableCell>{item.roomFloorLoc}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.readerId}
                        color="info"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedRoom(item);
                            setViewDialogOpen(true);
                          }}
                          sx={{ color: "primary.main" }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            setModalRoom(item);
                            setModalOpen(true);
                          }}
                          sx={{ color: "info.main" }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            setRoomToDelete(item);
                            setDeleteDialogOpen(true);
                          }}
                          sx={{ color: "error.main" }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, sortedRooms.length)} of{" "}
              {sortedRooms.length} entries
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportMenuOpen}
              >
                Export
              </Button>
              <Menu
                anchorEl={exportMenuAnchorEl}
                open={Boolean(exportMenuAnchorEl)}
                onClose={handleExportMenuClose}
              >
                <MenuItem onClick={() => {
                  handleExportToCSV();
                  handleExportMenuClose();
                }}>
                  Export as CSV
                </MenuItem>
                <MenuItem onClick={() => {
                  handleExportToExcel();
                  handleExportMenuClose();
                }}>
                  Export as Excel
                </MenuItem>
                <MenuItem onClick={() => {
                  handleExportToPDF();
                  handleExportMenuClose();
                }}>
                  Export as PDF
                </MenuItem>
              </Menu>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
              >
                Print
              </Button>
            </Stack>
          </Box>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setRoomToDelete(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Delete Room
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the room "{roomToDelete?.roomNo}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setRoomToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => roomToDelete && handleDeleteRoom(roomToDelete.roomId)}
          >
            Delete
          </Button>
        </DialogActions>
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
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Filter Rooms</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                label="Type"
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="CLASSROOM">Classroom</MenuItem>
                <MenuItem value="LABORATORY">Laboratory</MenuItem>
                <MenuItem value="OFFICE">Office</MenuItem>
                <MenuItem value="CONFERENCE">Conference Room</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Building</InputLabel>
              <Select
                value={filters.building}
                label="Building"
                onChange={(e) => handleFilterChange('building', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="Main Building">Main Building</MenuItem>
                <MenuItem value="Science Wing">Science Wing</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Floor</InputLabel>
              <Select
                value={filters.floor}
                label="Floor"
                onChange={(e) => handleFilterChange('floor', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="1st Floor">1st Floor</MenuItem>
                <MenuItem value="2nd Floor">2nd Floor</MenuItem>
                <MenuItem value="3rd Floor">3rd Floor</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleResetFilters}>Reset</Button>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sort Dialog */}
      <Dialog
        open={sortDialogOpen}
        onClose={() => setSortDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Sort Rooms</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Sort by:
            </Typography>
            <Stack spacing={1}>
              <Button
                variant={sortField === 'roomNo' ? 'contained' : 'outlined'}
                onClick={() => handleSort('roomNo')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Room Number {sortField === 'roomNo' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'roomType' ? 'contained' : 'outlined'}
                onClick={() => handleSort('roomType')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Type {sortField === 'roomType' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'roomCapacity' ? 'contained' : 'outlined'}
                onClick={() => handleSort('roomCapacity')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Capacity {sortField === 'roomCapacity' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'roomBuildingLoc' ? 'contained' : 'outlined'}
                onClick={() => handleSort('roomBuildingLoc')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Building {sortField === 'roomBuildingLoc' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'roomFloorLoc' ? 'contained' : 'outlined'}
                onClick={() => handleSort('roomFloorLoc')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Floor {sortField === 'roomFloorLoc' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSortDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedRoom(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MeetingRoomIcon color="primary" />
            <Typography variant="h6">Room Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRoom && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="h5" gutterBottom>
                      {selectedRoom.roomNo}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      {selectedRoom.roomBuildingLoc}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip
                        label={selectedRoom.roomType}
                        color={selectedRoom.roomType === "CLASSROOM" ? "primary" : selectedRoom.roomType === "LABORATORY" ? "warning" : "success"}
                        size="small"
                      />
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Building
                    </Typography>
                    <Typography variant="body1">
                      {selectedRoom.roomBuildingLoc}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Floor
                    </Typography>
                    <Typography variant="body1">
                      {selectedRoom.roomFloorLoc}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Capacity
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h4" color="primary">
                        {selectedRoom.roomCapacity}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        students
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      RFID Reader
                    </Typography>
                    <Typography variant="body1">
                      {selectedRoom.readerId}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setViewDialogOpen(false);
              setSelectedRoom(null);
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              if (selectedRoom) {
                setModalRoom(selectedRoom);
                setModalOpen(true);
                setViewDialogOpen(false);
              }
            }}
          >
            Edit Room
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 