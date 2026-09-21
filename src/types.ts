export type UserTierKey = 'NEWBIE' | 'STUDENT' | 'VERIFIED' | 'CCCD_VERIFIED' | 'PRO';

export interface UserTierConfig {
  key: UserTierKey;
  title: String;
  badgeText: string;
  maxDeposit: number;
  commissionRate: number;
}

export const USER_TIERS: Record<UserTierKey, UserTierConfig> = {
  NEWBIE: {
    key: 'NEWBIE',
    title: 'Cấp 1: Newbie',
    badgeText: 'Newbie',
    maxDeposit: 500_000,
    commissionRate: 0.10,
  },
  STUDENT: {
    key: 'STUDENT',
    title: 'Cấp 2: Sinh viên',
    badgeText: 'Sinh Viên',
    maxDeposit: 10_000_000,
    commissionRate: 0.08,
  },
  VERIFIED: {
    key: 'VERIFIED',
    title: 'Cấp 2: Verified',
    badgeText: 'Đã KYC',
    maxDeposit: 20_000_000,
    commissionRate: 0.10,
  },
  CCCD_VERIFIED: {
    key: 'CCCD_VERIFIED',
    title: 'Cấp 2: CCCD Chip',
    badgeText: 'CCCD Chip',
    maxDeposit: 30_000_000,
    commissionRate: 0.08,
  },
  PRO: {
    key: 'PRO',
    title: 'Cấp 3: Elite VIP',
    badgeText: 'VIP Pro',
    maxDeposit: 100_000_000,
    commissionRate: 0.07,
  },
};

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  gender: string;
  birthDate: string;
  tier: UserTierKey;
  role: 'USER' | 'ADMIN';
  kycName: string;
  isKycApproved: boolean;
  isNfcVerified: boolean; // Quét CCCD gắn chip NFC
  isFaceLivenessPassed: boolean; // Face Liveness Verification
  isStudentVerified: boolean;
  studentSchool: string;
  isBiometricsEnabled: boolean; // Xác thực sinh trắc học vân tay/FaceID
  isBusinessAccount: boolean; // GigMe for Business
  businessName: string;
  businessTaxId: string;
  trustScore: number; // Thang điểm uy tín 0 - 100 (Tối đa 100, nếu max thì không cộng thêm)
  notificationSound: 'DING_DEFAULT' | 'CASH_COUNT' | 'BANK_TING' | 'SOFT_VIBRATE';
  connectedMoMo: string;
  connectedZaloPay: string;
  connectedViettelMoney: string;
  lastDeviceName: string;
  lastLoginLocation: string;
  hasUnusualDeviceAlert: boolean;
  rating: number;
  reviewCount: number;
  completedGigs: number;
  onTimeRate: number;
  postedGigsCount: number;
  totalSpent: number;
  walletBalance: number;
  escrowLockedBalance: number;
  securityPin: string;
  badges: string;
  isLocked: boolean;
  createdAt?: number; // Thời điểm tạo tài khoản (timestamp)
  isKycVerified?: boolean;
  friendIds?: string[]; // Danh sách ID bạn bè kết nối qua ID 9 số
  eloRating?: number; // Thang ELO sinh viên (1200 -> 2500+)
  eloTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'CHALLENGER';
  winStreak?: number; // Chuỗi đơn 5 sao liên tiếp
  studentBadges?: string[]; // Danh sách huy hiệu vinh danh ELO
  fcmEnabled?: boolean; // Bật thông báo đẩy FCM
  fcmToken?: string;
  safeWalkContact?: { name: string; phone: string }; // Người liên hệ khẩn cấp SafeWalk
  avatarUrl?: string; // Ảnh đại diện người dùng tùy chỉnh
  themePreference?: 'CYBER_DARK' | 'AMOLED' | 'DAYLIGHT'; // Tùy chọn giao diện
  cccdNumber?: string; // Số CCCD 12 số
  cccdIssueDate?: string; // Ngày cấp CCCD
  cccdMrz?: string; // Mã đọc máy ICAO 9303
  cccdChecksumValid?: boolean; // Xác thực checksum C06 Bộ Công An
  studentId?: string; // Mã số sinh viên (MSSV)
  studentEmail?: string; // Email trường cấp (*.edu.vn)
  isEduVerified?: boolean; // Xác thực email chính quy đuôi .edu.vn
  eduEmail?: string; // Địa chỉ email trường (.edu.vn)
  eduVerifiedAt?: number; // Thời điểm xác thực email trường
  friendListBackupCode?: string; // Mã sao lưu danh bạ bạn bè ID 9 số
  friendListLastBackupAt?: number; // Thời điểm sao lưu danh bạ gần nhất
  deviceFingerprint?: string; // Nhận diện thiết bị phát hiện Sybil
  ipAddress?: string;
  registrationIp?: string;
  isFlaggedSybil?: boolean; // Cảnh báo tài khoản bot/gian lận chéo
  sybilFlagReason?: string;
  studentSsoProvider?: string; // Cổng đào tạo đã xác thực
  defaultBank?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  reviews?: Array<{
    id: string;
    reviewerName: string;
    reviewerSchool?: string;
    rating: number;
    comment: string;
    tags?: string[];
    createdAt: string;
    gigTitle?: string;
  }>;
  disciplineRecords?: Array<{
    id: string;
    type: 'LATE_CANCELLATION' | 'NO_SHOW' | 'FAKE_GPS' | 'DISPUTE_FAULT';
    title: string;
    penaltyPoints: number;
    fineAmount: number;
    reason: string;
    createdAt: number;
    gigTitle?: string;
  }>;
}

