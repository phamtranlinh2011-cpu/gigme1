import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Zap,
  Repeat,
  Users,
  ShieldCheck,
  PhoneCall,
  MessageSquare,
  Award,
  Gavel,
  CheckCircle2,
  X,
  AlertCircle,
  Rocket,
  QrCode,
  Radio,
  Flame,
  Sparkles,
  Lock,
  EyeOff,
  Star,
  AlertTriangle,
  Image as ImageIcon,
  Wifi,
  Download,
  Camera,
  UserX,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { useTranslation } from '../context/LanguageContext';
import { formatVnd, USER_TIERS } from '../types';
import { MultiWorkerCheckInModal } from '../components/MultiWorkerCheckInModal';
import { DoubleBlindReviewModal } from '../components/DoubleBlindReviewModal';
import { LateCancellationModal, CancellationModalMode } from '../components/LateCancellationModal';
import { BlockchainProofModal } from '../components/BlockchainProofModal';
import { VerifiedIdentityBadge } from '../components/VerifiedIdentityBadge';
import { offlineCacheManager } from '../utils/offlineCache';
import { triggerHaptic } from '../utils/haptics';

interface GigDetailScreenProps {
  gigId: string;
  onBack: () => void;
  onOpenChat: () => void;
  onOpenVerify: () => void;
}

