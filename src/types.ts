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

export interface ModPermission {
  // Nhóm Kiểm duyệt cốt lõi (5 quyền)
  canApproveKyc?: boolean;          // Duyệt thẻ sinh viên & CCCD
  canResolveDisputes?: boolean;     // Phân xử tranh chấp Kèo Escrow
  canModerateUsers?: boolean;       // Khóa / Mở khóa tài khoản vi phạm
  canModerateGigs?: boolean;        // Ẩn / Gỡ bài đăng việc làm vi phạm
  canManageFinance?: boolean;       // Tra soát nạp / rút tiền ví sinh viên

  // Nhóm Quản trị Tài khoản & Người dùng (3 quyền mới)
  canCreateUsers?: boolean;         // Tạo tài khoản người dùng mới
  canDeleteUsers?: boolean;         // Xóa vĩnh viễn tài khoản người dùng
  canEditUsers?: boolean;           // Chỉnh sửa hồ sơ, thông tin & số dư người dùng

  // Nhóm Quản trị Dữ liệu & Hệ thống (3 quyền mới)
  canManageDatabase?: boolean;      // Quản trị cơ sở dữ liệu & Sao lưu Data Firestore
  canPurgeData?: boolean;           // Xóa & Làm sạch dữ liệu hệ thống / Purge Data
  canConfigureMaintenance?: boolean;// Thiết lập cấu hình Bảo trì hệ thống (Maintenance Mode)

  // Nhóm Vận hành Dịch vụ Campus & An ninh (4 quyền mới)
  canManageMarketplace?: boolean;   // Quản lý Chợ Campus Marketplace (Duyệt/Gỡ vật phẩm)
  canSendPushBroadcast?: boolean;   // Gửi thông báo đẩy Broadcast toàn hệ thống
  canAuditTransactions?: boolean;   // Giám sát giao dịch bất thường & phòng chống gian lận
  canExportAuditLogs?: boolean;     // Xem & Xuất nhật ký kiểm toán hệ thống
}

export const DEFAULT_MOD_PERMISSIONS: ModPermission = {
  canApproveKyc: true,
  canResolveDisputes: true,
  canModerateUsers: true,
  canModerateGigs: true,
  canManageFinance: false,
  canCreateUsers: false,
  canDeleteUsers: false,
  canEditUsers: false,
  canManageDatabase: false,
  canPurgeData: false,
  canConfigureMaintenance: false,
  canManageMarketplace: true,
  canSendPushBroadcast: false,
  canAuditTransactions: true,
  canExportAuditLogs: false,
};

export const ALL_MOD_PERMISSIONS: ModPermission = {
  canApproveKyc: true,
  canResolveDisputes: true,
  canModerateUsers: true,
  canModerateGigs: true,
  canManageFinance: true,
  canCreateUsers: true,
  canDeleteUsers: true,
  canEditUsers: true,
  canManageDatabase: true,
  canPurgeData: true,
  canConfigureMaintenance: true,
  canManageMarketplace: true,
  canSendPushBroadcast: true,
  canAuditTransactions: true,
  canExportAuditLogs: true,
};

export const ALL_FALSE_PERMISSIONS: ModPermission = {
  canApproveKyc: false,
  canResolveDisputes: false,
  canModerateUsers: false,
  canModerateGigs: false,
  canManageFinance: false,
  canCreateUsers: false,
  canDeleteUsers: false,
  canEditUsers: false,
  canManageDatabase: false,
  canPurgeData: false,
  canConfigureMaintenance: false,
  canManageMarketplace: false,
  canSendPushBroadcast: false,
  canAuditTransactions: false,
  canExportAuditLogs: false,
};

export interface UserEntity {
  id: string;
  name: string;
  lastName?: string; // Họ và tên đệm (VD: Lý Hoàng Gia)
  firstName?: string; // Tên (VD: Bảo)
  email: string;
  phone: string;
  password?: string;
  gender: string;
  birthDate: string;
  tier: UserTierKey;
  role: 'USER' | 'ADMIN' | 'MOD';
  modPermissions?: ModPermission;
  kycName: string;
  isKycApproved: boolean;
  isNfcVerified: boolean; // Quét CCCD gắn chip NFC
  isFaceLivenessPassed: boolean; // Face Liveness Verification
  isStudentVerified: boolean;
  studentSchool: string;
  studentFaculty?: string; // Khoa / Viện đào tạo (ví dụ: Khoa CNTT, Quản trị kinh doanh...)
  campusBadge?: string; // Huy hiệu hiển thị nhanh (ví dụ: "ĐH Bách Khoa • Khoa CNTT")
  skills?: string[]; // Thẻ kỹ năng nhận việc sinh viên
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
  lastActiveAt?: number; // Thời điểm hoạt động lần cuối (timestamp ms - dùng để xác định Online/Offline chuẩn xác)
  phonePrivacy?: 'PUBLIC' | 'ESCROW_ONLY' | 'PRIVATE'; // Tùy chọn quyền riêng tư hiển thị số điện thoại
  hasDeposited?: boolean; // Đã từng nạp tiền vào ví
  depositCount?: number; // Số lần đã nạp tiền
  createdAt?: number; // Thời điểm tạo tài khoản (timestamp)
  onlineSeconds?: number; // Thời gian online tích lũy (giây)
  isForceWithdrawOnly?: boolean; // Bị khóa tính năng, ép rút tiền do vượt trần 200 triệu
  isKycVerified?: boolean;
  friendIds?: string[]; // Danh sách ID bạn bè kết nối qua ID 9 số
  eloRating?: number; // Thang ELO sinh viên (khởi đầu 200 -> 2500+)
  eloTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'CHALLENGER';
  winStreak?: number; // Chuỗi đơn 5 sao liên tiếp
  studentBadges?: string[]; // Danh sách huy hiệu vinh danh ELO
  fcmEnabled?: boolean; // Bật thông báo đẩy FCM
  fcmToken?: string;
  avatarUrl?: string; // Ảnh đại diện người dùng tùy chỉnh
  bio?: string; // Giới thiệu bản thân / Slogan cá nhân sinh viên
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
  reservedByUserId?: string; // ID người đặt cọc giữ chỗ
  reservedByUserName?: string; // Tên người đặt cọc giữ chỗ
  depositAmount?: number; // Số tiền cọc qua Smart Escrow (VNĐ)
  reservedAt?: number; // Thời điểm đặt cọc (timestamp)
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
    | 'VIDEO'
    | 'FILE'
    | 'VOIP_CALL_INVITE'
    | 'VIDEO_CALL_INVITE';
  attachmentData?: string | null;
  attachmentDuration?: number; // Thời lượng audio giây cho Voice Note
  mediaFileName?: string;
  fileSizeBytes?: number;
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
  status?: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  rejectionReason?: string;
  approvedAt?: number;
}

