import React, { useState } from 'react';
import {
  Search,
  Mic,
  SlidersHorizontal,
  Sparkles,
  Zap,
  MapPin,
  Clock,
  Users,
  Repeat,
  ShieldCheck,
  Award,
  ArrowRight,
  Filter,
  Trophy,
  BookOpen,
  QrCode,
  Smartphone,
  GraduationCap,
  Rocket,
  Radio,
  Flame,
  Bell,
  ShieldAlert,
  WifiOff,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { InteractiveRadar } from '../components/InteractiveRadar';
import { VoiceSearchDialog } from '../components/AdvancedDialogs';
import { OfflineGigsModal } from '../components/OfflineGigsModal';
import { formatVnd, GigEntity } from '../types';
import { VIETNAM_HUBS } from '../utils/geo';

interface HomeScreenProps {
  onSelectGigDetail: (gigId: string) => void;
  onOpenCreateGig: () => void;
  onOpenVerify: () => void;
  onOpenLeaderboard?: () => void;
  onOpenMarketplace?: () => void;
  onOpenVietQrScanner?: () => void;
  onOpenPaymentGateway?: () => void;
  onOpenGeminiVision?: () => void;
  onOpenFcmPush?: () => void;
  onOpenEloModal?: () => void;
  onOpenSafeWalk?: () => void;
}

const CATEGORIES = [
  'Tất cả',
  'Flash Gigs',
  'Cày Game & Rank',
  'Tư vấn & Học tập',
  'Digital Tasks',
  'Vận chuyển & Ship',
  'Trợ thủ Campus',
];

const getCategoryBadgeStyle = (category: string) => {
  switch (category) {
    case 'Cày Game & Rank':
      return 'text-purple-800 bg-purple-100/90 border-purple-300';
    case 'Tư vấn & Học tập':
      return 'text-blue-800 bg-blue-100/90 border-blue-300';
    case 'Digital Tasks':
      return 'text-indigo-800 bg-indigo-100/90 border-indigo-300';
    case 'Vận chuyển & Ship':
      return 'text-emerald-800 bg-emerald-100/90 border-emerald-300';
    case 'Trợ thủ Campus':
      return 'text-teal-800 bg-teal-100/90 border-teal-300';
    case 'Flash Gigs':
      return 'text-amber-800 bg-amber-100/90 border-amber-300';
    default:
      return 'text-sky-800 bg-sky-100/90 border-sky-300';
  }
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectGigDetail,
  onOpenCreateGig,
  onOpenVerify,
  onOpenLeaderboard,
  onOpenMarketplace,
  onOpenVietQrScanner,
  onOpenPaymentGateway,
  onOpenGeminiVision,
  onOpenFcmPush,
  onOpenEloModal,
  onOpenSafeWalk,
}) => {
  const {
    filteredGigs,
    selectedGigId,
    selectGig,
    selectedRadiusMeters,
    setRadius,
    selectedCategory,
    setCategory,
    searchQuery,
    setSearchQuery,
    selectedPriceFilter,
    setPriceFilter,
    selectedDurationFilter,
    setDurationFilter,
    filterRecurringOnly,
    toggleFilterRecurring,
    filterMultiWorkerOnly,
    toggleFilterMultiWorker,
    aiSmartMatchActive,
    toggleSmartMatch,
    currentUser,
    roleMode,
    acceptGigDirectly,
    userCoords,
    setUserCoords,
  } = useGigMe();

  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const isClient = roleMode === 'CLIENT';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      {/* Tier Newbie Advisory Banner */}
      {currentUser && currentUser.tier === 'NEWBIE' && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-amber-900">Bạn đang ở tài khoản Cấp 1 (Newbie)</h4>
              <p className="text-amber-700/90 mt-0.5">
                Chỉ được xem kèo dưới 20.000đ. Hãy xác thực CCCD gắn chip (NFC) hoặc Cổng sinh viên để mở khóa toàn bộ!
              </p>
            </div>
          </div>
          <button
            onClick={onOpenVerify}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shrink-0 transition shadow-sm active:scale-95"
          >
            Xác Thực Cấp 2 Ngay &rarr;
          </button>
        </div>
      )}

      {/* Interactive Geofence Radar & Google Maps Discovery View */}
      <InteractiveRadar
        gigs={filteredGigs}
        selectedGigId={selectedGigId}
        onSelectGig={(id) => {
          selectGig(id);
        }}
        radiusMeters={selectedRadiusMeters}
        onRadiusChange={setRadius}
        isClientMode={isClient}
        userCoords={userCoords}
        onUserCoordsChange={setUserCoords}
      />

      {/* Campus Quick Hub Shortcuts - Sleek swipeable carousel on mobile, neat grid on desktop */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            Tiện ích Campus 24/7
          </span>
          <span className="text-[10px] text-sky-700 font-semibold hidden sm:inline">Trượt ngang để xem thêm tiện ích &rarr;</span>
        </div>
        <div className="flex overflow-x-auto gap-2.5 pb-2 scrollbar-none snap-x sm:grid sm:grid-cols-4 lg:grid-cols-8">
          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              className="min-w-[130px] sm:min-w-0 p-3 rounded-2xl bg-gradient-to-br from-amber-50/95 via-orange-50/50 to-yellow-50/70 hover:from-amber-100 hover:to-orange-100 border border-amber-200/90 hover:border-amber-400 text-left transition group shadow-xs hover:shadow-sm shrink-0 snap-start active:scale-95"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 rounded-lg bg-amber-100/90 text-amber-700 shadow-xs">
                  <Trophy className="w-4 h-4 group-hover:scale-110 transition" />
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-black shadow-2xs">
                  Top 10
                </span>
              </div>
              <h5 className="font-black text-amber-950 text-xs truncate">BXH Campus</h5>
              <p className="text-[10px] text-amber-800/80 font-medium truncate">Top thưởng tuần</p>
            </button>
          )}

          {onOpenMarketplace && (
            <button
              onClick={onOpenMarketplace}
              className="min-w-[130px] sm:min-w-0 p-3 rounded-2xl bg-gradient-to-br from-emerald-50/95 via-teal-50/50 to-green-50/70 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/90 hover:border-emerald-400 text-left transition group shadow-xs hover:shadow-sm shrink-0 snap-start active:scale-95"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 rounded-lg bg-emerald-100/90 text-emerald-700 shadow-xs">
                  <BookOpen className="w-4 h-4 group-hover:scale-110 transition" />
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-black shadow-2xs">
                  Chợ 0đ
                </span>
              </div>
              <h5 className="font-black text-emerald-950 text-xs truncate">Chợ Giáo Trình</h5>
              <p className="text-[10px] text-emerald-800/80 font-medium truncate">Trao đổi đồ KTX</p>
            </button>
          )}

          {onOpenVietQrScanner && (
            <button
              onClick={onOpenVietQrScanner}
              className="min-w-[130px] sm:min-w-0 p-3 rounded-2xl bg-gradient-to-br from-sky-50/95 via-blue-50/50 to-cyan-50/70 hover:from-sky-100 hover:to-blue-100 border border-sky-200/90 hover:border-sky-400 text-left transition group shadow-xs hover:shadow-sm shrink-0 snap-start active:scale-95"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 rounded-lg bg-sky-100/90 text-[#0284C7] shadow-xs">
                  <QrCode className="w-4 h-4 group-hover:scale-110 transition" />
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-200 text-sky-900 font-black shadow-2xs">
                  VietQR
                </span>
              </div>
              <h5 className="font-black text-sky-950 text-xs truncate">Quét VietQR</h5>
              <p className="text-[10px] text-sky-800/80 font-medium truncate">Nạp rút 24/7</p>
            </button>
          )}

          {onOpenPaymentGateway && (
            <button
              onClick={onOpenPaymentGateway}
              className="min-w-[130px] sm:min-w-0 p-3 rounded-2xl bg-gradient-to-br from-pink-50/95 via-rose-50/50 to-fuchsia-50/70 hover:from-pink-100 hover:to-rose-100 border border-pink-200/90 hover:border-pink-400 text-left transition group shadow-xs hover:shadow-sm shrink-0 snap-start active:scale-95"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 rounded-lg bg-pink-100/90 text-pink-700 shadow-xs">
                  <Smartphone className="w-4 h-4 group-hover:scale-110 transition" />
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-200 text-pink-900 font-black shadow-2xs">
                  MoMo
                </span>
              </div>
              <h5 className="font-black text-pink-950 text-xs truncate">Cổng Ví Điện Tử</h5>
              <p className="text-[10px] text-pink-800/80 font-medium truncate">MoMo & ZaloPay</p>
            </button>
          )}

          {onOpenGeminiVision && (
            <button
              onClick={onOpenGeminiVision}
              className="min-w-[130px] sm:min-w-0 p-3 rounded-2xl bg-gradient-to-br from-indigo-50/95 via-purple-50/50 to-blue-50/70 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200/90 hover:border-indigo-400 text-left transition group shadow-xs hover:shadow-sm shrink-0 snap-start active:scale-95"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 rounded-lg bg-indigo-100/90 text-indigo-700 shadow-xs">
                  <GraduationCap className="w-4 h-4 group-hover:scale-110 transition" />
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-200 text-indigo-900 font-black shadow-2xs">
                  OCR AI
                </span>
              </div>
              <h5 className="font-black text-indigo-950 text-xs truncate">Quét Thẻ SV</h5>
              <p className="text-[10px] text-indigo-800/80 font-medium truncate">Duyệt Cấp 2</p>
            </button>
          )}

          {onOpenSafeWalk && (
            <button
              onClick={onOpenSafeWalk}
              className="min-w-[130px] sm:min-w-0 p-3 rounded-2xl bg-gradient-to-br from-rose-50/95 via-red-50/50 to-orange-50/70 hover:from-rose-100 hover:to-red-100 border border-rose-200/90 hover:border-rose-400 text-left transition group shadow-xs hover:shadow-sm shrink-0 snap-start active:scale-95"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 rounded-lg bg-rose-100/90 text-rose-700 shadow-xs">
                  <ShieldAlert className="w-4 h-4 group-hover:scale-110 transition" />
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-200 text-rose-900 font-black shadow-2xs">
                  SafeWalk
                </span>
              </div>
              <h5 className="font-black text-rose-950 text-xs truncate">Bảo Vệ Đêm SOS</h5>
              <p className="text-[10px] text-rose-800/80 font-medium truncate">Còi & hộ tống</p>
            </button>
          )}

          {onOpenFcmPush && (
            <button
              onClick={onOpenFcmPush}
              className="min-w-[130px] sm:min-w-0 p-3 rounded-2xl bg-gradient-to-br from-orange-50/95 via-amber-50/50 to-yellow-50/70 hover:from-orange-100 hover:to-amber-100 border border-orange-200/90 hover:border-orange-400 text-left transition group shadow-xs hover:shadow-sm shrink-0 snap-start active:scale-95"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 rounded-lg bg-orange-100/90 text-orange-700 shadow-xs">
                  <Bell className="w-4 h-4 group-hover:scale-110 transition" />
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-200 text-orange-900 font-black shadow-2xs">
                  FCM Push
                </span>
              </div>
              <h5 className="font-black text-orange-950 text-xs truncate">Báo Hỏa Tốc</h5>
              <p className="text-[10px] text-orange-800/80 font-medium truncate">Bắn kèo 50m</p>
            </button>
          )}

          {onOpenEloModal && (
            <button
              onClick={onOpenEloModal}
              className="min-w-[130px] sm:min-w-0 p-3 rounded-2xl bg-gradient-to-br from-violet-50/95 via-purple-50/50 to-indigo-50/70 hover:from-violet-100 hover:to-purple-100 border border-violet-200/90 hover:border-violet-400 text-left transition group shadow-xs hover:shadow-sm shrink-0 snap-start active:scale-95"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 rounded-lg bg-violet-100/90 text-violet-700 shadow-xs">
                  <Award className="w-4 h-4 group-hover:scale-110 transition" />
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-200 text-violet-900 font-black shadow-2xs">
                  ELO
                </span>
              </div>
              <h5 className="font-black text-violet-950 text-xs truncate">Điểm Tín Nhiệm</h5>
              <p className="text-[10px] text-violet-800/80 font-medium truncate">Huy hiệu & rank</p>
            </button>
          )}

          <button
            onClick={() => setIsOfflineModalOpen(true)}
            className="min-w-[130px] sm:min-w-0 p-3 rounded-2xl bg-gradient-to-br from-cyan-50/95 via-teal-50/50 to-sky-50/70 hover:from-cyan-100 hover:to-sky-100 border border-cyan-200/90 hover:border-cyan-400 text-left transition group shadow-xs hover:shadow-sm shrink-0 snap-start active:scale-95"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="p-1.5 rounded-lg bg-cyan-100/90 text-cyan-700 shadow-xs">
                <WifiOff className="w-4 h-4 group-hover:scale-110 transition" />
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-200 text-cyan-900 font-black shadow-2xs">
                Offline
              </span>
            </div>
            <h5 className="font-black text-cyan-950 text-xs truncate">Kho Việc Offline</h5>
            <p className="text-[10px] text-cyan-800/80 font-medium truncate">Xem trong thang máy</p>
          </button>
        </div>
      </div>

      {/* Search Bar & Smart Match Controller */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {/* Keyword Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-sky-500 absolute left-3.5 top-3" />
            <input
              type="text"
              id="home-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/95 border border-sky-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20 shadow-xs transition"
              placeholder="Tìm việc làm siêu nhỏ, kéo rank, gia sư, ship hàng KTX..."
            />
            {/* Voice Search Button */}
            <button
              type="button"
              onClick={() => setIsVoiceOpen(true)}
              className="absolute right-2.5 top-2 p-1 text-slate-400 hover:text-[#0284C7] transition rounded-lg hover:bg-sky-50"
              title="Tìm kiếm bằng giọng nói"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          {/* AI Smart Match Toggle */}
          <button
            id="ai-smart-match-btn"
            onClick={toggleSmartMatch}
            className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl border text-xs font-black transition shadow-xs active:scale-95 ${
              aiSmartMatchActive
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500 text-white shadow-purple-500/25 ring-2 ring-purple-300'
                : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 text-purple-900 hover:border-purple-400 hover:bg-purple-100'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${aiSmartMatchActive ? 'text-yellow-300 animate-spin-slow' : 'text-purple-600'}`} />
            <span className="hidden sm:inline">AI Smart Match</span>
            <span className="sm:hidden">AI Match</span>
          </button>

          {/* Advanced Filter Toggle */}
          <button
            onClick={() => setShowAdvancedFilters((p) => !p)}
            className={`p-2.5 rounded-2xl border text-xs transition shadow-xs active:scale-95 ${
              showAdvancedFilters
                ? 'bg-sky-500 text-white border-sky-600 shadow-sky-500/25'
                : 'bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200 text-sky-800 hover:bg-sky-100 hover:border-sky-300'
            }`}
            title="Bộ lọc nâng cao"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Categories Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border shadow-xs active:scale-95 ${
                  isSelected
                    ? cat === 'Flash Gigs'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500 shadow-sm shadow-amber-500/30'
                      : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-500 shadow-sm shadow-sky-500/25'
                    : 'bg-white/90 border-slate-200/90 text-slate-700 hover:text-[#0284C7] hover:border-sky-300 hover:bg-sky-50/80'
                }`}
              >
                {cat === 'Flash Gigs' && <Zap className="w-3 h-3 fill-current text-amber-300" />}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Collapsible Advanced Filters (Price, Duration, Multi-worker, Recurring) */}
        {showAdvancedFilters && (
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 text-xs shadow-sm animate-fade-in">
            {/* Price filter chips */}
            <div>
              <span className="text-slate-600 font-bold block mb-1.5">Mức tiền thù lao:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Tất cả mức giá', value: 'ALL' },
                  { label: '< 50.000đ', value: '<50K' },
                  { label: '50.000đ - 200.000đ', value: '50K-200K' },
                  { label: '> 200.000đ', value: '>200K' },
                ].map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPriceFilter(p.value)}
                    className={`px-3 py-1 rounded-lg border font-bold text-[11px] transition ${
                      selectedPriceFilter === p.value
                        ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration filter chips */}
            <div>
              <span className="text-slate-600 font-bold block mb-1.5">Thời lượng hoàn thành:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Tất cả thời lượng', value: 'ALL' },
                  { label: 'Siêu tốc (< 15 phút)', value: '<15M' },
                  { label: '15 - 60 phút', value: '15-60M' },
                  { label: 'Trên 60 phút', value: '>60M' },
                ].map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDurationFilter(d.value)}
                    className={`px-3 py-1 rounded-lg border font-bold text-[11px] transition ${
                      selectedDurationFilter === d.value
                        ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkbox toggles: Recurring & Multi-worker */}
            <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
              <label className="flex items-center space-x-2 cursor-pointer text-slate-700 font-semibold">
                <input
                  type="checkbox"
                  checked={filterRecurringOnly}
                  onChange={toggleFilterRecurring}
                  className="w-4 h-4 accent-[#0284C7] rounded cursor-pointer"
                />
                <span className="flex items-center space-x-1">
                  <Repeat className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>Kèo định kỳ / Thuê theo tuần</span>
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-slate-700 font-semibold">
                <input
                  type="checkbox"
                  checked={filterMultiWorkerOnly}
                  onChange={toggleFilterMultiWorker}
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                />
                <span className="flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-orange-500" />
                  <span>Kèo ghép nhóm (&gt;1 người cùng làm)</span>
                </span>
              </label>
            </div>
          </div>
        )}
      </div>



      {/* Gigs List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Công việc quanh bạn</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-50 text-[#0284C7] border border-sky-200">
              {filteredGigs.length}
            </span>
          </div>

          <button
            onClick={onOpenCreateGig}
            className="text-xs font-bold text-[#0284C7] hover:underline flex items-center space-x-1"
          >
            <span>+ Đăng việc mới</span>
          </button>
        </div>

        {filteredGigs.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#0284C7] flex items-center justify-center mx-auto mb-3.5">
              <MapPin className="w-8 h-8" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">Chưa có công việc nào quanh khu vực này</h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
              Hiện tại chưa có công việc nào trong phạm vi tìm kiếm. Hãy là người đầu tiên đăng việc mới hoặc mở rộng bán kính tìm kiếm!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
              <button
                onClick={onOpenCreateGig}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-[#0284C7] text-white font-extrabold text-xs hover:brightness-105 shadow-sm shadow-sky-500/25 transition active:scale-95"
              >
                + Đăng Kèo Mới Ngay
              </button>
              <button
                onClick={() => {
                  setRadius(5000);
                  setCategory('Tất cả');
                  setSearchQuery('');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition active:scale-95"
              >
                Đặt lại bộ lọc (5km)
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGigs.map((gig) => {
              const isSelected = selectedGigId === gig.id;
              const isBoosted = !!(gig.isBoosted && gig.boostedUntil && gig.boostedUntil > Date.now());
              return (
                <div
                  key={gig.id}
                  onClick={() => selectGig(gig.id)}
                  className={`relative rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                    isBoosted
                      ? 'bg-gradient-to-b from-rose-50/60 via-white to-amber-50/20 border-rose-300 shadow-sm hover:shadow-md ring-1 ring-rose-300/40'
                      : isSelected
                      ? 'bg-gradient-to-b from-sky-50/60 via-white to-white border-[#0284C7] shadow-md shadow-sky-500/15 ring-2 ring-sky-500/25'
                      : 'bg-gradient-to-b from-white via-white to-sky-50/20 border-sky-100/90 hover:border-sky-400 hover:shadow-[0_10px_25px_-5px_rgba(2,132,199,0.12)] shadow-[0_2px_8px_-2px_rgba(2,132,199,0.05)]'
                  }`}
                >
                  {/* Top tags */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isBoosted && (
                          <span className="flex items-center text-[10px] font-black text-white bg-gradient-to-r from-red-600 to-rose-600 px-2 py-0.5 rounded-md shadow-xs animate-pulse">
                            <Rocket className="w-3 h-3 mr-1 text-yellow-300" /> HOT BOOST
                          </span>
                        )}
                        {gig.auctionRoomOpen && (
                          <span className="flex items-center text-[10px] font-black text-white bg-red-600 px-2 py-0.5 rounded-md shadow-xs">
                            <Radio className="w-3 h-3 mr-1 animate-pulse" /> ĐẤU GIÁ MỞ
                          </span>
                        )}
                        {gig.isFlash && !isBoosted && (
                          <span className="flex items-center text-[10px] font-extrabold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 rounded-md shadow-xs">
                            <Zap className="w-3 h-3 mr-0.5 fill-current" /> HỎA TỐC
                          </span>
                        )}
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border shadow-2xs ${getCategoryBadgeStyle(gig.category)}`}>
                          {gig.category}
                        </span>
                      </div>

                      <span className="text-[11px] font-mono text-[#0284C7] font-black flex items-center space-x-0.5 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                        <MapPin className="w-3 h-3 text-[#0284C7]" />
                        <span>{gig.distanceMeters}m</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mb-1.5 hover:text-[#0284C7] transition">
                      {gig.title}
                    </h4>

                    {/* Description */}
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                      {gig.description}
                    </p>
                  </div>

                  {/* Metadata & Pricing footer */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 py-2 border-t border-slate-100 mb-3">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        <span className="font-semibold text-slate-600">~{gig.estimatedDurationMinutes} phút</span>
                      </div>

                      {gig.totalWorkersNeeded > 1 && (
                        <div className="flex items-center space-x-1 text-teal-800 font-bold bg-teal-100/80 px-2 py-0.5 rounded-md border border-teal-200">
                          <Users className="w-3.5 h-3.5 text-teal-700" />
                          <span>
                            Nhóm {gig.multiWorkers?.length || 0}/{gig.totalWorkersNeeded} bạn
                          </span>
                        </div>
                      )}

                      {gig.isRecurringWeekly && (
                        <div className="flex items-center space-x-1 text-sky-800 font-bold bg-sky-100/80 px-2 py-0.5 rounded-md border border-sky-200">
                          <Repeat className="w-3.5 h-3.5 text-sky-700" />
                          <span>Hàng tuần</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold mb-0.5">
                          {gig.isReverseAuction ? 'Đấu giá ngược' : 'Thù lao Escrow'}
                        </span>
                        <div className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200/90 shadow-2xs">
                          <span className="text-base font-black text-emerald-600 font-mono">
                            {formatVnd(gig.isReverseAuction && gig.lowestBidPrice ? gig.lowestBidPrice : gig.price)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectGigDetail(gig.id);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-xs transition flex items-center space-x-1 active:scale-95 ${
                            gig.auctionRoomOpen
                              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:brightness-105 shadow-red-500/20'
                              : 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white hover:brightness-105 shadow-blue-500/20'
                          }`}
                        >
                          <span>{gig.auctionRoomOpen ? 'Vào Đấu Giá' : gig.isReverseAuction ? 'Đấu Giá' : 'Xem Kèo'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Voice Search Modal */}
      <VoiceSearchDialog
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSelectQuery={(q) => setSearchQuery(q)}
      />

      {/* Offline Gigs Cache Modal */}
      <OfflineGigsModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
        onSelectGig={(id) => onSelectGigDetail(id)}
      />
    </div>
  );
};
