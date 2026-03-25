'use client';

import { use } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Terminal, GitBranch, GitPullRequest, GitMerge, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const CONTENT = {
  'git-basics': {
    title: 'Git Basics',
    icon: Terminal,
    description: 'The foundation of version control. Learn how to track, stage, and commit your changes.',
    sections: [
      {
        title: 'Initialization',
        text: 'To start tracking a project with Git, you use the init command. This creates a hidden .git folder that stores all your version history.',
        code: 'git init'
      },
      {
        title: 'The Three States',
        text: 'Git has three main states that your files can reside in: Modified, Staged, and Committed. You use "add" to stage changes and "commit" to save them.',
        code: 'git add .\ngit commit -m "feat: initial commit"'
      },
      {
        title: 'Remote Synchronization',
        text: 'To share your code with the world, you connect your local repo to a remote service like GitHub.',
        code: 'git remote add origin <url>\ngit push -u origin main'
      }
    ]
  },
  'branching': {
    title: 'Branching Strategy',
    icon: GitBranch,
    description: 'Isolation is key to professional development. Learn how to use branches for features and bug fixes.',
    sections: [
      {
        title: 'Creating Branches',
        text: 'Always create a new branch for every task. This keeps the main branch stable and ready for production.',
        code: 'git checkout -b feat/new-authentication'
      },
      {
        title: 'Switching Branches',
        text: 'Moving between different streams of work is easy with the checkout (or switch) command.',
        code: 'git checkout main\ngit checkout feat/new-authentication'
      },
      {
        title: 'Best Practices',
        text: 'Name your branches descriptively. Use prefixes like feat/, fix/, or docs/ to identify the purpose of the branch.',
        code: '# Good naming:\nfeat/add-stripe-integration\nfix/typo-in-hero-header'
      }
    ]
  },
  'pull-requests': {
    title: 'Pull Requests',
    icon: GitPullRequest,
    description: 'Collaboration starts here. Learn how to propose changes and participate in code reviews.',
    sections: [
      {
        title: 'The PR Workflow',
        text: 'After pushing your branch, you open a Pull Request on GitHub. This signals that your code is ready for review.',
        code: '# After git push...\n# Go to GitHub.com and click "Compare & pull request"'
      },
      {
        title: 'Code Review Etiquette',
        text: 'When reviewing code, be constructive. Focus on the code, not the person. Ask questions rather than making demands.',
        code: '// Good comment:\n"Could we simplify this loop using .map()?"'
      },
      {
        title: 'Updating your PR',
        text: 'If a reviewer requests changes, simply commit the fixes to your local branch and push again. The PR updates automatically.',
        code: 'git add .\ngit commit -m "fix: address review comments"\ngit push'
      }
    ]
  },
  'conflicts': {
    title: 'Handling Conflicts',
    icon: GitMerge,
    description: 'Don\'t panic. Learn the professional way to resolve overlapping changes.',
    sections: [
      {
        title: 'Why do conflicts happen?',
        text: 'Conflicts occur when two people change the same line of code in the same file. Git doesn\'t know which version to keep.',
        code: '<<<<<<< HEAD\nYour version\n=======\nTheir version\n>>>>>>> main'
      },
      {
        title: 'The Resolution Process',
        text: 'Open the conflicting file, choose the correct code, remove the markers (<<<, ===, >>>), and commit the result.',
        code: 'git add <resolved-file>\ngit commit -m "chore: resolve merge conflicts"'
      },
      {
        title: 'Aborting a Merge',
        text: 'If things get too messy, you can always go back to the state before the merge started.',
        code: 'git merge --abort'
      }
    ]
  }
};

export default function GitHubTopicPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const topic = CONTENT[resolvedParams.id as keyof typeof CONTENT];

  if (!topic) notFound();

  return (
    <div className="p-4 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Link href="/github-mastery">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Overview
            </Button>
          </Link>

          <header className="flex items-center gap-4">
            <div className="bg-primary/10 p-4 rounded-2xl">
              <topic.icon className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{topic.title}</h1>
              <p className="text-muted-foreground">{topic.description}</p>
            </div>
          </header>

          <div className="space-y-6">
            {topic.sections.map((section, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {section.text}
                  </p>
                  <div className="relative">
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto border border-slate-800 shadow-xl">
                      <code>{section.code}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-primary/5 border-primary/20 p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Ready to master this?</h2>
            <p className="text-muted-foreground mb-6">Apply these techniques in your next assignment to build professional habits.</p>
            <Link href="/dashboard">
              <Button size="lg">Return to Dashboard</Button>
            </Link>
          </Card>
        </div>
    </div>
  );
}