export type TransactionEntity = WalletTransactionEntity;

export type AppRoleMode = 'CLIENT' | 'FREELANCER';

export interface VoipCallEntity {
  id: string;
  callerId: string;
  callerName: string;
  callerRole?: string;
  callerAvatarUrl?: string;
  targetUserId: string;
  targetUserName?: string;
  gigId?: string;
  isVideo: boolean;
  status: 'RINGING' | 'ACCEPTED' | 'REJECTED' | 'ENDED';
  timestamp: number;
  acceptedAt?: number;
  endedAt?: number;
}

export interface VoipCallSession {
  callId?: string;
  gigId: string;
  partnerId?: string;
  partnerName: string;
  partnerRole?: string;
  partnerAvatarUrl?: string;
  maskedPhoneNumber: string;
  isMuted: boolean;
  isVideo?: boolean;
  isVideoOff?: boolean;
  durationSeconds: number;
  isIncoming?: boolean;
  callerId?: string;
  callerName?: string;
}

export interface UiNotification {
  id: string;
  title: string;
  message: string;
  titleVi?: string;
  messageVi?: string;
  titleEn?: string;
  messageEn?: string;
  isDingSound?: boolean;
  isCelebration?: boolean;
}

export interface FirestoreNotificationEntity {
  id: string;
  title: string;
  message: string;
  type: 'NEW_GIG' | 'STATUS_UPDATE' | 'INFO';
  gigId?: string;
  gigTitle?: string;
  status?: string;
  userId?: string;
  createdAt: number;
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
  { code: 'MB', name: 'MBBank', fullName: 'Ngân hàng TMCP Quân Đội' },
  { code: 'TCB', name: 'Techcombank', fullName: 'Ngân hàng TMCP Kỹ thương Việt Nam' },
  { code: 'MOMO', name: 'MoMo', fullName: 'Ví Điện Tử MoMo (Napas 247)' },
  { code: 'ACB', name: 'ACB', fullName: 'Ngân hàng TMCP Á Châu' },
  { code: 'BIDV', name: 'BIDV', fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
  { code: 'CTG', name: 'VietinBank', fullName: 'Ngân hàng TMCP Công Thương Việt Nam' },
  { code: 'TPB', name: 'TPBank', fullName: 'Ngân hàng TMCP Tiên Phong' },
];

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}đ`;
}

export type PhonePrivacyMode = 'PUBLIC' | 'ESCROW_ONLY' | 'PRIVATE';

/**
 * Ẩn/che số điện thoại theo tùy chọn quyền riêng tư:
 * - PUBLIC: Hiển thị đầy đủ
 * - ESCROW_ONLY: Chỉ hiển thị đầy đủ khi có giao dịch ký quỹ Escrow / Đã nhận việc / Đã cọc giữ đồ. Nếu chưa thì che dạng `0909 ••• 918`
 * - PRIVATE: Luôn che số dạng `0909 ••• •••` (chỉ trao đổi qua Chat bảo mật GigMe)
 */
export function maskPhoneNumber(
  phone?: string,
  mode: PhonePrivacyMode = 'ESCROW_ONLY',
  isEscrowActive: boolean = false
): string {
  if (!phone || !phone.trim()) return '';
  const clean = phone.trim();
  if (mode === 'PUBLIC' || isEscrowActive) return clean;
  if (mode === 'PRIVATE') {
    return clean.length >= 7 ? `${clean.slice(0, 4)} ••• •••` : '••••••••';
  }
  // ESCROW_ONLY (chưa active escrow): che phần giữa
  return clean.length >= 8 ? `${clean.slice(0, 4)} ••• ${clean.slice(-3)}` : `${clean.slice(0, 3)}•••••`;
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
