"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, User, Mail, Phone, MapPin, Briefcase, Users, AlertCircle } from 'lucide-react';

interface Guardian {
  guardianId?: number;
  email: string;
  phoneNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  address: string;
  img?: string;
  gender: 'MALE' | 'FEMALE';
  guardianType: 'PARENT' | 'GUARDIAN';
  occupation?: string;
  workplace?: string;
  emergencyContact?: string;
  relationshipToStudent: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

interface GuardianFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'create' | 'update';
  data?: Guardian | null;
  id?: string;
  onSuccess?: () => void;
}

export function GuardianForm({ 
  open, 
  onOpenChange, 
  type, 
  data, 
  id, 
  onSuccess 
}: GuardianFormProps) {
  const [formData, setFormData] = useState<Guardian>({
    email: '',
    phoneNumber: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    address: '',
    img: '',
    gender: 'MALE',
    guardianType: 'PARENT',
    occupation: '',
    workplace: '',
    emergencyContact: '',
    relationshipToStudent: '',
    status: 'ACTIVE'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form data when editing
  useEffect(() => {
    if (type === 'update' && data) {
      setFormData({
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        firstName: data.firstName || '',
        middleName: data.middleName || '',
        lastName: data.lastName || '',
        suffix: data.suffix || '',
        address: data.address || '',
        img: data.img || '',
        gender: data.gender || 'MALE',
        guardianType: data.guardianType || 'PARENT',
        occupation: data.occupation || '',
        workplace: data.workplace || '',
        emergencyContact: data.emergencyContact || '',
        relationshipToStudent: data.relationshipToStudent || '',
        status: data.status || 'ACTIVE'
      });
    } else {
      // Reset form for create
      setFormData({
        email: '',
        phoneNumber: '',
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        address: '',
        img: '',
        gender: 'MALE',
        guardianType: 'PARENT',
        occupation: '',
        workplace: '',
        emergencyContact: '',
        relationshipToStudent: '',
        status: 'ACTIVE'
      });
    }
    setErrors({});
  }, [type, data, open]);

  const handleInputChange = (field: keyof Guardian, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (formData.phoneNumber.length < 10) {
      newErrors.phoneNumber = 'Phone number must be at least 10 characters';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.relationshipToStudent.trim()) {
      newErrors.relationshipToStudent = 'Relationship to student is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = type === 'create' ? '/api/guardians' : `/api/guardians/${id}`;
      const method = type === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      toast.success(
        type === 'create' 
          ? 'Guardian created successfully!' 
          : 'Guardian updated successfully!'
      );
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error submitting guardian form:', error);
      toast.error(error.message || 'Failed to save guardian');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Users className="w-5 h-5 text-blue-600" />
            {type === 'create' ? 'Add New Guardian' : 'Edit Guardian'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  value={formData.middleName}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="suffix">Suffix</Label>
                <Input
                  id="suffix"
                  value={formData.suffix}
                  onChange={(e) => handleInputChange('suffix', e.target.value)}
                  placeholder="Jr., Sr., III, etc."
                />
              </div>

              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="guardianType">Guardian Type *</Label>
                <Select value={formData.guardianType} onValueChange={(value) => handleInputChange('guardianType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PARENT">Parent</SelectItem>
                    <SelectItem value="GUARDIAN">Guardian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Contact Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className={errors.phoneNumber ? 'border-red-500' : ''}
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={errors.address ? 'border-red-500' : ''}
                rows={3}
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
              )}
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Professional Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="workplace">Workplace</Label>
                <Input
                  id="workplace"
                  value={formData.workplace}
                  onChange={(e) => handleInputChange('workplace', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Student Relationship */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Student Relationship</h3>
            </div>
            
            <div>
              <Label htmlFor="relationshipToStudent">Relationship to Student *</Label>
              <Input
                id="relationshipToStudent"
                value={formData.relationshipToStudent}
                onChange={(e) => handleInputChange('relationshipToStudent', e.target.value)}
                className={errors.relationshipToStudent ? 'border-red-500' : ''}
                placeholder="e.g., Father, Mother, Legal Guardian, etc."
              />
              {errors.relationshipToStudent && (
                <p className="text-red-500 text-sm mt-1">{errors.relationshipToStudent}</p>
              )}
            </div>

            <div>
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                placeholder="Alternative contact number"
              />
            </div>
          </div>

          {/* Status (only for update) */}
          {type === 'update' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Status</h3>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {type === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  {type === 'create' ? 'Create Guardian' : 'Update Guardian'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
