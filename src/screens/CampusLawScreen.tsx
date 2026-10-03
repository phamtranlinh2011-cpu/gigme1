import React, { useState, useMemo, useEffect } from 'react';
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  Lock,
  RotateCcw,
  Gavel,
  FileText,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  Award,
  DollarSign,
  UserX,
  FileCheck,
  Bookmark,
  Share2,
  ArrowLeft,
  ShoppingBag,
  Download,
  Printer,
  Sparkles,
  MessageSquare,
  X,
  Send,
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { useGigMe } from '../context/GigMeContext';

interface CampusLawScreenProps {
  onBack?: () => void;
  onOpenContactAdmin?: () => void;
}

interface LawArticle {
  id: string;
  articleNumber: string;
  title: string;
  category: 'KYC' | 'ESCROW' | 'EXECUTION' | 'DISPUTE' | 'PRIVACY' | 'PENALTY' | 'MARKETPLACE';
  summary: string;
  clauses: string[];
  penaltySnippet?: string;
  isCritical?: boolean;
}

const LAW_CHAPTERS = [
  { id: 'ALL', label: 'Toàn Bộ Bộ Luật', icon: Scale },
  { id: 'ESCROW', label: 'Smart Escrow & Tiền', icon: DollarSign },
  { id: 'MARKETPLACE', label: 'Chợ KTX & Đồ Cũ', icon: ShoppingBag },
  { id: 'KYC', label: 'Định Danh & Chống Gian Lận', icon: ShieldCheck },
  { id: 'EXECUTION', label: 'Thực Hiện & Bàn Giao', icon: FileCheck },
  { id: 'DISPUTE', label: 'Trọng Tài & Hoàn Tiền', icon: RotateCcw },
  { id: 'PENALTY', label: 'Khung Chế Tài Xử Phạt', icon: Gavel },
  { id: 'PRIVACY', label: 'Bảo Mật Nghị Định 13', icon: Lock },
  { id: 'BOOKMARKS', label: 'Điều Khoản Đã Lưu', icon: Bookmark },
];

