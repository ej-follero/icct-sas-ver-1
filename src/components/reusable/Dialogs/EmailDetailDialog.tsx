"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, 
  Mail, 
  MailOpen, 
  Reply, 
  ReplyAll, 
  Forward, 
  Printer, 
  Download,
  Eye,
  EyeOff,
  FileText,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface EmailRecipient {
  address: string;
  rtype: 'TO' | 'CC' | 'BCC';
}

export interface EmailAttachment {
  name: string;
  url: string;
}

export interface Email {
  id: string;
  subject: string;
  sender: string;
  recipient: string;
  timestamp: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'DRAFT' | 'PENDING';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  type: 'INBOX' | 'SENT' | 'DRAFT' | 'SPAM' | 'TRASH';
  content: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  recipients?: EmailRecipient[];
  attachments?: EmailAttachment[];
}

interface EmailDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: Email | null;
  isLoading?: boolean;
  onReply?: (email: Email) => void;
  onReplyAll?: (email: Email) => void;
  onForward?: (email: Email) => void;
  onPrint?: (email: Email) => void;
  onDownloadAttachments?: (attachments: EmailAttachment[]) => Promise<void>;
  isDownloadingAttachments?: boolean;
}

export default function EmailDetailDialog({
  open,
  onOpenChange,
  email,
  isLoading = false,
  onReply,
  onReplyAll,
  onForward,
  onPrint,
  onDownloadAttachments,
  isDownloadingAttachments = false,
}: EmailDetailDialogProps) {
  const [renderMode, setRenderMode] = useState<'plain' | 'html'>('plain');

  // Basic HTML sanitizer for rendering email content
  const sanitizeHtml = useCallback((html: string) => {
    try {
      // Remove script and style tags entirely
      let cleaned = html.replace(/<\/(?:script|style)>/gi, '')
        .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
      // Remove on* event handlers
      cleaned = cleaned.replace(/ on[a-zA-Z]+\s*=\s*"[^"]*"/g, '')
        .replace(/ on[a-zA-Z]+\s*=\s*'[^']*'/g, '')
        .replace(/ on[a-zA-Z]+\s*=\s*[^\s>]+/g, '');
      // Disallow javascript: and data: URLs in href/src
      cleaned = cleaned.replace(/(href|src)\s*=\s*"\s*(javascript:|data:)[^"]*"/gi, '$1="#"')
        .replace(/(href|src)\s*=\s*'\s*(javascript:|data:)[^']*'/gi, '$1="#"')
        .replace(/(href|src)\s*=\s*(javascript:|data:)[^\s>]+/gi, '$1="#"');
      return cleaned;
    } catch {
      return '';
    }
  }, []);

  const getStatusIcon = (status: Email['status']) => {
    switch (status) {
      case 'SENT': return <Send className="w-4 h-4 text-green-500" />;
      case 'DELIVERED': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'READ': return <MailOpen className="w-4 h-4 text-blue-600" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'DRAFT': return <FileText className="w-4 h-4 text-gray-500" />;
      case 'PENDING': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: Email['priority']) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'NORMAL': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'LOW': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: Email['status']) => {
    switch (status) {
      case 'SENT': return 'bg-green-100 text-green-700 border-green-200';
      case 'DELIVERED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'READ': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'FAILED': return 'bg-red-100 text-red-700 border-red-200';
      case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleDownloadAll = useCallback(async () => {
    if (!email?.attachments || email.attachments.length === 0) return;
    if (onDownloadAttachments) {
      await onDownloadAttachments(email.attachments);
    }
  }, [email, onDownloadAttachments]);

  const handlePrint = useCallback(() => {
    if (email && onPrint) {
      onPrint(email);
    } else if (email) {
      // Create a comprehensive print layout for the email
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to print');
        return;
      }

      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email - ${email.subject}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              margin: 0; 
              padding: 20px; 
              color: #333; 
              line-height: 1.6; 
              background: white;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #1e40af; 
              padding-bottom: 20px; 
            }
            .header h1 { 
              color: #1e40af; 
              margin: 0 0 10px 0; 
              font-size: 24px; 
            }
            .header p { 
              margin: 0; 
              color: #666; 
              font-size: 14px; 
            }
            .email-meta { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px; 
              margin-bottom: 30px; 
              padding: 20px; 
              background-color: #f8fafc; 
              border-radius: 8px; 
            }
            .meta-item { 
              display: flex; 
              flex-direction: column; 
            }
            .meta-label { 
              font-size: 12px; 
              font-weight: 600; 
              color: #666; 
              text-transform: uppercase; 
              letter-spacing: 0.5px; 
              margin-bottom: 4px; 
            }
            .meta-value { 
              font-size: 14px; 
              color: #333; 
              font-weight: 500; 
            }
            .status-badges { 
              display: flex; 
              gap: 10px; 
              margin-bottom: 20px; 
            }
            .badge { 
              padding: 4px 12px; 
              border-radius: 4px; 
              font-size: 12px; 
              font-weight: 500; 
            }
            .badge-status { 
              background-color: #dbeafe; 
              color: #1e40af; 
            }
            .badge-priority { 
              background-color: #fef3c7; 
              color: #d97706; 
            }
            .email-content { 
              margin-top: 20px; 
              padding: 20px; 
              border: 1px solid #e2e8f0; 
              border-radius: 8px; 
              background-color: white; 
            }
            .content-header { 
              font-size: 16px; 
              font-weight: 600; 
              color: #1e40af; 
              margin-bottom: 15px; 
              padding-bottom: 10px; 
              border-bottom: 1px solid #e2e8f0; 
            }
            .content-body { 
              white-space: pre-wrap; 
              font-size: 14px; 
              line-height: 1.6; 
              color: #333; 
            }
            .attachments { 
              margin-top: 20px; 
              padding: 15px; 
              background-color: #f8fafc; 
              border-radius: 8px; 
            }
            .attachments h4 { 
              margin: 0 0 10px 0; 
              font-size: 14px; 
              color: #1e40af; 
            }
            .attachment-item { 
              display: flex; 
              align-items: center; 
              gap: 8px; 
              padding: 8px 0; 
              border-bottom: 1px solid #e2e8f0; 
            }
            .attachment-item:last-child { 
              border-bottom: none; 
            }
            .attachment-name { 
              font-size: 13px; 
              color: #1e40af; 
              text-decoration: none; 
            }
            .footer { 
              margin-top: 30px; 
              padding-top: 20px; 
              border-top: 1px solid #e2e8f0; 
              text-align: center; 
              font-size: 12px; 
              color: #666; 
            }
            @media print { 
              body { margin: 0; padding: 15px; } 
              .email-content { break-inside: avoid; } 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Email Details</h1>
            <p>Generated on ${currentDate}</p>
          </div>
          
          <div class="email-meta">
            <div class="meta-item">
              <div class="meta-label">From</div>
              <div class="meta-value">${email.sender}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">To</div>
              <div class="meta-value">${email.recipient}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Date</div>
              <div class="meta-value">${new Date(email.timestamp).toLocaleString()}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Subject</div>
              <div class="meta-value">${email.subject}</div>
            </div>
          </div>
          
          <div class="status-badges">
            <div class="badge badge-status">${email.status}</div>
            <div class="badge badge-priority">${email.priority}</div>
            ${email.isStarred ? '<div class="badge badge-priority">⭐ Starred</div>' : ''}
            ${email.isImportant ? '<div class="badge badge-priority">⚠️ Important</div>' : ''}
          </div>
          
          <div class="email-content">
            <div class="content-header">Message Content</div>
            <div class="content-body">${email.content}</div>
          </div>
          
          ${email.attachments && email.attachments.length > 0 ? `
            <div class="attachments">
              <h4>Attachments (${email.attachments.length})</h4>
              ${email.attachments.map(attachment => `
                <div class="attachment-item">
                  <span>📎</span>
                  <span class="attachment-name">${attachment.name}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <div class="footer">
            <p>This email was printed from the ICCT Smart Attendance System</p>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      };
      toast.success('Print dialog opened');
    }
  }, [email, onPrint]);

  if (!email) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden rounded-xl flex flex-col p-0">
        <DialogHeader className="p-6 flex-shrink-0">
          <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-6 rounded-t-xl -m-6 -mt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-bold text-white truncate mb-2">
                  {email.subject}
                </DialogTitle>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(email.status)}
                    <Badge className={`text-xs bg-white/20 text-white border-white/30 hover:bg-white/20`}>
                      {email.status}
                    </Badge>
                  </div>
                  <Badge className={`text-xs bg-white/20 text-white border-white/30 hover:bg-white/20`}>
                    {email.priority}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-10 w-10 rounded-full hover:bg-white/20 text-white"
              onClick={() => onOpenChange(false)}
              aria-label="Close dialog"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Email Header Info */}
          <div className="flex-shrink-0 px-6 py-4 border-b bg-gray-50">
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">From</label>
                  <p className="text-sm text-gray-900 mt-1">{email.sender}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">To</label>
                  <p className="text-sm text-gray-900 mt-1">{email.recipient}</p>
                </div>
              </div>
              
              {email.recipients && email.recipients.length > 0 && (
                <div className="space-y-2">
                  {['TO', 'CC', 'BCC'].map(label => {
                    const list = email.recipients!.filter(r => r.rtype === label);
                    if (list.length === 0) return null;
                    return (
                      <div key={label} className="flex gap-3">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide w-12">
                          {label}:
                        </label>
                        <p className="text-sm text-gray-900">{list.map(r => r.address).join(', ')}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(email.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 px-6 py-3 border-b bg-white">
            <div className="flex items-center gap-3 flex-wrap">
              {onReply && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReply(email)}
                  className="h-9 border-gray-300 text-gray-700 hover:bg-gray-50 rounded"
                >
                  <Reply className="w-4 h-4 mr-2" />
                  Reply
                </Button>
              )}
              {onReplyAll && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReplyAll(email)}
                  className="h-9 border-gray-300 text-gray-700 hover:bg-gray-50 rounded"
                >
                  <ReplyAll className="w-4 h-4 mr-2" />
                  Reply All
                </Button>
              )}
              {onForward && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onForward(email)}
                  className="h-9 border-gray-300 text-gray-700 hover:bg-gray-50 rounded"
                >
                  <Forward className="w-4 h-4 mr-2" />
                  Forward
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-9 border-gray-300 text-gray-700 hover:bg-gray-50 rounded"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRenderMode(m => m === 'plain' ? 'html' : 'plain')}
                className="h-9 text-gray-600 hover:bg-gray-100 rounded"
              >
                {renderMode === 'plain' ? (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    View HTML
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    View Plain Text
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Email Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {renderMode === 'plain' ? (
                  <div className="prose max-w-none whitespace-pre-wrap text-sm text-gray-800">
                    {email.content}
                  </div>
                ) : (
                  <div 
                    className="prose max-w-none text-sm text-gray-800" 
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(email.content) }} 
                  />
                )}

                {/* Attachments */}
                {email.attachments && email.attachments.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-semibold text-gray-700">
                        Attachments ({email.attachments.length})
                      </h5>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleDownloadAll} 
                        disabled={isDownloadingAttachments}
                        className="h-9 border-gray-300 text-gray-700 hover:bg-gray-50 rounded"
                      >
                        {isDownloadingAttachments ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Download All
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {email.attachments.map((attachment, idx) => (
                        <div 
                          key={`${attachment.url}-${idx}`} 
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-gray-500" />
                          <a 
                            href={attachment.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-sm text-blue-600 hover:underline flex-1"
                          >
                            {attachment.name}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
