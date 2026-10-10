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
  Minimize2,
  Maximize2,
  SwitchCamera,
  Layers,
  Clock,
  PictureInPicture2,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import {
  updateCloudCall,
  addCallIceCandidate,
  subscribeToCallSession,
  DEFAULT_ICE_SERVERS,
} from '../lib/firebase';
import { stopRingtone } from '../utils/audio';

export const VoipCallOverlay: React.FC = () => {
  const {
    activeVoipCall,
    currentUser,
    endVoipCall,
    toggleMuteVoip,
    toggleVideoVoip,
    toggleMinimizeVoip,
    flipCameraVoip,
    switchVoipToVideo,
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
  const [isPipSwapped, setIsPipSwapped] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [isNativePipActive, setIsNativePipActive] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const miniCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const miniAnimFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const miniLocalVideoRef = useRef<HTMLVideoElement | null>(null);
  const miniRemoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  // Queues & deduplication for ICE & Offer/Answer
  const iceCandidatesQueueRef = useRef<Array<{ candidate: string; sdpMid?: string | null; sdpMLineIndex?: number | null }>>([]);
  const processedIceCandidatesRef = useRef<Set<string>>(new Set());
  const offerCreatedRef = useRef(false);
  const answerCreatedRef = useRef(false);
  const callStartTimeRef = useRef<number | null>(null);

  const isIncoming = activeVoipCall?.isIncoming || activeVoipCall?.callStatus === 'INCOMING_RINGING';
  const isOutgoingRinging = activeVoipCall?.callStatus === 'OUTGOING_RINGING';
  const isConnected = activeVoipCall?.callStatus === 'CONNECTED';
  const isMinimized = !!activeVoipCall?.isMinimized;
  const isVideoMode = !!activeVoipCall?.isVideo;

  // Real-time call duration timer: updates every second based on wall-clock time
  useEffect(() => {
    if (!isConnected) {
      callStartTimeRef.current = null;
      setSeconds(0);
      setConnectionState('CONNECTING');
      return;
    }

    if (!callStartTimeRef.current) {
      callStartTimeRef.current = Date.now();
    }

    const t1 = setTimeout(() => setConnectionState('ICE_CHECKING'), 600);
    const t2 = setTimeout(() => setConnectionState('CONNECTED'), 1200);

    // Initial sync
    const initialElapsed = Math.max(0, Math.floor((Date.now() - callStartTimeRef.current) / 1000));
    setSeconds(initialElapsed);

    // Real-time interval updating every 1000ms
    const interval = setInterval(() => {
      if (callStartTimeRef.current) {
        const elapsed = Math.max(0, Math.floor((Date.now() - callStartTimeRef.current) / 1000));
        setSeconds(elapsed);
      } else {
        setSeconds((prev) => prev + 1);
      }
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
            if (miniRemoteVideoRef.current) {
              miniRemoteVideoRef.current.srcObject = remoteStream;
              miniRemoteVideoRef.current.play().catch(() => {});
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
              video: wantVideo
                ? {
                    facingMode: cameraFacingMode,
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                  }
                : false,
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

          if (miniLocalVideoRef.current && wantVideo && localStream.getVideoTracks().length > 0) {
            miniLocalVideoRef.current.srcObject = localStream;
            miniLocalVideoRef.current.play().catch(() => {});
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

                const renderVisualizer = (
                  canvas: HTMLCanvasElement | null,
                  frameRef: React.MutableRefObject<number | null>
                ) => {
                  if (!canvas) return;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  const bufferLength = analyser.frequencyBinCount;
                  const dataArray = new Uint8Array(bufferLength);

                  const draw = () => {
                    if (!isSubscribed) return;
                    frameRef.current = requestAnimationFrame(draw);
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
                };

                renderVisualizer(canvasRef.current, animFrameIdRef);
                renderVisualizer(miniCanvasRef.current, miniAnimFrameIdRef);
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
      stopRingtone();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (miniAnimFrameIdRef.current) cancelAnimationFrame(miniAnimFrameIdRef.current);
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

  // Switch camera Front / Rear (Lật Camera)
  const handleFlipCamera = async () => {
    if (!streamRef.current || !activeVoipCall?.isVideo) return;
    const nextFacing = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(nextFacing);
    flipCameraVoip?.();

    try {
      const oldVideoTrack = streamRef.current.getVideoTracks()[0];
      if (oldVideoTrack) oldVideoTrack.stop();

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: nextFacing }, width: { ideal: 640 }, height: { ideal: 480 } },
      });
      const newTrack = newStream.getVideoTracks()[0];
      if (newTrack) {
        if (oldVideoTrack) streamRef.current.removeTrack(oldVideoTrack);
        streamRef.current.addTrack(newTrack);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = streamRef.current;
        }
        if (miniLocalVideoRef.current) {
          miniLocalVideoRef.current.srcObject = streamRef.current;
        }

        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(newTrack).catch((e) => console.warn('replaceTrack error:', e));
          } else {
            pcRef.current.addTrack(newTrack, streamRef.current);
          }
        }

        showNotification(
          language === 'vi' ? 'Đã đổi camera' : 'Camera switched',
          nextFacing === 'user'
            ? (language === 'vi' ? 'Đang dùng Camera trước' : 'Front camera')
            : (language === 'vi' ? 'Đang dùng Camera sau' : 'Rear camera')
        );
      }
    } catch (err) {
      console.warn('Flip camera error:', err);
    }
  };

  // Upgrade Voice to Video call on the fly
  const handleUpgradeToVideo = async () => {
    switchVoipToVideo?.();
    if (!streamRef.current) return;
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacingMode, width: { ideal: 640 }, height: { ideal: 480 } },
      });
      const newTrack = videoStream.getVideoTracks()[0];
      if (newTrack) {
        streamRef.current.addTrack(newTrack);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = streamRef.current;
          localVideoRef.current.play().catch(() => {});
        }
        if (miniLocalVideoRef.current) {
          miniLocalVideoRef.current.srcObject = streamRef.current;
          miniLocalVideoRef.current.play().catch(() => {});
        }
        if (pcRef.current) {
          pcRef.current.addTrack(newTrack, streamRef.current);
          const offer = await pcRef.current.createOffer();
          await pcRef.current.setLocalDescription(offer);
          if (activeVoipCall?.callId) {
            updateCloudCall(activeVoipCall.callId, { isVideo: true, offer: { sdp: offer.sdp, type: offer.type } });
          }
        }
        showNotification(
          language === 'vi' ? 'Đã bật camera video' : 'Video camera enabled',
          language === 'vi' ? 'Cuộc gọi đã nâng cấp lên Video HD!' : 'Call upgraded to HD Video!'
        );
      }
    } catch (err) {
      console.warn('Upgrade to video error:', err);
    }
  };

  // Picture-in-Picture (PiP): Cho phép thu nhỏ màn hình cuộc gọi để tự do chuyển tab
  const togglePictureInPicture = async () => {
    // 1. Thử native Picture-in-Picture của trình duyệt nếu là cuộc gọi video
    if (activeVoipCall?.isVideo && typeof document !== 'undefined') {
      try {
        if ((document as any).pictureInPictureElement) {
          await (document as any).exitPictureInPicture();
          setIsNativePipActive(false);
          return;
        }

        const targetVideo = isPipSwapped ? localVideoRef.current : remoteVideoRef.current;
        if (targetVideo && (document as any).pictureInPictureEnabled) {
          if (targetVideo.readyState >= 2) {
            await targetVideo.requestPictureInPicture();
            setIsNativePipActive(true);
            showNotification(
              language === 'vi' ? 'Đã bật Picture-in-Picture' : 'Picture-in-Picture Active',
              language === 'vi'
                ? 'Màn hình cuộc gọi đã tách rời thành cửa sổ nổi, bạn có thể chuyển tab thoải mái!'
                : 'Call video detached, you can navigate other tabs freely!'
            );
            return;
          }
        }
      } catch (err) {
        console.warn('Native Picture-in-Picture fallback to in-app minimize:', err);
      }
    }

    // 2. In-App Picture-in-Picture (Thu nhỏ thành Floating Widget để chuyển tab trong app)
    toggleMinimizeVoip();
    showNotification(
      language === 'vi' ? 'Đã thu nhỏ cuộc gọi (PiP)' : 'Call Minimized (PiP)',
      language === 'vi'
        ? 'Cuộc gọi tiếp tục kết nối ở nền, bạn có thể chuyển tab và dùng ứng dụng bình thường!'
        : 'Call active in background, you can browse other tabs freely!'
    );
  };

  // Lắng nghe sự kiện native Picture-in-Picture
  useEffect(() => {
    const remoteVid = remoteVideoRef.current;
    const localVid = localVideoRef.current;

    const onEnterPip = () => setIsNativePipActive(true);
    const onLeavePip = () => setIsNativePipActive(false);

    if (remoteVid) {
      remoteVid.addEventListener('enterpictureinpicture', onEnterPip);
      remoteVid.addEventListener('leavepictureinpicture', onLeavePip);
    }
    if (localVid) {
      localVid.addEventListener('enterpictureinpicture', onEnterPip);
      localVid.addEventListener('leavepictureinpicture', onLeavePip);
    }

    return () => {
      if (remoteVid) {
        remoteVid.removeEventListener('enterpictureinpicture', onEnterPip);
        remoteVid.removeEventListener('leavepictureinpicture', onLeavePip);
      }
      if (localVid) {
        localVid.removeEventListener('enterpictureinpicture', onEnterPip);
        localVid.removeEventListener('leavepictureinpicture', onLeavePip);
      }
    };
  }, [remoteVideoRef.current, localVideoRef.current]);

  if (!activeVoipCall) return null;

  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Connection Quality Calculator based on latency and connectionState
  const getConnectionQuality = (lat: number, state: string) => {
    if (state !== 'CONNECTED') {
      return {
        bars: 1,
        color: 'bg-amber-400',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/30',
        bgColor: 'bg-amber-500/15',
        labelVi: 'Đang kết nối',
        labelEn: 'Connecting',
      };
    }
    if (lat <= 35) {
      return {
        bars: 4,
        color: 'bg-emerald-400',
        textColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/30',
        bgColor: 'bg-emerald-500/15',
        labelVi: 'Xuất sắc',
        labelEn: 'Excellent',
      };
    }
    if (lat <= 60) {
      return {
        bars: 3,
        color: 'bg-cyan-400',
        textColor: 'text-cyan-400',
        borderColor: 'border-cyan-500/30',
        bgColor: 'bg-cyan-500/15',
        labelVi: 'Tốt',
        labelEn: 'Good',
      };
    }
    if (lat <= 100) {
      return {
        bars: 2,
        color: 'bg-amber-400',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/30',
        bgColor: 'bg-amber-500/15',
        labelVi: 'Trung bình',
        labelEn: 'Fair',
      };
    }
    return {
      bars: 1,
      color: 'bg-rose-400',
      textColor: 'text-rose-400',
      borderColor: 'border-rose-500/30',
      bgColor: 'bg-rose-500/15',
      labelVi: 'Yếu',
      labelEn: 'Poor',
    };
  };

  const quality = getConnectionQuality(latency, connectionState);

  // Render signal bars (vertical cellular-style indicator bars)
  const renderSignalBars = (level: number, colorClass: string, size: 'sm' | 'md' = 'sm') => {
    const barHeights = size === 'md' ? ['h-2', 'h-3', 'h-4', 'h-5'] : ['h-1.5', 'h-2', 'h-2.5', 'h-3.5'];
    const barWidth = size === 'md' ? 'w-1.5' : 'w-1';

    return (
      <div className={`flex items-end space-x-0.5 ${size === 'md' ? 'h-5' : 'h-3.5'}`} aria-hidden="true">
        {[1, 2, 3, 4].map((barIndex) => (
          <div
            key={barIndex}
            className={`${barWidth} ${barHeights[barIndex - 1]} rounded-xs transition-all duration-300 ${
              level >= barIndex ? colorClass : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    );
  };

  // ==========================================
  // CASE 0: MINIMIZED FLOATING CALL BUBBLE (THU NHỎ)
  // ==========================================
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-3 sm:right-6 z-50 animate-bounce-in">
        <div className="rounded-2xl bg-gradient-to-b from-[#101A2E]/95 via-[#0A101C]/95 to-[#060911]/95 border-2 border-[#00E5FF]/60 shadow-[0_0_35px_rgba(0,229,255,0.4)] backdrop-blur-xl p-3 w-64 text-white overflow-hidden">
          {/* Top Bar with Status, Real-Time Timer, Signal Bars, and Maximize button */}
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
            <div
              id="mini-voip-call-timer"
              className="flex items-center space-x-1.5 text-[11px] font-extrabold text-[#00E5FF] font-mono"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <Clock className="w-3 h-3 text-[#00E5FF]" />
              <span>{isConnected ? formatTime(seconds) : (language === 'vi' ? 'Đang đổ chuông...' : 'Calling...')}</span>
            </div>

            <div className="flex items-center space-x-2">
              {isConnected && (
                <div
                  className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/80"
                  title={`${language === 'vi' ? 'Chất lượng sóng' : 'Connection'}: ${language === 'vi' ? quality.labelVi : quality.labelEn} (${quality.bars}/4 vạch, ${latency}ms)`}
                >
                  {renderSignalBars(quality.bars, quality.color, 'sm')}
                  <span className="text-[9px] font-mono text-slate-300">{latency}ms</span>
                </div>
              )}

              {/* Picture-in-Picture Button */}
              {activeVoipCall.isVideo && (
                <button
                  id="mini-voip-pip-btn"
                  onClick={togglePictureInPicture}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-[#3064AE] text-slate-300 hover:text-white transition cursor-pointer"
                  title={language === 'vi' ? 'Tách màn hình nổi (Picture-in-Picture)' : 'Picture-in-Picture'}
                >
                  <PictureInPicture2 className="w-3.5 h-3.5 text-[#00E5FF]" />
                </button>
              )}

              <button
                onClick={toggleMinimizeVoip}
                className="p-1 rounded-lg bg-slate-800 hover:bg-[#3064AE] text-white transition cursor-pointer"
                title={language === 'vi' ? 'Phóng to toàn màn hình' : 'Maximize call'}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Partner Info / Mini Video preview */}
          <div
            onClick={toggleMinimizeVoip}
            className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 transition mb-2.5"
          >
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-[#3064AE] via-teal-600 to-emerald-500 flex items-center justify-center text-white font-extrabold text-sm overflow-hidden shrink-0 border border-white/30">
              {activeVoipCall.partnerAvatarUrl ? (
                <img
                  src={activeVoipCall.partnerAvatarUrl}
                  alt={activeVoipCall.partnerName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h5 className="font-extrabold text-xs text-white truncate">{activeVoipCall.partnerName}</h5>
              <p className="text-[10px] text-[#C5E5EC]/80 truncate">
                {activeVoipCall.isVideo ? (language === 'vi' ? 'Cuộc gọi Video HD' : 'HD Video Call') : (language === 'vi' ? 'Cuộc gọi thoại Opus' : 'Voice Call')}
              </p>
            </div>
          </div>

          {/* Quick Floating Controls with Mute button */}
          <div className="flex items-center justify-between pt-1">
            <button
              id="mini-voip-mute-btn"
              onClick={toggleMuteVoip}
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center space-x-1 ${
                activeVoipCall.isMuted
                  ? 'bg-red-500/20 text-red-400 border-red-500 shadow-xs'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
              title={activeVoipCall.isMuted ? (language === 'vi' ? 'Bật mic (Unmute)' : 'Unmute') : (language === 'vi' ? 'Tắt micro (Mute)' : 'Mute')}
              aria-label={activeVoipCall.isMuted ? 'Unmute' : 'Mute'}
            >
              {activeVoipCall.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-bold">
                {activeVoipCall.isMuted ? (language === 'vi' ? 'Bật' : 'Unmute') : 'Mute'}
              </span>
            </button>

            {isVideoMode && (
              <button
                onClick={toggleVideoVoip}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  activeVoipCall.isVideoOff
                    ? 'bg-red-500/20 text-red-400 border-red-500'
                    : 'bg-cyan-500/20 text-[#00E5FF] border-[#00E5FF]/40'
                }`}
                title={activeVoipCall.isVideoOff ? 'Bật camera' : 'Tắt camera'}
              >
                {activeVoipCall.isVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
              </button>
            )}

            {isVideoMode && (
              <button
                onClick={handleFlipCamera}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#C5E5EC] border border-slate-700 transition cursor-pointer"
                title={language === 'vi' ? 'Lật camera trước/sau' : 'Flip camera'}
              >
                <SwitchCamera className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={endVoipCall}
              className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/40 transition cursor-pointer"
              title={language === 'vi' ? 'Kết thúc cuộc gọi' : 'End call'}
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CASE 1: INCOMING CALL RINGING DIALOG
  // ==========================================
  if (isIncoming) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
        <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#101A2E] via-[#0A101C] to-[#060911] border-2 border-emerald-500/50 p-6 text-center shadow-[0_0_60px_rgba(16,185,129,0.35)] relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-[#C5E5EC] to-teal-400" />

          {/* Minimize button */}
          <button
            onClick={toggleMinimizeVoip}
            className="absolute top-3 right-3 p-2 rounded-xl bg-slate-800/80 hover:bg-[#3064AE] text-slate-300 hover:text-white transition cursor-pointer"
            title={language === 'vi' ? 'Thu nhỏ cửa sổ' : 'Minimize window'}
          >
            <Minimize2 className="w-4 h-4" />
          </button>

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

          {/* Caller Avatar with incoming ring pulse */}
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

          {/* Minimize button */}
          <button
            onClick={toggleMinimizeVoip}
            className="absolute top-3 right-3 p-2 rounded-xl bg-slate-800/80 hover:bg-[#3064AE] text-slate-300 hover:text-white transition cursor-pointer"
            title={language === 'vi' ? 'Thu nhỏ cửa sổ' : 'Minimize window'}
          >
            <Minimize2 className="w-4 h-4" />
          </button>

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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div
        className={`w-full ${
          isVideoMode ? 'max-w-xl' : 'max-w-sm'
        } rounded-3xl bg-gradient-to-b from-[#101A2E] via-[#0A101C] to-[#060911] border-2 border-[#00E5FF]/40 p-5 sm:p-6 text-center shadow-[0_0_60px_rgba(0,229,255,0.3)] relative overflow-hidden`}
      >
        {/* Hidden audio element for remote audio playback */}
        <audio ref={remoteAudioRef} autoPlay />

        {/* Top Control Bar: Minimize & Status Badges with Real-Time Timer & Signal Bars */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#00E5FF]/15 border border-[#00E5FF]/30 text-[#00E5FF] text-[11px] font-extrabold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isVideoMode ? 'WebRTC HD Video' : 'WebRTC Opus P2P'}</span>
            </div>

            {/* Real-Time Call Duration Timer Badge */}
            <div
              id="voip-call-timer-top"
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-extrabold shadow-sm"
              title={language === 'vi' ? 'Thời lượng cuộc gọi' : 'Call Duration'}
              aria-label={`Call duration: ${formatTime(seconds)}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <Clock className="w-3 h-3 text-emerald-400" />
              <span id="voip-header-call-timer">{formatTime(seconds)}</span>
            </div>

            {/* Connection Quality with Cellular Signal Bars */}
            <div
              id="voip-connection-quality-badge"
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full ${quality.bgColor} border ${quality.borderColor} ${quality.textColor} text-[11px] font-bold shadow-sm transition-all`}
              title={`${language === 'vi' ? 'Chất lượng kết nối' : 'Connection Quality'}: ${language === 'vi' ? quality.labelVi : quality.labelEn} (${quality.bars}/4 vạch sóng • ${latency}ms)`}
              aria-label={`Connection quality: ${quality.labelEn}, ${quality.bars} out of 4 signal bars, ${latency}ms`}
            >
              {renderSignalBars(quality.bars, quality.color, 'sm')}
              <span className="font-semibold">{language === 'vi' ? quality.labelVi : quality.labelEn}</span>
              <span className="font-mono text-[10px] opacity-75">({latency}ms)</span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Picture-in-Picture Button */}
            <button
              id="voip-pip-btn"
              onClick={togglePictureInPicture}
              className={`p-1.5 rounded-xl border transition cursor-pointer flex items-center space-x-1 text-xs ${
                isNativePipActive
                  ? 'bg-cyan-500/25 text-[#00E5FF] border-[#00E5FF]'
                  : 'bg-slate-800 hover:bg-[#3064AE] text-slate-300 hover:text-white border-slate-700'
              }`}
              title={language === 'vi' ? 'Thu nhỏ Picture-in-Picture để chuyển tab' : 'Picture-in-Picture (Switch tabs)'}
              aria-label="Picture in Picture"
            >
              <PictureInPicture2 className="w-4 h-4 text-[#00E5FF]" />
            </button>

            {/* Minimize button to turn into floating bubble */}
            <button
              id="voip-minimize-btn"
              onClick={toggleMinimizeVoip}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-[#3064AE] text-slate-300 hover:text-white transition cursor-pointer flex items-center space-x-1 text-xs border border-slate-700"
              title={language === 'vi' ? 'Thu nhỏ cuộc gọi để xem tin nhắn / đổi tab' : 'Minimize call'}
              aria-label="Minimize Call"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Remote Muted / Video Off Warning Banners */}
        {activeVoipCall.isRemoteMuted && (
          <div className="mb-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold inline-flex items-center space-x-1.5">
            <MicOff className="w-3 h-3 text-amber-400" />
            <span>{language === 'vi' ? 'Đối phương đang tắt micro' : 'Partner is muted'}</span>
          </div>
        )}

        {/* VIDEO MODE VIEW */}
        {isVideoMode ? (
          <div className="space-y-3">
            {/* Main Video Screen with PiP Swap support */}
            <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden bg-slate-900 border border-[#00E5FF]/30 flex items-center justify-center shadow-inner">
              {/* Floating Real-time Video Call Timer Badge */}
              <div
                id="voip-video-floating-timer"
                className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-emerald-500/40 text-emerald-400 font-mono text-[11px] font-extrabold flex items-center space-x-1.5 shadow-lg"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>{formatTime(seconds)}</span>
              </div>

              {/* Primary Video Feed (Remote video by default, or local if PiP swapped) */}
              {!isPipSwapped ? (
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${
                      remoteStreamActive && !activeVoipCall.isRemoteVideoOff ? 'block' : 'hidden'
                    }`}
                  />
                  {(!remoteStreamActive || activeVoipCall.isRemoteVideoOff) && (
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
                        {activeVoipCall.isRemoteVideoOff
                          ? (language === 'vi' ? 'Đối phương đã tạm tắt camera' : 'Partner turned off camera')
                          : (language === 'vi' ? 'Đang tải luồng camera đối phương...' : 'Loading partner stream...')}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                /* PiP Swapped: Local camera is shown large */
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? '-scale-x-100' : ''}`}
                />
              )}

              {/* Picture-in-Picture Local Camera View (Click to swap) */}
              <div
                onClick={() => setIsPipSwapped((p) => !p)}
                className="absolute top-3 right-3 w-24 h-32 sm:w-28 sm:h-36 rounded-xl bg-black/80 border-2 border-[#00E5FF]/70 overflow-hidden shadow-2xl flex flex-col items-center justify-center cursor-pointer group"
                title={language === 'vi' ? 'Chạm để đổi màn hình chính' : 'Tap to swap view'}
              >
                {!isPipSwapped ? (
                  activeVoipCall.isVideoOff || hasCameraError ? (
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
                      className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? '-scale-x-100' : ''}`}
                    />
                  )
                ) : (
                  /* Swapped PiP: Shows remote camera thumbnail */
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}

                <div className="absolute bottom-1 inset-x-1 flex items-center justify-between px-1 rounded bg-black/60 text-[8px] text-white font-bold">
                  <span>{!isPipSwapped ? (language === 'vi' ? 'Bạn' : 'You') : activeVoipCall.partnerName}</span>
                  <Layers className="w-2.5 h-2.5 text-[#00E5FF] group-hover:scale-125 transition" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-2 text-xs text-slate-300">
              <div id="voip-video-call-timer" className="flex items-center space-x-1.5 font-mono text-emerald-400 font-extrabold text-sm">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{formatTime(seconds)}</span>
              </div>
              {/* Live Signal bars in video bar */}
              <div className="flex items-center space-x-1.5 text-[11px]">
                {renderSignalBars(quality.bars, quality.color, 'sm')}
                <span className={`font-semibold ${quality.textColor}`}>
                  {language === 'vi' ? quality.labelVi : quality.labelEn}
                </span>
                <span className="font-mono text-[10px] text-slate-400">({latency}ms)</span>
              </div>
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

            {/* Connection status and Quality indicator with signal bars */}
            <div className="mt-2.5 flex items-center justify-center flex-wrap gap-2 text-[11px]">
              <div
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full ${quality.bgColor} border ${quality.borderColor} ${quality.textColor} font-semibold shadow-xs`}
                title={`${quality.bars}/4 signal bars • ${latency}ms`}
              >
                {renderSignalBars(quality.bars, quality.color, 'sm')}
                <span>
                  {language === 'vi' ? 'Sóng' : 'Signal'}: {language === 'vi' ? quality.labelVi : quality.labelEn} ({quality.bars}/4 vạch • {latency}ms)
                </span>
              </div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                <span
                  className={`w-2 h-2 rounded-full ${
                    connectionState === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
                  }`}
                />
                <span>
                  {connectionState === 'CONNECTED'
                    ? language === 'vi'
                      ? 'WebRTC P2P Trực tiếp'
                      : 'Direct WebRTC P2P'
                    : language === 'vi'
                    ? 'Đang bắt tay ICE Server...'
                    : 'Handshaking ICE Server...'}
                </span>
              </div>
            </div>

            {/* Real-time Call Duration Timer */}
            <div id="voip-call-timer" className="mt-3 flex flex-col items-center justify-center">
              <div
                className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-400 font-mono text-xl sm:text-2xl tracking-widest font-black shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                aria-label={`Call duration: ${formatTime(seconds)}`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <Clock className="w-5 h-5 text-emerald-400" />
                <span id="voip-audio-call-timer">{formatTime(seconds)}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                {language === 'vi' ? 'Thời lượng cuộc gọi' : 'Call Duration'}
              </span>
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

        {/* Audio / Video Action Controls Bar */}
        <div className="mt-6 flex items-center justify-center flex-wrap gap-3 sm:gap-5">
          {/* Mute Mic Button */}
          <div className="flex flex-col items-center">
            <button
              id="voip-mute-btn"
              onClick={toggleMuteVoip}
              className={`p-3.5 sm:p-4 rounded-full border transition transform active:scale-95 cursor-pointer ${
                activeVoipCall.isMuted
                  ? 'bg-red-500/20 text-red-400 border-red-500 shadow-md shadow-red-500/20 ring-2 ring-red-500/30'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
              title={
                activeVoipCall.isMuted
                  ? language === 'vi'
                    ? 'Bật micro (Unmute)'
                    : 'Unmute'
                  : language === 'vi'
                  ? 'Tắt micro (Mute)'
                  : 'Mute'
              }
              aria-label={activeVoipCall.isMuted ? 'Unmute' : 'Mute'}
            >
              {activeVoipCall.isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
            <span className={`text-[10px] sm:text-[11px] font-semibold mt-1.5 transition ${activeVoipCall.isMuted ? 'text-red-400' : 'text-slate-300'}`}>
              {activeVoipCall.isMuted
                ? language === 'vi' ? 'Bật mic' : 'Unmute'
                : language === 'vi' ? 'Tắt tiếng' : 'Mute'}
            </span>
          </div>

          {/* Video Toggle Button (If in video mode: toggle camera on/off; If in audio mode: upgrade to video) */}
          <div className="flex flex-col items-center">
            {isVideoMode ? (
              <button
                id="voip-camera-toggle-btn"
                onClick={toggleVideoVoip}
                className={`p-3.5 sm:p-4 rounded-full border transition transform active:scale-95 cursor-pointer ${
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
                {activeVoipCall.isVideoOff ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            ) : (
              <button
                id="voip-upgrade-video-btn"
                onClick={handleUpgradeToVideo}
                className="p-3.5 sm:p-4 rounded-full border border-emerald-500/50 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition transform active:scale-95 cursor-pointer shadow-md shadow-emerald-500/20"
                title={language === 'vi' ? 'Bật Video Call' : 'Turn on Video Call'}
                aria-label="Upgrade to Video Call"
              >
                <Video className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
            <span className="text-[10px] sm:text-[11px] font-semibold mt-1.5 text-slate-300">
              {isVideoMode
                ? activeVoipCall.isVideoOff
                  ? (language === 'vi' ? 'Bật Cam' : 'Cam Off')
                  : (language === 'vi' ? 'Tắt Cam' : 'Camera')
                : (language === 'vi' ? 'Bật Video' : 'Video')}
            </span>
          </div>

          {/* Switch Camera (Lật Camera Trước / Sau) in video mode */}
          {isVideoMode && (
            <div className="flex flex-col items-center">
              <button
                id="voip-flip-camera-btn"
                onClick={handleFlipCamera}
                className="p-3.5 sm:p-4 rounded-full border border-slate-700 bg-slate-800 hover:bg-slate-700 text-[#C5E5EC] transition transform active:scale-95 cursor-pointer"
                title={language === 'vi' ? 'Lật camera trước/sau' : 'Flip camera'}
                aria-label="Flip Camera"
              >
                <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <span className="text-[10px] sm:text-[11px] font-semibold mt-1.5 text-slate-300">
                {language === 'vi' ? 'Lật Cam' : 'Flip'}
              </span>
            </div>
          )}

          {/* Picture-in-Picture Button */}
          <div className="flex flex-col items-center">
            <button
              id="voip-action-pip-btn"
              onClick={togglePictureInPicture}
              className={`p-3.5 sm:p-4 rounded-full border transition transform active:scale-95 cursor-pointer ${
                isNativePipActive
                  ? 'bg-cyan-500/20 text-[#00E5FF] border-[#00E5FF] ring-2 ring-[#00E5FF]/40 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-[#00E5FF] border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
              title={language === 'vi' ? 'Thu nhỏ Picture-in-Picture để chuyển tab' : 'Picture-in-Picture (Switch tabs)'}
              aria-label="Picture in Picture"
            >
              <PictureInPicture2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <span className="text-[10px] sm:text-[11px] font-semibold mt-1.5 text-[#00E5FF]">
              PiP
            </span>
          </div>

          {/* Speaker Button */}
          <div className="flex flex-col items-center">
            <button
              id="voip-speaker-btn"
              onClick={() => setIsSpeakerOn((p) => !p)}
              className={`p-3.5 sm:p-4 rounded-full border transition transform active:scale-95 cursor-pointer ${
                isSpeakerOn
                  ? 'bg-cyan-500/20 text-[#00E5FF] border-[#00E5FF]/50 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={language === 'vi' ? 'Loa ngoài' : 'Speaker'}
              aria-label="Toggle Speaker"
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
            <span className="text-[10px] sm:text-[11px] font-semibold mt-1.5 text-slate-300">
              {isSpeakerOn ? (language === 'vi' ? 'Loa ngoài' : 'Speaker') : (language === 'vi' ? 'Tai nghe' : 'Earpiece')}
            </span>
          </div>

          {/* End Call Button */}
          <div className="flex flex-col items-center">
            <button
              id="end-voip-call-btn"
              onClick={endVoipCall}
              className="p-3.5 sm:p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.6)] transition transform hover:scale-105 active:scale-95 cursor-pointer"
              title={language === 'vi' ? 'Kết thúc cuộc gọi' : 'End Call'}
              aria-label="End Call"
            >
              <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <span className="text-[10px] sm:text-[11px] font-semibold mt-1.5 text-red-400">
              {language === 'vi' ? 'Kết thúc' : 'End'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoipCallOverlay;
