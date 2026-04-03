'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Target,
  FileBadge,
  TrendingUp,
  MapPin,
  Building2,
  ChevronRight,
  Zap,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast-provider';
import { cn } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  url: string;
  required_skills: string[];
  min_level: number;
}

export default function CareerPage() {
  const { error: toastError } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [bossProjectsCount, setBossProjectsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [jobsRes, profileRes, submissionsRes, bossItemsRes] = await Promise.all([
        fetch('/api/jobs').then(r => r.ok ? r.json() : []),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('submissions').select('curriculum_id').eq('student_id', user.id).eq('status', 'reviewed'),
        supabase.from('curriculum').select('id').eq('type', 'final_project')
      ]);

      setJobs(jobsRes);
      setProfile(profileRes.data as Record<string, unknown>);

      // Filter boss projects from submissions
      if (submissionsRes.data && bossItemsRes.data) {
        const bossIds = bossItemsRes.data.map(b => b.id);
        const count = submissionsRes.data.filter(s => bossIds.includes(s.curriculum_id)).length;
        setBossProjectsCount(count);
      }

    } catch (error) {
      console.error("Fetch data error:", error);
      toastError("Failed to fetch career data.");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentLevel = Math.floor(((profile?.total_points as number) || 0) / 100) + 1;

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <main className="flex-1 p-8 text-center">Opening the Career Portal...</main>;

  return (
    <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto space-y-8 md:space-y-12 animate-in fade-in duration-1000 w-full overflow-x-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
             <Briefcase className="h-10 w-10 text-primary" />
             CAREER LAUNCHPAD
          </h1>
          <p className="text-muted-foreground font-bold flex items-center gap-2">
             Transition from a student to a job-ready <span className="text-primary font-black uppercase tracking-widest">PRO</span>.
          </p>
        </div>

        <div className="flex gap-4">
           <Card className="bg-primary/5 border-primary/20 px-6 py-4 rounded-3xl flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                 <Target className="h-6 w-6" />
              </div>
              <div>
                 <div className="text-[10px] font-black uppercase tracking-widest text-primary/70">Readiness Level</div>
                 <div className="text-2xl font-black">LVL {currentLevel}</div>
              </div>
           </Card>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <Card className="rounded-[2.5rem] border-2 overflow-hidden bg-primary/5 border-primary/10">
              <CardHeader className="bg-primary/10 border-b border-primary/10 p-6">
                 <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <FileBadge className="h-4 w-4" /> Career Progress
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-bold">Portfolio Status</span>
                       <Badge className={cn("font-black", bossProjectsCount > 0 ? "bg-green-600" : "bg-amber-600")}>
                          {bossProjectsCount > 0 ? 'READY' : 'INCOMPLETE'}
                       </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-bold">Interview Prep</span>
                       <Badge variant="secondary" className="font-black">
                          {Math.min(100, Math.round((currentLevel / 10) * 100))}%
                       </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-bold">Github Mastery</span>
                       <Badge variant="secondary" className="font-black uppercase">
                          {profile?.is_pro ? 'UNLOCKED' : 'LOCKED'}
                       </Badge>
                    </div>
                 </div>
                 <Button
                   className="w-full h-12 rounded-xl font-black uppercase tracking-tighter"
                   variant="outline"
                   disabled={!profile?.github_link}
                   onClick={() => window.open(profile?.github_link as string || '#', '_blank')}
                 >
                   {profile?.github_link ? 'Update Resume' : 'GitHub Link Required'}
                 </Button>
              </CardContent>
           </Card>

           <Card className="rounded-[2.5rem] border-2 bg-slate-900 text-white border-none shadow-2xl overflow-hidden">
              <CardHeader className="p-6 border-b border-white/10">
                 <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Market Insights
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                 <p className="text-xs text-slate-400 font-medium">Demand for Frontend Developers with <span className="text-white font-bold">Next.js</span> skills is up <span className="text-green-400 font-black">+24%</span> this month.</p>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                       <span>Market Demand</span>
                       <span>84%</span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-primary" style={{ width: '84%' }} />
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>

        <div className="lg:col-span-3 space-y-8">
           <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                 <Input
                   placeholder="Search job titles or companies..."
                   className="pl-12 h-14 rounded-2xl text-lg border-2 focus:border-primary"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   onKeyDown={async (e) => {
                     if (e.key === 'Enter' && searchQuery) {
                        setLoading(true);
                        try {
                          const res = await fetch(`/api/jobs?query=${encodeURIComponent(searchQuery)}`);
                          if (!res.ok) throw new Error("Search failed");
                          const data = await res.json();
                          setJobs(data);
                        } catch (error) {
                          console.error("Search error:", error);
                          toastError("AI Search unavailable. Please try again later.");
                        } finally {
                          setLoading(false);
                        }
                     }
                   }}
                 />
              </div>
              <Button size="icon" className="h-14 w-14 rounded-2xl shrink-0" variant="outline">
                 <Filter className="h-5 w-5" />
              </Button>
           </div>

           <div className="grid grid-cols-1 gap-6">
              {filteredJobs.map((job) => {
                const isEligible = currentLevel >= job.min_level;
                return (
                  <Card key={job.id} className={cn(
                    "group rounded-[2rem] border-2 transition-all hover:scale-[1.01] hover:shadow-2xl overflow-hidden",
                    !isEligible && "opacity-80 border-slate-200 bg-slate-50/50"
                  )}>
                    <CardContent className="p-0">
                       <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                          <div className="flex gap-6 items-start">
                             <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                <Building2 className="h-8 w-8" />
                             </div>
                             <div className="space-y-1">
                                <h3 className="text-2xl font-black tracking-tighter uppercase leading-none group-hover:text-primary transition-colors">{job.title}</h3>
                                <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                                   <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> {job.company}</span>
                                   <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0 w-full md:w-auto">
                             {isEligible ? (
                               <Badge className="bg-green-600 font-black uppercase tracking-widest flex items-center gap-1">
                                  <ShieldCheck className="h-3 w-3" /> Eligible
                               </Badge>
                             ) : (
                               <Badge variant="outline" className="border-amber-500 text-amber-600 font-black uppercase tracking-widest flex items-center gap-1">
                                  <Zap className="h-3 w-3 fill-amber-500" /> LVL {job.min_level} Required
                               </Badge>
                             )}
                             <Button className="font-black uppercase tracking-widest h-12 rounded-xl group-hover:scale-105 transition-all shadow-xl shadow-primary/20" disabled={!isEligible}>
                                Apply Now <ChevronRight className="h-5 w-5 ml-1" />
                             </Button>
                          </div>
                       </div>
                       <div className="px-8 pb-8 pt-0 flex flex-wrap gap-2">
                          {job.required_skills.map(skill => (
                            <Badge key={skill} variant="secondary" className="bg-primary/5 text-primary-foreground/70 font-bold px-3 py-1">
                               {skill}
                            </Badge>
                          ))}
                       </div>
                    </CardContent>
                  </Card>
                );
              })}
           </div>
        </div>
      </div>
    </main>
  );
}
