'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Wind,
  Coffee,
  Zap,
  Gamepad2,
  Sparkles,
  Quote,
  Moon,
  Play,
  Shuffle,
  Fingerprint,
  Palette,
  Dice5,
  Hash,
  Box,
  Brain,
  Target,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReflexMaster } from '@/components/mini-games/reflex-master';
import { MemorySequence } from '@/components/mini-games/memory-sequence';
import { SpeedTyper } from '@/components/mini-games/speed-typer';
import { GridLogic } from '@/components/mini-games/grid-logic';
import { AimTrainer } from '@/components/mini-games/aim-trainer';
import { MentalMath } from '@/components/mini-games/mental-math';
import { ColorStroop } from '@/components/mini-games/color-stroop';
import { ReactionTime } from '@/components/mini-games/reaction-time';
import { QuickMatch } from '@/components/mini-games/quick-match';
import { TouchPath } from '@/components/mini-games/touch-path';

export default function WellnessPage() {
  const [breathingStatus, setBreathingStatus] = useState<'inhale' | 'hold' | 'exhale' | 'idle'>('idle');
  const [timer, setTimer] = useState(0);
  const [activeMode, setActiveMode] = useState<'relax' | 'game' | 'stories'>('relax');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [stories, setStories] = useState<{ title: string; body: string }[]>([]);

  useEffect(() => {
    const fetchStories = async () => {
       const { getWellnessStoriesAction } = await import('@/app/admin/actions');
       const res = await getWellnessStoriesAction();
       if (res.success && res.data) {
          setStories(res.data as { title: string; body: string }[]);
       }
    };
    fetchStories();
  }, []);

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

  return (
    <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto space-y-8 md:space-y-12 animate-in fade-in duration-1000 w-full overflow-x-hidden">
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
          <div className="space-y-8 py-10">
             {!selectedGame ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { id: 'reflex', name: 'Reflex Master', icon: <Zap className="h-6 w-6" />, desc: 'Speed check' },
                    { id: 'memory', name: 'Memory Sequence', icon: <Brain className="h-6 w-6" />, desc: 'Pattern recall' },
                    { id: 'typer', name: 'Speed Typer', icon: <Quote className="h-6 w-6" />, desc: 'Code typing' },
                    { id: 'grid', name: 'Pattern Matcher', icon: <Hash className="h-6 w-6" />, desc: 'Logic grid' },
                    { id: 'aim', name: 'Precision Aim', icon: <Target className="h-6 w-6" />, desc: 'Target practice' },
                    { id: 'math', name: 'Mental Math', icon: <Dice5 className="h-6 w-6" />, desc: 'Quick calc' },
                    { id: 'stroop', name: 'Stroop Test', icon: <Palette className="h-6 w-6" />, desc: 'Focus check' },
                    { id: 'reaction', name: 'Nerve Test', icon: <Box className="h-6 w-6" />, desc: 'React time' },
                    { id: 'match', name: 'Logic Match', icon: <Shuffle className="h-6 w-6" />, desc: 'Same/Diff' },
                    { id: 'path', name: 'Path Finder', icon: <Fingerprint className="h-6 w-6" />, desc: 'Node tracing' },
                  ].map(game => (
                    <Card key={game.id} className="cursor-pointer hover:border-primary transition-all group p-4 flex flex-col items-center text-center gap-3" onClick={() => setSelectedGame(game.id)}>
                       <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          {game.icon}
                       </div>
                       <div>
                          <div className="font-black text-xs uppercase tracking-tighter">{game.name}</div>
                          <div className="text-[10px] text-muted-foreground">{game.desc}</div>
                       </div>
                    </Card>
                  ))}
               </div>
             ) : (
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <Button variant="ghost" size="sm" onClick={() => setSelectedGame(null)} className="font-bold">
                        <ChevronRight className="h-4 w-4 rotate-180 mr-2" /> Back to Arcade
                     </Button>
                     <Badge variant="outline" className="font-black uppercase tracking-widest">{selectedGame.replace('-', ' ')}</Badge>
                  </div>
                  <div className="max-w-4xl mx-auto">
                     {selectedGame === 'reflex' && <ReflexMaster />}
                     {selectedGame === 'memory' && <MemorySequence />}
                     {selectedGame === 'typer' && <SpeedTyper />}
                     {selectedGame === 'grid' && <GridLogic />}
                     {selectedGame === 'aim' && <AimTrainer />}
                     {selectedGame === 'math' && <MentalMath />}
                     {selectedGame === 'stroop' && <ColorStroop />}
                     {selectedGame === 'reaction' && <ReactionTime />}
                     {selectedGame === 'match' && <QuickMatch />}
                     {selectedGame === 'path' && <TouchPath />}
                  </div>
               </div>
             )}
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
                     <p className="text-muted-foreground font-medium leading-relaxed italic">&quot;{story.body}&quot;</p>
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
    </main>
  );
}
