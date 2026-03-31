'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { logActivityAction, updateLastSeenAction } from '@/app/admin/actions';

export function ActivityTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Log page entry & update last seen
    logActivityAction('page_view', {}, pathname);
    updateLastSeenAction();

    // Periodically update last seen (every 5 minutes)
    const interval = setInterval(() => {
       updateLastSeenAction();
    }, 1000 * 60 * 5);

    // Track tab switching
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        logActivityAction('tab_switch', { status: 'away' }, pathname);
      } else {
        logActivityAction('tab_switch', { status: 'back' }, pathname);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [pathname]);

  return null;
}
