import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/reusable/Search/SearchableSelect';
import { toast } from 'sonner';
import { CalendarDays, X } from 'lucide-react';

interface AddStudentClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStudentId?: number;
}

export function AddStudentClassDialog({ open, onOpenChange, defaultStudentId }: AddStudentClassDialogProps) {
  const [studentId, setStudentId] = useState<string>(defaultStudentId ? String(defaultStudentId) : '');
  const [scheduleId, setScheduleId] = useState<string>('');
  const [schedules, setSchedules] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const loadSchedules = async () => {
      try {
        const res = await fetch('/api/schedules?page=1&pageSize=100');
        if (!res.ok) throw new Error('Failed to load schedules');
        const data = await res.json();
        const rows = data?.data || [];
        const options = rows.map((r: any) => ({
          value: String(r.subjectSchedId || r.subjectSchedId || r.subjectSchedId),
          label: `${r.subject?.subjectCode || r.subjectCode} • ${r.section?.sectionName || r.section} • ${r.day} ${r.startTime}-${r.endTime}`
        }));
        setSchedules([{ value: 'all', label: 'Select class...' }, ...options]);
      } catch (e) {
        console.error(e);
        setSchedules([{ value: 'all', label: 'No classes found' }]);
      }
    };
    loadSchedules();
  }, [open]);

  const handleAdd = async () => {
    if (!studentId || !scheduleId || scheduleId === 'all') {
      toast.error('Student ID and Class are required');
      return;
    }
    try {
      setLoading(true);
      // Resolve student identifier (accept numeric ID or name)
      let resolvedId: number | null = null;
      if (/^\d+$/.test(studentId)) {
        resolvedId = Number(studentId);
      } else {
        try {
          const sres = await fetch(`/api/search/entities?type=student&q=${encodeURIComponent(studentId)}&limit=1`);
          if (sres.ok) {
            const data = await sres.json();
            const first = Array.isArray(data.items) && data.items[0];
            if (first && /^\d+$/.test(first.value)) {
              resolvedId = Number(first.value);
            }
          }
        } catch {}
      }
      if (!resolvedId) {
        throw new Error('Student not found. Please enter a valid ID or name.');
      }

      const res = await fetch(`/api/students/${resolvedId}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId: Number(scheduleId) })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed (HTTP ${res.status})`);
      }
      toast.success('Class added to student');
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Failed to add class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-xl border border-blue-200 flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 py-4 relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 h-8 w-8 text-white hover:bg-white/20 rounded-full"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </Button>
          <div className="flex items-start gap-3 pr-10">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-xl font-bold">Add Class to Student</DialogTitle>
              <p className="text-white/80 text-sm">Enroll the student to a specific subject schedule</p>
            </div>
          </div>
        </div>
        <div className="space-y-4 p-6 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <Label>Student ID</Label>
            <input
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter student ID or name"
              className="w-full border rounded px-3 py-2 text-sm focus:border-blue-400 focus:ring-blue-400 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <Label>Class (Subject Schedule)</Label>
            <SearchableSelect
              value={scheduleId || 'all'}
              onChange={(v) => setScheduleId(v)}
              options={schedules}
              placeholder="Search class..."
              className="w-full"
            />
          </div>
        </div>
        <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded">Cancel</Button>
          <Button onClick={handleAdd} disabled={loading} className="bg-blue-600 hover:bg-blue-700 rounded">
            {loading ? 'Adding...' : 'Add Class'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


