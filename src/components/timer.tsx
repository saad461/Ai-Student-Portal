'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, AlertTriangle, Maximize2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { FocusRoom } from './focus-room';

export function DeepWorkTimer() {
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes
  const [isActive, setIsActive] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [isFocusRoomOpen, setIsFocusRoomOpen] = useState(false);
  const [moduleContext, setModuleContext] = useState({ index: 1, name: 'Web Fundamentals' });
  const sessionStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    async function fetchContext() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('current_course_id')
            .eq('id', user.id)
            .single();

        if (profile?.current_course_id) {
            const { data: modules } = await supabase
                .from('modules')
                .select('index, name')
                .eq('course_id', profile.current_course_id)
                .order('index', { ascending: false });

            // For tasks, we'll use the user's highest unlocked module or current one
            // In a real scenario, we'd check submissions, but for Focus Room,
            // the highest indexed module in their current course is a good context provider.
            if (modules && modules.length > 0) {
                setModuleContext({ index: modules[0].index, name: modules[0].name });
            }
        }
    }
    fetchContext();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveSession = useCallback(async (seconds: number) => {
    if (seconds < 10) return; // Don't save sessions shorter than 10 seconds

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('focus_sessions').insert({
      student_id: user.id,
      duration_seconds: seconds,
    });
  }, []);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && isActive) {
      if (sessionStartTimeRef.current !== null) {
        const elapsed = sessionStartTimeRef.current - timeLeft;
        if (elapsed > 0) {
          saveSession(elapsed);
        }
      }
      sessionStartTimeRef.current = null;
      setIsActive(false);
      setShowWarning(true);
    }
  }, [isActive, timeLeft, saveSession]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleVisibilityChange]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            if (sessionStartTimeRef.current !== null) {
              saveSession(sessionStartTimeRef.current);
            }
            sessionStartTimeRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, saveSession]);

  const toggleTimer = () => {
    if (isActive) {
      // Pausing
      if (sessionStartTimeRef.current !== null) {
        const elapsed = sessionStartTimeRef.current - timeLeft;
        if (elapsed > 0) {
          saveSession(elapsed);
        }
      }
      sessionStartTimeRef.current = null;
    } else {
      // Starting
      sessionStartTimeRef.current = timeLeft;
    }
    setIsActive(!isActive);
  };
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(60 * 60);
    setShowWarning(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          Deep Work Timer
        </CardTitle>
        <CardDescription>
          Stay focused for 60 minutes. The timer will pause if you leave this tab.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {showWarning && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Focus Warning!</AlertTitle>
            <AlertDescription>
              The timer paused because you switched tabs. Stay focused!
            </AlertDescription>
          </Alert>
        )}

        <div className="text-7xl font-mono text-center py-8">
          {formatTime(timeLeft)}
        </div>

        <div className="flex gap-4">
          <Button onClick={toggleTimer} className="flex-1 text-lg py-6" variant={isActive ? "outline" : "default"}>
            {isActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {isActive ? 'Pause' : 'Start Focus'}
          </Button>
          <Button onClick={resetTimer} variant="ghost" className="px-6 py-6">
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        <div className="bg-muted p-4 rounded-md text-sm text-center">
          Goal: 60 minutes of uninterrupted coding.
        </div>

        <Button
          variant="outline"
          className="w-full border-primary/50 text-primary hover:bg-primary/10"
          onClick={() => setIsFocusRoomOpen(true)}
        >
          <Maximize2 className="mr-2 h-4 w-4" />
          Enter Focus Room (Immersive)
        </Button>
      </CardContent>

      <FocusRoom
        isOpen={isFocusRoomOpen}
        onClose={() => setIsFocusRoomOpen(false)}
        onSaveSession={saveSession}
        moduleIndex={moduleContext.index}
        moduleName={moduleContext.name}
      />
    </Card>
  );
}
