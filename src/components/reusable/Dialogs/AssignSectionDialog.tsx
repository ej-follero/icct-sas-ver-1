import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/reusable/Search/SearchableSelect';
import { toast } from 'sonner';
import { Users, X } from 'lucide-react';

interface AssignSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStudentId?: number;
}

export function AssignSectionDialog({ open, onOpenChange, defaultStudentId }: AssignSectionDialogProps) {
  const [studentId, setStudentId] = useState<string>(defaultStudentId ? String(defaultStudentId) : '');
  const [sectionId, setSectionId] = useState<string>('');
  const [sections, setSections] = useState<Array<{ value: string; label: string; yearLevel?: number }>>([]);
  const [studentYearLevel, setStudentYearLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch student year level when student is selected
  const fetchStudentYearLevel = async (studentId: string) => {
    if (!studentId || studentId === 'all') {
      setStudentYearLevel(null);
      return;
    }

    try {
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

      if (resolvedId) {
        const res = await fetch(`/api/students/${resolvedId}`);
        if (res.ok) {
          const studentData = await res.json();
          setStudentYearLevel(studentData.yearLevel || null);
        }
      }
    } catch (error) {
      console.error('Error fetching student year level:', error);
      setStudentYearLevel(null);
    }
  };

  useEffect(() => {
    if (!open) return;
    const loadSections = async () => {
      try {
        const res = await fetch('/api/sections');
        if (!res.ok) throw new Error('Failed to load sections');
        const data = await res.json();
        const options = (data?.data || data?.sections || [])
          .map((s: any) => ({ 
            value: String(s.sectionId || s.sectionId), 
            label: s.sectionName,
            yearLevel: s.yearLevel 
          }));
        setSections([{ value: 'all', label: 'Select section...' }, ...options]);
      } catch (e) {
        console.error(e);
        setSections([{ value: 'all', label: 'No sections found' }]);
      }
    };
    loadSections();
  }, [open]);

  // Fetch student year level when student ID changes
  useEffect(() => {
    if (studentId && studentId !== 'all') {
      fetchStudentYearLevel(studentId);
    } else {
      setStudentYearLevel(null);
    }
  }, [studentId]);

  const handleAssign = async () => {
    if (!studentId || !sectionId || sectionId === 'all') {
      setError('Student ID and Section are required');
      return;
    }

    // Check year level compatibility
    if (studentYearLevel !== null) {
      const selectedSection = sections.find(s => s.value === sectionId);
      if (selectedSection && selectedSection.yearLevel !== studentYearLevel) {
        setError(`Year level mismatch: Student is in year ${studentYearLevel} but section requires year ${selectedSection.yearLevel}`);
        return;
      }
    }
    try {
      setSubmitting(true);
      setError(null);
      // Resolve student identifier: accept numeric ID or name/search term
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

      const res = await fetch(`/api/students/${resolvedId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId: Number(sectionId) })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed (HTTP ${res.status})`);
      }
      toast.success('Student assigned to section');
      resetForm();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to assign');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset all fields when closing
  const resetForm = useMemo(() => (
    () => {
      setStudentId(defaultStudentId ? String(defaultStudentId) : '');
      setSectionId('');
      setError(null);
    }
  ), [defaultStudentId]);

  const handleOpenChange = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-xl border border-blue-200 flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-4 relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenChange(false)}
            className="absolute top-3 right-3 h-8 w-8 text-white hover:bg-white/20 rounded-full"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </Button>
          <div className="flex items-start gap-3 pr-10">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-xl font-bold">Assign Student to Section</DialogTitle>
              <p className="text-white/80 text-sm">Enroll a student into a cohort section</p>
            </div>
          </div>
        </div>
        <div className="space-y-4 p-6 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <Label>Student ID</Label>
            <SearchableSelect
              value={studentId}
              onChange={(v) => setStudentId(v)}
              options={[]}
              placeholder="Search student by name or ID..."
              className="w-full"
              asyncSearch={async (query) => {
                try {
                  const res = await fetch(`/api/search/entities?type=student&q=${encodeURIComponent(query)}&limit=10`);
                  if (!res.ok) return [];
                  const data = await res.json();
                  return Array.isArray(data.items) ? data.items : [];
                } catch {
                  return [];
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Section</Label>
            <SearchableSelect
              value={sectionId || 'all'}
              onChange={(v) => setSectionId(v)}
              options={sections.filter(section => {
                // If student year level is known, only show compatible sections
                if (studentYearLevel !== null && section.value !== 'all') {
                  return section.yearLevel === studentYearLevel;
                }
                return true;
              })}
              placeholder="Search section..."
              className="w-full"
              asyncSearch={async (query) => {
                const q = (query || '').toLowerCase();
                const filtered = sections.filter(o => {
                  const matchesQuery = o.label?.toLowerCase().includes(q);
                  // If student year level is known, only show compatible sections
                  if (studentYearLevel !== null && o.value !== 'all') {
                    return matchesQuery && o.yearLevel === studentYearLevel;
                  }
                  return matchesQuery;
                });
                return Promise.resolve(filtered);
              }}
            />
            {studentYearLevel !== null && (
              <p className="text-sm text-blue-600">
                Showing sections for Year {studentYearLevel} students only
              </p>
            )}
          </div>
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
          )}
        </div>
        <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded">Cancel</Button>
          <Button onClick={handleAssign} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 rounded">
            {submitting ? 'Assigning...' : 'Assign'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


