'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  Clock,
  LogOut,
  Github,
  Zap,
  Milestone,
  Menu,
  ChevronLeft,
  Library,
  Trophy,
  Briefcase,
  Mic,
  Heart,
  ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { GlobalSearch } from './global-search';
import { NotificationBell } from './notifications';

export function Sidebar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') setIsCollapsed(true);
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', String(newState));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Roadmap', href: '/roadmap', icon: Milestone },
    { name: 'Courses', href: '/courses', icon: Layers },
    { name: 'Curriculum', href: '/curriculum', icon: BookOpen },
    { name: 'Skill Store', href: '/shop', icon: ShoppingCart },
    { name: 'My Library', href: '/library', icon: Library },
    { name: 'Challenges', href: '/challenges', icon: Trophy },
    { name: 'Career Center', href: '/career', icon: Briefcase },
    { name: 'Interview Prep', href: '/interview-prep', icon: Mic },
    { name: 'Feeling Tired?', href: '/wellness', icon: Heart },
    { name: 'Attendance', href: '/attendance', icon: Clock },
    { name: 'GitHub Mastery', href: '/github-mastery', icon: Github },
    { name: 'Deep Work', href: '/timer', icon: Zap },
  ];

  if (!mounted) return <aside className="w-64 border-r h-screen sticky top-0 bg-background" />;

  return (
    <aside className={cn(
      "hidden lg:flex transition-all duration-300 border-r flex-col h-screen sticky top-0 bg-background z-40",
      isCollapsed ? "w-20" : "w-64",
      theme === 'pro' ? "border-primary/20" : "border-border"
    )}>
      <div className={cn(
        "p-6 flex items-center transition-all",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <h1 className={cn(
            "text-xl font-bold flex items-center gap-2 overflow-hidden whitespace-nowrap",
            theme === 'pro' && "hacker-text"
          )}>
            <Zap className="h-6 w-6 fill-primary shrink-0" />
            <span>{theme === 'pro' ? 'PRO PORTAL' : 'Student Portal'}</span>
          </h1>
        )}
        {isCollapsed && <Zap className="h-8 w-8 fill-primary" />}

        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-muted transition-colors absolute -right-3 top-16 bg-background border shadow-sm"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="px-6 flex justify-between items-center mb-2">
         {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alerts</span>}
         <NotificationBell />
      </div>

      <div className="px-4 mt-6">
         <GlobalSearch />
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-6">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={isCollapsed ? item.name : ''}
            className={cn(
              "flex items-center rounded-md transition-colors",
              isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground",
              theme === 'pro' && pathname === item.href && "hacker-border shadow-primary/50"
            )}
          >
            <item.icon className={cn("shrink-0", isCollapsed ? "h-6 w-6" : "h-5 w-5")} />
            {!isCollapsed && <span className="overflow-hidden whitespace-nowrap">{item.name}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : ""}
          className={cn(
            "flex items-center w-full rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors",
            isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2"
          )}
        >
          <LogOut className={cn("shrink-0", isCollapsed ? "h-6 w-6" : "h-5 w-5")} />
          {!isCollapsed && <span className="overflow-hidden whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
