"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Download, 
  Eye, 
  Loader2,
  FileSpreadsheet,
  FileX,
  AlertTriangle,
  Info,
  XCircle
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface ImportRecord {
  // Department fields
  departmentName?: string;
  departmentCode?: string;
  departmentDescription?: string;
  departmentStatus?: "ACTIVE" | "INACTIVE";
  
  // Allow arbitrary fields for other entity templates (emails, etc.)
  [key: string]: any;
  
  // Section fields
  sectionName?: string;
  sectionCapacity?: number;
  sectionStatus?: "ACTIVE" | "INACTIVE";
  yearLevel?: number;
  courseId?: number;
  academicYear?: string;
  semester?: string;
  roomAssignment?: string;
  scheduleNotes?: string;
  
  // Role fields
  roleName?: string;
  roleDescription?: string;
  rolePermissions?: string[];
  roleStatus?: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  
  // User fields
  userName?: string;
  email?: string;
  role?: "SUPER_ADMIN" | "ADMIN" | "DEPARTMENT_HEAD" | "INSTRUCTOR" | "STUDENT" | "GUARDIAN" | "SYSTEM_AUDITOR";
  status?: "active" | "inactive" | "suspended" | "pending" | "blocked";
  isEmailVerified?: boolean;
  twoFactorEnabled?: boolean;
  passwordHash?: string;
  
  // Common fields
  errors?: string[];
  isValid?: boolean;
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ImportRecord[]) => Promise<{ success: number; failed: number; errors: string[] }>;
  entityName: string;
  templateUrl?: string;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in MB
  currentUserRole?: string; // For role-based validation
  /** Optional custom requirements renderer for the File Requirements box */
  fileRequirements?: React.ReactNode;
  /** Optional custom template builder. If provided, used instead of built-ins. */
  templateBuilder?: () => void;
}

