import { Badge } from "@/components/ui/badge";

interface RFIDTagDetailsRowProps {
  tag: any;
  exportColumns: { key: string; label: string; checked: boolean }[];
}

export default function RFIDTagDetailsRow({ tag, exportColumns }: RFIDTagDetailsRowProps) {
  return (
    <tr className="bg-blue-50">
      <td colSpan={exportColumns.filter(c => c.checked).length + 2} className="px-8 py-4 text-sm text-blue-900 border-t border-blue-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-semibold text-xs text-blue-700 mb-1">Tag Number</div>
            <div>{tag.tagNumber}</div>
          </div>
          <div>
            <div className="font-semibold text-xs text-blue-700 mb-1">Tag Type</div>
            <div>{tag.tagType.replace("_", " ")}</div>
          </div>
          <div>
            <div className="font-semibold text-xs text-blue-700 mb-1">Assigned At</div>
            <div>{new Date(tag.assignedAt).toLocaleString()}</div>
          </div>
          <div>
            <div className="font-semibold text-xs text-blue-700 mb-1">Last Used</div>
            <div>{tag.lastUsed ? new Date(tag.lastUsed).toLocaleString() : <span className="text-blue-300 italic">Never</span>}</div>
          </div>
          <div>
            <div className="font-semibold text-xs text-blue-700 mb-1">Status</div>
            <div><Badge variant={tag.status === "ACTIVE" ? "success" : tag.status === "INACTIVE" ? "warning" : "info"}>{tag.status}</Badge></div>
          </div>
          <div>
            <div className="font-semibold text-xs text-blue-700 mb-1">Notes</div>
            <div>{tag.notes || <span className="text-blue-300 italic">None</span>}</div>
          </div>
          <div className="md:col-span-2">
            <div className="font-semibold text-xs text-blue-700 mb-1">Assigned To</div>
            <div>
              {tag.student ? (
                <span className="text-green-700 font-medium">Student: {tag.student.firstName} {tag.student.lastName}</span>
              ) : tag.instructor ? (
                <span className="text-blue-700 font-medium">Instructor: {tag.instructor.firstName} {tag.instructor.lastName}</span>
              ) : (
                <span className="text-gray-400 italic">Unassigned</span>
              )}
            </div>
          </div>
        </div>
        {/* Placeholder for Audit/History Log */}
      </td>
    </tr>
  );
} 