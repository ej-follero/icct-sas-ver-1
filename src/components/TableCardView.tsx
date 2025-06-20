import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Pencil, Trash2, CheckCircle, Inbox } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import React from "react";

interface TableCardViewProps<T> {
  items: T[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onView: (item: T) => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  getItemId: (item: T) => string;
  getItemName: (item: T) => string;
  getItemCode: (item: T) => string;
  getItemStatus: (item: T) => "active" | "inactive";
  getItemDescription?: (item: T) => string | undefined;
  getItemDetails: (item: T) => Array<{ label: string; value: string | number }>;
  isPrinting?: boolean;
  disabled?: (item: T) => boolean;
  isLoading?: boolean;
  deleteTooltip?: (item: T) => string | undefined;
}

export function TableCardView<T>({
  items,
  selectedIds,
  onSelect,
  onView,
  onEdit,
  onDelete,
  getItemId,
  getItemName,
  getItemCode,
  getItemStatus,
  getItemDescription,
  getItemDetails,
  isPrinting = false,
  disabled = () => false,
  isLoading = false,
  deleteTooltip,
}: TableCardViewProps<T>) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="block xl:hidden w-full space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl shadow p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="w-5 h-5 bg-blue-100 rounded-full" />
              <div className="w-16 h-5 bg-blue-100 rounded" />
            </div>
            <div className="h-6 w-2/3 bg-blue-100 rounded mb-1" />
            <div className="h-5 w-1/3 bg-blue-100 rounded" />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="h-4 w-full bg-blue-100 rounded" />
              <div className="h-4 w-full bg-blue-100 rounded" />
              <div className="h-4 w-full bg-blue-100 rounded" />
              <div className="h-4 w-full bg-blue-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <Inbox className="w-10 h-10 mb-2" />
        <div className="font-semibold text-base">No items found.</div>
        <div className="text-sm">Try adjusting your filters or search.</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="block xl:hidden w-full space-y-3">
        {items.map((item) => {
          const id = getItemId(item);
          const name = getItemName(item);
          const code = getItemCode(item);
          const status = getItemStatus(item);
          const description = getItemDescription?.(item);
          const details = getItemDetails(item);
          const isDisabled = disabled(item);
          const isSelected = selectedIds.includes(id);

          return (
            <div
              key={id}
              className={`relative bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-xl shadow p-4 flex flex-col gap-3 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-400 hover:shadow-lg active:scale-[0.98] ${
                isSelected ? "ring-2 ring-blue-500 shadow-blue-100" : ""
              }`}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${name}`}
              aria-checked={isSelected}
              onClick={() => router.push(`/dashboard/list/${id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  router.push(`/dashboard/list/${id}`);
                }
              }}
            >
              {/* Header: Checkbox and Status */}
              <div className="flex items-center justify-between">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onSelect(id)}
                  aria-label={`Select ${name}`}
                  className="focus:ring-2 focus:ring-blue-400 h-4 w-4"
                />
                <Badge
                  variant={status === "active" ? "success" : "destructive"}
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                >
                  {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
                </Badge>
              </div>

              {/* Title Section */}
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-blue-900 leading-tight">{name}</h3>
                <div className="inline-flex items-center px-2 py-1 bg-blue-50 rounded-md">
                  <span className="text-sm font-medium text-blue-600">{code}</span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-1">
                {details.map((detail, index) => (
                  <div key={`${detail.label}-${index}`} className="flex flex-col">
                    <span className="text-xs font-medium text-blue-900/70">{detail.label}</span>
                    <span className="text-sm text-blue-900" title={String(detail.value)}>
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Description */}
              {description && (
                <div className="text-sm text-blue-600/80 border-t border-blue-100 pt-2 line-clamp-2">
                  {description}
                </div>
              )}

              {/* Actions */}
              {!isPrinting && (
                <div className="flex justify-end items-center gap-2 mt-2 pt-2 border-t border-blue-100">
                  <Tooltip key="view-tooltip">
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`View ${name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(item);
                        }}
                        className="h-8 w-8 p-0 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View</TooltipContent>
                  </Tooltip>
                  <Tooltip key="edit-tooltip">
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit ${name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(item);
                        }}
                        className="h-8 w-8 p-0 hover:bg-green-50"
                      >
                        <Pencil className="h-4 w-4 text-green-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit</TooltipContent>
                  </Tooltip>
                  <Tooltip key="delete-tooltip">
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete ${name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item);
                        }}
                        disabled={isDisabled}
                        className="h-8 w-8 p-0 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{deleteTooltip?.(item) || "Delete"}</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
} 