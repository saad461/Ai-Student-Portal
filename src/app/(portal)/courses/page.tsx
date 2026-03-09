'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Course } from '@/lib/curriculum';
import { Lock, Play, CheckCircle2, Star, Sparkles, Shield, Cpu, Code } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { PortalNavbar } from '@/components/portal-navbar';
import { cn } from '@/lib/utils';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .order('index', { ascending: true });

      const { data: userCourses } = await supabase
        .from('user_courses')
        .select('*')
        .eq('user_id', user.id);

      const merged = (coursesData as Course[] || []).map(course => {
        const access = userCourses?.find(uc => uc.course_id === course.id);
        return {
          ...course,
          status: access ? (access.status as any) : 'locked'
        };
      });

      setCourses(merged);
      setLoading(false);
    }
    fetchCourses();
  }, []);

  const getPremiumIcon = (slug: string) => {
    switch (slug) {
      case 'web-dev': return <Code className="h-12 w-12 text-blue-400" />;
      case 'cyber-security': return <Shield className="h-12 w-12 text-emerald-400" />;
      case 'ethical-hacking': return <Sparkles className="h-12 w-12 text-purple-400" />;
      case 'gen-ai': return <Cpu className="h-12 w-12 text-orange-400" />;
      case 'ai-masterclass': return <Star className="h-12 w-12 text-yellow-400" />;
      default: return <Sparkles className="h-12 w-12 text-primary" />;
    }
  };

  const getGradient = (slug: string) => {
    switch (slug) {
      case 'web-dev': return 'from-blue-600/20 via-indigo-600/10 to-transparent';
      case 'cyber-security': return 'from-emerald-600/20 via-teal-600/10 to-transparent';
      case 'ethical-hacking': return 'from-purple-600/20 via-pink-600/10 to-transparent';
      case 'gen-ai': return 'from-orange-600/20 via-red-600/10 to-transparent';
      case 'ai-masterclass': return 'from-yellow-600/20 via-amber-600/10 to-transparent';
      default: return 'from-primary/20 via-primary/10 to-transparent';
    }
  };

  if (loading) return <div className="p-12 text-center">Loading your learning path...</div>;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-muted/30">
      <Sidebar />
      <PortalNavbar />
      <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Explore Courses</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Master the most in-demand tech skills with our premium, project-based curriculum.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course) => {
          const isLocked = course.status === 'locked';
          const isCompleted = course.status === 'completed';

          return (
            <Card key={course.id} className={cn(
              "relative overflow-hidden border-2 transition-all duration-300 group",
              isLocked ? "opacity-75 grayscale-[0.5]" : "hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10"
            )}>
              {/* Premium Background Decoration */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-50 group-hover:opacity-70 transition-opacity",
                getGradient(course.slug)
              )} />

              <CardHeader className="relative z-10 pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                    {getPremiumIcon(course.slug)}
                  </div>
                  {isLocked ? (
                    <Badge variant="secondary" className="bg-slate-200/50 text-slate-600 backdrop-blur-sm">
                      <Lock className="h-3 w-3 mr-1" /> Locked
                    </Badge>
                  ) : isCompleted ? (
                    <Badge className="bg-green-500/20 text-green-600 border-green-500/30 backdrop-blur-sm">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                    </Badge>
                  ) : (
                    <Badge className="bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
                      <Sparkles className="h-3 w-3 mr-1" /> Available
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl font-bold mt-4">{course.name}</CardTitle>
              </CardHeader>

              <CardContent className="relative z-10 min-h-[100px]">
                <p className="text-muted-foreground leading-relaxed">
                  {course.description || "Master industry-standard techniques and tools in this comprehensive program."}
                </p>
              </CardContent>

              <CardFooter className="relative z-10 pt-4">
                {isLocked ? (
                  <Button disabled className="w-full bg-slate-200 text-slate-400">
                    Complete Previous Course to Unlock
                  </Button>
                ) : (
                  <Link href={`/curriculum?course=${course.id}`} className="w-full">
                    <Button className="w-full group-hover:scale-[1.02] transition-transform font-bold">
                      {isCompleted ? "Review Course" : "Start Learning"}
                      <Play className="ml-2 h-4 w-4 fill-current" />
                    </Button>
                  </Link>
                )}
              </CardFooter>

              {/* Decorative Mesh Circle */}
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            </Card>
          );
        })}
      </div>
      </main>
    </div>
  );
}
