import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, Loader2, AlertCircle, Info, Copy, ExternalLink, ChevronRight, Eye, Mail, Phone, MapPin, Clock, GraduationCap, User, Home, Building2, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PrintLayout } from "@/components/PrintLayout";

export interface ViewDialogField {
  label: string;
  value: string | number;
  type?: 'text' | 'date' | 'badge' | 'number' | 'email' | 'phone' | 'url' | 'course-with-status';
  badgeVariant?: 'default' | 'success' | 'destructive' | 'secondary' | 'warning';
  copyable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export interface DepartmentHead {
  name: string;
  photo?: string;
  email?: string;
  phone?: string;
  position: string;
  department: string;
  startDate?: string;
  education?: string;
  officeLocation?: string;
  officeHours?: string;
}

export interface ViewDialogSection {
  title?: string;
  fields: ViewDialogField[];
  columns?: 1 | 2;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

interface ViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  status?: {
    value: string;
    variant: 'default' | 'success' | 'destructive' | 'secondary' | 'warning';
  };
  sections: ViewDialogSection[];
  description?: string;
  tooltipText?: string;
  isLoading?: boolean;
  error?: string;
  departmentHead?: DepartmentHead;
  logo?: string; // Add logo prop
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    icon?: React.ReactNode;
  }[];
  showCopyButton?: boolean;
  showPrintButton?: boolean;
  showExportButton?: boolean;
  headerIcon?: React.ReactNode;
  headerVariant?: 'default' | 'room';
}

function ViewDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  status,
  sections,
  description,
  tooltipText = "View detailed information",
  isLoading = false,
  error,
  departmentHead,
  logo,
  actions = [],
  showCopyButton = true,
  showPrintButton = false,
  showExportButton = false,
  headerIcon,
  headerVariant = 'default',
}: ViewDialogProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('ViewDialog actions:', actions);
    console.log('ViewDialog actions length:', actions.length);
  }, [actions]);

  // Initialize collapsed sections
  useEffect(() => {
    const initialCollapsed = new Set<number>();
    sections.forEach((section, index) => {
      if (section.collapsible && !section.defaultExpanded) {
        initialCollapsed.add(index);
      }
    });
    setCollapsedSections(initialCollapsed);
  }, [sections]);

  const toggleSection = (index: number) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string, fieldLabel: string) => {
    try {
      await navigator.clipboard.writeText(text.toString());
      setCopiedField(fieldLabel);
      toast.success(`${fieldLabel} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatValue = (field: ViewDialogField) => {
    if (field.type === 'date' && typeof field.value === 'string') {
      return new Date(field.value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    if (field.type === 'badge') {
      return (
        <Badge variant={field.badgeVariant || 'default'} className="text-xs px-2 py-1">
          {field.value}
        </Badge>
      );
    }
    if (field.type === 'course-with-status') {
      return (
        <div className="flex items-center justify-between w-full">
          <span className="text-base font-medium text-blue-800">{field.label}</span>
          <Badge variant={field.badgeVariant || 'default'} className="text-xs px-2 py-1">
            {field.value}
          </Badge>
        </div>
      );
    }
    if (field.type === 'email' && typeof field.value === 'string') {
      return (
        <a 
          href={`mailto:${field.value}`}
          className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
        >
          {field.value}
          <ExternalLink className="w-3 h-3" />
        </a>
      );
    }
    if (field.type === 'phone' && typeof field.value === 'string') {
      return (
        <a 
          href={`tel:${field.value}`}
          className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
        >
          {field.value}
          <ExternalLink className="w-3 h-3" />
        </a>
      );
    }
    if (field.type === 'url' && typeof field.value === 'string') {
      return (
        <a 
          href={field.value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
        >
          {field.value}
          <ExternalLink className="w-3 h-3" />
        </a>
      );
    }
    return field.value;
  };

  const handlePrint = () => {
    // Create print-friendly data from the dialog content
    const printColumns = [
      { header: 'Field', accessor: 'field' },
      { header: 'Value', accessor: 'value' }
    ];

    const printData: { field: string; value: string }[] = [];

    // Add title and subtitle
    printData.push({ field: 'Title', value: title });
    if (subtitle) {
      printData.push({ field: 'Subtitle', value: subtitle });
    }
    if (status) {
      printData.push({ field: 'Status', value: status.value });
    }

    // Add description if available
    if (description) {
      printData.push({ field: 'Description', value: description });
    }

    // Add department head information if available
    if (departmentHead) {
      printData.push({ field: 'Department Head', value: departmentHead.name });
      printData.push({ field: 'Position', value: departmentHead.position });
      printData.push({ field: 'Department', value: departmentHead.department });
      if (departmentHead.email) {
        printData.push({ field: 'Email', value: departmentHead.email });
      }
      if (departmentHead.phone) {
        printData.push({ field: 'Phone', value: departmentHead.phone });
      }
      if (departmentHead.officeLocation) {
        printData.push({ field: 'Office Location', value: departmentHead.officeLocation });
      }
      if (departmentHead.officeHours) {
        printData.push({ field: 'Office Hours', value: departmentHead.officeHours });
      }
    }

    // Add all sections data
    sections.forEach(section => {
      if (section.title) {
        printData.push({ field: `--- ${section.title} ---`, value: '' });
      }
      section.fields.forEach(field => {
        let value = field.value.toString();
        
        // Format special field types
        if (field.type === 'date' && typeof field.value === 'string') {
          value = new Date(field.value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
        
        printData.push({ field: field.label, value });
      });
    });

    const printFunction = PrintLayout({
      title: `${title} - Details`,
      data: printData,
      columns: printColumns,
      totalItems: printData.length,
    });

    printFunction();
    toast.success('Print dialog opened');
  };

  const handleExport = () => {
    // Implement export functionality
    toast.info('Export functionality coming soon');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-full max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm border border-blue-200 shadow-2xl rounded-2xl p-0 mx-2 my-1 sm:max-w-[600px] sm:mx-4 sm:my-1 md:max-w-[750px] md:mx-6 md:my-1 lg:max-w-[900px] lg:mx-8 lg:my-1 flex flex-col h-full">
        {/* Header with gradient background - Fixed */}
        {headerVariant === 'room' ? (
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden">
                {logo ? (
                  <img 
                    src={logo} 
                    alt={`${title} logo`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={cn(
                  "w-full h-full flex items-center justify-center",
                  logo ? "hidden" : ""
                )}>
                  {headerIcon ? headerIcon : <Eye className="w-10 h-10 text-white" />}
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-white text-2xl font-bold">
                    {title}
                  </DialogTitle>
                  {status && (
                    <Badge 
                      variant={status.variant === 'success' ? 'default' : status.variant} 
                      className="ml-2 bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs px-3 py-1 rounded-full font-semibold"
                    >
                      {status.value}
                    </Badge>
                  )}
                </div>
                {subtitle && (
                  <p className="text-blue-100 text-sm mt-1 font-medium">{subtitle}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {showCopyButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 hover:text-white rounded flex items-center gap-1"
                  onClick={() => copyToClipboard(title, 'Title')}
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              )}
              {showPrintButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 hover:text-white rounded flex items-center gap-1"
                  onClick={handlePrint}
                >
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
              )}
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
        ) : (
          // Default header for other entities
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6 relative flex-shrink-0">
            <div className="flex items-start gap-4 pr-24">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden">
                {logo ? (
                  <img 
                    src={logo} 
                    alt={`${title} logo`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={cn(
                  "w-full h-full flex items-center justify-center",
                  logo ? "hidden" : ""
                )}>
                  {headerIcon ? headerIcon : <Eye className="w-6 h-6 text-white" />}
                </div>
              </div>
              <div className="flex-1">
                <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
                  {title}
                  {status && (
                    <Badge 
                      variant={status.variant === 'success' ? 'default' : status.variant} 
                      className="ml-2 bg-white/20 text-white border-white/30"
                    >
                      {status.value}
                    </Badge>
                  )}
                </DialogTitle>
                {subtitle && (
                  <p className="text-blue-100 text-sm mt-1 font-medium">{subtitle}</p>
                )}
              </div>
            </div>
            {/* Action buttons in header - Right side */}
            <div className="absolute right-4 top-4 flex items-center gap-2">
              {showCopyButton && (
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-white hover:bg-white/20 hover:text-white rounded"
                  onClick={() => copyToClipboard(title, 'Title')}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
              )}
              {showPrintButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 rounded"
                  onClick={handlePrint}
                >
                  <Printer className="w-4 h-4 mr-1" />
                  Print
                </Button>
              )}
              {showExportButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 rounded"
                  onClick={handleExport}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Export
                </Button>
              )}
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
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-center py-12 h-full"
              >
                <div className="text-center">
                  <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-blue-600 font-medium">Loading information...</p>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 p-6 text-red-600 bg-red-50 rounded-xl border border-red-200 m-6"
              >
                <AlertCircle className="h-6 w-6 flex-shrink-0" />
                <div>
                  <p className="font-medium">Error loading data</p>
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
              >
                <div className="p-6 space-y-6">


                  {/* Enhanced Department Head Section - Moved to Top */}
                  {departmentHead && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-blue-200 overflow-hidden"
                    >
                      <div 
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-100 to-gray-200 border-b border-blue-300 cursor-pointer hover:from-gray-200 hover:to-gray-300 transition-all duration-200"
                        onClick={() => toggleSection(-1)} // Use -1 for department head section
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="text-lg font-semibold text-blue-900">Head of Department</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-300/50"
                        >
                          <ChevronRight 
                            className={cn(
                              "w-4 h-4 transition-transform duration-200",
                              collapsedSections.has(-1) ? "" : "rotate-90"
                            )} 
                          />
                        </Button>
                      </div>
                      
                      {!collapsedSections.has(-1) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-6"
                        >
                          <div className="flex flex-col lg:flex-row gap-6">
                            {/* Photo Section */}
                            <div className="flex-shrink-0">
                              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 border-4 border-white shadow-lg">
                                {departmentHead.photo ? (
                                  <img 
                                    src={departmentHead.photo} 
                                    alt={`${departmentHead.name}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <div className={cn(
                                  "w-full h-full flex items-center justify-center text-white font-bold text-2xl",
                                  departmentHead.photo ? "hidden" : ""
                                )}>
                                  {departmentHead.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </div>
                              </div>
                            </div>

                            {/* Details Section */}
                            <div className="flex-1 space-y-4">
                              {/* Name and Position */}
                              <div>
                                <h3 className="text-xl font-bold text-blue-900 mb-1">{departmentHead.name}</h3>
                                <p className="text-blue-700 font-medium">{departmentHead.position}</p>
                                <p className="text-blue-600 text-sm">{departmentHead.department}</p>
                              </div>

                              {/* Contact Information - Only show if available */}
                              {(departmentHead.email || departmentHead.phone || departmentHead.officeLocation || departmentHead.officeHours) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {departmentHead.email && (
                                    <div className="flex items-center gap-2 text-blue-700">
                                      <Mail className="w-4 h-4 text-blue-600" />
                                      <a 
                                        href={`mailto:${departmentHead.email}`}
                                        className="hover:text-blue-600 hover:underline transition-colors"
                                      >
                                        {departmentHead.email}
                                      </a>
                                    </div>
                                  )}
                                  {departmentHead.phone && (
                                    <div className="flex items-center gap-2 text-blue-700">
                                      <Phone className="w-4 h-4 text-blue-600" />
                                      <a 
                                        href={`tel:${departmentHead.phone}`}
                                        className="hover:text-blue-600 hover:underline transition-colors"
                                      >
                                        {departmentHead.phone}
                                      </a>
                                    </div>
                                  )}
                                  {departmentHead.officeLocation && (
                                    <div className="flex items-center gap-2 text-blue-700">
                                      <MapPin className="w-4 h-4 text-blue-600" />
                                      <span>{departmentHead.officeLocation}</span>
                                    </div>
                                  )}
                                  {departmentHead.officeHours && (
                                    <div className="flex items-center gap-2 text-blue-700">
                                      <Clock className="w-4 h-4 text-blue-600" />
                                      <span>{departmentHead.officeHours}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Additional Information - Only show if available */}
                              {departmentHead.education && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                  <div className="bg-blue-50 rounded p-3 border border-blue-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                      <GraduationCap className="w-4 h-4 text-blue-600" />
                                      <span className="text-sm font-semibold text-blue-900">Education</span>
                                    </div>
                                    <p className="text-blue-700 text-sm">{departmentHead.education}</p>
                                  </div>
                                </div>
                              )}

                              {departmentHead.startDate && (
                                <div className="text-sm text-blue-600">
                                  <span className="font-medium">Started:</span> {new Date(departmentHead.startDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Description Section - Moved next to Head of Department */}
                  {description && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-blue-200 overflow-hidden"
                    >
                      <div 
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-100 to-gray-200 border-b border-blue-300 cursor-pointer hover:from-gray-200 hover:to-gray-300 transition-all duration-200"
                        onClick={() => toggleSection(-2)} // Use -2 for description section
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center">
                            <Info className="w-4 h-4 text-white" />
                          </div>
                          <div className="text-lg font-semibold text-blue-900">Description</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-300/50"
                        >
                          <ChevronRight 
                            className={cn(
                              "w-4 h-4 transition-transform duration-200",
                              collapsedSections.has(-2) ? "" : "rotate-90"
                            )} 
                          />
                        </Button>
                      </div>
                      
                      {!collapsedSections.has(-2) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-6"
                        >
                                  <div className="text-base text-blue-800 leading-relaxed whitespace-pre-wrap">
          {description}
        </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {sections.map((section, sectionIndex) => (
                    <motion.div
                      key={sectionIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: sectionIndex * 0.1 }}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-blue-200 overflow-hidden"
                    >
                      {section.title && (
                        <div 
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-100 to-gray-200 border-b border-blue-300 cursor-pointer hover:from-gray-200 hover:to-gray-300 transition-all duration-200"
                          onClick={() => toggleSection(sectionIndex)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center">
                              <Info className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="text-lg font-semibold text-blue-900">
                              {section.title}
                            </h4>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-300/50"
                          >
                            <ChevronRight 
                              className={cn(
                                "w-4 h-4 transition-transform duration-200",
                                collapsedSections.has(sectionIndex) ? "" : "rotate-90"
                              )} 
                            />
                          </Button>
                        </div>
                      )}
                      
                      {!collapsedSections.has(sectionIndex) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4"
                        >
                          <div className={cn(
                            "grid gap-4",
                            section.columns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                          )}>
                            {section.fields.map((field, fieldIndex) => (
                              <motion.div
                                key={fieldIndex}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: fieldIndex * 0.05 }}
                                className={cn(
                                  "group relative bg-gray-50 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200 rounded p-4 border border-blue-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md",
                                  field.clickable && "cursor-pointer"
                                )}
                                onClick={field.clickable ? field.onClick : undefined}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      {field.icon && (
                                        <div className="w-4 h-4 text-blue-600">
                                          {field.icon}
                                        </div>
                                      )}
                                      <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                                        {field.label}
                                      </div>
                                    </div>
                                    <div className="text-base font-medium text-blue-800">
                                      {formatValue(field)}
                                    </div>
                                  </div>
                                  
                                  {field.copyable && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0 text-blue-400 hover:text-blue-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(field.value.toString(), field.label);
                                      }}
                                    >
                                      <Copy className={cn(
                                        "w-4 h-4",
                                        copiedField === field.label ? "text-green-600" : "text-blue-400"
                                      )} />
                                    </Button>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with actions - Fixed */}
        {actions.length > 0 && (
          <DialogFooter className="!flex !justify-end gap-3 p-6 flex-shrink-0 border-t-2 border-blue-300 bg-blue-50/80 rounded-b-2xl shadow-inner">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "default"}
                onClick={action.onClick}
                className="gap-2 rounded-xl"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </DialogFooter>
        )}
        
        {/* Fallback footer for testing - always visible */}
        {actions.length === 0 && (
          <DialogFooter className="!flex !justify-end gap-3 p-6 flex-shrink-0 border-t-2 border-blue-300 bg-blue-50/80 rounded-b-2xl shadow-inner">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="gap-2 rounded-xl"
            >
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { ViewDialog };
export default ViewDialog; 