'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { PortalNavbar } from '@/components/portal-navbar';
import { CurriculumItem, isItemUnlocked, Module, SubModule, Course } from '@/lib/curriculum';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckCircle2, Lock, Video, FileText, Layers, BookOpen, ChevronRight, ChevronDown, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TermsModal } from '@/components/terms-modal';
import { useToast } from '@/components/ui/toast-provider';
import { CurriculumSkeleton } from '@/components/skeletons';

interface Submission {
  id: string;
  curriculum_id: string;
  status: string;
}

function CurriculumContent() {
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get('course');
  const { error: toastError } = useToast();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [subModules, setSubModules] = useState<SubModule[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreedTC, setAgreedTC] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [skippingId, setSkippingId] = useState<string | null>(null);
  const [skipPin, setSkipPin] = useState('');
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

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
      setAgreedTC(profile.agreed_tc);
    }

    const { data: subs } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', user.id);

    setSubmissions((subs as unknown as Submission[]) || []);

    // Fetch active course ID if not in URL
    let targetCourseId = courseIdParam;
    if (!targetCourseId) {
      if (profile?.current_course_id) {
        targetCourseId = profile.current_course_id;
      } else {
        // Fallback to first unlocked course
        const { data: userCourses } = await supabase
          .from('user_courses')
          .select('course_id')
          .eq('user_id', user.id)
          .eq('status', 'unlocked')
          .order('unlocked_at', { ascending: true })
          .limit(1);

        if (userCourses && userCourses.length > 0) {
          targetCourseId = userCourses[0].course_id;
        }
      }
    }

    if (targetCourseId) {
       const { data: courseData } = await supabase
         .from('courses')
         .select('*')
         .eq('id', targetCourseId)
         .single();
       setCurrentCourse(courseData as Course);

       // Update current course in profile if changed
       if (targetCourseId !== profile?.current_course_id) {
         await supabase.from('profiles').update({ current_course_id: targetCourseId }).eq('id', user.id);
       }
    }

    const { data: modulesData } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', targetCourseId)
      .order('index', { ascending: true });

    const fetchedModules = modulesData || [];
    setModules(fetchedModules);

    const moduleIndices = fetchedModules.map(m => m.index);

    const { data: curriculumData } = await supabase
      .from('curriculum')
      .select('*')
      .in('week', moduleIndices)
      .order('week', { ascending: true });

    setCurriculum((curriculumData as unknown as CurriculumItem[]) || []);

    const { data: subModulesData } = await supabase
      .from('sub_modules')
      .select('*')
      .order('index', { ascending: true });
    setSubModules(subModulesData || []);

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

  const handleAgreeTC = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ agreed_tc: true }).eq('id', user.id);
      setAgreedTC(true);
      setShowTerms(false);
      fetchData();
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

  const displayModules = modules.length > 0 ? modules : Array.from({ length: 24 }, (_, i) => ({ id: (i + 1).toString(), index: i + 1, name: `Module ${i + 1}` }));

  if (loading) return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-muted/30">
      <Sidebar />
      <PortalNavbar />
      <main className="flex-1 p-4 lg:p-8">
        <CurriculumSkeleton />
      </main>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-muted/30">
      <Sidebar />
      <PortalNavbar />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold">{currentCourse?.name || 'Course'} Curriculum</h1>
              <p className="text-muted-foreground mt-2">Your sequential path to mastery.</p>
            </div>
            <Link href="/courses">
              <Button variant="outline" size="sm">Switch Course</Button>
            </Link>
          </header>

          <Tabs defaultValue="all" className="w-full">
            <div className="overflow-x-auto pb-4">
              <TabsList className="inline-flex w-max">
                <TabsTrigger value="all">Full Curriculum</TabsTrigger>
                <TabsTrigger value="completed" className="bg-green-50 text-green-700 data-[state=active]:bg-green-600 data-[state=active]:text-white ml-2">
                  Completed
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="completed" className="space-y-8 mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-green-700">Completed Curriculum</h2>
              </div>

              {curriculum.filter(item => {
                const sub = submissions.find(s => s.curriculum_id === item.id);
                return sub && (sub.status === 'submitted' || sub.status === 'reviewed');
              }).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {curriculum.filter(item => {
                    const sub = submissions.find(s => s.curriculum_id === item.id);
                    return sub && (sub.status === 'submitted' || sub.status === 'reviewed');
                  }).map((item) => (
                    <Card key={item.id} className="flex flex-col border-green-200 bg-green-50/20">
                      <CardHeader className="flex-none">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="mb-2">{item.day}</Badge>
                              <Badge variant="outline" className="mb-2 uppercase text-[10px] flex items-center gap-1">
                                {item.type === 'lecture' && (
                                  <>
                                    {item.video_url && item.theory_content ? <Layers className="h-2 w-2" /> :
                                     item.video_url ? <Video className="h-2 w-2" /> :
                                     <FileText className="h-2 w-2" />}
                                  </>
                                )}
                                {item.type}
                              </Badge>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      </CardContent>
                      <CardFooter className="pt-0 pb-6 px-6 mt-auto">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full border-green-500 text-green-700 hover:bg-green-100"
                        >
                          <Link href={`/lecture/${item.id}`}>
                            Review Lecture
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center border-2 border-dashed rounded-3xl bg-slate-50">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">No completed lectures yet. Keep learning!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {displayModules.map((m) => {
                const moduleSubModules = subModules.filter(s => s.module_id === m.id);
                const moduleLectures = curriculum.filter(item => item.week === m.index);
                const isExpanded = expandedModules.includes(m.id);

                return (
                  <Card key={m.id} className="overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-sm">
                    <button
                      onClick={() => toggleModule(m.id)}
                      className="w-full flex items-center justify-between p-6 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {m.index}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{m.name}</h3>
                          <p className="text-sm text-muted-foreground">{moduleLectures.length} Lectures • {moduleSubModules.length} Sub-Modules</p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronDown className="h-6 w-6 text-muted-foreground" /> : <ChevronRight className="h-6 w-6 text-muted-foreground" />}
                    </button>

                    {isExpanded && (
                      <CardContent className="p-0 border-t bg-slate-50/50 dark:bg-slate-900/20">
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {moduleSubModules.length > 0 ? (
                            moduleSubModules.map(sub => {
                              const subLectures = moduleLectures.filter(l => l.sub_module_id === sub.id).sort((a,b) => (a.lecture_index || 0) - (b.lecture_index || 0));
                              if (subLectures.length === 0) return null;

                              return (
                                <div key={sub.id} className="p-6 space-y-4">
                                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Layers className="h-3 w-3" /> {sub.name}
                                  </h4>
                                  <div className="space-y-2">
                                    {subLectures.map(item => {
                                      const submission = submissions.find(s => s.curriculum_id === item.id);
                                      const isSubmitted = submission && submission.status !== 'skipped';
                                      const isSkipped = submission && submission.status === 'skipped';
                                      const isUnlocked = isItemUnlocked(item, curriculum, submissions, agreedTC);
                                      const isFocusUnlocked = (totalFocusMinutes / 60) >= (item.required_focus_hours || 0);
                                      const isTermsMet = isUnlocked || (agreedTC || item.week !== 1 || curriculum.sort((a,b) => a.week-b.week)[0]?.id !== item.id);

                                      return (
                                        <div key={item.id} className="space-y-2">
                                          <div
                                            className={cn(
                                              "flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-all",
                                              (!isUnlocked || !isFocusUnlocked || !isTermsMet) ? "opacity-50" : "hover:border-primary/50 hover:shadow-md group"
                                            )}
                                          >
                                            <Link
                                              href={(isUnlocked && isFocusUnlocked && isTermsMet) ? `/lecture/${item.id}` : '#'}
                                              className={cn(
                                                "flex flex-1 items-center gap-4",
                                                (!isUnlocked || !isFocusUnlocked || !isTermsMet) && "cursor-not-allowed"
                                              )}
                                            >
                                              <div className={cn(
                                                "h-8 w-8 rounded-full flex items-center justify-center border-2 shrink-0",
                                                isSubmitted ? "bg-green-500 border-green-500 text-white" :
                                                isSkipped ? "bg-orange-100 border-orange-500 text-orange-600" :
                                                "border-slate-200 dark:border-slate-800 text-slate-400"
                                              )}>
                                                {isSubmitted ? <CheckCircle2 className="h-4 w-4" /> :
                                                 item.type === 'lecture' ? (
                                                    <>
                                                      {item.video_url && item.theory_content ? <Layers className="h-3 w-3" /> :
                                                       item.video_url ? <Video className="h-3 w-3" /> :
                                                       <FileText className="h-3 w-3" />}
                                                    </>
                                                  ) : <BookOpen className="h-4 w-4" />}
                                              </div>
                                              <div className="min-w-0">
                                                <p className="font-bold text-sm group-hover:text-primary transition-colors truncate">{item.title}</p>
                                                <div className="flex items-center gap-2">
                                                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">#{item.lecture_index} {item.day}</p>
                                                  {item.required_focus_hours ? (
                                                    <Badge variant="outline" className="text-[9px] h-4 py-0 flex items-center gap-1">
                                                      <Clock className="h-2 w-2" /> {item.required_focus_hours}h
                                                    </Badge>
                                                  ) : null}
                                                  <Badge variant="secondary" className="text-[9px] h-4 py-0 uppercase">{item.type}</Badge>
                                                </div>
                                              </div>
                                            </Link>
                                            <div className="flex items-center gap-2">
                                              {!isUnlocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                                              {isUnlocked && !isFocusUnlocked && <Clock className="h-4 w-4 text-amber-500" />}
                                              {!isSubmitted && !isSkipped && (
                                                <Dialog open={skippingId === item.id} onOpenChange={(open) => !open && setSkippingId(null)}>
                                                  <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setSkippingId(item.id)}>
                                                      <AlertCircle className="h-4 w-4" />
                                                    </Button>
                                                  </DialogTrigger>
                                                  <DialogContent>
                                                    <DialogHeader><DialogTitle>Skip Lecture</DialogTitle></DialogHeader>
                                                    <div className="py-4">
                                                      <Label htmlFor="skip-pin">Enter Skip PIN</Label>
                                                      <Input
                                                        id="skip-pin"
                                                        type="password"
                                                        placeholder="Enter PIN to skip"
                                                        value={skipPin}
                                                        onChange={(e) => setSkipPin(e.target.value)}
                                                      />
                                                    </div>
                                                    <DialogFooter>
                                                      <Button onClick={() => handleSkip(item.id)} disabled={!skipPin}>Confirm Skip</Button>
                                                    </DialogFooter>
                                                  </DialogContent>
                                                </Dialog>
                                              )}
                                              {isSkipped && <Badge variant="outline" className="text-[10px] text-orange-500 border-orange-500">Skipped</Badge>}
                                              {isUnlocked && isFocusUnlocked && isTermsMet && (
                                                <Link href={`/lecture/${item.id}`}>
                                                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                                </Link>
                                              )}
                                              {!isTermsMet && (
                                                <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold" onClick={() => setShowTerms(true)}>
                                                  T&C
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-6 space-y-2">
                               {moduleLectures.sort((a,b) => (a.lecture_index || 0) - (b.lecture_index || 0)).map(item => {
                                  const submission = submissions.find(s => s.curriculum_id === item.id);
                                  const isSubmitted = submission && submission.status !== 'skipped';
                                  const isSkipped = submission && submission.status === 'skipped';
                                  const isUnlocked = isItemUnlocked(item, curriculum, submissions, agreedTC);
                                  const isFocusUnlocked = (totalFocusMinutes / 60) >= (item.required_focus_hours || 0);
                                  const isTermsMet = isUnlocked || (agreedTC || item.week !== 1 || curriculum.sort((a,b) => a.week-b.week)[0]?.id !== item.id);

                                  return (
                                    <div key={item.id} className="space-y-2">
                                      <div
                                        className={cn(
                                          "flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-all",
                                          (!isUnlocked || !isFocusUnlocked || !isTermsMet) ? "opacity-50" : "hover:border-primary/50 hover:shadow-md group"
                                        )}
                                      >
                                        <Link
                                          href={(isUnlocked && isFocusUnlocked && isTermsMet) ? `/lecture/${item.id}` : '#'}
                                          className={cn(
                                            "flex flex-1 items-center gap-4",
                                            (!isUnlocked || !isFocusUnlocked || !isTermsMet) && "cursor-not-allowed"
                                          )}
                                        >
                                          <div className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center border-2 shrink-0",
                                            isSubmitted ? "bg-green-500 border-green-500 text-white" :
                                            isSkipped ? "bg-orange-100 border-orange-500 text-orange-600" :
                                            "border-slate-200 dark:border-slate-800 text-slate-400"
                                          )}>
                                            {isSubmitted ? <CheckCircle2 className="h-4 w-4" /> :
                                             item.type === 'lecture' ? (
                                                <>
                                                  {item.video_url && item.theory_content ? <Layers className="h-3 w-3" /> :
                                                   item.video_url ? <Video className="h-3 w-3" /> :
                                                   <FileText className="h-3 w-3" />}
                                                </>
                                              ) : <BookOpen className="h-4 w-4" />}
                                          </div>
                                          <div className="min-w-0">
                                            <p className="font-bold text-sm group-hover:text-primary transition-colors truncate">{item.title}</p>
                                            <div className="flex items-center gap-2">
                                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">#{item.lecture_index} {item.day}</p>
                                              {item.required_focus_hours ? (
                                                <Badge variant="outline" className="text-[9px] h-4 py-0 flex items-center gap-1">
                                                  <Clock className="h-2 w-2" /> {item.required_focus_hours}h
                                                </Badge>
                                              ) : null}
                                              <Badge variant="secondary" className="text-[9px] h-4 py-0 uppercase">{item.type}</Badge>
                                            </div>
                                          </div>
                                        </Link>
                                        <div className="flex items-center gap-2">
                                          {!isUnlocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                                          {isUnlocked && !isFocusUnlocked && <Clock className="h-4 w-4 text-amber-500" />}
                                          {!isSubmitted && !isSkipped && (
                                            <Dialog open={skippingId === item.id} onOpenChange={(open) => !open && setSkippingId(null)}>
                                              <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setSkippingId(item.id)}>
                                                  <AlertCircle className="h-4 w-4" />
                                                </Button>
                                              </DialogTrigger>
                                              <DialogContent>
                                                <DialogHeader><DialogTitle>Skip Lecture</DialogTitle></DialogHeader>
                                                <div className="py-4">
                                                  <Label htmlFor="skip-pin">Enter Skip PIN</Label>
                                                  <Input
                                                    id="skip-pin"
                                                    type="password"
                                                    placeholder="Enter PIN to skip"
                                                    value={skipPin}
                                                    onChange={(e) => setSkipPin(e.target.value)}
                                                  />
                                                </div>
                                                <DialogFooter>
                                                  <Button onClick={() => handleSkip(item.id)} disabled={!skipPin}>Confirm Skip</Button>
                                                </DialogFooter>
                                              </DialogContent>
                                            </Dialog>
                                          )}
                                          {isSkipped && <Badge variant="outline" className="text-[10px] text-orange-500 border-orange-500">Skipped</Badge>}
                                          {isUnlocked && isFocusUnlocked && isTermsMet && (
                                            <Link href={`/lecture/${item.id}`}>
                                              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                            </Link>
                                          )}
                                          {!isTermsMet && (
                                            <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold" onClick={() => setShowTerms(true)}>
                                              T&C
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                               })}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <TermsModal isOpen={showTerms} onAgree={handleAgreeTC} />
    </div>
  );
}

export default function CurriculumPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <CurriculumContent />
    </Suspense>
  );
}
