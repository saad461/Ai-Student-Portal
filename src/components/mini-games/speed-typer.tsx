'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Keyboard } from 'lucide-react';

const WORDS = ['typescript', 'react', 'nextjs', 'tailwind', 'supabase', 'javascript', 'frontend', 'backend', 'fullstack', 'developer', 'algorithm', 'component', 'interface', 'database', 'asynchronous'];

export function SpeedTyper() {
  const [target, setTarget] = useState('');
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
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
    if (score >= 10) {
      const { rewardStudentAction } = await import('@/app/admin/actions');
      const today = new Date().toLocaleDateString('en-CA');
      await rewardStudentAction(5, `Speed Typer: Score ${score}`, 'game', `typer-${today}`);
    }
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    spawnWord();
  };

  const spawnWord = () => {
    setTarget(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setInput('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase();
    setInput(val);
    if (val === target) {
      setScore(prev => prev + 1);
      spawnWord();
    }
  };

  return (
    <div className="w-full h-[500px] bg-slate-900 rounded-[2rem] flex flex-col items-center justify-center p-8 gap-8">
      <div className="text-center space-y-4">
         <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center justify-center gap-2">
            <Keyboard className="h-8 w-8 text-primary" /> Speed Typer
         </h2>
         <div className="flex gap-4 justify-center">
            <div className="bg-white/10 px-4 py-1 rounded-full text-white font-bold">WPM: {score * 2}</div>
            <div className="bg-amber-500/20 px-4 py-1 rounded-full text-amber-500 font-bold">Time: {timeLeft}s</div>
         </div>
      </div>

      {!isPlaying ? (
        <div className="text-center space-y-4">
           {score > 0 && <p className="text-2xl text-white font-black uppercase">Result: {score} Words</p>}
           <Button size="lg" className="h-16 px-12 rounded-2xl font-black uppercase" onClick={startGame}>
              Start Challenge
           </Button>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-8">
           <div className="text-center">
              <span className="text-6xl font-black text-white uppercase tracking-widest bg-primary/20 px-8 py-4 rounded-3xl block">
                 {target}
              </span>
           </div>
           <Input
             autoFocus
             value={input}
             onChange={handleChange}
             placeholder="Type here..."
             className="h-16 rounded-2xl border-4 border-primary text-center text-2xl font-black uppercase bg-slate-800 text-white"
           />
        </div>
      )}
    </div>
  );
}
