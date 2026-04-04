'use client';

import { useState, useEffect } from 'react';
import { BatteryLow, Lock, ArrowRight, Clock, Coffee, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast-provider';

interface RestScreenProps {
  onUnlock: () => void;
}

export function RestScreen({ onUnlock }: RestScreenProps) {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const { toast } = useToast();

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const nextMonday = new Date();
      nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
      nextMonday.setHours(9, 0, 0, 0); // Assuming 9 AM Monday

      const difference = nextMonday.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUnlockAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '6668') {
      toast("Access Granted: Welcome back! The portal is now unlocked for your weekend session.", "success");
      onUnlock();
    } else {
      setIsError(true);
      setPin('');
      setTimeout(() => setIsError(false), 500);
      toast("Invalid PIN: The code you entered is incorrect. Please try again.", "error");
    }
  };

  const quotes = [
    "Rest is not idleness, and to lie sometimes on the grass under trees on a summer's day, listening to the murmur of the water, or watching the clouds float across the sky, is by no means a waste of time.",
    "The best coding often happens away from the keyboard.",
    "Your brain needs downtime to process all the logic you've learned this week.",
    "A well-rested developer is a highly effective developer.",
    "Recharge today, dominate on Monday."
  ];

  const randomQuote = quotes[new Date().getDay() % quotes.length];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center justify-center p-4 bg-orange-500/10 rounded-2xl mb-2">
          <Coffee className="h-10 w-10 text-orange-500" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
          Weekend <span className="text-orange-500">Reset</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
          The Daurix Project is currently in rest mode. Take this time to step away,
          recharge your cognitive batteries, and return stronger.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Countdown Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-400 font-semibold uppercase tracking-widest text-xs">
              <Clock className="h-4 w-4" />
              Next Session Starts In
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{timeLeft.days}</div>
                <div className="text-[10px] text-slate-500 uppercase">Days</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{timeLeft.hours}</div>
                <div className="text-[10px] text-slate-500 uppercase">Hours</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{timeLeft.minutes}</div>
                <div className="text-[10px] text-slate-500 uppercase">Mins</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{timeLeft.seconds}</div>
                <div className="text-[10px] text-slate-500 uppercase">Secs</div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-sm text-slate-300 italic leading-relaxed">
              &quot;{randomQuote}&quot;
            </p>
          </div>
        </motion.div>

        {/* Unlock Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl space-y-6"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold uppercase tracking-widest text-xs">
              <Lock className="h-4 w-4" />
              Special Access
            </div>
            <h3 className="text-2xl font-bold text-white">Bypass Rest Mode</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Instructors may provide a special PIN to students who need weekend access for catch-up or advanced study.
            </p>
          </div>

          <form onSubmit={handleUnlockAttempt} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={isError ? 'error' : 'normal'}
                animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <Input
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
                  className={`bg-slate-950/50 border-white/10 h-14 text-center text-2xl tracking-[1em] font-mono focus:ring-orange-500/50 transition-colors ${isError ? 'border-red-500/50 text-red-500' : 'text-white'}`}
                />
              </motion.div>
            </AnimatePresence>

            <Button
              type="submit"
              className="w-full h-14 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95 group"
            >
              Unlock Portal
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="pt-4 flex items-center justify-center gap-2 text-[10px] text-slate-500 uppercase tracking-tighter">
            <Sparkles className="h-3 w-3" />
            Authorized Access Only
          </div>
        </motion.div>
      </div>

      {/* Stats Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap justify-center gap-8 md:gap-16 pt-8 border-t border-white/5"
      >
        <div className="text-center">
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Status</div>
          <div className="text-orange-500 font-bold flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            RECHARGING
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Course</div>
          <div className="text-white font-bold uppercase">The Daurix Project</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Mode</div>
          <div className="text-white font-bold uppercase">Focus & Rest</div>
        </div>
      </motion.div>
    </div>
  );
}
