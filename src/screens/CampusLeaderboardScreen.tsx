import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Award,
  Medal,
  Star,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  AlertCircle,
  Search,
  ArrowRight,
  Info,
  Sparkles,
  DollarSign,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { formatVnd, CampusLeaderboardEntry } from '../types';

export const CampusLeaderboardScreen: React.FC<{
  onSelectFreelancer?: (name: string) => void;
  onBack?: () => void;
}> = ({ onSelectFreelancer, onBack }) => {
  const { users, rawGigs, currentUser, showNotification } = useGigMe();
  const [selectedCampus, setSelectedCampus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  // Tháng và năm hiện tại của bảng xếp hạng
  const currentMonthYear = useMemo(() => {
    const now = new Date();
    return `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
  }, []);

  const CAMPUS_OPTIONS = [
    { id: 'ALL', name: 'Tất cả Campus' },
    { id: 'TDTU', name: 'ĐH Tôn Đức Thắng (TDTU)' },
    { id: 'HCMUT', name: 'ĐH Bách Khoa (HCMUT)' },
    { id: 'UEH', name: 'ĐH Kinh Tế TP.HCM (UEH)' },
    { id: 'UIT', name: 'ĐH Công Nghệ Thông Tin (UIT)' },
    { id: 'HUST', name: 'ĐH Bách Khoa Hà Nội' },
  ];

  // Tính toán bảng xếp hạng tháng từ dữ liệu thật
  const realLeaderboard: CampusLeaderboardEntry[] = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // Lọc các tài khoản sinh viên hợp lệ (không phải Admin hệ thống)
    const qualifiedUsers = (users || [])
      .filter((u) => u.role !== 'ADMIN' && u.id !== '000000000')
      .map((u) => {
        // 1. Số việc làm hoàn thành trong tháng từ rawGigs hoặc u.completedGigs
        const monthGigsCount = (rawGigs || []).filter(
          (g) => g.freelancerId === u.id && g.status === 'COMPLETED' && (!g.createdAt || g.createdAt >= startOfMonth)
        ).length;
        const completedGigsInMonth = Math.max(monthGigsCount, u.completedGigs || 0);

        // 2. Tuổi tài khoản tính theo ngày
        // Nếu user có createdAt thì tính chính xác, nếu chưa có thì tính từ ngày tham gia mặc định
        const accountCreatedTimestamp = u.createdAt || (Date.now() - 30 * 24 * 60 * 60 * 1000);
        const accountAgeDays = Math.max(1, Math.floor((Date.now() - accountCreatedTimestamp) / (24 * 60 * 60 * 1000)));

        // Điều kiện 1: Tài khoản tạo trên 3 tuần (> 21 ngày)
        const isAccountOlderThan3Weeks = accountAgeDays >= 21;

        // Điều kiện 2: Đã làm ít nhất 3 việc trong tháng đó (>= 3 việc)
        const hasCompletedAtLeast3GigsInMonth = completedGigsInMonth >= 3;

        return {
          user: u,
          completedGigsInMonth,
          accountAgeDays,
          isAccountOlderThan3Weeks,
          hasCompletedAtLeast3GigsInMonth,
        };
      })
      .filter((item) => item.completedGigsInMonth > 0 || (item.user.completedGigs || 0) > 0)
      // Sắp xếp theo số việc hoàn thành trong tháng giảm dần, sau đó theo điểm tín nhiệm
      .sort((a, b) => b.completedGigsInMonth - a.completedGigsInMonth || (b.user.trustScore || 0) - (a.user.trustScore || 0));

    return qualifiedUsers.map((item, idx) => {
      const rank = idx + 1;
      // Điều kiện 3: Đứng trong top 3
      const isInTop3 = rank <= 3;

      // Phải đủ CẢ 3 ĐIỀU KIỆN mới nhận được tiền thưởng
      const isPrizeEligible = item.isAccountOlderThan3Weeks && item.hasCompletedAtLeast3GigsInMonth && isInTop3;

      // Cơ cấu giải thưởng: Giải nhất: 20.000đ, Nhì: 10.000đ, Ba: 5.000đ
      let prizeAmount = 0;
      if (rank === 1) prizeAmount = 20000;
      else if (rank === 2) prizeAmount = 10000;
      else if (rank === 3) prizeAmount = 5000;

      return {
        rank,
        userId: item.user.id,
        name: item.user.name,
        school: item.user.studentSchool || 'Đại học tại TP.HCM',
        avatarUrl: item.user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.user.id}`,
        completedGigs: item.user.completedGigs || item.completedGigsInMonth,
        completedGigsInMonth: item.completedGigsInMonth,
        accountAgeDays: item.accountAgeDays,
        isAccountOlderThan3Weeks: item.isAccountOlderThan3Weeks,
        hasCompletedAtLeast3GigsInMonth: item.hasCompletedAtLeast3GigsInMonth,
        isInTop3,
        isPrizeEligible,
        prizeAmount,
        trustScore: item.user.trustScore || 720,
        rating: item.user.rating || 5.0,
        onTimeRate: item.user.onTimeRate || 100,
        totalEarned: item.user.walletBalance || 0,
        specialBadge: item.user.badges || 'Trợ thủ Campus',
        recentGigTitle: 'Nhiệm vụ sinh viên hoàn tất',
      };
    });
  }, [users, rawGigs]);

  const filteredLeaders = realLeaderboard.filter((entry) => {
    const matchCampus =
      selectedCampus === 'ALL' ||
      entry.school.toLowerCase().includes(selectedCampus.toLowerCase());
    const matchSearch =
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.specialBadge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.userId.includes(searchQuery);
    return matchCampus && matchSearch;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28 text-slate-100 space-y-6 animate-fade-in">
      {/* Header Banner Bảng Xếp Hạng Hàng Tháng */}
      <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/25 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#3064AE] via-[#C5E5EC] to-[#E0FAEB]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#3064AE]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#3064AE]/20 border border-[#C5E5EC]/30 text-[#C5E5EC] text-xs font-bold">
              <Trophy className="w-4 h-4 text-[#E0FAEB]" />
              <span>Bảng Xếp Hạng Tính Theo Hàng Tháng • {currentMonthYear}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Top Trợ Thủ Campus
            </h1>
            <p className="text-xs text-[#C5E5EC]/80 max-w-lg leading-relaxed">
              Vinh danh những sinh viên hỗ trợ tích cực và uy tín nhất campus. Giải thưởng được tự động quyết toán vào ví GigMe mỗi cuối tháng khi thỏa đủ cả 3 điều kiện.
            </p>

            <button
              onClick={() => setShowRulesModal(true)}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#E0FAEB] hover:text-white bg-[#12233B] px-3 py-1.5 rounded-xl border border-[#E0FAEB]/30 transition cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#E0FAEB]" />
              <span>Xem 3 Điều Kiện Nhận Tiền Thưởng</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Monthly Prize Pool Structure */}
          <div className="p-4 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/30 text-center shrink-0 shadow-md w-full sm:w-auto space-y-2">
            <span className="text-[11px] text-[#C5E5EC] font-bold block uppercase tracking-wider">
              Cơ Cấu Giải Thưởng {currentMonthYear}
            </span>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 rounded-xl bg-[#0A1424] border border-[#E0FAEB]/30">
                <span className="text-[10px] text-amber-400 font-bold block">🥇 Giải Nhất</span>
                <span className="text-base font-black text-[#E0FAEB] font-mono">20.000đ</span>
              </div>
              <div className="p-2 rounded-xl bg-[#0A1424] border border-[#C5E5EC]/25">
                <span className="text-[10px] text-slate-300 font-bold block">🥈 Giải Nhì</span>
                <span className="text-base font-black text-white font-mono">10.000đ</span>
              </div>
              <div className="p-2 rounded-xl bg-[#0A1424] border border-[#C5E5EC]/20">
                <span className="text-[10px] text-amber-600 font-bold block">🥉 Giải Ba</span>
                <span className="text-base font-black text-amber-300 font-mono">5.000đ</span>
              </div>
            </div>
            <p className="text-[10px] text-[#C5E5EC]/70 italic">
              * Yêu cầu đủ 3 điều kiện: Tạo &gt; 3 tuần + &ge; 3 việc/tháng + Top 3
            </p>
          </div>
        </div>
      </div>

      {/* 3 Conditions Banner */}
      <div className="p-4 rounded-2xl bg-[#0F1E33] border border-[#C5E5EC]/20 text-xs space-y-2">
        <div className="flex items-center space-x-2 text-white font-bold">
          <ShieldCheck className="w-4 h-4 text-[#E0FAEB]" />
          <span>3 Điều Kiện Bắt Buộc Để Nhận Tiền Thưởng Campus:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-2.5 rounded-xl bg-[#09121F] border border-[#C5E5EC]/15 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-[#C5E5EC]">
              <Clock className="w-3.5 h-3.5 text-[#E0FAEB]" />
              <span>1. Tuổi Tài Khoản</span>
            </div>
            <p className="text-[11px] text-[#C5E5EC]/80">Tài khoản tạo <strong>trên 3 tuần</strong> (&gt; 21 ngày hoạt động liên tục).</p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#09121F] border border-[#C5E5EC]/15 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-[#C5E5EC]">
              <Briefcase className="w-3.5 h-3.5 text-[#E0FAEB]" />
              <span>2. Việc Làm Tháng Này</span>
            </div>
            <p className="text-[11px] text-[#C5E5EC]/80">Đã làm <strong>ít nhất 3 việc</strong> được nghiệm thu trong tháng {currentMonthYear}.</p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#09121F] border border-[#C5E5EC]/15 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-[#C5E5EC]">
              <Trophy className="w-3.5 h-3.5 text-[#E0FAEB]" />
              <span>3. Vị Trí Xếp Hạng</span>
            </div>
            <p className="text-[11px] text-[#C5E5EC]/80">Đứng trong <strong>Top 3</strong> bảng xếp hạng campus của tháng.</p>
          </div>
        </div>
        <p className="text-[11px] text-amber-300 font-medium flex items-center space-x-1 pt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Lưu ý: Phải thỏa mãn <strong>đủ cả 3 điều kiện</strong> trên mới nhận được tiền thưởng về ví!</span>
        </p>
      </div>

      {/* Podium Top 3 Cards */}
      {filteredLeaders.length >= 3 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top 2: Silver (10.000đ) */}
          <div className="order-2 md:order-1 rounded-3xl bg-[#12233B] border border-[#C5E5EC]/20 p-5 text-center shadow-md space-y-3 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-[#0E1B2E] border border-[#C5E5EC]/30 text-[#C5E5EC] text-[10px] font-black">
              HẠNG 2 🥈
            </div>
            <div className="pt-4">
              <img
                src={filteredLeaders[1].avatarUrl}
                alt={filteredLeaders[1].name}
                className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-[#C5E5EC]/50 shadow-sm"
              />
              <h3 className="font-extrabold text-base text-white mt-2">{filteredLeaders[1].name}</h3>
              <p className="text-xs text-[#C5E5EC]/70">{filteredLeaders[1].school}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-[#3064AE]/30 text-[#C5E5EC] font-bold text-[10px] border border-[#C5E5EC]/25">
                {filteredLeaders[1].specialBadge}
              </span>
            </div>

            {/* Checklist 3 điều kiện */}
            <div className="p-3 rounded-xl bg-[#0E1B2E] border border-[#C5E5EC]/15 text-xs space-y-1.5 text-left">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#C5E5EC]/70">1. Tuổi TK &gt; 3 tuần:</span>
                <span className={`font-bold flex items-center space-x-1 ${filteredLeaders[1].isAccountOlderThan3Weeks ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {filteredLeaders[1].isAccountOlderThan3Weeks ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>{filteredLeaders[1].accountAgeDays} ngày</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#C5E5EC]/70">2. Việc tháng &ge; 3:</span>
                <span className={`font-bold flex items-center space-x-1 ${filteredLeaders[1].hasCompletedAtLeast3GigsInMonth ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {filteredLeaders[1].hasCompletedAtLeast3GigsInMonth ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>{filteredLeaders[1].completedGigsInMonth} việc</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#C5E5EC]/70">3. Đứng Top 3:</span>
                <span className="font-bold text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Hạng 2</span>
                </span>
              </div>

              {/* Trạng thái tiền thưởng */}
              <div className="border-t border-[#C5E5EC]/15 pt-2 flex items-center justify-between">
                <span className="text-white font-bold text-xs">Giải Nhì:</span>
                <span className="font-black text-[#E0FAEB] font-mono text-sm">10.000đ</span>
              </div>
              <div className="text-center pt-0.5">
                {filteredLeaders[1].isPrizeEligible ? (
                  <span className="inline-block w-full py-1 rounded-lg bg-emerald-500/20 text-[#E0FAEB] text-[10px] font-extrabold border border-emerald-500/30">
                    ✓ ĐỦ 3 ĐIỀU KIỆN NHẬN TIỀN
                  </span>
                ) : (
                  <span className="inline-block w-full py-1 rounded-lg bg-rose-500/20 text-rose-300 text-[10px] font-semibold border border-rose-500/30">
                    Chưa đủ 3 điều kiện
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Top 1: Gold Champion (20.000đ) */}
          <div className="order-1 md:order-2 rounded-3xl bg-gradient-to-b from-[#162C4E] via-[#12233B] to-[#0E1B2E] border-2 border-[#C5E5EC] p-6 text-center shadow-xl space-y-3 relative overflow-hidden flex flex-col justify-between transform md:-translate-y-2">
            <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-[#3064AE] border border-[#C5E5EC]/40 text-white text-xs font-black flex items-center space-x-1">
              <Trophy className="w-3.5 h-3.5 text-[#E0FAEB]" />
              <span>QUÁN QUÂN 🥇</span>
            </div>
            <div className="pt-5">
              <div className="relative inline-block">
                <img
                  src={filteredLeaders[0].avatarUrl}
                  alt={filteredLeaders[0].name}
                  className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-[#C5E5EC] shadow-lg"
                />
                <span className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#3064AE] to-[#25735B] text-white border border-[#C5E5EC]/40 font-black text-[10px] uppercase shadow-md">
                  Top 1 Campus Tháng
                </span>
              </div>
              <h3 className="font-black text-lg text-white mt-3">{filteredLeaders[0].name}</h3>
              <p className="text-xs text-[#C5E5EC] font-medium">{filteredLeaders[0].school}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-[#3064AE]/40 border border-[#C5E5EC]/30 text-[#E0FAEB] font-extrabold text-[11px]">
                👑 {filteredLeaders[0].specialBadge}
              </span>
            </div>

            {/* Checklist 3 điều kiện */}
            <div className="p-3.5 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/25 text-xs space-y-1.5 text-left">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#C5E5EC]/70">1. Tuổi TK &gt; 3 tuần:</span>
                <span className={`font-bold flex items-center space-x-1 ${filteredLeaders[0].isAccountOlderThan3Weeks ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {filteredLeaders[0].isAccountOlderThan3Weeks ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>{filteredLeaders[0].accountAgeDays} ngày</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#C5E5EC]/70">2. Việc tháng &ge; 3:</span>
                <span className={`font-bold flex items-center space-x-1 ${filteredLeaders[0].hasCompletedAtLeast3GigsInMonth ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {filteredLeaders[0].hasCompletedAtLeast3GigsInMonth ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>{filteredLeaders[0].completedGigsInMonth} việc</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#C5E5EC]/70">3. Đứng Top 3:</span>
                <span className="font-bold text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Hạng 1</span>
                </span>
              </div>

              {/* Trạng thái giải nhất */}
              <div className="border-t border-[#C5E5EC]/20 pt-2 flex items-center justify-between">
                <span className="text-white font-black text-xs">Giải Nhất Tháng:</span>
                <span className="font-black text-[#E0FAEB] font-mono text-base">20.000đ</span>
              </div>
              <div className="text-center pt-1">
                {filteredLeaders[0].isPrizeEligible ? (
                  <span className="inline-block w-full py-1.5 rounded-xl bg-emerald-500/25 text-[#E0FAEB] text-xs font-extrabold border border-emerald-500/40 shadow-xs">
                    ✓ ĐỦ 3 ĐIỀU KIỆN NHẬN 20.000đ
                  </span>
                ) : (
                  <span className="inline-block w-full py-1 rounded-lg bg-rose-500/20 text-rose-300 text-[10px] font-semibold border border-rose-500/30">
                    Chưa đủ 3 điều kiện
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Top 3: Bronze (5.000đ) */}
          <div className="order-3 rounded-3xl bg-[#12233B] border border-[#C5E5EC]/20 p-5 text-center shadow-md space-y-3 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-[#0E1B2E] border border-[#C5E5EC]/30 text-[#C5E5EC] text-[10px] font-black">
              HẠNG 3 🥉
            </div>
            <div className="pt-4">
              <img
                src={filteredLeaders[2].avatarUrl}
                alt={filteredLeaders[2].name}
                className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-[#C5E5EC]/40 shadow-sm"
              />
              <h3 className="font-extrabold text-base text-white mt-2">{filteredLeaders[2].name}</h3>
              <p className="text-xs text-[#C5E5EC]/70">{filteredLeaders[2].school}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-[#3064AE]/30 border border-[#C5E5EC]/25 text-[#C5E5EC] font-bold text-[10px]">
                {filteredLeaders[2].specialBadge}
              </span>
            </div>

            {/* Checklist 3 điều kiện */}
            <div className="p-3 rounded-xl bg-[#0E1B2E] border border-[#C5E5EC]/15 text-xs space-y-1.5 text-left">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#C5E5EC]/70">1. Tuổi TK &gt; 3 tuần:</span>
                <span className={`font-bold flex items-center space-x-1 ${filteredLeaders[2].isAccountOlderThan3Weeks ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {filteredLeaders[2].isAccountOlderThan3Weeks ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>{filteredLeaders[2].accountAgeDays} ngày</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#C5E5EC]/70">2. Việc tháng &ge; 3:</span>
                <span className={`font-bold flex items-center space-x-1 ${filteredLeaders[2].hasCompletedAtLeast3GigsInMonth ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {filteredLeaders[2].hasCompletedAtLeast3GigsInMonth ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>{filteredLeaders[2].completedGigsInMonth} việc</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#C5E5EC]/70">3. Đứng Top 3:</span>
                <span className="font-bold text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Hạng 3</span>
                </span>
              </div>

              {/* Trạng thái giải ba */}
              <div className="border-t border-[#C5E5EC]/15 pt-2 flex items-center justify-between">
                <span className="text-white font-bold text-xs">Giải Ba:</span>
                <span className="font-black text-amber-300 font-mono text-sm">5.000đ</span>
              </div>
              <div className="text-center pt-0.5">
                {filteredLeaders[2].isPrizeEligible ? (
                  <span className="inline-block w-full py-1 rounded-lg bg-emerald-500/20 text-[#E0FAEB] text-[10px] font-extrabold border border-emerald-500/30">
                    ✓ ĐỦ 3 ĐIỀU KIỆN NHẬN TIỀN
                  </span>
                ) : (
                  <span className="inline-block w-full py-1 rounded-lg bg-rose-500/20 text-rose-300 text-[10px] font-semibold border border-rose-500/30">
                    Chưa đủ 3 điều kiện
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : filteredLeaders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredLeaders.map((leader) => (
            <div
              key={leader.userId}
              className="rounded-3xl bg-[#12233B] border border-[#C5E5EC]/25 p-5 text-center shadow-md space-y-3"
            >
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#3064AE]/40 text-[#C5E5EC] border border-[#C5E5EC]/30 text-xs font-black">
                Hạng #{leader.rank} 🏆
              </div>
              <img
                src={leader.avatarUrl}
                alt={leader.name}
                className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-[#C5E5EC]/40 shadow-sm"
              />
              <h3 className="font-extrabold text-base text-white">{leader.name}</h3>
              <p className="text-xs text-[#C5E5EC]/70">{leader.school}</p>
              <div className="p-2.5 rounded-xl bg-[#0E1B2E] border border-[#C5E5EC]/15 text-xs flex justify-around">
                <div>
                  <span className="text-[#C5E5EC]/60 block text-[10px]">Việc trong tháng</span>
                  <span className="font-bold text-white">{leader.completedGigsInMonth} việc</span>
                </div>
                <div>
                  <span className="text-[#C5E5EC]/60 block text-[10px]">Tuổi tài khoản</span>
                  <span className="font-bold text-white">{leader.accountAgeDays} ngày</span>
                </div>
                <div>
                  <span className="text-[#C5E5EC]/60 block text-[10px]">Giải thưởng</span>
                  <span className="font-bold text-[#E0FAEB] font-mono">
                    {leader.prizeAmount > 0 ? `${leader.prizeAmount.toLocaleString('vi-VN')}đ` : '0đ'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-[#12233B] border border-[#C5E5EC]/20 p-10 text-center flex flex-col items-center justify-center space-y-3 shadow-md">
          <div className="w-14 h-14 rounded-2xl bg-[#3064AE]/30 border border-[#C5E5EC]/30 flex items-center justify-center text-[#C5E5EC]">
            <Trophy className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">Chưa có sinh viên trên bảng xếp hạng {currentMonthYear}</h3>
          <p className="text-xs text-[#C5E5EC]/70 max-w-md leading-relaxed">
            Bảng xếp hạng được tính toán hàng tháng từ các đơn hàng thật đã được người thuê nghiệm thu. Hãy nhận kèo quanh trường để trở thành Quán quân tháng này!
          </p>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#C5E5EC]/60 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo tên, trường, ID 9 số..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/25 text-xs text-white placeholder:text-[#C5E5EC]/40 focus:border-[#3064AE] focus:outline-none shadow-sm"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {CAMPUS_OPTIONS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCampus(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedCampus === c.id
                  ? 'bg-[#3064AE] text-white border border-[#C5E5EC]/30 shadow-sm'
                  : 'bg-[#12233B] border border-[#C5E5EC]/20 text-[#C5E5EC] hover:bg-[#162B48]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table List */}
      <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/20 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-[#C5E5EC]/15 flex items-center justify-between bg-[#12233B]/50">
          <h2 className="font-extrabold text-sm text-white flex items-center space-x-2">
            <Medal className="w-4 h-4 text-[#E0FAEB]" />
            <span>Danh Sách Trợ Thủ Tháng Này ({filteredLeaders.length} Người)</span>
          </h2>
          <span className="text-[11px] text-[#C5E5EC]/70">Quyết toán thưởng tự động 23:59 ngày cuối tháng</span>
        </div>

        <div className="divide-y divide-[#C5E5EC]/10">
          {filteredLeaders.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#C5E5EC]/60">
              Không có dữ liệu trợ thủ nào phù hợp với bộ lọc tìm kiếm.
            </div>
          ) : (
            filteredLeaders.map((entry) => (
              <div
                key={entry.userId}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#12233B] transition"
              >
                <div className="flex items-center space-x-3.5">
                  {/* Rank Badge */}
                  <div
                    className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                      entry.rank === 1
                        ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-900 shadow-md font-extrabold border border-amber-300'
                        : entry.rank === 2
                        ? 'bg-slate-300 text-slate-900 font-extrabold border border-slate-200'
                        : entry.rank === 3
                        ? 'bg-amber-700 text-white font-extrabold border border-amber-600'
                        : 'bg-[#0A1424] text-[#C5E5EC]/70 border border-[#C5E5EC]/10'
                    }`}
                  >
                    #{entry.rank}
                  </div>

                  {/* Avatar */}
                  <img
                    src={entry.avatarUrl}
                    alt={entry.name}
                    className="w-11 h-11 rounded-full object-cover border border-[#C5E5EC]/30 shrink-0"
                  />

                  {/* Details */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-extrabold text-sm text-white">{entry.name}</h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#3064AE]/30 text-[#C5E5EC] font-bold border border-[#C5E5EC]/25 font-mono">
                        ID: {entry.userId}
                      </span>
                    </div>
                    <p className="text-xs text-[#C5E5EC]/70">{entry.school}</p>

                    {/* Condition tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded flex items-center space-x-1 ${entry.isAccountOlderThan3Weeks ? 'bg-emerald-500/15 text-[#E0FAEB] border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
                        {entry.isAccountOlderThan3Weeks ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                        <span>Tuổi TK: {entry.accountAgeDays}d (&gt;21d)</span>
                      </span>

                      <span className={`px-1.5 py-0.5 rounded flex items-center space-x-1 ${entry.hasCompletedAtLeast3GigsInMonth ? 'bg-emerald-500/15 text-[#E0FAEB] border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
                        {entry.hasCompletedAtLeast3GigsInMonth ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                        <span>Tháng này: {entry.completedGigsInMonth} việc (&ge;3)</span>
                      </span>

                      {entry.isInTop3 && (
                        <span className={`px-1.5 py-0.5 rounded font-bold ${entry.isPrizeEligible ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-700 text-slate-300'}`}>
                          {entry.isPrizeEligible ? `Thưởng: +${entry.prizeAmount.toLocaleString('vi-VN')}đ` : 'Chưa đủ 3 điều kiện'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats & Actions */}
                <div className="flex items-center justify-between sm:justify-end space-x-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[#C5E5EC]/10">
                  <div className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      <span className="font-bold text-xs text-white">{entry.rating.toFixed(1)}</span>
                      <span className="text-[11px] text-[#C5E5EC]/60">({entry.completedGigs} việc)</span>
                    </div>
                    <div className="text-[11px] text-[#C5E5EC]/70 mt-0.5">
                      Tín nhiệm: <span className="text-[#C5E5EC] font-mono font-bold">{entry.trustScore}</span> • Đúng hạn:{' '}
                      <span className="text-[#E0FAEB] font-bold">{entry.onTimeRate}%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onSelectFreelancer) onSelectFreelancer(entry.name);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#3064AE] hover:bg-[#255294] text-white border border-[#C5E5EC]/30 text-xs font-bold transition flex items-center space-x-1 active:scale-95 shadow-md cursor-pointer"
                  >
                    <span>Thuê</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rules Explanation Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#0E1B2E] border border-[#C5E5EC]/30 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#C5E5EC]/20">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-[#E0FAEB]" />
                <h3 className="font-black text-white text-base">Quy Định Thưởng Top Trợ Thủ Campus</h3>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="p-1 rounded-lg text-[#C5E5EC] hover:text-white hover:bg-[#12233B] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-[#C5E5EC]/90 leading-relaxed">
              <div className="p-3 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 space-y-2">
                <p className="font-bold text-white text-sm">📅 Chu Kỳ Tính Thưởng:</p>
                <p>Bảng xếp hạng được tính <strong>theo từng tháng dương lịch</strong>. Bắt đầu từ ngày 01 đến 23:59 ngày cuối cùng của tháng.</p>
              </div>

              <div className="p-3 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 space-y-2">
                <p className="font-bold text-[#E0FAEB] text-sm">💰 Cơ Cấu Giải Thưởng Hàng Tháng:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Giải Nhất (Hạng 1):</strong> <span className="text-[#E0FAEB] font-bold font-mono">20.000đ</span></li>
                  <li><strong>Giải Nhì (Hạng 2):</strong> <span className="text-white font-bold font-mono">10.000đ</span></li>
                  <li><strong>Giải Ba (Hạng 3):</strong> <span className="text-amber-300 font-bold font-mono">5.000đ</span></li>
                </ul>
              </div>

              <div className="p-3 rounded-2xl bg-[#12233B] border-2 border-amber-400/30 space-y-2">
                <p className="font-bold text-amber-300 text-sm">🛡️ Điều Kiện Bắt Buộc Nhận Tiền (Đủ cả 3 điều kiện):</p>
                <ol className="list-decimal pl-5 space-y-1.5 font-medium">
                  <li><strong>Tài khoản tạo trên 3 tuần:</strong> Thời gian đăng ký tài khoản phải lớn hơn 21 ngày tính đến ngày xét duyệt cuối tháng.</li>
                  <li><strong>Đã làm ít nhất 3 việc trong tháng đó:</strong> Hoàn thành tối thiểu 3 công việc được nghiệm thu bởi người thuê trong tháng hiện tại.</li>
                  <li><strong>Đứng trong Top 3:</strong> Xếp hạng thứ 1, thứ 2, hoặc thứ 3 trên bảng tổng kết tháng.</li>
                </ol>
                <p className="text-[11px] text-amber-200/80 italic pt-1">
                  * Nếu tài khoản đứng Top 3 nhưng không đủ điều kiện về tuổi tài khoản hoặc số việc tối thiểu trong tháng, tiền thưởng sẽ không được giải ngân và chuyển vào quỹ tháng tiếp theo.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] to-[#25735B] text-white font-bold text-xs hover:brightness-110 shadow-md transition cursor-pointer"
            >
              Đã Hiểu Quy Định
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
