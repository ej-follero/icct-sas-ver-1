import { Fragment } from "react";
import { RFIDReader } from "./types";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import RFIDReaderDetailsRow from "./RFIDReaderDetailsRow";
import DetailsSkeleton from "./DetailsSkeleton";
import { STATUS_OPTIONS, DEFAULT_EXPORT_COLUMNS } from "./constants";

interface RFIDReaderTableProps {
  readers: RFIDReader[];
  exportColumns: { key: string; label: string; checked: boolean }[];
  selectedReaderIds: number[];
  toggleOne: (id: number) => void;
  toggleAll: () => void;
  allSelected: boolean;
  someSelected: boolean;
  expandedRows: number[];
  toggleRow: (readerId: number) => void;
  focusedRow: number | null;
  setFocusedRow: (id: number) => void;
  getRoomName: (roomId: number) => string;
  renderStatusBadge: (status: string) => JSX.Element;
  userRole: 'admin' | 'staff' | 'viewer';
  setModalReader: (reader: RFIDReader) => void;
  setModalOpen: (open: boolean) => void;
  setReaderToDelete: (reader: RFIDReader) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setSelectedReader: (reader: RFIDReader) => void;
  setViewDialogOpen: (open: boolean) => void;
  readersLoading?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  canEdit: boolean;
  canDelete: boolean;
}

