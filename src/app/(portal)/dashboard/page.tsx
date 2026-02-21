'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Sidebar } from '@/components/sidebar';
import { CurriculumItem, QuizQuestion, isDayUnlocked, isDayPassed } from '@/lib/curriculum';
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
  Video
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AICodeReview } from '@/components/code-review';
import { QuizModule } from '@/components/quiz';
import { PENALTY_TASKS } from '@/lib/penalties';
import confetti from 'canvas-confetti';

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
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
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
  const [markingLecture, setMarkingLecture] = useState<string | null>(null);

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

    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    const { data: attendance, error: attError } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', user.id)
      .eq('date', today);

    if (attendance && attendance.length > 0) {
      setHasPunchedInToday(true);
    } else {
      setHasPunchedInToday(false);
    }

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

    const { data: curriculumData } = await supabase
      .from('curriculum')
      .select('*');

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
      await supabase
        .from('profiles')
        .update({ is_pro: true })
        .eq('id', user.id);
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
      if (!user) {
        setSubmittingId(null);
        return;
      }

      const { error } = await supabase.from('submissions').upsert({
        student_id: user.id,
        curriculum_id: curriculumId,
        github_url: githubUrl,
        status: 'submitted'
      });

      if (error) {
        console.error('Submission Error:', error);
        alert('Failed to submit assignment: ' + error.message);
      } else {
        setLastSubmittedUrl(githubUrl);
        setGithubUrl('');
        setShowReviewFor(curriculumId);
        fetchData();
      }
    } catch (err) {
      console.error('Submission Exception:', err);
      alert('An unexpected error occurred during submission.');
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
  const weekContent = curriculum.filter(item => item.week === currentWeek);

  const handleAutomatedUnlock = async (curriculumId: string) => {
    setIsUnlocking(curriculumId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const randomPenalty = PENALTY_TASKS[Math.floor(Math.random() * PENALTY_TASKS.length)];

    const { error } = await supabase.from('extra_tasks').insert({
      student_id: user.id,
      description: `[UNLOCKED: ${curriculumId}] ${randomPenalty.title}: ${randomPenalty.description}`,
      is_completed: false
    });

    if (!error) {
      fetchData();
    }
    setIsUnlocking(null);
  };

  const handleCompleteExtraTask = async (taskId: string) => {
    setCompletingTaskId(taskId);
    const { error } = await supabase
      .from('extra_tasks')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (!error) {
      fetchData();
    }
    setCompletingTaskId(null);
  };

  const handleMarkLectureDone = async (curriculumId: string) => {
    setMarkingLecture(curriculumId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('submissions').upsert({
        student_id: user.id,
        curriculum_id: curriculumId,
        status: 'submitted'
      });

      if (!error) {
        fetchData();
      }
    } finally {
      setMarkingLecture(null);
    }
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

          {/* Header */}
          <header className="flex justify-between items-end">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Welcome, {profile?.full_name}!</h1>
                {profile?.is_pro && (
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none animate-pulse">
                    <Zap className="h-3 w-3 mr-1 fill-white" />
                    PRO
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">Week {currentWeek} &bull; Day {new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
            </div>
            <div className="flex gap-4">
              {hasPunchedInToday ? (
                <Badge variant="outline" className="text-green-600 border-green-600 px-4 py-2">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Attendance Marked
                </Badge>
              ) : (
                <Badge variant="outline" className="text-orange-600 border-orange-600 px-4 py-2">
                  <Clock className="mr-2 h-4 w-4" />
                  Attendance Pending
                </Badge>
              )}
              {profile?.is_pro && (
                <Badge variant="default" className="bg-purple-600 px-4 py-2">PRO MODE ACTIVE</Badge>
              )}
            </div>
          </header>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Overall Progress</CardTitle>
                <div className="text-2xl font-bold">{Math.round((submissions.length / 72) * 100)}%</div>
              </CardHeader>
              <CardContent>
                <Progress value={(submissions.length / 72) * 100} className="h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Assignments Done</CardTitle>
                <div className="text-2xl font-bold">{submissions.length} / 72</div>
              </CardHeader>
              <CardContent>
                <div className="flex -space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`h-6 w-6 rounded-full border-2 border-background ${i < submissions.length ? 'bg-primary' : 'bg-muted'}`} />
                  ))}
                  {submissions.length > 5 && <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px]">+{submissions.length - 5}</div>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Streak</CardTitle>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {profile?.current_streak || 0} Days
                  <span className="text-orange-500 font-bold">🔥</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Keep it up! Consistency is key.</div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-primary uppercase tracking-wider flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Total Points
                </CardTitle>
                <div className="text-2xl font-bold">{profile?.total_points || 0} XP</div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Earn points by punching in and completing tasks.</div>
              </CardContent>
            </Card>

            {profile?.is_pro && (
              <Card className="border-purple-500/50 bg-purple-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Deep Work
                  </CardTitle>
                  <div className="text-2xl font-bold">{totalFocusMinutes} mins</div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">Total focused coding time.</div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Today&apos;s Focus
                </h2>

                {weekContent.length === 0 ? (
                  <Card className="bg-muted/50 border-dashed">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No tasks scheduled for today. Check back later!
                    </CardContent>
                  </Card>
                ) : (
                  weekContent.map((item) => {
                    const isSubmitted = submissions.find(s => s.curriculum_id === item.id);
                    const isDateUnlocked = isDayUnlocked(currentWeek, item.day, currentWeek);
                    const isFocusUnlocked = (totalFocusMinutes / 60) >= (item.required_focus_hours || 0);
                    const isUnlocked = isDateUnlocked && isFocusUnlocked;

                    const isToday = isDateUnlocked && !isDayPassed(currentWeek, item.day, currentWeek);

                    const isUnlockedByPenalty = extraTasks.some(t => t.description.includes(`[UNLOCKED: ${item.id}]`));
                    const isMissed = !isSubmitted && isDayPassed(currentWeek, item.day, currentWeek) && !isUnlockedByPenalty;

                    return (
                      <Card key={item.id} className={cn(
                        "overflow-hidden transition-all",
                        isSubmitted && "opacity-75",
                        isToday && isUnlocked && "ring-2 ring-primary ring-offset-2",
                        !isUnlocked && "opacity-50 grayscale"
                      )}>
                        <div className={cn(
                          "h-2",
                          item.type === 'assignment' ? "bg-blue-500" :
                          item.type === 'task' ? "bg-orange-500" :
                          item.type === 'lecture' ? "bg-purple-500" : "bg-green-500"
                        )} />
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <Badge variant="outline" className="mb-2 flex items-center gap-1">
                              {item.type === 'lecture' && <Video className="h-3 w-3" />}
                              {item.type.replace('_', ' ')}
                            </Badge>
                            {isSubmitted && <Badge className="bg-green-600">Completed</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            <CardTitle>{item.title}</CardTitle>
                            {!isUnlocked && <Lock className="h-4 w-4 text-destructive" />}
                          </div>
                          <CardDescription>{item.description}</CardDescription>

                          {!isFocusUnlocked && (
                            <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 text-xs flex items-center gap-2 font-medium">
                               <Clock className="h-4 w-4" />
                               Locked: Requires {item.required_focus_hours}h Focus Time. You have {Math.round(totalFocusMinutes / 60 * 10) / 10}h.
                            </div>
                          )}

                          {item.requirements && item.requirements.length > 0 && isUnlocked && (
                            <div className="mt-4 space-y-2">
                              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Requirements:</p>
                              <ul className="text-xs space-y-1">
                                {item.requirements.map((req, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <div className="h-1 w-1 rounded-full bg-primary mt-1.5" />
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardHeader>

                        {!isSubmitted && isUnlocked && (
                          <CardFooter className="flex flex-col gap-4 border-t bg-muted/20 p-6">
                            {isMissed && (
                              <div className="w-full space-y-4">
                                <Alert variant="destructive" className="bg-destructive/10">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle>Assignment Locked</AlertTitle>
                                  <AlertDescription>
                                    You missed the deadline. Use the Automated Unlock to proceed (Penalty required).
                                  </AlertDescription>
                                </Alert>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="destructive" className="w-full">
                                      <Zap className="mr-2 h-4 w-4" />
                                      Automated Unlock
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Automated Accountability</DialogTitle>
                                    </DialogHeader>
                                    <div className="py-4 space-y-4">
                                      <p className="text-sm text-muted-foreground">
                                        To unlock this assignment, an automated penalty task will be assigned to your profile.
                                      </p>
                                      <div className="p-4 bg-muted rounded-lg border border-dashed border-primary/50">
                                        <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">Penalty Clause</p>
                                        <p className="text-sm italic">&quot;I acknowledge that missing deadlines is not professional. I will complete the assigned penalty task alongside this assignment.&quot;</p>
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button
                                        onClick={() => handleAutomatedUnlock(item.id)}
                                        className="w-full"
                                        disabled={isUnlocking === item.id}
                                      >
                                        {isUnlocking === item.id ? 'Unlocking...' : 'Accept Penalty & Unlock'}
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}

                            {(isToday || isUnlockedByPenalty) && (
                              <div className="w-full space-y-4">
                                {item.type === 'quiz' ? (
                                  <Button className="w-full" onClick={() => setActiveQuiz(item)}>
                                    Start Weekly Quiz
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                  </Button>
                                ) : item.type === 'lecture' ? (
                                  <Button
                                    className="w-full"
                                    onClick={() => handleMarkLectureDone(item.id)}
                                    disabled={markingLecture === item.id}
                                  >
                                    {markingLecture === item.id ? 'Marking...' : 'Mark Lecture as Completed'}
                                    <CheckCircle2 className="ml-2 h-4 w-4" />
                                  </Button>
                                ) : (
                                  <div className="w-full space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="github">Submit GitHub URL</Label>
                                      <div className="flex gap-2">
                                        <div className="relative flex-1">
                                          <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                          <Input
                                            id="github"
                                            className="pl-9"
                                            placeholder="https://github.com/..."
                                            value={githubUrl}
                                            onChange={(e) => setGithubUrl(e.target.value)}
                                          />
                                        </div>
                                        <Button
                                          onClick={() => handleSubmitAssignment(item.id)}
                                          disabled={!githubUrl.includes('github.com') || submittingId === item.id}
                                        >
                                          {submittingId === item.id ? '...' : <Send className="h-4 w-4" />}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardFooter>
                        )}
                      </Card>
                    );
                  })
                )}

                {showReviewFor && (
                  <AICodeReview
                    githubUrl={lastSubmittedUrl}
                    assignmentTitle={curriculum.find(i => i.id === showReviewFor)?.title}
                    assignmentDescription={curriculum.find(i => i.id === showReviewFor)?.description}
                  />
                )}
              </div>

              {/* Sidebar / Extra Info */}
              <div className="space-y-6">
                 {/* Deep Work Timer (Pro Only) */}
                 {profile?.is_pro ? (
                   <div className="animate-in zoom-in duration-500">
                     <Card className="bg-slate-900 text-white hacker-border">
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2 hacker-text">
                           <Lock className="h-4 w-4" />
                           Pro Tool: Deep Work Timer
                         </CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="text-center">
                           <div className="text-4xl font-mono mb-4 hacker-text">60:00</div>
                           <Button className="w-full bg-primary hover:bg-primary/80 text-primary-foreground">
                             Open Focus Room
                           </Button>
                         </div>
                       </CardContent>
                     </Card>
                   </div>
                 ) : (
                   <Card className="bg-muted/50 border-dashed">
                     <CardHeader>
                       <CardTitle className="text-sm flex items-center gap-2 opacity-50">
                         <Lock className="h-4 w-4" />
                         Pro Tools Locked
                       </CardTitle>
                     </CardHeader>
                     <CardContent>
                       <p className="text-xs text-muted-foreground">
                         Submit 5 assignments to unlock Pro Mode, Deep Work Timer, and AI Reviews.
                       </p>
                       <div className="mt-4 flex items-center gap-2">
                         <Progress value={(submissions.length / 5) * 100} className="flex-1 h-1.5" />
                         <span className="text-[10px] font-medium">{submissions.length}/5</span>
                       </div>
                     </CardContent>
                   </Card>
                 )}

                 {/* Missed Assignments & Extra Tasks */}
                 {extraTasks.length > 0 && (
                   <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-orange-800 dark:text-orange-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Active Penalties ({extraTasks.filter(t => !t.is_completed).length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {extraTasks.map(task => (
                        <div key={task.id} className={cn(
                          "p-3 rounded-md text-xs border",
                          task.is_completed ? "bg-green-100/50 border-green-200 text-green-700" : "bg-white/50 border-orange-200 text-orange-800"
                        )}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold">{task.is_completed ? 'RESOLVED' : 'PENDING'}</span>
                            {!task.is_completed && <Badge variant="outline" className="text-[10px]">Penalty</Badge>}
                          </div>
                          <p className="mb-3">{task.description}</p>
                          {!task.is_completed && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[10px] w-full border-orange-300 hover:bg-orange-100"
                              onClick={() => handleCompleteExtraTask(task.id)}
                              disabled={completingTaskId === task.id}
                            >
                              {completingTaskId === task.id ? 'Processing...' : 'Mark as Completed'}
                            </Button>
                          )}
                        </div>
                      ))}
                    </CardContent>
                   </Card>
                 )}

                 {extraTasks.length === 0 && (
                   <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-green-800 dark:text-green-400 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Account Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-green-700 dark:text-green-500">
                        Perfect standing. You have 0 missed assignments.
                      </p>
                    </CardContent>
                   </Card>
                 )}

                 {/* Attendance History */}
                 <Card>
                   <CardHeader className="pb-2">
                     <CardTitle className="text-sm font-semibold flex items-center gap-2">
                       <Clock className="h-4 w-4" />
                       Recent Attendance
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     {recentAttendance.length === 0 ? (
                       <p className="text-xs text-muted-foreground italic">No attendance records found.</p>
                     ) : (
                       <div className="space-y-2">
                         {recentAttendance.map((record) => (
                           <div key={record.id} className="flex justify-between items-center text-xs p-2 rounded bg-muted/50">
                             <span className="font-medium">{new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                             <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 border-green-200">PRESENT</Badge>
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

      {/* Quiz Overlay */}
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
                     feedback: `Quiz completed with score: ${score}`
                   });
                   fetchData();
                 }
                 setTimeout(() => setActiveQuiz(null), 3000);
               }}
             />
             <Button
               variant="ghost"
               className="mt-4 text-muted-foreground"
               onClick={() => setActiveQuiz(null)}
             >
               Cancel Quiz
             </Button>
          </div>
        </div>
      )}
    </div>
  );
}
