import {
  Scale,
  DollarSign,
  ShoppingBag,
  ShieldCheck,
  FileCheck,
  RotateCcw,
  Gavel,
  Lock,
  Bookmark,
  LucideIcon,
} from 'lucide-react';

export interface LawChapter {
  id: string;
  labelVi: string;
  labelEn: string;
  icon: LucideIcon;
}

export interface LawArticle {
  id: string;
  articleNumberVi: string;
  articleNumberEn: string;
  category: 'KYC' | 'ESCROW' | 'EXECUTION' | 'DISPUTE' | 'PRIVACY' | 'PENALTY' | 'MARKETPLACE';
  titleVi: string;
  titleEn: string;
  summaryVi: string;
  summaryEn: string;
  clausesVi: string[];
  clausesEn: string[];
  penaltySnippetVi?: string;
  penaltySnippetEn?: string;
  isCritical?: boolean;
}

export const LAW_CHAPTER_LIST: LawChapter[] = [
  { id: 'ALL', labelVi: 'Toàn Bộ Bộ Luật', labelEn: 'All Platform Code', icon: Scale },
  { id: 'ESCROW', labelVi: 'Smart Escrow & Tiền', labelEn: 'Smart Escrow & Payments', icon: DollarSign },
  { id: 'MARKETPLACE', labelVi: 'Chợ KTX & Đồ Cũ', labelEn: 'Dorm Flea Market & Used Goods', icon: ShoppingBag },
  { id: 'KYC', labelVi: 'Định Danh & Chống Gian Lận', labelEn: 'KYC & Anti-Fraud', icon: ShieldCheck },
  { id: 'EXECUTION', labelVi: 'Thực Hiện & Bàn Giao', labelEn: 'Task Delivery & Handover', icon: FileCheck },
  { id: 'DISPUTE', labelVi: 'Trọng Tài & Hoàn Tiền', labelEn: 'Arbitration & Refunds', icon: RotateCcw },
  { id: 'PENALTY', labelVi: 'Khung Chế Tài Xử Phạt', labelEn: 'Sanctions & Penalties', icon: Gavel },
  { id: 'PRIVACY', labelVi: 'Bảo Mật Nghị Định 13', labelEn: 'Privacy & Decree 13', icon: Lock },
  { id: 'BOOKMARKS', labelVi: 'Điều Khoản Đã Lưu', labelEn: 'Bookmarked Articles', icon: Bookmark },
];

