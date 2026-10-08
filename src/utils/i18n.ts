export type Language = 'vi' | 'en';

export interface Translations {
  // App & Brand
  appName: string;
  campusStudent: string;
  tagline: string;
  campusWallet: string;
  notifications: string;
  account: string;
  profile: string;
  viewProfile: string;
  logout: string;
  adminPanel: string;
  rootAdminNotice: string;
  openAdmin: string;
  language: string;
  vietnamese: string;
  english: string;
  switchLanguage: string;
  currentLanguageName: string;
  
  // Navigation & tabs
  navHome: string;
  navMarketplace: string;
  navCreateGig: string;
  navChat: string;
  navProfile: string;
  navWallet: string;
  navLaw: string;

  // Header dropdown items
  walletAndPay: string;
  scanVietQr: string;
  scanVietQrDesc: string;
  quickTopup: string;
  quickTopupDesc: string;
  campusUtilities: string;
  dormMarket: string;
  dormMarketDesc: string;
  campusLaw: string;
  campusLawDesc: string;
  eloBadge: string;
  eloBadgeDesc: string;
  downloadApp: string;
  downloadAppDesc: string;
  adminSection: string;
  logoutDevice: string;

  // Home Screen & Radar
  searchPlaceholder: string;
  voiceSearch: string;
  filterAll: string;
  filterFlashGigs: string;
  filterGaming: string;
  filterTutoring: string;
  filterDigital: string;
  filterDelivery: string;
  filterCampusHelp: string;
  radarTitle: string;
  radarSubtitle: string;
  quickHub: string;
  availableGigsTitle: string;
  urgentBadge: string;
  escrowProtected: string;
  viewDetails: string;
  applyNow: string;
  postGigCta: string;
  noGigsFound: string;
  noGigsSubtext: string;
  reward: string;
  deadline: string;
  distance: string;
  applicants: string;
  hotBoost: string;
  auctionOpen: string;
  reverseAuction: string;
  escrowReward: string;
  mins: string;
  weekly: string;
  team: string;
  students: string;
  joinAuction: string;
  bid: string;
  viewGig: string;
  resetFilters: string;
  advancedFilters: string;
  budgetRange: string;
  allBudgets: string;
  estimatedDuration: string;
  allDurations: string;
  superFast: string;
  over60Mins: string;
  recurringJobs: string;
  groupJobs: string;
  studentIdOcr: string;
  level2Verify: string;
  offlineGigs: string;
  offlineGigsDesc: string;
  oneTapInstall: string;
  freeMarket: string;
  rules18: string;

  // Profile Screen
  trustScoreTitle: string;
  trustScoreDesc: string;
  trustScoreBadge: string;
  completedGigsCount: string;
  onTimeRate: string;
  reviewsCount: string;
  identityVerificationCenter: string;
  nfcCccdTitle: string;
  nfcCccdDesc: string;
  ssoSchoolTitle: string;
  ssoSchoolDesc: string;
  eduEmailTitle: string;
  eduEmailDesc: string;
  verifiedStatus: string;
  unverifiedStatus: string;
  skillsSectionTitle: string;
  skillsSectionDesc: string;
  addSkillPlaceholder: string;
  addSkillBtn: string;
  securitySectionTitle: string;
  biometricsTitle: string;
  biometricsDesc: string;
  pinSecurityTitle: string;
  pinSecurityDesc: string;
  cloudBackupTitle: string;
  cloudBackupDesc: string;
  editProfileBtn: string;
  editProfileTitle: string;
  editProfileSubtitle: string;
  lastNameLabel: string;
  firstNameLabel: string;
  fullNameLabel: string;
  phoneLabel: string;
  schoolLabel: string;
  bioLabel: string;
  cancelBtn: string;
  saveChangesBtn: string;

