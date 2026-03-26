'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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
  Star,
  Target,
  Flame,
  FileUser
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AICodeReview } from '@/components/code-review';
import { QuizModule } from '@/components/quiz';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast-provider';
import { DashboardSkeleton } from '@/components/skeletons';
import { KnowledgeRadar } from '@/components/knowledge-radar';
import { generateCV } from '@/lib/cv-generator';
import { OnboardingTour } from '@/components/onboarding-tour';
import { getRank, getLevel, getXpProgress, getSkillPoints, ShopItem } from '@/lib/gamification';
import { DailyBounty } from '@/components/daily-bounty';
import { Skull } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  enrollment_date: string;
  is_pro: boolean;
  current_streak: number;
  total_points: number;
  last_punch_in: string | null;
  agreed_tc: boolean;
  has_streak_freeze?: boolean;
  xp_booster_until?: string | null;
  achievements?: string[];
  email?: string;
  phone_number?: string;
  city?: string;
  github_link?: string;
}

interface Submission {
  id: string;
  curriculum_id: string;
  github_url: string;
  status: string;
  completion_data?: {
    theory_read?: boolean;
    quiz_completed?: boolean;
    quiz_score?: number;
    assignment_submitted?: boolean;
  };
}

interface ExtraTask {
  id: string;
  description: string;
  is_completed: boolean;
}

