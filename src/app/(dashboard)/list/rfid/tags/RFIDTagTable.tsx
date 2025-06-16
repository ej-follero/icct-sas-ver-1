import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import RFIDTagDetailsRow from "./RFIDTagDetailsRow";
import DetailsSkeleton from "../readers/DetailsSkeleton";

interface RFIDTagTableProps {
  tags: any[];
  exportColumns: { key: string; label: string; checked: boolean }[];
  selectedTagIds: number[];
  toggleOne: (id: number) => void;
  toggleAll: () => void;
  allSelected: boolean;
  someSelected: boolean;
  expandedRows: number[];
  toggleRow: (tagId: number) => void;
  focusedRow: number | null;
  setFocusedRow: (id: number) => void;
  renderStatusBadge: (status: string) => JSX.Element;
  userRole: 'admin' | 'staff' | 'viewer';
  setModalTag: (tag: any) => void;
  setModalOpen: (open: boolean) => void;
  setTagToDelete: (tag: any) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setSelectedTag: (tag: any) => void;
  setViewDialogOpen: (open: boolean) => void;
  tagsLoading?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  canEdit: boolean;
  canDelete: boolean;
}

export default function RFIDTagTable({
  tags,
  exportColumns,
  selectedTagIds,
  toggleOne,
  toggleAll,
  allSelected,
  someSelected,
  expandedRows,
  toggleRow,
  focusedRow,
  setFocusedRow,
  renderStatusBadge,
  userRole,
  setModalTag,
  setModalOpen,
  setTagToDelete,
  setDeleteDialogOpen,
  setSelectedTag,
  setViewDialogOpen,
  tagsLoading = false,
  sortBy = "tagNumber",
  sortDir = "asc",
  canEdit,
  canDelete,
}: RFIDTagTableProps) {
  // Helper for aria-sort
  const ariaSort = (column: string) => {
    if (sortBy === column) return sortDir === "asc" ? "ascending" : "descending";
    return "none";
  };

  return (
    <table className="min-w-full w-full bg-white border border-blue-100 rounded-xl shadow" role="table" aria-label="RFID Tags">
      <thead className="bg-blue-100">
        <tr>
          <th className="px-2 py-3 text-center">
            <input
              type="checkbox"
              checked={allSelected}
              ref={el => { if (el) el.indeterminate = !allSelected && someSelected; }}
              onChange={toggleAll}
              aria-label="Select all tags on this page"
            />
          </th>
          {exportColumns.filter(c => c.checked).map(col => (
            <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-blue-700" aria-sort={ariaSort(col.key)}>{col.label}</th>
          ))}
          <th className="px-4 py-3 text-center text-xs font-semibold text-blue-700">Actions</th>
        </tr>
      </thead>
      <tbody>
        {tags.length === 0 ? (
          <tr>
            <td colSpan={exportColumns.filter(c => c.checked).length + 2} className="text-center text-blue-400 py-8">
              No RFID tags found.
            </td>
          </tr>
        ) : (
          tags.map((tag: any) => (
            <Fragment key={tag.tagId}>
              <tr
                className={`hover:bg-blue-50 transition${focusedRow === tag.tagId ? " ring-2 ring-blue-400" : ""}`}
                tabIndex={0}
                aria-selected={selectedTagIds.includes(tag.tagId)}
                onClick={() => setFocusedRow(tag.tagId)}
                onFocus={() => setFocusedRow(tag.tagId)}
                role="row"
              >
                <td className="px-2 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedTagIds.includes(tag.tagId)}
                    onChange={() => toggleOne(tag.tagId)}
                  />
                </td>
                {exportColumns.filter(c => c.checked).map(col => {
                  if (col.key === "tagNumber") return (
                    <td key={col.key} className="px-4 py-3 font-mono text-blue-900 flex items-center gap-2">
                      <button
                        className="focus:outline-none"
                        aria-label={expandedRows.includes(tag.tagId) ? `Collapse details for ${tag.tagNumber}` : `Expand details for ${tag.tagNumber}`}
                        aria-expanded={expandedRows.includes(tag.tagId)}
                        aria-controls={`details-row-${tag.tagId}`}
                        onClick={e => { e.stopPropagation(); toggleRow(tag.tagId); }}
                        tabIndex={0}
                      >
                        {expandedRows.includes(tag.tagId) ? (
                          <ChevronDown className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                      {tag.tagNumber}
                    </td>
                  );
                  if (col.key === "tagType") return (
                    <td key={col.key} className="px-4 py-3">{tag.tagType.replace("_", " ")}</td>
                  );
                  if (col.key === "status") return (
                    <td key={col.key} className="px-4 py-3">{renderStatusBadge(tag.status)}</td>
                  );
                  if (col.key === "assignedAt") return (
                    <td key={col.key} className="px-4 py-3">{new Date(tag.assignedAt).toLocaleString()}</td>
                  );
                  if (col.key === "lastUsed") return (
                    <td key={col.key} className="px-4 py-3">{tag.lastUsed ? new Date(tag.lastUsed).toLocaleString() : <span className="text-blue-300 italic">Never</span>}</td>
                  );
                  if (col.key === "notes") return (
                    <td key={col.key} className="px-4 py-3">{tag.notes || <span className="text-blue-300 italic">None</span>}</td>
                  );
                  if (col.key === "assignedTo") return (
                    <td key={col.key} className="px-4 py-3">
                      {tag.student ? (
                        <span className="text-green-700 font-medium">Student: {tag.student.firstName} {tag.student.lastName}</span>
                      ) : tag.instructor ? (
                        <span className="text-blue-700 font-medium">Instructor: {tag.instructor.firstName} {tag.instructor.lastName}</span>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                  );
                  return null;
                })}
                <td className="px-4 py-3 flex gap-2 justify-center">
                  <Button variant="ghost" size="icon" aria-label={`View details for ${tag.tagNumber}`} onClick={e => { e.stopPropagation(); setSelectedTag(tag); setViewDialogOpen(true); }}>
                    <Eye className="w-5 h-5 text-blue-600" />
                  </Button>
                  {(userRole === 'admin' || userRole === 'staff') ? (
                    <>
                      {canEdit ? (
                        <Button variant="ghost" size="icon" aria-label={`Edit tag ${tag.tagNumber}`} onClick={e => { e.stopPropagation(); setModalTag(tag); setModalOpen(true); }}>
                          <Pencil className="w-5 h-5 text-green-600" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" aria-label="Edit tag (restricted)" disabled title="You do not have permission to edit tags.">
                          <Pencil className="w-5 h-5 text-green-300" />
                        </Button>
                      )}
                      {canDelete ? (
                        <Button variant="ghost" size="icon" aria-label={`Delete tag ${tag.tagNumber}`} onClick={e => { e.stopPropagation(); setTagToDelete(tag); setDeleteDialogOpen(true); }}>
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" aria-label="Delete tag (restricted)" disabled title="You do not have permission to delete tags.">
                          <Trash2 className="w-5 h-5 text-red-300" />
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="icon" aria-label="Edit tag (restricted)" disabled title="You do not have permission to edit tags.">
                        <Pencil className="w-5 h-5 text-green-300" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete tag (restricted)" disabled title="You do not have permission to delete tags.">
                        <Trash2 className="w-5 h-5 text-red-300" />
                      </Button>
                    </>
                  )}
                </td>
              </tr>
              {tagsLoading
                ? <DetailsSkeleton colSpan={exportColumns.filter(c => c.checked).length + 2} />
                : expandedRows.includes(tag.tagId) && (
                    <RFIDTagDetailsRow tag={tag} exportColumns={exportColumns} />
                  )
              }
            </Fragment>
          ))
        )}
      </tbody>
    </table>
  );
} 