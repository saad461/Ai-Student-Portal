'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, Volume2, VolumeX, X, Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FocusRoomProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSession: (seconds: number) => void;
}

export function FocusRoom({ isOpen, onClose, onSaveSession }: FocusRoomProps) {
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorLRef = useRef<OscillatorNode | null>(null);
  const oscillatorRRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (isActive && sessionStartTimeRef.current !== null) {
        onSaveSession(sessionStartTimeRef.current - timeLeft);
      }
      stopBinauralBeats();
      setIsActive(false);
      return;
    }

    const interval = setInterval(() => {
      if (isActive && timeLeft > 0) {
        setTimeLeft((prev) => prev - 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isActive, timeLeft, onSaveSession]);

  const startBinauralBeats = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;

    // Left Channel (440Hz)
    const oscL = ctx.createOscillator();
    const panL = ctx.createStereoPanner();
    oscL.frequency.value = 440;
    panL.pan.value = -1;

    // Right Channel (444Hz -> 4Hz Delta/Alpha state)
    const oscR = ctx.createOscillator();
    const panR = ctx.createStereoPanner();
    oscR.frequency.value = 444;
    panR.pan.value = 1;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    oscL.connect(panL).connect(gain).connect(ctx.destination);
    oscR.connect(panR).connect(gain).connect(ctx.destination);

    oscL.start();
    oscR.start();

    oscillatorLRef.current = oscL;
    oscillatorRRef.current = oscR;
    gainNodeRef.current = gain;
  };

  const stopBinauralBeats = () => {
    oscillatorLRef.current?.stop();
    oscillatorRRef.current?.stop();
    oscillatorLRef.current = null;
    oscillatorRRef.current = null;
  };

  const toggleAudio = () => {
    if (isAudioEnabled) {
      stopBinauralBeats();
    } else {
      startBinauralBeats();
    }
    setIsAudioEnabled(!isAudioEnabled);
  };

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black text-green-500 font-mono flex flex-col items-center justify-center animate-in fade-in duration-700">
      {/* Immersive Grid Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs uppercase tracking-[0.3em] font-bold">Deep Work Protocol Active</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-green-500 hover:text-green-400 hover:bg-green-500/10">
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Main Timer Display */}
      <div className="relative z-10 text-center space-y-12">
        <div className="space-y-4">
          <h2 className="text-[10px] uppercase tracking-[0.5em] opacity-50">Current Iteration</h2>
          <div className="text-[12rem] leading-none font-black tracking-tighter drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="flex items-center justify-center gap-8">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-20 h-20 border-2 border-green-500/30 bg-transparent hover:bg-green-500/10 text-green-500"
            onClick={() => {
              if (!isActive) sessionStartTimeRef.current = timeLeft;
              else if (sessionStartTimeRef.current !== null) onSaveSession(sessionStartTimeRef.current - timeLeft);
              setIsActive(!isActive);
            }}
          >
            {isActive ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-16 h-16 border border-green-500/20 bg-transparent hover:bg-green-500/10 text-green-500"
            onClick={() => {
              setIsActive(false);
              setTimeLeft(60 * 60);
            }}
          >
            <RotateCcw className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-12 flex flex-col items-center gap-8 z-10">
        <div className="flex items-center gap-12">
           <div className="flex items-center gap-4 group">
             <Button
                variant="ghost"
                size="icon"
                onClick={toggleAudio}
                className={cn(
                  "hover:bg-green-500/10",
                  isAudioEnabled ? "text-green-400" : "text-green-900"
                )}
             >
               {isAudioEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
             </Button>
             <div className="flex flex-col gap-1">
               <span className="text-[8px] uppercase tracking-widest opacity-50">Binaural Beats</span>
               <input
                 type="range"
                 min="0"
                 max="1"
                 step="0.01"
                 value={volume}
                 onChange={(e) => setVolume(parseFloat(e.target.value))}
                 className="w-24 h-1 bg-green-900 rounded-lg appearance-none cursor-pointer accent-green-500"
               />
             </div>
           </div>

           <div className="h-8 w-px bg-green-900/50" />

           <div className="text-center">
             <div className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Status</div>
             <div className="text-xs">{isActive ? 'SYSTEMS NOMINAL' : 'IDLE'}</div>
           </div>
        </div>

        <p className="text-[8px] opacity-30 uppercase tracking-[0.4em]">
          Focus Chamber v2.4 // Neural Sync: {isAudioEnabled ? 'ENABLED' : 'DISABLED'}
        </p>
      </div>
    </div>
  );
}
