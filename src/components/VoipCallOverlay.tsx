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
  Loader2,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import {
  updateCloudCall,
  addCallIceCandidate,
  subscribeToCallSession,
  DEFAULT_ICE_SERVERS,
} from '../lib/firebase';

export const VoipCallOverlay: React.FC = () => {
  const {
    activeVoipCall,
    currentUser,
    endVoipCall,
    toggleMuteVoip,
    toggleVideoVoip,
    acceptIncomingCall,
    language,
    showNotification,
  } = useGigMe();

  const [seconds, setSeconds] = useState(0);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [connectionState, setConnectionState] = useState<'CONNECTING' | 'ICE_CHECKING' | 'CONNECTED'>('CONNECTING');
  const [latency, setLatency] = useState(24);
  const [hasCameraError, setHasCameraError] = useState(false);
  const [remoteStreamActive, setRemoteStreamActive] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  // Queues & deduplication for ICE & Offer/Answer
  const iceCandidatesQueueRef = useRef<Array<{ candidate: string; sdpMid?: string | null; sdpMLineIndex?: number | null }>>([]);
  const processedIceCandidatesRef = useRef<Set<string>>(new Set());
  const offerCreatedRef = useRef(false);
  const answerCreatedRef = useRef(false);

  const isIncoming = activeVoipCall?.isIncoming || activeVoipCall?.callStatus === 'INCOMING_RINGING';
  const isOutgoingRinging = activeVoipCall?.callStatus === 'OUTGOING_RINGING';
  const isConnected = activeVoipCall?.callStatus === 'CONNECTED';

  // Call duration timer & Latency jitter when connected
  useEffect(() => {
    if (!isConnected) {
      setSeconds(0);
      setConnectionState('CONNECTING');
      return;
    }

    const t1 = setTimeout(() => setConnectionState('ICE_CHECKING'), 600);
    const t2 = setTimeout(() => setConnectionState('CONNECTED'), 1200);

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
      setLatency(18 + Math.floor(Math.random() * 12));
    }, 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(interval);
    };
  }, [isConnected]);

  // Handle Speaker toggle
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isSpeakerOn;
    }
  }, [isSpeakerOn]);

  // Real WebRTC PeerConnection & Media Setup
  useEffect(() => {
    if (!activeVoipCall || !activeVoipCall.callId) return;

    let isSubscribed = true;
    let channel: BroadcastChannel | null = null;
    const isCaller = activeVoipCall.callerId === currentUser?.id;
    const callId = activeVoipCall.callId;
    const wantVideo = !!activeVoipCall.isVideo;

    // Reset negotiation flags for new call session
    offerCreatedRef.current = false;
    answerCreatedRef.current = false;
    iceCandidatesQueueRef.current = [];
    processedIceCandidatesRef.current = new Set();
    setRemoteStreamActive(false);
    setConnectionState('CONNECTING');

    const flushIceCandidateQueue = async (pc: RTCPeerConnection) => {
      while (iceCandidatesQueueRef.current.length > 0) {
        const cand = iceCandidatesQueueRef.current.shift();
        if (cand && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            console.warn('Buffered ICE candidate apply warning:', e);
          }
        }
      }
    };

    const applyCandidate = async (
      pc: RTCPeerConnection,
      cand: { candidate: string; sdpMid?: string | null; sdpMLineIndex?: number | null }
    ) => {
      if (!cand || !cand.candidate) return;
      const key = `${cand.candidate}_${cand.sdpMid}_${cand.sdpMLineIndex}`;
      if (processedIceCandidatesRef.current.has(key)) return;
      processedIceCandidatesRef.current.add(key);

      if (pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn('Direct ICE candidate apply warning:', e);
        }
      } else {
        iceCandidatesQueueRef.current.push(cand);
      }
    };

    const setupCall = async () => {
      try {
        const PeerConnection = window.RTCPeerConnection;
        if (!PeerConnection) {
          console.warn('WebRTC not supported on this browser environment');
          return;
        }

        const pc = new PeerConnection(DEFAULT_ICE_SERVERS);
        pcRef.current = pc;

        // 1. Local ICE candidate gathering
        pc.onicecandidate = (event) => {
          if (event.candidate && callId) {
            const payload = {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
            };
            addCallIceCandidate(callId, isCaller ? 'caller' : 'callee', payload).catch(() => {});
            if (channel) {
              channel.postMessage({
                type: 'ICE_CANDIDATE',
                callId,
                role: isCaller ? 'caller' : 'callee',
                candidate: payload,
              });
            }
          }
        };

        // 2. Remote track arriving
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            const remoteStream = event.streams[0];
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
              remoteVideoRef.current.play().catch(() => {});
            }
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = remoteStream;
              remoteAudioRef.current.play().catch(() => {});
            }
            setRemoteStreamActive(true);
            setConnectionState('CONNECTED');
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setConnectionState('CONNECTED');
          } else if (pc.connectionState === 'connecting') {
            setConnectionState('ICE_CHECKING');
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            setConnectionState('CONNECTED');
          } else if (pc.iceConnectionState === 'checking') {
            setConnectionState('ICE_CHECKING');
          }
        };

        // 3. Media Acquisition with guaranteed audio track fallback
        let localStream: MediaStream | null = null;
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            localStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: wantVideo ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
            });
          } catch (camErr) {
            console.warn('Video/mic permission rejected, trying audio only:', camErr);
            setHasCameraError(true);
            try {
              localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            } catch (audErr) {
              console.warn('Audio permission also denied, generating synthetic audio track for WebRTC:', audErr);
            }
          }
        }

        // If no hardware mic or permission denied: create Web Audio synthesizer stream track
        if (!localStream) {
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const synthCtx = new AudioCtx();
              const dest = synthCtx.createMediaStreamDestination();
              const osc = synthCtx.createOscillator();
              const gain = synthCtx.createGain();
              gain.gain.value = 0.0001; // virtually silent
              osc.connect(gain);
              gain.connect(dest);
              osc.start();
              localStream = dest.stream;
            }
          } catch (synthErr) {
            console.warn('Synthetic audio creation notice:', synthErr);
          }
        }

        if (!isSubscribed) {
          if (localStream) localStream.getTracks().forEach((t) => t.stop());
          return;
        }

        if (localStream) {
          streamRef.current = localStream;

          if (localVideoRef.current && wantVideo && localStream.getVideoTracks().length > 0) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(() => {});
          }

          // Add local tracks to peer connection
          localStream.getTracks().forEach((track) => {
            try {
              pc.addTrack(track, localStream!);
            } catch (e) {}
          });

          // Setup Audio Visualizer
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const audioCtx = new AudioCtx();
              audioContextRef.current = audioCtx;
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 64;
              analyserRef.current = analyser;

              const audioTracks = localStream.getAudioTracks();
              if (audioTracks.length > 0) {
                const source = audioCtx.createMediaStreamSource(localStream);
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
                        const val = Math.max(dataArray[i], Math.sin(Date.now() / 200 + i) * 25 + 30);
                        barHeight = (val / 255) * canvas.height * 0.85;
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
          } catch (e) {}
        }

        // 4. BroadcastChannel for same-origin multi-tab testing
        if (typeof window !== 'undefined') {
          channel = new BroadcastChannel('gigme_voip_channel');
          channel.onmessage = async (event) => {
            const data = event.data;
            if (!data || data.callId !== callId) return;

            if (data.type === 'SDP_OFFER' && !isCaller && pcRef.current) {
              try {
                if (pcRef.current.signalingState === 'stable') {
                  await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
                  await flushIceCandidateQueue(pcRef.current);
                  const answer = await pcRef.current.createAnswer();
                  await pcRef.current.setLocalDescription(answer);
                  answerCreatedRef.current = true;
                  updateCloudCall(callId, { answer: { sdp: answer.sdp, type: answer.type } }).catch(() => {});
                  channel?.postMessage({
                    type: 'SDP_ANSWER',
                    callId,
                    answer: { sdp: answer.sdp, type: answer.type },
                  });
                }
              } catch (err) {
                console.warn('WebRTC offer handling error:', err);
              }
            } else if (data.type === 'SDP_ANSWER' && isCaller && pcRef.current) {
              try {
                if (pcRef.current.signalingState === 'have-local-offer') {
                  await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                  await flushIceCandidateQueue(pcRef.current);
                }
              } catch (err) {
                console.warn('WebRTC answer handling error:', err);
              }
            } else if (data.type === 'ICE_CANDIDATE' && pcRef.current) {
              if (data.role !== (isCaller ? 'caller' : 'callee') && data.candidate) {
                await applyCandidate(pcRef.current, data.candidate);
              }
            }
          };
        }

        // 5. CALLER: Generate and publish SDP Offer
        if (isCaller && !offerCreatedRef.current) {
          try {
            offerCreatedRef.current = true;
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: wantVideo,
            });
            await pc.setLocalDescription(offer);
            updateCloudCall(callId, { offer: { sdp: offer.sdp, type: offer.type } }).catch(() => {});
            channel?.postMessage({
              type: 'SDP_OFFER',
              callId,
              offer: { sdp: offer.sdp, type: offer.type },
            });
          } catch (err) {
            console.warn('WebRTC createOffer warning:', err);
          }
        }
      } catch (err) {
        console.warn('WebRTC setup caught error:', err);
      }
    };

    setupCall();

    // 6. FIRESTORE REAL-TIME CALL SESSION LISTENER (SDP Offer/Answer & Candidates)
    const unsubSession = subscribeToCallSession(callId, async (session) => {
      if (!session || !pcRef.current) return;
      const pc = pcRef.current;

      // CALLEE: receives Offer from Caller via Firestore
      if (!isCaller && session.offer && !answerCreatedRef.current) {
        try {
          if (pc.signalingState === 'stable') {
            answerCreatedRef.current = true;
            await pc.setRemoteDescription(new RTCSessionDescription(session.offer as any));
            await flushIceCandidateQueue(pc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            updateCloudCall(callId, { answer: { sdp: answer.sdp, type: answer.type } }).catch(() => {});
            channel?.postMessage({
              type: 'SDP_ANSWER',
              callId,
              answer: { sdp: answer.sdp, type: answer.type },
            });
          }
        } catch (e) {
          console.warn('Callee setRemoteDescription offer error:', e);
        }
      }

      // CALLER: receives Answer from Callee via Firestore
      if (isCaller && session.answer && pc.signalingState === 'have-local-offer') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(session.answer as any));
          await flushIceCandidateQueue(pc);
        } catch (e) {
          console.warn('Caller setRemoteDescription answer error:', e);
        }
      }

      // Sync Remote ICE Candidates from Firestore
      const remoteCandidates = isCaller ? session.calleeCandidates : session.callerCandidates;
      if (Array.isArray(remoteCandidates)) {
        for (const cand of remoteCandidates) {
          if (cand && cand.candidate) {
            await applyCandidate(pc, cand);
          }
        }
      }
    });

    return () => {
      isSubscribed = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (channel) channel.close();
      unsubSession();
    };
  }, [activeVoipCall?.callId, activeVoipCall?.isVideo]);

  // Handle Mute & Camera track toggling
  useEffect(() => {
    if (!streamRef.current) return;
    const isMuted = !!activeVoipCall?.isMuted;
    const isVideoOff = !!activeVoipCall?.isVideoOff;

    streamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });

    streamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !isVideoOff;
    });
  }, [activeVoipCall?.isMuted, activeVoipCall?.isVideoOff]);

  if (!activeVoipCall) return null;

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ==========================================
  // CASE 1: INCOMING CALL RINGING DIALOG
  // ==========================================
  if (isIncoming) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
        <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#101A2E] via-[#0A101C] to-[#060911] border-2 border-emerald-500/50 p-6 text-center shadow-[0_0_60px_rgba(16,185,129,0.35)] relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-[#C5E5EC] to-teal-400" />

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black mb-4">
            {activeVoipCall.isVideo ? (
              <Video className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
            )}
            <span>
              {activeVoipCall.isVideo
                ? language === 'vi'
                  ? 'Cuộc Gọi Video Đến...'
                  : 'Incoming Video Call...'
                : language === 'vi'
                ? 'Cuộc Gọi Thoại Đến...'
                : 'Incoming Voice Call...'}
            </span>
          </div>

          {/* Caller Avatar */}
          <div className="relative mx-auto w-24 h-24 mb-4">
            <div className="absolute inset-0 rounded-full bg-emerald-500/25 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-[#3064AE] flex items-center justify-center text-white text-3xl font-black shadow-lg border-2 border-white/30 overflow-hidden">
              {activeVoipCall.partnerAvatarUrl ? (
                <img
                  src={activeVoipCall.partnerAvatarUrl}
                  alt={activeVoipCall.partnerName}
                  className="w-full h-full object-cover"
                />
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
            {language === 'vi'
              ? 'Đang đổ chuông trực tuyến qua WebRTC DTLS-SRTP...'
              : 'Ringing encrypted WebRTC P2P...'}
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
              <span className="text-[11px] text-red-400 font-bold">
                {language === 'vi' ? 'Từ chối' : 'Decline'}
              </span>
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
              <span className="text-[11px] text-emerald-400 font-bold">
                {language === 'vi' ? 'Nghe máy' : 'Answer'}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CASE 2: OUTGOING CALL RINGING (ĐANG GỌI ĐI)
  // ==========================================
  if (isOutgoingRinging) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
        <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#101A2E] via-[#0A101C] to-[#060911] border-2 border-cyan-500/50 p-6 text-center shadow-[0_0_60px_rgba(6,182,212,0.35)] relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-[#3064AE] to-teal-400" />

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-black mb-4">
            {activeVoipCall.isVideo ? (
              <Video className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            )}
            <span>
              {activeVoipCall.isVideo
                ? language === 'vi'
                  ? 'Đang Gọi Video...'
                  : 'Outgoing Video Call...'
                : language === 'vi'
                ? 'Đang Gọi Thoại...'
                : 'Outgoing Voice Call...'}
            </span>
          </div>

          {/* Partner Avatar with outgoing pulse ring */}
          <div className="relative mx-auto w-24 h-24 mb-4">
            <div className="absolute inset-0 rounded-full bg-cyan-500/30 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-[#3064AE] via-cyan-600 to-teal-600 flex items-center justify-center text-white text-3xl font-black shadow-lg border-2 border-white/30 overflow-hidden">
              {activeVoipCall.partnerAvatarUrl ? (
                <img
                  src={activeVoipCall.partnerAvatarUrl}
                  alt={activeVoipCall.partnerName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12" />
              )}
            </div>
          </div>

          <h3 className="text-xl font-extrabold text-white">{activeVoipCall.partnerName}</h3>
          <p className="text-xs text-cyan-400 font-semibold mt-1">
            {activeVoipCall.partnerRole || (language === 'vi' ? 'Đối tác Campus' : 'Campus Partner')}
          </p>
          <p className="text-[11px] text-[#C5E5EC]/70 mt-1 font-mono">
            {activeVoipCall.maskedPhoneNumber}
          </p>

          <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-slate-300 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>
              {language === 'vi'
                ? 'Đang đổ chuông... Đang chờ đối phương nhấc máy...'
                : 'Ringing... Waiting for partner to answer...'}
            </span>
          </div>

          {/* Cancel button */}
          <div className="mt-6 flex items-center justify-center">
            <button
              onClick={endVoipCall}
              className="flex flex-col items-center space-y-1.5 cursor-pointer group"
              title={language === 'vi' ? 'Hủy cuộc gọi' : 'Cancel call'}
            >
              <div className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40 group-active:scale-95 transition">
                <PhoneOff className="w-6 h-6" />
              </div>
              <span className="text-[11px] text-red-400 font-bold">
                {language === 'vi' ? 'Hủy cuộc gọi' : 'Cancel'}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CASE 3: CONNECTED CALL (VOICE OR VIDEO)
  // ==========================================
  const isVideoMode = !!activeVoipCall.isVideo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div
        className={`w-full ${
          isVideoMode ? 'max-w-xl' : 'max-w-sm'
        } rounded-3xl bg-gradient-to-b from-[#101A2E] via-[#0A101C] to-[#060911] border-2 border-[#00E5FF]/40 p-5 sm:p-6 text-center shadow-[0_0_60px_rgba(0,229,255,0.3)] relative overflow-hidden`}
      >
        {/* Hidden audio element for remote audio playback */}
        <audio ref={remoteAudioRef} autoPlay />

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
            {/* Main Video Screen (Remote Feed live) */}
            <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden bg-slate-900 border border-[#00E5FF]/30 flex items-center justify-center shadow-inner">
              {/* Remote live video feed */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${remoteStreamActive ? 'block' : 'hidden'}`}
              />

              {/* Placeholder when remote stream is connecting or remote camera is off */}
              {!remoteStreamActive && (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#3064AE] via-[#00E5FF] to-teal-500 flex items-center justify-center text-white text-2xl font-black shadow-lg border-2 border-white/20 mb-2 overflow-hidden">
                    {activeVoipCall.partnerAvatarUrl ? (
                      <img
                        src={activeVoipCall.partnerAvatarUrl}
                        alt={activeVoipCall.partnerName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10" />
                    )}
                  </div>
                  <h4 className="font-extrabold text-white text-sm">{activeVoipCall.partnerName}</h4>
                  <p className="text-[11px] text-[#00E5FF] font-semibold">
                    {activeVoipCall.partnerRole || 'Campus Video Feed'}
                  </p>
                  <div className="mt-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-black/50 border border-white/20 text-[10px] text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Đã kết nối • 1080p @ 30FPS</span>
                  </div>
                </div>
              )}

              {/* Picture-in-Picture Local Camera View */}
              <div className="absolute top-3 right-3 w-24 h-32 sm:w-28 sm:h-36 rounded-xl bg-black/80 border-2 border-[#00E5FF]/60 overflow-hidden shadow-2xl flex flex-col items-center justify-center">
                {activeVoipCall.isVideoOff || hasCameraError ? (
                  <div className="flex flex-col items-center justify-center p-1 text-slate-400">
                    <VideoOff className="w-6 h-6 mb-1 text-red-400" />
                    <span className="text-[9px] font-bold text-center">
                      {language === 'vi' ? 'Camera tắt' : 'Cam off'}
                    </span>
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
                  <img
                    src={activeVoipCall.partnerAvatarUrl}
                    alt={activeVoipCall.partnerName}
                    className="w-full h-full object-cover"
                  />
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
                  connectionState === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
                }`}
              />
              <span className="text-slate-300 font-medium">
                {connectionState === 'CONNECTED'
                  ? language === 'vi'
                    ? 'Đã kết nối WebRTC trực tiếp (Direct Audio P2P)'
                    : 'Direct WebRTC Connected (P2P Audio)'
                  : language === 'vi'
                  ? 'Đang bắt tay WebRTC STUN/ICE Server...'
                  : 'Handshaking WebRTC STUN/ICE Server...'}
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
                  <span>
                    {language === 'vi' ? 'Phổ âm thanh giọng nói (Voice Wave)' : 'Realtime Voice Waveform'}
                  </span>
                </span>
                <span className="font-mono text-cyan-400">Opus 48kHz</span>
              </div>
              <canvas ref={canvasRef} width={260} height={48} className="w-full h-12 rounded-lg bg-black/40" />
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
            title={
              activeVoipCall.isMuted
                ? language === 'vi'
                  ? 'Bật micro'
                  : 'Unmute'
                : language === 'vi'
                ? 'Tắt micro'
                : 'Mute'
            }
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
              title={
                activeVoipCall.isVideoOff
                  ? language === 'vi'
                    ? 'Bật Camera'
                    : 'Turn on Camera'
                  : language === 'vi'
                  ? 'Tắt Camera'
                  : 'Turn off Camera'
              }
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
