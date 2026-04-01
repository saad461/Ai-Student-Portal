'use client';

import { useMemo } from 'react';
import { RestScreen } from '@/components/rest-screen';
import { AttendanceTracker } from '@/components/attendance-tracker';
import { ActivityTracker } from '@/components/activity-tracker';
import { Sidebar } from '@/components/sidebar';
import { PortalNavbar } from '@/components/portal-navbar';
import { ChatManager } from '@/components/chat-manager';
import { SkillShop } from '@/components/skill-shop';
import { ChatProvider } from '@/components/chat-context';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const isWeekend = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }, []);

  if (isWeekend) {
    return (
      <ChatProvider>
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <RestScreen />
          <SkillShop />
          <ChatManager />
        </div>
      </ChatProvider>
    );
  }

  return (
    <ChatProvider>
      <div className="flex flex-col lg:flex-row min-h-screen bg-muted/30 overflow-x-hidden" style={{ '--editor-sticky-top': '64px' } as React.CSSProperties}>
        <ActivityTracker />
        <AttendanceTracker />
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 relative">
          <PortalNavbar />
          <main className="flex-1 w-full relative">
            {children}
          </main>
        </div>
        <SkillShop />
        <ChatManager />
      </div>
    </ChatProvider>
  );
}
