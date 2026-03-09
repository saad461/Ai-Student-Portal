'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  title: string;
  description: string;
  target?: string;
}

const STEPS: Step[] = [
  {
    title: "Welcome to Pro Portal!",
    description: "This is your command center for mastering software engineering. Ready for a quick tour?"
  },
  {
    title: "Today's Focus",
    description: "Your primary task is always highlighted here. Complete it sequentially to unlock the next level."
  },
  {
    title: "Mastery Radar",
    description: "Visualize your technical growth across different domains and export your professional CV."
  },
  {
    title: "Deep Work Chamber",
    description: "Use our immersive timer with ambient sounds to enter a high-performance flow state."
  }
];

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('onboarding_seen');
    if (!hasSeen) {
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_seen', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleComplete}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-background border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-8 space-y-6">
           <div className="flex justify-between items-center">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Mission Briefing</div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleComplete}><X className="h-4 w-4" /></Button>
           </div>

           <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase italic tracking-tight">{STEPS[currentStep].title}</h2>
              <p className="text-muted-foreground leading-relaxed">{STEPS[currentStep].description}</p>
           </div>

           <div className="flex items-center gap-2">
              {STEPS.map((_, i) => (
                <div key={i} className={cn("h-1 flex-1 rounded-full", i <= currentStep ? "bg-primary" : "bg-muted")} />
              ))}
           </div>

           <div className="flex gap-4">
              <Button variant="ghost" onClick={handleComplete} className="text-xs uppercase font-bold tracking-widest">Skip</Button>
              <Button onClick={handleNext} className="flex-1 font-black uppercase tracking-widest gap-2">
                 {currentStep === STEPS.length - 1 ? (
                   <>Finish <Check className="h-4 w-4" /></>
                 ) : (
                   <>Next <ChevronRight className="h-4 w-4" /></>
                 )}
              </Button>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
