"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  X, 
  Send, 
  Paperclip, 
  FileText, 
  Trash2,
  Loader2,
  Image,
  File,
  Download,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export interface EmailAttachment {
  name: string;
  url: string;
}

export interface EmailComposeData {
  subject: string;
  sender: string;
  recipient: string; // Primary recipient - maps to Email.recipient
  cc: string; // Comma-separated CC recipients - will be parsed into EmailRecipient records
  bcc: string; // Comma-separated BCC recipients - will be parsed into EmailRecipient records
  content: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'; // Maps to Priority enum
  status?: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'DRAFT' | 'PENDING'; // Maps to EmailStatus enum
  type?: 'INBOX' | 'SENT' | 'DRAFT' | 'SPAM' | 'TRASH'; // Maps to EmailFolder enum
  isRead?: boolean;
  isStarred?: boolean;
  isImportant?: boolean;
}

interface EmailComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<EmailComposeData>;
  onSend?: (data: EmailComposeData & { attachments: EmailAttachment[] }) => Promise<void>;
  isLoading?: boolean;
  maxFileSize?: number; // in MB
  acceptedFileTypes?: string[];
}

export default function EmailComposeDialog({
  open,
  onOpenChange,
  initialData,
  onSend,
  isLoading = false,
  maxFileSize = 5,
  acceptedFileTypes = [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx", ".txt", ".xlsx", ".xls", ".ppt", ".pptx", ".zip", ".rar", ".mp4", ".mp3", ".wav", ".avi", ".mov", ".csv", ".json", ".xml", ".html", ".css", ".js", ".ts", ".py", ".java", ".cpp", ".c", ".h", ".sql", ".md", ".rtf", ".odt", ".ods", ".odp"],
}: EmailComposeDialogProps) {
  const [formData, setFormData] = useState<EmailComposeData>({
    subject: '',
    sender: 'admin@icct.edu',
    recipient: '',
    cc: '',
    bcc: '',
    content: '',
    priority: 'NORMAL',
    status: 'DRAFT',
    type: 'DRAFT',
    isRead: false,
    isStarred: false,
    isImportant: false,
    ...initialData,
  });

  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({});

  const handleFileUpload = useCallback(async (file: File) => {
    const fileId = `${file.name}-${Date.now()}`;
    
    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      const errorMsg = `File size must be less than ${maxFileSize}MB`;
      setUploadErrors(prev => ({ ...prev, [fileId]: errorMsg }));
      toast.error(errorMsg);
      return;
    }

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      const errorMsg = `File type ${fileExtension} is not allowed`;
      setUploadErrors(prev => ({ ...prev, [fileId]: errorMsg }));
      toast.error(errorMsg);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      setUploadErrors(prev => {
        const { [fileId]: _, ...rest } = prev;
        return rest;
      });

      const formData = new FormData();
      formData.append('file', file);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: Math.min(prev[fileId] + 10, 90)
        }));
      }, 100);
      
      const res = await fetch('/api/upload', { 
        method: 'POST', 
        body: formData 
      });
      
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
      
      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Upload failed');
      }
      
      setAttachments(prev => [...prev, { 
        name: data.filename || file.name, 
        url: data.url 
      }]);
      
      // Clean up progress tracking
      setTimeout(() => {
        setUploadProgress(prev => {
          const { [fileId]: _, ...rest } = prev;
          return rest;
        });
      }, 1000);
      
      toast.success(`${file.name} uploaded successfully`);
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.message || 'Failed to upload file';
      setUploadErrors(prev => ({ ...prev, [fileId]: errorMsg }));
      setUploadProgress(prev => {
        const { [fileId]: _, ...rest } = prev;
        return rest;
      });
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  }, [maxFileSize, acceptedFileTypes]);

  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const getFileIcon = useCallback((filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
        return <Image className="w-4 h-4 text-green-500" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="w-4 h-4 text-green-600" />;
      case 'ppt':
      case 'pptx':
        return <FileText className="w-4 h-4 text-orange-500" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <File className="w-4 h-4 text-purple-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return <File className="w-4 h-4 text-pink-500" />;
      case 'mp3':
      case 'wav':
      case 'flac':
        return <File className="w-4 h-4 text-indigo-500" />;
      default:
        return <File className="w-4 h-4 text-gray-500" />;
    }
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateEmails = (emails: string) => {
    if (!emails.trim()) return true;
    const emailList = emails.split(',').map(e => e.trim()).filter(Boolean);
    return emailList.every(email => validateEmail(email));
  };

  const handleSend = useCallback(async () => {
    // Validation
    if (!formData.subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (!formData.recipient.trim()) {
      toast.error('Recipient is required');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }

    // Validate email addresses
    if (!validateEmail(formData.sender)) {
      toast.error('Invalid sender email address');
      return;
    }
    if (!validateEmail(formData.recipient)) {
      toast.error('Invalid recipient email address');
      return;
    }
    if (formData.cc && !validateEmails(formData.cc)) {
      toast.error('Invalid CC email address(es)');
      return;
    }
    if (formData.bcc && !validateEmails(formData.bcc)) {
      toast.error('Invalid BCC email address(es)');
      return;
    }

    try {
      if (onSend) {
        await onSend({ ...formData, attachments });
        // Reset form on success
        setFormData({
          subject: '',
          sender: formData.sender, // Keep sender
          recipient: '',
          cc: '',
          bcc: '',
          content: '',
          priority: 'NORMAL',
          status: 'DRAFT',
          type: 'DRAFT',
          isRead: false,
          isStarred: false,
          isImportant: false,
        });
        setAttachments([]);
        setUploadProgress({});
        setUploadErrors({});
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to send email');
    }
  }, [formData, attachments, onSend, onOpenChange]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      onOpenChange(false);
    }
  }, [isLoading, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 rounded-xl">
        <DialogHeader className="p-0">
          {/* Blue Gradient Header */}
          <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0 rounded-t-xl">
            <div className="py-4 sm:py-6">
              <div className="flex items-center gap-3 px-4 sm:px-6">
                <div className="w-8 h-8 flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white">
                    Compose Email
                  </DialogTitle>
                  <p className="text-blue-100 text-sm">Create and send a new email message</p>
                </div>
                <div className="ml-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Email Form */}
          <div className="flex-1 px-4 sm:px-6 py-4 space-y-4 overflow-y-auto">
            {/* From and To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label className="block text-sm font-medium text-gray-700 mb-2 cursor-help">
                        From
                      </label>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                      Your email address
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Input
                  value={formData.sender}
                  onChange={(e) => setFormData(prev => ({ ...prev, sender: e.target.value }))}
                  placeholder="sender@icct.edu"
                  className="w-full"
                  type="email"
                />
              </div>
              <div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label className="block text-sm font-medium text-gray-700 mb-2 cursor-help">
                        To <span className="text-red-500">*</span>
                      </label>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                      Primary recipient email address
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Input
                  value={formData.recipient}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
                  placeholder="recipient@icct.edu"
                  className="w-full"
                  type="email"
                />
              </div>
            </div>

            {/* CC and BCC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label className="block text-sm font-medium text-gray-700 mb-2 cursor-help">
                        CC
                      </label>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                      Carbon copy recipients (visible to all)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Input
                  value={formData.cc}
                  onChange={(e) => setFormData(prev => ({ ...prev, cc: e.target.value }))}
                  placeholder="comma-separated emails"
                  className="w-full"
                  type="email"
                />
              </div>
              <div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label className="block text-sm font-medium text-gray-700 mb-2 cursor-help">
                        BCC
                      </label>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                      Blind carbon copy recipients (hidden from others)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Input
                  value={formData.bcc}
                  onChange={(e) => setFormData(prev => ({ ...prev, bcc: e.target.value }))}
                  placeholder="comma-separated emails"
                  className="w-full"
                  type="email"
                />
              </div>
            </div>

            {/* Subject and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label className="block text-sm font-medium text-gray-700 mb-2 cursor-help">
                        Subject <span className="text-red-500">*</span>
                      </label>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                      Brief description of your email
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject"
                  className="w-full"
                />
              </div>
              <div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label className="block text-sm font-medium text-gray-700 mb-2 cursor-help">
                        Priority
                      </label>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                      Email priority level
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT') => 
                    setFormData(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content */}
            <div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label className="block text-sm font-medium text-gray-700 mb-2 cursor-help">
                      Content <span className="text-red-500">*</span>
                    </label>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                    Your email message content
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your message..."
                rows={8}
                className="w-full resize-none"
              />
            </div>

            {/* Attachments */}
            <div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label className="block text-sm font-medium text-gray-700 mb-2 cursor-help">
                      Attachments
                    </label>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                    Add files to your email
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file);
                      }
                      e.target.value = '';
                    }}
                    accept={acceptedFileTypes.join(',')}
                    className="text-sm"
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </div>
                  )}
                </div>
                
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((attachment, idx) => (
                      <div 
                        key={`${attachment.url}-${idx}`} 
                        className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getFileIcon(attachment.name)}
                          <div className="flex-1 min-w-0">
                            <a 
                              href={attachment.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-sm text-blue-600 hover:underline font-medium truncate block"
                            >
                              {attachment.name}
                            </a>
                            <p className="text-xs text-gray-500">Click to preview</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(attachment.url, '_blank')}
                                  className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                                Download file
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveAttachment(idx)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                                Remove attachment
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <strong>File Requirements:</strong> Max {maxFileSize}MB per file
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Supported: Images, Documents, Archives, Media, Code files, and more
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 mb-6 border-t border-gray-200 bg-gray rounded-b-xl">
            <div className="flex items-center justify-between">
              {/* Email Status */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {formData.subject && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Subject:</span>
                    <span className="text-gray-900 truncate max-w-xs">{formData.subject}</span>
                  </div>
                )}
                {formData.recipient && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">To:</span>
                    <span className="text-gray-900">{formData.recipient}</span>
                  </div>
                )}
                {attachments.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    <span>{attachments.length} attachment{attachments.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded">
                  
                        Cancel
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                      Close without sending
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleSend}
                        disabled={isLoading || !formData.subject.trim() || !formData.recipient.trim() || !formData.content.trim()}
                        className="min-w-[100px] bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 rounded"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                      {isLoading ? 'Sending email...' : 'Send email to recipients'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
