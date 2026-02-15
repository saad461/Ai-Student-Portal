'use client';

import { BatteryLow } from 'lucide-react';

export function RestScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6">
      <div className="bg-primary/10 p-6 rounded-full mb-6 animate-pulse">
        <BatteryLow className="h-16 w-16 text-primary" />
      </div>
      <h2 className="text-3xl font-bold mb-2">Rest & Recharge</h2>
      <p className="text-muted-foreground max-w-md text-lg">
        System is currently offline for the weekend. Take this time to step away from the screen,
        reflect on your learning, and come back fresh on Monday.
      </p>
      <div className="mt-8 p-4 border rounded-lg bg-muted/50">
        <p className="text-sm font-medium italic">
          &quot;The best coding often happens away from the keyboard.&quot;
        </p>
      </div>
    </div>
  );
}
