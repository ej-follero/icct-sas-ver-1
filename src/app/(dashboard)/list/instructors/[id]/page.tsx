"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  IconButton,
  Breadcrumbs,
  Link,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Badge as BadgeIcon,
  AccessTime as AccessTimeIcon,
  QrCode as QrCodeIcon,
} from "@mui/icons-material";
import { UserGender, InstructorType, Status } from "@/types/enums";
import { Teacher } from "@/types/teacher";
import { instructorsData } from "@/lib/data";
import { toast } from "sonner";

export default function InstructorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [instructor, setInstructor] = useState<Teacher | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    // In a real application, this would be an API call
    const foundInstructor = instructorsData.find(
      (i) => i.instructorId === Number(params.id)
    );
    setInstructor(foundInstructor || null);
  }, [params.id]);

  const handleDelete = () => {
    // In a real application, this would be an API call
    toast.success("Instructor deleted successfully");
    router.push("/list/instructors");
  };

  if (!instructor) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Instructor not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => router.push("/list/instructors")}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <ArrowBackIcon sx={{ mr: 0.5 }} fontSize="small" />
          Back to Instructors
        </Link>
        <Typography color="text.primary">Instructor Details</Typography>
      </Breadcrumbs>

      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '2rem',
              }}
            >
              {instructor.firstName.charAt(0)}{instructor.lastName.charAt(0)}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" gutterBottom>
                {instructor.lastName}, {instructor.firstName} {instructor.middleName || ''} {instructor.suffix || ''}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                ID: {instructor.instructorId}
              </Typography>
              <Chip
                label={instructor.status}
                color={instructor.status === Status.ACTIVE ? "success" : "error"}
                size="small"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => router.push(`/list/instructors/${instructor.instructorId}/edit`)}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Content */}
          <Grid container spacing={3}>
            {/* Personal Information */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon color="primary" />
                  Personal Information
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Full Name
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {instructor.firstName} {instructor.middleName || ''} {instructor.lastName} {instructor.suffix || ''}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Gender
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {instructor.gender}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Instructor Type
                  </Typography>
                  <Typography variant="body1">
                    {instructor.instructorType}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon color="primary" />
                  Contact Information
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Email Address
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {instructor.email}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Phone Number
                  </Typography>
                  <Typography variant="body1">
                    {instructor.phoneNumber}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Department Information */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon color="primary" />
                  Department Information
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Department
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {instructor.departmentName}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Department ID
                  </Typography>
                  <Typography variant="body1">
                    {instructor.departmentId}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* RFID Information */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <QrCodeIcon color="primary" />
                  RFID Information
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    RFID Tag
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {instructor.rfidTag}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Tag Number
                  </Typography>
                  <Typography variant="body1">
                    {instructor.rfidtagNumber}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Additional Information */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon color="primary" />
                  Additional Information
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Created At
                      </Typography>
                      <Typography variant="body1">
                        {instructor.createdAt.toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body1">
                        {instructor.updatedAt.toLocaleDateString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Delete Instructor
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the instructor "{instructor.firstName} {instructor.lastName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 