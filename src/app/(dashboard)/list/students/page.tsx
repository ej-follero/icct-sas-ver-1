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
  Avatar,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  FileDownload as FileDownloadIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Sort as SortIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  School as SchoolIcon,
  Class as ClassIcon,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";
import { z } from "zod";
import { toast } from "sonner";
import FormModal from "@/components/FormModal";
import { studentsData } from "@/lib/data";

// Define the student schema
const studentSchema = z.object({
  studentId: z.number(),
  studentIdNum: z.string().min(1, "Student ID is required"),
  rfidTag: z.string().min(1, "RFID Tag is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  suffix: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  img: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]),
  studentType: z.enum(["REGULAR", "IRREGULAR"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  yearLevel: z.enum(["FIRST_YEAR", "SECOND_YEAR", "THIRD_YEAR", "FOURTH_YEAR"]),
  guardianId: z.number(),
  userId: z.number(),
  section_name: z.string().optional(),
  guardian_name: z.string().optional(),
});

type Student = z.infer<typeof studentSchema>;

// Update the form schema to match the form fields
const studentFormSchema = z.object({
  studentIdNum: z.string().min(1, "Student ID is required"),
  rfidTag: z.string().min(1, "RFID Tag is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  suffix: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  gender: z.enum(["MALE", "FEMALE"]),
  studentType: z.enum(["REGULAR", "IRREGULAR"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  yearLevel: z.enum(["FIRST_YEAR", "SECOND_YEAR", "THIRD_YEAR", "FOURTH_YEAR"]),
  guardianId: z.number(),
  userId: z.number(),
  section_name: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentFormSchema>;

type SortField = 'studentIdNum' | 'rfidTag' | 'name' | 'studentType' | 'section' | 'email' | 'phone';
type SortOrder = 'asc' | 'desc';

export default function StudentsPage() {
  const [students, setStudents] = useState(studentsData);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStudent, setModalStudent] = useState<Student | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    section: "all",
    status: "all",
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

  async function handleDeleteStudent(id: number) {
    try {
      const response = await fetch(`/api/students/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete student");
      }

      setStudents(students.filter(student => student.studentId !== id));
      toast.success("Student deleted successfully");
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student");
    }
  }

  const handleExportToCSV = () => {
    const headers = ["Student ID", "Name", "RFID Tag", "Type", "Email", "Phone", "Section", "Guardian"];
    const csvContent = [
      headers.join(","),
      ...students.map(student => [
        student.studentIdNum,
        `${student.lastName}, ${student.firstName} ${student.middleName || ''} ${student.suffix || ''}`,
        student.rfidTag,
        student.studentType,
        student.email,
        student.phoneNumber,
        student.section_name || '',
        student.guardian_name || ''
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "students.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToExcel = () => {
    const headers = ["Student ID", "Name", "RFID Tag", "Type", "Email", "Phone", "Section", "Guardian"];
    const rows = students.map(student => [
      student.studentIdNum,
      `${student.lastName}, ${student.firstName} ${student.middleName || ''} ${student.suffix || ''}`,
      student.rfidTag,
      student.studentType,
      student.email,
      student.phoneNumber,
      student.section_name || '',
      student.guardian_name || ''
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    
    XLSX.writeFile(workbook, "students.xlsx");
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Students List", 14, 15);
    
    const headers = ["Student ID", "Name", "RFID Tag", "Type", "Email", "Phone", "Section", "Guardian"];
    const rows = students.map(student => [
      student.studentIdNum,
      `${student.lastName}, ${student.firstName} ${student.middleName || ''} ${student.suffix || ''}`,
      student.rfidTag,
      student.studentType,
      student.email,
      student.phoneNumber,
      student.section_name || '',
      student.guardian_name || ''
    ]);

    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save("students.pdf");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Students List</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .print-header { text-align: center; margin-bottom: 20px; }
              .print-header h1 { font-size: 24px; margin: 0; color: #1a1a1a; }
              .print-header p { font-size: 14px; color: #666; margin: 5px 0 0 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #f3f4f6; color: #374151; font-weight: 600; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; }
              td { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937; }
              .student-info { display: flex; align-items: center; gap: 12px; }
              .student-avatar { width: 40px; height: 40px; border-radius: 8px; background-color: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; }
              .student-name { font-weight: 500; }
              .student-id { font-size: 12px; color: #6b7280; }
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
              <h1>Students List</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Student ID</th>
                  <th>RFID Tag</th>
                  <th>Type</th>
                  <th>Contact</th>
                  <th>Section</th>
                  <th>Guardian</th>
                </tr>
              </thead>
              <tbody>
                ${students.map(student => `
                  <tr>
                    <td>
                      <div class="student-info">
                        <div class="student-avatar">${student.firstName.charAt(0)}${student.lastName.charAt(0)}</div>
                        <div>
                          <div class="student-name">${student.lastName}, ${student.firstName} ${student.middleName || ''} ${student.suffix || ''}</div>
                          <div class="student-id">${student.studentIdNum}</div>
                        </div>
                      </div>
                    </td>
                    <td>${student.studentIdNum}</td>
                    <td>${student.rfidTag}</td>
                    <td>${student.studentType}</td>
                    <td>
                      <div>${student.email}</div>
                      <div>${student.phoneNumber}</div>
                    </td>
                    <td>${student.section_name || '-'}</td>
                    <td>${student.guardian_name || '-'}</td>
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
      section: "all",
      status: "all",
    });
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.studentIdNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.rfidTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          `${student.firstName} ${student.middleName || ''} ${student.lastName} ${student.suffix || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filters.type === "all" || student.studentType === filters.type;
      const matchesSection = filters.section === "all" || student.section_name === filters.section;
      const matchesStatus = filters.status === "all" || student.status === filters.status;
      
      return matchesSearch && matchesType && matchesSection && matchesStatus;
    });
  }, [students, searchTerm, filters]);

  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'studentIdNum':
          comparison = a.studentIdNum.localeCompare(b.studentIdNum);
          break;
        case 'rfidTag':
          comparison = a.rfidTag.localeCompare(b.rfidTag);
          break;
        case 'name':
          comparison = `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`);
          break;
        case 'studentType':
          comparison = a.studentType.localeCompare(b.studentType);
          break;
        case 'section':
          comparison = (a.section_name || '').localeCompare(b.section_name || '');
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'phone':
          comparison = a.phoneNumber.localeCompare(b.phoneNumber);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredStudents, sortField, sortOrder]);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedStudents, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 3 }}>
      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box>
              <Typography variant="h5" component="h1" gutterBottom>
                All Students
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and view all student information
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                size="small"
                placeholder="Search students..."
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
                  setModalStudent(undefined);
                  setModalOpen(true);
                }}
              >
                Add Student
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
                  <TableCell>Student Info</TableCell>
                  <TableCell>Student ID</TableCell>
                  <TableCell>RFID Tag</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Guardian</TableCell>
                  <TableCell align="center" sx={{ width: '120px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedStudents.map((item) => (
                  <TableRow 
                    key={item.studentId} 
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: 'primary.main',
                            width: 40,
                            height: 40,
                          }}
                        >
                          {`${item.firstName.charAt(0)}${item.lastName.charAt(0)}`}
                        </Avatar>
                        <Box>
                          <Typography variant="body1">
                            {`${item.lastName}, ${item.firstName} ${item.middleName || ''} ${item.suffix || ''}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.studentIdNum}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{item.studentIdNum}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.rfidTag}
                        color="info"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.studentType}
                        color={item.studentType === "REGULAR" ? "success" : "warning"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.email}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.phoneNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.section_name || '-'}</TableCell>
                    <TableCell>{item.guardian_name || '-'}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedStudent(item);
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
                            setModalStudent(item);
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
                            setStudentToDelete(item);
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
              {Math.min(currentPage * itemsPerPage, sortedStudents.length)} of{" "}
              {sortedStudents.length} entries
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
          setStudentToDelete(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Delete Student
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the student "{studentToDelete?.firstName} {studentToDelete?.lastName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setStudentToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => studentToDelete && handleDeleteStudent(studentToDelete.studentId)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Student Form Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (data: StudentFormData) => {
          try {
            const url = modalStudent ? `/api/students/${modalStudent.studentId}` : "/api/students";
            const method = modalStudent ? "PUT" : "POST";
            const response = await fetch(url, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Failed to save student");

            if (modalStudent) {
              setStudents(students.map(student => 
                student.studentId === modalStudent.studentId ? { ...student, ...data } : student
              ));
              toast.success("Student updated successfully");
            } else {
              const newStudent = await response.json();
              setStudents([...students, newStudent]);
              toast.success("Student created successfully");
            }

            setModalOpen(false);
          } catch (error) {
            console.error("Error saving student:", error);
            toast.error("Failed to save student");
          }
        }}
        title={modalStudent ? "Edit Student" : "Add New Student"}
        submitLabel={modalStudent ? "Update" : "Add"}
        defaultValues={modalStudent}
        schema={studentFormSchema}
        fields={[
          {
            name: "studentIdNum",
            label: "Student ID",
            type: "text",
          },
          {
            name: "rfidTag",
            label: "RFID Tag",
            type: "text",
          },
          {
            name: "firstName",
            label: "First Name",
            type: "text",
          },
          {
            name: "middleName",
            label: "Middle Name",
            type: "text",
          },
          {
            name: "lastName",
            label: "Last Name",
            type: "text",
          },
          {
            name: "suffix",
            label: "Suffix",
            type: "text",
          },
          {
            name: "email",
            label: "Email",
            type: "email",
          },
          {
            name: "phoneNumber",
            label: "Phone Number",
            type: "text",
          },
          {
            name: "address",
            label: "Address",
            type: "text",
          },
          {
            name: "gender",
            label: "Gender",
            type: "select",
            options: [
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
            ],
          },
          {
            name: "studentType",
            label: "Type",
            type: "select",
            options: [
              { value: "REGULAR", label: "Regular" },
              { value: "IRREGULAR", label: "Irregular" },
            ],
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ],
          },
          {
            name: "yearLevel",
            label: "Year Level",
            type: "select",
            options: [
              { value: "FIRST_YEAR", label: "First Year" },
              { value: "SECOND_YEAR", label: "Second Year" },
              { value: "THIRD_YEAR", label: "Third Year" },
              { value: "FOURTH_YEAR", label: "Fourth Year" },
            ],
          },
          {
            name: "section_name",
            label: "Section",
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
        <DialogTitle>Filter Students</DialogTitle>
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
                <MenuItem value="REGULAR">Regular</MenuItem>
                <MenuItem value="IRREGULAR">Irregular</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Section</InputLabel>
              <Select
                value={filters.section}
                label="Section"
                onChange={(e) => handleFilterChange('section', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                {Array.from(new Set(students.map(s => s.section_name))).map(section => (
                  <MenuItem key={section} value={section}>
                    {section}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
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
        <DialogTitle>Sort Students</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Sort by:
            </Typography>
            <Stack spacing={1}>
              <Button
                variant={sortField === 'studentIdNum' ? 'contained' : 'outlined'}
                onClick={() => handleSort('studentIdNum')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Student ID {sortField === 'studentIdNum' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'rfidTag' ? 'contained' : 'outlined'}
                onClick={() => handleSort('rfidTag')}
                startIcon={<SortIcon />}
                fullWidth
              >
                RFID Tag {sortField === 'rfidTag' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'name' ? 'contained' : 'outlined'}
                onClick={() => handleSort('name')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'studentType' ? 'contained' : 'outlined'}
                onClick={() => handleSort('studentType')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Type {sortField === 'studentType' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'section' ? 'contained' : 'outlined'}
                onClick={() => handleSort('section')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Section {sortField === 'section' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'email' ? 'contained' : 'outlined'}
                onClick={() => handleSort('email')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Email {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'phone' ? 'contained' : 'outlined'}
                onClick={() => handleSort('phone')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Phone {sortField === 'phone' && (sortOrder === 'asc' ? '↑' : '↓')}
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
          setSelectedStudent(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon color="primary" />
            <Typography variant="h6">Student Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          width: 64,
                          height: 64,
                        }}
                      >
                        {`${selectedStudent.firstName.charAt(0)}${selectedStudent.lastName.charAt(0)}`}
                      </Avatar>
                      <Box>
                        <Typography variant="h5" gutterBottom>
                          {`${selectedStudent.lastName}, ${selectedStudent.firstName} ${selectedStudent.middleName || ''} ${selectedStudent.suffix || ''}`}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                          {selectedStudent.studentIdNum}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip
                            label={selectedStudent.studentType}
                            color={selectedStudent.studentType === "REGULAR" ? "success" : "warning"}
                            size="small"
                          />
                          <Chip
                            label={selectedStudent.status}
                            color={selectedStudent.status === "ACTIVE" ? "success" : "error"}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Contact Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon color="action" />
                        <Typography variant="body1">{selectedStudent.email}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon color="action" />
                        <Typography variant="body1">{selectedStudent.phoneNumber}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon color="action" />
                        <Typography variant="body1">{selectedStudent.address}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Academic Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon color="action" />
                        <Typography variant="body1">{selectedStudent.yearLevel.replace('_', ' ')}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ClassIcon color="action" />
                        <Typography variant="body1">{selectedStudent.section_name || 'No Section'}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      RFID Information
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={selectedStudent.rfidTag}
                        color="info"
                        size="small"
                      />
                    </Box>
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
              setSelectedStudent(null);
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              if (selectedStudent) {
                setModalStudent(selectedStudent);
                setModalOpen(true);
                setViewDialogOpen(false);
              }
            }}
          >
            Edit Student
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}