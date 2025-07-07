import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BaseDialog } from "@/components/BaseDialog";

export type DepartmentDialogMode = 'view' | 'edit' | 'delete';

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DepartmentDialogMode;
  department: any | null;
  onSubmit?: (data: any) => void;
  onDelete?: () => void;
  loading?: boolean;
}

export const DepartmentDialog: React.FC<DepartmentDialogProps> = ({
  open,
  onOpenChange,
  mode,
  department,
  onSubmit,
  onDelete,
  loading = false,
}) => {
  if (!department) return null;

  let title = '';
  let content: React.ReactNode = null;
  let footer: React.ReactNode = null;

  if (mode === 'view') {
    title = 'Department Details';
    content = (
      <div className="space-y-4 py-2">
        <div><span className="font-semibold">Name:</span> {department.name}</div>
        <div><span className="font-semibold">Code:</span> {department.code}</div>
        <div><span className="font-semibold">Head of Department:</span> {department.headOfDepartment || 'Not Assigned'}</div>
        <div><span className="font-semibold">Description:</span> {department.description || 'No description available.'}</div>
        <div><span className="font-semibold">Status:</span> <Badge variant={department.status === "active" ? "success" : "destructive"}>{department.status}</Badge></div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div><span className="font-semibold">Total Students:</span> {department.totalStudents || 0}</div>
          <div><span className="font-semibold">Total Courses:</span> {department.courseOfferings?.length || 0}</div>
          <div><span className="font-semibold">Total Instructors:</span> {department.totalInstructors || 0}</div>
        </div>
      </div>
    );
    footer = (
      <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
    );
  } else if (mode === 'edit') {
    title = 'Edit Department';
    content = (
      <form
        onSubmit={e => {
          e.preventDefault();
          if (onSubmit) {
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            onSubmit({ ...department, ...data });
          }
        }}
        className="space-y-4"
      >
        <div>
          <label className="block font-medium mb-1">Name</label>
          <input name="name" defaultValue={department.name} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block font-medium mb-1">Code</label>
          <input name="code" defaultValue={department.code} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block font-medium mb-1">Head of Department</label>
          <input name="headOfDepartment" defaultValue={department.headOfDepartment} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea name="description" defaultValue={department.description} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    );
  } else if (mode === 'delete') {
    title = 'Delete Department';
    content = (
      <div>Are you sure you want to delete the department "{department.name}"? This action cannot be undone.</div>
    );
    footer = (
      <>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button variant="destructive" onClick={onDelete} disabled={loading}>{loading ? 'Deleting...' : 'Delete'}</Button>
      </>
    );
  }

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={footer}
      className="max-w-[500px]"
    >
      {content}
    </BaseDialog>
  );
}; 