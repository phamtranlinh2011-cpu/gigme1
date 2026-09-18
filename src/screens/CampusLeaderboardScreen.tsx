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
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28 text-slate-900 space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-50/90 via-white to-sky-50/60 border border-amber-200/80 p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300/80 text-amber-900 text-xs font-bold">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>Vinh Danh Trợ Thủ Campus Xuất Sắc Hàng Tuần</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Bảng Xếp Hạng Top Trợ Thủ Campus
            </h1>
            <p className="text-xs text-slate-600 max-w-lg">
              Top 3 trợ thủ có điểm tín nhiệm cao nhất & hoàn thành nhiều kèo uy tín nhất nhận thưởng tiền mặt từ Quỹ Thưởng GigMe Campus!
            </p>
          </div>

          {/* Weekly Prize Pool Pill */}
          <div className="p-4 rounded-2xl bg-white border border-amber-300/90 text-center shrink-0 shadow-xs">
            <span className="text-[10px] text-amber-800 font-bold block uppercase tracking-wider">
              Tổng Giải Thưởng Tuần Này
            </span>
            <span className="text-2xl font-black text-amber-600 font-mono">1.000.000đ</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Top 1: 500k • Top 2: 300k • Top 3: 150k</span>
          </div>
        </div>
      </div>

      {/* Podium Top Cards or Empty State */}
      {filteredLeaders.length >= 3 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top 2: Silver */}
          <div className="order-2 md:order-1 rounded-3xl bg-white border border-slate-200 p-5 text-center shadow-xs space-y-3 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-black">
              HẠNG 2 🥈
            </div>
            <div className="pt-4">
              <img
                src={filteredLeaders[1].avatarUrl}
                alt="Hạng 2"
                className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-slate-300 shadow-sm"
              />
              <h3 className="font-extrabold text-base text-slate-900 mt-2">{filteredLeaders[1].name}</h3>
              <p className="text-xs text-slate-500">{filteredLeaders[1].school}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                {filteredLeaders[1].specialBadge}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Đơn hoàn thành:</span>
                <span className="font-bold text-slate-900">{filteredLeaders[1].completedGigs} kèo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thưởng tuần:</span>
                <span className="font-bold text-amber-700">300.000đ</span>
              </div>
            </div>
          </div>

          {/* Top 1: Gold Champion */}
          <div className="order-1 md:order-2 rounded-3xl bg-gradient-to-b from-amber-50/70 via-white to-white border-2 border-amber-400 p-6 text-center shadow-md space-y-3 relative overflow-hidden flex flex-col justify-between transform md:-translate-y-2">
            <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black flex items-center space-x-1">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>QUÁN QUÂN 🥇</span>
            </div>
            <div className="pt-5">
              <div className="relative inline-block">
                <img
                  src={filteredLeaders[0].avatarUrl}
                  alt="Quán quân"
                  className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-amber-400 shadow-md"
                />
                <span className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] uppercase shadow-xs">
                  Top 1 Campus
                </span>
              </div>
              <h3 className="font-black text-lg text-slate-900 mt-3">{filteredLeaders[0].name}</h3>
              <p className="text-xs text-amber-800 font-medium">{filteredLeaders[0].school}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-[11px]">
                👑 {filteredLeaders[0].specialBadge}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">Tín nhiệm:</span>
                <span className="font-mono font-black text-sky-700">{filteredLeaders[0].trustScore}/850</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">Hoàn thành:</span>
                <span className="font-bold text-emerald-700">{filteredLeaders[0].completedGigs} đơn</span>
              </div>
              <div className="flex justify-between border-t border-amber-200/80 pt-1">
                <span className="text-amber-900 font-bold">Thưởng hiện kim:</span>
                <span className="font-black text-amber-700 font-mono text-sm">500.000đ</span>
              </div>
            </div>
          </div>

          {/* Top 3: Bronze */}
          <div className="order-3 rounded-3xl bg-white border border-amber-200/80 p-5 text-center shadow-xs space-y-3 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-amber-100/70 border border-amber-300/70 text-amber-900 text-[10px] font-black">
              HẠNG 3 🥉
            </div>
            <div className="pt-4">
              <img
                src={filteredLeaders[2].avatarUrl}
                alt="Hạng 3"
                className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-amber-300 shadow-sm"
              />
              <h3 className="font-extrabold text-base text-slate-900 mt-2">{filteredLeaders[2].name}</h3>
              <p className="text-xs text-slate-500">{filteredLeaders[2].school}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[10px]">
                {filteredLeaders[2].specialBadge}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Đơn hoàn thành:</span>
                <span className="font-bold text-slate-900">{filteredLeaders[2].completedGigs} kèo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thưởng tuần:</span>
                <span className="font-bold text-amber-700">150.000đ</span>
              </div>
            </div>
          </div>
        </div>
      ) : filteredLeaders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredLeaders.map((leader) => (
            <div
              key={leader.userId}
              className="rounded-3xl bg-white border border-amber-200 p-5 text-center shadow-xs space-y-3"
            >
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
                Hạng #{leader.rank} 🏆
              </div>
              <img
                src={leader.avatarUrl}
                alt={leader.name}
                className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-amber-300 shadow-sm"
              />
              <h3 className="font-extrabold text-base text-slate-900">{leader.name}</h3>
              <p className="text-xs text-slate-500">{leader.school}</p>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex justify-around">
                <div>
                  <span className="text-slate-500 block text-[10px]">Hoàn thành</span>
                  <span className="font-bold text-slate-900">{leader.completedGigs} đơn</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Tín nhiệm</span>
                  <span className="font-bold text-sky-700">{leader.trustScore}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200 p-10 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Trophy className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Chưa có sinh viên trên bảng xếp hạng</h3>
          <p className="text-xs text-slate-500 max-w-md leading-relaxed">
            Bảng xếp hạng được tổng hợp 100% từ kết quả việc làm thật đã hoàn thành. Hãy nhận việc làm đầu tiên quanh trường để được vinh danh Quán quân!
          </p>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm tên trợ thủ, trường, kỹ năng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-sky-500 focus:outline-none shadow-xs"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {CAMPUS_OPTIONS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCampus(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCampus === c.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table List */}
      <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
            <Medal className="w-4 h-4 text-sky-600" />
            <span>Xếp Hạng Chi Tiết ({filteredLeaders.length} Trợ Thủ)</span>
          </h2>
          <span className="text-[11px] text-slate-500">Tự động cập nhật mỗi 00:00 Chủ Nhật</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredLeaders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Chưa có dữ liệu trợ thủ nào trong danh mục hoặc campus này.
            </div>
          ) : (
            filteredLeaders.map((entry) => (
            <div
              key={entry.userId}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
            >
              <div className="flex items-center space-x-3.5">
                {/* Rank Badge */}
                <div
                  className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                    entry.rank === 1
                      ? 'bg-amber-400 text-amber-950 shadow-xs font-extrabold'
                      : entry.rank === 2
                      ? 'bg-slate-200 text-slate-800'
                      : entry.rank === 3
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  #{entry.rank}
                </div>

                {/* Avatar */}
                <img
                  src={entry.avatarUrl}
                  alt={entry.name}
                  className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                />

                {/* Details */}
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-extrabold text-sm text-slate-900">{entry.name}</h4>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 font-bold border border-sky-200">
                      {entry.specialBadge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{entry.school}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 italic">
                    Gần đây: &quot;{entry.recentGigTitle}&quot;
                  </p>
                </div>
              </div>

              {/* Stats & Hire Button */}
              <div className="flex items-center justify-between sm:justify-end space-x-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                <div className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    <span className="font-bold text-xs text-slate-900">{entry.rating.toFixed(1)}</span>
                    <span className="text-[11px] text-slate-500">({entry.completedGigs} đơn)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Tín nhiệm: <span className="text-sky-700 font-mono font-bold">{entry.trustScore}</span> • Đúng hạn:{' '}
                    <span className="text-emerald-600 font-bold">{entry.onTimeRate}%</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (onSelectFreelancer) onSelectFreelancer(entry.name);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold transition flex items-center space-x-1 active:scale-95 shadow-xs"
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
