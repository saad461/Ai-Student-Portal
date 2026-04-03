'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, Sparkles, User, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { useChat } from '@/components/chat-context';
import { useConfirmation } from '@/components/ui/confirmation-provider';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistant() {
  const { isAIOpen: isOpen, toggleAI: setIsOpen, lectureData } = useChat();
  const { confirm: customConfirm } = useConfirmation();

  const lectureId = lectureData?.id || 'global';
  const lectureTitle = lectureData?.title || 'Course Content';
  const lectureContent = lectureData?.content || '';

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<'cloud' | 'native'>('cloud');
  const [, setTimeSinceLastActivity] = useState(0);
  const [hasNudged, setHasNudged] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize messages from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(`ai_chat_${lectureId}`);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        setMessages([{ role: 'assistant', content: `Hi! I'm your AI Tutor. Need help understanding "${lectureTitle}"? Ask me anything!` }]);
      }
    } else {
      setMessages([{ role: 'assistant', content: `Hi! I'm your AI Tutor. Need help understanding "${lectureTitle}"? Ask me anything!` }]);
    }
  }, [lectureId, lectureTitle]);

  // Persist messages to sessionStorage
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(`ai_chat_${lectureId}`, JSON.stringify(messages));
    }
  }, [messages, lectureId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // AI Nudge Logic: Detect if student is stuck
  useEffect(() => {
    if (isOpen || hasNudged) return;

    const interval = setInterval(() => {
      setTimeSinceLastActivity(prev => {
        if (prev >= 1200) { // 20 minutes (1200 seconds)
          triggerNudge();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, hasNudged]);

  const triggerNudge = () => {
    setHasNudged(true);
    setIsOpen(true);
    const nudgeMessage = {
      role: 'assistant',
      content: "I've noticed you've been on this topic for a while. Need a quick hint or a breakdown to keep moving forward? I'm here to help!"
    };
    setMessages(prev => [...prev, nudgeMessage as Message]);
  };

  useEffect(() => {
    const checkNativeAI = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      if (typeof window !== 'undefined' && win.ai?.assistant) {
        try {
          const capabilities = await win.ai.assistant.capabilities();
          if (capabilities.available === 'readily') {
            setAiProvider('native');
          }
        } catch (e) {
          console.log("Native AI detection failed", e);
        }
      }
    };
    checkNativeAI();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      if (aiProvider === 'native') {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const win = window as any;
          const session = await win.ai.assistant.create({
            systemPrompt: `You are an expert software engineering tutor. Context: ${lectureTitle}. Content: ${lectureContent}`
          });
          const response = await session.prompt(userMessage);
          setMessages(prev => [...prev, { role: 'assistant', content: response }]);
          session.destroy();
        } catch (nativeErr) {
          console.error("Native AI Error, falling back:", nativeErr);
          setAiProvider('cloud');
          await callCloudAI(userMessage);
        }
      } else {
        await callCloudAI(userMessage);
      }
    } catch {
      setError("AI is currently unavailable. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const callCloudAI = async (question: string) => {
    const res = await fetch('/api/ai-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        lectureTitle,
        lectureContent,
        history: messages.slice(-5)
      })
    });

    if (!res.ok) throw new Error("Cloud AI failed");

    const data = await res.json();
    if (data.answer) {
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } else {
      throw new Error("No answer from cloud AI");
    }
  };

  const clearChat = async () => {
    if (await customConfirm("Clear conversation history?")) {
      const initial = { role: 'assistant', content: `Hi! I'm your AI Tutor. Need help understanding "${lectureTitle}"? Ask me anything!` };
      setMessages([initial as Message]);
      sessionStorage.removeItem(`ai_chat_${lectureId}`);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[calc(100vw-3rem)] md:w-[400px] h-[600px] bg-background border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b bg-primary text-primary-foreground flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4" />
                 </div>
                 <div>
                    <div className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                       AI Tutor
                       {aiProvider === 'native' && <Badge className="bg-green-400 text-black border-none text-[8px] h-4 py-0 px-1 font-black">LOCAL</Badge>}
                    </div>
                    <div className="text-[10px] opacity-70">
                       {aiProvider === 'native' ? 'Running locally on your device' : 'Powered by Gemini 2.0 Flash'}
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={clearChat} className="hover:bg-white/10 text-white h-8 w-8" title="Clear Chat">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-white/10 text-white">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                   <div className={cn(
                     "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                     m.role === 'user' ? "bg-primary" : "bg-green-600"
                   )}>
                      {m.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
                   </div>
                   <div className={cn(
                     "max-w-[80%] p-3 rounded-2xl text-sm",
                     m.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-background border rounded-tl-none"
                   )}>
                      {m.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                           <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : m.content}
                   </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 animate-in fade-in duration-300">
                   <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                   </div>
                   <div className="bg-background border p-3 rounded-2xl rounded-tl-none shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                   </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
                   <AlertTriangle className="h-3 w-3" />
                   {error}
                   <Button variant="link" size="sm" className="h-auto p-0 text-xs font-bold" onClick={() => handleSend()}>Retry</Button>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-background">
               <div className="flex gap-2">
                  <Input
                    placeholder="Ask a question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="rounded-full h-10 border-muted"
                  />
                  <Button size="icon" onClick={handleSend} disabled={!input.trim() || loading} className="rounded-full h-10 w-10 shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
