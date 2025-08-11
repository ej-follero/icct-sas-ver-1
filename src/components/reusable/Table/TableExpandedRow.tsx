import React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

interface TableExpandedRowProps<T> {
  colSpan: number;
  title?: string;
  headers: string[];
  rows: T[];
  renderRow: (row: T) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

// Note: This component should only return a <td> so it can be rendered inside a <tr> as expanded content.
export function TableExpandedRow<T>({
  colSpan,
  title,
  headers,
  rows,
  renderRow,
  emptyMessage = "No data available.",
  className = "",
}: TableExpandedRowProps<T>) {
  return (
    <td colSpan={colSpan} className={`p-0 ${className}`}>
      <div className="bg-blue-50 p-4">
        {title && <h4 className="font-bold text-blue-800 mb-2">{title}</h4>}
        {rows && rows.length > 0 ? (
          <Table className="bg-white rounded-md">
            <TableHeader>
              <TableRow>
                {headers.map((header, idx) => (
                  <TableHead key={idx} className="text-blue-900 font-semibold text-center">{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="[&>tr>td]:text-blue-900">
              {rows.map((row, index) => (
                <React.Fragment key={index}>
                  {renderRow(row)}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-blue-700">{emptyMessage}</p>
        )}
      </div>
    </td>
  );
} 