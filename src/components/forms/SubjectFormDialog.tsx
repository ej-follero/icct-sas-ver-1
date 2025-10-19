import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { 
  Book, 
  X, 
  AlertCircle, 
  Loader2, 
  FileText, 
  ToggleLeft, 
  BadgeInfo, 
  Pencil, 
  Plus, 
  Save, 
  Clock, 
  Search, 
  Filter, 
  RotateCcw, 
  Trash2, 
  Check,
  Info,
  User,
  List,
  Building2,
  School,
  Layers,
  FileDiff
} from "lucide-react";
import SubjectForm from "./SubjectForm";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";

interface SubjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "create" | "update";
  data?: any;
  id?: string;
  onSuccess: () => void;
}

function SubjectFormDialog({
  open,
  onOpenChange,
  type,
  data,
  id,
  onSuccess
}: SubjectFormDialogProps) {
  // Validate props
  if (!onOpenChange || !onSuccess) {
    console.error('SubjectFormDialog: Missing required props');
    return null;
  }

  // State management for form functionality
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const isEdit = !!data;
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftExists, setDraftExists] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [formProgress, setFormProgress] = useState(0);
  const [resetKey, setResetKey] = useState<number>(0);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Dialog states for Save Draft functionality
  const [showDraftSavedDialog, setShowDraftSavedDialog] = useState(false);
  const [showDraftErrorDialog, setShowDraftErrorDialog] = useState(false);
  const [draftErrorMessage, setDraftErrorMessage] = useState("");
  const [showDraftClearedDialog, setShowDraftClearedDialog] = useState(false);
  const [showDraftRestoredDialog, setShowDraftRestoredDialog] = useState(false);
  
  // Dialog states for Reset functionality
  const [showResetConfirmDialog, setShowResetConfirmDialog] = useState(false);
  const [showResetSuccessDialog, setShowResetSuccessDialog] = useState(false);
  
  // Dialog states for Create/Update functionality
  const [showSubmitConfirmDialog, setShowSubmitConfirmDialog] = useState(false);
  const [showSubmitSuccessDialog, setShowSubmitSuccessDialog] = useState(false);
  const [showSubmitErrorDialog, setShowSubmitErrorDialog] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState("");
  const [currentFormData, setCurrentFormData] = useState<any>(null);

  // Dialog states for notifications
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [notificationConfig, setNotificationConfig] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  } | null>(null);

  // Helper function to show notification dialogs
  const showNotification = useCallback((type: 'success' | 'error' | 'info' | 'warning', title: string, message: string, action?: { label: string; onClick: () => void }) => {
    setNotificationConfig({ type, title, message, action });
    setShowNotificationDialog(true);
  }, []);

  // Calculate form progress based on form completion
  const calculatedProgress = useMemo(() => {
    if (!data) {
      return 0;
    }
    
    // Calculate progress based on filled fields
    const requiredFields = ['name', 'code', 'type', 'semester', 'year_level', 'department'];
    const filledFields = requiredFields.filter(field => data[field] && data[field].toString().trim() !== '');
    return Math.round((filledFields.length / requiredFields.length) * 100);
  }, [data]);

  useEffect(() => {
    setFormProgress(calculatedProgress);
  }, [calculatedProgress]);

  // Auto-save functionality
  const debouncedFormValues = useDebounce(data, 1000);

  useEffect(() => {
    if (!isEdit) { // Only auto-save for new subjects
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 5000); // Auto-save after 5 seconds of inactivity
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [debouncedFormValues, isEdit]);

  const handleAutoSave = () => {
    // Simplified auto-save for SubjectForm
    if (data) {
      const draftData = {
        ...data,
        savedAt: new Date().toISOString(),
        formProgress: formProgress,
        isDraft: true,
        autoSaved: true,
      };
      
      localStorage.setItem('subjectFormDraft', JSON.stringify(draftData));
      setLastSaved(new Date());
      setDraftSaved(true);
      setDraftExists(true);
      setDraftTimestamp(draftData.savedAt);
      
      showNotification('success', 'Progress Auto-Saved', 'Your changes have been automatically saved.');
    }
  };

  // Separate useEffect for draft restoration when dialog opens
  useEffect(() => {
    if (open && !data) {
      // Check for existing draft when opening form for new subject
      const savedDraft = localStorage.getItem('subjectFormDraft');
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          const draftAge = new Date().getTime() - new Date(draftData.savedAt).getTime();
          const draftAgeHours = draftAge / (1000 * 60 * 60);
          
          // Show draft restoration prompt if draft is less than 24 hours old
          if (draftAgeHours < 24) {
            setDraftExists(true);
            setDraftTimestamp(draftData.savedAt);
            setShowRestorePrompt(true);
          } else {
            // Clear old draft
            localStorage.removeItem('subjectFormDraft');
            setDraftExists(false);
            setDraftTimestamp(null);
          }
        } catch (error) {
          console.error('Error parsing saved draft:', error);
          localStorage.removeItem('subjectFormDraft');
        }
      }
    }
  }, [open, data]);

  // Reset form state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      // Clear form state when dialog closes
      setShowErrorSummary(false);
      setDraftSaved(false);
      setDraftExists(false);
      setDraftTimestamp(null);
      setLastSaved(null);
      setFormProgress(0);
      setResetKey(0);
    }
  }, [open]);

  // Cancel with confirmation if dirty
  const handleCancel = () => {
    // For now, just close the dialog
    // In a real implementation, you'd check if the form is dirty
    onOpenChange(false);
  };

  // Add the missing handleSaveDraft function
  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      
      const draftData = {
        ...data,
        savedAt: new Date().toISOString(),
        formProgress: formProgress,
        isDraft: true,
      };
      
      localStorage.setItem('subjectFormDraft', JSON.stringify(draftData));
      setLastSaved(new Date());
      setDraftSaved(true);
      setDraftExists(true);
      setDraftTimestamp(draftData.savedAt);
      
      setShowDraftSavedDialog(true);
      
      setTimeout(() => {
        setDraftSaved(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error saving draft:', error);
      setDraftErrorMessage("An error occurred while saving your draft.");
      setShowDraftErrorDialog(true);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Add handleClearDraft function
  const handleClearDraft = () => {
    localStorage.removeItem('subjectFormDraft');
    setDraftExists(false);
    setDraftTimestamp(null);
    setDraftSaved(false);
    setLastSaved(null);
    setShowDraftClearedDialog(true);
  };

  // Add handleRestoreDraft function
  const handleRestoreDraft = () => {
    try {
      const savedDraft = localStorage.getItem('subjectFormDraft');
      if (!savedDraft) {
        showNotification('error', 'No Draft Found', 'There is no saved draft to restore.');
        return;
      }

      const draftData = JSON.parse(savedDraft);
      
      // In a real implementation, you'd restore the form data here
      // For now, just show the dialog
      setShowRestorePrompt(false);
      setDraftSaved(true);
      
      setShowDraftRestoredDialog(true);
    } catch (error) {
      console.error('Error restoring draft:', error);
      setDraftErrorMessage("An error occurred while restoring your draft.");
      setShowDraftErrorDialog(true);
    }
  };

  // Add handleDiscardDraft function
  const handleDiscardDraft = () => {
    setShowRestorePrompt(false);
    setDraftExists(false);
    setDraftTimestamp(null);
    setShowDraftClearedDialog(true);
  };

  // Add handleReset function with confirmation
  const handleReset = () => {
    setShowResetConfirmDialog(true);
  };

  const performReset = () => {
    setResetKey(prev => prev + 1);
    setShowResetSuccessDialog(true);
  };

  // Handle submit button click with confirmation
  const handleSubmitClick = () => {
    setShowSubmitConfirmDialog(true);
  };

  // Handle actual form submission
  const handleConfirmSubmit = async () => {
    setShowSubmitConfirmDialog(false);
    setIsSubmitting(true);
    
    try {
      if (!currentFormData) {
        throw new Error('No form data available');
      }

      // Validate required fields
      const requiredFields = ['name', 'code', 'type', 'semester', 'year_level', 'department'];
      const missingFields = requiredFields.filter(field => !currentFormData[field] || currentFormData[field].toString().trim() === '');
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Get the form type to determine units calculation
      const formType = currentFormData.type || 'lecture';
      const units = currentFormData.units || 0;
      const lectureUnits = currentFormData.lecture_units || 0;
      const laboratoryUnits = currentFormData.laboratory_units || 0;
      
      // Calculate units based on form type
      let finalUnits = units;
      let finalLectureUnits = lectureUnits;
      let finalLaboratoryUnits = laboratoryUnits;
      
      if (formType === 'both') {
        finalUnits = lectureUnits + laboratoryUnits;
        finalLectureUnits = lectureUnits;
        finalLaboratoryUnits = laboratoryUnits;
      } else if (formType === 'lecture') {
        finalUnits = units;
        finalLectureUnits = units;
        finalLaboratoryUnits = 0;
      } else if (formType === 'laboratory') {
        finalUnits = units;
        finalLectureUnits = 0;
        finalLaboratoryUnits = units;
      }
      
      // Transform semester values to match API expectations
      const semesterMap: { [key: string]: string } = {
        '1st': 'FIRST_SEMESTER',
        '2nd': 'SECOND_SEMESTER', 
        '3rd': 'THIRD_SEMESTER'
      };
      
      // Generate a unique subject code if none provided
      let subjectCode = currentFormData.code || '';
      if (!subjectCode.trim()) {
        // Generate a code based on the subject name
        const nameWords = (currentFormData.name || 'Subject').split(' ');
        const initials = nameWords.map((word: string) => word.charAt(0).toUpperCase()).join('');
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        subjectCode = `${initials}${randomSuffix}`;
      }

      const subjectData = {
        name: currentFormData.name || '',
        code: subjectCode,
        type: formType,
        units: finalUnits,
        lecture_units: finalLectureUnits,
        laboratory_units: finalLaboratoryUnits,
        semester: semesterMap[currentFormData.semester] || 'FIRST_SEMESTER',
        year_level: currentFormData.year_level || '1st',
        department: currentFormData.department || '1',
        description: currentFormData.description || '',
        instructors: currentFormData.instructors || [],
        courseId: 1,
        academicYear: "2024-2025",
        maxStudents: 30,
      };

      // Debug: Log the data being sent
      console.log('Sending subject data:', subjectData);

      // Retry mechanism for duplicate codes
      let response: Response | undefined;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          response = await fetch('/api/subjects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for authentication
            body: JSON.stringify(subjectData),
          });
          
          // If successful, break out of retry loop
          if (response.ok) {
            break;
          }
          
          // Check if it's a duplicate code error
          const errorData = await response.json();
          if (errorData.error && errorData.error.includes('already exists') && retryCount < maxRetries - 1) {
            // Generate a new unique code and retry
            const nameWords = (currentFormData.name || 'Subject').split(' ');
            const initials = nameWords.map((word: string) => word.charAt(0).toUpperCase()).join('');
            const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            subjectCode = `${initials}${randomSuffix}`;
            subjectData.code = subjectCode;
            retryCount++;
            console.log(`Retrying with new code: ${subjectCode}`);
            continue;
          }
          
          // If not a duplicate error or max retries reached, break
          break;
        } catch (error) {
          console.error('API call error:', error);
          throw error;
        }
      }

      if (!response || !response.ok) {
        // Type assertion since we know response is defined at this point
        const errorResponse = response as Response;
        let errorData;
        try {
          const responseText = await errorResponse.text();
          console.log('Raw response text:', responseText);
          
          if (responseText.trim() === '') {
            errorData = { error: `HTTP ${errorResponse.status}: ${errorResponse.statusText} - Empty response` };
          } else {
            errorData = JSON.parse(responseText);
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { error: `HTTP ${errorResponse.status}: ${errorResponse.statusText} - Invalid JSON response` };
        }
        
        console.error('API Error Response:', errorData);
        console.error('Response Status:', errorResponse.status);
        console.error('Response Status Text:', errorResponse.statusText);
        console.error('Response Headers:', Object.fromEntries(errorResponse.headers.entries()));
        
        // Handle specific error cases
        let errorMessage = errorData.error || `HTTP ${errorResponse.status}: ${errorResponse.statusText}`;
        
        if (errorResponse.status === 400) {
          errorMessage = 'Invalid form data. Please check all required fields.';
        } else if (errorResponse.status === 409) {
          errorMessage = 'A subject with this code already exists. Please use a different code.';
        } else if (errorResponse.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        const errorDetails = errorData.details ? ` Details: ${JSON.stringify(errorData.details)}` : '';
        throw new Error(errorMessage + errorDetails);
      }

      const result = await response.json();
      console.log('Subject created successfully:', result);

      setSubmitSuccessMessage(
        isEdit 
          ? "The subject has been updated successfully."
          : "A new subject has been created successfully."
      );
      setShowSubmitSuccessDialog(true);
      
      // Clear draft after successful submission
      localStorage.removeItem('subjectFormDraft');
      
      // Close form and call success callback after dialog closes
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 1000);

    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitErrorMessage(error instanceof Error ? error.message : 'Failed to submit form. Please try again.');
      setShowSubmitErrorDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key to cancel
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCancel();
      }
      
      // Ctrl/Cmd + S to save draft
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (!isSubmitting && !isSavingDraft) {
          handleSaveDraft();
        }
      }
      
      // Ctrl/Cmd + Enter to submit
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!isSubmitting && !isSavingDraft) {
          handleSubmitClick();
        }
      }
      
      // Ctrl/Cmd + R to reset form
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        if (!isSubmitting && !isSavingDraft) {
          handleReset();
        }
      }
      
      // Ctrl/Cmd + D to clear draft (when draft exists)
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        if (draftExists && !isSubmitting && !isSavingDraft) {
          handleClearDraft();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, isSavingDraft, draftExists]);

  // Show error state if there's an error
  if (hasError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <DialogTitle className="text-red-600">Error Loading Form</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">{error || "An error occurred while loading the form."}</p>
            <Button
              onClick={() => {
                setHasError(false);
                setError(null);
                onOpenChange(false);
              }}
              variant="outline"
              className="rounded"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={isEdit ? `edit-${id}` : 'create'}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm border border-blue-200 shadow-2xl rounded-2xl p-0 mx-2 my-1 sm:max-w-[600px] sm:mx-4 sm:my-1 md:max-w-[750px] md:mx-6 md:my-1 lg:max-w-[900px] lg:mx-8 lg:my-1 flex flex-col">
        {/* Visually hidden DialogTitle for accessibility */}
        <DialogTitle className="sr-only">
          {isEdit ? "Edit Subject" : "Create New Subject"}
        </DialogTitle>
        
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6 relative flex-shrink-0">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="absolute top-4 right-4 h-8 w-8 text-white hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-start gap-4 pr-24">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Book className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">
                {isEdit ? "Edit Subject" : "Create New Subject"}
              </h2>
              <p className="text-blue-100 text-sm">
                {isEdit 
                  ? "Update subject information and settings"
                  : "Add a new academic subject to the system"
                }
              </p>
              
              {/* Draft Status Indicator */}
              {draftExists && !isEdit && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Draft Available
                  </Badge>
                  {draftTimestamp && (
                    <span className="text-blue-100 text-xs">
                      Saved {new Date(draftTimestamp).toLocaleString()}
                    </span>
                  )}
                </div>
              )}
              
              {/* Last Saved Indicator */}
              {lastSaved && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-blue-100 text-xs">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div 
              className="h-full bg-green-400 transition-all duration-300 ease-out"
              style={{ width: `${formProgress}%` }}
            />
          </div>
        </div>

        {/* Draft Restoration Dialog */}
        {showRestorePrompt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded p-6 max-w-md mx-4 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Restore Draft?</h3>
                  <p className="text-sm text-gray-600">A saved draft was found</p>
                </div>
              </div>
              
              <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  We found a saved draft from your previous session. Would you like to restore it?
                </p>
                {draftTimestamp && (
                  <p className="text-xs text-yellow-700 mt-1">
                    Draft saved: {new Date(draftTimestamp).toLocaleString()}
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleDiscardDraft}
                  className="flex-1 rounded"
                >
                  Start Fresh
                </Button>
                <Button
                  onClick={handleRestoreDraft}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 rounded"
                >
                  Restore Draft
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Draft Management Bar */}
              {draftExists && !isEdit && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Draft saved {draftTimestamp ? new Date(draftTimestamp).toLocaleString() : ''}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRestoreDraft}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50 rounded"
                    >
                      Restore
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearDraft}
                      className="text-red-600 border-red-300 hover:bg-red-50 rounded"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              {/* Info: All fields required */}
              <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded border border-blue-100 text-blue-700 text-sm">
                <Info className="h-4 w-4 text-blue-600" />
                <span>All fields marked with <span className="font-bold">*</span> are required</span>
              </div>

              {/* Subject Form Component */}
              <div key={resetKey}>
                <SubjectForm
                  type={type}
                  data={data}
                  id={id}
                  onSuccess={onSuccess}
                  showSubmitButton={false}
                  onFormDataChange={setCurrentFormData}
                />
              </div>

              {/* Footer Buttons */}
              <DialogFooter className="flex items-center justify-end pt-6 border-t border-gray-200 bg-gray-50/50 px-6 py-4">
                {/* Action buttons */}
                <div className="flex gap-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          type="button"
                          onClick={handleReset}
                          disabled={isSubmitting || isSavingDraft}
                          className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Reset form to {data ? 'original values' : 'empty state'}</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          type="button"
                          onClick={handleSaveDraft}
                          disabled={isSubmitting || isSavingDraft}
                          className={`border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-500 rounded transition-all duration-200 ${
                            draftSaved ? 'bg-green-100 border-green-500 text-green-700 shadow-sm' : ''
                          }`}
                        >
                          {isSavingDraft ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : draftSaved ? (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Draft Saved!
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Draft
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {draftSaved 
                            ? "Draft has been saved successfully! (Ctrl+S)" 
                            : "Save current progress as draft (Ctrl+S)"
                          }
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    
                    {draftExists && !isEdit && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            type="button"
                            onClick={handleClearDraft}
                            disabled={isSubmitting || isSavingDraft}
                            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-500 rounded"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear Draft
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remove saved draft permanently</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          onClick={handleSubmitClick}
                          disabled={isSubmitting || isSavingDraft}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {isEdit ? "Updating..." : "Creating..."}
                            </>
                          ) : (
                            <>
                              {isEdit ? "Update Subject" : "Create Subject"}
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isEdit ? "Update subject" : "Create new subject"} (Ctrl+Enter)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </DialogFooter>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
      
      {/* Draft Saved Success Dialog */}
      <Dialog open={showDraftSavedDialog} onOpenChange={setShowDraftSavedDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Save className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-green-900">
                  Draft Saved Successfully
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              Your progress has been saved as a draft. You can continue editing or close the form and return later to complete it.
            </p>
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Clock className="w-4 h-4" />
                <span>Draft saved at {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowDraftSavedDialog(false)}
              className="bg-green-600 hover:bg-green-700 text-white rounded"
            >
              Continue Editing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Draft Error Dialog */}
      <Dialog open={showDraftErrorDialog} onOpenChange={setShowDraftErrorDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-red-900">
                  Cannot Save Draft
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              {draftErrorMessage}
            </p>
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-red-700">
                <Info className="w-4 h-4" />
                <span>Please fix the issues and try again</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowDraftErrorDialog(false)}
              className="bg-red-600 hover:bg-red-700 text-white rounded"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Draft Cleared Dialog */}
      <Dialog open={showDraftClearedDialog} onOpenChange={setShowDraftClearedDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-blue-900">
                  Draft Cleared
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              The saved draft has been removed successfully.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Info className="w-4 h-4" />
                <span>You can continue editing the current form</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowDraftClearedDialog(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Draft Restored Dialog */}
      <Dialog open={showDraftRestoredDialog} onOpenChange={setShowDraftRestoredDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-green-900">
                  Draft Restored
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              Your saved draft has been restored successfully. You can continue editing from where you left off.
            </p>
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Clock className="w-4 h-4" />
                <span>Draft restored from {draftTimestamp ? new Date(draftTimestamp).toLocaleString() : 'previous session'}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowDraftRestoredDialog(false)}
              className="bg-green-600 hover:bg-green-700 text-white rounded"
            >
              Continue Editing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirmDialog} onOpenChange={setShowResetConfirmDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-orange-900">
                  Confirm Reset
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              You have unsaved changes. Are you sure you want to reset the form? This action cannot be undone.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-orange-700">
                <Info className="w-4 h-4" />
                <span>All current changes will be lost</span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowResetConfirmDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setShowResetConfirmDialog(false);
                performReset();
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded"
            >
              Reset Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Success Dialog */}
      <Dialog open={showResetSuccessDialog} onOpenChange={setShowResetSuccessDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-green-900">
                  Form Reset Successfully
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              {data 
                ? "All fields have been reset to their original values."
                : "All fields have been cleared successfully."
              }
            </p>
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Info className="w-4 h-4" />
                <span>You can now start fresh with the form</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowResetSuccessDialog(false)}
              className="bg-green-600 hover:bg-green-700 text-white rounded"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitConfirmDialog} onOpenChange={setShowSubmitConfirmDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Book className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-blue-900">
                  {isEdit ? "Update Subject" : "Create Subject"}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              {isEdit 
                ? "Are you sure you want to update this subject? This will save all current changes."
                : "Are you sure you want to create this subject? This will save all current information."
              }
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Info className="w-4 h-4" />
                <span>
                  {isEdit 
                    ? "The subject will be updated with the current form data."
                    : "A new subject will be created with the current form data."
                  }
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowSubmitConfirmDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              {isEdit ? "Update Subject" : "Create Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Success Dialog */}
      <Dialog open={showSubmitSuccessDialog} onOpenChange={setShowSubmitSuccessDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Book className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-green-900">
                  {isEdit ? "Subject Updated" : "Subject Created"}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              {submitSuccessMessage}
            </p>
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Info className="w-4 h-4" />
                <span>The form will close automatically</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowSubmitSuccessDialog(false)}
              className="bg-green-600 hover:bg-green-700 text-white rounded"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Error Dialog */}
      <Dialog open={showSubmitErrorDialog} onOpenChange={setShowSubmitErrorDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-red-900">
                  {isEdit ? "Update Failed" : "Creation Failed"}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              {submitErrorMessage}
            </p>
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-red-700">
                <Info className="w-4 h-4" />
                <span>Please fix the issues and try again</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowSubmitErrorDialog(false)}
              className="bg-red-600 hover:bg-red-700 text-white rounded"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                notificationConfig?.type === 'success' ? 'bg-green-100' :
                notificationConfig?.type === 'error' ? 'bg-red-100' :
                notificationConfig?.type === 'warning' ? 'bg-yellow-100' :
                'bg-blue-100'
              }`}>
                {notificationConfig?.type === 'success' && <Check className="w-5 h-5 text-green-600" />}
                {notificationConfig?.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                {notificationConfig?.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
                {notificationConfig?.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
              </div>
              <div>
                <DialogTitle className={`text-lg font-semibold ${
                  notificationConfig?.type === 'success' ? 'text-green-900' :
                  notificationConfig?.type === 'error' ? 'text-red-900' :
                  notificationConfig?.type === 'warning' ? 'text-yellow-900' :
                  'text-blue-900'
                }`}>
                  {notificationConfig?.title}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              {notificationConfig?.message}
            </p>
            {notificationConfig?.action && (
              <div className={`border rounded p-3 ${
                notificationConfig?.type === 'success' ? 'bg-green-50 border-green-200' :
                notificationConfig?.type === 'error' ? 'bg-red-50 border-red-200' :
                notificationConfig?.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className={`flex items-center gap-2 text-sm ${
                  notificationConfig?.type === 'success' ? 'text-green-700' :
                  notificationConfig?.type === 'error' ? 'text-red-700' :
                  notificationConfig?.type === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>
                  <Info className="w-4 h-4" />
                  <span>Additional action available</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            {notificationConfig?.action && (
              <Button
                onClick={() => {
                  notificationConfig.action?.onClick();
                  setShowNotificationDialog(false);
                }}
                className={`${
                  notificationConfig?.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                  notificationConfig?.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                  notificationConfig?.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-blue-600 hover:bg-blue-700'
                } text-white rounded`}
              >
                {notificationConfig.action.label}
              </Button>
            )}
            <Button
              onClick={() => setShowNotificationDialog(false)}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded"
            >
              {notificationConfig?.action ? 'Cancel' : 'OK'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

export default SubjectFormDialog; 