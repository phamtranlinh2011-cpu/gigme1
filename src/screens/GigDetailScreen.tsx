import React, { useState } from 'react';
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
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { formatVnd, USER_TIERS } from '../types';
import { LiveReverseBiddingModal } from '../components/LiveReverseBiddingModal';
import { MultiWorkerCheckInModal } from '../components/MultiWorkerCheckInModal';

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

  // Reverse auction bid modal
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidPrice, setBidPrice] = useState(gig ? gig.price - 5000 : 50000);
  const [bidMinutes, setBidMinutes] = useState(30);
  const [bidNote, setBidNote] = useState('Mình cam kết hoàn thành đúng hạn và chất lượng tốt nhất!');

  // New feature modals
  const [isLiveAuctionOpen, setIsLiveAuctionOpen] = useState(false);
  const [isMultiWorkerOpen, setIsMultiWorkerOpen] = useState(false);

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
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28 text-white space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Masked VoIP encrypted call button */}
          <button
            onClick={handleStartVoip}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-[#00E5FF]/40 text-[#00E5FF] text-xs font-bold hover:bg-cyan-500/25 transition shadow-[0_0_10px_rgba(0,229,255,0.2)]"
            title="Gọi thoại mã hóa che số điện thoại"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Gọi Ẩn Danh</span>
          </button>

          {/* Go to Chat button */}
          <button
            onClick={onOpenChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#131E30] hover:bg-[#1A2840] border border-slate-700 text-slate-200 text-xs font-bold transition"
          >
            <MessageSquare className="w-3.5 h-3.5" />
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
      <div className="rounded-3xl bg-[#0F172A] border border-[#1E293B] p-6 shadow-2xl space-y-4">
        {/* Badges row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            {gig.isFlash && (
              <span className="flex items-center text-xs font-black text-black bg-[#FF6B00] px-2.5 py-1 rounded-lg shadow-sm">
                <Zap className="w-3.5 h-3.5 mr-1 fill-current" /> HỎA TỐC
              </span>
            )}
            <span className="text-xs font-bold text-slate-300 bg-[#1A263B] px-2.5 py-1 rounded-lg border border-slate-700">
              {gig.category}
            </span>
            {gig.isRecurringWeekly && (
              <span className="flex items-center text-xs font-bold text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800">
                <Repeat className="w-3 h-3 mr-1" /> Kèo định kỳ tuần
              </span>
            )}
            {gig.isReverseAuction && (
              <span className="flex items-center text-xs font-bold text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800">
                <Gavel className="w-3 h-3 mr-1" /> Đấu giá ngược
              </span>
            )}
          </div>

          <span className="text-xs font-bold text-slate-400">
            Trạng thái:{' '}
            <span
              className={`font-black ${
                gig.status === 'COMPLETED'
                  ? 'text-emerald-400'
                  : gig.status === 'SUBMITTED'
                  ? 'text-yellow-400'
                  : gig.status === 'DISPUTED'
                  ? 'text-red-400'
                  : 'text-[#00E5FF]'
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
        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{gig.description}</p>

        {/* Location & Metrics Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-[#131E30] border border-slate-800/80">
            <span className="text-slate-400 flex items-center space-x-1 mb-1">
              <MapPin className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span className="font-semibold">Địa điểm làm việc</span>
            </span>
            <p className="font-bold text-white text-xs">{gig.locationName}</p>
            <span className="text-[11px] text-cyan-400 font-mono font-semibold">Cách bạn ~{gig.distanceMeters}m</span>
          </div>

          <div className="p-3 rounded-xl bg-[#131E30] border border-slate-800/80">
            <span className="text-slate-400 flex items-center space-x-1 mb-1">
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-semibold">Thời lượng ước tính</span>
            </span>
            <p className="font-bold text-white text-xs">~{gig.estimatedDurationMinutes} phút</p>
            <span className="text-[11px] text-slate-400">Hoàn thành theo thỏa thuận</span>
          </div>

          <div className="p-3 rounded-xl bg-[#131E30] border border-slate-800/80">
            <span className="text-slate-400 flex items-center space-x-1 mb-1">
              <Users className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-semibold">Số người thực hiện</span>
            </span>
            <p className="font-bold text-white text-xs">
              {gig.confirmedWorkersCount || (gig.multiWorkers?.length || 0)}/{gig.totalWorkersNeeded || 1} người
            </p>
            <span className="text-[11px] text-slate-400">
              {(gig.totalWorkersNeeded || 1) > 1 ? 'Kèo ghép nhóm đồng đội' : 'Đơn lẻ 1 người'}
            </span>
          </div>
        </div>

        {/* Price & Smart Escrow Vault Protection Callout */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0F1E33] to-[#121B2A] border border-[#00E5FF]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-slate-400 block font-semibold">
              {gig.isReverseAuction ? 'Giá thầu thấp nhất hiện tại:' : 'Thù lao Smart Escrow:'}
            </span>
            <span className="text-2xl font-black text-[#00E5FF]">
              {formatVnd(gig.isReverseAuction && gig.lowestBidPrice ? gig.lowestBidPrice : gig.price)}
            </span>
            <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1" /> Tiền đã được khóa trong Smart Escrow Vault của GigMe
            </p>
          </div>

          {/* Action buttons */}
          {!isOwner && gig.status === 'OPEN' && (
            <div>
              {roleMode === 'CLIENT' ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent border border-amber-500/40 text-xs">
                  <div>
                    <span className="font-extrabold text-white block">
                      🚫 Bạn đang ở chế độ Người Thuê (Không thể nhận làm việc)
                    </span>
                    <span className="text-amber-200/80 text-[11px] mt-0.5 block">
                      Khi chọn Thuê thì không thể Làm. Chuyển sang chế độ Người Làm để nhận kèo hoặc đấu giá.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleRoleMode}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-amber-400 text-black font-extrabold text-xs hover:brightness-110 shrink-0 shadow-md transition"
                  >
                    Chuyển sang Người Làm &rarr;
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {/* Nếu phòng đấu giá trực tiếp đang mở, ưu tiên nút vào phòng */}
                  {gig.auctionRoomOpen && (
                    <button
                      onClick={() => setIsLiveAuctionOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white font-black text-xs hover:brightness-110 shadow-lg shadow-red-500/30 transition flex items-center space-x-1.5 animate-bounce"
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
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-cyan-500 text-black font-extrabold text-xs hover:brightness-110 shadow-lg shadow-cyan-500/20 transition flex items-center space-x-1.5"
                    >
                      <Gavel className="w-4 h-4" />
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
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#00E5FF] text-black font-extrabold text-xs hover:brightness-110 shadow-lg shadow-emerald-500/20 transition flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Nhận Kèo Ngay</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {gig.status !== 'OPEN' && (
            <button
              onClick={onOpenChat}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-blue-500 text-black font-extrabold text-xs hover:brightness-110 shadow-md transition flex items-center space-x-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Vào Khung Chat & Nghiệm Thu &rarr;</span>
            </button>
          )}
        </div>

        {/* Nút Boost dành cho chủ đơn nếu bài chưa được ghim */}
        {isOwner && !isCurrentlyBoosted && gig.status === 'OPEN' && (
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => boostGig(gig.id)}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-lg shadow-red-500/20 flex items-center justify-center space-x-2 transition-all active:scale-98"
            >
              <Rocket className="w-4 h-4 text-yellow-300" />
              <span>🚀 Đẩy Bài & Ghim Top 1 Hỏa Tốc Trang Chủ (+10.000đ trong 2h)</span>
            </button>
          </div>
        )}
      </div>

      {/* KHỐI TÍNH NĂNG 1: ĐẤU GIÁ NGƯỢC THỜI GIAN THỰC (LIVE REVERSE BIDDING ROOM) */}
      {(gig.isReverseAuction || gig.auctionRoomOpen || isOwner) && (
        <div className="rounded-3xl bg-[#0F172A] border border-amber-500/30 p-5 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                <Radio className={`w-6 h-6 ${gig.auctionRoomOpen ? 'animate-pulse text-red-500' : ''}`} />
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
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                      Chưa mở phòng
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
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
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-lg transition flex items-center space-x-1.5 shrink-0 ${
                gig.auctionRoomOpen
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white hover:brightness-110'
                  : isOwner
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
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
        <div className="rounded-3xl bg-[#0F172A] border border-teal-500/40 p-5 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-sm text-white">
                    Đơn Việc Nhóm & Điểm Danh QR Hiện Trường
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-500/40">
                    {gig.multiWorkers?.length || 0}/{gig.totalWorkersNeeded || 2} Trợ Thủ
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {isOwner
                    ? 'Quản lý danh sách trợ thủ, xuất mã QR điểm danh hiện trường và giải ngân tự động chia đều thù lao.'
                    : 'Đăng ký tham gia ca làm việc nhóm và quét mã QR của chủ việc để điểm danh nhận tiền.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsMultiWorkerOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 transition flex items-center space-x-1.5 shrink-0"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isOwner ? 'Bảng Điểm Danh & Mã QR' : 'Tham Gia & Điểm Danh QR'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Client Profile Card */}
      <div className="rounded-3xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-xl text-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white text-base shadow">
            {gig.clientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="font-extrabold text-white text-sm">{gig.clientName}</h4>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                {USER_TIERS[gig.clientTier]?.badgeText || 'Đã KYC'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Người đăng việc • Đã chi tiêu hơn 2.400.000đ</p>
          </div>
        </div>

        <button
          onClick={handleStartVoip}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition"
          title="Gọi thoại VoIP ẩn danh"
        >
          <PhoneCall className="w-4 h-4" />
        </button>
      </div>

      {/* Reverse Auction Bids List (if any) */}
      {gig.isReverseAuction && (
        <div className="rounded-3xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-xl space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white flex items-center space-x-1.5">
              <Gavel className="w-4 h-4 text-[#00E5FF]" />
              <span>Các Đề Xuất Đấu Giá Thầu ({currentGigBids.length})</span>
            </h3>
            <span className="text-[10px] text-slate-400">Ai ra giá & thời gian tốt nhất sẽ được chọn</span>
          </div>

          {currentGigBids.length === 0 ? (
            <p className="text-slate-500 py-3 text-center">Chưa có ai đấu giá kèo này. Hãy là người đầu tiên!</p>
          ) : (
            <div className="space-y-2">
              {currentGigBids.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-2xl bg-[#131E30] border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{b.freelancerName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 font-bold">
                        {b.freelancerTier}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">&quot;{b.proposalNote}&quot;</p>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-black text-[#00E5FF] text-sm block">
                      {formatVnd(b.offeredPrice)}
                    </span>
                    <span className="text-[10px] text-slate-400">~{b.estimatedMinutes} phút</span>
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
          <div className="w-full max-w-md rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 text-white shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm flex items-center space-x-1.5 text-[#00E5FF]">
                <Gavel className="w-4 h-4" />
                <span>Đấu Giá Ngược Kèo Này</span>
              </h3>
              <button onClick={() => setShowBidModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceBidSubmit} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Mức giá đề xuất của bạn (VND)</label>
                <input
                  type="number"
                  step="5000"
                  required
                  value={bidPrice}
                  onChange={(e) => setBidPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-[#00E5FF] font-mono text-base font-bold"
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Thời gian bạn cam kết hoàn thành (Phút)</label>
                <input
                  type="number"
                  required
                  value={bidMinutes}
                  onChange={(e) => setBidMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white font-mono"
                  placeholder="30"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Ghi chú đề xuất / Điểm mạnh của bạn</label>
                <textarea
                  rows={2}
                  required
                  value={bidNote}
                  onChange={(e) => setBidNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white"
                  placeholder="Tôi có kinh nghiệm, hoàn thành trong 20 phút..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-cyan-500 text-black font-extrabold text-sm hover:brightness-110 shadow-lg shadow-cyan-500/20 transition"
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
    </div>
  );
};
