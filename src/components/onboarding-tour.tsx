'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, Sparkles, Target, Zap, Rocket } from 'lucide-react';

import { LucideIcon } from 'lucide-react';

interface Step {
  title: string;
  description: string;
  target?: string;
  icon: LucideIcon;
}

const TOUR_STEPS: Step[] = [
  {
    title: "Welcome to Pro Dev!",
    description: "We've upgraded your portal with powerful new tools to help you become a world-class engineer. Let's take a quick look!",
    icon: Rocket
  },
  {
    title: "Today's Focus",
    description: "Your next lecture or task is always front-and-center. No more guessing where you left off.",
    target: "today-focus",
    icon: Target
  },
  {
    title: "Mastery Radar",
    description: "Visualize your progress across different domains. Watch your spider chart grow as you complete modules.",
    target: "mastery-radar",
    icon: Sparkles
  },
  {
    title: "Global Search",
    description: "Press CMD+K (or Ctrl+K) anywhere to instantly search lectures, assignments, and tools.",
    target: "global-search",
    icon: Zap
  }
];

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('has_seen_tour_v1');
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setCurrentStep(0);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const completeTour = () => {
    setIsVisible(false);
    localStorage.setItem('has_seen_tour_v1', 'true');
  };

  if (!isVisible || currentStep === -1) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={completeTour}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative bg-background border shadow-2xl rounded-3xl max-w-md w-full overflow-hidden"
      >
        <div className="p-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500" />

        <div className="p-8 space-y-6">
           <div className="flex justify-between items-start">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                 <step.icon className="h-6 w-6" />
              </div>
              <Button variant="ghost" size="icon" onClick={completeTour} className="rounded-full">
                 <X className="h-5 w-5" />
              </Button>
           </div>

           <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tight">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
           </div>

           <div className="flex items-center justify-between pt-4">
              <div className="flex gap-1">
                 {TOUR_STEPS.map((_, i) => (
                   <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-muted'}`} />
                 ))}
              </div>
              <Button onClick={nextStep} className="rounded-full px-6 font-bold">
                 {currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
                 <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