const LAW_ARTICLES: LawArticle[] = [
  // CHƯƠNG I: ĐỊNH DANH & CHỐNG GIAN LẬN
  {
    id: 'art-1',
    articleNumber: 'Điều 1',
    category: 'KYC',
    title: 'Tư cách thành viên & Định danh sinh viên chính chủ (KYC Cấp 1, 2, 3)',
    summary: 'Mọi cá nhân tham gia GigMe phải chịu trách nhiệm pháp lý với danh tính đã đăng ký.',
    clauses: [
      '1.1. Nền tảng GigMe chỉ cấp quyền nhận việc và cung ứng dịch vụ cho các cá nhân đã hoàn thành tối thiểu KYC Cấp 1 (Số điện thoại chính chủ + Email trường .edu.vn hoặc xác thực giấy tờ sinh viên).',
      '1.2. Thành viên mở gói thầu trị giá từ 500.000 VNĐ trở lên hoặc kích hoạt tính năng thanh toán ký quỹ tự động bắt buộc phải thực hiện quét Chíp CCCD qua công nghệ NFC hoặc xác thực khuôn mặt Face Liveness 3D (KYC Cấp 2/3).',
      '1.3. Nghiêm cấm mượn, cho thuê, mua bán, làm giả hoặc sử dụng thông tin danh tính của người khác dưới bất kỳ hình thức nào. Hành vi sử dụng giấy tờ giả mạo sẽ bị chuyển hồ sơ sang cơ quan Công an xử lý theo Điều 341 Bộ luật Hình sự Việt Nam.',
    ],
    penaltySnippet: 'Tước quyền thành viên vĩnh viễn, phong tỏa tài khoản và gửi thông báo kỷ luật về Ban Giám hiệu Nhà trường.',
    isCritical: true,
  },
  {
    id: 'art-2',
    articleNumber: 'Điều 2',
    category: 'KYC',
    title: 'Chống tài khoản ảo, Sybil Ring và thao túng đánh giá tín nhiệm ELO',
    summary: 'Nghiêm cấm hành vi tự tạo tài khoản phụ để buff đánh giá hoặc gian lận thuật toán xếp hạng.',
    clauses: [
      '2.1. Mỗi sinh viên chỉ được sở hữu duy nhất 01 (một) tài khoản gắn liền với 01 ID 9 số bất biến trên nền tảng.',
      '2.2. Hệ thống kiểm định AI Sybil Audit tự động quét dấu vân tay thiết bị (Fingerprint), địa chỉ IP, mạng WiFi ký túc xá và tọa độ GPS. Mọi vòng tròn liên kết chéo (Sybil Ring) giữa các tài khoản cố tình đánh giá 5 sao ảo hoặc tạo giao dịch khống sẽ bị phát hiện ngay lập tức.',
      '2.3. Các tài khoản vi phạm sẽ bị reset toàn bộ điểm tín nhiệm ELO về 0.0 ★, thu hồi toàn bộ huy hiệu danh dự và ghi nhận cảnh báo xấu trong lịch sử Campus.',
    ],
    penaltySnippet: 'Xóa sổ vĩnh viễn mạng lưới tài khoản ảo, đóng băng ví nạp/rút 60 ngày.',
  },
  {
    id: 'art-3',
    articleNumber: 'Điều 3',
    category: 'KYC',
    title: 'Kiểm soát vị trí GPS thực tế & Nghiêm cấm công cụ Fake GPS / Giả lập',
    summary: 'Chỉ chấp nhận tín hiệu định vị vệ tinh thực tế khi quét nhận việc lân cận và check-in hiện trường.',
    clauses: [
      '3.1. Các đơn công việc yêu cầu có mặt thực địa (Giao nhận, phụ việc KTX, mua hộ, cứu hộ SafeWalk) bắt buộc phải bật GPS chuẩn xác trong phạm vi bán kính cho phép.',
      '3.2. Nghiêm cấm sử dụng phần mềm giả lập Mock Location (Fake GPS), VPN che giấu IP hoặc Proxy nhằm lừa đảo hệ thống nhận đơn từ xa.',
      '3.3. Khi hệ thống Anti-Mock phát hiện cờ vị trí giả mạo, đơn việc sẽ bị hủy tức thì và quyền bắt kèo theo Radar sẽ bị vô hiệu hóa trong 72 giờ.',
    ],
  },

  // CHƯƠNG II: SMART ESCROW & AN TOÀN TÀI CHÍNH
  {
    id: 'art-4',
    articleNumber: 'Điều 4',
    category: 'ESCROW',
    title: 'Cơ chế Ký Quỹ Smart Escrow 100% trước khi triển khai công việc',
    summary: 'Bảo vệ tuyệt đối dòng tiền của cả Người Thuê (Client) và Người Làm (Worker).',
    clauses: [
      '4.1. Khi Người thuê chấp nhận giao kèo hoặc chọn người trúng đấu giá ngược, 100% thù lao cam kết sẽ được trừ từ ví Người thuê và phong tỏa an toàn trong Quỹ Ký Quỹ Smart Escrow.',
      '4.2. Người thuê không thể tự ý rút lại tiền trong thời gian Người làm đang thực hiện đúng hẹn và đúng yêu cầu.',
      '4.3. Người làm được bảo đảm 100% nhận đủ tiền thù lao ngay khi hoàn tất nhiệm vụ và có minh chứng nghiệm thu hợp lệ.',
      '4.4. Tiền chỉ được giải ngân tự động khi: (a) Người thuê bấm "Xác Nhận Hoàn Thành", hoặc (b) Quá thời hạn nghiệm thu 24 giờ mà Người thuê không đưa ra bất kỳ phản hồi hay khiếu nại chính đáng nào.',
    ],
    isCritical: true,
  },
  {
    id: 'art-5',
    articleNumber: 'Điều 5',
    category: 'ESCROW',
    title: 'Nghiêm cấm tuyệt đối hành vi lách giao dịch ngoài sàn (Anti-Leakage Policy)',
    summary: 'Cấm trao đổi thông tin chuyển khoản ngoài, số điện thoại hoặc Zalo nhằm quỵt tiền ký quỹ.',
    clauses: [
      '5.1. Mọi thỏa thuận thù lao, thanh toán phải được thực hiện thông qua hệ thống Ví Smart Escrow của GigMe.',
      '5.2. Nghiêm cấm hành vi gửi số tài khoản cá nhân, mã QR ngoài, số điện thoại ngầm hoặc hẹn gặp giao dịch tiền mặt nhằm trốn tránh cơ chế bảo đảm ký quỹ của sàn.',
      '5.3. Hệ thống quét tự động (Anti-Leakage Engine) sẽ che giấu các nội dung vi phạm trong khung chat và gửi cảnh báo đỏ tới quản trị viên.',
      '5.4. Trường hợp hai bên cố tình lách giao dịch ngoài sàn: Nếu xảy ra tình trạng quỵt tiền, bỏ kèo, mất đồ hoặc lừa đảo, GigMe từ chối hoàn toàn trách nhiệm hỗ trợ bồi thường và sẽ áp dụng chế tài kỷ luật đối với cả hai bên.',
    ],
    penaltySnippet: 'Khóa tính năng chat 30 ngày, hạ bậc thứ hạng Campus và phạt trừ 50% điểm uy tín ELO.',
    isCritical: true,
  },
  {
    id: 'art-6',
    articleNumber: 'Điều 6',
    category: 'ESCROW',
    title: 'Hạn mức nạp/rút tiền, thời gian giãn cách Cooldown và chống rửa tiền (AML)',
    summary: 'Tuân thủ nghiêm ngặt quy chế quản lý tài chính sinh viên và phòng chống gian lận dòng tiền.',
    clauses: [
      '6.1. Hạn mức Nạp tiền: Tối đa 10.000.000 VNĐ cho mỗi lần nạp; tối đa 30.000.000 VNĐ trong vòng 24 giờ; số dư tích lũy ví không được vượt quá mức trần 200.000.000 VNĐ.',
      '6.2. Quy tắc Giãn cách (Cooldown): Sau mỗi giao dịch nạp tiền thành công, hệ thống yêu cầu giãn cách an toàn tối thiểu 60 phút trước khi mở lệnh tiếp theo.',
      '6.3. Điều kiện Rút tiền về Ngân hàng: Tài khoản phải thỏa mãn các tiêu chuẩn: (a) Số dư tối thiểu sau rút > 50.000 VNĐ; (b) Đã hoàn thành tối thiểu 01 công việc có đánh giá thực tế; (c) Tuổi tài khoản >= 5 ngày và thời lượng hoạt động >= 3 giờ; (d) Tên chủ tài khoản ngân hàng thụ hưởng phải trùng khớp 100% với họ tên KYC.',
      '6.4. Nghiêm cấm sử dụng ví GigMe làm kênh trung chuyển tiền bẩn, tiền lừa đảo mạng hoặc rửa tiền dưới mọi hình thức.',
    ],
  },
  {
    id: 'art-7',
    articleNumber: 'Điều 7',
    category: 'ESCROW',
    title: 'Phân bổ thù lao tự động cho đơn làm việc nhóm (Split Payout)',
    summary: 'Đảm bảo tiền công được chia đều, minh bạch tới từng thành viên tham gia.',
    clauses: [
      '7.1. Đối với các đơn tuyển nhiều người (Multi-Worker Gig), khi hoàn thành, Smart Escrow sẽ tự động chia đều số tiền thù lao về thẳng ví từng thành viên đã check-in mã QR hiện trường.',
      '7.2. Nhóm trưởng hoặc người đăng tuyển không được quyền giữ tiền công hoặc cắt xén thù lao của các thành viên khác.',
      '7.3. Nếu có vị trí bỏ trống hoặc thành viên vắng mặt (No-show), số tiền thù lao của vị trí đó sẽ được tự động hoàn trả 100% về ví của Người thuê.',
    ],
  },

  // CHƯƠNG III: THỰC HIỆN CÔNG VIỆC & BẰNG CHỨNG BÀN GIAO
  {
    id: 'art-8',
    articleNumber: 'Điều 8',
    category: 'EXECUTION',
    title: 'Minh chứng bàn giao bằng ảnh có đóng dấu Watermark Blockchain Hash',
    summary: 'Mọi công việc hoàn tất phải có bằng chứng hình ảnh rõ ràng để giải ngân Escrow.',
    clauses: [
      '8.1. Khi bàn giao kết quả (Giao nhận hàng hóa, dọn phòng, sửa chữa, cài đặt máy tính), Người làm phải chụp ảnh hiện trường qua tính năng Blockchain Proof tích hợp trong app.',
      '8.2. Ảnh minh chứng sẽ tự động được đóng dấu Watermark gồm: Mã băm SHA-256 chống cắt ghép, thời gian chụp UTC+7 chuẩn xác đến từng giây, và tọa độ GPS địa điểm thực tế.',
      '8.3. Ảnh minh chứng là tài liệu pháp lý tối cao được Hội đồng Trọng tài GigMe căn cứ để giải quyết khi xảy ra tranh chấp.',
    ],
  },
  {
    id: 'art-9',
    articleNumber: 'Điều 9',
    category: 'EXECUTION',
    title: 'Quy chuẩn công việc, danh mục cấm và phòng chống vi phạm quy chế đào tạo',
    summary: 'Nghiêm cấm các công việc trái pháp luật, vi phạm thuần phong mỹ tục hoặc quy chế thi cử.',
    clauses: [
      '9.1. Danh mục cấm đăng tải tuyệt đối: Mua bán chất cấm, rượu bia thuốc lá trong khuôn viên KTX, văn hóa phẩm đồi trụy, vũ khí, cờ bạc, tiền ảo, hàng cấm theo quy định pháp luật Việt Nam.',
      '9.2. Quy chế liêm chính học thuật: Cấm tuyệt đối hành vi thi hộ, kiểm tra hộ, làm bài thi kết thúc học phần hộ hoặc gian lận học thuật. Nền tảng chỉ cho phép các dịch vụ hỗ trợ học tập lành mạnh: Gia sư, hướng dẫn phương pháp giải bài, dịch thuật tài liệu, hỗ trợ in ấn giáo trình.',
      '9.3. Người đăng bài vi phạm Điều 9 sẽ bị gỡ bài ngay lập tức, trừ toàn bộ tiền cọc đăng tin và khóa tài khoản không hoàn lại.',
    ],
    isCritical: true,
  },
  {
    id: 'art-10',
    articleNumber: 'Điều 10',
    category: 'EXECUTION',
    title: 'Xử lý vi phạm Bỏ kèo (No-Show) và Hủy đơn sát giờ (Late Cancellation)',
    summary: 'Bảo vệ thời gian và công sức của các bên tham gia giao dịch.',
    clauses: [
      '10.1. Người làm việc tự ý bỏ kèo không đến (Worker No-Show): Bị trừ ngay 15 điểm tín nhiệm ELO, trừ phí phạt 30% giá trị đơn việc từ số dư ví để bồi thường cho Người thuê, và bị hạn chế nhận việc trong 48 giờ.',
      '10.2. Người thuê tự ý hủy đơn sát giờ (< 30 phút trước giờ hẹn) khi Người làm đã di chuyển đến nơi: Phải chịu phí bồi thường di chuyển tối thiểu 30.000 VNĐ đến 50% giá trị đơn việc được chuyển thẳng vào ví Người làm.',
      '10.3. Trường hợp bất khả kháng (Tai nạn, sự cố y tế khẩn cấp, thiên tai, cúp điện diện rộng): Phải cung cấp minh chứng xác thực cho Ban Quản Trị trong vòng 12 giờ để được xem xét miễn trừ phí phạt.',
    ],
  },

  // CHƯƠNG IV: TRỌNG TÀI & GIẢI QUYẾT TRANH CHẤP
  {
    id: 'art-11',
    articleNumber: 'Điều 11',
    category: 'DISPUTE',
    title: 'Quy trình Khiếu nại & Cơ chế đóng băng quỹ tranh chấp 24/7',
    summary: 'Đảm bảo tiền không bị tẩu tán trong lúc hai bên đang bất đồng quan điểm.',
    clauses: [
      '11.1. Khi kết quả công việc không đạt yêu cầu hoặc có dấu hiệu gian lận, Người thuê có quyền bấm nút "Khiếu Nại & Mở Tranh Chấp" trước khi xác nhận nghiệm thu.',
      '11.2. Ngay khi bấm khiếu nại, toàn bộ số tiền thù lao trong Quỹ Escrow sẽ lập tức rơi vào trạng thái "ĐÓNG BĂNG TRANH CHẤP", không ai có thể rút tiền cho đến khi có phán quyết cuối cùng.',
      '11.3. Hai bên có thời hạn 04 giờ để tự hòa giải trong khung chat có gắn giám sát của Trọng tài. Nếu không đạt thỏa thuận, vụ việc tự động chuyển lên Hội đồng Trọng tài Admin Master.',
    ],
  },
  {
    id: 'art-12',
    articleNumber: 'Điều 12',
    category: 'DISPUTE',
    title: 'Thẩm quyền phán quyết của Ban Quản Trị Tối Cao (Admin Master 000000000)',
    summary: 'Phán quyết công tâm, dựa trên log hệ thống, lịch sử chat và ảnh Blockchain Proof.',
    clauses: [
      '12.1. Ban Quản Trị Tối Cao (ID 000000000) giữ quyền tài phán độc lập và tối cao trên nền tảng GigMe.',
      '12.2. Trọng tài viên sẽ đánh giá toàn bộ dữ liệu: (a) Tin nhắn trao đổi; (b) Ảnh đóng dấu Blockchain SHA-256; (c) Tọa độ GPS check-in/check-out; (d) Lịch sử cuộc gọi VoIP.',
      '12.3. Các hình thức phán quyết: (1) Hoàn tiền 100% cho Người thuê; (2) Giải ngân 100% cho Người làm; (3) Chia tỷ lệ phần trăm theo khối lượng công việc thực tế đã hoàn thành.',
      '12.4. Phán quyết của Hội đồng Trọng tài là quyết định cuối cùng có hiệu lực thi hành ngay lập tức.',
    ],
    isCritical: true,
  },
  {
    id: 'art-13',
    articleNumber: 'Điều 13',
    category: 'DISPUTE',
    title: 'Chính sách bảo đảm Hoàn tiền 100% (Zero-Risk Money Back Guarantee)',
    summary: 'Bảo vệ quyền lợi khách hàng chuẩn tiêu chuẩn Apple App Store & Google Play Store.',
    clauses: [
      '13.1. Người thuê được bảo đảm hoàn tiền 100% trong các trường hợp: (a) Đăng bài nhưng không có ai nhận việc và bấm hủy bài; (b) Người làm nhận việc nhưng không đến hiện trường (No-show); (c) Công việc bị chứng minh là không thực hiện hoặc làm hỏng hoàn toàn tài sản.',
      '13.2. Tiền hoàn trả sẽ được cộng trả ngay lập tức (0 giây delay) vào số dư Ví GigMe của người dùng và có thể rút về tài khoản ngân hàng bất cứ lúc nào.',
      '13.3. GigMe không thu bất kỳ khoản phí phạt nào đối với các yêu cầu hoàn tiền chính đáng và đúng quy định.',
    ],
  },

  // CHƯƠNG V: BẢO VỆ BÍ MẬT ĐỜI TƯ & DỮ LIỆU CÁ NHÂN
  {
    id: 'art-14',
    articleNumber: 'Điều 14',
    category: 'PRIVACY',
    title: 'Bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP của Chính Phủ',
    summary: 'Cam kết bảo mật tuyệt đối thông tin sinh viên, số CCCD, hình ảnh và tài khoản ngân hàng.',
    clauses: [
      '14.1. Mọi dữ liệu nhạy cảm bao gồm: Ảnh thẻ sinh viên, dữ liệu quét Chíp NFC CCCD, số tài khoản ngân hàng và lịch sử số dư đều được mã hóa bằng chuẩn AES-256 bit cấp ngân hàng tại tầng lưu trữ và TLS 1.3 tại tầng truyền tải.',
      '14.2. GigMe cam kết không bán, không thương mại hóa, không chia sẻ dữ liệu sinh viên cho bất kỳ bên thứ ba nào vì mục đích quảng cáo rác.',
      '14.3. Dữ liệu chỉ được cung cấp cho cơ quan có thẩm quyền khi có văn bản yêu cầu chính thức phục vụ điều tra các hành vi vi phạm pháp luật hình sự.',
    ],
  },
  {
    id: 'art-15',
    articleNumber: 'Điều 15',
    category: 'PRIVACY',
    title: 'Quyền riêng tư vị trí & Chức năng gọi thoại VoIP bảo mật danh tính',
    summary: 'Bảo đảm an toàn cho các bạn nữ và sinh viên khi di chuyển hoặc liên lạc ban đêm.',
    clauses: [
      '15.1. Tọa độ Radar chỉ hiển thị vị trí ước lượng theo bán kính mờ (Fuzzy Location) trong khoảng cách vài trăm mét, không để lộ số phòng ký túc xá hoặc địa chỉ nhà riêng chính xác cho đến khi đơn việc được cả hai bên ký kết hợp lệ.',
      '15.2. Chức năng gọi thoại Campus VoIP miễn phí tích hợp trực tiếp trong app, cho phép hai bên gọi điện trao đổi mà không để lộ số điện thoại cá nhân (Masked Phone Calling).',
      '15.3. Tính năng SOS SafeWalk ban đêm tự động kích hoạt còi báo động khẩn cấp và gửi tín hiệu định vị trực tiếp tới người thân và Ban Quản Trị khi gặp tình huống nguy hiểm.',
    ],
  },

  // CHƯƠNG VI: KHUNG CHẾ TÀI XỬ PHẠT & TRÁCH NHIỆM PHÁP LÝ
  {
    id: 'art-16',
    articleNumber: 'Điều 16',
    category: 'PENALTY',
    title: 'Khung 5 cấp độ Chế tài Xử phạt Vi phạm trên toàn hệ thống',
    summary: 'Quy định minh bạch các mức phạt từ nhắc nhở nhẹ đến truy cứu trách nhiệm hình sự.',
    clauses: [
      '16.1. CẤP ĐỘ 1 (Nhắc nhở & Cảnh cáo): Áp dụng cho các vi phạm nhẹ lần đầu (spam chat, trễ hẹn < 15 phút, ngôn từ thiếu văn minh). Phạt cảnh cáo hiển thị trong hồ sơ 7 ngày.',
      '16.2. CẤP ĐỘ 2 (Trừ điểm ELO & Giảm thứ hạng): Áp dụng khi bị đánh giá 1-2 sao có lý do xác thực, hủy đơn sát giờ hoặc vi phạm quy tắc ứng xử. Bị hạ bậc ELO, tước huy hiệu Verified và giảm tần suất hiển thị trên Radar việc làm.',
      '16.3. CẤP ĐỘ 3 (Đóng băng ví & Tạm đình chỉ 14-30 ngày): Áp dụng cho hành vi bỏ kèo (No-show), cố tình lách giao dịch ngoài sàn lần đầu, sử dụng Fake GPS, hoặc bị khiếu nại không giải quyết. Đóng băng quyền rút tiền và nhận việc trong thời gian phạt.',
      '16.4. CẤP ĐỘ 4 (Khóa tài khoản vĩnh viễn & Tịch thu quyền thành viên): Áp dụng cho hành vi: Tạo mạng lưới tài khoản ảo (Sybil Ring), trộm cắp tài sản KTX, lừa đảo chiếm đoạt tiền cọc, gian lận học thuật nghiêm trọng. ID 9 số và số CCCD sẽ bị đưa vào Danh Sách Đen (Blacklist) toàn quốc.',
      '16.5. CẤP ĐỘ 5 (Truy cứu trách nhiệm hình sự): Trường hợp hành vi có dấu hiệu tội phạm (Lừa đảo chiếm đoạt tài sản theo Điều 174 BLHS, Làm giả con dấu tài liệu theo Điều 341 BLHS), GigMe sẽ tổng hợp toàn bộ file log, địa chỉ IP, ảnh Blockchain Proof và lịch sử giao dịch chuyển giao cho Cơ quan Cảnh sát Điều tra.',
    ],
    isCritical: true,
  },
  {
    id: 'art-17',
    articleNumber: 'Điều 17',
    category: 'PENALTY',
    title: 'Hiệu lực thi hành, Cam kết số & Quy chế sửa đổi bổ sung',
    summary: 'Văn bản có giá trị pháp lý ràng buộc kể từ thời điểm thành viên đăng ký tham gia.',
    clauses: [
      '17.1. Bằng việc bấm nút "Đăng Ký", "Đăng Kèo" hoặc "Nhận Việc", thành viên xác nhận đã đọc, hiểu rõ và tự nguyện cam kết tuân thủ 100% các điều khoản của Bộ Luật này.',
      '17.2. GigMe bảo lưu quyền sửa đổi, bổ sung các điều khoản nhằm đáp ứng các quy định pháp luật mới của Nhà nước. Mọi thay đổi quan trọng sẽ được thông báo công khai trước ít nhất 07 ngày qua Trung Tâm Thông Báo và Màn hình khóa PWA Push.',
      '17.3. Văn bản có hiệu lực thi hành kể từ ngày 01 tháng 01 năm 2026 trên toàn bộ hệ sinh thái ứng dụng GigMe Campus Web & Mobile PWA.',
    ],
  },

  // CHƯƠNG VII: CHỢ KTX & GIAO DỊCH ĐỒ CŨ SINH VIÊN
  {
    id: 'art-18',
    articleNumber: 'Điều 18',
    category: 'MARKETPLACE',
    title: 'Quy chế Giao dịch Chợ Đồ Cũ Sinh Viên KTX (Campus Flea Market & Escrow Cọc Đồ)',
    summary: 'Quy chuẩn mua bán giáo trình, đồ dùng KTX, tặng quà 0đ và cơ chế cọc giữ đồ Smart Escrow.',
    clauses: [
      '18.1. Tính trung thực bài đăng: Đồ dùng thanh lý (Giáo trình, tài liệu ôn thi, máy tính bỏ túi Casio, bàn học KTX, đồ gia dụng) phải được mô tả đúng hiện trạng thực tế (Mới 99%, Tốt 90%, Dùng được 80%) và đính kèm ảnh/video quay chụp thực tế, tuyệt đối không dùng ảnh mạng giả mạo hoặc lừa dối người mua.',
      '18.2. Bảo chứng cọc đồ qua Smart Escrow: Đối với các món đồ có giá trị thanh toán, khoản tiền cọc giữ món sẽ được hệ thống phong tỏa an toàn trong Quỹ Smart Escrow. Tiền chỉ được giải ngân cho Người bán khi Người mua đã gặp mặt trực tiếp kiểm tra hàng đúng mô tả tại khuôn viên trường/KTX và xác nhận nghiệm thu.',
      '18.3. Văn hóa tặng đồ 0đ (Free Donation): Mọi món đồ đăng tặng miễn phí (0đ) nhằm mục đích san sẻ khó khăn cho tân sinh viên và bạn học. Người nhận cam kết sử dụng đúng mục đích; nghiêm cấm tuyệt đối hành vi nhận đồ tặng 0đ mang đi bán lại kiếm lời.',
      '18.4. Danh mục nghiêm cấm trên Chợ KTX: Nghiêm cấm tuyệt đối đăng tải hoặc trao đổi thuốc lá điện tử (Vape), rượu bia, chất kích thích, tài liệu đề thi bí mật, văn hóa phẩm đồi trụy hoặc hàng giả nhái vi phạm quyền sở hữu trí tuệ. Vi phạm sẽ bị gỡ bài tức thì và áp dụng chế tài Cấp độ 3 hoặc Cấp độ 4.',
      '18.5. Quyền kiểm tra và hủy cọc: Người mua có quyền từ chối nhận đồ và bấm "Hủy Cọc Giữ Món" để nhận lại 100% tiền cọc về ví ngay lập tức nếu khi gặp mặt thực tế phát hiện món đồ bị hỏng hóc nặng hoặc khác biệt hoàn toàn so với mô tả.',
    ],
    penaltySnippet: 'Xóa bài đăng ngay lập tức, phạt trừ 30 điểm tín nhiệm ELO và đóng băng quyền đăng bài Chợ KTX 30 ngày.',
    isCritical: true,
  },
];

