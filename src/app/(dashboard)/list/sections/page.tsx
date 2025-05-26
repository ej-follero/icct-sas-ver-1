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

// Define the section schema
const sectionSchema = z.object({
  sectionId: z.number(),
  sectionName: z.string().min(1, "Section name is required"),
  sectionType: z.enum(["REGULAR", "IRREGULAR", "SUMMER"]),
  sectionCapacity: z.number().min(1, "Capacity must be at least 1"),
  sectionStatus: z.enum(["ACTIVE", "INACTIVE"]),
  yearLevel: z.number().min(1).max(4, "Year level must be between 1 and 4"),
  courseId: z.number().min(1, "Course is required"),
  Course: z.object({
    courseName: z.string(),
  }).optional(),
  totalStudents: z.number().optional(),
  totalSubjects: z.number().optional(),
});

type Section = z.infer<typeof sectionSchema>;

// Update the form schema to match the form fields
const sectionFormSchema = z.object({
  sectionName: z.string().min(1, "Section name is required"),
  sectionType: z.enum(["REGULAR", "IRREGULAR", "SUMMER"]),
  sectionCapacity: z.number().min(1, "Capacity must be at least 1"),
  sectionStatus: z.enum(["ACTIVE", "INACTIVE"]),
  yearLevel: z.string().refine((val) => ["1", "2", "3", "4"].includes(val), {
    message: "Year level must be between 1 and 4",
  }),
  courseId: z.string().refine((val) => ["1", "2", "3"].includes(val), {
    message: "Course is required",
  }),
});

type SectionFormData = z.infer<typeof sectionFormSchema>;

// Mock data - replace with actual API calls later
const initialSections: Section[] = [
  {
    sectionId: 1,
    sectionName: "BSIT 1-A",
    sectionType: "REGULAR",
    sectionCapacity: 40,
    sectionStatus: "ACTIVE",
    yearLevel: 1,
    courseId: 1,
    Course: {
      courseName: "Bachelor of Science in Information Technology"
    },
    totalStudents: 35,
    totalSubjects: 8,
  },
  {
    sectionId: 2,
    sectionName: "BSIT 1-B",
    sectionType: "REGULAR",
    sectionCapacity: 40,
    sectionStatus: "ACTIVE",
    yearLevel: 1,
    courseId: 1,
    Course: {
      courseName: "Bachelor of Science in Information Technology"
    },
    totalStudents: 38,
    totalSubjects: 8,
  },
];

type SortField = 'sectionName' | 'sectionType' | 'sectionCapacity' | 'yearLevel' | 'sectionStatus';
type SortOrder = 'asc' | 'desc';

