'use client';

import { useMemo } from 'react';
import { RestScreen } from '@/components/rest-screen';
import { AttendanceTracker } from '@/components/attendance-tracker';
import { ActivityTracker } from '@/components/activity-tracker';
import { Sidebar } from '@/components/sidebar';
import { PortalNavbar } from '@/components/portal-navbar';

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
    <div className="flex flex-col lg:flex-row min-h-screen bg-muted/30">
      <ActivityTracker />
      <AttendanceTracker />
      <Sidebar />
      <PortalNavbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
