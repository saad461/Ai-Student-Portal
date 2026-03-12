'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

const COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];

export function MemorySequence() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [message, setMessage] = useState('Watch the sequence...');

  const startGame = () => {
    setIsPlaying(true);
    addToSequence([]);
  };

  const addToSequence = (current: number[]) => {
    const next = [...current, Math.floor(Math.random() * 4)];
    setSequence(next);
    showSequence(next);
  };

  const showSequence = async (seq: number[]) => {
    setIsShowing(true);
    setMessage('Watch carefully!');
    for (let i = 0; i < seq.length; i++) {
      setActiveIndex(seq[i]);
      await new Promise(r => setTimeout(r, 600));
      setActiveIndex(null);
      await new Promise(r => setTimeout(r, 200));
    }
    setIsShowing(false);
    setUserSequence([]);
    setMessage('Your turn!');
  };

  const handleMemoryGameOver = async (level: number) => {
    if (level >= 8) {
      const { rewardStudentAction } = await import('@/app/admin/actions');
      const today = new Date().toLocaleDateString('en-CA');
      await rewardStudentAction(10, `Memory Sequence: Lvl ${level}`, 'game', `memory-${today}`);
    }
  };

  const handleInput = (idx: number) => {
    if (isShowing || !isPlaying) return;
    const nextUser = [...userSequence, idx];
    setUserSequence(nextUser);

    if (idx !== sequence[userSequence.length]) {
      setMessage(`Game Over! Level: ${sequence.length}`);
      setIsPlaying(false);
      handleMemoryGameOver(sequence.length);
      return;
    }

    if (nextUser.length === sequence.length) {
      setMessage('Correct! Next level...');
      setTimeout(() => addToSequence(sequence), 1000);
    }
  };

  return (
    <div className="w-full h-[500px] bg-slate-900 rounded-[2rem] flex flex-col items-center justify-center p-8 gap-8">
      <div className="text-center space-y-2">
         <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" /> Memory Sequence
         </h2>
         <p className="text-primary font-bold">{message}</p>
      </div>

      {!isPlaying ? (
        <Button size="lg" className="h-16 px-12 rounded-2xl font-black uppercase" onClick={startGame}>
           Start Training
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-4 w-64 h-64">
           {COLORS.map((color, i) => (
             <motion.button
               key={i}
               whileTap={{ scale: 0.95 }}
               animate={{
                 opacity: activeIndex === i ? 1 : 0.6,
                 scale: activeIndex === i ? 1.05 : 1
               }}
               onClick={() => handleInput(i)}
               className={`${color} rounded-2xl shadow-xl transition-all h-full w-full border-4 border-black/20`}
             />
           ))}
        </div>
      )}
      {isPlaying && <div className="text-white font-black">Level: {sequence.length}</div>}
    </div>
  );
}
