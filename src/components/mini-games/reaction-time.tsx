'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Box } from 'lucide-react';

export function ReactionTime() {
  const [status, setStatus] = useState<'idle' | 'waiting' | 'ready' | 'result'>('idle');
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState(0);

  const startTest = () => {
    setStatus('waiting');
    const delay = Math.random() * 3000 + 2000;
    setTimeout(() => {
      setStatus('ready');
      setStartTime(Date.now());
    }, delay);
  };

  const handleTrigger = () => {
    if (status === 'waiting') {
      setStatus('idle');
      alert("Too early!");
    } else if (status === 'ready') {
      const diff = Date.now() - startTime;
      setResult(diff);
      setStatus('result');
      handleGameOver(diff);
    }
  };

  const handleGameOver = async (ms: number) => {
    if (ms <= 300) {
      const { rewardStudentAction } = await import('@/app/admin/actions');
      const today = new Date().toLocaleDateString('en-CA');
      await rewardStudentAction(5, `Reaction Time: ${ms}ms`, 'game', `react-${today}`);
    }
  };

  return (
    <div className="w-full h-[500px] bg-slate-900 rounded-[2rem] flex flex-col items-center justify-center p-8 gap-8">
      <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center justify-center gap-2">
         <Box className="h-8 w-8 text-primary" /> Nerve Test
      </h2>

      <motion.div
        animate={{
          backgroundColor: status === 'ready' ? '#10b981' : status === 'waiting' ? '#ef4444' : '#1e293b'
        }}
        onClick={handleTrigger}
        className="w-full max-w-lg h-64 rounded-[2rem] border-4 border-white/10 cursor-pointer flex items-center justify-center text-center p-8"
      >
        {status === 'idle' && (
          <Button size="lg" className="h-16 px-12 rounded-2xl font-black uppercase" onClick={(e) => { e.stopPropagation(); startTest(); }}>
             Start Nerve Test
          </Button>
        )}
        {status === 'waiting' && <span className="text-white text-3xl font-black uppercase tracking-widest animate-pulse">Wait for Green...</span>}
        {status === 'ready' && <span className="text-white text-4xl font-black uppercase tracking-widest">CLICK NOW!</span>}
        {status === 'result' && (
          <div className="space-y-4">
             <div className="text-white text-5xl font-black">{result}ms</div>
             <Button size="sm" variant="outline" className="text-white border-white hover:bg-white/10 font-bold uppercase" onClick={(e) => { e.stopPropagation(); startTest(); }}>Try Again</Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
