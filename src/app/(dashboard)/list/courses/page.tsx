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
  School as SchoolIcon,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";
import { z } from "zod";
import { toast } from "sonner";
import FormModal from "@/components/FormModal";

// Define the course schema
const courseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Course name is required"),
  code: z.string().min(1, "Course code is required"),
  department: z.string().min(1, "Department is required"),
  description: z.string().optional(),
  units: z.number().min(1, "Units must be at least 1"),
  status: z.enum(["active", "inactive"]),
  totalStudents: z.number(),
  totalInstructors: z.number(),
});

type Course = z.infer<typeof courseSchema>;

// Update the form schema to match the form fields
const courseFormSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  code: z.string().min(1, "Course code is required"),
  department: z.string().min(1, "Department is required"),
  description: z.string().optional(),
  units: z.number().min(1, "Units must be at least 1"),
  status: z.enum(["active", "inactive"]),
});

type CourseFormData = z.infer<typeof courseFormSchema>;

// Mock data - replace with actual API calls later
const initialCourses: Course[] = [
  {
    id: "1",
    name: "Bachelor of Science in Information Technology",
    code: "BSIT",
    department: "College of Information Technology",
    description: "A program focused on information technology and computer systems",
    units: 144,
    status: "active",
    totalStudents: 150,
    totalInstructors: 12,
  },
  {
    id: "2",
    name: "Bachelor of Science in Computer Science",
    code: "BSCS",
    department: "College of Information Technology",
    description: "A program focused on computer science and software development",
    units: 144,
    status: "active",
    totalStudents: 120,
    totalInstructors: 10,
  },
];

type SortField = 'name' | 'code' | 'department' | 'units' | 'totalStudents' | 'totalInstructors';
type SortOrder = 'asc' | 'desc';