export const FULL_LAW_ARTICLES: LawArticle[] = [
  // CHƯƠNG I: ĐỊNH DANH & CHỐNG GIAN LẬN
  {
    id: 'art-1',
    articleNumberVi: 'Điều 1',
    articleNumberEn: 'Article 1',
    category: 'KYC',
    titleVi: 'Tư cách thành viên & Định danh sinh viên chính chủ (KYC Cấp 1, 2, 3)',
    titleEn: 'Membership Eligibility & Verified Student Identity (KYC Tier 1, 2, 3)',
    summaryVi: 'Mọi cá nhân tham gia GigMe phải chịu trách nhiệm pháp lý với danh tính đã đăng ký.',
    summaryEn: 'All members participating on GigMe bear legal responsibility for their registered identities.',
    clausesVi: [
      '1.1. Nền tảng GigMe chỉ cấp quyền nhận việc và cung ứng dịch vụ cho các cá nhân đã hoàn thành tối thiểu KYC Cấp 1 (Số điện thoại chính chủ + Email trường .edu.vn hoặc xác thực giấy tờ sinh viên).',
      '1.2. Thành viên mở gói thầu trị giá từ 500.000 VNĐ trở lên hoặc kích hoạt tính năng thanh toán ký quỹ tự động bắt buộc phải thực hiện quét Chíp CCCD qua công nghệ NFC hoặc xác thực khuôn mặt Face Liveness 3D (KYC Cấp 2/3).',
      '1.3. Nghiêm cấm mượn, cho thuê, mua bán, làm giả hoặc sử dụng thông tin danh tính của người khác dưới bất kỳ hình thức nào. Hành vi sử dụng giấy tờ giả mạo sẽ bị chuyển hồ sơ sang cơ quan Công an xử lý theo Điều 341 Bộ luật Hình sự Việt Nam.',
    ],
    clausesEn: [
      '1.1. GigMe only grants job acceptance and service rights to individuals who have completed at least Tier 1 KYC (valid phone number + institutional .edu.vn email or student ID verification).',
      '1.2. Members opening bids exceeding 500,000 VND or enabling automated escrow payouts must complete NFC National ID Chip scanning or Face Liveness 3D verification (Tier 2/3 KYC).',
      '1.3. Borrowing, renting, selling, counterfeiting, or utilizing third-party identity credentials is strictly prohibited. Forgery offenses will be handed over to Law Enforcement under Article 341 of the Penal Code.',
    ],
    penaltySnippetVi: 'Tước quyền thành viên vĩnh viễn, phong tỏa tài khoản và gửi thông báo kỷ luật về Ban Giám hiệu Nhà trường.',
    penaltySnippetEn: 'Permanent forfeiture of membership rights, account freezing, and disciplinary report sent to University Dean.',
    isCritical: true,
  },
  {
    id: 'art-2',
    articleNumberVi: 'Điều 2',
    articleNumberEn: 'Article 2',
    category: 'KYC',
    titleVi: 'Chống tài khoản ảo, Sybil Ring và thao túng đánh giá tín nhiệm ELO',
    titleEn: 'Anti-Fake Accounts, Sybil Ring Detection & ELO Trust Manipulation',
    summaryVi: 'Nghiêm cấm hành vi tự tạo tài khoản phụ để buff đánh giá hoặc gian lận thuật toán xếp hạng.',
    summaryEn: 'Strictly forbids creating secondary fake accounts to boost reviews or manipulate ranking algorithms.',
    clausesVi: [
      '2.1. Mỗi sinh viên chỉ được sở hữu duy nhất 01 (một) tài khoản gắn liền với 01 ID 9 số bất biến trên nền tảng.',
      '2.2. Hệ thống kiểm định AI Sybil Audit tự động quét dấu vân tay thiết bị (Fingerprint), địa chỉ IP, mạng WiFi ký túc xá và tọa độ GPS. Mọi vòng tròn liên kết chéo (Sybil Ring) giữa các tài khoản cố tình đánh giá 5 sao ảo hoặc tạo giao dịch khống sẽ bị phát hiện ngay lập tức.',
      '2.3. Các tài khoản vi phạm sẽ bị reset toàn bộ điểm tín nhiệm ELO về 0.0 ★, thu hồi toàn bộ huy hiệu danh dự và ghi nhận cảnh báo xấu trong lịch sử Campus.',
    ],
    clausesEn: [
      '2.1. Each student is permitted only 1 (one) account linked to an immutable 9-digit unique ID on the platform.',
      '2.2. The AI Sybil Audit engine automatically inspects hardware fingerprints, IP addresses, campus dormitory Wi-Fi networks, and GPS traces. Any reciprocal rings exchanging artificial 5-star reviews or dummy transactions are detected instantly.',
      '2.3. Violating accounts will have their ELO score reset to 0.0 ★, all badges revoked, and permanent behavioral red flags logged in Campus records.',
    ],
    penaltySnippetVi: 'Xóa sổ vĩnh viễn mạng lưới tài khoản ảo, đóng băng ví nạp/rút 60 ngày.',
    penaltySnippetEn: 'Permanent eradication of sybil networks and 60-day freeze on wallet deposits and withdrawals.',
  },
  {
    id: 'art-3',
    articleNumberVi: 'Điều 3',
    articleNumberEn: 'Article 3',
    category: 'KYC',
    titleVi: 'Kiểm soát vị trí GPS thực tế & Nghiêm cấm công cụ Fake GPS / Giả lập',
    titleEn: 'Real GPS Physical Verification & Strict Ban on Fake GPS Spoofing',
    summaryVi: 'Chỉ chấp nhận tín hiệu định vị vệ tinh thực tế khi quét nhận việc lân cận và check-in hiện trường.',
    summaryEn: 'Accepts solely authentic satellite signals for nearby job scanning and on-site check-in verification.',
    clausesVi: [
      '3.1. Các đơn công việc yêu cầu có mặt thực địa (Giao nhận, phụ việc KTX, mua hộ, đưa đón) bắt buộc phải bật GPS chuẩn xác trong phạm vi bán kính cho phép.',
      '3.2. Nghiêm cấm sử dụng phần mềm giả lập Mock Location (Fake GPS), VPN che giấu IP hoặc Proxy nhằm lừa đảo hệ thống nhận đơn từ xa.',
      '3.3. Khi hệ thống Anti-Mock phát hiện cờ vị trí giả mạo, đơn việc sẽ bị hủy tức thì và quyền bắt kèo theo Radar sẽ bị vô hiệu hóa trong 72 giờ.',
    ],
    clausesEn: [
      '3.1. Physical gigs (dorm deliveries, campus chores, peer rides) mandate accurate active GPS within permissible radius.',
      '3.2. Using Mock Location tools, GPS spoofers, IP VPNs, or proxies to claim distant orders deceitfully is forbidden.',
      '3.3. When the Anti-Mock system flags spoofed coordinates, the gig is cancelled immediately and Radar matching is suspended for 72 hours.',
    ],
  },

  // CHƯƠNG II: SMART ESCROW & AN TOÀN TÀI CHÍNH
  {
    id: 'art-4',
    articleNumberVi: 'Điều 4',
    articleNumberEn: 'Article 4',
    category: 'ESCROW',
    titleVi: 'Cơ chế Ký Quỹ Smart Escrow 100% trước khi triển khai công việc',
    titleEn: '100% Smart Escrow Vault Pre-Deposit Mechanism Prior to Execution',
    summaryVi: 'Bảo vệ tuyệt đối dòng tiền của cả Người Thuê (Client) và Người Làm (Worker).',
    summaryEn: 'Total financial protection for both the Client and the Freelancer.',
    clausesVi: [
      '4.1. Khi Người thuê chấp nhận giao kèo hoặc chọn người trúng đấu giá ngược, 100% thù lao cam kết sẽ được trừ từ ví Người thuê và phong tỏa an toàn trong Quỹ Ký Quỹ Smart Escrow.',
      '4.2. Người thuê không thể tự ý rút lại tiền trong thời gian Người làm đang thực hiện đúng hẹn và đúng yêu cầu.',
      '4.3. Người làm được bảo đảm 100% nhận đủ tiền thù lao ngay khi hoàn tất nhiệm vụ và có minh chứng nghiệm thu hợp lệ.',
      '4.4. Tiền chỉ được giải ngân tự động khi: (a) Người thuê bấm "Xác Nhận Hoàn Thành", hoặc (b) Quá thời hạn nghiệm thu 24 giờ mà Người thuê không đưa ra bất kỳ phản hồi hay khiếu nại chính đáng nào.',
    ],
    clausesEn: [
      '4.1. Upon accepting a gig match or reverse bidding winner, 100% of the agreed compensation is deducted from the Client’s wallet into the Smart Escrow Vault.',
      '4.2. The Client cannot unilaterally retract escrow funds while the Worker is actively fulfilling tasks within the agreed schedule.',
      '4.3. The Worker is guaranteed 100% disbursement upon successful handover and valid proof submission.',
      '4.4. Escrow releases automatically when: (a) Client clicks "Confirm Handover & Release", or (b) 24 hours elapse without any formal complaint filed.',
    ],
    isCritical: true,
  },
  {
    id: 'art-5',
    articleNumberVi: 'Điều 5',
    articleNumberEn: 'Article 5',
    category: 'ESCROW',
    titleVi: 'Nghiêm cấm tuyệt đối hành vi lách giao dịch ngoài sàn (Anti-Leakage Policy)',
    titleEn: 'Strict Anti-Leakage Policy (Prohibition of Off-Platform Dealings)',
    summaryVi: 'Cấm trao đổi thông tin chuyển khoản ngoài, số điện thoại hoặc Zalo nhằm quỵt tiền ký quỹ.',
    summaryEn: 'Prohibits exchanging private bank info, phone numbers, or external apps to circumvent escrow safeguards.',
    clausesVi: [
      '5.1. Mọi thỏa thuận thù lao, thanh toán phải được thực hiện thông qua hệ thống Ví Smart Escrow của GigMe.',
      '5.2. Nghiêm cấm hành vi gửi số tài khoản cá nhân, mã QR ngoài, số điện thoại ngầm hoặc hẹn gặp giao dịch tiền mặt nhằm trốn tránh cơ chế bảo đảm ký quỹ của sàn.',
      '5.3. Hệ thống quét tự động (Anti-Leakage Engine) sẽ che giấu các nội dung vi phạm trong khung chat và gửi cảnh báo đỏ tới quản trị viên.',
      '5.4. Trường hợp hai bên cố tình lách giao dịch ngoài sàn: Nếu xảy ra tình trạng quỵt tiền, bỏ kèo, mất đồ hoặc lừa đảo, GigMe từ chối hoàn toàn trách nhiệm hỗ trợ bồi thường và sẽ áp dụng chế tài kỷ luật đối với cả hai bên.',
    ],
    clausesEn: [
      '5.1. All payments, compensations, and tips must route strictly through GigMe Smart Escrow.',
      '5.2. Sending external bank accounts, third-party QRs, hidden phone digits, or arranging cash under the table to bypass escrow is forbidden.',
      '5.3. The Anti-Leakage AI engine masks offending numbers in chat threads and flags incidents to the Master Admin.',
      '5.4. If parties trade off-platform and suffer non-payment, stolen goods, or scams, GigMe disclaims all compensation responsibility and sanctions both parties.',
    ],
    penaltySnippetVi: 'Khóa tính năng chat 30 ngày, hạ bậc thứ hạng Campus và phạt trừ 50% điểm uy tín ELO.',
    penaltySnippetEn: '30-day chat lock, campus ranking demotion, and 50% penalty deduction from ELO reputation.',
    isCritical: true,
  },
  {
    id: 'art-6',
    articleNumberVi: 'Điều 6',
    articleNumberEn: 'Article 6',
    category: 'ESCROW',
    titleVi: 'Hạn mức nạp/rút tiền, thời gian giãn cách Cooldown và chống rửa tiền (AML)',
    titleEn: 'Deposit & Withdrawal Limits, Cooldown Intervals, and AML Rules',
    summaryVi: 'Tuân thủ nghiêm ngặt quy chế quản lý tài chính sinh viên và phòng chống gian lận dòng tiền.',
    summaryEn: 'Strict compliance with campus student financial safety and anti-money laundering regulations.',
    clausesVi: [
      '6.1. Hạn mức Nạp tiền: Tối đa 10.000.000 VNĐ cho mỗi lần nạp; tối đa 30.000.000 VNĐ trong vòng 24 giờ; số dư tích lũy ví không được vượt quá mức trần 200.000.000 VNĐ.',
      '6.2. Quy tắc Giãn cách (Cooldown): Sau mỗi giao dịch nạp tiền thành công, hệ thống yêu cầu giãn cách an toàn tối thiểu 60 phút trước khi mở lệnh tiếp theo.',
      '6.3. Điều kiện Rút tiền về Ngân hàng: Tài khoản phải thỏa mãn các tiêu chuẩn: (a) Số dư tối thiểu sau rút > 50.000 VNĐ; (b) Đã hoàn thành tối thiểu 01 công việc có đánh giá thực tế; (c) Tuổi tài khoản >= 5 ngày và thời lượng hoạt động >= 3 giờ; (d) Tên chủ tài khoản ngân hàng thụ hưởng phải trùng khớp 100% với họ tên KYC.',
      '6.4. Nghiêm cấm sử dụng ví GigMe làm kênh trung chuyển tiền bẩn, tiền lừa đảo mạng hoặc rửa tiền dưới mọi hình thức.',
    ],
    clausesEn: [
      '6.1. Deposit Caps: Maximum 10,000,000 VND per transaction; maximum 30,000,000 VND per 24 hours; wallet balance ceiling must not exceed 200,000,000 VND.',
      '6.2. Deposit Cooldown: Following each successful deposit, a mandatory 60-minute cooling interval is enforced before the next deposit.',
      '6.3. Withdrawal Standards: (a) Retained minimum balance > 50,000 VND; (b) Completed at least 1 verified rated gig; (c) Account age >= 5 days and active time >= 3 hours; (d) Bank beneficiary name must match KYC full name 100%.',
      '6.4. Using the GigMe wallet as an intermediary conduit for illegal proceeds, scam funds, or money laundering is strictly illegal.',
    ],
  },
  {
    id: 'art-7',
    articleNumberVi: 'Điều 7',
    articleNumberEn: 'Article 7',
    category: 'ESCROW',
    titleVi: 'Phân bổ thù lao tự động cho đơn làm việc nhóm (Split Payout)',
    titleEn: 'Automated Split Payouts for Multi-Worker Group Gigs',
    summaryVi: 'Đảm bảo tiền công được chia đều, minh bạch tới từng thành viên tham gia.',
    summaryEn: 'Guarantees equal, transparent remuneration direct to every participating student.',
    clausesVi: [
      '7.1. Đối với các đơn tuyển nhiều người (Multi-Worker Gig), khi hoàn thành, Smart Escrow sẽ tự động chia đều số tiền thù lao về thẳng ví từng thành viên đã check-in mã QR hiện trường.',
      '7.2. Nhóm trưởng hoặc người đăng tuyển không được quyền giữ tiền công hoặc cắt xén thù lao của các thành viên khác.',
      '7.3. Nếu có vị trí bỏ trống hoặc thành viên vắng mặt (No-show), số tiền thù lao của vị trí đó sẽ được tự động hoàn trả 100% về ví của Người thuê.',
    ],
    clausesEn: [
      '7.1. For multi-worker gigs, upon completion, Smart Escrow splits and deposits funds directly into the wallets of attendees who checked in via field QR.',
      '7.2. Group leads or team heads have zero authority to withhold, pocket, or dock compensation from peer workers.',
      '7.3. Unfilled slots or no-show positions are immediately refunded 100% back to the Client’s wallet.',
    ],
  },

  // CHƯƠNG III: THỰC HIỆN CÔNG VIỆC & BẰNG CHỨNG BÀN GIAO
  {
    id: 'art-8',
    articleNumberVi: 'Điều 8',
    articleNumberEn: 'Article 8',
    category: 'EXECUTION',
    titleVi: 'Minh chứng bàn giao bằng ảnh có đóng dấu Watermark Blockchain Hash',
    titleEn: 'Watermarked Blockchain Hash Proof for Work Delivery & Handover',
    summaryVi: 'Mọi công việc hoàn tất phải có bằng chứng hình ảnh rõ ràng để giải ngân Escrow.',
    summaryEn: 'All task completions must bear verifiable cryptographic photo evidence for escrow release.',
    clausesVi: [
      '8.1. Khi bàn giao kết quả (Giao nhận hàng hóa, dọn phòng, sửa chữa, cài đặt máy tính), Người làm phải chụp ảnh hiện trường qua tính năng Blockchain Proof tích hợp trong app.',
      '8.2. Ảnh minh chứng sẽ tự động được đóng dấu Watermark gồm: Mã băm SHA-256 chống cắt ghép, thời gian chụp UTC+7 chuẩn xác đến từng giây, và tọa độ GPS địa điểm thực tế.',
      '8.3. Ảnh minh chứng là tài liệu pháp lý tối cao được Hội đồng Trọng tài GigMe căn cứ để giải quyết khi xảy ra tranh chấp.',
    ],
    clausesEn: [
      '8.1. When handing over deliverables (package arrival, room cleaning, device repair), the worker must capture evidence via the app’s Blockchain Proof feature.',
      '8.2. Proof photos are stamped automatically with: Anti-tamper SHA-256 hash, UTC+7 timestamp accurate to the second, and verified physical GPS coordinates.',
      '8.3. Cryptographic proof photos serve as supreme legal evidence evaluated by the GigMe Arbitration Board in disputes.',
    ],
  },
  {
    id: 'art-9',
    articleNumberVi: 'Điều 9',
    articleNumberEn: 'Article 9',
    category: 'EXECUTION',
    titleVi: 'Quy chuẩn công việc, danh mục cấm và phòng chống vi phạm quy chế đào tạo',
    titleEn: 'Job Compliance Standards, Prohibited Categories & Academic Integrity',
    summaryVi: 'Nghiêm cấm các công việc trái pháp luật, vi phạm thuần phong mỹ tục hoặc quy chế thi cử.',
    summaryEn: 'Strict ban on illegal activities, moral violations, exam fraud, or academic dishonor.',
    clausesVi: [
      '9.1. Danh mục cấm đăng tải tuyệt đối: Mua bán chất cấm, rượu bia thuốc lá trong khuôn viên KTX, văn hóa phẩm đồi trụy, vũ khí, cờ bạc, tiền ảo, hàng cấm theo quy định pháp luật Việt Nam.',
      '9.2. Quy chế liêm chính học thuật: Cấm tuyệt đối hành vi thi hộ, kiểm tra hộ, làm bài thi kết thúc học phần hộ hoặc gian lận học thuật. Nền tảng chỉ cho phép các dịch vụ hỗ trợ học tập lành mạnh: Gia sư, hướng dẫn phương pháp giải bài, dịch thuật tài liệu, hỗ trợ in ấn giáo trình.',
      '9.3. Người đăng bài vi phạm Điều 9 sẽ bị gỡ bài ngay lập tức, trừ toàn bộ tiền cọc đăng tin và khóa tài khoản không hoàn lại.',
    ],
    clausesEn: [
      '9.1. Absolute Prohibitions: Contraband, narcotics, alcohol or vapes on campus grounds, adult materials, weapons, gambling, crypto pyramid schemes, or illegal goods under Vietnamese law.',
      '9.2. Academic Integrity: Taking exams for others, proxy attendance for tests, or submitting fraudulent homework is strictly forbidden. Permitted study services include peer tutoring, concept mentoring, translation, and study guide printing.',
      '9.3. Offenders of Article 9 face immediate post takedown, forfeiture of listing deposit, and non-refundable permanent account termination.',
    ],
    isCritical: true,
  },
  {
    id: 'art-10',
    articleNumberVi: 'Điều 10',
    articleNumberEn: 'Article 10',
    category: 'EXECUTION',
    titleVi: 'Xử lý vi phạm Bỏ kèo (No-Show) và Hủy đơn sát giờ (Late Cancellation)',
    titleEn: 'Sanctions for Worker No-Show & Client Late Cancellation',
    summaryVi: 'Bảo vệ thời gian và công sức của các bên tham gia giao dịch.',
    summaryEn: 'Safeguards the precious time and effort invested by both platform participants.',
    clausesVi: [
      '10.1. Người làm việc tự ý bỏ kèo không đến (Worker No-Show): Bị trừ ngay 15 điểm tín nhiệm ELO, trừ phí phạt 30% giá trị đơn việc từ số dư ví để bồi thường cho Người thuê, và bị hạn chế nhận việc trong 48 giờ.',
      '10.2. Người thuê tự ý hủy đơn sát giờ (< 30 phút trước giờ hẹn) khi Người làm đã di chuyển đến nơi: Phải chịu phí bồi thường di chuyển tối thiểu 30.000 VNĐ đến 50% giá trị đơn việc được chuyển thẳng vào ví Người làm.',
      '10.3. Trường hợp bất khả kháng (Tai nạn, sự cố y tế khẩn cấp, thiên tai, cúp điện diện rộng): Phải cung cấp minh chứng xác thực cho Ban Quản Trị trong vòng 12 giờ để được xem xét miễn trừ phí phạt.',
    ],
    clausesEn: [
      '10.1. Worker No-Show: Immediate deduction of 15 ELO points, 30% gig value penalty deducted to compensate Client, and 48-hour matching suspension.',
      '10.2. Client Late Cancellation (< 30 min before schedule when worker has commuted): Mandatory travel compensation of 30,000 VND to 50% gig value credited directly to the worker’s wallet.',
      '10.3. Force Majeure (traffic accident, acute medical emergency, severe weather): Authentic documentation must be submitted to Support within 12 hours for penalty waiver consideration.',
    ],
  },

  // CHƯƠNG IV: TRỌNG TÀI & GIẢI QUYẾT TRANH CHẤP
  {
    id: 'art-11',
    articleNumberVi: 'Điều 11',
    articleNumberEn: 'Article 11',
    category: 'DISPUTE',
    titleVi: 'Quy trình Khiếu nại & Cơ chế đóng băng quỹ tranh chấp 24/7',
    titleEn: 'Dispute Filing Workflow & 24/7 Escrow Freezing Mechanism',
    summaryVi: 'Đảm bảo tiền không bị tẩu tán trong lúc hai bên đang bất đồng quan điểm.',
    summaryEn: 'Ensures capital is safely held and cannot be dispersed while disagreements are resolved.',
    clausesVi: [
      '11.1. Khi kết quả công việc không đạt yêu cầu hoặc có dấu hiệu gian lận, Người thuê có quyền bấm nút "Khiếu Nại & Mở Tranh Chấp" trước khi xác nhận nghiệm thu.',
      '11.2. Ngay khi bấm khiếu nại, toàn bộ số tiền thù lao trong Quỹ Escrow sẽ lập tức rơi vào trạng thái "ĐÓNG BĂNG TRANH CHẤP", không ai có thể rút tiền cho đến khi có phán quyết cuối cùng.',
      '11.3. Hai bên có thời hạn 04 giờ để tự hòa giải trong khung chat có gắn giám sát của Trọng tài. Nếu không đạt thỏa thuận, vụ việc tự động chuyển lên Hội đồng Trọng tài Admin Master.',
    ],
    clausesEn: [
      '11.1. If deliverables fail specifications or display bad faith, the Client can trigger "Dispute & Open Claim" before approving release.',
      '11.2. The moment a claim is filed, the escrow balance enters "DISPUTE FROZEN" status; neither party can withdraw until the verdict.',
      '11.3. Both parties have 4 hours to negotiate an amicable compromise in moderated chat. If unresolved, it escalates to the Master Admin Panel.',
    ],
  },
  {
    id: 'art-12',
    articleNumberVi: 'Điều 12',
    articleNumberEn: 'Article 12',
    category: 'DISPUTE',
    titleVi: 'Thẩm quyền phán quyết của Ban Quản Trị Tối Cao (Admin Master 000000000)',
    titleEn: 'Arbitration Jurisdiction of Supreme Admin Master (ID 000000000)',
    summaryVi: 'Phán quyết công tâm, dựa trên log hệ thống, lịch sử chat và ảnh Blockchain Proof.',
    summaryEn: 'Impartial judgment based on immutable system audit logs, chat history, and Blockchain Proof photos.',
    clausesVi: [
      '12.1. Ban Quản Trị Tối Cao (ID 000000000) giữ quyền tài phán độc lập và tối cao trên nền tảng GigMe.',
      '12.2. Trọng tài viên sẽ đánh giá toàn bộ dữ liệu: (a) Tin nhắn trao đổi; (b) Ảnh đóng dấu Blockchain SHA-256; (c) Tọa độ GPS check-in/check-out; (d) Lịch sử cuộc gọi VoIP.',
      '12.3. Các hình thức phán quyết: (1) Hoàn tiền 100% cho Người thuê; (2) Giải ngân 100% cho Người làm; (3) Chia tỷ lệ phần trăm theo khối lượng công việc thực tế đã hoàn thành.',
      '12.4. Phán quyết của Hội đồng Trọng tài là quyết định cuối cùng có hiệu lực thi hành ngay lập tức.',
    ],
    clausesEn: [
      '12.1. The Supreme Admin Master (ID 000000000) holds independent, binding jurisdiction over disputes on GigMe.',
      '12.2. Arbitrators review: (a) Chat dialogue logs; (b) SHA-256 stamped proof imagery; (c) GPS arrival/departure pings; (d) VoIP call history.',
      '12.3. Ruling Outlines: (1) 100% Refund to Client; (2) 100% Payout to Worker; (3) Pro-rata split matching verifiable work output.',
      '12.4. The Arbitration Council verdict is final, binding, and executed immediately.',
    ],
    isCritical: true,
  },
  {
    id: 'art-13',
    articleNumberVi: 'Điều 13',
    articleNumberEn: 'Article 13',
    category: 'DISPUTE',
    titleVi: 'Chính sách bảo đảm Hoàn tiền 100% (Zero-Risk Money Back Guarantee)',
    titleEn: '100% Zero-Risk Money Back Guarantee Policy',
    summaryVi: 'Bảo vệ quyền lợi khách hàng chuẩn tiêu chuẩn Apple App Store & Google Play Store.',
    summaryEn: 'Consumer protection conforming to Apple App Store & Google Play Store standards.',
    clausesVi: [
      '13.1. Người thuê được bảo đảm hoàn tiền 100% trong các trường hợp: (a) Đăng bài nhưng không có ai nhận việc và bấm hủy bài; (b) Người làm nhận việc nhưng không đến hiện trường (No-show); (c) Công việc bị chứng minh là không thực hiện hoặc làm hỏng hoàn toàn tài sản.',
      '13.2. Tiền hoàn trả sẽ được cộng trả ngay lập tức (0 giây delay) vào số dư Ví GigMe của người dùng và có thể rút về tài khoản ngân hàng bất cứ lúc nào.',
      '13.3. GigMe không thu bất kỳ khoản phí phạt nào đối với các yêu cầu hoàn tiền chính đáng và đúng quy định.',
    ],
    clausesEn: [
      '13.1. Clients are 100% guaranteed refunds if: (a) Order posted but cancelled before any worker accepted; (b) Matched worker no-shows; (c) Work is proven incomplete or caused severe property damage.',
      '13.2. Refunded monies are credited immediately (0s delay) back to the user’s GigMe wallet balance and can be withdrawn to bank at any time.',
      '13.3. GigMe assesses 0 VND penalty fees for legitimate refund claims executed per policy.',
    ],
  },

  // CHƯƠNG V: BẢO VỆ BÍ MẬT ĐỜI TƯ & DỮ LIỆU CÁ NHÂN
  {
    id: 'art-14',
    articleNumberVi: 'Điều 14',
    articleNumberEn: 'Article 14',
    category: 'PRIVACY',
    titleVi: 'Bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP của Chính Phủ',
    titleEn: 'Personal Data Protection under Government Decree 13/2023/ND-CP',
    summaryVi: 'Cam kết bảo mật tuyệt đối thông tin sinh viên, số CCCD, hình ảnh và tài khoản ngân hàng.',
    summaryEn: 'Commitment to absolute privacy for student data, National ID numbers, photos, and bank credentials.',
    clausesVi: [
      '14.1. Mọi dữ liệu nhạy cảm bao gồm: Ảnh thẻ sinh viên, dữ liệu quét Chíp NFC CCCD, số tài khoản ngân hàng và lịch sử số dư đều được mã hóa bằng chuẩn AES-256 bit cấp ngân hàng tại tầng lưu trữ và TLS 1.3 tại tầng truyền tải.',
      '14.2. GigMe cam kết không bán, không thương mại hóa, không chia sẻ dữ liệu sinh viên cho bất kỳ bên thứ ba nào vì mục đích quảng cáo rác.',
      '14.3. Dữ liệu chỉ được cung cấp cho cơ quan có thẩm quyền khi có văn bản yêu cầu chính thức phục vụ điều tra các hành vi vi phạm pháp luật hình sự.',
    ],
    clausesEn: [
      '14.1. Sensitive student records (student cards, NFC ID chips, bank numbers, ledger balances) are secured with AES-256 at rest and TLS 1.3 in transit.',
      '14.2. GigMe guarantees never to sell, commercialize, or transfer student credentials to any advertising vendors.',
      '14.3. Records are solely disclosed to judicial authorities under formal subpoena for criminal investigations.',
    ],
  },
  {
    id: 'art-15',
    articleNumberVi: 'Điều 15',
    articleNumberEn: 'Article 15',
    category: 'PRIVACY',
    titleVi: 'Quyền riêng tư vị trí & Chức năng gọi thoại VoIP bảo mật danh tính',
    titleEn: 'Location Privacy & Identity-Masked Campus VoIP Calling',
    summaryVi: 'Bảo đảm an toàn cho các bạn nữ và sinh viên khi di chuyển hoặc liên lạc ban đêm.',
    summaryEn: 'Ensures safety for female students and peers commuting or coordinating at night.',
    clausesVi: [
      '15.1. Tọa độ Radar chỉ hiển thị vị trí ước lượng theo bán kính mờ (Fuzzy Location) trong khoảng cách vài trăm mét, không để lộ số phòng ký túc xá hoặc địa chỉ nhà riêng chính xác cho đến khi đơn việc được cả hai bên ký kết hợp lệ.',
      '15.2. Chức năng gọi thoại Campus VoIP miễn phí tích hợp trực tiếp trong app, cho phép hai bên gọi điện trao đổi mà không để lộ số điện thoại cá nhân (Masked Phone Calling).',
      '15.3. Hệ thống tổng đài khẩn cấp kết nối trực tiếp đến số hotline Đội An Ninh Ký Túc Xá và Trung Tâm Hỗ Trợ 24/7 để tiếp ứng giải quyết sự vụ kịp thời.',
    ],
    clausesEn: [
      '15.1. Radar views only display fuzzy randomized radii of several hundred meters; precise dorm rooms or private home numbers stay concealed until contract agreement.',
      '15.2. Free Campus VoIP calling embedded within the app allows secure voice talks without exposing real cellular phone numbers.',
      '15.3. Emergency hotline connects immediately to Campus Security dispatch and 24/7 Support Center to respond to urgent issues.',
    ],
  },

  // CHƯƠNG VI: KHUNG CHẾ TÀI XỬ PHẠT & TRÁCH NHIỆM PHÁP LÝ
  {
    id: 'art-16',
    articleNumberVi: 'Điều 16',
    articleNumberEn: 'Article 16',
    category: 'PENALTY',
    titleVi: 'Khung 5 cấp độ Chế tài Xử phạt Vi phạm trên toàn hệ thống',
    titleEn: '5-Tier Systemwide Sanction and Penalties Framework',
    summaryVi: 'Quy định minh bạch các mức phạt từ nhắc nhở nhẹ đến truy cứu trách nhiệm hình sự.',
    summaryEn: 'Transparent tiers ranging from informal warning to formal criminal prosecution referral.',
    clausesVi: [
      '16.1. CẤP ĐỘ 1 (Nhắc nhở & Cảnh cáo): Áp dụng cho các vi phạm nhẹ lần đầu (spam chat, trễ hẹn < 15 phút, ngôn từ thiếu văn minh). Phạt cảnh cáo hiển thị trong hồ sơ 7 ngày.',
      '16.2. CẤP ĐỘ 2 (Trừ điểm ELO & Giảm thứ hạng): Áp dụng khi bị đánh giá 1-2 sao có lý do xác thực, hủy đơn sát giờ hoặc vi phạm quy tắc ứng xử. Bị hạ bậc ELO, tước huy hiệu Verified và giảm tần suất hiển thị trên Radar việc làm.',
      '16.3. CẤP ĐỘ 3 (Đóng băng ví & Tạm đình chỉ 14-30 ngày): Áp dụng cho hành vi bỏ kèo (No-show), cố tình lách giao dịch ngoài sàn lần đầu, sử dụng Fake GPS, hoặc bị khiếu nại không giải quyết. Đóng băng quyền rút tiền và nhận việc trong thời gian phạt.',
      '16.4. CẤP ĐỘ 4 (Khóa tài khoản vĩnh viễn & Tịch thu quyền thành viên): Áp dụng cho hành vi: Tạo mạng lưới tài khoản ảo (Sybil Ring), trộm cắp tài sản KTX, lừa đảo chiếm đoạt tiền cọc, gian lận học thuật nghiêm trọng. ID 9 số và số CCCD sẽ bị đưa vào Danh Sách Đen (Blacklist) toàn quốc.',
      '16.5. CẤP ĐỘ 5 (Truy cứu trách nhiệm hình sự): Trường hợp hành vi có dấu hiệu tội phạm (Lừa đảo chiếm đoạt tài sản theo Điều 174 BLHS, Làm giả con dấu tài liệu theo Điều 341 BLHS), GigMe sẽ tổng hợp toàn bộ file log, địa chỉ IP, ảnh Blockchain Proof và lịch sử giao dịch chuyển giao cho Cơ quan Cảnh sát Điều tra.',
    ],
    clausesEn: [
      '16.1. TIER 1 (Warning & Caution): Applies to first minor infractions (chat spam, < 15m tardiness, uncivil language). Notice displayed on profile for 7 days.',
      '16.2. TIER 2 (ELO Deduction & Demotion): Applies to verified 1-2 star ratings, late cancellations, or conduct breaches. Lowers ELO, revokes Verified badge, and decreases Radar visibility.',
      '16.3. TIER 3 (Wallet Freeze & 14-30 Day Suspension): Applies to worker no-shows, initial off-platform deal attempts, mock GPS spoofing, or unresolved disputes. Halts withdrawals and job bidding.',
      '16.4. TIER 4 (Permanent Ban & Forfeiture): Applies to sybil rings, dorm thefts, deposit scams, or severe academic exam fraud. 9-digit ID and National ID entered into systemwide Blacklist.',
      '16.5. TIER 5 (Criminal Referral): In cases of felony conduct (fraudulent appropriation under Article 174, document forgery under Article 341), audit logs, IPs, and blockchain proof are handed to Police Investigators.',
    ],
    penaltySnippetVi: 'Áp dụng khung xử phạt nghiêm minh theo đúng mức độ thiệt hại và tính chất hành vi.',
    penaltySnippetEn: 'Strict enforcement tailored directly to the severity of damage and character of the breach.',
    isCritical: true,
  },
  {
    id: 'art-17',
    articleNumberVi: 'Điều 17',
    articleNumberEn: 'Article 17',
    category: 'PENALTY',
    titleVi: 'Hiệu lực thi hành, Cam kết số & Quy chế sửa đổi bổ sung',
    titleEn: 'Enactment, Digital Commitment & Revision Policies',
    summaryVi: 'Văn bản có giá trị pháp lý ràng buộc kể từ thời điểm thành viên đăng ký tham gia.',
    summaryEn: 'Legally binding from the moment a member registers on the platform.',
    clausesVi: [
      '17.1. Bằng việc bấm nút "Đăng Ký", "Đăng Kèo" hoặc "Nhận Việc", thành viên xác nhận đã đọc, hiểu rõ và tự nguyện cam kết tuân thủ 100% các điều khoản của Bộ Luật này.',
      '17.2. GigMe bảo lưu quyền sửa đổi, bổ sung các điều khoản nhằm đáp ứng các quy định pháp luật mới của Nhà nước. Mọi thay đổi quan trọng sẽ được thông báo công khai trước ít nhất 07 ngày qua Trung Tâm Thông Báo và Màn hình khóa PWA Push.',
      '17.3. Văn bản có hiệu lực thi hành kể từ ngày 01 tháng 01 năm 2026 trên toàn bộ hệ sinh thái ứng dụng GigMe Campus Web & Mobile PWA.',
    ],
    clausesEn: [
      '17.1. By tapping "Register", "Post Gig", or "Claim Gig", members attest they have thoroughly read, comprehended, and voluntarily bound themselves to 100% of these terms.',
      '17.2. GigMe reserves the right to amend provisions in accordance with statutory requirements. Significant updates will be announced at least 7 days in advance via Push and Notification Center.',
      '17.3. Effective starting January 1st, 2026 across the entire GigMe Campus Web & Mobile PWA ecosystem.',
    ],
  },

  // CHƯƠNG VII: CHỢ KTX & GIAO DỊCH ĐỒ CŨ SINH VIÊN
  {
    id: 'art-18',
    articleNumberVi: 'Điều 18',
    articleNumberEn: 'Article 18',
    category: 'MARKETPLACE',
    titleVi: 'Quy chế Giao dịch Chợ Đồ Cũ Sinh Viên KTX (Campus Flea Market & Escrow Cọc Đồ)',
    titleEn: 'Campus Dorm Flea Market Code & Escrow Reservation (Used Goods & Textbooks)',
    summaryVi: 'Quy chuẩn mua bán giáo trình, đồ dùng KTX, tặng quà 0đ và cơ chế cọc giữ đồ Smart Escrow.',
    summaryEn: 'Standard for textbooks, dorm items, 0đ free donations, and Smart Escrow item holding deposits.',
    clausesVi: [
      '18.1. Tính trung thực bài đăng: Đồ dùng thanh lý (Giáo trình, tài liệu ôn thi, máy tính bỏ túi Casio, bàn học KTX, đồ gia dụng) phải được mô tả đúng hiện trạng thực tế (Mới 99%, Tốt 90%, Dùng được 80%) và đính kèm ảnh/video quay chụp thực tế, tuyệt đối không dùng ảnh mạng giả mạo hoặc lừa dối người mua.',
      '18.2. Bảo chứng cọc đồ qua Smart Escrow: Đối với các món đồ có giá trị thanh toán, khoản tiền cọc giữ món sẽ được hệ thống phong tỏa an toàn trong Quỹ Smart Escrow. Tiền chỉ được giải ngân cho Người bán khi Người mua đã gặp mặt trực tiếp kiểm tra hàng đúng mô tả tại khuôn viên trường/KTX và xác nhận nghiệm thu.',
      '18.3. Văn hóa tặng đồ 0đ (Free Donation): Mọi món đồ đăng tặng miễn phí (0đ) nhằm mục đích san sẻ khó khăn cho tân sinh viên và bạn học. Người nhận cam kết sử dụng đúng mục đích; nghiêm cấm tuyệt đối hành vi nhận đồ tặng 0đ mang đi bán lại kiếm lời.',
      '18.4. Danh mục nghiêm cấm trên Chợ KTX: Nghiêm cấm tuyệt đối đăng tải hoặc trao đổi thuốc lá điện tử (Vape), rượu bia, chất kích thích, tài liệu đề thi bí mật, văn hóa phẩm đồi trụy hoặc hàng giả nhái vi phạm quyền sở hữu trí tuệ. Vi phạm sẽ bị gỡ bài tức thì và áp dụng chế tài Cấp độ 3 hoặc Cấp độ 4.',
      '18.5. Quyền kiểm tra và hủy cọc: Người mua có quyền từ chối nhận đồ và bấm "Hủy Cọc Giữ Món" để nhận lại 100% tiền cọc về ví ngay lập tức nếu khi gặp mặt thực tế phát hiện món đồ bị hỏng hóc nặng hoặc khác biệt hoàn toàn so với mô tả.',
    ],
    clausesEn: [
      '18.1. Honesty in Listings: Secondhand goods (textbooks, Casio calculators, dorm desks, appliances) must faithfully reflect physical condition (99% New, 90% Good, 80% Fair) with real photos/videos, strictly banning fake web photos.',
      '18.2. Escrow Hold Guarantee: For payable items, holding deposits are locked securely in the Smart Escrow Vault. Funds are disbursed to the seller only after both parties inspect the item on campus and the buyer clicks confirm.',
      '18.3. 0đ Free Donation Culture: Items posted as free (0 VND) exist to support freshmen and struggling peers. Recipients pledge authentic personal usage; taking free items to resell for profit is strictly prohibited.',
      '18.4. Dorm Market Prohibitions: Strictly prohibits vapes/e-cigarettes, alcohol, drugs, leaked exam materials, contraband, or counterfeit trademark-infringing goods. Violations lead to immediate takedown and Tier 3/4 bans.',
      '18.5. Inspection & Deposit Cancellation: Buyers retain the absolute right to cancel reservation and receive an instant 100% wallet refund if the in-person item is damaged or departs materially from the listing.',
    ],
    penaltySnippetVi: 'Xóa bài đăng ngay lập tức, phạt trừ 30 điểm tín nhiệm ELO và đóng băng quyền đăng bài Chợ KTX 30 ngày.',
    penaltySnippetEn: 'Immediate listing removal, 30-point ELO deduction, and 30-day suspension of marketplace privileges.',
    isCritical: true,
  },
];
