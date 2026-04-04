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

  useEffect(() => {
    const day = new Date().getDay();
    const isNowWeekend = day === 0 || day === 6;

    if (!isNowWeekend) {
      localStorage.removeItem('weekend_unlocked');
      setIsUnlocked(false);
    } else {
      // Check if the portal is unlocked for this weekend session
      const unlockedSession = localStorage.getItem('weekend_unlocked');
      if (unlockedSession === 'true') {
        setIsUnlocked(true);
      }
    }
  }, []);

  const isWeekend = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }, []);

  const handleUnlock = () => {
    localStorage.setItem('weekend_unlocked', 'true');
    setIsUnlocked(true);
  };

  if (isWeekend && !isUnlocked) {
    return (
      <ChatProvider>
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
          {/* Background Mesh Gradient */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/10 blur-[120px]" />
          </div>

          <div className="relative z-10 w-full max-w-4xl">
            <RestScreen onUnlock={handleUnlock} />
          </div>
          <SkillShop />
          <ChatManager />
        </div>
      </ChatProvider>
    );
  }

  return (
    <ChatProvider>
      <div className="flex flex-col lg:flex-row min-h-screen bg-muted/30" style={{ '--editor-sticky-top': '64px' } as React.CSSProperties}>
        <ActivityTracker />
        <AttendanceTracker />
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <PortalNavbar />
          <main className="flex-1 w-full relative min-w-0">
            {children}
          </main>
        </div>
        <SkillShop />
        <ChatManager />
      </div>
    </ChatProvider>
  );
}
