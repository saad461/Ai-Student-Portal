'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Sidebar } from '@/components/sidebar';
import { CurriculumItem, QuizQuestion } from '@/lib/curriculum';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BookOpen,
  Video,
  CheckCircle2,
  Github,
  Send,
  AlertCircle,
  FileText,
  HelpCircle,
  Lock,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuizModule } from '@/components/quiz';
import confetti from 'canvas-confetti';
import Link from 'next/link';

interface Submission {
  id: string;
  github_url: string;
  status: string;
  completion_data: {
    theory_read?: boolean;
    quiz_completed?: boolean;
    quiz_score?: number;
    assignment_submitted?: boolean;
  };
}

export default function LecturePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [lecture, setLecture] = useState<CurriculumItem | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [submittingId, setSubmittingId] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');

  const [activeTab, setActiveTab] = useState<'theory' | 'assignment' | 'quiz'>('theory');

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: lectureData } = await supabase
      .from('curriculum')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    setLecture(lectureData as unknown as CurriculumItem);

    const { data: subData } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', user.id)
      .eq('curriculum_id', resolvedParams.id)
      .single();

    if (subData) {
      setSubmission(subData as unknown as Submission);
      setGithubUrl(subData.github_url || '');
    }

    const { data: focusData } = await supabase
      .from('focus_sessions')
      .select('duration_seconds')
      .eq('student_id', user.id);

    if (focusData) {
      const totalSeconds = focusData.reduce((acc, curr) => acc + curr.duration_seconds, 0);
      setTotalFocusMinutes(Math.round(totalSeconds / 60));
    }

    setLoading(false);
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateCompletion = async (newData: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentData = submission?.completion_data || {};
    const updatedData = { ...currentData, ...newData };

    // Check if everything is done
    const isTheoryDone = updatedData.theory_read;
    const isQuizDone = lecture?.attached_quiz ? updatedData.quiz_completed : true;
    const isAssignmentDone = lecture?.attached_assignment ? (updatedData.assignment_submitted || !!githubUrl) : true;

    const isFocusMet = (totalFocusMinutes / 60) >= (lecture?.required_focus_hours || 0);
    const isFullyCompleted = isTheoryDone && isQuizDone && isAssignmentDone && isFocusMet;

    const { error } = await supabase.from('submissions').upsert({
      student_id: user.id,
      curriculum_id: resolvedParams.id,
      github_url: githubUrl,
      completion_data: updatedData,
      status: isFullyCompleted ? 'submitted' : 'reviewed' // 'reviewed' as a placeholder for partial? No, let's keep status simple
    });

    if (!error) {
      if (isFullyCompleted && !submission?.completion_data?.theory_read) { // Just finished
         confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
      fetchData();
    }
  };

  const handleMarkTheoryRead = () => {
    updateCompletion({ theory_read: true });
    if (lecture?.attached_assignment) setActiveTab('assignment');
    else if (lecture?.attached_quiz) setActiveTab('quiz');
  };

  const handleAssignmentSubmit = async () => {
    setSubmittingId(true);
    await updateCompletion({ assignment_submitted: true });
    setSubmittingId(false);
    if (lecture?.attached_quiz) setActiveTab('quiz');
  };

  const handleQuizComplete = async (score: number) => {
    await updateCompletion({ quiz_completed: true, quiz_score: score });
  };

  if (loading) return <div className="flex h-screen items-center justify-center animate-pulse text-muted-foreground">Loading Lecture Content...</div>;
  if (!lecture) return <div className="p-8 text-center text-red-500">Lecture not found.</div>;

  const isTheoryDone = submission?.completion_data?.theory_read;
  const isAssignmentDone = submission?.completion_data?.assignment_submitted || !!submission?.github_url;
  const isQuizDone = submission?.completion_data?.quiz_completed;
  const isFocusMet = (totalFocusMinutes / 60) >= (lecture.required_focus_hours || 0);
  const isFullyDone = isTheoryDone && (lecture.attached_assignment ? isAssignmentDone : true) && (lecture.attached_quiz ? isQuizDone : true) && isFocusMet;

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-8">

          <Link href="/curriculum" className="text-sm flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
             <ArrowRight className="h-4 w-4 rotate-180" /> Back to Curriculum
          </Link>

          <header className="space-y-4">
            <div className="flex justify-between items-start">
               <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="bg-purple-100 text-purple-700 border-none uppercase text-[10px]">Lecture</Badge>
                    <Badge variant="secondary">Week {lecture.week} • {lecture.day}</Badge>
                  </div>
                  <h1 className="text-4xl font-extrabold tracking-tight">{lecture.title}</h1>
               </div>
               {isFullyDone && (
                 <Badge className="bg-green-600 px-4 py-2 text-sm gap-2">
                   <CheckCircle2 className="h-4 w-4" /> COMPLETED
                 </Badge>
               )}
            </div>
            <p className="text-xl text-muted-foreground">{lecture.description}</p>
          </header>

          <div className="flex gap-4 border-b pb-1 overflow-x-auto no-scrollbar">
            <Button
              variant="ghost"
              className={cn(
                "rounded-none border-b-2 px-6",
                activeTab === 'theory' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground"
              )}
              onClick={() => setActiveTab('theory')}
            >
              <FileText className="h-4 w-4 mr-2" /> 1. Theory
              {isTheoryDone && <CheckCircle2 className="h-3 w-3 ml-2 text-green-600" />}
            </Button>

            {lecture.attached_assignment && (
              <Button
                variant="ghost"
                className={cn(
                  "rounded-none border-b-2 px-6",
                  activeTab === 'assignment' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground",
                  !isTheoryDone && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => isTheoryDone && setActiveTab('assignment')}
              >
                <Github className="h-4 w-4 mr-2" /> 2. Assignment
                {isAssignmentDone && <CheckCircle2 className="h-3 w-3 ml-2 text-green-600" />}
              </Button>
            )}

            {lecture.attached_quiz && (
              <Button
                variant="ghost"
                className={cn(
                  "rounded-none border-b-2 px-6",
                  activeTab === 'quiz' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground",
                  (!isTheoryDone || (lecture.attached_assignment && !isAssignmentDone)) && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => isTheoryDone && (!lecture.attached_assignment || isAssignmentDone) && setActiveTab('quiz')}
              >
                <HelpCircle className="h-4 w-4 mr-2" /> 3. Quiz
                {isQuizDone && <CheckCircle2 className="h-3 w-3 ml-2 text-green-600" />}
              </Button>
            )}
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'theory' && (
              <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0 space-y-6">
                  <div className="prose prose-slate dark:prose-invert max-w-none bg-white dark:bg-slate-900 p-8 rounded-2xl border shadow-sm">
                    {lecture.theory_content ? (
                      <div className="whitespace-pre-wrap text-lg leading-relaxed">
                        {lecture.theory_content}
                      </div>
                    ) : (
                      <div className="py-20 text-center text-muted-foreground italic">
                        No theory content provided for this lecture yet.
                      </div>
                    )}
                  </div>
                  {!isTheoryDone && (
                    <Button onClick={handleMarkTheoryRead} size="lg" className="w-full h-16 text-lg font-bold">
                      I have read and understood the theory
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'assignment' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/10">
                   <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Github className="h-5 w-5 text-blue-600" />
                        {lecture.attached_assignment?.title || 'Lecture Assignment'}
                      </CardTitle>
                      <CardDescription>{lecture.attached_assignment?.description}</CardDescription>
                   </CardHeader>
                   <CardContent>
                      {lecture.attached_assignment?.requirements && (
                        <div className="space-y-3">
                           <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Key Requirements:</p>
                           <ul className="space-y-2">
                              {lecture.attached_assignment.requirements.map((req, i) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                   <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                   {req}
                                </li>
                              ))}
                           </ul>
                        </div>
                      )}
                   </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Submit your work</CardTitle>
                    <CardDescription>Provide the GitHub repository URL containing your implementation.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                       <div className="relative flex-1">
                          <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="https://github.com/your-username/repo-name"
                            className="pl-10"
                            value={githubUrl}
                            onChange={(e) => setGithubUrl(e.target.value)}
                            disabled={isAssignmentDone && !isFullyDone}
                          />
                       </div>
                       <Button
                         onClick={handleAssignmentSubmit}
                         disabled={!githubUrl.includes('github.com') || submittingId}
                       >
                         {submittingId ? '...' : isAssignmentDone ? 'Update URL' : 'Submit Assignment'}
                         {!submittingId && <Send className="ml-2 h-4 w-4" />}
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="animate-in zoom-in-95 duration-500">
                {lecture.attached_quiz ? (
                  <QuizModule
                    questions={lecture.attached_quiz}
                    onComplete={handleQuizComplete}
                  />
                ) : (
                  <div className="text-center py-20 text-muted-foreground">No quiz attached to this lecture.</div>
                )}
              </div>
            )}
          </div>

          {!isFocusMet && isTheoryDone && (
            <Alert className="bg-amber-50 border-amber-200 text-amber-800">
               <Clock className="h-4 w-4" />
               <AlertTitle className="font-bold uppercase tracking-widest text-[10px]">Focus Prerequisite</AlertTitle>
               <AlertDescription className="text-xs">
                 This lecture requires <strong>{lecture.required_focus_hours} hours</strong> of deep work to master.
                 You currently have <strong>{Math.round(totalFocusMinutes / 60 * 10) / 10} hours</strong>.
               </AlertDescription>
            </Alert>
          )}

          {isFullyDone && (
            <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 flex flex-col items-center text-center gap-4">
               <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-white" />
               </div>
               <div>
                  <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">Lecture Mastered!</h3>
                  <p className="text-green-600/80">You have completed all requirements for this module.</p>
               </div>
               <Button asChild variant="outline" className="border-green-500 text-green-700 hover:bg-green-500 hover:text-white">
                  <Link href="/curriculum">Continue learning</Link>
               </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
