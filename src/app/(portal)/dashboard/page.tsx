'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PortalNavbar } from '@/components/portal-navbar';
import { CurriculumItem, QuizQuestion, isItemUnlocked } from '@/lib/curriculum';
import { useTheme } from '@/components/theme-provider';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Github,
  Lock,
  ArrowRight,
  Send,
  BookOpen,
  Zap,
  Video,
  Trophy,
  Flame,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuizModule } from '@/components/quiz';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast-provider';
import { DashboardSkeleton } from '@/components/skeletons';

interface Profile {
  id: string;
  full_name: string;
  enrollment_date: string;
  is_pro: boolean;
  current_streak: number;
  total_points: number;
  last_punch_in: string | null;
  agreed_tc: boolean;
  current_course_id: string;
}

interface Submission {
  id: string;
  curriculum_id: string;
  github_url: string;
  status: string;
}

interface ExtraTask {
  id: string;
  description: string;
  is_completed: boolean;
}

export default function DashboardPage() {
  const { success, error: toastError } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [extraTasks, setExtraTasks] = useState<ExtraTask[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasPunchedInToday, setHasPunchedInToday] = useState(false);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);

  const [githubUrl, setGithubUrl] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [skippingId, setSkippingId] = useState<string | null>(null);
  const [skipPin, setSkipPin] = useState('');
  const [activeQuiz, setActiveQuiz] = useState<CurriculumItem | null>(null);

  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(profileData as unknown as Profile);

    const today = new Date().toLocaleDateString('en-CA');
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', user.id)
      .eq('date', today);

    setHasPunchedInToday(!!(attendance && attendance.length > 0));

    const { data: allAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', user.id)
      .order('date', { ascending: false })
      .limit(5);

    setRecentAttendance(allAttendance || []);

    const { data: subs } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', user.id);

    setSubmissions((subs as unknown as Submission[]) || []);

    const { data: tasks } = await supabase
      .from('extra_tasks')
      .select('*')
      .eq('student_id', user.id);

    setExtraTasks((tasks as unknown as ExtraTask[]) || []);

    if (profileData?.current_course_id) {
      const { data: modulesData } = await supabase
        .from('modules')
        .select('index')
        .eq('course_id', profileData.current_course_id)
        .order('index', { ascending: true });

      const moduleIndices = (modulesData || []).map(m => m.index);

      const { data: curriculumData } = await supabase
        .from('curriculum')
        .select('*')
        .in('week', moduleIndices)
        .order('week', { ascending: true })
        .order('lecture_index', { ascending: true });

      setCurriculum((curriculumData as unknown as CurriculumItem[]) || []);
    }

    const { data: focusData } = await supabase
      .from('focus_sessions')
      .select('duration_seconds')
      .eq('student_id', user.id);

    if (focusData) {
      const totalSeconds = focusData.reduce((acc, curr) => acc + curr.duration_seconds, 0);
      setTotalFocusMinutes(Math.round(totalSeconds / 60));
    }

    if (profileData && !profileData.is_pro && subs && subs.length >= 5) {
      await supabase.from('profiles').update({ is_pro: true }).eq('id', user.id);
      setTheme('pro');
      setProfile(prev => prev ? { ...prev, is_pro: true } : null);
    }

    setLoading(false);
  }, [setTheme]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitAssignment = async (curriculumId: string) => {
    setSubmittingId(curriculumId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('submissions').upsert({
        student_id: user.id,
        curriculum_id: curriculumId,
        github_url: githubUrl,
        status: 'submitted'
      }, { onConflict: 'student_id,curriculum_id' });

      if (error) {
        toastError('Failed to submit', error.message);
      } else {
        success('Assignment submitted successfully!');
        setGithubUrl('');
        fetchData();
      }
    } finally {
      setSubmittingId(null);
    }
  };

  const handleSkip = async (itemId: string) => {
    if (skipPin !== '7323') {
      toastError('Invalid PIN', 'Please enter the correct skip PIN.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('submissions').upsert({
        student_id: user.id,
        curriculum_id: itemId,
        status: 'skipped',
        feedback: 'Skipped by student using PIN'
      }, { onConflict: 'student_id,curriculum_id' });
      setSkippingId(null);
      setSkipPin('');
      success('Lecture skipped successfully');
      fetchData();
    }
  };

  const nextAvailableItem = curriculum.find(item => {
    const submission = submissions.find(s => s.curriculum_id === item.id);
    const isCompleted = submission && (submission.status === 'submitted' || submission.status === 'reviewed');
    const isSkipped = submission && submission.status === 'skipped';
    const isUnlocked = isItemUnlocked(item, curriculum, submissions, profile?.agreed_tc || false);
    return !isCompleted && !isSkipped && isUnlocked;
  });

  const progressPercentage = Math.round((submissions.length / (curriculum.length || 1)) * 100);

  const handleCompleteExtraTask = async (taskId: string) => {
    setCompletingTaskId(taskId);
    await supabase.from('extra_tasks').update({ is_completed: true, completed_at: new Date().toISOString() }).eq('id', taskId);
    fetchData();
    setCompletingTaskId(null);
  };

  if (loading) return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-muted/30">
       <PortalNavbar />
       <main className="flex-1 p-4 md:p-8">
          <DashboardSkeleton />
       </main>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-muted/30">
      <PortalNavbar />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome, {profile?.full_name?.split(' ')[0]}!</h1>
                {profile?.is_pro && (
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none">
                    <Zap className="h-3 w-3 mr-1 fill-white" /> PRO
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="flex items-center gap-3">
              {hasPunchedInToday ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 px-3 py-1 text-xs md:text-sm">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Present Today
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200 px-3 py-1 text-xs md:text-sm">
                  <Clock className="mr-2 h-4 w-4" /> Attendance Pending
                </Badge>
              )}
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden group">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  Overall Progress
                  <Target className="h-4 w-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
                <div className="text-2xl font-black">{progressPercentage}%</div>
              </CardHeader>
              <CardContent>
                <Progress value={progressPercentage} className="h-1.5" />
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  Lectures Done
                  <Trophy className="h-4 w-4 text-yellow-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
                <div className="text-2xl font-black">{submissions.length} <span className="text-sm font-medium text-muted-foreground">/ {curriculum.length}</span></div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-1">
                   {[...Array(8)].map((_, i) => (
                     <div key={i} className={cn("h-1 flex-1 rounded-full", i < (submissions.length % 9) ? "bg-primary" : "bg-muted")} />
                   ))}
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  Consistency
                  <Flame className="h-4 w-4 text-orange-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
                <div className="text-2xl font-black">{profile?.current_streak || 0} <span className="text-sm font-medium text-muted-foreground">Days</span></div>
              </CardHeader>
              <CardContent className="text-[10px] text-muted-foreground">Keep the streak alive!</CardContent>
            </Card>

            <Card className="relative overflow-hidden group bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center justify-between">
                  Experience
                  <Zap className="h-4 w-4 text-primary" />
                </CardTitle>
                <div className="text-2xl font-black text-primary">{profile?.total_points || 0} <span className="text-sm font-medium opacity-70">XP</span></div>
              </CardHeader>
              <CardContent className="text-[10px] text-primary/60">Unlock rewards at 500 XP</CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                   <h2 className="text-xl font-bold flex items-center gap-2">
                     <BookOpen className="h-5 w-5 text-primary" /> Today&apos;s Focus
                   </h2>
                   {nextAvailableItem && (
                     <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-widest">
                       Module {nextAvailableItem.week}
                     </Badge>
                   )}
                </div>

                {!nextAvailableItem ? (
                  <Card className="bg-muted/30 border-dashed border-2 p-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-bold mb-1">Course Fully Completed!</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">You have finished all available lectures. Check back soon for more content.</p>
                  </Card>
                ) : (
                  (() => {
                    const item = nextAvailableItem;
                    const isUnlocked = isItemUnlocked(item, curriculum, submissions, profile?.agreed_tc || false);
                    const isFocusUnlocked = (totalFocusMinutes / 60) >= (item.required_focus_hours || 0);

                    return (
                      <Card key={item.id} className={cn(
                        "overflow-hidden transition-all border-none shadow-xl",
                        (!isUnlocked || !isFocusUnlocked) && "opacity-50 grayscale"
                      )}>
                        <div className={cn("h-1.5", item.type === 'lecture' ? "bg-purple-600" : "bg-blue-600")} />
                        <CardHeader className="pb-4">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="flex items-center gap-1 uppercase text-[10px] font-bold">
                              {item.type === 'lecture' && <Video className="h-3 w-3" />}
                              {item.type.replace('_', ' ')}
                            </Badge>
                            {(!isUnlocked || !isFocusUnlocked) && <Lock className="h-4 w-4 text-destructive" />}
                          </div>
                          <CardTitle className="text-2xl font-black">{item.title}</CardTitle>
                          <CardDescription className="text-sm line-clamp-2 md:line-clamp-none">{item.description}</CardDescription>
                        </CardHeader>

                        {isUnlocked && isFocusUnlocked && (
                          <CardFooter className="flex flex-col gap-4 border-t bg-muted/10 p-6">
                              <div className="w-full space-y-4">
                                {item.type === 'quiz' ? (
                                  <Button className="w-full h-12 text-base font-bold" onClick={() => setActiveQuiz(item)}>
                                    Start Weekly Quiz <ArrowRight className="ml-2 h-5 w-5" />
                                  </Button>
                                ) : item.type === 'lecture' ? (
                                  <Button asChild className="w-full h-12 text-base font-bold bg-purple-600 hover:bg-purple-700">
                                    <Link href={`/lecture/${item.id}`}>
                                      Open Lecture Room <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                  </Button>
                                ) : (
                                  <div className="w-full space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="github" className="text-xs font-bold uppercase text-muted-foreground">Submit GitHub URL</Label>
                                      <div className="flex gap-2">
                                        <div className="relative flex-1">
                                          <Github className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                          <Input
                                            id="github" className="pl-9 h-11" placeholder="https://github.com/..."
                                            value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)}
                                          />
                                        </div>
                                        <Button
                                          className="h-11 px-6"
                                          onClick={() => handleSubmitAssignment(item.id)}
                                          disabled={!githubUrl.includes('github.com') || !!submittingId}
                                        >
                                          {submittingId ? '...' : <Send className="h-4 w-4" />}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="pt-2 border-t mt-4 flex justify-center">
                                  <Dialog open={skippingId === item.id} onOpenChange={(open) => !open && setSkippingId(null)}>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-orange-600 transition-colors" onClick={() => setSkippingId(item.id)}>
                                        Skip this Lecture
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                      <DialogHeader>
                                        <DialogTitle>Skip Lecture</DialogTitle>
                                        <DialogDescription>Entering the skip PIN will mark this lecture as skipped and unlock the next item.</DialogDescription>
                                      </DialogHeader>
                                      <div className="py-6">
                                        <Label htmlFor="skip-pin-dash" className="text-xs font-bold uppercase mb-2 block">Security PIN</Label>
                                        <Input id="skip-pin-dash" type="password" placeholder="••••" className="text-center text-2xl tracking-[0.5em] h-14" value={skipPin} onChange={(e) => setSkipPin(e.target.value)} />
                                      </div>
                                      <DialogFooter>
                                        <Button variant="destructive" className="w-full h-12 font-bold" onClick={() => handleSkip(item.id)} disabled={!skipPin}>Confirm Skip</Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                          </CardFooter>
                        )}
                      </Card>
                    );
                  })()
                )}
              </div>

              <div className="space-y-6">
                 <h2 className="text-xl font-bold flex items-center gap-2">
                   <Clock className="h-5 w-5 text-primary" /> Activity
                 </h2>

                 {extraTasks.filter(t => !t.is_completed).length > 0 && (
                   <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 border-2 overflow-hidden">
                    <div className="bg-red-500 h-1 w-full" />
                    <CardHeader className="pb-2 p-4">
                      <CardTitle className="text-xs font-bold text-red-600 uppercase flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> Required Tasks
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4 pt-0">
                      {extraTasks.filter(t => !t.is_completed).map(task => (
                        <div key={task.id} className="p-3 rounded-lg text-xs bg-white/50 border border-red-100 shadow-sm">
                          <p className="mb-3 font-medium leading-relaxed">{task.description}</p>
                          <Button size="sm" variant="destructive" className="h-8 w-full font-bold text-[10px] uppercase tracking-wider" onClick={() => handleCompleteExtraTask(task.id)} disabled={!!completingTaskId}>
                            {completingTaskId === task.id ? 'Processing...' : 'Mark Done'}
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                   </Card>
                 )}

                 <Card>
                   <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Recent Attendance</CardTitle></CardHeader>
                   <CardContent className="px-3">
                     {recentAttendance.length === 0 ? <p className="text-xs text-muted-foreground italic text-center py-4">No records yet.</p> : (
                       <div className="space-y-1">
                         {recentAttendance.map((record) => (
                           <div key={record.id} className="flex justify-between items-center text-xs p-2 rounded-lg hover:bg-muted transition-colors">
                             <span className="font-medium">{new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                             <Badge variant="secondary" className="text-[9px] font-bold bg-green-500/10 text-green-700 border-none px-2 py-0">PRESENT</Badge>
                           </div>
                         ))}
                       </div>
                     )}
                   </CardContent>
                   <CardFooter className="pt-0 justify-center">
                      <Button asChild variant="link" size="sm" className="text-xs font-bold text-primary">
                        <Link href="/attendance">View Full History</Link>
                      </Button>
                   </CardFooter>
                 </Card>

                 {profile?.is_pro && (
                   <Card className="bg-purple-600 text-white border-none shadow-lg shadow-purple-200 dark:shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 opacity-80">
                           <Zap className="h-3 w-3 fill-white" /> Pro Feature
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                         <div className="text-2xl font-black mb-1">{totalFocusMinutes} <span className="text-sm font-medium opacity-70">mins</span></div>
                         <p className="text-[10px] opacity-80">Deep focus time recorded today.</p>
                      </CardContent>
                      <CardFooter className="pt-0">
                         <Button asChild variant="secondary" size="sm" className="w-full text-[10px] font-black uppercase h-8 bg-white text-purple-600 hover:bg-white/90">
                           <Link href="/timer">Launch Timer</Link>
                         </Button>
                      </CardFooter>
                   </Card>
                 )}
              </div>
            </div>
        </div>
      </main>

      {activeQuiz && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl animate-in zoom-in-95 duration-300">
             <QuizModule
               questions={activeQuiz.content as unknown as QuizQuestion[]}
               onComplete={async (score) => {
                 const { data: { user } } = await supabase.auth.getUser();
                 if (user) {
                   await supabase.from('submissions').upsert({
                     student_id: user.id,
                     curriculum_id: activeQuiz.id,
                     status: 'submitted',
                     feedback: `Quiz score: ${score}`
                   }, { onConflict: 'student_id,curriculum_id' });
                   success('Quiz submitted successfully!');
                   fetchData();
                 }
                 setTimeout(() => setActiveQuiz(null), 2000);
               }}
             />
             <Button variant="ghost" className="mt-4 w-full font-bold" onClick={() => setActiveQuiz(null)}>Cancel Quiz</Button>
          </div>
        </div>
      )}
    </div>
  );
}
