'use client';

import { useState, useEffect } from 'react';
import { Target, Zap, CheckCircle2, Loader2, Code2, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import confetti from 'canvas-confetti';

interface Bounty {
  id: string;
  title: string;
  task: string;
  reward: number;
  minLectureIndex: number;
  category: string;
}

const BOUNTIES: Bounty[] = [
  { id: 'b1', title: 'The Semantic Guard', task: 'Use at least 3 semantic HTML tags (like <header>, <main>, <footer>) in your code.', reward: 20, minLectureIndex: 1, category: 'HTML' },
  { id: 'b2', title: 'Meta Master', task: 'Add a <meta name="description"> tag to your HTML boilerplate.', reward: 15, minLectureIndex: 4, category: 'HTML' },
  { id: 'b3', title: 'Heading Hierarchy', task: 'Create a clear heading structure using <h1>, <h2>, and <h3> tags correctly.', reward: 15, minLectureIndex: 7, category: 'HTML' },
  { id: 'b4', title: 'Link Architect', task: 'Create an <a> link that opens in a new tab using the target attribute.', reward: 10, minLectureIndex: 10, category: 'HTML' },
  { id: 'b5', title: 'List Specialist', task: 'Build a nested list using <ul> and <li> tags.', reward: 20, minLectureIndex: 11, category: 'HTML' },
  { id: 'b6', title: 'Data Visualizer', task: 'Create a simple <table> with at least 2 rows and 2 columns.', reward: 25, minLectureIndex: 13, category: 'HTML' },
  { id: 'b7', title: 'Form Architect', task: 'Build a <form> with at least two <input> fields and a <button>.', reward: 20, minLectureIndex: 16, category: 'HTML' },
  { id: 'b8', title: 'Validation Pro', task: 'Add "required" and "minlength" validation to an input field.', reward: 25, minLectureIndex: 17, category: 'HTML' },
  { id: 'b9', title: 'Media Maven', task: 'Embed an <audio> or <video> element with controls enabled.', reward: 30, minLectureIndex: 27, category: 'HTML' },
  { id: 'b10', title: 'SVG Artist', task: 'Embed a simple <svg> shape (like a circle or rect) directly in your HTML.', reward: 20, minLectureIndex: 28, category: 'HTML' },
];

export function DailyBounty({ onComplete, currentLectureIndex = 1 }: { onComplete: (reward: number) => void, currentLectureIndex?: number }) {
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    // Filter bounties based on student's current progress
    // We want to show a bounty that they are qualified for (minLectureIndex <= current)
    // but not too far behind (e.g. the most advanced one they qualify for)
    const availableBounties = BOUNTIES.filter(b => b.minLectureIndex <= currentLectureIndex);

    if (availableBounties.length > 0) {
      // Pick the highest lecture index bounty they qualify for
      const sorted = [...availableBounties].sort((a, b) => b.minLectureIndex - a.minLectureIndex);

      // Use the day of the month to pick one if there are multiple at the same level,
      // but usually we just want the most relevant one.
      // To keep it fresh, we can pick from the top 3 they qualify for.
      const pool = sorted.slice(0, 3);
      const day = new Date().getDate();
      setBounty(pool[day % pool.length]);
    } else {
      setBounty(BOUNTIES[0]);
    }

    const completedDate = localStorage.getItem(`bounty_completed_${new Date().toLocaleDateString('en-CA')}`);
    if (completedDate) setIsCompleted(true);
  }, [currentLectureIndex]);

  const handleComplete = async () => {
    if (!userCode.trim()) return;
    setLoading(true);
    setVerifyError(null);

    try {
      const res = await fetch('/api/verify-bounty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: userCode, task: bounty?.task })
      });
      const data = await res.json();

      if (data.isValid) {
        setIsCompleted(true);
        localStorage.setItem(`bounty_completed_${new Date().toLocaleDateString('en-CA')}`, 'true');
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        onComplete(bounty?.reward || 0);
        setIsVerifyOpen(false);
      } else {
        setVerifyError(data.feedback || "Requirement not met. Please check your code.");
      }
    } catch {
      setVerifyError("Verification service unavailable.");
    } finally {
      setLoading(false);
    }
  };

  if (!bounty) return null;

  return (
    <Card id="daily-bounty-card" className={cn(
      "relative overflow-hidden transition-all duration-500 scroll-mt-20",
      isCompleted ? "bg-green-500/10 border-green-500/20" : "bg-primary/5 border-primary/20"
    )}>
      {isCompleted && (
        <div className="absolute top-2 right-2">
           <Badge className="bg-green-600">BOUNTY CLAIMED</Badge>
        </div>
      )}
      <CardHeader className="pb-2">
         <div className="flex items-center gap-2 mb-1">
            <Target className={cn("h-4 w-4", isCompleted ? "text-green-600" : "text-primary")} />
            <CardTitle className="text-xs font-black uppercase tracking-widest">Daily Bounty</CardTitle>
         </div>
         <h3 className="text-lg font-bold">{bounty.title}</h3>
      </CardHeader>
      <CardContent className="space-y-4">
         <p className="text-sm text-muted-foreground italic leading-relaxed">
           &ldquo;{bounty.task}&rdquo;
         </p>

         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-black">
               <Zap className="h-4 w-4 fill-primary" />
               +{bounty.reward} XP
            </div>
            {!isCompleted ? (
              <Button size="sm" onClick={() => setIsVerifyOpen(true)} className="font-bold px-4">
                Claim Reward
              </Button>
            ) : (
              <div className="text-green-600 flex items-center gap-1 font-bold text-sm">
                <CheckCircle2 className="h-4 w-4" /> Success
              </div>
            )}
         </div>
      </CardContent>

      <Dialog open={isVerifyOpen} onOpenChange={setIsVerifyOpen}>
        <DialogContent className="sm:max-w-2xl">
           <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                 <Code2 className="h-5 w-5 text-primary" /> Verify Daily Bounty
              </DialogTitle>
              <DialogDescription>
                 To claim your <strong>{bounty.reward} XP</strong>, paste the code snippet you wrote for:
                 <span className="block mt-2 p-2 bg-muted rounded italic font-medium">&quot;{bounty.task}&quot;</span>
              </DialogDescription>
           </DialogHeader>

           <div className="space-y-4 py-4">
              <Textarea
                placeholder="Paste your code here..."
                className="font-mono text-xs min-h-[200px]"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
              />
              {verifyError && (
                 <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <p>{verifyError}</p>
                 </div>
              )}
           </div>

           <DialogFooter>
              <Button variant="ghost" onClick={() => setIsVerifyOpen(false)}>Cancel</Button>
              <Button
                onClick={handleComplete}
                disabled={loading || !userCode.trim()}
                className="font-black uppercase tracking-widest"
              >
                 {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</> : 'Submit for Review'}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

import { cn } from '@/lib/utils';
