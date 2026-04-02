'use client';

import { useState } from 'react';
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
  X,
  Library,
  Trophy,
  Briefcase,
  Mic,
  Heart,
  ShoppingCart,
  Code
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from './global-search';
import { NotificationBell } from './notifications';

export function PortalNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { theme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Grades', href: '/grades', icon: Trophy },
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

  return (
    <>
      <header className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        theme === 'pro' ? "border-primary/20" : "border-border"
      )}>
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
               <Code className="h-5 w-5 text-white" />
            </div>
            <span className={cn("font-black tracking-tighter uppercase", theme === 'pro' && "hacker-text")}>
              {theme === 'pro' ? 'DAURIX PRO' : 'DAURIX'}
            </span>
          </Link>

          <div id="global-search" className="flex-1 max-w-[200px] mx-4">
             <GlobalSearch />
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[280px] bg-background border-l shadow-2xl z-[101] p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold flex items-center gap-2">
                   <Zap className="h-5 w-5 fill-primary" />
                   Menu
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-md transition-colors",
                      pathname === item.href
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground",
                      theme === 'pro' && pathname === item.href && "hacker-border shadow-primary/50"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
              </nav>

              <div className="pt-6 border-t">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-3 w-full rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
