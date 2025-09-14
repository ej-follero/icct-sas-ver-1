"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchableSelect, { MultiSearchableSelectSearch as MultiSearchableSelect } from "@/components/reusable/Search/SearchableSelect";
import { CheckCircle, X, Info } from "lucide-react";

type ManualAttendancePayload = {
  entityType: "student" | "instructor";
  entityId: number;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  subjectSchedId?: number | null;
  timestamp?: string;
  notes?: string;
};

interface ManualAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEntityType?: "student" | "instructor";
  defaultEntityId?: number;
  defaultSubjectSchedId?: number | null;
  onSuccess?: () => void;
}

export function ManualAttendanceDialog({
  open,
  onOpenChange,
  defaultEntityType = "instructor",
  defaultEntityId,
  defaultSubjectSchedId = null,
  onSuccess,
}: ManualAttendanceDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [entityType, setEntityType] = useState<"student" | "instructor">(defaultEntityType);
  const [entityId, setEntityId] = useState<string>(defaultEntityId ? String(defaultEntityId) : "");
  const [status, setStatus] = useState<ManualAttendancePayload["status"]>("PRESENT");
  const [subjectSchedId, setSubjectSchedId] = useState<string>(defaultSubjectSchedId ? String(defaultSubjectSchedId) : "");
  const [timestamp, setTimestamp] = useState<string>(() => new Date().toISOString().slice(0, 16)); // yyyy-MM-ddTHH:mm
  const [notes, setNotes] = useState<string>("");

  const isValid = useMemo(() => {
    return entityId.trim().length > 0 && status !== undefined;
  }, [entityId, status]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const payload: ManualAttendancePayload = {
        entityType,
        entityId: Number(entityId),
        status,
        subjectSchedId: subjectSchedId ? Number(subjectSchedId) : undefined,
        timestamp: timestamp ? new Date(timestamp).toISOString() : undefined,
        notes: notes || undefined,
      };

      const res = await fetch("/api/attendance/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to save manual attendance (HTTP ${res.status})`);
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save manual attendance");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="max-w-full w-full max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm border border-blue-200 shadow-2xl rounded-2xl p-0 mx-2 my-1 sm:max-w-[700px] sm:mx-4 sm:my-1 md:max-w-[800px] md:mx-6 md:my-1 flex flex-col h-full">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6 relative flex-shrink-0">
          <div className="flex items-start gap-4 pr-12">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-white text-2xl font-bold">Manual Attendance</DialogTitle>
              <p className="text-white/80 text-sm">Record a manual attendance entry for a student or instructor</p>
            </div>
          </div>
          <div className="absolute top-6 right-6">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full hover:bg-white/20 text-white"
              onClick={() => onOpenChange(false)}
              aria-label="Close dialog"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-6 space-y-4">
          <div className="grid gap-2">
            <Label>Entity Type</Label>
            <Select value={entityType} onValueChange={(v) => setEntityType(v as "student" | "instructor")}> 
              <SelectTrigger>
                <SelectValue placeholder="Select entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>{entityType === "student" ? "Student" : "Instructor"}</Label>
            <SearchableSelect
              options={[]}
              value={entityId}
              onChange={(v) => setEntityId(v)}
              placeholder={`Search ${entityType} by name or ID...`}
              asyncSearch={async (query) => {
                try {
                  const res = await fetch(`/api/search/entities?type=${entityType}&q=${encodeURIComponent(query)}&limit=10`);
                  if (!res.ok) return [];
                  const data = await res.json();
                  return Array.isArray(data.items) ? data.items : [];
                } catch {
                  return [];
                }
              }}
            />
            <div className="text-xs text-muted-foreground">Tip: Start typing to search. You can still paste a numeric ID.</div>
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ManualAttendancePayload["status"]) }>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
                <SelectItem value="EXCUSED">Excused</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Subject Schedule (optional)</Label>
            <SearchableSelect
              options={[]}
              value={subjectSchedId}
              onChange={(v) => setSubjectSchedId(v)}
              placeholder="Search by subject code or schedule ID..."
              asyncSearch={async (query) => {
                try {
                  const res = await fetch(`/api/search/schedules?q=${encodeURIComponent(query)}&limit=10`);
                  if (!res.ok) return [];
                  const data = await res.json();
                  return Array.isArray(data.items) ? data.items : [];
                } catch {
                  return [];
                }
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label>Timestamp</Label>
            <Input type="datetime-local" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>

          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
        </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-3 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitting} className="bg-blue-600 hover:bg-blue-700 rounded">
            {submitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ManualAttendanceDialog;


