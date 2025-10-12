'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SemesterData {
  semesterType: string;
  startDate: Date | null;
  endDate: Date | null;
  registrationStart: Date | null;
  registrationEnd: Date | null;
  enrollmentStart: Date | null;
  enrollmentEnd: Date | null;
  notes: string;
}

interface AcademicYearFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SEMESTER_TYPES = [
  { value: 'FIRST_SEMESTER', label: '1st Semester' },
  { value: 'SECOND_SEMESTER', label: '2nd Semester' },
  { value: 'THIRD_SEMESTER', label: 'Summer' }
];

export default function AcademicYearForm({ onSuccess, onCancel }: AcademicYearFormProps) {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [semesters, setSemesters] = useState<SemesterData[]>([
    {
      semesterType: 'FIRST_SEMESTER',
      startDate: null,
      endDate: null,
      registrationStart: null,
      registrationEnd: null,
      enrollmentStart: null,
      enrollmentEnd: null,
      notes: ''
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSemester = () => {
    const usedTypes = semesters.map(s => s.semesterType);
    const availableType = SEMESTER_TYPES.find(type => !usedTypes.includes(type.value));
    
    if (availableType) {
      setSemesters([...semesters, {
        semesterType: availableType.value,
        startDate: null,
        endDate: null,
        registrationStart: null,
        registrationEnd: null,
        enrollmentStart: null,
        enrollmentEnd: null,
        notes: ''
      }]);
    }
  };

  const removeSemester = (index: number) => {
    if (semesters.length > 1) {
      setSemesters(semesters.filter((_, i) => i !== index));
    }
  };

  const updateSemester = (index: number, field: keyof SemesterData, value: any) => {
    const updated = [...semesters];
    updated[index] = { ...updated[index], [field]: value };
    setSemesters(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate all semesters have required fields
      for (let i = 0; i < semesters.length; i++) {
        const semester = semesters[i];
        if (!semester.startDate || !semester.endDate) {
          throw new Error(`Semester ${i + 1}: Start date and end date are required`);
        }
        if (semester.startDate >= semester.endDate) {
          throw new Error(`Semester ${i + 1}: Start date must be before end date`);
        }
      }

      // Check for overlapping semesters
      for (let i = 0; i < semesters.length; i++) {
        for (let j = i + 1; j < semesters.length; j++) {
          const sem1 = semesters[i];
          const sem2 = semesters[j];
          
          if (sem1.startDate && sem1.endDate && sem2.startDate && sem2.endDate) {
            if (
              (sem1.startDate <= sem2.endDate && sem1.endDate >= sem2.startDate)
            ) {
              throw new Error(`Semester ${i + 1} and Semester ${j + 1} have overlapping dates`);
            }
          }
        }
      }

      const response = await fetch('/api/academic-years', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year,
          semesters: semesters.map(sem => ({
            ...sem,
            startDate: sem.startDate?.toISOString(),
            endDate: sem.endDate?.toISOString(),
            registrationStart: sem.registrationStart?.toISOString(),
            registrationEnd: sem.registrationEnd?.toISOString(),
            enrollmentStart: sem.enrollmentStart?.toISOString(),
            enrollmentEnd: sem.enrollmentEnd?.toISOString(),
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create academic year');
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Academic Year</CardTitle>
        <CardDescription>
          Set up a new academic year with its semesters and date ranges
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Academic Year */}
          <div className="space-y-2">
            <Label htmlFor="year">Academic Year</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min="2000"
                max="2100"
                className="w-32"
                required
              />
              <span className="text-sm text-gray-500">
                ({year}-{year + 1})
              </span>
            </div>
          </div>

          {/* Semesters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Semesters</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSemester}
                disabled={semesters.length >= 3}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Semester
              </Button>
            </div>

            {semesters.map((semester, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Semester {index + 1}</h4>
                  {semesters.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSemester(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Semester Type */}
                  <div className="space-y-2">
                    <Label>Semester Type</Label>
                    <Select
                      value={semester.semesterType}
                      onValueChange={(value) => updateSemester(index, 'semesterType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEMESTER_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !semester.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {semester.startDate ? format(semester.startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={semester.startDate || undefined}
                          onSelect={(date) => updateSemester(index, 'startDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !semester.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {semester.endDate ? format(semester.endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={semester.endDate || undefined}
                          onSelect={(date) => updateSemester(index, 'endDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Registration Start */}
                  <div className="space-y-2">
                    <Label>Registration Start (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !semester.registrationStart && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {semester.registrationStart ? format(semester.registrationStart, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={semester.registrationStart || undefined}
                          onSelect={(date) => updateSemester(index, 'registrationStart', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Registration End */}
                  <div className="space-y-2">
                    <Label>Registration End (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !semester.registrationEnd && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {semester.registrationEnd ? format(semester.registrationEnd, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={semester.registrationEnd || undefined}
                          onSelect={(date) => updateSemester(index, 'registrationEnd', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Enrollment Start */}
                  <div className="space-y-2">
                    <Label>Enrollment Start (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !semester.enrollmentStart && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {semester.enrollmentStart ? format(semester.enrollmentStart, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={semester.enrollmentStart || undefined}
                          onSelect={(date) => updateSemester(index, 'enrollmentStart', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Enrollment End */}
                  <div className="space-y-2">
                    <Label>Enrollment End (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !semester.enrollmentEnd && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {semester.enrollmentEnd ? format(semester.enrollmentEnd, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={semester.enrollmentEnd || undefined}
                          onSelect={(date) => updateSemester(index, 'enrollmentEnd', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>Notes (Optional)</Label>
                    <Input
                      value={semester.notes}
                      onChange={(e) => updateSemester(index, 'notes', e.target.value)}
                      placeholder="Additional notes for this semester"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Academic Year'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
