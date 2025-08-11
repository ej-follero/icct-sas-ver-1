import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Download, X, CheckCircle, FileText, HardDrive, Clock, Info, Copy, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backupId: string;
  backupName: string;
  fileSize: string;
  onDownload: (backupId: string) => Promise<boolean>;
}

function DownloadDialog({
  open,
  onOpenChange,
  backupId,
  backupName,
  fileSize,
  onDownload
}: DownloadDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setProgress(0);
      setDownloadStatus('idle');
      setErrorMessage('');
      setIsDownloading(false);
    }
  }, [open]);

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadStatus('downloading');
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      const success = await onDownload(backupId);
      
      clearInterval(progressInterval);
      
      if (success) {
        setProgress(100);
        setDownloadStatus('completed');
        toast.success('Download completed successfully!');
        
        // Close dialog after a short delay
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      } else {
        setDownloadStatus('error');
        setErrorMessage('Failed to download backup file');
        toast.error('Download failed');
      }
    } catch (error) {
      setDownloadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Download failed');
      toast.error('Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (sizeStr: string) => {
    const numericValue = parseFloat(sizeStr.replace(" GB", "").replace(" MB", "").replace(" KB", ""));
    
    if (sizeStr.includes("GB")) {
      return { size: numericValue, unit: "GB" };
    } else if (sizeStr.includes("MB")) {
      return { size: numericValue, unit: "MB" };
    } else if (sizeStr.includes("KB")) {
      return { size: numericValue, unit: "KB" };
    } else {
      return { size: numericValue, unit: "bytes" };
    }
  };

  const { size, unit } = formatFileSize(fileSize);
  const isLargeFile = unit === "GB" || (unit === "MB" && size > 100);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-full max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm border border-blue-200 shadow-2xl rounded-2xl p-0 mx-2 my-1 sm:max-w-[600px] sm:mx-4 sm:my-1 md:max-w-[750px] md:mx-6 md:my-1 lg:max-w-[900px] lg:mx-8 lg:my-1 flex flex-col h-full">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6 relative flex-shrink-0">
          <div className="flex items-start gap-4 pr-24">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
                Download Backup
                <Badge 
                  variant="default" 
                  className="ml-2 bg-white/20 text-white border-white/30"
                >
                  {downloadStatus === 'downloading' ? 'In Progress' : 
                   downloadStatus === 'completed' ? 'Completed' : 
                   downloadStatus === 'error' ? 'Failed' : 'Ready'}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-blue-100 text-sm mt-1 font-medium">
                Download the backup file to your local machine
              </DialogDescription>
            </div>
          </div>
          {/* Action buttons in header - Right side */}
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <Button
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/20 hover:text-white rounded"
              onClick={() => copyToClipboard(backupName, 'Backup Name')}
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy Name
            </Button>
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

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              <div className="p-6 space-y-6">
                {/* File Information Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-blue-200 overflow-hidden"
                >
                  <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-200 border-b border-blue-300">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-blue-900">File Information</h4>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-200 rounded flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900 text-lg">{backupName}</h3>
                        <p className="text-blue-600 text-sm">Backup file ready for download</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="group relative bg-gray-50 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200 rounded p-4 border border-blue-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <HardDrive className="w-4 h-4 text-blue-600" />
                              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                                File Size
                              </div>
                            </div>
                            <div className="text-base font-medium text-blue-800">{fileSize}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0 text-blue-400 hover:text-blue-600"
                            onClick={() => copyToClipboard(fileSize, 'File Size')}
                          >
                            <Copy className={cn(
                              "w-4 h-4",
                              copiedField === 'File Size' ? "text-green-600" : "text-blue-400"
                            )} />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="group relative bg-gray-50 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200 rounded p-4 border border-blue-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                                File Type
                              </div>
                            </div>
                            <div className="text-base font-medium text-blue-800">ZIP Archive</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isLargeFile && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="flex items-center gap-2 text-yellow-800 mb-2">
                          <AlertCircle className="w-5 h-5" />
                          <span className="font-medium">Large file detected</span>
                        </div>
                        <p className="text-sm text-yellow-700">
                          This backup is {fileSize} and may take several minutes to download depending on your connection speed.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Download Progress Section */}
                {downloadStatus === 'downloading' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 overflow-hidden"
                  >
                    <div className="p-4 bg-gradient-to-r from-blue-100 to-blue-200 border-b border-blue-300">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center">
                          <Download className="w-4 h-4 text-white animate-pulse" />
                        </div>
                        <h4 className="text-lg font-semibold text-blue-900">Download Progress</h4>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-200 rounded flex items-center justify-center">
                          <Download className="w-6 h-6 text-blue-700 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900">Downloading Backup</h3>
                          <p className="text-blue-600 text-sm">Please wait while the file is being downloaded</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 font-medium">Progress</span>
                          <span className="font-semibold text-blue-600">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-3 bg-blue-200" />
                        <div className="text-xs text-gray-500 text-center bg-white/50 p-2 rounded">
                          <Info className="w-4 h-4 inline mr-1" />
                          Please don't close this dialog while downloading
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Success State Section */}
                {downloadStatus === 'completed' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 overflow-hidden"
                  >
                    <div className="p-4 bg-gradient-to-r from-green-100 to-green-200 border-b border-green-300">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-green-900">Download Completed</h4>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-green-200 rounded flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-green-700" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-green-900">Download Completed!</h3>
                          <p className="text-green-600 text-sm">The backup file has been saved successfully</p>
                        </div>
                      </div>
                      <div className="bg-white/50 p-3 rounded">
                        <p className="text-sm text-green-700">
                          The backup file has been saved to your downloads folder and is ready to use.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Error State Section */}
                {downloadStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 overflow-hidden"
                  >
                    <div className="p-4 bg-gradient-to-r from-red-100 to-red-200 border-b border-red-300">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-red-900">Download Failed</h4>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-red-200 rounded flex items-center justify-center">
                          <AlertCircle className="w-6 h-6 text-red-700" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-red-900">Download Failed</h3>
                          <p className="text-red-600 text-sm">An error occurred while downloading</p>
                        </div>
                      </div>
                      <div className="bg-white/50 p-3 rounded">
                        <p className="text-sm text-red-700">
                          {errorMessage || 'An error occurred while downloading the backup file. Please try again.'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Download Options Section */}
                {downloadStatus === 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-blue-200 overflow-hidden">
                      <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-200 border-b border-blue-300">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center">
                            <Info className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-blue-900">Download Information</h4>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>This will download the backup file to your default downloads folder.</p>
                          <p>File name: <code className="bg-white px-2 py-1 rounded border text-gray-800 font-mono text-xs">{backupName.replace(/[^a-zA-Z0-9]/g, '_')}_{backupId}.zip</code></p>
                        </div>
                      </div>
                    </div>
                    
                    {isLargeFile && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 overflow-hidden">
                        <div className="p-4 bg-gradient-to-r from-blue-100 to-blue-200 border-b border-blue-300">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center">
                              <AlertCircle className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="text-lg font-semibold text-blue-900">Download Time Estimate</h4>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <p className="text-sm text-blue-700">
                            Based on file size ({fileSize}), this download may take 2-5 minutes depending on your connection speed.
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer with actions - Fixed */}
        <DialogFooter className="!flex !justify-end gap-3 p-6 flex-shrink-0 border-t-2 border-blue-300 bg-blue-50/80 rounded-b-2xl shadow-inner">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={downloadStatus === 'downloading'}
            className="gap-2 rounded-xl"
          >
            Cancel
          </Button>
          
          {downloadStatus === 'idle' && (
            <Button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-blue-600 hover:bg-blue-700 gap-2 rounded-xl"
            >
              <Download className="w-4 h-4" />
              Start Download
            </Button>
          )}
          
          {downloadStatus === 'error' && (
            <Button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-blue-600 hover:bg-blue-700 gap-2 rounded-xl"
            >
              <Download className="w-4 h-4" />
              Retry Download
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { DownloadDialog };
export default DownloadDialog; 