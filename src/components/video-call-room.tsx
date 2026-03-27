'use client';

import { useState, useEffect, useRef } from 'react';
import { Video, Mic, MicOff, VideoOff, Monitor, PhoneOff, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface VideoCallRoomProps {
  sessionId: string;
  userId: string;
  onClose: () => void;
}

export function VideoCallRoom({ sessionId, userId, onClose }: VideoCallRoomProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const screenStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    const initCall = async () => {
      // 1. Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // 2. Initialize Peer Connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnection.current = pc;

      // 3. Add tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // 4. Handle remote tracks
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };

      // 5. Handle ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await supabase.from('webrtc_signals').insert({
            session_id: sessionId,
            sender_id: userId,
            type: 'ice-candidate',
            payload: event.candidate
          });
        }
      };

      // 6. Listen for signaling
      const channel = supabase
        .channel(`signaling:${sessionId}`)
        .on('postgres_changes', {
           event: 'INSERT',
           schema: 'public',
           table: 'webrtc_signals',
           filter: `session_id=eq.${sessionId}`
        }, async (payload) => {
           const signal = payload.new;
           if (signal.sender_id === userId) return;

           if (signal.type === 'offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await supabase.from('webrtc_signals').insert({
                 session_id: sessionId,
                 sender_id: userId,
                 type: 'answer',
                 payload: answer
              });
           } else if (signal.type === 'answer') {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
           } else if (signal.type === 'ice-candidate') {
              await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
           }
        })
        .subscribe();

      // 7. Initial offer if we're the one starting
      // We'll let both try, the first one to insert 'offer' wins.
      // But for simplicity, we'll just check if an offer exists.
      const { data: existingOffer } = await supabase
        .from('webrtc_signals')
        .select('*')
        .eq('session_id', sessionId)
        .eq('type', 'offer')
        .limit(1);

      if (!existingOffer || existingOffer.length === 0) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await supabase.from('webrtc_signals').insert({
           session_id: sessionId,
           sender_id: userId,
           type: 'offer',
           payload: offer
        });
      }

      return () => {
         stream.getTracks().forEach(t => t.stop());
         pc.close();
         supabase.removeChannel(channel);
      };
    };

    initCall();
  }, [sessionId, userId]);

  const toggleVideo = () => {
    if (localStream) {
      const track = localStream.getVideoTracks()[0];
      track.enabled = !track.enabled;
      setIsVideoEnabled(track.enabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const track = localStream.getAudioTracks()[0];
      track.enabled = !track.enabled;
      setIsAudioEnabled(track.enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStream.current = stream;
        const videoTrack = stream.getVideoTracks()[0];

        const sender = peerConnection.current?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);

        videoTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error("Error sharing screen:", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStream.current) {
      screenStream.current.getTracks().forEach(t => t.stop());
      const videoTrack = localStream?.getVideoTracks()[0];
      if (videoTrack) {
        const sender = peerConnection.current?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      }
      setIsScreenSharing(false);
    }
  };

  const endCall = async () => {
    localStream?.getTracks().forEach(t => t.stop());
    screenStream.current?.getTracks().forEach(t => t.stop());
    peerConnection.current?.close();
    await supabase.from('video_sessions').update({ is_ringing: false }).eq('id', sessionId);
    onClose();
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 transition-all",
      isFullscreen ? "p-0" : "p-4"
    )}>
      <div className="relative w-full h-full max-w-6xl aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
         {/* Remote Video (Large) */}
         <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            {remoteStream ? (
               <video
                 ref={remoteVideoRef}
                 autoPlay
                 playsInline
                 className="w-full h-full object-contain"
               />
            ) : (
               <div className="flex flex-col items-center gap-4 text-white opacity-40 animate-pulse">
                  <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center">
                     <Video className="h-10 w-10" />
                  </div>
                  <p className="font-bold uppercase tracking-widest text-sm">Waiting for other party...</p>
               </div>
            )}

            {/* Local Video (Small Overlay) */}
            <div className="absolute bottom-6 right-6 w-48 h-32 md:w-64 md:h-44 bg-slate-800 rounded-2xl overflow-hidden border-2 border-primary/50 shadow-xl z-10">
               <video
                 ref={localVideoRef}
                 autoPlay
                 muted
                 playsInline
                 className={cn("w-full h-full object-cover", !isVideoEnabled && "hidden")}
               />
               {!isVideoEnabled && (
                  <div className="w-full h-full flex items-center justify-center text-white/40 bg-slate-900">
                     <VideoOff className="h-8 w-8" />
                  </div>
               )}
            </div>
         </div>

         {/* Controls */}
         <div className="p-6 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between border-t border-white/5">
            <div className="flex items-center gap-2">
               <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full hover:bg-white/10 text-white"
                onClick={() => setIsFullscreen(!isFullscreen)}
               >
                  {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
               </Button>
            </div>

            <div className="flex items-center gap-4">
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={toggleAudio}
                 className={cn(
                   "h-14 w-14 rounded-full transition-all border border-white/10",
                   isAudioEnabled ? "bg-white/10 text-white" : "bg-red-500 text-white"
                 )}
               >
                  {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
               </Button>
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={toggleVideo}
                 className={cn(
                   "h-14 w-14 rounded-full transition-all border border-white/10",
                   isVideoEnabled ? "bg-white/10 text-white" : "bg-red-500 text-white"
                 )}
               >
                  {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
               </Button>
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={toggleScreenShare}
                 className={cn(
                   "h-14 w-14 rounded-full transition-all border border-white/10",
                   isScreenSharing ? "bg-primary text-primary-foreground" : "bg-white/10 text-white"
                 )}
               >
                  <Monitor className="h-6 w-6" />
               </Button>
               <Button
                 variant="destructive"
                 size="icon"
                 onClick={endCall}
                 className="h-14 w-16 rounded-3xl"
               >
                  <PhoneOff className="h-6 w-6" />
               </Button>
            </div>

            <div className="w-12" /> {/* Spacer for symmetry */}
         </div>

         {/* Overlay Info */}
         <div className="absolute top-6 left-6 flex items-center gap-3 z-20">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Live Call</span>
         </div>
      </div>
    </div>
  );
}
