'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Hash } from 'lucide-react';

export function GridLogic() {
  const [grid, setGrid] = useState<number[]>(Array(16).fill(0));
  const [target, setTarget] = useState<number[]>(Array(16).fill(0));
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const generatePuzzle = () => {
    const newTarget: number[] = Array.from({ length: 16 }, () => Math.random() > 0.6 ? 1 : 0);
    const guaranteedTarget = newTarget.every(v => v === 0) ? [1, ...newTarget.slice(1)] : newTarget;
    setTarget(guaranteedTarget);
    setGrid(Array(16).fill(0));
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    generatePuzzle();
  };

  const handleGameOver = async () => {
    if (score >= 10) {
      const { rewardStudentAction } = await import('@/app/admin/actions');
      const today = new Date().toLocaleDateString('en-CA');
      await rewardStudentAction(5, `Grid Logic: Score ${score}`, 'game', `grid-${today}`);
    }
  };

  const toggle = (idx: number) => {
    const newGrid = [...grid];
    newGrid[idx] = newGrid[idx] === 0 ? 1 : 0;
    setGrid(newGrid);

    if (JSON.stringify(newGrid) === JSON.stringify(target)) {
      setScore(prev => prev + 1);
      setTimeout(generatePuzzle, 500);
    }
  };

  return (
    <div className="w-full h-[500px] bg-slate-900 rounded-[2rem] flex flex-col items-center justify-center p-8 gap-8">
      <div className="text-center space-y-2">
         <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center justify-center gap-2">
            <Hash className="h-8 w-8 text-primary" /> Pattern Matcher
         </h2>
         <p className="text-slate-400 font-medium">Replicate the target pattern on the main grid.</p>
      </div>

      {!isPlaying ? (
        <div className="text-center space-y-4">
           {score > 0 && <p className="text-2xl text-white font-black uppercase">Result: {score}</p>}
           <Button size="lg" className="h-16 px-12 rounded-2xl font-black uppercase" onClick={startGame}>
              Start Puzzle
           </Button>
        </div>
      ) : (
        <div className="flex gap-12 items-center">
           <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Pattern</span>
              <div className="grid grid-cols-4 gap-1 w-24">
                 {target.map((v, i) => (
                   <div key={i} className={`h-5 w-5 rounded-sm ${v === 1 ? 'bg-primary' : 'bg-slate-700 opacity-20'}`} />
                 ))}
              </div>
           </div>

           <div className="grid grid-cols-4 gap-2 w-64 h-64">
              {grid.map((v, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggle(i)}
                  className={`rounded-xl border-2 transition-all ${v === 1 ? 'bg-primary border-white' : 'bg-slate-800 border-slate-700'}`}
                />
              ))}
           </div>
        </div>
      )}
      {isPlaying && (
        <div className="flex gap-4 absolute bottom-8">
          <div className="text-white font-black">Score: {score}</div>
          <Button variant="link" className="text-xs text-red-400 p-0 h-auto font-black uppercase" onClick={() => { setIsPlaying(false); handleGameOver(); }}>End Game</Button>
        </div>
      )}
    </div>
  );
}