  // Wallet Screen
  walletTitle: string;
  availableBalance: string;
  escrowHoldingBalance: string;
  depositBtn: string;
  withdrawBtn: string;
  transactionHistoryTitle: string;
  noTransactions: string;
  depositModalTitle: string;
  withdrawModalTitle: string;
  instantTransferNapas: string;
  escrowNotice: string;
  defaultBankTitle: string;
  defaultBankDesc: string;
  changeAccount: string;
  linkNow: string;
  ekycVerified: string;
  withdrawToThisBank: string;
  noBankLinked: string;
  setup: string;
  gatewaysAndServices: string;
  momoZaloGateway: string;
  momoZaloDesc: string;
  autoVietQr: string;
  autoVietQrDesc: string;
  linkedEWallets: string;
  linkedEWalletsDesc: string;
  appleGooglePay: string;
  appleGooglePayDesc: string;
  manage: string;
  connected: string;
  notConnected: string;
  depositSafetyNotice: string;
  withdrawalSafetyNotice: string;

  // Chat Screen
  messagesTitle: string;
  searchContactsPlaceholder: string;
  addFriendBtn: string;
  onlineNow: string;
  directChatTitle: string;
  typeMessagePlaceholder: string;
  sendBtn: string;
  your9DigitId: string;
  noConversations: string;
  maskedCall: string;
  chatHandover: string;

  // Create Gig Screen
  createGigTitle: string;
  gigTitleLabel: string;
  gigCategoryLabel: string;
  gigBudgetLabel: string;
  gigLocationLabel: string;
  gigDeadlineLabel: string;
  gigDescLabel: string;
  submitGigBtn: string;
  aiEstimator: string;
  aiEstimatorDesc: string;
  analyzeNow: string;
  nextStep: string;
  previousStep: string;
  stepIndicator: string;

  // Marketplace Screen
  marketplaceTitle: string;
  marketplaceDesc: string;
  postItem: string;
  freeDonation: string;
  under50k: string;
  dormEssentials: string;
  contactSeller: string;
  reserveEscrow: string;
  completeHandover: string;
  cancelReservation: string;
  itemCondition: string;
  price: string;
  seller: string;
  allTextbooks: string;

  // Common UI
  vnd: string;
  idCard: string;
  trustScore: string;
  eloRating: string;
  close: string;
  confirm: string;
  back: string;
  loading: string;
  success: string;
  error: string;
  status: string;
  all: string;
}

