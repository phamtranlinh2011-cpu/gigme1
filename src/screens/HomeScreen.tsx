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
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { InteractiveRadar } from '../components/InteractiveRadar';
import { VoiceSearchDialog } from '../components/AdvancedDialogs';
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
  const isClient = roleMode === 'CLIENT';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      {/* Tier Newbie Advisory Banner */}
      {currentUser && currentUser.tier === 'NEWBIE' && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-white">Bạn đang ở tài khoản Cấp 1 (Newbie)</h4>
              <p className="text-slate-300 mt-0.5">
                Chỉ được xem kèo dưới 20.000đ. Hãy xác thực CCCD gắn chip (NFC) hoặc Cổng sinh viên để mở khóa toàn bộ!
              </p>
            </div>
          </div>
          <button
            onClick={onOpenVerify}
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-black font-extrabold text-xs hover:brightness-110 shrink-0 transition"
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
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Tiện ích Campus 24/7</span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">Trượt ngang để xem thêm tiện ích &rarr;</span>
        </div>
        <div className="flex overflow-x-auto gap-2.5 pb-2 scrollbar-none snap-x sm:grid sm:grid-cols-4 lg:grid-cols-8">
          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              className="min-w-[130px] sm:min-w-0 p-2.5 rounded-2xl bg-gradient-to-b from-[#131E30] to-[#0A1220] border border-amber-500/30 hover:border-amber-400 text-left transition group shadow-sm shrink-0 snap-start"
            >
              <div className="flex items-center justify-between mb-1">
                <Trophy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-extrabold">
                  Top 10
                </span>
              </div>
              <h5 className="font-extrabold text-white text-xs truncate">BXH Campus</h5>
              <p className="text-[10px] text-slate-400 truncate">Top thưởng tuần</p>
            </button>
          )}

          {onOpenMarketplace && (
            <button
              onClick={onOpenMarketplace}
              className="min-w-[130px] sm:min-w-0 p-2.5 rounded-2xl bg-gradient-to-b from-[#131E30] to-[#0A1220] border border-emerald-500/30 hover:border-emerald-400 text-left transition group shadow-sm shrink-0 snap-start"
            >
              <div className="flex items-center justify-between mb-1">
                <BookOpen className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-extrabold">
                  Chợ 0đ
                </span>
              </div>
              <h5 className="font-extrabold text-white text-xs truncate">Chợ Giáo Trình</h5>
              <p className="text-[10px] text-slate-400 truncate">Trao đổi đồ KTX</p>
            </button>
          )}

          {onOpenVietQrScanner && (
            <button
              onClick={onOpenVietQrScanner}
              className="min-w-[130px] sm:min-w-0 p-2.5 rounded-2xl bg-gradient-to-b from-[#131E30] to-[#0A1220] border border-cyan-500/30 hover:border-cyan-400 text-left transition group shadow-sm shrink-0 snap-start"
            >
              <div className="flex items-center justify-between mb-1">
                <QrCode className="w-4 h-4 text-[#00E5FF] group-hover:scale-110 transition" />
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-extrabold">
                  VietQR
                </span>
              </div>
              <h5 className="font-extrabold text-white text-xs truncate">Quét VietQR</h5>
              <p className="text-[10px] text-slate-400 truncate">Nạp rút 24/7</p>
            </button>
          )}

          {onOpenPaymentGateway && (
            <button
              onClick={onOpenPaymentGateway}
              className="min-w-[130px] sm:min-w-0 p-2.5 rounded-2xl bg-gradient-to-b from-[#131E30] to-[#0A1220] border border-pink-500/30 hover:border-pink-400 text-left transition group shadow-sm shrink-0 snap-start"
            >
              <div className="flex items-center justify-between mb-1">
                <Smartphone className="w-4 h-4 text-pink-400 group-hover:scale-110 transition" />
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 font-extrabold">
                  MoMo
                </span>
              </div>
              <h5 className="font-extrabold text-white text-xs truncate">Cổng Ví Điện Tử</h5>
              <p className="text-[10px] text-slate-400 truncate">MoMo & ZaloPay</p>
            </button>
          )}

          {onOpenGeminiVision && (
            <button
              onClick={onOpenGeminiVision}
              className="min-w-[130px] sm:min-w-0 p-2.5 rounded-2xl bg-gradient-to-b from-[#131E30] to-[#0A1220] border border-indigo-500/30 hover:border-indigo-400 text-left transition group shadow-sm shrink-0 snap-start"
            >
              <div className="flex items-center justify-between mb-1">
                <GraduationCap className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition" />
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-extrabold">
                  OCR AI
                </span>
              </div>
              <h5 className="font-extrabold text-white text-xs truncate">Quét Thẻ SV</h5>
              <p className="text-[10px] text-slate-400 truncate">Duyệt Cấp 2</p>
            </button>
          )}

          {onOpenSafeWalk && (
            <button
              onClick={onOpenSafeWalk}
              className="min-w-[130px] sm:min-w-0 p-2.5 rounded-2xl bg-gradient-to-b from-[#131E30] to-[#0A1220] border border-rose-500/30 hover:border-rose-400 text-left transition group shadow-sm shrink-0 snap-start"
            >
              <div className="flex items-center justify-between mb-1">
                <ShieldAlert className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-extrabold">
                  SafeWalk
                </span>
              </div>
              <h5 className="font-extrabold text-white text-xs truncate">Bảo Vệ Đêm SOS</h5>
              <p className="text-[10px] text-slate-400 truncate">Còi & hộ tống</p>
            </button>
          )}

          {onOpenFcmPush && (
            <button
              onClick={onOpenFcmPush}
              className="min-w-[130px] sm:min-w-0 p-2.5 rounded-2xl bg-gradient-to-b from-[#131E30] to-[#0A1220] border border-orange-500/30 hover:border-orange-400 text-left transition group shadow-sm shrink-0 snap-start"
            >
              <div className="flex items-center justify-between mb-1">
                <Bell className="w-4 h-4 text-orange-400 group-hover:scale-110 transition" />
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 font-extrabold">
                  FCM Push
                </span>
              </div>
              <h5 className="font-extrabold text-white text-xs truncate">Báo Hỏa Tốc</h5>
              <p className="text-[10px] text-slate-400 truncate">Bắn kèo 50m</p>
            </button>
          )}

          {onOpenEloModal && (
            <button
              onClick={onOpenEloModal}
              className="min-w-[130px] sm:min-w-0 p-2.5 rounded-2xl bg-gradient-to-b from-[#131E30] to-[#0A1220] border border-amber-500/30 hover:border-amber-400 text-left transition group shadow-sm shrink-0 snap-start"
            >
              <div className="flex items-center justify-between mb-1">
                <Award className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-extrabold">
                  ELO
                </span>
              </div>
              <h5 className="font-extrabold text-white text-xs truncate">Điểm Tín Nhiệm</h5>
              <p className="text-[10px] text-slate-400 truncate">Huy hiệu & rank</p>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar & Smart Match Controller */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {/* Keyword Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              id="home-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#0F172A] border border-[#1E293B] text-white text-xs placeholder:text-slate-500 focus:border-[#00E5FF] transition"
              placeholder="Tìm việc làm siêu nhỏ, kéo rank, gia sư, ship hàng KTX..."
            />
            {/* Voice Search Button */}
            <button
              type="button"
              onClick={() => setIsVoiceOpen(true)}
              className="absolute right-2.5 top-2 p-1 text-slate-400 hover:text-[#00E5FF] transition"
              title="Tìm kiếm bằng giọng nói"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          {/* AI Smart Match Toggle */}
          <button
            id="ai-smart-match-btn"
            onClick={toggleSmartMatch}
            className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition ${
              aiSmartMatchActive
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 text-white shadow-lg shadow-purple-500/25'
                : 'bg-[#0F172A] border-[#1E293B] text-slate-300 hover:border-slate-700'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${aiSmartMatchActive ? 'text-yellow-300 animate-spin-slow' : 'text-purple-400'}`} />
            <span className="hidden sm:inline">AI Smart Match</span>
            <span className="sm:hidden">AI Match</span>
          </button>

          {/* Advanced Filter Toggle */}
          <button
            onClick={() => setShowAdvancedFilters((p) => !p)}
            className={`p-2.5 rounded-2xl border text-xs transition ${
              showAdvancedFilters
                ? 'bg-[#1E293B] text-[#00E5FF] border-[#00E5FF]'
                : 'bg-[#0F172A] border-[#1E293B] text-slate-400 hover:text-white'
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
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                  isSelected
                    ? isClient
                      ? 'bg-[#00E5FF] text-black border-[#00E5FF] shadow-sm'
                      : 'bg-[#FF6B00] text-black border-[#FF6B00] shadow-sm'
                    : 'bg-[#0F172A] border-[#1E293B] text-slate-400 hover:text-white hover:bg-[#152033]'
                }`}
              >
                {cat === 'Flash Gigs' && <Zap className="w-3 h-3 fill-current text-yellow-400" />}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Collapsible Advanced Filters (Price, Duration, Multi-worker, Recurring) */}
        {showAdvancedFilters && (
          <div className="p-4 rounded-2xl bg-[#0F172A] border border-[#1E293B] space-y-3 text-xs animate-fade-in">
            {/* Price filter chips */}
            <div>
              <span className="text-slate-400 font-bold block mb-1.5">Mức tiền thù lao:</span>
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
                        ? 'bg-[#00E5FF] text-black border-[#00E5FF]'
                        : 'bg-[#131E30] text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration filter chips */}
            <div>
              <span className="text-slate-400 font-bold block mb-1.5">Thời lượng hoàn thành:</span>
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
                        ? 'bg-[#FF6B00] text-black border-[#FF6B00]'
                        : 'bg-[#131E30] text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkbox toggles: Recurring & Multi-worker */}
            <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-800">
              <label className="flex items-center space-x-2 cursor-pointer text-slate-300 font-semibold">
                <input
                  type="checkbox"
                  checked={filterRecurringOnly}
                  onChange={toggleFilterRecurring}
                  className="w-4 h-4 accent-[#00E5FF] rounded cursor-pointer"
                />
                <span className="flex items-center space-x-1">
                  <Repeat className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Kèo định kỳ / Thuê theo tuần</span>
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-slate-300 font-semibold">
                <input
                  type="checkbox"
                  checked={filterMultiWorkerOnly}
                  onChange={toggleFilterMultiWorker}
                  className="w-4 h-4 accent-[#FF6B00] rounded cursor-pointer"
                />
                <span className="flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-orange-400" />
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
            <h3 className="text-sm font-extrabold text-white">Công việc gần bạn</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#131E30] text-[#00E5FF] border border-[#23334D]">
              {filteredGigs.length}
            </span>
          </div>

          {isClient && (
            <button
              onClick={onOpenCreateGig}
              className="text-xs font-bold text-[#00E5FF] hover:underline"
            >
              + Đăng công việc mới
            </button>
          )}
        </div>

        {filteredGigs.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-[#0F172A] border border-[#1E293B]">
            <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white">Chưa có công việc nào quanh khu vực này</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Hiện tại chưa có công việc nào trong phạm vi tìm kiếm. Hãy là người đầu tiên đăng việc mới hoặc mở rộng bán kính tìm kiếm!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <button
                onClick={onOpenCreateGig}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-cyan-500 text-black font-extrabold text-xs hover:brightness-110 shadow-lg shadow-cyan-500/20 transition"
              >
                + Đăng Kèo Mới Ngay
              </button>
              <button
                onClick={() => {
                  setRadius(5000);
                  setCategory('Tất cả');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-[#1E293B] hover:bg-[#283952] text-xs font-bold text-[#00E5FF] transition"
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
                  className={`relative rounded-2xl p-4 transition cursor-pointer flex flex-col justify-between border ${
                    isBoosted
                      ? 'bg-gradient-to-b from-red-950/25 via-[#0F172A] to-[#0F172A] border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-1 ring-red-500/40'
                      : isSelected
                      ? 'bg-[#111C2E] border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.25)]'
                      : 'bg-[#0F172A] border-[#1E293B] hover:border-slate-700 hover:bg-[#141E33]'
                  }`}
                >
                  {/* Top tags */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isBoosted && (
                          <span className="flex items-center text-[10px] font-black text-white bg-gradient-to-r from-red-600 to-orange-600 px-2 py-0.5 rounded-md shadow-md animate-pulse">
                            <Rocket className="w-3 h-3 mr-1 text-yellow-300" /> HOT BOOST
                          </span>
                        )}
                        {gig.auctionRoomOpen && (
                          <span className="flex items-center text-[10px] font-black text-white bg-red-600 px-2 py-0.5 rounded-md shadow-md">
                            <Radio className="w-3 h-3 mr-1 animate-pulse" /> ĐẤU GIÁ MỞ
                          </span>
                        )}
                        {gig.isFlash && !isBoosted && (
                          <span className="flex items-center text-[10px] font-black text-black bg-[#FF6B00] px-2 py-0.5 rounded-md shadow-sm">
                            <Zap className="w-3 h-3 mr-0.5 fill-current" /> HỎA TỐC
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 bg-[#1A263B] px-2 py-0.5 rounded-md border border-slate-700">
                          {gig.category}
                        </span>
                      </div>

                      <span className="text-[11px] font-mono text-[#00E5FF] font-semibold flex items-center space-x-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>{gig.distanceMeters}m</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-bold text-white leading-snug line-clamp-2 mb-1.5">
                      {gig.title}
                    </h4>

                    {/* Description */}
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {gig.description}
                    </p>
                  </div>

                  {/* Metadata & Pricing footer */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 py-2 border-t border-slate-800/80 mb-3">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>~{gig.estimatedDurationMinutes} phút</span>
                      </div>

                      {gig.totalWorkersNeeded > 1 && (
                        <div className="flex items-center space-x-1 text-teal-400 font-semibold">
                          <Users className="w-3.5 h-3.5 text-teal-400" />
                          <span>
                            Nhóm {gig.multiWorkers?.length || 0}/{gig.totalWorkersNeeded} bạn
                          </span>
                        </div>
                      )}

                      {gig.isRecurringWeekly && (
                        <div className="flex items-center space-x-1 text-cyan-400 font-semibold">
                          <Repeat className="w-3.5 h-3.5" />
                          <span>Hàng tuần</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {gig.isReverseAuction ? 'Đấu giá ngược' : 'Thù lao Escrow'}
                        </span>
                        <span className="text-base font-black text-[#00E5FF]">
                          {formatVnd(gig.isReverseAuction && gig.lowestBidPrice ? gig.lowestBidPrice : gig.price)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectGigDetail(gig.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-extrabold text-xs shadow-sm transition flex items-center space-x-1 ${
                            gig.auctionRoomOpen
                              ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white hover:brightness-110'
                              : 'bg-gradient-to-r from-[#00E5FF] to-cyan-500 text-black hover:brightness-110'
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
    </div>
  );
};