export interface GigEntity {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  isReverseAuction: boolean;
  lowestBidPrice: number;
  distanceMeters: number;
  locationName: string;
  location?: string;
  deadline?: string;
  latitude: number;
  longitude: number;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientTier: UserTierKey;
  freelancerId?: string | null;
  freelancerName?: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'SUBMITTED' | 'COMPLETED' | 'DISPUTED' | 'CLIENT_REFUNDED' | 'CANCELLED';
  isPinned: boolean;
  isFlash: boolean;
  isRecurringWeekly: boolean; // Kèo định kỳ / Thuê theo tuần
  totalWorkersNeeded: number; // Kèo ghép nhóm: Cần bao nhiêu người
  confirmedWorkersCount: number;
  estimatedDurationMinutes: number; // Thời lượng ước tính
  tipAmount: number; // Tiền tip thưởng thêm sau nghiệm thu
  createdAt: number;
  completedAt?: number | null;
  proofImageUrl?: string | null;
  proofNote?: string | null;
  proofIsWatermarked: boolean;
  isWatermarkRemoved: boolean; // Tự động gỡ sau khi giải ngân
  blockchainHash?: string | null; // Mã băm SHA-256 xác thực trên sổ cái chống giả mạo
  watermarkCoordinates?: { lat: number; lng: number } | null;
  disputeReason?: string | null;
  disputeResolution?: string | null;
  // Tính năng 1: Ghim bài & Đẩy bài Hỏa tốc (Flash Boost)
  isBoosted?: boolean;
  boostedUntil?: number;
  boostFeePaid?: number;
  // Tính năng 2: Phòng Đấu giá ngược thời gian thực (Live Reverse Auction Room - Chỉ Client mới được tạo phòng)
  auctionRoomOpen?: boolean;
  auctionRoomCreatedAt?: number;
  auctionRoomDurationMinutes?: number;
  auctionCeilingPrice?: number;
  // Tính năng 3: Đơn việc nhóm nhiều người & QR Check-in điểm danh
  multiWorkers?: Array<{
    id: string;
    workerId: string;
    workerName: string;
    workerPhone?: string;
    isCheckedIn: boolean;
    checkedInAt?: number;
    isPaid: boolean;
    rewardPerPerson: number;
  }>;
  checkInSecretCode?: string;
  // Chấm công & Nghiệm thu Watermark GPS
  proofWatermarkUrl?: string;
  proofGpsCoords?: { lat: number; lng: number };
  proofTimestamp?: number;
  proofHash?: string;
  // Cơ chế giá linh hoạt theo cung - cầu (Dynamic Surge Pricing 1.02x - 1.25x)
  surgeMultiplier?: number;
  originalBasePrice?: number;
  surgeReason?: string;
  isSurging?: boolean;
  // Nhận diện & Chống gian lận vị trí (Anti-Fake GPS / Mock Location)
  gpsAuthenticityStatus?: 'GENUINE_SENSOR' | 'SUSPICIOUS_MOCK' | 'BLOCKED_SPOOF';
  gpsAccuracyMeters?: number;
  gpsCheckDistanceMeters?: number;
  // Tiếp nhận & Phạt hủy đơn trễ hẹn (Late Cancellation Penalty)
  acceptedAt?: number;
  cancelledAt?: number;
  cancellationReason?: string;
  cancellationPenaltyAmount?: number;
  cancelledByWorker?: boolean;
  cancelledByClient?: boolean;
  isNoShowReported?: boolean;
  noShowReportedBy?: 'CLIENT' | 'WORKER';
  noShowPenaltyAmount?: number;
  // Đánh giá hai chiều mù (Double-Blind Review)
  clientRating?: number;
  clientReview?: string;
  clientRatedAt?: number;
  freelancerRating?: number;
  freelancerReview?: string;
  freelancerRatedAt?: number;
  isDoubleBlindRevealed?: boolean;
  freelancerEloChange?: number;
  ratedAt?: number;
}

