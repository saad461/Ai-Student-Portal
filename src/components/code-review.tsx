'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, MessageSquare, Code, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AICodeReview({ githubUrl }: { githubUrl: string }) {
  const [status, setStatus] = useState<'analyzing' | 'completed'>('analyzing');
  const [feedback, setFeedback] = useState<string[]>([]);

  useEffect(() => {
    const feedbacksList = [
      "Your semantic structure looks solid. Great use of <main> and <section> tags.",
      "The CSS logic is clean, though you could optimize your Flexbox containers by using fewer nested divs.",
      "Code readability is high. Good variable naming conventions observed.",
      "Performance check passed. Minimal DOM manipulation in the hot path.",
      "Accessibility: Consider adding more aria-labels to your interactive elements.",
      "GitHub repo structure is professional. README.md is informative."
    ];

    const timer = setTimeout(() => {
      setStatus('completed');
      setFeedback([...feedbacksList].sort(() => 0.5 - Math.random()).slice(0, 3));
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            AI Code Review Simulation
          </CardTitle>
          <Badge variant={status === 'analyzing' ? 'outline' : 'default'} className={cn(status === 'completed' && "bg-green-600")}>
            {status === 'analyzing' ? 'Processing...' : 'Review Complete'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Code className="h-4 w-4" />
            <span className="truncate">{githubUrl}</span>
          </div>

          {status === 'analyzing' ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-mono animate-pulse">Scanning repository and analyzing code patterns...</p>
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-sm font-medium">Expert Feedback:</p>
              {feedback.map((item, idx) => (
                <div key={idx} className="flex gap-3 bg-background p-3 rounded-md border text-sm">
                  <MessageSquare className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <p>{item}</p>
                </div>
              ))}
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium mt-2">
                <CheckCircle2 className="h-4 w-4" />
                Assignment validated successfully. Points added to your profile.
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
