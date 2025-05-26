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
  School as SchoolIcon,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";
import { z } from "zod";
import { toast } from "sonner";
import FormModal from "@/components/FormModal";

// Define the subject schema
const subjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Subject code is required"),
  description: z.string().optional(),
  type: z.enum(["lecture", "laboratory", "both"]),
  lecture_units: z.number().optional(),
  laboratory_units: z.number().optional(),
  units: z.number().min(1, "Units must be at least 1"),
  semester: z.enum(["1st", "2nd", "3rd"]),
  year_level: z.enum(["1st", "2nd", "3rd", "4th"]),
  department: z.string().min(1, "Department is required"),
  instructors: z.array(z.string()),
});

type Subject = z.infer<typeof subjectSchema>;

// Update the form schema to match the form fields
const subjectFormSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Subject code is required"),
  description: z.string().optional(),
  type: z.enum(["lecture", "laboratory", "both"]),
  lecture_units: z.number().optional(),
  laboratory_units: z.number().optional(),
  units: z.number().min(1, "Units must be at least 1"),
  semester: z.enum(["1st", "2nd", "3rd"]),
  year_level: z.enum(["1st", "2nd", "3rd", "4th"]),
  department: z.string().min(1, "Department is required"),
  instructors: z.array(z.string()),
});

type SubjectFormData = z.infer<typeof subjectFormSchema>;

// Mock data - replace with actual API calls later
const initialSubjects: Subject[] = [
  {
    id: "1",
    name: "Introduction to Programming",
    code: "ITP101",
    description: "Basic programming concepts and problem-solving",
    type: "both",
    lecture_units: 2,
    laboratory_units: 1,
    units: 3,
    semester: "1st",
    year_level: "1st",
    department: "College of Information Technology",
    instructors: ["John Doe", "Jane Smith"],
  },
  {
    id: "2",
    name: "Data Structures and Algorithms",
    code: "DSA201",
    description: "Advanced data structures and algorithm analysis",
    type: "both",
    lecture_units: 3,
    laboratory_units: 1,
    units: 4,
    semester: "2nd",
    year_level: "2nd",
    department: "College of Information Technology",
    instructors: ["Alice Johnson", "Bob Wilson"],
  },
];

