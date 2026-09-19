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
import { formatVnd, USER_TIERS } from '../types';
import { LiveReverseBiddingModal } from '../components/LiveReverseBiddingModal';
import { MultiWorkerCheckInModal } from '../components/MultiWorkerCheckInModal';
import { DoubleBlindReviewModal } from '../components/DoubleBlindReviewModal';
import { LateCancellationModal, CancellationModalMode } from '../components/LateCancellationModal';
import { BlockchainProofModal } from '../components/BlockchainProofModal';
import { offlineCacheManager } from '../utils/offlineCache';

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
    roleMode,
    toggleRoleMode,
    startVoipCall,
    acceptGigDirectly,
    placeBid,
    boostGig,
  } = useGigMe();

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
  const [bidNote, setBidNote] = useState('Mình cam kết hoàn thành đúng hạn và chất lượng tốt nhất!');

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
        <p className="text-slate-400">Không tìm thấy thông tin công việc.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold">
          Quay lại
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
    startVoipCall(
      isClient ? (gig.freelancerName || 'Freelancer Nhận Kèo') : gig.clientName,
      isClient ? 'Người Làm' : 'Người Thuê',
      gig.id
    );
  };

  const handlePlaceBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = placeBid(gig.id, bidPrice, bidMinutes, bidNote);
    if (success) {
      setShowBidModal(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 text-slate-100 space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#162C4E] border border-[#C5E5EC]/25 text-[#C5E5EC] text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Masked VoIP encrypted call button */}
          <button
            onClick={handleStartVoip}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#3064AE]/30 border border-[#C5E5EC]/40 text-[#E0FAEB] text-xs font-bold hover:bg-[#3064AE]/50 transition shadow-sm cursor-pointer"
            title="Gọi thoại mã hóa che số điện thoại"
          >
            <PhoneCall className="w-3.5 h-3.5 text-[#C5E5EC]" />
            <span>Gọi Ẩn Danh</span>
          </button>

          {/* Go to Chat button */}
          <button
            onClick={onOpenChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#162C4E] border border-[#C5E5EC]/25 text-white text-xs font-bold transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#C5E5EC]" />
            <span>Chat Bàn Giao</span>
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
                <span>🔥 ĐƠN NÀY ĐANG ĐƯỢC GHIM TOP 1 TRANG CHỦ</span>
              </span>
              <p className="text-[11px] text-red-200">Hiển thị ưu tiên hỏa tốc thu hút hàng trăm sinh viên</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-red-500/30 border border-red-400/50 rounded-xl text-red-200 font-mono font-black text-xs">
            Còn ~{boostMinutesLeft} phút
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
                <Zap className="w-3.5 h-3.5 mr-1 fill-current" /> HỎA TỐC
              </span>
            )}
            <span className="text-xs font-bold text-[#E0FAEB] bg-[#3064AE]/30 px-2.5 py-1 rounded-lg border border-[#C5E5EC]/30">
              {gig.category}
            </span>
            {gig.isRecurringWeekly && (
              <span className="flex items-center text-xs font-bold text-[#C5E5EC] bg-[#12233B] px-2.5 py-1 rounded-lg border border-[#C5E5EC]/30">
                <Repeat className="w-3 h-3 mr-1" /> Kèo định kỳ tuần
              </span>
            )}
            {gig.isReverseAuction && (
              <span className="flex items-center text-xs font-bold text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800">
                <Gavel className="w-3 h-3 mr-1" /> Đấu giá ngược
              </span>
            )}
          </div>

          <span className="text-xs font-bold text-[#C5E5EC]/70">
            Trạng thái:{' '}
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
                ? 'Đang mở nhận việc'
                : gig.status === 'IN_PROGRESS'
                ? 'Đang thực hiện'
                : gig.status === 'SUBMITTED'
                ? 'Đã nộp bài (Chờ duyệt)'
                : gig.status === 'COMPLETED'
                ? 'Đã hoàn tất & Giải ngân'
                : gig.status}
            </span>
          </span>
        </div>

        {/* Title & Description */}
        <h1 className="text-xl font-extrabold text-white leading-snug">{gig.title}</h1>
        <p className="text-xs text-[#C5E5EC]/90 leading-relaxed whitespace-pre-line">{gig.description}</p>

        {/* Location & Metrics Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#C5E5EC]/15 text-xs">
          <div className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20">
            <span className="text-[#C5E5EC]/80 flex items-center space-x-1 mb-1">
              <MapPin className="w-3.5 h-3.5 text-[#C5E5EC]" />
              <span className="font-semibold">Địa điểm làm việc</span>
            </span>
            <p className="font-bold text-white text-xs">{gig.locationName}</p>
            <span className="text-[11px] text-[#E0FAEB] font-mono font-semibold">Cách bạn ~{gig.distanceMeters}m</span>
          </div>

          <div className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20">
            <span className="text-[#C5E5EC]/80 flex items-center space-x-1 mb-1">
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-semibold">Thời lượng ước tính</span>
            </span>
            <p className="font-bold text-white text-xs">~{gig.estimatedDurationMinutes} phút</p>
            <span className="text-[11px] text-[#C5E5EC]/60">Hoàn thành theo thỏa thuận</span>
          </div>

          <div className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20">
            <span className="text-[#C5E5EC]/80 flex items-center space-x-1 mb-1">
              <Users className="w-3.5 h-3.5 text-[#E0FAEB]" />
              <span className="font-semibold">Số người thực hiện</span>
            </span>
            <p className="font-bold text-white text-xs">
              {gig.confirmedWorkersCount || (gig.multiWorkers?.length || 0)}/{gig.totalWorkersNeeded || 1} người
            </p>
            <span className="text-[11px] text-[#C5E5EC]/60">
              {(gig.totalWorkersNeeded || 1) > 1 ? 'Kèo ghép nhóm đồng đội' : 'Đơn lẻ 1 người'}
            </span>
          </div>
        </div>

        {/* Price & Smart Escrow Vault Protection Callout */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#12233B] to-[#162C4E] border border-[#C5E5EC]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-[#C5E5EC]/70 block font-semibold">
              {gig.isReverseAuction ? 'Giá thầu thấp nhất hiện tại:' : 'Thù lao Smart Escrow:'}
            </span>
            <span className="text-2xl font-black text-[#E0FAEB]">
              {formatVnd(gig.isReverseAuction && gig.lowestBidPrice ? gig.lowestBidPrice : gig.price)}
            </span>
            <p className="text-[10px] text-[#E0FAEB] mt-0.5 flex items-center font-medium">
              <ShieldCheck className="w-3 h-3 mr-1 text-[#E0FAEB]" /> Tiền đã được khóa trong Smart Escrow Vault của GigMe
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
                  <span>🔴 Vào Đấu Giá Trực Tiếp!</span>
                </button>
              )}

              {gig.isReverseAuction ? (
                <button
                  id="open-bid-modal-btn"
                  onClick={() => {
                    if (isNewbie) {
                      onOpenVerify();
                    } else {
                      setShowBidModal(true);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] to-[#417AC6] text-white font-extrabold text-xs hover:brightness-110 shadow-md transition flex items-center space-x-1.5 border border-[#C5E5EC]/30 cursor-pointer"
                >
                  <Gavel className="w-4 h-4 text-[#E0FAEB]" />
                  <span>Đấu Giá Thầu Kèo Này</span>
                </button>
              ) : (
                <button
                  id="direct-accept-gig-btn"
                  onClick={() => {
                    if (isNewbie) {
                      onOpenVerify();
                    } else {
                      acceptGigDirectly(gig);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-extrabold text-xs hover:brightness-110 shadow-lg shadow-[#3064AE]/20 transition flex items-center space-x-1.5 border border-[#E0FAEB]/30 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#E0FAEB]" />
                  <span>Nhận Kèo Ngay</span>
                </button>
              )}
            </div>
          )}

          {gig.status !== 'OPEN' && gig.status !== 'CANCELLED' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onOpenChat}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] to-[#417AC6] text-white font-extrabold text-xs hover:brightness-110 shadow-md transition flex items-center space-x-1.5 border border-[#C5E5EC]/30 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#C5E5EC]" />
                <span>Vào Khung Chat & Nghiệm Thu &rarr;</span>
              </button>

              {/* Nút gửi ảnh bằng chứng đóng dấu GPS & Timestamp (Chống quỵt tiền) */}
              {gig.status === 'IN_PROGRESS' && currentUser?.id === gig.freelancerId && (
                <button
                  type="button"
                  onClick={() => setIsProofModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-extrabold text-xs hover:brightness-110 shadow-md transition flex items-center space-x-1.5 border border-[#E0FAEB]/30 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-[#E0FAEB]" />
                  <span>Chụp Ảnh Nghiệm Thu (Dấu GPS & Giờ)</span>
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
                    <span>Hủy Nhận Việc (Kiểm tra phạt)</span>
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
                    <span>Báo Khách Boom Kèo</span>
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
                    <span>Hủy Đơn (Phạt nếu &gt;10p)</span>
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
                    <span>Báo Thợ Bỏ Bom (No-Show)</span>
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
                <span>ĐƠN VIỆC ĐÃ BỊ HỦY BỎ</span>
                {gig.isNoShowReported && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                    Xử Phạt No-Show
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                {gig.cancellationReason || 'Đơn việc đã bị hủy theo yêu cầu.'}
              </p>
              {gig.cancellationPenaltyAmount ? (
                <p className="text-[11px] text-amber-300 font-semibold">
                  Mức phí bồi thường vi phạm đã khấu trừ: {formatVnd(gig.cancellationPenaltyAmount)}
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
                <span>🚀 Đẩy Bài & Ghim Top 1 Hỏa Tốc Trang Chủ (+10.000đ trong 2h)</span>
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
              <span>Hủy Đăng Bài (Hoàn Trả 100% Tiền Cọc Escrow)</span>
            </button>
          </div>
        )}
      </div>

      {/* PWA Offline Cache Status Badge */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 text-[11px] text-[#C5E5EC]/70">
        <div className="flex items-center space-x-2">
          <Download className="w-4 h-4 text-[#C5E5EC] shrink-0" />
          <span>Đơn việc này đã được tự động lưu bộ nhớ đệm PWA Offline. Xem được kể cả khi vào thang máy/mất sóng 4G.</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3064AE]/30 text-[#E0FAEB] border border-[#C5E5EC]/30">
          Sẵn sàng Offline
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
                  <span>Minh Chứng Nghiệm Thu (Watermark GPS & Timestamp)</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#3064AE]/40 text-[#E0FAEB] text-[10px] font-black border border-[#C5E5EC]/30">
                    Bảo vệ 100%
                  </span>
                </h3>
                <p className="text-[11px] text-[#C5E5EC]/70">
                  {gig.isWatermarkRemoved
                    ? 'Đã giải ngân Escrow thành công - Bản gốc chất lượng cao đã mở khóa'
                    : 'Bản xem trước có Watermark chống quỵt kèm tọa độ GPS & dấu thời gian'}
                </p>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-[#C5E5EC]/20 bg-[#12233B] max-h-64 flex items-center justify-center">
            <img
              src={(gig.proofWatermarkUrl || gig.proofImageUrl) || ''}
              alt="Bằng chứng công việc"
              className="w-full h-full object-cover"
            />
            {gig.proofHash && (
              <div className="absolute bottom-2 left-2 right-2 p-2 rounded-xl bg-[#0E1B2E]/90 backdrop-blur-sm border border-[#C5E5EC]/40 text-[10px] text-[#E0FAEB] font-mono flex items-center justify-between">
                <span>Hash: {gig.proofHash.slice(0, 16)}...</span>
                <span>{gig.proofTimestamp ? new Date(gig.proofTimestamp).toLocaleTimeString('vi-VN') : 'Đã ghi nhận'}</span>
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
                  <span>Đánh Giá Hai Chiều Mù (Double-Blind Review)</span>
                  {gig.isDoubleBlindRevealed ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#E0FAEB]/20 text-[#E0FAEB] text-[10px] font-black border border-[#E0FAEB]/40">
                      Đã Công Khai
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-[#3064AE]/30 text-[#C5E5EC] text-[10px] font-black border border-[#C5E5EC]/30">
                      Bảo Mật Hai Chiều
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-[#C5E5EC]/70">
                  {gig.isDoubleBlindRevealed
                    ? 'Cả hai bên đã đánh giá - Toàn bộ nhận xét và số sao đã được công khai minh bạch!'
                    : 'Chống trả thù đánh giá xấu: Chỉ mở khóa khi cả người thuê và người làm đều hoàn tất đánh giá.'}
                </p>
              </div>
            </div>
          </div>

          {/* Trạng thái đánh giá từng bên */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#C5E5EC]/80 font-bold">Khách hàng ({gig.clientName}):</span>
                {gig.clientRatedAt ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#E0FAEB]/20 text-[#E0FAEB] font-black text-[10px]">
                    ✅ Đã gửi
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                    ⏳ Chưa gửi
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
                  {gig.clientRatedAt ? '🔒 Đã niêm phong kín' : 'Chưa gửi đánh giá'}
                </p>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#C5E5EC]/80 font-bold">Thợ ({gig.freelancerName || 'Người Làm'}):</span>
                {gig.freelancerRatedAt ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#E0FAEB]/20 text-[#E0FAEB] font-black text-[10px]">
                    ✅ Đã gửi
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                    ⏳ Chưa gửi
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
                  {gig.freelancerRatedAt ? '🔒 Đã niêm phong kín' : 'Chưa gửi đánh giá'}
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
                  ? gig.clientRatedAt ? 'Chỉnh Sửa Đánh Giá Của Bạn (Đang Niêm Phong)' : 'Gửi Đánh Giá Người Làm (Bảo Mật Hai Chiều)'
                  : gig.freelancerRatedAt ? 'Chỉnh Sửa Đánh Giá Của Bạn (Đang Niêm Phong)' : 'Gửi Đánh Giá Khách Hàng (Bảo Mật Hai Chiều)'}
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
                    Phòng Đấu Giá Ngược Trực Tiếp (Live Reverse Bidding)
                  </h3>
                  {gig.auctionRoomOpen ? (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-black border border-red-500/40 animate-pulse">
                      🔴 ĐANG MỞ
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-[#12233B] text-[#C5E5EC]/60 text-[10px] font-bold border border-[#C5E5EC]/20">
                      Chưa mở phòng
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#C5E5EC]/80 mt-0.5">
                  {isOwner
                    ? 'Chỉ bạn có quyền tạo và mở phòng đấu giá ngược. Freelancer sẽ cùng vào phòng đặt giá giảm dần trực tiếp.'
                    : gig.auctionRoomOpen
                    ? 'Chủ việc đã mở phòng đấu giá! Bạn có thể vào ngay để hạ giá và giành quyền nhận việc.'
                    : 'Phòng đấu giá trực tiếp chỉ có thể do chủ việc khởi tạo và mở phòng.'}
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
                    ? 'Quản Lý Phòng Đang Mở'
                    : 'Mở Phòng Đấu Giá Ngay'
                  : gig.auctionRoomOpen
                  ? 'Vào Phòng Đấu Giá'
                  : 'Xem Trạng Thái Phòng'}
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
                    Đơn Việc Nhóm & Điểm Danh QR Hiện Trường
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#E0FAEB]/20 text-[#E0FAEB] text-[10px] font-bold border border-[#E0FAEB]/30">
                    {gig.multiWorkers?.length || 0}/{gig.totalWorkersNeeded || 2} Trợ Thủ
                  </span>
                </div>
                <p className="text-[11px] text-[#C5E5EC]/80 mt-0.5">
                  {isOwner
                    ? 'Quản lý danh sách trợ thủ, xuất mã QR điểm danh hiện trường và giải ngân tự động chia đều thù lao.'
                    : 'Đăng ký tham gia ca làm việc nhóm và quét mã QR của chủ việc để điểm danh nhận tiền.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsMultiWorkerOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] hover:brightness-110 text-white font-black text-xs shadow-lg shadow-[#3064AE]/20 transition flex items-center space-x-1.5 shrink-0 border border-[#E0FAEB]/30 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isOwner ? 'Bảng Điểm Danh & Mã QR' : 'Tham Gia & Điểm Danh QR'}</span>
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
                {USER_TIERS[gig.clientTier]?.badgeText || 'Đã KYC'}
              </span>
            </div>
            <p className="text-[11px] text-[#C5E5EC]/70">Người đăng việc • Đã chi tiêu hơn 2.400.000đ</p>
          </div>
        </div>

        <button
          onClick={handleStartVoip}
          className="p-2.5 rounded-xl bg-[#12233B] hover:bg-[#162C4E] text-[#C5E5EC] border border-[#C5E5EC]/25 transition cursor-pointer"
          title="Gọi thoại VoIP ẩn danh"
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
              <span>Các Đề Xuất Đấu Giá Thầu ({currentGigBids.length})</span>
            </h3>
            <span className="text-[10px] text-[#C5E5EC]/70">Ai ra giá & thời gian tốt nhất sẽ được chọn</span>
          </div>

          {currentGigBids.length === 0 ? (
            <p className="text-[#C5E5EC]/60 py-3 text-center">Chưa có ai đấu giá kèo này. Hãy là người đầu tiên!</p>
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
                    <span className="text-[10px] text-[#C5E5EC]/70">~{b.estimatedMinutes} phút</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reverse Auction Bid Submission Modal */}
      {showBidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/30 p-6 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#3064AE] via-[#C5E5EC] to-[#E0FAEB]" />
            <div className="flex justify-between items-center pb-3 border-b border-[#C5E5EC]/20">
              <h3 className="font-extrabold text-sm flex items-center space-x-1.5 text-[#E0FAEB]">
                <Gavel className="w-4 h-4 text-[#C5E5EC]" />
                <span>Đấu Giá Ngược Kèo Này</span>
              </h3>
              <button onClick={() => setShowBidModal(false)} className="text-[#C5E5EC]/60 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceBidSubmit} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">Mức giá đề xuất của bạn (VND)</label>
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
                <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">Thời gian bạn cam kết hoàn thành (Phút)</label>
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
                <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">Ghi chú đề xuất / Điểm mạnh của bạn</label>
                <textarea
                  rows={2}
                  required
                  value={bidNote}
                  onChange={(e) => setBidNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/30 text-white focus:outline-none focus:border-[#C5E5EC]"
                  placeholder="Tôi có kinh nghiệm, hoàn thành trong 20 phút..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-extrabold text-sm hover:brightness-110 shadow-lg shadow-[#3064AE]/20 transition cursor-pointer border border-[#E0FAEB]/30"
              >
                Gửi Đề Xuất Đấu Giá
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
