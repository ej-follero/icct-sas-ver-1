"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  CircularProgress,
  Tooltip,
  Checkbox,
  ButtonGroup,
  Divider as MuiDivider,
  useTheme,
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
import { StatusBadge } from "@/components/ui/status-badge";
import { DepartmentForm } from "@/components/forms/DepartmentForm";

interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: "active" | "inactive";
  totalStudents: number;
  totalSections: number;
}

interface Instructor {
  id: string;
  name: string;
}

// Update the department schema to match the database
const departmentSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Department name is required"),
  code: z.string().min(1, "Department code is required"),
  headOfDepartment: z.string().min(1, "Head of Department is required"),
  description: z.string().optional(),
  courseOfferings: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, "Course name is required"),
    code: z.string().min(1, "Course code is required"),
    description: z.string().optional(),
    status: z.enum(["active", "inactive"]),
    totalStudents: z.number(),
    totalSections: z.number()
  })),
  status: z.enum(["active", "inactive"]),
  totalInstructors: z.number(),
});

type Department = z.infer<typeof departmentSchema>;

type SortField = 'name' | 'code' | 'totalInstructors' | 'totalCourses';
type SortOrder = 'asc' | 'desc';

export default function DepartmentListPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDepartment, setModalDepartment] = useState<Department | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    totalInstructors: "all",
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [columnStatusFilter, setColumnStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/departments');
        if (!response.ok) {
          throw new Error('Failed to fetch departments');
        }
        const data = await response.json();
        console.log('Fetched departments data:', data); // Debug log
        setDepartments(data);
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast.error('Failed to fetch departments');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // Fetch instructors
  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const response = await fetch('/api/instructors');
        if (!response.ok) {
          throw new Error('Failed to fetch instructors');
        }
        const data = await response.json();
        const formattedInstructors = data.map((instructor: any) => ({
          id: instructor.instructorId.toString(),
          name: `${instructor.firstName} ${instructor.lastName}`
        }));
        setInstructors(formattedInstructors);
      } catch (error) {
        console.error('Error fetching instructors:', error);
        toast.error('Failed to fetch instructors');
      }
    };

    fetchInstructors();
  }, []);

  // Debounce effect for searchTerm
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [searchTerm]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, department: Department) => {
    setAnchorEl(event.currentTarget);
    setSelectedDepartment(department);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDepartment(null);
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

  // Handle form submission
  const handleSubmit = async (formData: any) => {
    try {
      const url = modalDepartment 
        ? `/api/departments/${modalDepartment.id}`
        : '/api/departments';
      
      const method = modalDepartment ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save department');
      }

      const savedDepartment = await response.json();
      
      if (modalDepartment) {
        setDepartments(departments.map(d => 
          d.id === savedDepartment.id ? savedDepartment : d
        ));
      } else {
        setDepartments([...departments, savedDepartment]);
      }

      setModalOpen(false);
      toast.success(`Department ${modalDepartment ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Error saving department:', error);
      toast.error(`Failed to ${modalDepartment ? 'update' : 'create'} department`);
    }
  };

  // Handle view department
  const handleViewDepartment = async (id: string) => {
    try {
      const response = await fetch(`/api/departments/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch department details');
      }
      const data = await response.json();
      setSelectedDepartment(data);
      setViewDialogOpen(true);
    } catch (error) {
      console.error('Error fetching department details:', error);
      toast.error('Failed to fetch department details');
    }
  };

  // Handle delete department
  async function handleDeleteDepartment(id: string) {
    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete department");
      }

      setDepartments(departments.filter(dept => dept.id !== id));
      toast.success("Department deleted successfully");
      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    } catch (error) {
      console.error("Error deleting department:", error);
      toast.error("Failed to delete department");
    }
  }

  const handleExportToCSV = () => {
    const headers = ["Department Name", "Code", "Description", "Total Instructors", "Status"];
    const csvContent = [
      headers.join(","),
      ...departments.map(dept => [
        dept.name,
        dept.code,
        dept.description || '',
        dept.totalInstructors,
        dept.status
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "departments.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToExcel = () => {
    const headers = ["Department Name", "Code", "Description", "Total Instructors", "Status"];
    const rows = departments.map(dept => [
      dept.name,
      dept.code,
      dept.description || '',
      dept.totalInstructors,
      dept.status
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Departments");
    
    XLSX.writeFile(workbook, "departments.xlsx");
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Departments List", 14, 15);
    
    const headers = ["Department Name", "Code", "Description", "Instructors", "Status"];
    const rows = departments.map(dept => [
      dept.name,
      dept.code,
      dept.description || '',
      dept.totalInstructors.toString(),
      dept.status
    ]);

    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save("departments.pdf");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Departments List</title>
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
              .dept-info { display: flex; align-items: center; gap: 12px; }
              .dept-code { background-color: #2563eb; color: white; padding: 8px 12px; border-radius: 8px; font-weight: 600; }
              .dept-name { font-weight: 500; }
              .dept-code-text { font-size: 12px; color: #6b7280; }
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
              <h1>Departments List</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Department Info</th>
                  <th>Description</th>
                  <th>Total Instructors</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${departments.map(dept => `
                  <tr>
                    <td>
                      <div class="dept-info">
                        <div class="dept-code">${dept.code.slice(0, 2)}</div>
                        <div>
                          <div class="dept-name">${dept.name}</div>
                          <div class="dept-code-text">${dept.code}</div>
                        </div>
                      </div>
                    </td>
                    <td>${dept.description || 'No description'}</td>
                    <td>${dept.totalInstructors}</td>
                    <td class="status-${dept.status}">
                      <StatusBadge status={dept.status.toLowerCase() as 'active' | 'inactive'} />
                    </td>
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
      totalInstructors: "all",
    });
  };

  const filteredAndSortedDepartments = useMemo(() => {
    let result = [...departments];

    // Debounced search filter
    if (debouncedSearch) {
      result = result.filter(dept =>
        dept.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        dept.code.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Column-specific status filter
    if (columnStatusFilter !== 'all') {
      result = result.filter(dept => dept.status === columnStatusFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      if (sortField === 'totalCourses') {
        aValue = a.courseOfferings?.length || 0;
        bValue = b.courseOfferings?.length || 0;
      } else {
        aValue = a[sortField as keyof Department] as string | number;
        bValue = b[sortField as keyof Department] as string | number;
      }
      const modifier = sortOrder === 'asc' ? 1 : -1;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * modifier;
      }
      return ((aValue as number) - (bValue as number)) * modifier;
    });

    return result;
  }, [departments, debouncedSearch, columnStatusFilter, sortField, sortOrder]);

  const paginatedDepartments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedDepartments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedDepartments, currentPage, itemsPerPage]);

  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchorEl(null);
  };

  // Update the edit button click handler
  const handleEditClick = (department: Department) => {
    console.log('Editing department:', department);
    setModalDepartment(department);
    setModalOpen(true);
  };

  // Update the view dialog content
  const renderViewDialog = () => {
    console.log('Selected department in view dialog:', selectedDepartment); // Debug log
    return (
      <Dialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedDepartment(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon color="primary" />
            <Typography variant="h6">Department Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDepartment && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="h5" gutterBottom>
                      {selectedDepartment.name}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      {selectedDepartment.code}
                    </Typography>
                    <StatusBadge 
                      status={selectedDepartment.status.toLowerCase() as 'active' | 'inactive'} 
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {selectedDepartment.description || "No description available"}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Total Instructors
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h4" color="primary">
                        {selectedDepartment.totalInstructors}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        instructors
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Status
                    </Typography>
                    <StatusBadge 
                      status={selectedDepartment.status.toLowerCase() as 'active' | 'inactive'} 
                      sx={{ mt: 1 }}
                    />
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
              setSelectedDepartment(null);
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              if (selectedDepartment) {
                setModalDepartment(selectedDepartment);
                setModalOpen(true);
                setViewDialogOpen(false);
              }
            }}
          >
            Edit Department
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Update the filter dialog content
  const renderFilterDialog = () => (
    <Dialog
      open={filterDialogOpen}
      onClose={() => setFilterDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Filter Departments</DialogTitle>
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
              <MenuItem value="active">
                <StatusBadge status="active" />
              </MenuItem>
              <MenuItem value="inactive">
                <StatusBadge status="inactive" />
              </MenuItem>
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
  );

  // Update the sort dialog content
  const renderSortDialog = () => (
    <Dialog
      open={sortDialogOpen}
      onClose={() => setSortDialogOpen(false)}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Sort Departments</DialogTitle>
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
              Department Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
            <Button
              variant={sortField === 'code' ? 'contained' : 'outlined'}
              onClick={() => handleSort('code')}
              startIcon={<SortIcon />}
              fullWidth
            >
              Department Code {sortField === 'code' && (sortOrder === 'asc' ? '↑' : '↓')}
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
  );

  // Refactor the modal rendering
  const renderModal = () => (
    <DepartmentForm
      open={modalOpen}
      onOpenChange={setModalOpen}
      initialData={modalDepartment}
      instructors={instructors}
      onSuccess={() => {
        setModalOpen(false);
        // Optionally refresh department list here
      }}
    />
  );

  const isAllSelected = paginatedDepartments.length > 0 && paginatedDepartments.every(d => selectedIds.includes(d.id));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedDepartments.map(d => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectedDepartments = departments.filter(d => selectedIds.includes(d.id));
  const canBulkDelete = selectedDepartments.length > 0 && selectedDepartments.every(d => (d.courseOfferings?.length === 0 && d.totalInstructors === 0));

  const handleBulkDelete = () => {
    // Confirm bulk delete
    if (!window.confirm('Are you sure you want to delete the selected departments? This action cannot be undone.')) return;
    selectedDepartments.forEach(async (dept) => {
      await handleDeleteDepartment(dept.id);
    });
    setSelectedIds([]);
  };

  const handleBulkExport = () => {
    // Export selected departments as CSV
    const headers = ["Department Name", "Code", "Description", "Total Instructors", "Status"];
    const csvContent = [
      headers.join(","),
      ...selectedDepartments.map(dept => [
        dept.name,
        dept.code,
        dept.description || '',
        dept.totalInstructors,
        dept.status
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "departments_selected.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 3 }}>
      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h5" component="h1" gutterBottom>
                All Departments
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and view all department information
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                flexWrap: 'wrap',
                mt: 1,
                mb: 2,
                '@media (max-width: 600px)': {
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: 1,
                },
              }}
            >
              <TextField
                size="small"
                variant="outlined"
                placeholder="Search departments..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} fontSize="small" />,
                }}
                sx={{ minWidth: 240, background: 'white', flex: 1, maxWidth: 320 }}
                inputProps={{ 'aria-label': 'Search departments' }}
              />
              <Tooltip title="Export Departments" arrow>
                <IconButton
                  onClick={handleExportMenuOpen}
                  sx={{ color: 'primary.main', ml: 0.5, mr: 0.5, p: 1 }}
                  size="medium"
                  aria-label="Export Departments"
                >
                  <FileDownloadIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={exportMenuAnchorEl}
                open={Boolean(exportMenuAnchorEl)}
                onClose={handleExportMenuClose}
              >
                <MenuItem onClick={() => { handleExportToCSV(); handleExportMenuClose(); }}>
                  Export as CSV
                </MenuItem>
                <MenuItem onClick={() => { handleExportToExcel(); handleExportMenuClose(); }}>
                  Export as Excel
                </MenuItem>
                <MenuItem onClick={() => { handleExportToPDF(); handleExportMenuClose(); }}>
                  Export as PDF
                </MenuItem>
              </Menu>
              <Tooltip title="Print Departments" arrow>
                <IconButton
                  onClick={handlePrint}
                  sx={{ color: 'primary.main', ml: 0.5, mr: 0.5, p: 1 }}
                  size="medium"
                  aria-label="Print Departments"
                >
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Filter Departments" arrow>
                <IconButton
                  onClick={() => setFilterDialogOpen(true)}
                  sx={{ color: 'primary.main', ml: 0.5, mr: 0.5, p: 1 }}
                  size="medium"
                  aria-label="Filter Departments"
                >
                  <FilterIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Sort Departments" arrow>
                <IconButton
                  onClick={() => setSortDialogOpen(true)}
                  sx={{ color: 'primary.main', ml: 0.5, mr: 0.5, p: 1 }}
                  size="medium"
                  aria-label="Sort Departments"
                >
                  <SortIcon />
                </IconButton>
              </Tooltip>
              <Box sx={{ width: 16, display: { xs: 'none', sm: 'block' } }} />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => { setModalDepartment(undefined); setModalOpen(true); }}
                sx={{ minWidth: 160, fontWeight: 600 }}
                aria-label="Add Department"
              >
                Add Department
              </Button>
            </Box>
          </Box>

          {/* Table */}
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: 'rgba(25, 118, 210, 0.2)',
                  '& .MuiTableCell-head': {
                    color: 'text.primary',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    padding: '12px 16px',
                  }
                }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={isIndeterminate}
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      inputProps={{ 'aria-label': 'Select all departments' }}
                    />
                  </TableCell>
                  <TableCell
                    sx={{ cursor: 'pointer', outline: 'none' }}
                    role="button"
                    tabIndex={0}
                    aria-label="Sort by Department Name"
                    aria-pressed={sortField === 'name'}
                    onClick={() => handleSort('name')}
                    onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') handleSort('name'); }}
                  >
                    Department Name {sortField === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </TableCell>
                  <TableCell
                    sx={{ cursor: 'pointer', outline: 'none' }}
                    role="button"
                    tabIndex={0}
                    aria-label="Sort by Code"
                    aria-pressed={sortField === 'code'}
                    onClick={() => handleSort('code')}
                    onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') handleSort('code'); }}
                  >
                    Code {sortField === 'code' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </TableCell>
                  <TableCell>Head of Department</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell
                    sx={{ cursor: 'pointer', outline: 'none' }}
                    role="button"
                    tabIndex={0}
                    aria-label="Sort by Total Courses"
                    aria-pressed={sortField === 'totalCourses'}
                    onClick={() => handleSort('totalCourses')}
                    onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') handleSort('totalCourses'); }}
                  >
                    Total Courses
                  </TableCell>
                  <TableCell
                    sx={{ cursor: 'pointer', outline: 'none' }}
                    role="button"
                    tabIndex={0}
                    aria-label="Sort by Total Instructors"
                    aria-pressed={sortField === 'totalInstructors'}
                    onClick={() => handleSort('totalInstructors')}
                    onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') handleSort('totalInstructors'); }}
                  >
                    Total Instructors {sortField === 'totalInstructors' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Status
                      <FormControl size="small" sx={{ minWidth: 90 }}>
                        <Select
                          value={columnStatusFilter}
                          onChange={e => setColumnStatusFilter(e.target.value)}
                          displayEmpty
                          sx={{ fontSize: '0.85rem', height: 32 }}
                          inputProps={{ 'aria-label': 'Filter by status' }}
                        >
                          <MenuItem value="all">All</MenuItem>
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ width: '120px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary', fontSize: '1.1rem' }}>
                      No departments found. Try adjusting your filter or search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDepartments.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      hover
                      sx={{
                        backgroundColor: idx % 2 === 0 ? 'background.paper' : 'action.hover',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                        '& .MuiTableCell-root': {
                          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                        }
                      }}
                      selected={selectedIds.includes(item.id)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleSelectRow(item.id)}
                          inputProps={{ 'aria-label': `Select department ${item.name}` }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {item.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {item.headOfDepartment ? (
                          <Typography variant="body2">{item.headOfDepartment}</Typography>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>Not Assigned</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={item.description || 'No description'} arrow>
                          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                            {item.description || 'No description'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.courseOfferings?.length || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.totalInstructors || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusBadge 
                          status={item.status.toLowerCase() as 'active' | 'inactive'} 
                          sx={{ minWidth: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                          <Tooltip title="View Department" arrow>
                            <IconButton
                              size="small"
                              aria-label="View Department"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedDepartment(item);
                                setViewDialogOpen(true);
                              }}
                              sx={{ color: "primary.main" }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Department" arrow>
                            <IconButton
                              size="small"
                              aria-label="Edit Department"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleEditClick(item);
                              }}
                              sx={{ color: "info.main" }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title={
                              item.courseOfferings?.length > 0 || item.totalInstructors > 0
                                ? "Cannot delete: Department has linked courses or instructors."
                                : "Delete Department"
                            }
                            arrow
                          >
                            <span>
                              <IconButton
                                size="small"
                                aria-label="Delete Department"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setDepartmentToDelete(item);
                                  setDeleteDialogOpen(true);
                                }}
                                sx={{ color: "error.main" }}
                                disabled={item.courseOfferings?.length > 0 || item.totalInstructors > 0}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1, mb: 2, mt: 2 }}>
              <Typography variant="subtitle1">{selectedIds.length} selected</Typography>
              <Button
                variant="contained"
                color="error"
                disabled={!canBulkDelete}
                onClick={handleBulkDelete}
              >
                Delete Selected
              </Button>
              <Button
                variant="outlined"
                onClick={handleBulkExport}
              >
                Export Selected
              </Button>
              {/* Add more bulk actions here if needed */}
            </Box>
          )}

          {/* Pagination */}
          <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Page {currentPage} of {Math.ceil(filteredAndSortedDepartments.length / itemsPerPage)}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Items per page</InputLabel>
                <Select
                  value={itemsPerPage}
                  label="Items per page"
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                  {[5, 10, 20, 50].map((num) => (
                    <MenuItem key={num} value={num}>{num}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Pagination
                count={Math.ceil(filteredAndSortedDepartments.length / itemsPerPage)}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDepartmentToDelete(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Delete Department
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the department "{departmentToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setDepartmentToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => departmentToDelete && handleDeleteDepartment(departmentToDelete.id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {renderFilterDialog()}
      {renderSortDialog()}
      {renderViewDialog()}
      {renderModal()}
    </Box>
  );
} 