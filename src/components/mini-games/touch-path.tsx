'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Fingerprint } from 'lucide-react';

export function TouchPath() {
  const [nodes, setNodes] = useState<{ x: number, y: number }[]>([]);
  const [visited, setVisited] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    generatePath();
  };

  const generatePath = () => {
    const newNodes = Array(5).fill(0).map(() => ({
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10
    }));
    setNodes(newNodes);
    setVisited([]);
  };

  const handleVisit = (idx: number) => {
    if (visited.includes(idx)) return;
    if (idx !== visited.length) {
      setIsPlaying(false);
      handleGameOver();
      return;
    }
    const nextVisited = [...visited, idx];
    setVisited(nextVisited);

    if (nextVisited.length === nodes.length) {
      setScore(prev => prev + 1);
      setTimeout(generatePath, 300);
    }
  };

  const handleGameOver = async () => {
    if (score >= 10) {
      const { rewardStudentAction } = await import('@/app/admin/actions');
      const today = new Date().toLocaleDateString('en-CA');
      await rewardStudentAction(5, `Touch Path: Score ${score}`, 'game', `path-${today}`);
    }
  };

  return (
    <div className="w-full h-[500px] bg-slate-900 rounded-[2rem] overflow-hidden relative flex flex-col items-center justify-center p-8">
      <h2 className="absolute top-8 text-3xl font-black text-white uppercase tracking-tighter flex items-center justify-center gap-2">
         <Fingerprint className="h-8 w-8 text-primary" /> Path Finder
      </h2>

      {!isPlaying ? (
        <div className="text-center space-y-4">
           {score > 0 && <p className="text-xl text-white font-black">Score: {score}</p>}
           <Button size="lg" className="h-16 px-12 rounded-2xl font-black uppercase" onClick={startGame}>
              Start Path
           </Button>
        </div>
      ) : (
        <div className="w-full h-full relative">
           {nodes.map((node, i) => (
             <motion.button
               key={i}
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               onClick={() => handleVisit(i)}
               className={`absolute h-12 w-12 rounded-full border-4 font-black transition-all ${
                 visited.includes(i) ? 'bg-primary border-white text-white' : 'bg-slate-800 border-slate-700 text-slate-500'
               }`}
               style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
             >
                {i + 1}
             </motion.button>
           ))}
           <Button variant="link" className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-red-400 p-0 h-auto font-black uppercase" onClick={() => { setIsPlaying(false); handleGameOver(); }}>End Game</Button>
        </div>
      )}
    </div>
  );
}
