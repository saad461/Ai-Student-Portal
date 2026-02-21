'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { markAttendance } from '@/lib/attendance';
import { CheckCircle2, Clock, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

const ATTENDANCE_THRESHOLD = 15 * 60; // 15 minutes in seconds

export function AttendanceTracker() {
  const [secondsSpent, setSecondsSpent] = useState(0);
  const [isMarked, setIsMarked] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        const today = new Date().toLocaleDateString('en-CA');
        const { data } = await supabase
          .from('attendance')
          .select('id')
          .eq('student_id', user.id)
          .eq('date', today)
          .single();

        if (data) {
          setIsMarked(true);
        }
      }
    }
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId || isMarked) return;

    const today = new Date().toLocaleDateString('en-CA');
    const storageKey = `attendance_time_${userId}_${today}`;
    const tickKey = `attendance_tick_${userId}_${today}`;

    // Sync initial state from localStorage
    const initialSeconds = parseInt(localStorage.getItem(storageKey) || '0');
    setSecondsSpent(initialSeconds);

    const interval = setInterval(async () => {
      const now = Date.now();
      const lastTick = parseInt(localStorage.getItem(tickKey) || '0');

      // If no other tab has ticked in the last 25 seconds, we take the lead
      // We use 30 seconds as our interval, so 25 is a safe margin
      if (now - lastTick >= 25000) {
        let currentSeconds = parseInt(localStorage.getItem(storageKey) || '0');
        currentSeconds += 30;

        localStorage.setItem(storageKey, currentSeconds.toString());
        localStorage.setItem(tickKey, now.toString());
        setSecondsSpent(currentSeconds);

        if (currentSeconds >= ATTENDANCE_THRESHOLD) {
          const result = await markAttendance(userId);
          if (result.success) {
            setIsMarked(true);
            setShowNotification(true);
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#f97316', '#10b981', '#3b82f6']
            });
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3');
            audio.play().catch(() => {});
            setTimeout(() => setShowNotification(false), 8000);
          }
        }
      } else {
        // Just sync our local state with localStorage updated by another tab
        const currentSeconds = parseInt(localStorage.getItem(storageKey) || '0');
        setSecondsSpent(currentSeconds);
        if (currentSeconds >= ATTENDANCE_THRESHOLD) {
           // Might have been marked by another tab, verify with DB or just wait
           // For simplicity, we'll just check again in 30s
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [userId, isMarked]);

  if (isMarked && !showNotification) return null;

  return (
    <>
      {showNotification && (
        <div className="fixed bottom-4 right-4 z-[100] animate-in slide-in-from-right duration-500">
          <div className="bg-green-600 text-white p-4 rounded-lg shadow-2xl flex items-center gap-4 border border-green-500 min-w-[300px]">
            <div className="bg-white/20 p-2 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg leading-none mb-1">Attendance Marked!</p>
              <p className="text-sm opacity-90">15 minutes threshold reached.</p>
              <div className="mt-2 flex items-center gap-1 text-[10px] font-bold bg-white/20 w-fit px-2 py-0.5 rounded">
                <Zap className="h-3 w-3 fill-white" />
                +10 XP AWARDED
              </div>
            </div>
          </div>
        </div>
      )}

      {!isMarked && secondsSpent > 0 && (
        <div className="fixed bottom-4 right-4 z-[50] opacity-80 hover:opacity-100 transition-opacity">
          <div className="bg-slate-900/90 backdrop-blur text-white px-4 py-2 rounded-full text-xs flex items-center gap-3 border border-slate-700 shadow-xl">
            <div className="relative h-4 w-4">
               <Clock className="h-4 w-4 text-orange-400 absolute inset-0 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-[10px] text-slate-400 uppercase tracking-wider">Daily Attendance</span>
              <span className="font-mono">{Math.floor(secondsSpent / 60)}m / 15m</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-700 ml-1" />
            <div className="flex items-center gap-2">
               <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                 <div
                   className="h-full bg-orange-500 transition-all duration-1000"
                   style={{ width: `${Math.min(100, (secondsSpent / ATTENDANCE_THRESHOLD) * 100)}%` }}
                 />
               </div>
               <span className="font-bold text-orange-400">{Math.floor(Math.min(100, (secondsSpent / ATTENDANCE_THRESHOLD) * 100))}%</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
