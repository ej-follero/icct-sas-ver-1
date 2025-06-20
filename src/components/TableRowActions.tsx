import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, Pencil, Trash2 } from "lucide-react";

interface TableRowActionsProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  itemName: string;
  disabled?: boolean;
  className?: string;
  deleteTooltip?: string;
}

export function TableRowActions({
  onView,
  onEdit,
  onDelete,
  itemName,
  disabled = false,
  className = "",
  deleteTooltip,
  viewAriaLabel,
  editAriaLabel,
  deleteAriaLabel,
}: TableRowActionsProps & {
  viewAriaLabel?: string;
  editAriaLabel?: string;
  deleteAriaLabel?: string;
}) {
  return (
    <TooltipProvider>
      <div className={`flex gap-2 justify-center ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={viewAriaLabel || `View ${itemName}`}
              className="hover:bg-blue-50"
              onClick={onView}
            >
              <Eye className="h-4 w-4 text-blue-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" align="center" className="bg-blue-900 text-white">
            View details
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={editAriaLabel || `Edit ${itemName}`}
              className="hover:bg-green-50"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4 text-green-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" align="center" className="bg-blue-900 text-white">
            Edit
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <Button
                variant="ghost"
                size="icon"
                aria-label={deleteAriaLabel || `Delete ${itemName}`}
                className="hover:bg-red-50"
                onClick={onDelete}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" align="center" className="bg-blue-900 text-white">
            {deleteTooltip || "Delete"}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
} 