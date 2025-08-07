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
  Info
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface ImportRecord {
  departmentName: string;
  departmentCode: string;
  departmentDescription?: string;
  departmentStatus: "ACTIVE" | "INACTIVE";
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
}

export function ImportDialog({
  open,
  onOpenChange,
  onImport,
  entityName,
  templateUrl,
  acceptedFileTypes = [".csv", ".xlsx", ".xls"],
  maxFileSize = 5
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
            // Parse CSV with better handling
            const csvText = data as string;
            console.log('CSV Content:', csvText.substring(0, 500)); // Debug log
            
            const lines = csvText.split('\n').filter(line => line.trim() !== '');
            console.log('CSV Lines:', lines.length); // Debug log
            
            if (lines.length === 0) {
              reject(new Error("CSV file is empty"));
              return;
            }

            // Parse headers - handle quoted fields
            const headerLine = lines[0];
            const headers = parseCSVLine(headerLine).map((h: string) => h.trim().replace(/"/g, ''));
            console.log('CSV Headers:', headers); // Debug log
            
            // Parse data rows
            parsedData = lines.slice(1).map((line, index) => {
              const values = parseCSVLine(line);
              const row: any = {};
              headers.forEach((header: string, i: number) => {
                row[header] = (values[i] || '').trim().replace(/"/g, '');
              });
              return row;
            }).filter(row => Object.values(row).some(val => val !== ''));
            
            console.log('Parsed CSV Data:', parsedData); // Debug log
          } else {
            // Parse Excel with better error handling
            console.log('Parsing Excel file...'); // Debug log
            const workbook = XLSX.read(data, { type: 'binary' });
            console.log('Excel Sheets:', workbook.SheetNames); // Debug log
            
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            if (!worksheet) {
              reject(new Error("No worksheet found in Excel file"));
              return;
            }
            
            parsedData = XLSX.utils.sheet_to_json(worksheet);
            console.log('Parsed Excel Data:', parsedData); // Debug log
            console.log('Excel Headers (first row keys):', parsedData.length > 0 ? Object.keys(parsedData[0]) : 'No data'); // Debug log
          }

          if (parsedData.length === 0) {
            reject(new Error("No data found in file"));
            return;
          }

          console.log('Final parsed data:', parsedData); // Debug log
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
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  const validateImportData = (data: any[]): ImportRecord[] => {
    console.log('Validation: Received data with keys:', data.length > 0 ? Object.keys(data[0]) : 'No data');
    console.log('Validation: First row sample:', data.length > 0 ? data[0] : 'No data');

    if (entityName.toLowerCase() === 'rooms') {
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
      // Create a template for rooms or departments
      let templateData;
      let headers;
      let sheetName;
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
                  Import {entityName}
                </DialogTitle>
                <p className="text-blue-100 text-sm mt-1">
                  Upload and import {entityName.toLowerCase()} data from CSV or Excel files
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
                    Upload {entityName} Data
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Select a CSV or Excel file containing {entityName.toLowerCase()} data to import.
                  </p>
                </div>

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
                    <li>• File must be in CSV or Excel format</li>
                    <li>• Maximum file size: {maxFileSize}MB</li>
                    <li>• Required columns: departmentName, departmentCode</li>
                    <li>• Optional columns: departmentDescription, departmentStatus</li>
                    <li>• Status values: "ACTIVE" or "INACTIVE" (defaults to "ACTIVE")</li>
                    <li>• Head of Department is managed separately through the instructor system</li>
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
                            {entityName.toLowerCase() === 'rooms' ? (
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Room Number</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Type</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Capacity</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Building</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Floor</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">RFID Reader</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Active</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Validation</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {importData.slice(0, 5).map((record, index) => {
                                    const roomRecord = record as any;
                                    return (
                                      <tr key={index} className={roomRecord.errors && roomRecord.errors.length > 0 ? 'bg-yellow-50' : 'bg-white'}>
                                        <td className="px-4 py-2">{roomRecord?.roomNo}</td>
                                        <td className="px-4 py-2">{roomRecord?.roomType}</td>
                                        <td className="px-4 py-2">{roomRecord?.roomCapacity}</td>
                                        <td className="px-4 py-2">{roomRecord?.roomBuildingLoc}</td>
                                        <td className="px-4 py-2">{roomRecord?.roomFloorLoc}</td>
                                        <td className="px-4 py-2">{roomRecord?.readerId || '-'}</td>
                                        <td className="px-4 py-2">
                                          <Badge variant={roomRecord?.status === 'AVAILABLE' ? 'success' : 'destructive'}>
                                            {roomRecord?.status}
                                          </Badge>
                                        </td>
                                        <td className="px-4 py-2">
                                          <Badge variant={roomRecord?.isActive ? 'success' : 'destructive'}>
                                            {roomRecord?.isActive ? 'Yes' : 'No'}
                                          </Badge>
                                        </td>
                                        <td className="px-4 py-2">
                                          {roomRecord?.errors && roomRecord.errors.length > 0 ? (
                                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                          ) : (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
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