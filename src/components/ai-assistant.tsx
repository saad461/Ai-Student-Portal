'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Bot, Sparkles, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  lectureTitle: string;
  lectureContent: string;
}

export function AIAssistant({ lectureTitle, lectureContent }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hi! I'm your AI Tutor. Need help understanding "${lectureTitle}"? Ask me anything!` }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage,
          lectureTitle,
          lectureContent,
          history: messages.slice(-5) // Send last 5 messages for context
        })
      });

      const data = await res.json();
      if (data.answer) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Failed to connect to the AI service." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 bg-primary hover:scale-110 transition-all p-0 group"
      >
        <Bot className="h-6 w-6" />
        <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[400px] h-[600px] bg-background border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b bg-primary text-primary-foreground flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4" />
                 </div>
                 <div>
                    <div className="text-sm font-black uppercase tracking-widest">AI Tutor</div>
                    <div className="text-[10px] opacity-70">Powered by Gemini 2.0 Flash</div>
                 </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-white/10 text-white">
                <X className="h-5 w-5" />
              </Button>
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
                <div className="flex gap-3">
                   <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                   </div>
                   <div className="bg-background border p-3 rounded-2xl rounded-tl-none">
                      <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                   </div>
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
