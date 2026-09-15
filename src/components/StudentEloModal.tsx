import React, { useState } from 'react';
import {
  Award,
  Star,
  ShieldCheck,
  TrendingUp,
  Zap,
  Flame,
  CheckCircle2,
  Lock,
  X,
  Sparkles,
  ChevronRight,
  Send,
  User,
  Heart,
  HelpCircle,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { GigEntity } from '../types';
import { playNotificationSound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface StudentEloModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetGigId?: string;
  targetUserName?: string;
}

interface EloTierInfo {
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'CHALLENGER';
  nameVi: string;
  minElo: number;
  maxElo: number;
  color: string;
  bgGradient: string;
  perks: string[];
}

const ELO_TIERS: EloTierInfo[] = [
  {
    tier: 'BRONZE',
    nameVi: 'Tân Binh Đồng (Khởi Đầu)',
    minElo: 0,
    maxElo: 299,
    color: 'text-amber-700',
    bgGradient: 'from-amber-900/30 to-amber-700/20',
    perks: ['Nhận việc cơ bản', 'Phí nền tảng tiêu chuẩn 8%', 'Escrow bảo chứng 100%'],
  },
  {
    tier: 'SILVER',
    nameVi: 'Bạc Đáng Tin',
    minElo: 300,
    maxElo: 699,
    color: 'text-slate-300',
    bgGradient: 'from-slate-700/30 to-slate-500/20',
    perks: ['Huy hiệu Bạc trên hồ sơ', 'Phí nền tảng giảm còn 7%', 'Hạn mức nhận 2 việc cùng lúc'],
  },
  {
    tier: 'GOLD',
    nameVi: 'Vàng Tín Nhiệm',
    minElo: 700,
    maxElo: 1199,
    color: 'text-yellow-400',
    bgGradient: 'from-yellow-600/30 to-amber-500/20',
    perks: ['Ưu tiên thấy kèo trước 15 giây', 'Phí sàn ưu đãi 5%', 'Mở khóa nhận đơn trên 500k'],
  },
  {
    tier: 'PLATINUM',
    nameVi: 'Bạch Kim Chuyên Gia',
    minElo: 1200,
    maxElo: 1799,
    color: 'text-cyan-400',
    bgGradient: 'from-cyan-600/30 to-blue-500/20',
    perks: ['Ưu tiên thấy kèo trước 30 giây', 'Huy hiệu Viền Sao Bạch Kim', 'Được mời phòng đấu giá VIP'],
  },
  {
    tier: 'DIAMOND',
    nameVi: 'Kim Cương Campus',
    minElo: 1800,
    maxElo: 2499,
    color: 'text-purple-400',
    bgGradient: 'from-purple-600/30 to-pink-500/20',
    perks: ['Phí nền tảng chỉ 3%', 'Hạn mức cọc rút tức thì 0s', 'Đại sứ sinh viên trường'],
  },
  {
    tier: 'CHALLENGER',
    nameVi: 'Thách Đấu Huyền Thoại',
    minElo: 2500,
    maxElo: 5000,
    color: 'text-rose-400',
    bgGradient: 'from-rose-600/30 to-orange-500/20',
    perks: ['Miễn phí hoàn toàn 0% phí sàn', 'Ghim Top 1 vĩnh viễn trên Radar', 'Cúp vinh danh Campus'],
  },
];

const ALL_STUDENT_BADGES = [
  {
    id: 'b1',
    title: '🚀 Thần Tốc Campus',
    desc: 'Bàn giao sản phẩm hoặc hoàn thành dưới 30 phút',
    icon: '🚀',
    condition: 'Có 3 đơn giao siêu tốc',
  },
  {
    id: 'b2',
    title: '💎 Chuỗi 5 Sao Uy Tín',
    desc: 'Đạt chuỗi 5 đánh giá 5 sao liên tiếp không tranh chấp',
    icon: '💎',
    condition: 'Win Streak >= 5',
  },
  {
    id: 'b3',
    title: '🛡️ Sinh Viên Tín Nhiệm',
    desc: 'Đã xác thực CCCD gắn chip NFC & Cổng sinh viên',
    icon: '🛡️',
    condition: 'KYC Cấp 2 Verified',
  },
  {
    id: 'b4',
    title: '📚 Học Bá Campus',
    desc: 'Chuyên gia gia sư, làm đồ án & giải bài tập xuất sắc',
    icon: '📚',
    condition: 'Hoàn thành 5 đơn Học tập',
  },
  {
    id: 'b5',
    title: '🌙 Hiệp Sĩ SafeWalk',
    desc: 'Tích cực tham gia bảo vệ an toàn sinh viên ban đêm',
    icon: '🌙',
    condition: 'Hoàn thành 2 lộ trình SafeWalk',
  },
  {
    id: 'b6',
    title: '👑 Kim Cương Học Bá',
    desc: 'Đạt mốc 2000+ điểm ELO tín nhiệm trên hệ thống',
    icon: '👑',
    condition: 'ELO >= 2000',
  },
  {
    id: 'b7',
    title: '🛒 Chiến Thần Flea Market',
    desc: 'Hoàn tất 3 giao dịch thanh lý đồ cũ ký quỹ an toàn',
    icon: '🛒',
    condition: '3 đơn Thanh Lý Đồ Cũ',
  },
  {
    id: 'b8',
    title: '🏛️ Cựu Binh Ký Túc Xá',
    desc: 'Thành viên năng nổ tại cụm KTX và được cư dân xác thực',
    icon: '🏛️',
    condition: '5 giao dịch tại KTX',
  },
];

export const StudentEloModal: React.FC<StudentEloModalProps> = ({
  isOpen,
  onClose,
  targetGigId,
  targetUserName,
}) => {
  const { currentUser, rateGigAndElo, filteredGigs } = useGigMe();

  const [activeTab, setActiveTab] = useState<'MY_ELO' | 'RATE_PARTNER'>('MY_ELO');

  // Rating Form States
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Giao siêu tốc 🚀',
    'Đúng giờ ⏱️',
    'Nhiệt tình 💯',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentElo = currentUser?.eloRating ?? 0;
  const currentStreak = currentUser?.winStreak ?? 0;
  const userBadges = currentUser?.studentBadges || [];

  // Current tier calculation
  const currentTierInfo =
    ELO_TIERS.find((t) => currentElo >= t.minElo && currentElo <= t.maxElo) || ELO_TIERS[0];
  const nextTierInfo = ELO_TIERS[ELO_TIERS.indexOf(currentTierInfo) + 1] || null;

  const progressPercent = nextTierInfo
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((currentElo - currentTierInfo.minElo) /
              (nextTierInfo.minElo - currentTierInfo.minElo)) *
              100
          )
        )
      )
    : 100;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleRateSubmit = () => {
    if (!targetGigId) {
      // Find a completed gig or use the first available gig
      const availableGig = filteredGigs.find((g: GigEntity) => g.status === 'COMPLETED' || g.status === 'IN_PROGRESS') || filteredGigs[0];
      if (availableGig) {
        setIsSubmitting(true);
        setTimeout(() => {
          rateGigAndElo(availableGig.id, selectedRating, reviewText || 'Dịch vụ tuyệt vời, uy tín 5 sao!', selectedTags);
          setIsSubmitting(false);
          setActiveTab('MY_ELO');
        }, 600);
      }
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      rateGigAndElo(targetGigId, selectedRating, reviewText || 'Dịch vụ tuyệt vời, uy tín 5 sao!', selectedTags);
      setIsSubmitting(false);
      setActiveTab('MY_ELO');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-500/30 overflow-hidden my-4 text-slate-900 dark:text-white">
        {/* Header với phong cách ELO Gaming & vinh danh học đường */}
        <div className="bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30">
              <Award className="w-6 h-6 text-yellow-100 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black tracking-tight">Hệ Thống ELO Tín Nhiệm Sinh Viên</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/25 text-white font-extrabold uppercase">
                  Chuẩn Campus
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                Chấm điểm uy tín, chuỗi thắng 5 sao & quyền lợi thứ hạng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-1.5">
          <button
            onClick={() => setActiveTab('MY_ELO')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition ${
              activeTab === 'MY_ELO'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Hồ Sơ ELO & Huy Hiệu Của Bạn
          </button>
          <button
            onClick={() => setActiveTab('RATE_PARTNER')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition ${
              activeTab === 'RATE_PARTNER'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Chấm Điểm & Đánh Giá Đối Tác
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {activeTab === 'MY_ELO' ? (
            <>
              {/* ELO Card Hero */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#121A2A] to-[#0A101C] border border-amber-500/40 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Award className="w-48 h-48 text-amber-400" />
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        Thứ hạng hiện tại
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[10px] border border-amber-500/30">
                        {currentTierInfo.nameVi}
                      </span>
                    </div>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-4xl font-black tracking-tight text-white">
                        {currentElo}
                      </span>
                      <span className="text-sm font-bold text-slate-400">Điểm ELO</span>
                      <div className="flex items-center space-x-1 text-emerald-400 text-xs font-bold pl-2">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>+35 tuần này</span>
                      </div>
                    </div>
                  </div>

                  {/* Win Streak Box */}
                  <div className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                    <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white">
                      <Flame className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <div className="text-[10px] text-amber-300 font-bold uppercase">
                        Chuỗi Thắng 5 Sao
                      </div>
                      <div className="text-lg font-black text-white">
                        {currentStreak} Đơn Liên Tiếp
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar to next tier */}
                {nextTierInfo && (
                  <div className="mt-5 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-300">
                        Tiến độ lên {nextTierInfo.nameVi} ({nextTierInfo.minElo} ELO)
                      </span>
                      <span className="text-amber-400">
                        Còn {nextTierInfo.minElo - currentElo} ELO nữa
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Campus Trust Index & Key Metrics */}
              <div className="p-4 rounded-3xl bg-[#0B1322] border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-xl bg-cyan-500/20 text-[#00E5FF]">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Chỉ Số Tín Nhiệm Campus (Trust Index)</h5>
                      <p className="text-[10px] text-slate-400">Được bảo chứng bởi thuật toán phân tích ELO & Escrow</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      playNotificationSound('LEVEL_UP');
                      confetti({
                        particleCount: 40,
                        spread: 60,
                        origin: { y: 0.7 },
                      });
                    }}
                    className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center space-x-1 transition"
                  >
                    <span>⭐ Âm Hưởng ELO</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-[#101A2C] border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Trust Score</span>
                    <span className="font-extrabold text-[#00E5FF] font-mono text-sm">98.8%</span>
                    <span className="text-[9px] text-emerald-400 block">Rất Uy Tín</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#101A2C] border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Đúng Hạn</span>
                    <span className="font-extrabold text-emerald-400 font-mono text-sm">99.4%</span>
                    <span className="text-[9px] text-slate-400 block">Tốc độ chuẩn</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#101A2C] border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Bảo Chứng</span>
                    <span className="font-extrabold text-purple-400 font-mono text-sm">100%</span>
                    <span className="text-[9px] text-purple-300 block">Smart Escrow</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#101A2C] border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Đánh Giá TB</span>
                    <span className="font-extrabold text-yellow-400 font-mono text-sm">4.96 ⭐</span>
                    <span className="text-[9px] text-slate-400 block">Sinh viên bình chọn</span>
                  </div>
                </div>
              </div>

              {/* Active Perks of Current Tier */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <h5 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Đặc quyền hạng {currentTierInfo.nameVi}:</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {currentTierInfo.perks.map((perk, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges Showcase */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span>Bộ Sưu Tập Huy Hiệu Sinh Viên ({userBadges.length}/{ALL_STUDENT_BADGES.length})</span>
                  </h5>
                  <span className="text-[11px] text-amber-500 font-bold">Tự động mở khóa</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ALL_STUDENT_BADGES.map((b) => {
                    const isUnlocked = userBadges.some((ub) => ub.includes(b.title.replace(/[^a-zA-Z0-9À-ỹ ]/g, '').trim()));
                    return (
                      <div
                        key={b.id}
                        className={`p-3 rounded-2xl border transition-all flex items-start space-x-3 ${
                          isUnlocked
                            ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/40 shadow-sm'
                            : 'bg-slate-100/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="text-2xl p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                          {b.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h6 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                              {b.title}
                            </h6>
                            {isUnlocked ? (
                              <span className="text-[10px] font-extrabold text-emerald-500 flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Đã đạt</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1">
                                <Lock className="w-3 h-3" />
                                <span>Khóa</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {b.desc}
                          </p>
                          <span className="inline-block mt-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                            Điều kiện: {b.condition}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Rating & Review Form */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-500/30 text-xs text-slate-700 dark:text-amber-200">
                <div className="flex items-center space-x-2 font-bold mb-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Đánh giá tín nhiệm công việc sau khi hoàn thành:</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Mỗi đánh giá 5 sao sẽ cộng ngay <span className="font-bold text-emerald-500">+25 ELO</span> cho đối tác và kích hoạt chuỗi thắng (Win Streak).
                </p>
              </div>

              {/* Star Rating Selector */}
              <div className="text-center py-3 space-y-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Mức độ hài lòng:
                </span>
                <div className="flex items-center justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= selectedRating
                            ? 'text-amber-400 fill-amber-400 filter drop-shadow'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-xs font-black text-amber-500">
                  {selectedRating === 5 && '🌟 Tuyệt vời! Uy tín 5 sao (+25 ELO + Thưởng Chuỗi Thắng)'}
                  {selectedRating === 4 && '👍 Rất tốt (+15 ELO)'}
                  {selectedRating === 3 && '👌 Bình thường (+5 ELO)'}
                  {selectedRating === 2 && '⚠️ Cần cải thiện (-10 ELO)'}
                  {selectedRating === 1 && '❌ Không đạt yêu cầu (-25 ELO)'}
                </div>
              </div>

              {/* Quick Tag Badges */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Gắn nhãn khen ngợi vinh danh:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Giao siêu tốc 🚀',
                    'Đúng giờ ⏱️',
                    'Nhiệt tình 💯',
                    'Tài liệu chuẩn 📚',
                    'Thân thiện vui vẻ 😊',
                    'Chuyên môn giỏi 🧠',
                    'Bảo vệ SafeWalk 🌙',
                  ].map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Written Review */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Nhận xét chi tiết (tùy chọn):
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm làm việc cùng bạn này..."
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500 outline-none h-24"
                />
              </div>

              {/* Submit Rating Action */}
              <button
                type="button"
                onClick={handleRateSubmit}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang cập nhật ELO...' : 'Gửi Đánh Giá & Thưởng Điểm ELO Ngay'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Hệ thống tính điểm ELO theo chuẩn Elo Rating System quốc tế
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Đóng Lại
          </button>
        </div>
      </div>
    </div>
  );
};
