import React, { useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Sparkles,
  Zap,
  Repeat,
  Users,
  Clock,
  MapPin,
  ShieldCheck,
  Wallet,
  CheckCircle2,
  Lock,
  Rocket,
  Search,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { formatVnd } from '../types';
import { DynamicVietQrDialog } from '../components/AdvancedDialogs';
import { GeminiTaskEstimatorModal } from '../components/GeminiTaskEstimatorModal';
import { calculateSurgePricing } from '../utils/surgePricing';

const PREDEFINED_CATEGORIES = [
  'Mua đồ ăn, cà phê, trà sữa hộ',
  'Giao nhận & Ship hàng tận phòng KTX',
  'Giặt ủi & Phơi quần áo KTX',
  'Dọn phòng & Vệ sinh KTX / Nhà trọ',
  'Giữ chỗ thư viện / Xếp hàng hộ',
  'Gia sư & Kèm môn đại cương (Toán, Lý, Xác suất)',
  'Gia sư Ngoại ngữ (IELTS, TOEIC, HSK, N3)',
  'Hướng dẫn Đồ án / Bài tập lớn / Khóa luận',
  'Thiết kế Slide Powerpoint & Thuyết trình',
  'Soạn thảo văn bản & Định dạng chuẩn đồ án',
  'Cắt ghép Video CapCut / TikTok / Reels',
  'Thiết kế Poster, Banner Canva & Photoshop',
  'Lập trình Web / Mobile / Fix Bug Code',
  'Cài Win, Vệ sinh Laptop & Cài đặt phần mềm',
  'Chụp ảnh kỷ yếu / Quay phim sự kiện trường',
  'Cày Rank & Kéo Rank Game (Liên Quân, LMHT, Valorant)',
  'Trông thú cưng KTX / Dắt cún đi dạo',
  'Chở xe máy / Đi chung xe campus / Về quê',
  'Tham gia khảo sát nghiên cứu khoa học',
  'Hỗ trợ sự kiện, Tiếp tân, Hậu cần CLB',
  'Dịch thuật tài liệu Anh - Việt, Trung - Việt',
  'Khác (Nhập cụ thể bên dưới)',
];

interface CreateGigScreenProps {
  onBack: () => void;
  onGigCreated: (gigId: string) => void;
}

export const CreateGigScreen: React.FC<CreateGigScreenProps> = ({ onBack, onGigCreated }) => {
  const {
    currentUser,
    postGig,
    analyzePhotoWithAi,
    aiDetectedResult,
    clearAiResult,
    roleMode,
    toggleRoleMode,
  } = useGigMe();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isVietQrOpen, setIsVietQrOpen] = useState(false);
  const [isEstimatorModalOpen, setIsEstimatorModalOpen] = useState(false);

  // Back step navigation handler:
  // Step 3 -> Step 2 -> Step 1 -> onBack()
  const handleBack = () => {
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    } else {
      onBack();
    }
  };

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(PREDEFINED_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [price, setPrice] = useState(60000);
  const [isReverseAuction, setIsReverseAuction] = useState(false);
  const [isFlash, setIsFlash] = useState(false);
  const [isBoosted, setIsBoosted] = useState(false);
  const [isRecurringWeekly, setIsRecurringWeekly] = useState(false);
  const [totalWorkersNeeded, setTotalWorkersNeeded] = useState(1);
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(30);
  const [locationName, setLocationName] = useState('Ký túc xá Bách Khoa B7, Hai Bà Trưng, Hà Nội');
  const [distanceMeters, setDistanceMeters] = useState(150);

  // Apply AI result
  const handleApplyAiResult = () => {
    if (!aiDetectedResult) return;
    setTitle(aiDetectedResult.suggestedTitle);
    setDescription(aiDetectedResult.suggestedDescription);
    setCategory(aiDetectedResult.suggestedCategory);
    setPrice(aiDetectedResult.suggestedPrice);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!title.trim() || !description.trim()) return;
      if (category.startsWith('Khác') && !customCategory.trim()) {
        setCategoryError('Vui lòng nhập cụ thể loại công việc của bạn khi chọn Khác!');
        return;
      }
      setCategoryError('');
      setStep(2);
    } else if (step === 2) {
      if (price <= 0) return;
      setStep(3);
    }
  };

  const handleSubmit = () => {
    const finalCategory = category.startsWith('Khác')
      ? (customCategory.trim() || 'Khác')
      : category;

    const success = postGig({
      title,
      description,
      category: finalCategory,
      price,
      isReverseAuction,
      isFlash: isFlash || isBoosted,
      isBoosted,
      locationName,
      distanceMeters,
      isRecurringWeekly,
      totalWorkersNeeded,
      estimatedDurationMinutes,
    });

    if (success) {
      onBack();
    }
  };

  const totalRequired = price + (isBoosted ? 10000 : 0);
  const walletBalance = currentUser?.walletBalance || 0;
  const isInsufficient = walletBalance < totalRequired;

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 text-slate-900 dark:text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={handleBack}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition shadow-xs active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">Đăng Việc Làm 3 Bước</h2>

        <span className="text-xs font-mono font-bold text-[#0284C7] bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 rounded-lg border border-sky-200 dark:border-sky-800">
          Bước {step}/3
        </span>
      </div>

      {/* Step Indicator Bar */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div
          className={`h-1.5 rounded-full transition-all ${
            step >= 1 ? 'bg-[#0284C7]' : 'bg-slate-200 dark:bg-slate-800'
          }`}
        />
        <div
          className={`h-1.5 rounded-full transition-all ${
            step >= 2 ? 'bg-[#0284C7]' : 'bg-slate-200 dark:bg-slate-800'
          }`}
        />
        <div
          className={`h-1.5 rounded-full transition-all ${
            step >= 3 ? 'bg-[#0284C7]' : 'bg-slate-200 dark:bg-slate-800'
          }`}
        />
      </div>

      {/* STEP 1: Content & AI Recognition */}
      {step === 1 && (
        <div className="rounded-3xl bg-white border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5 animate-fade-in text-xs">
          {/* Nút mở Gemini Task Estimator Pro */}
          <button
            type="button"
            onClick={() => setIsEstimatorModalOpen(true)}
            className="w-full p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md shadow-blue-500/15 transition-all active:scale-98 border border-white/25 group text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform shrink-0">
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="text-xs sm:text-sm font-black tracking-wide">Trợ Lý AI Định Giá & Đề Bài</span>
                  <span className="text-[10px] bg-yellow-400 text-black font-extrabold px-2 py-0.5 rounded-full shadow">
                    Gemini 3.5
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 font-medium mt-0.5 line-clamp-2 sm:line-clamp-none">
                  Quét đề bài, tính độ khó, dự toán giờ làm & gợi ý khung giá chuẩn thị trường
                </p>
              </div>
            </div>
            <span className="text-xs font-black bg-white/20 px-3 py-1.5 rounded-xl border border-white/30 shrink-0 self-end sm:self-center">
              Phân tích ngay &rarr;
            </span>
          </button>

          {/* AI Scanner Header */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600 animate-spin-slow" />
                <h4 className="font-extrabold text-purple-900 text-xs">Trợ Lý Nhận Diện AI Thông Minh</h4>
              </div>
              <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
                Auto Fill
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mb-3">
              Chụp ảnh bài tập, màn hình game, hoặc kịch bản video để AI tự điền tiêu đề & định giá tự động:
            </p>

            {/* Presets */}
            <div className="grid grid-cols-2 gap-2">
              {[
                'Sách giáo trình & Bài tập',
                'Màn hình Game (Liên Quân / LOL)',
                'Bản thảo Video TikTok / Reels',
                'Đồ dùng học tập KTX',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => analyzePhotoWithAi(preset)}
                  className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left font-semibold text-[11px] text-slate-700 transition flex items-center space-x-1.5 shadow-xs active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                  <span className="truncate">{preset}</span>
                </button>
              ))}
            </div>

            {/* AI Detected Result Box */}
            {aiDetectedResult && (
              <div className="mt-3 p-3 rounded-xl bg-white border border-purple-300 space-y-1.5 animate-fade-in shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-emerald-700 font-bold">
                    ✓ Độ tin cậy: {aiDetectedResult.confidence}
                  </span>
                  <button
                    onClick={handleApplyAiResult}
                    className="px-2.5 py-1 rounded-lg bg-[#0284C7] text-white font-extrabold text-[10px] hover:brightness-105"
                  >
                    Áp dụng ngay
                  </button>
                </div>
                <p className="font-bold text-slate-900 text-xs">{aiDetectedResult.suggestedTitle}</p>
                <p className="text-[11px] text-slate-600">{aiDetectedResult.suggestedDescription}</p>
                <p className="text-[11px] text-amber-700 font-semibold">
                  Giá gợi ý: {formatVnd(aiDetectedResult.suggestedPrice)} • Danh mục:{' '}
                  {aiDetectedResult.suggestedCategory}
                </p>
              </div>
            )}
          </div>

          {/* Category Selection with Search & Custom "Khác" input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-700 font-bold text-xs">
                Danh mục công việc ({PREDEFINED_CATEGORIES.length} nhóm ngành)
              </label>
              <span className="text-[10px] text-[#0284C7] font-semibold truncate max-w-[200px]">
                Đã chọn: {category.startsWith('Khác') ? (customCategory ? `Khác: ${customCategory}` : 'Khác') : category}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Tìm danh mục (ship đồ, gia sư, cày rank, dọn phòng, thiết kế...)"
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:border-[#0284C7] focus:outline-none shadow-xs"
              />
              {categorySearch && (
                <button
                  type="button"
                  onClick={() => setCategorySearch('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Options List */}
            <div className="max-h-48 overflow-y-auto p-1.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              {PREDEFINED_CATEGORIES.filter((c) =>
                c.toLowerCase().includes(categorySearch.toLowerCase())
              ).map((c) => {
                const isSelected = category === c;
                const isOther = c.startsWith('Khác');
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCategory(c);
                      setCategoryError('');
                    }}
                    className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-50 text-[#0284C7] border border-sky-300 font-bold shadow-xs'
                        : isOther
                        ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100/60'
                        : 'text-slate-700 hover:bg-white border border-transparent'
                    }`}
                  >
                    <span className="truncate">{c}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#0284C7] shrink-0 ml-2" />}
                  </button>
                );
              })}
              {PREDEFINED_CATEGORIES.filter((c) =>
                c.toLowerCase().includes(categorySearch.toLowerCase())
              ).length === 0 && (
                <div className="p-3 text-center text-xs text-slate-500">
                  <p>Không tìm thấy danh mục khớp với &quot;{categorySearch}&quot;</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('Khác (Nhập cụ thể bên dưới)');
                      setCustomCategory(categorySearch);
                      setCategorySearch('');
                    }}
                    className="mt-1.5 text-amber-700 font-bold underline hover:text-amber-800 block mx-auto"
                  >
                    Chọn &quot;Khác&quot; và đặt tên: &quot;{categorySearch}&quot;
                  </button>
                </div>
              )}
            </div>

            {/* Custom Input Field when "Khác" is selected */}
            {category.startsWith('Khác') && (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 animate-fade-in">
                <label className="block text-amber-900 font-bold text-xs flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Vui lòng nhập cụ thể đó là việc gì:</span>
                </label>
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => {
                    setCustomCategory(e.target.value);
                    setCategoryError('');
                  }}
                  placeholder="VD: Cầm hộ đồ bưu điện về phòng, hỗ trợ bưng bê chuyển phòng KTX..."
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-amber-300 text-slate-900 font-medium text-xs focus:border-amber-500 focus:outline-none placeholder:text-slate-400"
                />
                {categoryError && (
                  <p className="text-[11px] text-rose-600 font-bold">{categoryError}</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Tiêu đề công việc ngắn gọn</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold focus:border-[#0284C7] focus:outline-none"
              placeholder="VD: Kéo rank Liên Quân từ KC1 lên Tinh Anh..."
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Mô tả chi tiết yêu cầu & sản phẩm bàn giao</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:border-[#0284C7] focus:outline-none"
              placeholder="Nêu rõ khung giờ, yêu cầu trình độ, link tài liệu hoặc yêu cầu chụp màn hình nghiệm thu..."
            />
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={!title.trim() || !description.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white font-extrabold text-sm hover:brightness-105 shadow-sm shadow-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95"
          >
            Tiếp Tục: Thiết Lập Thù Lao & Đấu Giá &rarr;
          </button>
        </div>
      )}

      {/* STEP 2: Pricing & Reverse Auction */}
      {step === 2 && (
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-5 animate-fade-in text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Thù lao thanh toán (VND)</label>
            <input
              type="number"
              step="5000"
              required
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#0284C7] font-mono text-xl font-black focus:border-[#0284C7] focus:bg-white focus:outline-none"
              placeholder="50000"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Khoản tiền này sẽ được khóa an toàn trong <strong>Smart Escrow Vault</strong> và chỉ giải ngân khi bạn bấm
              nghiệm thu hài lòng.
            </span>
          </div>

          {/* Dynamic Surge Pricing Card (Hệ thống giá linh hoạt Grab/Gojek) */}
          {(() => {
            const surgeResult = calculateSurgePricing(price > 0 ? price : 50000, {
              isFlashRequested: isFlash || isBoosted,
              openGigsCount: 14,
              availableWorkersCount: 9,
            });
            return (
              <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-sky-100 text-[#0284C7]">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-xs">Giá Linh Hoạt Theo Cung - Cầu</span>
                        <span className="px-1.5 py-0.5 rounded bg-sky-100 text-[#0284C7] font-mono font-bold text-[10px] border border-sky-300">
                          {surgeResult.multiplier.toFixed(2)}x
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {surgeResult.primaryReason}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                    surgeResult.campusDemandLevel === 'PEAK'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-sky-100 text-sky-800 border border-sky-300'
                  }`}>
                    {surgeResult.campusDemandLevel === 'PEAK' ? 'Cao Điểm KTX' : 'Nhu Cầu Cao'}
                  </span>
                </div>

                {price < surgeResult.surgePrice && (
                  <div className="flex items-center justify-between pt-2 border-t border-sky-200/80">
                    <span className="text-[11px] text-slate-700">
                      Gợi ý thù lao đẩy nhanh: <strong className="text-amber-700 font-mono">{formatVnd(surgeResult.surgePrice)}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setPrice(surgeResult.surgePrice)}
                      className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-[10px] hover:brightness-105 shadow-xs transition"
                    >
                      Áp Dụng (+{formatVnd(surgeResult.bonusAmount)})
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Reverse auction toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <span>Bật Đấu Giá Ngược (Reverse Auction)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-bold border border-sky-300">
                  Tiết kiệm
                </span>
              </h4>
              <p className="text-slate-500 mt-0.5 text-[11px] leading-relaxed">
                Cho phép Freelancer trả giá giảm dần. <strong>Chỉ bạn (chủ việc)</strong> mới có quyền tạo và mở phòng đấu giá trực tiếp sau khi đăng đơn.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isReverseAuction}
              onChange={(e) => setIsReverseAuction(e.target.checked)}
              className="w-5 h-5 accent-[#0284C7] rounded cursor-pointer mt-1"
            />
          </div>

          {/* Flash Boost Option (Tính năng Ghim đơn & Đẩy bài Top 1) */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isBoosted
                ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/20 shadow-xs'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-3">
                <div
                  className={`p-2.5 rounded-2xl ${
                    isBoosted ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-900 text-xs">
                      🚀 Đẩy Bài & Ghim Top 1 Hỏa Tốc (Flash Boost)
                    </span>
                    <span className="px-2 py-0.5 bg-rose-100 border border-rose-300 text-rose-700 font-extrabold text-[10px] rounded-full">
                      +10.000đ
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Ghim bài viết lên vị trí đầu tiên trang chủ với khung viền nổi bật trong 2 giờ. Thu hút hàng trăm sinh viên xung quanh nhận việc ngay!
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isBoosted}
                onChange={(e) => {
                  setIsBoosted(e.target.checked);
                  if (e.target.checked) setIsFlash(true);
                }}
                className="w-5 h-5 accent-rose-500 rounded cursor-pointer shrink-0 ml-3"
              />
            </div>
          </div>

          {/* Flash Gig & Recurring Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 flex items-center space-x-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Kèo Hỏa Tốc (Flash)</span>
                </span>
                <span className="text-[10px] text-slate-500">Ưu tiên quét radar beam</span>
              </div>
              <input
                type="checkbox"
                checked={isFlash}
                onChange={(e) => setIsFlash(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 flex items-center space-x-1">
                  <Repeat className="w-3.5 h-3.5 text-sky-600" />
                  <span>Kèo Định Kỳ Tuần</span>
                </span>
                <span className="text-[10px] text-slate-500">Thuê định kỳ nhiều tuần</span>
              </div>
              <input
                type="checkbox"
                checked={isRecurringWeekly}
                onChange={(e) => setIsRecurringWeekly(e.target.checked)}
                className="w-4 h-4 accent-[#0284C7] rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Workers needed & Estimated Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Số lượng người cần (Ghép nhóm)</label>
              <select
                value={totalWorkersNeeded}
                onChange={(e) => setTotalWorkersNeeded(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:border-[#0284C7] focus:outline-none"
              >
                <option value={1}>1 người (Đơn lẻ)</option>
                <option value={2}>2 người</option>
                <option value={3}>3 người</option>
                <option value={5}>5 người (Nhóm nhỏ)</option>
                <option value={10}>10 người (Sự kiện)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold">Thời gian ước tính</label>
              <select
                value={estimatedDurationMinutes}
                onChange={(e) => setEstimatedDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:border-[#0284C7] focus:outline-none"
              >
                <option value={15}>15 phút (Siêu tốc)</option>
                <option value={30}>30 phút</option>
                <option value={45}>45 phút</option>
                <option value={60}>1 tiếng</option>
                <option value={120}>2 tiếng</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-1/3 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition active:scale-95"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white font-extrabold text-sm hover:brightness-105 shadow-sm shadow-sky-500/20 transition active:scale-95"
            >
              Tiếp: Địa Điểm & Khóa Escrow &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Location & Smart Escrow Vault Lock */}
      {step === 3 && (
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-5 animate-fade-in text-xs">
          {/* Location field */}
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Địa điểm & Khu vực làm việc</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:border-[#0284C7] focus:outline-none"
                placeholder="Ký túc xá Bách Khoa B7, Hai Bà Trưng..."
              />
            </div>
            {/* Quick Location Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setLocationName('KTX Bách Khoa B7, Hai Bà Trưng, Hà Nội')}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] text-slate-700 font-bold transition"
              >
                🏢 KTX Bách Khoa (Hà Nội)
              </button>
              <button
                type="button"
                onClick={() => setLocationName('ĐH Tôn Đức Thắng, Quận 7, TP.HCM')}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] text-slate-700 font-bold transition"
              >
                🏫 ĐH Tôn Đức Thắng (TP.HCM)
              </button>
              <button
                type="button"
                onClick={() => setLocationName('KTX ĐHQG Khu B, Dĩ An / TP.Thủ Đức')}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] text-slate-700 font-bold transition"
              >
                🏛️ KTX ĐHQG Khu B (TP.HCM)
              </button>
              <button
                type="button"
                onClick={() => setLocationName('ĐH Bách Khoa, Liên Chiểu, Đà Nẵng')}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] text-slate-700 font-bold transition"
              >
                🌊 ĐH Bách Khoa (Đà Nẵng)
              </button>
              <button
                type="button"
                onClick={() => setLocationName('🌐 Online / Làm việc từ xa (Toàn quốc)')}
                className="px-2 py-0.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[10px] text-[#0284C7] font-extrabold transition"
              >
                🌐 Online / Remote (Toàn quốc)
              </button>
            </div>
          </div>

          {/* Smart Escrow Vault Explanation Card */}
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
            <div className="flex items-center space-x-2 text-[#0284C7]">
              <Lock className="w-5 h-5" />
              <h4 className="font-extrabold text-sm text-slate-900">Cơ Chế Khóa Tiền Smart Escrow Vault</h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Để bảo vệ uy tín và đảm bảo Freelancer hoàn thành đúng hạn:
            </p>
            <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
              <li>
                Số tiền <strong>{formatVnd(price)}</strong> sẽ tạm giữ trong quỹ Smart Escrow.
              </li>
              <li>Freelancer không thể rút tiền cho đến khi nộp bài nghiệm thu và được bạn duyệt.</li>
              <li>Nếu hủy kèo hoặc có tranh chấp, Trọng tài AI & Admin sẽ hoàn tiền 100%.</li>
            </ul>

            {/* Wallet check */}
            <div className="pt-2 border-t border-sky-200/80 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Thù lao công việc:</span>
                <span className="font-bold text-slate-900">{formatVnd(price)}</span>
              </div>
              {isBoosted && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-rose-600 font-bold flex items-center space-x-1">
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Phí Đẩy Bài & Ghim Top 1:</span>
                  </span>
                  <span className="font-bold text-rose-600">+10.000đ</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-sky-200/80">
                <span className="text-slate-700 font-bold">Tổng thanh toán:</span>
                <span className="font-black text-[#0284C7] text-sm">{formatVnd(totalRequired)}</span>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[10px]">Số dư ví hiện tại:</span>
                  <span className="text-xs font-bold text-slate-900">{formatVnd(walletBalance)}</span>
                </div>

                {isInsufficient ? (
                  <button
                    type="button"
                    onClick={() => setIsVietQrOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-extrabold text-xs hover:brightness-105 shadow-xs transition active:scale-95"
                  >
                    Nạp thêm qua VietQR &rarr;
                  </button>
                ) : (
                  <span className="text-emerald-700 font-bold flex items-center text-xs">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Đủ số dư
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-1/3 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition active:scale-95"
            >
              Quay lại
            </button>

            <button
              type="button"
              id="confirm-post-gig-btn"
              onClick={handleSubmit}
              disabled={isInsufficient}
              className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm hover:brightness-105 shadow-md shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center space-x-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Khóa Escrow & Đăng Việc Ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* Gemini Task Estimator Modal */}
      <GeminiTaskEstimatorModal
        isOpen={isEstimatorModalOpen}
        onClose={() => setIsEstimatorModalOpen(false)}
        onApplyData={(data) => {
          setTitle(data.title);
          setDescription(data.description);
          setCategory(data.category);
          setPrice(data.price);
          setEstimatedDurationMinutes(data.estimatedDurationMinutes);
          setTotalWorkersNeeded(data.suggestedWorkers || 1);
        }}
      />

      {/* Quick Deposit VietQR Modal if balance insufficient */}
      <DynamicVietQrDialog isOpen={isVietQrOpen} onClose={() => setIsVietQrOpen(false)} />
    </div>
  );
};
