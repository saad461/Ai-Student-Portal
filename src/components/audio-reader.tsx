'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';

interface AudioReaderProps {
  content: string;
}

export function AudioReader({ content }: AudioReaderProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supported, setSupported] = useState(true);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    } else {
      setSupported(false);
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const cleanContent = (html: string) => {
    // Basic HTML tag removal
    return html.replace(/<[^>]*>/g, ' ')
               .replace(/&nbsp;/g, ' ')
               .replace(/\s+/g, ' ')
               .trim();
  };

  const handlePlay = () => {
    if (!synthRef.current) return;

    if (isPaused) {
      synthRef.current.resume();
      setIsSpeaking(true);
      setIsPaused(false);
      return;
    }

    const text = cleanContent(content);
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    // Try to find a good English voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-GB')) || voices.find(v => v.lang.includes('en-US'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (!synthRef.current) return;
    synthRef.current.pause();
    setIsSpeaking(false);
    setIsPaused(true);
  };

  const handleStop = () => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border border-primary/20">
      <div className="px-3 py-1 bg-primary/10 rounded-md flex items-center gap-2 mr-2">
         <Headphones className="h-4 w-4 text-primary" />
         <span className="text-[10px] font-black uppercase tracking-widest text-primary">Audio Learning</span>
      </div>

      {!isSpeaking || isPaused ? (
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/20" onClick={handlePlay}>
          <Play className="h-4 w-4 fill-current" />
        </Button>
      ) : (
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/20" onClick={handlePause}>
          <Pause className="h-4 w-4 fill-current" />
        </Button>
      )}

      {isSpeaking || isPaused ? (
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-destructive/20 text-destructive" onClick={handleStop}>
          <Square className="h-4 w-4 fill-current" />
        </Button>
      ) : null}

      {(isSpeaking || isPaused) && (
        <div className="flex-1 px-4">
           <div className="h-1 w-full bg-primary/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              />
           </div>
        </div>
      )}
    </div>
  );
}