export const CampusLawScreen: React.FC<CampusLawScreenProps> = ({
  onBack,
  onOpenContactAdmin,
}) => {
  const { currentUser, showNotification, sendChat } = useGigMe();
  const [selectedChapter, setSelectedChapter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedArticles, setExpandedArticles] = useState<Record<string, boolean>>({
    'art-1': true,
    'art-4': true,
    'art-5': true,
    'art-16': true,
    'art-18': true,
  });

  // Persistent digital signature state
  const [signatureInfo, setSignatureInfo] = useState<{
    isSigned: boolean;
    signedAt?: number;
    signatureHash?: string;
  }>(() => {
    try {
      const key = `gigme_law_signed_${currentUser?.id || '000000000'}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
      return { isSigned: false };
    } catch {
      return { isSigned: false };
    }
  });

  // Bookmarked articles state
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const key = `gigme_law_bookmarks_${currentUser?.id || '000000000'}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : ['art-4', 'art-18'];
    } catch {
      return ['art-4', 'art-18'];
    }
  });

  const [copiedArticleId, setCopiedArticleId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportTargetArticle, setReportTargetArticle] = useState<string>('Điều 5: Lách sàn');
  const [reportViolationContent, setReportViolationContent] = useState<string>('');
  const [reportSuspectId, setReportSuspectId] = useState<string>('');

  // Save bookmarks
  const toggleBookmark = (articleId: string) => {
    triggerHaptic('light');
    setBookmarkedIds((prev) => {
      const updated = prev.includes(articleId)
        ? prev.filter((id) => id !== articleId)
        : [...prev, articleId];
      try {
        localStorage.setItem(`gigme_law_bookmarks_${currentUser?.id || '000000000'}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Toggle expand
  const toggleArticle = (id: string) => {
    triggerHaptic('light');
    setExpandedArticles((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Expand / Collapse all
  const toggleAll = (expand: boolean) => {
    triggerHaptic('medium');
    const newState: Record<string, boolean> = {};
    LAW_ARTICLES.forEach((a) => {
      newState[a.id] = expand;
    });
    setExpandedArticles(newState);
  };

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return LAW_ARTICLES.filter((article) => {
      // Bookmarks filter
      if (selectedChapter === 'BOOKMARKS') {
        if (!bookmarkedIds.includes(article.id)) return false;
      } else if (selectedChapter !== 'ALL' && article.category !== selectedChapter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = article.title.toLowerCase().includes(query);
        const matchSummary = article.summary.toLowerCase().includes(query);
        const matchNumber = article.articleNumber.toLowerCase().includes(query);
        const matchClauses = article.clauses.some((c) => c.toLowerCase().includes(query));
        return matchTitle || matchSummary || matchNumber || matchClauses;
      }
      return true;
    });
  }, [selectedChapter, searchQuery, bookmarkedIds]);

  // Copy article text
  const handleCopyArticle = (article: LawArticle) => {
    triggerHaptic('success');
    const text = `${article.articleNumber}: ${article.title}\n\n${article.clauses.join('\n')}\n\n(Nguồn: Bộ Luật Nền Tảng GigMe Campus 2026 - Bản quyền thi hành toàn quốc)`;
    navigator.clipboard.writeText(text);
    setCopiedArticleId(article.id);
    showNotification('Đã sao chép điều khoản!', `Đã chép nội dung ${article.articleNumber} vào bộ nhớ tạm.`);
    setTimeout(() => setCopiedArticleId(null), 2500);
  };

  // Confirm digital commitment
  const handleConfirmCommitment = () => {
    triggerHaptic('success');
    const now = Date.now();
    const hash = `GIGME-SHA256-${(currentUser?.id || '000000000')}-${now.toString(16).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const info = {
      isSigned: true,
      signedAt: now,
      signatureHash: hash,
    };

    setSignatureInfo(info);
    try {
      localStorage.setItem(`gigme_law_signed_${currentUser?.id || '000000000'}`, JSON.stringify(info));
    } catch {
      // ignore
    }

    showNotification(
      'Cam Kết Pháp Lý Thành Công! ⚖️',
      `Tài khoản ID ${currentUser?.id || '000000000'} đã ký điện tử cam kết tuân thủ 100% Bộ Luật & Quy chế GigMe Campus. Mã chứng thư số: ${hash}`,
      true,
      true
    );
  };

  // Download / Export plain text summary of law
  const handleExportLawText = () => {
    triggerHaptic('medium');
    const content = `=====================================================
BỘ LUẬT & ĐIỀU KHOẢN NỀN TẢNG GIGME CAMPUS (NĂM 2026)
Hệ thống văn bản pháp quy Campus Student Escrow Code v2.4
Tuân thủ Nghị định 13/2023/NĐ-CP & Tiêu chuẩn Escrow Bảo Chứng
=====================================================

${LAW_ARTICLES.map((a) => `${a.articleNumber}: ${a.title}\n${a.summary}\n${a.clauses.join('\n')}\n`).join('\n-----------------------------------------------------\n')}

Chứng thực bởi: GigMe Campus Executive Board
Đơn vị bảo lãnh: Ban Quản Trị Tối Cao (ID 000000000)
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GigMe-Bo-Luat-Campus-2026.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Đã tải văn bản bộ luật!', 'Tệp văn bản GigMe-Bo-Luat-Campus-2026.txt đã được lưu về thiết bị.');
  };

  // Send report to Admin
  const handleSendReportToAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');
    sendChat(
      `🚨 [TỐ CÁO VI PHẠM PHÁP QUY]\n- Điều khoản vi phạm: ${reportTargetArticle}\n- ID/Người bị tố cáo: ${reportSuspectId || 'Chưa rõ'}\n- Chi tiết hành vi vi phạm: ${reportViolationContent}\n- Người gửi báo cáo: ID ${currentUser?.id || '000000000'} (${currentUser?.name || 'Thành viên'})`,
      'NONE',
      null,
      0,
      undefined,
      undefined,
      '000000000',
      'Quản Trị Viên Tối Cao'
    );
    setShowReportModal(false);
    setReportViolationContent('');
    setReportSuspectId('');
    showNotification(
      'Đã gửi báo cáo vi phạm tới Ban Quản Trị 🛡️',
      'Hội đồng Trọng tài Admin Master 000000000 đã tiếp nhận hồ sơ và sẽ tiến hành xác minh trong 30 phút!',
      true,
      true
    );
    if (onOpenContactAdmin) {
      onOpenContactAdmin();
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 pb-28 animate-fadeIn">
      {/* TOP HERO LEGAL HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0F1E38] via-[#0B1527] to-[#070D18] border-b border-[#C5E5EC]/20 pt-6 pb-8 px-4 sm:px-6">
        {/* Ambient lighting effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#3064AE]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-4">
          {/* Top compliance badge bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              {onBack && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onBack();
                  }}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#C5E5EC] hover:text-white flex items-center space-x-1 transition text-xs font-bold mr-1 cursor-pointer active:scale-95"
                  title="Quay lại"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Quay lại</span>
                </button>
              )}
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-extrabold text-[11px] shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Quy Chuẩn Chính Thức 2026</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 font-bold text-[10px]">
                <span>Nghị định 13/2023/NĐ-CP</span>
              </span>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-[#C5E5EC]/70">
              <button
                type="button"
                onClick={handleExportLawText}
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-[#C5E5EC] hover:text-white border border-[#C5E5EC]/20 flex items-center space-x-1 font-bold transition cursor-pointer"
                title="Tải tệp văn bản quy chế"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải Bản Văn Bản</span>
              </button>
              <span>Mã văn bản: <strong>GIGME-LAW-2026</strong></span>
            </div>
          </div>

          {/* Main Title & Authority Emblem */}
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-600 to-amber-700 p-0.5 shadow-xl shadow-amber-900/40 shrink-0">
              <div className="w-full h-full rounded-[14px] bg-[#0A1220] flex items-center justify-center text-amber-300">
                <Scale className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>BỘ LUẬT &amp; ĐIỀU KHOẢN GIGME CAMPUS</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#C5E5EC]/85 leading-relaxed font-medium">
                Quy định nghiêm ngặt về Ký quỹ Smart Escrow 100%, Chợ KTX &amp; đồ dùng cũ sinh viên, Định danh chính chủ, Chống lừa đảo, Xử lý bỏ kèo và Khung chế tài xử phạt trên toàn hệ thống.
              </p>
            </div>
          </div>

          {/* Key Pillars Highlights (4 summary cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <div className="p-2.5 rounded-2xl bg-[#0D1B30] border border-[#C5E5EC]/20 text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div className="font-extrabold text-[11px] text-white">Smart Escrow 100%</div>
              <div className="text-[10px] text-[#C5E5EC]/70 leading-tight">Khóa tiền an toàn, cấm lách sàn</div>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#0D1B30] border border-[#C5E5EC]/20 text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="font-extrabold text-[11px] text-white">Quy Chế Chợ KTX</div>
              <div className="text-[10px] text-[#C5E5EC]/70 leading-tight">Điều 18: Cọc giữ đồ &amp; tặng 0đ</div>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#0D1B30] border border-[#C5E5EC]/20 text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="font-extrabold text-[11px] text-white">Chống Fake GPS</div>
              <div className="text-[10px] text-[#C5E5EC]/70 leading-tight">Bằng chứng Blockchain Hash</div>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#0D1B30] border border-[#C5E5EC]/20 text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Gavel className="w-4 h-4" />
              </div>
              <div className="font-extrabold text-[11px] text-white">Khung 5 Mức Phạt</div>
              <div className="text-[10px] text-[#C5E5EC]/70 leading-tight">Khóa tài khoản &amp; Xử lý hình sự</div>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY SEARCH & CATEGORY FILTER BAR */}
      <div className="sticky top-0 z-30 bg-[#070D18]/95 backdrop-blur-md border-b border-[#C5E5EC]/15 py-3 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto space-y-2.5">
          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#C5E5EC]/60 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tra cứu nhanh luật: 'chợ KTX', 'hoàn tiền', 'lách sàn', 'bỏ kèo', 'cọc giữ đồ', 'xử phạt'..."
              className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-[#0F1E34] border border-[#C5E5EC]/25 text-white text-xs placeholder:text-[#C5E5EC]/40 focus:outline-none focus:border-amber-400 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 px-2 py-0.5 text-[10px] font-bold rounded-lg bg-white/10 hover:bg-white/20 text-[#C5E5EC] transition cursor-pointer"
              >
                Xóa tìm
              </button>
            )}
          </div>

          {/* Horizontal Chapter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
            {LAW_CHAPTERS.map((chap) => {
              const Icon = chap.icon;
              const isSelected = selectedChapter === chap.id;
              return (
                <button
                  key={chap.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedChapter(chap.id);
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white border-amber-300 shadow-md shadow-amber-900/30'
                      : 'bg-[#0E1B2E] border-[#C5E5EC]/20 text-[#C5E5EC]/80 hover:text-white hover:bg-[#13243C]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{chap.label}</span>
                  {chap.id === 'BOOKMARKS' && bookmarkedIds.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[9px] font-black">
                      {bookmarkedIds.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MAIN ARTICLES LIST */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-4">
        {/* Counter and Expand All / Collapse All */}
        <div className="flex items-center justify-between text-xs text-[#C5E5EC]/80 pb-1">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-white">Hiển thị {filteredArticles.length} điều khoản chặt chẽ</span>
            {selectedChapter !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                Mục: {LAW_CHAPTERS.find((c) => c.id === selectedChapter)?.label}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-[11px] font-bold text-rose-300 transition cursor-pointer flex items-center space-x-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Báo Cáo Vi Phạm</span>
            </button>
            <button
              type="button"
              onClick={() => toggleAll(true)}
              className="px-2.5 py-1 rounded-lg bg-[#0E1B2E] hover:bg-[#13243C] border border-[#C5E5EC]/20 text-[11px] font-bold text-[#C5E5EC] transition cursor-pointer"
            >
              Mở hết
            </button>
            <button
              type="button"
              onClick={() => toggleAll(false)}
              className="px-2.5 py-1 rounded-lg bg-[#0E1B2E] hover:bg-[#13243C] border border-[#C5E5EC]/20 text-[11px] font-bold text-[#C5E5EC] transition cursor-pointer"
            >
              Thu gọn
            </button>
          </div>
        </div>

        {/* Empty Search Result */}
        {filteredArticles.length === 0 && (
          <div className="p-8 rounded-3xl bg-[#0D182A] border border-[#C5E5EC]/20 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-white">Không tìm thấy điều khoản phù hợp</h3>
            <p className="text-xs text-[#C5E5EC]/70 max-w-sm mx-auto">
              Không có kết quả khớp với bộ lọc hoặc từ khóa "{searchQuery}". Bạn có thể thử tìm với: "chợ KTX", "hoàn tiền", "cọc", "chat", "CCCD", hoặc bấm xem toàn bộ bộ luật.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedChapter('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-500 transition cursor-pointer"
            >
              Xem tất cả 18 điều khoản
            </button>
          </div>
        )}

        {/* Article Cards */}
        {filteredArticles.map((article) => {
          const isExpanded = !!expandedArticles[article.id];
          const isBookmarked = bookmarkedIds.includes(article.id);

          return (
            <div
              key={article.id}
              className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                article.isCritical
                  ? 'bg-gradient-to-b from-[#0F1E36] to-[#0A1424] border-amber-500/40 shadow-lg shadow-amber-950/20'
                  : 'bg-[#0B1526] border-[#C5E5EC]/20 hover:border-[#C5E5EC]/40'
              }`}
            >
              {/* Card Header (Click to toggle) */}
              <div
                onClick={() => toggleArticle(article.id)}
                className="p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer select-none hover:bg-white/[0.02] transition"
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <div
                    className={`px-2.5 py-1 rounded-xl font-mono font-black text-xs shrink-0 mt-0.5 border ${
                      article.isCritical
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black border-amber-300'
                        : 'bg-[#12233B] text-[#00E5FF] border-[#00E5FF]/30'
                    }`}
                  >
                    {article.articleNumber}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h2 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                        {article.title}
                      </h2>
                      {article.isCritical && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-black uppercase tracking-wider">
                          Đặc Biệt Quan Trọng
                        </span>
                      )}
                      {article.category === 'MARKETPLACE' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase tracking-wider">
                          Chợ KTX &amp; Escrow Đồ Cũ
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#C5E5EC]/75 line-clamp-2">
                      {article.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {/* Bookmark Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(article.id);
                    }}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      isBookmarked
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                        : 'bg-white/5 hover:bg-white/15 text-[#C5E5EC]'
                    }`}
                    title={isBookmarked ? 'Bỏ lưu điều khoản' : 'Lưu lại điều khoản này'}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-300' : ''}`} />
                  </button>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyArticle(article);
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-[#C5E5EC] hover:text-white transition cursor-pointer"
                    title="Sao chép điều khoản này"
                  >
                    {copiedArticleId === article.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <div className="p-2 rounded-xl bg-white/5 text-[#C5E5EC]">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Card Body (Detailed Clauses) */}
              {isExpanded && (
                <div className="px-4 sm:px-5 pb-5 pt-1 space-y-3.5 border-t border-[#C5E5EC]/15 text-xs text-slate-200 leading-relaxed animate-fadeIn">
                  <div className="space-y-2.5 pt-2">
                    {article.clauses.map((clause, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-2.5 p-2.5 rounded-2xl bg-[#070D18]/60 border border-white/5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2" />
                        <span className="leading-relaxed">{clause}</span>
                      </div>
                    ))}
                  </div>

                  {/* Penalty Snippet Callout */}
                  {article.penaltySnippet && (
                    <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-600/40 text-rose-200 flex items-start space-x-2.5">
                      <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-snug">
                        <strong className="text-rose-300 font-extrabold uppercase">Chế tài nghiêm cấm: </strong>
                        <span>{article.penaltySnippet}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* BOTTOM OFFICIAL SIGNATURE & DIGITAL CERTIFICATE */}
        <div className="mt-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#12233D] via-[#0E1A2E] to-[#0A1324] border-2 border-amber-500/40 shadow-2xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
              <Gavel className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Cam Kết Pháp Lý &amp; Chấp Thuận Điều Khoản</h3>
              <p className="text-xs text-[#C5E5EC]/80">
                Hiệp ước cộng đồng sinh viên văn minh • Smart Escrow bảo đảm tiền thù lao &amp; cọc đồ KTX
              </p>
            </div>
          </div>

          {/* User info box */}
          <div className="p-3.5 rounded-2xl bg-[#070E1A] border border-[#C5E5EC]/20 text-xs text-[#C5E5EC]/90 space-y-1.5">
            <p>
              • Tài khoản đang đăng nhập: <strong className="text-white font-mono">{currentUser?.id || '000000000'}</strong> ({currentUser?.name || 'Khách Campus'}).
            </p>
            <p>
              • Bằng việc kích hoạt cam kết, bạn đồng thuận rằng mọi giao dịch việc làm và mua bán đồ KTX sẽ được phân xử theo đúng 18 Điều khoản của Bộ Luật này và phán quyết từ Ban Quản Trị Tối Cao có giá trị thi hành tuyệt đối.
            </p>
          </div>

          {/* VERIFIED DIGITAL CERTIFICATE BADGE (WHEN SIGNED) */}
          {signatureInfo.isSigned && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-[#0C241B] to-emerald-950/60 border border-emerald-500/40 text-emerald-200 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="font-black text-sm text-emerald-300 uppercase tracking-wide">
                    CHỨNG THƯ PHÁP LÝ ĐIỆN TỬ HỢP LỆ
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  VALIDATED
                </span>
              </div>

              <div className="text-[11px] space-y-1 font-mono text-[#C5E5EC]/90 bg-black/40 p-2.5 rounded-xl border border-emerald-500/20">
                <div>Ký bởi: <strong className="text-white">{currentUser?.name || 'Sinh viên'}</strong> (ID: {currentUser?.id || '000000000'})</div>
                <div>Thời gian ký: {new Date(signatureInfo.signedAt || Date.now()).toLocaleString('vi-VN')}</div>
                <div className="break-all text-[10px] text-emerald-300/80">Mã chứng thực số: {signatureInfo.signatureHash}</div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleConfirmCommitment}
              disabled={signatureInfo.isSigned}
              className={`w-full sm:flex-1 py-3.5 px-5 rounded-2xl font-black text-xs transition flex items-center justify-center space-x-2 shadow-xl cursor-pointer ${
                signatureInfo.isSigned
                  ? 'bg-emerald-600 text-white border border-emerald-400 cursor-default'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-110 text-black shadow-amber-900/50'
              }`}
            >
              {signatureInfo.isSigned ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>ĐÃ KÝ ĐIỆN TỬ CAM KẾT TUÂN THỦ 100% BỘ LUẬT</span>
                </>
              ) : (
                <>
                  <Scale className="w-4 h-4" />
                  <span>TÔI ĐÃ ĐỌC KỸ &amp; KÝ CAM KẾT TUÂN THỦ 100% BỘ LUẬT</span>
                </>
              )}
            </button>

            {onOpenContactAdmin && (
              <button
                type="button"
                onClick={onOpenContactAdmin}
                className="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-[#C5E5EC] hover:text-white font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5 border border-[#C5E5EC]/20"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Hỏi Ban Quản Trị 24/7</span>
              </button>
            )}
          </div>
        </div>

        {/* FOOTER METADATA */}
        <div className="pt-4 pb-6 text-center space-y-1 text-[11px] text-[#C5E5EC]/60">
          <p>© 2026 GigMe Platform • Hệ thống văn bản pháp quy Campus Student Escrow Code v2.4 (Bao gồm Điều 18 Chợ KTX)</p>
          <p>Ban hành bởi Ban Điều Hành GigMe • Hiệu lực bắt buộc trên toàn quốc</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: BÁO CÁO VI PHẠM ĐIỀU KHOẢN TỚI ADMIN MASTER 000000000 */}
      {/* ========================================================================= */}
      {showReportModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowReportModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-[#0D1627] border-2 border-rose-500/40 p-6 text-white shadow-2xl my-8 space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h3 className="font-extrabold text-sm sm:text-base text-white">Báo Cáo Vi Phạm Pháp Quy</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendReportToAdmin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Điều khoản bị vi phạm <span className="text-rose-400">*</span>
                </label>
                <select
                  value={reportTargetArticle}
                  onChange={(e) => setReportTargetArticle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:outline-none focus:border-rose-400"
                >
                  <option value="Điều 5: Nghiêm cấm lách giao dịch ngoài sàn">Điều 5: Lách giao dịch ngoài sàn</option>
                  <option value="Điều 18: Vi phạm quy chế Chợ KTX / Hàng cấm">Điều 18: Vi phạm Chợ KTX / Hàng cấm</option>
                  <option value="Điều 9: Vi phạm liêm chính học thuật / Thi hộ">Điều 9: Gian lận học thuật / Thi hộ</option>
                  <option value="Điều 10: Tự ý bỏ kèo (No-Show) / Hủy sát giờ">Điều 10: Tự ý bỏ kèo / Bùng hẹn</option>
                  <option value="Điều 2: Tài khoản ảo Sybil / Đánh giá khống">Điều 2: Tạo nick ảo / Buff sao khống</option>
                  <option value="Điều 3: Giả mạo vị trí Fake GPS">Điều 3: Giả mạo vị trí Fake GPS</option>
                  <option value="Điều khác">Điều khoản khác</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  ID 9 số hoặc Tên đối tượng vi phạm (nếu có)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 123456789 hoặc tên người dùng..."
                  value={reportSuspectId}
                  onChange={(e) => setReportSuspectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:outline-none focus:border-rose-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mô tả chi tiết bằng chứng vi phạm <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Cung cấp chi tiết: thời gian xảy ra, nội dung tin nhắn lách sàn hoặc link bài đăng Chợ KTX vi phạm..."
                  value={reportViolationContent}
                  onChange={(e) => setReportViolationContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-300 leading-snug">
                Báo cáo sẽ được chuyển trực tiếp vào kênh điều tra riêng của Ban Quản Trị Tối Cao (ID 000000000). Mọi hành vi vu khống ác ý cũng sẽ bị xử lý nghiêm khắc.
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-extrabold text-xs hover:brightness-110 shadow-lg shadow-rose-950/50 transition cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Gửi Báo Cáo Tới Ban Quản Trị Ngay</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
