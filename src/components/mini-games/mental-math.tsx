'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Dice5 } from 'lucide-react';

export function MentalMath() {
  const [problem, setProblem] = useState({ a: 0, b: 0, op: '+', ans: 0 });
  const [options, setOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    generateProblem();
  };

  const generateProblem = () => {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let ans = 0;
    if (op === '+') ans = a + b;
    else if (op === '-') ans = a - b;
    else ans = a * b;

    setProblem({ a, b, op, ans });

    const opts = [ans];
    while (opts.length < 4) {
      const o = ans + (Math.floor(Math.random() * 10) - 5);
      if (!opts.includes(o)) opts.push(o);
    }
    setOptions(opts.sort(() => Math.random() - 0.5));
  };

  const handleChoice = (val: number) => {
    if (val === problem.ans) {
      setScore(prev => prev + 1);
      generateProblem();
    } else {
      setIsPlaying(false);
      handleGameOver();
    }
  };

  const handleGameOver = async () => {
    if (score >= 10) {
      const { rewardStudentAction } = await import('@/app/admin/actions');
      const today = new Date().toLocaleDateString('en-CA');
      await rewardStudentAction(5, `Mental Math: Score ${score}`, 'game', `math-${today}`);
    }
  };

  return (
    <div className="w-full h-[500px] bg-slate-900 rounded-[2rem] flex flex-col items-center justify-center p-8 gap-12">
      <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center justify-center gap-2">
         <Dice5 className="h-8 w-8 text-primary" /> Mental Math
      </h2>

      {!isPlaying ? (
        <div className="text-center space-y-4">
           {score > 0 && <p className="text-2xl text-white font-black">Score: {score}</p>}
           <Button size="lg" className="h-16 px-12 rounded-2xl font-black uppercase" onClick={startGame}>
              Challenge Mind
           </Button>
        </div>
      ) : (
        <div className="text-center space-y-12">
           <div className="text-7xl font-black text-white tabular-nums tracking-tighter">
              {problem.a} {problem.op} {problem.b} = ?
           </div>
           <div className="grid grid-cols-2 gap-4">
              {options.map((opt, i) => (
                <Button key={i} size="lg" className="h-20 text-2xl font-black rounded-2xl" onClick={() => handleChoice(opt)}>
                   {opt}
                </Button>
              ))}
           </div>
           <Button variant="link" className="text-xs text-red-400 p-0 h-auto font-black uppercase mt-8" onClick={() => { setIsPlaying(false); handleGameOver(); }}>End Game</Button>
        </div>
      )}
    </div>
  );
}
