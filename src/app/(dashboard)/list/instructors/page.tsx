"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Menu,
  MenuItem,
  Pagination,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Grid,
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
  Person as PersonIcon,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";
import { z } from "zod";
import { toast } from "sonner";
import { UserGender, InstructorType, Status } from "@/types/enums";
import { Teacher } from "@/types/teacher";
import { instructorsData } from "@/lib/data";

type SortField = 'firstName' | 'lastName' | 'email' | 'departmentName' | 'instructorType' | 'status';
type SortOrder = 'asc' | 'desc';

export default function InstructorsListPage() {
  const router = useRouter();
  const [instructors, setInstructors] = useState(instructorsData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortField, setSortField] = useState<SortField>('lastName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<Teacher | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInstructor, setModalInstructor] = useState<Teacher | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState<Teacher | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    instructorType: "all",
    department: "all",
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, instructor: Teacher) => {
    setAnchorEl(event.currentTarget);
    setSelectedInstructor(instructor);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInstructor(null);
  };

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

const handleExportToCSV = () => {
  const headers = ["Instructor ID", "Name", "Email", "Department", "Type", "Phone", "Status"];
  const csvContent = [
    headers.join(","),
      ...instructors.map(instructor => [
      instructor.instructorId,
      `${instructor.lastName}, ${instructor.firstName} ${instructor.middleName || ''} ${instructor.suffix || ''}`,
      instructor.email,
      instructor.departmentName,
      instructor.instructorType,
      instructor.phoneNumber,
      instructor.status
    ].join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "instructors.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const handleExportToExcel = () => {
  const headers = ["Instructor ID", "Name", "Email", "Department", "Type", "Phone", "Status"];
    const rows = instructors.map(instructor => [
    instructor.instructorId,
    `${instructor.lastName}, ${instructor.firstName} ${instructor.middleName || ''} ${instructor.suffix || ''}`,
    instructor.email,
    instructor.departmentName,
    instructor.instructorType,
    instructor.phoneNumber,
    instructor.status
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Instructors");
  
  XLSX.writeFile(workbook, "instructors.xlsx");
};

const handleExportToPDF = () => {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text("Instructors List", 14, 15);
  
  const headers = ["Instructor ID", "Name", "Email", "Department", "Type", "Phone", "Status"];
    const rows = instructors.map(instructor => [
    instructor.instructorId,
    `${instructor.lastName}, ${instructor.firstName} ${instructor.middleName || ''} ${instructor.suffix || ''}`,
    instructor.email,
    instructor.departmentName,
    instructor.instructorType,
    instructor.phoneNumber,
    instructor.status
  ]);

  (doc as any).autoTable({
    head: [headers],
    body: rows,
    startY: 25,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] }
  });

  doc.save("instructors.pdf");
};

const handlePrint = () => {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Instructors List</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .print-header { text-align: center; margin-bottom: 20px; }
            .print-header h1 { font-size: 24px; margin: 0; color: #1a1a1a; }
            .print-header p { font-size: 14px; color: #666; margin: 5px 0 0 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f3f4f6; color: #374151; font-weight: 600; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937; }
            .instructor-info { display: flex; align-items: center; gap: 12px; }
            .instructor-avatar { width: 40px; height: 40px; border-radius: 8px; background-color: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; }
            .instructor-name { font-weight: 500; }
            .instructor-id { font-size: 12px; color: #6b7280; }
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
            <h1>Instructors List</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Instructor Info</th>
                <th>Email</th>
                <th>Department</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
                ${instructors.map(instructor => `
                <tr>
                  <td>
                    <div class="instructor-info">
                      <div class="instructor-avatar">${instructor.firstName.charAt(0)}${instructor.lastName.charAt(0)}</div>
                      <div>
                        <div class="instructor-name">${instructor.lastName}, ${instructor.firstName} ${instructor.middleName || ''} ${instructor.suffix || ''}</div>
                        <div class="instructor-id">${instructor.instructorId}</div>
                      </div>
                    </div>
                  </td>
                  <td>${instructor.email}</td>
                  <td>${instructor.departmentName}</td>
                  <td>${instructor.instructorType}</td>
                  <td>${instructor.phoneNumber}</td>
                  <td>${instructor.status}</td>
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

  const filteredInstructors = useMemo(() => {
    return instructors.filter(instructor => {
      const matchesSearch = 
        instructor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.departmentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filters.status === "all" || instructor.status === filters.status;
      const matchesType = filters.instructorType === "all" || instructor.instructorType === filters.instructorType;
      const matchesDepartment = filters.department === "all" || instructor.departmentName === filters.department;
      
      return matchesSearch && matchesStatus && matchesType && matchesDepartment;
    });
  }, [instructors, searchTerm, filters]);

  const sortedInstructors = useMemo(() => {
    return [...filteredInstructors].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }, [filteredInstructors, sortField, sortOrder]);

  const paginatedInstructors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedInstructors.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedInstructors, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedInstructors.length / itemsPerPage);

  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchorEl(null);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 3 }}>
      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box>
              <Typography variant="h5" component="h1" gutterBottom>
                All Instructors
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and view all instructor information
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                size="small"
  placeholder="Search instructors..."
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
                  setModalInstructor(undefined);
                  setModalOpen(true);
                }}
              >
                Add Instructor
              </Button>
            </Box>
          </Box>

          {/* Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: 'rgba(25, 118, 210, 0.2)',
                  '& .MuiTableCell-head': {
                    color: 'text.primary',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    padding: '12px 16px',
                  }
                }}>
<TableCell>Instructor Info</TableCell>
<TableCell>Email</TableCell>
<TableCell>Department</TableCell>
<TableCell>Type</TableCell>
<TableCell>Contact</TableCell>
<TableCell>Status</TableCell>
<TableCell align="center" sx={{ width: '120px' }}>Actions</TableCell> 
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedInstructors.map((instructor) => (
                  <TableRow 
                    key={instructor.instructorId} 
                    hover
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                      '& .MuiTableCell-root': {
                        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}
                        >
                          {instructor.firstName.charAt(0)}{instructor.lastName.charAt(0)}
                        </Box>
                        <Box>
                          <Typography variant="body1">
                            {instructor.lastName}, {instructor.firstName} {instructor.middleName || ''} {instructor.suffix || ''}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {instructor.instructorId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{instructor.email}</TableCell>
                    <TableCell>{instructor.departmentName}</TableCell>
                    <TableCell>{instructor.instructorType}</TableCell>
                    <TableCell>{instructor.phoneNumber}</TableCell>
                    <TableCell>
                      <Chip
                        label={instructor.status}
                        color={instructor.status === Status.ACTIVE ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            router.push(`/list/instructors/${instructor.instructorId}`);
                          }}
                          sx={{ color: "primary.main" }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            setModalInstructor(instructor);
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
                            setInstructorToDelete(instructor);
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
          setInstructorToDelete(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Delete Instructor
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the instructor "{instructorToDelete?.firstName} {instructorToDelete?.lastName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setInstructorToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => instructorToDelete && handleDeleteInstructor(instructorToDelete.instructorId)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Instructor Form Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {modalInstructor ? "Edit Instructor" : "Add New Instructor"}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="First Name"
              defaultValue={modalInstructor?.firstName}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Middle Name"
              defaultValue={modalInstructor?.middleName}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Last Name"
              defaultValue={modalInstructor?.lastName}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Suffix"
              defaultValue={modalInstructor?.suffix}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              defaultValue={modalInstructor?.email}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Phone Number"
              defaultValue={modalInstructor?.phoneNumber}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Gender</InputLabel>
              <Select
                label="Gender"
                defaultValue={modalInstructor?.gender || UserGender.MALE}
              >
                <MenuItem value={UserGender.MALE}>Male</MenuItem>
                <MenuItem value={UserGender.FEMALE}>Female</MenuItem>
                <MenuItem value={UserGender.OTHER}>Other</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Instructor Type</InputLabel>
              <Select
                label="Instructor Type"
                defaultValue={modalInstructor?.instructorType || InstructorType.FULL_TIME}
              >
                <MenuItem value={InstructorType.FULL_TIME}>Full Time</MenuItem>
                <MenuItem value={InstructorType.PART_TIME}>Part Time</MenuItem>
                <MenuItem value={InstructorType.VISITING}>Visiting</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                defaultValue={modalInstructor?.status || Status.ACTIVE}
              >
                <MenuItem value={Status.ACTIVE}>Active</MenuItem>
                <MenuItem value={Status.INACTIVE}>Inactive</MenuItem>
                <MenuItem value={Status.PENDING}>Pending</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setModalOpen(false)}>
            {modalInstructor ? "Update" : "Add"} Instructor
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedInstructor(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon color="primary" />
            <Typography variant="h6">Instructor Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInstructor && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '1.5rem',
                        }}
                      >
                        {selectedInstructor.firstName.charAt(0)}{selectedInstructor.lastName.charAt(0)}
                      </Box>
                      <Box>
                        <Typography variant="h5" gutterBottom>
                          {selectedInstructor.lastName}, {selectedInstructor.firstName} {selectedInstructor.middleName || ''} {selectedInstructor.suffix || ''}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                          ID: {selectedInstructor.instructorId}
                        </Typography>
                        <Chip
                          label={selectedInstructor.status}
                          color={selectedInstructor.status === Status.ACTIVE ? "success" : "error"}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Contact Information
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Email: {selectedInstructor.email}
                    </Typography>
                    <Typography variant="body1">
                      Phone: {selectedInstructor.phoneNumber}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Department Information
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Department: {selectedInstructor.departmentName}
                    </Typography>
                    <Typography variant="body1">
                      Type: {selectedInstructor.instructorType}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      RFID Information
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      RFID Tag: {selectedInstructor.rfidTag}
                    </Typography>
                    <Typography variant="body1">
                      Tag Number: {selectedInstructor.rfidtagNumber}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Additional Information
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Gender: {selectedInstructor.gender}
                    </Typography>
                    <Typography variant="body1">
                      Created: {selectedInstructor.createdAt.toLocaleDateString()}
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
              setSelectedInstructor(null);
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              if (selectedInstructor) {
                setModalInstructor(selectedInstructor);
                setModalOpen(true);
                setViewDialogOpen(false);
              }
            }}
          >
            Edit Instructor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 