export interface CampusLeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  school: string;
  avatarUrl?: string;
  completedGigs: number;
  completedGigsInMonth: number;
  accountAgeDays: number;
  isAccountOlderThan3Weeks: boolean; // Điều kiện 1: Tạo trên 3 tuần (> 21 ngày)
  hasCompletedAtLeast3GigsInMonth: boolean; // Điều kiện 2: Đã làm ít nhất 3 việc trong tháng đó
  isInTop3: boolean; // Điều kiện 3: Đứng trong top 3
  isPrizeEligible: boolean; // Phải đủ cả 3 điều kiện mới nhận được tiền
  prizeAmount: number; // 20.000đ (Top 1), 10.000đ (Top 2), 5.000đ (Top 3)
  trustScore: number;
  rating: number;
  onTimeRate: number;
  totalEarned: number;
  specialBadge: string;
  recentGigTitle: string;
}

export interface MarketplaceMediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  name: string;
}

export interface MarketplaceItemEntity {
  id: string;
  title: string;
  description: string;
  category: 'TEXTBOOK' | 'TECH' | 'STATIONERY' | 'FREE_DONATION' | 'HOUSING_ESSENTIAL';
  price: number; // 0đ là tặng miễn phí
  originalPrice: number;
  condition: 'NEW_99' | 'GOOD_90' | 'FAIR_80';
  schoolName: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  imageUrl?: string;
  mediaFiles?: MarketplaceMediaItem[];
  createdAt: number;
}

export interface BidEntity {
  id: string;
  gigId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerTier: UserTierKey;
  offeredPrice: number;
  estimatedMinutes: number;
  proposalNote: string;
  createdAt: number;
}

export interface ChatMessageEntity {
  id: string;
  gigId: string;
  senderId: string;
  senderName: string;
  isFromClient: boolean;
  message: string;
  attachmentType:
    | 'NONE'
    | 'WATERMARK_PREVIEW'
    | 'PROOF_SCREENSHOT'
    | 'CALL_LOG'
    | 'DELEGATED_AUTH'
    | 'IMAGE'
    | 'VOICE'
    | 'VIDEO';
  attachmentData?: string | null;
  attachmentDuration?: number; // Thời lượng audio giây cho Voice Note
  mediaFileName?: string;
  timestamp: number;
  threadId?: string;
  partnerId?: string;
  partnerName?: string;
  reactions?: Record<string, number>;
  isRead?: boolean;
}

