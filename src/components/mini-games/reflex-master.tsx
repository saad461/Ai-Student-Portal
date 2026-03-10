'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy } from 'lucide-react';

export function ReflexMaster() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [target, setTarget] = useState({ x: 50, y: 50 });
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setIsPlaying(false);
      if (score > highScore) setHighScore(score);
    }
  }, [isPlaying, timeLeft]);

  const spawnTarget = () => {
    setTarget({
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10
    });
  };

  const handleClick = () => {
    if (!isPlaying) return;
    setScore(prev => prev + 1);
    spawnTarget();
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    spawnTarget();
  };

  return (
    <div className="w-full h-[500px] bg-slate-900 rounded-[2rem] overflow-hidden relative flex flex-col items-center justify-center p-8">
      <div className="absolute top-6 left-6 text-white font-black uppercase tracking-tighter">
         <div className="text-xs opacity-50">Score</div>
         <div className="text-2xl">{score}</div>
      </div>
      <div className="absolute top-6 right-6 text-white font-black uppercase tracking-tighter text-right">
         <div className="text-xs opacity-50">Time Left</div>
         <div className="text-2xl text-amber-500">{timeLeft}s</div>
      </div>

      {!isPlaying ? (
        <div className="text-center space-y-6 z-10">
           <div className="h-20 w-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto text-primary animate-pulse">
              <Zap className="h-10 w-10 fill-current" />
           </div>
           <div className="space-y-2">
              <h2 className="text-3xl font-black text-white uppercase tracking-widest">Reflex Master</h2>
              <p className="text-slate-400 font-medium">Click the sparks as fast as you can!</p>
              {score > 0 && <p className="text-emerald-500 font-black">Final Score: {score}</p>}
              <p className="text-xs text-slate-500">High Score: {highScore}</p>
           </div>
           <Button size="lg" className="h-14 px-10 rounded-xl font-black uppercase" onClick={startGame}>
              {score > 0 ? 'Try Again' : 'Start Mission'}
           </Button>
        </div>
      ) : (
        <div className="w-full h-full relative cursor-crosshair">
           <motion.button
             key={`${target.x}-${target.y}`}
             initial={{ scale: 0, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             onClick={handleClick}
             className="absolute h-16 w-16 bg-primary rounded-full shadow-[0_0_30px_rgba(var(--primary),0.6)] flex items-center justify-center"
             style={{ left: `${target.x}%`, top: `${target.y}%`, transform: 'translate(-50%, -50%)' }}
           >
              <Zap className="h-8 w-8 text-white fill-current" />
           </motion.button>
        </div>
      )}
    </div>
  );
}
