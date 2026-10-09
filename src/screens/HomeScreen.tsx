import React, { useState, Suspense, lazy } from 'react';
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
  Navigation,
  Scale,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Layers,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { useTranslation } from '../context/LanguageContext';
import { formatVnd, GigEntity } from '../types';
import { VIETNAM_HUBS } from '../utils/geo';
import { triggerHaptic } from '../utils/haptics';
import { PullToRefresh } from '../components/PullToRefresh';
import { VerifiedIdentityBadge } from '../components/VerifiedIdentityBadge';
import { FlashGigsSkeleton, GigListSkeleton } from '../components/GigCardSkeleton';

// Lazy load heavy components for instant initial page render (Code-Splitting)
const InteractiveRadar = lazy(() =>
  import('../components/InteractiveRadar').then((m) => ({ default: m.InteractiveRadar }))
);
const VoiceSearchDialog = lazy(() =>
  import('../components/AdvancedDialogs').then((m) => ({ default: m.VoiceSearchDialog }))
);
const OfflineGigsModal = lazy(() =>
  import('../components/OfflineGigsModal').then((m) => ({ default: m.OfflineGigsModal }))
);


interface HomeScreenProps {
  onSelectGigDetail: (gigId: string) => void;
  onOpenCreateGig: () => void;
  onOpenVerify: () => void;
  onOpenMarketplace?: () => void;
  onOpenLaw?: () => void;
  onOpenVietQrScanner?: () => void;
  onOpenPaymentGateway?: () => void;
  onOpenGeminiVision?: () => void;
  onOpenFcmPush?: () => void;
  onOpenEloModal?: () => void;
  onOpenDownloadApp?: () => void;
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
  onOpenLaw,
  onOpenVietQrScanner,
  onOpenPaymentGateway,
  onOpenGeminiVision,
  onOpenFcmPush,
  onOpenEloModal,
  onOpenDownloadApp,
}) => {
  const {
    isGigsLoading,
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
    refreshCloudConnection,
    users,
  } = useGigMe();
  const { language, t } = useTranslation();

  const getCategoryLabel = (cat: string) => {
    if (language === 'vi') return cat;
    switch (cat) {
      case 'Tất cả': return t('filterAll');
      case 'Flash Gigs': return t('filterFlashGigs');
      case 'Cày Game & Rank': return t('filterGaming');
      case 'Tư vấn & Học tập': return t('filterTutoring');
      case 'Digital Tasks': return t('filterDigital');
      case 'Vận chuyển & Ship': return t('filterDelivery');
      case 'Trợ thủ Campus': return t('filterCampusHelp');
      case 'Mua đồ ăn, cà phê, trà sữa hộ': return 'Food & Beverage Delivery';
      case 'Giao nhận & Ship hàng tận phòng KTX': return 'Dorm Package Delivery';
      case 'Giặt ủi & Phơi quần áo KTX': return 'Dorm Laundry & Drying';
      case 'Dọn phòng & Vệ sinh KTX / Nhà trọ': return 'Dorm Room Cleaning';
      case 'Giữ chỗ thư viện / Xếp hàng hộ': return 'Library Seat & Line Holding';
      case 'Gia sư & Kèm môn đại cương (Toán, Lý, Xác suất)': return 'General Math & Physics Tutoring';
      case 'Gia sư Ngoại ngữ (IELTS, TOEIC, HSK, N3)': return 'Language Tutoring (IELTS, TOEIC)';
      case 'Hướng dẫn Đồ án / Bài tập lớn / Khóa luận': return 'Project & Thesis Mentoring';
      case 'Thiết kế Slide Powerpoint & Thuyết trình': return 'PowerPoint Slide & Pitch Deck Design';
      case 'Soạn thảo văn bản & Định dạng chuẩn đồ án': return 'Document Formatting & Typesetting';
      case 'Cắt ghép Video CapCut / TikTok / Reels': return 'CapCut & TikTok Video Editing';
      case 'Thiết kế Poster, Banner Canva & Photoshop': return 'Canva & Photoshop Banner Design';
      case 'Lập trình Web / Mobile / Fix Bug Code': return 'Web / Mobile / Code Bug Fix';
      case 'Cài Win, Vệ sinh Laptop & Cài đặt phần mềm': return 'OS Install & Laptop Maintenance';
      case 'Chụp ảnh kỷ yếu / Quay phim sự kiện trường': return 'Graduation Photo & Campus Event Filming';
      case 'Cày Rank & Kéo Rank Game (Liên Quân, LMHT, Valorant)': return 'Game Rank Boosting (LoL, Valorant)';
      case 'Trông thú cưng KTX / Dắt cún đi dạo': return 'Pet Sitting & Dog Walking';
      case 'Chở xe máy / Đi chung xe campus / Về quê': return 'Bike Ride & Campus Carpooling';
      case 'Tham gia khảo sát nghiên cứu khoa học': return 'Scientific Survey Participation';
      case 'Hỗ trợ sự kiện, Tiếp tân, Hậu cần CLB': return 'Club Event Support & Logistics';
      case 'Dịch thuật tài liệu Anh - Việt, Trung - Việt': return 'English - Vietnamese Translation';
      case 'Khác': return 'Other';
      default: return cat;
    }
  };

  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const isClient = roleMode === 'CLIENT';

  // Mobile Smooth Scroll-Snap View Mode ('SNAP' or 'GRID')
  const [viewMode, setViewMode] = useState<'SNAP' | 'GRID'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('gigme_home_view_mode');
        if (saved === 'SNAP' || saved === 'GRID') return saved;
      } catch {}
    }
    return 'SNAP';
  });

  const handleSetViewMode = (mode: 'SNAP' | 'GRID') => {
    triggerHaptic('light');
    setViewMode(mode);
    try {
      localStorage.setItem('gigme_home_view_mode', mode);
    } catch {}
  };

  const gigsCarouselRef = React.useRef<HTMLDivElement>(null);
  const flashCarouselRef = React.useRef<HTMLDivElement>(null);
  const categoriesCarouselRef = React.useRef<HTMLDivElement>(null);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(0);
  const [currentFlashSnapIndex, setCurrentFlashSnapIndex] = useState(0);
  const scrollSnapRafRef = React.useRef<number | null>(null);
  const flashSnapRafRef = React.useRef<number | null>(null);

  const handleScrollSnap = () => {
    if (!gigsCarouselRef.current) return;
    if (scrollSnapRafRef.current) cancelAnimationFrame(scrollSnapRafRef.current);
    scrollSnapRafRef.current = requestAnimationFrame(() => {
      const container = gigsCarouselRef.current;
      if (!container) return;
      const children = Array.from(container.children) as HTMLElement[];
      if (children.length === 0) return;

      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      let closestIndex = 0;
      let minDistance = Infinity;

      children.forEach((child, idx) => {
        const childRect = child.getBoundingClientRect();
        const childCenter = childRect.left + childRect.width / 2;
        const distance = Math.abs(childCenter - containerCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = idx;
        }
      });

      setCurrentSnapIndex((prev) => {
        if (prev !== closestIndex) {
          triggerHaptic('selection');
        }
        return closestIndex;
      });
    });
  };

  const scrollToGig = (index: number) => {
    if (!gigsCarouselRef.current) return;
    const container = gigsCarouselRef.current;
    const children = Array.from(container.children) as HTMLElement[];
    const targetChild = children[index];
    triggerHaptic('light');
    if (targetChild) {
      const containerPaddingLeft = parseFloat(getComputedStyle(container).paddingLeft || '0');
      const targetLeft = targetChild.offsetLeft - containerPaddingLeft;
      container.scrollTo({
        left: targetLeft,
        behavior: 'smooth',
      });
    } else {
      const cardWidth = children[0]?.offsetWidth ? children[0].offsetWidth + 16 : 320;
      container.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth',
      });
    }
    setCurrentSnapIndex(index);
  };

  const handleFlashScrollSnap = () => {
    if (!flashCarouselRef.current) return;
    if (flashSnapRafRef.current) cancelAnimationFrame(flashSnapRafRef.current);
    flashSnapRafRef.current = requestAnimationFrame(() => {
      const container = flashCarouselRef.current;
      if (!container) return;
      const children = Array.from(container.children) as HTMLElement[];
      if (children.length === 0) return;

      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      let closestIndex = 0;
      let minDistance = Infinity;

      children.forEach((child, idx) => {
        const childRect = child.getBoundingClientRect();
        const childCenter = childRect.left + childRect.width / 2;
        const distance = Math.abs(childCenter - containerCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = idx;
        }
      });

      setCurrentFlashSnapIndex((prev) => {
        if (prev !== closestIndex) {
          triggerHaptic('selection');
        }
        return closestIndex;
      });
    });
  };

  const scrollToFlashGig = (index: number) => {
    if (!flashCarouselRef.current) return;
    const container = flashCarouselRef.current;
    const children = Array.from(container.children) as HTMLElement[];
    const targetChild = children[index];
    triggerHaptic('light');
    if (targetChild) {
      const containerPaddingLeft = parseFloat(getComputedStyle(container).paddingLeft || '0');
      container.scrollTo({
        left: targetChild.offsetLeft - containerPaddingLeft,
        behavior: 'smooth',
      });
    }
    setCurrentFlashSnapIndex(index);
  };

  const flashGigs = React.useMemo(() => {
    return filteredGigs.filter((g) => g.isFlash || g.isBoosted);
  }, [filteredGigs]);

  const renderGigCard = (gig: GigEntity, isSnapCard = false, isActiveSnap = false) => {
    const isSelected = selectedGigId === gig.id;
    const isBoosted = !!(gig.isBoosted && gig.boostedUntil && gig.boostedUntil > Date.now());

    return (
      <div
        key={gig.id}
        onClick={() => selectGig(gig.id)}
        className={`relative rounded-2xl p-4 transition-all duration-300 cursor-pointer flex flex-col justify-between border ${
          isSnapCard
            ? `scroll-snap-card snap-center sm:snap-start shrink-0 w-[84vw] max-w-[340px] sm:w-[320px] md:w-[340px] shadow-lg select-none ${
                isActiveSnap
                  ? 'ring-2 ring-[#C5E5EC]/80 border-[#C5E5EC] scale-[1.01] shadow-2xl shadow-[#3064AE]/20'
                  : 'opacity-95 hover:opacity-100'
              }`
            : ''
        } ${
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
                  <Rocket className="w-3 h-3 mr-1 text-yellow-300" /> {t('hotBoost')}
                </span>
              )}
              {gig.isFlash && !isBoosted && (
                <span className="flex items-center text-[10px] font-extrabold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 rounded-md shadow-xs">
                  <Zap className="w-3 h-3 mr-0.5 fill-current" /> {t('urgentBadge')}
                </span>
              )}
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border shadow-2xs ${getCategoryBadgeStyle(gig.category)}`}>
                {getCategoryLabel(gig.category)}
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

          {/* Poster Info & Verification Badge */}
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 mb-2">
            <span className="text-[11px] font-bold text-slate-300">
              {gig.clientName}
            </span>
            {(() => {
              const poster = users.find((u) => u.id === gig.clientId);
              const isCccd = poster?.isNfcVerified || gig.clientTier === 'CCCD_VERIFIED' || gig.clientTier === 'PRO';
              const isStudent = poster?.isStudentVerified || poster?.isEduVerified || gig.clientTier === 'STUDENT';
              const school = poster?.studentSchool || '';

              if (isCccd || isStudent) {
                return (
                  <VerifiedIdentityBadge
                    isCccdVerified={isCccd}
                    isStudentVerified={isStudent}
                    school={school}
                    size="sm"
                    showText={true}
                  />
                );
              }
              return null;
            })()}
          </div>

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
              <span className="font-semibold text-[#C5E5EC]/90">
                ~{gig.estimatedDurationMinutes} {language === 'vi' ? 'phút' : 'mins'}
              </span>
            </div>

            {gig.totalWorkersNeeded > 1 && (
              <div className="flex items-center space-x-1 text-[#E0FAEB] font-bold bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-400/30">
                <Users className="w-3.5 h-3.5 text-teal-300" />
                <span>
                  {language === 'vi'
                    ? `Nhóm ${gig.multiWorkers?.length || 0}/${gig.totalWorkersNeeded} bạn`
                    : `Team ${gig.multiWorkers?.length || 0}/${gig.totalWorkersNeeded} students`}
                </span>
              </div>
            )}

            {gig.isRecurringWeekly && (
              <div className="flex items-center space-x-1 text-[#C5E5EC] font-bold bg-[#3064AE]/25 px-2 py-0.5 rounded-md border border-[#C5E5EC]/30">
                <Repeat className="w-3.5 h-3.5 text-[#C5E5EC]" />
                <span>{t('weekly')}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#C5E5EC]/70 block font-bold mb-0.5">
                {t('escrowReward')}
              </span>
              <div className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#12233B] border border-[#E0FAEB]/30 shadow-2xs">
                <span className="text-base font-black text-[#E0FAEB] font-mono">
                  {formatVnd(gig.price)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('medium');
                  onSelectGigDetail(gig.id);
                }}
                className="px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-md transition flex items-center space-x-1 active:scale-95 cursor-pointer bg-gradient-to-r from-[#3064AE] via-[#417AC6] to-[#C5E5EC] text-white hover:brightness-110 shadow-[#3064AE]/30 border border-[#E0FAEB]/30"
              >
                <span>{t('viewGig')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handlePullRefresh = async () => {
    try {
      await refreshCloudConnection();
    } catch {
      // ignore
    }
  };

  return (
    <PullToRefresh onRefresh={handlePullRefresh}>
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
              <h4 className="font-extrabold text-white">
                {language === 'vi' ? 'Bạn đang ở tài khoản Cấp 1 (Newbie)' : 'Level 1 Account (Newbie)'}
              </h4>
              <p className="text-[#C5E5EC]/80 mt-0.5">
                {language === 'vi'
                  ? 'Chỉ được xem kèo dưới 20.000đ. Hãy xác thực CCCD gắn chip (NFC) hoặc Cổng sinh viên để mở khóa toàn bộ!'
                  : 'Only jobs under 20,000 VND visible. Verify your NFC National ID or Student Portal to unlock all jobs!'}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenVerify}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#417AC6] to-[#C5E5EC] text-white font-extrabold text-xs shrink-0 transition shadow-md shadow-[#3064AE]/30 active:scale-95 border border-[#E0FAEB]/30 cursor-pointer"
          >
            {language === 'vi' ? 'Xác Thực Cấp 2 Ngay →' : 'Verify Level 2 Now →'}
          </button>
        </div>
      )}



      {/* Campus Quick Hub Shortcuts - Sleek swipeable carousel on mobile, neat grid on desktop */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#C5E5EC] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E0FAEB] animate-pulse" />
            {t('campusUtilities')}
          </span>
          <span className="text-[10px] text-[#C5E5EC]/70 font-semibold hidden sm:inline">
            {language === 'vi' ? 'Trượt ngang để xem thêm tiện ích →' : 'Swipe horizontally to view more →'}
          </span>
        </div>
        <div
          data-swipeable="true"
          className="scroll-snap-x snap-x snap-mandatory flex overflow-x-auto gap-2.5 pb-2 scrollbar-none sm:grid sm:grid-cols-4 lg:grid-cols-7 touch-pan-x overscroll-x-contain scroll-smooth"
        >
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
                  {t('freeMarket')}
                </span>
              </div>
              <h5 className="font-black text-white text-xs truncate">{t('dormMarket')}</h5>
              <p className="text-[10px] text-[#C5E5EC]/70 font-medium truncate">{t('dormMarketDesc')}</p>
            </button>
          )}

          {onOpenLaw && (
            <button
              onClick={onOpenLaw}
              className="min-w-[130px] sm:min-w-0 p-3 rounded-2xl bg-[#0E1B2E] hover:bg-[#13243C] border border-amber-500/20 hover:border-amber-400 text-left transition group shadow-sm shrink-0 snap-start active:scale-95 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 shadow-xs border border-amber-500/30">
                  <Scale className="w-4 h-4 group-hover:scale-110 transition" />
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-black shadow-2xs">
                  {t('rules18')}
                </span>
              </div>
              <h5 className="font-black text-white text-xs truncate">{t('campusLaw')}</h5>
              <p className="text-[10px] text-[#C5E5EC]/70 font-medium truncate">{t('campusLawDesc')}</p>
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
              <h5 className="font-black text-white text-xs truncate">{t('scanVietQr')}</h5>
              <p className="text-[10px] text-[#C5E5EC]/70 font-medium truncate">{t('scanVietQrDesc')}</p>
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
              <h5 className="font-black text-white text-xs truncate">{t('quickTopup')}</h5>
              <p className="text-[10px] text-[#C5E5EC]/70 font-medium truncate">{t('quickTopupDesc')}</p>
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
              <h5 className="font-black text-white text-xs truncate">
                {language === 'vi' ? 'Quét Thẻ SV' : 'Student ID OCR'}
              </h5>
              <p className="text-[10px] text-[#C5E5EC]/70 font-medium truncate">
                {language === 'vi' ? 'Duyệt Cấp 2' : 'Level 2 Verify'}
              </p>
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
              <h5 className="font-black text-white text-xs truncate">{t('eloBadge')}</h5>
              <p className="text-[10px] text-[#C5E5EC]/70 font-medium truncate">{t('eloBadgeDesc')}</p>
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
            <h5 className="font-black text-white text-xs truncate">
              {language === 'vi' ? 'Kho Việc Offline' : 'Offline Gigs'}
            </h5>
            <p className="text-[10px] text-[#C5E5EC]/70 font-medium truncate">
              {language === 'vi' ? 'Xem trong thang máy' : 'Elevator / No 4G'}
            </p>
          </button>

          {onOpenDownloadApp && (
            <button
              onClick={onOpenDownloadApp}
              className="min-w-[130px] sm:min-w-0 p-3 rounded-2xl bg-gradient-to-br from-[#122846] to-[#0E1B2E] hover:from-[#173258] hover:to-[#13243C] border border-[#3064AE] hover:border-[#C5E5EC]/50 text-left transition group shadow-sm shrink-0 snap-start active:scale-95 cursor-pointer ring-1 ring-[#3064AE]/30"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 rounded-lg bg-[#3064AE] text-white shadow-xs border border-[#E0FAEB]/30">
                  <Smartphone className="w-4 h-4 group-hover:scale-110 transition text-[#E0FAEB]" />
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black shadow-2xs">
                  {t('oneTapInstall')}
                </span>
              </div>
              <h5 className="font-black text-white text-xs truncate">{t('downloadApp')}</h5>
              <p className="text-[10px] text-[#E0FAEB] font-bold truncate">{t('downloadAppDesc')}</p>
            </button>
          )}
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
              placeholder={t('searchPlaceholder')}
            />
            {/* Voice Search Button */}
            <button
              type="button"
              onClick={() => setIsVoiceOpen(true)}
              className="absolute right-2.5 top-2 p-1 text-[#C5E5EC]/70 hover:text-white transition rounded-lg hover:bg-[#12233B] cursor-pointer"
              title={t('voiceSearch')}
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
            title={t('advancedFilters')}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Categories Carousel */}
        <div
          ref={categoriesCarouselRef}
          data-swipeable="true"
          className="scroll-snap-x snap-x flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x overscroll-x-contain scroll-smooth px-0.5"
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={(e) => {
                  triggerHaptic('light');
                  setCategory(cat);
                  try {
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                  } catch {}
                }}
                className={`scroll-snap-start snap-start flex items-center space-x-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border shadow-xs active:scale-95 cursor-pointer ${
                  isSelected
                    ? cat === 'Flash Gigs'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400 shadow-md shadow-amber-500/30'
                      : 'bg-gradient-to-r from-[#3064AE] to-[#255294] text-white border-[#C5E5EC]/50 shadow-md shadow-[#3064AE]/30'
                    : 'bg-[#0E1B2E] border-[#C5E5EC]/20 text-[#C5E5EC]/80 hover:text-white hover:border-[#C5E5EC]/40 hover:bg-[#13243C]'
                }`}
              >
                {cat === 'Flash Gigs' && <Zap className="w-3 h-3 fill-current text-amber-300" />}
                <span>{getCategoryLabel(cat)}</span>
              </button>
            );
          })}
        </div>

        {/* Collapsible Advanced Filters (Price, Duration, Multi-worker, Recurring) */}
        {showAdvancedFilters && (
          <div className="p-4 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/25 space-y-3 text-xs shadow-xl animate-fade-in text-white">
            {/* Price filter chips */}
            <div>
              <span className="text-[#C5E5EC] font-bold block mb-1.5">
                {language === 'vi' ? 'Mức tiền thù lao:' : 'Budget range:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: language === 'vi' ? 'Tất cả mức giá' : 'All budgets', value: 'ALL' },
                  { label: language === 'vi' ? '< 50.000đ' : '< 50,000 VND', value: '<50K' },
                  { label: language === 'vi' ? '50.000đ - 200.000đ' : '50,000 - 200,000 VND', value: '50K-200K' },
                  { label: language === 'vi' ? '> 200.000đ' : '> 200,000 VND', value: '>200K' },
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
              <span className="text-[#C5E5EC] font-bold block mb-1.5">
                {language === 'vi' ? 'Thời lượng hoàn thành:' : 'Estimated duration:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: language === 'vi' ? 'Tất cả thời lượng' : 'All durations', value: 'ALL' },
                  { label: language === 'vi' ? 'Siêu tốc (< 15 phút)' : 'Super fast (< 15 mins)', value: '<15M' },
                  { label: language === 'vi' ? '15 - 60 phút' : '15 - 60 mins', value: '15-60M' },
                  { label: language === 'vi' ? 'Trên 60 phút' : 'Over 60 mins', value: '>60M' },
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
                  <span>
                    {language === 'vi' ? 'Kèo định kỳ / Thuê theo tuần' : 'Recurring / Weekly jobs'}
                  </span>
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
                  <span>
                    {language === 'vi' ? 'Kèo ghép nhóm (>1 người cùng làm)' : 'Group jobs (>1 student)'}
                  </span>
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Flash Gigs Snap Carousel (if loading or any flash/boosted gigs exist) */}
      {isGigsLoading ? (
        <FlashGigsSkeleton />
      ) : flashGigs.length > 0 ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs">
                <Zap className="w-3.5 h-3.5 fill-current" />
              </span>
              <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>{language === 'vi' ? 'Kèo Hỏa Tốc & Hot Boost' : 'Urgent & Hot Boost Gigs'}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold border border-rose-500/30">
                  {flashGigs.length}
                </span>
              </h4>
            </div>

            {flashGigs.length > 1 ? (
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-mono text-amber-300 font-bold hidden sm:inline">
                  {currentFlashSnapIndex + 1}/{flashGigs.length}
                </span>
                <button
                  type="button"
                  disabled={currentFlashSnapIndex <= 0}
                  onClick={() => scrollToFlashGig(currentFlashSnapIndex - 1)}
                  className="p-1 rounded-lg bg-[#0E1B2E] border border-[#C5E5EC]/20 text-[#C5E5EC] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#12233B] active:scale-90 transition cursor-pointer"
                  aria-label="Previous Flash Gig"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={currentFlashSnapIndex >= flashGigs.length - 1}
                  onClick={() => scrollToFlashGig(currentFlashSnapIndex + 1)}
                  className="p-1 rounded-lg bg-[#0E1B2E] border border-[#C5E5EC]/20 text-[#C5E5EC] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#12233B] active:scale-90 transition cursor-pointer"
                  aria-label="Next Flash Gig"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span className="text-[10px] text-[#C5E5EC]/60 font-semibold sm:hidden">
                {language === 'vi' ? 'Trượt ngang ➔' : 'Swipe ➔'}
              </span>
            )}
          </div>
          <div
            ref={flashCarouselRef}
            onScroll={handleFlashScrollSnap}
            data-swipeable="true"
            className="scroll-snap-x snap-x snap-mandatory flex overflow-x-auto gap-3.5 pb-2 pt-1 touch-pan-x overscroll-x-contain scrollbar-none px-0.5 scroll-smooth"
          >
            {flashGigs.map((gig, idx) => renderGigCard(gig, true, idx === currentFlashSnapIndex))}
          </div>
        </div>
      ) : null}

      {/* Main Gigs List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm sm:text-base font-extrabold text-white">{t('availableGigsTitle')}</h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#3064AE]/30 text-[#C5E5EC] border border-[#C5E5EC]/25 shadow-2xs">
              {filteredGigs.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle: Snap Carousel vs Grid */}
            <div className="flex items-center bg-[#0E1B2E] p-0.5 rounded-xl border border-[#C5E5EC]/20 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => handleSetViewMode('SNAP')}
                className={`px-2 py-1 rounded-lg flex items-center space-x-1 transition cursor-pointer ${
                  viewMode === 'SNAP'
                    ? 'bg-[#3064AE] text-white shadow-xs font-black'
                    : 'text-[#C5E5EC]/70 hover:text-white'
                }`}
                title={language === 'vi' ? 'Lướt thẻ Snap mượt mà' : 'Smooth Snap Carousel'}
              >
                <Layers className="w-3 h-3" />
                <span>{language === 'vi' ? 'Lướt Snap' : 'Snap'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetViewMode('GRID')}
                className={`px-2 py-1 rounded-lg flex items-center space-x-1 transition cursor-pointer ${
                  viewMode === 'GRID'
                    ? 'bg-[#3064AE] text-white shadow-xs font-black'
                    : 'text-[#C5E5EC]/70 hover:text-white'
                }`}
                title={language === 'vi' ? 'Dạng lưới' : 'Grid layout'}
              >
                <LayoutGrid className="w-3 h-3" />
                <span>{language === 'vi' ? 'Lưới' : 'Grid'}</span>
              </button>
            </div>

            <button
              onClick={onOpenCreateGig}
              className="text-xs font-bold text-[#C5E5EC] hover:text-[#E0FAEB] flex items-center space-x-1 cursor-pointer transition"
            >
              <span>+ {t('navCreateGig')}</span>
            </button>
          </div>
        </div>

        {isGigsLoading ? (
          <GigListSkeleton viewMode={viewMode} count={viewMode === 'SNAP' ? 3 : 6} />
        ) : filteredGigs.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/20 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-[#3064AE]/30 text-[#C5E5EC] border border-[#C5E5EC]/20 flex items-center justify-center mx-auto mb-3.5 shadow-md">
              <MapPin className="w-8 h-8" />
            </div>
            <h4 className="text-base font-extrabold text-white">{t('noGigsFound')}</h4>
            <p className="text-xs text-[#C5E5EC]/70 mt-1.5 max-w-sm mx-auto leading-relaxed">
              {t('noGigsSubtext')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
              <button
                onClick={onOpenCreateGig}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#417AC6] to-[#C5E5EC] text-white font-extrabold text-xs hover:brightness-110 shadow-md shadow-[#3064AE]/30 transition active:scale-95 border border-[#E0FAEB]/30 cursor-pointer"
              >
                + {t('postGigCta')}
              </button>
              <button
                onClick={() => {
                  setRadius(5000);
                  setCategory('Tất cả');
                  setSearchQuery('');
                }}
                className="px-4 py-2.5 rounded-xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/25 text-xs font-bold text-[#C5E5EC] transition active:scale-95 cursor-pointer"
              >
                {t('resetFilters')}
              </button>
            </div>
          </div>
        ) : viewMode === 'SNAP' ? (
          <div className="space-y-3">
            {/* Mobile swipe helper hint */}
            <div className="flex items-center justify-between px-1 text-[11px] text-[#C5E5EC]/70">
              <span className="flex items-center gap-1 font-medium">
                <span>👈</span>
                <span>{language === 'vi' ? 'Vuốt ngang lướt nhanh kèo' : 'Swipe horizontally to browse gigs'}</span>
              </span>
              <span className="text-[10px] font-mono text-[#E0FAEB] font-bold">
                {filteredGigs.length} {language === 'vi' ? 'kèo' : 'gigs'}
              </span>
            </div>

            {/* Scroll-Snap Carousel Container */}
            <div
              ref={gigsCarouselRef}
              onScroll={handleScrollSnap}
              data-swipeable="true"
              className="scroll-snap-x snap-x snap-mandatory flex overflow-x-auto gap-4 pb-4 pt-1 touch-pan-x overscroll-x-contain scrollbar-none px-0.5 scroll-smooth"
            >
              {filteredGigs.map((gig, idx) => renderGigCard(gig, true, idx === currentSnapIndex))}
            </div>

            {/* Mobile Snap Navigation & Progress Controller */}
            {filteredGigs.length > 1 && (
              <div className="flex items-center justify-between px-1 text-xs">
                <button
                  type="button"
                  disabled={currentSnapIndex <= 0}
                  onClick={() => scrollToGig(currentSnapIndex - 1)}
                  className={`p-2 rounded-xl bg-[#0E1B2E] border border-[#C5E5EC]/25 text-[#C5E5EC] transition flex items-center space-x-1 active:scale-95 cursor-pointer ${
                    currentSnapIndex <= 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#12233B] hover:text-white'
                  }`}
                  aria-label="Previous Gig"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-[11px] font-bold hidden sm:inline">{language === 'vi' ? 'Kèo trước' : 'Previous'}</span>
                </button>

                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] font-mono font-bold text-[#C5E5EC]">
                    {language === 'vi' ? `Kèo ${currentSnapIndex + 1}/${filteredGigs.length}` : `Gig ${currentSnapIndex + 1}/${filteredGigs.length}`}
                  </span>
                  <div className="flex items-center space-x-1 max-w-[120px] overflow-hidden">
                    {filteredGigs.slice(0, 10).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => scrollToGig(idx)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          idx === currentSnapIndex
                            ? 'w-4 bg-[#E0FAEB]'
                            : 'w-1.5 bg-[#C5E5EC]/30 hover:bg-[#C5E5EC]/60'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                    {filteredGigs.length > 10 && (
                      <span className="text-[9px] text-[#C5E5EC]/60">+</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={currentSnapIndex >= filteredGigs.length - 1}
                  onClick={() => scrollToGig(currentSnapIndex + 1)}
                  className={`p-2 rounded-xl bg-[#0E1B2E] border border-[#C5E5EC]/25 text-[#C5E5EC] transition flex items-center space-x-1 active:scale-95 cursor-pointer ${
                    currentSnapIndex >= filteredGigs.length - 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#12233B] hover:text-white'
                  }`}
                  aria-label="Next Gig"
                >
                  <span className="text-[11px] font-bold hidden sm:inline">{language === 'vi' ? 'Kèo tiếp' : 'Next'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGigs.map((gig) => renderGigCard(gig, false))}
          </div>
        )}
      </div>

      {/* Interactive Geofence Radar & Google Maps Discovery View (Bản Đồ Radar Campus - Chuyển xuống cuối trang theo yêu cầu) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-gradient-to-r from-[#3064AE] to-[#417AC6] text-white shadow-xs">
              <Navigation className="w-4 h-4 text-[#E0FAEB]" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                {language === 'vi' ? 'Bản Đồ Radar Định Vị Việc Làm' : 'Campus Jobs Radar Map'}
              </h3>
              <p className="text-[11px] text-[#C5E5EC]/70">
                {language === 'vi' ? 'Quét định vị GPS & bắt kèo theo thời gian thực quanh Campus' : 'Real-time GPS radar matching around campuses'}
              </p>
            </div>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="w-full h-80 rounded-3xl bg-gradient-to-b from-[#0D192B] to-[#102038] border border-[#3064AE]/30 flex flex-col items-center justify-center p-6 space-y-3 relative overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-[radial-gradient(#3064AE_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border border-[#3064AE]/50 animate-ping absolute opacity-30" />
                <div className="w-12 h-12 rounded-full border-2 border-t-[#3064AE] border-r-[#C5E5EC] border-b-transparent border-l-transparent animate-spin" />
                <Navigation className="w-5 h-5 text-[#C5E5EC] absolute" />
              </div>
              <div className="text-center relative z-10">
                <p className="text-xs font-bold text-white tracking-wide">
                  {language === 'vi' ? 'Đang nạp Bản đồ Radar GPS Campus' : 'Loading Campus GPS Radar Map'}
                </p>
                <p className="text-[11px] text-[#C5E5EC]/70 mt-0.5">
                  {language === 'vi' ? 'Tải nền bất đồng bộ - Tiết kiệm dung lượng & khởi động siêu tốc' : 'Async background load - Ultra fast & data saving'}
                </p>
              </div>
            </div>
          }
        >
          <InteractiveRadar
            gigs={filteredGigs}
            selectedGigId={selectedGigId}
            onSelectGig={(id) => {
              selectGig(id ? id : null);
            }}
            radiusMeters={selectedRadiusMeters}
            onRadiusChange={setRadius}
            isClientMode={isClient}
            userCoords={userCoords}
            onUserCoordsChange={setUserCoords}
          />
        </Suspense>
      </div>

      {/* Voice Search Modal */}
      {isVoiceOpen && (
        <Suspense fallback={null}>
          <VoiceSearchDialog
            isOpen={isVoiceOpen}
            onClose={() => setIsVoiceOpen(false)}
            onSelectQuery={(q) => setSearchQuery(q)}
          />
        </Suspense>
      )}

      {/* Offline Gigs Cache Modal */}
      {isOfflineModalOpen && (
        <Suspense fallback={null}>
          <OfflineGigsModal
            isOpen={isOfflineModalOpen}
            onClose={() => setIsOfflineModalOpen(false)}
            onSelectGig={(id) => onSelectGigDetail(id)}
          />
        </Suspense>
      )}

      </div>
    </PullToRefresh>
  );
};