type SortField = 'name' | 'code' | 'type' | 'units' | 'semester' | 'year_level' | 'department';
type SortOrder = 'asc' | 'desc';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubject, setModalSubject] = useState<Subject | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    semester: "all",
    year_level: "all",
    department: "all",
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

  async function handleDeleteSubject(id: string) {
    try {
      const response = await fetch(`/api/subjects/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete subject");
      }

      setSubjects(subjects.filter(subject => subject.id !== id));
      toast.success("Subject deleted successfully");
      setDeleteDialogOpen(false);
      setSubjectToDelete(null);
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast.error("Failed to delete subject");
    }
  }

  const handleExportToCSV = () => {
    const headers = ["Subject Name", "Code", "Type", "Units", "Semester", "Year Level", "Department", "Instructors"];
    const csvContent = [
      headers.join(","),
      ...subjects.map(subject => [
        subject.name,
        subject.code,
        subject.type,
        subject.units,
        subject.semester,
        subject.year_level,
        subject.department,
        subject.instructors.join("; ")
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "subjects.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToExcel = () => {
    const headers = ["Subject Name", "Code", "Type", "Units", "Semester", "Year Level", "Department", "Instructors"];
    const rows = subjects.map(subject => [
      subject.name,
      subject.code,
      subject.type,
      subject.units,
      subject.semester,
      subject.year_level,
      subject.department,
      subject.instructors.join("; ")
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Subjects");
    
    XLSX.writeFile(workbook, "subjects.xlsx");
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Subjects List", 14, 15);
    
    const headers = ["Subject Name", "Code", "Type", "Units", "Semester", "Year Level", "Department"];
    const rows = subjects.map(subject => [
      subject.name,
      subject.code,
      subject.type,
      subject.units.toString(),
      subject.semester,
      subject.year_level,
      subject.department
    ]);

    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save("subjects.pdf");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Subjects List</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .print-header { text-align: center; margin-bottom: 20px; }
              .print-header h1 { font-size: 24px; margin: 0; color: #1a1a1a; }
              .print-header p { font-size: 14px; color: #666; margin: 5px 0 0 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #f3f4f6; color: #374151; font-weight: 600; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; }
              td { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937; }
              .subject-info { display: flex; align-items: center; gap: 12px; }
              .subject-code { background-color: #2563eb; color: white; padding: 8px 12px; border-radius: 8px; font-weight: 600; }
              .subject-name { font-weight: 500; }
              .subject-code-text { font-size: 12px; color: #6b7280; }
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
              <h1>Subjects List</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Subject Info</th>
                  <th>Type</th>
                  <th>Units</th>
                  <th>Semester</th>
                  <th>Year Level</th>
                  <th>Department</th>
                </tr>
              </thead>
              <tbody>
                ${subjects.map(subject => `
                  <tr>
                    <td>
                      <div class="subject-info">
                        <div class="subject-code">${subject.code.slice(0, 2)}</div>
                        <div>
                          <div class="subject-name">${subject.name}</div>
                          <div class="subject-code-text">${subject.code}</div>
                        </div>
                      </div>
                    </td>
                    <td>${subject.type}</td>
                    <td>${subject.units}</td>
                    <td>${subject.semester}</td>
                    <td>${subject.year_level}</td>
                    <td>${subject.department}</td>
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
      semester: "all",
      year_level: "all",
      department: "all",
    });
  };

  const filteredSubjects = useMemo(() => {
    return subjects.filter(subject => {
      const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          subject.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filters.type === "all" || subject.type === filters.type;
      const matchesSemester = filters.semester === "all" || subject.semester === filters.semester;
      const matchesYearLevel = filters.year_level === "all" || subject.year_level === filters.year_level;
      const matchesDepartment = filters.department === "all" || subject.department === filters.department;
      
      return matchesSearch && matchesType && matchesSemester && matchesYearLevel && matchesDepartment;
    });
  }, [subjects, searchTerm, filters]);

  const sortedSubjects = useMemo(() => {
    return [...filteredSubjects].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }, [filteredSubjects, sortField, sortOrder]);

  const paginatedSubjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedSubjects.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedSubjects, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedSubjects.length / itemsPerPage);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 3 }}>
      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box>
              <Typography variant="h5" component="h1" gutterBottom>
                All Subjects
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and view all subject information
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                size="small"
                placeholder="Search subjects..."
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
                  setModalSubject(undefined);
                  setModalOpen(true);
                }}
              >
                Add Subject
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
                  <TableCell>Subject Info</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Units</TableCell>
                  <TableCell>Semester</TableCell>
                  <TableCell>Year Level</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell align="center" sx={{ width: '120px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSubjects.map((item) => (
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
                    <TableCell>
                      <Chip
                        label={item.type}
                        color={item.type === "both" ? "primary" : item.type === "lecture" ? "success" : "warning"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.units}</TableCell>
                    <TableCell>{item.semester}</TableCell>
                    <TableCell>{item.year_level}</TableCell>
                    <TableCell>{item.department}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedSubject(item);
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
                            setModalSubject(item);
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
                            setSubjectToDelete(item);
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
              {Math.min(currentPage * itemsPerPage, sortedSubjects.length)} of{" "}
              {sortedSubjects.length} entries
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
          setSubjectToDelete(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Delete Subject
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the subject "{subjectToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setSubjectToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => subjectToDelete && handleDeleteSubject(subjectToDelete.id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subject Form Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (data: SubjectFormData) => {
          try {
            const url = modalSubject ? `/api/subjects/${modalSubject.id}` : "/api/subjects";
            const method = modalSubject ? "PUT" : "POST";
            const response = await fetch(url, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Failed to save subject");

            if (modalSubject) {
              setSubjects(subjects.map(subject => 
                subject.id === modalSubject.id ? { ...subject, ...data } : subject
              ));
              toast.success("Subject updated successfully");
            } else {
              const newSubject = await response.json();
              setSubjects([...subjects, newSubject]);
              toast.success("Subject created successfully");
            }

            setModalOpen(false);
          } catch (error) {
            console.error("Error saving subject:", error);
            toast.error("Failed to save subject");
          }
        }}
        title={modalSubject ? "Edit Subject" : "Add New Subject"}
        submitLabel={modalSubject ? "Update" : "Add"}
        defaultValues={modalSubject}
        schema={subjectFormSchema}
        fields={[
          {
            name: "name",
            label: "Subject Name",
            type: "text",
          },
          {
            name: "code",
            label: "Subject Code",
            type: "text",
          },
          {
            name: "type",
            label: "Type",
            type: "select",
            options: [
              { value: "lecture", label: "Lecture" },
              { value: "laboratory", label: "Laboratory" },
              { value: "both", label: "Both" },
            ],
          },
          {
            name: "lecture_units",
            label: "Lecture Units",
            type: "number",
          },
          {
            name: "laboratory_units",
            label: "Laboratory Units",
            type: "number",
          },
          {
            name: "units",
            label: "Total Units",
            type: "number",
          },
          {
            name: "semester",
            label: "Semester",
            type: "select",
            options: [
              { value: "1st", label: "1st Semester" },
              { value: "2nd", label: "2nd Semester" },
              { value: "3rd", label: "3rd Semester" },
            ],
          },
          {
            name: "year_level",
            label: "Year Level",
            type: "select",
            options: [
              { value: "1st", label: "1st Year" },
              { value: "2nd", label: "2nd Year" },
              { value: "3rd", label: "3rd Year" },
              { value: "4th", label: "4th Year" },
            ],
          },
          {
            name: "department",
            label: "Department",
            type: "text",
          },
          {
            name: "description",
            label: "Description",
            type: "multiline",
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
        <DialogTitle>Filter Subjects</DialogTitle>
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
                <MenuItem value="lecture">Lecture</MenuItem>
                <MenuItem value="laboratory">Laboratory</MenuItem>
                <MenuItem value="both">Both</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Semester</InputLabel>
              <Select
                value={filters.semester}
                label="Semester"
                onChange={(e) => handleFilterChange('semester', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="1st">1st Semester</MenuItem>
                <MenuItem value="2nd">2nd Semester</MenuItem>
                <MenuItem value="3rd">3rd Semester</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Year Level</InputLabel>
              <Select
                value={filters.year_level}
                label="Year Level"
                onChange={(e) => handleFilterChange('year_level', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="1st">1st Year</MenuItem>
                <MenuItem value="2nd">2nd Year</MenuItem>
                <MenuItem value="3rd">3rd Year</MenuItem>
                <MenuItem value="4th">4th Year</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Department</InputLabel>
              <Select
                value={filters.department}
                label="Department"
                onChange={(e) => handleFilterChange('department', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="College of Information Technology">College of Information Technology</MenuItem>
                <MenuItem value="College of Engineering">College of Engineering</MenuItem>
                <MenuItem value="College of Education">College of Education</MenuItem>
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
        <DialogTitle>Sort Subjects</DialogTitle>
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
                Subject Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'code' ? 'contained' : 'outlined'}
                onClick={() => handleSort('code')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Subject Code {sortField === 'code' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'type' ? 'contained' : 'outlined'}
                onClick={() => handleSort('type')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Type {sortField === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                variant={sortField === 'semester' ? 'contained' : 'outlined'}
                onClick={() => handleSort('semester')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Semester {sortField === 'semester' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'year_level' ? 'contained' : 'outlined'}
                onClick={() => handleSort('year_level')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Year Level {sortField === 'year_level' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'department' ? 'contained' : 'outlined'}
                onClick={() => handleSort('department')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Department {sortField === 'department' && (sortOrder === 'asc' ? '↑' : '↓')}
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
          setSelectedSubject(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon color="primary" />
            <Typography variant="h6">Subject Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSubject && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="h5" gutterBottom>
                      {selectedSubject.name}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      {selectedSubject.code}
                    </Typography>
                    <Chip
                      label={selectedSubject.type}
                      color={selectedSubject.type === "both" ? "primary" : selectedSubject.type === "lecture" ? "success" : "warning"}
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
                      {selectedSubject.department}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {selectedSubject.description || "No description available"}
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
                        {selectedSubject.units}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        total units
                      </Typography>
                    </Box>
                    {selectedSubject.type === "both" && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Lecture: {selectedSubject.lecture_units} units
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Laboratory: {selectedSubject.laboratory_units} units
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Schedule
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1">
                        {selectedSubject.semester} Semester
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        •
                      </Typography>
                      <Typography variant="body1">
                        {selectedSubject.year_level} Year
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Instructors
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedSubject.instructors.map((instructor, index) => (
                        <Chip
                          key={index}
                          label={instructor}
                          size="small"
                          sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}
                        />
                      ))}
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
              setSelectedSubject(null);
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              if (selectedSubject) {
                setModalSubject(selectedSubject);
                setModalOpen(true);
                setViewDialogOpen(false);
              }
            }}
          >
            Edit Subject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
