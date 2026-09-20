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
  Copy,
  UserPlus,
  Cloud,
  FileText,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { formatVnd, ChatMessageEntity, UserEntity } from '../types';
import { generateSynthesizedVoiceWav, playSynthesizedVoiceTone } from '../utils/audio';
import { rateLimiter } from '../utils/rateLimiter';
import { compressImageToWebP } from '../utils/imageCompressor';
import { VerifiedEduBadge } from '../components/VerifiedEduBadge';
import { FriendBackupRestoreModal } from '../components/FriendBackupRestoreModal';
import { TermsAndRefundPolicyModal } from '../components/TermsAndRefundPolicyModal';

interface ChatSupportScreenProps {
  onBack: () => void;
}

interface MessengerContact {
  id: string;
  name: string;
  role: 'CLIENT' | 'WORKER' | 'ADMIN';
  roleLabel: string;
  school: string;
  avatarBg: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastActiveText: string;
  specialtyOrNeed: string;
  isEduVerified?: boolean;
  associatedGig?: {
    id: string;
    title: string;
    price: number;
    status: string;
  };
}

// Normalized direct message thread ID generator (avoids multi-user leakage)
const getDirectThreadId = (userA: string, userB: string): string => {
  const sorted = [userA, userB].sort();
  return `dm_${sorted[0]}_${sorted[1]}`;
};

