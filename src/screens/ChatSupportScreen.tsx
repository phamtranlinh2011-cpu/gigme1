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
  Download,
  RotateCw,
  Heart,
  ChevronDown,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { useTranslation } from '../context/LanguageContext';
import { formatVnd, ChatMessageEntity, UserEntity } from '../types';
import { generateSynthesizedVoiceWav, playSynthesizedVoiceTone } from '../utils/audio';
import { rateLimiter } from '../utils/rateLimiter';
import { compressImageToWebP } from '../utils/imageCompressor';
import { triggerHaptic } from '../utils/haptics';
import { VerifiedEduBadge } from '../components/VerifiedEduBadge';
import { VerifiedIdentityBadge } from '../components/VerifiedIdentityBadge';
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
  isCccdVerified?: boolean;
  associatedGig?: {
    id: string;
    title: string;
    price: number;
    status: string;
  };
}

// Normalized direct message thread ID generator (Rule 3.4)
const getDirectThreadId = (userA: string, userB: string): string => {
  const sorted = [userA, userB].sort();
  return `direct_${sorted[0]}_${sorted[1]}`;
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
    reactToChatMessage,
    startVoipCall,
    selectGig,
    releaseEscrowPayout,
    requestGigRevision,
    cancelGigByWorker,
    showNotification,
  } = useGigMe();
  const { language, t } = useTranslation();

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
  const [pendingFile, setPendingFile] = useState<{
    name: string;
    size: number;
    sizeFormatted: string;
    dataUrl: string;
    extension: string;
  } | null>(null);
  const [pendingVideo, setPendingVideo] = useState<{ url: string; name: string } | null>(null);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);
  const [previewImageRotation, setPreviewImageRotation] = useState<number>(0);
  const [activeReactionPickerMsgId, setActiveReactionPickerMsgId] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const isNearBottomRef = useRef<boolean>(true);
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

  // 1-1 Typing Indicator state ("Đang nhập...")
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const partnerTypingTimerRef = useRef<any>(null);

  // File input refs
  const fileInputDocRef = useRef<HTMLInputElement | null>(null);
  const fileInputImageRef = useRef<HTMLInputElement | null>(null);
  const fileInputCameraRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Helpers tính toán dung lượng tệp và trạng thái Hoạt động thật (Real-time Online/Offline)
  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Xác định người dùng có Đang Hoạt Động (Online) không:
  // Chỉ khi tài khoản có tương tác gần nhất trong vòng 90 giây và không bị khóa
  const isUserOnline = (user?: UserEntity | null): boolean => {
    if (!user) return false;
    if (user.id === currentUser?.id) return true; // Chính mình luôn online khi đang dùng app
    if (user.isLocked) return false;
    if (!user.lastActiveAt) return false;
    return Date.now() - user.lastActiveAt < 90_000;
  };

  const getUserLastActiveText = (user?: UserEntity | null): string => {
    if (!user) return language === 'vi' ? 'Offline' : 'Offline';
    if (user.isLocked) return language === 'vi' ? 'Đã bị khóa' : 'Suspended';
    if (isUserOnline(user)) return language === 'vi' ? 'Đang hoạt động' : 'Active now';
    if (!user.lastActiveAt) return language === 'vi' ? 'Offline' : 'Offline';
    const diffMs = Date.now() - user.lastActiveAt;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return language === 'vi' ? 'Vừa mới online' : 'Just left';
    if (mins < 60) return language === 'vi' ? `Hoạt động ${mins} phút trước` : `Active ${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return language === 'vi' ? `Hoạt động ${hours} giờ trước` : `Active ${hours}h ago`;
    const days = Math.floor(hours / 24);
    return language === 'vi' ? `Hoạt động ${days} ngày trước` : `Active ${days}d ago`;
  };

  // AI Assistant Chat Messages & Loading
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ id: string; sender: 'USER' | 'AI'; text: string; time: string }>>([
    {
      id: 'ai_welcome',
      sender: 'AI',
      text:
        language === 'vi'
          ? 'Xin chào bạn! Mình là Trợ lý AI GigMe. Mình luôn sẵn sàng giải đáp mọi câu hỏi của bạn về GigMe'
          : 'Hello! I am GigMe AI Assistant. I am always ready to help you with any questions about GigMe!',
      time: language === 'vi' ? 'Trực tuyến' : 'Online',
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
      const adminUser = (users || []).find((u) => u.id === '000000000');
      const isAdminOnline = isUserOnline(adminUser);
      list.push({
        id: '000000000',
        name: language === 'vi' ? 'Ban Quản Trị GigMe (Admin Support)' : 'GigMe Administration (Admin Support)',
        role: 'ADMIN',
        roleLabel: 'Admin 000000000',
        school: language === 'vi' ? 'Tổng Đài Hỗ Trợ Sinh Viên GigMe' : 'GigMe Campus Support Center',
        avatarBg: 'from-[#3064AE] via-[#2A5594] to-[#25735B]',
        isOnline: isAdminOnline,
        lastActiveText: isAdminOnline
          ? (language === 'vi' ? 'Đang hoạt động' : 'Active now')
          : (adminUser?.lastActiveAt ? getUserLastActiveText(adminUser) : (language === 'vi' ? 'Offline' : 'Offline')),
        specialtyOrNeed:
          language === 'vi'
            ? 'Hỗ trợ giải quyết sự cố, mở khóa ví, xác minh CCCD & tranh chấp ký quỹ'
            : 'Support with account issues, wallet unlock, identity verification & escrow disputes',
      });
    }

    // 2. Danh bạ bạn bè thật kết nối qua ID 9 số (friendIds)
    if (currentUser?.friendIds && currentUser.friendIds.length > 0) {
      currentUser.friendIds.forEach((friendId) => {
        if (friendId === '000000000' || friendId === currentUser?.id) return;
        const friendUser = (users || []).find((u) => u.id === friendId);
        if (friendUser && !list.find((c) => c.id === friendUser.id)) {
          const isFriendOnline = isUserOnline(friendUser);
          list.push({
            id: friendUser.id,
            name: friendUser.name || (language === 'vi' ? `Tài khoản ${friendUser.id}` : `Account ${friendUser.id}`),
            role: friendUser.role === 'ADMIN' ? 'ADMIN' : 'WORKER',
            roleLabel: language === 'vi' ? `Bạn bè (ID: ${friendUser.id})` : `Friend (ID: ${friendUser.id})`,
            school: friendUser.studentSchool || (language === 'vi' ? 'Sinh viên Campus' : 'Campus Student'),
            avatarBg: 'from-blue-600 to-indigo-600',
            avatarUrl: (friendUser as any).avatarUrl || (friendUser as any).photoURL || undefined,
            isOnline: isFriendOnline,
            lastActiveText: getUserLastActiveText(friendUser),
            specialtyOrNeed:
              language === 'vi'
                ? `Bạn bè kết nối qua ID 9 số: ${friendUser.id}`
                : `Friend connected via 9-digit ID: ${friendUser.id}`,
            isEduVerified: !!friendUser.isEduVerified || !!friendUser.isStudentVerified,
            isCccdVerified: !!friendUser.isNfcVerified || friendUser.tier === 'CCCD_VERIFIED' || friendUser.tier === 'PRO',
          });
        }
      });
    }

    // 3. Người thuê & Thợ từ các công việc thật trong hệ thống (rawGigs)
    if (rawGigs && rawGigs.length > 0) {
      rawGigs.forEach((gig) => {
        // Kiểm tra xem gig có phải do Ban Quản Trị đăng không (Ban Quản Trị đã có kênh Hỗ Trợ 000000000 cố định)
        const isClientAdmin =
          gig.clientId === '000000000' ||
          gig.clientId === 'admin_root' ||
          gig.clientName?.toLowerCase().includes('ban quản trị') ||
          gig.clientName?.toLowerCase().includes('admin');

        // Người thuê (Bỏ qua tài khoản Admin / Ban Quản Trị để không tạo mục "Người thuê" trùng lặp)
        if (gig.clientId && gig.clientId !== currentUser?.id && !isClientAdmin) {
          const clientUser = (users || []).find((u) => u.id === gig.clientId);
          const isUserAdmin = clientUser?.role === 'ADMIN' || clientUser?.name?.toLowerCase().includes('ban quản trị');

          if (!isUserAdmin) {
            const existing = list.find((c) => c.id === gig.clientId);
            const isClientOnline = isUserOnline(clientUser);
            if (!existing) {
              list.push({
                id: gig.clientId,
                name: gig.clientName || clientUser?.name || (language === 'vi' ? `Người thuê (ID ${gig.clientId})` : `Client (ID ${gig.clientId})`),
                role: 'CLIENT',
                roleLabel: language === 'vi' ? 'Người thuê' : 'Client',
                school: clientUser?.studentSchool || (gig.locationName?.includes('Hà Nội') ? 'ĐH Bách Khoa HN' : 'ĐHQG TP.HCM'),
                avatarBg: 'from-blue-600 to-indigo-600',
                avatarUrl: (clientUser as any)?.avatarUrl || (clientUser as any)?.photoURL || undefined,
                isOnline: isClientOnline,
                lastActiveText: getUserLastActiveText(clientUser),
                specialtyOrNeed: language === 'vi' ? `Đơn: ${gig.title}` : `Gig: ${gig.title}`,
                isEduVerified: !!clientUser?.isEduVerified || !!clientUser?.isStudentVerified || gig.clientTier === 'STUDENT',
                isCccdVerified: !!clientUser?.isNfcVerified || gig.clientTier === 'CCCD_VERIFIED' || gig.clientTier === 'PRO',
                associatedGig: {
                  id: gig.id,
                  title: gig.title,
                  price: gig.price,
                  status: gig.status,
                },
              });
            } else if (!existing.associatedGig && existing.id !== '000000000') {
              existing.associatedGig = {
                id: gig.id,
                title: gig.title,
                price: gig.price,
                status: gig.status,
              };
            }
          }
        }

        // Người làm việc (Bỏ qua tài khoản Admin)
        const isFreelancerAdmin =
          gig.freelancerId === '000000000' ||
          gig.freelancerId === 'admin_root' ||
          gig.freelancerName?.toLowerCase().includes('ban quản trị') ||
          gig.freelancerName?.toLowerCase().includes('admin');

        if (gig.freelancerId && gig.freelancerId !== currentUser?.id && !isFreelancerAdmin) {
          const freelancerUser = (users || []).find((u) => u.id === gig.freelancerId);
          const isUserAdmin = freelancerUser?.role === 'ADMIN' || freelancerUser?.name?.toLowerCase().includes('ban quản trị');

          if (!isUserAdmin) {
            const existing = list.find((c) => c.id === gig.freelancerId);
            const isFreelancerOnline = isUserOnline(freelancerUser);
            if (!existing) {
              list.push({
                id: gig.freelancerId,
                name: gig.freelancerName || freelancerUser?.name || (language === 'vi' ? `Người làm (ID ${gig.freelancerId})` : `Worker (ID ${gig.freelancerId})`),
                role: 'WORKER',
                roleLabel: language === 'vi' ? 'Người làm' : 'Worker',
                school: freelancerUser?.studentSchool || (language === 'vi' ? 'Sinh viên Campus' : 'Campus Student'),
                avatarBg: 'from-emerald-600 to-cyan-600',
                avatarUrl: (freelancerUser as any)?.avatarUrl || (freelancerUser as any)?.photoURL || undefined,
                isOnline: isFreelancerOnline,
                lastActiveText: getUserLastActiveText(freelancerUser),
                specialtyOrNeed: language === 'vi' ? `Đang làm: ${gig.title}` : `Working on: ${gig.title}`,
                isEduVerified: !!freelancerUser?.isEduVerified || !!freelancerUser?.isStudentVerified,
                isCccdVerified: !!freelancerUser?.isNfcVerified || freelancerUser?.tier === 'CCCD_VERIFIED' || freelancerUser?.tier === 'PRO',
                associatedGig: {
                  id: gig.id,
                  title: gig.title,
                  price: gig.price,
                  status: gig.status,
                },
              });
            } else if (!existing.associatedGig && existing.id !== '000000000') {
              existing.associatedGig = {
                id: gig.id,
                title: gig.title,
                price: gig.price,
                status: gig.status,
              };
            }
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
        const isPartnerAdmin =
          partnerId === '000000000' ||
          partnerId === 'admin_root';

        if (isPartnerAdmin) {
          // Bỏ qua vì Admin Support 000000000 đã được thêm cố định ở mục 1
          return;
        }

        if (partnerId && partnerId !== currentUser.id && !list.find((c) => c.id === partnerId)) {
          const u = (users || []).find((usr) => usr.id === partnerId);
          if (u?.role === 'ADMIN' || u?.name?.toLowerCase().includes('ban quản trị')) {
            return;
          }
          const isContactOnline = isUserOnline(u);
          list.push({
            id: partnerId,
            name: u?.name || (language === 'vi' ? `Tài khoản ${partnerId}` : `Account ${partnerId}`),
            role: 'WORKER',
            roleLabel: `ID ${partnerId}`,
            school: u?.studentSchool || 'Campus Hub',
            avatarBg: 'from-teal-600 to-blue-600',
            avatarUrl: (u as any)?.avatarUrl || (u as any)?.photoURL || undefined,
            isOnline: isContactOnline,
            lastActiveText: getUserLastActiveText(u),
            specialtyOrNeed: `ID: ${partnerId}`,
          });
        }
      });
    }

    // Lọc loại bỏ triệt để tài khoản mock và mọi tài khoản giả/trùng lặp mang tên Ban Quản Trị
    return list.filter((c) => {
      if (isMockOrFakeAccount(c.name, c.id)) return false;
      if (c.id === 'admin_root') return false;
      const isBanQuanTriName = c.name?.toLowerCase().includes('ban quản trị') || c.name?.toLowerCase().includes('admin support');
      // Duy nhất chỉ 1 tài khoản Ban Quản Trị chính thức ID 000000000 với role ADMIN được hiển thị
      if (isBanQuanTriName && (c.id !== '000000000' || c.role === 'CLIENT' || c.roleLabel === 'Người thuê' || c.roleLabel === 'Client')) {
        return false;
      }
      return true;
    });
  }, [rawGigs, currentUser, users, allChats, language]);

  // Active contact details with foolproof fallback (so clicking any contact ALWAYS opens chat room)
  const activeContact = useMemo<MessengerContact | null>(() => {
    if (!activeConversationId) return null;
    const found = campusContacts.find((c) => c.id === activeConversationId);
    if (found) return found;

    // Search in users
    const u = (users || []).find((usr) => usr.id === activeConversationId);
    if (u) {
      const isOnlineNow = isUserOnline(u);
      return {
        id: u.id,
        name: u.name || (language === 'vi' ? `Tài khoản ${u.id}` : `Account ${u.id}`),
        role: (u.role === 'ADMIN' ? 'ADMIN' : 'WORKER') as 'CLIENT' | 'WORKER' | 'ADMIN',
        roleLabel: u.role === 'ADMIN' ? 'Admin 000000000' : `ID: ${u.id}`,
        school: u.studentSchool || 'Campus Hub',
        avatarBg: 'from-blue-600 to-indigo-600',
        avatarUrl: (u as any)?.avatarUrl || (u as any)?.photoURL || undefined,
        isOnline: isOnlineNow,
        lastActiveText: getUserLastActiveText(u),
        specialtyOrNeed: `ID: ${u.id}`,
        isEduVerified: !!u.isEduVerified || !!u.isStudentVerified,
        associatedGig: undefined,
      };
    }

    // Default fallback
    const fallbackUser = (users || []).find((usr) => usr.id === activeConversationId);
    const isFallbackOnline = isUserOnline(fallbackUser);
    return {
      id: activeConversationId,
      name:
        activeConversationId === '000000000'
          ? (language === 'vi' ? 'Ban Quản Trị GigMe (Admin Support)' : 'GigMe Administration (Admin Support)')
          : (language === 'vi' ? `Người dùng (${activeConversationId})` : `User (${activeConversationId})`),
      role: (activeConversationId === '000000000' ? 'ADMIN' : 'WORKER') as 'CLIENT' | 'WORKER' | 'ADMIN',
      roleLabel: activeConversationId === '000000000' ? 'Admin 000000000' : `ID ${activeConversationId}`,
      school: 'Campus Hub',
      avatarBg: 'from-[#3064AE] to-[#25735B]',
      isOnline: isFallbackOnline,
      lastActiveText: getUserLastActiveText(fallbackUser),
      specialtyOrNeed: `ID: ${activeConversationId}`,
      associatedGig: undefined,
    };
  }, [activeConversationId, campusContacts, users, language]);

  // Messages for active conversation with strict 2-party isolation (prevents multi-user cross-talk leak)
  const currentConversationMessages = useMemo(() => {
    if (!activeConversationId || !currentUser) return [];
    const dmThreadId = getDirectThreadId(currentUser.id, activeConversationId);
    const dmAltThreadId = `dm_${[currentUser.id, activeConversationId].sort().join('_')}`;
    const gigId = activeContact?.associatedGig?.id;

    return (allChats || []).filter((msg) => {
      // 1. Direct thread match (Rule 3.4 standard direct_ & fallback dm_)
      if (msg.threadId === dmThreadId || msg.threadId === dmAltThreadId) return true;

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
    triggerHaptic('light');
    setActiveConversationId(contactId);
    if (markConversationAsRead) {
      markConversationAsRead(contactId);
    }
  };

  // Reset conversation and input state when switching user accounts
  useEffect(() => {
    setActiveConversationId(null);
    setMessageInput('');
    setPendingImage(null);
    setPendingVideo(null);
    setShowAddFriendModal(false);
    setShowContactInfoModal(false);
    setShowNewChatModal(false);
    setShowBackupModal(false);
    setShowTermsModal(false);
  }, [currentUser?.id]);

  // Mark active conversation messages as read
  useEffect(() => {
    if (activeConversationId && markConversationAsRead) {
      markConversationAsRead(activeConversationId);
    }
  }, [activeConversationId, allChats?.length]);

  // Smart auto-scroll: only auto-scroll if near bottom or active conversation changes
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  const handleMessagesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceToBottom < 120;
    isNearBottomRef.current = nearBottom;
    setShowScrollBottomBtn(!nearBottom);
  };

  useEffect(() => {
    // When switching conversation, always scroll to bottom immediately
    isNearBottomRef.current = true;
    scrollToBottom(false);
  }, [activeConversationId]);

  useEffect(() => {
    // If user is near bottom, keep scrolling to bottom on incoming message
    if (isNearBottomRef.current) {
      scrollToBottom(true);
    }
  }, [currentConversationMessages, aiChatMessages, isAiTyping, isPartnerTyping]);

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

  // Total unread messages across all campus contacts
  const totalUnreadCount = useMemo(() => {
    if (!currentUser || !allChats) return 0;
    return allChats.filter((m) => {
      if (m.senderId === currentUser.id || m.isRead) return false;
      const isSentToMe = m.partnerId === currentUser.id || (!m.partnerId && m.threadId?.includes(currentUser.id));
      return isSentToMe;
    }).length;
  }, [allChats, currentUser]);

  // 9-digit ID Search & Friend logic
  const handleSearchById = () => {
    const rateCheck = rateLimiter.check('SEARCH_ID', currentUser?.id);
    if (!rateCheck.allowed) {
      setSearchIdError(
        rateCheck.errorMsg ||
          (language === 'vi' ? 'Vui lòng chờ ít giây để chống spam tìm kiếm.' : 'Please wait a few seconds before searching again.')
      );
      return;
    }

    const cleanId = searchIdInput.trim();
    if (!cleanId) {
      setSearchIdError(language === 'vi' ? 'Vui lòng nhập ID 9 số để tìm kiếm.' : 'Please enter 9-digit ID to search.');
      return;
    }
    setSearchIdError('');
    rateLimiter.record('SEARCH_ID', currentUser?.id);

    const found = findUserByNineDigitId
      ? findUserByNineDigitId(cleanId)
      : (users || []).find((u) => u.id === cleanId);

    if (found) {
      if (found.id === currentUser?.id) {
        setSearchIdError(language === 'vi' ? 'Đây là ID của chính bạn.' : 'This is your own ID.');
        setFoundUserResult(null);
        return;
      }
      setFoundUserResult(found);
    } else {
      setFoundUserResult(null);
      setSearchIdError(
        language === 'vi'
          ? `Không tìm thấy tài khoản với ID "${cleanId}". Hãy chắc chắn ID gồm các chữ số hợp lệ.`
          : `Account with ID "${cleanId}" not found. Please make sure the ID contains valid digits.`
      );
    }
  };

  // Latest message preview for a contact (strictly isolated between currentUser and contact)
  const getLastMessageForContact = (contactId: string, associatedGigId?: string) => {
    if (!currentUser) return null;
    const dmThreadId = getDirectThreadId(currentUser.id, contactId);
    const dmAltThreadId = `dm_${[currentUser.id, contactId].sort().join('_')}`;

    const relevant = (allChats || []).filter((m) => {
      if (m.threadId === dmThreadId || m.threadId === dmAltThreadId) return true;
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

  // Unread messages count for a contact
  const getUnreadCountForContact = (contactId: string, associatedGigId?: string): number => {
    if (!currentUser) return 0;
    const dmThreadId = getDirectThreadId(currentUser.id, contactId);
    const dmAltThreadId = `dm_${[currentUser.id, contactId].sort().join('_')}`;

    return (allChats || []).filter((m) => {
      if (m.senderId === currentUser.id || m.isRead) return false;
      if (m.threadId === dmThreadId || m.threadId === dmAltThreadId) return true;
      const isDirectPair =
        m.senderId === contactId &&
        (m.partnerId === currentUser.id || (!m.partnerId && m.threadId?.includes(currentUser.id)));
      if (isDirectPair) return true;
      if (associatedGigId && (m.gigId === associatedGigId || m.threadId === associatedGigId)) {
        return m.senderId === contactId && (m.partnerId === currentUser.id || !m.partnerId);
      }
      return false;
    }).length;
  };

  // SEND MESSAGE (MESSENGER 1-1)
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeContact || !currentUser) return;

    const rateCheck = rateLimiter.check('CHAT', currentUser?.id);
    if (!rateCheck.allowed) {
      showNotification(
        language === 'vi' ? '⚠️ Giới hạn tốc độ gửi tin nhắn' : '⚠️ Message rate limit',
        rateCheck.errorMsg ||
          (language === 'vi' ? 'Vui lòng chờ ít giây để chống spam tin nhắn.' : 'Please wait a few seconds before sending another message.'),
        false
      );
      return;
    }

    const targetThread = activeContact.associatedGig?.id || getDirectThreadId(currentUser.id, activeContact.id);

    if (pendingImage) {
      rateLimiter.record('CHAT', currentUser?.id);
      triggerHaptic('medium');
      sendChat(
        messageInput.trim() || (language === 'vi' ? 'Đã gửi một hình ảnh' : 'Sent an image'),
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
      setTimeout(() => scrollToBottom(true), 50);
      return;
    }

    if (pendingVideo) {
      rateLimiter.record('CHAT', currentUser?.id);
      triggerHaptic('medium');
      sendChat(
        messageInput.trim() ||
          (language === 'vi' ? `Đã gửi video: ${pendingVideo.name}` : `Sent video: ${pendingVideo.name}`),
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
      setTimeout(() => scrollToBottom(true), 50);
      return;
    }

    if (pendingFile) {
      rateLimiter.record('CHAT', currentUser?.id);
      triggerHaptic('medium');
      sendChat(
        messageInput.trim() ||
          (language === 'vi' ? `Đã gửi tệp: ${pendingFile.name}` : `Sent file: ${pendingFile.name}`),
        'FILE',
        pendingFile.dataUrl,
        0,
        pendingFile.name,
        targetThread,
        activeContact.id,
        activeContact.name,
        currentUser.id,
        currentUser.name,
        pendingFile.size
      );
      setPendingFile(null);
      setMessageInput('');
      setTimeout(() => scrollToBottom(true), 50);
      return;
    }

    if (!messageInput.trim()) return;

    rateLimiter.record('CHAT', currentUser?.id);
    triggerHaptic('light');
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
    setTimeout(() => scrollToBottom(true), 50);
  };

  // Quick Thumbs-up (Messenger classic 👍)
  const handleSendThumbsUp = () => {
    if (!activeContact || !currentUser) return;
    const rateCheck = rateLimiter.check('CHAT', currentUser?.id);
    if (!rateCheck.allowed) {
      showNotification(
        language === 'vi' ? '⚠️ Giới hạn tốc độ gửi tin nhắn' : '⚠️ Message rate limit',
        rateCheck.errorMsg || (language === 'vi' ? 'Vui lòng chờ ít giây.' : 'Please wait a few seconds.'),
        false
      );
      return;
    }
    rateLimiter.record('CHAT', currentUser?.id);
    triggerHaptic('success');

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
    setTimeout(() => scrollToBottom(true), 50);
  };

  // Preset Quick Replies
  const handleSendQuickReply = (text: string) => {
    if (!activeContact || !currentUser) return;
    const rateCheck = rateLimiter.check('CHAT', currentUser?.id);
    if (!rateCheck.allowed) {
      showNotification(
        language === 'vi' ? '⚠️ Giới hạn tốc độ gửi tin nhắn' : '⚠️ Message rate limit',
        rateCheck.errorMsg || (language === 'vi' ? 'Vui lòng chờ ít giây.' : 'Please wait a few seconds.'),
        false
      );
      return;
    }
    rateLimiter.record('CHAT', currentUser?.id);
    triggerHaptic('light');

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
        language === 'vi' ? '⚠️ Giới hạn tốc độ hỏi AI' : '⚠️ AI query rate limit',
        rateCheck.errorMsg || (language === 'vi' ? 'Vui lòng chờ ít giây trước khi đặt câu hỏi tiếp.' : 'Please wait a few seconds before asking another question.'),
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
      const reply =
        data.reply ||
        (language === 'vi'
          ? 'Hệ thống Smart Escrow của GigMe luôn bảo vệ 100% quyền lợi của bạn!'
          : 'GigMe Smart Escrow always protects 100% of your interests!');

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
          text:
            language === 'vi'
              ? '🛡️ Smart Escrow GigMe: Tiền của người thuê được khóa an toàn. Người làm hoàn tất công việc thì người thuê mới bấm giải ngân. Rút tiền Napas 247 tức thì 0đ phí!'
              : '🛡️ GigMe Smart Escrow: Client funds are securely locked. Once the worker finishes the task, client releases payment. Instant Napas 247 withdrawal with 0 fee!',
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
        language === 'vi' ? '⚡ Nén Ảnh WebP Tự Động' : '⚡ Auto WebP Compression',
        language === 'vi'
          ? `Đã nén tiết kiệm ${compressed.savedPercent}% dữ liệu 4G (${compressed.originalSizeFormatted} ➔ ${compressed.compressedSizeFormatted}).`
          : `Saved ${compressed.savedPercent}% cellular data (${compressed.originalSizeFormatted} ➔ ${compressed.compressedSizeFormatted}).`
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

  // Document / File Picker (Hỗ trợ PDF, Word, Excel, ZIP, TXT... tối đa 15MB)
  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showNotification(
        language === 'vi' ? '⚠️ Tệp quá dung lượng' : '⚠️ File too large',
        language === 'vi'
          ? `Dung lượng tệp tối đa là 15MB (Tệp hiện tại: ${formatFileSize(file.size)}).`
          : `Maximum file size is 15MB (Current: ${formatFileSize(file.size)}).`,
        false
      );
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
        setPendingFile({
          name: file.name,
          size: file.size,
          sizeFormatted: formatFileSize(file.size),
          dataUrl: reader.result,
          extension: ext,
        });
        setShowAttachmentMenu(false);
        triggerHaptic('light');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Voice Note Recording (Support both hardware microphone & guaranteed playable synthesized WAV)
  const startVoiceRecording = async () => {
    if (isRecordingVoice) return;
    if (!activeContact) {
      showNotification(
        language === 'vi' ? 'Nhắc nhở' : 'Notice',
        language === 'vi' ? 'Vui lòng chọn một cuộc trò chuyện để gửi tin nhắn thoại!' : 'Please select a conversation to send voice message!'
      );
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
                  language === 'vi' ? `🎙️ Tin nhắn thoại (${actualDuration}s)` : `🎙️ Voice message (${actualDuration}s)`,
                  'VOICE',
                  reader.result,
                  actualDuration,
                  chosenMime.includes('mp4') ? 'voice_note.m4a' : 'voice_note.webm',
                  targetThread,
                  activeContact.id,
                  activeContact.name
                );
                showNotification(
                  language === 'vi' ? 'Tin nhắn thoại 🎙️' : 'Voice Message 🎙️',
                  language === 'vi' ? `Đã gửi bản ghi âm (${actualDuration} giây)!` : `Sent voice recording (${actualDuration}s)!`
                );
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
    showNotification(language === 'vi' ? 'Đã hủy' : 'Cancelled', language === 'vi' ? 'Đã hủy đoạn ghi âm.' : 'Voice recording discarded.');
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
      language === 'vi' ? `🎙️ Tin nhắn thoại (${actualDuration}s)` : `🎙️ Voice message (${actualDuration}s)`,
      'VOICE',
      audioDataUrl,
      actualDuration,
      'voice_note.wav',
      targetThread,
      activeContact.id,
      activeContact.name
    );
    showNotification(
      language === 'vi' ? 'Tin nhắn thoại 🎙️' : 'Voice Message 🎙️',
      language === 'vi' ? `Đã gửi bản ghi âm (${actualDuration} giây)!` : `Sent voice recording (${actualDuration}s)!`
    );
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
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-3 flex flex-col h-[calc(100vh-4.5rem)] pb-20">
        {/* Messenger Header for AI */}
        <div className="flex items-center justify-between pb-3 border-b border-[#C5E5EC]/15 shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveConversationId(null)}
              className="p-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC] border border-[#C5E5EC]/20 transition cursor-pointer"
              title={language === 'vi' ? 'Quay lại danh sách chat' : 'Back to chat list'}
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
                <h3 className="font-extrabold text-sm text-white">
                  {language === 'vi' ? 'Trợ Lý AI GigMe 24/7' : 'GigMe AI Assistant 24/7'}
                </h3>
                <span className="px-1.5 py-0.5 rounded bg-[#3064AE]/30 text-[#C5E5EC] text-[9px] font-bold border border-[#C5E5EC]/25">
                  Gemini 2.5
                </span>
              </div>
              <p className="text-[11px] text-[#E0FAEB] font-medium">
                {language === 'vi' ? 'Đang trực tuyến • Sẵn sàng hỗ trợ 24/7' : 'Online • Ready to assist 24/7'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveConversationId(null)}
            className="text-xs text-[#C5E5EC]/80 hover:text-white px-2.5 py-1 rounded-lg bg-[#12233B] border border-[#C5E5EC]/20 transition cursor-pointer"
          >
            {language === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>

        {/* Quick FAQ Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar shrink-0 text-[11px]">
          {(language === 'vi'
            ? [
                '🛡️ Smart Escrow hoạt động ra sao?',
                '⚡ Rút tiền Napas 247 bao lâu?',
                '⭐ Mẹo tăng điểm ELO sinh viên?',
                '⚠️ Khiếu nại khi đối tác trễ hẹn?',
              ]
            : [
                '🛡️ How does Smart Escrow work?',
                '⚡ How fast is 24/7 Napas payout?',
                '⭐ Tips to boost Student ELO?',
                '⚠️ How to dispute late delivery?',
              ]
          ).map((chip, idx) => (
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
        <div className="flex-1 overflow-y-auto py-2.5 px-1 space-y-1.5 scroll-smooth">
          {aiChatMessages.map((msg) => {
            const isMe = msg.sender === 'USER';
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mt-1`}>
                <div className={`flex items-end space-x-1.5 max-w-[85%] sm:max-w-[78%] ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                  {!isMe && (
                    <div className="w-6 h-6 rounded-full shrink-0 overflow-hidden mb-0.5 bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-xs border border-white/20">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`relative px-3 py-1.5 text-[13px] leading-snug break-words rounded-2xl inline-block w-fit max-w-full transition-all ${
                      isMe ? 'animate-message-me bg-[#0084FF] text-white rounded-br-xs shadow-xs' : 'animate-message-partner bg-[#2A394A] text-slate-100 border border-white/5 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>

                <div className={`flex items-center space-x-1 text-[10px] text-[#C5E5EC]/50 mt-0.5 ${isMe ? 'pr-1' : 'pl-8'}`}>
                  <span>{msg.time}</span>
                  {isMe && <CheckCheck className="w-3 h-3 text-[#00E5FF] ml-0.5" />}
                </div>
              </div>
            );
          })}

          {isAiTyping && (
            <div className="flex items-end space-x-1.5 mt-2 animate-fadeIn">
              <div className="w-6 h-6 rounded-full shrink-0 overflow-hidden mb-0.5 bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white border border-white/20">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="px-3 py-2 rounded-2xl rounded-bl-xs bg-[#2A394A] border border-white/10 flex items-center space-x-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5E5EC] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5E5EC] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5E5EC] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
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
            placeholder={
              language === 'vi'
                ? 'Hỏi về tiền cọc, rút tiền Napas, mẹo nhận việc...'
                : 'Ask about escrow, payouts, gig tips...'
            }
            className="flex-1 py-2 px-3.5 rounded-full bg-[#1e2c3d] border border-white/10 text-white text-[13px] placeholder:text-[#C5E5EC]/40 focus:border-[#0084FF] focus:bg-[#1a2636] transition outline-none"
          />
          <button
            type="submit"
            disabled={!messageInput.trim() || isAiTyping}
            className="p-2 rounded-full bg-[#0084FF] hover:bg-[#0073e6] disabled:opacity-40 text-white font-bold transition shadow-md shadow-[#0084FF]/30 shrink-0 cursor-pointer flex items-center justify-center"
          >
            <Send className="w-4 h-4 ml-0.5" />
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
    const targetThread = associatedGig?.id || getDirectThreadId(currentUser?.id || '', activeContact.id);
    const liveGig = associatedGig
      ? rawGigs.find((g) => g.id === associatedGig.id)
      : rawGigs.find((g) =>
          ((g.clientId === currentUser?.id && g.freelancerId === activeContact.id) ||
           (g.freelancerId === currentUser?.id && g.clientId === activeContact.id)) &&
          (g.status === 'SUBMITTED' || g.status === 'IN_PROGRESS' || g.status === 'OPEN')
        ) || null;
    const isStaff =
      currentUser?.role === 'ADMIN' ||
      currentUser?.role === 'MOD' ||
      currentUser?.id === '000000000' ||
      currentUser?.id === '000000001' ||
      currentUser?.id === '000000002' ||
      currentUser?.id === '000000003' ||
      currentUser?.phone === '0909120918';
    const isClient =
      currentUser?.id === liveGig?.clientId ||
      (!!liveGig?.clientPhone && currentUser?.phone === liveGig.clientPhone);
    const isWorker = currentUser?.id === liveGig?.freelancerId;

    const handleStartVoiceCall = () => {
      startVoipCall(
        activeContact.name,
        activeContact.roleLabel,
        associatedGig?.id,
        false,
        activeContact.avatarUrl,
        activeContact.id
      );
      sendChat(
        language === 'vi' ? '📞 Đã bắt đầu cuộc gọi thoại VoIP qua mạng Campus' : '📞 Started Campus VoIP Voice Call',
        'VOIP_CALL_INVITE',
        null,
        0,
        undefined,
        targetThread,
        activeContact.id,
        activeContact.name
      );
    };

    const handleStartVideoCall = () => {
      startVoipCall(
        activeContact.name,
        activeContact.roleLabel,
        associatedGig?.id,
        true,
        activeContact.avatarUrl,
        activeContact.id
      );
      sendChat(
        language === 'vi' ? '📹 Đã bắt đầu cuộc gọi video trực tuyến qua mạng Campus' : '📹 Started Campus Live Video Call',
        'VIDEO_CALL_INVITE',
        null,
        0,
        undefined,
        targetThread,
        activeContact.id,
        activeContact.name
      );
    };

    return (
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 flex flex-col h-[calc(100vh-4.5rem)] pb-20">
        {/* MESSENGER TOP APP BAR */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#C5E5EC]/15 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <button
              onClick={() => setActiveConversationId(null)}
              className="p-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC] border border-[#C5E5EC]/20 transition shrink-0 cursor-pointer"
              title={language === 'vi' ? 'Quay lại danh sách' : 'Back to chat list'}
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
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                <h3 className="font-extrabold text-sm text-white truncate">{activeContact.name}</h3>
                {(activeContact.isCccdVerified || activeContact.isEduVerified) && (
                  <VerifiedIdentityBadge
                    isCccdVerified={!!activeContact.isCccdVerified}
                    isStudentVerified={!!activeContact.isEduVerified}
                    school={activeContact.school}
                    size="sm"
                    showText={false}
                  />
                )}
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
              <div className="flex items-center space-x-1.5 text-[11px] text-[#C5E5EC]/70 truncate">
                {isPartnerOnline ? (
                  <span className="text-[#E0FAEB] font-medium flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E0FAEB] animate-pulse" />
                    <span>{language === 'vi' ? 'Đang hoạt động' : 'Active now'}</span>
                  </span>
                ) : (
                  <span>{activeContact.lastActiveText || (language === 'vi' ? 'Ngoại tuyến' : 'Offline')}</span>
                )}
                {activeContact.school && (
                  <>
                    <span>•</span>
                    <span className="text-[#C5E5EC] font-semibold truncate flex items-center space-x-1">
                      <GraduationCap className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>{activeContact.school}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Communication Actions (VoIP Call & Info) */}
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={handleStartVoiceCall}
              className="p-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC] border border-[#C5E5EC]/20 transition cursor-pointer"
              title={language === 'vi' ? 'Gọi thoại VoIP miễn phí qua mạng Campus' : 'Free campus VoIP call'}
            >
              <PhoneCall className="w-4 h-4" />
            </button>
            <button
              onClick={handleStartVideoCall}
              className="p-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC] border border-[#C5E5EC]/20 transition cursor-pointer"
              title={language === 'vi' ? 'Gọi video trực tuyến' : 'Live video call'}
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowContactInfoModal(true)}
              className="p-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC]/80 hover:text-white border border-[#C5E5EC]/20 transition cursor-pointer"
              title={language === 'vi' ? 'Xem thông tin chi tiết' : 'View contact info'}
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* REVIEW APPROVAL BANNER: RENDERED FOR CLIENT/STAFF WHEN GIG IS SUBMITTED OR IN PROGRESS */}
        {liveGig && (liveGig.status === 'SUBMITTED' || liveGig.status === 'IN_PROGRESS') && (isClient || isStaff) && (
          <div className="my-2 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-[#102538] to-[#12233B] border-2 border-emerald-500/50 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <CheckCircle2 className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h5 className="font-black text-xs text-white flex items-center space-x-2">
                  <span>
                    {liveGig.status === 'SUBMITTED'
                      ? (language === 'vi' ? 'Báo Cáo Nghiệm Thu Đã Nộp' : 'Deliverables Submitted')
                      : (language === 'vi' ? 'Công Việc Đang Thực Hiện' : 'Job In Progress')}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 font-bold text-[9px]">
                    {liveGig.status === 'SUBMITTED'
                      ? (language === 'vi' ? 'CHỜ BẠN DUYỆT' : 'PENDING APPROVAL')
                      : (language === 'vi' ? 'XÁC NHẬN KHI XONG' : 'CONFIRM WHEN DONE')}
                  </span>
                </h5>
                <p className="text-[11px] text-[#C5E5EC]/80 mt-0.5">
                  {language === 'vi'
                    ? `Đơn việc "${liveGig.title}". Bấm xác nhận để nghiệm thu và giải ngân ${formatVnd(liveGig.price)} cho người làm.`
                    : `Gig "${liveGig.title}". Confirm completion to release ${formatVnd(liveGig.price)} to student.`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const ok = releaseEscrowPayout(liveGig.id);
                  if (ok) {
                    showNotification(
                      language === 'vi' ? 'Đã Giải Ngân Thành Công! 🎉' : 'Escrow Released! 🎉',
                      language === 'vi' ? `Đã hoàn tất nghiệm thu và chuyển ${formatVnd(liveGig.price)} cho sinh viên làm việc.` : `Completed and paid ${formatVnd(liveGig.price)} to worker.`,
                      true,
                      true
                    );
                  }
                }}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center space-x-1.5 shadow-lg active:scale-95 cursor-pointer border border-emerald-400/40"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>{language === 'vi' ? `Xác Nhận Đã Xong & Giải Ngân (${formatVnd(liveGig.price)})` : `Confirm Done & Pay (${formatVnd(liveGig.price)})`}</span>
              </button>
            </div>
          </div>
        )}

        {/* WORKER ACTIONS IN PROGRESS (DROP / CANCEL GIG) */}
        {liveGig && (liveGig.status === 'IN_PROGRESS' || liveGig.status === 'SUBMITTED') && isWorker && (
          <div className="my-1.5 px-3 py-1.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20 flex items-center justify-between text-xs text-slate-300">
            <span className="text-[11px] text-[#C5E5EC]">
              {language === 'vi' ? 'Bạn đang nhận làm đơn này.' : 'You are assigned to this gig.'}
            </span>
            <button
              type="button"
              onClick={() => {
                const conf = window.confirm(
                  language === 'vi'
                    ? 'Bạn có chắc chắn muốn hủy nhận đơn này? Đơn sẽ được mở lại cho sinh viên khác.'
                    : 'Are you sure you want to drop this gig? It will be reopened for others.'
                );
                if (conf) {
                  cancelGigByWorker(liveGig.id, 'Thợ tự rút lui khỏi đơn trong phòng chat');
                }
              }}
              className="text-[11px] text-red-400 hover:underline font-bold flex items-center space-x-1 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Hủy nhận việc (Rút khỏi đơn)' : 'Drop gig'}</span>
            </button>
          </div>
        )}

        {/* DISMISSIBLE 1-LINE COLLABORATION STATUS */}
        {associatedGig && !bannerDismissed && (
          <div className="my-2 px-3 py-1.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20 flex items-center justify-between text-xs text-slate-300 shrink-0">
            <div className="flex items-center space-x-2 truncate">
              <Briefcase className="w-3.5 h-3.5 text-[#C5E5EC] shrink-0" />
              <span className="truncate">
                <span className="text-[#C5E5EC] font-bold">
                  {language === 'vi' ? 'Kèo chung:' : 'Related Gig:'}
                </span>{' '}
                {associatedGig.title} ({formatVnd(associatedGig.price)})
              </span>
            </div>
            <div className="flex items-center space-x-2 shrink-0 ml-2">
              <button
                onClick={() => {
                  selectGig(associatedGig.id);
                  showNotification(
                    language === 'vi' ? 'Thông tin việc làm' : 'Gig Info',
                    language === 'vi' ? `Đã chọn kèo "${associatedGig.title}"` : `Selected gig "${associatedGig.title}"`
                  );
                }}
                className="text-[11px] text-[#C5E5EC] hover:underline font-bold cursor-pointer"
              >
                {language === 'vi' ? 'Chi tiết' : 'Details'}
              </button>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-[#C5E5EC]/60 hover:text-white p-0.5 cursor-pointer"
                title={language === 'vi' ? 'Ẩn thông báo này' : 'Dismiss this notice'}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* OFFLINE NOTICE BANNER */}
        {!isPartnerOnline && activeContact.id !== '000000000' && (
          <div className="my-1.5 px-3 py-1.5 rounded-xl bg-[#12233B]/70 border border-[#C5E5EC]/15 flex items-center justify-between text-[11px] text-[#C5E5EC]/80 shrink-0">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              <span>
                {language === 'vi'
                  ? `Đối phương hiện đang ngoại tuyến (${activeContact.lastActiveText || 'Offline'}). Tin nhắn của bạn sẽ được gửi qua Cloud và thông báo đẩy (Push) đến thiết bị.`
                  : `Partner is currently offline (${activeContact.lastActiveText || 'Offline'}). Messages will be synced via Cloud & push notification.`}
              </span>
            </div>
          </div>
        )}

        {/* QUICK REPLIES BAR (MESSENGER CHIPS) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar shrink-0 text-[11px]">
          {(language === 'vi'
            ? [
                '👋 Chào bạn nha!',
                '👌 Mình nhận kèo nhé!',
                '📁 Bạn gửi file qua đây nha!',
                '🏃 Mình đang qua sảnh A nè!',
                '🙏 Cảm ơn bạn nhiều!',
              ]
            : [
                '👋 Hello there!',
                '👌 I accept the gig!',
                '📁 Please send the files here!',
                '🏃 Heading to hall A now!',
                '🙏 Thank you very much!',
              ]
          ).map((chip, idx) => (
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
        <div
          ref={messagesContainerRef}
          onScroll={handleMessagesScroll}
          className="flex-1 overflow-y-auto py-2.5 px-1 space-y-1.5 scroll-smooth relative"
        >
          {currentConversationMessages.length === 0 ? (
            <div className="text-center py-10 text-[#C5E5EC]/60 text-xs">
              <div
                className={`w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-tr ${activeContact.avatarBg} flex items-center justify-center text-white font-black text-xl shadow-lg border border-[#C5E5EC]/30`}
              >
                {activeContact.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="font-extrabold text-sm text-white">{activeContact.name}</h4>
              <p className="text-[#C5E5EC]/80 text-xs mt-0.5">{activeContact.specialtyOrNeed}</p>
              <p className="text-[11px] text-[#C5E5EC]/60 mt-2">
                {language === 'vi'
                  ? 'Hãy gửi tin nhắn đầu tiên để kết nối và trao đổi công việc trực tiếp!'
                  : 'Send the first message to connect and discuss the gig directly!'}
              </p>
            </div>
          ) : (
            currentConversationMessages.map((msg, index) => {
              const isMe = msg.senderId === currentUser?.id;
              const prevMsg = currentConversationMessages[index - 1];
              const nextMsg = currentConversationMessages[index + 1];
              const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
              const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;

              // Check if thumbs up single emoji
              const isOnlyThumbsUp = msg.message?.trim() === '👍' && !msg.attachmentType || msg.attachmentType === 'NONE' && msg.message?.trim() === '👍';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isFirstInGroup ? 'mt-2.5' : 'mt-0.5'}`}
                >
                  {/* Sender Name (Only on first of group for partner) */}
                  {!isMe && isFirstInGroup && (
                    <div className="flex items-center space-x-1.5 mb-1 px-8 text-[11px] text-[#C5E5EC]/75 font-semibold">
                      <span>{msg.senderName || activeContact.name}</span>
                    </div>
                  )}

                  {/* Message Row with Partner Avatar on Left */}
                  <div className={`flex items-end space-x-1.5 max-w-[82%] sm:max-w-[75%] ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                    {/* Small Messenger avatar on bottom-left for partner */}
                    {!isMe && (
                      <div className="w-6 h-6 rounded-full shrink-0 overflow-hidden mb-0.5">
                        {isLastInGroup ? (
                          <div
                            className={`w-6 h-6 rounded-full bg-gradient-to-tr ${activeContact.avatarBg} flex items-center justify-center text-white font-bold text-[10px] border border-[#C5E5EC]/30`}
                          >
                            {activeContact.avatarUrl ? (
                              <img src={activeContact.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (activeContact.name || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                        ) : (
                          <div className="w-6 h-6" />
                        )}
                      </div>
                    )}

                    {/* Single Thumbs-Up sticker style */}
                    {isOnlyThumbsUp ? (
                      <div className="py-1 px-1 text-4xl select-none animate-sticker-pop cursor-default inline-block" title="👍">
                        👍
                      </div>
                    ) : (
                      /* Messenger Bubble with Responsive Content Sizing & Slide-in Entry Animation */
                      <div className="relative group/msg">
                        <div
                          className={`relative px-3 py-1.5 text-[13px] leading-snug break-words transition-all shadow-xs inline-block w-fit max-w-full ${
                            isMe ? 'animate-message-me' : 'animate-message-partner'
                          } ${
                            isMe
                              ? 'bg-[#0084FF] text-white selection:bg-white selection:text-[#0084FF] ' +
                                (isFirstInGroup && isLastInGroup
                                  ? 'rounded-2xl'
                                  : isFirstInGroup
                                  ? 'rounded-2xl rounded-br-sm'
                                  : isLastInGroup
                                  ? 'rounded-2xl rounded-tr-sm'
                                  : 'rounded-2xl rounded-r-sm')
                              : 'bg-[#2A394A] text-slate-100 border border-white/5 ' +
                                (isFirstInGroup && isLastInGroup
                                  ? 'rounded-2xl'
                                  : isFirstInGroup
                                  ? 'rounded-2xl rounded-bl-sm'
                                  : isLastInGroup
                                  ? 'rounded-2xl rounded-tl-sm'
                                  : 'rounded-2xl rounded-l-sm')
                          }`}
                        >
                          {/* Text Message */}
                          {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}

                          {/* Image Attachment */}
                          {msg.attachmentType === 'IMAGE' && msg.attachmentData && (
                            <div className="mt-1.5 rounded-xl overflow-hidden border border-black/20">
                              <img
                                src={msg.attachmentData}
                                alt={language === 'vi' ? 'Ảnh đính kèm' : 'Attachment image'}
                                className="max-h-56 rounded-xl object-cover cursor-pointer hover:opacity-95 transition"
                                onClick={() => {
                                  setPreviewImageRotation(0);
                                  setPreviewZoomImage(msg.attachmentData!);
                                }}
                              />
                            </div>
                          )}

                          {/* Proof of Work / Watermark GPS Attachment with Direct Approval Actions */}
                          {(msg.attachmentType === 'WATERMARK_PREVIEW' || msg.attachmentType === 'PROOF_SCREENSHOT') && (
                            <div className="mt-2 p-2.5 rounded-2xl bg-[#091422] border-2 border-emerald-500/50 space-y-2 max-w-sm">
                              <div className="flex items-center justify-between text-[11px] pb-1 border-b border-emerald-500/30">
                                <span className="font-extrabold text-emerald-300 flex items-center space-x-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  <span>{language === 'vi' ? 'Minh Chứng Nghiệm Thu GPS' : 'GPS Proof of Work'}</span>
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                  {liveGig?.status === 'COMPLETED'
                                    ? (language === 'vi' ? 'Đã Giải Ngân' : 'Disbursed')
                                    : (language === 'vi' ? 'Chờ Duyệt' : 'Pending Review')}
                                </span>
                              </div>

                              {msg.attachmentData && (
                                <div className="rounded-xl overflow-hidden border border-emerald-500/30 bg-black">
                                  <img
                                    src={msg.attachmentData}
                                    alt="Proof of work"
                                    className="max-h-56 w-full object-cover cursor-pointer hover:opacity-95 transition"
                                    onClick={() => {
                                      setPreviewImageRotation(0);
                                      setPreviewZoomImage(msg.attachmentData!);
                                    }}
                                  />
                                </div>
                              )}

                              {/* Approval Buttons for Client or Moderator right on the delivered proof */}
                              {(() => {
                                const targetProofGig = (msg.gigId ? rawGigs.find((g) => g.id === msg.gigId) : null) || liveGig;
                                if (!targetProofGig) return null;
                                const canApprove =
                                  isStaff ||
                                  currentUser?.id === targetProofGig.clientId ||
                                  (!!targetProofGig.clientPhone && currentUser?.phone === targetProofGig.clientPhone);
                                const isTargetWorker = currentUser?.id === targetProofGig.freelancerId;

                                return (
                                  <>
                                    {(targetProofGig.status === 'SUBMITTED' || targetProofGig.status === 'IN_PROGRESS') && canApprove && (
                                      <div className="pt-1.5 flex flex-col gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const ok = releaseEscrowPayout(targetProofGig.id);
                                            if (ok) {
                                              showNotification(
                                                language === 'vi' ? 'Đã Xác Nhận & Giải Ngân! 🎉' : 'Escrow Released! 🎉',
                                                language === 'vi'
                                                  ? `Đã nghiệm thu xong đơn "${targetProofGig.title}" và giải ngân ${formatVnd(targetProofGig.price)} cho người làm.`
                                                  : `Confirmed completion of "${targetProofGig.title}" and paid ${formatVnd(targetProofGig.price)}.`,
                                                true,
                                                true
                                              );
                                            }
                                          }}
                                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 border border-emerald-400/50"
                                        >
                                          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                                          <span>
                                            {language === 'vi'
                                              ? `Xác Nhận Đã Xong & Giải Ngân (${formatVnd(targetProofGig.price)})`
                                              : `Confirm Done & Release Escrow (${formatVnd(targetProofGig.price)})`}
                                          </span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            const note = window.prompt(
                                              language === 'vi' ? 'Nhập ghi chú yêu cầu chỉnh sửa gửi thợ:' : 'Enter revision feedback for worker:'
                                            );
                                            if (note && note.trim()) {
                                              requestGigRevision(targetProofGig.id, note.trim());
                                              showNotification(
                                                language === 'vi' ? 'Đã Gửi Yêu Cầu Sửa' : 'Revision Requested',
                                                language === 'vi' ? 'Yêu cầu chỉnh sửa đã được gửi đến người làm.' : 'Revision feedback sent to worker.'
                                              );
                                            }
                                          }}
                                          className="w-full py-1.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-[11px] border border-amber-500/30 transition cursor-pointer"
                                        >
                                          {language === 'vi' ? '🔄 Yêu Cầu Chỉnh Sửa Lại' : '🔄 Request Revision'}
                                        </button>
                                      </div>
                                    )}

                                    {(targetProofGig.status === 'SUBMITTED' || targetProofGig.status === 'IN_PROGRESS') && isTargetWorker && (
                                      <p className="text-[10px] text-emerald-300 font-medium text-center">
                                        {language === 'vi'
                                          ? '⏳ Đã nộp bằng chứng. Đang chờ người thuê hoặc kiểm duyệt viên bấm xác nhận.'
                                          : '⏳ Proof delivered. Awaiting client or moderator confirmation.'}
                                      </p>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          )}

                          {/* Voice Note Attachment */}
                          {msg.attachmentType === 'VOICE' && (
                            <div className="mt-1.5 flex items-center space-x-2 py-1 px-2 rounded-xl bg-black/25 backdrop-blur-xs border border-white/15 text-xs min-w-[180px]">
                              <button
                                type="button"
                                onClick={() => handleTogglePlayAudio(msg.id, msg.attachmentData, msg.attachmentDuration)}
                                className="w-7 h-7 rounded-full bg-[#00E5FF] text-black hover:scale-105 active:scale-95 flex items-center justify-center shrink-0 shadow transition cursor-pointer"
                                title={playingAudioId === msg.id ? (language === 'vi' ? 'Tạm dừng' : 'Pause') : (language === 'vi' ? 'Phát' : 'Play')}
                              >
                                {playingAudioId === msg.id ? (
                                  <Pause className="w-3.5 h-3.5 fill-current" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                )}
                              </button>
                              <div className="flex-1 flex flex-col justify-center">
                                <div className="flex items-center justify-between text-[10px] mb-1">
                                  <span className="font-bold text-white">{language === 'vi' ? 'Thoại' : 'Voice'}</span>
                                  <span className="font-mono text-[9px] text-cyan-200">
                                    {msg.attachmentDuration || 3}s
                                  </span>
                                </div>
                                <div className="flex items-center space-x-0.5 h-3">
                                  {[30, 65, 90, 50, 100, 80, 45, 90, 70, 40, 85, 60].map((h, i) => (
                                    <div
                                      key={i}
                                      className={`flex-1 rounded-full transition-all duration-150 ${
                                        playingAudioId === msg.id ? 'bg-[#00E5FF] animate-pulse' : 'bg-white/40'
                                      }`}
                                      style={{ height: `${h}%` }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Video Attachment */}
                          {msg.attachmentType === 'VIDEO' && msg.attachmentData && (
                            <div className="mt-1.5 rounded-xl overflow-hidden">
                              <video src={msg.attachmentData} controls className="max-h-52 w-full rounded-xl" />
                            </div>
                          )}

                          {/* File / Document Attachment */}
                          {msg.attachmentType === 'FILE' && (
                            <div className="mt-1.5 p-2.5 rounded-xl bg-[#0B1524]/85 border border-[#00E5FF]/30 flex items-center justify-between space-x-3 min-w-[200px] max-w-sm">
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate" title={msg.mediaFileName || 'Tệp đính kèm'}>
                                    {msg.mediaFileName || (language === 'vi' ? 'Tệp đính kèm' : 'Attachment')}
                                  </p>
                                  <p className="text-[10px] text-[#C5E5EC]/70">
                                    {formatFileSize(msg.fileSizeBytes)}
                                  </p>
                                </div>
                              </div>
                              {msg.attachmentData && (
                                <a
                                  href={msg.attachmentData}
                                  download={msg.mediaFileName || 'tai-lieu-gigme'}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 rounded-lg bg-[#12233B] hover:bg-[#1A3355] text-[#00E5FF] hover:text-white border border-[#00E5FF]/30 transition shrink-0 cursor-pointer flex items-center justify-center"
                                  title={language === 'vi' ? 'Tải tệp xuống' : 'Download file'}
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          )}

                          {/* VoIP or Video Call Invite Attachment */}
                          {(msg.attachmentType === 'VOIP_CALL_INVITE' || msg.attachmentType === 'VIDEO_CALL_INVITE') && (
                            <div className="mt-2 p-3 rounded-2xl bg-gradient-to-r from-[#0C1B2E] to-[#12233B] border border-[#00E5FF]/40 space-y-2 min-w-[220px]">
                              <div className="flex items-center space-x-2">
                                {msg.attachmentType === 'VIDEO_CALL_INVITE' ? (
                                  <Video className="w-5 h-5 text-emerald-400 animate-pulse shrink-0" />
                                ) : (
                                  <PhoneCall className="w-5 h-5 text-cyan-400 animate-pulse shrink-0" />
                                )}
                                <div>
                                  <span className="font-extrabold text-white text-xs block">
                                    {msg.attachmentType === 'VIDEO_CALL_INVITE'
                                      ? (language === 'vi' ? 'Cuộc Gọi Video WebRTC' : 'Live Video Call')
                                      : (language === 'vi' ? 'Cuộc Gọi Thoại VoIP' : 'VoIP Voice Call')}
                                  </span>
                                  <span className="text-[10px] text-cyan-200">
                                    {msg.senderId === currentUser?.id
                                      ? (language === 'vi' ? 'Bạn đã bắt đầu cuộc gọi' : 'You started a call')
                                      : (language === 'vi' ? 'Mời bạn tham gia cuộc gọi' : 'Invited you to call')}
                                  </span>
                                </div>
                              </div>
                              {msg.senderId !== currentUser?.id && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerHaptic('success');
                                    startVoipCall(
                                      activeContact.name,
                                      activeContact.roleLabel,
                                      associatedGig?.id,
                                      msg.attachmentType === 'VIDEO_CALL_INVITE',
                                      activeContact.avatarUrl,
                                      activeContact.id
                                    );
                                  }}
                                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:brightness-110 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-md active:scale-95 cursor-pointer"
                                >
                                  <PhoneCall className="w-3.5 h-3.5" />
                                  <span>{language === 'vi' ? 'Nghe Máy / Tham Gia Ngay' : 'Answer / Join Call'}</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Reaction Picker Button on Hover / Mobile tap */}
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity z-10 ${
                            isMe ? '-left-7' : '-right-7'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              setActiveReactionPickerMsgId(activeReactionPickerMsgId === msg.id ? null : msg.id);
                            }}
                            className="w-6 h-6 rounded-full bg-[#12233B] border border-[#C5E5EC]/30 text-[#C5E5EC] hover:text-white flex items-center justify-center text-xs shadow hover:scale-110 active:scale-95 transition cursor-pointer"
                            title={language === 'vi' ? 'Thả cảm xúc' : 'Add reaction'}
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Reaction Picker Popover (Messenger style floating emojis) */}
                        {activeReactionPickerMsgId === msg.id && (
                          <div
                            className={`absolute -top-10 z-20 flex items-center space-x-1 p-1 bg-[#12233B]/95 backdrop-blur-md border border-[#3064AE] rounded-full shadow-2xl animate-pop-sticker ${
                              isMe ? 'right-0' : 'left-0'
                            }`}
                          >
                            {['❤️', '👍', '😂', '😮', '😢', '🔥'].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  triggerHaptic('medium');
                                  reactToChatMessage(msg.id, emoji);
                                  setActiveReactionPickerMsgId(null);
                                }}
                                className="w-7 h-7 flex items-center justify-center text-base hover:scale-135 active:scale-95 transition cursor-pointer select-none"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Displayed Active Reactions Count Badge on Message */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div
                            className={`absolute -bottom-2 flex items-center space-x-0.5 px-1.5 py-0.5 bg-[#0C1B2E] border border-white/15 rounded-full text-[11px] shadow-sm z-10 ${
                              isMe ? 'right-1' : 'left-1'
                            }`}
                          >
                            {Object.entries(msg.reactions)
                              .filter(([_, count]) => (count as number) > 0)
                              .map(([emoji, count]) => (
                                <span key={emoji} className="flex items-center space-x-0.5 text-[11px]">
                                  <span>{emoji}</span>
                                  {(count as number) > 1 && (
                                    <span className="text-[10px] text-slate-300 font-bold">{count as number}</span>
                                  )}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Timestamp & Read Receipt on Last of Group */}
                  {isLastInGroup && (
                    <div className={`flex items-center space-x-1 text-[10px] text-[#C5E5EC]/50 mt-0.5 ${isMe ? 'pr-1' : 'pl-8'}`}>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && <CheckCheck className="w-3 h-3 text-[#00E5FF] ml-0.5" />}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Real-time Partner Typing Indicator (Classic Messenger 3-dots bubble) */}
          {isPartnerTyping && (
            <div className="flex items-end space-x-1.5 mt-2 animate-fadeIn">
              <div className="w-6 h-6 rounded-full shrink-0 overflow-hidden mb-0.5">
                <div
                  className={`w-6 h-6 rounded-full bg-gradient-to-tr ${activeContact.avatarBg} flex items-center justify-center text-white font-bold text-[10px] border border-[#C5E5EC]/30`}
                >
                  {(activeContact.name || 'U').charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-[#2A394A] border border-white/10 flex items-center space-x-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5E5EC] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5E5EC] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5E5EC] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />

          {/* Floating Scroll to Bottom Button (Messenger style) */}
          {showScrollBottomBtn && (
            <div className="sticky bottom-2 left-0 right-0 flex justify-center z-20 pointer-events-none">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  scrollToBottom(true);
                }}
                className="pointer-events-auto px-3.5 py-1.5 rounded-full bg-[#122E54]/95 backdrop-blur-md border border-[#00E5FF]/40 text-[#00E5FF] hover:text-white shadow-xl flex items-center space-x-1.5 text-xs font-bold transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ChevronDown className="w-4 h-4 animate-bounce" />
                <span>{language === 'vi' ? 'Cuộn xuống tin mới' : 'Scroll to newest'}</span>
              </button>
            </div>
          )}
        </div>

        {/* PREVIEW ATTACHMENT BEFORE SEND */}
        {pendingImage && (
          <div className="relative mb-2 p-2 rounded-2xl bg-[#131E30] border border-cyan-500/40 shrink-0 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src={pendingImage} alt="Pending" className="w-12 h-12 rounded-xl object-cover border" />
              <span className="text-xs text-cyan-300 font-semibold">
                {language === 'vi' ? 'Sẵn sàng gửi hình ảnh' : 'Ready to send image'}
              </span>
            </div>
            <button onClick={() => setPendingImage(null)} className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {pendingFile && (
          <div className="relative mb-2 p-2.5 rounded-2xl bg-[#131E30] border border-[#00E5FF]/40 shrink-0 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
              <div className="w-10 h-10 rounded-xl bg-[#0E1B2E] border border-[#00E5FF]/30 text-[#00E5FF] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{pendingFile.name}</p>
                <p className="text-[11px] text-[#C5E5EC]/70">
                  {pendingFile.sizeFormatted} • {pendingFile.extension}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setPendingFile(null);
              }}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer shrink-0"
              title={language === 'vi' ? 'Hủy đính kèm' : 'Remove attachment'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ATTACHMENT POPUP MENU */}
        {showAttachmentMenu && (
          <div className="mb-2 p-2 rounded-2xl bg-[#12233B]/95 backdrop-blur-md border border-[#00E5FF]/30 shadow-2xl flex items-center space-x-2 shrink-0 animate-fadeIn flex-wrap gap-y-1.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowAttachmentMenu(false);
                fileInputImageRef.current?.click();
              }}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#0E1B2E] hover:bg-[#162B48] active:scale-95 text-xs font-bold text-[#E0FAEB] border border-[#00E5FF]/20 transition cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-[#0084FF] flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span>{language === 'vi' ? 'Chọn từ thư viện' : 'Photo Library'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowAttachmentMenu(false);
                fileInputCameraRef.current?.click();
              }}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#0E1B2E] hover:bg-[#162B48] active:scale-95 text-xs font-bold text-[#E0FAEB] border border-[#00E5FF]/20 transition cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <span>{language === 'vi' ? 'Chụp ảnh nhanh' : 'Take Photo'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowAttachmentMenu(false);
                fileInputDocRef.current?.click();
              }}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#0E1B2E] hover:bg-[#162B48] active:scale-95 text-xs font-bold text-[#E0FAEB] border border-[#00E5FF]/20 transition cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <span>{language === 'vi' ? 'Tài liệu / Tệp tin' : 'Document / File'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(false)}
              className="p-2 ml-auto rounded-full text-slate-400 hover:text-white transition cursor-pointer"
              title={language === 'vi' ? 'Đóng menu đính kèm' : 'Close attachment menu'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Hidden inputs for camera, gallery, and documents */}
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
        <input
          ref={fileInputDocRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.tar,.gz,.json,.csv"
          className="hidden"
          onChange={handleDocFileChange}
        />

        {/* LIVE VOICE RECORDING BAR (Khi đang ghi âm microphone) */}
        {isRecordingVoice ? (
          <div className="pt-2 border-t border-[#C5E5EC]/15 shrink-0 flex items-center justify-between space-x-2 animate-fadeIn">
            <div className="flex items-center space-x-2.5 px-3 py-2 rounded-full bg-red-950/70 border border-red-500/40 text-red-200 flex-1">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <Mic className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-xs font-bold font-mono">
                {language === 'vi' ? 'Đang ghi âm:' : 'Recording:'} {recordingDuration}s
              </span>
              <div className="flex items-center space-x-0.5 ml-2 h-3">
                {[40, 80, 50, 100, 75, 90, 45, 85].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-red-400/80 rounded-full animate-pulse"
                    style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  cancelVoiceRecording();
                }}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
                title={language === 'vi' ? 'Hủy ghi âm' : 'Cancel recording'}
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  stopVoiceRecording();
                }}
                className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 active:scale-95 text-white font-bold text-xs flex items-center space-x-1 shadow-lg shadow-red-600/30 transition cursor-pointer"
                title={language === 'vi' ? 'Gửi bản ghi âm' : 'Send voice message'}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Gửi Thoại' : 'Send Audio'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-1.5 border-t border-[#C5E5EC]/15 shrink-0 space-y-1.5">
            {/* Quick Phrases Carousel Bar */}
            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5">
              <span className="text-[10px] text-[#C5E5EC]/60 font-bold shrink-0 flex items-center space-x-0.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">{language === 'vi' ? 'Nhanh:' : 'Quick:'}</span>
              </span>
              {[
                language === 'vi' ? '📍 Mình đã đến nơi rồi nhé!' : '📍 I have arrived!',
                language === 'vi' ? '🚶 Đang xuống thang máy đây!' : '🚶 Coming down now!',
                language === 'vi' ? '⏳ Bạn đợi mình 2 phút nha!' : '⏳ Wait 2 mins please!',
                language === 'vi' ? '📦 Món đồ này còn không bạn?' : '📦 Is item available?',
                language === 'vi' ? '🗺️ Cho mình xin phòng KTX với' : '🗺️ What room number?',
                language === 'vi' ? '✨ Oke bạn, cảm ơn bạn nhiều!' : '✨ Thanks so much!',
              ].map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setMessageInput(phrase);
                  }}
                  className="px-2.5 py-1 rounded-full bg-[#182C48] hover:bg-[#223E66] border border-[#C5E5EC]/20 text-[#C5E5EC] hover:text-white text-[11px] font-medium whitespace-nowrap transition active:scale-95 shrink-0 cursor-pointer shadow-xs"
                >
                  {phrase}
                </button>
              ))}
            </div>

            {/* MESSENGER BOTTOM INPUT BAR */}
            <form onSubmit={handleSendMessage} className="flex items-center space-x-1 sm:space-x-1.5">
            {/* Attachment Button (Paperclip) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowAttachmentMenu(!showAttachmentMenu);
              }}
              className={`p-2 rounded-full transition shrink-0 cursor-pointer ${
                showAttachmentMenu
                  ? 'bg-[#0084FF] text-white shadow-md shadow-[#0084FF]/30'
                  : 'hover:bg-white/10 text-[#0084FF]'
              }`}
              title={language === 'vi' ? 'Đính kèm tệp, ảnh hoặc chụp ảnh' : 'Attach file, photo or take photo'}
            >
              <Paperclip className="w-5 h-5 text-[#0084FF]" />
            </button>

            {/* Gallery Image Button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                fileInputImageRef.current?.click();
              }}
              className="p-2 rounded-full hover:bg-white/10 text-[#0084FF] transition shrink-0 cursor-pointer"
              title={language === 'vi' ? 'Chọn ảnh từ thư viện' : 'Choose photo from gallery'}
            >
              <ImageIcon className="w-5 h-5 text-[#0084FF]" />
            </button>

            {/* Camera Button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                fileInputCameraRef.current?.click();
              }}
              className="p-2 rounded-full hover:bg-white/10 text-[#0084FF] transition shrink-0 cursor-pointer"
              title={language === 'vi' ? 'Chụp ảnh nhanh' : 'Take photo'}
            >
              <Camera className="w-5 h-5 text-[#0084FF]" />
            </button>

            {/* Text Input Pill */}
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={t('typeMessagePlaceholder')}
              className="flex-1 py-2 px-3 sm:px-3.5 rounded-full bg-[#1e2c3d] border border-white/10 text-white text-[13px] placeholder:text-[#C5E5EC]/40 focus:border-[#0084FF] focus:bg-[#1a2636] transition outline-none min-w-0"
            />

            {/* Voice Message Microphone Button (Hiển thị khi không có text) */}
            {!messageInput.trim() && !pendingImage && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  startVoiceRecording();
                }}
                className="p-2 rounded-full hover:bg-white/10 text-[#00E5FF] hover:scale-105 active:scale-95 transition shrink-0 cursor-pointer flex items-center justify-center"
                title={language === 'vi' ? 'Ghi âm tin nhắn thoại' : 'Record voice message'}
              >
                <Mic className="w-5 h-5 text-[#00E5FF]" />
              </button>
            )}

            {/* Send Button or Thumbs-up if empty */}
            {messageInput.trim() || pendingImage ? (
              <button
                type="submit"
                className="p-2 rounded-full bg-[#0084FF] hover:bg-[#0073e6] active:scale-95 text-white transition shadow-md shadow-[#0084FF]/30 shrink-0 cursor-pointer flex items-center justify-center"
                title={language === 'vi' ? 'Gửi tin nhắn' : 'Send message'}
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendThumbsUp}
                className="p-2 rounded-full hover:bg-white/10 text-[#0084FF] hover:scale-110 active:scale-90 transition shrink-0 cursor-pointer flex items-center justify-center text-xl"
                title={language === 'vi' ? 'Gửi nút Thích (Like)' : 'Send thumbs-up (Like)'}
              >
                👍
              </button>
            )}
            </form>
          </div>
        )}

        {/* MODAL: CONTACT DETAILS INFO */}
        {showContactInfoModal && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowContactInfoModal(false);
            }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-[#0B1528] border border-slate-700 p-5 shadow-2xl text-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="font-extrabold text-sm text-white">
                  {language === 'vi' ? 'Hồ sơ Campus Messenger' : 'Campus Messenger Profile'}
                </h4>
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
                  <span>{language === 'vi' ? 'Trạng thái:' : 'Status:'}</span>
                  <span className="text-[#E0FAEB] font-bold">{activeContact.lastActiveText}</span>
                </div>
                <div className="flex items-center justify-between text-[#C5E5EC]/70">
                  <span>{language === 'vi' ? 'Bảo chứng GigMe:' : 'GigMe Verified:'}</span>
                  <span className="text-[#C5E5EC] font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Đã định danh sinh viên' : 'Verified Student'}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowContactInfoModal(false);
                  handleStartVoiceCall();
                }}
                className="w-full mt-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#3064AE] via-[#417AC6] to-[#C5E5EC] hover:brightness-110 text-white font-extrabold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-[#3064AE]/30 border border-[#E0FAEB]/30 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>{language === 'vi' ? 'Gọi Thoại Miễn Phí' : 'Free Voice Call'}</span>
              </button>
            </div>
          </div>
        )}

        {/* IMAGE ZOOM LIGHTBOX (MESSENGER ENHANCED WITH ROTATE & DOWNLOAD) */}
        {previewZoomImage && (
          <div
            onClick={() => setPreviewZoomImage(null)}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-fadeIn"
          >
            <div
              className="relative max-w-4xl max-h-[88vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image Toolbar */}
              <div className="absolute -top-12 right-0 flex items-center space-x-2 z-20">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setPreviewImageRotation((prev) => (prev + 90) % 360);
                  }}
                  className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 transition hover:scale-105 cursor-pointer shadow"
                  title={language === 'vi' ? 'Xoay ảnh 90°' : 'Rotate 90°'}
                >
                  <RotateCw className="w-4 h-4 text-[#00E5FF]" />
                </button>
                <a
                  href={previewZoomImage}
                  download="gigme-chat-photo.jpg"
                  onClick={() => triggerHaptic('success')}
                  className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 transition hover:scale-105 cursor-pointer shadow"
                  title={language === 'vi' ? 'Tải ảnh về máy' : 'Download Photo'}
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setPreviewZoomImage(null);
                  }}
                  className="p-2 rounded-full bg-slate-900/80 hover:bg-red-500/80 text-white border border-white/20 transition hover:scale-105 cursor-pointer shadow"
                  title={language === 'vi' ? 'Đóng xem ảnh' : 'Close preview'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Rotatable Image View */}
              <img
                src={previewZoomImage}
                alt="Zoom"
                style={{ transform: `rotate(${previewImageRotation}deg)` }}
                className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl transition-transform duration-200"
              />
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
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 flex flex-col h-[calc(100vh-4rem)] pb-24 text-slate-100">
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
              <span>{language === 'vi' ? 'Đoạn chat' : 'Chats'}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#3064AE]/30 text-[#C5E5EC] text-[10px] font-bold border border-[#C5E5EC]/25">
                {campusContacts.length}
              </span>
              {totalUnreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#E0FAEB] text-[#09111D] text-[10px] font-black border border-[#09111D] shadow-sm animate-pulse">
                  {totalUnreadCount > 9 ? '9+' : totalUnreadCount} {language === 'vi' ? 'mới' : 'new'}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-[#C5E5EC]/70">
              {language === 'vi' ? 'Kết nối trực tiếp giữa người thuê & thợ sinh viên' : 'Direct connection between clients & student peers'}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Add Friend Button */}
          <button
            onClick={() => setShowAddFriendModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#3064AE] to-[#255294] hover:from-[#255294] hover:to-[#1d3d6b] text-white border border-[#C5E5EC]/30 font-bold text-xs transition flex items-center space-x-1.5 shadow-md cursor-pointer"
            title={language === 'vi' ? 'Thêm bạn bè qua ID 9 số' : 'Add friend via 9-digit ID'}
          >
            <UserPlus className="w-4 h-4 text-[#E0FAEB]" />
            <span>{t('addFriendBtn')}</span>
          </button>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="p-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC] border border-[#C5E5EC]/20 transition cursor-pointer"
            title={language === 'vi' ? 'Nhắn tin với sinh viên mới' : 'Message new campus student'}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC] border border-[#C5E5EC]/20 font-bold text-xs transition cursor-pointer"
          >
            &larr; {t('back')}
          </button>
        </div>
      </div>

      {/* 9-DIGIT ID SYSTEM & QUICK FRIEND SEARCH - CHỈ HIỆN KHI BẤM NÚT ADDFRIEND */}
      {showAddFriendModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddFriendModal(false);
              setSearchIdError('');
              setFoundUserResult(null);
            }
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/30 p-5 shadow-2xl text-slate-100 flex flex-col space-y-3.5 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#C5E5EC]/15 shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#3064AE]/30 border border-[#C5E5EC]/30 flex items-center justify-center text-[#E0FAEB]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-white">
                  {language === 'vi' ? 'Kết Bạn Qua ID 9 Số' : 'Add Friend via 9-Digit ID'}
                </h3>
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
                <span className="text-xs text-[#C5E5EC]/80 font-bold">
                  {language === 'vi' ? 'ID 9 Số Của Bạn:' : 'Your 9-Digit ID:'}
                </span>
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
                    showNotification(
                      language === 'vi' ? 'Đã sao chép ID' : 'ID Copied',
                      language === 'vi' ? `ID ${currentUser.id} đã được lưu vào bộ nhớ tạm.` : `ID ${currentUser.id} copied to clipboard.`
                    );
                    setTimeout(() => setCopiedMyId(false), 2000);
                  }
                }}
                className="flex items-center space-x-1 text-xs font-bold text-[#E0FAEB] hover:text-white bg-[#0E1B2E] px-2.5 py-1 rounded-xl border border-[#E0FAEB]/30 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>
                  {copiedMyId
                    ? (language === 'vi' ? 'Đã sao chép!' : 'Copied!')
                    : (language === 'vi' ? 'Sao chép ID' : 'Copy ID')}
                </span>
              </button>
            </div>

            {/* Search Friend By 9-digit ID Input */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-[#C5E5EC]/90 block">
                {language === 'vi' ? 'Tìm bạn mới bằng mã ID:' : 'Find friend by ID code:'}
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
                  placeholder={
                    language === 'vi'
                      ? 'Nhập ID 9 số để tìm bạn (000000000 -> 999999999)...'
                      : 'Enter 9-digit ID to find peers (000000000 -> 999999999)...'
                  }
                  className="flex-1 px-3 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-xs text-white placeholder:text-[#C5E5EC]/40 focus:border-[#3064AE] outline-none font-mono"
                />
                <button
                  onClick={handleSearchById}
                  className="px-3.5 py-2.5 rounded-xl bg-[#3064AE] hover:bg-[#255294] text-white font-bold text-xs border border-[#C5E5EC]/30 transition flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Tìm ID' : 'Search ID'}</span>
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
                      <p className="text-[10px] text-[#C5E5EC]/70 truncate">
                        {foundUserResult.studentSchool || (language === 'vi' ? 'Sinh viên Campus' : 'Campus Student')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {currentUser?.friendIds?.includes(foundUserResult.id) ? (
                      <span className="text-[11px] text-emerald-400 font-bold px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/30">
                        ✓ {language === 'vi' ? 'Bạn bè' : 'Friend'}
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          if (addFriendById) addFriendById(foundUserResult.id);
                          showNotification(
                            language === 'vi' ? 'Kết bạn' : 'Add Friend',
                            language === 'vi' ? `Đã thêm ${foundUserResult.name} vào danh bạ.` : `Added ${foundUserResult.name} to contacts.`
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-[#E0FAEB] border border-emerald-500/40 text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>{language === 'vi' ? 'Kết bạn' : 'Add Friend'}</span>
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
                      <span>{language === 'vi' ? 'Nhắn' : 'Chat'}</span>
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
                <span>{language === 'vi' ? 'Sao lưu danh bạ Cloud' : 'Cloud Backup Contacts'}</span>
              </button>
              <button
                onClick={() => {
                  setShowAddFriendModal(false);
                  setShowTermsModal(true);
                }}
                className="py-2 px-2.5 rounded-xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/25 text-[#E0FAEB] hover:text-white text-[11px] font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#E0FAEB]" />
                <span>{language === 'vi' ? 'Điều khoản & Hoàn tiền' : 'Terms & Refunds'}</span>
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
          placeholder={t('searchContactsPlaceholder')}
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
          {t('onlineNow')} ({campusContacts.filter((c) => c.isOnline).length})
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
              {language === 'vi' ? 'Trợ lý AI' : 'AI Assistant'}
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
          {language === 'vi' ? 'Tất cả' : 'All'} ({campusContacts.length + 1})
        </button>
        <button
          onClick={() => setActiveFilterTab('CLIENTS')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeFilterTab === 'CLIENTS'
              ? 'bg-[#3064AE] text-white border border-[#C5E5EC]/30 shadow-md shadow-[#3064AE]/30'
              : 'bg-[#12233B] text-[#C5E5EC] border border-[#C5E5EC]/20 hover:bg-[#162B48]'
          }`}
        >
          💼 {language === 'vi' ? 'Người thuê' : 'Clients'} ({campusContacts.filter((c) => c.role === 'CLIENT').length})
        </button>
        <button
          onClick={() => setActiveFilterTab('WORKERS')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeFilterTab === 'WORKERS'
              ? 'bg-[#3064AE] text-white border border-[#C5E5EC]/30 shadow-md shadow-[#3064AE]/30'
              : 'bg-[#12233B] text-[#C5E5EC] border border-[#C5E5EC]/20 hover:bg-[#162B48]'
          }`}
        >
          ⚡ {language === 'vi' ? 'Người làm' : 'Workers'} ({campusContacts.filter((c) => c.role === 'WORKER').length})
        </button>
        <button
          onClick={() => setActiveConversationId('AI_ASSISTANT')}
          className="px-3 py-1 rounded-xl text-xs font-bold bg-[#3064AE]/20 text-[#C5E5EC] border border-[#C5E5EC]/30 hover:bg-[#3064AE]/30 transition flex items-center space-x-1 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Bot className="w-3.5 h-3.5 text-[#C5E5EC]" />
          <span>{language === 'vi' ? 'Trợ lý AI 24/7' : '24/7 AI Assistant'}</span>
        </button>
      </div>

      {/* CONVERSATION THREADS LIST - ENLARGED SPACIOUS FRAME WITH COMPACT THREAD ITEMS */}
      <div className="flex-1 overflow-y-auto space-y-2 p-3 sm:p-4 rounded-3xl bg-[#0B1728]/95 border-2 border-[#C5E5EC]/30 shadow-2xl shadow-black/50 min-h-[580px] sm:min-h-[660px]">
        {/* PINNED: 24/7 AI CAMPUS ASSISTANT */}
        {(activeFilterTab === 'ALL' || activeFilterTab === 'AI') && (
          <div
            onClick={() => setActiveConversationId('AI_ASSISTANT')}
            className="p-3 sm:p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/25 hover:border-[#C5E5EC]/60 hover:bg-[#162D4A] cursor-pointer transition shadow-sm flex items-center justify-between space-x-3 group"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-[#3064AE] via-[#417AC6] to-[#C5E5EC] flex items-center justify-center text-white font-extrabold shadow border border-[#C5E5EC]/30">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#E0FAEB] border-2 border-[#09111D] animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-sm text-white truncate group-hover:text-[#C5E5EC] transition">
                    {language === 'vi' ? 'Trợ Lý AI GigMe 24/7' : 'GigMe 24/7 AI Assistant'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-[#3064AE]/40 text-[#C5E5EC] font-semibold text-[10px] shrink-0 border border-[#C5E5EC]/30">
                    Official AI
                  </span>
                </div>
                <p className="text-xs text-[#C5E5EC]/80 truncate mt-0.5">
                  {language === 'vi'
                    ? 'Hỏi đáp Smart Escrow, giải ngân Napas 247, quy chế campus...'
                    : 'Smart Escrow Q&A, Napas 247 disbursement, campus rules...'}
                </p>
              </div>
            </div>
            <span className="text-[11px] text-[#E0FAEB] font-bold shrink-0 bg-[#E0FAEB]/15 px-2.5 py-1 rounded-lg border border-[#E0FAEB]/30">
              {language === 'vi' ? 'Trực tuyến' : 'Online'}
            </span>
          </div>
        )}

        {/* CONTACTS THREADS (HIRERS & WORKERS) */}
        {filteredContacts.length === 0 ? (
          <div className="text-center py-16 text-[#C5E5EC]/60 text-xs">
            <MessageCircle className="w-10 h-10 mx-auto mb-2 text-[#C5E5EC]/40" />
            <p className="font-bold text-sm text-[#C5E5EC]">
              {language === 'vi' ? 'Không tìm thấy liên hệ phù hợp.' : 'No matching contacts found.'}
            </p>
            <p className="text-xs text-[#C5E5EC]/60 mt-1">
              {language === 'vi'
                ? 'Bấm nút (+) ở góc trên để tìm kiếm và nhắn tin với sinh viên khác!'
                : 'Tap (+) button above to find and message other students!'}
            </p>
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const lastMsg = getLastMessageForContact(contact.id, contact.associatedGig?.id);
            const unreadCount = getUnreadCountForContact(contact.id, contact.associatedGig?.id);
            const previewText = lastMsg
              ? lastMsg.message ||
                (lastMsg.attachmentType === 'IMAGE'
                  ? (language === 'vi' ? '📷 Hình ảnh' : '📷 Photo')
                  : (language === 'vi' ? '🎙️ Tin nhắn thoại' : '🎙️ Voice message'))
              : contact.specialtyOrNeed;
            const timeText = lastMsg
              ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : contact.isOnline
              ? (language === 'vi' ? 'Vừa xong' : 'Just now')
              : '';

            return (
              <div
                key={contact.id}
                onClick={() => handleSelectContact(contact.id)}
                className={`p-2.5 sm:p-3 rounded-2xl transition shadow-sm flex items-center justify-between space-x-3 group cursor-pointer ${
                  unreadCount > 0
                    ? 'bg-[#152744] hover:bg-[#1a335a] border-2 border-[#C5E5EC]/60 shadow-[#3064AE]/20'
                    : 'bg-[#12233B]/90 hover:bg-[#162D4A] border border-[#C5E5EC]/20 hover:border-[#C5E5EC]/50'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {/* Avatar with Status & Unread Dot */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr ${contact.avatarBg} flex items-center justify-center text-white font-extrabold text-sm shadow border border-[#C5E5EC]/25 overflow-hidden`}
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
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#E0FAEB] border-2 border-[#09111D]" />
                    )}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E0FAEB] text-[#09111D] text-[10px] font-black flex items-center justify-center shadow-md animate-pulse border border-[#09111D]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Contact Info & Message Preview */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 min-w-0">
                      <h4 className={`font-bold text-sm truncate group-hover:text-[#C5E5EC] transition ${unreadCount > 0 ? 'text-white font-black' : 'text-slate-100'}`}>
                        {contact.name}
                      </h4>
                      {(contact.isCccdVerified || contact.isEduVerified) && (
                        <VerifiedIdentityBadge
                          isCccdVerified={!!contact.isCccdVerified}
                          isStudentVerified={!!contact.isEduVerified}
                          school={contact.school}
                          size="sm"
                          showText={false}
                        />
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                          contact.role === 'CLIENT'
                            ? 'bg-[#3064AE]/30 text-[#C5E5EC] border border-[#C5E5EC]/30'
                            : 'bg-[#E0FAEB]/20 text-[#E0FAEB] border border-[#E0FAEB]/30'
                        }`}
                      >
                        {contact.roleLabel}
                      </span>
                    </div>

                    <p className={`text-xs truncate mt-0.5 ${unreadCount > 0 ? 'text-[#C5E5EC] font-bold' : 'text-[#C5E5EC]/75'}`}>
                      {previewText}
                    </p>

                    {/* Micro-tag if there is a shared gig */}
                    {contact.associatedGig && (
                      <p className="text-[11px] text-[#C5E5EC] font-medium truncate mt-0.5">
                        💼 {contact.associatedGig.title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Metadata */}
                <div className="text-right shrink-0 flex flex-col items-end space-y-1 pl-2">
                  <span className={`text-[11px] font-medium ${unreadCount > 0 ? 'text-[#E0FAEB] font-bold' : 'text-[#C5E5EC]/70'}`}>
                    {timeText}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#E0FAEB] text-[#09111D] text-[9px] font-extrabold">
                        {language === 'vi' ? 'Mới' : 'New'}
                      </span>
                    )}
                    <span className="text-[10px] text-[#C5E5EC]/90 font-medium bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                      {contact.school}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: START NEW CHAT WITH ANY STUDENT */}
      {showNewChatModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewChatModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/30 p-5 shadow-2xl text-slate-100 flex flex-col max-h-[80vh]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#C5E5EC]/15 shrink-0">
              <h4 className="font-extrabold text-sm text-white flex items-center space-x-1.5">
                <MessageCircle className="w-4 h-4 text-[#C5E5EC]" />
                <span>{language === 'vi' ? 'Soạn tin nhắn mới' : 'Compose New Message'}</span>
              </h4>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-full text-[#C5E5EC]/70 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#C5E5EC]/70 my-2 shrink-0">
              {language === 'vi'
                ? 'Chọn người thuê hoặc người làm để bắt đầu cuộc trò chuyện trực tiếp:'
                : 'Select a client or worker to start a direct conversation:'}
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
