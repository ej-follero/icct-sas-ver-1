"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMQTTRFIDScan } from '@/hooks/useMQTTRFIDScan';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

export default function RFIDKioskBindPage() {
  const [studentIdNum, setStudentIdNum] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [tagNumber, setTagNumber] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [lastActivity, setLastActivity] = React.useState(Date.now());
  const [locked, setLocked] = React.useState(false);
  const [showPin, setShowPin] = React.useState(false);
  const LOCK_MS = 2 * 60 * 1000;

  const { isConnected, setMode, sendFeedback, recentScans } = useMQTTRFIDScan({
    enabled: true,
    mode: 'registration',
    onNewScan: (scan) => {
      const tag = String(scan.tagNumber || scan.rfid || '').trim();
      if (!tag) return;
      setTagNumber(tag);
      toast.success(`Card detected: ${tag}`);
      sendFeedback('Card detected', tag);
    }
  });

  // Set MQTT mode to registration when component mounts
  React.useEffect(() => {
    if (isConnected) {
      setMode('registration');
    }
  }, [isConnected, setMode]);

  React.useEffect(() => {
    const onAny = () => setLastActivity(Date.now());
    ['mousemove','keydown','click','touchstart'].forEach((e) => window.addEventListener(e, onAny));
    const t = setInterval(() => {
      if (Date.now() - lastActivity > LOCK_MS) setLocked(true);
    }, 5000);
    return () => {
      ['mousemove','keydown','click','touchstart'].forEach((e) => window.removeEventListener(e, onAny));
      clearInterval(t);
    };
  }, [lastActivity]);

  const resetSession = () => {
    setStudentIdNum(''); setPin(''); setTagNumber(''); setLocked(false); setLastActivity(Date.now()); setShowPin(false);
  };

  const appendPin = (d: string) => setPin((p) => (p + d).slice(0, 10));
  const delPin = () => setPin((p) => p.slice(0, -1));

  const handleBind = async () => {
    if (!studentIdNum || !pin || !tagNumber) {
      toast.error('Enter Student ID, PIN, and scan a card');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/rfid/assign/kiosk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIdNum, pin, tagNumber })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to bind');
      toast.success('Card bound successfully');
      resetSession();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to bind');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 w-full">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="p-0">
          <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0 rounded-t-xl">
            <div className="py-5">
              <CardTitle className="text-center text-2xl text-white">Activate RFID Card</CardTitle>
              <div className="text-center mt-2">
                <span className={`text-sm ${isConnected ? 'text-green-300' : 'text-red-300'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {locked && (
            <div className="p-4 border rounded bg-red-50 text-red-500 text-center">
              Session locked due to inactivity.
              <div className="mt-3">
                <Button onClick={resetSession} className="rounded">Start New Session</Button>
              </div>
            </div>
          )}
          {!locked && (
          <>
            <div className="space-y-2">
              <label className="text-sm">Student ID Number</label>
              <Input value={studentIdNum} onChange={(e) => setStudentIdNum(e.target.value)} placeholder="e.g. 2025-12345" className="text-xl py-6" />
            </div>
            <div className="space-y-2">
              <label className="text-sm">PIN</label>
              <div className="relative">
                <Input 
                  type={showPin ? "text" : "password"} 
                  value={pin} 
                  onChange={(e) => setPin(e.target.value)} 
                  placeholder="Enter PIN" 
                  className="text-xl py-6 pr-12" 
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2 select-none">
                {[...'123456789'].map((d) => (
                  <Button key={d} variant="secondary" onClick={() => appendPin(d)} className="py-6 text-xl">{d}</Button>
                ))}
                <Button variant="secondary" onClick={delPin} className="py-6 text-xl">⌫</Button>
                <Button variant="secondary" onClick={() => appendPin('0')} className="py-6 text-xl">0</Button>
                <Button variant="secondary" onClick={() => setPin('')} className="py-6 text-xl">Clear</Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm">Tag Number</label>
              <Input 
                value={tagNumber} 
                onChange={(e) => setTagNumber(e.target.value)} 
                placeholder="Scan card or enter manually" 
                className={`text-xl py-6 ${tagNumber ? 'border-green-500 bg-green-50' : ''}`}
              />
              {tagNumber && (
                <div className="text-sm text-green-600 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Card detected and ready for binding
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button className="w-full py-6 text-lg rounded" disabled={submitting} onClick={handleBind}>Bind Card</Button>
              <Button variant="outline" className="py-6 text-lg rounded" onClick={resetSession}>Reset</Button>
            </div>
          </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


