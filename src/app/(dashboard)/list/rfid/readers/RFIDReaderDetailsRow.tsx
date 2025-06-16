import { RFIDReader } from "./types";
import AuditLog from "./AuditLog";

interface RFIDReaderDetailsRowProps {
  reader: RFIDReader;
  exportColumns: { key: string; label: string; checked: boolean }[];
}

export default function RFIDReaderDetailsRow({ reader, exportColumns }: RFIDReaderDetailsRowProps) {
  return (
    <tr className="bg-blue-50">
      <td colSpan={exportColumns.filter(c => c.checked).length + 2} className="px-8 py-4 text-sm text-blue-900 border-t border-blue-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-semibold text-xs text-blue-700 mb-1">Assembly Date</div>
            <div>{reader.assemblyDate ? new Date(reader.assemblyDate).toLocaleString() : <span className="text-blue-300 italic">N/A</span>}</div>
          </div>
          <div>
            <div className="font-semibold text-xs text-blue-700 mb-1">Last Calibration</div>
            <div>{reader.lastCalibration ? new Date(reader.lastCalibration).toLocaleString() : <span className="text-blue-300 italic">N/A</span>}</div>
          </div>
          <div>
            <div className="font-semibold text-xs text-blue-700 mb-1">Next Calibration</div>
            <div>{reader.nextCalibration ? new Date(reader.nextCalibration).toLocaleString() : <span className="text-blue-300 italic">N/A</span>}</div>
          </div>
          <div>
            <div className="font-semibold text-xs text-blue-700 mb-1">Components</div>
            <div className="whitespace-pre-wrap break-all">{reader.components ? JSON.stringify(reader.components, null, 2) : <span className="text-blue-300 italic">N/A</span>}</div>
          </div>
          <div>
            <div className="font-semibold text-xs text-blue-700 mb-1">Test Results</div>
            <div>{reader.testResults ? JSON.stringify(reader.testResults, null, 2) : <span className="text-blue-300 italic">N/A</span>}</div>
          </div>
          <div>
            <div className="font-semibold text-xs text-blue-700 mb-1">Notes</div>
            <div>{reader.notes || <span className="text-blue-300 italic">None</span>}</div>
          </div>
        </div>
        {/* Audit/History Log */}
        <AuditLog readerId={reader.readerId} />
      </td>
    </tr>
  );
} 