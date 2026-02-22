'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Sidebar } from '@/components/sidebar';
import { CurriculumItem, QuizQuestion, MODULES, getSortedCurriculum, isItemUnlocked } from '@/lib/curriculum';
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
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
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AICodeReview } from '@/components/code-review';
import { QuizModule } from '@/components/quiz';
import { PENALTY_TASKS } from '@/lib/penalties';
import confetti from 'canvas-confetti';
import Link from 'next/link';

interface Profile {
  id: string;
  full_name: string;
  enrollment_date: string;
  is_pro: boolean;
  current_streak: number;
  total_points: number;
  last_punch_in: string | null;
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
  const { setTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [extraTasks, setExtraTasks] = useState<ExtraTask[]>([]);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [totalFocusHours, setTotalFocusHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasPunchedInToday, setHasPunchedInToday] = useState(false);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);

  const [githubUrl, setGithubUrl] = useState('');
  const [lastSubmittedUrl, setLastSubmittedUrl] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [showReviewFor, setShowReviewFor] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<CurriculumItem | null>(null);

  const [isUnlocking, setIsUnlocking] = useState<string | null>(null);
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

    setHasPunchedInToday(attendance && attendance.length > 0);

    const { data: allAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', user.id)
      .order('date', { ascending: false })
      .limit(7);

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

    const { data: focusData } = await supabase
      .from('focus_sessions')
      .select('duration_seconds')
      .eq('student_id', user.id);

    if (focusData) {
      const totalSeconds = focusData.reduce((acc, curr) => acc + curr.duration_seconds, 0);
      setTotalFocusMinutes(Math.round(totalSeconds / 60));
      setTotalFocusHours(totalSeconds / 3600);
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
      });

