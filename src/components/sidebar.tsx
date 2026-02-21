'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Clock,
  LogOut,
  Github,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Curriculum', href: '/curriculum', icon: BookOpen },
    { name: 'Attendance', href: '/attendance', icon: Clock },
    { name: 'GitHub Mastery', href: '/github-mastery', icon: Github },
    { name: 'Deep Work', href: '/timer', icon: Zap },
  ];

  return (
    <aside className={cn(
      "w-64 border-r flex flex-col h-screen sticky top-0 bg-background",
      theme === 'pro' ? "border-primary/20" : "border-border"
    )}>
      <div className="p-6">
        <h1 className={cn(
          "text-xl font-bold flex items-center gap-2",
          theme === 'pro' && "hacker-text"
        )}>
          <Zap className="h-6 w-6 fill-primary" />
          {theme === 'pro' ? 'PRO PORTAL' : 'Student Portal'}
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground",
              theme === 'pro' && pathname === item.href && "hacker-border shadow-primary/50"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
