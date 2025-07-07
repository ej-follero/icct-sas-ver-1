"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  className?: string
  disabled?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className,
  disabled = false,
}: PaginationProps) {
  if (totalItems === 0) {
    return null;
  }
  
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !disabled) {
      onPageChange(page)
    }
  }

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={currentPage === 1 || disabled}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={currentPage === totalPages || disabled}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

// Compact version for smaller screens or when space is limited
export function CompactPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  disabled = false,
}: Omit<PaginationProps, "totalItems" | "itemsPerPage">) {
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !disabled) {
      onPageChange(page)
    }
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || disabled}
          >
            Prev
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || disabled}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
