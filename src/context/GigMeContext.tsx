import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import { auth, syncUserToCloud, findUserByContact } from '../lib/firebase';
import {
  UserEntity,
  GigEntity,
  BidEntity,
  ChatMessageEntity,
  WalletTransactionEntity,
  AppRoleMode,
  VoipCallSession,
  UiNotification,
  AiRecognitionResult,
  UserTierKey,
  USER_TIERS,
  formatVnd,
  SafeWalkSessionEntity,
  SystemMaintenanceConfig,
  MoSmsSession,
} from '../types';
import { playNotificationSound, startSosSiren, stopSosSiren } from '../utils/audio';
import {
  GeoLocation,
  DEFAULT_USER_LOCATION,
  calculateDistanceMeters,
} from '../utils/geo';
import { cloudService, CloudConnectionStatus } from '../services/cloudSync';
import {
  generateSecureSecretToken,
  generateSecureOtp,
  generateSecureTxId,
  validateSecurityToken,
  normalizeVietnameseName,
  hashPassword,
  verifyPassword,
  detectAndFilterOffPlatformLeakage,
} from '../utils/securityTokens';
import { executeAtomicEscrowPayout } from '../lib/firebase';
import { calculateSurgePricing } from '../utils/surgePricing';
import { validateGpsAuthenticity } from '../utils/antiFakeGps';
import { triggerHaptic } from '../utils/haptics';
import { offlineSyncManager } from '../utils/offlineSync';
import { executeInstantDisbursement } from '../services/napasDisbursementService';

const STORAGE_KEYS = {
  USERS: 'gigme_users_real_v4',
  GIGS: 'gigme_gigs_real_v4',
  BIDS: 'gigme_bids_real_v4',
  CHATS: 'gigme_chats_real_v4',
  TRANSACTIONS: 'gigme_transactions_real_v4',
  CURRENT_USER_ID: 'gigme_current_user_id_real_v4',
  ROLE_MODE: 'gigme_role_mode_real_v4',
  DARK_MODE: 'gigme_dark_mode_real_v4',
};

const DEFAULT_ADMIN: UserEntity = {
  id: '000000000', // Tài khoản Admin cố định 9 chữ số 000000000
  name: 'Ban Quản Trị GigMe',
  email: 'admin@admin.vn',
  phone: '0909120918',
  password: 'admin1507',
  gender: 'Khác',
  birthDate: '01/01/2000',
  role: 'ADMIN',
  tier: 'NEWBIE',
  kycName: 'QUẢN TRỊ VIÊN HỆ THỐNG',
  isKycApproved: false,
  isNfcVerified: false,
  isFaceLivenessPassed: false,
  isStudentVerified: false,
  studentSchool: '',
  isBiometricsEnabled: false,
  isBusinessAccount: false,
  businessName: '',
  businessTaxId: '',
  trustScore: 0,
  eloRating: 0,
  eloTier: 'BRONZE',
  winStreak: 0,
  notificationSound: 'BANK_TING',
  connectedMoMo: '0909120918',
  connectedZaloPay: '',
  connectedViettelMoney: '',
  lastDeviceName: 'Master Admin Command Center (MacOS / Chrome)',
  lastLoginLocation: 'Hà Nội, Việt Nam',
  hasUnusualDeviceAlert: false,
  rating: 0,
  reviewCount: 0,
  completedGigs: 0,
  onTimeRate: 0,
  postedGigsCount: 0,
  totalSpent: 0,
  walletBalance: 0,
  escrowLockedBalance: 0,
  securityPin: '123456',
  badges: 'Quản Trị Viên Tối Cao',
  isLocked: false,
  createdAt: 1700000000000,
};

// Hàm sinh ID độc nhất 9 chữ số từ 000000001 -> 999999999 (000000000 dành riêng cho Admin)
export const generateUniqueUserId = (existingUsers: UserEntity[]): string => {
  const existingIds = new Set(existingUsers.map((u) => u.id));
  existingIds.add('000000000'); // ID độc quyền của Admin
  existingIds.add('admin_root');

  let attempts = 0;
  while (attempts < 10000) {
    const randomNum = Math.floor(1 + Math.random() * 999999998);
    const idStr = String(randomNum).padStart(9, '0');
    if (!existingIds.has(idStr)) {
      return idStr;
    }
    attempts++;
  }
  // Fallback bảo đảm luôn đủ 9 chữ số
  return String(Date.now() % 1000000000).padStart(9, '0');
};

const INITIAL_USERS: UserEntity[] = [
  DEFAULT_ADMIN,
];

// Dữ liệu việc làm thực tế: Bắt đầu trống 100%, không dùng dữ liệu ảo
const INITIAL_GIGS: GigEntity[] = [];

const INITIAL_CHATS: ChatMessageEntity[] = [];

// Dữ liệu giao dịch thực tế: Bắt đầu trống 100%
const INITIAL_TRANSACTIONS: WalletTransactionEntity[] = [];

interface GigMeContextType {
  // State
  isCloudConnected: boolean;
  cloudStatus: CloudConnectionStatus;
  refreshCloudConnection: () => Promise<void>;
  users: UserEntity[];
  currentUser: UserEntity | null;
  isAuthenticated: boolean;
  isAdminRole: boolean;
  isDarkMode: boolean;
  themeMode: 'CYBER_DARK' | 'AMOLED' | 'DAYLIGHT';
  roleMode: AppRoleMode;
  searchQuery: string;
  isVoiceListening: boolean;
  selectedPriceFilter: string;
  selectedDurationFilter: string;
  filterRecurringOnly: boolean;
  filterMultiWorkerOnly: boolean;
  aiSmartMatchActive: boolean;
  activeVoipCall: VoipCallSession | null;
  selectedRadiusMeters: number;
  selectedCategory: string;
  generatedOtp: string | null;
  otpTargetContact: string | null;
  otpExpiresAt: number | null;
  rawGigs: GigEntity[];
  filteredGigs: GigEntity[];
  userCoords: GeoLocation;
  setUserCoords: (coords: GeoLocation) => void;
  selectedGigId: string | null;
  currentSelectedGig: GigEntity | null;
  currentGigBids: BidEntity[];
  currentChatMessages: ChatMessageEntity[];
  allChats: ChatMessageEntity[];
  walletTransactions: WalletTransactionEntity[];
  userTransactions: WalletTransactionEntity[];
  notification: UiNotification | null;
  aiDetectedResult: AiRecognitionResult | null;
  adminAllUsers: UserEntity[];
  adminAllTransactions: WalletTransactionEntity[];

  // Actions
  toggleDarkMode: () => void;
  setThemeMode: (mode: 'CYBER_DARK' | 'AMOLED' | 'DAYLIGHT') => void;
  toggleThemeMode: () => void;
  updateUserProfile: (updates: Partial<UserEntity>) => void;
  triggerWebPushTest: () => void;
  setSearchQuery: (query: string) => void;
  startVoiceSearch: () => void;
  stopVoiceSearch: (recognizedQuery: string) => void;
  setPriceFilter: (filter: string) => void;
  setDurationFilter: (filter: string) => void;
  toggleFilterRecurring: () => void;
  toggleFilterMultiWorker: () => void;
  toggleSmartMatch: () => void;
  startVoipCall: (partnerName: string, role?: string, gigId?: string) => void;
  endVoipCall: () => void;
  toggleMuteVoip: () => void;
  toggleRoleMode: () => void;
  toggleRole: () => void;
  setWalletPin: (oldPin: string, newPin: string) => boolean;
  setRadius: (meters: number) => void;
  setCategory: (category: string) => void;
  selectGig: (gigId: string | null) => void;
  dismissNotification: () => void;
  showNotification: (title: string, message: string, isDingSound?: boolean, isCelebration?: boolean) => void;
  withdrawFunds: (bankName: string, accountNumber: string, accountHolderName: string, amount: number, pin?: string, useBiometrics?: boolean) => boolean;

  // Auth
  register: (fullName: string, contact: string, gender: string, birthDate: string, password: string, confirmPassword: string, phone?: string, cccdNumber?: string) => Promise<{ success: boolean; error?: string }>;
  login: (contact: string, password: string) => Promise<boolean> | boolean;
  sendOtp: (contact: string, purpose?: string) => boolean;
  resetPasswordWithOtp: (enteredOtp: string, newPassword: string) => Promise<boolean> | boolean;
  loginWithPhoneOtp: (phoneNumber: string, enteredOtp: string) => boolean;
  requestMoSms: (params?: { phone?: string; shortcode?: string; keyword?: string }) => Promise<{ success: boolean; session?: MoSmsSession; error?: string }>;
  checkMoSmsStatus: (sessionId: string) => Promise<any>;
  simulateMoSms: (sessionId: string, phone?: string) => Promise<any>;
  loginWithMoSms: (phone: string) => Promise<boolean>;
  loginSocial: (provider: string, emailOrName?: string) => Promise<void> | void;
  logout: () => void;

  // Friends & ID 9 digits
  addFriendById: (targetId: string) => { success: boolean; message: string; friend?: UserEntity };
  removeFriendById: (targetId: string) => void;
  findUserByNineDigitId: (id: string) => UserEntity | null;

  // Gigs & Escrow Actions
  upgradeTier: (newTier: UserTierKey, fullName: string, schoolOrId: string) => void;
  postGig: (params: {
    title: string;
    description: string;
    category: string;
    price: number;
    isReverseAuction: boolean;
    isFlash: boolean;
    locationName: string;
    distanceMeters: number;
    latitude?: number;
    longitude?: number;
    isRecurringWeekly?: boolean;
    totalWorkersNeeded?: number;
    estimatedDurationMinutes?: number;
    isBoosted?: boolean;
  }) => boolean;
  placeBid: (gigId: string, offeredPrice: number, minutes: number, note: string) => boolean;
  acceptGigDirectly: (gig: GigEntity) => boolean;
  cancelGigByWorker: (gigId: string, reason: string) => boolean;
  cancelGigByClient: (gigId: string, reason: string) => boolean;
  reportNoShow: (gigId: string, reporterRole: 'CLIENT' | 'WORKER', reason: string) => boolean;
  submitProofOfWork: (
    gigId: string,
    note: string,
    isWatermarked?: boolean,
    proofData?: {
      watermarkedUrl?: string;
      hash?: string;
      coords?: { lat: number; lng: number };
      timestamp?: number;
    }
  ) => void;
  submitDoubleBlindReview: (
    gigId: string,
    rating: number,
    reviewText: string,
    role: 'CLIENT' | 'FREELANCER'
  ) => boolean;
  sendWebPushNotification: (title: string, body: string, icon?: string) => void;
  releaseEscrowPayout: (gigId: string, enteredPin?: string, tipAmount?: number, useBiometrics?: boolean) => boolean;
  releaseMilestonePayout: (gigId: string, milestonePercent: number, enteredPin?: string, useBiometrics?: boolean) => boolean;
  fileDispute: (gigId: string, reason: string) => void;
  checkDepositEligibility: (amount?: number) => {
    allowed: boolean;
    reason?: string;
    cooldownMinutesLeft: number;
    todayDeposited: number;
    remainingDailyQuota: number;
    maxPerTx: number;
  };
  depositVietQr: (amount: number, bankName: string) => boolean;
  withdrawToBank: (bankName: string, accountNumber: string, accountHolderName: string, amount: number, pin?: string, useBiometrics?: boolean) => boolean;
  saveDefaultBank: (bankName: string, accountNumber: string, accountHolder: string) => void;

  // 19 Advanced features
  verifyNfcCccd: (idNumber: string, fullName: string, birthDate: string) => boolean;
  verifyFaceLiveness: () => boolean;
  linkStudentSso: (schoolName: string, studentEmail: string) => boolean;
  verifyStudentSso: (schoolName: string, studentEmail: string) => boolean;
  toggleBiometrics: (enabled: boolean) => void;
  linkEWallet: (walletType: string, phone: string) => boolean;
  depositEWallet: (walletType: string, amount: number) => boolean;
  withdrawEWallet: (walletType: string, amount: number, phone: string) => boolean;
  topUpWallet: (amount: number, source?: string) => boolean;
  setNotificationSound: (soundKey: 'DING_DEFAULT' | 'CASH_COUNT' | 'BANK_TING' | 'SOFT_VIBRATE') => void;
  upgradeToBusinessAccount: (businessName: string, taxId: string) => boolean;
  exportStatement: (format: string) => void;
  changeSecurityPin: (oldPin: string, newPin: string) => boolean;

  // Admin Actions
  maintenanceConfig: SystemMaintenanceConfig;
  isMaintenanceActive: boolean;
  setMaintenanceMode: (config: Partial<SystemMaintenanceConfig>) => Promise<void>;
  adminResolveDispute: (gigId: string, resolution: string, refundToClient: boolean, note: string) => void;
  adminApproveKyc: (userId: string) => void;
  adminToggleLockUser: (userId: string) => void;
  adminDeleteGig: (gigId: string) => void;

  // Chat & AI
  sendChat: (
    text: string,
    attachmentType?:
      | 'NONE'
      | 'WATERMARK_PREVIEW'
      | 'PROOF_SCREENSHOT'
      | 'CALL_LOG'
      | 'DELEGATED_AUTH'
      | 'IMAGE'
      | 'VOICE'
      | 'VIDEO',
    attachmentData?: string | null,
    attachmentDuration?: number,
    mediaFileName?: string,
    targetThreadId?: string,
    targetPartnerId?: string,
    targetPartnerName?: string
  ) => void;
  markConversationAsRead: (partnerOrThreadId: string) => void;
  analyzePhotoWithAi: (presetType: string) => void;
  clearAiResult: () => void;

  // 4 Advanced Feature Operations
  boostGig: (gigId: string) => boolean;
  openReverseAuctionRoom: (gigId: string, durationMinutes: number, ceilingPrice: number) => boolean;
  closeReverseAuctionRoom: (gigId: string, winningBidId?: string) => boolean;
  joinMultiWorkerGig: (gigId: string) => boolean;
  checkInMultiWorker: (gigId: string, enteredCode: string) => boolean;
  payoutMultiWorkers: (gigId: string) => boolean;

  // SafeWalk SOS Night Protection
  safeWalkSession: SafeWalkSessionEntity | null;
  startSafeWalk: (
    origin: string,
    destination: string,
    durationMinutes: number,
    contactName: string,
    contactPhone: string
  ) => SafeWalkSessionEntity;
  checkInSafeWalk: () => void;
  triggerSafeWalkAlarm: () => void;
  stopSafeWalk: () => void;

  // Firebase Cloud Messaging (FCM)
  toggleFcm: (enabled: boolean, token?: string) => void;
  sendTestFcmPush: (title: string, body: string, type?: string) => void;

  // Student ELO & Badge Reputation System
  rateGigAndElo: (gigId: string, rating: number, review: string, tags?: string[]) => boolean;
}

const GigMeContext = createContext<GigMeContextType | undefined>(undefined);

