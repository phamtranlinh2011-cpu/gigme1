import React, { useState } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  FileText,
  Lock,
  CheckCircle2,
  X,
  AlertTriangle,
  Scale,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface TermsAndRefundPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'REFUND' | 'TERMS' | 'PRIVACY' | 'APP_STORE_COMPLIANCE';
}

export const TermsAndRefundPolicyModal: React.FC<TermsAndRefundPolicyModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'REFUND',
}) => {
  const [activeTab, setActiveTab] = useState<'REFUND' | 'TERMS' | 'PRIVACY' | 'APP_STORE_COMPLIANCE'>(
    defaultTab
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-3xl rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/30 text-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#C5E5EC]/20 flex items-center justify-between shrink-0 bg-[#12233B]/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm sm:text-base text-white">
                  Điều Khoản Dịch Vụ & Chính Sách Hoàn Tiền
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Chuẩn App Store & Google Play
                </span>
              </div>
              <p className="text-[11px] text-[#C5E5EC]/70">
                Minh bạch 100% • Bảo vệ quyền lợi tài chính sinh viên • Trọng tài 24/7
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-[#C5E5EC]/70 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#C5E5EC]/15 bg-[#0A1322] px-3 sm:px-5 shrink-0 overflow-x-auto gap-1 py-1.5">
          {[
            { id: 'REFUND', label: 'Chính Sách Hoàn Tiền', icon: RotateCcw },
            { id: 'TERMS', label: 'Ký Quỹ Smart Escrow', icon: ShieldCheck },
            { id: 'PRIVACY', label: 'Quyền Riêng Tư & Dữ Liệu', icon: Lock },
            { id: 'APP_STORE_COMPLIANCE', label: 'Quy Chuẩn Store', icon: FileText },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#3064AE] text-white shadow-sm border border-[#C5E5EC]/30'
                    : 'text-[#C5E5EC]/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-[#C5E5EC]/90">
          {activeTab === 'REFUND' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-black text-sm">
                  <RotateCcw className="w-4 h-4" />
                  <span>CAM KẾT HOÀN TIỀN MINH BẠCH 100% (SMART REFUND)</span>
                </div>
                <p className="text-[11px] text-emerald-200/90">
                  GigMe áp dụng cơ chế Két Ký Quỹ Escrow độc lập. Tiền thù lao của Người Thuê chỉ được chuyển
                  cho Người Làm khi đã có sự đồng thuận xác nhận nghiệm thu kết quả. Mọi trường hợp vi phạm đều
                  được bảo vệ quyền lợi tài chính tuyệt đối.
                </p>
              </div>

              {/* Refund Scenarios Table */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
                  1. Các trường hợp hoàn tiền cụ thể:
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20 flex items-start space-x-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-black text-xs shrink-0 border border-emerald-500/30">
                      100% HOÀN
                    </span>
                    <div>
                      <span className="font-bold text-white block">Người thuê hủy trước khi có người nhận</span>
                      <p className="text-[11px] text-[#C5E5EC]/70">
                        Toàn bộ số tiền cọc Escrow được hoàn ngay lập tức về Số Dư Khả Dụng ví GigMe (0đ phụ phí).
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20 flex items-start space-x-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-black text-xs shrink-0 border border-emerald-500/30">
                      100% HOÀN
                    </span>
                    <div>
                      <span className="font-bold text-white block">Người làm hủy đơn hoặc bỏ bom (No-Show)</span>
                      <p className="text-[11px] text-[#C5E5EC]/70">
                        Hoàn 100% tiền Escrow về ví người thuê + Người làm vi phạm bị trừ điểm tín nhiệm TrustScore và ghi nhận sổ kỷ luật nền tảng.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20 flex items-start space-x-3">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-black text-xs shrink-0 border border-amber-500/30">
                      90% HOÀN
                    </span>
                    <div>
                      <span className="font-bold text-white block">Người thuê tự hủy muộn sau khi Người làm đã di chuyển</span>
                      <p className="text-[11px] text-[#C5E5EC]/70">
                        Hoàn 90% cho người thuê, 10% được chuyển bồi thường phí xăng xe / công sức giữ chỗ cho sinh viên nhận việc.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20 flex items-start space-x-3">
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-black text-xs shrink-0 border border-sky-400/30">
                      TRỌNG TÀI
                    </span>
                    <div>
                      <span className="font-bold text-white block">Khiếu nại sản phẩm không đạt chất lượng cam kết</span>
                      <p className="text-[11px] text-[#C5E5EC]/70">
                        Nút "Khiếu nại" kích hoạt đóng băng Escrow. Hội đồng Admin ID 000000000 kiểm duyệt bằng chứng ảnh/chat trong tối đa 24 giờ để ra phán quyết hoàn tiền công bằng.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payout & Withdrawal */}
              <div className="p-3 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/15 space-y-1.5">
                <span className="font-extrabold text-white text-xs block">
                  2. Thời gian tiền về tài khoản ngân hàng:
                </span>
                <p className="text-[11px] text-[#C5E5EC]/80">
                  Tiền hoàn về Ví GigMe có hiệu lực ngay trong 1 giây. Khi bấm "Rút tiền về Vietcombank, MB, Techcombank, MoMo...", tiền được chuyển tức thời qua cổng Napas 24/7 hoàn toàn <strong>0đ phí giao dịch</strong>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'TERMS' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 space-y-2">
                <h4 className="font-black text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span>Quy Chế Hoạt Động Smart Escrow</span>
                </h4>
                <p className="text-[11px] text-[#C5E5EC]/80">
                  GigMe hoạt động như một nền tảng công nghệ kết nối ngang hàng (Peer-to-Peer Campus Network). Mọi thỏa thuận thù lao công việc giữa Người Thuê và Người Làm đều được bảo chứng tự động qua Két Ký Quỹ Escrow.
                </p>
              </div>

              <div className="space-y-3">
                <div className="border-l-2 border-sky-400 pl-3 space-y-1">
                  <h5 className="font-bold text-white text-xs">Điều 1: Đặt cọc ký quỹ</h5>
                  <p className="text-[11px] text-[#C5E5EC]/70">
                    Khi đăng bài hoặc chấp thuận báo giá, Người thuê nạp tiền ký quỹ đủ 100% thù lao. Số tiền này không thuộc sở hữu của GigMe mà được tạm khóa an toàn.
                  </p>
                </div>

                <div className="border-l-2 border-emerald-400 pl-3 space-y-1">
                  <h5 className="font-bold text-white text-xs">Điều 2: Nghiệm thu và giải ngân</h5>
                  <p className="text-[11px] text-[#C5E5EC]/70">
                    Người làm nộp bằng chứng hoàn thành (ảnh chụp, file tài liệu, chữ ký nhận). Người thuê kiểm tra và bấm "Giải ngân". Sau khi nhập mã PIN hoặc quét sinh trắc học, tiền chuyển ngay cho người làm.
                  </p>
                </div>

                <div className="border-l-2 border-amber-400 pl-3 space-y-1">
                  <h5 className="font-bold text-white text-xs">Điều 3: Nghiêm cấm giao dịch ngoài luồng</h5>
                  <p className="text-[11px] text-[#C5E5EC]/70">
                    Để tránh lừa đảo quỵt tiền sinh viên, mọi thỏa thuận chuyển khoản ngoài nền tảng không qua Escrow sẽ không được bảo hộ khi phát sinh tranh chấp.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'PRIVACY' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 space-y-2">
                <h4 className="font-black text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Chính Sách Quyền Riêng Tư & Bảo Mật Dữ Liệu (GDPR / NDPE)</span>
                </h4>
                <p className="text-[11px] text-[#C5E5EC]/80">
                  GigMe cam kết tôn trọng quyền riêng tư cá nhân theo quy định của Luật An ninh mạng Việt Nam và các tiêu chuẩn bảo mật dữ liệu quốc tế.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/15">
                  <span className="font-bold text-white text-xs block mb-1">1. Dữ liệu chúng tôi thu thập:</span>
                  <p className="text-[11px] text-[#C5E5EC]/70">
                    Chỉ thu thập thông tin cần thiết phục vụ vận hành: Tên, Email trường (.edu.vn), ID 9 số, Số điện thoại xác thực OTP và lịch sử giao dịch Escrow. Tuyệt đối không thu thập mật khẩu ngân hàng.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/15">
                  <span className="font-bold text-white text-xs block mb-1">2. Quyền được lãng quên & Xóa dữ liệu:</span>
                  <p className="text-[11px] text-[#C5E5EC]/70">
                    Bất kỳ lúc nào, người dùng có quyền yêu cầu xóa toàn bộ lịch sử trò chuyện, hình ảnh bằng chứng và tài khoản khỏi hệ thống thông qua mục Cài đặt tài khoản.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/15">
                  <span className="font-bold text-white text-xs block mb-1">3. Cam kết không bán dữ liệu cho bên thứ ba:</span>
                  <p className="text-[11px] text-[#C5E5EC]/70">
                    Dữ liệu cá nhân của sinh viên không bao giờ được chia sẻ hay thương mại hóa cho các đơn vị quảng cáo ngoài luồng.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'APP_STORE_COMPLIANCE' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 space-y-2">
                <h4 className="font-black text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span>Tuân Thủ Nguyên Tắc Apple App Store & Google Play Store</span>
                </h4>
                <p className="text-[11px] text-[#C5E5EC]/80">
                  Ứng dụng GigMe được xây dựng tuân thủ nghiêm ngặt các hướng dẫn kiểm duyệt ứng dụng chính thức:
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/15">
                  <span className="font-bold text-white text-xs block text-sky-300">
                    • Apple Guideline 5.1.1 (Data Collection and Storage):
                  </span>
                  <p className="text-[11px] text-[#C5E5EC]/70 mt-0.5">
                    Người dùng có quyền kiểm soát toàn diện thông tin cá nhân. Minh bạch mục đích sử dụng camera (chụp ảnh bằng chứng nghiệm thu) và định vị khuôn viên trường học.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/15">
                  <span className="font-bold text-white text-xs block text-sky-300">
                    • Google Play User Data & Financial Services Policy:
                  </span>
                  <p className="text-[11px] text-[#C5E5EC]/70 mt-0.5">
                    Tuân thủ chính sách dịch vụ tài chính an toàn: Mọi giao dịch nạp rút đều có mã OTP / xác thực hai lớp, thông tin số tài khoản được mã hóa và không có chi phí ẩn.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/15">
                  <span className="font-bold text-white text-xs block text-sky-300">
                    • Kiểm duyệt nội dung cộng đồng (UGC Safety Guideline 1.2):
                  </span>
                  <p className="text-[11px] text-[#C5E5EC]/70 mt-0.5">
                    Bộ lọc ngôn từ xúc phạm, hệ thống báo cáo vi phạm 1 chạm và giới hạn tốc độ (Rate Limiting) ngăn chặn triệt để hành vi quấy rối hoặc spam bot.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#C5E5EC]/20 bg-[#12233B]/90 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-[#C5E5EC]/70">
            Hỗ trợ trọng tài 24/7: <strong className="text-white">Admin ID: 000000000</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#417AC6] to-[#C5E5EC] text-white font-extrabold text-xs shadow-md hover:brightness-110 transition cursor-pointer"
          >
            Tôi Đã Hiểu & Đồng Ý
          </button>
        </div>
      </div>
    </div>
  );
};
