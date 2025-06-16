import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import React from "react";

interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: "active" | "inactive";
  totalStudents: number;
  totalSections: number;
}

interface Department {
  id: string;
  name: string;
  code: string;
  headOfDepartment: string;
  description?: string;
  courseOfferings: Course[];
  status: "active" | "inactive";
  totalInstructors: number;
}

interface DepartmentViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department;
}

export function DepartmentViewDialog({ open, onOpenChange, department }: DepartmentViewDialogProps) {
  if (!department) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-full max-h-[80vh] overflow-y-auto bg-white/90 border border-blue-100 shadow-lg rounded-xl px-2 py-2 mx-2 my-1 sm:max-w-[500px] sm:px-4 sm:py-4 sm:mx-4 sm:my-1 md:max-w-[650px] md:px-6 md:py-6 md:mx-6 md:my-1 lg:max-w-[800px] lg:px-8 lg:py-8 lg:mx-8 lg:my-1">
        <DialogHeader>
          <DialogTitle className="text-blue-900 text-xl font-bold flex items-center gap-2">
            Department Details
            <Badge variant={department.status === "active" ? "success" : "destructive"} className="ml-2">
              {department.status.charAt(0).toUpperCase() + department.status.slice(1)}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] mt-4">
          <div className="space-y-4">
            <div>
              <div className="text-xs text-blue-700 font-semibold mb-1">Department Name</div>
              <div className="text-lg font-bold text-blue-900">{department.name}</div>
            </div>
            <div>
              <div className="text-xs text-blue-700 font-semibold mb-1">Department Code</div>
              <div className="text-base text-blue-800 font-mono">{department.code}</div>
            </div>
            <div>
              <div className="text-xs text-blue-700 font-semibold mb-1">Head of Department</div>
              <div className="text-base text-blue-800">{department.headOfDepartment || <span className="italic text-gray-400">Not Assigned</span>}</div>
            </div>
            <div>
              <div className="text-xs text-blue-700 font-semibold mb-1">Description</div>
              <div className="text-base text-blue-800">{department.description || <span className="italic text-gray-400">No description</span>}</div>
            </div>
            <div>
              <div className="text-xs text-blue-700 font-semibold mb-1">Total Instructors</div>
              <div className="text-base text-blue-800">{department.totalInstructors}</div>
            </div>
            <div>
              <div className="text-xs text-blue-700 font-semibold mb-1">Courses Offered</div>
              {department.courseOfferings.length === 0 ? (
                <div className="italic text-gray-400">No courses</div>
              ) : (
                <ul className="list-disc pl-5 space-y-1">
                  {department.courseOfferings.map(course => (
                    <li key={course.id} className="text-blue-800">
                      <span className="font-semibold">{course.name}</span> <span className="text-xs text-blue-500 font-mono">({course.code})</span>
                      <span className="ml-2 text-xs text-gray-500">{course.status === "active" ? "Active" : "Inactive"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-32 border border-blue-300 text-blue-500">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 