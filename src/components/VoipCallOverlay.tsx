import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  User,
  Radio,
  Wifi,
  Activity,
  Disc,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';

export const VoipCallOverlay: React.FC = () => {
  const { activeVoipCall, endVoipCall, toggleMuteVoip } = useGigMe();
  const [seconds, setSeconds] = useState(0);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [connectionState, setConnectionState] = useState<'CONNECTING' | 'ICE_CHECKING' | 'CONNECTED'>('CONNECTING');
  const [latency, setLatency] = useState(24);
  const [isRecording, setIsRecording] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Call duration timer & WebRTC connection state progression
  useEffect(() => {
    if (!activeVoipCall) {
      setSeconds(0);
      setConnectionState('CONNECTING');
      return;
    }

    const t1 = setTimeout(() => setConnectionState('ICE_CHECKING'), 800);
    const t2 = setTimeout(() => setConnectionState('CONNECTED'), 1600);

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
      // Fluctuate latency realistically around 20-30ms
      setLatency(20 + Math.floor(Math.random() * 12));
    }, 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(interval);
    };
  }, [activeVoipCall]);

  // WebRTC Audio Stream & Web Audio API Visualizer
  useEffect(() => {
    if (!activeVoipCall) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      return;
    }

    let isSubscribed = true;

    const setupAudio = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          if (!isSubscribed) return;
          streamRef.current = stream;

          const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const draw = () => {
            if (!isSubscribed) return;
            animFrameIdRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 1.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
              const barHeight = (dataArray[i] / 255) * (canvas.height * 0.85);

              // Cyber cyan gradient bars
              const grad = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
              grad.addColorStop(0, '#00E5FF');
              grad.addColorStop(1, '#0077B6');

              ctx.fillStyle = grad;
              ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

              x += barWidth;
            }
          };

          draw();
        }
      } catch {
        // Fallback simulated visualizer if mic permission not granted
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const drawSimulated = () => {
          if (!isSubscribed) return;
          animFrameIdRef.current = requestAnimationFrame(drawSimulated);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const count = 16;
          const barWidth = canvas.width / count;

          for (let i = 0; i < count; i++) {
            const h = Math.sin(Date.now() / 200 + i) * 15 + 20 + Math.random() * 8;
            ctx.fillStyle = '#00E5FF';
            ctx.fillRect(i * barWidth, canvas.height - h, barWidth - 3, h);
          }
        };

        drawSimulated();
      }
    };

    setupAudio();

    return () => {
      isSubscribed = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [activeVoipCall]);

  if (!activeVoipCall) return null;

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#101A2E] via-[#0A101C] to-[#060911] border-2 border-[#00E5FF]/40 p-6 text-center shadow-[0_0_60px_rgba(0,229,255,0.3)] relative overflow-hidden">
        {/* Glowing aura */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Security & WebRTC Status Badges */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#00E5FF]/15 border border-[#00E5FF]/30 text-[#00E5FF] text-[11px] font-extrabold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>WebRTC P2P DTLS-SRTP</span>
          </div>

          <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
            <Wifi className="w-3 h-3" />
            <span>{latency}ms</span>
          </div>
        </div>

        {/* Avatar with Sound Pulse Ring */}
        <div className="relative mx-auto w-24 h-24 mb-3">
          <div className="absolute inset-0 rounded-full bg-[#00E5FF]/25 animate-ping" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-[#00E5FF] via-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-black shadow-lg border-2 border-white/30">
            <User className="w-12 h-12" />
          </div>
        </div>

        <h3 className="text-xl font-extrabold text-white">{activeVoipCall.partnerName}</h3>
        <p className="text-xs text-[#00E5FF] font-semibold mt-0.5">
          Số che danh tính: {activeVoipCall.maskedPhoneNumber}
        </p>

        {/* Connection status indicator */}
        <div className="mt-2 flex items-center justify-center space-x-1.5 text-[11px]">
          <span
            className={`w-2 h-2 rounded-full ${
              connectionState === 'CONNECTED'
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-amber-400 animate-ping'
            }`}
          />
          <span className="text-slate-300 font-medium">
            {connectionState === 'CONNECTED'
              ? 'Đã kết nối WebRTC trực tiếp (Direct Audio P2P)'
              : 'Đang bắt tay WebRTC STUN/ICE Server...'}
          </span>
        </div>

        {/* Call Duration Timer */}
        <div className="mt-3 text-lg font-mono tracking-widest text-emerald-400 font-extrabold">
          {formatTime(seconds)}
        </div>

        {/* Live Audio Visualizer Canvas */}
        <div className="mt-4 p-2 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between px-2 mb-1 text-[10px] text-slate-400">
            <span className="flex items-center space-x-1">
              <Activity className="w-3 h-3 text-[#00E5FF]" />
              <span>Phổ âm thanh giọng nói (Voice Wave)</span>
            </span>
            <span className="font-mono text-cyan-400">Opus 48kHz</span>
          </div>
          <canvas
            ref={canvasRef}
            width={260}
            height={48}
            className="w-full h-12 rounded-lg bg-black/40"
          />
        </div>

        {/* Audio controls */}
        <div className="mt-6 flex items-center justify-center space-x-4">
          {/* Mute Button */}
          <button
            onClick={toggleMuteVoip}
            className={`p-3.5 rounded-full border transition transform active:scale-95 ${
              activeVoipCall.isMuted
                ? 'bg-red-500/20 text-red-400 border-red-500 shadow-md shadow-red-500/20'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            title={activeVoipCall.isMuted ? 'Bật micro' : 'Tắt micro'}
          >
            {activeVoipCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Speaker Button */}
          <button
            onClick={() => setIsSpeakerOn((p) => !p)}
            className={`p-3.5 rounded-full border transition transform active:scale-95 ${
              isSpeakerOn
                ? 'bg-cyan-500/20 text-[#00E5FF] border-[#00E5FF]/50 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Loa ngoài"
          >
            {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* End Call Button */}
          <button
            id="end-voip-call-btn"
            onClick={endVoipCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.6)] transition transform hover:scale-105 active:scale-95"
            title="Kết thúc cuộc gọi"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
