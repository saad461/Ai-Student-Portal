'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Wind,
  Coffee,
  Brain,
  Zap,
  Gamepad2,
  Sparkles,
  RefreshCw,
  Quote,
  Smile,
  Moon,
  Sun,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function WellnessPage() {
  const [breathingStatus, setBreathingStatus] = useState<'inhale' | 'hold' | 'exhale' | 'idle'>('idle');
  const [timer, setTimer] = useState(0);
  const [activeMode, setActiveMode] = useState<'relax' | 'game' | 'stories'>('relax');

  useEffect(() => {
    if (breathingStatus === 'idle') return;

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev >= 4) {
          if (breathingStatus === 'inhale') setBreathingStatus('hold');
          else if (breathingStatus === 'hold') setBreathingStatus('exhale');
          else if (breathingStatus === 'exhale') setBreathingStatus('inhale');
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breathingStatus]);

  const startBreathing = () => {
    setBreathingStatus('inhale');
    setTimer(0);
  };

  const stories = [
    { title: "The Persistent Programmer", body: "Ada spent 48 hours debugging a single semicolon. When she finally found it, she didn't just fix the bug; she optimized the entire algorithm. Persistence is the key to mastery." },
    { title: "The Flow State", body: "Focus is not about doing more; it's about doing one thing with your whole heart. When you lose track of time, you've found your flow." },
    { title: "Rest to Recharge", body: "A rested mind is 10x more productive than a tired one. Taking 15 minutes to breathe is an investment, not a distraction." }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
             <Heart className="h-10 w-10 text-rose-500 fill-rose-500" />
             RECHARGE CENTER
           </h1>
           <p className="text-muted-foreground font-bold flex items-center gap-2">
             Feeling tired? Take a break, recharge your brain, and come back stronger.
           </p>
        </div>
      </header>

      <div className="flex gap-4 border-b pb-4 overflow-x-auto no-scrollbar">
         <Button
           variant={activeMode === 'relax' ? 'default' : 'ghost'}
           className="h-12 rounded-xl font-bold uppercase tracking-tighter"
           onClick={() => setActiveMode('relax')}
         >
            <Wind className="h-4 w-4 mr-2" /> Breathe & Relax
         </Button>
         <Button
           variant={activeMode === 'game' ? 'default' : 'ghost'}
           className="h-12 rounded-xl font-bold uppercase tracking-tighter"
           onClick={() => setActiveMode('game')}
         >
            <Gamepad2 className="h-4 w-4 mr-2" /> Mini-Game
         </Button>
         <Button
           variant={activeMode === 'stories' ? 'default' : 'ghost'}
           className="h-12 rounded-xl font-bold uppercase tracking-tighter"
           onClick={() => setActiveMode('stories')}
         >
            <Sparkles className="h-4 w-4 mr-2" /> Motivation
         </Button>
      </div>

      <div className="min-h-[500px]">
        {activeMode === 'relax' && (
          <div className="flex flex-col items-center justify-center space-y-12 py-10">
             <div className="relative flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: breathingStatus === 'inhale' ? 1.5 : breathingStatus === 'exhale' ? 1 : 1,
                    opacity: breathingStatus === 'idle' ? 0.2 : 1
                  }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                  className="h-64 w-64 rounded-full bg-primary/20 border-4 border-primary shadow-[0_0_100px_rgba(var(--primary),0.3)]"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                   {breathingStatus === 'idle' ? (
                     <Button onClick={startBreathing} size="lg" className="h-20 w-20 rounded-full shadow-2xl">
                        <Play className="h-10 w-10 fill-current" />
                     </Button>
                   ) : (
                     <motion.div
                       key={breathingStatus}
                       initial={{ opacity: 0, scale: 0.8 }}
                       animate={{ opacity: 1, scale: 1 }}
                       className="space-y-2"
                     >
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-primary">{breathingStatus}</h2>
                        <p className="text-xl font-bold opacity-50 tabular-nums">{4 - timer}s</p>
                     </motion.div>
                   )}
                </div>
             </div>

             <div className="max-w-md text-center space-y-4">
                <h3 className="text-2xl font-black tracking-tighter uppercase">Box Breathing</h3>
                <p className="text-muted-foreground font-medium">Follow the circle to regulate your heart rate and clear your mind. Inhale for 4s, Hold for 4s, Exhale for 4s.</p>
                {breathingStatus !== 'idle' && (
                  <Button variant="ghost" className="text-muted-foreground font-bold underline" onClick={() => setBreathingStatus('idle')}>
                    Stop Session
                  </Button>
                )}
             </div>
          </div>
        )}

        {activeMode === 'game' && (
          <div className="flex flex-col items-center justify-center space-y-8 py-10">
             <Card className="w-full max-w-2xl bg-slate-900 border-none shadow-[0_0_50px_rgba(var(--primary),0.2)] rounded-[2.5rem] overflow-hidden">
                <div className="p-12 text-center space-y-8">
                   <div className="h-32 w-32 rounded-3xl bg-primary/20 flex items-center justify-center text-primary mx-auto animate-bounce">
                      <Zap className="h-16 w-16 fill-current" />
                   </div>
                   <div className="space-y-4">
                      <h2 className="text-4xl font-black tracking-tighter uppercase text-white">Reflex Master</h2>
                      <p className="text-slate-400 font-medium">Click the sparks as fast as you can to earn mental clarity points.</p>
                   </div>
                   <Button size="lg" className="h-16 px-12 rounded-2xl font-black text-xl uppercase tracking-widest shadow-xl shadow-primary/20">
                      PLAY NOW
                   </Button>
                </div>
             </Card>
          </div>
        )}

        {activeMode === 'stories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-10">
             {stories.map((story, i) => (
               <Card key={i} className="rounded-3xl border-2 hover:border-primary transition-all group overflow-hidden">
                  <div className="h-2 bg-primary/20 w-full" />
                  <CardHeader>
                     <Quote className="h-8 w-8 text-primary/20 group-hover:text-primary transition-colors mb-2" />
                     <CardTitle className="text-2xl font-black tracking-tighter uppercase">{story.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <p className="text-muted-foreground font-medium leading-relaxed italic">"{story.body}"</p>
                  </CardContent>
               </Card>
             ))}
          </div>
        )}
      </div>

      <footer className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t">
         <Card className="rounded-3xl p-8 bg-blue-500/5 border-blue-500/10 flex items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
               <Coffee className="h-8 w-8" />
            </div>
            <div>
               <h4 className="text-lg font-black uppercase tracking-tighter">Hydration Reminder</h4>
               <p className="text-sm text-muted-foreground font-medium">Did you drink water in the last hour? Your brain needs it.</p>
            </div>
         </Card>
         <Card className="rounded-3xl p-8 bg-amber-500/5 border-amber-500/10 flex items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
               <Moon className="h-8 w-8" />
            </div>
            <div>
               <h4 className="text-lg font-black uppercase tracking-tighter">Sleep Quality</h4>
               <p className="text-sm text-muted-foreground font-medium">Sleep is where you actually learn. Get 7-8 hours tonight.</p>
            </div>
         </Card>
      </footer>
    </div>
  );
}
