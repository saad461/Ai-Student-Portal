'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shuffle } from 'lucide-react';

const SHAPES = ['Square', 'Circle', 'Triangle', 'Star'];

export function QuickMatch() {
  const [current, setCurrent] = useState({ left: 0, right: 0 });
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    nextPair();
  };

  const nextPair = () => {
    setCurrent({
      left: Math.floor(Math.random() * 4),
      right: Math.floor(Math.random() * 4)
    });
  };

  const handleDecision = (match: boolean) => {
    const isMatch = current.left === current.right;
    if (match === isMatch) {
      setScore(prev => prev + 1);
      nextPair();
    } else {
      setIsPlaying(false);
      handleGameOver();
    }
  };

  const handleGameOver = async () => {
    if (score >= 20) {
      const { rewardStudentAction } = await import('@/app/admin/actions');
      const today = new Date().toLocaleDateString('en-CA');
      await rewardStudentAction(5, `Quick Match: Score ${score}`, 'game', `match-${today}`);
    }
  };

  return (
    <div className="w-full h-[500px] bg-slate-900 rounded-[2rem] flex flex-col items-center justify-center p-8 gap-12">
      <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center justify-center gap-2">
         <Shuffle className="h-8 w-8 text-primary" /> Logic Match
      </h2>

      {!isPlaying ? (
        <div className="text-center space-y-4">
           {score > 0 && <p className="text-2xl text-white font-black">Score: {score}</p>}
           <Button size="lg" className="h-16 px-12 rounded-2xl font-black uppercase" onClick={startGame}>
              Start Matching
           </Button>
        </div>
      ) : (
        <div className="space-y-12 w-full max-w-md">
           <div className="flex justify-between items-center gap-8">
              <div className="h-32 w-32 bg-white/10 rounded-3xl flex items-center justify-center text-white font-black text-xl">{SHAPES[current.left]}</div>
              <div className="h-32 w-32 bg-white/10 rounded-3xl flex items-center justify-center text-white font-black text-xl">{SHAPES[current.right]}</div>
           </div>
           <div className="flex gap-4">
              <Button size="lg" variant="destructive" className="flex-1 h-16 text-xl font-black rounded-2xl" onClick={() => handleDecision(false)}>DIFFERENT</Button>
              <Button size="lg" className="flex-1 h-16 text-xl font-black rounded-2xl bg-emerald-600" onClick={() => handleDecision(true)}>SAME</Button>
           </div>
           <div className="flex justify-center mt-8">
              <Button variant="link" className="text-xs text-red-400 p-0 h-auto font-black uppercase" onClick={() => { setIsPlaying(false); handleGameOver(); }}>End Game</Button>
           </div>
        </div>
      )}
    </div>
  );
}
