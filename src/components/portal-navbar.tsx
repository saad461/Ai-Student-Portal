'use client';

import { useState } from 'react';
import { Menu, Zap } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Sidebar } from '@/components/sidebar';
import { cn } from '@/lib/utils';

export function PortalNavbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <>
      <header className="lg:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </button>
            <h1 className={cn(
              "text-lg font-bold flex items-center gap-2",
              theme === 'pro' && "hacker-text"
            )}>
              <Zap className="h-5 w-5 fill-primary shrink-0" />
              <span>{theme === 'pro' ? 'PRO PORTAL' : 'Student Portal'}</span>
            </h1>
          </div>
        </div>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}
