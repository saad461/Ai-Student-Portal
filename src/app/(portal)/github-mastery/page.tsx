'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, Terminal, GitBranch, GitPullRequest, GitMerge, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function GitHubMasteryPage() {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    const fetchProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('submissions')
        .select('curriculum_id')
        .eq('student_id', user.id)
        .ilike('curriculum_id', 'github-%');

      if (data) {
        setCompletedSteps(data.map(s => s.curriculum_id.replace('github-', '')));
      }
    };
    fetchProgress();
  }, []);

  const steps = [
    {
      id: 'git-basics',
      title: 'Git Basics',
      description: 'Understanding init, add, commit, and push.',
      icon: Terminal,
      content: 'Learn how to track your changes locally and sync them with a remote repository.'
    },
    {
      id: 'branching',
      title: 'Branching Strategy',
      description: 'Feature branching and keeping main clean.',
      icon: GitBranch,
      content: 'Never work directly on main. Create feature branches for every new task.'
    },
    {
      id: 'pull-requests',
      title: 'Pull Requests',
      description: 'The art of code review.',
      icon: GitPullRequest,
      content: 'Learn how to submit your work and review others using PRs.'
    },
    {
      id: 'conflicts',
      title: 'Handling Conflicts',
      description: 'Merging and Rebasing.',
      icon: GitMerge,
      content: 'Master the scary part of Git: resolving merge conflicts professionally.'
    }
  ];

  return (
    <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Github className="h-8 w-8" />
              GitHub Mastery
            </h1>
            <p className="text-muted-foreground mt-2">Essential skills for professional developers.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((step) => {
              const isDone = completedSteps.includes(step.id);
              return (
                <Link key={step.id} href={`/github-mastery/${step.id}`}>
                  <Card className={cn(
                    "hover:border-primary/50 transition-colors cursor-pointer h-full relative overflow-hidden",
                    isDone && "border-green-500/50 bg-green-500/5"
                  )}>
                    {isDone && (
                      <div className="absolute top-0 right-0 p-2 bg-green-500 text-white rounded-bl-xl">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                    <CardHeader>
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors",
                        isDone ? "bg-green-500/20" : "bg-primary/10"
                      )}>
                        <step.icon className={cn("h-6 w-6", isDone ? "text-green-500" : "text-primary")} />
                      </div>
                      <CardTitle className="flex items-center justify-between">
                        {step.title}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{step.content}</p>
                      <Badge variant={isDone ? "default" : "secondary"} className={cn("mt-4", isDone && "bg-green-600")}>
                        {isDone ? 'Completed' : 'Start Learning'}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <Card className="bg-slate-900 text-white p-8">
            <h2 className="text-xl font-bold mb-4">Pro Tip: The Perfect Commit</h2>
            <code className="block bg-slate-800 p-4 rounded-md text-green-400 font-mono text-sm">
              feat: add user authentication system<br/><br/>
              - implemented supabase auth<br/>
              - added protected routes middleware<br/>
              - designed login/signup UI components
            </code>
          </Card>
        </div>
    </main>
  );
}
