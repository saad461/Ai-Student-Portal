'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Sidebar } from '@/components/sidebar';
import { CURRICULUM, CurriculumItem, QuizQuestion } from '@/lib/curriculum';
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
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Github,
  Lock,
  ArrowRight,
  Send,
  BookOpen,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AICodeReview } from '@/components/code-review';
import { QuizModule } from '@/components/quiz';

interface Profile {
  id: string;
  full_name: string;
  enrollment_date: string;
  is_pro: boolean;
  current_streak: number;
}

interface Submission {
  id: string;
  curriculum_id: string;
  github_url: string;
  status: string;
}

export default function DashboardPage() {
  const { setTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [punchInLoading, setPunchInLoading] = useState(false);
  const [hasPunchedInToday, setHasPunchedInToday] = useState(false);

  const [githubUrl, setGithubUrl] = useState('');
  const [lastSubmittedUrl, setLastSubmittedUrl] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [showReviewFor, setShowReviewFor] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<CurriculumItem | null>(null);

  const [sorryMessage, setSorryMessage] = useState('');
  const [sendingSorry, setSendingSorry] = useState<string | null>(null);

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

    const today = new Date().toISOString().split('T')[0];
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', user.id)
      .eq('date', today)
      .single();

    if (attendance) setHasPunchedInToday(true);

    const { data: subs } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', user.id);

    setSubmissions((subs as unknown as Submission[]) || []);

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

  const handlePunchIn = async () => {
    setPunchInLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('attendance').insert({
      student_id: user.id,
      date: new Date().toISOString().split('T')[0]
    });

    if (!error) {
      setHasPunchedInToday(true);
    }
    setPunchInLoading(false);
  };

  const handleSubmitAssignment = async (curriculumId: string) => {
    setSubmittingId(curriculumId);
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
    }
    setSubmittingId(null);
  };

  const getCurrentWeek = () => {
    if (!profile) return 1;
    const start = new Date(profile.enrollment_date);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) + 1;
  };

  const currentWeek = getCurrentWeek();
  const weekContent = CURRICULUM.filter(item => item.week === currentWeek);

  const handleSendSorry = async (curriculumId: string) => {
    setSendingSorry(curriculumId);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('messages').insert({
        student_id: user.id,
        curriculum_id: curriculumId,
        body: sorryMessage,
        status: 'pending'
      });
      setSorryMessage('');
      setSendingSorry(null);
      fetchData();
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
              {!hasPunchedInToday && (
                <Button onClick={handlePunchIn} disabled={punchInLoading} className="bg-orange-500 hover:bg-orange-600">
                  <Clock className="mr-2 h-4 w-4" />
                  {punchInLoading ? 'Punching In...' : 'Punch In Today'}
                </Button>
              )}
              {hasPunchedInToday && (
                <Badge variant="outline" className="text-green-600 border-green-600 px-4 py-2">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Punched In
                </Badge>
              )}
              {profile?.is_pro && (
                <Badge variant="default" className="bg-purple-600 px-4 py-2">PRO MODE ACTIVE</Badge>
              )}
            </div>
          </header>

          {/* Progress Overview */}
          <div className={`grid grid-cols-1 ${profile?.is_pro ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6`}>
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
                    const isToday = (
                      (item.day === 'Monday' && new Date().getDay() === 1) ||
                      (item.day === 'Wednesday' && new Date().getDay() === 3) ||
                      (item.day === 'Friday' && new Date().getDay() === 5)
                    );

                    const isMissed = !isToday && !isSubmitted;

                    return (
                      <Card key={item.id} className={cn(
                        "overflow-hidden transition-all",
                        isSubmitted && "opacity-75",
                        isToday && "ring-2 ring-primary ring-offset-2"
                      )}>
                        <div className={cn(
                          "h-2",
                          item.type === 'assignment' ? "bg-blue-500" :
                          item.type === 'task' ? "bg-orange-500" : "bg-green-500"
                        )} />
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <Badge variant="outline" className="mb-2">{item.type.replace('_', ' ')}</Badge>
                            {isSubmitted && <Badge className="bg-green-600">Completed</Badge>}
                          </div>
                          <CardTitle>{item.title}</CardTitle>
                          <CardDescription>{item.description}</CardDescription>
                        </CardHeader>

                        {!isSubmitted && (
                          <CardFooter className="flex flex-col gap-4 border-t bg-muted/20 p-6">
                            {isMissed && (
                              <div className="w-full space-y-4">
                                <Alert variant="destructive">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle>Assignment Missed</AlertTitle>
                                  <AlertDescription>
                                    This assignment is locked. Please message the admin to unlock it.
                                  </AlertDescription>
                                </Alert>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full">Message Admin</Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Explain why you missed it</DialogTitle>
                                    </DialogHeader>
                                    <div className="py-4">
                                      <Label htmlFor="sorry">Your Message</Label>
                                      <Textarea
                                        id="sorry"
                                        placeholder="I&apos;m sorry, I was sick..."
                                        value={sorryMessage}
                                        onChange={(e) => setSorryMessage(e.target.value)}
                                      />
                                    </div>
                                    <DialogFooter>
                                      <Button onClick={() => handleSendSorry(item.id)} disabled={!sorryMessage || sendingSorry === item.id}>
                                        {sendingSorry === item.id ? 'Sending...' : 'Send Message'}
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}

                            {isToday && (
                              <div className="w-full space-y-4">
                                {item.type === 'quiz' ? (
                                  <Button className="w-full" onClick={() => setActiveQuiz(item)}>
                                    Start Weekly Quiz
                                    <ArrowRight className="ml-2 h-4 w-4" />
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
                    assignmentTitle={CURRICULUM.find(i => i.id === showReviewFor)?.title}
                    assignmentDescription={CURRICULUM.find(i => i.id === showReviewFor)?.description}
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

                 {/* Missed Assignments Warning */}
                 <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-orange-800 dark:text-orange-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Account Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-orange-700 dark:text-orange-500">
                        You have 0 missed assignments. Stay on track to avoid penalties.
                      </p>
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
