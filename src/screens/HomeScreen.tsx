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
  onOpenMarketplace?: () => void;
  onOpenVietQrScanner?: () => void;
  onOpenPaymentGateway?: () => void;
  onOpenGeminiVision?: () => void;
  onOpenFcmPush?: () => void;
  onOpenEloModal?: () => void;
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
      return 'text-purple-300 bg-purple-950/60 border-purple-500/40';
    case 'Tư vấn & Học tập':
      return 'text-[#C5E5EC] bg-[#3064AE]/30 border-[#C5E5EC]/30';
    case 'Digital Tasks':
      return 'text-indigo-300 bg-indigo-950/60 border-indigo-500/40';
    case 'Vận chuyển & Ship':
      return 'text-[#E0FAEB] bg-emerald-950/60 border-[#E0FAEB]/30';
    case 'Trợ thủ Campus':
      return 'text-[#C5E5EC] bg-[#12233B] border-[#C5E5EC]/40';
    case 'Flash Gigs':
      return 'text-amber-300 bg-amber-950/60 border-amber-500/40';
    default:
      return 'text-[#C5E5EC] bg-[#3064AE]/20 border-[#C5E5EC]/20';
  }
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectGigDetail,
  onOpenCreateGig,
  onOpenVerify,
  onOpenMarketplace,
  onOpenVietQrScanner,
  onOpenPaymentGateway,
  onOpenGeminiVision,
  onOpenFcmPush,
  onOpenEloModal,
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
        <div className="p-4 rounded-2xl bg-[#12233B] border border-[#3064AE]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-tri-gradient" />
          <div className="flex items-center space-x-3 pl-2">
            <div className="p-2.5 rounded-xl bg-[#3064AE]/30 text-[#E0FAEB] shrink-0 border border-[#C5E5EC]/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-white">Bạn đang ở tài khoản Cấp 1 (Newbie)</h4>
              <p className="text-[#C5E5EC]/80 mt-0.5">
                Chỉ được xem kèo dưới 20.000đ. Hãy xác thực CCCD gắn chip (NFC) hoặc Cổng sinh viên để mở khóa toàn bộ!
              </p>
            </div>
          </div>
          <button
            onClick={onOpenVerify}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#417AC6] to-[#C5E5EC] text-white font-extrabold text-xs shrink-0 transition shadow-md shadow-[#3064AE]/30 active:scale-95 border border-[#E0FAEB]/30 cursor-pointer"
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
          <span className="text-[11px] font-black uppercase tracking-wider text-[#C5E5EC] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E0FAEB] animate-pulse" />
            Tiện ích Campus 24/7
          </span>
          <span className="text-[10px] text-[#C5E5EC]/70 font-semibold hidden sm:inline">Trượt ngang để xem thêm tiện ích &rarr;</span>
        </div>
        <div className="flex overflow-x-auto gap-2.5 pb-2 scrollbar-none snap-x sm:grid sm:grid-cols-4 lg:grid-cols-7">
          {onOpenMarketplace && (
            <button
              onClick={onOpenMarketplace}
              className="min-w-[130px] sm:min-w-0 p-3 rounded-2xl bg-[#0E1B2E] hover:bg-[#13243C] border border-[#C5E5EC]/20 hover:border-[#C5E5EC]/40 text-left transition group shadow-sm shrink-0 snap-start active:scale-95 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 rounded-lg bg-[#3064AE]/30 text-[#E0FAEB] shadow-xs border border-[#E0FAEB]/20">
                  <BookOpen className="w-4 h-4 group-hover:scale-110 transition" />
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#E0FAEB]/20 text-[#E0FAEB] border border-[#E0FAEB]/30 font-black shadow-2xs">
                  Chợ 0đ
                </span>
              </div>
              <h5 className="font-black text-white text-xs truncate">Chợ Giáo Trình</h5>
              <p className="text-[10px] text-[#C5E5EC]/70 font-medium truncate">Trao đổi đồ KTX</p>
            </button>
          )}

          {onOpenVietQrScanner && (
            <button
              onClick={onOpenVietQrScanner}
              className="min-w-[130px] sm:min-w-0 p-3 rounded-2xl bg-[#0E1B2E] hover:bg-[#13243C] border border-[#C5E5EC]/20 hover:border-[#C5E5EC]/40 text-left transition group shadow-sm shrink-0 snap-start active:scale-95 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 rounded-lg bg-[#3064AE]/30 text-[#C5E5EC] shadow-xs border border-[#C5E5EC]/20">
                  <QrCode className="w-4 h-4 group-hover:scale-110 transition" />
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#3064AE]/30 text-[#C5E5EC] border border-[#C5E5EC]/30 font-black shadow-2xs">
                  VietQR
                </span>
              </div>
              <h5 className="font-black text-white text-xs truncate">Quét VietQR</h5>
              <p className="text-[10px] text-[#C5E5EC]/70 font-medium truncate">Nạp rút 24/7</p>
            </button>
          )}

          {onOpenPaymentGateway && (
            <button
              onClick={onOpenPaymentGateway}
              className="min-w-[130px] sm:min-w-0 p-3 rounded-2xl bg-[#0E1B2E] hover:bg-[#13243C] border border-[#C5E5EC]/20 hover:border-[#C5E5EC]/40 text-left transition group shadow-sm shrink-0 snap-start active:scale-95 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 rounded-lg bg-pink-950/40 text-pink-300 shadow-xs border border-pink-400/20">
                  <Smartphone className="w-4 h-4 group-hover:scale-110 transition" />
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-400/20 text-pink-200 border border-pink-400/30 font-black shadow-2xs">
                  MoMo
                </span>
              </div>
              <h5 className="font-black text-white text-xs truncate">Cổng Ví Điện Tử</h5>
              <p className="text-[10px] text-[#C5E5EC]/70 font-medium truncate">MoMo & ZaloPay</p>
            </button>
          )}

          {onOpenGeminiVision && (
            <button
              onClick={onOpenGeminiVision}
              className="min-w-[130px] sm:min-w-0 p-3 rounded-2xl bg-[#0E1B2E] hover:bg-[#13243C] border border-[#C5E5EC]/20 hover:border-[#C5E5EC]/40 text-left transition group shadow-sm shrink-0 snap-start active:scale-95 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 rounded-lg bg-[#3064AE]/30 text-[#E0FAEB] shadow-xs border border-[#C5E5EC]/20">
                  <GraduationCap className="w-4 h-4 group-hover:scale-110 transition" />
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#3064AE]/30 text-[#E0FAEB] border border-[#C5E5EC]/30 font-black shadow-2xs">
                  OCR AI
                </span>
              </div>
              <h5 className="font-black text-white text-xs truncate">Quét Thẻ SV</h5>
              <p className="text-[10px] text-[#C5E5EC]/70 font-medium truncate">Duyệt Cấp 2</p>
            </button>
          )}

          {onOpenEloModal && (
            <button
              onClick={onOpenEloModal}
              className="min-w-[130px] sm:min-w-0 p-3 rounded-2xl bg-[#0E1B2E] hover:bg-[#13243C] border border-[#C5E5EC]/20 hover:border-[#C5E5EC]/40 text-left transition group shadow-sm shrink-0 snap-start active:scale-95 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 rounded-lg bg-[#3064AE]/30 text-[#E0FAEB] shadow-xs border border-[#C5E5EC]/20">
                  <Award className="w-4 h-4 group-hover:scale-110 transition" />
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#3064AE]/30 text-[#E0FAEB] border border-[#C5E5EC]/30 font-black shadow-2xs">
                  ELO
                </span>
              </div>
              <h5 className="font-black text-white text-xs truncate">Điểm Tín Nhiệm</h5>
              <p className="text-[10px] text-[#C5E5EC]/70 font-medium truncate">Huy hiệu & rank</p>
            </button>
          )}

          <button
            onClick={() => setIsOfflineModalOpen(true)}
            className="min-w-[130px] sm:min-w-0 p-3 rounded-2xl bg-[#0E1B2E] hover:bg-[#13243C] border border-[#C5E5EC]/20 hover:border-[#C5E5EC]/40 text-left transition group shadow-sm shrink-0 snap-start active:scale-95 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="p-1.5 rounded-lg bg-[#3064AE]/30 text-[#C5E5EC] shadow-xs border border-[#C5E5EC]/20">
                <WifiOff className="w-4 h-4 group-hover:scale-110 transition" />
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#3064AE]/30 text-[#C5E5EC] border border-[#C5E5EC]/30 font-black shadow-2xs">
                Offline
              </span>
            </div>
            <h5 className="font-black text-white text-xs truncate">Kho Việc Offline</h5>
            <p className="text-[10px] text-[#C5E5EC]/70 font-medium truncate">Xem trong thang máy</p>
          </button>
        </div>
      </div>

      {/* Search Bar & Smart Match Controller */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {/* Keyword Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-[#C5E5EC] absolute left-3.5 top-3" />
            <input
              type="text"
              id="home-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/25 text-white text-xs placeholder:text-[#C5E5EC]/40 focus:outline-hidden focus:border-[#C5E5EC] focus:ring-2 focus:ring-[#3064AE]/30 shadow-xs transition"
              placeholder="Tìm việc làm siêu nhỏ, kéo rank, gia sư, ship hàng KTX..."
            />
            {/* Voice Search Button */}
            <button
              type="button"
              onClick={() => setIsVoiceOpen(true)}
              className="absolute right-2.5 top-2 p-1 text-[#C5E5EC]/70 hover:text-white transition rounded-lg hover:bg-[#12233B] cursor-pointer"
              title="Tìm kiếm bằng giọng nói"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          {/* AI Smart Match Toggle */}
          <button
            id="ai-smart-match-btn"
            onClick={toggleSmartMatch}
            className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl border text-xs font-black transition shadow-xs active:scale-95 cursor-pointer ${
              aiSmartMatchActive
                ? 'bg-gradient-to-r from-[#3064AE] via-[#417AC6] to-[#C5E5EC] border-[#E0FAEB]/40 text-white shadow-lg shadow-[#3064AE]/30 ring-2 ring-[#C5E5EC]/40'
                : 'bg-[#0E1B2E] border-[#C5E5EC]/25 text-[#C5E5EC] hover:border-[#C5E5EC]/50 hover:bg-[#13243C]'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${aiSmartMatchActive ? 'text-[#E0FAEB] animate-spin-slow' : 'text-[#C5E5EC]'}`} />
            <span className="hidden sm:inline">AI Smart Match</span>
            <span className="sm:hidden">AI Match</span>
          </button>

          {/* Advanced Filter Toggle */}
          <button
            onClick={() => setShowAdvancedFilters((p) => !p)}
            className={`p-2.5 rounded-2xl border text-xs transition shadow-xs active:scale-95 cursor-pointer ${
              showAdvancedFilters
                ? 'bg-[#3064AE] text-white border-[#C5E5EC] shadow-md shadow-[#3064AE]/30'
                : 'bg-[#0E1B2E] border-[#C5E5EC]/25 text-[#C5E5EC] hover:border-[#C5E5EC]/40 hover:bg-[#13243C]'
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
                className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border shadow-xs active:scale-95 cursor-pointer ${
                  isSelected
                    ? cat === 'Flash Gigs'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400 shadow-md shadow-amber-500/30'
                      : 'bg-gradient-to-r from-[#3064AE] to-[#255294] text-white border-[#C5E5EC]/50 shadow-md shadow-[#3064AE]/30'
                    : 'bg-[#0E1B2E] border-[#C5E5EC]/20 text-[#C5E5EC]/80 hover:text-white hover:border-[#C5E5EC]/40 hover:bg-[#13243C]'
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
          <div className="p-4 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/25 space-y-3 text-xs shadow-xl animate-fade-in text-white">
            {/* Price filter chips */}
            <div>
              <span className="text-[#C5E5EC] font-bold block mb-1.5">Mức tiền thù lao:</span>
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
                    className={`px-3 py-1 rounded-lg border font-bold text-[11px] transition cursor-pointer ${
                      selectedPriceFilter === p.value
                        ? 'bg-[#3064AE] text-white border-[#C5E5EC] shadow-xs'
                        : 'bg-[#12233B] text-[#C5E5EC] border-[#C5E5EC]/20 hover:bg-[#162B48]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration filter chips */}
            <div>
              <span className="text-[#C5E5EC] font-bold block mb-1.5">Thời lượng hoàn thành:</span>
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
                    className={`px-3 py-1 rounded-lg border font-bold text-[11px] transition cursor-pointer ${
                      selectedDurationFilter === d.value
                        ? 'bg-[#3064AE] text-white border-[#C5E5EC] shadow-xs'
                        : 'bg-[#12233B] text-[#C5E5EC] border-[#C5E5EC]/20 hover:bg-[#162B48]'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkbox toggles: Recurring & Multi-worker */}
            <div className="flex flex-wrap gap-4 pt-2 border-t border-[#C5E5EC]/15">
              <label className="flex items-center space-x-2 cursor-pointer text-[#C5E5EC] font-semibold">
                <input
                  type="checkbox"
                  checked={filterRecurringOnly}
                  onChange={toggleFilterRecurring}
                  className="w-4 h-4 accent-[#3064AE] rounded cursor-pointer"
                />
                <span className="flex items-center space-x-1">
                  <Repeat className="w-3.5 h-3.5 text-[#E0FAEB]" />
                  <span>Kèo định kỳ / Thuê theo tuần</span>
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-[#C5E5EC] font-semibold">
                <input
                  type="checkbox"
                  checked={filterMultiWorkerOnly}
                  onChange={toggleFilterMultiWorker}
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
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
            <h3 className="text-sm sm:text-base font-extrabold text-white">Công việc quanh bạn</h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#3064AE]/30 text-[#C5E5EC] border border-[#C5E5EC]/25 shadow-2xs">
              {filteredGigs.length}
            </span>
          </div>

          <button
            onClick={onOpenCreateGig}
            className="text-xs font-bold text-[#C5E5EC] hover:text-[#E0FAEB] flex items-center space-x-1 cursor-pointer transition"
          >
            <span>+ Đăng việc mới</span>
          </button>
        </div>

        {filteredGigs.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/20 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-[#3064AE]/30 text-[#C5E5EC] border border-[#C5E5EC]/20 flex items-center justify-center mx-auto mb-3.5 shadow-md">
              <MapPin className="w-8 h-8" />
            </div>
            <h4 className="text-base font-extrabold text-white">Chưa có công việc nào quanh khu vực này</h4>
            <p className="text-xs text-[#C5E5EC]/70 mt-1.5 max-w-sm mx-auto leading-relaxed">
              Hiện tại chưa có công việc nào trong phạm vi tìm kiếm. Hãy là người đầu tiên đăng việc mới hoặc mở rộng bán kính tìm kiếm!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
              <button
                onClick={onOpenCreateGig}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#417AC6] to-[#C5E5EC] text-white font-extrabold text-xs hover:brightness-110 shadow-md shadow-[#3064AE]/30 transition active:scale-95 border border-[#E0FAEB]/30 cursor-pointer"
              >
                + Đăng Kèo Mới Ngay
              </button>
              <button
                onClick={() => {
                  setRadius(5000);
                  setCategory('Tất cả');
                  setSearchQuery('');
                }}
                className="px-4 py-2.5 rounded-xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/25 text-xs font-bold text-[#C5E5EC] transition active:scale-95 cursor-pointer"
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
                      ? 'bg-gradient-to-b from-[#1E1228] to-[#0E1B2E] border-rose-400/50 shadow-xl ring-1 ring-rose-400/30'
                      : isSelected
                      ? 'bg-[#13243C] border-[#C5E5EC] shadow-2xl ring-2 ring-[#3064AE]/60'
                      : 'bg-[#0E1B2E] border-[#C5E5EC]/20 hover:border-[#C5E5EC]/50 hover:bg-[#12233B] shadow-lg shadow-[#0A1424]/40'
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

                      <span className="text-[11px] font-mono text-[#C5E5EC] font-black flex items-center space-x-0.5 bg-[#3064AE]/20 px-2 py-0.5 rounded-md border border-[#C5E5EC]/25">
                        <MapPin className="w-3 h-3 text-[#C5E5EC]" />
                        <span>{gig.distanceMeters}m</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-bold text-white leading-snug line-clamp-2 mb-1.5 hover:text-[#C5E5EC] transition">
                      {gig.title}
                    </h4>

                    {/* Description */}
                    <p className="text-xs text-[#C5E5EC]/75 line-clamp-2 mb-3 leading-relaxed">
                      {gig.description}
                    </p>
                  </div>

                  {/* Metadata & Pricing footer */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[#C5E5EC]/70 py-2 border-t border-[#C5E5EC]/15 mb-3">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-[#C5E5EC]" />
                        <span className="font-semibold text-[#C5E5EC]/90">~{gig.estimatedDurationMinutes} phút</span>
                      </div>

                      {gig.totalWorkersNeeded > 1 && (
                        <div className="flex items-center space-x-1 text-[#E0FAEB] font-bold bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-400/30">
                          <Users className="w-3.5 h-3.5 text-teal-300" />
                          <span>
                            Nhóm {gig.multiWorkers?.length || 0}/{gig.totalWorkersNeeded} bạn
                          </span>
                        </div>
                      )}

                      {gig.isRecurringWeekly && (
                        <div className="flex items-center space-x-1 text-[#C5E5EC] font-bold bg-[#3064AE]/25 px-2 py-0.5 rounded-md border border-[#C5E5EC]/30">
                          <Repeat className="w-3.5 h-3.5 text-[#C5E5EC]" />
                          <span>Hàng tuần</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#C5E5EC]/70 block font-bold mb-0.5">
                          {gig.isReverseAuction ? 'Đấu giá ngược' : 'Thù lao Escrow'}
                        </span>
                        <div className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#12233B] border border-[#E0FAEB]/30 shadow-2xs">
                          <span className="text-base font-black text-[#E0FAEB] font-mono">
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
                          className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-md transition flex items-center space-x-1 active:scale-95 cursor-pointer ${
                            gig.auctionRoomOpen
                              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:brightness-105 shadow-red-500/20'
                              : 'bg-gradient-to-r from-[#3064AE] via-[#417AC6] to-[#C5E5EC] text-white hover:brightness-110 shadow-[#3064AE]/30 border border-[#E0FAEB]/30'
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
