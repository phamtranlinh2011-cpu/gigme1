import React, { useState, useEffect, useRef } from 'react';
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
  Loader2,
  Cloud,
  CloudCheck,
  RotateCcw,
  FileText,
  Trash2,
  Save,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { useTranslation } from '../context/LanguageContext';
import { formatVnd, GigDraftEntity } from '../types';
import { DynamicVietQrDialog } from '../components/AdvancedDialogs';
import { GeminiTaskEstimatorModal } from '../components/GeminiTaskEstimatorModal';
import { calculateSurgePricing } from '../utils/surgePricing';
import { rateLimiter } from '../utils/rateLimiter';
import {
  saveGigDraftToCloud,
  getGigDraftFromCloud,
  deleteGigDraftFromCloud,
} from '../lib/firebase';

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
    showNotification,
  } = useGigMe();
  const { language, t } = useTranslation();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVietQrOpen, setIsVietQrOpen] = useState(false);
  const [isEstimatorModalOpen, setIsEstimatorModalOpen] = useState(false);

  // Auto-Save Draft states in Firestore
  const [availableDraft, setAvailableDraft] = useState<GigDraftEntity | null>(null);
  const [draftSaveStatus, setDraftSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [hasUserModified, setHasUserModified] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(PREDEFINED_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [price, setPrice] = useState(60000);
  const [attachedImage, setAttachedImage] = useState<string>('');
  const [isFlash, setIsFlash] = useState(false);
  const [isBoosted, setIsBoosted] = useState(false);
  const [isRecurringWeekly, setIsRecurringWeekly] = useState(false);
  const [totalWorkersNeeded, setTotalWorkersNeeded] = useState(1);
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(30);
  const [locationName, setLocationName] = useState(
    language === 'vi' ? 'Ký túc xá Bách Khoa B7, Hai Bà Trưng, Hà Nội' : 'HUST Campus Dorm B7, Hanoi'
  );
  const [distanceMeters, setDistanceMeters] = useState(150);

  // Load saved draft on mount
  useEffect(() => {
    let isMounted = true;
    const userId = currentUser?.id || 'guest_user';

    const loadDraft = async () => {
      try {
        const draft = await getGigDraftFromCloud(userId);
        if (!isMounted || !draft) return;
        const hasContent = (draft.title && draft.title.trim().length > 0) ||
                           (draft.description && draft.description.trim().length > 0);
        if (hasContent) {
          setAvailableDraft(draft);
        }
      } catch (err) {
        console.warn('Failed to load draft from Firestore:', err);
      }
    };

    loadDraft();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Debounced auto-save effect to Firestore & Local Storage
  useEffect(() => {
    const hasContent = title.trim().length > 0 || description.trim().length > 0;
    if (!hasUserModified && !hasContent) {
      return;
    }

    setDraftSaveStatus('saving');
    const timer = setTimeout(async () => {
      const userId = currentUser?.id || 'guest_user';
      try {
        await saveGigDraftToCloud(userId, {
          step,
          title,
          description,
          category,
          customCategory,
          price,
          attachedImage,
          isFlash,
          isBoosted,
          isRecurringWeekly,
          totalWorkersNeeded,
          estimatedDurationMinutes,
          locationName,
          distanceMeters,
        });
        setDraftSaveStatus('saved');
        setLastSavedTime(
          new Date().toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })
        );
      } catch (err) {
        console.warn('Auto-save to Firestore failed:', err);
        setDraftSaveStatus('idle');
      }
    }, 750);

    return () => clearTimeout(timer);
  }, [
    step,
    title,
    description,
    category,
    customCategory,
    price,
    attachedImage,
    isFlash,
    isBoosted,
    isRecurringWeekly,
    totalWorkersNeeded,
    estimatedDurationMinutes,
    locationName,
    distanceMeters,
    hasUserModified,
    currentUser?.id,
    language,
  ]);

  // Restore draft handler
  const handleRestoreDraft = () => {
    if (!availableDraft) return;
    if (availableDraft.title) setTitle(availableDraft.title);
    if (availableDraft.description) setDescription(availableDraft.description);
    if (availableDraft.category) setCategory(availableDraft.category);
    if (availableDraft.customCategory) setCustomCategory(availableDraft.customCategory);
    if (typeof availableDraft.price === 'number') setPrice(availableDraft.price);
    if (availableDraft.attachedImage) setAttachedImage(availableDraft.attachedImage);
    if (typeof availableDraft.isFlash === 'boolean') setIsFlash(availableDraft.isFlash);
    if (typeof availableDraft.isBoosted === 'boolean') setIsBoosted(availableDraft.isBoosted);
    if (typeof availableDraft.isRecurringWeekly === 'boolean') setIsRecurringWeekly(availableDraft.isRecurringWeekly);
    if (typeof availableDraft.totalWorkersNeeded === 'number') setTotalWorkersNeeded(availableDraft.totalWorkersNeeded);
    if (typeof availableDraft.estimatedDurationMinutes === 'number') setEstimatedDurationMinutes(availableDraft.estimatedDurationMinutes);
    if (availableDraft.locationName) setLocationName(availableDraft.locationName);
    if (typeof availableDraft.distanceMeters === 'number') setDistanceMeters(availableDraft.distanceMeters);
    if (availableDraft.step && (availableDraft.step === 1 || availableDraft.step === 2 || availableDraft.step === 3)) {
      setStep(availableDraft.step);
    }
    setHasUserModified(true);
    setAvailableDraft(null);
    showNotification(
      language === 'vi' ? '📝 Đã khôi phục bản nháp' : '📝 Draft Restored',
      language === 'vi' ? 'Dữ liệu đã được nạp lại đầy đủ từ Firestore. Bạn có thể tiếp tục chỉnh sửa.' : 'Draft loaded from Firestore. You can resume editing.',
      true
    );
  };

  // Discard draft handler
  const handleDiscardDraft = async () => {
    const userId = currentUser?.id || 'guest_user';
    setAvailableDraft(null);
    await deleteGigDraftFromCloud(userId);
    showNotification(
      language === 'vi' ? 'Đã xóa bản nháp' : 'Draft Discarded',
      language === 'vi' ? 'Bản nháp trên Firestore đã được xóa.' : 'Draft on Firestore has been removed.',
      false
    );
  };

  // Back step navigation handler:
  // Step 3 -> Step 2 -> Step 1 -> onBack()
  const handleBack = async () => {
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    } else {
      // Step 1: user is exiting form. If they wrote content, flush auto-save
      if (hasUserModified && (title.trim() || description.trim())) {
        const userId = currentUser?.id || 'guest_user';
        await saveGigDraftToCloud(userId, {
          step,
          title,
          description,
          category,
          customCategory,
          price,
          attachedImage,
          isFlash,
          isBoosted,
          isRecurringWeekly,
          totalWorkersNeeded,
          estimatedDurationMinutes,
          locationName,
          distanceMeters,
        });
      }
      onBack();
    }
  };

  const getTranslatedCategory = (cat: string) => {
    if (language === 'vi') return cat;
    switch (cat) {
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
      case 'Khác (Nhập cụ thể bên dưới)': return 'Other (Specify below)';
      default: return cat;
    }
  };

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
        setCategoryError(language === 'vi' ? 'Vui lòng nhập cụ thể loại công việc của bạn khi chọn Khác!' : 'Please specify your job category when selecting Other!');
        return;
      }
      setCategoryError('');
      setStep(2);
    } else if (step === 2) {
      if (price < 20000) {
        showNotification(
          language === 'vi' ? 'Thù lao tối thiểu' : 'Minimum Bounty',
          language === 'vi' ? 'Mức thù lao tối thiểu cho mỗi công việc là 20.000 VNĐ.' : 'Minimum payment bounty is 20,000 VND.',
          false
        );
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const rateCheck = rateLimiter.check('POST_GIG', currentUser?.id);
    if (!rateCheck.allowed) {
      showNotification(
        language === 'vi' ? '⚠️ Giới hạn tốc độ đăng việc' : '⚠️ Posting Rate Limit',
        rateCheck.errorMsg || (language === 'vi' ? 'Vui lòng chờ ít giây để chống spam tạo đơn.' : 'Please wait a few seconds before creating another gig.'),
        false
      );
      return;
    }

    const finalCategory = category.startsWith('Khác')
      ? (customCategory.trim() || 'Khác')
      : category;

    const fullDescription = attachedImage
      ? `${description.trim()}\n\n[Hình ảnh đính kèm: ${attachedImage}]`
      : description.trim();

    setIsSubmitting(true);
    try {
      const success = postGig({
        title,
        description: fullDescription,
        category: finalCategory,
        price,
        isFlash: isFlash || isBoosted,
        isBoosted,
        locationName,
        distanceMeters,
        isRecurringWeekly,
        totalWorkersNeeded,
        estimatedDurationMinutes,
      });

      if (success) {
        rateLimiter.record('POST_GIG', currentUser?.id);
        // Clear saved draft from Firestore and local storage
        const userId = currentUser?.id || 'guest_user';
        deleteGigDraftFromCloud(userId).catch((err) => console.warn('Could not delete draft:', err));
        setAvailableDraft(null);
        onBack();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRequired = price + (isBoosted ? 10000 : 0);
  const walletBalance = currentUser?.walletBalance || 0;
  const isInsufficient = walletBalance < totalRequired;

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 text-slate-100">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={handleBack}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#162C4E] border border-[#C5E5EC]/25 text-[#C5E5EC] text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back')}</span>
        </button>

        <div className="flex items-center space-x-2">
          <h2 className="text-sm sm:text-base font-extrabold text-white">
            {language === 'vi' ? 'Đăng Việc Làm 3 Bước' : 'Post A Gig in 3 Steps'}
          </h2>
          {draftSaveStatus === 'saving' && (
            <span className="inline-flex items-center text-[10px] sm:text-xs text-amber-300 font-medium bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse shadow-sm">
              <Loader2 className="w-3 h-3 animate-spin mr-1 text-amber-400" />
              <span className="hidden sm:inline">{language === 'vi' ? 'Đang lưu Firestore...' : 'Saving to Firestore...'}</span>
              <span className="sm:hidden">{language === 'vi' ? 'Đang lưu...' : 'Saving...'}</span>
            </span>
          )}
          {draftSaveStatus === 'saved' && (
            <span
              className="inline-flex items-center text-[10px] sm:text-xs text-emerald-300 font-medium bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full shadow-sm"
              title={language === 'vi' ? 'Bản nháp được lưu an toàn trên Firestore' : 'Draft auto-saved securely on Firestore'}
            >
              <CloudCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              <span className="hidden sm:inline">
                {language === 'vi' ? `Đã lưu nháp ${lastSavedTime ? `(${lastSavedTime})` : ''}` : `Saved ${lastSavedTime ? `(${lastSavedTime})` : ''}`}
              </span>
              <span className="sm:hidden">{language === 'vi' ? 'Đã lưu' : 'Saved'}</span>
            </span>
          )}
        </div>

        <span className="text-xs font-mono font-bold text-[#E0FAEB] bg-[#3064AE]/30 px-2.5 py-1 rounded-lg border border-[#C5E5EC]/30">
          {t('stepIndicator')} {step}/3
        </span>
      </div>

      {/* Step Indicator Bar */}
      <div className="grid grid-cols-3 gap-2 mb-4 sm:mb-5">
        <div
          className={`h-1.5 rounded-full transition-all ${
            step >= 1 ? 'bg-gradient-to-r from-[#3064AE] to-[#C5E5EC]' : 'bg-[#12233B] border border-[#C5E5EC]/15'
          }`}
        />
        <div
          className={`h-1.5 rounded-full transition-all ${
            step >= 2 ? 'bg-gradient-to-r from-[#3064AE] to-[#C5E5EC]' : 'bg-[#12233B] border border-[#C5E5EC]/15'
          }`}
        />
        <div
          className={`h-1.5 rounded-full transition-all ${
            step >= 3 ? 'bg-gradient-to-r from-[#3064AE] via-[#C5E5EC] to-[#E0FAEB]' : 'bg-[#12233B] border border-[#C5E5EC]/15'
          }`}
        />
      </div>

      {/* RESTORE DRAFT BANNER (Prompts user to resume unfinished draft from Firestore) */}
      {availableDraft && (
        <div className="mb-4 sm:mb-5 p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-[#0E1E36] via-[#122644] to-[#0E1E36] border border-[#00E5FF]/40 shadow-xl shadow-[#00E5FF]/5 animate-fade-in text-xs relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-[#00E5FF] via-[#3064AE] to-[#E0FAEB]" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-[#00E5FF]/15 text-[#00E5FF] rounded-2xl shrink-0 mt-0.5 sm:mt-0 border border-[#00E5FF]/30">
                <FileText className="w-5 h-5 text-[#00E5FF]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-white text-xs sm:text-sm">
                    {language === 'vi' ? 'Phát hiện bản nháp đã lưu trên Firestore' : 'Unfinished draft found on Firestore'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30 font-bold">
                    Cloud Draft
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                  <span className="text-[#E0FAEB] font-semibold">"{availableDraft.title || (language === 'vi' ? 'Bản nháp chưa đặt tên' : 'Untitled draft')}"</span>
                  {availableDraft.category && (
                    <span className="text-slate-400 ml-1.5">• {availableDraft.category}</span>
                  )}
                  {availableDraft.updatedAt && (
                    <span className="text-slate-400 ml-1.5">
                      • {new Date(availableDraft.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {language === 'vi'
                    ? 'Bạn có muốn tiếp tục chỉnh sửa nội dung này để đăng việc không?'
                    : 'Would you like to resume this draft to finish posting?'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0">
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition active:scale-95 flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-400" />
                <span>{language === 'vi' ? 'Xóa nháp' : 'Discard'}</span>
              </button>
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#3064AE] hover:from-[#33EAFF] hover:to-[#3874C4] text-slate-950 font-bold text-xs shadow-md transition active:scale-95 flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-950" />
                <span>{language === 'vi' ? 'Tiếp tục bản nháp' : 'Resume Draft'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: Content & AI Recognition */}
      {step === 1 && (
        <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/25 p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5 animate-fade-in text-xs relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#3064AE] via-[#C5E5EC] to-[#E0FAEB]" />

          {/* Nút mở Gemini Task Estimator Pro */}
          <button
            type="button"
            onClick={() => setIsEstimatorModalOpen(true)}
            className="w-full p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#1E4378] hover:from-[#255294] hover:to-[#173560] text-white font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-[#3064AE]/20 transition-all active:scale-98 border border-[#C5E5EC]/30 group text-left cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-[#C5E5EC]/20 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform shrink-0">
                <Sparkles className="w-5 h-5 text-[#E0FAEB] animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="text-xs sm:text-sm font-black tracking-wide">{t('aiEstimator')}</span>
                  <span className="text-[10px] bg-[#E0FAEB] text-[#0E1B2E] font-extrabold px-2 py-0.5 rounded-full shadow">
                    Gemini 3.5
                  </span>
                </div>
                <p className="text-[11px] text-[#C5E5EC]/90 font-medium mt-0.5 line-clamp-2 sm:line-clamp-none">
                  {t('aiEstimatorDesc')}
                </p>
              </div>
            </div>
            <span className="text-xs font-black bg-[#C5E5EC]/20 text-[#E0FAEB] px-3 py-1.5 rounded-xl border border-[#C5E5EC]/30 shrink-0 self-end sm:self-center">
              {t('analyzeNow')} &rarr;
            </span>
          </button>

          {/* AI Scanner Header */}
          <div className="p-4 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/25">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#C5E5EC] animate-spin-slow" />
                <h4 className="font-extrabold text-white text-xs">
                  {language === 'vi' ? 'Trợ Lý Nhận Diện AI Thông Minh' : 'Smart AI Recognition Assistant'}
                </h4>
              </div>
              <span className="text-[10px] text-[#E0FAEB] font-bold bg-[#3064AE]/40 px-2 py-0.5 rounded border border-[#C5E5EC]/30">
                Auto Fill
              </span>
            </div>
            <p className="text-[11px] text-[#C5E5EC]/80 mb-3">
              {language === 'vi'
                ? 'Chụp ảnh bài tập, màn hình game, hoặc kịch bản video để AI tự điền tiêu đề & định giá tự động:'
                : 'Snap a homework sheet, game victory screen, or video script for AI to auto-fill title & price:'}
            </p>

            {/* Presets */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { vi: 'Sách giáo trình & Bài tập', en: 'Textbooks & Homework' },
                { vi: 'Màn hình Game (Liên Quân / LOL)', en: 'Game Screen (LoL / Mobile)' },
                { vi: 'Bản thảo Video TikTok / Reels', en: 'TikTok / Reels Video Draft' },
                { vi: 'Đồ dùng học tập KTX', en: 'Dorm Study Supplies' },
              ].map((preset) => (
                <button
                  key={preset.vi}
                  type="button"
                  onClick={() => analyzePhotoWithAi(language === 'vi' ? preset.vi : preset.en)}
                  className="p-2 rounded-xl bg-[#0E1B2E] hover:bg-[#162C4E] border border-[#C5E5EC]/20 text-left font-semibold text-[11px] text-[#C5E5EC] transition flex items-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-[#C5E5EC] shrink-0" />
                  <span className="truncate">{language === 'vi' ? preset.vi : preset.en}</span>
                </button>
              ))}
            </div>

            {/* AI Detected Result Box */}
            {aiDetectedResult && (
              <div className="mt-3 p-3 rounded-xl bg-[#0E1B2E] border border-[#C5E5EC]/30 space-y-1.5 animate-fade-in shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#E0FAEB] font-bold">
                    ✓ {language === 'vi' ? 'Độ tin cậy:' : 'Confidence:'} {aiDetectedResult.confidence}
                  </span>
                  <button
                    onClick={handleApplyAiResult}
                    className="px-2.5 py-1 rounded-lg bg-[#3064AE] hover:bg-[#255294] text-white font-extrabold text-[10px] border border-[#C5E5EC]/30 cursor-pointer"
                  >
                    {language === 'vi' ? 'Áp dụng ngay' : 'Apply Now'}
                  </button>
                </div>
                <p className="font-bold text-white text-xs">{aiDetectedResult.suggestedTitle}</p>
                <p className="text-[11px] text-[#C5E5EC]/80">{aiDetectedResult.suggestedDescription}</p>
                <p className="text-[11px] text-[#E0FAEB] font-semibold">
                  {language === 'vi' ? 'Giá gợi ý:' : 'Suggested Price:'} {formatVnd(aiDetectedResult.suggestedPrice)} • {language === 'vi' ? 'Danh mục:' : 'Category:'}{' '}
                  {getTranslatedCategory(aiDetectedResult.suggestedCategory)}
                </p>
              </div>
            )}
          </div>

          {/* Category Selection with Search & Custom "Khác" input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[#C5E5EC] font-bold text-xs">
                {language === 'vi'
                  ? `Danh mục công việc (${PREDEFINED_CATEGORIES.length} nhóm ngành)`
                  : `Job Category (${PREDEFINED_CATEGORIES.length} options)`}
              </label>
              <span className="text-[10px] text-[#E0FAEB] font-semibold truncate max-w-[200px]">
                {language === 'vi' ? 'Đã chọn: ' : 'Selected: '}
                {category.startsWith('Khác')
                  ? (customCategory ? `${language === 'vi' ? 'Khác' : 'Other'}: ${customCategory}` : (language === 'vi' ? 'Khác' : 'Other'))
                  : getTranslatedCategory(category)}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#C5E5EC]/60 absolute left-3 top-3" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder={language === 'vi' ? 'Tìm danh mục (ship đồ, gia sư, cày rank, dọn phòng, thiết kế...)' : 'Search categories (delivery, tutor, rank boosting, cleaning, design...)'}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white text-xs placeholder:text-[#C5E5EC]/40 focus:border-[#3064AE] focus:outline-none shadow-sm"
              />
              {categorySearch && (
                <button
                  type="button"
                  onClick={() => setCategorySearch('')}
                  className="absolute right-3 top-3 text-[#C5E5EC]/60 hover:text-white text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Options List */}
            <div className="max-h-48 overflow-y-auto p-1.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 space-y-1">
              {PREDEFINED_CATEGORIES.filter((c) => {
                const label = getTranslatedCategory(c);
                return (
                  c.toLowerCase().includes(categorySearch.toLowerCase()) ||
                  label.toLowerCase().includes(categorySearch.toLowerCase())
                );
              }).map((c) => {
                const isSelected = category === c;
                const isOther = c.startsWith('Khác');
                const displayLabel = getTranslatedCategory(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCategory(c);
                      setCategoryError('');
                    }}
                    className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#3064AE] text-white border border-[#C5E5EC]/40 font-bold shadow-sm'
                        : isOther
                        ? 'bg-[#162C4E] text-[#E0FAEB] border border-[#C5E5EC]/25 hover:bg-[#1A345C]'
                        : 'text-[#C5E5EC]/80 hover:bg-[#162C4E] hover:text-white border border-transparent'
                    }`}
                  >
                    <span className="truncate">{displayLabel}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#E0FAEB] shrink-0 ml-2" />}
                  </button>
                );
              })}
              {PREDEFINED_CATEGORIES.filter((c) => {
                const label = getTranslatedCategory(c);
                return (
                  c.toLowerCase().includes(categorySearch.toLowerCase()) ||
                  label.toLowerCase().includes(categorySearch.toLowerCase())
                );
              }).length === 0 && (
                <div className="p-3 text-center text-xs text-[#C5E5EC]/60">
                  <p>
                    {language === 'vi'
                      ? `Không tìm thấy danh mục khớp với "${categorySearch}"`
                      : `No categories match "${categorySearch}"`}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('Khác (Nhập cụ thể bên dưới)');
                      setCustomCategory(categorySearch);
                      setCategorySearch('');
                    }}
                    className="mt-1.5 text-[#E0FAEB] font-bold underline hover:text-white block mx-auto cursor-pointer"
                  >
                    {language === 'vi'
                      ? `Chọn "Khác" và đặt tên: "${categorySearch}"`
                      : `Select "Other" with name: "${categorySearch}"`}
                  </button>
                </div>
              )}
            </div>

            {/* Custom Input Field when "Khác" is selected */}
            {category.startsWith('Khác') && (
              <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/30 space-y-2 animate-fade-in">
                <label className="block text-[#E0FAEB] font-bold text-xs flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-[#C5E5EC]" />
                  <span>{language === 'vi' ? 'Vui lòng nhập cụ thể đó là việc gì:' : 'Please specify what the job is:'}</span>
                </label>
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => {
                    setCustomCategory(e.target.value);
                    setCategoryError('');
                  }}
                  placeholder={language === 'vi' ? 'VD: Cầm hộ đồ bưu điện về phòng, hỗ trợ bưng bê chuyển phòng KTX...' : 'e.g. Pick up post package, help move dorm room luggage...'}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0E1B2E] border border-[#C5E5EC]/30 text-white font-medium text-xs focus:border-[#3064AE] focus:outline-none placeholder:text-[#C5E5EC]/40"
                />
                {categoryError && (
                  <p className="text-[11px] text-rose-400 font-bold">{categoryError}</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[#C5E5EC] mb-1 font-bold">
              {language === 'vi' ? 'Tiêu đề công việc ngắn gọn' : 'Concise job title'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-semibold focus:border-[#3064AE] focus:outline-none placeholder:text-[#C5E5EC]/40"
              placeholder={language === 'vi' ? 'VD: Kéo rank Liên Quân từ KC1 lên Tinh Anh...' : 'e.g. Help carry packages to Dorm B7 Room 302...'}
            />
          </div>

          <div>
            <label className="block text-[#C5E5EC] mb-1 font-bold">
              {language === 'vi' ? 'Mô tả chi tiết yêu cầu & sản phẩm bàn giao' : 'Detailed requirements & deliverables'}
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white focus:border-[#3064AE] focus:outline-none placeholder:text-[#C5E5EC]/40"
              placeholder={language === 'vi' ? 'Nêu rõ khung giờ, yêu cầu trình độ, link tài liệu hoặc yêu cầu chụp màn hình nghiệm thu...' : 'State time slot, skill level, reference links or photo proof requirements...'}
            />
          </div>

          {/* Optional Image Attachment */}
          <div className="p-3 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#C5E5EC] flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-[#E0FAEB]" />
                <span>{language === 'vi' ? 'Đính kèm hình ảnh minh họa (Tùy chọn)' : 'Attach Reference Image (Optional)'}</span>
              </span>
              {attachedImage && (
                <button
                  type="button"
                  onClick={() => setAttachedImage('')}
                  className="text-[10px] text-red-400 hover:underline font-bold"
                >
                  {language === 'vi' ? 'Xóa ảnh' : 'Remove'}
                </button>
              )}
            </div>
            {attachedImage ? (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[#C5E5EC]/30">
                <img src={attachedImage} alt="Attachment" className="w-full h-full object-cover" />
              </div>
            ) : (
              <input
                type="text"
                value={attachedImage}
                onChange={(e) => setAttachedImage(e.target.value)}
                placeholder={language === 'vi' ? 'Dán link hình ảnh (URL) hoặc chụp ảnh qua trợ lý AI ở trên' : 'Paste image URL or snap via AI assistant above'}
                className="w-full px-3 py-1.5 rounded-xl bg-[#0E1B2E] border border-[#C5E5EC]/20 text-white text-[11px] focus:outline-none focus:border-[#3064AE]"
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={!title.trim() || !description.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#3064AE] to-[#417AC6] hover:from-[#255294] hover:to-[#356ab0] text-white font-extrabold text-sm shadow-md shadow-[#3064AE]/20 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 border border-[#C5E5EC]/30 cursor-pointer"
          >
            {language === 'vi' ? 'Tiếp Tục: Thiết Lập Thù Lao & Thời Lượng →' : 'Continue: Set Bounty & Duration →'}
          </button>
        </div>
      )}

      {/* STEP 2: Pricing & Details */}
      {step === 2 && (
        <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/25 p-6 shadow-xl space-y-5 animate-fade-in text-xs relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#3064AE] via-[#C5E5EC] to-[#E0FAEB]" />

          <div>
            <label className="block text-[#C5E5EC] mb-1 font-bold">
              {language === 'vi' ? 'Thù lao thanh toán (VND)' : 'Payment Bounty (VND)'}
            </label>
            <input
              type="number"
              step="5000"
              required
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-[#E0FAEB] font-mono text-xl font-black focus:border-[#3064AE] focus:outline-none"
              placeholder="50000"
            />
            {/* Quick Bounty Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[30000, 50000, 100000, 150000, 200000, 500000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPrice(preset)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer border ${
                    price === preset
                      ? 'bg-[#3064AE] text-white border-[#C5E5EC]'
                      : 'bg-[#12233B] text-[#C5E5EC] hover:bg-[#162C4E] border-[#C5E5EC]/20'
                  }`}
                >
                  {formatVnd(preset)}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-[#C5E5EC]/70 mt-1.5 block">
              {language === 'vi' ? (
                <>Khoản tiền này sẽ được khóa an toàn trong <strong>Smart Escrow Vault</strong> và chỉ giải ngân khi bạn bấm nghiệm thu hài lòng.</>
              ) : (
                <>This amount will be securely locked in the <strong>Smart Escrow Vault</strong> and disbursed only when you approve the delivered work.</>
              )}
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
              <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/25 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-[#3064AE]/30 text-[#C5E5EC]">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-xs">
                          {language === 'vi' ? 'Giá Linh Hoạt Theo Cung - Cầu' : 'Dynamic Supply & Demand Pricing'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#3064AE]/40 text-[#E0FAEB] font-mono font-bold text-[10px] border border-[#C5E5EC]/30">
                          {surgeResult.multiplier.toFixed(2)}x
                        </span>
                      </div>
                      <p className="text-[10px] text-[#C5E5EC]/70 mt-0.5">
                        {surgeResult.primaryReason}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                    surgeResult.campusDemandLevel === 'PEAK'
                      ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                      : 'bg-[#3064AE]/40 text-[#E0FAEB] border border-[#C5E5EC]/30'
                  }`}>
                    {surgeResult.campusDemandLevel === 'PEAK'
                      ? (language === 'vi' ? 'Cao Điểm KTX' : 'Dorm Peak Hour')
                      : (language === 'vi' ? 'Nhu Cầu Cao' : 'High Demand')}
                  </span>
                </div>

                {price < surgeResult.surgePrice && (
                  <div className="flex items-center justify-between pt-2 border-t border-[#C5E5EC]/15">
                    <span className="text-[11px] text-[#C5E5EC]">
                      {language === 'vi' ? 'Gợi ý thù lao đẩy nhanh:' : 'Suggested fast bounty:'}{' '}
                      <strong className="text-[#E0FAEB] font-mono">{formatVnd(surgeResult.surgePrice)}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setPrice(surgeResult.surgePrice)}
                      className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#3064AE] to-[#417AC6] text-white font-extrabold text-[10px] hover:brightness-110 shadow-sm transition border border-[#C5E5EC]/30 cursor-pointer"
                    >
                      {language === 'vi' ? 'Áp Dụng' : 'Apply'} (+{formatVnd(surgeResult.bonusAmount)})
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Flash Boost Option (Tính năng Ghim đơn & Đẩy bài Top 1) */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isBoosted
                ? 'bg-[#162C4E] border-[#C5E5EC] ring-2 ring-[#C5E5EC]/30 shadow-lg'
                : 'bg-[#12233B] border-[#C5E5EC]/25'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-3">
                <div
                  className={`p-2.5 rounded-2xl ${
                    isBoosted ? 'bg-[#3064AE] text-white animate-pulse' : 'bg-[#0E1B2E] text-[#C5E5EC]'
                  }`}
                >
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-white text-xs">
                      {language === 'vi' ? '🚀 Đẩy Bài & Ghim Top 1 Hỏa Tốc (Flash Boost)' : '🚀 Flash Boost & Pin #1 on Campus'}
                    </span>
                    <span className="px-2 py-0.5 bg-[#3064AE]/40 border border-[#C5E5EC]/30 text-[#E0FAEB] font-extrabold text-[10px] rounded-full">
                      {language === 'vi' ? '+10.000đ' : '+10,000 VND'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#C5E5EC]/75 mt-1 leading-relaxed">
                    {language === 'vi'
                      ? 'Ghim bài viết lên vị trí đầu tiên trang chủ với khung viền nổi bật trong 2 giờ. Thu hút hàng trăm sinh viên xung quanh nhận việc ngay!'
                      : 'Pin your job at the top of the feed with highlighted borders for 2 hours. Attract campus peers instantly!'}
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
                className="w-5 h-5 accent-[#3064AE] rounded cursor-pointer shrink-0 ml-3"
              />
            </div>
          </div>

          {/* Flash Gig & Recurring Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/25 flex items-center justify-between">
              <div>
                <span className="font-bold text-white flex items-center space-x-1">
                  <Zap className="w-3.5 h-3.5 text-[#E0FAEB]" />
                  <span>{language === 'vi' ? 'Kèo Hỏa Tốc (Flash)' : 'Flash Gig (Urgent)'}</span>
                </span>
                <span className="text-[10px] text-[#C5E5EC]/60">
                  {language === 'vi' ? 'Ưu tiên quét radar beam' : 'Priority radar beam scan'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={isFlash}
                onChange={(e) => setIsFlash(e.target.checked)}
                className="w-4 h-4 accent-[#3064AE] rounded cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/25 flex items-center justify-between">
              <div>
                <span className="font-bold text-white flex items-center space-x-1">
                  <Repeat className="w-3.5 h-3.5 text-[#C5E5EC]" />
                  <span>{language === 'vi' ? 'Kèo Định Kỳ Tuần' : 'Weekly Recurring'}</span>
                </span>
                <span className="text-[10px] text-[#C5E5EC]/60">
                  {language === 'vi' ? 'Thuê định kỳ nhiều tuần' : 'Multi-week recurring'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={isRecurringWeekly}
                onChange={(e) => setIsRecurringWeekly(e.target.checked)}
                className="w-4 h-4 accent-[#3064AE] rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Workers needed & Estimated Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#C5E5EC] mb-1 font-bold">
                {language === 'vi' ? 'Số lượng người cần (Ghép nhóm)' : 'Workers needed (Team size)'}
              </label>
              <select
                value={totalWorkersNeeded}
                onChange={(e) => setTotalWorkersNeeded(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-medium focus:border-[#3064AE] focus:outline-none"
              >
                <option value={1} className="bg-[#12233B] text-white">{language === 'vi' ? '1 người (Đơn lẻ)' : '1 student (Solo)'}</option>
                <option value={2} className="bg-[#12233B] text-white">{language === 'vi' ? '2 người' : '2 students'}</option>
                <option value={3} className="bg-[#12233B] text-white">{language === 'vi' ? '3 người' : '3 students'}</option>
                <option value={5} className="bg-[#12233B] text-white">{language === 'vi' ? '5 người (Nhóm nhỏ)' : '5 students (Small team)'}</option>
                <option value={10} className="bg-[#12233B] text-white">{language === 'vi' ? '10 người (Sự kiện)' : '10 students (Campus event)'}</option>
              </select>
            </div>

            <div>
              <label className="block text-[#C5E5EC] mb-1 font-bold">
                {language === 'vi' ? 'Thời gian ước tính' : 'Estimated duration'}
              </label>
              <select
                value={estimatedDurationMinutes}
                onChange={(e) => setEstimatedDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-medium focus:border-[#3064AE] focus:outline-none"
              >
                <option value={15} className="bg-[#12233B] text-white">{language === 'vi' ? '15 phút (Siêu tốc)' : '15 mins (Speedy)'}</option>
                <option value={30} className="bg-[#12233B] text-white">{language === 'vi' ? '30 phút' : '30 mins'}</option>
                <option value={45} className="bg-[#12233B] text-white">{language === 'vi' ? '45 phút' : '45 mins'}</option>
                <option value={60} className="bg-[#12233B] text-white">{language === 'vi' ? '1 tiếng' : '1 hour'}</option>
                <option value={120} className="bg-[#12233B] text-white">{language === 'vi' ? '2 tiếng' : '2 hours'}</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-1/3 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20 text-[#C5E5EC] font-bold hover:bg-[#162C4E] transition active:scale-95 cursor-pointer"
            >
              {language === 'vi' ? 'Quay lại' : 'Back'}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] to-[#417AC6] hover:from-[#255294] hover:to-[#356ab0] text-white font-extrabold text-sm shadow-md shadow-[#3064AE]/20 transition active:scale-95 border border-[#C5E5EC]/30 cursor-pointer"
            >
              {language === 'vi' ? 'Tiếp: Địa Điểm & Khóa Escrow →' : 'Next: Location & Escrow →'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Location & Smart Escrow Vault Lock */}
      {step === 3 && (
        <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/25 p-6 shadow-xl space-y-5 animate-fade-in text-xs relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#3064AE] via-[#C5E5EC] to-[#E0FAEB]" />

          {/* Location field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[#C5E5EC] font-bold">
                {language === 'vi' ? 'Địa điểm & Khu vực làm việc' : 'Location & Workplace Area'}
              </label>
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setLocationName(language === 'vi' ? '📍 Vị trí GPS hiện tại của tôi (Campus)' : '📍 My Current Campus GPS Location');
                        showNotification(
                          language === 'vi' ? 'Đã lấy tọa độ GPS' : 'GPS Retrieved',
                          language === 'vi' ? 'Đã định vị thành công vị trí hiện tại của bạn.' : 'Successfully located your current position.'
                        );
                      },
                      () => {
                        showNotification(
                          language === 'vi' ? 'Không thể lấy GPS' : 'GPS Unavailable',
                          language === 'vi' ? 'Vui lòng cấp quyền vị trí hoặc chọn địa điểm bên dưới.' : 'Please allow location permission or select from presets.'
                        );
                      }
                    );
                  }
                }}
                className="text-[11px] text-[#E0FAEB] hover:text-white font-bold flex items-center space-x-1 cursor-pointer bg-[#3064AE]/30 hover:bg-[#3064AE]/50 px-2 py-0.5 rounded-lg border border-[#C5E5EC]/30 transition"
              >
                <span>📍 {language === 'vi' ? 'Lấy GPS của tôi' : 'Use My GPS'}</span>
              </button>
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#C5E5EC]/60 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white focus:border-[#3064AE] focus:outline-none"
                placeholder={language === 'vi' ? 'Ký túc xá Bách Khoa B7, Hai Bà Trưng...' : 'Campus Dorm B7, Library...'}
              />
            </div>
            {/* Quick Location Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setLocationName(language === 'vi' ? 'KTX Bách Khoa B7, Hai Bà Trưng, Hà Nội' : 'HUST Campus Dorm B7, Hanoi')}
                className="px-2 py-0.5 rounded-lg bg-[#12233B] hover:bg-[#162C4E] border border-[#C5E5EC]/20 text-[10px] text-[#C5E5EC] font-bold transition cursor-pointer"
              >
                🏢 {language === 'vi' ? 'KTX Bách Khoa (Hà Nội)' : 'HUST Dorm (Hanoi)'}
              </button>
              <button
                type="button"
                onClick={() => setLocationName(language === 'vi' ? 'ĐH Tôn Đức Thắng, Quận 7, TP.HCM' : 'Ton Duc Thang Univ, Dist 7, HCMC')}
                className="px-2 py-0.5 rounded-lg bg-[#12233B] hover:bg-[#162C4E] border border-[#C5E5EC]/20 text-[10px] text-[#C5E5EC] font-bold transition cursor-pointer"
              >
                🏫 {language === 'vi' ? 'ĐH Tôn Đức Thắng (TP.HCM)' : 'TDTU Campus (HCMC)'}
              </button>
              <button
                type="button"
                onClick={() => setLocationName(language === 'vi' ? 'KTX ĐHQG Khu B, Dĩ An / TP.Thủ Đức' : 'VNU Dorm Area B, Thu Duc / HCMC')}
                className="px-2 py-0.5 rounded-lg bg-[#12233B] hover:bg-[#162C4E] border border-[#C5E5EC]/20 text-[10px] text-[#C5E5EC] font-bold transition cursor-pointer"
              >
                🏛️ {language === 'vi' ? 'KTX ĐHQG Khu B (TP.HCM)' : 'VNU Dorm Area B (HCMC)'}
              </button>
              <button
                type="button"
                onClick={() => setLocationName(language === 'vi' ? 'ĐH Bách Khoa, Liên Chiểu, Đà Nẵng' : 'DUT Campus, Da Nang')}
                className="px-2 py-0.5 rounded-lg bg-[#12233B] hover:bg-[#162C4E] border border-[#C5E5EC]/20 text-[10px] text-[#C5E5EC] font-bold transition cursor-pointer"
              >
                🌊 {language === 'vi' ? 'ĐH Bách Khoa (Đà Nẵng)' : 'DUT Campus (Da Nang)'}
              </button>
              <button
                type="button"
                onClick={() => setLocationName(language === 'vi' ? '🌐 Online / Làm việc từ xa (Toàn quốc)' : '🌐 Online / Remote (Nationwide)')}
                className="px-2 py-0.5 rounded-lg bg-[#3064AE]/30 hover:bg-[#3064AE]/50 border border-[#C5E5EC]/30 text-[10px] text-[#E0FAEB] font-extrabold transition cursor-pointer"
              >
                {language === 'vi' ? '🌐 Online / Remote (Toàn quốc)' : '🌐 Online / Remote (Nationwide)'}
              </button>
            </div>
          </div>

          {/* Smart Escrow Vault Explanation Card */}
          <div className="p-4 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/25 space-y-3">
            <div className="flex items-center space-x-2 text-[#C5E5EC]">
              <Lock className="w-5 h-5 text-[#E0FAEB]" />
              <h4 className="font-extrabold text-sm text-white">
                {language === 'vi' ? 'Cơ Chế Khóa Tiền Smart Escrow Vault' : 'Smart Escrow Vault Protection'}
              </h4>
            </div>
            <p className="text-[11px] text-[#C5E5EC]/80 leading-relaxed">
              {language === 'vi'
                ? 'Để bảo vệ uy tín và đảm bảo Freelancer hoàn thành đúng hạn:'
                : 'To protect integrity and ensure freelancers complete tasks on time:'}
            </p>
            <ul className="text-[11px] text-[#C5E5EC]/80 space-y-1 list-disc pl-4">
              <li>
                {language === 'vi' ? (
                  <>Số tiền <strong>{formatVnd(price)}</strong> sẽ tạm giữ trong quỹ Smart Escrow.</>
                ) : (
                  <>The amount <strong>{formatVnd(price)}</strong> will be locked in the Smart Escrow vault.</>
                )}
              </li>
              <li>
                {language === 'vi'
                  ? 'Freelancer không thể rút tiền cho đến khi nộp bài nghiệm thu và được bạn duyệt.'
                  : 'Freelancers cannot withdraw funds until deliverables are submitted and approved by you.'}
              </li>
              <li>
                {language === 'vi'
                  ? 'Nếu hủy kèo hoặc có tranh chấp, Trọng tài AI & Admin sẽ hoàn tiền 100%.'
                  : 'If cancelled or disputed, AI Arbiter & Admin will refund 100% per platform policy.'}
              </li>
            </ul>

            {/* Wallet check */}
            <div className="pt-2 border-t border-[#C5E5EC]/15 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#C5E5EC]/70">
                  {language === 'vi' ? 'Thù lao công việc:' : 'Task Bounty:'}
                </span>
                <span className="font-bold text-white">{formatVnd(price)}</span>
              </div>
              {isBoosted && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#E0FAEB] font-bold flex items-center space-x-1">
                    <Rocket className="w-3.5 h-3.5 text-[#E0FAEB]" />
                    <span>{language === 'vi' ? 'Phí Đẩy Bài & Ghim Top 1:' : 'Flash Boost & Top #1 Fee:'}</span>
                  </span>
                  <span className="font-bold text-[#E0FAEB]">
                    {language === 'vi' ? '+10.000đ' : '+10,000 VND'}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#C5E5EC]/15">
                <span className="text-white font-bold">
                  {language === 'vi' ? 'Tổng thanh toán:' : 'Total Payable:'}
                </span>
                <span className="font-black text-[#E0FAEB] text-sm">{formatVnd(totalRequired)}</span>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <div>
                  <span className="text-[#C5E5EC]/60 block text-[10px]">
                    {language === 'vi' ? 'Số dư ví hiện tại:' : 'Current Wallet Balance:'}
                  </span>
                  <span className="text-xs font-bold text-white">{formatVnd(walletBalance)}</span>
                </div>

                {isInsufficient ? (
                  <button
                    type="button"
                    onClick={() => setIsVietQrOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-extrabold text-xs hover:brightness-105 shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    {language === 'vi' ? 'Nạp thêm qua VietQR →' : 'Top up with VietQR →'}
                  </button>
                ) : (
                  <span className="text-[#E0FAEB] font-bold flex items-center text-xs">
                    <CheckCircle2 className="w-4 h-4 mr-1 text-[#E0FAEB]" />{' '}
                    {language === 'vi' ? 'Đủ số dư' : 'Sufficient Balance'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-1/3 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20 text-[#C5E5EC] font-bold hover:bg-[#162C4E] transition active:scale-95 cursor-pointer"
            >
              {language === 'vi' ? 'Quay lại' : 'Back'}
            </button>

            <button
              type="button"
              id="confirm-post-gig-btn"
              onClick={handleSubmit}
              disabled={isInsufficient || isSubmitting}
              className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-extrabold text-sm hover:brightness-110 shadow-lg shadow-[#3064AE]/20 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center space-x-1.5 active:scale-95 border border-[#E0FAEB]/30 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#E0FAEB]" />
                  <span>{language === 'vi' ? 'Đang Khóa Escrow & Đăng...' : 'Posting & Locking Escrow...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#E0FAEB]" />
                  <span>{language === 'vi' ? 'Khóa Escrow & Đăng Việc Ngay' : 'Lock Escrow & Post Gig Now'}</span>
                </>
              )}
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
