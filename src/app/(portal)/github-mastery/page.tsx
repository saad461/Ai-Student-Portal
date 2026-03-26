'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, Terminal, GitBranch, GitPullRequest, GitMerge, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function GitHubMasteryPage() {
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
    <div className="p-4 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Github className="h-8 w-8" />
              GitHub Mastery
            </h1>
            <p className="text-muted-foreground mt-2">Essential skills for professional developers.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((step) => (
              <Link key={step.id} href={`/github-mastery/${step.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="flex items-center justify-between">
                      {step.title}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{step.content}</p>
                    <Badge variant="secondary" className="mt-4">Start Learning</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
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
    </div>
  );
}
