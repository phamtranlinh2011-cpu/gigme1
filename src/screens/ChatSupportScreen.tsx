import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  PhoneCall,
  Video,
  Send,
  Camera,
  Image as ImageIcon,
  Mic,
  MicOff,
  Play,
  Pause,
  Bot,
  Search,
  MessageCircle,
  Check,
  CheckCheck,
  Sparkles,
  Info,
  X,
  Plus,
  Smile,
  ThumbsUp,
  UserCheck,
  Briefcase,
  Paperclip,
  Share2,
  ShieldCheck,
  Zap,
  Clock,
  ChevronRight,
  Filter,
  Trash2,
  User,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { formatVnd, ChatMessageEntity, UserEntity } from '../types';
import { generateSynthesizedVoiceWav, playSynthesizedVoiceTone } from '../utils/audio';

interface ChatSupportScreenProps {
  onBack: () => void;
}

interface MessengerContact {
  id: string;
  name: string;
  role: 'CLIENT' | 'WORKER';
  roleLabel: string;
  school: string;
  avatarBg: string;
  isOnline: boolean;
  lastActiveText: string;
  specialtyOrNeed: string;
  associatedGig?: {
    id: string;
    title: string;
    price: number;
    status: string;
  };
}

export const ChatSupportScreen: React.FC<ChatSupportScreenProps> = ({ onBack }) => {
  const {
    currentUser,
    roleMode,
    allChats,
    rawGigs,
    sendChat,
    startVoipCall,
    selectGig,
    showNotification,
  } = useGigMe();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'ALL' | 'CLIENTS' | 'WORKERS' | 'ONLINE' | 'AI'>('ALL');
  
  // Selected conversation: contact ID or 'AI_ASSISTANT'
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Message input state
  const [messageInput, setMessageInput] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingVideo, setPendingVideo] = useState<{ url: string; name: string } | null>(null);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showContactInfoModal, setShowContactInfoModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const recordingDurationRef = useRef<number>(0);

  // Audio Playback
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const synthesizedAudioStopRef = useRef<(() => void) | null>(null);

  // File input refs
  const fileInputImageRef = useRef<HTMLInputElement | null>(null);
  const fileInputCameraRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // AI Assistant Chat Messages & Loading
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ id: string; sender: 'USER' | 'AI'; text: string; time: string }>>([
    {
      id: 'ai_welcome',
      sender: 'AI',
      text: 'Xin chào bạn! Mình là Trợ lý AI GigMe 24/7 (powered by Gemini). Mình luôn sẵn sàng giải đáp về ký quỹ Smart Escrow, rút tiền Napas 247 tức thì, và hỗ trợ liên hệ giữa người thuê & người làm.',
      time: 'Trực tuyến',
    },
  ]);

  // Build Campus Contacts Directory (Hirers & Freelancers from Gigs and Campus Network)
  const campusContacts: MessengerContact[] = useMemo(() => {
    const list: MessengerContact[] = [
      {
        id: 'contact_client_hoangminh',
        name: 'Hoàng Minh',
        role: 'CLIENT',
        roleLabel: 'Người thuê',
        school: 'ĐH Bách Khoa Hà Nội',
        avatarBg: 'from-blue-600 to-cyan-500',
        isOnline: true,
        lastActiveText: 'Đang hoạt động',
        specialtyOrNeed: 'Cần hỗ trợ debug bài tập Python & thuật toán',
      },
      {
        id: 'contact_worker_thanhtruc',
        name: 'Thanh Trúc',
        role: 'WORKER',
        roleLabel: 'Người làm',
        school: 'ĐHQG TP.HCM (KTX Khu B)',
        avatarBg: 'from-emerald-600 to-teal-500',
        isOnline: true,
        lastActiveText: 'Đang hoạt động',
        specialtyOrNeed: 'Chuyên chạy vặt KTX, giao nhận đồ giặt & mua cơm',
      },
      {
        id: 'contact_worker_leduy',
        name: 'Lê Duy',
        role: 'WORKER',
        roleLabel: 'Người làm IT',
        school: 'ĐH Bách Khoa Đà Nẵng',
        avatarBg: 'from-purple-600 to-indigo-500',
        isOnline: false,
        lastActiveText: 'Hoạt động 15 phút trước',
        specialtyOrNeed: 'Thiết kế Slide Canva, Figma, lập trình React & Node',
      },
      {
        id: 'contact_client_myuyen',
        name: 'Vũ Hoàng My',
        role: 'CLIENT',
        roleLabel: 'Người thuê',
        school: 'ĐH Kinh Tế TP.HCM (UEH)',
        avatarBg: 'from-amber-600 to-orange-500',
        isOnline: true,
        lastActiveText: 'Đang hoạt động',
        specialtyOrNeed: 'Tìm bạn hỗ trợ khảo sát thị trường & thu thập dữ liệu',
      },
      {
        id: 'contact_worker_giahuy',
        name: 'Phạm Gia Huy',
        role: 'WORKER',
        roleLabel: 'Người làm',
        school: 'ĐH Công Nghệ Thông Tin (UIT)',
        avatarBg: 'from-cyan-600 to-blue-500',
        isOnline: true,
        lastActiveText: 'Đang hoạt động',
        specialtyOrNeed: 'Gia sư Lập trình C++, Cấu trúc dữ liệu & Giải thuật',
      },
      {
        id: 'contact_client_quocbao',
        name: 'Đặng Quốc Bảo',
        role: 'CLIENT',
        roleLabel: 'Người thuê',
        school: 'ĐH Quốc Tế (IU)',
        avatarBg: 'from-rose-600 to-pink-500',
        isOnline: false,
        lastActiveText: 'Hoạt động 1 giờ trước',
        specialtyOrNeed: 'Cần tìm gia sư luyện thi IELTS Speaking 6.5+',
      },
    ];

    // Merge in contacts from real gigs in context
    if (rawGigs && rawGigs.length > 0) {
      rawGigs.forEach((gig) => {
        // Hirer contact from gig
        if (gig.clientId && gig.clientId !== currentUser?.id) {
          const existing = list.find((c) => c.id === gig.clientId);
          if (!existing) {
            list.unshift({
              id: gig.clientId,
              name: gig.clientName || 'Người thuê việc',
              role: 'CLIENT',
              roleLabel: 'Người thuê',
              school: gig.locationName?.includes('Hà Nội') ? 'ĐH Bách Khoa HN' : 'ĐHQG TP.HCM',
              avatarBg: 'from-blue-600 to-indigo-600',
              isOnline: true,
              lastActiveText: 'Đang online',
              specialtyOrNeed: `Đơn: ${gig.title}`,
              associatedGig: {
                id: gig.id,
                title: gig.title,
                price: gig.price,
                status: gig.status,
              },
            });
          } else if (!existing.associatedGig) {
            existing.associatedGig = {
              id: gig.id,
              title: gig.title,
              price: gig.price,
              status: gig.status,
            };
          }
        }

        // Freelancer contact from gig
        if (gig.freelancerId && gig.freelancerId !== currentUser?.id) {
          const existing = list.find((c) => c.id === gig.freelancerId);
          if (!existing) {
            list.unshift({
              id: gig.freelancerId,
              name: gig.freelancerName || 'Người làm việc',
              role: 'WORKER',
              roleLabel: 'Người làm',
              school: 'Sinh viên Campus',
              avatarBg: 'from-emerald-600 to-cyan-600',
              isOnline: true,
              lastActiveText: 'Đang online',
              specialtyOrNeed: `Đang làm: ${gig.title}`,
              associatedGig: {
                id: gig.id,
                title: gig.title,
                price: gig.price,
                status: gig.status,
              },
            });
          } else if (!existing.associatedGig) {
            existing.associatedGig = {
              id: gig.id,
              title: gig.title,
              price: gig.price,
              status: gig.status,
            };
          }
        }
      });
    }

    return list;
  }, [rawGigs, currentUser]);

  // Active contact details
  const activeContact = useMemo(() => {
    if (!activeConversationId) return null;
    return campusContacts.find((c) => c.id === activeConversationId) || null;
  }, [activeConversationId, campusContacts]);

  // Messages for active conversation
  const currentConversationMessages = useMemo(() => {
    if (!activeConversationId) return [];
    // Filter messages for this contact (either gigId matching contact or partnerId matching)
    return (allChats || []).filter((msg) => {
      const gigIdMatch = activeContact?.associatedGig && msg.gigId === activeContact.associatedGig.id;
      const threadMatch = msg.threadId === activeConversationId || msg.gigId === activeConversationId;
      const partnerMatch = msg.partnerId === activeConversationId || (msg.senderId === activeConversationId);
      return gigIdMatch || threadMatch || partnerMatch;
    });
  }, [allChats, activeConversationId, activeContact]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversationMessages, aiChatMessages, isAiTyping]);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (synthesizedAudioStopRef.current) {
        synthesizedAudioStopRef.current();
        synthesizedAudioStopRef.current = null;
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Filtered contacts list
  const filteredContacts = useMemo(() => {
    return campusContacts.filter((contact) => {
      // Search filter
      const matchesSearch =
        !searchQuery.trim() ||
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.specialtyOrNeed.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Tab filter
      if (activeFilterTab === 'CLIENTS') return contact.role === 'CLIENT';
      if (activeFilterTab === 'WORKERS') return contact.role === 'WORKER';
      if (activeFilterTab === 'ONLINE') return contact.isOnline;
      if (activeFilterTab === 'AI') return false; // AI has its own card

      return true;
    });
  }, [campusContacts, searchQuery, activeFilterTab]);

  // Latest message preview for a contact
  const getLastMessageForContact = (contactId: string, associatedGigId?: string) => {
    const relevant = (allChats || []).filter(
      (m) =>
        m.threadId === contactId ||
        m.gigId === contactId ||
        m.partnerId === contactId ||
        (associatedGigId && m.gigId === associatedGigId)
    );
    if (relevant.length === 0) return null;
    return relevant[relevant.length - 1];
  };

  // SEND MESSAGE (MESSENGER 1-1)
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeContact) return;

    const targetThread = activeContact.associatedGig?.id || activeContact.id;

    if (pendingImage) {
      sendChat(
        messageInput.trim() || 'Đã gửi một hình ảnh',
        'IMAGE',
        pendingImage,
        0,
        'image.jpg',
        targetThread,
        activeContact.id,
        activeContact.name
      );
      setPendingImage(null);
      setMessageInput('');
      return;
    }

    if (pendingVideo) {
      sendChat(
        messageInput.trim() || `Đã gửi video: ${pendingVideo.name}`,
        'VIDEO',
        pendingVideo.url,
        0,
        pendingVideo.name,
        targetThread,
        activeContact.id,
        activeContact.name
      );
      setPendingVideo(null);
      setMessageInput('');
      return;
    }

    if (!messageInput.trim()) return;

    sendChat(
      messageInput.trim(),
      'NONE',
      null,
      0,
      undefined,
      targetThread,
      activeContact.id,
      activeContact.name
    );
    setMessageInput('');
  };

  // Quick Thumbs-up (Messenger classic 👍)
  const handleSendThumbsUp = () => {
    if (!activeContact) return;
    const targetThread = activeContact.associatedGig?.id || activeContact.id;
    sendChat(
      '👍',
      'NONE',
      null,
      0,
      undefined,
      targetThread,
      activeContact.id,
      activeContact.name
    );
  };

  // Preset Quick Replies
  const handleSendQuickReply = (text: string) => {
    if (!activeContact) return;
    const targetThread = activeContact.associatedGig?.id || activeContact.id;
    sendChat(
      text,
      'NONE',
      null,
      0,
      undefined,
      targetThread,
      activeContact.id,
      activeContact.name
    );
  };

  // Send AI Message via Gemini API
  const handleSendAiMessage = async (textToSend?: string) => {
    const query = (textToSend || messageInput).trim();
    if (!query) return;

    const userMsg = {
      id: `ai_u_${Date.now()}`,
      sender: 'USER' as const,
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAiChatMessages((prev) => [...prev, userMsg]);
    setMessageInput('');
    setIsAiTyping(true);

    try {
      const response = await fetch('/api/gemini/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });
      const data = await response.json();
      const reply = data.reply || 'Hệ thống Smart Escrow của GigMe luôn bảo vệ 100% quyền lợi của bạn!';

      setAiChatMessages((prev) => [
        ...prev,
        {
          id: `ai_r_${Date.now()}`,
          sender: 'AI' as const,
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setAiChatMessages((prev) => [
        ...prev,
        {
          id: `ai_r_${Date.now()}`,
          sender: 'AI' as const,
          text: '🛡️ Smart Escrow GigMe: Tiền của người thuê được khóa an toàn. Người làm hoàn tất công việc thì người thuê mới bấm giải ngân. Rút tiền Napas 247 tức thì 0đ phí!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Image File Picker
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPendingImage(reader.result);
        setShowAttachmentMenu(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Voice Note Recording (Support both hardware microphone & guaranteed playable synthesized WAV)
  const startVoiceRecording = async () => {
    if (isRecordingVoice) return;
    if (!activeContact) {
      showNotification('Nhắc nhở', 'Vui lòng chọn một cuộc trò chuyện để gửi tin nhắn thoại!');
      return;
    }

    audioChunksRef.current = [];
    recordingDurationRef.current = 0;
    setRecordingDuration(0);

    // Try hardware microphone
    try {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        let mimeType = '';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          } else if (MediaRecorder.isTypeSupported('audio/aac')) {
            mimeType = 'audio/aac';
          }
        }

        const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const actualDuration = Math.max(1, recordingDurationRef.current || 2);
          const chosenMime = mediaRecorder.mimeType || mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: chosenMime });

          if (audioBlob.size > 100) {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string' && activeContact) {
                const targetThread = activeContact.associatedGig?.id || activeContact.id;
                sendChat(
                  `🎙️ Tin nhắn thoại (${actualDuration}s)`,
                  'VOICE',
                  reader.result,
                  actualDuration,
                  chosenMime.includes('mp4') ? 'voice_note.m4a' : 'voice_note.webm',
                  targetThread,
                  activeContact.id,
                  activeContact.name
                );
                showNotification('Tin nhắn thoại 🎙️', `Đã gửi bản ghi âm (${actualDuration} giây)!`);
              }
            };
            reader.readAsDataURL(audioBlob);
          } else {
            fallbackSendSynthesizedVoice(actualDuration);
          }

          stream.getTracks().forEach((track) => track.stop());
          mediaRecorderRef.current = null;
        };

        mediaRecorder.start(250);
        setIsRecordingVoice(true);

        recordingTimerRef.current = setInterval(() => {
          recordingDurationRef.current += 1;
          setRecordingDuration(recordingDurationRef.current);
        }, 1000);
        return;
      }
    } catch (micErr) {
      console.warn('Microphone access unavailable or denied, falling back to simulated voice recording:', micErr);
    }

    // Fallback: Start voice recording timer
    setIsRecordingVoice(true);
    recordingTimerRef.current = setInterval(() => {
      recordingDurationRef.current += 1;
      setRecordingDuration(recordingDurationRef.current);
    }, 1000);
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.onstop = null;
          mediaRecorderRef.current.stop();
        }
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecordingVoice(false);
    setRecordingDuration(0);
    recordingDurationRef.current = 0;
    showNotification('Đã hủy', 'Đã hủy đoạn ghi âm.');
  };

  const stopVoiceRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    const finalDuration = Math.max(1, recordingDurationRef.current);
    setIsRecordingVoice(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        if (typeof mediaRecorderRef.current.requestData === 'function') {
          mediaRecorderRef.current.requestData();
        }
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping MediaRecorder, using synthesized fallback:', err);
        fallbackSendSynthesizedVoice(finalDuration);
      }
      return;
    }

    fallbackSendSynthesizedVoice(finalDuration);
  };

  const fallbackSendSynthesizedVoice = (duration: number) => {
    if (!activeContact) return;
    const actualDuration = Math.max(1, duration || 3);
    const audioDataUrl = generateSynthesizedVoiceWav(actualDuration);
    const targetThread = activeContact.associatedGig?.id || activeContact.id;

    sendChat(
      `🎙️ Tin nhắn thoại (${actualDuration}s)`,
      'VOICE',
      audioDataUrl,
      actualDuration,
      'voice_note.wav',
      targetThread,
      activeContact.id,
      activeContact.name
    );
    showNotification('Tin nhắn thoại 🎙️', `Đã gửi bản ghi âm (${actualDuration} giây)!`);
  };

  // Play / Pause Voice Note
  const handleTogglePlayAudio = (msgId: string, audioDataUrl?: string | null, duration = 3) => {
    if (playingAudioId === msgId) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (synthesizedAudioStopRef.current) {
        synthesizedAudioStopRef.current();
        synthesizedAudioStopRef.current = null;
      }
      setPlayingAudioId(null);
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (synthesizedAudioStopRef.current) {
      synthesizedAudioStopRef.current();
      synthesizedAudioStopRef.current = null;
    }

    setPlayingAudioId(msgId);

    const isStubOrInvalid =
      !audioDataUrl ||
      audioDataUrl.length < 100 ||
      audioDataUrl.includes('UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');

    if (isStubOrInvalid) {
      synthesizedAudioStopRef.current = playSynthesizedVoiceTone(duration || 3, () => {
        setPlayingAudioId(null);
        synthesizedAudioStopRef.current = null;
      });
      return;
    }

    try {
      const audio = new Audio(audioDataUrl);
      activeAudioRef.current = audio;

      audio.onended = () => {
        setPlayingAudioId(null);
        activeAudioRef.current = null;
      };

      audio.onerror = () => {
        synthesizedAudioStopRef.current = playSynthesizedVoiceTone(duration || 3, () => {
          setPlayingAudioId(null);
          synthesizedAudioStopRef.current = null;
        });
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          synthesizedAudioStopRef.current = playSynthesizedVoiceTone(duration || 3, () => {
            setPlayingAudioId(null);
            synthesizedAudioStopRef.current = null;
          });
        });
      }
    } catch {
      synthesizedAudioStopRef.current = playSynthesizedVoiceTone(duration || 3, () => {
        setPlayingAudioId(null);
        synthesizedAudioStopRef.current = null;
      });
    }
  };

  // ==========================================
  // VIEW 1: 24/7 AI CAMPUS ASSISTANT CHAT ROOM
  // ==========================================
  if (activeConversationId === 'AI_ASSISTANT') {
    return (
      <div className="max-w-2xl mx-auto px-2 sm:px-4 py-3 flex flex-col h-[calc(100vh-4.5rem)] pb-20">
        {/* Messenger Header for AI */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveConversationId(null)}
              className="p-2 rounded-xl bg-[#131E30] hover:bg-[#1A2840] text-slate-300 transition"
              title="Quay lại danh sách chat"
            >
              <ArrowLeft className="w-5 h-5 text-[#00E5FF]" />
            </button>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00E5FF] to-blue-600 flex items-center justify-center text-black font-extrabold shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#081022] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-extrabold text-sm text-white">Trợ Lý AI GigMe 24/7</h3>
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-[#00E5FF] text-[9px] font-bold">
                  Gemini 2.5
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium">Đang trực tuyến • Sẵn sàng hỗ trợ 24/7</p>
            </div>
          </div>
          <button
            onClick={() => setActiveConversationId(null)}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800/80 transition"
          >
            Đóng
          </button>
        </div>

        {/* Quick FAQ Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar shrink-0 text-[11px]">
          {[
            '🛡️ Smart Escrow hoạt động ra sao?',
            '⚡ Rút tiền Napas 247 bao lâu?',
            '⭐ Mẹo tăng điểm ELO sinh viên?',
            '⚠️ Khiếu nại khi đối tác trễ hẹn?',
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendAiMessage(chip)}
              className="px-3 py-1.5 rounded-full bg-[#131E30] hover:bg-[#1A2942] border border-cyan-500/30 text-cyan-300 whitespace-nowrap transition text-xs font-semibold shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {aiChatMessages.map((msg) => {
            const isMe = msg.sender === 'USER';
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center space-x-1.5 mb-1 px-1">
                  <span className="text-[10px] text-slate-400 font-bold">
                    {isMe ? currentUser?.name || 'Bạn' : 'Trợ lý AI GigMe'}
                  </span>
                  <span className="text-[9px] text-slate-500">{msg.time}</span>
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-[#00E5FF] to-blue-600 text-black font-semibold rounded-tr-none shadow-md shadow-cyan-500/10'
                      : 'bg-[#131E30] border border-slate-700/80 text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {isAiTyping && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs py-2 px-2">
              <Bot className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="animate-pulse">Trợ lý AI đang phản hồi...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* AI Input Footer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendAiMessage();
          }}
          className="pt-2 border-t border-slate-800 shrink-0 flex items-center space-x-2"
        >
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Hỏi về tiền cọc, rút tiền Napas, mẹo nhận việc..."
            className="flex-1 py-2.5 px-4 rounded-2xl bg-[#0F172A] border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:border-[#00E5FF] transition outline-none"
          />
          <button
            type="submit"
            disabled={!messageInput.trim() || isAiTyping}
            className="p-2.5 rounded-2xl bg-[#00E5FF] hover:brightness-110 disabled:opacity-40 text-black font-bold transition shadow-md shadow-cyan-500/20 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: 1-1 MESSENGER CHAT ROOM (NGƯỜI THUÊ & NGƯỜI LÀM)
  // ==========================================
  if (activeContact) {
    const isPartnerOnline = activeContact.isOnline;
    const associatedGig = activeContact.associatedGig;

    return (
      <div className="max-w-2xl mx-auto px-2 sm:px-4 py-2 flex flex-col h-[calc(100vh-4.5rem)] pb-20">
        {/* MESSENGER TOP APP BAR */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <button
              onClick={() => setActiveConversationId(null)}
              className="p-2 rounded-xl bg-[#131E30] hover:bg-[#1A2840] text-slate-300 transition shrink-0"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="w-5 h-5 text-[#00E5FF]" />
            </button>

            {/* Partner Avatar */}
            <div className="relative shrink-0">
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-tr ${activeContact.avatarBg} flex items-center justify-center text-white font-extrabold text-sm shadow-md`}
              >
                {activeContact.name.charAt(0).toUpperCase()}
              </div>
              {isPartnerOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#081022]" />
              )}
            </div>

            {/* Partner Info */}
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 truncate">
                <h3 className="font-extrabold text-sm text-white truncate">{activeContact.name}</h3>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    activeContact.role === 'CLIENT'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {activeContact.roleLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {isPartnerOnline ? (
                  <span className="text-emerald-400 font-medium">Đang hoạt động</span>
                ) : (
                  activeContact.lastActiveText
                )}{' '}
                • {activeContact.school}
              </p>
            </div>
          </div>

          {/* Quick Communication Actions (VoIP Call & Info) */}
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => startVoipCall(activeContact.name, activeContact.roleLabel, associatedGig?.id)}
              className="p-2 rounded-xl bg-[#131E30] hover:bg-[#1A2942] text-cyan-300 transition"
              title="Gọi thoại VoIP miễn phí qua mạng Campus"
            >
              <PhoneCall className="w-4 h-4" />
            </button>
            <button
              onClick={() => startVoipCall(activeContact.name, `${activeContact.roleLabel} (Video)`, associatedGig?.id)}
              className="p-2 rounded-xl bg-[#131E30] hover:bg-[#1A2942] text-cyan-300 transition"
              title="Gọi video trực tuyến"
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowContactInfoModal(true)}
              className="p-2 rounded-xl bg-[#131E30] hover:bg-[#1A2942] text-slate-400 hover:text-white transition"
              title="Xem thông tin chi tiết"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DISMISSIBLE 1-LINE COLLABORATION STATUS (SUBTLE - NOT A TASK CARD) */}
        {associatedGig && !bannerDismissed && (
          <div className="my-2 px-3 py-1.5 rounded-xl bg-[#101B2E] border border-cyan-500/20 flex items-center justify-between text-xs text-slate-300 shrink-0">
            <div className="flex items-center space-x-2 truncate">
              <Briefcase className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
              <span className="truncate">
                <span className="text-[#00E5FF] font-bold">Kèo chung:</span> {associatedGig.title} (
                {formatVnd(associatedGig.price)})
              </span>
            </div>
            <div className="flex items-center space-x-2 shrink-0 ml-2">
              <button
                onClick={() => {
                  selectGig(associatedGig.id);
                  showNotification('Thông tin việc làm', `Đã chọn kèo "${associatedGig.title}"`);
                }}
                className="text-[11px] text-[#00E5FF] hover:underline font-bold"
              >
                Chi tiết
              </button>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-slate-500 hover:text-slate-300 p-0.5"
                title="Ẩn thông báo này"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* QUICK REPLIES BAR (MESSENGER CHIPS) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar shrink-0 text-[11px]">
          {[
            '👋 Chào bạn nha!',
            '👌 Mình nhận kèo nhé!',
            '📁 Bạn gửi file qua đây nha!',
            '🏃 Mình đang qua sảnh A nè!',
            '🙏 Cảm ơn bạn nhiều!',
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuickReply(chip)}
              className="px-2.5 py-1 rounded-full bg-[#131E30] hover:bg-[#1A2840] border border-slate-800 text-slate-300 hover:text-white whitespace-nowrap transition text-xs shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* MESSENGER MESSAGES STREAM */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2.5 pr-1">
          {currentConversationMessages.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <div
                className={`w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-tr ${activeContact.avatarBg} flex items-center justify-center text-white font-black text-xl shadow-lg`}
              >
                {activeContact.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="font-extrabold text-sm text-white">{activeContact.name}</h4>
              <p className="text-slate-400 text-xs mt-0.5">{activeContact.specialtyOrNeed}</p>
              <p className="text-[11px] text-slate-500 mt-2">
                Hãy gửi tin nhắn đầu tiên để kết nối và trao đổi công việc trực tiếp!
              </p>
            </div>
          ) : (
            currentConversationMessages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
                  {/* Sender Name & Time */}
                  <div className="flex items-center space-x-1.5 mb-0.5 px-1">
                    <span className="text-[10px] text-slate-400 font-bold">
                      {isMe ? 'Bạn' : msg.senderName || activeContact.name}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Message Bubble Container */}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed relative ${
                      isMe
                        ? 'bg-gradient-to-r from-[#00E5FF] to-blue-600 text-black font-semibold rounded-tr-none shadow-md shadow-cyan-500/10'
                        : 'bg-[#131E30] border border-slate-700/80 text-slate-100 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {/* Text Message */}
                    {msg.message && <p className="whitespace-pre-wrap break-words">{msg.message}</p>}

                    {/* Image Attachment */}
                    {msg.attachmentType === 'IMAGE' && msg.attachmentData && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-black/20">
                        <img
                          src={msg.attachmentData}
                          alt="Ảnh đính kèm"
                          className="max-h-60 rounded-xl object-cover cursor-pointer hover:opacity-95 transition"
                          onClick={() => setPreviewZoomImage(msg.attachmentData!)}
                        />
                      </div>
                    )}

                    {/* Voice Note Attachment */}
                    {msg.attachmentType === 'VOICE' && (
                      <div className="mt-2 flex items-center space-x-2.5 py-2 px-3 rounded-2xl bg-black/25 backdrop-blur-xs border border-white/15 text-xs min-w-[200px] sm:min-w-[240px]">
                        <button
                          type="button"
                          onClick={() => handleTogglePlayAudio(msg.id, msg.attachmentData, msg.attachmentDuration)}
                          className="w-9 h-9 rounded-full bg-[#00E5FF] text-black hover:scale-105 active:scale-95 flex items-center justify-center shrink-0 shadow-md transition"
                          title={playingAudioId === msg.id ? 'Tạm dừng' : 'Phát tin nhắn thoại'}
                        >
                          {playingAudioId === msg.id ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="font-extrabold text-white tracking-tight">
                              {playingAudioId === msg.id ? 'Đang phát thoại...' : 'Tin nhắn thoại'}
                            </span>
                            <span className="font-mono text-[10px] text-cyan-200 font-bold">
                              {msg.attachmentDuration || 3}s
                            </span>
                          </div>
                          {/* Audio Waveform Bars */}
                          <div className="flex items-center space-x-0.5 h-4">
                            {[30, 65, 90, 50, 100, 80, 45, 90, 70, 40, 85, 60, 95, 50, 30].map((h, i) => (
                              <div
                                key={i}
                                className={`flex-1 rounded-full transition-all duration-150 ${
                                  playingAudioId === msg.id ? 'bg-[#00E5FF] animate-pulse' : 'bg-white/40'
                                }`}
                                style={{
                                  height:
                                    playingAudioId === msg.id
                                      ? `${Math.max(25, h * (0.6 + ((i % 3) * 0.2)))}%`
                                      : `${h}%`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Video Attachment */}
                    {msg.attachmentType === 'VIDEO' && msg.attachmentData && (
                      <div className="mt-2 rounded-xl overflow-hidden">
                        <video src={msg.attachmentData} controls className="max-h-56 w-full rounded-xl" />
                      </div>
                    )}
                  </div>

                  {/* Read Receipt */}
                  {isMe && (
                    <div className="flex items-center space-x-1 text-[9px] text-slate-500 mt-0.5 px-1">
                      <span>Đã gửi</span>
                      <CheckCheck className="w-3 h-3 text-cyan-400" />
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* PREVIEW ATTACHMENT BEFORE SEND */}
        {pendingImage && (
          <div className="relative mb-2 p-2 rounded-2xl bg-[#131E30] border border-cyan-500/40 shrink-0 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src={pendingImage} alt="Pending" className="w-12 h-12 rounded-xl object-cover border" />
              <span className="text-xs text-cyan-300 font-semibold">Sẵn sàng gửi hình ảnh</span>
            </div>
            <button onClick={() => setPendingImage(null)} className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* VOICE RECORDING STATUS BAR */}
        {isRecordingVoice && (
          <div className="mb-2 px-4 py-3 rounded-2xl bg-rose-950/90 border border-rose-500/60 shadow-lg flex items-center justify-between shrink-0 animate-fade-in">
            <div className="flex items-center space-x-3 text-rose-300 text-xs font-bold">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping shrink-0" />
              <div className="flex items-center space-x-2">
                <span className="font-mono text-white text-sm font-black">
                  {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-[11px] text-rose-200/90">Đang thu âm giọng nói...</span>
              </div>
              {/* Dynamic waveform indicator */}
              <div className="hidden sm:flex items-center space-x-0.5 h-4">
                {[12, 24, 36, 20, 32, 16, 28, 40, 24, 16].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-rose-400 rounded-full animate-pulse"
                    style={{
                      height: `${h}px`,
                      animationDelay: `${i * 120}ms`,
                      animationDuration: '600ms',
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={cancelVoiceRecording}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={stopVoiceRecording}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-110 text-white font-extrabold text-xs shadow-md transition active:scale-95 flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi Thoại</span>
              </button>
            </div>
          </div>
        )}

        {/* ATTACHMENT POPUP MENU */}
        {showAttachmentMenu && (
          <div className="mb-2 p-2 rounded-2xl bg-[#131E30] border border-slate-700 shadow-xl flex items-center space-x-3 shrink-0">
            <button
              onClick={() => fileInputImageRef.current?.click()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1A2942] text-xs font-semibold text-cyan-300 transition"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Gửi Ảnh</span>
            </button>
            <button
              onClick={() => fileInputCameraRef.current?.click()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1A2942] text-xs font-semibold text-cyan-300 transition"
            >
              <Camera className="w-4 h-4" />
              <span>Chụp Ảnh</span>
            </button>
            <button
              onClick={() => {
                setShowAttachmentMenu(false);
                startVoiceRecording();
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1A2942] text-xs font-semibold text-cyan-300 transition"
            >
              <Mic className="w-4 h-4" />
              <span>Ghi Âm Thoại</span>
            </button>
          </div>
        )}

        {/* Hidden inputs for camera and gallery */}
        <input
          ref={fileInputImageRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileChange}
        />
        <input
          ref={fileInputCameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleImageFileChange}
        />

        {/* MESSENGER BOTTOM INPUT BAR */}
        <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-800 shrink-0 flex items-center space-x-2">
          {/* Plus button for attachment menu */}
          <button
            type="button"
            onClick={() => setShowAttachmentMenu((p) => !p)}
            className={`p-2.5 rounded-2xl transition shrink-0 ${
              showAttachmentMenu
                ? 'bg-[#00E5FF] text-black'
                : 'bg-[#131E30] hover:bg-[#1A2840] text-cyan-400'
            }`}
            title="Đính kèm tệp, ảnh, camera"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Quick Mic recording button */}
          <button
            type="button"
            onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
            className={`p-2.5 rounded-2xl transition shrink-0 ${
              isRecordingVoice
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-[#131E30] hover:bg-[#1A2840] text-slate-300'
            }`}
            title="Ghi âm giọng nói"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 py-2.5 px-4 rounded-2xl bg-[#0F172A] border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:border-[#00E5FF] transition outline-none"
          />

          {/* Send Button or Thumbs-up if empty */}
          {messageInput.trim() || pendingImage ? (
            <button
              type="submit"
              className="p-2.5 rounded-2xl bg-[#00E5FF] hover:brightness-110 text-black font-bold transition shadow-md shadow-cyan-500/20 shrink-0"
              title="Gửi tin nhắn"
            >
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSendThumbsUp}
              className="p-2.5 rounded-2xl bg-[#131E30] hover:bg-[#1A2840] text-cyan-400 transition shrink-0"
              title="Gửi nút Thích (Like)"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* MODAL: CONTACT DETAILS INFO */}
        {showContactInfoModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-3xl bg-[#0B1528] border border-slate-700 p-5 shadow-2xl text-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="font-extrabold text-sm text-white">Hồ sơ Campus Messenger</h4>
                <button
                  onClick={() => setShowContactInfoModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center py-4">
                <div
                  className={`w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-tr ${activeContact.avatarBg} flex items-center justify-center text-white font-black text-2xl shadow-lg`}
                >
                  {activeContact.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-extrabold text-base text-white">{activeContact.name}</h3>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${
                    activeContact.role === 'CLIENT'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {activeContact.roleLabel}
                </span>
                <p className="text-xs text-slate-400 mt-1">{activeContact.school}</p>
                <p className="text-xs text-cyan-300 font-medium mt-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                  {activeContact.specialtyOrNeed}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Trạng thái:</span>
                  <span className="text-emerald-400 font-bold">{activeContact.lastActiveText}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Bảo chứng GigMe:</span>
                  <span className="text-cyan-400 font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Đã định danh sinh viên</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowContactInfoModal(false);
                  startVoipCall(activeContact.name, activeContact.roleLabel);
                }}
                className="w-full mt-4 py-2.5 rounded-2xl bg-[#00E5FF] hover:brightness-110 text-black font-extrabold text-xs flex items-center justify-center space-x-2 transition"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Gọi Thoại Miễn Phí</span>
              </button>
            </div>
          </div>
        )}

        {/* IMAGE ZOOM LIGHTBOX */}
        {previewZoomImage && (
          <div
            onClick={() => setPreviewZoomImage(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          >
            <div className="relative max-w-3xl max-h-[85vh]">
              <img src={previewZoomImage} alt="Zoom" className="max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
              <button
                onClick={() => setPreviewZoomImage(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 3: MAIN INBOX LIST (MESSENGER FOR CAMPUS)
  // ==========================================
  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3 flex flex-col h-[calc(100vh-4.5rem)] pb-24 text-slate-900">
      {/* MESSENGER TOP BAR */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-black font-extrabold text-xs shadow-md">
              {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#081022]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center space-x-1.5">
              <span>Đoạn chat</span>
              <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-[#00E5FF] text-[10px] font-bold">
                {campusContacts.length}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Kết nối trực tiếp giữa người thuê & thợ sinh viên</p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNewChatModal(true)}
            className="p-2 rounded-xl bg-[#131E30] hover:bg-[#1A2840] text-cyan-400 transition"
            title="Nhắn tin với sinh viên mới"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
          >
            &larr; Khám phá
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative my-2.5 shrink-0">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm người thuê, người làm, trường ĐH..."
          className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-[#0F172A] border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:border-[#00E5FF] transition outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ACTIVE NOW (STORIES / AVATAR BUBBLE ROW - LIKE MESSENGER) */}
      <div className="shrink-0 py-1 border-b border-slate-800/80">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
          Đang hoạt động trên Campus ({campusContacts.filter((c) => c.isOnline).length})
        </p>
        <div className="flex items-center gap-3 overflow-x-auto pb-1.5 no-scrollbar">
          {/* AI Story */}
          <div
            onClick={() => setActiveConversationId('AI_ASSISTANT')}
            className="flex flex-col items-center space-y-1 cursor-pointer shrink-0 group"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#00E5FF] to-blue-500 group-hover:scale-105 transition">
                <div className="w-full h-full rounded-full bg-[#0F172A] flex items-center justify-center text-cyan-300">
                  <Bot className="w-5 h-5" />
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#081022]" />
            </div>
            <span className="text-[10px] text-slate-300 font-bold max-w-[60px] truncate text-center">
              Trợ lý AI
            </span>
          </div>

          {/* Real Contacts Stories */}
          {campusContacts
            .filter((c) => c.isOnline)
            .map((contact) => (
              <div
                key={contact.id}
                onClick={() => setActiveConversationId(contact.id)}
                className="flex flex-col items-center space-y-1 cursor-pointer shrink-0 group"
              >
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr ${contact.avatarBg} group-hover:scale-105 transition`}
                  >
                    <div className="w-full h-full rounded-full bg-[#0F172A] flex items-center justify-center text-white font-extrabold text-sm">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#081022]" />
                </div>
                <span className="text-[10px] text-slate-300 font-medium max-w-[64px] truncate text-center">
                  {contact.name}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center space-x-1.5 py-2.5 shrink-0 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveFilterTab('ALL')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeFilterTab === 'ALL'
              ? 'bg-[#00E5FF] text-black shadow-md shadow-cyan-500/20'
              : 'bg-[#131E30] text-slate-300 hover:bg-[#1A2840]'
          }`}
        >
          Tất cả ({campusContacts.length + 1})
        </button>
        <button
          onClick={() => setActiveFilterTab('CLIENTS')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeFilterTab === 'CLIENTS'
              ? 'bg-[#00E5FF] text-black shadow-md shadow-cyan-500/20'
              : 'bg-[#131E30] text-slate-300 hover:bg-[#1A2840]'
          }`}
        >
          💼 Người thuê ({campusContacts.filter((c) => c.role === 'CLIENT').length})
        </button>
        <button
          onClick={() => setActiveFilterTab('WORKERS')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeFilterTab === 'WORKERS'
              ? 'bg-[#00E5FF] text-black shadow-md shadow-cyan-500/20'
              : 'bg-[#131E30] text-slate-300 hover:bg-[#1A2840]'
          }`}
        >
          ⚡ Người làm ({campusContacts.filter((c) => c.role === 'WORKER').length})
        </button>
        <button
          onClick={() => setActiveConversationId('AI_ASSISTANT')}
          className="px-3 py-1 rounded-xl text-xs font-bold bg-cyan-500/10 text-[#00E5FF] border border-cyan-500/30 hover:bg-cyan-500/20 transition flex items-center space-x-1 whitespace-nowrap shrink-0"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Trợ lý AI 24/7</span>
        </button>
      </div>

      {/* CONVERSATION THREADS LIST */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 pt-1">
        {/* PINNED: 24/7 AI CAMPUS ASSISTANT */}
        {(activeFilterTab === 'ALL' || activeFilterTab === 'AI') && (
          <div
            onClick={() => setActiveConversationId('AI_ASSISTANT')}
            className="p-3 rounded-2xl bg-gradient-to-r from-[#0F1D30] to-[#12233B] border border-cyan-500/30 hover:border-cyan-400/60 cursor-pointer transition shadow-sm flex items-center justify-between space-x-3 group"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#00E5FF] to-blue-600 flex items-center justify-center text-black font-extrabold shadow-md">
                  <Bot className="w-5 h-5 text-black" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0F1D30] animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-extrabold text-sm text-white truncate group-hover:text-[#00E5FF] transition">
                    Trợ Lý AI GigMe 24/7
                  </h4>
                  <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-[#00E5FF] font-bold text-[9px] shrink-0">
                    Official AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">
                  Hỏi đáp Smart Escrow, giải ngân Napas 247, quy chế campus...
                </p>
              </div>
            </div>
            <span className="text-[10px] text-cyan-400 font-bold shrink-0">Trực tuyến</span>
          </div>
        )}

        {/* CONTACTS THREADS (HIRERS & WORKERS) */}
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <MessageCircle className="w-9 h-9 mx-auto mb-2 text-slate-600" />
            <p className="font-bold text-slate-400">Không tìm thấy liên hệ phù hợp.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Bấm nút (+) ở góc trên để tìm kiếm và nhắn tin với sinh viên khác!
            </p>
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const lastMsg = getLastMessageForContact(contact.id, contact.associatedGig?.id);
            const previewText = lastMsg
              ? lastMsg.message || (lastMsg.attachmentType === 'IMAGE' ? '📷 Hình ảnh' : '🎙️ Tin nhắn thoại')
              : contact.specialtyOrNeed;
            const timeText = lastMsg
              ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : contact.isOnline
              ? 'Vừa xong'
              : '';

            return (
              <div
                key={contact.id}
                onClick={() => setActiveConversationId(contact.id)}
                className="p-3 rounded-2xl bg-[#0F172A] border border-slate-800/80 hover:border-slate-700 hover:bg-[#131E30] cursor-pointer transition shadow-sm flex items-center justify-between space-x-3 group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-11 h-11 rounded-full bg-gradient-to-tr ${contact.avatarBg} flex items-center justify-center text-white font-extrabold text-sm shadow`}
                    >
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    {contact.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0F172A]" />
                    )}
                  </div>

                  {/* Contact Info & Message Preview */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-extrabold text-sm text-white truncate group-hover:text-[#00E5FF] transition">
                        {contact.name}
                      </h4>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                          contact.role === 'CLIENT'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {contact.roleLabel}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{previewText}</p>

                    {/* Subtle micro-tag if there is a shared gig */}
                    {contact.associatedGig && (
                      <p className="text-[10px] text-cyan-400/80 font-medium truncate mt-0.5">
                        💼 {contact.associatedGig.title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Metadata */}
                <div className="text-right shrink-0 flex flex-col items-end space-y-1">
                  <span className="text-[10px] text-slate-500 font-medium">{timeText}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{contact.school}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: START NEW CHAT WITH ANY STUDENT */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#0B1528] border border-slate-700 p-5 shadow-2xl text-slate-200 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <h4 className="font-extrabold text-sm text-white flex items-center space-x-1.5">
                <MessageCircle className="w-4 h-4 text-[#00E5FF]" />
                <span>Soạn tin nhắn mới</span>
              </h4>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 my-2 shrink-0">
              Chọn người thuê hoặc người làm để bắt đầu cuộc trò chuyện trực tiếp:
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {campusContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => {
                    setShowNewChatModal(false);
                    setActiveConversationId(contact.id);
                  }}
                  className="p-3 rounded-2xl bg-[#0F172A] hover:bg-[#131E30] border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-full bg-gradient-to-tr ${contact.avatarBg} flex items-center justify-center text-white font-extrabold text-xs shadow`}
                    >
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h5 className="font-bold text-xs text-white">{contact.name}</h5>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            contact.role === 'CLIENT'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {contact.roleLabel}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">{contact.school}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
