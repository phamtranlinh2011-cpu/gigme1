import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneOff,
  PhoneCall,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  User,
  Radio,
  Wifi,
  Activity,
  Video,
  VideoOff,
  Camera,
  Check,
  X,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';

export const VoipCallOverlay: React.FC = () => {
  const {
    activeVoipCall,
    endVoipCall,
    toggleMuteVoip,
    toggleVideoVoip,
    acceptIncomingCall,
    language,
  } = useGigMe();

  const [seconds, setSeconds] = useState(0);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [connectionState, setConnectionState] = useState<'CONNECTING' | 'ICE_CHECKING' | 'CONNECTED'>('CONNECTING');
  const [latency, setLatency] = useState(24);
  const [hasCameraError, setHasCameraError] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Call duration timer & WebRTC connection state progression
  useEffect(() => {
    if (!activeVoipCall || activeVoipCall.isIncoming) {
      setSeconds(0);
      setConnectionState('CONNECTING');
      return;
    }

    const t1 = setTimeout(() => setConnectionState('ICE_CHECKING'), 800);
    const t2 = setTimeout(() => setConnectionState('CONNECTED'), 1600);

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
      setLatency(20 + Math.floor(Math.random() * 12));
    }, 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(interval);
    };
  }, [activeVoipCall?.isIncoming, !activeVoipCall]);

  // WebRTC Audio/Video Stream & Visualizer
  useEffect(() => {
    if (!activeVoipCall || activeVoipCall.isIncoming) {
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

    const setupMedia = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const wantVideo = !!activeVoipCall.isVideo && !activeVoipCall.isVideoOff;
          let stream: MediaStream | null = null;

          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: wantVideo ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
            });
          } catch (camErr) {
            console.warn('Camera/mic full permission denied, attempting audio only:', camErr);
            setHasCameraError(true);
            try {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            } catch (audErr) {
              console.warn('Audio permission also denied, running in simulated WebRTC mode:', audErr);
            }
          }

          if (!isSubscribed) {
            if (stream) stream.getTracks().forEach((t) => t.stop());
            return;
          }

          if (stream) {
            streamRef.current = stream;

            if (localVideoRef.current && wantVideo) {
              localVideoRef.current.srcObject = stream;
            }

            // Setup audio analyzer
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) {
              const audioCtx = new AudioCtx();
              audioContextRef.current = audioCtx;

              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 64;
              analyserRef.current = analyser;

              const audioTracks = stream.getAudioTracks();
              if (audioTracks.length > 0) {
                const source = audioCtx.createMediaStreamSource(stream);
                source.connect(analyser);

                const canvas = canvasRef.current;
                if (canvas) {
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    const bufferLength = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);

                    const draw = () => {
                      if (!isSubscribed) return;
                      animFrameIdRef.current = requestAnimationFrame(draw);
                      analyser.getByteFrequencyData(dataArray);

                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                      const barWidth = (canvas.width / bufferLength) * 2.2;
                      let barHeight: number;
                      let x = 0;

                      for (let i = 0; i < bufferLength; i++) {
                        barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
                        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
                        gradient.addColorStop(0, '#00E5FF');
                        gradient.addColorStop(1, '#3B82F6');

                        ctx.fillStyle = gradient;
                        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                        x += barWidth + 1;
                      }
                    };

                    draw();
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('WebRTC media setup fallback notice:', err);
      }
    };

    setupMedia();

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
  }, [activeVoipCall?.isVideo, activeVoipCall?.isVideoOff, activeVoipCall?.isIncoming]);

  if (!activeVoipCall) return null;

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ==========================================
  // CASE 1: INCOMING CALL RINGING DIALOG
  // ==========================================
  if (activeVoipCall.isIncoming) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
        <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#101A2E] via-[#0A101C] to-[#060911] border-2 border-emerald-500/50 p-6 text-center shadow-[0_0_60px_rgba(16,185,129,0.35)] relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-[#C5E5EC] to-teal-400" />
          
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black mb-4">
            {activeVoipCall.isVideo ? <Video className="w-3.5 h-3.5 animate-pulse" /> : <PhoneCall className="w-3.5 h-3.5 animate-pulse" />}
            <span>{activeVoipCall.isVideo ? (language === 'vi' ? 'Cuộc Gọi Video Đến...' : 'Incoming Video Call...') : (language === 'vi' ? 'Cuộc Gọi Thoại Đến...' : 'Incoming Voice Call...')}</span>
          </div>

          {/* Caller Avatar */}
          <div className="relative mx-auto w-24 h-24 mb-4">
            <div className="absolute inset-0 rounded-full bg-emerald-500/25 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-[#3064AE] flex items-center justify-center text-white text-3xl font-black shadow-lg border-2 border-white/30 overflow-hidden">
              {activeVoipCall.partnerAvatarUrl ? (
                <img src={activeVoipCall.partnerAvatarUrl} alt={activeVoipCall.partnerName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12" />
              )}
            </div>
          </div>

          <h3 className="text-xl font-extrabold text-white">{activeVoipCall.partnerName}</h3>
          <p className="text-xs text-emerald-400 font-semibold mt-1">
            {activeVoipCall.partnerRole || (language === 'vi' ? 'Đối tác Campus' : 'Campus Partner')}
          </p>
          <p className="text-[11px] text-[#C5E5EC]/70 mt-1 font-mono">
            {activeVoipCall.maskedPhoneNumber}
          </p>

          <p className="text-xs text-slate-300 mt-4 animate-pulse">
            {language === 'vi' ? 'Đang đổ chuông trực tuyến qua WebRTC DTLS-SRTP...' : 'Ringing encrypted WebRTC P2P...'}
          </p>

          {/* Action buttons: Answer & Decline */}
          <div className="mt-6 flex items-center justify-center space-x-6">
            {/* Decline */}
            <button
              onClick={endVoipCall}
              className="flex flex-col items-center space-y-1.5 cursor-pointer group"
              title={language === 'vi' ? 'Từ chối cuộc gọi' : 'Decline call'}
            >
              <div className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40 group-active:scale-95 transition">
                <PhoneOff className="w-6 h-6" />
              </div>
              <span className="text-[11px] text-red-400 font-bold">{language === 'vi' ? 'Từ chối' : 'Decline'}</span>
            </button>

            {/* Answer */}
            <button
              onClick={acceptIncomingCall}
              className="flex flex-col items-center space-y-1.5 cursor-pointer group"
              title={language === 'vi' ? 'Nghe máy' : 'Answer call'}
            >
              <div className="p-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/40 group-active:scale-95 transition animate-bounce">
                <PhoneCall className="w-6 h-6" />
              </div>
              <span className="text-[11px] text-emerald-400 font-bold">{language === 'vi' ? 'Nghe máy' : 'Answer'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CASE 2: CONNECTED CALL (VOICE OR VIDEO)
  // ==========================================
  const isVideoMode = !!activeVoipCall.isVideo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className={`w-full ${isVideoMode ? 'max-w-xl' : 'max-w-sm'} rounded-3xl bg-gradient-to-b from-[#101A2E] via-[#0A101C] to-[#060911] border-2 border-[#00E5FF]/40 p-5 sm:p-6 text-center shadow-[0_0_60px_rgba(0,229,255,0.3)] relative overflow-hidden`}>
        {/* Glowing aura */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Security & WebRTC Status Badges */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#00E5FF]/15 border border-[#00E5FF]/30 text-[#00E5FF] text-[11px] font-extrabold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isVideoMode ? 'WebRTC HD Video (H.264/VP9)' : 'WebRTC Opus P2P (DTLS-SRTP)'}</span>
          </div>

          <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
            <Wifi className="w-3 h-3" />
            <span>{latency}ms</span>
          </div>
        </div>

        {/* VIDEO MODE VIEW */}
        {isVideoMode ? (
          <div className="space-y-3">
            {/* Main Video Screen (Remote Feed simulation / Live) */}
            <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden bg-slate-900 border border-[#00E5FF]/30 flex items-center justify-center shadow-inner">
              {/* Remote feed content */}
              <div className="flex flex-col items-center justify-center text-center p-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#3064AE] via-[#00E5FF] to-teal-500 flex items-center justify-center text-white text-2xl font-black shadow-lg border-2 border-white/20 mb-2 overflow-hidden">
                  {activeVoipCall.partnerAvatarUrl ? (
                    <img src={activeVoipCall.partnerAvatarUrl} alt={activeVoipCall.partnerName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10" />
                  )}
                </div>
                <h4 className="font-extrabold text-white text-sm">{activeVoipCall.partnerName}</h4>
                <p className="text-[11px] text-[#00E5FF] font-semibold">{activeVoipCall.partnerRole || 'Campus Video Feed'}</p>
                <div className="mt-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-black/50 border border-white/20 text-[10px] text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>1080p @ 30FPS</span>
                </div>
              </div>

              {/* Picture-in-Picture Local Camera View */}
              <div className="absolute top-3 right-3 w-24 h-32 sm:w-28 sm:h-36 rounded-xl bg-black/80 border-2 border-[#00E5FF]/60 overflow-hidden shadow-2xl flex flex-col items-center justify-center">
                {activeVoipCall.isVideoOff || hasCameraError ? (
                  <div className="flex flex-col items-center justify-center p-1 text-slate-400">
                    <VideoOff className="w-6 h-6 mb-1 text-red-400" />
                    <span className="text-[9px] font-bold text-center">{language === 'vi' ? 'Camera tắt' : 'Cam off'}</span>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                  />
                )}
                <span className="absolute bottom-1 left-1 px-1 rounded bg-black/60 text-[8px] text-white font-bold">
                  {language === 'vi' ? 'Bạn' : 'You'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between px-2 text-xs text-slate-300">
              <span className="font-mono text-emerald-400 font-extrabold">{formatTime(seconds)}</span>
              <span className="text-[11px] text-[#00E5FF] font-mono">{activeVoipCall.maskedPhoneNumber}</span>
            </div>
          </div>
        ) : (
          /* AUDIO ONLY MODE VIEW */
          <>
            {/* Avatar with Sound Pulse Ring */}
            <div className="relative mx-auto w-24 h-24 mb-3">
              <div className="absolute inset-0 rounded-full bg-[#00E5FF]/25 animate-ping" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-[#00E5FF] via-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-black shadow-lg border-2 border-white/30 overflow-hidden">
                {activeVoipCall.partnerAvatarUrl ? (
                  <img src={activeVoipCall.partnerAvatarUrl} alt={activeVoipCall.partnerName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12" />
                )}
              </div>
            </div>

            <h3 className="text-xl font-extrabold text-white">{activeVoipCall.partnerName}</h3>
            <p className="text-xs text-[#00E5FF] font-semibold mt-0.5">
              {language === 'vi' ? 'Số che danh tính: ' : 'Masked Caller ID: '}
              {activeVoipCall.maskedPhoneNumber}
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
                  ? language === 'vi' ? 'Đã kết nối WebRTC trực tiếp (Direct Audio P2P)' : 'Direct WebRTC Connected (P2P Audio)'
                  : language === 'vi' ? 'Đang bắt tay WebRTC STUN/ICE Server...' : 'Handshaking WebRTC STUN/ICE Server...'}
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
                  <span>{language === 'vi' ? 'Phổ âm thanh giọng nói (Voice Wave)' : 'Realtime Voice Waveform'}</span>
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
          </>
        )}

        {/* Audio / Video Controls */}
        <div className="mt-6 flex items-center justify-center space-x-3 sm:space-x-4">
          {/* Mute Mic Button */}
          <button
            onClick={toggleMuteVoip}
            className={`p-3.5 rounded-full border transition transform active:scale-95 cursor-pointer ${
              activeVoipCall.isMuted
                ? 'bg-red-500/20 text-red-400 border-red-500 shadow-md shadow-red-500/20'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            title={activeVoipCall.isMuted ? (language === 'vi' ? 'Bật micro' : 'Unmute') : (language === 'vi' ? 'Tắt micro' : 'Mute')}
            aria-label="Toggle Mute"
          >
            {activeVoipCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle Button (If in video mode) */}
          {isVideoMode && (
            <button
              onClick={toggleVideoVoip}
              className={`p-3.5 rounded-full border transition transform active:scale-95 cursor-pointer ${
                activeVoipCall.isVideoOff
                  ? 'bg-red-500/20 text-red-400 border-red-500 shadow-md'
                  : 'bg-cyan-500/20 text-[#00E5FF] border-[#00E5FF]/50 shadow-md shadow-cyan-500/20'
              }`}
              title={activeVoipCall.isVideoOff ? (language === 'vi' ? 'Bật Camera' : 'Turn on Camera') : (language === 'vi' ? 'Tắt Camera' : 'Turn off Camera')}
              aria-label="Toggle Camera"
            >
              {activeVoipCall.isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* Speaker Button */}
          <button
            onClick={() => setIsSpeakerOn((p) => !p)}
            className={`p-3.5 rounded-full border transition transform active:scale-95 cursor-pointer ${
              isSpeakerOn
                ? 'bg-cyan-500/20 text-[#00E5FF] border-[#00E5FF]/50 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title={language === 'vi' ? 'Loa ngoài' : 'Speaker'}
            aria-label="Toggle Speaker"
          >
            {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* End Call Button */}
          <button
            id="end-voip-call-btn"
            onClick={endVoipCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.6)] transition transform hover:scale-105 active:scale-95 cursor-pointer"
            title={language === 'vi' ? 'Kết thúc cuộc gọi' : 'End Call'}
            aria-label="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoipCallOverlay;
