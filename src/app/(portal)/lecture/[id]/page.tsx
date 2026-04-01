'use client';

import { useState, useEffect, useCallback, use, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { CurriculumItem, getEstimatedReadTime, extractHeadings } from '@/lib/curriculum';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Video,
  CheckCircle2,
  Github,
  Send,
  FileText,
  HelpCircle,
  Lock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  List,
  Clock,
  Sparkles,
  Zap,
  Link as LinkIcon,
  Terminal,
  ExternalLink,
  Bot,
  X,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuizModule } from '@/components/quiz';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CodeCompiler } from '@/components/code-compiler';
import { useChat } from '@/components/chat-context';
import { AIExplainSection } from '@/components/ai-explain-section';
import { AudioReader } from '@/components/audio-reader';
import { logActivityAction, rewardStudentAction } from '@/app/admin/actions';
import { RichTextEditor } from '@/components/rich-text-editor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface Submission {
  id: string;
  github_url: string;
  status: string;
  ai_score?: number;
  ai_feedback?: string;
  ai_sections?: {
    knowledge_check?: { score: number; feedback: string };
    assignment?: { score: number; feedback: string };
  };
  ai_mistakes?: string[];
  ai_improvements?: string[];
  completion_data: {
    theory_read?: boolean;
    quiz_completed?: boolean;
    quiz_score?: number;
    assignment_submitted?: boolean;
    knowledge_check_answers?: Record<string, string>;
  };
}

