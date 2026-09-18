import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  SmartphoneNfc,
  Award,
  Lock,
  KeyRound,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Star,
  CheckCircle2,
  Plus,
  X,
  Flame,
  Fingerprint,
  Smartphone,
  Building2,
  Volume2,
  Sun,
  Moon,
  AlertTriangle,
  TrendingUp,
  Check,
  Camera,
  Wrench,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { USER_TIERS, formatVnd } from '../types';
import { playNotificationSound } from '../utils/audio';
import { SoundSettingsDialog, BusinessUpgradeDialog } from '../components/AdvancedDialogs';
import { AvatarPickerModal } from '../components/AvatarPickerModal';
import { StudentEloModal } from '../components/StudentEloModal';

interface ProfileScreenProps {
  onOpenNfcDialog: () => void;
  onOpenFaceDialog?: () => void;
  onOpenSsoDialog: () => void;
  onOpenAdminDashboard: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenNfcDialog,
  onOpenFaceDialog,
  onOpenSsoDialog,
  onOpenAdminDashboard,
}) => {
  const {
    currentUser,
    logout,
    roleMode,
    toggleRole,
    setWalletPin,
    toggleBiometrics,
    isDarkMode,
    toggleDarkMode,
    isMaintenanceActive,
    maintenanceConfig,
  } = useGigMe();

  const [skills, setSkills] = useState<string[]>([
    'Sinh viên TDTU',
    'Tin học ứng dụng',
    'Tiếng Anh giao tiếp',
  ]);
  const [newSkill, setNewSkill] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showEloModal, setShowEloModal] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [simulatedAlert, setSimulatedAlert] = useState(false);

  if (!currentUser) return null;

  const currentTierConfig = USER_TIERS[currentUser.tier];
  const isSuperAdmin =
    currentUser.role === 'ADMIN' ||
    currentUser.email === 'admin@admin.vn' ||
    currentUser.phone === '0909120918' ||
    currentUser.id === 'admin_root';

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim() || skills.includes(newSkill.trim())) return;
    setSkills([...skills, newSkill.trim()]);
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 6) return;
    if (setWalletPin) {
      const ok = setWalletPin(oldPin, newPin);
      if (ok) {
        setShowPinModal(false);
        setOldPin('');
        setNewPin('');
      }
    }
  };

  const trustScore = currentUser.trustScore ?? 0;
  const getTrustRating = (score: number) => {
    if (score >= 800) return { label: 'Hạng AAA - Xuất Sắc', badge: 'bg-emerald-500/20 text-emerald-300' };
    if (score >= 740) return { label: 'Hạng AA - Rất Tốt', badge: 'bg-cyan-500/20 text-[#00E5FF]' };
    if (score >= 670) return { label: 'Hạng A - Uy Tín', badge: 'bg-blue-500/20 text-blue-300' };
    if (score >= 300) return { label: 'Hạng B - Đang Cải Thiện', badge: 'bg-amber-500/20 text-amber-300' };
    return { label: 'Chưa Tích Lũy Điểm', badge: 'bg-slate-500/20 text-slate-300' };
  };
  const trustInfo = getTrustRating(trustScore);

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 text-white space-y-4 sm:space-y-6 text-xs">
      {/* Maintenance Mode Notice for Profile */}
      {isMaintenanceActive && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border border-amber-500/40 p-4 shadow-lg flex items-start space-x-3">
          <Wrench className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1 flex-1">
            <div className="font-extrabold text-amber-300 text-xs flex items-center space-x-2">
              <span>HỆ THỐNG ĐANG BẢO TRÌ NÂNG CẤP</span>
              <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-mono">
                Chế độ xem hồ sơ được phép
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Bạn đang xem thông tin cá nhân của mình. Theo quy định bảo trì toàn sàn, các tính năng tạo việc, nhận việc, nạp rút tiền và nhắn tin tạm thời khóa cho đến{' '}
              <span className="text-white font-bold">{new Date(maintenanceConfig.endTime).toLocaleTimeString('vi-VN')}</span> (
              {new Date(maintenanceConfig.endTime).toLocaleDateString('vi-VN')}).
            </p>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0F1D30] to-[#0A1322] border border-[#1E293B] p-4 sm:p-6 shadow-2xl relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Interactive Avatar with Camera Badge */}
            <div className="relative group shrink-0">
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[#00E5FF]/60 group-hover:border-[#00E5FF] shadow-lg shadow-cyan-500/20 transition-transform active:scale-95 bg-slate-900 flex items-center justify-center relative cursor-pointer"
                title="Bấm để thay đổi ảnh đại diện"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#00E5FF] to-indigo-600 flex items-center justify-center font-black text-2xl text-black">
                    {(currentUser.name || 'G').charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Overlay hover icon */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white drop-shadow" />
                </div>
              </button>

              {/* Quick Camera Badge Button */}
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#00E5FF] text-black hover:bg-cyan-300 shadow-md transition border-2 border-[#0A1322] cursor-pointer"
                title="Thay đổi ảnh đại diện"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="text-sm sm:text-base font-extrabold text-white truncate">{currentUser.name}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 shrink-0">
                  {currentTierConfig.badgeText}
                </span>
                {currentUser.isBusinessAccount && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-0.5 shrink-0">
                    <Building2 className="w-3 h-3 mr-0.5" /> Doanh nghiệp
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="text-[10px] text-[#00E5FF] hover:underline font-semibold flex items-center space-x-0.5 ml-1"
                >
                  <Sparkles className="w-3 h-3 mr-0.5" /> Đổi avatar
                </button>
              </div>
              <p className="text-slate-400 mt-0.5 truncate text-[11px]">{currentUser.email || currentUser.phone}</p>
              <div className="flex items-center space-x-3 mt-1.5 text-[11px] flex-wrap gap-y-1">
                <span className="flex items-center text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-current mr-1" /> {currentUser.rating}/5.0 ({currentUser.reviewCount ?? 0})
                </span>
                <span className="text-slate-500">•</span>
                <span className="flex items-center text-[#00E5FF] font-semibold">
                  <Flame className="w-3.5 h-3.5 fill-current mr-1 text-[#FF6B00]" /> {currentUser.completedGigs ?? 0} kèo xong
                </span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
            <button
              onClick={toggleRole}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#131E30] hover:bg-[#1A2840] border border-slate-700 font-extrabold text-slate-200 transition text-center"
            >
              Chuyển sang {roleMode === 'FREELANCER' ? 'Người Thuê' : 'Người Làm'}
            </button>
          </div>
        </div>
      </div>

      {/* HỆ THỐNG UY TÍN SINH VIÊN (CAMPUS TRUST & ELO BADGE) */}
      <div className="rounded-3xl bg-gradient-to-br from-[#121E33] to-[#0A1322] border-2 border-amber-500/40 p-4 sm:p-6 shadow-2xl space-y-3.5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/20">
              <Award className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white">Uy Tín Sinh Viên & Huy Hiệu ELO</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] border border-amber-500/30">
                  RANK CAMPUS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Xếp hạng dựa trên tốc độ hoàn thành, chất lượng bàn giao & bảo chứng Escrow
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playNotificationSound('LEVEL_UP');
              setShowEloModal(true);
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-400 text-black font-extrabold text-xs hover:brightness-110 shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Mở Hồ Sơ ELO & Huy Hiệu</span>
          </button>
        </div>

        {/* ELO & Trust Badges Quick Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
          <div className="p-3 rounded-2xl bg-[#101A2C] border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Điểm ELO Tín Nhiệm:</span>
            <span className="text-xl font-black text-amber-400 font-mono">
              {currentUser.eloRating ?? 1250}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Top 15% Campus</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#101A2C] border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Chuỗi 5 Sao Liên Tiếp:</span>
            <span className="text-xl font-black text-rose-400 font-mono flex items-center">
              <Flame className="w-4 h-4 mr-1 fill-rose-500 animate-pulse" />
              {currentUser.winStreak ?? 5} Đơn
            </span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">Tín nhiệm cao</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#101A2C] border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Bảo Hộ Smart Escrow:</span>
            <span className="text-xl font-black text-[#00E5FF] font-mono">100%</span>
            <span className="text-[10px] text-purple-300 block mt-0.5">Hợp đồng điện tử</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#101A2C] border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Huy Hiệu Sinh Viên:</span>
            <div className="flex items-center space-x-1 mt-1 text-sm">
              <span title="Thần tốc">🚀</span>
              <span title="Chuỗi 5 sao">💎</span>
              <span title="Xác thực C06">🛡️</span>
              <span title="Học bá">📚</span>
              <span title="Flea Market">🛒</span>
              <span className="text-[10px] font-bold text-amber-400 pl-1">+3</span>
            </div>
            <span className="text-[9px] text-slate-400 block mt-0.5">Xem tất cả</span>
          </div>
        </div>
      </div>

      {/* XẾP HẠNG ĐỘ UY TÍN TÍN DỤNG SINH VIÊN (TRUSTSCORE) */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0F1E33] to-[#0A1322] border border-[#00E5FF]/30 p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-[#00E5FF]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Xếp Hạng Tín Dụng Sinh Viên (TrustScore)</h3>
              <p className="text-[11px] text-slate-400">Thang điểm tín nhiệm thông minh 300 - 850</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-[#00E5FF] font-mono">{trustScore}</span>
            <span className="text-xs text-slate-400"> / 850</span>
            <span className={`block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${trustInfo.badge}`}>
              {trustInfo.label}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-cyan-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, (trustScore / 850) * 100))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0 (Khởi đầu)</span>
            <span>300 (Cơ bản)</span>
            <span>670 (Tốt)</span>
            <span>740 (Rất Tốt)</span>
            <span>850 (Xuất sắc)</span>
          </div>
        </div>

        {/* Factors breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-2xl bg-[#131E30] border border-slate-800">
            <span className="text-slate-400 block text-[10px] mb-1">Tỷ lệ đúng hẹn:</span>
            <span className="font-extrabold text-emerald-400 text-sm flex items-center">
              <Check className="w-4 h-4 mr-1" /> {currentUser.completedGigs > 0 ? `${currentUser.onTimeRate ?? 100}%` : 'Chưa có đơn'}
            </span>
            <span className="text-[10px] text-slate-500">{currentUser.completedGigs > 0 ? '+150 điểm thưởng' : 'Chưa tích lũy'}</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#131E30] border border-slate-800">
            <span className="text-slate-400 block text-[10px] mb-1">Kỷ luật / Phạt vi phạm:</span>
            <span className={`font-extrabold text-sm flex items-center ${
              (currentUser.disciplineRecords?.length || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              <ShieldCheck className="w-4 h-4 mr-1" /> {currentUser.disciplineRecords?.length || 0} vi phạm
            </span>
            <span className="text-[10px] text-slate-500">
              {(currentUser.disciplineRecords?.length || 0) > 0 ? 'Có ghi nhận kỷ luật' : 'Lịch sử sạch 100%'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#131E30] border border-slate-800">
            <span className="text-slate-400 block text-[10px] mb-1">Đặc quyền sinh viên:</span>
            <span className="font-extrabold text-[#00E5FF] text-xs block">Vay SOS 500.000đ 0%</span>
            <span className="text-[10px] text-slate-400">Ưu tiên nhận việc tốt</span>
          </div>
        </div>

        {/* Lịch Sử Kỷ Luật & Khấu Trừ Phạt (Nếu có) */}
        {currentUser.disciplineRecords && currentUser.disciplineRecords.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-black text-rose-400">
              <ShieldAlert className="w-4 h-4" />
              <span>Sổ Kỷ Luật Nền Tảng ({currentUser.disciplineRecords.length} vi phạm)</span>
            </div>
            <div className="space-y-1.5">
              {currentUser.disciplineRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/25 flex items-start justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-200 block truncate">
                      {rec.title ||
                        (rec.type === 'LATE_CANCELLATION'
                          ? 'Hủy Đơn Trễ Hạn (> 10 phút)'
                          : rec.type === 'NO_SHOW'
                          ? 'Bỏ Bom Đơn Hàng (No-Show)'
                          : 'Vi Phạm Quy Định Nền Tảng')}
                    </span>
                    <span className="text-[11px] text-slate-400 line-clamp-1">
                      Lý do: {rec.reason}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(rec.createdAt).toLocaleDateString('vi-VN')}{' '}
                      {new Date(rec.createdAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-rose-400 block text-xs">
                      -{rec.penaltyPoints} Trust
                    </span>
                    {rec.fineAmount > 0 && (
                      <span className="font-mono text-[10px] text-yellow-300 block">
                        Phạt: {formatVnd(rec.fineAmount)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ĐÁNH GIÁ & UY TÍN CỘNG ĐỒNG SINH VIÊN (COMMUNITY REVIEWS & REPUTATION) */}
      <div className="rounded-3xl bg-[#0F172A] border border-[#1E293B] p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Đánh Giá & Nhận Xét Từ Cộng Đồng
              </h3>
              <p className="text-[11px] text-slate-400">
                Xác thực minh bạch sau mỗi lần giải ngân Smart Escrow
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playNotificationSound('BUTTON_CLICK');
              setShowEloModal(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs transition flex items-center space-x-1"
          >
            <span>Viết Đánh Giá / Xem ELO &rarr;</span>
          </button>
        </div>

        {/* Rating Score Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#131E30] to-[#101A2C] border border-slate-800">
          <div className="text-center sm:text-left flex items-center space-x-3 sm:border-r border-slate-800 sm:pr-4">
            <span className="text-3xl font-black text-amber-400 font-mono">
              {currentUser.rating || 4.9}
            </span>
            <div>
              <div className="flex items-center space-x-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {currentUser.reviewCount || 18} lượt đánh giá
              </span>
            </div>
          </div>

          <div className="col-span-2 flex flex-wrap items-center gap-1.5">
            {[
              { label: '⚡ Siêu tốc đúng giờ', count: '98%' },
              { label: '🎯 Chu đáo chất lượng', count: '96%' },
              { label: '🤝 Thân thiện hòa đồng', count: '100%' },
              { label: '🛡️ Bảo chứng Escrow', count: '100%' },
            ].map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-xl bg-[#0F172A] border border-slate-700 text-slate-300 text-[11px] font-semibold flex items-center space-x-1"
              >
                <span>{tag.label}</span>
                <span className="text-emerald-400 font-bold font-mono">({tag.count})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Real Reviews List */}
        <div className="space-y-2.5">
          {(currentUser.reviews && currentUser.reviews.length > 0
            ? currentUser.reviews
            : [
                {
                  id: 'rev_1',
                  reviewerName: 'Nguyễn Hoàng Phúc',
                  reviewerSchool: 'Đại học Bách Khoa TP.HCM',
                  rating: 5,
                  comment: 'Làm bài tập C++ giải thuật rất chuẩn, có kèm chú thích rõ ràng, đúng hẹn trước 2 tiếng.',
                  tags: ['Đúng giờ ⏱️', 'Chuyên môn giỏi 🧠'],
                  createdAt: 'Hôm nay',
                  gigTitle: 'Hỗ trợ debug code bài tập lớn C++',
                },
                {
                  id: 'rev_2',
                  reviewerName: 'Trần Thảo Linh',
                  reviewerSchool: 'Đại học Tôn Đức Thắng (TDTU)',
                  rating: 5,
                  comment: 'Giao đồ ăn trưa lên tận tầng 5 phòng tự học, đồ ăn còn nóng hổi, rất lịch sự và nhiệt tình!',
                  tags: ['Giao siêu tốc 🚀', 'Thân thiện vui vẻ 😊'],
                  createdAt: 'Hôm qua',
                  gigTitle: 'Mua giúp cơm trưa căn tin TDTU',
                },
                {
                  id: 'rev_3',
                  reviewerName: 'Lê Minh Trí',
                  reviewerSchool: 'Đại học Ngoại Thương (FTU2)',
                  rating: 5,
                  comment: 'In ấn tài liệu và đóng gáy lò xo đẹp xuất sắc, giao đúng giờ tại sảnh A.',
                  tags: ['Tài liệu chuẩn 📚', 'Nhiệt tình 💯'],
                  createdAt: '2 ngày trước',
                  gigTitle: 'In ấn và photo slide bài giảng',
                },
              ]
          ).map((rev) => (
            <div
              key={rev.id}
              className="p-3.5 rounded-2xl bg-[#131E30] border border-slate-800 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-600 text-white font-bold flex items-center justify-center text-xs">
                    {rev.reviewerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-white">{rev.reviewerName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                        Đã xác minh
                      </span>
                    </div>
                    {rev.reviewerSchool && (
                      <span className="text-[10px] text-slate-400 block">{rev.reviewerSchool}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                  ))}
                  <span className="text-[10px] text-slate-400 pl-1">{rev.createdAt}</span>
                </div>
              </div>

              <p className="text-slate-300 text-[11px] leading-relaxed">
                &ldquo;{rev.comment}&rdquo;
              </p>

              {rev.tags && rev.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {rev.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CẢNH BÁO THIẾT BỊ LẠ (DEVICE FINGERPRINT) */}
      <div className="rounded-3xl bg-[#0F172A] border border-[#1E293B] p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <h3 className="font-extrabold text-sm text-white">Dấu Vân Tay Thiết Bị (Device Fingerprint)</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">ID: #fp-88234-vn</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#131E30] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Thiết bị hoạt động:</span>
            <span className="font-bold text-white font-mono">{currentUser.lastDeviceName || 'Chrome Browser / Web Container'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Vị trí IP & Mạng:</span>
            <span className="font-bold text-[#00E5FF] font-mono">{currentUser.lastLoginLocation || 'TP. Hồ Chí Minh (113.161.xx.xx)'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Trạng thái bảo vệ:</span>
            {simulatedAlert || currentUser.hasUnusualDeviceAlert ? (
              <span className="font-bold text-red-400 flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-400" /> Cảnh Báo: Thiết bị lạ vừa đăng nhập!
              </span>
            ) : (
              <span className="font-bold text-emerald-400 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> An toàn & Đã nhận diện
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-slate-400">
            Tự động bảo vệ tài khoản và gửi thông báo khi phát hiện đăng nhập từ IP lạ hoặc thiết bị mới.
          </p>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 shrink-0">
            Đang Bật Bảo Vệ
          </span>
        </div>
      </div>

      {/* Verification Level & KYC Actions */}
      <div className="rounded-3xl bg-[#0F172A] border border-[#1E293B] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#00E5FF]" />
            <span>Trung Tâm Định Danh & Xác Thực</span>
          </h3>
          <span className="text-[10px] text-slate-400">Phòng chống lừa đảo & Bùng tiền</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: CCCD NFC + Face Liveness */}
          <div className="p-4 rounded-2xl bg-[#131E30] border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-white flex items-center space-x-1.5">
                  <SmartphoneNfc className="w-4 h-4 text-[#00E5FF]" />
                  <span>Xác thực CCCD Gắn Chip (NFC)</span>
                </span>
                {currentUser.isNfcVerified ? (
                  <span className="text-emerald-400 font-bold flex items-center text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" /> Đã quét chip
                  </span>
                ) : (
                  <span className="text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px]">
                    Chưa quét
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Quét chip NFC trên căn cước và xác thực khuôn mặt AI (Face Liveness) để mở khóa hạn mức kèo không giới
                hạn.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                id="verify-nfc-btn"
                onClick={onOpenNfcDialog}
                className="py-2 px-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-600 dark:text-sky-400 font-bold text-xs transition active:scale-[0.98] truncate"
              >
                {currentUser.isNfcVerified ? 'Xem Thẻ NFC' : 'Quét NFC CCCD'}
              </button>
              <button
                id="verify-face-btn"
                onClick={onOpenFaceDialog || onOpenNfcDialog}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs transition active:scale-[0.98] truncate border ${
                  currentUser.isFaceLivenessPassed
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-gradient-to-r from-sky-500 to-emerald-500 text-white shadow-sm border-transparent'
                }`}
              >
                {currentUser.isFaceLivenessPassed ? 'FaceID Đã Đạt' : 'Quét Khuôn Mặt'}
              </button>
            </div>
          </div>

          {/* Card 2: Student University SSO */}
          <div className="p-4 rounded-2xl bg-[#131E30] border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-white flex items-center space-x-1.5">
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  <span>Cổng Sinh Viên Đại Học (SSO)</span>
                </span>
                {currentUser.isStudentVerified ? (
                  <span className="text-emerald-400 font-bold flex items-center text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" /> Đã liên kết
                  </span>
                ) : (
                  <span className="text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px]">
                    Chưa liên kết
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Đăng nhập Cổng đào tạo trường (.edu.vn: Bách Khoa, Tôn Đức Thắng, KHTN...) nhận huy hiệu Sinh viên & Gói
                vay SOS.
              </p>
            </div>

            <button
              id="verify-sso-btn"
              onClick={onOpenSsoDialog}
              className="mt-3 w-full py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 font-bold text-xs transition"
            >
              {currentUser.isStudentVerified ? 'Xem Thông Tin Trường' : 'Đăng Nhập Cổng Trường &rarr;'}
            </button>
          </div>
        </div>
      </div>

      {/* GIGME FOR BUSINESS */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950/30 to-[#0F172A] border border-amber-500/30 p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-extrabold text-sm text-white">GigMe For Business</h3>
              <p className="text-[11px] text-amber-300/80">Dành cho Quán cafe, Shop online, Doanh nghiệp tuyển quân</p>
            </div>
          </div>
          {currentUser.isBusinessAccount ? (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              Đã Nâng Cấp VIP
            </span>
          ) : (
            <button
              onClick={() => setShowBusinessModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-xs hover:brightness-110 shadow-md transition"
            >
              Nâng Cấp Ngay
            </button>
          )}
        </div>

        {currentUser.isBusinessAccount ? (
          <div className="p-3 rounded-2xl bg-[#131E30] border border-amber-500/20 text-xs space-y-1">
            <p className="font-bold text-white">Tên đơn vị: {currentUser.businessName || 'Doanh Nghiệp / Quán Cafe Đối Tác'}</p>
            <p className="text-slate-400 text-[11px]">Mã số thuế / GPKD: {currentUser.businessTaxId || '0319887766'}</p>
            <p className="text-emerald-400 text-[11px] font-semibold">Ưu đãi: Phí sàn giảm còn 7% • Đăng kèo ghép nhóm 10 người</p>
          </div>
        ) : (
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Hạ mức phí sàn xuống 7%, mở khóa tính năng tuyển người theo tuần / theo tháng và xuất sao kê hóa đơn đỏ đối soát cuối tháng.
          </p>
        )}
      </div>

      {/* Skills Profile Tags */}
      <div className="rounded-3xl bg-[#0F172A] border border-[#1E293B] p-6 shadow-xl space-y-3">
        <h3 className="text-sm font-extrabold text-white flex items-center space-x-1.5">
          <Award className="w-4 h-4 text-[#FF6B00]" />
          <span>Thẻ Kỹ Năng & Lĩnh Vực Nhận Việc</span>
        </h3>
        <p className="text-slate-400 text-[11px]">
          Các kỹ năng này giúp AI Smart Match gợi ý công việc quanh bạn có độ tương thích cao &gt;90%.
        </p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#131E30] border border-slate-700 text-slate-200 text-xs font-semibold"
            >
              <span>{skill}</span>
              <button
                onClick={() => handleRemoveSkill(skill)}
                className="text-slate-400 hover:text-red-400 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <form onSubmit={handleAddSkill} className="flex gap-2 pt-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white text-xs placeholder:text-slate-500"
            placeholder="Thêm kỹ năng mới (VD: Thiết kế Canva, Lập trình C++...)"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-[#00E5FF] text-black font-extrabold text-xs hover:brightness-110 flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm</span>
          </button>
        </form>
      </div>

      {/* Security & Account Settings */}
      <div className="rounded-3xl bg-[#0F172A] border border-[#1E293B] p-6 shadow-xl space-y-2">
        <h3 className="text-sm font-extrabold text-white mb-2">Bảo Mật & Tiện Ích Ứng Dụng</h3>

        {/* BIOMETRICS SWITCH */}
        <div className="w-full p-3 rounded-2xl bg-[#131E30] border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Fingerprint className="w-4 h-4 text-[#00E5FF]" />
            <div>
              <h4 className="font-bold text-white text-xs">Xác Thực Sinh Trắc Học (Vân Tay / FaceID)</h4>
              <p className="text-[10px] text-slate-400">Ký duyệt giao dịch tài chính & rút tiền siêu tốc</p>
            </div>
          </div>
          <button
            onClick={() => toggleBiometrics(!currentUser.isBiometricsEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              currentUser.isBiometricsEnabled ? 'bg-[#00E5FF]' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                currentUser.isBiometricsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* SOUND CUSTOMIZATION */}
        <button
          onClick={() => setShowSoundModal(true)}
          className="w-full p-3 rounded-2xl bg-[#131E30] hover:bg-slate-800 border border-slate-800 flex items-center justify-between transition text-left"
        >
          <div className="flex items-center space-x-3">
            <Volume2 className="w-4 h-4 text-yellow-400" />
            <div>
              <h4 className="font-bold text-white text-xs">Tùy Biến Âm Thanh Thông Báo ("Đing! 🔔")</h4>
              <p className="text-[10px] text-slate-400">
                {currentUser.notificationSound === 'CASH_COUNT'
                  ? 'Đếm tiền sột soạt'
                  : currentUser.notificationSound === 'BANK_TING'
                  ? 'Ting ting ngân hàng'
                  : 'Đing chuông mặc định'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* THEME TOGGLE (LIGHT / DARK) */}
        <div className="w-full p-3 rounded-2xl bg-[#131E30] border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-yellow-400" />}
            <div>
              <h4 className="font-bold text-white text-xs">Giao Diện Dynamic Light / Dark Mode</h4>
              <p className="text-[10px] text-slate-400">{isDarkMode ? 'Đang bật Cyber Neon Dark' : 'Đang bật Light Mode'}</p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700"
          >
            {isDarkMode ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>

        {/* PIN CHANGE */}
        <button
          onClick={() => setShowPinModal(true)}
          className="w-full p-3 rounded-2xl bg-[#131E30] hover:bg-slate-800 border border-slate-800 flex items-center justify-between transition text-left"
        >
          <div className="flex items-center space-x-3">
            <KeyRound className="w-4 h-4 text-[#00E5FF]" />
            <div>
              <h4 className="font-bold text-white text-xs">Đổi Mã PIN Rút Tiền & Escrow</h4>
              <p className="text-[10px] text-slate-400">Bảo mật giao dịch rút tiền & xác thực Escrow</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* Master Admin Panel Entry */}
        {isSuperAdmin && (
          <button
            id="admin-dashboard-link-btn"
            onClick={onOpenAdminDashboard}
            className="w-full p-3 rounded-2xl bg-red-950/40 hover:bg-red-950/60 border border-red-500/40 flex items-center justify-between transition text-left"
          >
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <div>
                <h4 className="font-extrabold text-red-300 text-xs">Bảng Điều Khiển Quản Trị Tối Cao (Admin)</h4>
                <p className="text-[10px] text-red-400/80">Quản lý quỹ Escrow, trọng tài khiếu nại, duyệt KYC</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-red-500 text-white font-bold">Quản Trị</span>
          </button>
        )}

        <button
          onClick={logout}
          className="w-full p-3 rounded-2xl bg-[#131E30] hover:bg-red-950/30 border border-slate-800 hover:border-red-500/40 flex items-center justify-between transition text-left text-red-400"
        >
          <div className="flex items-center space-x-3">
            <LogOut className="w-4 h-4" />
            <span className="font-extrabold text-xs">Đăng Xuất Khỏi Thiết Bị</span>
          </div>
        </button>
      </div>

      {/* CHANGE PIN MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 text-white shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm flex items-center space-x-1.5 text-[#00E5FF]">
                <KeyRound className="w-4 h-4" />
                <span>Đổi Mã PIN Ví Bảo Mật 6 Số</span>
              </h3>
              <button onClick={() => setShowPinModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePinSubmit} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Mã PIN hiện tại</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono tracking-widest text-center text-sm font-bold"
                  placeholder="******"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Mã PIN 6 số mới</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono tracking-widest text-center text-sm font-bold"
                  placeholder="******"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#00E5FF] text-black font-extrabold text-sm hover:brightness-110 shadow-lg shadow-cyan-500/20 transition"
              >
                Cập Nhật Mã PIN
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SOUND SETTINGS DIALOG */}
      <SoundSettingsDialog isOpen={showSoundModal} onClose={() => setShowSoundModal(false)} />

      {/* BUSINESS UPGRADE DIALOG */}
      <BusinessUpgradeDialog isOpen={showBusinessModal} onClose={() => setShowBusinessModal(false)} />

      {/* AVATAR PICKER MODAL */}
      <AvatarPickerModal isOpen={showAvatarModal} onClose={() => setShowAvatarModal(false)} />

      {/* STUDENT ELO & TRUST BADGES MODAL */}
      <StudentEloModal isOpen={showEloModal} onClose={() => setShowEloModal(false)} />
    </div>
  );
};

