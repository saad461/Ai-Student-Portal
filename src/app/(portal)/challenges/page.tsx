'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Zap,
  Code2,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Flame,
  Brain
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast-provider';
import { CodeCompiler } from '@/components/code-compiler';
import { cn } from '@/lib/utils';

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  initial_code: any;
  difficulty: 'easy' | 'medium' | 'hard';
  points_reward: number;
}

export default function ChallengesPage() {
  const { success, error: toastError } = useToast();
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [completedToday, setCompletedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentCode, setCurrentCode] = useState('');

  useEffect(() => {
    fetchChallenge();
  }, []);

  const fetchChallenge = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const { data: challengeData } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('active_date', today)
      .single();

    if (challengeData) {
      setChallenge(challengeData);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: submission } = await supabase
          .from('challenge_submissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('challenge_id', challengeData.id)
          .single();

        if (submission) setCompletedToday(true);
      }
    }
    setLoading(false);
  };

  const handleSubmit = async (code: string) => {
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !challenge) return;

    try {
      const res = await fetch('/api/verify-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          title: challenge.title,
          description: challenge.description,
          testCases: (challenge as any).test_cases
        })
      });
      const data = await res.json();

      if (data.isCorrect) {
        const { error } = await supabase
          .from('challenge_submissions')
          .insert({
            user_id: user.id,
            challenge_id: challenge.id,
            submitted_code: code,
            is_correct: true
          });

        if (!error) {
          const { rewardStudentAction } = await import('@/app/admin/actions');
          await rewardStudentAction(challenge.points_reward, `Daily Challenge: ${challenge.title}`, 'challenge', challenge.id);
          success(`Challenge Completed! +${challenge.points_reward} XP awarded.`);
          setCompletedToday(true);
        } else {
          toastError('Failed to save submission.');
        }
      } else {
        toastError(data.feedback || "Your solution is incorrect. Check requirements.");
      }
    } catch (err) {
      toastError('Verification service unavailable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Scanning for today's challenge...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
           <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
             <Brain className="h-10 w-10 text-primary" />
             DAILY LOGIC ARENA
           </h1>
           <p className="text-muted-foreground font-bold flex items-center gap-2">
             Sharp your problem-solving skills and earn daily rewards.
           </p>
        </div>

        <div className="flex gap-4">
           <Card className="bg-orange-500/10 border-orange-500/20 px-6 py-3 rounded-2xl flex items-center gap-4">
              <Flame className="h-6 w-6 text-orange-500 fill-orange-500" />
              <div>
                 <div className="text-[10px] font-black uppercase text-orange-600/70 tracking-widest leading-none">Streak</div>
                 <div className="text-xl font-black text-orange-600">5 DAYS</div>
              </div>
           </Card>
           <Card className="bg-primary/10 border-primary/20 px-6 py-3 rounded-2xl flex items-center gap-4">
              <Trophy className="h-6 w-6 text-primary" />
              <div>
                 <div className="text-[10px] font-black uppercase text-primary/70 tracking-widest leading-none">Arena Rank</div>
                 <div className="text-xl font-black">#42</div>
              </div>
           </Card>
        </div>
      </header>

      {!challenge ? (
        <Card className="py-20 text-center border-2 border-dashed rounded-3xl">
           <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
           <h3 className="text-xl font-bold uppercase tracking-tighter">No Challenge for Today</h3>
           <p className="text-muted-foreground font-medium">Rest your brain, or check back later!</p>
        </Card>
      ) : completedToday ? (
        <div className="space-y-8 animate-in zoom-in-95 duration-700">
           <Card className="bg-emerald-500/5 border-2 border-emerald-500/20 rounded-[2.5rem] overflow-hidden">
              <div className="p-12 flex flex-col items-center text-center gap-6">
                 <div className="h-24 w-24 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40">
                    <CheckCircle2 className="h-12 w-12" />
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-4xl font-black tracking-tighter uppercase">Mission Accomplished!</h2>
                    <p className="text-emerald-700/70 font-bold text-lg">You've solved today's logic puzzle: <span className="text-emerald-900">"{challenge.title}"</span></p>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 px-6 py-2 rounded-full font-black">+50 XP</Badge>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 px-6 py-2 rounded-full font-black">+5 Skill Points</Badge>
                 </div>
              </div>
           </Card>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="rounded-3xl border-2">
                 <CardHeader><CardTitle className="uppercase tracking-tighter">Community Stats</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    <div className="flex justify-between items-center font-bold">
                       <span className="text-muted-foreground">Solved by:</span>
                       <span>1,240 Students</span>
                    </div>
                    <div className="flex justify-between items-center font-bold">
                       <span className="text-muted-foreground">Avg. Time:</span>
                       <span>4m 12s</span>
                    </div>
                 </CardContent>
              </Card>
              <Card className="rounded-3xl border-2">
                 <CardHeader><CardTitle className="uppercase tracking-tighter">Next Arena</CardTitle></CardHeader>
                 <CardContent className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Clock className="h-8 w-8 text-primary" />
                       <span className="text-2xl font-black tabular-nums">14:22:10</span>
                    </div>
                    <Button variant="ghost" className="font-bold uppercase tracking-tighter">Set Reminder</Button>
                 </CardContent>
              </Card>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-250px)]">
           <div className="lg:col-span-1 space-y-6 flex flex-col overflow-y-auto">
              <Card className="rounded-3xl border-2 overflow-hidden shrink-0">
                 <CardHeader className="bg-primary/5">
                    <div className="flex justify-between items-center mb-2">
                       <Badge className={cn(
                         "font-black uppercase tracking-widest",
                         challenge.difficulty === 'easy' ? 'bg-green-600' :
                         challenge.difficulty === 'medium' ? 'bg-amber-500' : 'bg-red-600'
                       )}>
                          {challenge.difficulty}
                       </Badge>
                       <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                          <Zap className="h-3 w-3 fill-amber-500 text-amber-500" /> {challenge.points_reward} Points
                       </span>
                    </div>
                    <CardTitle className="text-2xl font-black tracking-tighter uppercase">{challenge.title}</CardTitle>
                 </CardHeader>
                 <CardContent className="p-6">
                    <div className="prose dark:prose-invert prose-sm">
                       <p className="text-muted-foreground font-medium leading-relaxed">{challenge.description}</p>
                    </div>
                 </CardContent>
              </Card>

              <Card className="rounded-3xl border-2 flex-1 p-6 bg-slate-50 dark:bg-slate-900 border-dashed border-slate-200">
                 <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <Code2 className="h-4 w-4" /> Requirements
                 </h4>
                 <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400">
                       <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Function must return a number
                    </li>
                    <li className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400">
                       <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Handle empty arrays
                    </li>
                 </ul>
              </Card>
           </div>

           <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="flex-1 bg-background rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
                 <CodeCompiler
                   initialJs={challenge.initial_code?.js || '// Write your solution here...'}
                   onChange={(codes) => setCurrentCode(codes.js || '')}
                 />
              </div>
              <Button
                size="lg"
                className="h-20 rounded-3xl font-black uppercase text-xl tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                onClick={() => handleSubmit(currentCode || challenge.initial_code?.js || '')}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Evaluating Algorithm...' : 'Submit Solution'}
                {!isSubmitting && <Play className="ml-3 h-6 w-6 fill-current" />}
              </Button>
           </div>
        </div>
      )}
    </div>
  );
}
