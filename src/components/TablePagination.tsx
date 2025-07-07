import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { ChevronsLeft, ChevronLeft, ChevronsRight, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  loading?: boolean;
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  loading = false,
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalItems);

  return (
    <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 px-6 py-6 ${className}`}>
      {/* Left Side - Page Size & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-blue-800 uppercase tracking-wide">Show:</span>
          <Select value={String(pageSize)} onValueChange={v => onPageSizeChange(Number(v))}>
            <SelectTrigger className="w-40 border-blue-300 rounded-xl text-blue-900 text-sm font-medium focus:ring-blue-500/30 focus:border-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {pageSizeOptions.map(opt => (
                <SelectItem key={opt} value={String(opt)}>{opt} students</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-xl border border-blue-200">
          Showing <span className="font-bold text-blue-900">{rangeStart}–{rangeEnd}</span> of <span className="font-bold text-blue-900">{totalItems}</span> students
        </div>
      </div>
      {/* Right Side - Navigation */}
      <div className="flex items-center justify-center lg:justify-end gap-2">
        <Button
          onClick={() => onPageChange(1)}
          disabled={page === 1 || loading}
          variant="outline"
          size="sm"
          className="border border-blue-300 text-blue-700 rounded-xl hover:bg-blue-50 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium px-3 py-2"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1 || loading}
          variant="outline"
          size="sm"
          className="border border-blue-300 text-blue-700 rounded-xl hover:bg-blue-50 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium px-3 py-2"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-sm border border-blue-500">
          <span className="text-sm font-medium">Page</span>
          <span className="font-bold">{page}</span>
          <span className="text-blue-200">/</span>
          <span className="font-bold">{totalPages}</span>
        </div>
        <Button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages || loading}
          variant="outline"
          size="sm"
          className="border border-blue-300 rounded-xl text-blue-700 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium px-3 py-2"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages || loading}
          variant="outline"
          size="sm"
          className="border border-blue-300 rounded-xl text-blue-700 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium px-3 py-2"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}; 