export default function LecturePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { setLectureData } = useChat();
  const [lecture, setLecture] = useState<CurriculumItem | null>(null);
  const [allCurriculum, setAllCurriculum] = useState<CurriculumItem[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');

  const [activeTab, setActiveTab] = useState<'theory' | 'video' | 'knowledge' | 'assignment' | 'quiz' | 'explain'>('theory');
  const [userPerks, setUserPerks] = useState<Record<string, unknown>[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [readTimeSeconds, setReadTimeSeconds] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  const isTheoryDone = submission?.completion_data?.theory_read;

  const effectiveReadMinutes = useMemo(() => {
    if (!lecture) return 0;
    // Use manual override if provided, otherwise calculate automatically
    if (lecture.required_read_minutes && lecture.required_read_minutes > 0) {
      return lecture.required_read_minutes;
    }
    return getEstimatedReadTime(lecture.theory_content);
  }, [lecture]);

  useEffect(() => {
    if (activeTab !== 'theory' || isTheoryDone || effectiveReadMinutes <= 0) return;

    const interval = setInterval(() => {
      setReadTimeSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTab, isTheoryDone, effectiveReadMinutes]);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: allCurr } = await supabase.from('curriculum').select('*');
      const sorted = (allCurr || []).sort((a, b) => {
        if (a.week !== b.week) return a.week - b.week;
        return (a.lecture_index || 0) - (b.lecture_index || 0);
      });
      setAllCurriculum(sorted as CurriculumItem[]);

      const { data: lectureData } = await supabase
        .from('curriculum')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (lectureData) {
        setLecture(lectureData as unknown as CurriculumItem);
        if (!lectureData.theory_content && lectureData.video_url) {
          setActiveTab('video');
        }
      }

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

      const { data: perks } = await supabase.from('user_perks').select('*').eq('user_id', user.id);
      setUserPerks(perks || []);
    } catch (err) {
      console.error('Error fetching lecture data:', err);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchData();
    if (resolvedParams.id) {
       logActivityAction('lecture_view', { lecture_id: resolvedParams.id }, `/lecture/${resolvedParams.id}`);
    }
  }, [fetchData, resolvedParams.id]);

  useEffect(() => {
    if (lecture) {
      setLectureData({
        id: lecture.id,
        title: lecture.title,
        content: lecture.theory_content || ''
      });
    }
    return () => setLectureData(null);
  }, [lecture, setLectureData]);

  const headings = useMemo(() => {
    if (Array.isArray(lecture?.content) && lecture.content.length > 0) {
      return lecture.content;
    }
    return extractHeadings(lecture?.theory_content);
  }, [lecture?.theory_content, lecture?.content]);

  useEffect(() => {
    if (activeTab !== 'theory') return;

    const handleScroll = () => {
      const element = document.documentElement;
      const scrollHeight = element.scrollHeight - element.clientHeight;
      if (scrollHeight <= 0) {
        setScrollProgress(100);
      } else {
        const scrolled = (element.scrollTop / scrollHeight) * 100;
        setScrollProgress(scrolled);
      }

      // Detect active heading
      const headingElements = headings.map(h => document.getElementById(h.id)).filter(Boolean);
      let currentActiveId = null;
      for (const el of headingElements) {
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150) {
            currentActiveId = el.id;
          } else {
            break;
          }
        }
      }
      setActiveHeadingId(currentActiveId || (headings[0]?.id || null));
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, headings]);

  const updateCompletion = async (newData: Record<string, unknown>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentData = (submission?.completion_data || {}) as Record<string, unknown>;
    const updatedData = { ...currentData, ...newData };

    // Check if everything is done
    const checks = lecture?.knowledge_checks || [];
    const answers = (updatedData.knowledge_check_answers as Record<string, string>) || {};
    const isKnowledgeCheckDone = checks.length > 0 ? checks.every(c => !!answers[c.id]) : true;

    const isTheoryDoneNow = !!updatedData.theory_read;
    const isQuizDone = lecture?.attached_quiz ? updatedData.quiz_completed : true;
    const isAssignmentDone = lecture?.attached_assignment ? (updatedData.assignment_submitted || !!githubUrl) : true;

    const isFullyCompleted = isTheoryDoneNow && isKnowledgeCheckDone && isQuizDone && isAssignmentDone;
    const wasAlreadyDone = submission?.status === 'submitted' || submission?.status === 'reviewed';

    const { error } = await supabase.from('submissions').upsert({
      student_id: user.id,
      curriculum_id: resolvedParams.id,
      github_url: githubUrl,
      completion_data: updatedData,
      status: isFullyCompleted ? 'submitted' : 'reviewed'
    }, { onConflict: 'student_id,curriculum_id' });

    if (!error) {
      if (isFullyCompleted && !wasAlreadyDone) {
         confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
         triggerAIReview(updatedData);
      }
      fetchData();
    }
  };

  const triggerAIReview = async (updatedData: { knowledge_check_answers?: Record<string, string> }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !lecture) return;

      const knowledgeChecks = lecture.knowledge_checks?.map(check => ({
        question: check.question,
        answer: updatedData.knowledge_check_answers?.[check.id] || ''
      })) || [];

      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubUrl: githubUrl,
          assignmentTitle: lecture.attached_assignment?.title || lecture.title,
          assignmentDescription: lecture.attached_assignment?.description || lecture.description,
          knowledgeChecks,
          lectureTitle: lecture.title
        })
      });

      if (response.ok) {
        const review = await response.json();

        // Save review to database
        await supabase.from('submissions').update({
          ai_score: review.score,
          ai_feedback: review.feedback,
          ai_status: review.status,
          ai_sections: review.sections,
          ai_mistakes: review.mistakes,
          ai_improvements: review.improvements,
          status: 'reviewed'
        }).eq('student_id', user.id).eq('curriculum_id', resolvedParams.id);

        // Award sparks: 20 score = 1 spark (1 spark = 10 XP)
        const sparks = Math.floor(review.score / 20);
        if (sparks > 0) {
          await rewardStudentAction(sparks * 10, `Lecture Mastery: ${lecture.title}`, 'lecture_completion', resolvedParams.id);
        }

        fetchData();
      }
    } catch (err) {
      console.error("AI Review Trigger Error:", err);
    }
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

  const isReadTimeMet = useMemo(() => {
    if (effectiveReadMinutes <= 0) return true;
    return readTimeSeconds >= (effectiveReadMinutes * 60);
  }, [effectiveReadMinutes, readTimeSeconds]);

  const knowledgeCheckAnswers = useMemo(() => {
    return (submission?.completion_data as Record<string, unknown>)?.knowledge_check_answers as Record<string, string> || {};
  }, [submission?.completion_data]);

  const isKnowledgeCheckMet = useMemo(() => {
    const checks = lecture?.knowledge_checks || [];
    if (checks.length === 0) return true;
    return checks.every(c => !!knowledgeCheckAnswers[c.id]);
  }, [lecture?.knowledge_checks, knowledgeCheckAnswers]);

  const isAssignmentDone = submission?.completion_data?.assignment_submitted || !!submission?.github_url;
  const isQuizDone = submission?.completion_data?.quiz_completed;
  const isFullyDone = isTheoryDone && isKnowledgeCheckMet && (lecture?.attached_assignment ? isAssignmentDone : true) && (lecture?.attached_quiz ? isQuizDone : true);

  const prevItem = useMemo(() => {
    if (!lecture) return null;
    const idx = allCurriculum.findIndex(i => i.id === lecture.id);
    return idx > 0 ? allCurriculum[idx - 1] : null;
  }, [allCurriculum, lecture]);

  const nextItem = useMemo(() => {
    if (!lecture) return null;
    const idx = allCurriculum.findIndex(i => i.id === lecture.id);
    return idx < allCurriculum.length - 1 ? allCurriculum[idx + 1] : null;
  }, [allCurriculum, lecture]);

  const isNextUnlocked = useMemo(() => {
    if (!nextItem) return false;
    return isFullyDone; // Current must be done to unlock next
  }, [nextItem, isFullyDone]);

  if (loading) return (
    <main className="flex-1 p-4 md:p-12 lg:p-16 flex items-center justify-center animate-pulse text-muted-foreground">
      Loading Lecture Content...
    </main>
  );
  if (!lecture) return (
    <main className="flex-1 p-8 text-center text-red-500">
      Lecture not found.
    </main>
  );

  const MarkdownComponents = {
    h1: ({ children }: { children?: React.ReactNode }) => {
      const id = children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || '';
      return <h1 id={id} className="text-4xl font-black mt-12 mb-6 text-slate-800 dark:text-white pb-2 border-b-2 border-slate-100 dark:border-slate-800">{children}</h1>;
    },
    h2: ({ children }: { children?: React.ReactNode }) => {
      const id = children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || '';
      return <h2 id={id} className="text-3xl font-extrabold mt-10 mb-5 text-slate-700 dark:text-slate-100 pb-1 border-b border-slate-100 dark:border-slate-800">{children}</h2>;
    },
    h3: ({ children }: { children?: React.ReactNode }) => {
      const id = children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || '';
      return <h3 id={id} className="text-2xl font-bold mt-8 mb-4 text-slate-700 dark:text-slate-200">{children}</h3>;
    },
    p: ({ children }: { children?: React.ReactNode }) => <p className="text-lg leading-relaxed mb-6 text-slate-500 dark:text-slate-400 font-normal">{children}</p>,
    ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-none pl-2 mb-8 space-y-4">{children}</ul>,
    ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-8 mb-8 space-y-4 text-lg font-normal text-slate-500 dark:text-slate-400">{children}</ol>,
    li: ({ children, ordered, node }: { children?: React.ReactNode; ordered?: boolean; node?: Record<string, unknown> }) => {
      // Check if it's a task list item
      const childrenNodes = (node?.children as Record<string, unknown>[]) || [];
      const isTask = childrenNodes.some((c) => c.tagName === 'input');

      if (isTask) {
        return <li className="text-lg flex items-start gap-3 mb-2">{children}</li>;
      }

      return (
        <li className="text-lg flex items-start gap-3 mb-2">
          {!ordered && <div className="h-2 w-2 rounded-full bg-primary mt-2.5 shrink-0" />}
          <span className="text-slate-500 dark:text-slate-400 font-normal">{children}</span>
        </li>
      );
    },
    strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold text-slate-800 dark:text-white">{children}</strong>,
    em: ({ children }: { children?: React.ReactNode }) => <em className="italic text-primary/80 font-normal">{children}</em>,
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 font-bold underline decoration-blue-600/30 hover:decoration-blue-600 transition-all underline-offset-4"
      >
        {children}
      </a>
    ),
    code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) => (
      inline
        ? <code className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-sm font-black font-mono">{children}</code>
        : <div className="relative my-8 group">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
            <pre className="relative bg-slate-900 text-slate-50 p-6 rounded-xl overflow-x-auto font-mono text-sm border border-slate-800 shadow-2xl">
              <code>{children}</code>
            </pre>
          </div>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-8 border-primary bg-primary/5 p-6 rounded-r-2xl italic my-8 text-xl text-slate-700 dark:text-slate-300 font-medium shadow-inner">
        {children}
      </blockquote>
    ),
    img: ({ src, alt }: { src?: string; alt?: string }) => (
      <div className="my-10 text-center">
        <img src={src} alt={alt} className="rounded-3xl shadow-2xl mx-auto border-4 border-white dark:border-slate-800 max-w-full h-auto" />
        {alt && <p className="mt-4 text-sm text-muted-foreground font-bold italic">Above: {alt}</p>}
      </div>
    ),
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="my-8 overflow-x-auto border rounded-xl shadow-sm">
        <table className="w-full text-left border-collapse">{children}</table>
      </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => <thead className="bg-slate-50 dark:bg-slate-800/50">{children}</thead>,
    th: ({ children }: { children?: React.ReactNode }) => <th className="p-4 border-b font-bold text-slate-900 dark:text-white uppercase text-xs tracking-wider">{children}</th>,
    td: ({ children }: { children?: React.ReactNode }) => <td className="p-4 border-b text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal">{children}</td>,
  };

  const isDirectVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|mov)$/) || url.includes('supabase.co/storage/v1/object/public/curriculum-videos/');
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    if (url.includes('vimeo.com/')) {
      return url.replace('vimeo.com/', 'player.vimeo.com/video/');
    }
    return url;
  };

  return (
    <main className="flex-1 p-4 md:p-12 lg:p-16 w-full overflow-x-hidden">
      <div className="fixed top-0 left-0 right-0 h-1 bg-primary/20 z-[60] lg:hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${scrollProgress}%` }}
        />
      </div>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/curriculum" className="hidden md:flex text-sm items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                 <ArrowRight className="h-4 w-4 rotate-180" /> Back to Curriculum
              </Link>
              {lecture.theory_content && <AudioReader content={lecture.theory_content} />}
            </div>

            <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
               {prevItem && (
                 <Button variant="outline" size="sm" asChild>
                   <Link href={`/lecture/${prevItem.id}`}>
                     <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                   </Link>
                 </Button>
               )}
               {nextItem && (
                 <Button
                   variant={isNextUnlocked ? "default" : "secondary"}
                   size="sm"
                   asChild={isNextUnlocked}
                   disabled={!isNextUnlocked}
                   className={!isNextUnlocked ? "opacity-50 cursor-not-allowed" : ""}
                 >
                   {isNextUnlocked ? (
                     <Link href={`/lecture/${nextItem.id}`}>
                       Next <ChevronRight className="h-4 w-4 ml-1" />
                     </Link>
                   ) : (
                     <span className="flex items-center">
                       Next <Lock className="h-3 w-3 ml-1" />
                     </span>
                   )}
                 </Button>
               )}
            </div>
          </div>

          <header className="space-y-4">
            <div className="flex justify-between items-start">
               <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary/10 text-primary border-none uppercase text-[10px] font-bold">Lecture</Badge>
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">Module {lecture.week} • {lecture.day}</Badge>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">{lecture.title}</h1>
               </div>
               {isFullyDone && (
                 <Badge className="bg-green-600 px-4 py-2 text-sm gap-2 animate-in zoom-in-50 duration-500">
                   <CheckCircle2 className="h-4 w-4" /> COMPLETED
                 </Badge>
               )}
            </div>
            <div className="flex justify-between items-start gap-6">
              <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">{lecture.description}</p>
              {userPerks.find(p => p.perk_id === 'lecture_hint') && (
                <Button
                  variant="outline"
                  className="rounded-xl border-amber-200 bg-amber-50 text-amber-700 font-bold gap-2 hover:bg-amber-100"
                  onClick={() => setShowHint(!showHint)}
                >
                  <HelpCircle className="h-4 w-4" /> {showHint ? 'Hide Hint' : 'Use Hint Perk'}
                </Button>
              )}
            </div>
            {showHint && (
               <motion.div
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="p-6 bg-amber-500/10 border-2 border-amber-500/20 rounded-2xl"
               >
                  <div className="flex items-center gap-2 text-amber-700 font-black uppercase text-xs mb-2">
                     <Zap className="h-4 w-4 fill-amber-500" /> Pro Learning Hint
                  </div>
                  <p className="text-amber-900 font-medium">
                     Focus on the core architecture of this module. A key tip: {lecture.title} often relies on understanding how data flows between components. Check the external resources for a cheat sheet!
                  </p>
               </motion.div>
            )}
          </header>

          <div className="flex gap-2 border-b pb-px overflow-x-auto no-scrollbar sticky top-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md z-10 pt-2">
            {lecture.theory_content && (
              <Button
                variant="ghost"
                className={cn(
                  "rounded-none border-b-2 px-6 h-12 text-sm font-bold uppercase tracking-wider transition-all",
                  activeTab === 'theory' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground"
                )}
                onClick={() => setActiveTab('theory')}
              >
                <FileText className="h-4 w-4 mr-2" /> Theory
                {isTheoryDone && <CheckCircle2 className="h-3 w-3 ml-2 text-green-600" />}
              </Button>
            )}

            <Button
              variant="ghost"
              className={cn(
                "rounded-none border-b-2 px-6 h-12 text-sm font-bold uppercase tracking-wider transition-all",
                activeTab === 'explain' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground"
              )}
              onClick={() => setActiveTab('explain')}
            >
              <Sparkles className="h-4 w-4 mr-2" /> AI Explain
            </Button>

            {lecture.knowledge_checks && lecture.knowledge_checks.length > 0 && (
              <Button
                variant="ghost"
                className={cn(
                  "rounded-none border-b-2 px-6 h-12 text-sm font-bold uppercase tracking-wider transition-all",
                  activeTab === 'knowledge' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground",
                  !isTheoryDone && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => isTheoryDone && setActiveTab('knowledge')}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Knowledge Check
                {isKnowledgeCheckMet && <CheckCircle2 className="h-3 w-3 ml-2 text-green-600" />}
              </Button>
            )}

            {lecture.video_url && (
              <Button
                variant="ghost"
                className={cn(
                  "rounded-none border-b-2 px-6 h-12 text-sm font-bold uppercase tracking-wider transition-all",
                  activeTab === 'video' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground"
                )}
                onClick={() => setActiveTab('video')}
              >
                <Video className="h-4 w-4 mr-2" /> Video Lecture
              </Button>
            )}

            {lecture.attached_assignment && (
              <Button
                variant="ghost"
                className={cn(
                  "rounded-none border-b-2 px-6 h-12 text-sm font-bold uppercase tracking-wider transition-all",
                  activeTab === 'assignment' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground",
                  !isTheoryDone && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => isTheoryDone && setActiveTab('assignment')}
              >
                <Github className="h-4 w-4 mr-2" /> Assignment
                {isAssignmentDone && <CheckCircle2 className="h-3 w-3 ml-2 text-green-600" />}
              </Button>
            )}

            {lecture.attached_quiz && (
              <Button
                variant="ghost"
                className={cn(
                  "rounded-none border-b-2 px-6 h-12 text-sm font-bold uppercase tracking-wider transition-all",
                  activeTab === 'quiz' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground",
                  (!isTheoryDone || (lecture.attached_assignment && !isAssignmentDone)) && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => isTheoryDone && (!lecture.attached_assignment || isAssignmentDone) && setActiveTab('quiz')}
              >
                <HelpCircle className="h-4 w-4 mr-2" /> Quiz
                {isQuizDone && <CheckCircle2 className="h-3 w-3 ml-2 text-green-600" />}
              </Button>
            )}
          </div>

          <div className="min-h-[500px] animate-in fade-in duration-700">
            {activeTab === 'theory' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-8">
                  {lecture.enable_compiler && (
                    <div className="space-y-4">
                       <h3 className="text-xl font-bold flex items-center gap-2">
                         <Terminal className="h-5 w-5" /> Interactive Sandbox
                       </h3>
                       <CodeCompiler
                         initialHtml={lecture.compiler_initial_code?.html}
                         initialCss={lecture.compiler_initial_code?.css}
                         initialJs={lecture.compiler_initial_code?.js}
                       />
                    </div>
                  )}

                  <Card className="border-none shadow-none bg-transparent">
                    <CardContent className="p-0 space-y-6">
                      <div className="max-w-none bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl border shadow-sm transition-all hover:shadow-md">
                        {headings.length > 0 && (
                          <div className="mb-12 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-4 text-slate-400">
                               <List className="h-4 w-4" />
                               <span className="text-xs font-black uppercase tracking-widest">In this lecture</span>
                            </div>
                            <div className="flex flex-col gap-2">
                              {headings.map((h, i) => {
                                const isActive = activeHeadingId === h.id;
                                return (
                                  <a
                                    key={i}
                                    href={`#${h.id}`}
                                    className={cn(
                                      "text-sm transition-all duration-300 flex items-center gap-2 py-1",
                                      h.level === 1 ? "font-bold" :
                                      h.level === 2 ? "pl-4 ml-1 border-l-2" :
                                      "pl-8 ml-1 border-l italic",
                                      isActive
                                        ? "text-primary border-primary scale-[1.02] translate-x-1"
                                        : "text-slate-500 hover:text-primary/70 border-slate-200 dark:border-slate-800"
                                    )}
                                  >
                                    {h.level === 1 && (
                                      <div className={cn(
                                        "h-1.5 w-1.5 rounded-full shrink-0 transition-all",
                                        isActive ? "bg-primary scale-125 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-primary/30"
                                      )} />
                                    )}
                                    {h.text}
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {lecture.theory_content ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={MarkdownComponents as Record<string, unknown>}
                          >
                            {lecture.theory_content}
                          </ReactMarkdown>
                        ) : (
                          <div className="py-20 text-center text-muted-foreground italic">
                            No theory content provided for this lecture yet.
                          </div>
                        )}
                      </div>
                      {!isTheoryDone && (
                        <div className="space-y-4">
                          {!isReadTimeMet && effectiveReadMinutes > 0 && (
                            <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-500">
                              <div className="relative h-32 w-32">
                                <svg className="h-full w-full" viewBox="0 0 100 100">
                                  <circle
                                    className="text-primary/10 stroke-current"
                                    strokeWidth="8"
                                    fill="transparent"
                                    r="40"
                                    cx="50"
                                    cy="50"
                                  />
                                  <motion.circle
                                    className="text-primary stroke-current"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    fill="transparent"
                                    r="40"
                                    cx="50"
                                    cy="50"
                                    initial={{ strokeDasharray: "251.2", strokeDashoffset: "251.2" }}
                                    animate={{ strokeDashoffset: 251.2 - (251.2 * Math.min(1, readTimeSeconds / (effectiveReadMinutes * 60))) }}
                                    transition={{ duration: 0.5, ease: "linear" }}
                                    style={{ transformOrigin: "50% 50%", transform: "rotate(-90deg)" }}
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                   <Clock className="h-6 w-6 text-primary mb-1 animate-pulse" />
                                   <span className="text-xl font-black tabular-nums">
                                      {Math.max(0, Math.ceil((effectiveReadMinutes * 60 - readTimeSeconds) / 60))}m
                                   </span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <h4 className="text-xl font-black uppercase tracking-tight">Theory Lock Active</h4>
                                <p className="text-sm text-muted-foreground max-w-xs font-medium">
                                  This lecture requires at least <span className="text-primary font-bold">{effectiveReadMinutes} minutes</span> of deep reading to ensure mastery of the concepts.
                                </p>
                              </div>
                            </div>
                          )}
                          <Button
                            onClick={() => {
                               updateCompletion({ theory_read: true });
                               logActivityAction('theory_mastered', { lecture_id: resolvedParams.id }, `/lecture/${resolvedParams.id}`);
                               if (lecture?.knowledge_checks?.length) setActiveTab('knowledge');
                               else if (lecture?.attached_assignment) setActiveTab('assignment');
                               else if (lecture?.attached_quiz) setActiveTab('quiz');
                            }}
                            disabled={!isReadTimeMet}
                            size="lg"
                            className={cn(
                              "w-full h-24 text-xl font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 group",
                              isReadTimeMet
                                ? "bg-primary hover:bg-primary/90 shadow-primary/20 hover:scale-[1.01]"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50 grayscale shadow-none"
                            )}
                          >
                            {isReadTimeMet ? (
                              <div className="flex items-center gap-3">
                                <span>I have mastered the theory</span>
                                <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-2">
                                  <Lock className="h-5 w-5" />
                                  <span>Reading in progress</span>
                                </div>
                                <span className="text-[10px] font-bold opacity-60 tracking-[0.2em] mt-1 italic">
                                  {Math.floor(readTimeSeconds / 60)}m / {effectiveReadMinutes}m COMPLETE
                                </span>
                              </div>
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="hidden lg:block space-y-6">
                   <div className="sticky top-24 space-y-6">
                      <Card className="bg-primary/5 border-primary/10 overflow-hidden">
                        <CardHeader className="p-4 bg-primary/10">
                          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                             <Clock className="h-3 w-3" /> Focus Hours
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                           <div className="text-2xl font-black">{lecture.required_focus_hours || 0}h</div>
                           <p className="text-[10px] text-muted-foreground uppercase mt-1">Required focus for this lecture</p>
                        </CardContent>
                      </Card>

                      {lecture.external_resources && lecture.external_resources.length > 0 && (
                        <Card className="bg-slate-900 text-white border-none overflow-hidden shadow-xl">
                           <CardHeader className="p-4 bg-white/5 border-b border-white/10">
                              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                                 <ExternalLink className="h-3 w-3" /> Resources
                              </CardTitle>
                           </CardHeader>
                           <CardContent className="p-4 space-y-3">
                              {lecture.external_resources.map((res, i) => (
                                <a
                                  key={i}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                                >
                                   <div className="h-8 w-8 rounded-md bg-white/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                                      <LinkIcon className="h-4 w-4" />
                                   </div>
                                   <div className="flex-1 min-w-0">
                                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">{res.title}</div>
                                      <div className="text-[9px] text-slate-500 truncate">{res.url}</div>
                                   </div>
                                </a>
                              ))}
                           </CardContent>
                        </Card>
                      )}

                      {effectiveReadMinutes > 0 && (
                        <Card className={cn(
                          "overflow-hidden transition-all",
                          isReadTimeMet ? "bg-green-500/5 border-green-500/20" : "bg-blue-500/5 border-blue-500/20"
                        )}>
                          <CardHeader className={cn(
                            "p-4",
                            isReadTimeMet ? "bg-green-500/10" : "bg-blue-500/10"
                          )}>
                            <CardTitle className={cn(
                              "text-xs font-black uppercase tracking-widest flex items-center gap-2",
                              isReadTimeMet ? "text-green-600" : "text-blue-600"
                            )}>
                               <FileText className="h-3 w-3" /> Reading Goal
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                             <div className="flex items-baseline gap-1">
                               <span className="text-2xl font-black tabular-nums">{Math.floor(readTimeSeconds / 60)}</span>
                               <span className="text-muted-foreground font-bold">/ {effectiveReadMinutes}m</span>
                             </div>
                             <div className="mt-2 h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full transition-all duration-1000",
                                    isReadTimeMet ? "bg-green-500" : "bg-blue-500"
                                  )}
                                  style={{ width: `${Math.min(100, (readTimeSeconds / (effectiveReadMinutes * 60)) * 100)}%` }}
                                />
                             </div>
                          </CardContent>
                        </Card>
                      )}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'knowledge' && (
              <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
                 <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black uppercase tracking-tight">Knowledge Check</h2>
                    <p className="text-muted-foreground">Answer the following questions to demonstrate your understanding.</p>
                 </div>

                 <div className="space-y-16">
                    {lecture.knowledge_checks?.map((check, idx) => (
                      <div key={check.id} className="space-y-6">
                         <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black shrink-0">
                               {idx + 1}
                            </div>
                            <div className="flex-1 pt-1">
                               <div className="prose prose-slate dark:prose-invert max-w-none mb-6">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                     {check.question}
                                  </ReactMarkdown>
                               </div>

                               <RichTextEditor
                                  content={knowledgeCheckAnswers[check.id] || ''}
                                  onChange={(content) => {
                                     setSubmission(prev => {
                                        if (!prev) return null;
                                        const currentCompletion = (prev.completion_data as Record<string, unknown>) || {};
                                        const currentAnswers = (currentCompletion.knowledge_check_answers as Record<string, string>) || {};
                                        return {
                                           ...prev,
                                           completion_data: {
                                              ...currentCompletion,
                                              knowledge_check_answers: {
                                                 ...currentAnswers,
                                                 [check.id]: content
                                              }
                                           }
                                        } as unknown as Submission;
                                     });
                                  }}
                                  placeholder="Type your answer here..."
                               />
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="pt-12 border-t flex flex-col items-center gap-6">
                    <Button
                       size="lg"
                       className="h-16 px-12 rounded-2xl font-black uppercase tracking-widest shadow-xl"
                       disabled={!isKnowledgeCheckMet}
                       onClick={() => {
                          updateCompletion({
                             knowledge_check_answers: knowledgeCheckAnswers
                          });
                          if (lecture?.attached_assignment) setActiveTab('assignment');
                          else if (lecture?.attached_quiz) setActiveTab('quiz');
                       }}
                    >
                       {isKnowledgeCheckMet ? (
                          <div className="flex items-center gap-3">
                             <span>Confirm Answers</span>
                             <CheckCircle2 className="h-5 w-5" />
                          </div>
                       ) : (
                          <div className="flex items-center gap-2">
                             <Lock className="h-4 w-4" />
                             <span>Complete all questions to proceed</span>
                          </div>
                       )}
                    </Button>
                    {!isKnowledgeCheckMet && (
                       <p className="text-xs text-muted-foreground font-bold uppercase animate-pulse">
                          All questions must be answered to continue.
                       </p>
                    )}
                 </div>
              </div>
            )}

            {activeTab === 'video' && (
              <div className="space-y-6 animate-in zoom-in-95 duration-500">
                <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl bg-black border-4 border-white dark:border-slate-800 flex items-center justify-center">
                  {lecture.video_url && isDirectVideo(lecture.video_url) ? (
                    <video
                      src={lecture.video_url}
                      controls
                      className="w-full h-full"
                      poster={lecture.video_url.replace(/\.[^/.]+$/, ".jpg")} // Fallback poster attempt
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <iframe
                      src={getEmbedUrl(lecture.video_url || '')}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  )}
                </div>
                <Card className="bg-white dark:bg-slate-900 border shadow-sm p-6 rounded-2xl">
                   <h3 className="text-xl font-bold mb-2">Video Overview</h3>
                   <p className="text-muted-foreground">{lecture.description}</p>
                </Card>
              </div>
            )}

            {activeTab === 'assignment' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
                <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/10 rounded-3xl overflow-hidden border-none shadow-lg">
                   <CardHeader className="bg-blue-600 text-white p-8">
                      <CardTitle className="flex items-center gap-3 text-2xl mb-4">
                        <Github className="h-8 w-8" />
                        {lecture.attached_assignment?.title || 'Lecture Assignment'}
                      </CardTitle>
                      <div className="prose prose-invert max-w-none">
                         <ReactMarkdown
                           remarkPlugins={[remarkGfm]}
                           rehypePlugins={[rehypeRaw]}
                           components={{
                             p: ({ children }) => <p className="text-lg leading-relaxed mb-4 text-blue-50 font-medium">{children}</p>,
                             h1: ({ children }) => <h1 className="text-2xl font-black mb-4 text-white uppercase tracking-tight">{children}</h1>,
                             h2: ({ children }) => <h2 className="text-xl font-extrabold mb-3 text-white">{children}</h2>,
                             h3: ({ children }) => <h3 className="text-lg font-bold mb-2 text-white">{children}</h3>,
                             strong: ({ children }) => <strong className="font-bold text-white underline decoration-white/30">{children}</strong>,
                             a: ({ href, children }) => (
                               <a href={href} target="_blank" rel="noopener noreferrer" className="text-white font-black underline underline-offset-4 decoration-white/50 hover:decoration-white transition-all">
                                 {children}
                               </a>
                             ),
                             ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-2 text-blue-50">{children}</ul>,
                             li: ({ children }) => <li className="text-blue-50">{children}</li>,
                           }}
                         >
                            {lecture.attached_assignment?.description || ''}
                         </ReactMarkdown>
                      </div>
                   </CardHeader>
                   <CardContent className="p-8 space-y-6 bg-white dark:bg-slate-900">
                      {lecture.attached_assignment?.requirements && (
                        <div className="space-y-4">
                           <p className="text-sm font-black uppercase tracking-widest text-slate-400">Implementation Checklist:</p>
                           <div className="grid grid-cols-1 gap-3">
                              {lecture.attached_assignment.requirements.map((req, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                   <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i+1}</div>
                                   <span className="text-slate-700 dark:text-slate-300 font-medium">{req}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}
                   </CardContent>
                </Card>

                <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl">Submission Portal</CardTitle>
                    <CardDescription>Deploy your code to GitHub and share the repository link below.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <div className="flex flex-col md:flex-row gap-4">
                       <div className="relative flex-1">
                          <Github className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                          <Input
                            placeholder="https://github.com/username/repository"
                            className="pl-12 h-14 rounded-2xl border-slate-200 focus:ring-primary"
                            value={githubUrl}
                            onChange={(e) => setGithubUrl(e.target.value)}
                            disabled={isAssignmentDone && isFullyDone}
                          />
                       </div>
                       <Button
                         size="lg"
                         className="h-14 px-8 rounded-2xl font-bold"
                         onClick={handleAssignmentSubmit}
                         disabled={!githubUrl.includes('github.com') || submittingId || isFullyDone}
                       >
                         {submittingId ? 'Submitting...' : isAssignmentDone ? 'Submission Locked' : 'Ship Assignment'}
                         {!submittingId && <Send className="ml-2 h-4 w-4" />}
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="animate-in zoom-in-95 duration-500 max-w-2xl mx-auto">
                {lecture.attached_quiz ? (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border">
                    <QuizModule
                      key={submission?.completion_data?.quiz_completed ? 'done' : 'new'}
                      questions={lecture.attached_quiz}
                      onComplete={handleQuizComplete}
                      canRetake={userPerks.some(p => p.perk_id === 'quiz_retake')}
                      onRetake={async () => {
                         const { data: { user } } = await supabase.auth.getUser();
                         if (user) {
                           await supabase.from('user_perks').delete().eq('user_id', user.id).eq('perk_id', 'quiz_retake').limit(1);
                           const newData = { ...submission?.completion_data, quiz_completed: false };
                           await supabase.from('submissions').update({ completion_data: newData }).eq('student_id', user.id).eq('curriculum_id', resolvedParams.id);
                           fetchData();
                         }
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-20 text-muted-foreground bg-slate-100 rounded-3xl border-2 border-dashed">No quiz required for this lecture.</div>
                )}
              </div>
            )}

            {activeTab === 'explain' && (
              <AIExplainSection
                lectureId={lecture.id}
                lectureTitle={lecture.title}
                lectureContent={lecture.theory_content || ''}
              />
            )}
          </div>

          {isFullyDone && (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
               {submission?.status === 'reviewed' && submission?.ai_score !== undefined ? (
                 <Card className="overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 rounded-3xl">
                    <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-8">
                       <div className="flex justify-between items-center">
                          <div>
                             <CardTitle className="text-3xl font-black uppercase tracking-tight">Lecture Mastered!</CardTitle>
                             <CardDescription className="text-emerald-50 text-lg">Your performance has been reviewed by AI.</CardDescription>
                          </div>
                          <div className="text-center">
                             <div className="text-5xl font-black">{submission.ai_score}</div>
                             <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Final Score</div>
                          </div>
                       </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {submission.ai_sections?.knowledge_check && (
                             <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                   <h4 className="font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                      <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Knowledge Check
                                   </h4>
                                   <Badge variant="secondary">{submission.ai_sections.knowledge_check.score}/100</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground italic">{submission.ai_sections.knowledge_check.feedback}</p>
                             </div>
                          )}
                          {submission.ai_sections?.assignment && (
                             <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                   <h4 className="font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                      <Github className="h-5 w-5 text-blue-500" /> Assignment
                                   </h4>
                                   <Badge variant="secondary">{submission.ai_sections.assignment.score}/100</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground italic">{submission.ai_sections.assignment.feedback}</p>
                             </div>
                          )}
                       </div>

                       {submission.ai_mistakes && submission.ai_mistakes.length > 0 && (
                          <div className="space-y-4">
                             <h4 className="font-black text-xs uppercase tracking-widest text-red-500 flex items-center gap-2">
                                <X className="h-4 w-4" /> Identified Mistakes
                             </h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {submission.ai_mistakes.map((m, i) => (
                                   <div key={i} className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-sm text-red-800 dark:text-red-300 font-medium">
                                      {m}
                                   </div>
                                ))}
                             </div>
                          </div>
                       )}

                       {submission.ai_improvements && submission.ai_improvements.length > 0 && (
                          <div className="space-y-4">
                             <h4 className="font-black text-xs uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" /> Suggested Improvements
                             </h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {submission.ai_improvements.map((m, i) => (
                                   <div key={i} className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                                      {m}
                                   </div>
                                ))}
                             </div>
                          </div>
                       )}

                       <div className="pt-8 border-t flex flex-col items-center gap-4">
                          <div className="flex items-center gap-2 text-amber-600 font-black uppercase tracking-widest">
                             <Zap className="h-6 w-6 fill-amber-500" /> +{Math.floor(submission.ai_score / 20)} Student Sparks Earned
                          </div>
                          <Button asChild size="lg" className="rounded-2xl px-12 h-16 text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                             <Link href="/curriculum">Continue to Next Lecture</Link>
                          </Button>
                       </div>
                    </CardContent>
                 </Card>
               ) : (
                 <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border flex flex-col items-center text-center gap-6 shadow-xl">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                       <Bot className="h-12 w-12" />
                    </div>
                    <div>
                       <h3 className="text-3xl font-black uppercase tracking-tight">AI Review in Progress</h3>
                       <p className="text-muted-foreground max-w-md mx-auto mt-2">Our AI is currently analyzing your work and generating personalized feedback. This usually takes about 10-15 seconds.</p>
                    </div>
                    <div className="flex gap-2">
                       <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                       <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                       <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>

    </main>
  );
}