function ImportDialog({
  open,
  onOpenChange,
  onImport,
  entityName,
  templateUrl,
  acceptedFileTypes = [".csv", ".xlsx", ".xls"],
  maxFileSize = 5,
  currentUserRole,
  fileRequirements,
  templateBuilder
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importData, setImportData] = useState<ImportRecord[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'validate' | 'import' | 'complete'>('upload');
  
  // Dialog notification states
  const [notificationDialog, setNotificationDialog] = useState<{
    open: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    details?: string[];
  }>({
    open: false,
    type: 'info',
    title: '',
    message: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to show dialog notifications
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, details?: string[]) => {
    setNotificationDialog({
      open: true,
      type,
      title,
      message,
      details
    });
  };

  const resetState = useCallback(() => {
    console.log('ImportDialog: resetState called');
    // Clear any running progress interval
    if (progressIntervalRef.current) {
      console.log('ImportDialog: clearing progress interval');
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    setFile(null);
    setIsProcessing(false);
    setImportData([]);
    setValidationErrors([]);
    setIsImporting(false);
    setImportProgress(0);
    setImportResults(null);
    setCurrentStep('upload');
    console.log('ImportDialog: state reset complete');
  }, []);

  // Cleanup effect to clear any running intervals
  useEffect(() => {
    return () => {
      console.log('ImportDialog: component unmounting, cleaning up');
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // Force cleanup of any remaining state
      setFile(null);
      setIsProcessing(false);
      setImportData([]);
      setValidationErrors([]);
      setIsImporting(false);
      setImportProgress(0);
      setImportResults(null);
      setCurrentStep('upload');
      
      // Final cleanup of any remaining overlays or focus traps
      setTimeout(() => {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
        
        const focusTraps = document.querySelectorAll('[data-radix-focus-trap]');
        focusTraps.forEach(trap => {
          if (trap instanceof HTMLElement) {
            trap.remove();
          }
        });
        
        const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
        overlays.forEach(overlay => {
          if (overlay instanceof HTMLElement) {
            overlay.style.pointerEvents = 'none';
            overlay.remove();
          }
        });
      }, 100);
    };
  }, []);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      // Dialog is closed, ensure state is reset
      resetState();
    }
  }, [open, resetState]);

  // Cleanup effect when component unmounts or dialog closes
  useEffect(() => {
    if (!open) {
      // Ensure proper cleanup when dialog is closed
      const cleanup = () => {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
        // Remove any remaining focus traps
        const focusTraps = document.querySelectorAll('[data-radix-focus-trap]');
        focusTraps.forEach(trap => {
          if (trap instanceof HTMLElement) {
            trap.remove();
          }
        });
        // Remove any remaining overlays
        const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
        overlays.forEach(overlay => {
          if (overlay instanceof HTMLElement) {
            overlay.style.pointerEvents = 'none';
            overlay.remove();
          }
        });
      };
      
      // Run cleanup after a short delay to ensure dialog is fully closed
      const timeoutId = setTimeout(cleanup, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  const handleFileSelect = async (selectedFile: File) => {
    // Validate file type
    const fileExtension = selectedFile.name.toLowerCase().split('.').pop();
    const isValidType = acceptedFileTypes.some(type => 
      type.startsWith('.') ? type.slice(1) === fileExtension : type.includes(fileExtension || '')
    );
    
    if (!isValidType) {
      showNotification(
        'error',
        'Invalid File Type',
        `Please select a file with one of these extensions: ${acceptedFileTypes.join(', ')}`,
        [`Supported formats: ${acceptedFileTypes.join(', ')}`]
      );
      return;
    }

    // Validate file size
    if (selectedFile.size > maxFileSize * 1024 * 1024) {
      showNotification(
        'error',
        'File Too Large',
        `File size must be less than ${maxFileSize}MB`,
        [`Current file size: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`, `Maximum allowed: ${maxFileSize}MB`]
      );
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    setCurrentStep('validate');

    try {
      const data = await parseFile(selectedFile);
      const validatedData = validateImportData(data);
      setImportData(validatedData);
      
      const errors = validatedData.flatMap(record => record.errors || []);
      setValidationErrors(errors);

      if (errors.length === 0) {
        showNotification(
          'success',
          'File Processed Successfully',
          `Found ${validatedData.length} valid records to import`,
          [`All records passed validation`, `Ready to proceed with import`]
        );
      } else {
        showNotification(
          'warning',
          'File Processed with Warnings',
          `${errors.length} validation warnings found. Records will be imported with default values where needed.`,
          [`${validatedData.length} records ready for import`, `Please review the warnings below`]
        );
      }
    } catch (error) {
      showNotification(
        'error',
        'Failed to Process File',
        error instanceof Error ? error.message : "Unknown error occurred",
        ['Please check your file format and try again', 'Ensure the file is not corrupted']
      );
      setFile(null);
      setCurrentStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

    // Helper function to parse CSV lines with proper quote handling
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  };

  const parseFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error("Failed to read file"));
            return;
          }

          let parsedData: any[] = [];

          if (file.name.toLowerCase().endsWith('.csv')) {
            // Parse CSV with enhanced handling
            const csvText = data as string;
            console.log('CSV Content Preview:', csvText.substring(0, 500)); // Debug log
            
            // Handle different line endings and encoding
            const lines = csvText
              .split(/\r?\n/)
              .filter(line => line.trim() !== '')
              .map(line => line.trim());
            
            console.log('CSV Lines Count:', lines.length); // Debug log
            
            if (lines.length === 0) {
              reject(new Error("CSV file is empty"));
              return;
            }

            // Parse headers with better handling
            const headerLine = lines[0];
            const headers = parseCSVLine(headerLine)
              .map((h: string) => h.trim().replace(/"/g, '').replace(/\s+/g, '_'))
              .filter(h => h.length > 0);
            
            console.log('CSV Headers:', headers); // Debug log
            
            if (headers.length === 0) {
              reject(new Error("No valid headers found in CSV file"));
              return;
            }
            
            // Parse data rows with validation
            parsedData = lines.slice(1)
              .map((line, index) => {
                try {
                  const values = parseCSVLine(line);
                  const row: any = {};
                  
                  headers.forEach((header: string, i: number) => {
                    const value = (values[i] || '').trim().replace(/"/g, '');
                    row[header] = value;
                  });
                  
                  // Only include rows that have at least one non-empty value
                  return Object.values(row).some(val => val !== '') ? row : null;
                } catch (error) {
                  console.warn(`Error parsing CSV line ${index + 2}:`, error);
                  return null;
                }
              })
              .filter(row => row !== null);
            
            console.log('Parsed CSV Data Count:', parsedData.length); // Debug log
          } else {
            // Parse Excel with enhanced error handling
            console.log('Parsing Excel file...'); // Debug log
            
            try {
              const workbook = XLSX.read(data, { 
                type: 'binary',
                cellDates: true,
                cellNF: false,
                cellText: false
              });
              
              console.log('Excel Sheets:', workbook.SheetNames); // Debug log
              
              // Try to find the first sheet with data
              let worksheet = null;
              let sheetName = '';
              
              for (const name of workbook.SheetNames) {
                const sheet = workbook.Sheets[name];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                
                if (jsonData.length > 1) { // Has headers + at least one data row
                  worksheet = sheet;
                  sheetName = name;
                  break;
                }
              }
              
              if (!worksheet) {
                reject(new Error("No worksheet with data found in Excel file"));
                return;
              }
              
              console.log('Using Excel sheet:', sheetName); // Debug log
              
              // Parse with better options
              parsedData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: '',
                blankrows: false
              });
              
              // Convert to object format
              if (parsedData.length > 0) {
                const headers = parsedData[0] as string[];
                const dataRows = parsedData.slice(1);
                
                parsedData = dataRows
                  .map((row: any, index) => {
                    try {
                      const obj: any = {};
                      headers.forEach((header: string, i: number) => {
                        if (header && i < row.length) {
                          obj[header] = row[i];
                        }
                      });
                      return Object.values(obj).some(val => val !== '') ? obj : null;
                    } catch (error) {
                      console.warn(`Error parsing Excel row ${index + 2}:`, error);
                      return null;
                    }
                  })
                  .filter(row => row !== null);
              }
              
              console.log('Parsed Excel Data Count:', parsedData.length); // Debug log
              console.log('Excel Headers:', parsedData.length > 0 ? Object.keys(parsedData[0]) : 'No data'); // Debug log
            } catch (error) {
              console.error('Excel parsing error:', error);
              reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
              return;
            }
          }

          if (parsedData.length === 0) {
            reject(new Error("No valid data found in file"));
            return;
          }

          console.log('Final parsed data count:', parsedData.length); // Debug log
          console.log('Sample data:', parsedData.slice(0, 2)); // Debug log
          resolve(parsedData);
        } catch (error) {
          console.error('Parse error:', error); // Debug log
          reject(new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };

      reader.onerror = (error) => {
        console.error('FileReader error:', error); // Debug log
        reject(new Error("Failed to read file"));
      };

      if (file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file, 'UTF-8');
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  const validateImportData = (data: any[]): ImportRecord[] => {
    console.log('Validation: Received data with keys:', data.length > 0 ? Object.keys(data[0]) : 'No data');
    console.log('Validation: First row sample:', data.length > 0 ? data[0] : 'No data');

    if (entityName.toLowerCase() === 'emails') {
      // Emails schema validation
      return data.map((row) => {
        const errors: string[] = [];
        const record: any = {
          subject: '',
          sender: '',
          recipient: '',
          recipients: '',
          to: '',
          cc: '',
          bcc: '',
          content: '',
          priority: 'NORMAL',
          folder: 'INBOX',
          status: 'PENDING',
          isRead: 'false',
          isStarred: 'false',
          attachments: '',
          attachmentNames: ''
        };

        const getValue = (obj: any, key: string): string => {
          const lowerKey = key.toLowerCase();
          const upperKey = key.toUpperCase();
          if (obj[key] !== undefined) return obj[key];
          if (obj[lowerKey] !== undefined) return obj[lowerKey];
          if (obj[upperKey] !== undefined) return obj[upperKey];
          return '';
        };

        const subject = getValue(row, 'subject');
        if (!subject) {
          errors.push('Subject is missing - will use "No subject"');
          record.subject = 'No subject';
        } else {
          record.subject = subject;
        }

        const sender = getValue(row, 'sender') || getValue(row, 'from');
        if (!sender) {
          errors.push('Sender is missing - will use admin@icct.edu');
          record.sender = 'admin@icct.edu';
        } else {
          record.sender = sender;
        }

        const primaryRecipient = getValue(row, 'recipient');
        const toCombined = getValue(row, 'recipients') || getValue(row, 'to');
        const toList = (toCombined || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
        if (!primaryRecipient && toList.length === 0) {
          errors.push('No recipient specified - record may fail on import');
        }
        record.recipient = primaryRecipient || (toList[0] || '');
        record.recipients = toCombined;
        record.to = getValue(row, 'to');

        const content = getValue(row, 'content') || getValue(row, 'body');
        record.content = content;

        const priority = (getValue(row, 'priority') || 'NORMAL').toUpperCase();
        const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
        record.priority = (validPriorities.includes(priority) ? priority : 'NORMAL') as any;
        if (!validPriorities.includes(priority)) errors.push('Invalid priority - defaulting to NORMAL');

        const folder = (getValue(row, 'folder') || getValue(row, 'type') || 'INBOX').toUpperCase();
        const validFolders = ['INBOX', 'SENT', 'DRAFT', 'SPAM', 'TRASH'];
        record.folder = (validFolders.includes(folder) ? folder : 'INBOX') as any;
        if (!validFolders.includes(folder)) errors.push('Invalid folder - defaulting to INBOX');

        const status = (getValue(row, 'status') || 'PENDING').toUpperCase();
        const validStatus = ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'DRAFT'];
        record.status = (validStatus.includes(status) ? status : 'PENDING') as any;
        if (!validStatus.includes(status)) errors.push('Invalid status - defaulting to PENDING');

        const isRead = getValue(row, 'isRead');
        if (isRead !== '') record.isRead = isRead;
        const isStarred = getValue(row, 'isStarred');
        if (isStarred !== '') record.isStarred = isStarred;

        record.cc = getValue(row, 'cc');
        record.bcc = getValue(row, 'bcc');
        record.attachments = getValue(row, 'attachments');
        record.attachmentNames = getValue(row, 'attachmentNames');

        record.errors = errors;
        record.isValid = true;
        return record;
      });
    } else if (entityName.toLowerCase() === 'rooms') {
      // Room schema validation
      return data.map((row, index) => {
        const errors: string[] = [];
        const record: any = {
          roomNo: '',
          roomType: '',
          roomCapacity: 0,
          roomBuildingLoc: '',
          roomFloorLoc: '',
          readerId: '',
          status: 'AVAILABLE',
          isActive: true
        };

        // Helper function to get value regardless of case
        const getValue = (obj: any, key: string): string => {
          const lowerKey = key.toLowerCase();
          const upperKey = key.toUpperCase();
          if (obj[key] !== undefined) return obj[key];
          if (obj[lowerKey] !== undefined) return obj[lowerKey];
          if (obj[upperKey] !== undefined) return obj[upperKey];
          return '';
        };

        // roomNo
        const roomNo = getValue(row, 'roomNo');
        if (!roomNo || roomNo.trim() === '') {
          errors.push('Room number is missing - will use placeholder');
          record.roomNo = `Room ${index + 1}`;
        } else {
          record.roomNo = roomNo.trim();
        }

        // roomType
        const roomType = getValue(row, 'roomType').toUpperCase();
        const validTypes = ['LECTURE', 'LABORATORY', 'CONFERENCE', 'OFFICE', 'OTHER'];
        if (!roomType || !validTypes.includes(roomType)) {
          errors.push('Invalid or missing room type - will default to LECTURE');
          record.roomType = 'LECTURE';
        } else {
          record.roomType = roomType;
        }

        // roomCapacity
        const roomCapacity = parseInt(getValue(row, 'roomCapacity'), 10);
        if (isNaN(roomCapacity) || roomCapacity <= 0) {
          errors.push('Invalid or missing room capacity - will default to 1');
          record.roomCapacity = 1;
        } else {
          record.roomCapacity = roomCapacity;
        }

        // roomBuildingLoc
        const roomBuildingLoc = getValue(row, 'roomBuildingLoc');
        const validBuildings = ['BuildingA', 'BuildingB', 'BuildingC', 'BuildingD', 'BuildingE'];
        if (!roomBuildingLoc || !validBuildings.includes(roomBuildingLoc)) {
          errors.push('Invalid or missing building location - will default to BuildingA');
          record.roomBuildingLoc = 'BuildingA';
        } else {
          record.roomBuildingLoc = roomBuildingLoc;
        }

        // roomFloorLoc
        const roomFloorLoc = getValue(row, 'roomFloorLoc');
        const validFloors = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'];
        if (!roomFloorLoc || !validFloors.includes(roomFloorLoc)) {
          errors.push('Invalid or missing floor location - will default to F1');
          record.roomFloorLoc = 'F1';
        } else {
          record.roomFloorLoc = roomFloorLoc;
        }

        // readerId (optional)
        const readerId = getValue(row, 'readerId');
        record.readerId = readerId ? readerId.trim() : '';

        // status (optional)
        const status = getValue(row, 'status').toUpperCase();
        const validStatus = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED', 'INACTIVE'];
        if (status && validStatus.includes(status)) {
          record.status = status;
        } else if (status) {
          errors.push('Invalid status - will default to AVAILABLE');
          record.status = 'AVAILABLE';
        }

        // isActive (optional)
        const isActive = getValue(row, 'isActive');
        if (isActive !== '') {
          let active = false;
          if (typeof isActive === 'boolean') {
            active = isActive;
          } else if (typeof isActive === 'number') {
            active = isActive === 1;
          } else if (typeof isActive === 'string' && isActive !== '') {
            active = isActive === '1' || isActive.toLowerCase() === 'true';
          }
          record.isActive = active;
        }

        record.errors = errors;
        record.isValid = true;
        return record;
      });
    } else if (entityName.toLowerCase() === 'section') {
      // Section schema validation
      return data.map((row, index) => {
        const errors: string[] = [];
        const record: ImportRecord = {
          sectionName: '',
          sectionCapacity: 40,
          sectionStatus: 'ACTIVE',
          yearLevel: 1,
          courseId: 1,
          academicYear: '2024-2025',
          semester: 'FIRST_SEMESTER',
          roomAssignment: '',
          scheduleNotes: ''
        };

        // Helper function to get value regardless of case
        const getValue = (obj: any, key: string): string => {
          const lowerKey = key.toLowerCase();
          const upperKey = key.toUpperCase();
          if (obj[key] !== undefined) return obj[key];
          if (obj[lowerKey] !== undefined) return obj[lowerKey];
          if (obj[upperKey] !== undefined) return obj[upperKey];
          return '';
        };

        // sectionName (required)
        const sectionName = getValue(row, 'sectionName');
        if (!sectionName || sectionName.trim() === '') {
          errors.push('Section name is missing - will use placeholder');
          record.sectionName = `Section ${index + 1}`;
        } else {
          record.sectionName = sectionName.trim();
          if (record.sectionName.length < 2) {
            errors.push('Section name is too short (min 2 characters)');
          }
          if (record.sectionName.length > 50) {
            errors.push('Section name is too long (max 50 characters)');
          }
        }

        // sectionCapacity (required)
        const sectionCapacity = parseInt(getValue(row, 'sectionCapacity'), 10);
        if (isNaN(sectionCapacity) || sectionCapacity <= 0) {
          errors.push('Invalid or missing section capacity - will default to 40');
          record.sectionCapacity = 40;
        } else {
          record.sectionCapacity = sectionCapacity;
          if (sectionCapacity > 100) {
            errors.push('Section capacity is very high (max recommended: 100)');
          }
        }

        // sectionStatus (required)
        const sectionStatus = getValue(row, 'sectionStatus').toUpperCase();
        if (sectionStatus === 'ACTIVE' || sectionStatus === 'INACTIVE') {
          record.sectionStatus = sectionStatus as "ACTIVE" | "INACTIVE";
        } else {
          errors.push('Invalid section status - will default to ACTIVE');
          record.sectionStatus = 'ACTIVE';
        }

        // yearLevel (required)
        const yearLevel = parseInt(getValue(row, 'yearLevel'), 10);
        if (isNaN(yearLevel) || yearLevel < 1 || yearLevel > 4) {
          errors.push('Invalid year level - must be between 1 and 4, will default to 1');
          record.yearLevel = 1;
        } else {
          record.yearLevel = yearLevel;
        }

        // courseId (required)
        const courseId = parseInt(getValue(row, 'courseId'), 10);
        if (isNaN(courseId) || courseId <= 0) {
          errors.push('Invalid or missing course ID - will default to 1');
          record.courseId = 1;
        } else {
          record.courseId = courseId;
        }

        // academicYear (optional)
        const academicYear = getValue(row, 'academicYear');
        if (academicYear) {
          record.academicYear = academicYear.trim();
        }

        // semester (optional)
        const semester = getValue(row, 'semester').toUpperCase();
        const validSemesters = ['FIRST_SEMESTER', 'SECOND_SEMESTER', 'THIRD_SEMESTER'];
        if (semester && validSemesters.includes(semester)) {
          record.semester = semester;
        } else if (semester) {
          errors.push('Invalid semester - will default to FIRST_SEMESTER');
          record.semester = 'FIRST_SEMESTER';
        }

        // roomAssignment (optional)
        const roomAssignment = getValue(row, 'roomAssignment');
        if (roomAssignment) {
          record.roomAssignment = roomAssignment.trim();
        }

        // scheduleNotes (optional)
        const scheduleNotes = getValue(row, 'scheduleNotes');
        if (scheduleNotes) {
          record.scheduleNotes = scheduleNotes.trim();
        }

        record.errors = errors;
        record.isValid = true;
        return record;
      });
    } else if (entityName.toLowerCase() === 'role') {
      // Role schema validation
      return data.map((row, index) => {
        const errors: string[] = [];
        const record: ImportRecord = {
          roleName: '',
          roleDescription: '',
          rolePermissions: [],
          roleStatus: 'ACTIVE'
        };

        // Helper function to get value regardless of case
        const getValue = (obj: any, key: string): string => {
          const lowerKey = key.toLowerCase();
          const upperKey = key.toUpperCase();
          if (obj[key] !== undefined) return obj[key];
          if (obj[lowerKey] !== undefined) return obj[lowerKey];
          if (obj[upperKey] !== undefined) return obj[upperKey];
          return '';
        };

        // roleName (required)
        const roleName = getValue(row, 'roleName') || getValue(row, 'name');
        if (!roleName || roleName.trim() === '') {
          errors.push('Role name is missing - will use placeholder');
          record.roleName = `Role ${index + 1}`;
        } else {
          record.roleName = roleName.trim();
          if (record.roleName.length < 2) {
            errors.push('Role name is too short (min 2 characters)');
          }
          if (record.roleName.length > 50) {
            errors.push('Role name is too long (max 50 characters)');
          }
          
          // Admin-specific role name validation
          if (currentUserRole === 'ADMIN') {
            const restrictedRoleNames = [
              'SUPER_ADMIN',
              'SUPER ADMIN',
              'SUPERADMIN',
              'SYSTEM_ADMIN',
              'SYSTEM ADMIN',
              'ROOT',
              'ADMINISTRATOR'
            ];
            
            const normalizedRoleName = record.roleName.toUpperCase().replace(/[^A-Z0-9]/g, '');
            const isRestricted = restrictedRoleNames.some(restricted => 
              restricted.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalizedRoleName
            );
            
            if (isRestricted) {
              errors.push('Warning: Role name may be restricted for Admin users');
              // Modify the role name to make it Admin-appropriate
              record.roleName = `Admin_${record.roleName}`;
            }
          }
        }

        // roleDescription (optional)
        const roleDescription = getValue(row, 'roleDescription') || getValue(row, 'description');
        if (roleDescription) {
          record.roleDescription = roleDescription.trim();
        }

        // rolePermissions (required)
        const rolePermissions = getValue(row, 'rolePermissions') || getValue(row, 'permissions');
        if (rolePermissions) {
          // Handle comma-separated permissions or JSON array
          let permissions: string[] = [];
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(rolePermissions);
            if (Array.isArray(parsed)) {
              permissions = parsed;
            } else {
              // If not an array, treat as comma-separated string
              permissions = rolePermissions.split(',').map(p => p.trim()).filter(p => p);
            }
          } catch {
            // If JSON parsing fails, treat as comma-separated string
            permissions = rolePermissions.split(',').map(p => p.trim()).filter(p => p);
          }
          
          if (permissions.length === 0) {
            errors.push('No valid permissions found - will use default permissions');
            record.rolePermissions = ['View Users', 'View Attendance'];
          } else {
            // Admin-specific permission validation
            if (currentUserRole === 'ADMIN') {
              const restrictedPermissions = [
                'Manage Super Admins',
                'Emergency Access',
                'Database Management',
                'Backup & Restore',
                'API Management',
                'System Settings',
                'System Analytics'
              ];
              
              const hasRestrictedPermissions = permissions.some(perm => 
                restrictedPermissions.includes(perm)
              );
              
              if (hasRestrictedPermissions) {
                errors.push('Warning: Role contains system-level permissions that may be restricted for Admin users');
                // Filter out restricted permissions for Admin users
                const filteredPermissions = permissions.filter(perm => 
                  !restrictedPermissions.includes(perm)
                );
                if (filteredPermissions.length === 0) {
                  errors.push('No valid permissions remaining after filtering - will use default permissions');
                  record.rolePermissions = ['View Users', 'View Attendance'];
                } else {
                  record.rolePermissions = filteredPermissions;
                }
              } else {
                record.rolePermissions = permissions;
              }
            } else {
              record.rolePermissions = permissions;
            }
          }
        } else {
          errors.push('Permissions are missing - will use default permissions');
          record.rolePermissions = ['View Users', 'View Attendance'];
        }

        // roleStatus (optional)
        const roleStatus = getValue(row, 'roleStatus') || getValue(row, 'status');
        if (roleStatus) {
          const status = roleStatus.toUpperCase().trim();
          if (status === 'ACTIVE' || status === 'INACTIVE' || status === 'ARCHIVED') {
            record.roleStatus = status as "ACTIVE" | "INACTIVE" | "ARCHIVED";
          } else {
            errors.push('Invalid status - will default to "ACTIVE"');
            record.roleStatus = 'ACTIVE';
          }
        }

        record.errors = errors;
        record.isValid = true;
        return record;
      });
    }

    if (entityName.toLowerCase() === 'events') {
      // Event schema validation
      return data.map((row, index) => {
        const errors: string[] = [];
        const record: any = {
          title: '',
          description: '',
          date: '',
          startTime: '09:00',
          endTime: '10:00',
          location: '',
          eventType: 'LECTURE',
          status: 'DRAFT',
          priority: 'NORMAL',
          capacity: null,
          isPublic: true,
          requiresRegistration: false,
          contactEmail: '',
          contactPhone: '',
          imageUrl: ''
        };

        // Helper function to get value regardless of case
        const getValue = (obj: any, key: string): string => {
          const lowerKey = key.toLowerCase();
          const upperKey = key.toUpperCase();
          if (obj[key] !== undefined) return obj[key];
          if (obj[lowerKey] !== undefined) return obj[lowerKey];
          if (obj[upperKey] !== undefined) return obj[upperKey];
          return '';
        };

        // title (required)
        const title = getValue(row, 'title');
        if (!title || title.trim() === '') {
          errors.push('Event title is missing - will use placeholder');
          record.title = `Event ${index + 1}`;
        } else {
          record.title = title.trim();
          if (record.title.length < 2) {
            errors.push('Event title is too short (min 2 characters)');
          }
          if (record.title.length > 200) {
            errors.push('Event title is too long (max 200 characters)');
          }
        }

        // date (required)
        const date = getValue(row, 'date') || getValue(row, 'eventDate');
        if (!date || date.trim() === '') {
          errors.push('Event date is missing - will use today\'s date');
          record.date = new Date().toISOString().split('T')[0];
        } else {
          // Validate date format
          const dateObj = new Date(date);
          if (isNaN(dateObj.getTime())) {
            errors.push('Invalid date format - will use today\'s date');
            record.date = new Date().toISOString().split('T')[0];
          } else {
            record.date = dateObj.toISOString().split('T')[0];
          }
        }

        // startTime (optional)
        const startTime = getValue(row, 'startTime') || getValue(row, 'start_time');
        if (startTime) {
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (timeRegex.test(startTime)) {
            record.startTime = startTime;
          } else {
            errors.push('Invalid start time format - will use 09:00');
            record.startTime = '09:00';
          }
        }

        // endTime (optional)
        const endTime = getValue(row, 'endTime') || getValue(row, 'end_time');
        if (endTime) {
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (timeRegex.test(endTime)) {
            record.endTime = endTime;
          } else {
            errors.push('Invalid end time format - will use 10:00');
            record.endTime = '10:00';
          }
        }

        // description (optional)
        const description = getValue(row, 'description');
        if (description) {
          record.description = description.trim();
        }

        // location (optional)
        const location = getValue(row, 'location');
        if (location) {
          record.location = location.trim();
        }

        // eventType (optional)
        const eventType = getValue(row, 'eventType') || getValue(row, 'event_type') || getValue(row, 'type');
        const validEventTypes = ['LECTURE', 'LABORATORY', 'CONFERENCE', 'MEETING', 'EXAM', 'OTHER'];
        if (eventType && validEventTypes.includes(eventType.toUpperCase())) {
          record.eventType = eventType.toUpperCase();
        } else if (eventType) {
          errors.push('Invalid event type - will default to LECTURE');
          record.eventType = 'LECTURE';
        }

        // status (optional)
        const status = getValue(row, 'status');
        const validStatuses = ['DRAFT', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED'];
        if (status && validStatuses.includes(status.toUpperCase())) {
          record.status = status.toUpperCase();
        } else if (status) {
          errors.push('Invalid status - will default to DRAFT');
          record.status = 'DRAFT';
        }

        // priority (optional)
        const priority = getValue(row, 'priority');
        const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
        if (priority && validPriorities.includes(priority.toUpperCase())) {
          record.priority = priority.toUpperCase();
        } else if (priority) {
          errors.push('Invalid priority - will default to NORMAL');
          record.priority = 'NORMAL';
        }

        // capacity (optional)
        const capacity = getValue(row, 'capacity');
        if (capacity) {
          const cap = parseInt(capacity);
          if (!isNaN(cap) && cap > 0) {
            record.capacity = cap;
          } else {
            errors.push('Invalid capacity - will be set to null');
            record.capacity = null;
          }
        }

        // isPublic (optional)
        const isPublic = getValue(row, 'isPublic') || getValue(row, 'is_public');
        if (isPublic !== '') {
          const value = isPublic.toLowerCase().trim();
          record.isPublic = value === 'true' || value === '1' || value === 'yes';
        }

        // requiresRegistration (optional)
        const requiresRegistration = getValue(row, 'requiresRegistration') || getValue(row, 'requires_registration');
        if (requiresRegistration !== '') {
          const value = requiresRegistration.toLowerCase().trim();
          record.requiresRegistration = value === 'true' || value === '1' || value === 'yes';
        }

        // contactEmail (optional)
        const contactEmail = getValue(row, 'contactEmail') || getValue(row, 'contact_email');
        if (contactEmail) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(contactEmail)) {
            record.contactEmail = contactEmail.trim();
          } else {
            errors.push('Invalid contact email format');
          }
        }

        // contactPhone (optional)
        const contactPhone = getValue(row, 'contactPhone') || getValue(row, 'contact_phone');
        if (contactPhone) {
          record.contactPhone = contactPhone.trim();
        }

        // imageUrl (optional)
        const imageUrl = getValue(row, 'imageUrl') || getValue(row, 'image_url');
        if (imageUrl) {
          record.imageUrl = imageUrl.trim();
        }

        record.errors = errors;
        record.isValid = true;
        return record;
      });
    }

    if (entityName.toLowerCase() === 'users') {
      // User schema validation
      return data.map((row, index) => {
        const errors: string[] = [];
        const record: any = {
          userName: '',
          email: '',
          role: 'STUDENT',
          status: 'active',
          isEmailVerified: false,
          twoFactorEnabled: false
        };

        // Helper function to get value regardless of case
        const getValue = (obj: any, key: string): string => {
          const lowerKey = key.toLowerCase();
          const upperKey = key.toUpperCase();
          if (obj[key] !== undefined) return obj[key];
          if (obj[lowerKey] !== undefined) return obj[lowerKey];
          if (obj[upperKey] !== undefined) return obj[upperKey];
          return '';
        };

        // userName (required)
        const userName = getValue(row, 'userName') || getValue(row, 'username');
        if (!userName || userName.trim() === '') {
          errors.push('Username is missing - will use placeholder');
          record.userName = `user${index + 1}`;
        } else {
          record.userName = userName.trim();
          if (record.userName.length < 3) {
            errors.push('Username is too short (min 3 characters)');
          }
          if (record.userName.length > 50) {
            errors.push('Username is too long (max 50 characters)');
          }
        }

        // email (required)
        const email = getValue(row, 'email');
        if (!email || email.trim() === '') {
          errors.push('Email is missing - will skip this record');
          record.isValid = false;
          record.errors = errors;
          return record;
        } else {
          record.email = email.trim().toLowerCase();
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(record.email)) {
            errors.push('Invalid email format');
          }
        }

        // role (required)
        const role = getValue(row, 'role').toUpperCase();
        const validRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR', 'STUDENT', 'GUARDIAN', 'SYSTEM_AUDITOR'];
        if (!role || !validRoles.includes(role)) {
          errors.push('Invalid or missing role - will default to STUDENT');
          record.role = 'STUDENT';
        } else {
          record.role = role;
        }

        // status (optional)
        const status = getValue(row, 'status').toLowerCase();
        const validStatuses = ['active', 'inactive', 'suspended', 'pending', 'blocked'];
        if (status && validStatuses.includes(status)) {
          record.status = status;
        } else if (status) {
          errors.push('Invalid status - will default to active');
          record.status = 'active';
        }

        // isEmailVerified (optional)
        const isEmailVerified = getValue(row, 'isEmailVerified');
        if (isEmailVerified !== '') {
          const value = isEmailVerified.toLowerCase().trim();
          record.isEmailVerified = value === 'true' || value === '1' || value === 'yes';
        }

        // twoFactorEnabled (optional)
        const twoFactorEnabled = getValue(row, 'twoFactorEnabled');
        if (twoFactorEnabled !== '') {
          const value = twoFactorEnabled.toLowerCase().trim();
          record.twoFactorEnabled = value === 'true' || value === '1' || value === 'yes';
        }

        record.errors = errors;
        record.isValid = true;
        return record;
      });
    }

    // Default: department validation
    return data.map((row, index) => {
      const errors: string[] = [];
      const record: ImportRecord = {
        departmentName: '',
        departmentCode: '',
        departmentDescription: '',
        departmentStatus: 'ACTIVE'
      };

      // Helper function to get value regardless of case
      const getValue = (obj: any, key: string): string => {
        const lowerKey = key.toLowerCase();
        const upperKey = key.toUpperCase();
        
        // Try exact match first
        if (obj[key] !== undefined) return obj[key];
        
        // Try lowercase
        if (obj[lowerKey] !== undefined) return obj[lowerKey];
        
        // Try uppercase
        if (obj[upperKey] !== undefined) return obj[upperKey];
        
        // Try camelCase variations
        if (obj['departmentName'] !== undefined && key === 'DEPARTMENTNAME') return obj['departmentName'];
        if (obj['departmentCode'] !== undefined && key === 'DEPARTMENTCODE') return obj['departmentCode'];
        if (obj['departmentDescription'] !== undefined && key === 'DEPARTMENTDESCRIPTION') return obj['departmentDescription'];
        if (obj['departmentStatus'] !== undefined && key === 'DEPARTMENTSTATUS') return obj['departmentStatus'];
        
        return '';
      };

      // Validate required fields with warnings instead of blocking errors
      const departmentName = getValue(row, 'DEPARTMENTNAME') || getValue(row, 'departmentName');
      if (!departmentName || departmentName.trim() === '') {
        errors.push('Department name is missing - will use placeholder');
        record.departmentName = `Department ${index + 1}`; // Provide default name
      } else {
        record.departmentName = departmentName.trim();
        if (record.departmentName.length < 2) {
          errors.push('Department name is too short (min 2 characters)');
        }
        if (record.departmentName.length > 100) {
          errors.push('Department name is too long (max 100 characters)');
        }
      }

      const departmentCode = getValue(row, 'DEPARTMENTCODE') || getValue(row, 'departmentCode');
      if (!departmentCode || departmentCode.trim() === '') {
        errors.push('Department code is missing - will auto-generate');
        record.departmentCode = `DEPT${String(index + 1).padStart(3, '0')}`; // Auto-generate code
      } else {
        record.departmentCode = departmentCode.trim().toUpperCase();
        if (record.departmentCode.length < 2) {
          errors.push('Department code is too short (min 2 characters)');
        }
        if (record.departmentCode.length > 10) {
          errors.push('Department code is too long (max 10 characters)');
        }
        if (!/^[A-Z0-9]+$/.test(record.departmentCode)) {
          errors.push('Department code contains invalid characters (use only letters and numbers)');
        }
      }

      // Optional fields
      const departmentDescription = getValue(row, 'DEPARTMENTDESCRIPTION') || getValue(row, 'departmentDescription');
      if (departmentDescription) {
        record.departmentDescription = departmentDescription.trim();
      }

      const departmentStatus = getValue(row, 'DEPARTMENTSTATUS') || getValue(row, 'departmentStatus');
      if (departmentStatus) {
        const status = departmentStatus.toUpperCase().trim();
        if (status === 'ACTIVE' || status === 'INACTIVE') {
          record.departmentStatus = status as "ACTIVE" | "INACTIVE";
        } else {
          errors.push('Invalid status - will default to "ACTIVE"');
          record.departmentStatus = 'ACTIVE'; // Provide default status
        }
      }

      record.errors = errors;
      // Allow import even with validation warnings
      record.isValid = true; // Changed from errors.length === 0

      return record;
    });
  };

  const handleImport = async () => {
    if (importData.length === 0) {
      showNotification(
        'error',
        'No Data to Import',
        'Please select a file with valid data before proceeding with import.',
        ['Ensure your file contains the required columns', 'Check that the file is not empty']
      );
      return;
    }

    // All records are now considered valid, but we'll show warnings
    const recordsToImport = importData;
    const recordsWithWarnings = importData.filter(record => record.errors && record.errors.length > 0);
    
    console.log('ImportDialog: Sending data to API:', JSON.stringify(recordsToImport, null, 2));
    
    if (recordsWithWarnings.length > 0) {
      showNotification(
        'warning',
        'Importing with Warnings',
        `${recordsWithWarnings.length} records have validation warnings but will be imported with default values.`,
        ['Missing fields will be filled with default values', 'You can review the warnings in the validation step']
      );
    }

    setIsImporting(true);
    setCurrentStep('import');
    setImportProgress(0);

    try {
      // Simulate progress updates
      progressIntervalRef.current = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const results = await onImport(recordsToImport);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setImportProgress(100);
      setImportResults(results);
      setCurrentStep('complete');

      if (results.success > 0) {
        showNotification(
          'success',
          'Import Completed Successfully',
          `${results.success} records imported successfully${results.failed > 0 ? `, ${results.failed} failed` : ''}`,
          results.failed > 0 ? [`${results.success} records imported`, `${results.failed} records failed`] : ['All records imported successfully']
        );
      } else {
        showNotification(
          'error',
          'Import Failed',
          'No records were imported successfully. Please check your data and try again.',
          ['Review the error details below', 'Ensure all required fields are present']
        );
      }
    } catch (error) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      showNotification(
        'error',
        'Import Failed',
        error instanceof Error ? error.message : "An unexpected error occurred",
        ['Please try again', 'If the problem persists, contact support']
      );
      setCurrentStep('validate');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    console.log('ImportDialog: Downloading template, templateUrl:', templateUrl);
    
    if (!templateUrl) {
      // Use custom builder when provided
      if (templateBuilder) {
        templateBuilder();
        return;
      }
      // Create a template for rooms or departments
      let templateData;
      let headers;
      let sheetName;
      if (entityName.toLowerCase() === 'emails') {
        templateData = [
          {
            subject: "Welcome to ICCT",
            sender: "admin@icct.edu",
            recipient: "student1@icct.edu",
            recipients: "student1@icct.edu, student2@icct.edu",
            to: "student1@icct.edu, student2@icct.edu",
            cc: "advisor@icct.edu",
            bcc: "",
            content: "Hello, this is a sample email.",
            priority: "NORMAL", // LOW, NORMAL, HIGH, URGENT
            folder: "INBOX", // INBOX, SENT, DRAFT, SPAM, TRASH
            status: "PENDING", // PENDING, SENT, DELIVERED, READ, FAILED, DRAFT
            isRead: "false",
            isStarred: "false",
            attachments: "/uploads/example1.png,/uploads/example2.png", // comma-separated URLs
            attachmentNames: "example1.png,example2.png"
          }
        ];
        headers = [
          'subject', 'sender', 'recipient', 'recipients', 'to', 'cc', 'bcc', 'content',
          'priority', 'folder', 'status', 'isRead', 'isStarred',
          'attachments', 'attachmentNames'
        ];
        sheetName = 'Emails Template';
        const ws = XLSX.utils.json_to_sheet(templateData, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `emails-import-template.xlsx`);
        return;
      }
      if (entityName.toLowerCase() === 'events') {
        templateData = [
          {
            title: "Computer Science Lecture",
            description: "Introduction to Programming Concepts",
            date: "2024-02-15",
            startTime: "09:00",
            endTime: "10:30",
            location: "Room 101",
            eventType: "LECTURE",
            status: "SCHEDULED",
            priority: "NORMAL",
            capacity: 40,
            isPublic: "true",
            requiresRegistration: "false",
            contactEmail: "instructor@icct.edu",
            contactPhone: "+1234567890",
            imageUrl: ""
          },
          {
            title: "Database Lab Session",
            description: "Hands-on SQL practice",
            date: "2024-02-16",
            startTime: "14:00",
            endTime: "16:00",
            location: "Lab 205",
            eventType: "LABORATORY",
            status: "SCHEDULED",
            priority: "HIGH",
            capacity: 25,
            isPublic: "true",
            requiresRegistration: "true",
            contactEmail: "lab.instructor@icct.edu",
            contactPhone: "+1234567891",
            imageUrl: ""
          },
          {
            title: "Faculty Meeting",
            description: "Monthly faculty coordination meeting",
            date: "2024-02-20",
            startTime: "10:00",
            endTime: "11:30",
            location: "Conference Room A",
            eventType: "MEETING",
            status: "DRAFT",
            priority: "NORMAL",
            capacity: 20,
            isPublic: "false",
            requiresRegistration: "false",
            contactEmail: "admin@icct.edu",
            contactPhone: "+1234567892",
            imageUrl: ""
          }
        ];
        headers = ['title', 'description', 'date', 'startTime', 'endTime', 'location', 'eventType', 'status', 'priority', 'capacity', 'isPublic', 'requiresRegistration', 'contactEmail', 'contactPhone', 'imageUrl'];
        sheetName = "Events Template";
        
        // Add instructions sheet
        const instructionsData = [
          {
            field: "title",
            description: "Required: Event title (2-200 characters)",
            example: "Computer Science Lecture",
            notes: "Main identifier for the event"
          },
          {
            field: "date",
            description: "Required: Event date (YYYY-MM-DD format)",
            example: "2024-02-15",
            notes: "Date when the event will occur"
          },
          {
            field: "startTime",
            description: "Optional: Start time (HH:MM format, defaults to 09:00)",
            example: "09:00",
            notes: "24-hour format preferred"
          },
          {
            field: "endTime",
            description: "Optional: End time (HH:MM format, defaults to 10:00)",
            example: "10:30",
            notes: "24-hour format preferred"
          },
          {
            field: "description",
            description: "Optional: Event description",
            example: "Introduction to Programming Concepts",
            notes: "Detailed information about the event"
          },
          {
            field: "location",
            description: "Optional: Event location",
            example: "Room 101",
            notes: "Where the event will take place"
          },
          {
            field: "eventType",
            description: "Optional: Type of event (defaults to LECTURE)",
            example: "LECTURE",
            notes: "Valid types: LECTURE, LABORATORY, CONFERENCE, MEETING, EXAM, OTHER"
          },
          {
            field: "status",
            description: "Optional: Event status (defaults to DRAFT)",
            example: "SCHEDULED",
            notes: "Valid statuses: DRAFT, SCHEDULED, ONGOING, COMPLETED, CANCELLED, POSTPONED"
          },
          {
            field: "priority",
            description: "Optional: Event priority (defaults to NORMAL)",
            example: "NORMAL",
            notes: "Valid priorities: LOW, NORMAL, HIGH, URGENT"
          },
          {
            field: "capacity",
            description: "Optional: Maximum attendees",
            example: "40",
            notes: "Number only, leave empty if no limit"
          },
          {
            field: "isPublic",
            description: "Optional: Public visibility (defaults to true)",
            example: "true",
            notes: "Use 'true' or 'false' (string)"
          },
          {
            field: "requiresRegistration",
            description: "Optional: Requires registration (defaults to false)",
            example: "false",
            notes: "Use 'true' or 'false' (string)"
          },
          {
            field: "contactEmail",
            description: "Optional: Contact email",
            example: "instructor@icct.edu",
            notes: "Must be valid email format"
          },
          {
            field: "contactPhone",
            description: "Optional: Contact phone number",
            example: "+1234567890",
            notes: "Any format accepted"
          },
          {
            field: "imageUrl",
            description: "Optional: Event image URL",
            example: "",
            notes: "URL to event image/thumbnail"
          }
        ];
        
        // Create main data sheet
        const ws = XLSX.utils.json_to_sheet(templateData, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        
        // Add instructions sheet
        const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
        XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");
        
        XLSX.writeFile(wb, `events-import-template.xlsx`);
        return;
      }
      if (entityName.toLowerCase() === 'rooms') {
        templateData = [
          {
            roomNo: "101",
            roomType: "LECTURE",
            roomCapacity: 40,
            roomBuildingLoc: "BuildingA",
            roomFloorLoc: "F1",
            readerId: "RDR001",
            status: "AVAILABLE",
            isActive: true
          },
          {
            roomNo: "202",
            roomType: "LABORATORY",
            roomCapacity: 30,
            roomBuildingLoc: "BuildingB",
            roomFloorLoc: "F2",
            readerId: "RDR002",
            status: "MAINTENANCE",
            isActive: false
          }
        ];
        headers = ['roomNo', 'roomType', 'roomCapacity', 'roomBuildingLoc', 'roomFloorLoc', 'readerId', 'status', 'isActive'];
        sheetName = "Rooms Template";
      } else if (entityName.toLowerCase() === 'courseoffering') {
        const templateData = [
          {
            courseCode: "BSCS",
            courseName: "Bachelor of Science in Computer Science",
            courseType: "MANDATORY", // or "ELECTIVE"
            departmentId: 1, // Must match an existing departmentId in your DB
            totalUnits: 150
          },
          {
            courseCode: "BSIT",
            courseName: "Bachelor of Science in Information Technology",
            courseType: "ELECTIVE",
            departmentId: 2,
            totalUnits: 140
          }
        ];
        const headers = ['courseCode', 'courseName', 'courseType', 'departmentId', 'totalUnits'];
        const sheetName = "CourseOffering Template";
        const ws = XLSX.utils.json_to_sheet(templateData, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `courseoffering-import-template.xlsx`);
        return;
      } else if (entityName.toLowerCase() === 'section') {
        const templateData = [
          {
            sectionName: "BSIT 1-A",
            sectionCapacity: 40,
            sectionStatus: "ACTIVE",
            yearLevel: 1,
            courseId: 1, // Must match an existing courseId in your DB
            academicYear: "2024-2025",
            semester: "FIRST_SEMESTER", // FIRST_SEMESTER, SECOND_SEMESTER, THIRD_SEMESTER
            roomAssignment: "Room 101",
            scheduleNotes: "Monday, Wednesday, Friday 8:00 AM - 10:00 AM"
          },
          {
            sectionName: "BSCS 2-B",
            sectionCapacity: 35,
            sectionStatus: "ACTIVE",
            yearLevel: 2,
            courseId: 2, // Must match an existing courseId in your DB
            academicYear: "2024-2025",
            semester: "FIRST_SEMESTER",
            roomAssignment: "Room 205",
            scheduleNotes: "Tuesday, Thursday 1:00 PM - 3:00 PM"
          },
          {
            sectionName: "BSIS 3-C",
            sectionCapacity: 30,
            sectionStatus: "INACTIVE",
            yearLevel: 3,
            courseId: 3, // Must match an existing courseId in your DB
            academicYear: "2024-2025",
            semester: "SECOND_SEMESTER",
            roomAssignment: "Lab 301",
            scheduleNotes: "Monday, Wednesday, Friday 2:00 PM - 4:00 PM"
          }
        ];
        const headers = ['sectionName', 'sectionCapacity', 'sectionStatus', 'yearLevel', 'courseId', 'academicYear', 'semester', 'roomAssignment', 'scheduleNotes'];
        const sheetName = "Sections Template";
        const ws = XLSX.utils.json_to_sheet(templateData, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `section-import-template.xlsx`);
        return;
      } else if (entityName.toLowerCase() === 'users') {
        const templateData = [
          {
            userName: "john.doe",
            email: "john.doe@icct.edu",
            role: "STUDENT",
            status: "active",
            isEmailVerified: "false",
            twoFactorEnabled: "false"
          },
          {
            userName: "jane.smith",
            email: "jane.smith@icct.edu",
            role: "INSTRUCTOR",
            status: "active",
            isEmailVerified: "true",
            twoFactorEnabled: "true"
          },
          {
            userName: "admin.user",
            email: "admin@icct.edu",
            role: "ADMIN",
            status: "active",
            isEmailVerified: "true",
            twoFactorEnabled: "false"
          },
          {
            userName: "dept.head",
            email: "dept.head@icct.edu",
            role: "DEPARTMENT_HEAD",
            status: "active",
            isEmailVerified: "true",
            twoFactorEnabled: "false"
          },
          {
            userName: "super.admin",
            email: "super.admin@icct.edu",
            role: "SUPER_ADMIN",
            status: "active",
            isEmailVerified: "true",
            twoFactorEnabled: "true"
          }
        ];
        const headers = ['userName', 'email', 'role', 'status', 'isEmailVerified', 'twoFactorEnabled'];
        const sheetName = "Users Template";
        
        // Add instructions sheet
        const instructionsData = [
          {
            field: "userName",
            description: "Required: Unique username (3-50 characters)",
            example: "john.doe",
            notes: "Will be used for login"
          },
          {
            field: "email",
            description: "Required: Valid email address",
            example: "john.doe@icct.edu",
            notes: "Must be unique in the system"
          },
          {
            field: "role",
            description: "Required: User role",
            example: "STUDENT",
            notes: "Valid roles: SUPER_ADMIN, ADMIN, DEPARTMENT_HEAD, INSTRUCTOR, STUDENT, GUARDIAN, SYSTEM_AUDITOR"
          },
          {
            field: "status",
            description: "Optional: User status (defaults to 'active')",
            example: "active",
            notes: "Valid statuses: active, inactive, suspended, pending, blocked"
          },
          {
            field: "isEmailVerified",
            description: "Optional: Email verification status (defaults to false)",
            example: "false",
            notes: "Use 'true' or 'false' (string)"
          },
          {
            field: "twoFactorEnabled",
            description: "Optional: Two-factor authentication (defaults to false)",
            example: "false",
            notes: "Use 'true' or 'false' (string)"
          }
        ];
        
        // Create main data sheet
        const ws = XLSX.utils.json_to_sheet(templateData, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        
        // Add instructions sheet
        const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
        XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");
        
        XLSX.writeFile(wb, `users-import-template.xlsx`);
        return;
      } else if (entityName.toLowerCase() === 'role') {
        const templateData = [
          {
            roleName: "Department Head",
            roleDescription: "Department-specific administration and oversight",
            rolePermissions: "View Users, Edit Users, View Attendance, Manage Departments, Department Reports, Department Users",
            roleStatus: "ACTIVE"
          },
          {
            roleName: "Instructor",
            roleDescription: "Classroom and attendance management",
            rolePermissions: "View Attendance, Edit Attendance, View Reports, Send Announcements",
            roleStatus: "ACTIVE"
          },
          {
            roleName: "Student Assistant",
            roleDescription: "Limited access for student assistants",
            rolePermissions: "View Attendance, View Reports",
            roleStatus: "ACTIVE"
          },
          {
            roleName: "Guest User",
            roleDescription: "Temporary access for external users",
            rolePermissions: "View Attendance",
            roleStatus: "INACTIVE"
          }
        ];
        const headers = ['roleName', 'roleDescription', 'rolePermissions', 'roleStatus'];
        const sheetName = "Roles Template";
        
        // Add instructions sheet
        const instructionsData = [
          {
            field: "roleName",
            description: "Required: Unique role name (2-50 characters)",
            example: "Department Head",
            notes: "Must be unique in the system"
          },
          {
            field: "roleDescription",
            description: "Optional: Role description",
            example: "Department-specific administration and oversight",
            notes: "Helps explain the role's purpose"
          },
          {
            field: "rolePermissions",
            description: "Required: Comma-separated list of permissions",
            example: "View Users, Edit Users, View Attendance",
            notes: "Valid permissions: View Users, Edit Users, Delete Users, Assign Roles, View Attendance, Edit Attendance, Manage Departments, View Reports, etc."
          },
          {
            field: "roleStatus",
            description: "Optional: Role status (defaults to 'ACTIVE')",
            example: "ACTIVE",
            notes: "Valid statuses: ACTIVE, INACTIVE, ARCHIVED"
          }
        ];
        
        // Create main data sheet
        const ws = XLSX.utils.json_to_sheet(templateData, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        
        // Add instructions sheet
        const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
        XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");
        
        XLSX.writeFile(wb, `role-import-template.xlsx`);
        return;
      } else {
        templateData = [
          {
            departmentName: "Computer Science",
            departmentCode: "CS",
            departmentDescription: "Department of Computer Science and Informatics",
            departmentStatus: "ACTIVE"
          },
          {
            departmentName: "Business Administration",
            departmentCode: "BA",
            departmentDescription: "Department of Business Administration and Management",
            departmentStatus: "ACTIVE"
          },
          {
            departmentName: "Engineering",
            departmentCode: "ENG",
            departmentDescription: "Department of Engineering and Technology",
            departmentStatus: "ACTIVE"
          },
          {
            departmentName: "Arts and Sciences",
            departmentCode: "AS",
            departmentDescription: "Department of Arts and Sciences",
            departmentStatus: "INACTIVE"
          }
        ];
        headers = ['departmentName', 'departmentCode', 'departmentDescription', 'departmentStatus'];
        sheetName = "Departments Template";
      }
      console.log('ImportDialog: Creating template with data:', templateData);
      const ws = XLSX.utils.json_to_sheet(templateData, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${entityName.toLowerCase()}-import-template.xlsx`);
      console.log('ImportDialog: Template file created successfully');
    } else {
      // Download from URL
      console.log('ImportDialog: Downloading template from URL:', templateUrl);
      const link = document.createElement('a');
      link.href = templateUrl;
      link.download = `${entityName.toLowerCase()}-import-template.xlsx`;
      link.click();
    }
  };

  const handleClose = () => {
    console.log('ImportDialog: handleClose called');
    resetState();
    
    // Reset focus to body when dialog closes
    setTimeout(() => {
      document.body.focus();
      // Remove any potential overlay issues
      const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
      overlays.forEach(overlay => {
        if (overlay instanceof HTMLElement) {
          overlay.style.pointerEvents = 'none';
        }
      });
    }, 100);
    
    onOpenChange(false);
  };

  const recordsWithWarnings = importData.filter(record => record.errors && record.errors.length > 0);
  const recordsWithoutWarnings = importData.filter(record => !record.errors || record.errors.length === 0);

  // Handle dialog close with proper cleanup
  const handleOpenChange = (newOpen: boolean) => {
    console.log('ImportDialog: onOpenChange called with', newOpen);
    if (!newOpen) {
      // Reset focus to body when dialog closes
      setTimeout(() => {
        document.body.focus();
        // Remove any potential overlay issues
        const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
        overlays.forEach(overlay => {
          if (overlay instanceof HTMLElement) {
            overlay.style.pointerEvents = 'none';
          }
        });
      }, 100);
      
      // Dialog is closing, reset state
      resetState();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog 
      key={`import-dialog-${open ? 'open' : 'closed'}`}
      open={open} 
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden rounded-xl flex flex-col">
        <DialogHeader className="p-0 flex-shrink-0">
          <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-6 rounded-t-xl -m-6 -mt-6">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  {entityName.toLowerCase() === 'courseoffering' ? 'Import Course Offerings' : 
                   entityName.toLowerCase() === 'users' ? 'Import Users' : 
                   `Import ${entityName}`}
                </DialogTitle>
                <p className="text-blue-100 text-sm mt-1">
                  {entityName.toLowerCase() === 'courseoffering'
                    ? 'Upload and import course offering data from CSV or Excel files'
                    : entityName.toLowerCase() === 'users'
                    ? 'Upload and import user data from CSV or Excel files'
                    : `Upload and import ${entityName.toLowerCase()} data from CSV or Excel files`}
                </p>
              </div>
            </div>
            
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-10 w-10 rounded-full hover:bg-white/20 text-white"
              onClick={handleClose}
              aria-label="Close dialog"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Progress Steps - Fixed below header */}
          <div className="flex-shrink-0 px-6 py-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              {[
                { key: 'upload', label: 'Upload File', icon: Upload },
                { key: 'validate', label: 'Validate Data', icon: Eye },
                { key: 'import', label: 'Import Records', icon: Loader2 },
                { key: 'complete', label: 'Complete', icon: CheckCircle }
              ].map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.key;
                const isCompleted = ['upload', 'validate', 'import', 'complete'].indexOf(currentStep) > index;
                
                return (
                  <div key={step.key} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      isActive ? 'bg-blue-600 text-white' : 
                      isCompleted ? 'bg-green-600 text-white' : 
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      isActive ? 'text-blue-600' : 
                      isCompleted ? 'text-green-600' : 
                      'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                    {index < 3 && (
                      <div className={`w-8 h-0.5 mx-2 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6">
            {currentStep === 'upload' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Upload {entityName.toLowerCase() === 'users' ? 'User' : entityName} Data
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Select a CSV or Excel file containing {entityName.toLowerCase() === 'users' ? 'user' : entityName.toLowerCase()} data to import.
                  </p>
                </div>

                {/* Admin Warning for Role Import */}
                {currentUserRole === 'ADMIN' && entityName.toLowerCase() === 'role' && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-900">Admin Access Restrictions</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          As an Admin user, you can only import roles with appropriate permissions. 
                          System-level permissions and restricted role names will be automatically filtered out.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Template Download */}
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-blue-900">Download Template</h4>
                        <p className="text-sm text-blue-700">
                          Use our template to ensure your data is formatted correctly
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadTemplate}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100 rounded"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </div>

                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedFileTypes.join(',')}
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0];
                      if (selectedFile) {
                        handleFileSelect(selectedFile);
                      }
                    }}
                    className="hidden"
                  />
                  
                  <div className="space-y-4">
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        Drop your file here, or click to browse
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Supports {acceptedFileTypes.join(', ')} files up to {maxFileSize}MB
                      </p>
                    </div>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700 rounded"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                </div>

                {/* File Requirements */}
                <div className="bg-gray-50 border border-gray-200 rounded p-4">
                  <h4 className="font-medium text-gray-900 mb-2">File Requirements</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {fileRequirements ? (
                      fileRequirements
                    ) : entityName.toLowerCase() === 'emails' ? (
                      <>
                        <li>• File must be in CSV or Excel format</li>
                        <li>• Maximum file size: {maxFileSize}MB</li>
                        <li>• Required columns: <b>subject</b>, <b>sender</b>, <b>recipient</b> (or use <b>to</b>)</li>
                        <li>• Optional columns: <b>to</b>, <b>cc</b>, <b>bcc</b>, <b>content</b>, <b>priority</b>, <b>folder</b>, <b>status</b>, <b>isRead</b>, <b>isStarred</b>, <b>attachments</b>, <b>attachmentNames</b></li>
                        <li>• <b>priority</b> values: "LOW", "NORMAL", "HIGH", "URGENT" (defaults to "NORMAL")</li>
                        <li>• <b>folder</b> values: "INBOX", "SENT", "DRAFT", "SPAM", "TRASH" (defaults to "INBOX")</li>
                        <li>• <b>status</b> values: "PENDING", "SENT", "DELIVERED", "READ", "FAILED", "DRAFT" (defaults to "PENDING")</li>
                        <li>• <b>isRead</b>/<b>isStarred</b>: "true" or "false"</li>
                        <li>• <b>to</b>/<b>cc</b>/<b>bcc</b>: comma-separated emails (e.g., "a@icct.edu, b@icct.edu")</li>
                        <li>• <b>attachments</b>: comma-separated URLs; <b>attachmentNames</b> (optional) provides matching display names</li>
                      </>
                    ) : entityName.toLowerCase() === 'events' ? (
                      <>
                        <li>• File must be in CSV or Excel format</li>
                        <li>• Maximum file size: {maxFileSize}MB</li>
                        <li>• Required columns: <b>title</b>, <b>date</b></li>
                        <li>• Optional columns: <b>description</b>, <b>startTime</b>, <b>endTime</b>, <b>location</b>, <b>eventType</b>, <b>status</b>, <b>priority</b>, <b>capacity</b>, <b>isPublic</b>, <b>requiresRegistration</b>, <b>contactEmail</b>, <b>contactPhone</b>, <b>imageUrl</b></li>
                        <li>• <b>date</b> format: YYYY-MM-DD (e.g., "2024-02-15")</li>
                        <li>• <b>startTime</b>/<b>endTime</b> format: HH:MM (e.g., "09:00", "14:30")</li>
                        <li>• <b>eventType</b> values: "LECTURE", "LABORATORY", "CONFERENCE", "MEETING", "EXAM", "OTHER"</li>
                        <li>• <b>status</b> values: "DRAFT", "SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED", "POSTPONED"</li>
                        <li>• <b>priority</b> values: "LOW", "NORMAL", "HIGH", "URGENT"</li>
                        <li>• <b>isPublic</b>/<b>requiresRegistration</b>: "true" or "false"</li>
                        <li>• <b>capacity</b>: number only (leave empty if no limit)</li>
                        <li>• <b>contactEmail</b>: must be valid email format</li>
                      </>
                    ) : entityName.toLowerCase() === 'courseoffering' ? (
                      <>
                        <li>• File must be in CSV or Excel format</li>
                        <li>• Maximum file size: {maxFileSize}MB</li>
                        <li>• Required columns: <b>courseCode</b>, <b>courseName</b>, <b>courseType</b>, <b>departmentId</b>, <b>totalUnits</b></li>
                        <li>• <b>courseType</b> values: "MANDATORY" or "ELECTIVE"</li>
                        <li>• <b>departmentId</b> must match an existing department in the system</li>
                        <li>• <b>totalUnits</b> must be a number</li>
                      </>
                    ) : entityName.toLowerCase() === 'role' ? (
                      <>
                        <li>• File must be in CSV or Excel format</li>
                        <li>• Maximum file size: {maxFileSize}MB</li>
                        <li>• Required columns: <b>roleName</b>, <b>rolePermissions</b></li>
                        <li>• Optional columns: <b>roleDescription</b>, <b>roleStatus</b></li>
                        <li>• <b>roleName</b> must be unique and between 2-50 characters</li>
                        <li>• <b>rolePermissions</b> can be comma-separated or JSON array format</li>
                        <li>• <b>roleStatus</b> values: "ACTIVE", "INACTIVE", or "ARCHIVED" (defaults to "ACTIVE")</li>
                        <li>• Available permissions: View Users, Edit Users, Delete Users, View Attendance, Edit Attendance, Manage Courses, etc.</li>
                      </>
                    ) : (
                      <>
                        <li>• File must be in CSV or Excel format</li>
                        <li>• Maximum file size: {maxFileSize}MB</li>
                        <li>• Required columns: departmentName, departmentCode</li>
                        <li>• Optional columns: departmentDescription, departmentStatus</li>
                        <li>• Status values: "ACTIVE" or "INACTIVE" (defaults to "ACTIVE")</li>
                        <li>• Head of Department is managed separately through the instructor system</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {currentStep === 'validate' && (
              <div className="space-y-6">
                {isProcessing ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Processing file...</p>
                  </div>
                ) : (
                  <>
                    {/* File Info */}
                    {file && (
                      <div className="bg-green-50 border border-green-200 rounded p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-green-600" />
                            <div>
                              <h4 className="font-medium text-green-900">{file.name}</h4>
                              <p className="text-sm text-green-700">
                                {(file.size / 1024 / 1024).toFixed(2)} MB • {importData.length} records found
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFile(null);
                              setCurrentStep('upload');
                            }}
                            className="border-green-300 text-green-700 hover:bg-green-100 rounded"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Validation Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-blue-900">Ready to Import</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 mt-2">{importData.length}</p>
                      </div>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          <span className="font-medium text-yellow-900">Records with Warnings</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-600 mt-2">{recordsWithWarnings.length}</p>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded p-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-gray-600" />
                          <span className="font-medium text-gray-900">Total Warnings</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-600 mt-2">{validationErrors.length}</p>
                      </div>
                    </div>

                    {/* Admin Access Restrictions Warning */}
                    {currentUserRole === 'ADMIN' && entityName.toLowerCase() === 'role' && (
                      <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-amber-900">Admin Access Restrictions Applied</h4>
                            <p className="text-sm text-amber-700 mt-1">
                              System-level permissions and restricted role names have been automatically filtered out 
                              to comply with Admin user restrictions.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Validation Warnings */}
                    {validationErrors.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                        <h4 className="font-medium text-yellow-900 mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Validation Warnings
                        </h4>
                        <p className="text-sm text-yellow-700 mb-3">
                          The following issues were found. Records will be imported with default values where needed.
                        </p>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {validationErrors.slice(0, 10).map((error, index) => (
                            <div key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                              <span className="text-yellow-500">•</span>
                              <span>{error}</span>
                            </div>
                          ))}
                          {validationErrors.length > 10 && (
                            <p className="text-sm text-yellow-600 italic">
                              ... and {validationErrors.length - 10} more warnings
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Data Preview */}
                    {importData.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Data Preview</h4>
                        <div className="border border-gray-200 rounded overflow-hidden">
                          <div className="overflow-x-auto">
                            {entityName.toLowerCase() === 'emails' ? (
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Subject</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Sender</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Recipients</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Priority</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Folder</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Validation</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {importData.slice(0, 5).map((record, index) => (
                                    <tr key={index} className={record.errors && record.errors.length > 0 ? 'bg-yellow-50' : 'bg-white'}>
                                      <td className="px-4 py-2">{(record as any).subject}</td>
                                      <td className="px-4 py-2">{(record as any).sender}</td>
                                      <td className="px-4 py-2">
                                        <div className="max-w-xs truncate" title={(record as any).recipients || (record as any).to || (record as any).recipient}>
                                          {(record as any).recipients || (record as any).to || (record as any).recipient || '-'}
                                        </div>
                                      </td>
                                      <td className="px-4 py-2">
                                        <Badge variant={((record as any).status || 'PENDING') === 'FAILED' ? 'destructive' : 'secondary'}>
                                          {(record as any).status || 'PENDING'}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-2">
                                        <Badge variant={((record as any).priority || 'NORMAL') === 'URGENT' ? 'destructive' : ((record as any).priority || 'NORMAL') === 'HIGH' ? 'secondary' : 'outline'}>
                                          {(record as any).priority || 'NORMAL'}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-2">{(record as any).folder || 'INBOX'}</td>
                                      <td className="px-4 py-2">
                                        {record.errors && record.errors.length > 0 ? (
                                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                        ) : (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : entityName.toLowerCase() === 'courseoffering' ? (
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Course Code</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Course Name</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Course Type</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Department ID</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Total Units</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Validation</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {importData.slice(0, 5).map((record, index) => (
                                    <tr key={index} className={record.errors && record.errors.length > 0 ? 'bg-yellow-50' : 'bg-white'}>
                                      <td className="px-4 py-2">{(record as any).courseCode}</td>
                                      <td className="px-4 py-2">{(record as any).courseName}</td>
                                      <td className="px-4 py-2">{(record as any).courseType}</td>
                                      <td className="px-4 py-2">{(record as any).departmentId}</td>
                                      <td className="px-4 py-2">{(record as any).totalUnits}</td>
                                      <td className="px-4 py-2">
                                        {record.errors && record.errors.length > 0 ? (
                                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                        ) : (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : entityName.toLowerCase() === 'section' ? (
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Section Name</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Capacity</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Year Level</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Course ID</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Validation</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {importData.slice(0, 5).map((record, index) => (
                                    <tr key={index} className={record.errors && record.errors.length > 0 ? 'bg-yellow-50' : 'bg-white'}>
                                      <td className="px-4 py-2">{record.sectionName}</td>
                                      <td className="px-4 py-2">{record.sectionCapacity}</td>
                                      <td className="px-4 py-2">
                                        <Badge variant={record.sectionStatus === 'ACTIVE' ? 'success' : 'destructive'}>
                                          {record.sectionStatus}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-2">{record.yearLevel}</td>
                                      <td className="px-4 py-2">{record.courseId}</td>
                                      <td className="px-4 py-2">
                                        {record.errors && record.errors.length > 0 ? (
                                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                        ) : (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : entityName.toLowerCase() === 'role' ? (
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Role Name</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Description</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Permissions</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Validation</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {importData.slice(0, 5).map((record, index) => (
                                    <tr key={index} className={record.errors && record.errors.length > 0 ? 'bg-yellow-50' : 'bg-white'}>
                                      <td className="px-4 py-2">{record.roleName}</td>
                                      <td className="px-4 py-2">{record.roleDescription || '-'}</td>
                                      <td className="px-4 py-2">
                                        <div className="max-w-xs truncate" title={record.rolePermissions?.join(', ')}>
                                          {record.rolePermissions?.slice(0, 2).join(', ')}
                                          {record.rolePermissions && record.rolePermissions.length > 2 && '...'}
                                        </div>
                                      </td>
                                      <td className="px-4 py-2">
                                        <Badge variant={record.roleStatus === 'ACTIVE' ? 'success' : record.roleStatus === 'INACTIVE' ? 'destructive' : 'secondary'}>
                                          {record.roleStatus}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-2">
                                        {record.errors && record.errors.length > 0 ? (
                                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                        ) : (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : entityName.toLowerCase() === 'events' ? (
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Title</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Date</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Time</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Location</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Type</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Priority</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Validation</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {importData.slice(0, 5).map((record, index) => (
                                    <tr key={index} className={record.errors && record.errors.length > 0 ? 'bg-yellow-50' : 'bg-white'}>
                                      <td className="px-4 py-2">
                                        <div className="max-w-xs truncate" title={(record as any).title}>
                                          {(record as any).title}
                                        </div>
                                      </td>
                                      <td className="px-4 py-2">{(record as any).date}</td>
                                      <td className="px-4 py-2">{(record as any).startTime} - {(record as any).endTime}</td>
                                      <td className="px-4 py-2">
                                        <div className="max-w-xs truncate" title={(record as any).location}>
                                          {(record as any).location || '-'}
                                        </div>
                                      </td>
                                      <td className="px-4 py-2">
                                        <Badge variant={
                                          (record as any).eventType === 'LECTURE' ? 'default' :
                                          (record as any).eventType === 'LABORATORY' ? 'secondary' :
                                          (record as any).eventType === 'CONFERENCE' ? 'outline' :
                                          (record as any).eventType === 'MEETING' ? 'success' :
                                          (record as any).eventType === 'EXAM' ? 'destructive' :
                                          'default'
                                        }>
                                          {(record as any).eventType}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-2">
                                        <Badge variant={
                                          (record as any).status === 'SCHEDULED' ? 'default' :
                                          (record as any).status === 'ONGOING' ? 'success' :
                                          (record as any).status === 'COMPLETED' ? 'secondary' :
                                          (record as any).status === 'CANCELLED' ? 'destructive' :
                                          (record as any).status === 'POSTPONED' ? 'outline' :
                                          'default'
                                        }>
                                          {(record as any).status}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-2">
                                        <Badge variant={
                                          (record as any).priority === 'URGENT' ? 'destructive' :
                                          (record as any).priority === 'HIGH' ? 'secondary' :
                                          (record as any).priority === 'NORMAL' ? 'default' :
                                          (record as any).priority === 'LOW' ? 'outline' :
                                          'default'
                                        }>
                                          {(record as any).priority}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-2">
                                        {record.errors && record.errors.length > 0 ? (
                                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                        ) : (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : entityName.toLowerCase() === 'users' ? (
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Username</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Email</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Role</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Email Verified</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">2FA</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Validation</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {importData.slice(0, 5).map((record, index) => (
                                    <tr key={index} className={record.errors && record.errors.length > 0 ? 'bg-yellow-50' : 'bg-white'}>
                                      <td className="px-4 py-2">{record.userName || '-'}</td>
                                      <td className="px-4 py-2">{record.email || '-'}</td>
                                      <td className="px-4 py-2">
                                        <Badge variant={
                                          record.role === 'SUPER_ADMIN' ? 'destructive' :
                                          record.role === 'ADMIN' ? 'default' :
                                          record.role === 'DEPARTMENT_HEAD' ? 'secondary' :
                                          record.role === 'INSTRUCTOR' ? 'outline' :
                                          record.role === 'STUDENT' ? 'success' :
                                          record.role === 'GUARDIAN' ? 'secondary' :
                                          'default'
                                        }>
                                          {record.role}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-2">
                                        <Badge variant={
                                          record.status === 'active' ? 'success' :
                                          record.status === 'inactive' ? 'destructive' :
                                          record.status === 'suspended' ? 'secondary' :
                                          record.status === 'pending' ? 'outline' :
                                          'default'
                                        }>
                                          {record.status}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-2">
                                        {record.isEmailVerified ? (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-red-600" />
                                        )}
                                      </td>
                                      <td className="px-4 py-2">
                                        {record.twoFactorEnabled ? (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-red-600" />
                                        )}
                                      </td>
                                      <td className="px-4 py-2">
                                        {record.errors && record.errors.length > 0 ? (
                                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                        ) : (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Department Name</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Department Code</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Description</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Validation</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {importData.slice(0, 5).map((record, index) => (
                                    <tr key={index} className={record.errors && record.errors.length > 0 ? 'bg-yellow-50' : 'bg-white'}>
                                      <td className="px-4 py-2">{record.departmentName}</td>
                                      <td className="px-4 py-2">{record.departmentCode}</td>
                                      <td className="px-4 py-2">{record.departmentDescription || '-'}</td>
                                      <td className="px-4 py-2">
                                        <Badge variant={record.departmentStatus === 'ACTIVE' ? 'success' : 'destructive'}>
                                          {record.departmentStatus}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-2">
                                        {record.errors && record.errors.length > 0 ? (
                                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                        ) : (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                          {importData.length > 5 && (
                            <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 text-center">
                              Showing first 5 of {importData.length} records
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {currentStep === 'import' && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Importing Records</h3>
                <p className="text-gray-600 mb-4">Please wait while we import your data...</p>
                <Progress value={importProgress} className="w-full max-w-md mx-auto" />
                <p className="text-sm text-gray-500 mt-2">{importProgress}% complete</p>
              </div>
            )}

            {currentStep === 'complete' && importResults && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                    importResults.success > 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {importResults.success > 0 ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <X className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Import {importResults.success > 0 ? 'Completed' : 'Failed'}
                  </h3>
                  <p className="text-gray-600">
                    {importResults.success} records imported successfully
                    {importResults.failed > 0 && `, ${importResults.failed} failed`}
                  </p>
                </div>

                {/* Results Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900">Successfully Imported</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 mt-2">{importResults.success}</p>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded p-4">
                    <div className="flex items-center gap-2">
                      <X className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-900">Failed to Import</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600 mt-2">{importResults.failed}</p>
                  </div>
                </div>

                {/* Error Details */}
                {importResults.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded p-4">
                    <h4 className="font-medium text-red-900 mb-3">Import Errors</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {importResults.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-sm text-red-700 flex items-start gap-2">
                          <span className="text-red-500">•</span>
                          <span>{error}</span>
                        </div>
                      ))}
                      {importResults.errors.length > 10 && (
                        <p className="text-sm text-red-600 italic">
                          ... and {importResults.errors.length - 10} more errors
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="flex items-center justify-between pt-6 border-t border-gray-200 flex-shrink-0 px-6">
            <div className="flex items-center gap-2">
              {templateUrl && (
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isImporting}
                className="rounded"
              >
                {currentStep === 'complete' ? 'Close' : 'Cancel'}
              </Button>
              
              {currentStep === 'validate' && importData.length > 0 && (
                <Button
                  onClick={handleImport}
                  disabled={isImporting || importData.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 rounded"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import {importData.length} Records
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>

      {/* Notification Dialog */}
      <Dialog open={notificationDialog.open} onOpenChange={(open) => setNotificationDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[500px] bg-white/95 border border-blue-100 shadow-lg rounded-xl py-6 px-6">
          <DialogHeader>
            <DialogTitle className={`text-lg font-bold flex items-center gap-2 ${
              notificationDialog.type === 'success' ? 'text-green-700' :
              notificationDialog.type === 'error' ? 'text-red-700' :
              notificationDialog.type === 'warning' ? 'text-yellow-700' :
              'text-blue-700'
            }`}>
              {notificationDialog.type === 'success' && <CheckCircle className="h-5 w-5" />}
              {notificationDialog.type === 'error' && <X className="h-5 w-5" />}
              {notificationDialog.type === 'warning' && <AlertTriangle className="h-5 w-5" />}
              {notificationDialog.type === 'info' && <Info className="h-5 w-5" />}
              {notificationDialog.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-gray-700">{notificationDialog.message}</p>
            
            {notificationDialog.details && notificationDialog.details.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <ul className="space-y-1">
                  {notificationDialog.details.map((detail, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setNotificationDialog(prev => ({ ...prev, open: false }))}
              className={`rounded ${
                notificationDialog.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                notificationDialog.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                notificationDialog.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

export { ImportDialog };
export default ImportDialog; 