      if (!error) {
        setLastSubmittedUrl(githubUrl);
        setGithubUrl('');
        setShowReviewFor(curriculumId);
        fetchData();
        confetti();
      }
    } finally {
      setSubmittingId(null);
    }
  };

  const getCurrentWeek = () => {
    if (!profile) return 1;
    const start = new Date(profile.enrollment_date);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) + 1;
  };

  const currentWeek = getCurrentWeek();
  const sortedCurriculum = getSortedCurriculum();
  const nextItem = sortedCurriculum.find(item =>
    !submissions.some(s => s.curriculum_id === item.id && (s.status === 'submitted' || s.status === 'reviewed'))
  );

  const currentModule = MODULES.find(m => m.weeks.includes(nextItem?.week || 1));
  const moduleItems = sortedCurriculum.filter(item => currentModule?.weeks.includes(item.week));
  const moduleCompletedCount = moduleItems.filter(item =>
    submissions.some(s => s.curriculum_id === item.id && (s.status === 'submitted' || s.status === 'reviewed'))
  ).length;
  const moduleProgress = moduleItems.length > 0 ? (moduleCompletedCount / moduleItems.length) * 100 : 0;

  const handleCompleteExtraTask = async (taskId: string) => {
    setCompletingTaskId(taskId);
    await supabase.from('extra_tasks').update({ is_completed: true }).eq('id', taskId);
    fetchData();
    setCompletingTaskId(null);
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background text-primary">
      <Zap className="h-12 w-12 animate-pulse" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black uppercase tracking-tighter italic">
                  Level <span className="text-primary">{currentWeek}</span>
                </h1>
                {profile?.is_pro && (
                  <Badge className="bg-primary text-primary-foreground font-black italic">
                    PRO MODE
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground font-medium">{profile?.full_name} &bull; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="flex gap-3">
              <Badge variant="outline" className={cn(
                "px-4 py-2 font-bold uppercase tracking-widest border-2",
                hasPunchedInToday ? "text-green-500 border-green-500/20 bg-green-500/5" : "text-orange-500 border-orange-500/20 bg-orange-500/5"
              )}>
                {hasPunchedInToday ? 'Unit Active' : 'Check-in Required'}
              </Badge>
            </div>
          </header>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Course Completion</CardTitle>
                <div className="text-2xl font-black">{Math.round((submissions.length / sortedCurriculum.length) * 100)}%</div>
              </CardHeader>
              <CardContent>
                <Progress value={(submissions.length / sortedCurriculum.length) * 100} className="h-2" />
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Streak</CardTitle>
                <div className="text-2xl font-black flex items-center gap-2">
                  {profile?.current_streak || 0} <span className="text-orange-500">🔥</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Consistency is power.</p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total XP</CardTitle>
                <div className="text-2xl font-black text-primary">{profile?.total_points || 0}</div>
              </CardHeader>
              <CardContent>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Engineering rank rising.</p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Deep Work</CardTitle>
                <div className="text-2xl font-black">{Math.floor(totalFocusHours)}h {Math.round((totalFocusHours % 1) * 60)}m</div>
              </CardHeader>
              <CardContent>
                <Progress value={Math.min(100, (totalFocusHours / 100) * 100)} className="h-2 bg-purple-100" />
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Module Progress Card */}
              <Card className="bg-primary text-primary-foreground overflow-hidden relative border-none shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Trophy className="h-32 w-32" />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="outline" className="text-primary-foreground border-primary-foreground/30 mb-2 uppercase tracking-widest font-bold bg-white/10">
                        {currentModule?.title || 'Next Phase'}
                      </Badge>
                      <CardTitle className="text-4xl font-black uppercase tracking-tight">Module {currentModule?.id}</CardTitle>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black">{Math.round(moduleProgress)}%</div>
                      <div className="text-[10px] opacity-70 uppercase font-bold tracking-widest">Mastered</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={moduleProgress} className="bg-white/20 h-3" />
                </CardContent>
                <CardFooter className="bg-black/10 text-[10px] font-bold uppercase tracking-widest">
                   {moduleCompletedCount} of {moduleItems.length} modules components completed
                </CardFooter>
              </Card>

              <h2 className="text-2xl font-black flex items-center gap-2 uppercase tracking-tighter italic">
                <Zap className="h-6 w-6 text-primary fill-primary" />
                Next Target
              </h2>

              {!nextItem ? (
                <Card className="bg-green-500/10 border-green-500/20 p-12 text-center border-2 border-dashed">
                  <Trophy className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-black uppercase">Legend Status Achieved</h3>
                  <p className="text-muted-foreground">You have completed the entire engineering curriculum.</p>
                </Card>
              ) : (
                <Card className={cn(
                  "transition-all border-2 shadow-xl overflow-hidden",
                  isItemUnlocked(nextItem.id, submissions, totalFocusHours, currentWeek) ? "border-primary/20" : "opacity-60 grayscale bg-muted/20"
                )}>
                  <div className="h-2 w-full bg-primary/20">
                     <div className="h-full bg-primary" style={{ width: `${(1 / moduleItems.length) * 100}%` }} />
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="uppercase text-[10px] font-black">Week {nextItem.week}</Badge>
                        <Badge variant="outline" className="uppercase text-[10px] font-black">{nextItem.type}</Badge>
                        {!isItemUnlocked(nextItem.id, submissions, totalFocusHours, currentWeek) && <Lock className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-black uppercase tracking-tight">{nextItem.title}</CardTitle>
                    <CardDescription className="text-md">{nextItem.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(nextItem.requirements || nextItem.attached_assignment?.requirements) && (
                      <div className="space-y-3 mb-6 bg-muted/50 p-4 rounded-xl border border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Core Objectives:</p>
                        <ul className="text-xs space-y-2">
                          {(nextItem.requirements || nextItem.attached_assignment?.requirements)?.map((r, i) => (
                            <li key={i} className="flex items-center gap-2 font-medium">
                              <CheckCircle2 className="h-3 w-3 text-primary" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {!isItemUnlocked(nextItem.id, submissions, totalFocusHours, currentWeek) && nextItem.required_focus_hours && (
                      <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-200 text-sm text-amber-700 flex items-center gap-3">
                         <div className="bg-amber-100 p-2 rounded-lg">
                           <Clock className="h-5 w-5" />
                         </div>
                         <div>
                           <p className="font-bold uppercase text-[10px]">Focus Lock Active</p>
                           <p>Requires {nextItem.required_focus_hours}h focus. Current: {Math.round(totalFocusHours * 10) / 10}h.</p>
                         </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-muted/30 pt-6">
                    {isItemUnlocked(nextItem.id, submissions, totalFocusHours, currentWeek) ? (
                       <div className="w-full">
                         {nextItem.type === 'quiz' ? (
                            <Button className="w-full h-14 text-lg font-black uppercase tracking-[0.1em] shadow-lg shadow-primary/20" onClick={() => setActiveQuiz(nextItem)}>
                               Launch Knowledge Check
                            </Button>
                         ) : nextItem.type === 'lecture' ? (
                            <Button asChild className="w-full h-14 text-lg font-black uppercase tracking-[0.1em] bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200">
                               <Link href={`/lecture/${nextItem.id}`}>
                                  Enter Lecture Room <ArrowRight className="ml-2 h-5 w-5" />
                               </Link>
                            </Button>
                         ) : (
                            <div className="space-y-4 w-full">
                               <div className="space-y-2">
                                  <Label htmlFor="gh-dash" className="text-[10px] font-black uppercase tracking-widest">Submit GitHub Work</Label>
                                  <div className="flex gap-2">
                                     <div className="relative flex-1">
                                        <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                          id="gh-dash"
                                          className="pl-10 h-12 border-2 focus-visible:ring-primary"
                                          placeholder="https://github.com/..."
                                          value={githubUrl}
                                          onChange={(e) => setGithubUrl(e.target.value)}
                                        />
                                     </div>
                                     <Button
                                       className="h-12 px-6"
                                       onClick={() => handleSubmitAssignment(nextItem.id)}
                                       disabled={!githubUrl.includes('github.com') || !!submittingId}
                                     >
                                       {submittingId ? '...' : <Send className="h-5 w-5" />}
                                     </Button>
                                  </div>
                               </div>
                            </div>
                         )}
                       </div>
                    ) : (
                       <Button disabled className="w-full h-14 grayscale opacity-50 font-black uppercase">
                          Task Sequential Lock
                       </Button>
                    )}
                  </CardFooter>
                </Card>
              )}

              {showReviewFor && (
                <AICodeReview
                  githubUrl={lastSubmittedUrl}
                  assignmentTitle={sortedCurriculum.find(i => i.id === showReviewFor)?.title}
                  assignmentDescription={sortedCurriculum.find(i => i.id === showReviewFor)?.description}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
               <Card className="border-2">
                 <CardHeader>
                   <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                     <AlertCircle className="h-4 w-4 text-primary" />
                     Action Center
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   {extraTasks.length > 0 ? (
                     extraTasks.map(task => (
                       <div key={task.id} className={cn(
                         "p-3 rounded-xl border-2 text-xs",
                         task.is_completed ? "bg-green-50 border-green-100 text-green-700" : "bg-orange-50 border-orange-100 text-orange-800"
                       )}>
                         <p className="font-bold mb-2">{task.is_completed ? 'RESOLVED' : 'ACTIVE PENALTY'}</p>
                         <p className="mb-3 opacity-80">{task.description}</p>
                         {!task.is_completed && (
                           <Button size="sm" variant="outline" className="w-full h-8 text-[10px] font-bold uppercase border-orange-200" onClick={() => handleCompleteExtraTask(task.id)} disabled={!!completingTaskId}>
                              Complete Penalty
                           </Button>
                         )}
                       </div>
                     ))
                   ) : (
                     <div className="text-center py-4">
                       <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                       <p className="text-xs font-bold text-muted-foreground">Account in perfect standing.</p>
                     </div>
                   )}
                 </CardContent>
               </Card>

               <Card className="border-2 overflow-hidden">
                 <CardHeader className="bg-muted/30">
                   <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                     <Clock className="h-4 w-4" />
                     Attendance
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="p-0">
                    {recentAttendance.map((record, i) => (
                      <div key={record.id} className={cn(
                        "flex justify-between items-center p-4 text-xs font-bold",
                        i !== recentAttendance.length - 1 && "border-b"
                      )}>
                        <span className="text-muted-foreground">{new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/10">PRESENT</Badge>
                      </div>
                    ))}
                 </CardContent>
               </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Quiz Overlay */}
      {activeQuiz && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
             <QuizModule
               questions={activeQuiz.content as unknown as QuizQuestion[]}
               onComplete={async (score) => {
                 const { data: { user } } = await supabase.auth.getUser();
                 if (user) {
                   await supabase.from('submissions').upsert({
                     student_id: user.id,
                     curriculum_id: activeQuiz.id,
                     status: 'submitted',
                     feedback: `Quiz completed with score: ${score}`
                   });
                   fetchData();
                   confetti();
                 }
                 setTimeout(() => setActiveQuiz(null), 3000);
               }}
             />
          </div>
        </div>
      )}
    </div>
  );
}
