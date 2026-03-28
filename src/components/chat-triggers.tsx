'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Bot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useChat } from '@/components/chat-context';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export function ChatTriggers() {
  const { isSupportOpen, isAIOpen, toggleSupport, toggleAI, lectureData } = useChat();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const systemAdminId = '00000000-0000-0000-0000-000000000000';
      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('receiver_id', user.id)
        .eq('sender_id', systemAdminId)
        .eq('is_read', false);

      if (msgs) setUnreadCount(msgs.length);

      const channel = supabase
        .channel('unread_trigger_sync')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${user.id}`
        }, () => {
          if (!isSupportOpen) setUnreadCount(prev => prev + 1);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    fetchUnread();
  }, [isSupportOpen]);

  useEffect(() => {
    if (isSupportOpen) setUnreadCount(0);
  }, [isSupportOpen]);

  const hasAI = !!lectureData;

  // Desktop View
  const DesktopTriggers = (
    <div className="hidden lg:flex flex-col gap-4 fixed bottom-6 right-6 z-50">
      {hasAI && (
        <Button
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 relative",
            isAIOpen ? "bg-background text-foreground border-2 border-primary" : "bg-primary text-primary-foreground hover:scale-110 active:scale-95"
          )}
          onClick={() => toggleAI()}
        >
          {isAIOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
          {!isAIOpen && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          )}
        </Button>
      )}

      <Button
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 relative",
          isSupportOpen ? "bg-background text-foreground border-2 border-primary" : "bg-primary text-primary-foreground hover:scale-110 active:scale-95"
        )}
        onClick={() => toggleSupport()}
      >
        {isSupportOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!isSupportOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-6 w-6 rounded-full flex items-center justify-center border-2 border-background animate-bounce">
            {unreadCount}
          </span>
        )}
      </Button>
    </div>
  );

  // Mobile View
  const MobileTriggers = (
    <div className="lg:hidden fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2 min-w-[180px]"
          >
            {hasAI && (
              <Button
                className="bg-background text-foreground border shadow-xl flex justify-between items-center px-4 h-12 rounded-xl"
                onClick={() => {
                  toggleAI(true);
                  setShowMobileMenu(false);
                }}
              >
                <div className="flex items-center gap-2">
                   <Bot className="h-4 w-4 text-primary" />
                   <span className="text-xs font-bold uppercase tracking-wider">AI Tutor</span>
                </div>
                <div className="h-2 w-2 bg-green-500 rounded-full" />
              </Button>
            )}
            <Button
              className="bg-background text-foreground border shadow-xl flex justify-between items-center px-4 h-12 rounded-xl"
              onClick={() => {
                toggleSupport(true);
                setShowMobileMenu(false);
              }}
            >
              <div className="flex items-center gap-2">
                 <MessageCircle className="h-4 w-4 text-primary" />
                 <span className="text-xs font-bold uppercase tracking-wider">Support</span>
              </div>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[8px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 relative",
          (isSupportOpen || isAIOpen || showMobileMenu) ? "bg-background text-foreground border-2 border-primary" : "bg-primary text-primary-foreground"
        )}
        onClick={() => {
          if (isSupportOpen || isAIOpen) {
            toggleSupport(false);
            toggleAI(false);
          } else if (hasAI) {
            setShowMobileMenu(!showMobileMenu);
          } else {
            toggleSupport(true);
          }
        }}
      >
        {(isSupportOpen || isAIOpen || showMobileMenu) ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!isSupportOpen && !isAIOpen && !showMobileMenu && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-6 w-6 rounded-full flex items-center justify-center border-2 border-background">
            {unreadCount}
          </span>
        )}
      </Button>
    </div>
  );

  return (
    <>
      {DesktopTriggers}
      {MobileTriggers}
    </>
  );
}
