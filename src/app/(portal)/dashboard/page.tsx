'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Sidebar } from '@/components/sidebar';
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
  Video
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AICodeReview } from '@/components/code-review';
import { QuizModule } from '@/components/quiz';
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
  agreed_tc: boolean;
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
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasPunchedInToday, setHasPunchedInToday] = useState(false);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);

  const [githubUrl, setGithubUrl] = useState('');
  const [lastSubmittedUrl, setLastSubmittedUrl] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [skippingId, setSkippingId] = useState<string | null>(null);
  const [skipPin, setSkipPin] = useState('');
  const [showReviewFor, setShowReviewFor] = useState<string | null>(null);
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

    const { data: modulesData } = await supabase
      .from('modules')
      .select('index')
      .eq('course_id', profileData.current_course_id)
      .order('index', { ascending: true });

    const moduleIndices = (modulesData || []).map(m => m.index);

    const { data: curriculumData } = await supabase
      .from('curriculum')
      .select('*')
      .in('week', moduleIndices);

    setCurriculum((curriculumData as unknown as CurriculumItem[]) || []);

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
        alert('Failed to submit: ' + error.message);
      } else {
        setLastSubmittedUrl(githubUrl);
        setGithubUrl('');
        setShowReviewFor(curriculumId);
        fetchData();
      }
    } finally {
      setSubmittingId(null);
    }
  };

  const handleSkip = async (itemId: string) => {
    if (skipPin !== '7323') {
      alert('Invalid PIN');
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
      fetchData();
    }
  };

  const sortedCurriculum = [...curriculum].sort((a, b) => {
    if (a.week !== b.week) return a.week - b.week;
    const getOrder = (d: string) => {
      const match = d.match(/Lecture\s+(\d+)/i);
      if (match) return parseInt(match[1]);
      return 0;
    };
    return getOrder(a.day) - getOrder(b.day);
  });

  const nextAvailableItem = sortedCurriculum.find(item => {
    const submission = submissions.find(s => s.curriculum_id === item.id);
    const isCompleted = submission && submission.status !== 'skipped';
    const isSkipped = submission && submission.status === 'skipped';
    const isUnlocked = isItemUnlocked(item, curriculum, submissions, profile?.agreed_tc || false);
    return !isCompleted && !isSkipped && isUnlocked;
  });

  const currentModule = nextAvailableItem?.week || 1;
  const focusContent = nextAvailableItem ? [nextAvailableItem] : [];

  const handleCompleteExtraTask = async (taskId: string) => {
    setCompletingTaskId(taskId);
    await supabase.from('extra_tasks').update({ is_completed: true, completed_at: new Date().toISOString() }).eq('id', taskId);
    fetchData();
    setCompletingTaskId(null);
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <header className="flex justify-between items-end">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Welcome, {profile?.full_name}!</h1>
                {profile?.is_pro && (
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none animate-pulse">
                    <Zap className="h-3 w-3 mr-1 fill-white" /> PRO
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">Module {currentModule} &bull; {new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
            </div>
            <div className="flex gap-4">
              {hasPunchedInToday ? (
                <Badge variant="outline" className="text-green-600 border-green-600 px-4 py-2">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Attendance Marked
                </Badge>
              ) : (
                <Badge variant="outline" className="text-orange-600 border-orange-600 px-4 py-2">
                  <Clock className="mr-2 h-4 w-4" /> Attendance Pending
                </Badge>
              )}
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Overall Progress</CardTitle>
                <div className="text-2xl font-bold">{Math.round((submissions.length / (curriculum.length || 1)) * 100)}%</div>
              </CardHeader>
              <CardContent>
                <Progress value={(submissions.length / (curriculum.length || 1)) * 100} className="h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Lectures Done</CardTitle>
                <div className="text-2xl font-bold">{submissions.length} / {curriculum.length}</div>
              </CardHeader>
              <CardContent>
                <div className="flex -space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`h-6 w-6 rounded-full border-2 border-background ${i < submissions.length ? 'bg-primary' : 'bg-muted'}`} />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Streak</CardTitle>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {profile?.current_streak || 0} Days 🔥
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Consistency is key.</div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-primary uppercase tracking-wider flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Total Points
                </CardTitle>
                <div className="text-2xl font-bold">{profile?.total_points || 0} XP</div>
              </CardHeader>
            </Card>

            {profile?.is_pro && (
              <Card className="border-purple-500/50 bg-purple-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Deep Work
                  </CardTitle>
                  <div className="text-2xl font-bold">{totalFocusMinutes} mins</div>
                </CardHeader>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5" /> Today&apos;s Focus
                </h2>

                {focusContent.length === 0 ? (
                  <Card className="bg-muted/50 border-dashed">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Congratulations! You have completed all available lectures.
                    </CardContent>
                  </Card>
                ) : (
                  focusContent.map((item) => {
                    const submission = submissions.find(s => s.curriculum_id === item.id);
                    const isSubmitted = submission && submission.status !== 'skipped';
                    const isSkipped = submission && submission.status === 'skipped';
                    const isUnlocked = isItemUnlocked(item, curriculum, submissions, profile?.agreed_tc || false);
                    const isFocusUnlocked = (totalFocusMinutes / 60) >= (item.required_focus_hours || 0);

                    return (
                      <Card key={item.id} className={cn(
                        "overflow-hidden transition-all",
                        isUnlocked && "ring-2 ring-primary ring-offset-2",
                        (!isUnlocked || !isFocusUnlocked) && "opacity-50 grayscale"
                      )}>
                        <div className={cn("h-2", item.type === 'lecture' ? "bg-purple-500" : "bg-blue-500")} />
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <Badge variant="outline" className="mb-2 flex items-center gap-1">
                              {item.type === 'lecture' && <Video className="h-3 w-3" />}
                              {item.type.replace('_', ' ')}
                            </Badge>
                            {isSubmitted && <Badge className="bg-green-600">Completed</Badge>}
                            {isSkipped && <Badge className="bg-orange-500">Skipped</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            <CardTitle>{item.title}</CardTitle>
                            {(!isUnlocked || !isFocusUnlocked) && <Lock className="h-4 w-4 text-destructive" />}
                          </div>
                          <CardDescription>{item.description}</CardDescription>
                        </CardHeader>

                        {!isSubmitted && !isSkipped && isUnlocked && isFocusUnlocked && (
                          <CardFooter className="flex flex-col gap-4 border-t bg-muted/20 p-6">
                              <div className="w-full space-y-4">
                                {item.type === 'quiz' ? (
                                  <Button className="w-full" onClick={() => setActiveQuiz(item)}>
                                    Start Weekly Quiz <ArrowRight className="ml-2 h-4 w-4" />
                                  </Button>
                                ) : item.type === 'lecture' ? (
                                  <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                                    <Link href={`/lecture/${item.id}`}>
                                      Open Lecture Room <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                  </Button>
                                ) : (
                                  <div className="w-full space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="github">Submit GitHub URL</Label>
                                      <div className="flex gap-2">
                                        <div className="relative flex-1">
                                          <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                          <Input
                                            id="github" className="pl-9" placeholder="https://github.com/..."
                                            value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)}
                                          />
                                        </div>
                                        <Button
                                          onClick={() => handleSubmitAssignment(item.id)}
                                          disabled={!githubUrl.includes('github.com') || !!submittingId}
                                        >
                                          {submittingId ? '...' : <Send className="h-4 w-4" />}
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="pt-2 border-t mt-4">
                                      <Dialog open={skippingId === item.id} onOpenChange={(open) => !open && setSkippingId(null)}>
                                        <DialogTrigger asChild>
                                          <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => setSkippingId(item.id)}>
                                            Skip this Lecture
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader><DialogTitle>Skip Lecture</DialogTitle></DialogHeader>
                                          <div className="py-4">
                                            <Label htmlFor="skip-pin-dash">Enter Skip PIN</Label>
                                            <Input id="skip-pin-dash" type="password" placeholder="Enter PIN to skip" value={skipPin} onChange={(e) => setSkipPin(e.target.value)} />
                                          </div>
                                          <DialogFooter>
                                            <Button onClick={() => handleSkip(item.id)} disabled={!skipPin}>Confirm Skip</Button>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>
                                    </div>
                                  </div>
                                )}
                              </div>
                          </CardFooter>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>

              <div className="space-y-6">
                 {extraTasks.length > 0 && (
                   <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-orange-800 dark:text-orange-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> Active Penalties ({extraTasks.filter(t => !t.is_completed).length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {extraTasks.map(task => (
                        <div key={task.id} className={cn("p-3 rounded-md text-xs border", task.is_completed ? "bg-green-100/50" : "bg-white/50")}>
                          <p className="mb-3">{task.description}</p>
                          {!task.is_completed && (
                            <Button size="sm" variant="outline" className="h-7 text-[10px] w-full" onClick={() => handleCompleteExtraTask(task.id)} disabled={!!completingTaskId}>
                              {completingTaskId === task.id ? 'Processing...' : 'Mark as Completed'}
                            </Button>
                          )}
                        </div>
                      ))}
                    </CardContent>
                   </Card>
                 )}

                 <Card>
                   <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Clock className="h-4 w-4" /> Recent Attendance</CardTitle></CardHeader>
                   <CardContent>
                     {recentAttendance.length === 0 ? <p className="text-xs text-muted-foreground italic">No attendance records.</p> : (
                       <div className="space-y-2">
                         {recentAttendance.map((record) => (
                           <div key={record.id} className="flex justify-between items-center text-xs p-2 rounded bg-muted/50">
                             <span>{new Date(record.date).toLocaleDateString()}</span>
                             <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">PRESENT</Badge>
                           </div>
                         ))}
                       </div>
                     )}
                   </CardContent>
                 </Card>
              </div>
            </div>
        </div>
      </main>

      {activeQuiz && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                     feedback: `Quiz score: ${score}`
                   }, { onConflict: 'student_id,curriculum_id' });
                   fetchData();
                 }
                 setTimeout(() => setActiveQuiz(null), 3000);
               }}
             />
             <Button variant="ghost" className="mt-4" onClick={() => setActiveQuiz(null)}>Cancel Quiz</Button>
          </div>
        </div>
      )}
    </div>
  );
}
