/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, User, Phone, Video, Calendar, Check, CheckCheck, Paperclip, ImageIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { VideoCallRoom } from '@/components/video-call-room';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast-provider';
import { useChat } from '@/components/chat-context';
import { sendAutoResponseAction } from '@/app/admin/actions';

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
  const { isSupportOpen: isOpen, toggleSupport: toggleChat } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string>('00000000-0000-0000-0000-000000000000');
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'chat' | 'video'>('chat');
  const [videoSessions, setVideoSessions] = useState<VideoSession[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isRequestingCall, setIsRequestingCall] = useState(false);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [adminPresence, setAdminPresence] = useState<{ online: boolean; last_seen?: string }>({ online: false });
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const chatChannelRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { success, error: toastError } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
     audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
  }, []);

  const fetchVideoSessions = async (uid: string) => {
    const { data } = await supabase
      .from('video_sessions')
      .select('*')
      .eq('student_id', uid)
      .order('scheduled_at', { ascending: false });
    if (data) setVideoSessions(data as VideoSession[]);
  };

  const formatTimeAgo = (date: string | null | undefined) => {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return past.toLocaleDateString();
  };

  useEffect(() => {
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      fetchVideoSessions(user.id);

      // Use the dedicated System Support profile for all student chats
      const systemAdminId = '00000000-0000-0000-0000-000000000000';
      setAdminId(systemAdminId);

      // Fetch Admin Profile for last_seen
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', systemAdminId).single();
      if (profile) setAdminProfile(profile);

      setIsLoadingAdmin(false);

      if (user.id) {
        // Fetch messages
        const { data: msgs } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${systemAdminId}),and(sender_id.eq.${systemAdminId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (msgs) {
          setMessages(msgs);
          setUnreadCount(msgs.filter(m => m.receiver_id === user.id && !m.is_read).length);
        }

        // Subscription
        const channel = supabase
          .channel('support_presence', {
             config: {
                presence: {
                   key: user.id,
                },
             },
          })
          .on('presence', { event: 'sync' }, () => {
             const state = channel.presenceState();

             // Track Admin Presence
             const adminState = state[systemAdminId];
             if (adminState && Array.isArray(adminState)) {
                const latest = adminState[adminState.length - 1] as any;
                setAdminPresence({ online: true, last_seen: latest.last_seen });

                // Check if admin is typing in this student's channel
                if (adminState.some((s: any) => s.isTyping && s.typingTo === user.id)) {
                   setIsAdminTyping(true);
                } else {
                   setIsAdminTyping(false);
                }
             } else {
                setAdminPresence({ online: false });
                setIsAdminTyping(false);
             }
          })
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `receiver_id=eq.${user.id}`
          }, (payload) => {
            const msg = payload.new as Message;
            setMessages(prev => {
               if (prev.find(m => m.id === msg.id)) return prev;
               return [...prev, msg];
            });
            if (!isOpen) {
               setUnreadCount(prev => prev + 1);
               audioRef.current?.play().catch(() => {});
            }
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
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_messages',
            filter: `sender_id=eq.${user.id}`
          }, (payload) => {
             const msg = payload.new as Message;
             setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
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

        chatChannelRef.current = channel;

        // Track our own presence immediately
        channel.subscribe(async (status) => {
           if (status === 'SUBSCRIBED') {
              await channel.track({
                online_at: new Date().toISOString(),
                last_seen: new Date().toISOString()
              });
           }
        });

        setIsLoadingAdmin(false);
        return () => {
          supabase.removeChannel(channel);
        };
      } else {
        setIsLoadingAdmin(false);
      }
    };

    setup();
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isAdminTyping]);

  const handleTyping = (val: string) => {
     setNewMessage(val);
     if (chatChannelRef.current) {
        const timestamp = new Date().toISOString();
        if (val.trim()) {
           chatChannelRef.current.track({
              isTyping: true,
              typingTo: adminId,
              last_seen: timestamp
           });
        } else {
           chatChannelRef.current.track({
              isTyping: false,
              last_seen: timestamp
           });
        }
     }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file || !userId) return;

     setIsUploading(true);
     const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

     try {
        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(fileName, file);

        if (uploadError) {
           toastError('Upload failed: ' + uploadError.message);
           return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(fileName);

        // Send a message with the attachment URL
        sendMessage(publicUrl, file.type.startsWith('image/') ? 'image' : 'file', file.name);
     } catch (err) {
        toastError('Unexpected upload error');
     } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
     }
  };

  const sendMessage = async (customContent?: string, type: 'text' | 'image' | 'file' = 'text', fileName?: string) => {
    const content = customContent || newMessage.trim();
    if (!content || !userId) return;

    // Use default System Support ID if no adminId found
    const targetAdminId = adminId || '00000000-0000-0000-0000-000000000000';

    // Trigger browser notification for Admin if they are not focused
    // Since we can't directly trigger a notification on the admin's machine from the student's client,
    // we rely on the Admin's Postgres subscription which is already implemented in admin/page.tsx.

    // Optimistic Update
    const tempId = Math.random().toString(36).substring(7);
    const optimisticMsg: Message = {
      id: tempId,
      sender_id: userId,
      receiver_id: targetAdminId,
      content,
      created_at: new Date().toISOString(),
      is_read: false
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');

    setIsSending(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: userId,
          receiver_id: targetAdminId,
          content
        })
        .select()
        .single();

      if (error) {
        toastError('Failed to send message: ' + error.message);
        // Rollback optimistic update on error
        setMessages(prev => prev.filter(m => m.id !== tempId));
      } else if (data) {
        // Replace temp message with real one
        setMessages(prev => prev.map(m => m.id === tempId ? (data as Message) : m));

        // Auto-response trigger (if student sends a text message)
        if (type === 'text') {
           setTimeout(async () => {
              await sendAutoResponseAction(userId);
           }, 2000);
        }
      }
    } catch (err) {
      const error = err as Error;
      toastError('An unexpected error occurred while sending: ' + error.message);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const markAsRead = useCallback(async () => {
    if (!userId || !adminId) return;
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('receiver_id', userId)
      .eq('sender_id', adminId);
    setUnreadCount(0);
  }, [userId, adminId]);

  useEffect(() => {
    if (isOpen) markAsRead();
  }, [isOpen, markAsRead]);

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
     } catch (err) {
       const error = err as Error;
       toastError('An unexpected error occurred while requesting: ' + error.message);
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
    <>
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
            className="fixed bottom-24 right-6 z-50"
          >
            <Card className="w-[calc(100vw-3rem)] md:w-96 shadow-2xl border-primary/20 overflow-hidden flex flex-col h-[500px]">
              <CardHeader className="p-4 bg-primary text-primary-foreground flex flex-row justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                   <div className="relative">
                      <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                         <User className="h-4 w-4" />
                      </div>
                      {adminPresence.online && (
                         <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-400 rounded-full border-2 border-primary" />
                      )}
                   </div>
                   <div>
                      <CardTitle className="text-sm font-bold">Admin Support</CardTitle>
                      <p className="text-[10px] opacity-80 font-medium">
                         {adminPresence.online ? (
                            <span className="text-emerald-300 font-bold animate-pulse">Online Now</span>
                         ) : (
                            adminProfile?.last_seen ? `Active ${formatTimeAgo(adminProfile.last_seen)}` : "Real-time Assistance"
                         )}
                      </p>
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
                    onClick={() => toggleChat(false)}
                   >
                     <X className="h-4 w-4" />
                   </Button>
                </div>
              </CardHeader>

              {activeTab === 'chat' ? (
                <>
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" ref={scrollRef}>
                    {isLoadingAdmin ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                         <p className="text-xs font-bold uppercase tracking-widest">Connecting to Support...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
                         <MessageCircle className="h-12 w-12 mb-2" />
                         <p className="text-xs font-bold uppercase tracking-widest">Start a conversation</p>
                         <p className="text-[10px] max-w-[150px] mt-1 italic">Ask anything about your curriculum or assignments.</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((msg) => (
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
                            {msg.content.startsWith('https://') && (msg.content.includes('chat-attachments')) ? (
                               <div className="space-y-2">
                                  {msg.content.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                     <img
                                        src={msg.content}
                                        alt="Attachment"
                                        className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => window.open(msg.content, '_blank')}
                                     />
                                  ) : (
                                     <a
                                        href={msg.content}
                                        target="_blank"
                                        className="flex items-center gap-2 underline decoration-dotted underline-offset-4"
                                     >
                                        <Download className="h-4 w-4" /> Download File
                                     </a>
                                  )}
                               </div>
                            ) : (
                               msg.content
                            )}
                          </div>
                          <div className={cn(
                             "flex items-center gap-1 mt-1 px-1",
                             msg.sender_id === userId ? "justify-end" : "justify-start"
                          )}>
                             <span className="text-[9px] text-muted-foreground">
                               {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                             {msg.sender_id === userId && (
                                msg.is_read ? (
                                   <CheckCheck className="h-3 w-3 text-sky-400" />
                                ) : (
                                   <Check className="h-3 w-3 text-muted-foreground" />
                                )
                             )}
                          </div>
                        </div>
                      ))}
                      {isAdminTyping && (
                         <div className="flex flex-col max-w-[80%] items-start animate-pulse">
                            <div className="bg-muted text-foreground p-2 rounded-2xl rounded-tl-none border text-[10px] font-bold italic">
                               Admin is typing...
                            </div>
                         </div>
                      )}
                      </>
                    )}
                  </CardContent>
                  <CardFooter className="p-3 border-t bg-muted/30 shrink-0">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                      }}
                      className="flex w-full gap-2 items-center"
                    >
                      <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-primary"
                        disabled={isUploading || isSending}
                        onClick={() => fileInputRef.current?.click()}
                      >
                         {isUploading ? <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Paperclip className="h-4 w-4" />}
                      </Button>
                      <Input
                        placeholder="Type a message..."
                        className="h-9 text-xs focus-visible:ring-primary"
                        value={newMessage}
                        onChange={(e) => handleTyping(e.target.value)}
                        disabled={isUploading}
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
    </>
  );
}
