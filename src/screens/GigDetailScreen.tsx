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
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { useTranslation } from '../context/LanguageContext';
import { formatVnd, USER_TIERS } from '../types';
import { LiveReverseBiddingModal } from '../components/LiveReverseBiddingModal';
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
    currentGigBids,
    currentUser,
    users,
    roleMode,
    toggleRoleMode,
    startVoipCall,
    acceptGigDirectly,
    placeBid,
    boostGig,
  } = useGigMe();
  const { language, t } = useTranslation();

  const gig = rawGigs.find((g) => g.id === gigId);

  // Auto cache gig into PWA offline memory when viewed
  useEffect(() => {
    if (gig) {
      offlineCacheManager.cacheGig(gig, gig.clientPhone || '0909120918');
    }
  }, [gig]);

  // Reverse auction bid modal
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidPrice, setBidPrice] = useState(gig ? gig.price - 5000 : 50000);
  const [bidMinutes, setBidMinutes] = useState(30);
  const [bidNote, setBidNote] = useState(
    language === 'vi'
      ? 'Mình cam kết hoàn thành đúng hạn và chất lượng tốt nhất!'
      : 'I commit to on-time delivery with best quality!'
  );

  // New feature modals
  const [isLiveAuctionOpen, setIsLiveAuctionOpen] = useState(false);
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
      gig.id
    );
  };

  const handlePlaceBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    const success = placeBid(gig.id, bidPrice, bidMinutes, bidNote);
    if (success) {
      triggerHaptic('success');
      setShowBidModal(false);
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
            {gig.isReverseAuction && (
              <span className="flex items-center text-xs font-bold text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800">
                <Gavel className="w-3 h-3 mr-1" /> {language === 'vi' ? 'Đấu giá ngược' : 'Reverse auction'}
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
              {gig.isReverseAuction
                ? (language === 'vi' ? 'Giá thầu thấp nhất hiện tại:' : 'Current Lowest Bid:')
                : (language === 'vi' ? 'Thù lao Smart Escrow:' : 'Smart Escrow Bounty:')}
            </span>
            <span className="text-2xl font-black text-[#E0FAEB]">
              {formatVnd(gig.isReverseAuction && gig.lowestBidPrice ? gig.lowestBidPrice : gig.price)}
            </span>
            <p className="text-[10px] text-[#E0FAEB] mt-0.5 flex items-center font-medium">
              <ShieldCheck className="w-3 h-3 mr-1 text-[#E0FAEB]" />{' '}
              {language === 'vi' ? 'Tiền đã được khóa trong Smart Escrow Vault của GigMe' : 'Funds securely locked in GigMe Smart Escrow Vault'}
            </p>
          </div>

          {/* Action buttons */}
          {!isOwner && gig.status === 'OPEN' && (
            <div className="flex flex-wrap gap-2">
              {/* Nếu phòng đấu giá trực tiếp đang mở, ưu tiên nút vào phòng */}
              {gig.auctionRoomOpen && (
                <button
                  onClick={() => setIsLiveAuctionOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white font-black text-xs hover:brightness-110 shadow-lg shadow-red-500/30 transition flex items-center space-x-1.5 animate-bounce cursor-pointer"
                >
                  <Radio className="w-4 h-4" />
                  <span>{language === 'vi' ? '🔴 Vào Đấu Giá Trực Tiếp!' : '🔴 Join Live Auction!'}</span>
                </button>
              )}

              {gig.isReverseAuction ? (
                <button
                  id="open-bid-modal-btn"
                  onClick={() => {
                    triggerHaptic('medium');
                    if (isNewbie) {
                      onOpenVerify();
                    } else {
                      setShowBidModal(true);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] to-[#417AC6] text-white font-extrabold text-xs hover:brightness-110 shadow-md transition flex items-center space-x-1.5 border border-[#C5E5EC]/30 cursor-pointer"
                >
                  <Gavel className="w-4 h-4 text-[#E0FAEB]" />
                  <span>{language === 'vi' ? 'Đấu Giá Thầu Kèo Này' : 'Bid on This Gig'}</span>
                </button>
              ) : (
                <button
                  id="direct-accept-gig-btn"
                  onClick={() => {
                    if (isNewbie) {
                      triggerHaptic('medium');
                      onOpenVerify();
                    } else {
                      triggerHaptic('success');
                      acceptGigDirectly(gig);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-extrabold text-xs hover:brightness-110 shadow-lg shadow-[#3064AE]/20 transition flex items-center space-x-1.5 border border-[#E0FAEB]/30 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#E0FAEB]" />
                  <span>{language === 'vi' ? 'Nhận Kèo Ngay' : 'Accept Gig Now'}</span>
                </button>
              )}
            </div>
          )}

          {gig.status !== 'OPEN' && gig.status !== 'CANCELLED' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
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
              {gig.status === 'IN_PROGRESS' && currentUser?.id === gig.freelancerId && (
                <button
                  type="button"
                  onClick={() => setIsProofModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-extrabold text-xs hover:brightness-110 shadow-md transition flex items-center space-x-1.5 border border-[#E0FAEB]/30 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-[#E0FAEB]" />
                  <span>{language === 'vi' ? 'Chụp Ảnh Nghiệm Thu (Dấu GPS & Giờ)' : 'Upload Proof (GPS & Time)'}</span>
                </button>
              )}

              {/* Freelancer actions when IN_PROGRESS */}
              {gig.status === 'IN_PROGRESS' && currentUser?.id === gig.freelancerId && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCancelModalMode('WORKER_CANCEL');
                      setIsLateCancelOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 font-bold text-xs hover:bg-red-500/25 transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>{language === 'vi' ? 'Hủy Nhận Việc (Kiểm tra phạt)' : 'Cancel Job (Check fee)'}</span>
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

        {/* Nút Hủy Đăng Kèo & Nút Boost dành cho chủ đơn khi OPEN */}
        {isOwner && gig.status === 'OPEN' && (
          <div className="pt-2 border-t border-[#C5E5EC]/15 space-y-2">
            {!isCurrentlyBoosted && (
              <button
                onClick={() => boostGig(gig.id)}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-lg shadow-red-500/20 flex items-center justify-center space-x-2 transition-all active:scale-98 cursor-pointer"
              >
                <Rocket className="w-4 h-4 text-yellow-300" />
                <span>{language === 'vi' ? '🚀 Đẩy Bài & Ghim Top 1 Hỏa Tốc Trang Chủ (+10.000đ trong 2h)' : '🚀 Flash Boost & Pin #1 on Feed (+10,000 VND for 2h)'}</span>
              </button>
            )}

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

      {/* KHỐI TÍNH NĂNG 1: ĐẤU GIÁ NGƯỢC THỜI GIAN THỰC (LIVE REVERSE BIDDING ROOM) */}
      {(gig.isReverseAuction || gig.auctionRoomOpen || isOwner) && (
        <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/30 p-5 shadow-xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#3064AE] via-[#C5E5EC] to-[#E0FAEB]" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-[#3064AE]/30 text-[#C5E5EC] rounded-2xl border border-[#C5E5EC]/30">
                <Radio className={`w-6 h-6 ${gig.auctionRoomOpen ? 'animate-pulse text-red-400' : ''}`} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-sm text-white">
                    {language === 'vi'
                      ? 'Phòng Đấu Giá Ngược Trực Tiếp (Live Reverse Bidding)'
                      : 'Live Reverse Bidding Room'}
                  </h3>
                  {gig.auctionRoomOpen ? (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-black border border-red-500/40 animate-pulse">
                      {language === 'vi' ? '🔴 ĐANG MỞ' : '🔴 LIVE OPEN'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-[#12233B] text-[#C5E5EC]/60 text-[10px] font-bold border border-[#C5E5EC]/20">
                      {language === 'vi' ? 'Chưa mở phòng' : 'Room Closed'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#C5E5EC]/80 mt-0.5">
                  {isOwner
                    ? language === 'vi'
                      ? 'Chỉ bạn có quyền tạo và mở phòng đấu giá ngược. Freelancer sẽ cùng vào phòng đặt giá giảm dần trực tiếp.'
                      : 'Only you can open the reverse auction. Freelancers join to bid lower prices live.'
                    : gig.auctionRoomOpen
                    ? language === 'vi'
                      ? 'Chủ việc đã mở phòng đấu giá! Bạn có thể vào ngay để hạ giá và giành quyền nhận việc.'
                      : 'Client opened the auction room! Enter now to bid lower and win this gig.'
                    : language === 'vi'
                    ? 'Phòng đấu giá trực tiếp chỉ có thể do chủ việc khởi tạo và mở phòng.'
                    : 'Live auction room can only be launched by the gig creator.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsLiveAuctionOpen(true)}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-lg transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                gig.auctionRoomOpen
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white hover:brightness-110'
                  : isOwner
                  ? 'bg-gradient-to-r from-[#3064AE] to-[#417AC6] text-white hover:brightness-110 border border-[#C5E5EC]/30'
                  : 'bg-[#12233B] text-[#C5E5EC] hover:bg-[#162C4E] border border-[#C5E5EC]/25'
              }`}
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>
                {isOwner
                  ? gig.auctionRoomOpen
                    ? language === 'vi'
                      ? 'Quản Lý Phòng Đang Mở'
                      : 'Manage Open Room'
                    : language === 'vi'
                    ? 'Mở Phòng Đấu Giá Ngay'
                    : 'Open Live Auction'
                  : gig.auctionRoomOpen
                  ? language === 'vi'
                    ? 'Vào Phòng Đấu Giá'
                    : 'Join Live Auction'
                  : language === 'vi'
                  ? 'Xem Trạng Thái Phòng'
                  : 'View Room Status'}
              </span>
            </button>
          </div>
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

      {/* Reverse Auction Bids List (if any) */}
      {gig.isReverseAuction && (
        <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/25 p-5 shadow-xl space-y-3 text-xs relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#3064AE] via-[#C5E5EC] to-[#E0FAEB]" />
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white flex items-center space-x-1.5">
              <Gavel className="w-4 h-4 text-[#C5E5EC]" />
              <span>
                {language === 'vi' ? 'Các Đề Xuất Đấu Giá Thầu' : 'Reverse Auction Bids'} ({currentGigBids.length})
              </span>
            </h3>
            <span className="text-[10px] text-[#C5E5EC]/70">
              {language === 'vi'
                ? 'Ai ra giá & thời gian tốt nhất sẽ được chọn'
                : 'Best price & fastest delivery gets picked'}
            </span>
          </div>

          {currentGigBids.length === 0 ? (
            <p className="text-[#C5E5EC]/60 py-3 text-center">
              {language === 'vi'
                ? 'Chưa có ai đấu giá kèo này. Hãy là người đầu tiên!'
                : 'No bids yet for this gig. Be the first!'}
            </p>
          ) : (
            <div className="space-y-2">
              {currentGigBids.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{b.freelancerName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 font-bold">
                        {b.freelancerTier}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#C5E5EC]/70 mt-0.5">&quot;{b.proposalNote}&quot;</p>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-black text-[#E0FAEB] text-sm block">
                      {formatVnd(b.offeredPrice)}
                    </span>
                    <span className="text-[10px] text-[#C5E5EC]/70">
                      ~{b.estimatedMinutes} {language === 'vi' ? 'phút' : 'mins'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reverse Auction Bid Submission Modal */}
      {showBidModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBidModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/30 p-6 text-white shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#3064AE] via-[#C5E5EC] to-[#E0FAEB]" />
            <div className="flex justify-between items-center pb-3 border-b border-[#C5E5EC]/20">
              <h3 className="font-extrabold text-sm flex items-center space-x-1.5 text-[#E0FAEB]">
                <Gavel className="w-4 h-4 text-[#C5E5EC]" />
                <span>{language === 'vi' ? 'Đấu Giá Ngược Kèo Này' : 'Bid on This Reverse Auction'}</span>
              </h3>
              <button
                onClick={() => setShowBidModal(false)}
                className="text-[#C5E5EC]/60 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceBidSubmit} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                  {language === 'vi' ? 'Mức giá đề xuất của bạn (VND)' : 'Your proposed price (VND)'}
                </label>
                <input
                  type="number"
                  step="5000"
                  required
                  value={bidPrice}
                  onChange={(e) => setBidPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/30 text-[#E0FAEB] font-mono text-base font-bold focus:outline-none focus:border-[#C5E5EC]"
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                  {language === 'vi'
                    ? 'Thời gian bạn cam kết hoàn thành (Phút)'
                    : 'Committed completion time (Minutes)'}
                </label>
                <input
                  type="number"
                  required
                  value={bidMinutes}
                  onChange={(e) => setBidMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/30 text-white font-mono focus:outline-none focus:border-[#C5E5EC]"
                  placeholder="30"
                />
              </div>

              <div>
                <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                  {language === 'vi' ? 'Ghi chú đề xuất / Điểm mạnh của bạn' : 'Proposal note / Your strengths'}
                </label>
                <textarea
                  rows={2}
                  required
                  value={bidNote}
                  onChange={(e) => setBidNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/30 text-white focus:outline-none focus:border-[#C5E5EC]"
                  placeholder={
                    language === 'vi'
                      ? 'Tôi có kinh nghiệm, hoàn thành trong 20 phút...'
                      : 'I have experience, will complete in 20 minutes...'
                  }
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-extrabold text-sm hover:brightness-110 shadow-lg shadow-[#3064AE]/20 transition cursor-pointer border border-[#E0FAEB]/30"
              >
                {language === 'vi' ? 'Gửi Đề Xuất Đấu Giá' : 'Submit Auction Bid'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Live Reverse Bidding Room Modal */}
      <LiveReverseBiddingModal
        isOpen={isLiveAuctionOpen}
        gig={gig}
        onClose={() => setIsLiveAuctionOpen(false)}
      />

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
