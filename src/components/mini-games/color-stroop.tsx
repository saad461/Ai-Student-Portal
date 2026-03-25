'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Palette } from 'lucide-react';

const COLORS = [
  { name: 'RED', class: 'text-red-500' },
  { name: 'BLUE', class: 'text-blue-500' },
  { name: 'GREEN', class: 'text-green-500' },
  { name: 'YELLOW', class: 'text-yellow-500' },
  { name: 'PURPLE', class: 'text-purple-500' },
];

export function ColorStroop() {
  const [target, setTarget] = useState({ textIdx: 0, colorIdx: 0 });
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      handleGameOver();
    }
  }, [isPlaying, timeLeft]);

  const handleGameOver = async () => {
    if (score >= 20) {
      const { rewardStudentAction } = await import('@/app/admin/actions');
      const today = new Date().toLocaleDateString('en-CA');
      await rewardStudentAction(5, `Color Stroop: Score ${score}`, 'game', `stroop-${today}`);
    }
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(20);
    setIsPlaying(true);
    generateTarget();
  };

  const generateTarget = () => {
    setTarget({
      textIdx: Math.floor(Math.random() * COLORS.length),
      colorIdx: Math.floor(Math.random() * COLORS.length)
    });
  };

  const handleInput = (idx: number) => {
    if (idx === target.colorIdx) {
      setScore(prev => prev + 1);
      generateTarget();
    } else {
      setTimeLeft(prev => Math.max(0, prev - 2));
      generateTarget();
    }
  };

  return (
    <div className="w-full h-[500px] bg-slate-900 rounded-[2rem] flex flex-col items-center justify-center p-8 gap-12">
      <div className="text-center space-y-2">
         <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center justify-center gap-2">
            <Palette className="h-8 w-8 text-primary" /> Stroop Test
         </h2>
         <p className="text-slate-400 font-bold">Pick the <span className="text-white">COLOR</span> of the word, not the text.</p>
      </div>

      {!isPlaying ? (
        <Button size="lg" className="h-16 px-12 rounded-2xl font-black uppercase" onClick={startGame}>
           Test Focus
        </Button>
      ) : (
        <div className="text-center space-y-12">
           <div className={`text-7xl font-black uppercase tracking-tighter ${COLORS[target.colorIdx].class}`}>
              {COLORS[target.textIdx].name}
           </div>
           <div className="flex flex-wrap justify-center gap-4">
              {COLORS.map((c, i) => (
                <Button key={i} size="lg" className="h-14 px-8 rounded-xl font-black uppercase" onClick={() => handleInput(i)}>
                   {c.name}
                </Button>
              ))}
           </div>
           <div className="text-white font-black">Score: {score} | Time: {timeLeft}s</div>
        </div>
      )}
    </div>
  );
}
