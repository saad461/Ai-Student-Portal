'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Volume2, VolumeX, X, Play, Pause, RotateCcw,
  CloudRain, Wind, TreePine, ShieldAlert, Sparkles,
  Terminal, ChevronRight, CheckCircle2, AlertTriangle,
  Maximize2, Eye, BrainCircuit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CodeCompiler } from './code-compiler';
import { useToast } from '@/components/ui/toast-provider';
import { supabase } from '@/lib/supabase';

interface FocusRoomProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSession: (seconds: number) => void;
  moduleIndex: number;
  moduleName: string;
}

interface AITask {
  taskTitle: string;
  problemStatement: string;
  instructions: string[];
  pseudoCode: string;
  hints: string[];
}

interface AIReview {
  feedback: string;
  lineByLine: { file: string; line: number; issue: string; suggestion: string }[];
  score: number;
  isComplete: boolean;
}

export function FocusRoom({ isOpen, onClose, onSaveSession, moduleIndex, moduleName }: FocusRoomProps) {
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [activeAmbient, setActiveAmbient] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [strikes, setStrikes] = useState(0);
  const [isViolationOpen, setIsViolationOpen] = useState(false);
  const [lastViolationType, setLastViolationType] = useState<string>('');

  const [task, setTask] = useState<AITask | null>(null);
  const [loadingTask, setLoadingTask] = useState(false);
  const [codes, setCodes] = useState({ html: '', css: '', js: '' });
  const [review, setReview] = useState<AIReview | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [showPseudoCodeRequest, setShowPseudoCodeRequest] = useState(false);
  const [pseudoCodeInput, setPseudoCodeInput] = useState('');

  const { success, error: toastError, info } = useToast();

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorLRef = useRef<OscillatorNode | null>(null);
  const oscillatorRRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fullscreen Detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull && isActive && isOpen) {
        handleViolation('Exited Fullscreen');
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isActive, isOpen]);

  // Tab Switch Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive && isOpen) {
        handleViolation('Tab Switch Detected');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, isOpen]);

  const handleViolation = async (type: string) => {
    setIsActive(false);
    setLastViolationType(type);
    setIsViolationOpen(true);
    setStrikes(prev => prev + 1);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        // Atomic point deduction via RPC
        await supabase.rpc('increment_points', { user_id: user.id, amount: -5 });
        info(`Strict Mode Violation: -5 XP deducted for ${type}`);
    }

    if (strikes >= 2) { // 3rd strike
        toastError("MAX STRIKES REACHED. Focus session terminated.");
        onClose();
    }
  };

  const startFocus = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen().catch(() => {
        toastError("Fullscreen required for Strict Focus Mode");
      });
      return;
    }

    if (!task) fetchTask();
    setIsActive(true);
    sessionStartTimeRef.current = timeLeft;
  };

  const fetchTask = async () => {
    setLoadingTask(true);
    try {
      const res = await fetch('/api/focus/generate-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleIndex, moduleName })
      });
      const data = await res.json();
      setTask(data);
    } catch (err) {
      toastError("Failed to fetch focus task.");
    } finally {
      setLoadingTask(false);
    }
  };

  const handleGetReview = async () => {
    setReviewing(true);
    try {
        const res = await fetch('/api/focus/review-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...codes,
                taskTitle: task?.taskTitle,
                problemStatement: task?.problemStatement
            })
        });
        const data = await res.json();
        setReview(data);
        if (data.isComplete) {
            success("Task objectives met! Keep focusing until the timer ends.");
            setShowPseudoCodeRequest(true);
        }
    } catch (err) {
        toastError("Review failed. Please try again.");
    } finally {
        setReviewing(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      if (isActive && sessionStartTimeRef.current !== null) {
        onSaveSession(sessionStartTimeRef.current - timeLeft);
      }
      stopBinauralBeats();
      stopAmbient();
      setIsActive(false);
      return;
    }

    const interval = setInterval(() => {
      if (isActive && timeLeft > 0) {
        setTimeLeft((prev) => prev - 1);
        if (prev <= 1) {
            // Success
            onSaveSession(sessionStartTimeRef.current! - 0);
            success("Focus Session Complete! 60 minutes logged.");
            onClose();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isActive, timeLeft, onSaveSession, onClose, success]);

  // Binaural Beats Logic
  const startBinauralBeats = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const oscL = ctx.createOscillator();
    const panL = ctx.createStereoPanner();
    oscL.frequency.value = 440;
    panL.pan.value = -1;
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

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  // Ambient Noise Logic
  const createNoiseNode = (type: 'white' | 'pink' | 'brown') => {
    if (!audioContextRef.current) return null;
    const ctx = audioContextRef.current;
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
        if (type === 'white') {
            output[i] = Math.random() * 2 - 1;
        } else if (type === 'pink') {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
        } else {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
        }
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    return noise;
  };

  const stopAmbient = () => {
    noiseNodeRef.current?.disconnect();
    noiseNodeRef.current = null;
    setActiveAmbient(null);
  };

  const toggleAmbient = (type: string) => {
    if (activeAmbient === type) {
        stopAmbient();
        return;
    }

    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    noiseNodeRef.current?.disconnect();

    let node: AudioBufferSourceNode | null = null;
    if (type === 'rain') node = createNoiseNode('pink') as any;
    if (type === 'wind') node = createNoiseNode('brown') as any;
    if (type === 'white') node = createNoiseNode('white') as any;

    if (node) {
        const ambientGain = audioContextRef.current.createGain();
        ambientGain.gain.value = volume * 0.5;
        node.connect(ambientGain).connect(audioContextRef.current.destination);
        node.start();
        noiseNodeRef.current = node;
        setActiveAmbient(type);
    }
  };

  const toggleAudio = () => {
    if (isAudioEnabled) stopBinauralBeats();
    else startBinauralBeats();
    setIsAudioEnabled(!isAudioEnabled);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] bg-black text-green-500 font-mono flex flex-col animate-in fade-in duration-700">
      {/* Immersive Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 border-b border-green-900/30 bg-black/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full animate-pulse", isActive ? "bg-red-500" : "bg-slate-700")} />
            <span className="text-[10px] uppercase font-black tracking-[0.2em]">Deep Work Protocol {isActive ? 'Active' : 'Standby'}</span>
          </div>
          <div className="text-xl font-black text-white">{formatTime(timeLeft)}</div>
          <div className="h-6 w-px bg-green-900/30" />
          <div className="flex items-center gap-2">
            <span className="text-[8px] uppercase opacity-50">Strikes:</span>
            <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className={cn("h-1.5 w-4 rounded-full transition-colors", i < strikes ? "bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]" : "bg-green-900/30")} />
                ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-green-500/5 px-3 py-1 rounded-full border border-green-500/20">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span className="text-[10px] font-black uppercase">{moduleName}</span>
           </div>
           <Button variant="ghost" size="icon" onClick={() => {
             if (isActive) handleViolation('Manual Exit');
             else onClose();
           }} className="text-green-500 hover:bg-red-500/10 hover:text-red-500 rounded-full h-8 w-8">
             <X className="h-5 w-5" />
           </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Instructions & Feedback */}
        <div className="w-80 border-r border-green-900/30 flex flex-col bg-black/40 backdrop-blur-sm z-10 overflow-y-auto">
            {!isActive && !isFullscreen ? (
                <div className="p-8 flex flex-col items-center justify-center h-full text-center space-y-6">
                    <ShieldAlert className="h-12 w-12 text-red-500" />
                    <div className="space-y-2">
                        <h3 className="text-sm font-black uppercase text-white">System Locked</h3>
                        <p className="text-[10px] opacity-70 leading-relaxed">
                            STRICT MODE REQUIRES FULLSCREEN. UNINTERRUPTED CONCENTRATION IS MANDATORY.
                            VIOLATIONS RESULT IN XP PENALTIES.
                        </p>
                    </div>
                    <Button onClick={startFocus} className="w-full bg-green-600 hover:bg-green-700 text-black font-black uppercase text-[10px] py-6 rounded-none">
                        <Maximize2 className="mr-2 h-4 w-4" /> Initialize Protocol
                    </Button>
                </div>
            ) : (
                <div className="p-6 space-y-8">
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2">
                                <BrainCircuit className="h-3 w-3 text-green-400" /> Neural Task
                            </h3>
                            {loadingTask && <div className="animate-spin h-3 w-3 border-b-2 border-white rounded-full" />}
                        </div>
                        {task ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left duration-500">
                                <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                                    <p className="text-xs font-black text-white mb-2 uppercase tracking-tighter">{task.taskTitle}</p>
                                    <p className="text-[10px] leading-relaxed opacity-80">{task.problemStatement}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[8px] font-black uppercase opacity-50 tracking-[0.2em]">Execution Steps</p>
                                    {task.instructions.map((step, i) => (
                                        <div key={i} className="flex gap-2 text-[10px]">
                                            <span className="text-green-500 font-black">{i + 1}.</span>
                                            <span className="opacity-70">{step}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2 pt-4 border-t border-green-900/20">
                                     <p className="text-[8px] font-black uppercase opacity-50 tracking-[0.2em] flex items-center gap-2">
                                        <Eye className="h-3 w-3" /> Logical Pattern (Pseudo)
                                     </p>
                                     <pre className="text-[9px] bg-black/60 p-3 rounded border border-green-900/30 font-mono text-green-400/70 whitespace-pre-wrap leading-relaxed italic">
                                        {task.pseudoCode}
                                     </pre>
                                </div>
                            </div>
                        ) : !loadingTask && (
                             <Button onClick={fetchTask} variant="outline" className="w-full border-green-500/30 text-[10px] font-black uppercase py-8">
                                <Sparkles className="h-4 w-4 mr-2" /> Generate Task
                             </Button>
                        )}
                    </section>

                    {review && (
                        <section className="space-y-4 pt-4 border-t border-green-900/30 animate-in slide-in-from-bottom duration-500">
                             <h3 className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2">
                                <Terminal className="h-3 w-3 text-yellow-400" /> AI Feedback
                            </h3>
                            <div className={cn(
                                "p-4 rounded-lg border",
                                review.isComplete ? "bg-green-500/10 border-green-500/30" : "bg-yellow-500/10 border-yellow-500/30"
                            )}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-white uppercase">Score: {review.score}%</span>
                                    {review.isComplete && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                                </div>
                                <p className="text-[10px] leading-relaxed opacity-90">{review.feedback}</p>
                            </div>
                            {review.lineByLine.length > 0 && (
                                <div className="space-y-2">
                                     <p className="text-[8px] font-black uppercase opacity-50 tracking-[0.2em]">Key Improvements</p>
                                     {review.lineByLine.slice(0, 3).map((line, i) => (
                                         <div key={i} className="p-2 bg-red-500/5 border border-red-500/10 rounded text-[9px]">
                                             <p className="font-bold text-red-400 mb-1">{line.file} - Line {line.line}</p>
                                             <p className="opacity-70 italic">{line.issue}</p>
                                         </div>
                                     ))}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            )}
        </div>

        {/* Center Side: Compiler */}
        <div className="flex-1 flex flex-col bg-black/20 p-4 relative">
             <CodeCompiler
                className="flex-1 border-green-900/30"
                isDark
                onChange={setCodes}
             />

             {/* Bottom AI Trigger */}
             <div className="absolute bottom-10 right-10 z-20">
                 <Button
                    onClick={handleGetReview}
                    disabled={reviewing || !isActive || !task}
                    className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:scale-110 active:scale-90"
                 >
                    {reviewing ? <div className="animate-spin h-6 w-6 border-b-2 border-black rounded-full" /> : <Sparkles className="h-6 w-6" />}
                 </Button>
             </div>

             {/* Pseudo-code Request Overlay */}
             {showPseudoCodeRequest && (
                 <div className="absolute inset-4 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center animate-in zoom-in duration-300">
                    <BrainCircuit className="h-16 w-16 text-green-500 mb-6 animate-pulse" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Logic Verification Required</h2>
                    <p className="text-sm opacity-70 mb-8 max-w-md">
                        Your code passed the tests, but true mastery is understanding the "Why".
                        Explain the logic of your JS functions in plain text/pseudo-code below to continue.
                    </p>
                    <textarea
                        className="w-full max-w-lg bg-green-500/5 border border-green-500/30 rounded-xl p-6 text-sm text-green-400 font-mono focus:outline-none focus:ring-1 focus:ring-green-500 mb-6"
                        rows={6}
                        placeholder="Write your pseudo-code logic here..."
                        value={pseudoCodeInput}
                        onChange={(e) => setPseudoCodeInput(e.target.value)}
                    />
                    <Button
                        onClick={() => {
                            if (pseudoCodeInput.length < 50) {
                                toastError("Please provide a more detailed explanation.");
                                return;
                            }
                            setShowPseudoCodeRequest(false);
                            success("Logic verified. Deep focus continues.");
                        }}
                        className="bg-green-600 hover:bg-green-700 text-black font-black uppercase px-12"
                    >
                        Submit Logic Log
                    </Button>
                 </div>
             )}
        </div>
      </div>

      {/* Violation Dialog */}
      {isViolationOpen && (
          <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6">
              <div className="max-w-md w-full border-2 border-red-600 bg-red-600/5 p-12 text-center space-y-8 animate-in zoom-in duration-300">
                  <ShieldAlert className="h-20 w-20 text-red-600 mx-auto animate-bounce" />
                  <div className="space-y-4">
                      <h2 className="text-3xl font-black text-red-600 uppercase tracking-tighter italic">PROTOCOL BREACH</h2>
                      <p className="text-sm font-bold text-white uppercase tracking-widest">{lastViolationType}</p>
                      <p className="text-xs opacity-70 leading-relaxed">
                          STRICT MODE REQUIRES UNINTERRUPTED PRESENCE. YOUR NEURAL SYNC HAS BEEN DEGRADED.
                          XP PENALTY APPLIED. STRIKE {strikes}/3 RECORDED.
                      </p>
                  </div>
                  <div className="flex gap-4">
                      <Button
                        onClick={() => {
                            setIsViolationOpen(false);
                            if (strikes < 3) startFocus();
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase h-14"
                      >
                          RE-INITIALIZE
                      </Button>
                  </div>
              </div>
          </div>
      )}

      {/* Footer Controls */}
      <div className="p-4 border-t border-green-900/30 bg-black/50 backdrop-blur-md flex justify-between items-center z-10">
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleAudio}
                    className={cn("h-8 w-8", isAudioEnabled ? "text-green-400" : "text-slate-700")}
                >
                    {isAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <input
                    type="range" min="0" max="1" step="0.01" value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-green-900/30 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
            </div>
            <div className="flex gap-2">
                {['rain', 'wind', 'white'].map(type => (
                    <Button
                        key={type}
                        variant="ghost" size="sm"
                        className={cn("h-7 text-[8px] font-black uppercase px-3 rounded-full border border-transparent", activeAmbient === type ? "bg-green-500/20 text-green-400 border-green-500/30" : "text-slate-700")}
                        onClick={() => toggleAmbient(type)}
                    >
                        {type}
                    </Button>
                ))}
            </div>
         </div>

         <div className="flex items-center gap-4 text-[10px] font-black uppercase">
            <span className="opacity-30">V2.8 NEURAL_STRICT_CORE</span>
            <div className="h-4 w-px bg-green-900/30" />
            <span className={cn(isActive ? "text-red-500" : "text-green-500")}>
                {isActive ? 'RECORDING SESSION' : 'SYSTEM IDLE'}
            </span>
         </div>
      </div>
    </div>
  );
}
