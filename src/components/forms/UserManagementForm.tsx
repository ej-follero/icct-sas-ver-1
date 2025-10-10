import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, GraduationCap, Shield, Mail, Phone, MapPin, Calendar, Info } from 'lucide-react';
import { toast } from 'sonner';

const studentUserSchema = z.object({
  // User account fields
  userName: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  generatePassword: z.boolean().default(false),
  sendCredentials: z.boolean().default(true),
  requirePasswordChange: z.boolean().default(true),
  
  // Student profile fields
  studentIdNum: z.string().min(1, 'Student ID is required'),
  rfidTag: z.string().min(1, 'RFID tag is required'),
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  suffix: z.string().optional(),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  gender: z.enum(['MALE', 'FEMALE'], { required_error: 'Gender is required' }),
  birthDate: z.string().optional(),
  nationality: z.string().optional(),
  studentType: z.enum(['REGULAR', 'IRREGULAR'], { required_error: 'Student type is required' }),
  yearLevel: z.enum(['FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR'], { 
    required_error: 'Year level is required' 
  }),
  courseId: z.number().optional(),
  departmentId: z.number().optional(),
  guardianId: z.number({ required_error: 'Guardian is required' }),
  
  // Account settings
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).default('PENDING'),
  isEmailVerified: z.boolean().default(false),
  twoFactorEnabled: z.boolean().default(false),
}).refine(data => {
  if (!data.generatePassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type StudentUserFormData = z.infer<typeof studentUserSchema>;

interface UserManagementFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<StudentUserFormData>;
  onSubmit: (data: StudentUserFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function UserManagementForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}: UserManagementFormProps) {
  const [generatePassword, setGeneratePassword] = useState(mode === 'create');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<StudentUserFormData>({
    resolver: zodResolver(studentUserSchema),
    defaultValues: {
      generatePassword: mode === 'create',
      sendCredentials: true,
      requirePasswordChange: true,
      status: 'PENDING',
      isEmailVerified: false,
      twoFactorEnabled: false,
      ...initialData
    }
  });

  const watchGeneratePassword = watch('generatePassword');

  const handleFormSubmit = async (data: StudentUserFormData) => {
    try {
      await onSubmit(data);
      toast.success(`Student user ${mode === 'create' ? 'created' : 'updated'} successfully`);
    } catch (error) {
      toast.error(`Failed to ${mode} student user`);
    }
  };

  const generateRandomPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setValue('password', newPassword);
    setValue('confirmPassword', newPassword);
    toast.success('Password generated successfully');
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                User Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">Username *</Label>
                  <Input
                    id="userName"
                    {...register('userName')}
                    placeholder="Enter username"
                    className={errors.userName ? 'border-red-500' : ''}
                  />
                  {errors.userName && (
                    <p className="text-sm text-red-500">{errors.userName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Enter email address"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="generatePassword"
                    checked={watchGeneratePassword}
                    onCheckedChange={(checked) => {
                      setValue('generatePassword', checked as boolean);
                      setGeneratePassword(checked as boolean);
                    }}
                  />
                  <Label htmlFor="generatePassword">Generate random password</Label>
                </div>

                {!watchGeneratePassword && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        {...register('password')}
                        placeholder="Enter password"
                        className={errors.password ? 'border-red-500' : ''}
                      />
                      {errors.password && (
                        <p className="text-sm text-red-500">{errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...register('confirmPassword')}
                        placeholder="Confirm password"
                        className={errors.confirmPassword ? 'border-red-500' : ''}
                      />
                      {errors.confirmPassword && (
                        <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {watchGeneratePassword && (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGeneratePassword}
                      className="w-full"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Generate Secure Password
                    </Button>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        A secure password will be generated automatically. You can choose to send it to the student via email.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentIdNum">Student ID *</Label>
                  <Input
                    id="studentIdNum"
                    {...register('studentIdNum')}
                    placeholder="Enter student ID"
                    className={errors.studentIdNum ? 'border-red-500' : ''}
                  />
                  {errors.studentIdNum && (
                    <p className="text-sm text-red-500">{errors.studentIdNum.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rfidTag">RFID Tag *</Label>
                  <Input
                    id="rfidTag"
                    {...register('rfidTag')}
                    placeholder="Enter RFID tag"
                    className={errors.rfidTag ? 'border-red-500' : ''}
                  />
                  {errors.rfidTag && (
                    <p className="text-sm text-red-500">{errors.rfidTag.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    placeholder="Enter first name"
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    {...register('middleName')}
                    placeholder="Enter middle name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    placeholder="Enter last name"
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select onValueChange={(value) => setValue('gender', value as 'MALE' | 'FEMALE')}>
                    <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-red-500">{errors.gender.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    {...register('birthDate')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    {...register('nationality')}
                    placeholder="Enter nationality"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    {...register('phoneNumber')}
                    placeholder="Enter phone number"
                    className={errors.phoneNumber ? 'border-red-500' : ''}
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    {...register('address')}
                    placeholder="Enter address"
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentType">Student Type *</Label>
                  <Select onValueChange={(value) => setValue('studentType', value as 'REGULAR' | 'IRREGULAR')}>
                    <SelectTrigger className={errors.studentType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select student type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REGULAR">Regular</SelectItem>
                      <SelectItem value="IRREGULAR">Irregular</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.studentType && (
                    <p className="text-sm text-red-500">{errors.studentType.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearLevel">Year Level *</Label>
                  <Select onValueChange={(value) => setValue('yearLevel', value as any)}>
                    <SelectTrigger className={errors.yearLevel ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select year level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIRST_YEAR">First Year</SelectItem>
                      <SelectItem value="SECOND_YEAR">Second Year</SelectItem>
                      <SelectItem value="THIRD_YEAR">Third Year</SelectItem>
                      <SelectItem value="FOURTH_YEAR">Fourth Year</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.yearLevel && (
                    <p className="text-sm text-red-500">{errors.yearLevel.message}</p>
                  )}
                </div>
              </div>

              {/* Course and Department selects would go here */}
              {/* Guardian select would go here */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="sendCredentials" {...register('sendCredentials')} />
                  <Label htmlFor="sendCredentials">Send login credentials via email</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="requirePasswordChange" {...register('requirePasswordChange')} />
                  <Label htmlFor="requirePasswordChange">Require password change on first login</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="isEmailVerified" {...register('isEmailVerified')} />
                  <Label htmlFor="isEmailVerified">Mark email as verified</Label>
                </div>


                <div className="flex items-center space-x-2">
                  <Checkbox id="twoFactorEnabled" {...register('twoFactorEnabled')} />
                  <Label htmlFor="twoFactorEnabled">Enable two-factor authentication</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Account Status</Label>
                <Select onValueChange={(value) => setValue('status', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid || isLoading}>
          {isLoading ? 'Processing...' : mode === 'create' ? 'Create Student User' : 'Update Student User'}
        </Button>
      </div>
    </form>
  );
} 