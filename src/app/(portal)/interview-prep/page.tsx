'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MessageCircle,
  Play,
  Zap,
  Star,
  RefreshCw,
  Trophy,
  ArrowRight,
  User,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast-provider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export default function InterviewPrepPage() {
  const { success, error: toastError } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentModule, setCurrentModule] = useState<string>('Introduction');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStudentStatus();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const fetchStudentStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get current progress
    const { data: lastSubmission } = await supabase
      .from('submissions')
      .select('curriculum_id')
      .eq('student_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    if (lastSubmission) {
      const { data: curr } = await supabase
        .from('curriculum')
        .select('module_name')
        .eq('id', lastSubmission.curriculum_id)
        .single();
      if (curr?.module_name) setCurrentModule(curr.module_name);
    }
  };

  const startInterview = async () => {
    setInterviewStarted(true);
    setIsTyping(true);

    const initialMessage = `Hello! I'm your AI Interviewer. I see you're currently working on "${currentModule}". Let's start a mock technical interview to test your knowledge. Ready for your first question?`;

    setMessages([{ role: 'assistant', content: initialMessage }]);
    setIsTyping(false);
  };

  const speak = (text: string) => {
    if (!isVoiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          currentModule
        })
      });

      if (!res.ok) throw new Error("AI Request Failed");

      const data = await res.json();
      if (data.answer) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
        speak(data.answer);
      }
    } catch (err) {
      toastError('Failed to get AI response.');
    } finally {
      setIsTyping(false);
    }
  };

  const endInterview = async () => {
    if (messages.length < 3) {
      setInterviewStarted(false);
      setMessages([]);
      return;
    }

    setIsEnding(true);
    setIsTyping(true);

    try {
      const res = await fetch('/api/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          currentModule,
          isFinal: true
        })
      });

      const data = await res.json();
      if (data.answer) {
        setMessages(prev => [...prev, { role: 'assistant', content: `### INTERVIEW EVALUATION\n\n${data.answer}` }]);
      }
      success("Interview evaluation complete!");
    } catch (err) {
      toastError("Failed to generate evaluation.");
    } finally {
      setIsTyping(false);
      setIsEnding(true);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <header className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 shrink-0">
        <div className="space-y-1">
           <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase flex items-center gap-2">
             <Star className="h-6 w-6 md:h-8 md:w-8 text-amber-500 fill-amber-500" />
             AI INTERVIEW SANDBOX
           </h1>
           <p className="text-xs md:text-sm text-muted-foreground font-bold flex items-center gap-2">
             Targeting Skills: <Badge variant="secondary" className="font-black uppercase text-[10px] md:text-xs">{currentModule}</Badge>
           </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {interviewStarted && !isEnding && (
            <>
            <Button
              variant={isVoiceEnabled ? "default" : "outline"}
              size="icon"
              className="h-12 md:h-14 w-12 md:w-14 rounded-xl md:rounded-2xl"
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              title={isVoiceEnabled ? "Disable Voice" : "Enable Voice"}
            >
              <Mic className={cn("h-5 w-5 md:h-6 md:w-6", isVoiceEnabled && "animate-pulse")} />
            </Button>
            <Button
              variant="destructive"
              className="h-12 md:h-14 flex-1 md:flex-none px-4 md:px-6 font-black uppercase rounded-xl md:rounded-2xl text-xs md:text-sm"
              onClick={endInterview}
            >
              End Interview
            </Button>
            </>
          )}
          {isEnding && (
            <Button
              variant="outline"
              className="h-12 md:h-14 w-full md:w-auto px-6 font-black uppercase rounded-xl md:rounded-2xl text-xs md:text-sm"
              onClick={() => {
                setInterviewStarted(false);
                setIsEnding(false);
                setMessages([]);
              }}
            >
              New Session
            </Button>
          )}
          {!interviewStarted && (
            <Button size="lg" className="h-12 md:h-14 w-full md:w-auto px-6 md:px-8 font-black uppercase tracking-widest rounded-xl md:rounded-2xl shadow-xl hover:scale-105 transition-all text-xs md:text-sm" onClick={startInterview}>
              Start Mock Interview <Play className="h-4 w-4 md:h-5 md:w-5 ml-2 fill-current" />
            </Button>
          )}
        </div>
      </header>

      {!interviewStarted ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 overflow-y-auto pb-8">
          <Card className="bg-primary/5 border-2 border-primary/20 rounded-2xl md:rounded-3xl p-6 flex flex-col items-center text-center">
             <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Mic className="h-6 w-6 md:h-8 md:w-8" />
             </div>
             <h3 className="text-lg md:text-xl font-bold uppercase tracking-tighter">Voice & Chat</h3>
             <p className="text-xs md:text-sm text-muted-foreground mt-2 font-medium">Practice your communication skills through voice or text input.</p>
          </Card>
          <Card className="bg-amber-500/5 border-2 border-amber-500/20 rounded-2xl md:rounded-3xl p-6 flex flex-col items-center text-center">
             <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 mb-4">
                <Zap className="h-6 w-6 md:h-8 md:w-8" />
             </div>
             <h3 className="text-lg md:text-xl font-bold uppercase tracking-tighter">Real-Time Feedback</h3>
             <p className="text-xs md:text-sm text-muted-foreground mt-2 font-medium">Get instant feedback on your technical accuracy and tone.</p>
          </Card>
          <Card className="bg-emerald-500/5 border-2 border-emerald-500/20 rounded-2xl md:rounded-3xl p-6 flex flex-col items-center text-center">
             <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-4">
                <Trophy className="h-6 w-6 md:h-8 md:w-8" />
             </div>
             <h3 className="text-lg md:text-xl font-bold uppercase tracking-tighter">Earn Points</h3>
             <p className="text-xs md:text-sm text-muted-foreground mt-2 font-medium">Complete mock interviews to earn XP and Skill Points.</p>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 md:gap-6 overflow-hidden">
          <div className="flex-1 bg-muted/30 border-2 border-muted rounded-2xl md:rounded-[2rem] overflow-hidden flex flex-col relative shadow-inner">
             <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6">
               {messages.map((m, i) => (
                 <motion.div
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   key={i}
                   className={cn(
                     "flex items-start gap-3 md:gap-4 max-w-[90%] md:max-w-[80%]",
                     m.role === 'user' ? "ml-auto flex-row-reverse" : ""
                   )}
                 >
                    <div className={cn(
                      "h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl shrink-0 flex items-center justify-center shadow-md",
                      m.role === 'assistant' ? "bg-primary text-white" : "bg-muted-foreground text-white"
                    )}>
                       {m.role === 'assistant' ? <Bot className="h-4 w-4 md:h-6 md:w-6" /> : <User className="h-4 w-4 md:h-6 md:w-6" />}
                    </div>
                    <div className={cn(
                      "p-3 md:p-5 rounded-2xl md:rounded-3xl text-xs md:text-sm font-medium leading-relaxed shadow-sm",
                      m.role === 'assistant' ? "bg-background rounded-tl-none border" : "bg-primary text-primary-foreground rounded-tr-none"
                    )}>
                       {m.content}
                    </div>
                 </motion.div>
               ))}
               {isTyping && (
                 <div className="flex items-center gap-2 text-muted-foreground font-bold text-[10px] md:text-xs p-2 md:p-4">
                    <RefreshCw className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                    Interviewer is thinking...
                 </div>
               )}
             </div>

             {!isEnding && (
                <div className="p-4 md:p-6 bg-background/50 backdrop-blur-md border-t">
                  <div className="flex gap-2 md:gap-4">
                    <Input
                      placeholder="Type your response..."
                      className="h-12 md:h-14 rounded-xl md:rounded-2xl border-2 focus:border-primary text-sm md:text-lg px-4 md:px-6"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button onClick={handleSend} size="icon" className="h-12 md:h-14 w-12 md:h-14 shrink-0 rounded-xl md:rounded-2xl shadow-xl shadow-primary/20">
                        <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
                    </Button>
                  </div>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