export default function SectionsPage() {
  const [sections, setSections] = useState(initialSections);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortField, setSortField] = useState<SortField>('sectionName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSection, setModalSection] = useState<Section | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    yearLevel: "all",
    course: "all",
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

  async function handleDeleteSection(id: number) {
    try {
      const response = await fetch(`/api/sections/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete section");
      }

      setSections(sections.filter(section => section.sectionId !== id));
      toast.success("Section deleted successfully");
      setDeleteDialogOpen(false);
      setSectionToDelete(null);
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error("Failed to delete section");
    }
  }

  const handleExportToCSV = () => {
    const headers = ["Section Name", "Type", "Capacity", "Status", "Year Level", "Course", "Total Students", "Total Subjects"];
    const csvContent = [
      headers.join(","),
      ...sections.map(section => [
        section.sectionName,
        section.sectionType,
        section.sectionCapacity,
        section.sectionStatus,
        section.yearLevel,
        section.Course?.courseName || "",
        section.totalStudents || 0,
        section.totalSubjects || 0
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sections.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToExcel = () => {
    const headers = ["Section Name", "Type", "Capacity", "Status", "Year Level", "Course", "Total Students", "Total Subjects"];
    const rows = sections.map(section => [
      section.sectionName,
      section.sectionType,
      section.sectionCapacity,
      section.sectionStatus,
      section.yearLevel,
      section.Course?.courseName || "",
      section.totalStudents || 0,
      section.totalSubjects || 0
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sections");
    
    XLSX.writeFile(workbook, "sections.xlsx");
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Sections List", 14, 15);
    
    const headers = ["Section Name", "Type", "Capacity", "Status", "Year Level", "Course"];
    const rows = sections.map(section => [
      section.sectionName,
      section.sectionType,
      section.sectionCapacity.toString(),
      section.sectionStatus,
      section.yearLevel.toString(),
      section.Course?.courseName || ""
    ]);

    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save("sections.pdf");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Sections List</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .print-header { text-align: center; margin-bottom: 20px; }
              .print-header h1 { font-size: 24px; margin: 0; color: #1a1a1a; }
              .print-header p { font-size: 14px; color: #666; margin: 5px 0 0 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #f3f4f6; color: #374151; font-weight: 600; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; }
              td { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937; }
              .section-info { display: flex; align-items: center; gap: 12px; }
              .section-code { background-color: #2563eb; color: white; padding: 8px 12px; border-radius: 8px; font-weight: 600; }
              .section-name { font-weight: 500; }
              .section-code-text { font-size: 12px; color: #6b7280; }
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
              <h1>Sections List</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Section Info</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Year Level</th>
                  <th>Course</th>
                </tr>
              </thead>
              <tbody>
                ${sections.map(section => `
                  <tr>
                    <td>
                      <div class="section-info">
                        <div class="section-code">${section.sectionName.slice(0, 2)}</div>
                        <div>
                          <div class="section-name">${section.sectionName}</div>
                          <div class="section-code-text">${section.Course?.courseName || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td>${section.sectionType}</td>
                    <td>${section.sectionCapacity}</td>
                    <td>${section.sectionStatus}</td>
                    <td>${section.yearLevel}</td>
                    <td>${section.Course?.courseName || ""}</td>
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
      status: "all",
      yearLevel: "all",
      course: "all",
    });
  };

  const filteredSections = useMemo(() => {
    return sections.filter(section => {
      const matchesSearch = section.sectionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          section.Course?.courseName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filters.type === "all" || section.sectionType === filters.type;
      const matchesStatus = filters.status === "all" || section.sectionStatus === filters.status;
      const matchesYearLevel = filters.yearLevel === "all" || section.yearLevel.toString() === filters.yearLevel;
      const matchesCourse = filters.course === "all" || section.Course?.courseName === filters.course;
      
      return matchesSearch && matchesType && matchesStatus && matchesYearLevel && matchesCourse;
    });
  }, [sections, searchTerm, filters]);

  const sortedSections = useMemo(() => {
    return [...filteredSections].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }, [filteredSections, sortField, sortOrder]);

  const paginatedSections = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedSections.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedSections, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedSections.length / itemsPerPage);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 3 }}>
      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box>
              <Typography variant="h5" component="h1" gutterBottom>
                All Sections
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and view all section information
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                size="small"
                placeholder="Search sections..."
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
                  setModalSection(undefined);
                  setModalOpen(true);
                }}
              >
                Add Section
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
                  <TableCell>Section Info</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Year Level</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell align="center" sx={{ width: '120px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSections.map((item) => (
                  <TableRow 
                    key={item.sectionId} 
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
                      <Typography variant="body1">{item.sectionName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.Course?.courseName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.sectionType}
                        color={item.sectionType === "REGULAR" ? "primary" : item.sectionType === "IRREGULAR" ? "warning" : "success"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.sectionCapacity}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.sectionStatus}
                        color={item.sectionStatus === "ACTIVE" ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.yearLevel}</TableCell>
                    <TableCell>{item.Course?.courseName}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedSection(item);
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
                            setModalSection(item);
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
                            setSectionToDelete(item);
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
              {Math.min(currentPage * itemsPerPage, sortedSections.length)} of{" "}
              {sortedSections.length} entries
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
          setSectionToDelete(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Delete Section
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the section "{sectionToDelete?.sectionName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setSectionToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => sectionToDelete && handleDeleteSection(sectionToDelete.sectionId)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Section Form Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (data: SectionFormData) => {
          try {
            const formData = {
              ...data,
              yearLevel: parseInt(data.yearLevel, 10),
              courseId: parseInt(data.courseId, 10),
            };
            const url = modalSection ? `/api/sections/${modalSection.sectionId}` : "/api/sections";
            const method = modalSection ? "PUT" : "POST";
            const response = await fetch(url, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error("Failed to save section");

            if (modalSection) {
              setSections(sections.map(section => 
                section.sectionId === modalSection.sectionId ? { ...section, ...formData } : section
              ));
              toast.success("Section updated successfully");
            } else {
              const newSection = await response.json();
              setSections([...sections, newSection]);
              toast.success("Section created successfully");
            }

            setModalOpen(false);
          } catch (error) {
            console.error("Error saving section:", error);
            toast.error("Failed to save section");
          }
        }}
        title={modalSection ? "Edit Section" : "Add New Section"}
        submitLabel={modalSection ? "Update" : "Add"}
        defaultValues={modalSection ? {
          ...modalSection,
          yearLevel: modalSection.yearLevel.toString(),
          courseId: modalSection.courseId.toString(),
        } : undefined}
        schema={sectionFormSchema}
        fields={[
          {
            name: "sectionName",
            label: "Section Name",
            type: "text",
          },
          {
            name: "sectionType",
            label: "Type",
            type: "select",
            options: [
              { value: "REGULAR", label: "Regular" },
              { value: "IRREGULAR", label: "Irregular" },
              { value: "SUMMER", label: "Summer" },
            ],
          },
          {
            name: "sectionCapacity",
            label: "Capacity",
            type: "number",
          },
          {
            name: "sectionStatus",
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
              { value: "1", label: "1st Year" },
              { value: "2", label: "2nd Year" },
              { value: "3", label: "3rd Year" },
              { value: "4", label: "4th Year" },
            ],
          },
          {
            name: "courseId",
            label: "Course",
            type: "select",
            options: [
              { value: "1", label: "Bachelor of Science in Information Technology" },
              { value: "2", label: "Bachelor of Science in Computer Science" },
              { value: "3", label: "Bachelor of Science in Information Systems" },
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
        <DialogTitle>Filter Sections</DialogTitle>
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
                <MenuItem value="SUMMER">Summer</MenuItem>
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

            <FormControl fullWidth margin="normal">
              <InputLabel>Year Level</InputLabel>
              <Select
                value={filters.yearLevel}
                label="Year Level"
                onChange={(e) => handleFilterChange('yearLevel', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="1">1st Year</MenuItem>
                <MenuItem value="2">2nd Year</MenuItem>
                <MenuItem value="3">3rd Year</MenuItem>
                <MenuItem value="4">4th Year</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Course</InputLabel>
              <Select
                value={filters.course}
                label="Course"
                onChange={(e) => handleFilterChange('course', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="Bachelor of Science in Information Technology">BSIT</MenuItem>
                <MenuItem value="Bachelor of Science in Computer Science">BSCS</MenuItem>
                <MenuItem value="Bachelor of Science in Information Systems">BSIS</MenuItem>
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
        <DialogTitle>Sort Sections</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Sort by:
            </Typography>
            <Stack spacing={1}>
              <Button
                variant={sortField === 'sectionName' ? 'contained' : 'outlined'}
                onClick={() => handleSort('sectionName')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Section Name {sortField === 'sectionName' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'sectionType' ? 'contained' : 'outlined'}
                onClick={() => handleSort('sectionType')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Type {sortField === 'sectionType' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'sectionCapacity' ? 'contained' : 'outlined'}
                onClick={() => handleSort('sectionCapacity')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Capacity {sortField === 'sectionCapacity' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'sectionStatus' ? 'contained' : 'outlined'}
                onClick={() => handleSort('sectionStatus')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Status {sortField === 'sectionStatus' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortField === 'yearLevel' ? 'contained' : 'outlined'}
                onClick={() => handleSort('yearLevel')}
                startIcon={<SortIcon />}
                fullWidth
              >
                Year Level {sortField === 'yearLevel' && (sortOrder === 'asc' ? '↑' : '↓')}
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
          setSelectedSection(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon color="primary" />
            <Typography variant="h6">Section Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSection && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="h5" gutterBottom>
                      {selectedSection.sectionName}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      {selectedSection.Course?.courseName}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip
                        label={selectedSection.sectionType}
                        color={selectedSection.sectionType === "REGULAR" ? "primary" : selectedSection.sectionType === "IRREGULAR" ? "warning" : "success"}
                        size="small"
                      />
                      <Chip
                        label={selectedSection.sectionStatus}
                        color={selectedSection.sectionStatus === "ACTIVE" ? "success" : "error"}
                        size="small"
                      />
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Course
                    </Typography>
                    <Typography variant="body1">
                      {selectedSection.Course?.courseName}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Year Level
                    </Typography>
                    <Typography variant="body1">
                      {selectedSection.yearLevel}
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
                        {selectedSection.sectionCapacity}
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
                      Statistics
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Students
                        </Typography>
                        <Typography variant="body1">
                          {selectedSection.totalStudents || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Subjects
                        </Typography>
                        <Typography variant="body1">
                          {selectedSection.totalSubjects || 0}
                        </Typography>
                      </Box>
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
              setSelectedSection(null);
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              if (selectedSection) {
                setModalSection(selectedSection);
                setModalOpen(true);
                setViewDialogOpen(false);
              }
            }}
          >
            Edit Section
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
