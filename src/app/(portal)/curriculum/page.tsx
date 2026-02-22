"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar';
import {
  CurriculumItem,
  MODULES,
  getSortedCurriculum,
  isItemUnlocked
} from '@/lib/curriculum';
import {
  CheckCircle2,
  Lock,
  Video,
  BookOpen,
  ArrowRight,
  Trophy,
  Star,
  Zap,
  Layout,
  Code2,
  Database,
  Globe,
  ShieldCheck,
  Flag,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QuizModule } from '@/components/quiz';

interface Submission {
  id: string;
  curriculum_id: string;
  status: string;
}

export default function CurriculumPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [loading, setLoading] = useState(true);

  // Submission State
  const [activeItem, setActiveItem] = useState<CurriculumItem | null>(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      const start = new Date(profile.enrollment_date);
      const now = new Date();
      const diff = now.getTime() - start.getTime();
      setCurrentWeek(Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) + 1);
    }

    const { data: subs } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', user.id);

    setSubmissions((subs as unknown as Submission[]) || []);

    const { data: curriculumData } = await supabase
      .from('curriculum')
      .select('*')
      .order('week', { ascending: true });

    setCurriculum((curriculumData as unknown as CurriculumItem[]) || []);

    const { data: focusData } = await supabase
      .from('focus_sessions')
      .select('duration_seconds')
      .eq('student_id', user.id);

    if (focusData) {
      const totalSeconds = focusData.reduce((acc, curr) => acc + curr.duration_seconds, 0);
      setTotalFocusMinutes(Math.round(totalSeconds / 60));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitAssignment = async () => {
    if (!activeItem) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('submissions').upsert({
        student_id: user.id,
        curriculum_id: activeItem.id,
        github_url: githubUrl || null,
        status: 'submitted'
      });
      setGithubUrl('');
      setActiveItem(null);
      fetchData();
    }
    setSubmitting(false);
  };

  const handleQuizComplete = async (score: number) => {
    if (!activeItem) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('submissions').upsert({
        student_id: user.id,
        curriculum_id: activeItem.id,
        status: 'submitted',
        feedback: `Quiz completed with score: ${score}`
      });
      setTimeout(() => {
        setActiveItem(null);
        fetchData();
      }, 2000);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  const sortedCurriculum = getSortedCurriculum(curriculum);
  const totalFocusHours = totalFocusMinutes / 60;

  // Group curriculum items by module
  const moduleData = MODULES.map(module => {
    const items = sortedCurriculum.filter(item => module.weeks.includes(item.week));
    const completedItems = items.filter(item =>
      submissions.some(s => s.curriculum_id === item.id && (s.status === 'submitted' || s.status === 'reviewed'))
    );
    const progress = items.length > 0 ? (completedItems.length / items.length) * 100 : 0;

    // A module is unlocked if its first item is unlocked
    const isUnlocked = items.length > 0 ? isItemUnlocked(items[0].id, submissions, totalFocusHours, currentWeek, curriculum) : false;

    return {
      ...module,
      items,
      progress,
      isUnlocked,
      isCompleted: progress === 100 && items.length > 0
    };
  });

  const targetModuleId = Math.ceil(currentWeek / 3);

  const getModuleIcon = (id: number) => {
    switch(id) {
      case 1: return <Layout className="h-6 w-6" />;
      case 2: return <Code2 className="h-6 w-6" />;
      case 3: return <Star className="h-6 w-6" />;
      case 4: return <Zap className="h-6 w-6" />;
      case 5: return <Database className="h-6 w-6" />;
      case 6: return <Globe className="h-6 w-6" />;
      case 7: return <ShieldCheck className="h-6 w-6" />;
      case 8: return <Trophy className="h-6 w-6" />;
      default: return <BookOpen className="h-6 w-6" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <header className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase">
              The <span className="text-primary italic">Engineering</span> Path
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Master thematic modules in a strict sequential order. Your journey is unique, but the path to excellence is defined.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
               <Badge variant="secondary" className="px-4 py-1 text-sm bg-primary/10 text-primary border-primary/20">
                  Current Week: {currentWeek}
               </Badge>
               <Badge variant="secondary" className="px-4 py-1 text-sm bg-purple-100 text-purple-700 border-purple-200">
                  Focus Time: {Math.floor(totalFocusHours)}h {Math.round((totalFocusHours % 1) * 60)}m
               </Badge>
            </div>
          </header>

          <div className="relative">
            {/* The Path Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-muted -translate-x-1/2 hidden md:block" />

            <div className="space-y-24 relative">
              {moduleData.map((module, idx) => {
                const isTarget = module.id === targetModuleId;
                const isAhead = module.id > targetModuleId;
                const isBehind = module.id < targetModuleId && !module.isCompleted;

                return (
                  <div key={module.id} className={cn(
                    "relative flex flex-col md:flex-row items-center gap-8",
                    idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  )}>
                    {/* Module Node on Path */}
                    <div className={cn(
                      "absolute left-8 md:left-1/2 w-16 h-16 rounded-full border-4 border-background flex items-center justify-center z-10 -translate-x-1/2 transition-all duration-500",
                      module.isCompleted ? "bg-green-500 text-white" :
                      module.isUnlocked ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.5)]" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {module.isCompleted ? <CheckCircle2 className="h-8 w-8" /> :
                       isTarget ? <Star className="h-8 w-8 animate-pulse" /> :
                       <span>{module.id}</span>}
                    </div>

                    {/* Target Label for Desktop */}
                    {isTarget && (
                      <div className={cn(
                        "absolute left-1/2 -translate-x-1/2 -top-8 hidden md:block whitespace-nowrap",
                        "text-[10px] font-bold uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20"
                      )}>
                        Cohort Target Module
                      </div>
                    )}

                    {/* Module Card */}
                    <div className="w-full md:w-[45%] pl-20 md:pl-0">
                      <Card className={cn(
                        "transition-all duration-300 border-2 overflow-hidden",
                        module.isUnlocked ? "border-primary/20 shadow-xl" : "opacity-60 grayscale border-transparent bg-muted/20"
                      )}>
                        <div className={cn(
                          "h-1.5 w-full",
                          module.isCompleted ? "bg-green-500" : module.isUnlocked ? "bg-primary" : "bg-muted"
                        )} />

                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start mb-2">
                            <div className={cn(
                              "p-3 rounded-xl",
                              module.isUnlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                              {getModuleIcon(module.id)}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {module.isUnlocked ? (
                                <Badge variant="outline" className={cn(
                                  "font-bold uppercase text-[10px]",
                                  module.isCompleted ? "text-green-600 border-green-200 bg-green-50" : "text-primary border-primary/20 bg-primary/5"
                                )}>
                                  {module.isCompleted ? "Mastered" : "In Progress"}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground uppercase text-[10px]">
                                  Locked
                                </Badge>
                              )}
                              {isTarget && !module.isCompleted && (
                                <span className="text-[10px] text-primary font-bold animate-pulse">CURRENT PHASE</span>
                              )}
                            </div>
                          </div>
                          <CardTitle className="text-2xl font-black">{module.title}</CardTitle>
                          <CardDescription className="text-sm line-clamp-2">{module.description}</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                              <span className="text-muted-foreground">Module Progress</span>
                              <span className="text-primary">{Math.round(module.progress)}%</span>
                            </div>
                            <Progress value={module.progress} className="h-1.5" />
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            {module.items.map((item) => {
                              const isSubmitted = submissions.some(s => s.curriculum_id === item.id && (s.status === 'submitted' || s.status === 'reviewed'));
                              const isUnlocked = isItemUnlocked(item.id, submissions, totalFocusHours, currentWeek, curriculum);
                              const isLecture = item.type === 'lecture';

                              return (
                                <div key={item.id} className={cn(
                                  "group flex items-center justify-between p-3 rounded-xl border-2 transition-all",
                                  isSubmitted ? "bg-green-500/5 border-green-500/10" :
                                  isUnlocked ? "bg-background hover:border-primary/50 border-border shadow-sm" :
                                  "bg-muted/30 border-transparent opacity-60"
                                )}>
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                      isSubmitted ? "bg-green-500 text-white" :
                                      isUnlocked ? "bg-primary/10 text-primary" :
                                      "bg-muted text-muted-foreground"
                                    )}>
                                      {isSubmitted ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                      ) : isLecture ? (
                                        <Video className="h-4 w-4" />
                                      ) : (
                                        <Code2 className="h-4 w-4" />
                                      )}
                                    </div>
                                    <div>
                                      <p className={cn(
                                        "text-xs font-bold leading-none mb-1",
                                        !isUnlocked && "text-muted-foreground"
                                      )}>
                                        {item.title}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <Badge className="h-4 text-[8px] uppercase px-1.5" variant="secondary">
                                          {item.type}
                                        </Badge>
                                        {item.required_focus_hours && (
                                          <span className="text-[8px] text-muted-foreground flex items-center gap-1">
                                            <Zap className="h-2 w-2" /> {item.required_focus_hours}h Focus
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {isUnlocked ? (
                                    isLecture ? (
                                      <Button asChild size="sm" className="h-8 rounded-lg font-bold text-[10px] uppercase tracking-wider">
                                        <Link href={`/lecture/${item.id}`}>
                                           {isSubmitted ? "Review" : "Start"}
                                        </Link>
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        className="h-8 rounded-lg font-bold text-[10px] uppercase tracking-wider"
                                        onClick={() => setActiveItem(item)}
                                      >
                                        {isSubmitted ? "Update" : "Start"}
                                      </Button>
                                    )
                                  ) : (
                                    <Lock className="h-4 w-4 text-muted-foreground mr-2" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                );
              })}

              {/* Final Graduation Node */}
              <div className="relative flex flex-col items-center justify-center py-12">
                 <div className={cn(
                   "w-24 h-24 rounded-3xl flex items-center justify-center border-4 border-muted z-10 transition-all duration-700 rotate-45",
                   moduleData.every(m => m.isCompleted) ? "bg-yellow-500 text-white animate-bounce shadow-[0_0_50px_rgba(234,179,8,0.5)] border-yellow-400" : "bg-muted text-muted-foreground"
                 )}>
                    <div className="-rotate-45">
                      <Trophy className="h-10 w-10" />
                    </div>
                 </div>
                 <div className="text-center mt-12 space-y-2">
                    <h3 className="text-3xl font-black uppercase tracking-tighter">Graduation Ceremony</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto">Complete all 8 modules to unlock your final professional certification.</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Submission Modal */}
      <Dialog open={!!activeItem} onOpenChange={(open) => !open && setActiveItem(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{activeItem?.title}</DialogTitle>
            <DialogDescription>{activeItem?.description}</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {activeItem?.type === 'quiz' && activeItem.content && (
              <QuizModule
                questions={activeItem.content as any}
                onComplete={handleQuizComplete}
              />
            )}

            {(activeItem?.type === 'assignment' || activeItem?.type === 'task' || activeItem?.type === 'final_project') && (
              <div className="space-y-4">
                 {(activeItem.requirements || activeItem.attached_assignment?.requirements) && (
                   <div className="bg-muted p-4 rounded-lg">
                      <p className="text-xs font-bold uppercase mb-2">Requirements:</p>
                      <ul className="text-xs space-y-1">
                        {(activeItem.requirements || activeItem.attached_assignment?.requirements)?.map((r, i) => (
                          <li key={i} className="flex items-start gap-2">
                             <div className="h-1 w-1 rounded-full bg-primary mt-1.5" />
                             {r}
                          </li>
                        ))}
                      </ul>
                   </div>
                 )}

                 {(activeItem?.type === 'assignment' || activeItem?.type === 'final_project') && (
                   <div className="space-y-2">
                      <Label htmlFor="gh">GitHub Repository URL</Label>
                      <Input
                        id="gh"
                        placeholder="https://github.com/..."
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                      />
                   </div>
                 )}

                 {activeItem?.type === 'task' && (
                   <p className="text-sm text-muted-foreground italic">
                     Once you have completed this task according to the requirements, click the button below to mark it as done.
                   </p>
                 )}
              </div>
            )}
          </div>

          {activeItem?.type !== 'quiz' && (
            <DialogFooter>
               <Button variant="outline" onClick={() => setActiveItem(null)}>Cancel</Button>
               <Button
                onClick={handleSubmitAssignment}
                disabled={submitting || ((activeItem?.type === 'assignment' || activeItem?.type === 'final_project') && !githubUrl.includes('github.com'))}
               >
                 {submitting ? "Submitting..." : "Complete Task"}
               </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
