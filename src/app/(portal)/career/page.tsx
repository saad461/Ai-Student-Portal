'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Target,
  FileBadge,
  TrendingUp,
  MapPin,
  Building2,
  ExternalLink,
  ChevronRight,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Search,
  Filter,
  Upload,
  FileUser,
  Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  const { success, error: toastError } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const res = await fetch('/api/jobs');
      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }
      const jobsData = await res.json();
      setJobs(jobsData);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
      toastError("AI Job Market is currently offline. Showing cached results.");
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(profileData);
    setLoading(false);
  };

  const currentLevel = Math.floor((profile?.total_points || 0) / 100) + 1;

  const calculateMatch = (jobSkills: string[]) => {
    if (!profile) return 0;
    const studentSkills = ['HTML5', 'CSS3', 'JavaScript', 'Tailwind CSS', 'React', 'Next.js', 'Supabase']; // Mock for now, ideally from profile.skills
    const matches = jobSkills.filter(s => studentSkills.some(ss => ss.toLowerCase().includes(s.toLowerCase())));
    return Math.round((matches.length / jobSkills.length) * 100);
  };

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.company.toLowerCase().includes(searchQuery.toLowerCase())
  ).map(job => ({
    ...job,
    matchScore: calculateMatch(job.required_skills)
  }));

  if (loading) return <div className="p-8 text-center">Opening the Career Portal...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 md:space-y-12 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter flex items-center gap-2 md:gap-3">
             <Briefcase className="h-8 w-8 md:h-10 md:w-10 text-primary" />
             CAREER LAUNCHPAD
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-bold flex items-center gap-2">
             Transition from a student to a job-ready <span className="text-primary font-black uppercase tracking-widest">PRO</span>.
          </p>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
           <Card className="bg-primary/5 border-primary/20 px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl flex items-center gap-3 md:gap-4 flex-1 md:flex-none">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                 <Target className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div>
                 <div className="text-[10px] font-black uppercase tracking-widest text-primary/70">Readiness Level</div>
                 <div className="text-xl md:text-2xl font-black">LVL {currentLevel}</div>
              </div>
           </Card>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
           <Card className="rounded-2xl md:rounded-[2.5rem] border-2 overflow-hidden bg-primary/5 border-primary/10">
              <CardHeader className="bg-primary/10 border-b border-primary/10 p-5 md:p-6">
                 <CardTitle className="text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <FileBadge className="h-3 w-3 md:h-4 md:w-4" /> Career Progress
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-5 md:p-6 space-y-4 md:space-y-6">
                 <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-xs md:text-sm font-bold">Portfolio Status</span>
                       <Badge className="bg-green-600 font-black text-[8px] md:text-[10px]">READY</Badge>
                    </div>
                    <div className="flex justify-between items-center opacity-50">
                       <span className="text-xs md:text-sm font-bold">Interview Prep</span>
                       <Badge variant="secondary" className="font-black text-[8px] md:text-[10px]">20%</Badge>
                    </div>
                    <div className="flex justify-between items-center opacity-50">
                       <span className="text-xs md:text-sm font-bold">Github Mastery</span>
                       <Badge variant="secondary" className="font-black text-[8px] md:text-[10px]">OFFLINE</Badge>
                    </div>
                 </div>

                 <div className="space-y-2 pt-2 border-t">
                    <Button
                      className="w-full h-10 md:h-12 rounded-xl font-black uppercase tracking-tighter text-[10px] md:text-xs gap-2"
                      variant="outline"
                      onClick={() => {
                        const { generateCV } = require('@/lib/cv-generator');
                        generateCV({
                          fullName: profile?.full_name || 'Student',
                          email: profile?.email || '',
                          phone: profile?.phone_number || '',
                          city: profile?.city || '',
                          github: profile?.github_link || '',
                          skills: ['HTML5', 'CSS3', 'JavaScript', 'Tailwind CSS', 'React'],
                          totalPoints: profile?.total_points || 0,
                          level: currentLevel,
                          streak: profile?.current_streak || 0,
                          projects: []
                        });
                      }}
                    >
                      <FileUser className="h-4 w-4" /> Generate AI Resume
                    </Button>
                    <Button className="w-full h-10 md:h-12 rounded-xl font-black uppercase tracking-tighter text-[10px] md:text-xs gap-2" variant="outline">
                       <Upload className="h-4 w-4" /> Upload Custom CV
                    </Button>
                    <Link href="/career/cv-guide" className="block">
                      <Button className="w-full h-10 md:h-12 rounded-xl font-black uppercase tracking-tighter text-[10px] md:text-xs gap-2 text-primary" variant="ghost">
                        <Info className="h-4 w-4" /> How to build a Pro CV
                      </Button>
                    </Link>
                 </div>
              </CardContent>
           </Card>

           <Card className="rounded-2xl md:rounded-[2.5rem] border-2 bg-slate-900 text-white border-none shadow-2xl overflow-hidden">
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

        <div className="lg:col-span-3 space-y-6 md:space-y-8">
           <div className="flex flex-row gap-3 md:gap-4 items-center">
              <div className="relative flex-1 w-full">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                 <Input
                   placeholder="Search job titles or companies..."
                   className="pl-12 h-12 md:h-14 rounded-xl md:rounded-2xl text-base md:text-lg border-2 focus:border-primary"
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
                        } catch (err) {
                          toastError("AI Search unavailable. Please try again later.");
                        } finally {
                          setLoading(false);
                        }
                     }
                   }}
                 />
              </div>
              <Button size="icon" className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl shrink-0" variant="outline">
                 <Filter className="h-5 w-5" />
              </Button>
           </div>

           <div className="grid grid-cols-1 gap-4 md:gap-6">
              {filteredJobs.map((job) => {
                const isEligible = currentLevel >= job.min_level;
                return (
                  <Card key={job.id} className={cn(
                    "group rounded-2xl md:rounded-[2rem] border-2 transition-all hover:scale-[1.01] hover:shadow-2xl overflow-hidden",
                    !isEligible && "opacity-80 border-slate-200 bg-slate-50/50"
                  )}>
                    <CardContent className="p-0">
                       <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                          <div className="flex gap-4 md:gap-6 items-start">
                             <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                <Building2 className="h-6 w-6 md:h-8 md:w-8" />
                             </div>
                             <div className="space-y-1 md:space-y-2">
                                <div className="flex items-center gap-3">
                                   <h3 className="text-lg md:text-2xl font-black tracking-tighter uppercase leading-none group-hover:text-primary transition-colors">{job.title}</h3>
                                   <Badge variant="outline" className={cn(
                                     "font-black text-[8px] md:text-[10px]",
                                     job.matchScore > 70 ? "text-green-600 border-green-600 bg-green-50" : "text-amber-600 border-amber-600"
                                   )}>
                                      {job.matchScore}% MATCH
                                   </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs md:text-sm font-bold text-muted-foreground">
                                   <span className="flex items-center gap-1"><Building2 className="h-3 w-3 md:h-4 md:w-4" /> {job.company}</span>
                                   <span className="flex items-center gap-1"><MapPin className="h-3 w-3 md:h-4 md:w-4" /> {job.location}</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0">
                             <div className="flex justify-between w-full md:w-auto items-center md:items-end flex-row md:flex-col gap-2">
                                {isEligible ? (
                                  <Badge className="bg-green-600 font-black uppercase tracking-widest flex items-center gap-1 text-[8px] md:text-[10px]">
                                     <ShieldCheck className="h-2 w-2 md:h-3 md:w-3" /> Eligible
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-amber-500 text-amber-600 font-black uppercase tracking-widest flex items-center gap-1 text-[8px] md:text-[10px]">
                                     <Zap className="h-2 w-2 md:h-3 md:w-3 fill-amber-500" /> LVL {job.min_level} Required
                                  </Badge>
                                )}
                                <Button size="sm" className="font-black uppercase tracking-widest h-10 md:h-12 rounded-lg md:rounded-xl group-hover:scale-105 transition-all shadow-xl shadow-primary/20 text-xs" disabled={!isEligible}>
                                   Apply Now <ChevronRight className="h-4 w-4 md:h-5 md:w-5 ml-1" />
                                </Button>
                             </div>
                          </div>
                       </div>
                       <div className="px-6 md:px-8 pb-6 md:pb-8 pt-0 flex flex-wrap gap-2">
                          {job.required_skills.map(skill => (
                            <Badge key={skill} variant="secondary" className="bg-primary/5 text-primary-foreground/70 font-bold px-2 md:px-3 py-1 text-[8px] md:text-[10px]">
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
    </div>
  );
}
