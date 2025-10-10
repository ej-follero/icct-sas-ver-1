"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ProfilePinSettingsPage() {
  const [pin, setPin] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    if (!/^\d{4,10}$/.test(pin)) {
      toast.error('PIN must be 4-10 digits');
      return;
    }
    if (pin !== confirm) {
      toast.error('PINs do not match');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/profile/pin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to set PIN');
      toast.success('PIN updated');
      setPin('');
      setConfirm('');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to set PIN');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Security PIN</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm">New PIN</label>
            <Input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="4-10 digits" />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Confirm PIN</label>
            <Input type="password" inputMode="numeric" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter PIN" />
          </div>
          <Button onClick={save} disabled={saving}>Save PIN</Button>
        </CardContent>
      </Card>
    </div>
  );
}


