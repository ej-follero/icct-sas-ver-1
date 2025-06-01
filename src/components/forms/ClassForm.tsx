"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log(formData);
  };

  const handleCancel = () => {
    // TODO: Implement cancel logic (e.g., close modal or reset form)
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Class Name */}
        <div className="flex flex-col">
          <Label htmlFor="name">Class Name</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
        </div>

        {/* Class Code */}
        <div className="flex flex-col">
          <Label htmlFor="code">Class Code</Label>
          <Input
            id="code"
            type="text"
            value={formData.code}
            onChange={(e) => handleChange("code", e.target.value)}
            required
          />
        </div>

        {/* Capacity */}
        <div className="flex flex-col">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            min={1}
            value={formData.capacity}
            onChange={(e) => handleChange("capacity", Number(e.target.value))}
            required
          />
        </div>

        {/* Grade Level */}
        <div className="flex flex-col">
          <Label htmlFor="grade">Grade Level</Label>
          <Input
            id="grade"
            type="number"
            min={1}
            max={4}
            value={formData.grade}
            onChange={(e) => handleChange("grade", Number(e.target.value))}
            required
          />
        </div>

        {/* Supervisor */}
        <div className="flex flex-col">
          <Label htmlFor="supervisor">Supervisor</Label>
          <Input
            id="supervisor"
            type="text"
            value={formData.supervisor}
            onChange={(e) => handleChange("supervisor", e.target.value)}
            required
          />
        </div>

        {/* Status */}
        <div className="flex flex-col">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleChange("status", value as "active" | "inactive")}
            required
          >
            <SelectTrigger id="status" className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleCancel} type="button">
          Cancel
        </Button>
        <Button type="submit" variant="default">
          {type === "create" ? "Create Class" : "Update Class"}
        </Button>
      </div>
    </form>
  );
};

export default ClassForm;