'use client';

import { useState } from 'react';
import { BatteryLow, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RestScreenProps {
  onUnlock?: () => void;
}

export function RestScreen({ onUnlock }: RestScreenProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const handleUnlock = () => {
    if (code === '7323') {
      onUnlock?.();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6">
      <div className="bg-primary/10 p-6 rounded-full mb-6 animate-pulse">
        <BatteryLow className="h-16 w-16 text-primary" />
      </div>
      <h2 className="text-3xl font-bold mb-2">Rest & Recharge</h2>
      <p className="text-muted-foreground max-w-md text-lg mb-8">
        System is currently offline for the weekend. Take this time to step away from the screen,
        reflect on your learning, and come back fresh on Monday.
      </p>

      <div className="max-w-xs w-full p-6 border rounded-2xl bg-muted/30 backdrop-blur-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">
          <Lock className="h-4 w-4" /> Weekend Override
        </div>
        <Input
          type="password"
          placeholder="Enter access code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={error ? "border-destructive animate-shake" : ""}
          onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
        />
        {error && <p className="text-xs text-destructive font-bold">Invalid access code</p>}
        <Button onClick={handleUnlock} className="w-full font-bold gap-2">
          <Unlock className="h-4 w-4" /> Unlock Portal
        </Button>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Note: Attendance, XP, and Lectures are disabled during weekend sessions.
        </p>
      </div>

      <div className="mt-8 p-4 border rounded-lg bg-muted/50">
        <p className="text-sm font-medium italic">
          &quot;The best coding often happens away from the keyboard.&quot;
        </p>
      </div>
    </div>
  );
}
