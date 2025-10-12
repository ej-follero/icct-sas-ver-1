'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SemesterFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SEMESTER_TYPES = [
  { value: 'FIRST_SEMESTER', label: '1st Semester' },
  { value: 'SECOND_SEMESTER', label: '2nd Semester' },
  { value: 'THIRD_SEMESTER', label: 'Summer' }
];

export default function SemesterForm({ onSuccess, onCancel }: SemesterFormProps) {
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    semesterType: 'FIRST_SEMESTER',
    startDate: null as Date | null,
    endDate: null as Date | null,
    registrationStart: null as Date | null,
    registrationEnd: null as Date | null,
    enrollmentStart: null as Date | null,
    enrollmentEnd: null as Date | null,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.startDate || !formData.endDate) {
        throw new Error('Start date and end date are required');
      }

      if (formData.startDate >= formData.endDate) {
        throw new Error('Start date must be before end date');
      }

      const response = await fetch('/api/semesters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate.toISOString(),
          registrationStart: formData.registrationStart?.toISOString(),
          registrationEnd: formData.registrationEnd?.toISOString(),
          enrollmentStart: formData.enrollmentStart?.toISOString(),
          enrollmentEnd: formData.enrollmentEnd?.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create semester');
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Semester</CardTitle>
        <CardDescription>
          Add a new semester to an existing academic year
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="year">Academic Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => updateField('year', Number(e.target.value))}
                min="2000"
                max="2100"
                required
              />
            </div>

            {/* Semester Type */}
            <div className="space-y-2">
              <Label>Semester Type</Label>
              <Select
                value={formData.semesterType}
                onValueChange={(value) => updateField('semesterType', value)}
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
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate || undefined}
                    onSelect={(date) => updateField('startDate', date)}
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
                      !formData.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate || undefined}
                    onSelect={(date) => updateField('endDate', date)}
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
                      !formData.registrationStart && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.registrationStart ? format(formData.registrationStart, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.registrationStart || undefined}
                    onSelect={(date) => updateField('registrationStart', date)}
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
                        !formData.registrationEnd && "text-muted-foreground"
                      )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.registrationEnd ? format(formData.registrationEnd, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.registrationEnd || undefined}
                    onSelect={(date) => updateField('registrationEnd', date)}
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
                      !formData.enrollmentStart && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.enrollmentStart ? format(formData.enrollmentStart, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.enrollmentStart || undefined}
                    onSelect={(date) => updateField('enrollmentStart', date)}
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
                      !formData.enrollmentEnd && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.enrollmentEnd ? format(formData.enrollmentEnd, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.enrollmentEnd || undefined}
                    onSelect={(date) => updateField('enrollmentEnd', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Input
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Additional notes for this semester"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Semester'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
