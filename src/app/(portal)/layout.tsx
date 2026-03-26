'use client';

import { useMemo } from 'react';
import { RestScreen } from '@/components/rest-screen';
import { AttendanceTracker } from '@/components/attendance-tracker';
import { ActivityTracker } from '@/components/activity-tracker';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const isWeekend = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }, []);

  if (isWeekend) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <RestScreen />
      </div>
    );
  }

  return (
    <>
      <ActivityTracker />
      <AttendanceTracker />
      {children}
    </>
  );
}
