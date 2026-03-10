'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

export function AimTrainer() {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setIsPlaying(false);
    }
  }, [isPlaying, timeLeft]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(20);
    setIsPlaying(true);
    moveTarget();
  };

  const moveTarget = () => {
    setPos({
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10
    });
  };

  const handleHit = () => {
    setScore(prev => prev + 1);
    moveTarget();
  };

  return (
    <div className="w-full h-[500px] bg-slate-900 rounded-[2rem] overflow-hidden relative flex flex-col items-center justify-center p-8">
      <div className="absolute top-6 left-6 text-white font-black">Score: {score}</div>
      <div className="absolute top-6 right-6 text-amber-500 font-black">Time: {timeLeft}s</div>

      {!isPlaying ? (
        <div className="text-center space-y-4">
           <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center justify-center gap-2">
              <Target className="h-8 w-8 text-rose-500" /> Precision Aim
           </h2>
           {score > 0 && <p className="text-xl text-white font-black">Hits: {score}</p>}
           <Button size="lg" className="h-16 px-12 rounded-2xl font-black uppercase" onClick={startGame}>
              Start Session
           </Button>
        </div>
      ) : (
        <div className="w-full h-full relative">
           <motion.button
             key={`${pos.x}-${pos.y}`}
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             onClick={handleHit}
             className="absolute h-8 w-8 bg-rose-500 rounded-full border-4 border-white shadow-[0_0_20px_rgba(244,63,94,0.8)]"
             style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
           />
        </div>
      )}
    </div>
  );
}
