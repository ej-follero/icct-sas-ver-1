import { useState, useEffect } from "react";

const AuditLog = ({ readerId }: { readerId: number }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [eventType, setEventType] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [view, setView] = useState<'table' | 'timeline'>('table');

  useEffect(() => {
    fetch(`/api/rfid/readers/${readerId}/logs`)
      .then(res => res.json())
      .then(data => {
        setLogs(Array.isArray(data) ? data : []);
      })
  }, [readerId]);

  // Filtering
  const filteredLogs = logs.filter(log => {
    const matchesEvent = eventType === 'all' || log.eventType === eventType;
    const matchesSeverity = severity === 'all' || log.severity === severity;
    const logDate = log.timestamp ? new Date(log.timestamp) : null;
    const matchesFrom = !dateFrom || (logDate && logDate >= new Date(dateFrom));
    const matchesTo = !dateTo || (logDate && logDate <= new Date(dateTo));
    return matchesEvent && matchesSeverity && matchesFrom && matchesTo;
  });

  // Get unique event types and severities for filter dropdowns
  const eventTypes = Array.from(new Set(logs.map(l => l.eventType))).filter(Boolean);
  const severities = Array.from(new Set(logs.map(l => l.severity))).filter(Boolean);

  return (
    <div className="mt-8">
      <div className="font-semibold text-xs text-blue-700 mb-2">Audit/History Log</div>
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <select className="border rounded px-2 py-1 text-xs" value={eventType} onChange={e => setEventType(e.target.value)}>
          <option value="all">All Events</option>
          {eventTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <select className="border rounded px-2 py-1 text-xs" value={severity} onChange={e => setSeverity(e.target.value)}>
          <option value="all">All Severities</option>
          {severities.map(sev => <option key={sev} value={sev}>{sev}</option>)}
        </select>
        <input type="date" className="border rounded px-2 py-1 text-xs" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <input type="date" className="border rounded px-2 py-1 text-xs" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <button className={`text-xs px-2 py-1 rounded ${view === 'table' ? 'bg-blue-200' : 'bg-white border'}`} onClick={() => setView('table')}>Table</button>
        <button className={`text-xs px-2 py-1 rounded ${view === 'timeline' ? 'bg-blue-200' : 'bg-white border'}`} onClick={() => setView('timeline')}>Timeline</button>
      </div>
      {filteredLogs.length === 0 ? (
        <div className="text-blue-300 italic">No history found for this reader.</div>
      ) : view === 'table' ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border border-blue-100 rounded">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-2 py-2 text-left">Time</th>
                <th className="px-2 py-2 text-left">Event</th>
                <th className="px-2 py-2 text-left">Severity</th>
                <th className="px-2 py-2 text-left">User</th>
                <th className="px-2 py-2 text-left">Message</th>
                <th className="px-2 py-2 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => (
                <tr key={log.id || i} className="border-t border-blue-50">
                  <td className="px-2 py-2 whitespace-nowrap">{log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}</td>
                  <td className="px-2 py-2">{log.eventType}</td>
                  <td className="px-2 py-2">{log.severity}</td>
                  <td className="px-2 py-2">{log.userName || log.user || <span className="text-blue-300 italic">-</span>}</td>
                  <td className="px-2 py-2">{log.message || <span className="text-blue-300 italic">-</span>}</td>
                  <td className="px-2 py-2 whitespace-pre-wrap break-all">{log.details ? (typeof log.details === "string" ? log.details : JSON.stringify(log.details, null, 2)) : <span className="text-blue-300 italic">-</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col gap-4 border-l-2 border-blue-200 pl-4">
          {filteredLogs.map((log, i) => (
            <div key={log.id || i} className="relative">
              <div className="absolute -left-4 top-2 w-2 h-2 rounded-full bg-blue-400" />
              <div className="text-xs text-blue-700 font-semibold">{log.eventType} <span className="text-gray-400 font-normal">({log.severity})</span></div>
              <div className="text-xs text-gray-600">{log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"} {log.userName || log.user ? `by ${log.userName || log.user}` : ''}</div>
              <div className="text-xs text-gray-900 mt-1">{log.message || <span className="text-blue-300 italic">-</span>}</div>
              {log.details && <div className="text-xs text-gray-500 mt-1 whitespace-pre-wrap break-all">{typeof log.details === "string" ? log.details : JSON.stringify(log.details, null, 2)}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLog; 