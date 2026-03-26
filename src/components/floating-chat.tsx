'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, User, Phone, Video, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { VideoCallRoom } from '@/components/video-call-room';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast-provider';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface VideoSession {
  id: string;
  student_id: string;
  scheduled_at: string;
  status: 'requested' | 'approved' | 'rejected' | 'completed' | 'missed';
  is_ringing: boolean;
}

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'chat' | 'video'>('chat');
  const [videoSessions, setVideoSessions] = useState<VideoSession[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isRequestingCall, setIsRequestingCall] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { success, error: toastError } = useToast();

  const fetchVideoSessions = async (uid: string) => {
    const { data } = await supabase
      .from('video_sessions')
      .select('*')
      .eq('student_id', uid)
      .order('scheduled_at', { ascending: false });
    if (data) setVideoSessions(data as VideoSession[]);
  };

  useEffect(() => {
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      fetchVideoSessions(user.id);

      // Find an admin to chat with (for simplicity, we pick the first admin found)
      const { data: adminData } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (adminData) setAdminId(adminData.id);

      // Fetch messages
      if (adminData) {
        const { data: msgs } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${adminData.id}),and(sender_id.eq.${adminData.id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (msgs) {
          setMessages(msgs);
          setUnreadCount(msgs.filter(m => m.receiver_id === user.id && !m.is_read).length);
        }

        // Subscription
        const channel = supabase
          .channel('realtime_chat')
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `receiver_id=eq.${user.id}`
          }, (payload) => {
            const msg = payload.new as Message;
            setMessages(prev => [...prev, msg]);
            if (!isOpen) setUnreadCount(prev => prev + 1);
          })
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `sender_id=eq.${user.id}`
          }, (payload) => {
             const msg = payload.new as Message;
             setMessages(prev => {
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
             });
          })
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'video_sessions',
            filter: `student_id=eq.${user.id}`
          }, () => {
            fetchVideoSessions(user.id);
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    };

    setup();
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    if (!adminId) {
      toastError('No admin available to receive your message.');
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: userId,
          receiver_id: adminId,
          content: newMessage.trim()
        });

      if (error) {
        toastError('Failed to send message: ' + error.message);
      } else {
        // Also create a persistent notification for the admin
        await supabase.from('notifications').insert({
          student_id: adminId,
          title: 'New Message',
          message: `You received a new message from a student.`,
          type: 'info'
        });
        setNewMessage('');
      }
    } catch (err: any) {
      toastError('An unexpected error occurred while sending: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const markAsRead = async () => {
    if (!userId || !adminId) return;
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('receiver_id', userId)
      .eq('sender_id', adminId);
    setUnreadCount(0);
  };

  const toggleChat = () => {
    if (!isOpen) markAsRead();
    setIsOpen(!isOpen);
  };

  const requestVideoCall = async () => {
     if (!scheduledAt || !userId) return;
     setIsRequestingCall(true);
     try {
       const endAt = new Date(new Date(scheduledAt).getTime() + 60 * 60 * 1000).toISOString();
       const { error } = await supabase.from('video_sessions').insert({
          student_id: userId,
          scheduled_at: scheduledAt,
          end_at: endAt,
          status: 'requested'
       });

       if (error) toastError('Failed to request video call: ' + error.message);
       else {
          success('Video call requested!');
          setScheduledAt('');
          fetchVideoSessions(userId);
       }
     } catch (err: any) {
       toastError('An unexpected error occurred while requesting: ' + err.message);
     } finally {
       setIsRequestingCall(false);
     }
  };

  const isCallActive = (session: VideoSession) => {
     const now = new Date();
     const start = new Date(session.scheduled_at);
     const end = session.scheduled_at ? new Date(new Date(session.scheduled_at).getTime() + 60 * 60 * 1000) : null;
     return session.status === 'approved' && now >= start && end && now <= end;
  };

  const handleStartCall = async (session: VideoSession) => {
     await supabase.from('video_sessions').update({ is_ringing: true }).eq('id', session.id);
     setActiveSessionId(session.id);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {activeSessionId && userId && (
         <VideoCallRoom
           sessionId={activeSessionId}
           userId={userId}
           onClose={() => setActiveSessionId(null)}
         />
      )}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4"
          >
            <Card className="w-80 md:w-96 shadow-2xl border-primary/20 overflow-hidden flex flex-col h-[500px]">
              <CardHeader className="p-4 bg-primary text-primary-foreground flex flex-row justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                   <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                      <User className="h-4 w-4" />
                   </div>
                   <div>
                      <CardTitle className="text-sm font-bold">Admin Support</CardTitle>
                      <p className="text-[10px] opacity-80 font-medium">Real-time Assistance</p>
                   </div>
                </div>
                <div className="flex gap-1">
                   <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={() => setActiveTab(activeTab === 'chat' ? 'video' : 'chat')}
                   >
                     {activeTab === 'chat' ? <Video className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                   </Button>
                   <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={toggleChat}
                   >
                     <X className="h-4 w-4" />
                   </Button>
                </div>
              </CardHeader>

              {activeTab === 'chat' ? (
                <>
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" ref={scrollRef}>
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
                         <MessageCircle className="h-12 w-12 mb-2" />
                         <p className="text-xs font-bold uppercase tracking-widest">Start a conversation</p>
                         <p className="text-[10px] max-w-[150px] mt-1 italic">Ask anything about your curriculum or assignments.</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex flex-col max-w-[80%]",
                            msg.sender_id === userId ? "ml-auto items-end" : "items-start"
                          )}
                        >
                          <div
                            className={cn(
                              "p-3 rounded-2xl text-xs font-medium shadow-sm",
                              msg.sender_id === userId
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : "bg-muted text-foreground rounded-tl-none border"
                            )}
                          >
                            {msg.content}
                          </div>
                          <span className="text-[9px] text-muted-foreground mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </CardContent>
                  <CardFooter className="p-3 border-t bg-muted/30 shrink-0">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                      }}
                      className="flex w-full gap-2"
                    >
                      <Input
                        placeholder="Type a message..."
                        className="h-9 text-xs focus-visible:ring-primary"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                      <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={isSending}>
                        <Send className={cn("h-4 w-4", isSending && "animate-pulse")} />
                      </Button>
                    </form>
                  </CardFooter>
                </>
              ) : (
                <CardContent className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                   <Calendar className="h-12 w-12 text-primary/40 mb-4" />
                   <h3 className="font-bold mb-2">Schedule Video Call</h3>
                   <p className="text-xs text-muted-foreground mb-6">
                     Need face-to-face help? Request a 1-on-1 video session with an instructor.
                   </p>

                   <div className="w-full space-y-3">
                      <Input
                        type="datetime-local"
                        className="text-xs"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                      />
                      <Button
                        className="w-full text-xs font-bold uppercase tracking-widest"
                        onClick={requestVideoCall}
                        disabled={!scheduledAt || isRequestingCall}
                      >
                         {isRequestingCall ? 'Requesting...' : 'Request Approval'}
                      </Button>
                   </div>

                   <div className="mt-8 w-full overflow-hidden">
                      <div className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground mb-2 text-left">Your Sessions</div>
                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                         {videoSessions.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground italic py-4">No sessions scheduled.</p>
                         ) : videoSessions.map(session => (
                            <div key={session.id} className="p-3 rounded-lg border text-left bg-muted/20">
                               <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-bold">{new Date(session.scheduled_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                  <span className={cn(
                                     "text-[8px] font-black uppercase px-1.5 py-0.5 rounded",
                                     session.status === 'approved' ? "bg-emerald-500/10 text-emerald-600" :
                                     session.status === 'rejected' ? "bg-red-500/10 text-red-600" :
                                     "bg-amber-500/10 text-amber-600"
                                  )}>{session.status}</span>
                               </div>
                               {isCallActive(session) && (
                                  <Button
                                    size="sm"
                                    className="w-full mt-2 h-7 text-[9px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 animate-pulse"
                                    onClick={() => handleStartCall(session)}
                                  >
                                     <Phone className="h-3 w-3 mr-2" /> Start Call
                                  </Button>
                               )}
                            </div>
                         ))}
                      </div>
                   </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 relative",
          isOpen ? "bg-background text-foreground border-2 border-primary rotate-0" : "bg-primary text-primary-foreground hover:scale-110 active:scale-95"
        )}
        onClick={toggleChat}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-6 w-6 rounded-full flex items-center justify-center border-2 border-background animate-bounce">
            {unreadCount}
          </span>
        )}
      </Button>
    </div>
  );
}
