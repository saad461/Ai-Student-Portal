'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { logActivityAction } from '@/app/admin/actions';

export function ActivityTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Log page entry
    logActivityAction('page_view', {}, pathname);

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
    };
  }, [pathname]);

  return null;
}
