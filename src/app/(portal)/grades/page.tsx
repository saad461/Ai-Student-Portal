'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CurriculumItem } from '@/lib/curriculum';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, CheckCircle2, Github, X, TrendingUp, Zap, Clock, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/skeletons';

interface Submission {
  id: string;
  curriculum_id: string;
  status: string;
  ai_score?: number;
  ai_feedback?: string;
  ai_sections?: {
    knowledge_check?: { score: number; feedback: string };
    assignment?: { score: number; feedback: string };
  };
  ai_mistakes?: string[];
  ai_improvements?: string[];
  manual_sections?: Record<string, Record<string, string>>;
  submitted_at: string;
}

export default function GradesPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [ { data: subs }, { data: curr } ] = await Promise.all([
        supabase.from('submissions').select('*').eq('student_id', user.id).order('submitted_at', { ascending: false }),
        supabase.from('curriculum').select('*')
      ]);

      setSubmissions((subs as Submission[]) || []);
      setCurriculum((curr as CurriculumItem[]) || []);
    } catch (err) {
      console.error('Error fetching grades data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <main className="flex-1 p-8"><DashboardSkeleton /></main>;

  const reviewedSubmissions = submissions.filter(s => s.status === 'reviewed' && s.ai_score !== undefined);
  const averageScore = reviewedSubmissions.length > 0
    ? Math.round(reviewedSubmissions.reduce((acc, s) => acc + (s.ai_score || 0), 0) / reviewedSubmissions.length)
    : 0;

  const totalSparks = reviewedSubmissions.reduce((acc, s) => acc + Math.floor((s.ai_score || 0) / 20), 0);

  return (
    <main className="flex-1 p-4 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-black uppercase tracking-tight">Academic Performance</h1>
          <p className="text-muted-foreground font-medium">Track your progress, scores, and AI feedback across the curriculum.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-primary/5 border-primary/10">
            <CardHeader className="p-6">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" /> Average Grade
              </CardTitle>
              <div className="mt-2 text-4xl font-black text-primary">{averageScore}%</div>
            </CardHeader>
          </Card>
          <Card className="bg-amber-500/5 border-amber-500/10">
            <CardHeader className="p-6">
              <CardTitle className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                <Zap className="h-4 w-4 fill-amber-500" /> Mastery Sparks
              </CardTitle>
              <div className="mt-2 text-4xl font-black text-amber-600">{totalSparks}</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-6">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Units Completed
              </CardTitle>
              <div className="mt-2 text-4xl font-black">{reviewedSubmissions.length}</div>
            </CardHeader>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tighter">
            <BookOpen className="h-5 w-5" /> Submission History
          </h2>

          {submissions.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed rounded-3xl text-muted-foreground font-medium italic">
              No submissions found. Complete your first lecture to see your grades!
            </div>
          ) : (
            <div className="space-y-6">
              {submissions.map((sub) => {
                const lecture = curriculum.find(c => c.id === sub.curriculum_id);
                if (!lecture) return null;

                return (
                  <Card key={sub.id} className="overflow-hidden group hover:border-primary/30 transition-all">
                    <CardHeader className="p-6 bg-slate-50 dark:bg-slate-900 border-b">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <Badge variant="outline" className="text-[10px] font-bold">MODULE {lecture.week}</Badge>
                             <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                <Clock className="h-3 w-3 inline mr-1" /> {new Date(sub.submitted_at).toLocaleDateString()}
                             </span>
                          </div>
                          <CardTitle className="text-xl font-bold">{lecture.title}</CardTitle>
                        </div>
                        <div className="flex items-center gap-4">
                           {sub.ai_score !== undefined && (
                              <div className="text-right">
                                 <div className="text-2xl font-black text-primary">{sub.ai_score}%</div>
                                 <div className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">AI Score</div>
                              </div>
                           )}
                           <Badge className={cn(
                             sub.status === 'reviewed' ? 'bg-emerald-600' : 'bg-amber-500'
                           )}>
                              {sub.status.toUpperCase()}
                           </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    {sub.status === 'reviewed' && sub.ai_feedback && (
                      <CardContent className="p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 italic text-sm font-medium">
                           &ldquo;{sub.ai_feedback}&rdquo;
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {sub.ai_sections?.knowledge_check && (
                              <div className="space-y-2">
                                 <div className="flex justify-between items-center font-bold text-sm">
                                    <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Knowledge Check</span>
                                    <span className="text-muted-foreground">{sub.ai_sections.knowledge_check.score}/100</span>
                                 </div>
                                 <p className="text-xs text-muted-foreground leading-relaxed">{sub.ai_sections.knowledge_check.feedback}</p>
                                 {sub.manual_sections && Object.keys(sub.manual_sections).filter(k => k !== 'assignment').length > 0 && (
                                    <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30 space-y-3">
                                       <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Question Feedback</div>
                                       {Object.entries(sub.manual_sections).filter(([k]) => k !== 'assignment').map(([qId, val]) => (
                                          (val.mistakes || val.improvements) && (
                                             <div key={qId} className="space-y-1">
                                                {val.mistakes && <p className="text-[11px] text-red-600 dark:text-red-400"><strong>Mistake:</strong> {val.mistakes}</p>}
                                                {val.improvements && <p className="text-[11px] text-emerald-600 dark:text-emerald-400"><strong>Tip:</strong> {val.improvements}</p>}
                                             </div>
                                          )
                                       ))}
                                    </div>
                                 )}
                              </div>
                           )}
                           {sub.ai_sections?.assignment && (
                              <div className="space-y-2">
                                 <div className="flex justify-between items-center font-bold text-sm">
                                    <span className="flex items-center gap-2"><Github className="h-4 w-4 text-blue-500" /> GitHub Assignment</span>
                                    <span className="text-muted-foreground">{sub.ai_sections.assignment.score}/100</span>
                                 </div>
                                 <p className="text-xs text-muted-foreground leading-relaxed">{sub.ai_sections.assignment.feedback}</p>
                                 {sub.manual_sections?.assignment && (
                                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 space-y-2">
                                       <div className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">Instructor Review</div>
                                       {sub.manual_sections.assignment.mistakes && <p className="text-[11px] text-red-600 dark:text-red-400"><strong>Mistakes:</strong> {sub.manual_sections.assignment.mistakes}</p>}
                                       {sub.manual_sections.assignment.improvements && <p className="text-[11px] text-emerald-600 dark:text-emerald-400"><strong>Improvements:</strong> {sub.manual_sections.assignment.improvements}</p>}
                                    </div>
                                 )}
                              </div>
                           )}
                        </div>

                        {(sub.ai_mistakes || sub.ai_improvements) && (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                              {sub.ai_mistakes && sub.ai_mistakes.length > 0 && (
                                 <div className="space-y-2">
                                    <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                                       <X className="h-3 w-3" /> Identified Mistakes
                                    </h4>
                                    <ul className="space-y-1">
                                       {sub.ai_mistakes.map((m, i) => (
                                          <li key={i} className="text-xs font-medium text-slate-600 dark:text-slate-400">• {m}</li>
                                       ))}
                                    </ul>
                                 </div>
                              )}
                              {sub.ai_improvements && sub.ai_improvements.length > 0 && (
                                 <div className="space-y-2">
                                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                       <TrendingUp className="h-3 w-3" /> Improvements
                                    </h4>
                                    <ul className="space-y-1">
                                       {sub.ai_improvements.map((m, i) => (
                                          <li key={i} className="text-xs font-medium text-slate-600 dark:text-slate-400">• {m}</li>
                                       ))}
                                    </ul>
                                 </div>
                              )}
                           </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