export default function RFIDReaderTable({
  readers,
  exportColumns,
  selectedReaderIds,
  toggleOne,
  toggleAll,
  allSelected,
  someSelected,
  expandedRows,
  toggleRow,
  focusedRow,
  setFocusedRow,
  getRoomName,
  renderStatusBadge,
  userRole,
  setModalReader,
  setModalOpen,
  setReaderToDelete,
  setDeleteDialogOpen,
  setSelectedReader,
  setViewDialogOpen,
  readersLoading = false,
  sortBy = "deviceId",
  sortDir = "asc",
  canEdit,
  canDelete,
}: RFIDReaderTableProps) {
  // Helper for aria-sort
  const ariaSort = (column: string) => {
    if (sortBy === column) return sortDir === "asc" ? "ascending" : "descending";
    return "none";
  };

  return (
    <table className="min-w-full w-full bg-white border border-blue-100 rounded-xl shadow" role="table" aria-label="RFID Readers">
      <thead className="bg-blue-100">
        <tr>
          <th className="px-2 py-3 text-center">
            <input
              type="checkbox"
              checked={allSelected}
              ref={el => { if (el) el.indeterminate = !allSelected && someSelected; }}
              onChange={toggleAll}
              aria-label="Select all readers on this page"
            />
          </th>
          {exportColumns.filter(c => c.checked).map(col => {
            if (col.key === "deviceId") return (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-blue-700" aria-sort={ariaSort("deviceId")}>Device ID</th>
            );
            if (col.key === "deviceName") return (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-blue-700" aria-sort={ariaSort("deviceName")}>Name</th>
            );
            if (col.key === "room") return (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-blue-700" aria-sort={ariaSort("room")}>Room</th>
            );
            if (col.key === "status") return (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-blue-700" aria-sort={ariaSort("status")}>Status</th>
            );
            if (col.key === "ipAddress") return (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-blue-700" aria-sort={ariaSort("ipAddress")}>IP Address</th>
            );
            if (col.key === "lastSeen") return (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-blue-700" aria-sort={ariaSort("lastSeen")}>Last Seen</th>
            );
            return null;
          })}
          <th className="px-4 py-3 text-center text-xs font-semibold text-blue-700">Actions</th>
        </tr>
      </thead>
      <tbody>
        {readers.length === 0 ? (
          <tr>
            <td colSpan={exportColumns.filter(c => c.checked).length + 2} className="text-center text-blue-400 py-8">
              No RFID readers found.
            </td>
          </tr>
        ) : (
          readers.map((reader: RFIDReader) => (
            <Fragment key={reader.readerId}>
              <tr
                className={`hover:bg-blue-50 transition${focusedRow === reader.readerId ? " ring-2 ring-blue-400" : ""}`}
                tabIndex={0}
                aria-selected={selectedReaderIds.includes(reader.readerId)}
                onClick={() => setFocusedRow(reader.readerId)}
                onFocus={() => setFocusedRow(reader.readerId)}
                role="row"
              >
                <td className="px-2 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedReaderIds.includes(reader.readerId)}
                    onChange={() => toggleOne(reader.readerId)}
                  />
                </td>
                {exportColumns.filter(c => c.checked).map(col => {
                  if (col.key === "deviceId") return (
                    <td key={col.key} className="px-4 py-3 font-mono text-blue-900 flex items-center gap-2">
                      <button
                        className="focus:outline-none"
                        aria-label={expandedRows.includes(reader.readerId) ? `Collapse details for ${reader.deviceId}` : `Expand details for ${reader.deviceId}`}
                        aria-expanded={expandedRows.includes(reader.readerId)}
                        aria-controls={`details-row-${reader.readerId}`}
                        onClick={e => { e.stopPropagation(); toggleRow(reader.readerId); }}
                        tabIndex={0}
                      >
                        {expandedRows.includes(reader.readerId) ? (
                          <ChevronDown className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                      {reader.deviceId}
                    </td>
                  );
                  if (col.key === "deviceName") return (
                    <td key={col.key} className="px-4 py-3">{reader.deviceName || <span className="text-blue-300 italic">Unnamed</span>}</td>
                  );
                  if (col.key === "room") return (
                    <td key={col.key} className="px-4 py-3">{getRoomName(reader.roomId)}</td>
                  );
                  if (col.key === "status") return (
                    <td key={col.key} className="px-4 py-3">{renderStatusBadge(reader.status)}</td>
                  );
                  if (col.key === "ipAddress") return (
                    <td key={col.key} className="px-4 py-3">{reader.ipAddress || <span className="text-blue-300 italic">N/A</span>}</td>
                  );
                  if (col.key === "lastSeen") return (
                    <td key={col.key} className="px-4 py-3">{new Date(reader.lastSeen).toLocaleString()}</td>
                  );
                  return null;
                })}
                <td className="px-4 py-3 flex gap-2 justify-center">
                  <Button variant="ghost" size="icon" aria-label={`View details for ${reader.deviceId}`} onClick={e => { e.stopPropagation(); setSelectedReader(reader); setViewDialogOpen(true); }}>
                    <Eye className="w-5 h-5 text-blue-600" />
                  </Button>
                  {(userRole === 'admin' || userRole === 'staff') ? (
                    <>
                      {canEdit ? (
                        <Button variant="ghost" size="icon" aria-label={`Edit reader ${reader.deviceId}`} onClick={e => { e.stopPropagation(); setModalReader(reader); setModalOpen(true); }}>
                          <Pencil className="w-5 h-5 text-green-600" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" aria-label="Edit reader (restricted)" disabled title="You do not have permission to edit readers.">
                          <Pencil className="w-5 h-5 text-green-300" />
                        </Button>
                      )}
                      {canDelete ? (
                        <Button variant="ghost" size="icon" aria-label={`Delete reader ${reader.deviceId}`} onClick={e => { e.stopPropagation(); setReaderToDelete(reader); setDeleteDialogOpen(true); }}>
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" aria-label="Delete reader (restricted)" disabled title="You do not have permission to delete readers.">
                          <Trash2 className="w-5 h-5 text-red-300" />
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="icon" aria-label="Edit reader (restricted)" disabled title="You do not have permission to edit readers.">
                        <Pencil className="w-5 h-5 text-green-300" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete reader (restricted)" disabled title="You do not have permission to delete readers.">
                        <Trash2 className="w-5 h-5 text-red-300" />
                      </Button>
                    </>
                  )}
                </td>
              </tr>
              {readersLoading
                ? <DetailsSkeleton colSpan={exportColumns.filter(c => c.checked).length + 2} />
                : expandedRows.includes(reader.readerId) && (
                    <RFIDReaderDetailsRow reader={reader} exportColumns={exportColumns} />
                  )
              }
            </Fragment>
          ))
        )}
      </tbody>
    </table>
  );
} 