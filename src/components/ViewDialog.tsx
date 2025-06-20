import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface ViewDialogField {
  label: string;
  value: string | number;
  type?: 'text' | 'date' | 'badge' | 'number';
  badgeVariant?: 'default' | 'success' | 'destructive' | 'secondary' | 'warning';
}

export interface ViewDialogSection {
  title?: string;
  fields: ViewDialogField[];
  columns?: 1 | 2;
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
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    icon?: React.ReactNode;
  }[];
}

export function ViewDialog({
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
  actions = []
}: ViewDialogProps) {
  const formatValue = (field: ViewDialogField) => {
    if (field.type === 'date' && typeof field.value === 'string') {
      return new Date(field.value).toLocaleDateString();
    }
    if (field.type === 'badge') {
      return (
        <Badge variant={field.badgeVariant || 'default'}>
          {field.value}
        </Badge>
      );
    }
    return field.value;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-full max-h-[80vh] overflow-y-auto bg-white/90 border border-blue-100 shadow-lg rounded-xl px-2 py-2 mx-2 my-1 sm:max-w-[500px] sm:px-4 sm:py-4 sm:mx-4 sm:my-1 md:max-w-[650px] md:px-6 md:py-6 md:mx-6 md:my-1 lg:max-w-[800px] lg:px-8 lg:py-8 lg:mx-8 lg:my-1">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-6 w-6 rounded-full hover:bg-blue-50"
            onClick={() => onOpenChange(false)}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4 text-blue-600" />
          </Button>
          <DialogTitle className="text-blue-900 text-xl font-bold flex items-center gap-2 pr-8">
            {title}
            {status && (
              <Badge variant={status.variant} className="ml-2">
                {status.value}
              </Badge>
            )}
          </DialogTitle>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </DialogHeader>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-8"
            >
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-lg"
            >
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-6">
                  {sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="space-y-4">
                      {section.title && (
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-medium text-blue-900">{section.title}</h4>
                        </div>
                      )}
                      <div className={cn(
                        "grid gap-6",
                        section.columns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                      )}>
                        {section.fields.map((field, fieldIndex) => (
                          <div key={fieldIndex} className="bg-gray-50/50 rounded-lg p-3">
                            <div className="text-xs text-blue-700 font-semibold mb-1">{field.label}</div>
                            <div className="text-base text-blue-800">
                              {formatValue(field)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {description && (
                    <div className="bg-gray-50/50 rounded-lg p-4">
                      <div className="text-xs text-blue-700 font-semibold mb-2">Description</div>
                      <div className="text-base text-blue-800 whitespace-pre-wrap">{description}</div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {actions.length > 0 && (
          <DialogFooter className="flex justify-end gap-2 pt-4">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "default"}
                onClick={action.onClick}
                className="gap-2"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
} 