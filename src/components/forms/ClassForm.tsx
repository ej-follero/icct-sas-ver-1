"use client";

import { useState } from "react";
import { TextField, Button, Grid, MenuItem, FormControl, InputLabel, Select } from "@mui/material";

interface ClassFormProps {
  type: "create" | "update";
  data?: {
    id: number;
    name: string;
    code: string;
    capacity: number;
    grade: number;
    supervisor: string;
    status: "active" | "inactive";
  };
}

const ClassForm = ({ type, data }: ClassFormProps) => {
  const [formData, setFormData] = useState({
    name: data?.name || "",
    code: data?.code || "",
    capacity: data?.capacity || 40,
    grade: data?.grade || 1,
    supervisor: data?.supervisor || "",
    status: data?.status || "active",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Class Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Class Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Capacity"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
            required
            inputProps={{ min: 1 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Grade Level"
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value) })}
            required
            inputProps={{ min: 1, max: 4 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Supervisor"
            value={formData.supervisor}
            onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              label="Status"
              onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
              required
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <div className="flex justify-end gap-3">
        <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            // TODO: Handle cancel
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
        >
          {type === "create" ? "Create Class" : "Update Class"}
        </Button>
      </div>
    </form>
  );
};

export default ClassForm; 