export const translations: Record<Language, Translations> = {
  vi: {
    // App & Brand
    appName: 'GigMe',
    campusStudent: 'Sinh Viên',
    tagline: 'Nền tảng việc làm & Smart Escrow',
    campusWallet: 'Ví Campus',
    notifications: 'Thông báo',
    account: 'Tài khoản',
    profile: 'Hồ sơ',
    viewProfile: 'Xem hồ sơ',
    logout: 'Đăng xuất',
    adminPanel: 'Bảng Điều Hành Quản Trị Tối Cao',
    rootAdminNotice: 'QUẢN TRỊ VIÊN TỐI CAO (ROOT ADMIN 000000000)',
    openAdmin: 'Mở Bảng Admin',
    language: 'Ngôn ngữ',
    vietnamese: 'Tiếng Việt',
    english: 'English',
    switchLanguage: 'Chuyển đổi ngôn ngữ',
    currentLanguageName: 'Tiếng Việt',

    // Navigation & tabs
    navHome: 'Trang chủ',
    navMarketplace: 'Chợ KTX',
    navCreateGig: 'Đăng việc',
    navChat: 'Tin nhắn',
    navProfile: 'Cá nhân',
    navWallet: 'Ví tiền',
    navLaw: 'Bộ luật',

    // Header dropdown
    walletAndPay: 'Ví & Thanh Toán',
    scanVietQr: 'Quét VietQR',
    scanVietQrDesc: 'Chuyển khoản Napas 247',
    quickTopup: 'Cổng Nạp MoMo',
    quickTopupDesc: 'Khớp số dư tức thì',
    campusUtilities: 'Tiện Ích Sinh Viên',
    dormMarket: 'Chợ Giáo Trình & KTX',
    dormMarketDesc: 'Đổi sách cũ, đồ dùng sinh viên',
    campusLaw: 'Bộ Luật & Quy Chế Campus',
    campusLawDesc: '18 điều khoản bảo vệ Escrow',
    eloBadge: 'Huy Hiệu & Điểm ELO',
    eloBadgeDesc: 'Thứ hạng tín nhiệm sinh viên',
    downloadApp: 'Cài Đặt Ứng Dụng (PWA/APK)',
    downloadAppDesc: 'Chạy toàn màn hình & Nhận thông báo',
    adminSection: 'Quản Trị Hệ Thống',
    logoutDevice: 'Đăng xuất khỏi thiết bị',

    // Home Screen & Radar
    searchPlaceholder: 'Tìm kiếm kèo việc làm, giao hàng, gia sư, tài liệu...',
    voiceSearch: 'Tìm kiếm bằng giọng nói',
    filterAll: 'Tất cả',
    filterFlashGigs: 'Flash Gigs',
    filterGaming: 'Cày Game & Rank',
    filterTutoring: 'Tư vấn & Học tập',
    filterDigital: 'Digital Tasks',
    filterDelivery: 'Vận chuyển & Ship',
    filterCampusHelp: 'Trợ thủ Campus',
    radarTitle: 'Radar Bắt Việc Sinh Viên',
    radarSubtitle: 'Tìm kiếm kèo việc quanh bán kính hiện tại của bạn',
    quickHub: 'Tiện Ích Nhanh',
    availableGigsTitle: 'Công Việc Đang Chờ Sinh Viên',
    urgentBadge: 'HỎA TỐC',
    escrowProtected: 'Ký quỹ Escrow bảo đảm',
    viewDetails: 'Xem Chi Tiết',
    applyNow: 'Nhận Việc Ngay',
    postGigCta: 'Đăng Kèo Mới',
    noGigsFound: 'Chưa có công việc nào phù hợp',
    noGigsSubtext: 'Hãy thử mở rộng bán kính tìm kiếm hoặc đổi từ khóa tìm việc',
    reward: 'Thù lao',
    deadline: 'Thời hạn',
    distance: 'Khoảng cách',
    applicants: 'Ứng viên',
    hotBoost: 'HOT BOOST',
    auctionOpen: 'ĐANG TUYỂN',
    reverseAuction: 'Công việc Campus',
    escrowReward: 'Thù lao Escrow',
    mins: 'phút',
    weekly: 'Hàng tuần',
    team: 'Nhóm',
    students: 'bạn',
    joinAuction: 'Nhận Kèo Ngay',
    bid: 'Nhận Việc',
    viewGig: 'Xem Kèo',
    resetFilters: 'Đặt lại bộ lọc (5km)',
    advancedFilters: 'Bộ lọc nâng cao',
    budgetRange: 'Mức tiền thù lao:',
    allBudgets: 'Tất cả mức giá',
    estimatedDuration: 'Thời lượng hoàn thành:',
    allDurations: 'Tất cả thời lượng',
    superFast: 'Siêu tốc (< 15 phút)',
    over60Mins: 'Trên 60 phút',
    recurringJobs: 'Kèo định kỳ / Thuê theo tuần',
    groupJobs: 'Kèo ghép nhóm (>1 người cùng làm)',
    studentIdOcr: 'Quét Thẻ SV',
    level2Verify: 'Duyệt Cấp 2',
    offlineGigs: 'Kho Việc Offline',
    offlineGigsDesc: 'Xem trong thang máy',
    oneTapInstall: '1 Chạm',
    freeMarket: 'Chợ 0đ',
    rules18: '18 Điều',

    // Profile Screen
    trustScoreTitle: 'Điểm Tín Nhiệm Campus (TrustScore)',
    trustScoreDesc: 'Chỉ số bảo chứng uy tín trong các giao dịch ký quỹ Escrow',
    trustScoreBadge: 'Hạng Uy Tín',
    completedGigsCount: 'Kèo hoàn thành',
    onTimeRate: 'Đúng giờ',
    reviewsCount: 'đánh giá',
    identityVerificationCenter: 'Trung Tâm Định Danh & Xác Thực',
    nfcCccdTitle: 'Xác thực CCCD (NFC)',
    nfcCccdDesc: 'Quét chip CCCD bảo chứng danh tính Bộ Công An C06',
    ssoSchoolTitle: 'Cổng Trường Đại Học (SSO)',
    ssoSchoolDesc: 'Đăng nhập CAS / Office 365 xác minh sinh viên chính quy',
    eduEmailTitle: 'Hòm Thư Email (.edu.vn)',
    eduEmailDesc: 'Cấp Tích Xanh sinh viên chính quy & cộng điểm uy tín',
    verifiedStatus: 'Đã xác thực',
    unverifiedStatus: 'Chưa xác thực',
    skillsSectionTitle: 'Thẻ Kỹ Năng & Lĩnh Vực Nhận Việc',
    skillsSectionDesc: 'Giúp AI Smart Match kết nối việc làm sinh viên chính xác trên bản đồ. Mỗi kỹ năng ghi không quá 30 ký tự.',
    addSkillPlaceholder: 'Thêm kỹ năng mới (VD: Thiết kế Canva, Lập trình C++...)',
    addSkillBtn: 'Thêm',
    securitySectionTitle: 'Bảo Mật & Tiện Ích Ứng Dụng',
    biometricsTitle: 'Xác Thực Sinh Trắc Học (Vân Tay / FaceID)',
    biometricsDesc: 'Duyệt nhanh giao dịch tài chính & khôi phục mật khẩu',
    pinSecurityTitle: 'Mã PIN Ví & Ký Quỹ Escrow',
    pinSecurityDesc: 'Bảo mật 6 số bảo vệ lệnh rút tiền & ký duyệt Escrow',
    cloudBackupTitle: 'Sao Lưu & Khôi Phục Danh Bạ (ID 9 Số)',
    cloudBackupDesc: 'Đồng bộ hóa danh sách bạn bè campus khi đổi điện thoại mới',
    editProfileBtn: 'Chỉnh Sửa',
    editProfileTitle: 'Chỉnh Sửa Hồ Sơ Cá Nhân',
    editProfileSubtitle: 'Cập nhật thông tin hiển thị với cộng đồng sinh viên',
    lastNameLabel: 'Họ và tên đệm',
    firstNameLabel: 'Tên',
    fullNameLabel: 'Họ và tên',
    phoneLabel: 'Số điện thoại liên hệ',
    schoolLabel: 'Trường Đại Học / Ký Túc Xá',
    bioLabel: 'Giới thiệu bản thân (Bio / Slogan)',
    cancelBtn: 'Hủy Bỏ',
    saveChangesBtn: 'Lưu Thay Đổi',

    // Wallet Screen
    walletTitle: 'Ví Điện Tử Sinh Viên & Escrow',
    availableBalance: 'Số Dư Khả Dụng',
    escrowHoldingBalance: 'Đang Tạm Giữ Escrow',
    depositBtn: 'Nạp Tiền Vào Ví',
    withdrawBtn: 'Rút Tiền Về Ngân Hàng',
    transactionHistoryTitle: 'Biến Động Số Dư & Lịch Sử Giao Dịch',
    noTransactions: 'Chưa có giao dịch phát sinh nào trong ví của bạn.',
    depositModalTitle: 'Nạp Tiền Vào Ví Qua VietQR',
    withdrawModalTitle: 'Rút Tiền Về Tài Khoản Ngân Hàng',
    instantTransferNapas: 'Chuyển khoản liên ngân hàng Napas 247 tức thì',
    escrowNotice: 'Số tiền ký quỹ Escrow được bảo hộ 100% đến khi hai bên hoàn thành công việc.',
    defaultBankTitle: 'Tài Khoản Nhận Tiền Mặc Định',
    defaultBankDesc: 'Tự động điền khi rút tiền, giải ngân siêu tốc 24/7',
    changeAccount: 'Đổi tài khoản',
    linkNow: '+ Liên kết ngay',
    ekycVerified: '✓ Đã khớp E-KYC',
    withdrawToThisBank: 'Rút Về TK Này',
    noBankLinked: 'Chưa lưu tài khoản ngân hàng. Nhấn để cài đặt số tài khoản Napas 247 nhận tiền tức thì.',
    setup: 'Thiết lập',
    gatewaysAndServices: 'Cổng thanh toán & Dịch vụ sinh viên',
    momoZaloGateway: 'Cổng MoMo & ZaloPay',
    momoZaloDesc: 'App-to-App 1 chạm tức thì',
    autoVietQr: 'Tự Động Khớp VietQR',
    autoVietQrDesc: 'Open API Casso/SePAY 3 giây',
    linkedEWallets: 'Ví Điện Tử Đã Liên Kết',
    linkedEWalletsDesc: 'Quản lý ví ShopeePay / Viettel',
    appleGooglePay: 'Apple Pay, Google Pay & Thẻ Sinh Viên',
    appleGooglePayDesc: 'Xác thực vân tay, Face ID hoặc thẻ sinh viên đa năng',
    manage: 'Quản lý',
    connected: 'Đã nối',
    notConnected: 'Chưa nối',
    depositSafetyNotice: 'Nạp tiền: Max 10M/lần • Giãn cách 1h • Max 30M/ngày',
    withdrawalSafetyNotice: 'Rút tiền: Max 3M/lần • Giãn cách 15p • Dư >50k',

    // Chat Screen
    messagesTitle: 'Tin Nhắn & Hỗ Trợ 1-1',
    searchContactsPlaceholder: 'Tìm bạn theo Tên hoặc ID 9 số...',
    addFriendBtn: 'Thêm Bạn',
    onlineNow: 'Đang Trực Tuyến',
    directChatTitle: 'Phòng Chat Riêng Tư',
    typeMessagePlaceholder: 'Nhập tin nhắn trao đổi công việc...',
    sendBtn: 'Gửi',
    your9DigitId: 'ID 9 Số Của Bạn',
    noConversations: 'Chưa có cuộc trò chuyện nào. Bấm Thêm Bạn hoặc chọn người dùng để bắt đầu.',
    maskedCall: 'Gọi Ẩn Danh',
    chatHandover: 'Chat Bàn Giao',

    // Create Gig Screen
    createGigTitle: 'Đăng Kèo Công Việc Mới',
    gigTitleLabel: 'Tiêu đề công việc cần hỗ trợ',
    gigCategoryLabel: 'Lĩnh vực / Danh mục',
    gigBudgetLabel: 'Mức thù lao chi trả (VNĐ)',
    gigLocationLabel: 'Địa điểm / Trường học / Ký túc xá',
    gigDeadlineLabel: 'Hạn chót hoàn thành',
    gigDescLabel: 'Mô tả chi tiết yêu cầu công việc',
    submitGigBtn: 'Đăng Việc Ký Quỹ Escrow',
    aiEstimator: 'Trợ Lý AI Định Giá & Đề Bài',
    aiEstimatorDesc: 'Quét đề bài, tính độ khó, dự toán giờ làm & gợi ý khung giá chuẩn thị trường',
    analyzeNow: 'Phân tích ngay',
    nextStep: 'Tiếp Theo',
    previousStep: 'Quay Lại',
    stepIndicator: 'Bước',

    // Marketplace Screen
    marketplaceTitle: 'Chợ Đồ Cũ & Giáo Trình KTX',
    marketplaceDesc: 'Săn giáo trình cũ, bàn học KTX, máy tính Casio, đồ gia dụng giá sinh viên hoặc nhận đồ tặng 0đ.',
    postItem: 'Đăng Thanh Lý',
    freeDonation: 'Tặng Miễn Phí (0đ)',
    under50k: 'Dưới 50K',
    dormEssentials: 'Đồ dùng KTX',
    contactSeller: 'Nhắn Tin Người Bán',
    reserveEscrow: 'Đặt Cọc Smart Escrow',
    completeHandover: 'Đã Nhận Đồ (Giải Ngân)',
    cancelReservation: 'Hủy Giữ Đồ',
    itemCondition: 'Tình trạng',
    price: 'Giá bán',
    seller: 'Người bán',
    allTextbooks: 'Tất cả đồ dùng',

    // Common
    vnd: 'đ',
    idCard: 'ID 9 Số',
    trustScore: 'Điểm Tín Nhiệm',
    eloRating: 'ELO Sinh Viên',
    close: 'Đóng',
    confirm: 'Xác Nhận',
    back: 'Quay Lại',
    loading: 'Đang tải...',
    success: 'Thành Công',
    error: 'Lỗi',
    status: 'Trạng thái',
    all: 'Tất cả',
  },
  en: {
    // App & Brand
    appName: 'GigMe',
    campusStudent: 'Student',
    tagline: 'Student Micro-Jobs & Smart Escrow',
    campusWallet: 'Campus Wallet',
    notifications: 'Notifications',
    account: 'Account',
    profile: 'Profile',
    viewProfile: 'View profile',
    logout: 'Log out',
    adminPanel: 'Master Admin Dashboard',
    rootAdminNotice: 'ROOT ADMINISTRATOR (MASTER ADMIN 000000000)',
    openAdmin: 'Open Admin',
    language: 'Language',
    vietnamese: 'Tiếng Việt',
    english: 'English',
    switchLanguage: 'Switch Language',
    currentLanguageName: 'English',

    // Navigation & tabs
    navHome: 'Home',
    navMarketplace: 'Market',
    navCreateGig: 'Post Gig',
    navChat: 'Messages',
    navProfile: 'Profile',
    navWallet: 'Wallet',
    navLaw: 'Campus Law',

    // Header dropdown
    walletAndPay: 'Wallet & Payments',
    scanVietQr: 'Scan VietQR',
    scanVietQrDesc: 'Napas 247 Instant Transfer',
    quickTopup: 'MoMo E-Wallet',
    quickTopupDesc: 'Instant balance top-up',
    campusUtilities: 'Campus Utilities',
    dormMarket: 'Textbook & Dorm Market',
    dormMarketDesc: 'Books & student trading',
    campusLaw: 'Campus Laws & Rules',
    campusLawDesc: '18 articles Escrow protection',
    eloBadge: 'Badges & ELO Points',
    eloBadgeDesc: 'Student trust leaderboard',
    downloadApp: 'Install App (PWA/APK)',
    downloadAppDesc: 'Full screen & Lock screen alerts',
    adminSection: 'System Administration',
    logoutDevice: 'Sign out from this device',

    // Home Screen & Radar
    searchPlaceholder: 'Search jobs, deliveries, tutoring, notes...',
    voiceSearch: 'Voice search',
    filterAll: 'All',
    filterFlashGigs: 'Flash Gigs',
    filterGaming: 'Gaming & Rank',
    filterTutoring: 'Tutoring & Study',
    filterDigital: 'Digital Tasks',
    filterDelivery: 'Shipping & Delivery',
    filterCampusHelp: 'Campus Assistant',
    radarTitle: 'Campus Job Radar',
    radarSubtitle: 'Find student micro-jobs around your current campus radius',
    quickHub: 'Quick Hub',
    availableGigsTitle: 'Available Jobs For Students',
    urgentBadge: 'URGENT',
    escrowProtected: 'Escrow Protected',
    viewDetails: 'View Details',
    applyNow: 'Apply Now',
    postGigCta: 'Post A New Gig',
    noGigsFound: 'No matching jobs found',
    noGigsSubtext: 'Try expanding your radar search radius or switching filters',
    reward: 'Reward',
    deadline: 'Deadline',
    distance: 'Distance',
    applicants: 'Applicants',
    hotBoost: 'HOT BOOST',
    auctionOpen: 'OPEN GIG',
    reverseAuction: 'Campus Gig',
    escrowReward: 'Escrow Reward',
    mins: 'mins',
    weekly: 'Weekly',
    team: 'Team',
    students: 'students',
    joinAuction: 'Accept Gig Now',
    bid: 'Apply',
    viewGig: 'View Gig',
    resetFilters: 'Reset Filters (5km)',
    advancedFilters: 'Advanced Filters',
    budgetRange: 'Budget range:',
    allBudgets: 'All budgets',
    estimatedDuration: 'Estimated duration:',
    allDurations: 'All durations',
    superFast: 'Super fast (< 15 mins)',
    over60Mins: 'Over 60 mins',
    recurringJobs: 'Recurring / Weekly jobs',
    groupJobs: 'Group jobs (>1 student)',
    studentIdOcr: 'Student ID OCR',
    level2Verify: 'Level 2 Verify',
    offlineGigs: 'Offline Gigs',
    offlineGigsDesc: 'Elevator / No 4G',
    oneTapInstall: '1-Tap',
    freeMarket: 'Free 0đ',
    rules18: '18 Rules',

    // Profile Screen
    trustScoreTitle: 'Campus TrustScore Rating',
    trustScoreDesc: 'Credibility index protecting your Smart Escrow transactions',
    trustScoreBadge: 'Trust Tier',
    completedGigsCount: 'Completed gigs',
    onTimeRate: 'On-time rate',
    reviewsCount: 'reviews',
    identityVerificationCenter: 'Identity & Verification Center',
    nfcCccdTitle: 'National ID (CCCD NFC)',
    nfcCccdDesc: 'Read CCCD chip verified by Ministry of Public Security C06',
    ssoSchoolTitle: 'University Portal (SSO)',
    ssoSchoolDesc: 'Login via university CAS / Office 365 student account',
    eduEmailTitle: 'School Email (.edu.vn)',
    eduEmailDesc: 'Get verified student blue badge and trust boost',
    verifiedStatus: 'Verified',
    unverifiedStatus: 'Unverified',
    skillsSectionTitle: 'Skills & Work Categories',
    skillsSectionDesc: 'Helps AI Smart Match connect you with campus jobs. Max 30 chars per skill.',
    addSkillPlaceholder: 'Add new skill (e.g. Canva Design, C++ Programming...)',
    addSkillBtn: 'Add',
    securitySectionTitle: 'Security & App Settings',
    biometricsTitle: 'Biometric Verification (Fingerprint / FaceID)',
    biometricsDesc: 'Instant approval for finance & fast password recovery',
    pinSecurityTitle: 'Wallet & Escrow PIN',
    pinSecurityDesc: '6-digit PIN securing withdrawals and Escrow approval',
    cloudBackupTitle: 'Cloud Backup & Restore Contacts (9-Digit ID)',
    cloudBackupDesc: 'Sync your campus friends list securely to cloud',
    editProfileBtn: 'Edit',
    editProfileTitle: 'Edit Personal Profile',
    editProfileSubtitle: 'Update your visible information to student community',
    lastNameLabel: 'Middle & Last Name',
    firstNameLabel: 'First Name',
    fullNameLabel: 'Full Name',
    phoneLabel: 'Contact Phone Number',
    schoolLabel: 'University / Dormitory',
    bioLabel: 'Personal Bio / Slogan',
    cancelBtn: 'Cancel',
    saveChangesBtn: 'Save Changes',

    // Wallet Screen
    walletTitle: 'Student Digital Wallet & Escrow',
    availableBalance: 'Available Balance',
    escrowHoldingBalance: 'Held in Escrow',
    depositBtn: 'Deposit Funds',
    withdrawBtn: 'Withdraw To Bank',
    transactionHistoryTitle: 'Balance Activity & Transaction History',
    noTransactions: 'No transactions recorded in your wallet yet.',
    depositModalTitle: 'Deposit To Wallet via VietQR',
    withdrawModalTitle: 'Withdraw Funds To Bank Account',
    instantTransferNapas: 'Instant 24/7 Napas interbank transfer',
    escrowNotice: 'Escrow deposit is 100% held safely until both parties confirm completion.',
    defaultBankTitle: 'Default Payout Account',
    defaultBankDesc: 'Auto-filled for withdrawal, 24/7 instant payout',
    changeAccount: 'Change account',
    linkNow: '+ Link now',
    ekycVerified: '✓ E-KYC Verified',
    withdrawToThisBank: 'Withdraw to this Bank',
    noBankLinked: 'No bank account linked yet. Tap to configure 24/7 Napas payout.',
    setup: 'Setup',
    gatewaysAndServices: 'Payment Gateways & Student Services',
    momoZaloGateway: 'MoMo & ZaloPay Gateway',
    momoZaloDesc: 'Instant 1-tap in-app payment',
    autoVietQr: 'Auto-Match VietQR',
    autoVietQrDesc: 'Open API Casso/SePAY in 3s',
    linkedEWallets: 'Linked E-Wallets',
    linkedEWalletsDesc: 'Manage ShopeePay / Viettel Money',
    appleGooglePay: 'Apple Pay, Google Pay & Student Card',
    appleGooglePayDesc: 'Fingerprint, Face ID or student multi-purpose card',
    manage: 'Manage',
    connected: 'Connected',
    notConnected: 'Not linked',
    depositSafetyNotice: 'Deposit: Max 10M/time • 1h cooldown • Max 30M/day',
    withdrawalSafetyNotice: 'Withdraw: Max 3M/time • 15min cooldown • Balance >50k',

    // Chat Screen
    messagesTitle: '1-on-1 Messages & Support',
    searchContactsPlaceholder: 'Search by Name or 9-digit ID...',
    addFriendBtn: 'Add Friend',
    onlineNow: 'Online Now',
    directChatTitle: 'Private Chat Thread',
    typeMessagePlaceholder: 'Type a message to discuss work...',
    sendBtn: 'Send',
    your9DigitId: 'Your 9-Digit ID',
    noConversations: 'No conversations yet. Tap Add Friend or select a user to begin.',
    maskedCall: 'Masked Call',
    chatHandover: 'Chat & Handover',

    // Create Gig Screen
    createGigTitle: 'Post A New Campus Gig',
    gigTitleLabel: 'Title of the gig',
    gigCategoryLabel: 'Category / Domain',
    gigBudgetLabel: 'Payment Reward (VND)',
    gigLocationLabel: 'Location / Campus / Dorm',
    gigDeadlineLabel: 'Completion Deadline',
    gigDescLabel: 'Detailed requirements description',
    submitGigBtn: 'Post Gig With Escrow Protection',
    aiEstimator: 'AI Pricing & Task Estimator',
    aiEstimatorDesc: 'Scan task, estimate hours & benchmark market price',
    analyzeNow: 'Analyze Now',
    nextStep: 'Next Step',
    previousStep: 'Back',
    stepIndicator: 'Step',

    // Marketplace Screen
    marketplaceTitle: 'Dorm Flea Market & Textbooks',
    marketplaceDesc: 'Find used textbooks, dorm desks, Casio calculators, student essentials or free gifts.',
    postItem: 'Sell / Trade Item',
    freeDonation: 'Free Gift (0đ)',
    under50k: 'Under 50K',
    dormEssentials: 'Dorm Essentials',
    contactSeller: 'Message Seller',
    reserveEscrow: 'Reserve via Escrow',
    completeHandover: 'Confirm Received (Payout)',
    cancelReservation: 'Cancel Reservation',
    itemCondition: 'Condition',
    price: 'Price',
    seller: 'Seller',
    allTextbooks: 'All student items',

    // Common
    vnd: 'VND',
    idCard: '9-Digit ID',
    trustScore: 'TrustScore',
    eloRating: 'Student ELO',
    close: 'Close',
    confirm: 'Confirm',
    back: 'Back',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    status: 'Status',
    all: 'All',
  },
};
