import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Medal,
  Star,
  ShieldCheck,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  Filter,
  Users,
  Search,
  ArrowRight,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { formatVnd, CampusLeaderboardEntry } from '../types';

// Dữ liệu bảng xếp hạng: Bắt đầu từ 0 và tổng hợp 100% từ việc làm thật đã hoàn thành của sinh viên
const INITIAL_CAMPUS_LEADERBOARD: CampusLeaderboardEntry[] = [];

export const CampusLeaderboardScreen: React.FC<{
  onSelectFreelancer?: (name: string) => void;
  onBack?: () => void;
}> = ({ onSelectFreelancer, onBack }) => {
  const { users } = useGigMe();
  const [selectedCampus, setSelectedCampus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const CAMPUS_OPTIONS = [
    { id: 'ALL', name: 'Tất cả Campus TP.HCM & Hà Nội' },
    { id: 'TDTU', name: 'ĐH Tôn Đức Thắng (TDTU)' },
    { id: 'HCMUT', name: 'ĐH Bách Khoa (HCMUT)' },
    { id: 'UEH', name: 'ĐH Kinh Tế TP.HCM (UEH)' },
    { id: 'UIT', name: 'ĐH Công Nghệ Thông Tin (UIT)' },
  ];

  const realLeaderboard: CampusLeaderboardEntry[] = React.useMemo(() => {
    // Chỉ xếp hạng các tài khoản thật đã hoàn thành việc làm trên hệ thống
    const qualified = users
      .filter((u) => u.role !== 'ADMIN' && u.completedGigs > 0)
      .sort((a, b) => b.completedGigs - a.completedGigs || (b.trustScore || 0) - (a.trustScore || 0));

    return qualified.map((u, idx) => ({
      rank: idx + 1,
      userId: u.id,
      name: u.name,
      school: u.studentSchool || 'Đại học tại TP.HCM',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`,
      completedGigs: u.completedGigs,
      trustScore: u.trustScore || 720,
      rating: u.rating || 5.0,
      onTimeRate: u.onTimeRate || 100,
      totalEarned: u.walletBalance || 0,
      specialBadge: u.badges || 'Thành viên mới',
      recentGigTitle: 'Nhiệm vụ sinh viên hoàn thành',
    }));
  }, [users]);

  const filteredLeaders = realLeaderboard.filter((entry) => {
    const matchCampus =
      selectedCampus === 'ALL' ||
      entry.school.toLowerCase().includes(selectedCampus.toLowerCase());
    const matchSearch =
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.specialBadge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCampus && matchSearch;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28 text-white space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#121E36] via-[#0D1527] to-[#070B14] border-2 border-[#00E5FF]/40 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Vinh Danh Trợ Thủ Campus Xuất Sắc Hàng Tuần</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Bảng Xếp Hạng Top Trợ Thủ Campus
            </h1>
            <p className="text-xs text-slate-300 max-w-lg">
              Top 3 trợ thủ có điểm tín nhiệm cao nhất & hoàn thành nhiều kèo uy tín nhất nhận thưởng tiền mặt từ Quỹ Thưởng GigMe Campus!
            </p>
          </div>

          {/* Weekly Prize Pool Pill */}
          <div className="p-4 rounded-2xl bg-[#131E30]/90 border border-amber-500/40 text-center shrink-0 shadow-lg">
            <span className="text-[10px] text-amber-300 font-bold block uppercase tracking-wider">
              Tổng Giải Thưởng Tuần Này
            </span>
            <span className="text-2xl font-black text-amber-400 font-mono">1.000.000đ</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Top 1: 500k • Top 2: 300k • Top 3: 150k</span>
          </div>
        </div>
      </div>

      {/* Podium Top Cards or Empty State */}
      {filteredLeaders.length >= 3 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top 2: Silver */}
          <div className="order-2 md:order-1 rounded-3xl bg-[#0F172A] border border-slate-700 p-5 text-center shadow-xl space-y-3 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-slate-500/20 border border-slate-400/30 text-slate-300 text-[10px] font-black">
              HẠNG 2 🥈
            </div>
            <div className="pt-4">
              <img
                src={filteredLeaders[1].avatarUrl}
                alt="Hạng 2"
                className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-slate-400 shadow-lg"
              />
              <h3 className="font-extrabold text-base text-white mt-2">{filteredLeaders[1].name}</h3>
              <p className="text-xs text-slate-400">{filteredLeaders[1].school}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold text-[10px]">
                {filteredLeaders[1].specialBadge}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#131E30] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Đơn hoàn thành:</span>
                <span className="font-bold text-white">{filteredLeaders[1].completedGigs} kèo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thưởng tuần:</span>
                <span className="font-bold text-amber-400">300.000đ</span>
              </div>
            </div>
          </div>

          {/* Top 1: Gold Champion */}
          <div className="order-1 md:order-2 rounded-3xl bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#0A0F1D] border-2 border-amber-400/60 p-6 text-center shadow-[0_0_40px_rgba(251,191,36,0.25)] space-y-3 relative overflow-hidden flex flex-col justify-between transform md:-translate-y-2">
            <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black flex items-center space-x-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>QUÁN QUÂN 🥇</span>
            </div>
            <div className="pt-5">
              <div className="relative inline-block">
                <img
                  src={filteredLeaders[0].avatarUrl}
                  alt="Quán quân"
                  className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-amber-400 shadow-2xl"
                />
                <span className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2 py-0.5 rounded-full bg-amber-400 text-black font-black text-[10px] uppercase shadow">
                  Top 1 Campus
                </span>
              </div>
              <h3 className="font-black text-lg text-white mt-3">{filteredLeaders[0].name}</h3>
              <p className="text-xs text-amber-300/90 font-medium">{filteredLeaders[0].school}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-[11px]">
                👑 {filteredLeaders[0].specialBadge}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-[#131E30] border border-amber-500/30 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-semibold">Tín nhiệm:</span>
                <span className="font-mono font-black text-[#00E5FF]">{filteredLeaders[0].trustScore}/850</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300 font-semibold">Hoàn thành:</span>
                <span className="font-bold text-emerald-400">{filteredLeaders[0].completedGigs} đơn</span>
              </div>
              <div className="flex justify-between border-t border-slate-700/60 pt-1">
                <span className="text-amber-300 font-bold">Thưởng hiện kim:</span>
                <span className="font-black text-amber-400 font-mono text-sm">500.000đ</span>
              </div>
            </div>
          </div>

          {/* Top 3: Bronze */}
          <div className="order-3 rounded-3xl bg-[#0F172A] border border-orange-700/40 p-5 text-center shadow-xl space-y-3 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-[10px] font-black">
              HẠNG 3 🥉
            </div>
            <div className="pt-4">
              <img
                src={filteredLeaders[2].avatarUrl}
                alt="Hạng 3"
                className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-orange-500 shadow-lg"
              />
              <h3 className="font-extrabold text-base text-white mt-2">{filteredLeaders[2].name}</h3>
              <p className="text-xs text-slate-400">{filteredLeaders[2].school}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-800 text-orange-300 font-bold text-[10px]">
                {filteredLeaders[2].specialBadge}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#131E30] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Đơn hoàn thành:</span>
                <span className="font-bold text-white">{filteredLeaders[2].completedGigs} kèo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thưởng tuần:</span>
                <span className="font-bold text-amber-400">150.000đ</span>
              </div>
            </div>
          </div>
        </div>
      ) : filteredLeaders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredLeaders.map((leader) => (
            <div
              key={leader.userId}
              className="rounded-3xl bg-gradient-to-b from-[#1E293B] to-[#0F172A] border border-amber-400/40 p-5 text-center shadow-xl space-y-3"
            >
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black">
                Hạng #{leader.rank} 🏆
              </div>
              <img
                src={leader.avatarUrl}
                alt={leader.name}
                className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-amber-400 shadow-lg"
              />
              <h3 className="font-extrabold text-base text-white">{leader.name}</h3>
              <p className="text-xs text-slate-400">{leader.school}</p>
              <div className="p-2.5 rounded-xl bg-[#131E30] text-xs flex justify-around">
                <div>
                  <span className="text-slate-400 block text-[10px]">Hoàn thành</span>
                  <span className="font-bold text-white">{leader.completedGigs} đơn</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tín nhiệm</span>
                  <span className="font-bold text-[#00E5FF]">{leader.trustScore}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-[#0F172A] border border-slate-800 p-10 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Trophy className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">Chưa có sinh viên trên bảng xếp hạng</h3>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            Bảng xếp hạng được tổng hợp 100% từ kết quả việc làm thật đã hoàn thành. Hãy nhận việc làm đầu tiên quanh trường để được vinh danh Quán quân!
          </p>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm tên trợ thủ, trường, kỹ năng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-[#0F172A] border border-slate-700 text-xs text-white"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {CAMPUS_OPTIONS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCampus(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCampus === c.id
                  ? 'bg-[#00E5FF] text-black shadow-md shadow-cyan-500/20'
                  : 'bg-[#0F172A] border border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table List */}
      <div className="rounded-3xl bg-[#0F172A] border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-extrabold text-sm text-white flex items-center space-x-2">
            <Medal className="w-4 h-4 text-cyan-400" />
            <span>Xếp Hạng Chi Tiết ({filteredLeaders.length} Trợ Thủ)</span>
          </h2>
          <span className="text-[11px] text-slate-400">Tự động cập nhật mỗi 00:00 Chủ Nhật</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {filteredLeaders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Chưa có dữ liệu trợ thủ nào trong danh mục hoặc campus này.
            </div>
          ) : (
            filteredLeaders.map((entry) => (
            <div
              key={entry.userId}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition"
            >
              <div className="flex items-center space-x-3.5">
                {/* Rank Badge */}
                <div
                  className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                    entry.rank === 1
                      ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30 font-extrabold'
                      : entry.rank === 2
                      ? 'bg-slate-300 text-black'
                      : entry.rank === 3
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  #{entry.rank}
                </div>

                {/* Avatar */}
                <img
                  src={entry.avatarUrl}
                  alt={entry.name}
                  className="w-11 h-11 rounded-full object-cover border border-slate-700 shrink-0"
                />

                {/* Details */}
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-extrabold text-sm text-white">{entry.name}</h4>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/30">
                      {entry.specialBadge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{entry.school}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 italic">
                    Gần đây: &quot;{entry.recentGigTitle}&quot;
                  </p>
                </div>
              </div>

              {/* Stats & Hire Button */}
              <div className="flex items-center justify-between sm:justify-end space-x-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-800">
                <div className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                    <span className="font-bold text-xs text-white">{entry.rating.toFixed(1)}</span>
                    <span className="text-[11px] text-slate-400">({entry.completedGigs} đơn)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Tín nhiệm: <span className="text-[#00E5FF] font-mono font-bold">{entry.trustScore}</span> • Đúng hạn:{' '}
                    <span className="text-emerald-400 font-bold">{entry.onTimeRate}%</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (onSelectFreelancer) onSelectFreelancer(entry.name);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#131E30] hover:bg-cyan-500/20 text-[#00E5FF] border border-cyan-500/30 text-xs font-bold transition flex items-center space-x-1"
                >
                  <span>Thuê</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )))}
        </div>
      </div>
    </div>
  );
};