export default function DashboardPage() {
  const { setTheme } = useTheme();
  const { success, error: toastError } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [extraTasks, setExtraTasks] = useState<ExtraTask[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasPunchedInToday, setHasPunchedInToday] = useState(false);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [rewardHistory, setRewardHistory] = useState<any[]>([]);
  const [userPerks, setUserPerks] = useState<any[]>([]);

  const [githubUrl, setGithubUrl] = useState('');
  const [lastSubmittedUrl, setLastSubmittedUrl] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [skippingId, setSkippingId] = useState<string | null>(null);
  const [skipPin, setSkipPin] = useState('');
  const [showReviewFor, setShowReviewFor] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<CurriculumItem | null>(null);

  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileData) return;
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

      const { data: rewards } = await supabase
        .from('reward_log')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setRewardHistory(rewards || []);

      const { data: perks } = await supabase
        .from('user_perks')
        .select('*')
        .eq('user_id', user.id);
      setUserPerks(perks || []);

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
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [setTheme]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Achievement Unlocks
  useEffect(() => {
    if (!profile) return;

    const checkAchievements = async () => {
       const achievements = [
          { id: 'streak-7', title: '7 Day Streak', unlocked: (profile.current_streak || 0) >= 7 },
          { id: 'first-submission', title: 'First Steps', unlocked: submissions.some(s => s.status === 'submitted') },
          { id: 'pro-unlocked', title: 'Elite Status', unlocked: profile.is_pro },
          { id: 'deep-worker', title: 'Deep Worker', unlocked: totalFocusMinutes >= 600 },
          { id: 'quiz-master', title: 'Quiz Master', unlocked: submissions.some(s => s.completion_data?.quiz_score === 100) },
          { id: 'git-expert', title: 'Git Expert', unlocked: submissions.some(s => s.curriculum_id.toLowerCase().includes('git') && s.status === 'submitted') },
       ];

       const newUnlocks = achievements.filter(a => a.unlocked && !profile.achievements?.includes(a.id));

       if (newUnlocks.length > 0) {
          const updatedAchievements = [...(profile.achievements || []), ...newUnlocks.map(a => a.id)];

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Update Profile
          await supabase.from('profiles').update({ achievements: updatedAchievements }).eq('id', user.id);

          // Trigger Notifications & Confetti
          for (const ach of newUnlocks) {
             const { createNotificationAction } = await import('@/app/admin/actions');
             await createNotificationAction(user.id, 'Achievement Unlocked!', `You've earned the "${ach.title}" badge!`, 'achievement');
             success(`Unlocked Achievement: ${ach.title}`);
          }
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          fetchData();
       }
    };

    checkAchievements();
  }, [profile, submissions, totalFocusMinutes, success, fetchData]);

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
        toastError('Failed to submit: ' + error.message);
      } else {
        success('Assignment submitted successfully!');
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
      toastError('Invalid PIN');
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
    <main className="flex-1 p-4 lg:p-8">
      <DashboardSkeleton />
    </main>
  );

  return (
    <main className="flex-1 p-4 lg:p-8">
      <OnboardingTour />
      <div className="max-w-5xl mx-auto space-y-8 w-full">
          <header id="dashboard-header" className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                   <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl shadow-inner">
                      {getRank(getLevel(profile?.total_points || 0)).icon}
                   </div>
                   <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-black border-2 border-background">
                      {getLevel(profile?.total_points || 0)}
                   </div>
                </div>
                <div>
                   <div className="flex items-center gap-2">
                      <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Welcome, {profile?.full_name}!</h1>
                      {profile?.is_pro && (
                        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none animate-pulse h-5 text-[10px] px-1.5">
                          <Zap className="h-3 w-3 mr-1 fill-white" /> PRO
                        </Badge>
                      )}
                      {profile?.xp_booster_until && new Date(profile.xp_booster_until) > new Date() && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600 animate-pulse h-5 text-[10px] px-1.5">
                           2X XP ACTIVE
                        </Badge>
                      )}
                      {profile?.has_streak_freeze && (
                        <Badge variant="outline" className="text-blue-500 border-blue-500 h-5 text-[10px] px-1.5">
                           FREEZE ACTIVE
                        </Badge>
                      )}
                   </div>
                   <div className="flex items-center gap-2">
                      <p className={cn("text-xs font-black uppercase tracking-widest", getRank(getLevel(profile?.total_points || 0)).color)}>
                        {getRank(getLevel(profile?.total_points || 0)).title}
                      </p>
                      <span className="text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground font-medium">Module {currentModule} &bull; {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                   </div>
                </div>
              </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              {hasPunchedInToday ? (
                <Badge variant="outline" className="text-green-600 border-green-600 px-4 py-2 w-full justify-center">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Attendance Marked
                </Badge>
              ) : (
                <Badge variant="outline" className="text-orange-600 border-orange-600 px-4 py-2 w-full justify-center">
                  <Clock className="mr-2 h-4 w-4" /> Attendance Pending
                </Badge>
              )}
            </div>
          </header>

          {/* Core Metrics - Mobile First */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-primary/5 border-primary/10">
              <CardHeader className="pb-1 p-4">
                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total XP</CardTitle>
                <div className="text-xl font-black text-primary">{profile?.total_points || 0}</div>
              </CardHeader>
            </Card>
            <Card className="bg-amber-500/5 border-amber-500/10">
              <CardHeader className="pb-1 p-4">
                <CardTitle className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Student Sparks</CardTitle>
                <div className="text-xl font-black text-amber-600 flex items-center gap-1">
                   <Zap className="h-4 w-4 fill-amber-500" />
                   {getSkillPoints(profile?.total_points || 0)}
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-1 p-4">
                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Progress</CardTitle>
                <div className="text-xl font-black">{Math.round((submissions.length / (curriculum.length || 1)) * 100)}%</div>
              </CardHeader>
            </Card>
            <Card className={cn(profile?.is_pro ? "bg-purple-500/5 border-purple-500/10" : "opacity-50")}>
              <CardHeader className="pb-1 p-4">
                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Level {getLevel(profile?.total_points || 0)}</CardTitle>
                <div className="mt-2 space-y-1">
                   <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-1000"
                        style={{ width: `${getXpProgress(profile?.total_points || 0)}%` }}
                      />
                   </div>
                   <div className="text-[8px] font-bold text-right text-muted-foreground">{getXpProgress(profile?.total_points || 0)}/100 XP</div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Achievements Grid */}
          <section className="space-y-4">
             <h2 className="text-xl font-bold flex items-center gap-2">
               <Trophy className="h-5 w-5 text-amber-500" /> Achievements
             </h2>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[
                  { id: 'streak-7', title: '7 Day Streak', icon: Flame, color: 'text-orange-500', desc: 'Consistent learner' },
                  { id: 'first-submission', title: 'First Steps', icon: Target, color: 'text-blue-500', desc: 'First assignment done' },
                  { id: 'pro-unlocked', title: 'Elite Status', icon: Zap, color: 'text-purple-500', desc: 'Unlocked Pro Mode' },
                  { id: 'deep-worker', title: 'Deep Worker', icon: Clock, color: 'text-emerald-500', desc: '10+ focus sessions' },
                  { id: 'quiz-master', title: 'Quiz Master', icon: Star, color: 'text-yellow-500', desc: 'Perfect quiz score' },
                  { id: 'git-expert', title: 'Git Expert', icon: Github, color: 'text-slate-400', desc: 'Completed Git Mastery' },
                ].map(badge => {
                  const isUnlocked =
                    profile?.achievements?.includes(badge.id) ||
                    (badge.id === 'pro-unlocked' && profile?.is_pro) ||
                    (badge.id === 'streak-7' && (profile?.current_streak || 0) >= 7) ||
                    (badge.id === 'first-submission' && submissions.some(s => s.status === 'submitted')) ||
                    (badge.id === 'deep-worker' && totalFocusMinutes >= 600) || // 10 hours
                    (badge.id === 'quiz-master' && submissions.some(s => s.completion_data?.quiz_score === 100)) ||
                    (badge.id === 'git-expert' && submissions.some(s => s.curriculum_id.toLowerCase().includes('git') && s.status === 'submitted'));

                  return (
                    <Card key={badge.id} className={cn("relative group transition-all duration-500", !isUnlocked && "opacity-40 grayscale")}>
                       <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                          <div className={cn("p-2 rounded-full bg-muted transition-transform group-hover:scale-110", badge.color)}>
                             <badge.icon className="h-6 w-6" />
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-tighter">{badge.title}</div>
                          {isUnlocked && <div className="absolute top-1 right-1"><CheckCircle2 className="h-3 w-3 text-green-500 fill-white" /></div>}
                       </CardContent>
                    </Card>
                  )
                })}
             </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Card id="mastery-radar" className="p-8 flex flex-col md:flex-row items-center gap-12 overflow-hidden bg-primary/5 border-primary/10">
                   <div className="flex-1 space-y-4">
                      <h2 className="text-2xl font-black uppercase tracking-tighter text-primary flex items-center gap-2">
                        <Trophy className="h-6 w-6" /> Mastery Radar
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                         Visualize your proficiency across the technical stack. Your radar expands as you complete module-specific assignments and quizzes.
                      </p>
                      <div className="flex flex-wrap gap-4 items-end">
                         <div className="text-center">
                            <div className="text-xl font-black">{submissions.length}</div>
                            <div className="text-[8px] uppercase font-bold opacity-50">Units Done</div>
                         </div>
                         <div className="h-8 w-px bg-primary/20 hidden md:block" />
                         <div className="text-center">
                            <div className="text-xl font-black">{Math.floor((profile?.total_points || 0) / 10)}</div>
                            <div className="text-[8px] uppercase font-bold opacity-50">Rank Score</div>
                         </div>
                         <Button
                           variant="outline"
                           size="sm"
                           className="bg-white dark:bg-slate-900 border-primary text-primary font-bold gap-2 ml-auto"
                           onClick={() => generateCV({
                             fullName: profile?.full_name || 'Student',
                             email: profile?.email || '',
                             phone: profile?.phone_number || '',
                             city: profile?.city || '',
                             github: profile?.github_link || '',
                             skills: ['HTML5', 'CSS3', 'JavaScript', 'Tailwind CSS', 'React'],
                             projects: curriculum.slice(0, 5).map(c => ({ title: c.title, status: submissions.find(s => s.curriculum_id === c.id)?.status || 'In Progress' })),
                             totalPoints: profile?.total_points || 0,
                             level: getLevel(profile?.total_points || 0),
                             streak: profile?.current_streak || 0
                           }, !!userPerks.find(p => p.perk_id === 'resume_template'))}
                         >
                            <FileUser className="h-4 w-4" /> Export CV
                         </Button>
                      </div>
                   </div>
                   <div className="shrink-0 p-4 bg-white/40 dark:bg-black/40 rounded-full backdrop-blur-xl">
                      <KnowledgeRadar
                        size={240}
                        data={[
                          { label: 'HTML', value: Math.min(100, (submissions.filter(s => s.curriculum_id.includes('html')).length / 5) * 100 || 20) },
                          { label: 'CSS', value: Math.min(100, (submissions.filter(s => s.curriculum_id.includes('css')).length / 5) * 100 || 15) },
                          { label: 'JS', value: Math.min(100, (submissions.filter(s => s.curriculum_id.includes('js')).length / 5) * 100 || 10) },
                          { label: 'AI', value: Math.min(100, (submissions.filter(s => s.curriculum_id.includes('ai')).length / 3) * 100 || 5) },
                          { label: 'LOGIC', value: Math.min(100, (submissions.filter(s => s.status === 'reviewed').length / 10) * 100 || 30) },
                        ]}
                      />
                   </div>
                </Card>

              <section className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" /> Today&apos;s Focus
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
                        (!isUnlocked || !isFocusUnlocked) && "opacity-50 grayscale",
                        item.is_boss_project && "border-red-500 bg-red-500/5 shadow-2xl shadow-red-500/20"
                      )}>
                        <div className={cn(
                          "h-2",
                          item.is_boss_project ? "bg-red-600 animate-pulse" :
                          item.type === 'lecture' ? "bg-purple-500" : "bg-blue-500"
                        )} />
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <Badge variant={item.is_boss_project ? "destructive" : "outline"} className="mb-2 flex items-center gap-1">
                              {item.is_boss_project ? <Skull className="h-3 w-3" /> : item.type === 'lecture' ? <Video className="h-3 w-3" /> : null}
                              {item.is_boss_project ? 'BOSS PROJECT' : item.type.replace('_', ' ')}
                            </Badge>
                            {isSubmitted && <Badge className="bg-green-600">Completed</Badge>}
                            {isSkipped && <Badge className="bg-orange-500">Skipped</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            <CardTitle className={cn(item.is_boss_project && "text-red-600 font-black")}>{item.title}</CardTitle>
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
                                <Button asChild className={cn("w-full", item.is_boss_project ? "bg-red-600 hover:bg-red-700" : "bg-purple-600 hover:bg-purple-700")}>
                                  <Link href={`/lecture/${item.id}`}>
                                    {item.is_boss_project ? 'Enter Boss Room' : 'Open Lecture Room'} <ArrowRight className="ml-2 h-4 w-4" />
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
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BookOpen className="h-5 w-5" /> Active Tasks
                </h2>
                <Card className="bg-muted/10 border-dashed">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground text-sm italic">
                      "The secret of getting ahead is getting started."
                    </p>
                  </CardContent>
                </Card>
              </section>
            </div>

            <div className="space-y-8">
              {extraTasks.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-lg font-bold text-orange-600">Active Tasks</h2>
                  <div className="space-y-3">
                    {extraTasks.map(task => (
                      <Card key={task.id} className={cn("border-orange-200 bg-orange-50/50", task.is_completed && "opacity-50 grayscale")}>
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                          <p className="text-xs font-medium leading-relaxed">{task.description}</p>
                          {!task.is_completed && (
                            <Button size="sm" variant="outline" className="h-8 border-orange-300" onClick={() => handleCompleteExtraTask(task.id)} disabled={!!completingTaskId}>
                              {completingTaskId === task.id ? '...' : 'Done'}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              <DailyBounty onComplete={async (reward) => {
                const { rewardStudentAction } = await import('@/app/admin/actions');
                const today = new Date().toLocaleDateString('en-CA');
                await rewardStudentAction(reward, 'Daily Bounty Completed', 'daily_bounty', today);
                fetchData();
              }} />

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Reward History</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {rewardHistory.length === 0 ? <p className="text-xs text-muted-foreground italic p-4">No points earned yet.</p> : (
                    <div className="divide-y">
                      {rewardHistory.map((reward) => (
                        <div key={reward.id} className="flex justify-between items-center text-[10px] p-3">
                          <div className="flex flex-col">
                            <span className="font-bold">{reward.reason}</span>
                            <span className="text-[8px] text-muted-foreground opacity-70">{new Date(reward.created_at).toLocaleString()}</span>
                          </div>
                          <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary font-black">+{reward.amount} XP</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><Clock className="h-4 w-4" /> Attendance Log</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {recentAttendance.length === 0 ? <p className="text-xs text-muted-foreground italic p-4">No records yet.</p> : (
                    <div className="divide-y">
                      {recentAttendance.map((record) => (
                        <div key={record.id} className="flex justify-between items-center text-[10px] p-3">
                          <span className="font-medium">{new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <Badge variant="secondary" className="text-[9px] bg-green-100 text-green-700">PRESENT</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

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
    </main>
  );
}
