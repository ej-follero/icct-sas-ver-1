"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMQTTRFIDScan } from '@/hooks/useMQTTRFIDScan';
import { toast } from 'sonner';
import { X, Search } from 'lucide-react';

export type BatchAssignProps = {
  isFullscreen?: boolean;
  onClose?: () => void;
  initialFilters?: { department?: string; yearLevel?: string; search?: string };
  onAssigned?: (summary: { success: number; failed: number; total: number }) => void;
};

type QueueItem = { studentIdNum: string; tagNumber: string; replace: boolean };

export default function BatchAssign({ isFullscreen = false, onClose, initialFilters, onAssigned }: BatchAssignProps) {
  const [search, setSearch] = React.useState(initialFilters?.search || '');
  const [department, setDepartment] = React.useState<string>(initialFilters?.department || 'all');
  const [yearLevel, setYearLevel] = React.useState<string>(initialFilters?.yearLevel || 'all');
  const [replace, setReplace] = React.useState(false);
  const [studentIdNum, setStudentIdNum] = React.useState('');
  const [tagNumber, setTagNumber] = React.useState('');
  const [queue, setQueue] = React.useState<QueueItem[]>([]);
  const [saving, setSaving] = React.useState(false);

  const { isConnected, setMode, sendFeedback } = useMQTTRFIDScan({
    enabled: true,
    mode: 'registration',
    onNewScan: (scan) => {
      console.log('RFID Scan received in BatchAssign:', scan);
      const tag = String(scan?.tagNumber || scan?.rfid || '').trim();
      if (!tag) {
        console.log('No valid tag number found in scan:', scan);
        return;
      }
      console.log('Setting tag number:', tag);
      setTagNumber(tag);
      toast.success('Card detected via MQTT');
      sendFeedback('Card detected', tag);
    }
  });

  // Set MQTT mode to registration when component mounts
  React.useEffect(() => {
    if (isConnected) {
      setMode('registration');
    }
  }, [isConnected, setMode]);

  const addToQueue = () => {
    if (!studentIdNum || !tagNumber) {
      toast.error('Student ID and Tag Number required');
      return;
    }
    setQueue((prev) => [{ studentIdNum, tagNumber, replace }, ...prev]);
    setStudentIdNum('');
    setTagNumber('');
  };

  const assign = async () => {
    if (queue.length === 0) {
      toast.info('No items in queue');
      return;
    }
    setSaving(true);
    try {
      // Use MQTT API for individual assignments
      let success = 0;
      let failed = 0;
      
      for (const item of queue) {
        try {
          const res = await fetch('/api/rfid/assign/mqtt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentIdNum: item.studentIdNum,
              tagNumber: item.tagNumber,
              replace: item.replace,
              reason: 'BATCH_MQTT_ASSIGNMENT'
            })
          });
          
          if (res.ok) {
            success++;
            toast.success(`Assigned ${item.studentIdNum} → ${item.tagNumber}`);
          } else {
            const error = await res.json();
            toast.error(`Failed ${item.studentIdNum}: ${error.error}`);
            failed++;
          }
        } catch (e: any) {
          toast.error(`Failed ${item.studentIdNum}: ${e.message}`);
          failed++;
        }
      }
      
      toast.success(`Completed: ${success} success, ${failed} failed`);
      setQueue([]);
      onAssigned?.({ success, failed, total: queue.length });
    } catch (e: any) {
      toast.error(e?.message || 'Failed to assign');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`space-y-3 ${!isFullscreen ? 'rounded-xl overflow-hidden' : ''}`}>
      {!isFullscreen && (
        <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0 relative">
          <div className="py-4 px-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-white text-lg font-semibold">Batch-Scan Assign</h3>
              <p className="text-blue-100 text-sm">
                Scan a card to auto-fill Tag Number. 
                <span className={`ml-2 ${isConnected ? 'text-green-300' : 'text-red-300'}`}>
                  MQTT: {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </p>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white/90 hover:text-white hover:bg-white/10 rounded-full"
                aria-label="Close"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {isFullscreen && (
        <div className="w-full">
          <div className="ml-auto max-w-full md:max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input 
                  placeholder="Search name or ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 placeholder:text-gray-500"
                />
              </div>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="rounded text-gray-500"><SelectValue placeholder="Department"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="CCS">CCS</SelectItem>
                  <SelectItem value="CBA">CBA</SelectItem>
                </SelectContent>
              </Select>
              <Select value={yearLevel} onValueChange={setYearLevel}>
                <SelectTrigger className="rounded text-gray-500"><SelectValue placeholder="Year Level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="FIRST_YEAR">1st Year</SelectItem>
                  <SelectItem value="SECOND_YEAR">2nd Year</SelectItem>
                  <SelectItem value="THIRD_YEAR">3rd Year</SelectItem>
                  <SelectItem value="FOURTH_YEAR">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <div className="p-5 space-y-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-sm text-blue-900">Student ID Number</Label>
            <Input value={studentIdNum} onChange={(e) => setStudentIdNum(e.target.value)} placeholder="2025-01234" />
          </div>
          <div>
            <Label className="text-sm text-blue-900">Tag Number</Label>
            <Input value={tagNumber} onChange={(e) => setTagNumber(e.target.value)} placeholder="Scan card..." />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input id="replace-toggle" type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
          <label htmlFor="replace-toggle" className="text-sm">Replace existing tag if student already has one</label>
        </div>
        {isFullscreen && (
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="secondary" className="rounded" onClick={addToQueue}>Add to Queue</Button>
            <Button className="rounded" onClick={assign} disabled={saving}>Assign</Button>
            {onClose && (
              <Button variant="outline" className="rounded" onClick={onClose}>Close</Button>
            )}
          </div>
        )}
        <div className="max-h-48 overflow-auto border rounded bg-white/60">
          {queue.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">No items queued</div>
          ) : (
            <ul className="divide-y">
              {queue.map((q, idx) => (
                <li key={idx} className="p-2 flex items-center justify-between text-sm">
                  <span>{q.studentIdNum} → {q.tagNumber} {q.replace ? '(replace)' : ''}</span>
                  <Button variant="ghost" size="sm" onClick={() => setQueue((prev) => prev.filter((_, i) => i !== idx))}>Remove</Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Sticky Footer Buttons (modal mode) */}
      {!isFullscreen && (
        <div className="sticky bottom-0 left-0 right-0 bg-white px-5 py-4 border-t flex flex-wrap gap-2 justify-end">
          <Button variant="secondary" className="rounded" onClick={addToQueue}>Add to Queue</Button>
          <Button className="rounded" onClick={assign} disabled={saving}>Assign</Button>
          {onClose && (
            <Button variant="outline" className="rounded" onClick={onClose}>Close</Button>
          )}
        </div>
      )}
    </div>
  );
}


