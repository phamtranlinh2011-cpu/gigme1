import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  PhoneCall,
  Video,
  AlertTriangle,
  Send,
  Camera,
  Image as ImageIcon,
  Mic,
  MicOff,
  Video as VideoIcon,
  Play,
  Pause,
  CheckCircle2,
  Lock,
  Sparkles,
  ShieldAlert,
  X,
  Fingerprint,
  FileCheck,
  Star,
  Award,
  Volume2,
  Maximize2,
  Paperclip,
  Search,
  Bot,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Check,
  Zap,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { formatVnd } from '../types';
import { BlockchainProofModal } from '../components/BlockchainProofModal';
import { StudentEloModal } from '../components/StudentEloModal';

interface ChatSupportScreenProps {
  onBack: () => void;
}

export const ChatSupportScreen: React.FC<ChatSupportScreenProps> = ({ onBack }) => {
  const {
    currentSelectedGig,
    currentChatMessages,
    currentUser,
    roleMode,
    selectGig,
    filteredGigs,
    rawGigs,
    sendChat,
    submitProofOfWork,
    releaseEscrowPayout,
    fileDispute,
    startVoipCall,
  } = useGigMe();

  const [messageInput, setMessageInput] = useState('');
  const [showProofModal, setShowProofModal] = useState(false);
  const [showBlockchainModal, setShowBlockchainModal] = useState(false);
  const [showEloModal, setShowEloModal] = useState(false);
  const [proofNote, setProofNote] = useState('Đã hoàn thành đầy đủ yêu cầu bài tập và video preview.');
  const [isWatermarked, setIsWatermarked] = useState(true);

  // Escrow Release PIN & Tip Modal
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [pinInput, setPinInput] = useState('123456');
  const [selectedTip, setSelectedTip] = useState(10000);
  const [useBiometrics, setUseBiometrics] = useState(false);

  // Dispute Modal
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState(
    'Người làm không phản hồi hoặc chất lượng không đúng thỏa thuận.'
  );

  // Multimedia Attachment State
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingVideo, setPendingVideo] = useState<{ url: string; name: string } | null>(null);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  // Voice Note Recording State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Audio Playback Tracking State (Playing audio ID)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const fileInputImageRef = useRef<HTMLInputElement | null>(null);
  const fileInputCameraRef = useRef<HTMLInputElement | null>(null);
  const fileInputVideoRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Inbox & 24/7 AI Assistant state
  const [inboxSearch, setInboxSearch] = useState('');
  const [inboxTab, setInboxTab] = useState<'ALL' | 'ACTIVE' | 'AI_SUPPORT'>('ALL');
  const [isGigCardExpanded, setIsGigCardExpanded] = useState(true);
  const [isAiChatActive, setIsAiChatActive] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ id: string; sender: 'USER' | 'AI'; text: string; time: string }>>([
    {
      id: 'ai_welcome',
      sender: 'AI',
      text: 'Xin chào! Mình là Trợ lý AI GigMe 24/7. Mình luôn sẵn sàng hỗ trợ giải đáp về tiền cọc bảo chứng Smart Escrow, quy trình rút tiền Napas 247, và giải quyết tranh chấp. Bạn cần hỗ trợ gì nè?',
      time: 'Trực tuyến',
    },
  ]);

  const gig = currentSelectedGig;
  const isClient = roleMode === 'CLIENT';

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChatMessages]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (pendingImage) {
      sendChat(messageInput.trim() || 'Đã gửi một hình ảnh', 'IMAGE', pendingImage, 0, 'image.jpg');
      setPendingImage(null);
      setMessageInput('');
      return;
    }

    if (pendingVideo) {
      sendChat(
        messageInput.trim() || `Đã gửi video clip: ${pendingVideo.name}`,
        'VIDEO',
        pendingVideo.url,
        0,
        pendingVideo.name
      );
      setPendingVideo(null);
      setMessageInput('');
      return;
    }

    if (!messageInput.trim()) return;
    sendChat(messageInput.trim());
    setMessageInput('');
  };

  // Quick Preset Messages
  const handleSendQuickChip = (text: string) => {
    sendChat(text);
  };

  // Image File Picker Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPendingImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Video File Picker Handler
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPendingVideo({
          url: reader.result,
          name: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Voice Note Recording (Microphone)
  const startVoiceRecording = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              sendChat(
                '🎙️ Tin nhắn thoại (Voice Note)',
                'VOICE',
                reader.result,
                recordingDuration || 5,
                'voice_note.webm'
              );
            }
          };
          reader.readAsDataURL(audioBlob);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
      } else {
        // Fallback for browsers without direct getUserMedia in iframe
        simulateVoiceRecording();
        return;
      }

      setIsRecordingVoice(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      // Permission denied or iframe restrictions fallback
      simulateVoiceRecording();
    }
  };

  const simulateVoiceRecording = () => {
    setIsRecordingVoice(true);
    setRecordingDuration(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopVoiceRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback simulated voice note with real audible sine audio wave
      const duration = Math.max(3, recordingDuration);
      sendChat(
        '🎙️ Tin nhắn thoại (Voice Note)',
        'VOICE',
        'https://actions.google.com/sounds/v1/conversations/human_vocal_response.ogg',
        duration,
        `voice_${duration}s.mp3`
      );
    }

    setIsRecordingVoice(false);
    setRecordingDuration(0);
  };

  const cancelVoiceRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVoice(false);
    setRecordingDuration(0);
  };

  // Play / Pause Voice Audio
  const togglePlayAudio = (msgId: string, audioSrc?: string | null) => {
    if (playingAudioId === msgId) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      setPlayingAudioId(null);
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }

    const src =
      audioSrc || 'https://actions.google.com/sounds/v1/conversations/human_vocal_response.ogg';
    const audio = new Audio(src);
    activeAudioRef.current = audio;
    setPlayingAudioId(msgId);

    audio.onended = () => {
      setPlayingAudioId(null);
    };
    audio.onerror = () => {
      setPlayingAudioId(null);
    };
    audio.play().catch(() => {
      setPlayingAudioId(null);
    });
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gig) return;
    submitProofOfWork(gig.id, proofNote, isWatermarked);
    setShowProofModal(false);
  };

  const handleReleaseEscrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gig) return;
    const ok = releaseEscrowPayout(gig.id, pinInput, selectedTip, useBiometrics);
    if (ok) {
      setShowReleaseModal(false);
      setShowEloModal(true); // Open ELO rating modal on successful payout
    }
  };

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gig) return;
    fileDispute(gig.id, disputeReason);
    setShowDisputeModal(false);
  };

  const handleStartVoip = (isVideo = false) => {
    if (!gig) return;
    const partnerName = isClient ? gig.freelancerName || 'Freelancer Nhận Kèo' : gig.clientName;
    startVoipCall(partnerName, isClient ? 'Người Làm' : 'Người Thuê', gig.id);
  };

  const handleSendAiMessage = (questionText?: string) => {
    const query = (questionText || aiInput).trim();
    if (!query) return;
    const userMsg = {
      id: `ai_u_${Date.now()}`,
      sender: 'USER' as const,
      text: query,
      time: 'Vừa xong',
    };
    setAiChatMessages((prev) => [...prev, userMsg]);
    setAiInput('');

    setTimeout(() => {
      let reply =
        'Cảm ơn câu hỏi của bạn! Hệ thống bảo vệ Smart Escrow của GigMe luôn hoạt động 24/7 để đảm bảo quyền lợi đôi bên.';
      const q = query.toLowerCase();
      if (q.includes('escrow') || q.includes('cọc') || q.includes('tiền')) {
        reply =
          '🛡️ Smart Escrow bảo vệ tiền 100%: Khi nhận việc, tiền của Người thuê được khóa an toàn. Freelancer hoàn tất bàn giao bằng chứng nghiệm thu thì Người thuê mới giải ngân. Hoàn toàn không sợ bùng cọc hay bùng tiền!';
      } else if (q.includes('rút') || q.includes('nạp') || q.includes('napas') || q.includes('ngân hàng')) {
        reply =
          '⚡ Rút tiền về ngân hàng qua Napas 247 được thực hiện tự động và hoàn toàn miễn phí (0đ). Tiền sẽ về tài khoản của bạn sau 1-3 giây!';
      } else if (q.includes('elo') || q.includes('sao') || q.includes('uy tín') || q.includes('đánh giá')) {
        reply =
          '🌟 Mỗi đơn việc hoàn thành đánh giá 5 sao sẽ cộng ngay +25 ELO. Đạt chuỗi 3 đơn liên tiếp sẽ mở khóa huy hiệu Chuỗi Thắng Vàng và ưu tiên hiển thị kèo VIP!';
      } else if (q.includes('khiếu nại') || q.includes('tranh chấp') || q.includes('bùng')) {
        reply =
          '⚠️ Nếu gặp sự cố, bạn chỉ cần bấm vào nút "Khiếu nại" (biểu tượng cảnh báo đỏ) ở góc trên khung chat. Trọng tài GigMe Campus sẽ vào xử lý và đối soát bằng chứng trong vòng 15 phút.';
      } else if (q.includes('chào') || q.includes('hi') || q.includes('hello')) {
        reply =
          'Chào bạn nha! Mình là Trợ lý AI Sinh Viên. Chúc bạn có một ngày làm việc và học tập tràn đầy năng lượng tại Campus!';
      }
      setAiChatMessages((prev) => [
        ...prev,
        {
          id: `ai_r_${Date.now()}`,
          sender: 'AI' as const,
          text: reply,
          time: 'Vừa xong',
        },
      ]);
    }, 400);
  };

  // 1. VIEW 24/7 AI CAMPUS ASSISTANT
  if (isAiChatActive) {
    return (
      <div className="max-w-2xl mx-auto px-2 sm:px-4 py-3 flex flex-col h-[calc(100vh-4.5rem)] pb-20">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setIsAiChatActive(false)}
              className="p-2 rounded-xl bg-[#131E30] hover:bg-[#1A2840] text-slate-300 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-extrabold text-sm text-white">Trợ Lý AI GigMe 24/7</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400">Hỗ trợ quy chế Campus, Escrow & Kèo việc</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-[#00E5FF]">
            Trực Tuyến
          </span>
        </div>

        {/* Quick FAQ Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar shrink-0 text-[11px]">
          {[
            '🛡️ Smart Escrow hoạt động ra sao?',
            '⚡ Rút tiền Napas 247 bao lâu có?',
            '⭐ Làm sao để tăng điểm ELO nhanh?',
            '⚠️ Khiếu nại đối tác bùng hẹn?',
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendAiMessage(chip)}
              className="px-3 py-1.5 rounded-full bg-[#131E30] hover:bg-[#1A2942] border border-cyan-500/30 text-cyan-300 whitespace-nowrap transition text-xs font-semibold"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Messages Log */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {aiChatMessages.map((msg) => {
            const isMe = msg.sender === 'USER';
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center space-x-1.5 mb-1 px-1">
                  <span className="text-[10px] text-slate-400 font-bold">
                    {isMe ? currentUser?.name || 'Bạn' : 'GigMe Assistant AI'}
                  </span>
                  <span className="text-[9px] text-slate-500">{msg.time}</span>
                </div>
                <div
                  className={`max-w-[85%] sm:max-w-md rounded-2xl p-3.5 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none shadow-md'
                      : 'bg-[#131E30] text-slate-200 border border-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendAiMessage();
          }}
          className="pt-2 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="Hỏi trợ lý về quyền lợi, rút tiền, cọc Escrow..."
            className="flex-1 px-4 py-3 rounded-2xl bg-[#0F172A] border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:border-[#00E5FF] transition"
          />
          <button
            type="submit"
            disabled={!aiInput.trim()}
            className="p-3 rounded-2xl bg-[#00E5FF] text-black hover:brightness-110 disabled:opacity-40 shadow-md transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  // 2. INBOX VIEW: LIST OF CONVERSATIONS & CHAT THREADS
  if (!gig) {
    const allAvailableGigs = filteredGigs.length > 0 ? filteredGigs : rawGigs;
    const conversationList = allAvailableGigs.filter((g) => {
      if (inboxTab === 'ACTIVE' && g.status !== 'IN_PROGRESS' && g.status !== 'SUBMITTED') {
        return false;
      }
      if (!inboxSearch.trim()) return true;
      const q = inboxSearch.toLowerCase();
      return (
        g.title.toLowerCase().includes(q) ||
        g.clientName.toLowerCase().includes(q) ||
        (g.freelancerName && g.freelancerName.toLowerCase().includes(q)) ||
        g.locationName.toLowerCase().includes(q)
      );
    });

    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 flex flex-col h-[calc(100vh-4.5rem)] pb-24 text-slate-900">
        {/* Inbox Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-[#00E5FF]" />
              <span>Hộp Thư Tin Nhắn & Bàn Giao</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kênh liên lạc trực tiếp & theo dõi Smart Escrow thời gian thực
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
          >
            &larr; Khám phá
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative my-3 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={inboxSearch}
            onChange={(e) => setInboxSearch(e.target.value)}
            placeholder="Tìm kiếm bạn sinh viên, kèo việc, trường đại học..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0F172A] border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:border-[#00E5FF] transition outline-none"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center space-x-2 pb-2 shrink-0">
          <button
            onClick={() => setInboxTab('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              inboxTab === 'ALL'
                ? 'bg-[#00E5FF] text-black shadow-md shadow-cyan-500/20'
                : 'bg-[#131E30] text-slate-300 hover:bg-[#1A2840]'
            }`}
          >
            Tất cả ({conversationList.length + 1})
          </button>
          <button
            onClick={() => setInboxTab('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              inboxTab === 'ACTIVE'
                ? 'bg-[#00E5FF] text-black shadow-md shadow-cyan-500/20'
                : 'bg-[#131E30] text-slate-300 hover:bg-[#1A2840]'
            }`}
          >
            Đang thực hiện / Bàn giao
          </button>
          <button
            onClick={() => setIsAiChatActive(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/10 text-[#00E5FF] border border-cyan-500/30 hover:bg-cyan-500/20 transition flex items-center space-x-1"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Trợ lý AI 24/7</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 pt-1">
          {/* PINNED: 24/7 AI Campus Assistant Thread */}
          <div
            onClick={() => setIsAiChatActive(true)}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-[#0F1D30] to-[#12233B] border border-cyan-500/30 hover:border-cyan-400/60 cursor-pointer transition shadow-md flex items-center justify-between space-x-3 group"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#00E5FF] to-blue-600 flex items-center justify-center text-black font-extrabold shadow-md">
                  <Bot className="w-6 h-6 text-black" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0F1D30] animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-extrabold text-sm text-white truncate group-hover:text-[#00E5FF] transition">
                    Trợ Lý AI GigMe 24/7 (Campus Support)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-[#00E5FF] font-bold text-[9px] shrink-0">
                    Official AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">
                  Hỏi đáp quy chế cọc Smart Escrow, rút tiền Napas 247 & mẹo tăng ELO...
                </p>
              </div>
            </div>
            <span className="text-[10px] text-cyan-400 font-bold shrink-0">Trực tuyến</span>
          </div>

          {/* GIG CONVERSATIONS */}
          {conversationList.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="font-bold text-slate-400">Không tìm thấy cuộc trò chuyện nào phù hợp.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Hãy nhận một kèo việc từ màn hình Khám phá để mở kênh chat với đối tác!
              </p>
              <button
                onClick={onBack}
                className="mt-4 px-5 py-2 rounded-xl bg-[#00E5FF] text-black font-extrabold text-xs hover:brightness-110 transition shadow-lg shadow-cyan-500/20"
              >
                &larr; Khám Phá Kèo Việc Ngay
              </button>
            </div>
          ) : (
            conversationList.map((conv) => {
              const partnerName = isClient
                ? conv.freelancerName || 'Freelancer Nhận Việc'
                : conv.clientName;
              const isSubmitted = conv.status === 'SUBMITTED';
              const isInProgress = conv.status === 'IN_PROGRESS';
              const isCompleted = conv.status === 'COMPLETED';

              return (
                <div
                  key={conv.id}
                  onClick={() => selectGig(conv.id)}
                  className="p-3.5 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 hover:bg-[#131E30] cursor-pointer transition shadow-sm flex items-center justify-between space-x-3 group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-900 to-slate-800 border border-slate-700 flex items-center justify-center text-cyan-300 font-black text-sm">
                        {partnerName.charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0F172A]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-sm text-white truncate group-hover:text-[#00E5FF] transition">
                          {partnerName}
                        </h4>
                        <span className="text-[10px] text-slate-500 ml-2 shrink-0">
                          {conv.distanceMeters ? `${conv.distanceMeters}m` : 'Gần bạn'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                        {conv.title}
                      </p>

                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] font-bold text-[#00E5FF] font-mono">
                          {formatVnd(conv.price)}
                        </span>
                        <span className="text-slate-600 text-[10px]">•</span>
                        {isInProgress && (
                          <span className="text-[10px] text-amber-400 font-bold flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1" />
                            Đang thực hiện
                          </span>
                        )}
                        {isSubmitted && (
                          <span className="text-[10px] text-cyan-400 font-bold flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Đã nộp bài (Chờ duyệt)
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center">
                            <Check className="w-3 h-3 mr-1" />
                            Đã hoàn thành
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronDown className="w-4 h-4 text-slate-500 -rotate-90 shrink-0 group-hover:text-cyan-400 transition" />
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // 3. ACTIVE CHAT ROOM VIEW FOR SELECTED GIG
  const partnerName = isClient ? gig.freelancerName || 'Freelancer Nhận Kèo' : gig.clientName;

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4 py-3 flex flex-col h-[calc(100vh-4.5rem)] pb-20">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputImageRef}
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputCameraRef}
        accept="image/*"
        capture="environment"
        onChange={handleImageFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputVideoRef}
        accept="video/*"
        onChange={handleVideoFileChange}
        className="hidden"
      />

      {/* Image Lightbox Modal */}
      {previewZoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fadeIn"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <button
              onClick={() => setPreviewZoomImage(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewZoomImage}
              alt="Ảnh phóng to"
              className="max-h-[85vh] rounded-2xl object-contain border border-slate-700 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => selectGig(null)}
            className="p-2 rounded-xl bg-[#131E30] hover:bg-[#1A2840] text-slate-300 transition"
            title="Quay lại danh sách hội thoại"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-extrabold text-sm text-white">{partnerName}</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
              {gig.title} •{' '}
              <span className="text-cyan-400 font-bold">
                {gig.status === 'IN_PROGRESS'
                  ? 'Đang thực hiện'
                  : gig.status === 'SUBMITTED'
                  ? 'Đã nộp bài (Chờ duyệt)'
                  : gig.status === 'COMPLETED'
                  ? 'Đã nghiệm thu & giải ngân'
                  : gig.status === 'DISPUTED'
                  ? 'Đang khiếu nại'
                  : gig.status}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* ELO Rating Button */}
          <button
            onClick={() => setShowEloModal(true)}
            className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition flex items-center space-x-1 text-xs font-bold"
            title="Đánh giá & Chấm điểm ELO"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span className="hidden sm:inline">Chấm ELO</span>
          </button>

          {/* VoIP Voice Call */}
          <button
            onClick={() => handleStartVoip(false)}
            className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-[#00E5FF] border border-[#00E5FF]/30 transition"
            title="Gọi thoại VoIP mã hóa"
          >
            <PhoneCall className="w-4 h-4" />
          </button>

          {/* VoIP Video Call */}
          <button
            onClick={() => handleStartVoip(true)}
            className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition"
            title="Gọi Video Call bàn giao"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Dispute Button */}
          <button
            onClick={() => setShowDisputeModal(true)}
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition"
            title="Khiếu nại trọng tài"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PERSISTENT GIG CONTEXT & ESCROW CARD (COLLAPSIBLE) */}
      <div className="my-1.5 rounded-2xl bg-[#0F1D30] border border-[#1E293B] shadow-sm overflow-hidden shrink-0">
        <div className="p-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-[#00E5FF] flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block truncate">
                {gig.category} • {gig.locationName}
              </span>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-[#00E5FF] text-sm">
                  {formatVnd(gig.price)}
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30">
                  Smart Escrow bảo vệ
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {gig.status === 'IN_PROGRESS' && (
              <button
                onClick={() => setShowProofModal(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-amber-500 text-black font-extrabold text-xs hover:brightness-110 shadow-sm transition"
              >
                Nộp Bài (Watermark)
              </button>
            )}

            {gig.status === 'SUBMITTED' && (
              <button
                onClick={() => setShowReleaseModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#00E5FF] text-black font-extrabold text-xs hover:brightness-110 shadow-md shadow-emerald-500/20 transition flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Giải Ngân Escrow</span>
              </button>
            )}

            {gig.status === 'COMPLETED' && (
              <button
                onClick={() => setShowEloModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 text-xs flex items-center space-x-1"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>Chấm ELO</span>
              </button>
            )}

            <button
              onClick={() => setIsGigCardExpanded(!isGigCardExpanded)}
              className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white transition"
              title={isGigCardExpanded ? 'Thu gọn chi tiết' : 'Mở rộng chi tiết'}
            >
              {isGigCardExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {isGigCardExpanded && (
          <div className="px-3 pb-2.5 pt-0 border-t border-slate-800/60 text-[11px] text-slate-300 space-y-1">
            <p className="line-clamp-2 text-slate-300 leading-relaxed font-medium">
              &ldquo;{gig.description}&rdquo;
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>Được tạo bởi: <strong className="text-white">{gig.clientName}</strong></span>
              <span>Thời hạn: <strong className="text-cyan-400">{gig.estimatedDurationMinutes || 60} phút</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Phrase Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 no-scrollbar shrink-0 text-[11px]">
        {[
          'Mình đang qua điểm hẹn 📍',
          'Đã hoàn thành sản phẩm/bài làm 📁',
          'Bạn kiểm tra nghiệm thu giúp mình nhé! ✨',
          'Đã nhận được hàng đầy đủ 👍',
          'Cảm ơn bạn rất nhiều! ⭐',
        ].map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendQuickChip(chip)}
            className="px-2.5 py-1 rounded-full bg-[#131E30] hover:bg-[#1A2942] border border-slate-700 text-slate-300 whitespace-nowrap transition"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
        {currentChatMessages.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <Lock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p>Kênh trò chuyện bảo mật mã hóa hai đầu.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Bạn có thể gửi tin nhắn văn bản, hình ảnh, ghi âm giọng nói và video clip tại đây!
            </p>
          </div>
        ) : (
          currentChatMessages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            const isPlaying = playingAudioId === msg.id;

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center space-x-1.5 mb-1 px-1">
                  <span className="text-[10px] text-slate-400 font-bold">{msg.senderName}</span>
                  <span className="text-[9px] text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-md rounded-2xl p-3 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none shadow-md'
                      : 'bg-[#131E30] text-slate-200 border border-slate-800 rounded-bl-none'
                  }`}
                >
                  {/* Text Body */}
                  {msg.message && <p className="mb-1">{msg.message}</p>}

                  {/* 1. IMAGE ATTACHMENT */}
                  {msg.attachmentType === 'IMAGE' && msg.attachmentData && (
                    <div className="mt-1.5 relative rounded-xl overflow-hidden border border-white/20 group">
                      <img
                        src={msg.attachmentData}
                        alt="Hình ảnh gửi kèm"
                        className="w-full max-h-56 object-cover cursor-pointer hover:opacity-90 transition"
                        onClick={() => setPreviewZoomImage(msg.attachmentData || null)}
                      />
                      <button
                        onClick={() => setPreviewZoomImage(msg.attachmentData || null)}
                        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* 2. VOICE NOTE ATTACHMENT */}
                  {msg.attachmentType === 'VOICE' && (
                    <div className="mt-2 p-2.5 rounded-xl bg-black/30 border border-white/10 flex items-center space-x-3">
                      <button
                        onClick={() => togglePlayAudio(msg.id, msg.attachmentData)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition shadow ${
                          isPlaying
                            ? 'bg-amber-400 text-black animate-pulse'
                            : 'bg-white text-slate-900 hover:scale-105'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1 h-5">
                          {[30, 60, 90, 45, 80, 100, 70, 50, 85, 40, 65, 95, 30].map((h, i) => (
                            <span
                              key={i}
                              className={`w-1 rounded-full transition-all ${
                                isPlaying ? 'bg-cyan-300 animate-pulse' : 'bg-white/40'
                              }`}
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-white/70 mt-1">
                          <span>{isPlaying ? 'Đang phát...' : 'Ghi âm giọng nói'}</span>
                          <span>{msg.attachmentDuration ? `${msg.attachmentDuration}s` : '0:06'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. VIDEO ATTACHMENT */}
                  {msg.attachmentType === 'VIDEO' && msg.attachmentData && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-white/20">
                      <video
                        src={msg.attachmentData}
                        controls
                        playsInline
                        className="w-full max-h-60 rounded-xl bg-black"
                      />
                      {msg.mediaFileName && (
                        <div className="p-1.5 bg-black/50 text-[10px] text-slate-300 flex items-center space-x-1">
                          <VideoIcon className="w-3 h-3 text-cyan-400" />
                          <span className="truncate">{msg.mediaFileName}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. WATERMARK PREVIEW PROOF */}
                  {msg.attachmentType === 'WATERMARK_PREVIEW' && (
                    <div className="mt-2 relative rounded-xl overflow-hidden border border-cyan-500/40 group">
                      <img
                        src={
                          msg.attachmentData ||
                          'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop'
                        }
                        alt="Bản nộp nghiệm thu"
                        className="w-full h-36 object-cover cursor-pointer"
                        onClick={() =>
                          setPreviewZoomImage(
                            msg.attachmentData ||
                              'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop'
                          )
                        }
                      />
                      {gig?.isWatermarkRemoved ? (
                        <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow">
                          BẢN GỐC ĐÃ GIẢI MÃ
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none select-none">
                          <span className="text-white/70 font-black text-xs tracking-widest -rotate-12 border-2 border-white/40 px-2.5 py-1 rounded-lg uppercase">
                            GIGME WATERMARK
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pending Attachments Preview Shelf */}
      {pendingImage && (
        <div className="p-2.5 rounded-2xl bg-[#0F172A] border border-cyan-500/40 flex items-center justify-between mb-2 shrink-0 animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <img
              src={pendingImage}
              alt="Ảnh đính kèm"
              className="w-12 h-12 rounded-xl object-cover border border-slate-700 cursor-pointer"
              onClick={() => setPreviewZoomImage(pendingImage)}
            />
            <div>
              <span className="text-xs font-bold text-white block">Ảnh sẵn sàng gửi</span>
              <span className="text-[10px] text-cyan-400">Bấm Gửi Ngay hoặc gõ thêm chú thích bên dưới</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleSendMessage()}
              className="px-3 py-1.5 rounded-xl bg-[#00E5FF] hover:brightness-110 text-black font-extrabold text-xs shadow-md transition flex items-center space-x-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi Ngay</span>
            </button>
            <button
              onClick={() => setPendingImage(null)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {pendingVideo && (
        <div className="p-2.5 rounded-2xl bg-[#0F172A] border border-cyan-500/30 flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <VideoIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block truncate max-w-xs">
                {pendingVideo.name}
              </span>
              <span className="text-[10px] text-slate-400">Video clip sẵn sàng gửi</span>
            </div>
          </div>
          <button
            onClick={() => setPendingVideo(null)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Voice Recording Active Bar */}
      {isRecordingVoice ? (
        <div className="pt-2 flex items-center justify-between p-3 rounded-2xl bg-red-950/40 border border-red-500/40 shrink-0 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-bold text-red-400">
              Đang ghi âm giọng nói: {recordingDuration}s
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={cancelVoiceRecording}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={stopVoiceRecording}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold shadow-md transition flex items-center space-x-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi Voice</span>
            </button>
          </div>
        </div>
      ) : (
        /* Standard Message Input Bottom Bar with Multimedia Buttons */
        <form onSubmit={handleSendMessage} className="pt-2 flex items-center gap-1.5 shrink-0">
          {/* Snap Photo Directly with Camera */}
          <button
            type="button"
            onClick={() => fileInputCameraRef.current?.click()}
            className="p-2.5 rounded-2xl bg-[#131E30] hover:bg-[#1A2840] border border-slate-700 text-pink-400 transition"
            title="Chụp ảnh trực tiếp từ Camera"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Send Picture from Gallery Button */}
          <button
            type="button"
            onClick={() => fileInputImageRef.current?.click()}
            className="p-2.5 rounded-2xl bg-[#131E30] hover:bg-[#1A2840] border border-slate-700 text-[#00E5FF] transition"
            title="Gửi hình ảnh từ thư viện"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Send Video Button */}
          <button
            type="button"
            onClick={() => fileInputVideoRef.current?.click()}
            className="p-2.5 rounded-2xl bg-[#131E30] hover:bg-[#1A2840] border border-slate-700 text-indigo-400 transition"
            title="Gửi video clip"
          >
            <VideoIcon className="w-4 h-4" />
          </button>

          {/* Voice Note Button */}
          <button
            type="button"
            onClick={startVoiceRecording}
            className="p-2.5 rounded-2xl bg-[#131E30] hover:bg-[#1A2840] border border-slate-700 text-amber-400 transition"
            title="Ghi âm giọng nói (Voice Note)"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Proof Upload Button */}
          <button
            type="button"
            onClick={() => setShowProofModal(true)}
            className="p-2.5 rounded-2xl bg-[#131E30] hover:bg-[#1A2840] border border-slate-700 text-orange-400 transition hidden sm:flex"
            title="Nộp nghiệm thu Watermark"
          >
            <FileCheck className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-2xl bg-[#0F172A] border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:border-[#00E5FF] transition"
            placeholder={
              pendingImage
                ? 'Gõ chú thích ảnh hoặc nhấn Gửi...'
                : pendingVideo
                ? 'Gõ chú thích video hoặc nhấn Gửi...'
                : 'Nhập tin nhắn, trao đổi việc làm...'
            }
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!messageInput.trim() && !pendingImage && !pendingVideo}
            className="p-2.5 rounded-2xl bg-[#00E5FF] text-black hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-500/20 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* 1. SUBMIT PROOF MODAL WITH WATERMARK */}
      {showProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 text-white shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm flex items-center space-x-1.5 text-[#FF6B00]">
                <FileCheck className="w-4 h-4" />
                <span>Nộp Bằng Chứng Nghiệm Thu Công Việc</span>
              </h3>
              <button onClick={() => setShowProofModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProof} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Ghi chú kết quả hoàn thành
                </label>
                <textarea
                  rows={2}
                  required
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white"
                  placeholder="Mô tả kết quả đã làm..."
                />
              </div>

              {/* Watermark Protection Toggle */}
              <div className="p-3 rounded-xl bg-[#131E30] border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Đóng dấu Watermark bảo vệ bản quyền</span>
                  <span className="text-[10px] text-slate-400">
                    Chống bùng bài trước khi người thuê bấm giải ngân tiền
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isWatermarked}
                  onChange={(e) => setIsWatermarked(e.target.checked)}
                  className="w-4 h-4 accent-[#00E5FF] cursor-pointer"
                />
              </div>

              {/* Open High-Tech Blockchain Proof Modal */}
              <button
                type="button"
                onClick={() => {
                  setShowProofModal(false);
                  setShowBlockchainModal(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-[#00E5FF]/40 text-[#00E5FF] font-bold text-xs transition flex items-center justify-center space-x-1.5"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Mở Bộ Đóng Dấu Blockchain Hash & Geostamp</span>
              </button>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-amber-500 text-black font-extrabold text-sm hover:brightness-110 shadow-lg shadow-orange-500/20 transition"
              >
                Gửi Bài Nghiệm Thu Ngay
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. RELEASE ESCROW PAYOUT MODAL */}
      {showReleaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 text-white shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm flex items-center space-x-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Giải Ngân Smart Escrow & Tiền Tip</span>
              </h3>
              <button onClick={() => setShowReleaseModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReleaseEscrow} className="py-4 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                Khi bấm giải ngân, tiền thù lao <strong>{formatVnd(gig ? gig.price : 0)}</strong> sẽ chuyển thẳng vào ví
                Freelancer, và watermark bản gốc sẽ tự động được gỡ bỏ!
              </div>

              {/* Tip Selection */}
              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">
                  Thưởng thêm tiền Tip (tùy chọn)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 10000, 20000, 50000].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTip(t)}
                      className={`py-1.5 rounded-lg border font-bold text-xs transition ${
                        selectedTip === t
                          ? 'bg-emerald-400 text-black border-emerald-400'
                          : 'bg-[#131E30] text-slate-300 border-slate-700'
                      }`}
                    >
                      {t === 0 ? 'Không' : `+${t / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              {/* PIN or Biometrics check */}
              <div className="p-3 rounded-xl bg-[#131E30] border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center space-x-1">
                    <Fingerprint className="w-4 h-4 text-[#00E5FF]" />
                    <span>Xác thực vân tay / FaceID</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={useBiometrics}
                    onChange={(e) => setUseBiometrics(e.target.checked)}
                    className="w-4 h-4 accent-[#00E5FF] cursor-pointer"
                  />
                </div>

                {!useBiometrics && (
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      Nhập mã PIN 6 số của bạn
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono tracking-widest text-center text-sm font-bold"
                      placeholder="******"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#00E5FF] text-black font-extrabold text-sm hover:brightness-110 shadow-lg shadow-emerald-500/20 transition"
              >
                Xác Nhận Giải Ngân Tiền Ngay
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. DISPUTE FILING MODAL */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-[#0F172A] border border-red-500/40 p-6 text-white shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm flex items-center space-x-1.5 text-red-400">
                <ShieldAlert className="w-4 h-4" />
                <span>Yêu Cầu Trọng Tài Phân Xử (Dispute)</span>
              </h3>
              <button onClick={() => setShowDisputeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDisputeSubmit} className="py-4 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
                Khoản tiền Escrow sẽ tiếp tục bị khóa đóng băng an toàn. Trọng tài AI & Admin GigMe sẽ phân tích lịch sử
                chat và bằng chứng để hoàn tiền hoặc giải ngân trong vòng 24h.
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Lý do khiếu nại tranh chấp
                </label>
                <textarea
                  rows={3}
                  required
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white"
                  placeholder="Mô tả cụ thể vi phạm hoặc lý do..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm shadow-lg shadow-red-600/20 transition"
              >
                Gửi Hồ Sơ Cho Ban Trọng Tài
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. BLOCKCHAIN PROOF & WATERMARK MODAL */}
      {gig && (
        <BlockchainProofModal
          isOpen={showBlockchainModal}
          onClose={() => setShowBlockchainModal(false)}
          gigId={gig.id}
        />
      )}

      {/* 5. STUDENT ELO & RATING MODAL */}
      <StudentEloModal
        isOpen={showEloModal}
        onClose={() => setShowEloModal(false)}
        targetGigId={gig?.id}
        targetUserName={partnerName}
      />
    </div>
  );
};