export const GigDetailScreen: React.FC<GigDetailScreenProps> = ({
  gigId,
  onBack,
  onOpenChat,
  onOpenVerify,
}) => {
  const {
    rawGigs,
    currentUser,
    users,
    roleMode,
    toggleRoleMode,
    startVoipCall,
    acceptGigDirectly,
    cancelGigByWorker,
    cancelGigByClient,
    deleteGig,
    releaseEscrowPayout,
    requestGigRevision,
    boostGig,
    showNotification,
  } = useGigMe();
  const { language, t } = useTranslation();

  const gig = rawGigs.find((g) => g.id === gigId);

  // Auto cache gig into PWA offline memory when viewed
  useEffect(() => {
    if (gig) {
      offlineCacheManager.cacheGig(gig, gig.clientPhone || '0909120918');
    }
  }, [gig]);

  const [isAcceptingGig, setIsAcceptingGig] = useState(false);
  const [isDeletingGig, setIsDeletingGig] = useState(false);
  const [isMultiWorkerOpen, setIsMultiWorkerOpen] = useState(false);
  const [isDoubleBlindModalOpen, setIsDoubleBlindModalOpen] = useState(false);
  const [isLateCancelOpen, setIsLateCancelOpen] = useState(false);
  const [cancelModalMode, setCancelModalMode] = useState<CancellationModalMode>('WORKER_CANCEL');
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  if (!gig) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-white">
        <p className="text-slate-400">{language === 'vi' ? 'Không tìm thấy thông tin công việc.' : 'Gig not found.'}</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold">
          {t('back')}
        </button>
      </div>
    );
  }

  const isClient = roleMode === 'CLIENT';
  const isOwner = currentUser?.id === gig.clientId;
  const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'MOD' || currentUser?.id === '000000000';
  const isWorker = currentUser?.id === gig.freelancerId;
  const isNewbie = currentUser?.tier === 'NEWBIE';

  const isCurrentlyBoosted = !!(gig.isBoosted && gig.boostedUntil && gig.boostedUntil > Date.now());
  const boostMinutesLeft = isCurrentlyBoosted
    ? Math.max(1, Math.round(((gig.boostedUntil || 0) - Date.now()) / 60000))
    : 0;

  const handleStartVoip = () => {
    triggerHaptic('medium');
    startVoipCall(
      isClient ? (gig.freelancerName || (language === 'vi' ? 'Freelancer Nhận Kèo' : 'Assigned Freelancer')) : gig.clientName,
      isClient ? (language === 'vi' ? 'Người Làm' : 'Worker') : (language === 'vi' ? 'Người Thuê' : 'Client'),
      gig.id,
      false,
      undefined,
      isClient ? gig.freelancerId || undefined : gig.clientId
    );
  };

  const handleAcceptGig = async () => {
    if (isAcceptingGig) return;
    if (isNewbie) {
      triggerHaptic('medium');
      onOpenVerify();
      return;
    }
    setIsAcceptingGig(true);
    triggerHaptic('success');
    try {
      acceptGigDirectly(gig);
    } finally {
      setIsAcceptingGig(false);
    }
  };

  const handleDeleteGig = async () => {
    if (isDeletingGig) return;
    const confirmMsg = language === 'vi'
      ? `Bạn có chắc chắn muốn xóa vĩnh viễn bài đăng "${gig.title}"? Tiền cọc Escrow (nếu có) sẽ được hoàn trả 100% vào ví.`
      : `Are you sure you want to delete "${gig.title}" permanently? Locked Escrow will be 100% refunded.`;
    if (window.confirm(confirmMsg)) {
      setIsDeletingGig(true);
      try {
        const ok = await deleteGig(gig.id);
        if (ok) {
          onBack();
        }
      } finally {
        setIsDeletingGig(false);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 text-slate-100 space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            triggerHaptic('light');
            onBack();
          }}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#162C4E] border border-[#C5E5EC]/25 text-[#C5E5EC] text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back')}</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Masked VoIP encrypted call button */}
          <button
            onClick={handleStartVoip}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#3064AE]/30 border border-[#C5E5EC]/40 text-[#E0FAEB] text-xs font-bold hover:bg-[#3064AE]/50 transition shadow-sm cursor-pointer"
            title={language === 'vi' ? 'Gọi thoại mã hóa che số điện thoại' : 'Masked encrypted VoIP call'}
          >
            <PhoneCall className="w-3.5 h-3.5 text-[#C5E5EC]" />
            <span>{language === 'vi' ? 'Gọi Ẩn Danh' : 'Masked Call'}</span>
          </button>

          {/* Go to Chat button */}
          <button
            onClick={onOpenChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#162C4E] border border-[#C5E5EC]/25 text-white text-xs font-bold transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#C5E5EC]" />
            <span>{language === 'vi' ? 'Chat Bàn Giao' : 'Chat & Handover'}</span>
          </button>
        </div>
      </div>

      {/* Banner Ghim Top 1 Flash Boost (nếu đang được ghim) */}
      {isCurrentlyBoosted && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/80 via-orange-950/70 to-amber-950/80 border-2 border-red-500 shadow-lg shadow-red-500/20 flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-red-500 text-white rounded-xl">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black text-white flex items-center space-x-1">
                <span>{language === 'vi' ? '🔥 ĐƠN NÀY ĐANG ĐƯỢC GHIM TOP 1 TRANG CHỦ' : '🔥 THIS GIG IS PINNED #1 ON CAMPUS'}</span>
              </span>
              <p className="text-[11px] text-red-200">
                {language === 'vi' ? 'Hiển thị ưu tiên hỏa tốc thu hút hàng trăm sinh viên' : 'Priority display attracting campus peers fast'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-red-500/30 border border-red-400/50 rounded-xl text-red-200 font-mono font-black text-xs">
            {language === 'vi' ? `Còn ~${boostMinutesLeft} phút` : `~${boostMinutesLeft} mins left`}
          </span>
        </div>
      )}

      {/* Main Gig Details Card */}
      <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/25 p-6 shadow-2xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#3064AE] via-[#C5E5EC] to-[#E0FAEB]" />

        {/* Badges row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            {gig.isFlash && (
              <span className="flex items-center text-xs font-black text-[#0E1B2E] bg-amber-400 px-2.5 py-1 rounded-lg shadow-sm">
                <Zap className="w-3.5 h-3.5 mr-1 fill-current" /> {language === 'vi' ? 'HỎA TỐC' : 'FLASH'}
              </span>
            )}
            <span className="text-xs font-bold text-[#E0FAEB] bg-[#3064AE]/30 px-2.5 py-1 rounded-lg border border-[#C5E5EC]/30">
              {gig.category}
            </span>
            {gig.isRecurringWeekly && (
              <span className="flex items-center text-xs font-bold text-[#C5E5EC] bg-[#12233B] px-2.5 py-1 rounded-lg border border-[#C5E5EC]/30">
                <Repeat className="w-3 h-3 mr-1" /> {language === 'vi' ? 'Kèo định kỳ tuần' : 'Weekly recurring'}
              </span>
            )}
          </div>

          <span className="text-xs font-bold text-[#C5E5EC]/70">
            {language === 'vi' ? 'Trạng thái: ' : 'Status: '}
            <span
              className={`font-black ${
                gig.status === 'COMPLETED'
                  ? 'text-[#E0FAEB]'
                  : gig.status === 'SUBMITTED'
                  ? 'text-yellow-400'
                  : gig.status === 'DISPUTED'
                  ? 'text-red-400'
                  : 'text-[#C5E5EC]'
              }`}
            >
              {gig.status === 'OPEN'
                ? (language === 'vi' ? 'Đang mở nhận việc' : 'Open for Application')
                : gig.status === 'IN_PROGRESS'
                ? (language === 'vi' ? 'Đang thực hiện' : 'In Progress')
                : gig.status === 'SUBMITTED'
                ? (language === 'vi' ? 'Đã nộp bài (Chờ duyệt)' : 'Submitted (Pending Review)')
                : gig.status === 'COMPLETED'
                ? (language === 'vi' ? 'Đã hoàn tất & Giải ngân' : 'Completed & Disbursed')
                : gig.status}
            </span>
          </span>
        </div>

        {/* Title & Description */}
        <h1 className="text-xl font-extrabold text-white leading-snug">{gig.title}</h1>
        
        {/* Client / Poster Info Card with Verified Identity Badge */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#12233B]/80 border border-[#C5E5EC]/20">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3064AE] to-[#417AC6] text-white font-extrabold flex items-center justify-center text-sm shadow shrink-0">
              {(gig.clientName || 'K').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="font-extrabold text-sm text-white truncate">{gig.clientName}</span>
                {(() => {
                  const poster = users?.find((u) => u.id === gig.clientId);
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
                  return (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#3064AE]/30 text-[#C5E5EC] border border-[#C5E5EC]/30">
                      {USER_TIERS[gig.clientTier]?.badgeText || (language === 'vi' ? 'Người Dùng' : 'User')}
                    </span>
                  );
                })()}
              </div>
              <p className="text-[11px] text-[#C5E5EC]/70">
                {language === 'vi' ? 'Người đăng việc • Bảo chứng Escrow 100%' : 'Gig Poster • 100% Escrow Guaranteed'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenChat}
            className="px-3 py-1.5 rounded-xl bg-[#3064AE]/30 hover:bg-[#3064AE]/50 border border-[#C5E5EC]/30 text-[#C5E5EC] hover:text-white font-bold text-xs transition active:scale-95 shrink-0 cursor-pointer"
          >
            {language === 'vi' ? 'Nhắn Tin' : 'Chat'}
          </button>
        </div>

        <p className="text-xs text-[#C5E5EC]/90 leading-relaxed whitespace-pre-line">{gig.description}</p>

        {/* Location & Metrics Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#C5E5EC]/15 text-xs">
          <div className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20">
            <span className="text-[#C5E5EC]/80 flex items-center space-x-1 mb-1">
              <MapPin className="w-3.5 h-3.5 text-[#C5E5EC]" />
              <span className="font-semibold">{language === 'vi' ? 'Địa điểm làm việc' : 'Work Location'}</span>
            </span>
            <p className="font-bold text-white text-xs">{gig.locationName}</p>
            <span className="text-[11px] text-[#E0FAEB] font-mono font-semibold">
              {language === 'vi' ? `Cách bạn ~${gig.distanceMeters}m` : `~${gig.distanceMeters}m from you`}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20">
            <span className="text-[#C5E5EC]/80 flex items-center space-x-1 mb-1">
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-semibold">{language === 'vi' ? 'Thời lượng ước tính' : 'Estimated Duration'}</span>
            </span>
            <p className="font-bold text-white text-xs">~{gig.estimatedDurationMinutes} {language === 'vi' ? 'phút' : 'mins'}</p>
            <span className="text-[11px] text-[#C5E5EC]/60">
              {language === 'vi' ? 'Hoàn thành theo thỏa thuận' : 'Per mutual agreement'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20">
            <span className="text-[#C5E5EC]/80 flex items-center space-x-1 mb-1">
              <Users className="w-3.5 h-3.5 text-[#E0FAEB]" />
              <span className="font-semibold">{language === 'vi' ? 'Số người thực hiện' : 'Workers Needed'}</span>
            </span>
            <p className="font-bold text-white text-xs">
              {gig.confirmedWorkersCount || (gig.multiWorkers?.length || 0)}/{gig.totalWorkersNeeded || 1} {language === 'vi' ? 'người' : 'students'}
            </p>
            <span className="text-[11px] text-[#C5E5EC]/60">
              {(gig.totalWorkersNeeded || 1) > 1
                ? (language === 'vi' ? 'Kèo ghép nhóm đồng đội' : 'Team / Group task')
                : (language === 'vi' ? 'Đơn lẻ 1 người' : 'Solo 1 student')}
            </span>
          </div>
        </div>

        {/* Price & Smart Escrow Vault Protection Callout */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#12233B] to-[#162C4E] border border-[#C5E5EC]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-[#C5E5EC]/70 block font-semibold">
              {language === 'vi' ? 'Thù lao Smart Escrow bảo chứng:' : 'Smart Escrow Guaranteed Bounty:'}
            </span>
            <span className="text-2xl font-black text-[#E0FAEB]">
              {formatVnd(gig.price)}
            </span>
            <p className="text-[10px] text-[#E0FAEB] mt-0.5 flex items-center font-medium">
              <ShieldCheck className="w-3 h-3 mr-1 text-[#E0FAEB]" />{' '}
              {language === 'vi' ? 'Tiền đã được khóa trong Smart Escrow Vault của GigMe' : 'Funds securely locked in GigMe Smart Escrow Vault'}
            </p>
          </div>

          {/* Action buttons */}
          {!isOwner && gig.status === 'OPEN' && (
            <div className="flex flex-wrap gap-2">
              <button
                id="direct-accept-gig-btn"
                type="button"
                disabled={isAcceptingGig}
                onClick={handleAcceptGig}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-extrabold text-xs hover:brightness-110 shadow-lg shadow-[#3064AE]/20 transition flex items-center space-x-1.5 border border-[#E0FAEB]/30 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {isAcceptingGig ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#E0FAEB]" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-[#E0FAEB]" />
                )}
                <span>
                  {isAcceptingGig
                    ? (language === 'vi' ? 'Đang nhận việc...' : 'Accepting...')
                    : (language === 'vi' ? 'Nhận Kèo Ngay' : 'Accept Gig Now')}
                </span>
              </button>
            </div>
          )}

          {gig.status !== 'OPEN' && gig.status !== 'CANCELLED' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onOpenChat();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] to-[#417AC6] text-white font-extrabold text-xs hover:brightness-110 shadow-md transition flex items-center space-x-1.5 border border-[#C5E5EC]/30 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#C5E5EC]" />
                <span>{language === 'vi' ? 'Vào Khung Chat & Nghiệm Thu →' : 'Chat & Handover →'}</span>
              </button>

              {/* Nút gửi ảnh bằng chứng đóng dấu GPS & Timestamp (Chống quỵt tiền) */}
              {(gig.status === 'IN_PROGRESS' || gig.status === 'SUBMITTED') && isWorker && (
                <button
                  type="button"
                  onClick={() => setIsProofModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-extrabold text-xs hover:brightness-110 shadow-md transition flex items-center space-x-1.5 border border-[#E0FAEB]/30 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-[#E0FAEB]" />
                  <span>
                    {gig.status === 'SUBMITTED'
                      ? (language === 'vi' ? 'Cập Nhật Lại Bằng Chứng' : 'Update Proof')
                      : (language === 'vi' ? 'Chụp Ảnh Nghiệm Thu & Gửi Duyệt' : 'Upload Proof (GPS & Time)')}
                  </span>
                </button>
              )}

              {/* Freelancer actions when IN_PROGRESS */}
              {gig.status === 'IN_PROGRESS' && isWorker && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const confirmCancel = window.confirm(
                        language === 'vi'
                          ? 'Bạn có chắc chắn muốn hủy nhận công việc này không? Công việc sẽ được mở lại cho sinh viên khác.'
                          : 'Are you sure you want to cancel taking this gig? It will be reopened for other students.'
                      );
                      if (confirmCancel) {
                        cancelGigByWorker(gig.id, 'Thợ tự rút lui khỏi đơn');
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 font-bold text-xs hover:bg-red-500/25 transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>{language === 'vi' ? 'Hủy Nhận Việc (Rút khỏi đơn)' : 'Cancel Job (Leave task)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCancelModalMode('WORKER_NO_SHOW_REPORT');
                      setIsLateCancelOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold text-xs hover:bg-amber-500/25 transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <UserX className="w-4 h-4" />
                    <span>{language === 'vi' ? 'Báo Khách Boom Kèo' : 'Report Client No-Show'}</span>
                  </button>
                </>
              )}

              {/* Owner actions when IN_PROGRESS */}
              {gig.status === 'IN_PROGRESS' && isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCancelModalMode('CLIENT_CANCEL');
                      setIsLateCancelOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 font-bold text-xs hover:bg-red-500/25 transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>{language === 'vi' ? 'Hủy Đơn (Phạt nếu >10p)' : 'Cancel Order (>10m fee)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCancelModalMode('NO_SHOW_REPORT');
                      setIsLateCancelOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#3064AE]/30 border border-[#C5E5EC]/30 text-[#E0FAEB] font-bold text-xs hover:bg-[#3064AE]/50 transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <UserX className="w-4 h-4" />
                    <span>{language === 'vi' ? 'Báo Thợ Bỏ Bom (No-Show)' : 'Report Worker No-Show'}</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Trạng thái đơn đã hủy */}
          {gig.status === 'CANCELLED' && (
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 space-y-2">
              <div className="flex items-center space-x-2 text-red-300 font-black text-xs">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{language === 'vi' ? 'ĐƠN VIỆC ĐÃ BỊ HỦY BỎ' : 'THIS GIG HAS BEEN CANCELLED'}</span>
                {gig.isNoShowReported && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                    {language === 'vi' ? 'Xử Phạt No-Show' : 'No-Show Penalized'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                {gig.cancellationReason || (language === 'vi' ? 'Đơn việc đã bị hủy theo yêu cầu.' : 'Gig was cancelled per request.')}
              </p>
              {gig.cancellationPenaltyAmount ? (
                <p className="text-[11px] text-amber-300 font-semibold">
                  {language === 'vi' ? 'Mức phí bồi thường vi phạm đã khấu trừ:' : 'Compensation fee deducted:'} {formatVnd(gig.cancellationPenaltyAmount)}
                </p>
              ) : null}
            </div>
          )}
        </div>

        {/* KHỐI DUYỆT NGHIỆM THU & XÁC NHẬN ĐÃ XONG (DÀNH CHO CHỦ ĐƠN HOẶC KIỂM DUYỆT VIÊN) */}
        {gig.status === 'SUBMITTED' && (
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#12233B] via-[#0E1B2E] to-[#162C4E] border-2 border-emerald-500/40 shadow-2xl space-y-4 relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-[#C5E5EC] to-[#E0FAEB]" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <CheckCircle2 className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-white flex items-center space-x-2">
                    <span>{language === 'vi' ? 'Báo Cáo Nghiệm Thu Hoàn Thành' : 'Work Delivered For Review'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] border border-emerald-500/30">
                      {language === 'vi' ? 'ĐANG CHỜ DUYỆT' : 'PENDING APPROVAL'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-[#C5E5EC]/80 mt-1">
                    {isOwner
                      ? (language === 'vi' ? 'Thợ đã hoàn thành công việc và gửi hình ảnh nghiệm thu. Vui lòng kiểm tra và bấm nút bên dưới để giải ngân tiền Escrow!' : 'Worker has delivered proof. Please verify and confirm to release Escrow payout.')
                      : isStaff
                      ? (language === 'vi' ? 'Bạn đang xem với tư cách Kiểm Duyệt Viên / Admin. Bạn có thể duyệt thay hoặc phân xử giải ngân.' : 'You are viewing as Moderator / Admin. You can approve completion or resolve payout.')
                      : (language === 'vi' ? 'Bạn đã gửi minh chứng thành công. Vui lòng chờ người thuê hoặc BQT xác nhận nghiệm thu.' : 'Proof submitted. Awaiting client or admin approval.')}
                  </p>
                </div>
              </div>
            </div>

            {/* Nút hành động dành cho Người Thuê hoặc Kiểm Duyệt Viên */}
            {(isOwner || isStaff) && (
              <div className="pt-3 border-t border-[#C5E5EC]/15 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('success');
                    const ok = releaseEscrowPayout(gig.id);
                    if (ok) {
                      showNotification(
                        language === 'vi' ? 'Đã Giải Ngân Thành Công! 🎉' : 'Escrow Released Successfully! 🎉',
                        language === 'vi' ? `Đã hoàn tất nghiệm thu và chuyển ${formatVnd(gig.price)} vào ví của sinh viên làm việc.` : `Completed and transferred ${formatVnd(gig.price)} to worker.`,
                        true,
                        true
                      );
                      setIsDoubleBlindModalOpen(true);
                    }
                  }}
                  className="flex-1 min-w-[240px] py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-[#3064AE] hover:from-emerald-500 hover:to-[#417AC6] text-white font-black text-xs shadow-xl shadow-emerald-500/20 transition flex items-center justify-center space-x-2 active:scale-95 cursor-pointer border border-emerald-400/50"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                  <span>
                    {isOwner
                      ? (language === 'vi' ? `Xác Nhận Đã Xong & Giải Ngân Escrow (${formatVnd(gig.price)})` : `Confirm Done & Release Escrow (${formatVnd(gig.price)})`)
                      : (language === 'vi' ? `Kiểm Duyệt Viên: Duyệt Hoàn Thành & Giải Ngân Hộ (${formatVnd(gig.price)})` : `Staff: Approve Done & Release Escrow (${formatVnd(gig.price)})`)}
                  </span>
                </button>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      const note = window.prompt(
                        language === 'vi' ? 'Nhập ghi chú yêu cầu chỉnh sửa gửi cho thợ:' : 'Enter revision notes for the worker:'
                      );
                      if (note && note.trim()) {
                        requestGigRevision(gig.id, note.trim());
                      }
                    }}
                    className="px-4 py-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Repeat className="w-4 h-4" />
                    <span>{language === 'vi' ? 'Yêu Cầu Chỉnh Sửa' : 'Request Revision'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* NÚT XÁC NHẬN HOÀN THÀNH KHI ĐANG THỰC HIỆN (DÀNH CHO CHỦ ĐƠN HOẶC KIỂM DUYỆT VIÊN) */}
        {gig.status === 'IN_PROGRESS' && (isOwner || isStaff) && (
          <div className="p-4 rounded-2xl bg-[#12233B] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
            <div>
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{language === 'vi' ? 'Nghiệm Thu Trực Tiếp Tại Chỗ' : 'Direct On-Site Approval'}</span>
              </span>
              <p className="text-[11px] text-[#C5E5EC]/70 mt-0.5">
                {language === 'vi'
                  ? 'Nếu thợ đã bàn giao xong việc trực tiếp cho bạn, bạn có thể bấm xác nhận để thanh toán ngay mà không cần chờ nộp ảnh.'
                  : 'If worker has completed work in-person, you can confirm completion immediately without waiting for photos.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('success');
                const okConfirm = window.confirm(
                  language === 'vi'
                    ? `Xác nhận thợ đã hoàn thành công việc và giải ngân ${formatVnd(gig.price)} từ quỹ Escrow vào ví của thợ ngay bây giờ?`
                    : `Confirm worker completed task and disburse ${formatVnd(gig.price)} from Escrow vault now?`
                );
                if (okConfirm) {
                  const ok = releaseEscrowPayout(gig.id);
                  if (ok) {
                    showNotification(
                      language === 'vi' ? 'Đã Giải Ngân Thành Công! 🎉' : 'Escrow Released Successfully! 🎉',
                      language === 'vi' ? `Đã hoàn tất nghiệm thu và chuyển ${formatVnd(gig.price)} vào ví của sinh viên.` : `Completed and transferred ${formatVnd(gig.price)} to worker.`,
                      true,
                      true
                    );
                    setIsDoubleBlindModalOpen(true);
                  }
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition flex items-center space-x-1.5 active:scale-95 cursor-pointer shrink-0 border border-emerald-400/40"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{language === 'vi' ? `Xác Nhận Đã Xong & Giải Ngân (${formatVnd(gig.price)})` : `Confirm Done & Release Escrow (${formatVnd(gig.price)})`}</span>
            </button>
          </div>
        )}

        {/* Nút Hủy Đăng Kèo, Nút Boost & Xóa Bài Đăng dành cho chủ đơn khi OPEN hoặc Admin/Mod */}
        {(isOwner || isStaff) && (
          <div className="pt-2 border-t border-[#C5E5EC]/15 space-y-2">
            {isOwner && gig.status === 'OPEN' && !isCurrentlyBoosted && (
              <button
                onClick={() => boostGig(gig.id)}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-lg shadow-red-500/20 flex items-center justify-center space-x-2 transition-all active:scale-98 cursor-pointer"
              >
                <Rocket className="w-4 h-4 text-yellow-300" />
                <span>{language === 'vi' ? '🚀 Đẩy Bài & Ghim Top 1 Hỏa Tốc Trang Chủ (+10.000đ trong 2h)' : '🚀 Flash Boost & Pin #1 on Feed (+10,000 VND for 2h)'}</span>
              </button>
            )}

            {isOwner && gig.status === 'OPEN' && (
              <button
                type="button"
                onClick={() => {
                  setCancelModalMode('CLIENT_CANCEL');
                  setIsLateCancelOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-[#12233B] hover:bg-red-500/20 text-[#C5E5EC] hover:text-red-300 border border-[#C5E5EC]/20 hover:border-red-500/30 font-bold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-red-400" />
                <span>{language === 'vi' ? 'Hủy Đăng Bài (Hoàn Trả 100% Tiền Cọc Escrow)' : 'Cancel Job (100% Escrow Refunded)'}</span>
              </button>
            )}

            {/* Nút Xóa vĩnh viễn bài đăng cho chủ đơn khi OPEN hoặc Admin/Mod mọi lúc */}
            {(gig.status === 'OPEN' || gig.status === 'CANCELLED' || isStaff) && (
              <button
                type="button"
                disabled={isDeletingGig}
                onClick={handleDeleteGig}
                className="w-full py-2.5 px-4 rounded-2xl bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30 hover:border-red-500/50 font-bold text-xs transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isDeletingGig ? (
                  <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span>
                  {isDeletingGig
                    ? (language === 'vi' ? 'Đang xóa...' : 'Deleting...')
                    : isStaff && !isOwner
                    ? (language === 'vi' ? '🛡️ Kiểm Duyệt Viên: Gỡ / Xóa Vĩnh Viễn Bài Đăng' : '🛡️ Staff: Delete Gig Permanently')
                    : (language === 'vi' ? 'Xóa Vĩnh Viễn Bài Đăng Này' : 'Permanently Delete This Gig')}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* PWA Offline Cache Status Badge */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 text-[11px] text-[#C5E5EC]/70">
        <div className="flex items-center space-x-2">
          <Download className="w-4 h-4 text-[#C5E5EC] shrink-0" />
          <span>
            {language === 'vi'
              ? 'Đơn việc này đã được tự động lưu bộ nhớ đệm PWA Offline. Xem được kể cả khi vào thang máy/mất sóng 4G.'
              : 'This gig is cached in PWA offline storage. Viewable without internet connection.'}
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3064AE]/30 text-[#E0FAEB] border border-[#C5E5EC]/30">
          {language === 'vi' ? 'Sẵn sàng Offline' : 'Offline Ready'}
        </span>
      </div>

      {/* BẰNG CHỨNG NGHIỆM THU WATERMARK GPS & TIMESTAMP (NHÓM 4 - UPDATE 2) */}
      {(gig.proofImageUrl || gig.proofWatermarkUrl) && (
        <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/25 p-5 shadow-xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#3064AE] via-[#C5E5EC] to-[#E0FAEB]" />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 rounded-xl bg-[#3064AE]/30 text-[#C5E5EC] border border-[#C5E5EC]/30">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center space-x-1.5">
                  <span>
                    {language === 'vi'
                      ? 'Minh Chứng Nghiệm Thu (Watermark GPS & Timestamp)'
                      : 'Acceptance Proof (Watermark GPS & Timestamp)'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#3064AE]/40 text-[#E0FAEB] text-[10px] font-black border border-[#C5E5EC]/30">
                    {language === 'vi' ? 'Bảo vệ 100%' : '100% Protected'}
                  </span>
                </h3>
                <p className="text-[11px] text-[#C5E5EC]/70">
                  {gig.isWatermarkRemoved
                    ? language === 'vi'
                      ? 'Đã giải ngân Escrow thành công - Bản gốc chất lượng cao đã mở khóa'
                      : 'Escrow released successfully - High-res original unlocked'
                    : language === 'vi'
                    ? 'Bản xem trước có Watermark chống quỵt kèm tọa độ GPS & dấu thời gian'
                    : 'Preview with anti-fraud Watermark, GPS coordinates & timestamp'}
                </p>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-[#C5E5EC]/20 bg-[#12233B] max-h-64 flex items-center justify-center">
            <img
              src={(gig.proofWatermarkUrl || gig.proofImageUrl) || ''}
              alt={language === 'vi' ? 'Bằng chứng công việc' : 'Proof of work'}
              className="w-full h-full object-cover"
            />
            {gig.proofHash && (
              <div className="absolute bottom-2 left-2 right-2 p-2 rounded-xl bg-[#0E1B2E]/90 backdrop-blur-sm border border-[#C5E5EC]/40 text-[10px] text-[#E0FAEB] font-mono flex items-center justify-between">
                <span>Hash: {gig.proofHash.slice(0, 16)}...</span>
                <span>
                  {gig.proofTimestamp
                    ? new Date(gig.proofTimestamp).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US')
                    : language === 'vi'
                    ? 'Đã ghi nhận'
                    : 'Recorded'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ĐÁNH GIÁ HAI CHIỀU MÙ (DOUBLE-BLIND REVIEW - NHÓM 3 - UPDATE 3) */}
      {gig.status === 'COMPLETED' && (
        <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/30 p-5 shadow-xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#3064AE] via-[#C5E5EC] to-[#E0FAEB]" />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 rounded-xl bg-[#3064AE]/30 text-[#C5E5EC] border border-[#C5E5EC]/30">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
                  <span>
                    {language === 'vi'
                      ? 'Đánh Giá Hai Chiều Mù (Double-Blind Review)'
                      : 'Double-Blind Review (Mutual Blind)'}
                  </span>
                  {gig.isDoubleBlindRevealed ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#E0FAEB]/20 text-[#E0FAEB] text-[10px] font-black border border-[#E0FAEB]/40">
                      {language === 'vi' ? 'Đã Công Khai' : 'Publicly Revealed'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-[#3064AE]/30 text-[#C5E5EC] text-[10px] font-black border border-[#C5E5EC]/30">
                      {language === 'vi' ? 'Bảo Mật Hai Chiều' : 'Blind Sealed'}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-[#C5E5EC]/70">
                  {gig.isDoubleBlindRevealed
                    ? language === 'vi'
                      ? 'Cả hai bên đã đánh giá - Toàn bộ nhận xét và số sao đã được công khai minh bạch!'
                      : 'Both parties rated - Reviews and stars are now publicly visible!'
                    : language === 'vi'
                    ? 'Chống trả thù đánh giá xấu: Chỉ mở khóa khi cả người thuê và người làm đều hoàn tất đánh giá.'
                    : 'Anti-retaliation: Revealed only when both client and worker submit their ratings.'}
                </p>
              </div>
            </div>
          </div>

          {/* Trạng thái đánh giá từng bên */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#C5E5EC]/80 font-bold">
                  {language === 'vi' ? 'Khách hàng' : 'Client'} ({gig.clientName}):
                </span>
                {gig.clientRatedAt ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#E0FAEB]/20 text-[#E0FAEB] font-black text-[10px]">
                    {language === 'vi' ? '✅ Đã gửi' : '✅ Submitted'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                    {language === 'vi' ? '⏳ Chưa gửi' : '⏳ Pending'}
                  </span>
                )}
              </div>
              {gig.isDoubleBlindRevealed && gig.clientRating ? (
                <div>
                  <div className="flex items-center space-x-1 text-amber-400 font-bold">
                    <span>{gig.clientRating} ★</span>
                  </div>
                  <p className="text-slate-300 italic text-[11px] mt-1">&quot;{gig.clientReview}&quot;</p>
                </div>
              ) : (
                <p className="text-[11px] text-[#C5E5EC]/60">
                  {gig.clientRatedAt
                    ? language === 'vi'
                      ? '🔒 Đã niêm phong kín'
                      : '🔒 Sealed'
                    : language === 'vi'
                    ? 'Chưa gửi đánh giá'
                    : 'Not rated yet'}
                </p>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#C5E5EC]/80 font-bold">
                  {language === 'vi' ? 'Thợ' : 'Worker'} ({gig.freelancerName || (language === 'vi' ? 'Người Làm' : 'Worker')}):
                </span>
                {gig.freelancerRatedAt ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#E0FAEB]/20 text-[#E0FAEB] font-black text-[10px]">
                    {language === 'vi' ? '✅ Đã gửi' : '✅ Submitted'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                    {language === 'vi' ? '⏳ Chưa gửi' : '⏳ Pending'}
                  </span>
                )}
              </div>
              {gig.isDoubleBlindRevealed && gig.freelancerRating ? (
                <div>
                  <div className="flex items-center space-x-1 text-amber-400 font-bold">
                    <span>{gig.freelancerRating} ★</span>
                  </div>
                  <p className="text-slate-300 italic text-[11px] mt-1">&quot;{gig.freelancerReview}&quot;</p>
                </div>
              ) : (
                <p className="text-[11px] text-[#C5E5EC]/60">
                  {gig.freelancerRatedAt
                    ? language === 'vi'
                      ? '🔒 Đã niêm phong kín'
                      : '🔒 Sealed'
                    : language === 'vi'
                    ? 'Chưa gửi đánh giá'
                    : 'Not rated yet'}
                </p>
              )}
            </div>
          </div>

          {/* Action button to review */}
          {!gig.isDoubleBlindRevealed && (
            <button
              onClick={() => setIsDoubleBlindModalOpen(true)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] hover:brightness-110 text-white font-extrabold text-xs shadow-lg shadow-[#3064AE]/20 flex items-center justify-center space-x-2 transition cursor-pointer border border-[#E0FAEB]/30"
            >
              <Star className="w-4 h-4 text-amber-300" />
              <span>
                {isOwner
                  ? gig.clientRatedAt
                    ? language === 'vi'
                      ? 'Chỉnh Sửa Đánh Giá Của Bạn (Đang Niêm Phong)'
                      : 'Edit Your Review (Currently Sealed)'
                    : language === 'vi'
                    ? 'Gửi Đánh Giá Người Làm (Bảo Mật Hai Chiều)'
                    : 'Submit Worker Review (Double-Blind)'
                  : gig.freelancerRatedAt
                  ? language === 'vi'
                    ? 'Chỉnh Sửa Đánh Giá Của Bạn (Đang Niêm Phong)'
                    : 'Edit Your Review (Currently Sealed)'
                  : language === 'vi'
                  ? 'Gửi Đánh Giá Khách Hàng (Bảo Mật Hai Chiều)'
                  : 'Submit Client Review (Double-Blind)'}
              </span>
            </button>
          )}
        </div>
      )}

      {/* KHỐI TÍNH NĂNG 2: ĐƠN VIỆC NHÓM & ĐIỂM DANH QR (MULTI-WORKER CHECK-IN QR) */}
      {((gig.totalWorkersNeeded || 1) > 1 || (gig.multiWorkers && gig.multiWorkers.length > 0)) && (
        <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/30 p-5 shadow-xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#3064AE] via-[#C5E5EC] to-[#E0FAEB]" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-[#3064AE]/30 text-[#E0FAEB] rounded-2xl border border-[#C5E5EC]/30">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-sm text-white">
                    {language === 'vi'
                      ? 'Đơn Việc Nhóm & Điểm Danh QR Hiện Trường'
                      : 'Multi-Worker Task & On-Site QR Check-In'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#E0FAEB]/20 text-[#E0FAEB] text-[10px] font-bold border border-[#E0FAEB]/30">
                    {gig.multiWorkers?.length || 0}/{gig.totalWorkersNeeded || 2}{' '}
                    {language === 'vi' ? 'Trợ Thủ' : 'Workers'}
                  </span>
                </div>
                <p className="text-[11px] text-[#C5E5EC]/80 mt-0.5">
                  {isOwner
                    ? language === 'vi'
                      ? 'Quản lý danh sách trợ thủ, xuất mã QR điểm danh hiện trường và giải ngân tự động chia đều thù lao.'
                      : 'Manage helpers, generate on-site QR check-in, and auto-disburse split payouts.'
                    : language === 'vi'
                    ? 'Đăng ký tham gia ca làm việc nhóm và quét mã QR của chủ việc để điểm danh nhận tiền.'
                    : 'Join multi-worker task and scan client QR code to check in and receive pay.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsMultiWorkerOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] hover:brightness-110 text-white font-black text-xs shadow-lg shadow-[#3064AE]/20 transition flex items-center space-x-1.5 shrink-0 border border-[#E0FAEB]/30 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>
                {isOwner
                  ? language === 'vi'
                    ? 'Bảng Điểm Danh & Mã QR'
                    : 'Check-In Board & QR'
                  : language === 'vi'
                  ? 'Tham Gia & Điểm Danh QR'
                  : 'Join & Check-In QR'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Client Profile Card */}
      <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/25 p-5 shadow-xl text-xs flex items-center justify-between relative overflow-hidden">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3064AE] to-[#C5E5EC] flex items-center justify-center font-bold text-white text-base shadow">
            {gig.clientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="font-extrabold text-white text-sm">{gig.clientName}</h4>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#E0FAEB]/20 text-[#E0FAEB] font-bold border border-[#E0FAEB]/30">
                {USER_TIERS[gig.clientTier]?.badgeText || (language === 'vi' ? 'Đã KYC' : 'KYC Verified')}
              </span>
            </div>
            <p className="text-[11px] text-[#C5E5EC]/70">
              {language === 'vi'
                ? 'Người đăng việc • Đã chi tiêu hơn 2.400.000đ'
                : 'Gig Poster • Over 2,400,000 VND spent'}
            </p>
          </div>
        </div>

        <button
          onClick={handleStartVoip}
          className="p-2.5 rounded-xl bg-[#12233B] hover:bg-[#162C4E] text-[#C5E5EC] border border-[#C5E5EC]/25 transition cursor-pointer"
          title={language === 'vi' ? 'Gọi thoại VoIP ẩn danh' : 'Anonymous VoIP Call'}
        >
          <PhoneCall className="w-4 h-4" />
        </button>
      </div>

      {/* Multi-Worker Check-In QR Modal */}
      <MultiWorkerCheckInModal
        isOpen={isMultiWorkerOpen}
        gig={gig}
        onClose={() => setIsMultiWorkerOpen(false)}
      />

      {/* Double-Blind Review Modal */}
      <DoubleBlindReviewModal
        isOpen={isDoubleBlindModalOpen}
        gig={gig}
        role={isOwner ? 'CLIENT' : 'FREELANCER'}
        onClose={() => setIsDoubleBlindModalOpen(false)}
      />

      {/* Late Cancellation & Penalty Modal */}
      <LateCancellationModal
        isOpen={isLateCancelOpen}
        gig={gig}
        mode={cancelModalMode}
        onClose={() => setIsLateCancelOpen(false)}
      />

      {/* Blockchain Proof with Watermark GPS & Timestamp Modal */}
      <BlockchainProofModal
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        gigId={gig.id}
      />
    </div>
  );
};