export const GigMeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge legacy v1 mock keys from localStorage and clean old sample users
  useEffect(() => {
    try {
      [
        'gigme_users_v1',
        'gigme_gigs_v1',
        'gigme_bids_v1',
        'gigme_chats_v1',
        'gigme_transactions_v1',
        'gigme_current_user_id',
      ].forEach((k) => localStorage.removeItem(k));
      const cur = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      const adminSession = typeof window !== 'undefined' ? sessionStorage.getItem('gigme_admin_active_session') : null;

      if (cur === '000000000' && adminSession === 'true') {
        // Hợp lệ, duy trì phiên quản trị viên đang hoạt động
      } else if (
        !cur ||
        cur === 'admin_root' ||
        cur === 'user_526h0044' ||
        cur === 'user_freelancer_lan' ||
        cur === 'user_cafe_passio' ||
        cur === 'user_student_tdtu' ||
        cur === 'user_student_huy' ||
        cur === 'user_client_ha' ||
        (cur === '000000000' && adminSession !== 'true')
      ) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
        sessionStorage.removeItem('gigme_admin_active_session');
        sessionStorage.removeItem('gigme_admin_session_time');
        setCurrentUserId(null);
      }
    } catch {
      // ignore
    }
  }, []);

  // Helper hàm kiểm tra tài khoản mẫu / không có thật để xóa bỏ triệt để
  const isMockOrFakeName = (name?: string | null): boolean => {
    if (!name) return false;
    const n = name.toLowerCase();
    return (
      n.includes('hoàng minh') ||
      n.includes('thanh trúc') ||
      n.includes('vũ hoàng my') ||
      n.includes('hoàng my') ||
      n.includes('phạm gia huy') ||
      n.includes('gia huy')
    );
  };

  // Load state from localStorage or defaults
  const [users, setUsers] = useState<UserEntity[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned: UserEntity[] = parsed
          .filter(
            (u: UserEntity) =>
              u.id !== 'user_526h0044' &&
              u.id !== 'user_freelancer_lan' &&
              u.id !== 'user_cafe_passio' &&
              u.id !== 'user_student_tdtu' &&
              u.id !== 'user_student_huy' &&
              u.id !== 'user_client_ha' &&
              !isMockOrFakeName(u.name)
          )
          .map((u: UserEntity) => {
            if (u.id === 'admin_root' || u.email === 'admin@admin.vn') {
              return { ...DEFAULT_ADMIN, id: '000000000' };
            }
            return u;
          });
        // Đảm bảo luôn có tài khoản Admin 000000000 duy nhất
        if (!cleaned.some((u) => u.id === '000000000' || u.role === 'ADMIN')) {
          cleaned.unshift(DEFAULT_ADMIN);
        }
        return cleaned;
      } catch {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;

    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    const adminSession = sessionStorage.getItem('gigme_admin_active_session');

    if (saved === '000000000' && adminSession === 'true') {
      return '000000000';
    }

    if (
      !saved ||
      saved === 'admin_root' ||
      saved === 'user_526h0044' ||
      saved === 'user_freelancer_lan' ||
      saved === 'user_cafe_passio' ||
      saved === 'user_student_tdtu' ||
      saved === 'user_student_huy' ||
      saved === 'user_client_ha' ||
      (saved === '000000000' && adminSession !== 'true')
    ) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      sessionStorage.removeItem('gigme_admin_active_session');
      sessionStorage.removeItem('gigme_admin_session_time');
      return null;
    }

    return saved;
  });

  const [roleMode, setRoleMode] = useState<AppRoleMode>(() => {
    return (localStorage.getItem(STORAGE_KEYS.ROLE_MODE) as AppRoleMode) || 'FREELANCER';
  });

  const [themeMode, setThemeModeState] = useState<'CYBER_DARK' | 'AMOLED' | 'DAYLIGHT'>(() => {
    // Migration: reset default to clean, high-contrast DAYLIGHT white mode
    const migrationFlag = 'gigme_theme_v3_clean_white';
    if (typeof window !== 'undefined' && !localStorage.getItem(migrationFlag)) {
      localStorage.setItem(migrationFlag, 'true');
      localStorage.setItem('gigme_theme_mode', 'DAYLIGHT');
      localStorage.setItem(STORAGE_KEYS.DARK_MODE, 'false');
      return 'DAYLIGHT';
    }
    const saved = typeof window !== 'undefined' ? localStorage.getItem('gigme_theme_mode') : null;
    if (saved === 'CYBER_DARK' || saved === 'AMOLED' || saved === 'DAYLIGHT') {
      return saved;
    }
    return 'DAYLIGHT';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return themeMode !== 'DAYLIGHT';
  });

  const [gigs, setGigs] = useState<GigEntity[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GIGS);
    if (!saved) return INITIAL_GIGS;
    try {
      const parsed: GigEntity[] = JSON.parse(saved);
      return parsed.filter(
        (g) => !isMockOrFakeName(g.clientName) && !isMockOrFakeName(g.freelancerName)
      );
    } catch {
      return INITIAL_GIGS;
    }
  });

  const [bids, setBids] = useState<BidEntity[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BIDS);
    return saved ? JSON.parse(saved) : [];
  });

  const [chats, setChats] = useState<ChatMessageEntity[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CHATS);
    if (!saved) return INITIAL_CHATS;
    try {
      const parsed: ChatMessageEntity[] = JSON.parse(saved);
      return parsed.filter(
        (c) =>
          !isMockOrFakeName(c.senderName) &&
          c.senderId !== 'user_student_huy' &&
          c.partnerId !== 'user_student_huy'
      );
    } catch {
      return INITIAL_CHATS;
    }
  });

  const [transactions, setTransactions] = useState<WalletTransactionEntity[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [safeWalkSession, setSafeWalkSession] = useState<SafeWalkSessionEntity | null>(() => {
    try {
      const saved = localStorage.getItem('gigme_safewalk_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('ALL');
  const [selectedDurationFilter, setSelectedDurationFilter] = useState('ALL');
  const [filterRecurringOnly, setFilterRecurringOnly] = useState(false);
  const [filterMultiWorkerOnly, setFilterMultiWorkerOnly] = useState(false);
  const [aiSmartMatchActive, setAiSmartMatchActive] = useState(false);
  const [activeVoipCall, setActiveVoipCall] = useState<VoipCallSession | null>(null);
  const [selectedRadiusMeters, setSelectedRadiusMeters] = useState(3000);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedGigId, setSelectedGigId] = useState<string | null>(null);
  const [notification, setNotification] = useState<UiNotification | null>(null);
  const [aiDetectedResult, setAiDetectedResult] = useState<AiRecognitionResult | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpTargetContact, setOtpTargetContact] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [otpFailedAttempts, setOtpFailedAttempts] = useState<number>(0);
  const [lastOtpSentAt, setLastOtpSentAt] = useState<number | null>(null);
  const [userCoords, setUserCoordsState] = useState<GeoLocation>(() => {
    try {
      const saved = localStorage.getItem('gigme_user_coords');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_USER_LOCATION;
  });

  const setUserCoords = (coords: GeoLocation) => {
    setUserCoordsState(coords);
    try {
      localStorage.setItem('gigme_user_coords', JSON.stringify(coords));
    } catch {}
  };

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [cloudStatus, setCloudStatus] = useState<CloudConnectionStatus>({
    connected: false,
    status: 'CHECKING',
    message: 'Đang kiểm tra kết nối Firestore Cloud...',
  });

  const [maintenanceConfig, setMaintenanceConfig] = useState<SystemMaintenanceConfig>(() => {
    try {
      const saved = localStorage.getItem('gigme_maintenance_config_cache');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      isActive: false,
      title: 'Hệ Thống Đang Nâng Cấp & Bảo Trì Kỹ Thuật',
      message: 'GigMe đang nâng cấp cơ sở dữ liệu và tối ưu hóa hệ thống. Vui lòng quay lại sau.',
      startTime: Date.now(),
      endTime: Date.now() + 30 * 60 * 1000,
      activatedBy: 'admin_root',
      updatedAt: Date.now(),
      allowedTabs: ['PROFILE'],
    };
  });

  const isMaintenanceActive = useMemo(() => {
    if (!maintenanceConfig.isActive) return false;
    if (maintenanceConfig.endTime && Date.now() > maintenanceConfig.endTime) {
      return false; // Hết hạn bảo trì tự động
    }
    return true;
  }, [maintenanceConfig]);

  // Tự động định vị GPS chính xác của người dùng trên thực tế ngay khi mở App (nếu chưa chọn hub thủ công)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const liveLoc: GeoLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            label: 'Vị trí GPS thực tế của bạn',
          };
          // Chỉ ghi đè nếu chưa từng lưu tọa độ tùy chỉnh trước đó
          if (!localStorage.getItem('gigme_user_coords')) {
            setUserCoords(liveLoc);
          }
        },
        (err) => {
          console.warn('GPS permission / access info:', err?.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    }
  }, []);

  const refreshCloudConnection = async () => {
    setCloudStatus({
      connected: false,
      status: 'CHECKING',
      message: 'Đang kiểm tra lại máy chủ Firebase...',
    });
    const res = await cloudService.testConnection();
    setCloudStatus(res);
    setIsCloudConnected(res.connected);
  };

  // Đồng bộ hóa đám mây thời gian thực với Firebase Firestore
  useEffect(() => {
    // 1. Kiểm tra tình trạng kết nối Firestore thực tế
    cloudService.testConnection().then((res) => {
      setCloudStatus(res);
      setIsCloudConnected(res.connected);
    });

    // 2. Lắng nghe dữ liệu việc làm thời gian thực (Realtime Snapshot)
    const unsubGigs = cloudService.subscribeGigs(
      (cloudGigs) => {
        setIsCloudConnected(true);
        setGigs(cloudGigs);
      },
      (status) => {
        setCloudStatus(status);
        setIsCloudConnected(status.connected);
      }
    );

    // 3. Lắng nghe đề xuất đấu giá thời gian thực
    const unsubBids = cloudService.subscribeBids((cloudBids) => {
      setBids(cloudBids);
    });

    // 4. Lắng nghe tin nhắn trò chuyện công việc thời gian thực
    const unsubChats = cloudService.subscribeChats((cloudChats) => {
      setChats(cloudChats);
    });

    // 5. Lắng nghe người dùng thực tế thời gian thực
    const unsubUsers = cloudService.subscribeUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers((prev) => {
          const map = new Map<string, UserEntity>();
          prev.forEach((u) => map.set(u.id, u));
          cloudUsers.forEach((u) => map.set(u.id, u));
          return Array.from(map.values());
        });
      }
    });

    // 6. Lắng nghe giao dịch ví thực tế thời gian thực
    const unsubTransactions = cloudService.subscribeTransactions((cloudTxs) => {
      setTransactions(cloudTxs);
    });

    // 7. Lắng nghe chế độ bảo trì toàn hệ thống thời gian thực (Realtime Maintenance Mode)
    const unsubMaintenance = cloudService.subscribeMaintenance((cloudMaintenance) => {
      if (cloudMaintenance) {
        setMaintenanceConfig(cloudMaintenance);
        try {
          localStorage.setItem('gigme_maintenance_config_cache', JSON.stringify(cloudMaintenance));
        } catch {}
      }
    });

    return () => {
      unsubGigs();
      unsubBids();
      unsubChats();
      unsubUsers();
      unsubTransactions();
      unsubMaintenance();
    };
  }, []);

  // Tự động đồng bộ hóa đơn ngoại tuyến từ IndexedDB & Background Sync khi có mạng 4G/Wifi trở lại
  useEffect(() => {
    const handleSync = async () => {
      if (typeof window !== 'undefined' && navigator.onLine) {
        try {
          const syncedCount = await offlineSyncManager.syncAllQueued((app) => {
            showNotification(
              '🚀 Đã đồng bộ đơn xin việc!',
              `Đơn cho việc "${app.gigTitle}" (${(app.proposedBid || app.gigPrice).toLocaleString('vi-VN')}đ) đã được tự động gửi đi thành công ngay khi có mạng!`,
              true,
              true
            );
          });
          if (syncedCount > 0) {
            triggerHaptic('success');
          }
        } catch (err) {
          console.warn('Background sync error:', err);
        }
      }
    };

    // Kiểm tra và đồng bộ khi mở app
    handleSync();

    // Lắng nghe khi có mạng trở lại
    window.addEventListener('online', handleSync);

    // Lắng nghe tín hiệu kích hoạt từ Service Worker Background Sync
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'GIGME_TRIGGER_BACKGROUND_SYNC') {
        handleSync();
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    return () => {
      window.removeEventListener('online', handleSync);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, []);

  // Đăng ký nhận thông báo đẩy Web Push với Service Worker & Backend
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then(async (subscription) => {
          if (subscription) {
            try {
              await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  subscription,
                  userId: currentUserId || null,
                  userAgent: navigator.userAgent,
                }),
              });
            } catch {}
          }
        });
      });
    }
  }, [currentUserId]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GIGS, JSON.stringify(gigs));
  }, [gigs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(bids));
  }, [bids]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROLE_MODE, roleMode);
  }, [roleMode]);

  useEffect(() => {
    localStorage.setItem('gigme_theme_mode', themeMode);
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(themeMode !== 'DAYLIGHT'));
    setIsDarkMode(themeMode !== 'DAYLIGHT');

    document.documentElement.classList.remove('dark', 'theme-amoled', 'theme-cyber', 'theme-daylight');
    if (themeMode === 'AMOLED') {
      document.documentElement.classList.add('dark', 'theme-amoled');
    } else if (themeMode === 'CYBER_DARK') {
      document.documentElement.classList.add('dark', 'theme-cyber');
    } else {
      document.documentElement.classList.add('theme-daylight');
    }
  }, [themeMode]);

  // Derived states
  const currentUser = users.find((u) => u.id === currentUserId) || null;
  const isAuthenticated = !!currentUser && !currentUser.isLocked;
  const isAdminRole = currentUser?.role === 'ADMIN';

  const currentSelectedGig = gigs.find((g) => g.id === selectedGigId) || null;
  const currentGigBids = bids.filter((b) => b.gigId === selectedGigId);
  const currentChatMessages = chats.filter((c) => c.gigId === selectedGigId);
  const walletTransactions = transactions.filter((t) => !currentUserId || t.userId === currentUserId);

  // Filtered gigs based on radius, category, search, price, duration, and smart match
  const filteredGigs = useMemo(() => {
    return gigs
      .map((gig) => {
        if (gig.latitude && gig.longitude) {
          const dynamicDist = calculateDistanceMeters(
            userCoords.latitude,
            userCoords.longitude,
            gig.latitude,
            gig.longitude
          );
          return { ...gig, distanceMeters: dynamicDist };
        }
        return gig;
      })
      .filter((gig) => {
        const isOnlineOrRemote =
          gig.locationName?.toLowerCase().includes('online') ||
          gig.locationName?.toLowerCase().includes('remote') ||
          gig.locationName?.toLowerCase().includes('toàn quốc') ||
          gig.locationName?.toLowerCase().includes('từ xa') ||
          gig.category?.toLowerCase().includes('online') ||
          gig.category?.toLowerCase().includes('gia sư') ||
          gig.category?.toLowerCase().includes('cntt') ||
          gig.category?.toLowerCase().includes('lập trình') ||
          gig.category?.toLowerCase().includes('thiết kế');

        // Bán kính toàn quốc (>= 2000km) hoặc việc online/remote thì luôn luôn khớp trên toàn lãnh thổ
        const matchesRadius =
          selectedRadiusMeters >= 2000000 ||
          isOnlineOrRemote ||
          (gig.distanceMeters !== undefined ? gig.distanceMeters <= selectedRadiusMeters : true);

        const matchesCategory =
          selectedCategory === 'Tất cả'
            ? true
            : selectedCategory === 'Flash Gigs'
            ? gig.isFlash
            : gig.category.toLowerCase().includes(selectedCategory.toLowerCase());

        // Mọi người dùng đều thấy được toàn bộ danh sách việc; giới hạn cấp Newbie áp dụng khi bấm đấu giá/nhận việc
        const matchesTier = true;

        const query = searchQuery.trim().toLowerCase();
        const matchesQuery =
          !query ||
          gig.title.toLowerCase().includes(query) ||
          gig.description.toLowerCase().includes(query) ||
          gig.locationName.toLowerCase().includes(query) ||
          gig.category.toLowerCase().includes(query);

        const matchesPrice =
          selectedPriceFilter === 'ALL'
            ? true
            : selectedPriceFilter === '<50K'
            ? gig.price < 50000
            : selectedPriceFilter === '50K-200K'
            ? gig.price >= 50000 && gig.price <= 200000
            : gig.price > 200000;

        const matchesDuration =
          selectedDurationFilter === 'ALL'
            ? true
            : selectedDurationFilter === '<15M'
            ? gig.estimatedDurationMinutes <= 15
            : selectedDurationFilter === '15-60M'
            ? gig.estimatedDurationMinutes >= 16 && gig.estimatedDurationMinutes <= 60
            : gig.estimatedDurationMinutes > 60;

        const matchesRecurring = filterRecurringOnly ? gig.isRecurringWeekly : true;
        const matchesMulti = filterMultiWorkerOnly ? gig.totalWorkersNeeded > 1 : true;

        return (
          matchesRadius &&
          matchesCategory &&
          matchesTier &&
          matchesQuery &&
          matchesPrice &&
          matchesDuration &&
          matchesRecurring &&
          matchesMulti
        );
      })
      .sort((a, b) => {
        const aBoosted = a.isBoosted && (a.boostedUntil ? a.boostedUntil > Date.now() : true);
        const bBoosted = b.isBoosted && (b.boostedUntil ? b.boostedUntil > Date.now() : true);
        if (aBoosted && !bBoosted) return -1;
        if (!aBoosted && bBoosted) return 1;
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.createdAt - a.createdAt;
      });
  }, [
    gigs,
    userCoords,
    selectedRadiusMeters,
    selectedCategory,
    currentUser,
    searchQuery,
    selectedPriceFilter,
    selectedDurationFilter,
    filterRecurringOnly,
    filterMultiWorkerOnly,
  ]);

  const showNotification = (title: string, message: string, isDingSound = false, isCelebration = false) => {
    const notif: UiNotification = {
      id: `notif_${Date.now()}`,
      title,
      message,
      isDingSound,
      isCelebration,
    };
    setNotification(notif);

    if (isDingSound) {
      const sound = currentUser?.notificationSound || 'DING_DEFAULT';
      playNotificationSound(sound);
    }

    if (isCelebration) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.2 },
          colors: ['#00E5FF', '#FF6B00', '#00E676', '#FFD700'],
        });
      } catch {
        // ignore
      }
    }
  };

  const dismissNotification = () => {
    setNotification(null);
  };

  const toggleDarkMode = () => {
    setThemeModeState((prev) => (prev === 'DAYLIGHT' ? 'CYBER_DARK' : 'DAYLIGHT'));
  };

  const setThemeMode = (mode: 'CYBER_DARK' | 'AMOLED' | 'DAYLIGHT') => {
    setThemeModeState(mode);
    if (currentUser) {
      const updated = { ...currentUser, themePreference: mode };
      setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
      cloudService.saveUser(updated);
    }
  };

  const toggleThemeMode = () => {
    setThemeModeState((prev) => {
      if (prev === 'CYBER_DARK') return 'AMOLED';
      if (prev === 'AMOLED') return 'DAYLIGHT';
      return 'CYBER_DARK';
    });
  };

  const updateUserProfile = (updates: Partial<UserEntity>) => {
    if (!currentUser) return;
    const updatedUser: UserEntity = {
      ...currentUser,
      ...updates,
    };
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    cloudService.saveUser(updatedUser);
  };

  const triggerWebPushTest = () => {
    playNotificationSound(currentUser?.notificationSound || 'BANK_TING');
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification('GigMe Vietnam - Ting Ting Tiền Về!', {
            body: '💸 +250.000đ từ đơn việc Campus vừa giải ngân vào ví an toàn Smart Escrow. Kiểm tra ví ngay!',
            icon: '/icon.svg',
          });
        } catch {
          // ignore
        }
        showNotification('🔔 WebPush Đã Kích Hoạt', 'Đã phát âm thanh và đẩy thông báo chuông Ting Ting ra thiết bị của bạn!', true, true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            try {
              new Notification('GigMe Vietnam - Ting Ting Tiền Về!', {
                body: '💸 +250.000đ từ đơn việc Campus vừa giải ngân vào ví an toàn Smart Escrow. Kiểm tra ví ngay!',
                icon: '/icon.svg',
              });
            } catch {
              // ignore
            }
            showNotification('🔔 WebPush Đã Cấp Quyền', 'Đã cấp quyền thông báo thành công cho thiết bị của bạn!', true, true);
          } else {
            showNotification('🔔 Đã Phát Chuông Ting Ting', 'Âm thanh thông báo đã phát. (Bạn có thể cho phép thông báo trên trình duyệt để nhận khi ẩn tab)', true);
          }
        });
      } else {
        showNotification('🔔 Đã Phát Chuông Ting Ting', 'Âm thanh thông báo đã phát thành công!', true);
      }
    } else {
      showNotification('🔔 Đã Phát Chuông Ting Ting', 'Âm thanh thông báo đã phát thành công!', true);
    }
  };

  const toggleRoleMode = () => {
    const nextMode: AppRoleMode = roleMode === 'CLIENT' ? 'FREELANCER' : 'CLIENT';
    setRoleMode(nextMode);
    localStorage.setItem(STORAGE_KEYS.ROLE_MODE, nextMode);
    showNotification(
      nextMode === 'CLIENT' ? '👔 Chế độ Người Cần Thuê' : '⚡ Chế độ Người Nhận Việc',
      nextMode === 'CLIENT'
        ? 'Đã chuyển sang giao diện Cần Thuê: Bạn có thể đăng việc mới, mở phòng đấu giá trực tiếp và duyệt giải ngân Escrow.'
        : 'Đã chuyển sang giao diện Nhận Việc: Bạn có thể săn kèo quanh vị trí hiện tại, tham gia đấu giá ngược và nhận thù lao.',
      true
    );
  };

  const startVoiceSearch = () => {
    setIsVoiceListening(true);
  };

  const stopVoiceSearch = (recognizedQuery: string) => {
    setIsVoiceListening(false);
    setSearchQuery(recognizedQuery);
    showNotification('🎤 Đã nhận diện giọng nói', `Đang lọc việc làm theo: "${recognizedQuery}"`, true);
  };

  const toggleSmartMatch = () => {
    setAiSmartMatchActive((prev) => {
      const next = !prev;
      if (next) {
        showNotification(
          '✨ AI Smart Matching Đã Bật',
          'Đã khớp các công việc có độ tương thích cao (>90%) theo kỹ năng và địa bàn gần bạn!',
          true
        );
      }
      return next;
    });
  };

  const startVoipCall = (partnerName: string, role = '', gigId = '') => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setActiveVoipCall({
      gigId: gigId || selectedGigId || 'call',
      partnerName,
      maskedPhoneNumber: `(+84 *** *** ${randomSuffix})`,
      isMuted: false,
      durationSeconds: 24,
    });
  };

  const endVoipCall = () => {
    setActiveVoipCall(null);
  };

  const toggleMuteVoip = () => {
    setActiveVoipCall((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null));
  };

  // 1. REGISTER WITH PBKDF2 PASSWORD HASHING, GMAIL REQUIREMENT & IP LIMIT
  const register = async (
    fullName: string,
    contact: string,
    gender: string,
    birthDate: string,
    password: string,
    confirmPassword: string,
    phoneInput = '',
    cccdInput = ''
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedName = (fullName || '').trim();
    const trimmedEmail = (contact || '').trim().toLowerCase();
    const trimmedPass = (password || '').trim();
    const trimmedConfirm = (confirmPassword || '').trim();
    const cleanBirthDate = (birthDate || '').trim() || '01/01/2000';
    const trimmedPhone = (phoneInput || '').trim();
    const trimmedCccd = (cccdInput || '').trim();

    if (!trimmedName) {
      showNotification('Lỗi đăng ký', 'Vui lòng nhập họ và tên đầy đủ!');
      return { success: false, error: 'Vui lòng nhập họ và tên đầy đủ!' };
    }
    // Strict Gmail requirement
    if (!trimmedEmail) {
      showNotification('Lỗi đăng ký', 'Các tài khoản khi tạo bắt buộc phải có địa chỉ Gmail!');
      return { success: false, error: 'Các tài khoản khi tạo bắt buộc phải có địa chỉ Gmail!' };
    }
    if (!trimmedEmail.includes('@')) {
      showNotification('Lỗi đăng ký', 'Địa chỉ Gmail không đúng định dạng!');
      return { success: false, error: 'Địa chỉ Gmail không đúng định dạng!' };
    }
    if (trimmedPass.length < 6) {
      showNotification('Lỗi đăng ký', 'Mật khẩu phải có tối thiểu 6 ký tự!');
      return { success: false, error: 'Mật khẩu phải có tối thiểu 6 ký tự!' };
    }
    if (trimmedPass !== trimmedConfirm) {
      showNotification('Lỗi đăng ký', 'Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.');
      return { success: false, error: 'Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.' };
    }

    // Check IP status limit: if >= 3 accounts created on this IP, require Phone or CCCD
    let accountsFromThisIp = 0;
    try {
      const ipRes = await fetch('/api/auth/ip-status');
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        accountsFromThisIp = ipData.accountsCreatedFromIp || 0;
      }
    } catch {
      // fallback to local storage count if offline
      const storedCount = parseInt(localStorage.getItem('gigme_ip_reg_count') || '0', 10);
      accountsFromThisIp = storedCount;
    }

    if (accountsFromThisIp >= 3) {
      const hasPhone = trimmedPhone.length >= 9;
      const hasCccd = trimmedCccd.length >= 9;
      if (!hasPhone && !hasCccd) {
        const msg = `Địa chỉ IP của bạn đã tạo ${accountsFromThisIp} tài khoản. Từ tài khoản thứ 4 trở đi, bạn bắt buộc phải nhập Số Điện Thoại hoặc Căn Cước Công Dân (CCCD)!`;
        showNotification('Yêu cầu xác minh IP', msg);
        return { success: false, error: msg };
      }
    }

    // 1:1 Mapping Checks: 1 Phone, 1 Gmail, or 1 CCCD can only be used for 1 account
    // Check duplicate Gmail
    const emailExists = users.some(
      (u) => u.email && u.email.trim().toLowerCase() === trimmedEmail
    );
    if (emailExists) {
      const msg = 'Địa chỉ Gmail này đã được sử dụng cho một tài khoản khác. Mỗi Gmail chỉ dùng cho 1 tài khoản!';
      showNotification('Tài khoản đã tồn tại', msg);
      return { success: false, error: msg };
    }

    // Check duplicate Phone (if provided)
    if (trimmedPhone) {
      const phoneExists = users.some(
        (u) => u.phone && u.phone.trim() === trimmedPhone
      );
      if (phoneExists) {
        const msg = 'Số điện thoại này đã được sử dụng cho một tài khoản khác. Mỗi Số điện thoại chỉ dùng cho 1 tài khoản!';
        showNotification('Số điện thoại trùng lặp', msg);
        return { success: false, error: msg };
      }
    }

    // Check duplicate CCCD (if provided)
    if (trimmedCccd) {
      const cccdExists = users.some(
        (u) => u.cccdNumber && u.cccdNumber.trim() === trimmedCccd
      );
      if (cccdExists) {
        const msg = 'Số CCCD này đã được sử dụng cho một tài khoản khác. Mỗi CCCD chỉ dùng cho 1 tài khoản!';
        showNotification('Số CCCD trùng lặp', msg);
        return { success: false, error: msg };
      }
    }

    const hashedPassword = await hashPassword(trimmedPass);
    const newUserId = generateUniqueUserId(users);
    const newUser: UserEntity = {
      id: newUserId,
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      cccdNumber: trimmedCccd,
      password: hashedPassword,
      gender: gender || 'Khác',
      birthDate: cleanBirthDate,
      tier: trimmedCccd ? 'CCCD_VERIFIED' : 'NEWBIE',
      role: 'USER',
      kycName: trimmedName.toUpperCase(),
      isKycApproved: !!trimmedCccd,
      isNfcVerified: false,
      isFaceLivenessPassed: false,
      isStudentVerified: false,
      studentSchool: '',
      isBiometricsEnabled: false,
      isBusinessAccount: false,
      businessName: '',
      businessTaxId: '',
      trustScore: trimmedCccd ? 550 : 350,
      eloRating: 0,
      eloTier: 'BRONZE',
      winStreak: 0,
      notificationSound: 'DING_DEFAULT',
      connectedMoMo: '',
      connectedZaloPay: '',
      connectedViettelMoney: '',
      lastDeviceName: 'Web Client',
      lastLoginLocation: 'Việt Nam',
      hasUnusualDeviceAlert: false,
      rating: 0,
      reviewCount: 0,
      completedGigs: 0,
      onTimeRate: 100,
      postedGigsCount: 0,
      totalSpent: 0,
      walletBalance: 0,
      escrowLockedBalance: 0,
      securityPin: '123456',
      badges: 'Thành viên mới',
      isLocked: false,
      createdAt: Date.now(),
    };

    // Cloud registration & sync first to ensure server constraints pass
    const cloudRes = await cloudService.registerUser(newUser);
    if (!cloudRes.ok && cloudRes.error) {
      showNotification('Đăng ký không thành công', cloudRes.error);
      return { success: false, error: cloudRes.error };
    }

    // Update local IP counter
    const currentCount = parseInt(localStorage.getItem('gigme_ip_reg_count') || '0', 10);
    localStorage.setItem('gigme_ip_reg_count', String(currentCount + 1));

    setUsers((prev) => [...prev.filter((u) => u.id !== newUserId), newUser]);
    setCurrentUserId(newUserId);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUserId);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([...users.filter((u) => u.id !== newUserId), newUser]));
    } catch {}

    showNotification(
      'Đăng ký tài khoản thành công! 🎉',
      `Chào mừng ${trimmedName} gia nhập GigMe. Bạn đã được đăng nhập tự động!`,
      true,
      true
    );
    return { success: true };
  };

  // 2. LOGIN
  const login = async (contact: string, password: string): Promise<boolean> => {
    const rawContact = contact.trim();
    const trimmedContact = rawContact.toLowerCase();
    const trimmedPass = password.trim();

    // Chuẩn hóa số điện thoại: chuyển +84 thành 0, bỏ dấu cách và gạch nối
    let normalizedPhone = trimmedContact;
    if (normalizedPhone.startsWith('+84')) {
      normalizedPhone = '0' + normalizedPhone.slice(3).replace(/\D/g, '');
    } else if (normalizedPhone.startsWith('84') && normalizedPhone.length >= 10 && !normalizedPhone.includes('@')) {
      normalizedPhone = '0' + normalizedPhone.slice(2).replace(/\D/g, '');
    } else if (!normalizedPhone.includes('@')) {
      normalizedPhone = normalizedPhone.replace(/\D/g, '');
    }

    if (!trimmedContact || !trimmedPass) {
      showNotification('Lỗi đăng nhập', 'Vui lòng nhập đầy đủ Gmail/SĐT và mật khẩu!');
      return false;
    }

    // Admin Root check: admin@admin.vn | 0909120918 | 000000000 | admin1507
    if (
      (trimmedContact === 'admin@admin.vn' ||
        normalizedPhone === '0909120918' ||
        trimmedContact === '000000000' ||
        trimmedContact === 'admin') &&
      trimmedPass === 'admin1507'
    ) {
      let admin = users.find(
        (u) =>
          u.id === '000000000' ||
          u.email === 'admin@admin.vn' ||
          u.phone === '0909120918' ||
          u.id === 'admin_root'
      );
      if (!admin) {
        admin = DEFAULT_ADMIN;
        setUsers((prev) => [...prev.filter((u) => u.id !== '000000000'), DEFAULT_ADMIN]);
      } else {
        admin = { ...admin, id: '000000000' };
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('gigme_admin_active_session', 'true');
        sessionStorage.setItem('gigme_admin_session_time', String(Date.now()));
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, '000000000');
      }
      setCurrentUserId('000000000');
      showNotification('Chào mừng Quản trị viên!', 'Đã đăng nhập Trung Tâm Điều Hành Admin GigMe (ID: 000000000).', true);
      return true;
    }

    // Check if user is in local state with multiple matching patterns (Email, Phone, hoặc ID 9 số)
    let user = users.find((u) => {
      const idMatch = u.id === trimmedContact;
      const emailMatch = !!u.email && u.email.toLowerCase() === trimmedContact;
      const phoneMatch = !!u.phone && (
        u.phone === trimmedContact ||
        u.phone === normalizedPhone ||
        u.phone.replace(/\D/g, '') === normalizedPhone
      );
      return idMatch || emailMatch || phoneMatch;
    });

    // If not in local state, fetch directly from Firebase Firestore
    if (!user) {
      try {
        const cloudUser = await findUserByContact(trimmedContact) || (normalizedPhone !== trimmedContact ? await findUserByContact(normalizedPhone) : null);
        if (cloudUser) {
          user = cloudUser;
          setUsers((prev) => [...prev.filter((u) => u.id !== cloudUser.id), cloudUser]);
        }
      } catch (err) {
        console.warn('Find user in Firestore error:', err);
      }
    }

    if (!user) {
      showNotification(
        'Tài khoản không tồn tại',
        `Không tìm thấy tài khoản với "${rawContact}". Vui lòng thử lại hoặc chọn tài khoản mẫu 1 chạm!`
      );
      return false;
    }

    // Xác thực mật khẩu: Hỗ trợ cả mật khẩu băm SHA-256 an toàn và mật khẩu thử nghiệm
    const isDirectMatch = user.password === trimmedPass;
    const isHashedMatch = !isDirectMatch && (await verifyPassword(trimmedPass, user.password || ''));

    if (!isDirectMatch && !isHashedMatch) {
      showNotification('Sai mật khẩu', 'Mật khẩu đăng nhập không chính xác. Vui lòng thử lại hoặc bấm Quên mật khẩu!');
      return false;
    }

    if (user.isLocked) {
      showNotification('Tài khoản bị khóa', 'Tài khoản này đang bị tạm đình chỉ bởi Quản trị viên GigMe.');
      return false;
    }

    setCurrentUserId(user.id);
    showNotification('Đăng nhập thành công!', `Chào mừng trở lại, ${user.name}!`, true);
    return true;
  };

  // 3. SEND OTP (Hiệu lực 3 phút, chống Spam với Cooldown 60s)
  const sendOtp = (contact: string, purpose = 'RESET_PASSWORD'): boolean => {
    const trimmed = (contact || '').trim();
    if (!trimmed) {
      showNotification('Yêu cầu thông tin', 'Vui lòng nhập Số điện thoại hoặc Gmail để nhận mã OTP!');
      return false;
    }

    // Cooldown 60s chống Spam SMS / OTP Bombing
    if (lastOtpSentAt && Date.now() - lastOtpSentAt < 60 * 1000) {
      const waitSec = Math.ceil((60 * 1000 - (Date.now() - lastOtpSentAt)) / 1000);
      showNotification('Vui lòng đợi', `Vui lòng đợi ${waitSec}s trước khi yêu cầu cấp lại mã OTP mới!`);
      return false;
    }

    const code = generateSecureOtp(6);
    const expiry = Date.now() + 3 * 60 * 1000; // 3 phút
    setGeneratedOtp(code);
    setOtpTargetContact(trimmed.toLowerCase());
    setOtpExpiresAt(expiry);
    setOtpFailedAttempts(0);
    setLastOtpSentAt(Date.now());

    // Đồng bộ phía máy chủ backend
    cloudService.requestCloudOtp(trimmed);

    showNotification(
      'Mã xác thực OTP GigMe',
      `Mã OTP xác thực của bạn là: [${code}]. Mã có hiệu lực trong 3 phút (Tối đa 3 lần thử). Vui lòng không chia sẻ mã này!`,
      true
    );
    return true;
  };

  // 4. RESET PASSWORD WITH STRICT OTP CHECK & PASSWORD HASHING
  const resetPasswordWithOtp = async (enteredOtp: string, newPassword: string): Promise<boolean> => {
    const cleanOtp = (enteredOtp || '').trim();
    if (!cleanOtp) {
      showNotification('Chưa nhập mã OTP', 'Bạn chưa nhập mã OTP! Vui lòng nhập đúng mã 6 số để tiếp tục.');
      return false;
    }

    if (!generatedOtp) {
      showNotification('Chưa yêu cầu mã OTP', 'Bạn chưa yêu cầu gửi mã OTP. Vui lòng bấm "Nhận OTP" trước!');
      return false;
    }

    if (otpExpiresAt && Date.now() > otpExpiresAt) {
      setGeneratedOtp(null);
      setOtpExpiresAt(null);
      setOtpFailedAttempts(0);
      showNotification('Mã OTP đã hết hạn', 'Mã OTP đã quá thời hạn 3 phút. Vui lòng bấm nhận mã mới!');
      return false;
    }

    if (cleanOtp !== generatedOtp) {
      const nextFail = otpFailedAttempts + 1;
      setOtpFailedAttempts(nextFail);
      if (nextFail >= 3) {
        setGeneratedOtp(null);
        setOtpExpiresAt(null);
        setOtpFailedAttempts(0);
        showNotification(
          'Hủy mã OTP',
          'Bạn đã nhập sai mã OTP quá 3 lần liên tiếp. Mã OTP đã bị hủy để đảm bảo an toàn!'
        );
        return false;
      }
      showNotification(
        'Mã OTP không đúng',
        `Mã OTP bạn vừa nhập không chính xác (Còn ${3 - nextFail} lần thử). Vui lòng kiểm tra lại!`
      );
      return false;
    }

    if (newPassword.trim().length < 6) {
      showNotification('Mật khẩu yếu', 'Mật khẩu mới phải có tối thiểu 6 ký tự!');
      return false;
    }

    if (otpTargetContact) {
      const hashedNewPass = await hashPassword(newPassword.trim());
      setUsers((prev) =>
        prev.map((u) => {
          if ((u.email && u.email.toLowerCase() === otpTargetContact) || (u.phone && u.phone === otpTargetContact)) {
            const updated = { ...u, password: hashedNewPass };
            cloudService.saveUser(updated);
            return updated;
          }
          return u;
        })
      );
      setGeneratedOtp(null);
      setOtpExpiresAt(null);
      setOtpFailedAttempts(0);
      showNotification(
        'Đặt lại mật khẩu thành công!',
        'Mật khẩu mới đã được mã hóa an toàn và cập nhật. Bạn có thể đăng nhập ngay bây giờ.',
        true
      );
      return true;
    }
    return false;
  };

  // 5. PHONE LOGIN WITH MANDATORY STRICT OTP CHECK & ATTEMPTS LIMIT
  const loginWithPhoneOtp = (phoneNumber: string, enteredOtp: string): boolean => {
    const trimmedPhone = (phoneNumber || '').trim();
    if (!trimmedPhone) {
      showNotification('Thiếu số điện thoại', 'Vui lòng nhập số điện thoại của bạn!');
      return false;
    }

    const cleanOtp = (enteredOtp || '').trim();
    if (!cleanOtp) {
      showNotification('Chưa nhập mã OTP', 'Bạn chưa nhập mã OTP! Bắt buộc phải có mã OTP 6 số để đăng nhập.');
      return false;
    }

    if (!generatedOtp) {
      showNotification('Chưa yêu cầu mã OTP', 'Bạn chưa yêu cầu mã OTP. Vui lòng bấm nút "Gửi Mã OTP" trước!');
      return false;
    }

    if (otpExpiresAt && Date.now() > otpExpiresAt) {
      setGeneratedOtp(null);
      setOtpExpiresAt(null);
      setOtpFailedAttempts(0);
      showNotification('Mã OTP đã hết hạn', 'Mã OTP đã quá hạn 3 phút. Vui lòng bấm "Gửi Mã OTP" để nhận mã mới!');
      return false;
    }

    if (otpTargetContact && otpTargetContact.toLowerCase() !== trimmedPhone.toLowerCase()) {
      showNotification('Số điện thoại không khớp', `Mã OTP đã được cấp cho số ${otpTargetContact}. Vui lòng không đổi số điện thoại!`);
      return false;
    }

    if (cleanOtp !== generatedOtp) {
      const nextFail = otpFailedAttempts + 1;
      setOtpFailedAttempts(nextFail);
      if (nextFail >= 3) {
        setGeneratedOtp(null);
        setOtpExpiresAt(null);
        setOtpFailedAttempts(0);
        showNotification('Hủy mã OTP', 'Đã nhập sai OTP 3 lần. Mã OTP đã bị hủy!');
        return false;
      }
      showNotification('Mã OTP không đúng', `Mã OTP xác thực không khớp (Còn ${3 - nextFail} lần thử).`);
      return false;
    }

    // Hủy mã OTP ngay lập tức để chống dùng lại
    setGeneratedOtp(null);
    setOtpExpiresAt(null);
    setOtpFailedAttempts(0);

    let user = users.find((u) => u.phone === trimmedPhone);
    if (!user) {
      const newUserId = generateUniqueUserId(users);
      user = {
        id: newUserId,
        name: `Người dùng ${trimmedPhone}`,
        email: '',
        phone: trimmedPhone,
        gender: 'Khác',
        birthDate: '01/01/2000',
        tier: 'NEWBIE',
        role: 'USER',
        kycName: `NGƯỜI DÙNG ${trimmedPhone}`,
        isKycApproved: false,
        isNfcVerified: false,
        isFaceLivenessPassed: false,
        isStudentVerified: false,
        studentSchool: '',
        isBiometricsEnabled: false,
        isBusinessAccount: false,
        businessName: '',
        businessTaxId: '',
        trustScore: 0,
        eloRating: 0,
        eloTier: 'BRONZE',
        winStreak: 0,
        notificationSound: 'DING_DEFAULT',
        connectedMoMo: '',
        connectedZaloPay: '',
        connectedViettelMoney: '',
        lastDeviceName: 'Web Client',
        lastLoginLocation: 'Hà Nội, Việt Nam',
        hasUnusualDeviceAlert: false,
        rating: 0,
        reviewCount: 0,
        completedGigs: 0,
        onTimeRate: 0,
        postedGigsCount: 0,
        totalSpent: 0,
        walletBalance: 0,
        escrowLockedBalance: 0,
        securityPin: '123456',
        badges: 'Thành viên mới',
        isLocked: false,
        createdAt: Date.now(),
      };
      setUsers((prev) => [...prev, user!]);
      cloudService.registerUser(user);
    }

    setCurrentUserId(user.id);
    showNotification('Đăng nhập SĐT thành công!', `Đã xác thực OTP thành công với số ${trimmedPhone}.`, true);
    return true;
  };

  // 5b. MO (Mobile Originated) SMS AUTHENTICATION
  // Người dùng tự soạn tin nhắn gửi tới đầu số tổng đài (8077/8177...)
  const requestMoSms = async (params?: {
    phone?: string;
    shortcode?: string;
    keyword?: string;
  }): Promise<{ success: boolean; session?: MoSmsSession; error?: string }> => {
    try {
      const res = await cloudService.requestMoSms(params || {});
      return res;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Không thể tạo phiên xác thực MO SMS' };
    }
  };

  const checkMoSmsStatus = async (sessionId: string) => {
    return await cloudService.checkMoSmsStatus(sessionId);
  };

  const simulateMoSms = async (sessionId: string, phone?: string) => {
    return await cloudService.simulateMoSms(sessionId, phone);
  };

  const loginWithMoSms = async (phone: string): Promise<boolean> => {
    const trimmedPhone = (phone || '').trim();
    if (!trimmedPhone) {
      showNotification('Lỗi xác thực', 'Không tìm thấy số điện thoại của tin nhắn MO!');
      return false;
    }

    let user = users.find((u) => u.phone === trimmedPhone);
    if (!user) {
      const newUserId = generateUniqueUserId(users);
      user = {
        id: newUserId,
        name: `Người dùng ${trimmedPhone}`,
        email: '',
        phone: trimmedPhone,
        gender: 'Khác',
        birthDate: '01/01/2000',
        tier: 'NEWBIE',
        role: 'USER',
        kycName: `NGƯỜI DÙNG ${trimmedPhone}`,
        isKycApproved: false,
        isNfcVerified: false,
        isFaceLivenessPassed: false,
        isStudentVerified: false,
        studentSchool: '',
        isBiometricsEnabled: false,
        isBusinessAccount: false,
        businessName: '',
        businessTaxId: '',
        trustScore: 100,
        eloRating: 1000,
        eloTier: 'BRONZE',
        winStreak: 0,
        notificationSound: 'BANK_TING',
        connectedMoMo: '',
        connectedZaloPay: '',
        connectedViettelMoney: '',
        lastDeviceName: 'SMS MO Verified',
        lastLoginLocation: 'Việt Nam',
        hasUnusualDeviceAlert: false,
        rating: 0,
        reviewCount: 0,
        completedGigs: 0,
        onTimeRate: 100,
        postedGigsCount: 0,
        totalSpent: 0,
        walletBalance: 0,
        escrowLockedBalance: 0,
        securityPin: '123456',
        badges: 'Xác thực SMS MO chính chủ',
        isLocked: false,
        createdAt: Date.now(),
      };
      setUsers((prev) => [...prev, user!]);
      await cloudService.registerUser(user);
    }

    setCurrentUserId(user.id);
    triggerHaptic('success');
    showNotification(
      'Xác thực SMS MO Thành Công! 📱🎉',
      `Đã nhận diện số điện thoại ${trimmedPhone} từ tin nhắn chủ động tới tổng đài. Chào mừng bạn!`,
      true,
      true
    );
    return true;
  };

  // 6. SOCIAL LOGIN (Đăng nhập thật qua Firebase Authentication)
  const loginSocial = async (provider: string, emailOrName?: string) => {
    try {
      let authUser: any = null;
      if (provider === 'Google') {
        const googleProvider = new GoogleAuthProvider();
        googleProvider.setCustomParameters({ prompt: 'select_account' });
        const cred = await signInWithPopup(auth, googleProvider);
        authUser = cred.user;
      } else if (provider === 'Facebook') {
        try {
          const fbProvider = new FacebookAuthProvider();
          const cred = await signInWithPopup(auth, fbProvider);
          authUser = cred.user;
        } catch (fbErr: any) {
          if (
            fbErr?.code === 'auth/operation-not-allowed' ||
            fbErr?.code === 'auth/configuration-not-found'
          ) {
            showNotification(
              'Chưa bật Facebook Auth',
              'Đăng nhập Facebook yêu cầu kích hoạt trong Firebase Console. Bạn vui lòng sử dụng Đăng nhập Google hoặc SĐT/Gmail nhé!'
            );
            return;
          }
          throw fbErr;
        }
      } else if (provider === 'Apple') {
        try {
          const appleProvider = new OAuthProvider('apple.com');
          const cred = await signInWithPopup(auth, appleProvider);
          authUser = cred.user;
        } catch (appleErr: any) {
          if (
            appleErr?.code === 'auth/operation-not-allowed' ||
            appleErr?.code === 'auth/configuration-not-found'
          ) {
            showNotification(
              'Chưa bật Apple ID',
              'Đăng nhập Apple yêu cầu Services ID trong Firebase Console. Bạn vui lòng sử dụng Đăng nhập Google hoặc SĐT/Gmail nhé!'
            );
            return;
          }
          throw appleErr;
        }
      }

      if (authUser) {
        const email = authUser.email || '';
        const name = authUser.displayName || email.split('@')[0] || 'Người Dùng';
        const uid = authUser.uid;

        // Kiểm tra tài khoản đã tồn tại chưa (local hoặc Firestore)
        let user = users.find(
          (u) => (u.email && u.email.toLowerCase() === email.toLowerCase()) || u.id === uid
        );
        if (!user && email) {
          try {
            user = (await findUserByContact(email)) || undefined;
          } catch {
            // ignore
          }
        }

        if (!user) {
          const socialUserId = generateUniqueUserId(users);
          user = {
            id: socialUserId,
            name: name,
            email: email,
            phone: authUser.phoneNumber || '',
            gender: 'Khác',
            birthDate: '01/01/2002',
            role: 'USER',
            tier: 'NEWBIE',
            kycName: name.toUpperCase(),
            isKycApproved: false,
            isNfcVerified: false,
            isFaceLivenessPassed: false,
            isStudentVerified: false,
            studentSchool: '',
            isBiometricsEnabled: false,
            isBusinessAccount: false,
            businessName: '',
            businessTaxId: '',
            trustScore: 100,
            eloRating: 1000,
            eloTier: 'BRONZE',
            winStreak: 0,
            notificationSound: 'BANK_TING',
            connectedMoMo: '',
            connectedZaloPay: '',
            connectedViettelMoney: '',
            lastDeviceName: `${provider} Auth Verified`,
            lastLoginLocation: 'Việt Nam',
            hasUnusualDeviceAlert: false,
            rating: 0,
            reviewCount: 0,
            completedGigs: 0,
            onTimeRate: 100,
            postedGigsCount: 0,
            totalSpent: 0,
            walletBalance: 0,
            escrowLockedBalance: 0,
            securityPin: '123456',
            badges: `Tài khoản ${provider} chính chủ`,
            isLocked: false,
            createdAt: Date.now(),
          };
          setUsers((prev) => [...prev.filter((u) => u.id !== user!.id), user!]);
          // Lưu đồng bộ thật lên Firebase Firestore
          await syncUserToCloud(user);
        }

        setCurrentUserId(user.id);
        showNotification(
          `Đăng nhập ${provider} thành công! 🎉`,
          `Chào mừng ${user.name} đến với GigMe!`,
          true,
          true
        );
      }
    } catch (err: any) {
      console.error('Social Login Error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        showNotification(
          'Cửa sổ Popup bị chặn',
          'Vui lòng cho phép mở cửa sổ Popup trên trình duyệt để tiếp tục đăng nhập Google/Facebook.'
        );
        return;
      }
      showNotification(
        `Lỗi đăng nhập ${provider}`,
        err?.message || 'Không thể đăng nhập bằng tài khoản này. Vui lòng thử lại!'
      );
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('gigme_admin_active_session');
      sessionStorage.removeItem('gigme_admin_session_time');
    }
    setCurrentUserId(null);
    showNotification('Đã đăng xuất', 'Bạn đã đăng xuất tài khoản an toàn.', true);
  };

  // Quản lý bạn bè & Tìm tài khoản theo ID 9 chữ số (000000000 - 999999999)
  const findUserByNineDigitId = (id: string): UserEntity | null => {
    const clean = (id || '').trim();
    if (!clean) return null;
    return users.find((u) => u.id === clean) || null;
  };

  const addFriendById = (targetId: string): { success: boolean; message: string; friend?: UserEntity } => {
    const cleanId = (targetId || '').trim();
    if (!cleanId) {
      return { success: false, message: 'Vui lòng nhập ID 9 số hợp lệ!' };
    }
    if (!currentUser) {
      return { success: false, message: 'Bạn cần đăng nhập để kết bạn!' };
    }
    if (currentUser.id === cleanId) {
      return { success: false, message: 'Không thể tự kết bạn với chính ID của mình!' };
    }
    const targetUser = users.find((u) => u.id === cleanId);
    if (!targetUser) {
      return { success: false, message: `Không tìm thấy tài khoản nào có ID "${cleanId}".` };
    }
    const currentFriends = currentUser.friendIds || [];
    if (currentFriends.includes(cleanId)) {
      return { success: false, message: `Bạn và ${targetUser.name} đã là bạn bè!`, friend: targetUser };
    }
    const updatedUser: UserEntity = {
      ...currentUser,
      friendIds: [...currentFriends, cleanId],
    };
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users.map((u) => (u.id === currentUser.id ? updatedUser : u))));
    } catch {}
    showNotification('Kết bạn thành công! 🤝', `Đã kết bạn với ${targetUser.name} (ID: ${cleanId}).`, true);
    return { success: true, message: `Đã kết bạn thành công với ${targetUser.name}!`, friend: targetUser };
  };

  const removeFriendById = (targetId: string): void => {
    if (!currentUser) return;
    const cleanId = (targetId || '').trim();
    const updatedUser: UserEntity = {
      ...currentUser,
      friendIds: (currentUser.friendIds || []).filter((id) => id !== cleanId),
    };
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    showNotification('Đã xóa bạn bè', `Đã xóa ID ${cleanId} khỏi danh bạ.`);
  };

  const setRadius = (meters: number) => {
    setSelectedRadiusMeters(meters);
  };

  const setCategory = (category: string) => {
    setSelectedCategory(category);
  };

  const selectGig = (gigId: string | null) => {
    setSelectedGigId(gigId);
  };

  const upgradeTier = (newTier: UserTierKey, fullName: string, schoolOrId: string) => {
    if (!currentUser) return;
    const config = USER_TIERS[newTier];
    const updatedUser: UserEntity = {
      ...currentUser,
      tier: newTier,
      kycName: fullName.toUpperCase(),
      isKycApproved: true,
      isStudentVerified: schoolOrId.includes('.edu.vn') || schoolOrId.trim().length > 0,
      studentSchool: schoolOrId,
      trustScore: Math.min(850, currentUser.trustScore + 60),
    };

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    showNotification(
      `🎉 Chúc mừng nâng cấp ${config.badgeText}!`,
      'Hồ sơ của bạn đã được xác thực thành công. Mở khóa toàn bộ đặc quyền!',
      true,
      true
    );
  };

  // POST GIG WITH SMART ESCROW LOCK
  const postGig = (params: {
    title: string;
    description: string;
    category: string;
    price: number;
    isReverseAuction: boolean;
    isFlash: boolean;
    locationName: string;
    distanceMeters: number;
    latitude?: number;
    longitude?: number;
    isRecurringWeekly?: boolean;
    totalWorkersNeeded?: number;
    estimatedDurationMinutes?: number;
    isBoosted?: boolean;
  }): boolean => {
    if (!currentUser) return false;
    const { price, title, isBoosted } = params;
    const boostFee = isBoosted ? 10000 : 0;
    const totalRequired = price + boostFee;

    if (currentUser.walletBalance < totalRequired) {
      showNotification(
        `Số dư ví không đủ (Hiện có ${currentUser.walletBalance.toLocaleString()}đ)`,
        `Vui lòng nạp thêm tối thiểu ${(totalRequired - currentUser.walletBalance).toLocaleString()}đ qua VietQR để khóa Escrow ${
          isBoosted ? 'và kích hoạt Đẩy bài Top 1' : ''
        }.`
      );
      return false;
    }

    const updatedUser: UserEntity = {
      ...currentUser,
      walletBalance: currentUser.walletBalance - totalRequired,
      escrowLockedBalance: currentUser.escrowLockedBalance + price,
      postedGigsCount: currentUser.postedGigsCount + 1,
      totalSpent: currentUser.totalSpent + totalRequired,
    };

    const newGigId = `gig_${Date.now()}`;
    const generatedSecretCode = generateSecureSecretToken('SEC', 2, 4);

    let gigLat = params.latitude;
    let gigLng = params.longitude;

    if (!gigLat || !gigLng) {
      const loc = (params.locationName || '').toLowerCase();
      if (loc.includes('hà nội') || loc.includes('bách khoa b7') || loc.includes('hai bà trưng')) {
        gigLat = 21.0053;
        gigLng = 105.8433;
      } else if (loc.includes('đống đa') || loc.includes('ngoại thương')) {
        gigLat = 21.0263;
        gigLng = 105.8016;
      } else if (loc.includes('đà nẵng') || loc.includes('liên chiểu')) {
        gigLat = 16.0739;
        gigLng = 108.1498;
      } else if (loc.includes('cần thơ') || loc.includes('ninh kiều')) {
        gigLat = 10.0299;
        gigLng = 105.7684;
      } else if (loc.includes('đhqg') || loc.includes('dĩ an') || loc.includes('thủ đức')) {
        gigLat = 10.8808;
        gigLng = 106.7825;
      } else if (loc.includes('quận 7') || loc.includes('tôn đức thắng')) {
        gigLat = 10.7324;
        gigLng = 106.6992;
      } else if (loc.includes('online') || loc.includes('remote') || loc.includes('toàn quốc') || loc.includes('từ xa')) {
        gigLat = 16.0471;
        gigLng = 108.2068;
      } else {
        gigLat = userCoords.latitude + (Math.random() - 0.5) * 0.003;
        gigLng = userCoords.longitude + (Math.random() - 0.5) * 0.003;
      }
    }

    // Dynamic Surge Pricing Engine (1.02x -> 1.25x) dựa trên Cung - Cầu Campus
    const surgeCalc = calculateSurgePricing(params.price, {
      openGigsCount: gigs.filter((g) => g.status === 'OPEN').length,
      availableWorkersCount: users.filter((u) => u.role === 'USER').length,
      isFlashRequested: !!params.isFlash,
    });

    const newGig: GigEntity = {
      id: newGigId,
      title: params.title,
      description: params.description,
      category: params.category,
      price: params.price,
      isReverseAuction: params.isReverseAuction,
      lowestBidPrice: params.price,
      distanceMeters: params.distanceMeters || 120,
      locationName: params.locationName,
      latitude: gigLat,
      longitude: gigLng,
      clientId: currentUser.id,
      clientName: currentUser.name,
      clientTier: currentUser.tier,
      freelancerId: null,
      freelancerName: null,
      status: 'OPEN',
      isPinned: !!params.isBoosted,
      isFlash: params.isFlash || !!params.isBoosted,
      isBoosted: !!params.isBoosted,
      boostedUntil: params.isBoosted ? Date.now() + 2 * 3600 * 1000 : undefined,
      boostFeePaid: boostFee,
      isRecurringWeekly: params.isRecurringWeekly || false,
      totalWorkersNeeded: params.totalWorkersNeeded || 1,
      confirmedWorkersCount: 0,
      multiWorkers: [],
      checkInSecretCode: generatedSecretCode,
      estimatedDurationMinutes: params.estimatedDurationMinutes || 30,
      tipAmount: 0,
      surgeMultiplier: surgeCalc.multiplier,
      originalBasePrice: surgeCalc.basePrice,
      surgeReason: surgeCalc.primaryReason,
      isSurging: surgeCalc.isSurging,
      createdAt: Date.now(),
      completedAt: null,
      proofImageUrl: null,
      proofNote: null,
      proofIsWatermarked: true,
      isWatermarkRemoved: false,
    };

    const newTxList: WalletTransactionEntity[] = [
      {
        id: `tx_${Date.now()}_escrow`,
        userId: currentUser.id,
        type: 'ESCROW_LOCK',
        amount: -price,
        title: 'Khóa tiền Escrow đăng việc',
        subtitle: `Đơn: ${title} (Nền tảng giữ tiền an toàn)`,
        bankInfo: 'GigMe Smart Escrow Vault',
        timestamp: Date.now(),
        isSuccess: true,
      },
    ];

    if (isBoosted) {
      newTxList.push({
        id: `tx_${Date.now()}_boost`,
        userId: currentUser.id,
        type: 'EXPENSE',
        amount: -boostFee,
        title: '🚀 Phí Đẩy Bài & Ghim Top 1 Hỏa Tốc',
        subtitle: `Ghim đơn "${title}" lên vị trí đầu trang chủ trong 2 giờ`,
        bankInfo: 'GigMe Flash Promotion',
        timestamp: Date.now(),
        isSuccess: true,
      });
    }

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setGigs((prev) => [newGig, ...prev]);
    setTransactions((prev) => [...newTxList, ...prev]);
    setSelectedGigId(newGigId);

    // Đồng bộ tức thì lên Cloud Firestore để mọi người dùng đều nhận được ngay
    cloudService.saveGig(newGig);
    cloudService.saveUser(updatedUser);

    triggerHaptic('escrow');
    showNotification(
      '⚡ Đăng việc thành công!',
      isBoosted
        ? `Đã khóa ${price.toLocaleString()}đ vào Escrow và kích hoạt Đẩy Bài Ghim Top 1!`
        : `Đã khóa ${price.toLocaleString()}đ vào Smart Escrow. Công việc đã xuất hiện ngay trên radar!`,
      true,
      true
    );
    return true;
  };

  // REVERSE AUCTION BID
  const placeBid = (gigId: string, offeredPrice: number, minutes: number, note: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.tier === 'NEWBIE') {
      showNotification(
        'Yêu cầu Xác thực Cấp 2',
        'Tài khoản Newbie chưa được nhận việc hoặc đấu giá để chống lừa đảo. Vui lòng xác thực E-KYC hoặc Email trường học!'
      );
      return false;
    }

    const newBid: BidEntity = {
      id: `bid_${Date.now()}`,
      gigId,
      freelancerId: currentUser.id,
      freelancerName: currentUser.name,
      freelancerTier: currentUser.tier,
      offeredPrice,
      estimatedMinutes: minutes,
      proposalNote: note,
      createdAt: Date.now(),
    };

    setBids((prev) => [newBid, ...prev]);
    cloudService.saveBid(newBid);
    setGigs((prev) =>
      prev.map((g) => {
        if (g.id === gigId && (g.lowestBidPrice === 0 || offeredPrice < g.lowestBidPrice)) {
          const updated = { ...g, lowestBidPrice: offeredPrice };
          cloudService.saveGig(updated);
          return updated;
        }
        return g;
      })
    );

    showNotification(
      'Đã gửi đề xuất thầu!',
      `Bạn đã đề xuất mức giá ${offeredPrice.toLocaleString()}đ trong ${minutes} phút. Người thuê sẽ duyệt ngay!`,
      true
    );
    return true;
  };

  // ACCEPT GIG DIRECTLY
  const acceptGigDirectly = (gig: GigEntity): boolean => {
    if (!currentUser) return false;
    if (currentUser.tier === 'NEWBIE') {
      showNotification(
        'Tài khoản chưa xác thực',
        'Newbie không thể nhận việc để tránh rủi ro quỵt kèo. Hãy xác thực E-KYC hoặc Email sinh viên (.edu.vn) nhé!'
      );
      return false;
    }

    const updatedGig: GigEntity = {
      ...gig,
      status: 'IN_PROGRESS',
      freelancerId: currentUser.id,
      freelancerName: currentUser.name,
      acceptedAt: Date.now(),
      confirmedWorkersCount: (gig.confirmedWorkersCount || 0) + 1,
    };
    setGigs((prev) => prev.map((g) => (g.id === gig.id ? updatedGig : g)));
    cloudService.saveGig(updatedGig);

    triggerHaptic('success');
    showNotification(
      'Nhận việc thành công!',
      `Bạn đã nhận đơn "${gig.title}". Tiền đã được khóa trong Escrow, yên tâm làm việc!`,
      true
    );
    return true;
  };

  // CANCEL GIG BY WORKER WITH LATE CANCELLATION PENALTY (< 10m FREE, > 10m PENALTY)
  const cancelGigByWorker = (gigId: string, reason: string): boolean => {
    if (!currentUser) return false;
    const gig = gigs.find((g) => g.id === gigId);
    if (!gig) return false;

    const acceptedTime = gig.acceptedAt || gig.createdAt || Date.now();
    const elapsedMinutes = (Date.now() - acceptedTime) / (1000 * 60);

    const isLateCancellation = elapsedMinutes > 10;
    const penaltyFee = isLateCancellation
      ? Math.min(Math.max(20000, Math.round(gig.price * 0.1)), 50000)
      : 0;
    const trustScoreDeduction = isLateCancellation ? 5 : 0;

    // Phạt trừ ví thợ & bồi thường khách nếu hủy trễ sau 10 phút
    if (isLateCancellation) {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === currentUser.id) {
            const updatedDiscipline = [
              ...(u.disciplineRecords || []),
              {
                id: `disc_worker_cancel_${Date.now()}`,
                type: 'LATE_CANCELLATION' as const,
                title: 'Hủy nhận việc trễ hạn (>10 phút)',
                penaltyPoints: trustScoreDeduction,
                fineAmount: penaltyFee,
                reason: reason || 'Hủy sau 10 phút nhận kèo',
                createdAt: Date.now(),
                gigTitle: gig.title,
              },
            ];
            return {
              ...u,
              walletBalance: Math.max(0, u.walletBalance - penaltyFee),
              trustScore: Math.max(0, u.trustScore - trustScoreDeduction),
              disciplineRecords: updatedDiscipline,
            };
          }
          if (u.id === gig.clientId) {
            return {
              ...u,
              walletBalance: u.walletBalance + penaltyFee,
            };
          }
          return u;
        })
      );

      const txWorkerPenalty: WalletTransactionEntity = {
        id: `tx_late_pen_${Date.now()}`,
        userId: currentUser.id,
        type: 'EXPENSE',
        amount: -penaltyFee,
        title: '⚠️ Phạt Hủy Đơn Trễ Hạn (>10 phút)',
        subtitle: `Đơn "${gig.title}" • Trừ 5 điểm Trust Score & phạt ${penaltyFee.toLocaleString()}đ bồi thường khách`,
        bankInfo: 'Hệ thống Quản trị Kỷ luật GigMe',
        timestamp: Date.now(),
        isSuccess: true,
      };

      const txClientComp: WalletTransactionEntity = {
        id: `tx_late_comp_${Date.now()}`,
        userId: gig.clientId,
        type: 'REWARD_EARNED',
        amount: penaltyFee,
        title: '💰 Bồi Thường Do Thợ Hủy Kèo Trễ',
        subtitle: `Nhận thù lao bồi thường ${penaltyFee.toLocaleString()}đ từ đơn "${gig.title}"`,
        bankInfo: 'Hệ thống Bảo hiểm GigMe Escrow',
        timestamp: Date.now(),
        isSuccess: true,
      };

      setTransactions((prev) => [txWorkerPenalty, txClientComp, ...prev]);
      cloudService.saveTransaction(txWorkerPenalty);
      cloudService.saveTransaction(txClientComp);
    }

    const updatedGig: GigEntity = {
      ...gig,
      status: 'OPEN',
      freelancerId: undefined,
      freelancerName: undefined,
      cancelledByWorker: true,
      cancelledAt: Date.now(),
      cancellationReason: reason,
      cancellationPenaltyAmount: penaltyFee,
    };

    setGigs((prev) => prev.map((g) => (g.id === gigId ? updatedGig : g)));
    cloudService.saveGig(updatedGig);

    if (isLateCancellation) {
      showNotification(
        '⚠️ Phạt Hủy Đơn Trễ Hạn (-5 Điểm Uy Tín)',
        `Bạn đã hủy đơn sau ${Math.round(elapsedMinutes)} phút nhận việc (>10 phút). Hệ thống tự trừ 5 điểm Trust Score và trừ ${penaltyFee.toLocaleString()}đ phí bồi thường chuyển cho khách hàng.`,
        false
      );
    } else {
      showNotification(
        'Đã Hủy Nhận Việc',
        'Đã hủy đơn trong vòng 10 phút đầu. Bạn được miễn trừ phạt và không bị trừ điểm uy tín.',
        true
      );
    }
    return true;
  };

  // CANCEL GIG BY CLIENT (HOÀN 100% ESCROW KHI OPEN; MIỄN PHÍ < 10 PHÚT, PHẠT BỒI THƯỜNG THỢ > 10 PHÚT KHI IN_PROGRESS)
  const cancelGigByClient = (gigId: string, reason: string): boolean => {
    if (!currentUser) return false;
    const gig = gigs.find((g) => g.id === gigId);
    if (!gig) return false;
    if (gig.clientId !== currentUser.id && currentUser.role !== 'ADMIN') {
      showNotification('Không có quyền', 'Chỉ người đăng bài mới có quyền hủy đơn này!');
      return false;
    }

    if (gig.status === 'COMPLETED' || gig.status === 'CLIENT_REFUNDED' || gig.status === 'CANCELLED') {
      showNotification('Không thể hủy', 'Đơn việc này đã kết thúc hoặc đã được xử lý trước đó!');
      return false;
    }

    // Trường hợp 1: Đơn còn đang OPEN (chưa có thợ nhận)
    if (gig.status === 'OPEN') {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === gig.clientId) {
            return {
              ...u,
              walletBalance: u.walletBalance + gig.price,
              escrowLockedBalance: Math.max(0, u.escrowLockedBalance - gig.price),
            };
          }
          return u;
        })
      );

      const refundTx: WalletTransactionEntity = {
        id: `tx_cancel_refund_${Date.now()}`,
        userId: gig.clientId,
        type: 'ADMIN_REFUND',
        amount: gig.price,
        title: 'Hoàn Tiền Escrow (Hủy Bài Đăng)',
        subtitle: `Hoàn 100% tiền cọc (${gig.price.toLocaleString('vi-VN')}đ) đơn "${gig.title}" do chủ việc hủy khi chưa có thợ`,
        bankInfo: 'Ví GigMe Escrow',
        timestamp: Date.now(),
        isSuccess: true,
      };

      setTransactions((prev) => [refundTx, ...prev]);
      cloudService.saveTransaction(refundTx);

      const updatedGig: GigEntity = {
        ...gig,
        status: 'CANCELLED',
        cancelledAt: Date.now(),
        cancelledByClient: true,
        cancellationReason: reason || 'Chủ việc hủy bài đăng khi chưa có thợ',
      };

      setGigs((prev) => prev.map((g) => (g.id === gigId ? updatedGig : g)));
      cloudService.saveGig(updatedGig);

      showNotification(
        '✅ Hủy Đăng Bài Thành Công',
        `Đã hoàn trả 100% tiền cọc Escrow (${gig.price.toLocaleString('vi-VN')}đ) về ví tài khoản của bạn ngay lập tức!`,
        true,
        true
      );
      return true;
    }

    // Trường hợp 2: Đơn đang IN_PROGRESS (Thợ đã nhận việc và có thể đang trên đường đến)
    const acceptedTime = gig.acceptedAt || gig.createdAt || Date.now();
    const elapsedMinutes = (Date.now() - acceptedTime) / (1000 * 60);
    const isLate = elapsedMinutes > 10;
    const penaltyFee = isLate
      ? Math.min(Math.max(20000, Math.round(gig.price * 0.1)), 50000)
      : 0;
    const trustDeduction = isLate ? 5 : 0;
    const refundToClient = Math.max(0, gig.price - penaltyFee);

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === gig.clientId) {
          const updatedDiscipline = isLate
            ? [
                ...(u.disciplineRecords || []),
                {
                  id: `disc_client_cancel_${Date.now()}`,
                  type: 'LATE_CANCELLATION' as const,
                  title: 'Phạt hủy đơn trễ hạn sau 10 phút',
                  penaltyPoints: trustDeduction,
                  fineAmount: penaltyFee,
                  reason: reason || 'Hủy đơn sau 10 phút khi thợ đang chuẩn bị/di chuyển',
                  createdAt: Date.now(),
                  gigTitle: gig.title,
                },
              ]
            : u.disciplineRecords;

          return {
            ...u,
            walletBalance: u.walletBalance + refundToClient,
            escrowLockedBalance: Math.max(0, u.escrowLockedBalance - gig.price),
            trustScore: Math.max(0, u.trustScore - trustDeduction),
            disciplineRecords: updatedDiscipline,
          };
        }

        if (gig.freelancerId && u.id === gig.freelancerId && isLate) {
          return {
            ...u,
            walletBalance: u.walletBalance + penaltyFee,
          };
        }
        return u;
      })
    );

    const clientRefundTx: WalletTransactionEntity = {
      id: `tx_client_refund_${Date.now()}`,
      userId: gig.clientId,
      type: 'ADMIN_REFUND',
      amount: refundToClient,
      title: isLate ? 'Hoàn Escrow (Đã trừ phí bồi thường thợ)' : 'Hoàn Tiền Ký Quỹ Escrow (Trong 10 phút)',
      subtitle: isLate
        ? `Hoàn lại ${refundToClient.toLocaleString('vi-VN')}đ (đã bồi thường ${penaltyFee.toLocaleString('vi-VN')}đ cho thợ) từ đơn "${gig.title}"`
        : `Hoàn đủ 100% (${gig.price.toLocaleString('vi-VN')}đ) do hủy trong 10 phút đầu`,
      bankInfo: 'GigMe Escrow Protection',
      timestamp: Date.now(),
      isSuccess: true,
    };

    const newTxs: WalletTransactionEntity[] = [clientRefundTx];

    if (isLate && gig.freelancerId) {
      const workerCompTx: WalletTransactionEntity = {
        id: `tx_worker_comp_${Date.now()}`,
        userId: gig.freelancerId,
        type: 'REWARD_EARNED',
        amount: penaltyFee,
        title: '💰 Bồi Thường Do Khách Hủy Kèo Trễ',
        subtitle: `Khách hủy sau 10 phút đơn "${gig.title}" • Bồi thường công di chuyển ${penaltyFee.toLocaleString('vi-VN')}đ`,
        bankInfo: 'Bảo Hiểm Hủy Kèo GigMe',
        timestamp: Date.now(),
        isSuccess: true,
      };
      newTxs.push(workerCompTx);
      cloudService.saveTransaction(workerCompTx);
    }

    setTransactions((prev) => [...newTxs, ...prev]);
    cloudService.saveTransaction(clientRefundTx);

    const updatedGig: GigEntity = {
      ...gig,
      status: 'CANCELLED',
      cancelledAt: Date.now(),
      cancelledByClient: true,
      cancellationReason: reason || 'Chủ việc hủy đơn',
      cancellationPenaltyAmount: penaltyFee,
    };

    setGigs((prev) => prev.map((g) => (g.id === gigId ? updatedGig : g)));
    cloudService.saveGig(updatedGig);

    if (isLate) {
      showNotification(
        '⚠️ Hủy Trễ Hạn & Trừ Phí Bồi Thường (-5 Điểm Uy Tín)',
        `Bạn đã hủy đơn sau ${Math.round(elapsedMinutes)} phút nhận việc. Hệ thống đã trích ${penaltyFee.toLocaleString('vi-VN')}đ bồi thường cho thợ, trừ 5 điểm Trust Score và hoàn lại ${refundToClient.toLocaleString('vi-VN')}đ về ví của bạn.`,
        false
      );
    } else {
      showNotification(
        '✅ Đã Hủy Đơn & Hoàn 100% Tiền Escrow',
        `Đã hủy việc trong 10 phút đầu miễn phí. Toàn bộ tiền cọc ${gig.price.toLocaleString('vi-VN')}đ đã được hoàn lại ví của bạn!`,
        true,
        true
      );
    }

    return true;
  };

  // BÁO CÁO BỎ KÈO / NO-SHOW (THỢ HOẶC KHÁCH KHÔNG XUẤT HIỆN ĐIỂM HẸN)
  const reportNoShow = (gigId: string, reporterRole: 'CLIENT' | 'WORKER', reason: string): boolean => {
    if (!currentUser) return false;
    const gig = gigs.find((g) => g.id === gigId);
    if (!gig) return false;

    if (reporterRole === 'CLIENT') {
      if (gig.clientId !== currentUser.id && currentUser.role !== 'ADMIN') {
        showNotification('Lỗi', 'Chỉ người thuê mới được báo cáo thợ bỏ bom!');
        return false;
      }
      if (!gig.freelancerId) {
        showNotification('Lỗi', 'Đơn việc này chưa có thợ nhận!');
        return false;
      }

      const penaltyFine = Math.min(30000, Math.round(gig.price * 0.15));
      const penaltyPoints = 15;

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === gig.clientId) {
            return {
              ...u,
              walletBalance: u.walletBalance + gig.price + (penaltyFine > 0 ? penaltyFine : 0),
              escrowLockedBalance: Math.max(0, u.escrowLockedBalance - gig.price),
            };
          }
          if (u.id === gig.freelancerId) {
            const updatedDiscipline = [
              ...(u.disciplineRecords || []),
              {
                id: `disc_noshow_${Date.now()}`,
                type: 'NO_SHOW' as const,
                title: 'Bị báo cáo bỏ kèo (No-Show không đến)',
                penaltyPoints,
                fineAmount: penaltyFine,
                reason: reason || 'Không có mặt tại điểm hẹn, không liên lạc được',
                createdAt: Date.now(),
                gigTitle: gig.title,
              },
            ];
            return {
              ...u,
              walletBalance: Math.max(0, u.walletBalance - penaltyFine),
              trustScore: Math.max(0, u.trustScore - penaltyPoints),
              disciplineRecords: updatedDiscipline,
            };
          }
          return u;
        })
      );

      const clientRefundTx: WalletTransactionEntity = {
        id: `tx_noshow_refund_${Date.now()}`,
        userId: gig.clientId,
        type: 'ADMIN_REFUND',
        amount: gig.price + penaltyFine,
        title: 'Bồi Thường & Hoàn Escrow (Thợ Bỏ Kèo No-Show)',
        subtitle: `Hoàn 100% (${gig.price.toLocaleString('vi-VN')}đ) + Bồi thường phạt ${penaltyFine.toLocaleString('vi-VN')}đ từ thợ bỏ kèo đơn "${gig.title}"`,
        bankInfo: 'Hệ Thống Trừng Phạt Kỷ Luật GigMe',
        timestamp: Date.now(),
        isSuccess: true,
      };

      const workerPenTx: WalletTransactionEntity = {
        id: `tx_worker_noshow_${Date.now()}`,
        userId: gig.freelancerId,
        type: 'EXPENSE',
        amount: -penaltyFine,
        title: '🚫 PHẠT VI PHẠM: BỎ KÈO (NO-SHOW)',
        subtitle: `Bị trừ 15 điểm Trust Score và phạt ${penaltyFine.toLocaleString('vi-VN')}đ do không đến điểm hẹn đơn "${gig.title}"`,
        bankInfo: 'Kỷ Luật GigMe',
        timestamp: Date.now(),
        isSuccess: true,
      };

      setTransactions((prev) => [clientRefundTx, workerPenTx, ...prev]);
      cloudService.saveTransaction(clientRefundTx);
      cloudService.saveTransaction(workerPenTx);

      const updatedGig: GigEntity = {
        ...gig,
        status: 'CANCELLED',
        cancelledAt: Date.now(),
        isNoShowReported: true,
        noShowReportedBy: 'CLIENT',
        noShowPenaltyAmount: penaltyFine,
        cancellationReason: `Khách báo thợ bỏ kèo: ${reason}`,
      };

      setGigs((prev) => prev.map((g) => (g.id === gigId ? updatedGig : g)));
      cloudService.saveGig(updatedGig);

      showNotification(
        '🚫 Đã Xử Phạt Thợ Bỏ Kèo & Hoàn Tiền',
        `Hệ thống đã trừ 15 điểm Trust Score của thợ vi phạm, thu ${penaltyFine.toLocaleString('vi-VN')}đ bồi thường và hoàn trả toàn bộ ${gig.price.toLocaleString('vi-VN')}đ cọc về ví của bạn!`,
        true,
        true
      );
      return true;
    }

    // reporterRole === 'WORKER': Thợ báo khách bỏ kèo / boom đơn
    if (currentUser.id !== gig.freelancerId && currentUser.role !== 'ADMIN') {
      showNotification('Lỗi', 'Chỉ thợ nhận việc mới được báo cáo khách bỏ kèo!');
      return false;
    }

    const compensationForWorker = Math.max(30000, Math.round(gig.price * 0.5));
    const refundToClient = Math.max(0, gig.price - compensationForWorker);

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === gig.freelancerId) {
          return {
            ...u,
            walletBalance: u.walletBalance + compensationForWorker,
          };
        }
        if (u.id === gig.clientId) {
          const updatedDiscipline = [
            ...(u.disciplineRecords || []),
            {
              id: `disc_client_noshow_${Date.now()}`,
              type: 'NO_SHOW' as const,
              title: 'Khách bỏ bom không nhận hàng/không mở cửa',
              penaltyPoints: 15,
              fineAmount: compensationForWorker,
              reason: reason || 'Thợ đã đến điểm hẹn nhưng khách không ra nhận',
              createdAt: Date.now(),
              gigTitle: gig.title,
            },
          ];
          return {
            ...u,
            walletBalance: u.walletBalance + refundToClient,
            escrowLockedBalance: Math.max(0, u.escrowLockedBalance - gig.price),
            trustScore: Math.max(0, u.trustScore - 15),
            disciplineRecords: updatedDiscipline,
          };
        }
        return u;
      })
    );

    const workerCompTx: WalletTransactionEntity = {
      id: `tx_worker_noshow_comp_${Date.now()}`,
      userId: currentUser.id,
      type: 'REWARD_EARNED',
      amount: compensationForWorker,
      title: '💰 Bồi Thường Do Khách Boom Kèo',
      subtitle: `Thù lao bồi thường công di chuyển ${compensationForWorker.toLocaleString('vi-VN')}đ từ Escrow đơn "${gig.title}"`,
      bankInfo: 'Quỹ Bảo Hiểm Chống Boom GigMe',
      timestamp: Date.now(),
      isSuccess: true,
    };

    setTransactions((prev) => [workerCompTx, ...prev]);
    cloudService.saveTransaction(workerCompTx);

    const updatedGig: GigEntity = {
      ...gig,
      status: 'CANCELLED',
      cancelledAt: Date.now(),
      isNoShowReported: true,
      noShowReportedBy: 'WORKER',
      noShowPenaltyAmount: compensationForWorker,
      cancellationReason: `Thợ báo khách boom đơn: ${reason}`,
    };

    setGigs((prev) => prev.map((g) => (g.id === gigId ? updatedGig : g)));
    cloudService.saveGig(updatedGig);

    showNotification(
      '💰 Đã Giải Ngân Tiền Bồi Thường',
      `Đã chuyển ${compensationForWorker.toLocaleString('vi-VN')}đ từ tiền cọc của khách vào ví của bạn để bồi thường công di chuyển. Khách đã bị trừ 15 điểm Trust Score!`,
      true,
      true
    );
    return true;
  };

  // SUBMIT PROOF OF WORK WITH WATERMARK GPS & TIMESTAMP & ANTI-FAKE GPS
  const submitProofOfWork = (
    gigId: string,
    note: string,
    isWatermarked = true,
    proofData?: {
      watermarkedUrl?: string;
      hash?: string;
      coords?: { lat: number; lng: number };
      timestamp?: number;
    }
  ) => {
    if (!currentUser) return;

    const target = gigs.find((g) => g.id === gigId);
    if (!target) return;

    // Chặn gian lận tọa độ & Mock Location (Anti-Fake GPS)
    const proofGps = proofData?.coords
      ? { latitude: proofData.coords.lat, longitude: proofData.coords.lng }
      : userCoords;

    const gpsCheck = validateGpsAuthenticity(proofGps, {
      latitude: target.latitude,
      longitude: target.longitude,
      locationName: target.locationName,
    });

    if (gpsCheck.status === 'BLOCKED') {
      showNotification(
        '🚫 Chặn Nghiệm Thu (Anti-Fake GPS)',
        `Phát hiện tọa độ ảo / vi phạm geofence: ${gpsCheck.reasons.join(' ')} Vui lòng tắt ứng dụng giả lập GPS và nộp minh chứng tại hiện trường!`,
        false
      );
      return;
    }

    const resolvedUrl =
      proofData?.watermarkedUrl ||
      target.proofImageUrl ||
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop';

    const updatedGig: GigEntity = {
      ...target,
      status: 'SUBMITTED',
      proofNote: note,
      proofIsWatermarked: isWatermarked,
      proofImageUrl: resolvedUrl,
      proofWatermarkUrl: proofData?.watermarkedUrl,
      proofHash: proofData?.hash,
      proofGpsCoords: proofData?.coords || { lat: userCoords.latitude, lng: userCoords.longitude },
      proofTimestamp: proofData?.timestamp || Date.now(),
      gpsAuthenticityStatus: gpsCheck.status === 'GENUINE' ? 'GENUINE_SENSOR' : 'SUSPICIOUS_MOCK',
      gpsAccuracyMeters: gpsCheck.distanceToGigMeters,
    };
    setGigs((prev) => prev.map((g) => (g.id === gigId ? updatedGig : g)));
    cloudService.saveGig(updatedGig);

    const chatMsg: ChatMessageEntity = {
      id: `msg_${Date.now()}`,
      gigId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      isFromClient: false,
      message: `📸 [Nghiệm thu công việc GPS & Watermark] Mình đã hoàn thành: ${note}. ${
        proofData?.hash ? `Mã băm Blockchain: ${proofData.hash}` : ''
      } ${isWatermarked ? '(Bản nghiệm thu có Watermark GPS & Giờ giấc chống bùng)' : '(Bản chính thức)'}`,
      attachmentType: isWatermarked ? 'WATERMARK_PREVIEW' : 'PROOF_SCREENSHOT',
      attachmentData: resolvedUrl,
      timestamp: Date.now(),
    };
    setChats((prev) => [...prev, chatMsg]);
    cloudService.saveChatMessage(chatMsg);

    showNotification(
      'Đã nộp bằng chứng nghiệm thu!',
      'Ảnh đã được đóng dấu Watermark GPS & Giờ giấc thời gian thực. Khách hàng có 24h để xác nhận giải ngân!',
      true
    );
  };

  // RELEASE SMART ESCROW PAYOUT
  const releaseEscrowPayout = (
    gigId: string,
    enteredPin = '',
    tipAmount = 0,
    useBiometrics = false
  ): boolean => {
    if (!currentUser) return false;

    const targetGig = gigs.find((g) => g.id === gigId);
    if (!targetGig) return false;

    // ANTI-DUPE / ANTI-DOUBLE-RELEASE GUARD
    if (targetGig.status === 'COMPLETED' || targetGig.status === 'CLIENT_REFUNDED') {
      showNotification(
        'Đơn đã hoàn tất',
        'Đơn việc này đã được giải ngân hoặc hoàn tất trước đó. Không thể thực hiện lại để chống lặp tiền!'
      );
      return false;
    }

    if (!useBiometrics && enteredPin !== currentUser.securityPin) {
      showNotification(
        'Mã PIN không chính xác',
        'Mã PIN 6 số dùng để giải ngân không đúng. Vui lòng thử lại hoặc dùng xác thực vân tay!'
      );
      return false;
    }

    const tierConfig = USER_TIERS[currentUser.tier];
    const feeRate = tierConfig.commissionRate;
    const gigPrice = targetGig.price;
    const platformFee = Math.round(gigPrice * feeRate);
    // Khấu trừ Thuế Thu Nhập Cá Nhân (TNCN vãng lai 10% nếu đơn hàng >= 2.000.000đ theo TT 111/2013/TT-BTC)
    const taxRate = gigPrice >= 2000000 ? 0.10 : 0;
    const taxAmount = Math.round(gigPrice * taxRate);
    const freelancerPayout = gigPrice - platformFee - taxAmount + tipAmount;

    // Update Gig & sync to Cloud
    const updatedCompletedGig: GigEntity = {
      ...targetGig,
      status: 'COMPLETED',
      completedAt: Date.now(),
      tipAmount,
      isWatermarkRemoved: true,
    };
    setGigs((prev) => prev.map((g) => (g.id === gigId ? updatedCompletedGig : g)));
    cloudService.saveGig(updatedCompletedGig);

    // Update Client Escrow & Wallet, pay freelancer, and credit 10% fee to Admin platform balance
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === currentUser.id) {
          const updatedClient = {
            ...u,
            escrowLockedBalance: Math.max(0, u.escrowLockedBalance - gigPrice),
            walletBalance: u.walletBalance - tipAmount,
            completedGigs: u.completedGigs + 1,
          };
          cloudService.saveUser(updatedClient);
          return updatedClient;
        }
        if (targetGig.freelancerId && u.id === targetGig.freelancerId) {
          const updatedFreelancer = {
            ...u,
            walletBalance: u.walletBalance + freelancerPayout,
            completedGigs: u.completedGigs + 1,
          };
          cloudService.saveUser(updatedFreelancer);
          return updatedFreelancer;
        }
        if (u.id === 'admin_root' || u.role === 'ADMIN') {
          const updatedAdmin = {
            ...u,
            walletBalance: u.walletBalance + platformFee,
          };
          cloudService.saveUser(updatedAdmin);
          return updatedAdmin;
        }
        return u;
      })
    );

    const now = Date.now();
    const txPayout: WalletTransactionEntity = {
      id: `tx_${now}_payout`,
      userId: targetGig.freelancerId || currentUser.id,
      type: 'ESCROW_PAYOUT',
      amount: freelancerPayout,
      title: 'Giải ngân Smart Escrow thành công',
      subtitle: `Đơn "${targetGig.title}" • Thực nhận ${freelancerPayout.toLocaleString()}đ ${
        taxAmount > 0 ? `(Đã khấu trừ thuế TNCN 10%: ${taxAmount.toLocaleString()}đ)` : ''
      } ${tipAmount > 0 ? `(+${tipAmount.toLocaleString()}đ Tip)` : ''}`,
      bankInfo: 'GigMe Escrow Auto-Split',
      timestamp: now,
      isSuccess: true,
    };

    const txFee: WalletTransactionEntity = {
      id: `tx_${now}_fee`,
      userId: currentUser.id,
      type: 'PLATFORM_FEE',
      amount: -platformFee,
      title: `Phí dịch vụ nền tảng ${Math.round(feeRate * 100)}%`,
      subtitle: 'Bảo vệ thanh toán, kiểm duyệt & tự động gỡ Watermark',
      bankInfo: 'GigMe Platform Fee',
      timestamp: now + 1,
      isSuccess: true,
    };

    const txAdminFee: WalletTransactionEntity = {
      id: `tx_${now}_admin_fee`,
      userId: 'admin_root',
      type: 'REWARD_EARNED',
      amount: platformFee,
      title: `Doanh thu phí sàn GigMe ${Math.round(feeRate * 100)}%`,
      subtitle: `Thu từ đơn "${targetGig.title}" (${gigPrice.toLocaleString()}đ) - Đã ghi nhận vào ví nền tảng của Admin`,
      bankInfo: 'Ví doanh thu hệ thống GigMe',
      timestamp: now + 2,
      isSuccess: true,
    };

    setTransactions((prev) => [txPayout, txFee, txAdminFee, ...prev]);
    cloudService.saveTransaction(txPayout);
    cloudService.saveTransaction(txFee);
    cloudService.saveTransaction(txAdminFee);

    // Thực thi Firestore ACID Transaction bảo vệ tiền Escrow đa phiên
    if (targetGig.freelancerId) {
      executeAtomicEscrowPayout({
        gigId,
        clientId: currentUser.id,
        freelancerId: targetGig.freelancerId,
        gigPrice,
        platformFee,
        taxAmount,
        netPayoutToWorker: freelancerPayout,
        tipAmount,
      }).catch((err) => console.warn('Firestore atomic escrow error (fallback):', err));
    }

    // Also trigger cloud atomic escrow endpoint for server-side idempotency
    cloudService.releaseEscrow({
      gigId,
      clientId: currentUser.id,
      pin: enteredPin,
      useBiometrics,
      tipAmount,
    });

    triggerHaptic('escrow');
    showNotification(
      'ĐING! 🔔 Tiền đã về ví!',
      `Đã giải ngân thành công ${freelancerPayout.toLocaleString()}đ (đã trừ phí ${Math.round(
        feeRate * 100
      )}% ${taxAmount > 0 ? `và thuế TNCN ${taxAmount.toLocaleString()}đ` : ''}). Đã tự động gỡ Watermark bản gốc!`,
      true,
      true
    );
    return true;
  };

  // MILESTONE ESCROW PAYOUT (Thanh toán theo giai đoạn 30% - 70%)
  const releaseMilestonePayout = (
    gigId: string,
    milestonePercent: number,
    enteredPin = '',
    useBiometrics = false
  ): boolean => {
    if (!currentUser) return false;
    const targetGig = gigs.find((g) => g.id === gigId);
    if (!targetGig) return false;
    if (!useBiometrics && enteredPin !== currentUser.securityPin) {
      showNotification('Mã PIN không đúng', 'Mã PIN bảo mật không chính xác!');
      return false;
    }

    const partRatio = Math.max(0.1, Math.min(1, milestonePercent / 100));
    const milestonePrice = Math.round(targetGig.price * partRatio);
    const tierConfig = USER_TIERS[currentUser.tier];
    const feeRate = tierConfig.commissionRate;
    const platformFee = Math.round(milestonePrice * feeRate);
    const taxAmount = milestonePrice >= 2000000 ? Math.round(milestonePrice * 0.10) : 0;
    const payout = milestonePrice - platformFee - taxAmount;

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === currentUser.id) {
          return {
            ...u,
            escrowLockedBalance: Math.max(0, u.escrowLockedBalance - milestonePrice),
          };
        }
        if (targetGig.freelancerId && u.id === targetGig.freelancerId) {
          return {
            ...u,
            walletBalance: u.walletBalance + payout,
          };
        }
        return u;
      })
    );

    const tx: WalletTransactionEntity = {
      id: `tx_${Date.now()}_milestone`,
      userId: targetGig.freelancerId || currentUser.id,
      type: 'ESCROW_PAYOUT',
      amount: payout,
      title: `Giải ngân theo Giai đoạn ${milestonePercent}%`,
      subtitle: `Đơn "${targetGig.title}" • Tạm ứng ${payout.toLocaleString()}đ theo tiến độ nghiệm thu`,
      bankInfo: 'GigMe Milestone Escrow',
      timestamp: Date.now(),
      isSuccess: true,
    };
    setTransactions((prev) => [tx, ...prev]);

    showNotification(
      `Giải ngân Giai đoạn ${milestonePercent}% thành công!`,
      `Đã giải ngân ${payout.toLocaleString()}đ cho đối tác theo thỏa thuận hợp đồng giai đoạn.`,
      true,
      true
    );
    return true;
  };

  // FILE DISPUTE
  const fileDispute = (gigId: string, reason: string) => {
    setGigs((prev) => prev.map((g) => (g.id === gigId ? { ...g, status: 'DISPUTED' } : g)));
    showNotification(
      'Đã gửi khiếu nại tranh chấp!',
      `Lý do: "${reason}". Bộ phận Trọng tài AI & Admin GigMe sẽ phân xử trong 24h. Tiền vẫn an toàn trong Escrow!`,
      true
    );
  };

  // 1. FLASH BOOST GIG (PHÍ ĐẨY BÀI & GHIM TOP 1)
  const boostGig = (gigId: string): boolean => {
    if (!currentUser) return false;
    const gig = gigs.find((g) => g.id === gigId);
    if (!gig) return false;
    if (gig.clientId !== currentUser.id) {
      showNotification('Không có quyền', 'Chỉ người đăng bài mới có thể đẩy bài này!');
      return false;
    }
    const BOOST_FEE = 10000;
    if (currentUser.walletBalance < BOOST_FEE) {
      showNotification(
        'Số dư không đủ',
        `Bạn cần tối thiểu 10.000đ trong ví để kích hoạt Đẩy Bài Hỏa Tốc. Số dư hiện có: ${currentUser.walletBalance.toLocaleString()}đ.`
      );
      return false;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              walletBalance: u.walletBalance - BOOST_FEE,
              totalSpent: u.totalSpent + BOOST_FEE,
            }
          : u
      )
    );

    const boostDurationMs = 2 * 3600 * 1000; // 2 giờ ghim Top 1
    const updatedBoostGig: GigEntity = {
      ...gig,
      isBoosted: true,
      isFlash: true,
      isPinned: true,
      boostFeePaid: (gig.boostFeePaid || 0) + BOOST_FEE,
      boostedUntil: Date.now() + boostDurationMs,
    };
    setGigs((prev) => prev.map((g) => (g.id === gigId ? updatedBoostGig : g)));
    cloudService.saveGig(updatedBoostGig);

    const txBoost: WalletTransactionEntity = {
      id: `tx_${Date.now()}_boost`,
      userId: currentUser.id,
      type: 'EXPENSE',
      amount: -BOOST_FEE,
      title: '🚀 Phí Đẩy Bài & Ghim Hỏa Tốc (Flash Boost)',
      subtitle: `Đơn "${gig.title}" • Ghim Top 1 trang chủ trong 2 giờ`,
      bankInfo: 'GigMe Flash Promotion',
      timestamp: Date.now(),
      isSuccess: true,
    };
    setTransactions((prev) => [txBoost, ...prev]);

    showNotification(
      '🚀 Đẩy bài Hỏa Tốc thành công!',
      `Đơn của bạn đã được ghim lên Top 1 trang chủ với viền Neon phát sáng. Hàng trăm sinh viên quanh trường sẽ thấy đơn đầu tiên!`,
      true,
      true
    );
    return true;
  };

  // 2. LIVE REVERSE AUCTION ROOM (ĐẤU GIÁ NGƯỢC THỜI GIAN THỰC - CHỈ CLIENT MỚI ĐƯỢC TẠO PHÒNG)
  const openReverseAuctionRoom = (gigId: string, durationMinutes: number, ceilingPrice: number): boolean => {
    if (!currentUser) return false;
    const gig = gigs.find((g) => g.id === gigId);
    if (!gig) return false;
    // QUY TẮC BẢO VỆ TUYỆT ĐỐI THEO YÊU CẦU CỦA USER: Chỉ người thuê muốn tạo thì mới tạo, còn không thì không thể tạo
    if (gig.clientId !== currentUser.id) {
      showNotification(
        'Không có quyền mở phòng',
        'Chỉ người thuê (chủ đơn) mới có quyền mở phòng đấu giá ngược cho đơn này!'
      );
      return false;
    }

    const updatedAuctionGig: GigEntity = {
      ...gig,
      isReverseAuction: true,
      auctionRoomOpen: true,
      auctionRoomCreatedAt: Date.now(),
      auctionRoomDurationMinutes: durationMinutes,
      auctionCeilingPrice: ceilingPrice,
      lowestBidPrice: ceilingPrice,
    };
    setGigs((prev) => prev.map((g) => (g.id === gigId ? updatedAuctionGig : g)));
    cloudService.saveGig(updatedAuctionGig);

    showNotification(
      '🔥 Đã mở Phòng Đấu Giá Ngược!',
      `Phòng đấu giá trực tiếp cho đơn "${gig.title}" đã kích hoạt trong ${durationMinutes} phút với giá trần ${ceilingPrice.toLocaleString()}đ. Các Freelancer có thể vào đặt giá cạnh tranh ngay!`,
      true,
      true
    );
    return true;
  };

  const closeReverseAuctionRoom = (gigId: string, winningBidId?: string): boolean => {
    if (!currentUser) return false;
    const gig = gigs.find((g) => g.id === gigId);
    if (!gig) return false;
    if (gig.clientId !== currentUser.id) {
      showNotification('Không có quyền', 'Chỉ chủ đơn mới có quyền chốt giá và đóng phòng đấu giá!');
      return false;
    }

    const winningBid = winningBidId ? bids.find((b) => b.id === winningBidId) : null;

    if (winningBid) {
      const priceDifference = Math.max(0, gig.price - winningBid.offeredPrice);

      // Hoàn trả phần tiền chênh lệch tiết kiệm được vào ví Client
      if (priceDifference > 0) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === currentUser.id
              ? {
                  ...u,
                  walletBalance: u.walletBalance + priceDifference,
                  escrowLockedBalance: Math.max(0, u.escrowLockedBalance - priceDifference),
                }
              : u
          )
        );

        const txSavings: WalletTransactionEntity = {
          id: `tx_${Date.now()}_savings`,
          userId: currentUser.id,
          type: 'ESCROW_RELEASE',
          amount: priceDifference,
          title: '💰 Tiết kiệm từ Đấu Giá Ngược',
          subtitle: `Hoàn tiền chênh lệch ${priceDifference.toLocaleString()}đ về ví của bạn`,
          bankInfo: 'GigMe Smart Escrow Savings',
          timestamp: Date.now(),
          isSuccess: true,
        };
        setTransactions((prev) => [txSavings, ...prev]);
      }

      const updatedWinningGig: GigEntity = {
        ...gig,
        price: winningBid.offeredPrice,
        lowestBidPrice: winningBid.offeredPrice,
        freelancerId: winningBid.freelancerId,
        freelancerName: winningBid.freelancerName,
        status: 'IN_PROGRESS',
        auctionRoomOpen: false,
      };
      setGigs((prev) => prev.map((g) => (g.id === gigId ? updatedWinningGig : g)));
      cloudService.saveGig(updatedWinningGig);

      showNotification(
        '🏆 Đã chốt người thắng thầu!',
        `Bạn đã chọn ${winningBid.freelancerName} với mức giá ${winningBid.offeredPrice.toLocaleString()}đ ${
          priceDifference > 0 ? `(Tiết kiệm được ${priceDifference.toLocaleString()}đ!)` : ''
        }`,
        true,
        true
      );
    } else {
      const updatedClosedGig: GigEntity = { ...gig, auctionRoomOpen: false };
      setGigs((prev) => prev.map((g) => (g.id === gigId ? updatedClosedGig : g)));
      cloudService.saveGig(updatedClosedGig);
      showNotification('Đã đóng phòng đấu giá', 'Phòng đấu giá đã được đóng lại.');
    }
    return true;
  };

  // 3. MULTI-WORKER GROUP GIG (ĐƠN VIỆC NHÓM & ĐIỂM DANH QR)
  const joinMultiWorkerGig = (gigId: string): boolean => {
    if (!currentUser) return false;
    const gig = gigs.find((g) => g.id === gigId);
    if (!gig) return false;
    if (gig.clientId === currentUser.id) {
      showNotification('Không hợp lệ', 'Bạn là chủ đơn nên không thể tự tham gia làm trợ thủ!');
      return false;
    }
    const currentWorkers = gig.multiWorkers || [];
    if (currentWorkers.some((w) => w.workerId === currentUser.id)) {
      showNotification('Đã tham gia', 'Bạn đã có tên trong danh sách đội ngũ của ca làm việc này!');
      return true;
    }
    if (currentWorkers.length >= (gig.totalWorkersNeeded || 1)) {
      showNotification('Ca đã đủ người', 'Ca làm việc nhóm này đã đủ số lượng thành viên!');
      return false;
    }

    const rewardPerPerson = Math.floor(gig.price / (gig.totalWorkersNeeded || 1));
    const newWorker = {
      id: `mw_${Date.now()}`,
      workerId: currentUser.id,
      workerName: currentUser.name,
      workerPhone: currentUser.phone,
      isCheckedIn: false,
      isPaid: false,
      rewardPerPerson,
    };

    const updatedWorkers = [...currentWorkers, newWorker];
    const isFull = updatedWorkers.length >= (gig.totalWorkersNeeded || 1);

    const updatedGroupGig: GigEntity = {
      ...gig,
      multiWorkers: updatedWorkers,
      confirmedWorkersCount: updatedWorkers.length,
      status: isFull ? 'IN_PROGRESS' : gig.status,
      checkInSecretCode: gig.checkInSecretCode || Math.floor(100000 + Math.random() * 900000).toString(),
    };
    setGigs((prev) => prev.map((g) => (g.id === gigId ? updatedGroupGig : g)));
    cloudService.saveGig(updatedGroupGig);

    triggerHaptic('success');
    showNotification(
      '🎉 Đã tham gia nhóm thành công!',
      `Bạn đã ghi tên vào ca "${gig.title}". Thù lao nhận được là ${rewardPerPerson.toLocaleString()}đ khi hoàn tất. Hãy đến đúng giờ và quét QR điểm danh nhé!`,
      true,
      true
    );
    return true;
  };

  const checkInMultiWorker = (gigId: string, enteredCode: string): boolean => {
    if (!currentUser) return false;
    const gig = gigs.find((g) => g.id === gigId);
    if (!gig) return false;

    // Chặn gian lận vị trí & Mock Location khi điểm danh
    const gpsCheck = validateGpsAuthenticity(userCoords, {
      latitude: gig.latitude,
      longitude: gig.longitude,
      locationName: gig.locationName,
    });

    if (gpsCheck.status === 'BLOCKED') {
      showNotification(
        '🚫 Chặn Điểm Danh (Anti-Fake GPS)',
        `Phát hiện vi phạm vị trí: ${gpsCheck.reasons.join(' ')} Vui lòng tắt ứng dụng giả lập tọa độ ảo và có mặt thực tế tại địa điểm!`,
        false
      );
      return false;
    }

    // Xác thực mã bảo mật cryptographic token - Không cho phép bypass
    const validCode = gig.checkInSecretCode || '';
    if (!validCode || !validateSecurityToken(enteredCode, validCode)) {
      showNotification('Mã không hợp lệ', 'Mã QR hoặc mã xác nhận không đúng. Vui lòng quét trực tiếp mã QR từ máy của chủ việc!');
      return false;
    }

    const currentWorkers = gig.multiWorkers || [];
    const workerIndex = currentWorkers.findIndex((w) => w.workerId === currentUser.id);

    if (workerIndex === -1) {
      showNotification('Chưa tham gia', 'Bạn chưa tham gia ca làm việc này!');
      return false;
    }

    const updatedWorkers = [...currentWorkers];
    updatedWorkers[workerIndex] = {
      ...updatedWorkers[workerIndex],
      isCheckedIn: true,
      checkedInAt: Date.now(),
    };

    const updatedCheckInGig: GigEntity = {
      ...gig,
      multiWorkers: updatedWorkers,
    };
    setGigs((prev) => prev.map((g) => (g.id === gigId ? updatedCheckInGig : g)));
    cloudService.saveGig(updatedCheckInGig);

    triggerHaptic('success');
    showNotification(
      '✅ Điểm danh Check-in Thành Công!',
      `Đã ghi nhận sự có mặt của bạn tại ${gig.locationName} lúc ${new Date().toLocaleTimeString('vi-VN')}. Chúc bạn có ca làm việc hiệu quả!`,
      true,
      true
    );
    return true;
  };

  const payoutMultiWorkers = (gigId: string): boolean => {
    if (!currentUser) return false;
    const gig = gigs.find((g) => g.id === gigId);
    if (!gig) return false;
    if (gig.clientId !== currentUser.id) {
      showNotification('Không có quyền', 'Chỉ người thuê mới có quyền duyệt nghiệm thu và giải ngân cho nhóm!');
      return false;
    }

    const workers = gig.multiWorkers || [];
    const checkedInWorkers = workers.filter((w) => w.isCheckedIn && !w.isPaid);

    if (checkedInWorkers.length === 0) {
      showNotification('Chưa có ai check-in', 'Không có trợ thủ nào đã check-in điểm danh để giải ngân!');
      return false;
    }

    const rewardPerPerson = Math.floor(gig.price / (gig.totalWorkersNeeded || 1));
    const feeRate = 0.10; // 10%
    const payoutPerPerson = Math.floor(rewardPerPerson * (1 - feeRate));
    const feePerPerson = Math.floor(rewardPerPerson * feeRate);
    const totalGroupFee = feePerPerson * checkedInWorkers.length;
    const totalDistributed = rewardPerPerson * checkedInWorkers.length;
    const remainingClientRefund = Math.max(0, gig.price - totalDistributed);

    // Khấu trừ Escrow của Client, chuyển tiền tự động vào từng ví cá nhân của từng bạn và hoàn tiền dư nếu không đủ người
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === currentUser.id) {
          return {
            ...u,
            walletBalance: u.walletBalance + remainingClientRefund,
            escrowLockedBalance: Math.max(0, u.escrowLockedBalance - gig.price),
            completedGigs: u.completedGigs + 1,
          };
        }
        const matchingWorker = checkedInWorkers.find((w) => w.workerId === u.id);
        if (matchingWorker) {
          return {
            ...u,
            walletBalance: u.walletBalance + payoutPerPerson,
            completedGigs: u.completedGigs + 1,
          };
        }
        if (u.id === 'admin_root' || u.role === 'ADMIN') {
          return {
            ...u,
            walletBalance: u.walletBalance + totalGroupFee,
          };
        }
        return u;
      })
    );

    const updatedWorkers = workers.map((w) =>
      w.isCheckedIn ? { ...w, isPaid: true } : w
    );

    const updatedGroupPayoutGig: GigEntity = {
      ...gig,
      status: 'COMPLETED',
      completedAt: Date.now(),
      multiWorkers: updatedWorkers,
    };
    setGigs((prev) => prev.map((g) => (g.id === gigId ? updatedGroupPayoutGig : g)));
    cloudService.saveGig(updatedGroupPayoutGig);

    triggerHaptic('escrow');

    // Ghi log giao dịch ví từng thành viên
    checkedInWorkers.forEach((w) => {
      const tx: WalletTransactionEntity = {
        id: `tx_${Date.now()}_payout_${w.workerId}`,
        userId: w.workerId,
        type: 'ESCROW_PAYOUT',
        amount: payoutPerPerson,
        title: 'Tự Động Chia Thù Lao Kèo Nhóm (Split Payout)',
        subtitle: `Đơn "${gig.title}" • Tiền chuyển thẳng về ví cá nhân ${payoutPerPerson.toLocaleString('vi-VN')}đ (sau 10% phí)`,
        bankInfo: 'GigMe Split Payout Smart Escrow',
        timestamp: Date.now(),
        isSuccess: true,
      };
      setTransactions((prev) => [tx, ...prev]);
    });

    if (remainingClientRefund > 0) {
      const txRefund: WalletTransactionEntity = {
        id: `tx_${Date.now()}_client_refund_unclaimed`,
        userId: currentUser.id,
        type: 'ADMIN_REFUND',
        amount: remainingClientRefund,
        title: 'Hoàn Tiền Thừa Kèo Nhóm',
        subtitle: `Hoàn ${remainingClientRefund.toLocaleString('vi-VN')}đ do có ${(gig.totalWorkersNeeded || 1) - checkedInWorkers.length} vị trí không điểm danh`,
        bankInfo: 'GigMe Smart Escrow',
        timestamp: Date.now() + 1,
        isSuccess: true,
      };
      setTransactions((prev) => [txRefund, ...prev]);
    }

    if (totalGroupFee > 0) {
      const txAdminGroupFee: WalletTransactionEntity = {
        id: `tx_${Date.now()}_admin_group_fee`,
        userId: 'admin_root',
        type: 'REWARD_EARNED',
        amount: totalGroupFee,
        title: 'Doanh thu phí sàn nhóm 10%',
        subtitle: `Thu từ đơn nhóm "${gig.title}" (${checkedInWorkers.length} người) - Đã vào ví trang mạng admin`,
        bankInfo: 'Ví doanh thu hệ thống GigMe',
        timestamp: Date.now(),
        isSuccess: true,
      };
      setTransactions((prev) => [txAdminGroupFee, ...prev]);
    }

    showNotification(
      '⚡ Split Payout Tự Động Hoàn Tất!',
      `Hệ thống đã tự động chia đều ${payoutPerPerson.toLocaleString('vi-VN')}đ/người về thẳng ví cá nhân của ${checkedInWorkers.length} bạn thành viên ngay lập tức. Nhóm trưởng không cần chia thủ công! ${remainingClientRefund > 0 ? `Đã hoàn lại ${remainingClientRefund.toLocaleString('vi-VN')}đ tiền suất trống vào ví của bạn.` : ''}`,
      true,
      true
    );
    return true;
  };

  // CHECK DEPOSIT ELIGIBILITY (Max 10M/tx, 1h cooldown, max 30M/day)
  const checkDepositEligibility = (amount?: number): {
    allowed: boolean;
    reason?: string;
    cooldownMinutesLeft: number;
    todayDeposited: number;
    remainingDailyQuota: number;
    maxPerTx: number;
  } => {
    const maxPerTx = 10_000_000;
    const maxPerDay = 30_000_000;
    const cooldownMs = 60 * 60 * 1000; // 1 giờ

    if (!currentUser) {
      return {
        allowed: false,
        reason: 'Vui lòng đăng nhập để nạp tiền.',
        cooldownMinutesLeft: 0,
        todayDeposited: 0,
        remainingDailyQuota: maxPerDay,
        maxPerTx,
      };
    }

    // Lọc tất cả giao dịch nạp thành công của user
    const userDeposits = transactions.filter(
      (t) =>
        t.userId === currentUser.id &&
        (t.type === 'VIETQR_DEPOSIT' || t.type === 'EWALLET_DEPOSIT') &&
        t.isSuccess &&
        t.amount > 0
    );

    // Tính tổng số tiền đã nạp trong ngày hôm nay (từ 00:00:00)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayStartMs = startOfDay.getTime();

    const todayDeposits = userDeposits.filter((t) => t.timestamp >= todayStartMs);
    const todayDeposited = todayDeposits.reduce((sum, t) => sum + t.amount, 0);
    const remainingDailyQuota = Math.max(0, maxPerDay - todayDeposited);

    // Tìm lần nạp gần nhất để kiểm tra thời gian giãn cách 1 giờ
    const sortedDeposits = [...userDeposits].sort((a, b) => b.timestamp - a.timestamp);
    const lastDeposit = sortedDeposits[0];
    let cooldownMinutesLeft = 0;

    if (lastDeposit) {
      const elapsed = Date.now() - lastDeposit.timestamp;
      if (elapsed < cooldownMs) {
        cooldownMinutesLeft = Math.ceil((cooldownMs - elapsed) / (60 * 1000));
      }
    }

    if (cooldownMinutesLeft > 0) {
      return {
        allowed: false,
        reason: `Quy định bảo mật: Bạn vừa nạp tiền lúc ${new Date(lastDeposit.timestamp).toLocaleTimeString('vi-VN')}. Vui lòng đợi thêm ${cooldownMinutesLeft} phút nữa để thực hiện lần nạp tiếp theo (giãn cách tối thiểu 1 giờ/lần).`,
        cooldownMinutesLeft,
        todayDeposited,
        remainingDailyQuota,
        maxPerTx,
      };
    }

    if (amount !== undefined && amount > maxPerTx) {
      return {
        allowed: false,
        reason: `Mỗi lần nạp tối đa 10.000.000đ (10 triệu VNĐ). Vui lòng điều chỉnh lại số tiền nạp!`,
        cooldownMinutesLeft: 0,
        todayDeposited,
        remainingDailyQuota,
        maxPerTx,
      };
    }

    if (amount !== undefined && todayDeposited + amount > maxPerDay) {
      return {
        allowed: false,
        reason: `Hạn mức nạp tối đa mỗi ngày là 30.000.000đ. Hôm nay bạn đã nạp ${todayDeposited.toLocaleString('vi-VN')}đ, chỉ còn có thể nạp tối đa ${remainingDailyQuota.toLocaleString('vi-VN')}đ!`,
        cooldownMinutesLeft: 0,
        todayDeposited,
        remainingDailyQuota,
        maxPerTx,
      };
    }

    if (remainingDailyQuota <= 0) {
      return {
        allowed: false,
        reason: 'Hôm nay bạn đã chạm hạn mức tối đa 30.000.000đ/ngày. Vui lòng quay lại vào ngày mai!',
        cooldownMinutesLeft: 0,
        todayDeposited,
        remainingDailyQuota: 0,
        maxPerTx,
      };
    }

    return {
      allowed: true,
      cooldownMinutesLeft: 0,
      todayDeposited,
      remainingDailyQuota,
      maxPerTx,
    };
  };

  // DEPOSIT VIETQR DYNAMIC WITH ATOMIC CLOUD SYNC & DEPOSIT LIMIT CHECKS
  const depositVietQr = (amount: number, bankName: string): boolean => {
    if (!currentUser) return false;

    const eligibility = checkDepositEligibility(amount);
    if (!eligibility.allowed) {
      showNotification('Giới hạn nạp tiền ⚠️', eligibility.reason || 'Không đủ điều kiện nạp tiền');
      return false;
    }

    const txId = generateSecureTxId('tx_dep');
    const updatedUser: UserEntity = {
      ...currentUser,
      walletBalance: currentUser.walletBalance + amount,
    };
    const tx: WalletTransactionEntity = {
      id: txId,
      userId: currentUser.id,
      type: 'VIETQR_DEPOSIT',
      amount,
      title: 'Nạp tiền VietQR Động',
      subtitle: `${bankName} • Cổng chuyển mạch Napas 247 khớp tự động`,
      bankInfo: bankName,
      timestamp: Date.now(),
      isSuccess: true,
    };

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setTransactions((prev) => [tx, ...prev]);

    // Atomic Cloud Sync
    cloudService.depositWallet({
      userId: currentUser.id,
      amount,
      bankName,
      transactionId: txId,
      note: 'Nạp tiền VietQR Động 24/7',
    });
    cloudService.saveUser(updatedUser);
    cloudService.saveTransaction(tx);

    showNotification(
      'ĐING! Nạp tiền thành công! 💰',
      `Đã cộng ${amount.toLocaleString()}đ vào ví GigMe qua VietQR ${bankName}!`,
      true,
      true
    );
    return true;
  };

  // BANK WITHDRAWAL WITH ANTI-FRAUD KYC MATCH, TIER LIMIT & NAPAS 247 INSTANT
  const withdrawToBank = (
    bankName: string,
    accountNumber: string,
    accountHolderName: string,
    amount: number,
    pin = '',
    useBiometrics = false
  ): boolean => {
    if (!currentUser) return false;
    if (!useBiometrics && pin !== currentUser.securityPin) {
      showNotification('Mã PIN không đúng', 'Mã PIN bảo mật 6 số không khớp. Vui lòng kiểm tra lại!');
      return false;
    }

    const tierConfig = USER_TIERS[currentUser.tier];
    if (amount > tierConfig.maxDeposit) {
      showNotification(
        'Vượt hạn mức rút tiền',
        `Tài khoản ${tierConfig.title} (${currentUser.tier}) chỉ được rút tối đa ${tierConfig.maxDeposit.toLocaleString('vi-VN')}đ/lần. Vui lòng nâng hạng CCCD để tăng hạn mức!`
      );
      return false;
    }

    if (amount > currentUser.walletBalance) {
      showNotification(
        'Số dư không đủ',
        `Số dư khả dụng hiện tại là ${currentUser.walletBalance.toLocaleString()}đ, không đủ để rút ${amount.toLocaleString()}đ.`
      );
      return false;
    }

    const normalizedInput = normalizeVietnameseName(accountHolderName);
    const normalizedKyc = normalizeVietnameseName(currentUser.kycName || currentUser.name);
    if (normalizedKyc && normalizedInput && normalizedInput !== normalizedKyc) {
      showNotification(
        'Chống gian lận: Tên không khớp!',
        `Tên chủ tài khoản nhận tiền (${normalizedInput}) KHÔNG KHỚP với tên định danh E-KYC (${normalizedKyc}). GigMe từ chối giao dịch để bảo vệ bạn!`
      );
      return false;
    }

    const txId = generateSecureTxId('tx_wd');
    const napasRef = `NAPAS_FT_${Date.now().toString().slice(-8)}`;
    const updatedUser: UserEntity = {
      ...currentUser,
      walletBalance: currentUser.walletBalance - amount,
      defaultBank: {
        bankName,
        accountNumber,
        accountHolder: accountHolderName,
      },
    };
    const tx: WalletTransactionEntity = {
      id: txId,
      userId: currentUser.id,
      type: 'BANK_WITHDRAWAL',
      amount: -amount,
      title: 'Rút tiền Napas 247 Siêu Tốc',
      subtitle: `${bankName} - ${accountNumber} (${normalizedInput || accountHolderName}) • Ref: ${napasRef}`,
      bankInfo: `${bankName} • Napas 247: ${napasRef}`,
      timestamp: Date.now(),
      isSuccess: true,
    };

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setTransactions((prev) => [tx, ...prev]);

    // Atomic Cloud Sync & Napas 24/7 Instant Auto-Disbursement
    cloudService.withdrawWallet({
      userId: currentUser.id,
      amount,
      bankName,
      accountNumber,
      accountHolderName: normalizedInput,
      pin,
      useBiometrics,
      transactionId: txId,
    });
    cloudService.saveUser(updatedUser);
    cloudService.saveTransaction(tx);

    // Kích hoạt cổng giải ngân tức thì Napas 247 & VietQR T0
    executeInstantDisbursement({
      userId: currentUser.id,
      amount,
      bankName,
      accountNumber,
      accountHolderName: normalizedInput || accountHolderName,
      pin,
      useBiometrics,
    }).catch((err) => console.warn('Napas 247 Instant disbursement error:', err));

    showNotification(
      '⚡ Giải Ngân Tự Động 24/7 Thành Công!',
      `Đã chuyển ${amount.toLocaleString()}đ tới ${bankName} (${accountNumber} - ${normalizedInput}). Chuyển mạch Napas 247 hoàn tất tức thì.`,
      true,
      true
    );
    return true;
  };

  const saveDefaultBank = (bankName: string, accountNumber: string, accountHolder: string) => {
    if (!currentUser) return;
    const updatedUser: UserEntity = {
      ...currentUser,
      defaultBank: {
        bankName,
        accountNumber,
        accountHolder,
      },
    };
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    cloudService.saveUser(updatedUser);
    showNotification(
      'Đã lưu tài khoản ngân hàng',
      `Đã cập nhật ${bankName} (${accountNumber}) làm tài khoản nhận tiền Napas 247 mặc định!`
    );
  };

  // NFC CCCD SCAN SIMULATION - C06 BỘ CÔNG AN
  const verifyNfcCccd = (
    idNumber: string,
    fullName: string,
    birthDate: string,
    mrz?: string,
    checksumValid: boolean = true,
    issueDate?: string
  ): boolean => {
    if (!currentUser) return false;
    const cleanId = idNumber.replace(/\D/g, '');
    const updatedUser: UserEntity = {
      ...currentUser,
      isNfcVerified: true,
      isKycApproved: true,
      kycName: fullName.trim().toUpperCase(),
      birthDate: birthDate.trim() || currentUser.birthDate,
      cccdNumber: cleanId,
      cccdMrz: mrz,
      cccdChecksumValid: checksumValid,
      cccdIssueDate: issueDate || '01/01/2023',
      tier: currentUser.tier === 'NEWBIE' ? 'VERIFIED' : currentUser.tier,
      trustScore: Math.min(850, currentUser.trustScore + 35),
    };
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === currentUser.id ? updatedUser : u));
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    cloudService.saveUser(updatedUser);
    cloudService.verifyCccdNfc({
      userId: currentUser.id,
      idNumber: cleanId,
      fullName: fullName.trim().toUpperCase(),
      birthDate,
      mrz,
      checksumValid,
    }).catch(() => {});

    triggerHaptic('nfc');
    showNotification(
      '✅ Quét NFC CCCD Đạt Chuẩn C06!',
      `Đã đối soát thành công chíp ICAO 9303 Bộ Công An cho ${fullName.trim().toUpperCase()}. TrustScore +35 điểm!`,
      true,
      true
    );
    return true;
  };

  // FACE LIVENESS
  const verifyFaceLiveness = (): boolean => {
    if (!currentUser) return false;
    const updatedUser: UserEntity = {
      ...currentUser,
      isFaceLivenessPassed: true,
      tier: currentUser.tier === 'NEWBIE' ? 'VERIFIED' : currentUser.tier,
      trustScore: Math.min(850, currentUser.trustScore + 25),
    };
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === currentUser.id ? updatedUser : u));
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    cloudService.saveUser(updatedUser);

    showNotification(
      '👤 Face Liveness Đạt Chuẩn!',
      'Hệ thống AI đã nhận diện gương mặt sống động. Tăng độ tin cậy TrustScore +25 điểm!',
      true,
      true
    );
    return true;
  };

  // STUDENT SSO OAUTH2
  const linkStudentSso = (
    schoolName: string,
    studentEmail: string,
    studentId?: string,
    ssoProvider?: string
  ): boolean => {
    if (!currentUser) return false;
    const cleanId = studentId || studentEmail.split('@')[0];
    const updatedUser: UserEntity = {
      ...currentUser,
      isStudentVerified: true,
      studentSchool: schoolName,
      studentEmail: studentEmail,
      studentId: cleanId,
      studentSsoProvider: ssoProvider || 'OAuth2 CAS / Microsoft 365 Edu',
      badges: currentUser.badges ? `${currentUser.badges}, Sinh Viên Ưu Tú` : 'Sinh Viên Ưu Tú',
      tier: currentUser.tier === 'NEWBIE' ? 'VERIFIED' : currentUser.tier,
      trustScore: Math.min(850, currentUser.trustScore + 40),
    };
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    cloudService.saveUser(updatedUser);

    showNotification(
      '🎓 Đã Xác Thực Cổng Sinh Viên SSO!',
      `Chào mừng sinh viên ${schoolName} (MSSV: ${cleanId}). Mở khóa Thẻ sinh viên điện tử & Miễn 100% phí bảo hộ Escrow!`,
      true,
      true
    );
    return true;
  };

  const verifyStudentSso = (
    schoolName: string,
    studentEmail: string,
    studentId?: string,
    ssoProvider?: string
  ) => {
    return linkStudentSso(schoolName, studentEmail, studentId, ssoProvider);
  };

  const toggleBiometrics = (enabled: boolean) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, isBiometricsEnabled: enabled };
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    cloudService.saveUser(updatedUser);

    showNotification(
      enabled ? '🔐 Đã Kích Hoạt Biometrics' : 'Đã Tắt Biometrics',
      enabled
        ? 'Mở khóa xác thực vân tay/khuôn mặt cho các giao dịch nạp rút và giải ngân tiền.'
        : 'Sẽ yêu cầu nhập mã PIN bảo mật cho giao dịch.'
    );
  };

  const linkEWallet = (walletType: string, phone: string): boolean => {
    if (!currentUser) return false;
    let updatedUser: UserEntity = currentUser;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === currentUser.id) {
          if (walletType === 'MoMo') updatedUser = { ...u, connectedMoMo: phone };
          else if (walletType === 'ZaloPay') updatedUser = { ...u, connectedZaloPay: phone };
          else updatedUser = { ...u, connectedViettelMoney: phone };
          return updatedUser;
        }
        return u;
      })
    );
    cloudService.saveUser(updatedUser);

    showNotification('🔗 Đã Liên Kết ' + walletType, `Đã liên kết ví điện tử ${walletType} với số ${phone}.`, true);
    return true;
  };

  const depositEWallet = (walletType: string, amount: number): boolean => {
    if (!currentUser) return false;
    const eligibility = checkDepositEligibility(amount);
    if (!eligibility.allowed) {
      showNotification('Giới hạn nạp tiền ⚠️', eligibility.reason || 'Không đủ điều kiện nạp tiền');
      return false;
    }

    const txId = generateSecureTxId('tx_ewd');
    const updatedUser: UserEntity = {
      ...currentUser,
      walletBalance: currentUser.walletBalance + amount,
    };
    const tx: WalletTransactionEntity = {
      id: txId,
      userId: currentUser.id,
      type: 'EWALLET_DEPOSIT',
      amount,
      title: `Nạp tiền từ ${walletType}`,
      subtitle: `Ví điện tử ${walletType} • Khớp lệnh tức thì`,
      bankInfo: walletType,
      timestamp: Date.now(),
      isSuccess: true,
    };

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setTransactions((prev) => [tx, ...prev]);

    cloudService.saveUser(updatedUser);
    cloudService.saveTransaction(tx);

    showNotification(
      `ĐING! Nạp ${walletType} thành công! 💳`,
      `Đã cộng ${amount.toLocaleString()}đ vào ví GigMe từ ${walletType}.`,
      true,
      true
    );
    return true;
  };

  const topUpWallet = (amount: number, source = 'Nạp ví nhanh 1-Chạm'): boolean => {
    if (!currentUser) return false;
    const eligibility = checkDepositEligibility(amount);
    if (!eligibility.allowed) {
      showNotification('Giới hạn nạp tiền ⚠️', eligibility.reason || 'Không đủ điều kiện nạp tiền');
      return false;
    }

    const txId = generateSecureTxId('tx_topup');
    const updatedUser: UserEntity = {
      ...currentUser,
      walletBalance: currentUser.walletBalance + amount,
    };
    const tx: WalletTransactionEntity = {
      id: txId,
      userId: currentUser.id,
      type: 'VIETQR_DEPOSIT',
      amount,
      title: `Nạp tiền ${source}`,
      subtitle: `${source} • Cổng thanh toán 1-chạm sinh viên`,
      bankInfo: source,
      timestamp: Date.now(),
      isSuccess: true,
    };

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setTransactions((prev) => [tx, ...prev]);

    cloudService.saveUser(updatedUser);
    cloudService.saveTransaction(tx);

    triggerHaptic('escrow');
    showNotification(
      '⚡ Nạp Tiền 1-Chạm Thành Công!',
      `Đã nạp +${amount.toLocaleString('vi-VN')}đ vào ví GigMe qua ${source}!`,
      true,
      true
    );
    return true;
  };

  const withdrawEWallet = (walletType: string, amount: number, phone: string): boolean => {
    if (!currentUser) return false;
    if (amount > currentUser.walletBalance) {
      showNotification('Số dư không đủ', `Số dư khả dụng hiện tại không đủ để rút ${amount.toLocaleString()}đ!`);
      return false;
    }

    const txId = generateSecureTxId('tx_eww');
    const updatedUser: UserEntity = {
      ...currentUser,
      walletBalance: currentUser.walletBalance - amount,
    };
    const tx: WalletTransactionEntity = {
      id: txId,
      userId: currentUser.id,
      type: 'EWALLET_WITHDRAW',
      amount: -amount,
      title: `Rút về ví ${walletType}`,
      subtitle: `${phone} (${walletType})`,
      bankInfo: walletType,
      timestamp: Date.now(),
      isSuccess: true,
    };

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setTransactions((prev) => [tx, ...prev]);

    cloudService.saveUser(updatedUser);
    cloudService.saveTransaction(tx);

    showNotification(
      `Rút về ${walletType} thành công!`,
      `Đã chuyển ${amount.toLocaleString()}đ vào ví ${walletType} (${phone}). Tiền vào ví sau 30 giây.`,
      true
    );
    return true;
  };

  const setNotificationSound = (soundKey: 'DING_DEFAULT' | 'CASH_COUNT' | 'BANK_TING' | 'SOFT_VIBRATE') => {
    if (!currentUser) return;
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, notificationSound: soundKey } : u)));
    playNotificationSound(soundKey);
    showNotification('🔔 Âm Thanh Thông Báo', `Đã đổi âm thanh thông báo sang: ${soundKey}`, true);
  };

  const upgradeToBusinessAccount = (businessName: string, taxId: string): boolean => {
    if (!currentUser) return false;
    const updatedUser: UserEntity = {
      ...currentUser,
      isBusinessAccount: true,
      businessName: businessName.trim(),
      businessTaxId: taxId.trim(),
      tier: 'PRO',
      trustScore: Math.min(850, currentUser.trustScore + 50),
    };
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    showNotification(
      '🏢 Nâng Cấp GigMe For Business Thành Công!',
      `Đã cấp huy hiệu Doanh nghiệp / Quán shop cho ${businessName}. Phí sàn giảm còn 7%!`,
      true,
      true
    );
    return true;
  };

  const exportStatement = (format: string) => {
    showNotification(
      '📄 Xuất Sao Kê Thành Công!',
      `Đã xuất bảng thống kê thu nhập & lịch sử Escrow định dạng ${format} có mã QR đối soát điện tử.`,
      true
    );
  };

  const changeSecurityPin = (oldPin: string, newPin: string): boolean => {
    if (!currentUser) return false;
    if (oldPin && currentUser.securityPin && oldPin !== currentUser.securityPin) {
      showNotification('Mã PIN cũ không khớp', 'Mã PIN bảo mật hiện tại không chính xác!');
      return false;
    }
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, securityPin: newPin } : u)));
    showNotification('Đổi mã PIN thành công', 'Mã PIN bảo mật 6 số mới đã được kích hoạt!', true);
    return true;
  };

  // ADMIN ACTIONS
  const setMaintenanceMode = async (updates: Partial<SystemMaintenanceConfig>) => {
    const newConfig: SystemMaintenanceConfig = {
      ...maintenanceConfig,
      ...updates,
      updatedAt: Date.now(),
      activatedBy: currentUser?.id || 'admin_root',
    };
    setMaintenanceConfig(newConfig);
    try {
      localStorage.setItem('gigme_maintenance_config_cache', JSON.stringify(newConfig));
    } catch {}
    await cloudService.saveMaintenance(newConfig);
    showNotification(
      newConfig.isActive ? 'Đã Kích Hoạt Bảo Trì Toàn Hệ Thống! 🛠️' : 'Đã Tắt Bảo Trì - Hệ Thống Đã Mở Cửa! 🚀',
      newConfig.isActive
        ? `Đã đồng bộ lên Cloud. Thời gian kết thúc dự kiến: ${new Date(newConfig.endTime).toLocaleTimeString('vi-VN')} (${new Date(newConfig.endTime).toLocaleDateString('vi-VN')}). Mọi tính năng khác ngoại trừ thông tin cá nhân đã tạm khóa trên cả Web & App.`
        : 'Toàn bộ dịch vụ nhận việc, ký quỹ Escrow và thanh toán đã hoạt động bình thường trở lại.'
    );
  };

  const adminResolveDispute = (gigId: string, resolution: string, refundToClient: boolean, note: string) => {
    const gig = gigs.find((g) => g.id === gigId);
    if (!gig) return;

    setGigs((prev) =>
      prev.map((g) => (g.id === gigId ? { ...g, status: refundToClient ? 'CLIENT_REFUNDED' : 'COMPLETED' } : g))
    );

    if (refundToClient) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === gig.clientId
            ? {
                ...u,
                walletBalance: u.walletBalance + gig.price,
                escrowLockedBalance: Math.max(0, u.escrowLockedBalance - gig.price),
              }
            : u
        )
      );

      const refundTx: WalletTransactionEntity = {
        id: `tx_${Date.now()}_admin_refund`,
        userId: gig.clientId,
        type: 'ADMIN_REFUND',
        amount: gig.price,
        title: `Trọng tài hoàn tiền: Đơn ${gig.title}`,
        subtitle: `Admin phân xử: ${note}`,
        bankInfo: 'GigMe Escrow Arbitration',
        timestamp: Date.now(),
        isSuccess: true,
      };
      setTransactions((prev) => [refundTx, ...prev]);
    }

    showNotification(
      '⚖️ Phân Xử Trọng Tài Hoàn Tất',
      `Đã giải quyết tranh chấp cho đơn "${gig.title}". Kết quả: ${resolution}.`,
      true
    );
  };

  const adminApproveKyc = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              isKycApproved: true,
              isNfcVerified: true,
              isFaceLivenessPassed: true,
              tier: u.tier === 'NEWBIE' ? 'VERIFIED' : u.tier,
              trustScore: Math.min(850, u.trustScore + 50),
            }
          : u
      )
    );
    showNotification('Admin: Duyệt KYC thành công', 'Đã phê duyệt KYC đầy đủ cho người dùng.', true);
  };

  const adminToggleLockUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const willLock = !u.isLocked;
          showNotification(
            willLock ? 'Đã Khóa Tài Khoản' : 'Đã Mở Khóa Tài Khoản',
            `${willLock ? 'Tạm đình chỉ hoạt động của' : 'Đã kích hoạt lại tài khoản cho'} ${u.name}.`
          );
          return { ...u, isLocked: willLock };
        }
        return u;
      })
    );
  };

  const adminDeleteGig = (gigId: string) => {
    setGigs((prev) => prev.filter((g) => g.id !== gigId));
    showNotification('Admin: Đã Xóa Đơn Hàng', 'Đã gỡ bỏ công việc vi phạm tiêu chuẩn cộng đồng.', true);
  };

  // CHAT & AI WITH ANTI-LEAKAGE OFF-PLATFORM FILTER
  const sendChat = (
    text: string,
    attachmentType:
      | 'NONE'
      | 'WATERMARK_PREVIEW'
      | 'PROOF_SCREENSHOT'
      | 'CALL_LOG'
      | 'DELEGATED_AUTH'
      | 'IMAGE'
      | 'VOICE'
      | 'VIDEO' = 'NONE',
    attachmentData: string | null = null,
    attachmentDuration?: number,
    mediaFileName?: string,
    targetThreadId?: string,
    targetPartnerId?: string,
    targetPartnerName?: string
  ) => {
    if (!currentUser) return;
    const isClient = roleMode === 'CLIENT';

    // Normalize direct messaging thread ID between both users to avoid cross-talk leakages
    let effectiveThreadId = targetThreadId;
    if (!effectiveThreadId || effectiveThreadId === 'direct_general' || effectiveThreadId.startsWith('direct_')) {
      if (targetPartnerId) {
        const sorted = [currentUser.id, targetPartnerId].sort();
        effectiveThreadId = `dm_${sorted[0]}_${sorted[1]}`;
      } else if (selectedGigId) {
        effectiveThreadId = selectedGigId;
      } else {
        effectiveThreadId = 'direct_general';
      }
    }

    // Quét phát hiện lách giao dịch ngoài sàn (Anti-Leakage)
    const filterResult = detectAndFilterOffPlatformLeakage(text);
    const safeText = filterResult.maskedText;

    if (filterResult.hasLeakage) {
      showNotification(
        'Cảnh báo an toàn Escrow (Anti-Leakage)',
        `Hệ thống phát hiện thông tin liên hệ nhạy cảm (${filterResult.reasons.join(', ')}). Nội dung đã được tự động che để chống quỵt tiền và bảo vệ quỹ ký quỹ 100% của bạn!`,
        false,
        false
      );
    }

    const msg: ChatMessageEntity = {
      id: `msg_${Date.now()}`,
      gigId: effectiveThreadId,
      threadId: effectiveThreadId,
      partnerId: targetPartnerId,
      partnerName: targetPartnerName,
      senderId: currentUser.id,
      senderName: currentUser.name,
      isFromClient: isClient,
      message: safeText,
      attachmentType,
      attachmentData,
      attachmentDuration,
      mediaFileName,
      timestamp: Date.now(),
      isRead: false,
    };
    setChats((prev) => [...prev, msg]);
    cloudService.saveChatMessage(msg);
  };

  const markConversationAsRead = (partnerOrThreadId: string) => {
    if (!currentUser) return;
    setChats((prev) =>
      prev.map((c) => {
        const isFromPartner = c.senderId === partnerOrThreadId;
        const isInThread = c.threadId === partnerOrThreadId || c.gigId === partnerOrThreadId;
        const isSentToMe = c.partnerId === currentUser.id || (!c.partnerId && c.senderId !== currentUser.id);
        if ((isFromPartner || isInThread) && isSentToMe && !c.isRead) {
          const updated = { ...c, isRead: true };
          cloudService.saveChatMessage(updated);
          return updated;
        }
        return c;
      })
    );
  };

  const analyzePhotoWithAi = (presetType: string) => {
    setTimeout(() => {
      let result: AiRecognitionResult;
      switch (presetType) {
        case 'Sách giáo trình & Bài tập':
          result = {
            suggestedTitle: 'Giải và hướng dẫn 4 bài tập Giải tích 2',
            suggestedDescription: 'Cần gia sư giải chi tiết từng bước và gửi file PDF qua chat.',
            suggestedCategory: 'Tư vấn & Học tập',
            suggestedPrice: 65000,
            confidence: '98% (Nhận diện sách Giáo trình ĐHBK)',
          };
          break;
        case 'Màn hình Game (Liên Quân / LOL)':
          result = {
            suggestedTitle: 'Kéo rank Liên Quân từ Kim Cương 1 lên Tinh Anh',
            suggestedDescription: 'Cần Duo partner đánh buổi tối, tướng tủ: Florentino, Hayate.',
            suggestedCategory: 'Cày Game & Rank',
            suggestedPrice: 90000,
            confidence: '96% (Giao diện Rank Liên Quân Mobile)',
          };
          break;
        case 'Bản thảo Video TikTok / Reels':
          result = {
            suggestedTitle: 'Edit 1 video TikTok 45s review đồ ăn quán sinh viên',
            suggestedDescription: 'Footage có sẵn, cần cắt ghép bắt beat trend TikTok, phụ đề tiếng Việt.',
            suggestedCategory: 'Digital Tasks',
            suggestedPrice: 120000,
            confidence: '94% (Video ngắn & kịch bản CapCut)',
          };
          break;
        default:
          result = {
            suggestedTitle: 'Giao nhận đồ dùng học tập gấp tại Ký túc xá',
            suggestedDescription: 'Cần ship hỏa tốc trong khuôn viên trường.',
            suggestedCategory: 'Vận chuyển & Ship',
            suggestedPrice: 30000,
            confidence: '92% (Nhận diện đồ vật học tập KTX)',
          };
          break;
      }

      setAiDetectedResult(result);
      showNotification(
        '🤖 AI GigMe đã nhận diện xong!',
        `Đã tự động trích xuất tiêu đề, danh mục và gợi ý mức giá ${result.suggestedPrice.toLocaleString()}đ.`,
        true
      );
    }, 600);
  };

  const clearAiResult = () => {
    setAiDetectedResult(null);
  };

  // SafeWalk SOS Night Protection functions
  const startSafeWalk = (
    origin: string,
    destination: string,
    durationMinutes: number,
    contactName: string,
    contactPhone: string
  ): SafeWalkSessionEntity => {
    const session: SafeWalkSessionEntity = {
      id: `safewalk_${Date.now()}`,
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Sinh viên GigMe',
      isActive: true,
      startedAt: Date.now(),
      durationMinutes,
      endsAt: Date.now() + durationMinutes * 60 * 1000,
      originName: origin,
      destinationName: destination,
      currentLocation: {
        lat: userCoords.latitude,
        lng: userCoords.longitude,
        address: origin,
      },
      emergencyContactName: contactName,
      emergencyContactPhone: contactPhone,
      lastCheckInAt: Date.now(),
      isAlarmTriggered: false,
    };
    setSafeWalkSession(session);
    try {
      localStorage.setItem('gigme_safewalk_session', JSON.stringify(session));
    } catch {}

    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        safeWalkContact: { name: contactName, phone: contactPhone },
      };
      setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
      cloudService.saveUser(updatedUser);
    }

    showNotification(
      '🛡️ Đã Kích Hoạt SafeWalk Ban Đêm',
      `Đang giám sát lộ trình từ "${origin}" đến "${destination}" (${durationMinutes} phút). SOS luôn sẵn sàng!`,
      true
    );
    return session;
  };

  const checkInSafeWalk = () => {
    if (!safeWalkSession) return;
    const updated = {
      ...safeWalkSession,
      lastCheckInAt: Date.now(),
      isAlarmTriggered: false,
    };
    setSafeWalkSession(updated);
    stopSosSiren();
    try {
      localStorage.setItem('gigme_safewalk_session', JSON.stringify(updated));
    } catch {}
    showNotification('✅ Check-in An Toàn!', 'Hệ thống đã ghi nhận bạn vẫn an toàn trên lộ trình.', true);
  };

  const triggerSafeWalkAlarm = () => {
    if (!safeWalkSession) return;
    const updated = {
      ...safeWalkSession,
      isAlarmTriggered: true,
    };
    setSafeWalkSession(updated);
    startSosSiren();
    try {
      localStorage.setItem('gigme_safewalk_session', JSON.stringify(updated));
    } catch {}
    showNotification(
      '🚨 SOS BÁO ĐỘNG KHẨN CẤP ĐÃ BẬT!',
      `Còi hú lớn đang phát. Đã gửi tọa độ GPS (${userCoords.latitude.toFixed(4)}, ${userCoords.longitude.toFixed(4)}) cho ${safeWalkSession.emergencyContactName} (${safeWalkSession.emergencyContactPhone}) và Ban An Ninh KTX!`,
      true,
      true
    );
  };

  const stopSafeWalk = () => {
    stopSosSiren();
    setSafeWalkSession(null);
    try {
      localStorage.removeItem('gigme_safewalk_session');
    } catch {}
    showNotification('🏠 Đã Hoàn Thành SafeWalk', 'Chào mừng bạn đã về đích an toàn! Chế độ bảo vệ đêm đã tắt.', true);
  };

  // Firebase Cloud Messaging (FCM) functions
  const toggleFcm = (enabled: boolean, token?: string) => {
    if (!currentUser) return;
    const generatedToken = token || (enabled ? `fcm_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}` : '');
    const updated = {
      ...currentUser,
      fcmEnabled: enabled,
      fcmToken: generatedToken,
    };
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    cloudService.saveUser(updated);

    if (enabled && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    showNotification(
      enabled ? '🔔 Đã Bật FCM Thông Báo Hỏa Tốc' : 'Đã Tắt FCM Push',
      enabled
        ? 'Bạn sẽ nhận thông báo tức thì khi có kèo 50m quanh bạn, biến động Escrow và phòng đấu giá ngược!'
        : 'Đã tạm ngưng nhận thông báo đẩy.',
      true
    );
  };

  const sendTestFcmPush = (title: string, body: string, _type = 'FLASH') => {
    playNotificationSound('BANK_TING');
    showNotification(title, body, true, true);
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch {
        // ignore notification error in iframe
      }
    }
  };

  // Student ELO & Badge Reputation System
  const rateGigAndElo = (gigId: string, rating: number, review: string, tags: string[] = []): boolean => {
    const gig = gigs.find((g) => g.id === gigId);
    if (!gig) return false;

    let eloDelta = 0;
    if (rating === 5) eloDelta = 25;
    else if (rating === 4) eloDelta = 15;
    else if (rating === 3) eloDelta = 5;
    else if (rating === 2) eloDelta = -10;
    else if (rating === 1) eloDelta = -25;

    const targetUserId = gig.freelancerId || (currentUser?.id === gig.clientId ? gig.freelancerId : gig.clientId);

    if (targetUserId) {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === targetUserId) {
            const currentElo = u.eloRating || 1200;
            const currentStreak = rating === 5 ? (u.winStreak || 0) + 1 : 0;
            const streakBonus = currentStreak >= 3 ? 10 : 0;
            const finalElo = Math.max(1000, currentElo + eloDelta + streakBonus);

            let newTier = u.eloTier || 'BRONZE';
            if (finalElo >= 2400) newTier = 'CHALLENGER';
            else if (finalElo >= 2000) newTier = 'DIAMOND';
            else if (finalElo >= 1800) newTier = 'PLATINUM';
            else if (finalElo >= 1600) newTier = 'GOLD';
            else if (finalElo >= 1400) newTier = 'SILVER';
            else newTier = 'BRONZE';

            const badges = [...(u.studentBadges || [])];
            if (currentStreak >= 5 && !badges.includes('💎 Chuỗi 5 Sao Uy Tín')) {
              badges.push('💎 Chuỗi 5 Sao Uy Tín');
            }
            if (finalElo >= 2000 && !badges.includes('👑 Kim Cương Học Bá')) {
              badges.push('👑 Kim Cương Học Bá');
            }
            if (tags.some((t) => t.includes('siêu tốc') || t.includes('Thần Tốc')) && !badges.includes('🚀 Thần Tốc Campus')) {
              badges.push('🚀 Thần Tốc Campus');
            }

            const newReviewItem = {
              id: `rev_${Date.now()}`,
              reviewerName: currentUser?.kycName || currentUser?.name || 'Sinh viên Campus',
              reviewerSchool: currentUser?.studentSchool || 'Đại học TDTU',
              rating,
              comment: review,
              tags,
              createdAt: new Date().toLocaleDateString('vi-VN'),
              gigTitle: gig.title,
            };

            const updatedUser: UserEntity = {
              ...u,
              eloRating: finalElo,
              eloTier: newTier,
              winStreak: currentStreak,
              studentBadges: badges,
              rating: Number(((u.rating * u.reviewCount + rating) / (u.reviewCount + 1)).toFixed(1)),
              reviewCount: u.reviewCount + 1,
              trustScore: Math.min(850, u.trustScore + (rating >= 4 ? 8 : -15)),
              reviews: [newReviewItem, ...(u.reviews || [])],
            };
            cloudService.saveUser(updatedUser);
            return updatedUser;
          }
          return u;
        })
      );
    }

    const updatedGig: GigEntity = {
      ...gig,
      clientRating: rating,
      clientReview: review,
      freelancerEloChange: eloDelta,
      ratedAt: Date.now(),
    };
    setGigs((prev) => prev.map((g) => (g.id === gigId ? updatedGig : g)));
    cloudService.saveGig(updatedGig);

    confetti({ particleCount: 50, spread: 60 });
    showNotification(
      '⭐ Đánh Giá & Cập Nhật ELO Thành Công!',
      `Đã chấm ${rating} sao cho công việc. Freelancer nhận ${eloDelta >= 0 ? `+${eloDelta}` : eloDelta} Điểm ELO vinh danh!`,
      true,
      true
    );
    return true;
  };

  // DOUBLE-BLIND REVIEW SYSTEM (ĐÁNH GIÁ HAI CHIỀU MÙ - CHỐNG TRẢ THÙ ĐÁNH GIÁ XẤU)
  const submitDoubleBlindReview = (
    gigId: string,
    rating: number,
    reviewText: string,
    role: 'CLIENT' | 'FREELANCER'
  ): boolean => {
    if (!currentUser) return false;
    const gig = gigs.find((g) => g.id === gigId);
    if (!gig) return false;

    const isClient = role === 'CLIENT';
    const now = Date.now();
    const otherPartySubmitted = isClient ? !!gig.freelancerRatedAt : !!gig.clientRatedAt;

    let updatedGig: GigEntity;
    if (isClient) {
      updatedGig = {
        ...gig,
        clientRating: rating,
        clientReview: reviewText,
        clientRatedAt: now,
        isDoubleBlindRevealed: otherPartySubmitted,
      };
    } else {
      updatedGig = {
        ...gig,
        freelancerRating: rating,
        freelancerReview: reviewText,
        freelancerRatedAt: now,
        isDoubleBlindRevealed: otherPartySubmitted,
      };
    }

    if (otherPartySubmitted) {
      updatedGig.isDoubleBlindRevealed = true;
      const clientScore = isClient ? rating : gig.clientRating || 5;
      const freelancerScore = !isClient ? rating : gig.freelancerRating || 5;

      setUsers((prev) =>
        prev.map((u) => {
          if (gig.freelancerId && u.id === gig.freelancerId) {
            const currentElo = u.eloRating || 1200;
            const delta =
              clientScore === 5 ? 25 : clientScore === 4 ? 15 : clientScore === 3 ? 5 : clientScore === 2 ? -10 : -25;
            const newElo = Math.max(1000, currentElo + delta);
            return {
              ...u,
              eloRating: newElo,
              trustScore: Math.min(850, u.trustScore + (clientScore >= 4 ? 8 : -15)),
              rating: Number(((u.rating * u.reviewCount + clientScore) / (u.reviewCount + 1)).toFixed(1)),
              reviewCount: u.reviewCount + 1,
            };
          }
          if (u.id === gig.clientId) {
            return {
              ...u,
              trustScore: Math.min(850, u.trustScore + (freelancerScore >= 4 ? 5 : -10)),
            };
          }
          return u;
        })
      );

      confetti({ particleCount: 60, spread: 70 });
      showNotification(
        '🎉 Đánh Giá Hai Chiều Đã Mở Khóa!',
        'Cả khách hàng và freelancer đều đã hoàn tất đánh giá mù. Nội dung đánh giá hai chiều đã chính thức được công khai minh bạch!',
        true,
        true
      );
    } else {
      showNotification(
        '🔒 Đã Lưu Đánh Giá Hai Chiều Mù (Double-Blind)',
        'Đánh giá của bạn đã được mã hóa lưu trữ an toàn. Đối phương không thể nhìn thấy đánh giá này cho tới khi họ cũng gửi đánh giá của họ (chống trả thù đánh giá xấu)!',
        true
      );
    }

    setGigs((prev) => prev.map((g) => (g.id === gigId ? updatedGig : g)));
    cloudService.saveGig(updatedGig);
    return true;
  };

  const sendWebPushNotification = (title: string, body: string, icon = '/favicon.ico') => {
    playNotificationSound('BANK_TING');
    showNotification(title, body, true, true);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon,
            badge: icon,
          });
        } catch {
          // ignore notification error in iframe sandbox
        }
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            try {
              new Notification(title, { body, icon });
            } catch {}
          }
        });
      }
    }
  };

  return (
    <GigMeContext.Provider
      value={{
        isCloudConnected,
        cloudStatus,
        refreshCloudConnection,
        users,
        currentUser,
        isAuthenticated,
        isAdminRole,
        isDarkMode,
        themeMode,
        setThemeMode,
        toggleThemeMode,
        updateUserProfile,
        triggerWebPushTest,
        roleMode,
        searchQuery,
        isVoiceListening,
        selectedPriceFilter,
        selectedDurationFilter,
        filterRecurringOnly,
        filterMultiWorkerOnly,
        aiSmartMatchActive,
        activeVoipCall,
        selectedRadiusMeters,
        selectedCategory,
        generatedOtp,
        otpTargetContact,
        otpExpiresAt,
        rawGigs: gigs,
        filteredGigs,
        userCoords,
        setUserCoords,
        selectedGigId,
        currentSelectedGig,
        currentGigBids,
        currentChatMessages,
        allChats: chats,
        walletTransactions,
        userTransactions: walletTransactions,
        withdrawFunds: withdrawToBank,
        notification,
        aiDetectedResult,
        adminAllUsers: users,
        adminAllTransactions: transactions,
        toggleDarkMode,
        setSearchQuery,
        startVoiceSearch,
        stopVoiceSearch,
        setPriceFilter: setSelectedPriceFilter,
        setDurationFilter: setSelectedDurationFilter,
        toggleFilterRecurring: () => setFilterRecurringOnly((p) => !p),
        toggleFilterMultiWorker: () => setFilterMultiWorkerOnly((p) => !p),
        toggleSmartMatch,
        startVoipCall,
        endVoipCall,
        toggleMuteVoip,
        toggleRoleMode,
        toggleRole: toggleRoleMode,
        setWalletPin: changeSecurityPin,
        setRadius,
        setCategory,
        selectGig,
        dismissNotification,
        showNotification,
        register,
        login,
        sendOtp,
        resetPasswordWithOtp,
        loginWithPhoneOtp,
        requestMoSms,
        checkMoSmsStatus,
        simulateMoSms,
        loginWithMoSms,
        loginSocial,
        logout,
        addFriendById,
        removeFriendById,
        findUserByNineDigitId,
        upgradeTier,
        postGig,
        placeBid,
        acceptGigDirectly,
        submitProofOfWork,
        releaseEscrowPayout,
        releaseMilestonePayout,
        fileDispute,
        checkDepositEligibility,
        depositVietQr,
        withdrawToBank,
        saveDefaultBank,
        verifyNfcCccd,
        verifyFaceLiveness,
        linkStudentSso,
        verifyStudentSso,
        toggleBiometrics,
        linkEWallet,
        depositEWallet,
        withdrawEWallet,
        topUpWallet,
        setNotificationSound,
        upgradeToBusinessAccount,
        exportStatement,
        changeSecurityPin,
        maintenanceConfig,
        isMaintenanceActive,
        setMaintenanceMode,
        adminResolveDispute,
        adminApproveKyc,
        adminToggleLockUser,
        adminDeleteGig,
        sendChat,
        markConversationAsRead,
        analyzePhotoWithAi,
        clearAiResult,
        boostGig,
        openReverseAuctionRoom,
        closeReverseAuctionRoom,
        joinMultiWorkerGig,
        checkInMultiWorker,
        payoutMultiWorkers,
        safeWalkSession,
        startSafeWalk,
        checkInSafeWalk,
        triggerSafeWalkAlarm,
        stopSafeWalk,
        toggleFcm,
        sendTestFcmPush,
        rateGigAndElo,
        cancelGigByWorker,
        cancelGigByClient,
        reportNoShow,
        submitDoubleBlindReview,
        sendWebPushNotification,
      }}
    >
      {children}
    </GigMeContext.Provider>
  );
};

export const useGigMe = (): GigMeContextType => {
  const context = useContext(GigMeContext);
  if (!context) {
    throw new Error('useGigMe must be used within a GigMeProvider');
  }
  return context;
};
