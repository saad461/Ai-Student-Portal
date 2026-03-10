'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Select bounty based on day of the month
    const day = new Date().getDate();
    setBounty(BOUNTIES[day % BOUNTIES.length]);

    const completedDate = localStorage.getItem(`bounty_completed_${new Date().toLocaleDateString('en-CA')}`);
    if (completedDate) setIsCompleted(true);
  }, []);

  const handleComplete = async () => {
    setLoading(true);
    // Simulate verification
    await new Promise(r => setTimeout(r, 1500));

    setIsCompleted(true);
    localStorage.setItem(`bounty_completed_${new Date().toLocaleDateString('en-CA')}`, 'true');
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    onComplete(bounty?.reward || 0);
    setLoading(false);
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
           &ldquo;{bounty.task}&rdquo;
         </p>

         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-black">
               <Zap className="h-4 w-4 fill-primary" />
               +{bounty.reward} XP
            </div>
            {!isCompleted ? (
              <Button size="sm" onClick={handleComplete} disabled={loading} className="font-bold px-4">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Claim Reward'}
              </Button>
            ) : (
              <div className="text-green-600 flex items-center gap-1 font-bold text-sm">
                <CheckCircle2 className="h-4 w-4" /> Success
              </div>
            )}
         </div>
      </CardContent>
    </Card>
  );
}

import { cn } from '@/lib/utils';
