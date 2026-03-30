'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Info, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'achievement';
  read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');

    // Initial fetch
    fetchNotifications();

    // Setup Realtime Subscription
    const channel = supabase
      .channel('student_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
         fetchNotifications();
         audioRef.current?.play().catch(() => {});
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
         fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return;

     const { data } = await supabase
       .from('notifications')
       .select('*')
       .eq('student_id', user.id)
       .order('created_at', { ascending: false })
       .limit(20);

     setNotifications(data || []);
  };

  const markAllRead = async () => {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return;

     await supabase
       .from('notifications')
       .update({ read: true })
       .eq('student_id', user.id);

     fetchNotifications();
  };

  const clearAll = async () => {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return;

     await supabase
       .from('notifications')
       .delete()
       .eq('student_id', user.id);

     setNotifications([]);
     setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-primary/10 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-background animate-pulse" />
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 max-h-[480px] bg-background border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                 <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                   <Bell className="h-3 w-3" /> Notifications
                 </h3>
                 <div className="flex gap-1">
                   <Button variant="ghost" size="icon" className="h-6 w-6" onClick={markAllRead} title="Mark all read"><Check className="h-3 w-3" /></Button>
                   <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={clearAll} title="Clear all"><Trash2 className="h-3 w-3" /></Button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y">
                 {notifications.length === 0 ? (
                   <div className="p-12 text-center text-muted-foreground italic text-xs">
                      No new notifications.
                   </div>
                 ) : (
                   notifications.map(n => (
                     <div
                       key={n.id}
                       className={cn(
                         "p-4 transition-colors hover:bg-muted/50 cursor-default relative",
                         !n.read && "bg-primary/5"
                       )}
                     >
                        {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                        <div className="flex gap-3">
                           <div className={cn(
                             "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                             n.type === 'achievement' ? "bg-amber-500/10 text-amber-600" :
                             n.type === 'success' ? "bg-green-500/10 text-green-600" :
                             "bg-blue-500/10 text-blue-600"
                           )}>
                              {n.type === 'achievement' ? <Sparkles className="h-4 w-4" /> :
                               n.type === 'success' ? <Check className="h-4 w-4" /> :
                               <Info className="h-4 w-4" />}
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-black uppercase tracking-tighter mb-0.5">{n.title}</div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                              <div className="text-[9px] text-slate-400 mt-2 font-medium">
                                 {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                           </div>
                        </div>
                     </div>
                   ))
                 )}
              </div>

              <div className="p-3 border-t bg-muted/10 text-center">
                 <Button variant="link" className="text-[10px] font-bold uppercase tracking-widest text-primary h-auto p-0">View All Updates</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
