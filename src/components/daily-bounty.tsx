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
}

const BOUNTIES: Bounty[] = [
  { id: 'b1', title: 'The Semantic Guard', task: 'Use 5 different semantic HTML tags in your next submission.', reward: 20 },
  { id: 'b2', title: 'Accessibility Hero', task: 'Ensure all images have meaningful alt text today.', reward: 15 },
  { id: 'b3', title: 'Form Master', task: 'Implement a form with at least 3 types of native validation.', reward: 25 },
  { id: 'b4', title: 'Media Maven', task: 'Embed both audio and video elements in a single project.', reward: 30 },
  { id: 'b5', title: 'SEO Ninja', task: 'Add Open Graph meta tags to your portfolio layout.', reward: 20 },
];

export function DailyBounty({ onComplete }: { onComplete: (reward: number) => void }) {
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    // Select bounty based on day of the month
    const day = new Date().getDate();
    setBounty(BOUNTIES[day % BOUNTIES.length]);

    const completedDate = localStorage.getItem(`bounty_completed_${new Date().toLocaleDateString('en-CA')}`);
    if (completedDate) setIsCompleted(true);
  }, []);

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
    <Card className={cn(
      "relative overflow-hidden transition-all duration-500",
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
           &quot;{bounty.task}&quot;
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