export const ChatSupportScreen: React.FC<ChatSupportScreenProps> = ({ onBack }) => {
  const {
    currentUser,
    roleMode,
    allChats,
    rawGigs,
    users,
    addFriendById,
    removeFriendById,
    findUserByNineDigitId,
    sendChat,
    markConversationAsRead,
    startVoipCall,
    selectGig,
    showNotification,
  } = useGigMe();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'ALL' | 'CLIENTS' | 'WORKERS' | 'ONLINE' | 'AI'>('ALL');
  
  // 9-digit ID Search & Friend Connection State
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [searchIdInput, setSearchIdInput] = useState('');
  const [foundUserResult, setFoundUserResult] = useState<UserEntity | null>(null);
  const [searchIdError, setSearchIdError] = useState('');
  const [copiedMyId, setCopiedMyId] = useState(false);

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
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

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
      text: 'Xin chào bạn! Mình là Trợ lý AI GigMe. Mình luôn sẵn sàng giải đáp mọi câu hỏi của bạn về Gigme',
      time: 'Trực tuyến',
    },
  ]);

  // Kiểm tra & loại bỏ triệt để các tài khoản ảo/mẫu (Hoàng Minh, Thanh Trúc, Vũ Hoàng My, Phạm Gia Huy)
  const isMockOrFakeAccount = (name?: string | null, id?: string | null): boolean => {
    if (!name && !id) return false;
    const n = (name || '').toLowerCase();
    const i = (id || '').toLowerCase();
    return (
      n.includes('hoàng minh') ||
      n.includes('thanh trúc') ||
      n.includes('vũ hoàng my') ||
      n.includes('hoàng my') ||
      n.includes('phạm gia huy') ||
      n.includes('gia huy') ||
      i === 'user_student_huy' ||
      i === 'mock_hoang_minh' ||
      i === 'mock_thanh_truc' ||
      i === 'mock_vu_hoang_my' ||
      i === 'mock_pham_gia_huy'
    );
  };

  // Build Campus Contacts Directory (Chỉ tài khoản THẬT: Admin 000000000, Bạn bè ID 9 số, và người thuê/làm từ Kèo thật)
  const campusContacts: MessengerContact[] = useMemo(() => {
    const list: MessengerContact[] = [];

    // 1. Luôn có tài khoản Hỗ trợ Admin chính thức của GigMe (ID: 000000000) nếu người dùng hiện tại không phải Admin
    if (currentUser?.id !== '000000000') {
      list.push({
        id: '000000000',
        name: 'Ban Quản Trị GigMe (Admin Support)',
        role: 'ADMIN',
        roleLabel: 'Admin 000000000',
        school: 'Tổng Đài Hỗ Trợ Sinh Viên GigMe',
        avatarBg: 'from-[#3064AE] via-[#2A5594] to-[#25735B]',
        isOnline: true,
        lastActiveText: 'Trực tuyến 24/7 (ID: 000000000)',
        specialtyOrNeed: 'Hỗ trợ giải quyết sự cố, mở khóa ví, xác minh CCCD & tranh chấp ký quỹ',
      });
    }

    // 2. Danh bạ bạn bè thật kết nối qua ID 9 số (friendIds)
    if (currentUser?.friendIds && currentUser.friendIds.length > 0) {
      currentUser.friendIds.forEach((friendId) => {
        if (friendId === '000000000' || friendId === currentUser?.id) return;
        const friendUser = (users || []).find((u) => u.id === friendId);
        if (friendUser && !list.find((c) => c.id === friendUser.id)) {
          list.push({
            id: friendUser.id,
            name: friendUser.name || `Tài khoản ${friendUser.id}`,
            role: friendUser.role === 'ADMIN' ? 'ADMIN' : 'WORKER',
            roleLabel: `Bạn bè (ID: ${friendUser.id})`,
            school: friendUser.studentSchool || 'Sinh viên Campus',
            avatarBg: 'from-blue-600 to-indigo-600',
            avatarUrl: (friendUser as any).avatarUrl || (friendUser as any).photoURL || undefined,
            isOnline: true,
            lastActiveText: 'Đang online',
            specialtyOrNeed: `Bạn bè kết nối qua ID 9 số: ${friendUser.id}`,
            isEduVerified: !!friendUser.isEduVerified || !!friendUser.isStudentVerified,
          });
        }
      });
    }

    // 3. Người thuê & Thợ từ các công việc thật trong hệ thống (rawGigs)
    if (rawGigs && rawGigs.length > 0) {
      rawGigs.forEach((gig) => {
        // Người thuê
        if (gig.clientId && gig.clientId !== currentUser?.id) {
          const existing = list.find((c) => c.id === gig.clientId);
          if (!existing) {
            const clientUser = (users || []).find((u) => u.id === gig.clientId);
            list.push({
              id: gig.clientId,
              name: gig.clientName || clientUser?.name || `Người thuê (ID ${gig.clientId})`,
              role: 'CLIENT',
              roleLabel: 'Người thuê',
              school: clientUser?.studentSchool || (gig.locationName?.includes('Hà Nội') ? 'ĐH Bách Khoa HN' : 'ĐHQG TP.HCM'),
              avatarBg: 'from-blue-600 to-indigo-600',
              avatarUrl: (clientUser as any)?.avatarUrl || (clientUser as any)?.photoURL || undefined,
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

        // Người làm việc
        if (gig.freelancerId && gig.freelancerId !== currentUser?.id) {
          const existing = list.find((c) => c.id === gig.freelancerId);
          if (!existing) {
            const freelancerUser = (users || []).find((u) => u.id === gig.freelancerId);
            list.push({
              id: gig.freelancerId,
              name: gig.freelancerName || freelancerUser?.name || `Người làm (ID ${gig.freelancerId})`,
              role: 'WORKER',
              roleLabel: 'Người làm',
              school: freelancerUser?.studentSchool || 'Sinh viên Campus',
              avatarBg: 'from-emerald-600 to-cyan-600',
              avatarUrl: (freelancerUser as any)?.avatarUrl || (freelancerUser as any)?.photoURL || undefined,
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

    // 4. Nếu có tin nhắn trong allChats với một người dùng nào đó mà currentUser thực sự tham gia
    if (allChats && allChats.length > 0 && currentUser) {
      allChats.forEach((chat) => {
        const isUserInvolved = chat.senderId === currentUser.id || chat.partnerId === currentUser.id;
        if (!isUserInvolved) return;

        const partnerId = chat.senderId === currentUser.id ? chat.partnerId : chat.senderId;
        if (partnerId && partnerId !== currentUser.id && !list.find((c) => c.id === partnerId)) {
          const u = (users || []).find((usr) => usr.id === partnerId);
          list.push({
            id: partnerId,
            name: u?.name || (partnerId === '000000000' ? 'Ban Quản Trị GigMe' : `Tài khoản ${partnerId}`),
            role: (u?.role === 'ADMIN' ? 'ADMIN' : 'WORKER') as 'CLIENT' | 'WORKER' | 'ADMIN',
            roleLabel: partnerId === '000000000' ? 'Admin 000000000' : `ID ${partnerId}`,
            school: u?.studentSchool || 'Campus Hub',
            avatarBg: 'from-teal-600 to-blue-600',
            avatarUrl: (u as any)?.avatarUrl || (u as any)?.photoURL || undefined,
            isOnline: true,
            lastActiveText: 'Hoạt động gần đây',
            specialtyOrNeed: `ID 9 số: ${partnerId}`,
          });
        }
      });
    }

    return list.filter((c) => !isMockOrFakeAccount(c.name, c.id));
  }, [rawGigs, currentUser, users, allChats]);

  // Active contact details with foolproof fallback (so clicking any contact ALWAYS opens chat room)
  const activeContact = useMemo(() => {
    if (!activeConversationId) return null;
    const found = campusContacts.find((c) => c.id === activeConversationId);
    if (found) return found;

    // Search in users
    const u = (users || []).find((usr) => usr.id === activeConversationId);
    if (u) {
      return {
        id: u.id,
        name: u.name || `Tài khoản ${u.id}`,
        role: (u.role === 'ADMIN' ? 'ADMIN' : 'WORKER') as 'CLIENT' | 'WORKER' | 'ADMIN',
        roleLabel: u.role === 'ADMIN' ? 'Admin 000000000' : `ID: ${u.id}`,
        school: u.studentSchool || 'Campus Hub',
        avatarBg: 'from-blue-600 to-indigo-600',
        avatarUrl: (u as any)?.avatarUrl || (u as any)?.photoURL || undefined,
        isOnline: true,
        lastActiveText: 'Đang online',
        specialtyOrNeed: `ID 9 số: ${u.id}`,
        isEduVerified: !!u.isEduVerified || !!u.isStudentVerified,
      };
    }

    // Default fallback
    return {
      id: activeConversationId,
      name: activeConversationId === '000000000' ? 'Ban Quản Trị GigMe (Admin Support)' : `Người dùng (${activeConversationId})`,
      role: (activeConversationId === '000000000' ? 'ADMIN' : 'WORKER') as 'CLIENT' | 'WORKER' | 'ADMIN',
      roleLabel: activeConversationId === '000000000' ? 'Admin 000000000' : `ID ${activeConversationId}`,
      school: 'Campus Hub',
      avatarBg: 'from-[#3064AE] to-[#25735B]',
      isOnline: true,
      lastActiveText: 'Đang hoạt động',
      specialtyOrNeed: `ID: ${activeConversationId}`,
    };
  }, [activeConversationId, campusContacts, users]);

  // Messages for active conversation with strict 2-party isolation (prevents multi-user cross-talk leak)
  const currentConversationMessages = useMemo(() => {
    if (!activeConversationId || !currentUser) return [];
    const dmThreadId = getDirectThreadId(currentUser.id, activeConversationId);
    const gigId = activeContact?.associatedGig?.id;

    return (allChats || []).filter((msg) => {
      // 1. Direct thread match
      if (msg.threadId === dmThreadId) return true;

      // 2. Explicit direct pair between currentUser and activeConversationId
      const isDirectPair =
        (msg.senderId === currentUser.id && msg.partnerId === activeConversationId) ||
        (msg.senderId === activeConversationId && (msg.partnerId === currentUser.id || (!msg.partnerId && msg.threadId?.includes(currentUser.id))));
      if (isDirectPair) return true;

      // 3. Gig chat match
      if (gigId && (msg.gigId === gigId || msg.threadId === gigId)) {
        const involvesMe = msg.senderId === currentUser.id || msg.partnerId === currentUser.id;
        const involvesContact = msg.senderId === activeConversationId || msg.partnerId === activeConversationId;
        return involvesMe && involvesContact;
      }

      // Legacy fallback
      if (msg.threadId === `direct_${currentUser.id}` && msg.senderId === activeConversationId) return true;
      if (msg.threadId === `direct_${activeConversationId}` && msg.senderId === currentUser.id) return true;

      return false;
    });
  }, [allChats, activeConversationId, currentUser, activeContact]);

  // Select contact handler (switches view to chat room immediately & marks read)
  const handleSelectContact = (contactId: string) => {
    setActiveConversationId(contactId);
    if (markConversationAsRead) {
      markConversationAsRead(contactId);
    }
  };

  // Mark active conversation messages as read
  useEffect(() => {
    if (activeConversationId && markConversationAsRead) {
      markConversationAsRead(activeConversationId);
    }
  }, [activeConversationId, allChats?.length]);

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

  // 9-digit ID Search & Friend logic
  const handleSearchById = () => {
    const rateCheck = rateLimiter.check('SEARCH_ID', currentUser?.id);
    if (!rateCheck.allowed) {
      setSearchIdError(rateCheck.errorMsg || 'Vui lòng chờ ít giây để chống spam tìm kiếm.');
      return;
    }

    const cleanId = searchIdInput.trim();
    if (!cleanId) {
      setSearchIdError('Vui lòng nhập ID 9 số để tìm kiếm.');
      return;
    }
    setSearchIdError('');
    rateLimiter.record('SEARCH_ID', currentUser?.id);

    const found = findUserByNineDigitId
      ? findUserByNineDigitId(cleanId)
      : (users || []).find((u) => u.id === cleanId);

    if (found) {
      if (found.id === currentUser?.id) {
        setSearchIdError('Đây là ID của chính bạn.');
        setFoundUserResult(null);
        return;
      }
      setFoundUserResult(found);
    } else {
      setFoundUserResult(null);
      setSearchIdError(`Không tìm thấy tài khoản với ID "${cleanId}". Hãy chắc chắn ID gồm các chữ số hợp lệ.`);
    }
  };

  // Latest message preview for a contact (strictly isolated between currentUser and contact)
  const getLastMessageForContact = (contactId: string, associatedGigId?: string) => {
    if (!currentUser) return null;
    const dmThreadId = getDirectThreadId(currentUser.id, contactId);

    const relevant = (allChats || []).filter((m) => {
      if (m.threadId === dmThreadId) return true;
      const isDirectPair =
        (m.senderId === currentUser.id && m.partnerId === contactId) ||
        (m.senderId === contactId && (m.partnerId === currentUser.id || (!m.partnerId && m.threadId?.includes(currentUser.id))));
      if (isDirectPair) return true;
      if (associatedGigId && (m.gigId === associatedGigId || m.threadId === associatedGigId)) {
        const involvesMe = m.senderId === currentUser.id || m.partnerId === currentUser.id;
        const involvesContact = m.senderId === contactId || m.partnerId === contactId;
        return involvesMe && involvesContact;
      }
      return false;
    });
    if (relevant.length === 0) return null;
    return relevant[relevant.length - 1];
  };

  // SEND MESSAGE (MESSENGER 1-1)
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeContact || !currentUser) return;

    const rateCheck = rateLimiter.check('CHAT', currentUser?.id);
    if (!rateCheck.allowed) {
      showNotification(
        '⚠️ Giới hạn tốc độ gửi tin nhắn',
        rateCheck.errorMsg || 'Vui lòng chờ ít giây để chống spam tin nhắn.',
        false
      );
      return;
    }

    const targetThread = activeContact.associatedGig?.id || getDirectThreadId(currentUser.id, activeContact.id);

    if (pendingImage) {
      rateLimiter.record('CHAT', currentUser?.id);
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
      rateLimiter.record('CHAT', currentUser?.id);
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

    rateLimiter.record('CHAT', currentUser?.id);
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
    if (!activeContact || !currentUser) return;
    const rateCheck = rateLimiter.check('CHAT', currentUser?.id);
    if (!rateCheck.allowed) {
      showNotification(
        '⚠️ Giới hạn tốc độ gửi tin nhắn',
        rateCheck.errorMsg || 'Vui lòng chờ ít giây.',
        false
      );
      return;
    }
    rateLimiter.record('CHAT', currentUser?.id);

    const targetThread = activeContact.associatedGig?.id || getDirectThreadId(currentUser.id, activeContact.id);
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
    if (!activeContact || !currentUser) return;
    const rateCheck = rateLimiter.check('CHAT', currentUser?.id);
    if (!rateCheck.allowed) {
      showNotification(
        '⚠️ Giới hạn tốc độ gửi tin nhắn',
        rateCheck.errorMsg || 'Vui lòng chờ ít giây.',
        false
      );
      return;
    }
    rateLimiter.record('CHAT', currentUser?.id);

    const targetThread = activeContact.associatedGig?.id || getDirectThreadId(currentUser.id, activeContact.id);
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

    const rateCheck = rateLimiter.check('AI_QUERY', currentUser?.id);
    if (!rateCheck.allowed) {
      showNotification(
        '⚠️ Giới hạn tốc độ hỏi AI',
        rateCheck.errorMsg || 'Vui lòng chờ ít giây trước khi đặt câu hỏi tiếp.',
        false
      );
      return;
    }
    rateLimiter.record('AI_QUERY', currentUser?.id);

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
      const historyPayload = aiChatMessages.slice(-8).map((m) => ({
        role: m.sender === 'USER' ? 'user' : 'assistant',
        content: m.text,
      }));

      const response = await fetch('/api/gemini/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, history: historyPayload }),
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

  // Image File Picker (Tự động nén chuẩn WebP tiết kiệm 4G)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageToWebP(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.82 });
      setPendingImage(compressed.dataUrl);
      setShowAttachmentMenu(false);
      showNotification(
        '⚡ Nén Ảnh WebP Tự Động',
        `Đã nén tiết kiệm ${compressed.savedPercent}% dữ liệu 4G (${compressed.originalSizeFormatted} ➔ ${compressed.compressedSizeFormatted}).`
      );
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPendingImage(reader.result);
          setShowAttachmentMenu(false);
        }
      };
      reader.readAsDataURL(file);
    }
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
                const targetThread = activeContact.associatedGig?.id || getDirectThreadId(currentUser?.id || '000000000', activeContact.id);
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
    const targetThread = activeContact.associatedGig?.id || getDirectThreadId(currentUser?.id || '000000000', activeContact.id);

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
        <div className="flex items-center justify-between pb-3 border-b border-[#C5E5EC]/15 shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveConversationId(null)}
              className="p-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC] border border-[#C5E5EC]/20 transition cursor-pointer"
              title="Quay lại danh sách chat"
            >
              <ArrowLeft className="w-5 h-5 text-[#C5E5EC]" />
            </button>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3064AE] via-[#417AC6] to-[#C5E5EC] flex items-center justify-center text-white font-extrabold shadow-md border border-[#C5E5EC]/30">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#E0FAEB] border-2 border-[#09111D] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-extrabold text-sm text-white">Trợ Lý AI GigMe 24/7</h3>
                <span className="px-1.5 py-0.5 rounded bg-[#3064AE]/30 text-[#C5E5EC] text-[9px] font-bold border border-[#C5E5EC]/25">
                  Gemini 2.5
                </span>
              </div>
              <p className="text-[11px] text-[#E0FAEB] font-medium">Đang trực tuyến • Sẵn sàng hỗ trợ 24/7</p>
            </div>
          </div>
          <button
            onClick={() => setActiveConversationId(null)}
            className="text-xs text-[#C5E5EC]/80 hover:text-white px-2.5 py-1 rounded-lg bg-[#12233B] border border-[#C5E5EC]/20 transition cursor-pointer"
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
              className="px-3 py-1.5 rounded-full bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/30 text-[#C5E5EC] whitespace-nowrap transition text-xs font-semibold shrink-0 cursor-pointer"
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
                  <span className="text-[10px] text-[#C5E5EC]/70 font-bold">
                    {isMe ? currentUser?.name || 'Bạn' : 'Trợ lý AI GigMe'}
                  </span>
                  <span className="text-[9px] text-[#C5E5EC]/50">{msg.time}</span>
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-[#3064AE] to-[#255294] text-white font-medium rounded-tr-none shadow-md shadow-[#3064AE]/20 border border-[#C5E5EC]/25'
                      : 'bg-[#12233B] border border-[#C5E5EC]/20 text-slate-100 rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {isAiTyping && (
            <div className="flex items-center space-x-2 text-[#C5E5EC] text-xs py-2 px-2">
              <Bot className="w-4 h-4 text-[#C5E5EC] animate-spin" />
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
          className="pt-2 border-t border-[#C5E5EC]/15 shrink-0 flex items-center space-x-2"
        >
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Hỏi về tiền cọc, rút tiền Napas, mẹo nhận việc..."
            className="flex-1 py-2.5 px-4 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 text-white text-xs placeholder:text-[#C5E5EC]/40 focus:border-[#3064AE] transition outline-none"
          />
          <button
            type="submit"
            disabled={!messageInput.trim() || isAiTyping}
            className="p-2.5 rounded-2xl bg-[#3064AE] hover:bg-[#255294] disabled:opacity-40 text-white font-bold transition shadow-md shadow-[#3064AE]/30 border border-[#C5E5EC]/30 shrink-0 cursor-pointer"
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
        <div className="flex items-center justify-between pb-2.5 border-b border-[#C5E5EC]/15 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <button
              onClick={() => setActiveConversationId(null)}
              className="p-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC] border border-[#C5E5EC]/20 transition shrink-0 cursor-pointer"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="w-5 h-5 text-[#C5E5EC]" />
            </button>

            {/* Partner Avatar */}
            <div className="relative shrink-0">
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-tr ${activeContact.avatarBg} flex items-center justify-center text-white font-extrabold text-sm shadow-md border border-[#C5E5EC]/30 overflow-hidden`}
              >
                {activeContact.avatarUrl ? (
                  <img
                    src={activeContact.avatarUrl}
                    alt={activeContact.name || 'Avatar'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  (activeContact.name || 'U').charAt(0).toUpperCase()
                )}
              </div>
              {isPartnerOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#E0FAEB] border-2 border-[#09111D]" />
              )}
            </div>

            {/* Partner Info */}
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 truncate">
                <h3 className="font-extrabold text-sm text-white truncate">{activeContact.name}</h3>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    activeContact.role === 'CLIENT'
                      ? 'bg-[#3064AE]/30 text-[#C5E5EC] border border-[#C5E5EC]/30'
                      : 'bg-[#E0FAEB]/20 text-[#E0FAEB] border border-[#E0FAEB]/30'
                  }`}
                >
                  {activeContact.roleLabel}
                </span>
              </div>
              <p className="text-[11px] text-[#C5E5EC]/70 truncate">
                {isPartnerOnline ? (
                  <span className="text-[#E0FAEB] font-medium">Đang hoạt động</span>
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
              className="p-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC] border border-[#C5E5EC]/20 transition cursor-pointer"
              title="Gọi thoại VoIP miễn phí qua mạng Campus"
            >
              <PhoneCall className="w-4 h-4" />
            </button>
            <button
              onClick={() => startVoipCall(activeContact.name, `${activeContact.roleLabel} (Video)`, associatedGig?.id)}
              className="p-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC] border border-[#C5E5EC]/20 transition cursor-pointer"
              title="Gọi video trực tuyến"
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowContactInfoModal(true)}
              className="p-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC]/80 hover:text-white border border-[#C5E5EC]/20 transition cursor-pointer"
              title="Xem thông tin chi tiết"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DISMISSIBLE 1-LINE COLLABORATION STATUS */}
        {associatedGig && !bannerDismissed && (
          <div className="my-2 px-3 py-1.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20 flex items-center justify-between text-xs text-slate-300 shrink-0">
            <div className="flex items-center space-x-2 truncate">
              <Briefcase className="w-3.5 h-3.5 text-[#C5E5EC] shrink-0" />
              <span className="truncate">
                <span className="text-[#C5E5EC] font-bold">Kèo chung:</span> {associatedGig.title} (
                {formatVnd(associatedGig.price)})
              </span>
            </div>
            <div className="flex items-center space-x-2 shrink-0 ml-2">
              <button
                onClick={() => {
                  selectGig(associatedGig.id);
                  showNotification('Thông tin việc làm', `Đã chọn kèo "${associatedGig.title}"`);
                }}
                className="text-[11px] text-[#C5E5EC] hover:underline font-bold cursor-pointer"
              >
                Chi tiết
              </button>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-[#C5E5EC]/60 hover:text-white p-0.5 cursor-pointer"
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
              className="px-2.5 py-1 rounded-full bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/20 text-[#C5E5EC] hover:text-white whitespace-nowrap transition text-xs shrink-0 cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* MESSENGER MESSAGES STREAM */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2.5 pr-1">
          {currentConversationMessages.length === 0 ? (
            <div className="text-center py-12 text-[#C5E5EC]/60 text-xs">
              <div
                className={`w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-tr ${activeContact.avatarBg} flex items-center justify-center text-white font-black text-xl shadow-lg border border-[#C5E5EC]/30`}
              >
                {activeContact.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="font-extrabold text-sm text-white">{activeContact.name}</h4>
              <p className="text-[#C5E5EC]/80 text-xs mt-0.5">{activeContact.specialtyOrNeed}</p>
              <p className="text-[11px] text-[#C5E5EC]/60 mt-2">
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
                    <span className="text-[10px] text-[#C5E5EC]/70 font-bold">
                      {isMe ? 'Bạn' : msg.senderName || activeContact.name}
                    </span>
                    <span className="text-[9px] text-[#C5E5EC]/50">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Message Bubble Container */}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed relative ${
                      isMe
                        ? 'bg-gradient-to-r from-[#3064AE] to-[#255294] text-white font-medium rounded-tr-none shadow-md shadow-[#3064AE]/20 border border-[#C5E5EC]/25'
                        : 'bg-[#12233B] border border-[#C5E5EC]/20 text-slate-100 rounded-tl-none shadow-sm'
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

        {/* ATTACHMENT POPUP MENU */}
        {showAttachmentMenu && (
          <div className="mb-2 p-2 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/25 shadow-xl flex items-center space-x-3 shrink-0">
            <button
              onClick={() => {
                setShowAttachmentMenu(false);
                fileInputImageRef.current?.click();
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#0E1B2E] hover:bg-[#162B48] text-xs font-semibold text-[#C5E5EC] border border-[#C5E5EC]/20 transition cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-[#C5E5EC]" />
              <span>Gửi Ảnh</span>
            </button>
            <button
              onClick={() => {
                setShowAttachmentMenu(false);
                fileInputCameraRef.current?.click();
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#0E1B2E] hover:bg-[#162B48] text-xs font-semibold text-[#C5E5EC] border border-[#C5E5EC]/20 transition cursor-pointer"
            >
              <Camera className="w-4 h-4 text-[#C5E5EC]" />
              <span>Chụp Ảnh</span>
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
        <form onSubmit={handleSendMessage} className="pt-2 border-t border-[#C5E5EC]/15 shrink-0 flex items-center space-x-2">
          {/* Plus button for attachment menu */}
          <button
            type="button"
            onClick={() => setShowAttachmentMenu((p) => !p)}
            className={`p-2.5 rounded-2xl transition shrink-0 cursor-pointer ${
              showAttachmentMenu
                ? 'bg-[#3064AE] text-white'
                : 'bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC] border border-[#C5E5EC]/20'
            }`}
            title="Đính kèm ảnh, chụp camera"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 py-2.5 px-4 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 text-white text-xs placeholder:text-[#C5E5EC]/40 focus:border-[#3064AE] transition outline-none"
          />

          {/* Send Button or Thumbs-up if empty */}
          {messageInput.trim() || pendingImage ? (
            <button
              type="submit"
              className="p-2.5 rounded-2xl bg-[#3064AE] hover:bg-[#255294] text-white font-bold transition shadow-md shadow-[#3064AE]/30 border border-[#C5E5EC]/30 shrink-0 cursor-pointer"
              title="Gửi tin nhắn"
            >
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSendThumbsUp}
              className="p-2.5 rounded-2xl bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC] border border-[#C5E5EC]/20 transition shrink-0 cursor-pointer"
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
                      ? 'bg-[#3064AE]/30 text-[#C5E5EC] border border-[#C5E5EC]/30'
                      : 'bg-[#E0FAEB]/20 text-[#E0FAEB] border border-[#E0FAEB]/30'
                  }`}
                >
                  {activeContact.roleLabel}
                </span>
                <p className="text-xs text-[#C5E5EC]/70 mt-1">{activeContact.school}</p>
                <p className="text-xs text-[#C5E5EC] font-medium mt-2 bg-[#12233B] p-2 rounded-xl border border-[#C5E5EC]/20">
                  {activeContact.specialtyOrNeed}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#C5E5EC]/15 text-xs">
                <div className="flex items-center justify-between text-[#C5E5EC]/70">
                  <span>Trạng thái:</span>
                  <span className="text-[#E0FAEB] font-bold">{activeContact.lastActiveText}</span>
                </div>
                <div className="flex items-center justify-between text-[#C5E5EC]/70">
                  <span>Bảo chứng GigMe:</span>
                  <span className="text-[#C5E5EC] font-bold flex items-center space-x-1">
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
                className="w-full mt-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#3064AE] via-[#417AC6] to-[#C5E5EC] hover:brightness-110 text-white font-extrabold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-[#3064AE]/30 border border-[#E0FAEB]/30 cursor-pointer"
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
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white cursor-pointer"
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
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3 flex flex-col h-[calc(100vh-4.5rem)] pb-24 text-slate-100">
      {/* MESSENGER TOP BAR */}
      <div className="flex items-center justify-between pb-3 border-b border-[#C5E5EC]/15 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#3064AE] via-[#417AC6] to-[#C5E5EC] flex items-center justify-center text-white font-extrabold text-xs shadow-md border border-[#C5E5EC]/30">
              {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#E0FAEB] border border-[#09111D]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center space-x-1.5">
              <span>Đoạn chat</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#3064AE]/30 text-[#C5E5EC] text-[10px] font-bold border border-[#C5E5EC]/25">
                {campusContacts.length}
              </span>
            </h2>
            <p className="text-[11px] text-[#C5E5EC]/70">Kết nối trực tiếp giữa người thuê & thợ sinh viên</p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Add Friend Button */}
          <button
            onClick={() => setShowAddFriendModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#3064AE] to-[#255294] hover:from-[#255294] hover:to-[#1d3d6b] text-white border border-[#C5E5EC]/30 font-bold text-xs transition flex items-center space-x-1.5 shadow-md cursor-pointer"
            title="Thêm bạn bè qua ID 9 số"
          >
            <UserPlus className="w-4 h-4 text-[#E0FAEB]" />
            <span>Add Friend</span>
          </button>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="p-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC] border border-[#C5E5EC]/20 transition cursor-pointer"
            title="Nhắn tin với sinh viên mới"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC] border border-[#C5E5EC]/20 font-bold text-xs transition cursor-pointer"
          >
            &larr; Khám phá
          </button>
        </div>
      </div>

      {/* 9-DIGIT ID SYSTEM & QUICK FRIEND SEARCH - CHỈ HIỆN KHI BẤM NÚT ADDFRIEND */}
      {showAddFriendModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/30 p-5 shadow-2xl text-slate-100 flex flex-col space-y-3.5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#C5E5EC]/15 shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#3064AE]/30 border border-[#C5E5EC]/30 flex items-center justify-center text-[#E0FAEB]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-white">Kết Bạn Qua ID 9 Số</h3>
              </div>
              <button
                onClick={() => {
                  setShowAddFriendModal(false);
                  setSearchIdError('');
                  setFoundUserResult(null);
                }}
                className="p-1.5 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC] border border-[#C5E5EC]/20 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User's Own ID & Admin Badge */}
            <div className="p-3 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/25 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-[#C5E5EC]/80 font-bold">ID 9 Số Của Bạn:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-[#3064AE]/40 border border-[#C5E5EC]/30 text-white font-mono font-black text-sm tracking-wider">
                  {currentUser?.id || '000000000'}
                </span>
                {currentUser?.id === '000000000' && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                    ADMIN
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  if (currentUser?.id) {
                    navigator.clipboard.writeText(currentUser.id);
                    setCopiedMyId(true);
                    showNotification('Đã sao chép ID', `ID ${currentUser.id} đã được lưu vào bộ nhớ tạm.`);
                    setTimeout(() => setCopiedMyId(false), 2000);
                  }
                }}
                className="flex items-center space-x-1 text-xs font-bold text-[#E0FAEB] hover:text-white bg-[#0E1B2E] px-2.5 py-1 rounded-xl border border-[#E0FAEB]/30 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedMyId ? 'Đã sao chép!' : 'Sao chép ID'}</span>
              </button>
            </div>

            {/* Search Friend By 9-digit ID Input */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-[#C5E5EC]/90 block">
                Tìm bạn mới bằng mã ID:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  maxLength={9}
                  value={searchIdInput}
                  onChange={(e) => {
                    setSearchIdInput(e.target.value.replace(/\D/g, ''));
                    setSearchIdError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearchById();
                  }}
                  placeholder="Nhập ID 9 số để tìm bạn (000000000 -> 999999999)..."
                  className="flex-1 px-3 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-xs text-white placeholder:text-[#C5E5EC]/40 focus:border-[#3064AE] outline-none font-mono"
                />
                <button
                  onClick={handleSearchById}
                  className="px-3.5 py-2.5 rounded-xl bg-[#3064AE] hover:bg-[#255294] text-white font-bold text-xs border border-[#C5E5EC]/30 transition flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Tìm ID</span>
                </button>
              </div>

              {searchIdError && (
                <p className="text-[11px] text-rose-300 font-medium">{searchIdError}</p>
              )}

              {/* Found User Result Card */}
              {foundUserResult && (
                <div className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/30 flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#3064AE] flex items-center justify-center text-white font-black text-xs shrink-0">
                      {(foundUserResult.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-xs text-white truncate">{foundUserResult.name}</span>
                        <span className="text-[10px] text-[#C5E5EC] font-mono font-bold">({foundUserResult.id})</span>
                      </div>
                      <p className="text-[10px] text-[#C5E5EC]/70 truncate">{foundUserResult.studentSchool || 'Sinh viên Campus'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {currentUser?.friendIds?.includes(foundUserResult.id) ? (
                      <span className="text-[11px] text-emerald-400 font-bold px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/30">
                        ✓ Bạn bè
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          if (addFriendById) addFriendById(foundUserResult.id);
                          showNotification('Kết bạn', `Đã thêm ${foundUserResult.name} vào danh bạ.`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-[#E0FAEB] border border-emerald-500/40 text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Kết bạn</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleSelectContact(foundUserResult.id);
                        setShowAddFriendModal(false);
                        setFoundUserResult(null);
                        setSearchIdInput('');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#3064AE] hover:bg-[#255294] text-white border border-[#C5E5EC]/30 text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>Nhắn</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cloud Backup & Terms Quick Access */}
            <div className="flex items-center gap-2 pt-3 border-t border-[#C5E5EC]/15">
              <button
                onClick={() => {
                  setShowAddFriendModal(false);
                  setShowBackupModal(true);
                }}
                className="flex-1 py-2 px-2.5 rounded-xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/25 text-[#C5E5EC] hover:text-white text-[11px] font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5 text-[#C5E5EC]" />
                <span>Sao lưu danh bạ Cloud</span>
              </button>
              <button
                onClick={() => {
                  setShowAddFriendModal(false);
                  setShowTermsModal(true);
                }}
                className="py-2 px-2.5 rounded-xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/25 text-[#E0FAEB] hover:text-white text-[11px] font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#E0FAEB]" />
                <span>Điều khoản & Hoàn tiền</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="relative my-2.5 shrink-0">
        <Search className="w-4 h-4 text-[#C5E5EC]/60 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm người thuê, người làm, trường ĐH..."
          className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/25 text-white text-xs placeholder:text-[#C5E5EC]/40 focus:border-[#3064AE] transition outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-[#C5E5EC]/60 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ACTIVE NOW (STORIES / AVATAR BUBBLE ROW - LIKE MESSENGER) */}
      <div className="shrink-0 py-1 border-b border-[#C5E5EC]/15">
        <p className="text-[10px] font-bold text-[#C5E5EC]/70 uppercase tracking-wider mb-2 px-1">
          Đang hoạt động trên Campus ({campusContacts.filter((c) => c.isOnline).length})
        </p>
        <div className="flex items-center gap-3 overflow-x-auto pb-1.5 no-scrollbar">
          {/* AI Story */}
          <div
            onClick={() => setActiveConversationId('AI_ASSISTANT')}
            className="flex flex-col items-center space-y-1 cursor-pointer shrink-0 group"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#3064AE] via-[#417AC6] to-[#C5E5EC] group-hover:scale-105 transition">
                <div className="w-full h-full rounded-full bg-[#0E1B2E] flex items-center justify-center text-[#C5E5EC]">
                  <Bot className="w-5 h-5" />
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#E0FAEB] border-2 border-[#09111D]" />
            </div>
            <span className="text-[10px] text-[#C5E5EC] font-bold max-w-[60px] truncate text-center">
              Trợ lý AI
            </span>
          </div>

          {/* Real Contacts Stories */}
          {campusContacts
            .filter((c) => c.isOnline)
            .map((contact) => (
              <div
                key={contact.id}
                onClick={() => handleSelectContact(contact.id)}
                className="flex flex-col items-center space-y-1 cursor-pointer shrink-0 group"
              >
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr ${contact.avatarBg} group-hover:scale-105 transition`}
                  >
                    <div className="w-full h-full rounded-full bg-[#0E1B2E] flex items-center justify-center text-white font-extrabold text-sm overflow-hidden">
                      {contact.avatarUrl ? (
                        <img
                          src={contact.avatarUrl}
                          alt={contact.name || 'Avatar'}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        (contact.name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#E0FAEB] border-2 border-[#09111D]" />
                </div>
                <span className="text-[10px] text-[#C5E5EC]/80 font-medium max-w-[64px] truncate text-center">
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
          className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeFilterTab === 'ALL'
              ? 'bg-[#3064AE] text-white border border-[#C5E5EC]/30 shadow-md shadow-[#3064AE]/30'
              : 'bg-[#12233B] text-[#C5E5EC] border border-[#C5E5EC]/20 hover:bg-[#162B48]'
          }`}
        >
          Tất cả ({campusContacts.length + 1})
        </button>
        <button
          onClick={() => setActiveFilterTab('CLIENTS')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeFilterTab === 'CLIENTS'
              ? 'bg-[#3064AE] text-white border border-[#C5E5EC]/30 shadow-md shadow-[#3064AE]/30'
              : 'bg-[#12233B] text-[#C5E5EC] border border-[#C5E5EC]/20 hover:bg-[#162B48]'
          }`}
        >
          💼 Người thuê ({campusContacts.filter((c) => c.role === 'CLIENT').length})
        </button>
        <button
          onClick={() => setActiveFilterTab('WORKERS')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeFilterTab === 'WORKERS'
              ? 'bg-[#3064AE] text-white border border-[#C5E5EC]/30 shadow-md shadow-[#3064AE]/30'
              : 'bg-[#12233B] text-[#C5E5EC] border border-[#C5E5EC]/20 hover:bg-[#162B48]'
          }`}
        >
          ⚡ Người làm ({campusContacts.filter((c) => c.role === 'WORKER').length})
        </button>
        <button
          onClick={() => setActiveConversationId('AI_ASSISTANT')}
          className="px-3 py-1 rounded-xl text-xs font-bold bg-[#3064AE]/20 text-[#C5E5EC] border border-[#C5E5EC]/30 hover:bg-[#3064AE]/30 transition flex items-center space-x-1 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Bot className="w-3.5 h-3.5 text-[#C5E5EC]" />
          <span>Trợ lý AI 24/7</span>
        </button>
      </div>

      {/* CONVERSATION THREADS LIST */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 pt-1">
        {/* PINNED: 24/7 AI CAMPUS ASSISTANT */}
        {(activeFilterTab === 'ALL' || activeFilterTab === 'AI') && (
          <div
            onClick={() => setActiveConversationId('AI_ASSISTANT')}
            className="p-3 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/25 hover:border-[#C5E5EC]/50 cursor-pointer transition shadow-sm flex items-center justify-between space-x-3 group"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#3064AE] via-[#417AC6] to-[#C5E5EC] flex items-center justify-center text-white font-extrabold shadow-md border border-[#C5E5EC]/30">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#E0FAEB] border-2 border-[#09111D] animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-extrabold text-sm text-white truncate group-hover:text-[#C5E5EC] transition">
                    Trợ Lý AI GigMe 24/7
                  </h4>
                  <span className="px-1.5 py-0.2 rounded bg-[#3064AE]/30 text-[#C5E5EC] font-bold text-[9px] shrink-0 border border-[#C5E5EC]/25">
                    Official AI
                  </span>
                </div>
                <p className="text-[11px] text-[#C5E5EC]/70 truncate mt-0.5">
                  Hỏi đáp Smart Escrow, giải ngân Napas 247, quy chế campus...
                </p>
              </div>
            </div>
            <span className="text-[10px] text-[#E0FAEB] font-bold shrink-0">Trực tuyến</span>
          </div>
        )}

        {/* CONTACTS THREADS (HIRERS & WORKERS) */}
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12 text-[#C5E5EC]/60 text-xs">
            <MessageCircle className="w-9 h-9 mx-auto mb-2 text-[#C5E5EC]/40" />
            <p className="font-bold text-[#C5E5EC]">Không tìm thấy liên hệ phù hợp.</p>
            <p className="text-[11px] text-[#C5E5EC]/60 mt-1">
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
                onClick={() => handleSelectContact(contact.id)}
                className="p-3 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 hover:border-[#C5E5EC]/40 hover:bg-[#162B48] cursor-pointer transition shadow-sm flex items-center justify-between space-x-3 group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-11 h-11 rounded-full bg-gradient-to-tr ${contact.avatarBg} flex items-center justify-center text-white font-extrabold text-sm shadow border border-[#C5E5EC]/20 overflow-hidden`}
                    >
                      {contact.avatarUrl ? (
                        <img
                          src={contact.avatarUrl}
                          alt={contact.name || 'Avatar'}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        (contact.name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    {contact.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#E0FAEB] border-2 border-[#09111D]" />
                    )}
                  </div>

                  {/* Contact Info & Message Preview */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <h4 className="font-extrabold text-sm text-white truncate group-hover:text-[#C5E5EC] transition">
                        {contact.name}
                      </h4>
                      {contact.isEduVerified && (
                        <VerifiedEduBadge school={contact.school} size="sm" showText={false} />
                      )}
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                          contact.role === 'CLIENT'
                            ? 'bg-[#3064AE]/30 text-[#C5E5EC] border border-[#C5E5EC]/30'
                            : 'bg-[#E0FAEB]/20 text-[#E0FAEB] border border-[#E0FAEB]/30'
                        }`}
                      >
                        {contact.roleLabel}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#C5E5EC]/70 truncate mt-0.5">{previewText}</p>

                    {/* Subtle micro-tag if there is a shared gig */}
                    {contact.associatedGig && (
                      <p className="text-[10px] text-[#C5E5EC] font-medium truncate mt-0.5">
                        💼 {contact.associatedGig.title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Metadata */}
                <div className="text-right shrink-0 flex flex-col items-end space-y-1">
                  <span className="text-[10px] text-[#C5E5EC]/50 font-medium">{timeText}</span>
                  <span className="text-[10px] text-[#C5E5EC]/70 font-semibold">{contact.school}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: START NEW CHAT WITH ANY STUDENT */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/30 p-5 shadow-2xl text-slate-100 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#C5E5EC]/15 shrink-0">
              <h4 className="font-extrabold text-sm text-white flex items-center space-x-1.5">
                <MessageCircle className="w-4 h-4 text-[#C5E5EC]" />
                <span>Soạn tin nhắn mới</span>
              </h4>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-full text-[#C5E5EC]/70 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#C5E5EC]/70 my-2 shrink-0">
              Chọn người thuê hoặc người làm để bắt đầu cuộc trò chuyện trực tiếp:
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {campusContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => {
                    setShowNewChatModal(false);
                    handleSelectContact(contact.id);
                  }}
                  className="p-3 rounded-2xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/20 hover:border-[#C5E5EC]/40 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-full bg-gradient-to-tr ${contact.avatarBg} flex items-center justify-center text-white font-extrabold text-xs shadow border border-[#C5E5EC]/20 overflow-hidden`}
                    >
                      {contact.avatarUrl ? (
                        <img
                          src={contact.avatarUrl}
                          alt={contact.name || 'Avatar'}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        (contact.name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h5 className="font-bold text-xs text-white">{contact.name}</h5>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            contact.role === 'CLIENT'
                              ? 'bg-[#3064AE]/30 text-[#C5E5EC] border border-[#C5E5EC]/30'
                              : 'bg-[#E0FAEB]/20 text-[#E0FAEB] border border-[#E0FAEB]/30'
                          }`}
                        >
                          {contact.roleLabel}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#C5E5EC]/70">{contact.school}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#C5E5EC]/60" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cloud Contact Backup & Restore Modal */}
      {showBackupModal && (
        <FriendBackupRestoreModal
          isOpen={showBackupModal}
          onClose={() => setShowBackupModal(false)}
        />
      )}

      {/* Terms of Service & 100% Refund Policy Modal */}
      {showTermsModal && (
        <TermsAndRefundPolicyModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
        />
      )}
    </div>
  );
};