export default function CourseListPage() {
  const router = useRouter();
  const [courses, setCourses] = useState(initialCourses);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCourse, setModalCourse] = useState<Course | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    totalStudents: "all",
    totalInstructors: "all",
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, course: Course) => {
    setAnchorEl(event.currentTarget);
    setSelectedCourse(course);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCourse(null);
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

  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchorEl(null);
  };

  async function handleDeleteCourse(id: string) {
    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete course");
      }

      setCourses(courses.filter(course => course.id !== id));
      toast.success("Course deleted successfully");
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
    }
  }

  const handleExportToCSV = () => {
    const headers = ["Course Name", "Code", "Department", "Units", "Total Students", "Total Instructors", "Status"];
    const csvContent = [
      headers.join(","),
      ...courses.map(course => [
        course.name,
        course.code,
        course.department,
        course.units,
        course.totalStudents,
        course.totalInstructors,
        course.status
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "courses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToExcel = () => {
    const headers = ["Course Name", "Code", "Department", "Units", "Total Students", "Total Instructors", "Status"];
    const rows = courses.map(course => [
      course.name,
      course.code,
      course.department,
      course.units,
      course.totalStudents,
      course.totalInstructors,
      course.status
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Courses");
    
    XLSX.writeFile(workbook, "courses.xlsx");
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Courses List", 14, 15);
    
    const headers = ["Course Name", "Code", "Department", "Units", "Students", "Instructors", "Status"];
    const rows = courses.map(course => [
      course.name,
      course.code,
      course.department,
      course.units.toString(),
      course.totalStudents.toString(),
      course.totalInstructors.toString(),
      course.status
    ]);

    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save("courses.pdf");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
      <html>
        <head>
          <title>Courses List</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .print-header { text-align: center; margin-bottom: 20px; }
            .print-header h1 { font-size: 24px; margin: 0; color: #1a1a1a; }
            .print-header p { font-size: 14px; color: #666; margin: 5px 0 0 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f3f4f6; color: #374151; font-weight: 600; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937; }
            .status-active { color: #059669; font-weight: 500; }
            .status-inactive { color: #dc2626; font-weight: 500; }
            .course-info { display: flex; align-items: center; gap: 12px; }
            .course-code { background-color: #2563eb; color: white; padding: 8px 12px; border-radius: 8px; font-weight: 600; }
            .course-name { font-weight: 500; }
            .course-code-text { font-size: 12px; color: #6b7280; }
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
            <h1>Courses List</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Course Info</th>
                <th>Department</th>
                <th>Units</th>
                <th>Total Students</th>
                <th>Total Instructors</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${courses.map(course => `
                <tr>
                  <td>
                    <div class="course-info">
                      <div class="course-code">${course.code.slice(0, 2)}</div>
                      <div>
                        <div class="course-name">${course.name}</div>
                        <div class="course-code-text">${course.code}</div>
                      </div>
                    </div>
                  </td>
                  <td>${course.department}</td>
                  <td>${course.units}</td>
                  <td>${course.totalStudents}</td>
                  <td>${course.totalInstructors}</td>
                  <td class="status-${course.status}">${course.status}</td>
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
      status: "all",
      totalStudents: "all",
      totalInstructors: "all",
    });
  };

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          course.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filters.status === "all" || course.status === filters.status;
      const matchesStudents = filters.totalStudents === "all" || 
        (filters.totalStudents === "high" && course.totalStudents > 100) ||
        (filters.totalStudents === "medium" && course.totalStudents > 50 && course.totalStudents <= 100) ||
        (filters.totalStudents === "low" && course.totalStudents <= 50);
      const matchesInstructors = filters.totalInstructors === "all" ||
        (filters.totalInstructors === "high" && course.totalInstructors > 10) ||
        (filters.totalInstructors === "medium" && course.totalInstructors > 5 && course.totalInstructors <= 10) ||
        (filters.totalInstructors === "low" && course.totalInstructors <= 5);
      
      return matchesSearch && matchesStatus && matchesStudents && matchesInstructors;
    });
  }, [courses, searchTerm, filters]);

  const sortedCourses = useMemo(() => {
    return [...filteredCourses].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }, [filteredCourses, sortField, sortOrder]);

  const paginatedCourses = useMemo(() => {
  const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedCourses.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedCourses, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedCourses.length / itemsPerPage);

  const handleAssignInstructor = (courseId: string) => {
    // Implementation for assigning instructor to course
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 3 }}>
      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box>
              <Typography variant="h5" component="h1" gutterBottom>
                All Courses
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and view all course information
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                size="small"
                    placeholder="Search courses..."
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
                  setModalCourse(undefined);
                  setModalOpen(true);
                }}
              >
                Add Course
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
                  <TableCell>Course Info</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Units</TableCell>
                  <TableCell>Instructors</TableCell>
                  <TableCell>Students</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center" sx={{ width: '120px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCourses.map((item) => (
                  <TableRow 
                    key={item.code} 
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
                      <Typography variant="body1">{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.code}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.department}</TableCell>
                    <TableCell>{item.units}</TableCell>
                    <TableCell>{item.totalInstructors}</TableCell>
                    <TableCell>{item.totalStudents}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={item.status === "active" ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedCourse(item);
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
                            setModalCourse(item);
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
                            setCourseToDelete(item);
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
              {Math.min(currentPage * itemsPerPage, sortedCourses.length)} of{" "}
              {sortedCourses.length} entries
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
          setCourseToDelete(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Delete Course
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the course "{courseToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setCourseToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => courseToDelete && handleDeleteCourse(courseToDelete.id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Course Form Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (data: CourseFormData) => {
          try {
            const url = modalCourse ? `/api/courses/${modalCourse.id}` : "/api/courses";
            const method = modalCourse ? "PUT" : "POST";
            const response = await fetch(url, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Failed to save course");

            if (modalCourse) {
              setCourses(courses.map(course => 
                course.id === modalCourse.id ? { ...course, ...data } : course
              ));
              toast.success("Course updated successfully");
            } else {
              const newCourse = await response.json();
              setCourses([...courses, newCourse]);
              toast.success("Course created successfully");
            }

            setModalOpen(false);
          } catch (error) {
            console.error("Error saving course:", error);
            toast.error("Failed to save course");
          }
        }}
        title={modalCourse ? "Edit Course" : "Add New Course"}
        submitLabel={modalCourse ? "Update" : "Add"}
        defaultValues={modalCourse}
        schema={courseFormSchema}
        fields={[
          {
            name: "name",
            label: "Course Name",
            type: "text",
          },
          {
            name: "code",
            label: "Course Code",
            type: "text",
          },
          {
            name: "department",
            label: "Department",
            type: "text",
          },
          {
            name: "units",
            label: "Units",
            type: "number",
          },
          {
            name: "description",
            label: "Description",
            type: "multiline",
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
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
        <DialogTitle>Filter Courses</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Total Students</InputLabel>
              <Select
                value={filters.totalStudents}
                label="Total Students"
                onChange={(e) => handleFilterChange('totalStudents', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="high">High ({'>'}100)</MenuItem>
                <MenuItem value="medium">Medium (51-100)</MenuItem>
                <MenuItem value="low">Low (≤50)</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Total Instructors</InputLabel>
              <Select
                value={filters.totalInstructors}
                label="Total Instructors"
                onChange={(e) => handleFilterChange('totalInstructors', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="high">High ({'>'}10)</MenuItem>
                <MenuItem value="medium">Medium (6-10)</MenuItem>
                <MenuItem value="low">Low (≤5)</MenuItem>
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
        <DialogTitle>Sort Courses</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Sort by:
            </Typography>
            <Stack spacing={1}>
              <Button
                variant={sortField === 'name' ? 'contained' : 'outlined'}
                onClick={() => handleSort('name')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Course Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'code' ? 'contained' : 'outlined'}
                onClick={() => handleSort('code')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Course Code {sortField === 'code' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'department' ? 'contained' : 'outlined'}
                onClick={() => handleSort('department')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Department {sortField === 'department' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'units' ? 'contained' : 'outlined'}
                onClick={() => handleSort('units')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Units {sortField === 'units' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'totalStudents' ? 'contained' : 'outlined'}
                onClick={() => handleSort('totalStudents')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Total Students {sortField === 'totalStudents' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'totalInstructors' ? 'contained' : 'outlined'}
                onClick={() => handleSort('totalInstructors')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Total Instructors {sortField === 'totalInstructors' && (sortOrder === 'asc' ? '↑' : '↓')}
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
          setSelectedCourse(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon color="primary" />
            <Typography variant="h6">Course Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedCourse && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="h5" gutterBottom>
                      {selectedCourse.name}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      {selectedCourse.code}
                    </Typography>
                    <Chip
                      label={selectedCourse.status}
                      color={selectedCourse.status === "active" ? "success" : "error"}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Department
                    </Typography>
                    <Typography variant="body1">
                      {selectedCourse.department}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {selectedCourse.description || "No description available"}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Units
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h4" color="primary">
                        {selectedCourse.units}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        units
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Total Students
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h4" color="primary">
                        {selectedCourse.totalStudents}
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
                      Total Instructors
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h4" color="primary">
                        {selectedCourse.totalInstructors}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        instructors
                      </Typography>
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
              setSelectedCourse(null);
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              if (selectedCourse) {
                setModalCourse(selectedCourse);
                setModalOpen(true);
                setViewDialogOpen(false);
              }
            }}
          >
            Edit Course
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 