export interface WalletTransactionEntity {
  id: string;
  userId: string;
  type:
    | 'VIETQR_DEPOSIT'
    | 'ESCROW_LOCK'
    | 'ESCROW_PAYOUT'
    | 'ESCROW_RELEASE'
    | 'PLATFORM_FEE'
    | 'BANK_WITHDRAWAL'
    | 'TIP_PAYOUT'
    | 'EWALLET_DEPOSIT'
    | 'EWALLET_WITHDRAW'
    | 'ADMIN_REFUND'
    | 'REWARD_EARNED'
    | 'INCOME'
    | 'EXPENSE';
  amount: number;
  title?: string;
  subtitle?: string;
  description?: string;
  bankInfo?: string | null;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  direction?: 'INCOMING' | 'OUTGOING' | 'IN' | 'OUT';
  gigId?: string | null;
  note?: string;
  timestamp: number;
  isSuccess: boolean;
}

export interface SafeWalkSessionEntity {
  id: string;
  userId: string;
  userName: string;
  isActive: boolean;
  startedAt: number;
  durationMinutes: number;
  endsAt: number;
  originName: string;
  destinationName: string;
  currentLocation?: { lat: number; lng: number; address?: string };
  emergencyContactName: string;
  emergencyContactPhone: string;
  lastCheckInAt: number;
  isAlarmTriggered: boolean;
  notes?: string;
}

export type TransactionEntity = WalletTransactionEntity;

export type AppRoleMode = 'CLIENT' | 'FREELANCER';

export interface VoipCallSession {
  gigId: string;
  partnerName: string;
  maskedPhoneNumber: string;
  isMuted: boolean;
  durationSeconds: number;
}

export interface UiNotification {
  id: string;
  title: string;
  message: string;
  isDingSound?: boolean;
  isCelebration?: boolean;
}

export interface AiRecognitionResult {
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedCategory: string;
  suggestedPrice: number;
  confidence: string;
}

export const VIETNAMESE_BANKS = [
  { code: 'VCB', name: 'Vietcombank', fullName: 'Ngân hàng TMCP Ngoại thương Việt Nam' },
  { code: 'MB', name: 'MB Bank', fullName: 'Ngân hàng TMCP Quân Đội' },
  { code: 'TCB', name: 'Techcombank', fullName: 'Ngân hàng TMCP Kỹ thương Việt Nam' },
  { code: 'VPB', name: 'VPBank', fullName: 'Ngân hàng TMCP Việt Nam Thịnh Vượng' },
  { code: 'ACB', name: 'ACB', fullName: 'Ngân hàng TMCP Á Châu' },
  { code: 'BIDV', name: 'BIDV', fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
  { code: 'CTG', name: 'VietinBank', fullName: 'Ngân hàng TMCP Công Thương Việt Nam' },
  { code: 'TPB', name: 'TPBank', fullName: 'Ngân hàng TMCP Tiên Phong' },
];

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}đ`;
}

export interface SystemMaintenanceConfig {
  isActive: boolean;
  title: string;
  message: string;
  startTime: number;
  endTime: number;
  activatedBy: string;
  updatedAt: number;
  allowedTabs: string[];
}

export interface MoSmsSession {
  sessionId: string;
  phone?: string;
  keyword: string; // ví dụ: "XACTHUC"
  code: string;    // mã 6 số ví dụ: "849201"
  syntax: string;  // cú pháp đầy đủ ví dụ: "XACTHUC 849201"
  shortcode: string; // đầu số tổng đài ví dụ: "8077"
  feeText: string; // chi phí ví dụ: "1.000đ/tin"
  deeplink: string; // sms:8077?&body=XACTHUC%20849201
  expiresAt: number;
  isVerified: boolean;
  senderPhone?: string;
  verifiedAt?: number;
}
