'use client';

import { useMemo, useState, useEffect } from 'react';
import { RestScreen } from '@/components/rest-screen';
import { AttendanceTracker } from '@/components/attendance-tracker';
import { ActivityTracker } from '@/components/activity-tracker';
import { Sidebar } from '@/components/sidebar';
import { PortalNavbar } from '@/components/portal-navbar';
import { ChatManager } from '@/components/chat-manager';
import { SkillShop } from '@/components/skill-shop';
import { ChatProvider } from '@/components/chat-context';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);

  const isWeekend = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }, []);

  // Persist weekend unlock state in sessionStorage (session-scoped)
  useEffect(() => {
    const status = sessionStorage.getItem('weekend_unlocked');
    if (status === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
    sessionStorage.setItem('weekend_unlocked', 'true');
  };

  if (isWeekend && !isUnlocked) {
    return (
      <ChatProvider>
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <RestScreen onUnlock={handleUnlock} />
          <SkillShop />
          <ChatManager />
        </div>
      </ChatProvider>
    );
  }

  return (
    <ChatProvider>
      <div className="flex flex-col lg:flex-row min-h-screen bg-muted/30 overflow-x-hidden">
        {/* Only show trackers if it's NOT the weekend */}
        {!isWeekend && (
          <>
            <ActivityTracker />
            <AttendanceTracker />
          </>
        )}
        <Sidebar />
        <PortalNavbar />
        <main className="flex-1 w-full relative min-w-0">
          {children}
        </main>
        <SkillShop />
        <ChatManager />
      </div>
    </ChatProvider>
  );
}
