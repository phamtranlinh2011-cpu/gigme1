import React, { useState, useEffect } from 'react';
import {
  Gavel,
  X,
  Clock,
  TrendingDown,
  ShieldCheck,
  Award,
  Zap,
  Check,
  AlertTriangle,
  Play,
  StopCircle,
  Sparkles,
  ArrowDownRight,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { GigEntity, BidEntity } from '../types';
import { useGigMe } from '../context/GigMeContext';

interface LiveReverseBiddingModalProps {
  isOpen: boolean;
  gig: GigEntity;
  onClose: () => void;
}

export const LiveReverseBiddingModal: React.FC<LiveReverseBiddingModalProps> = ({
  isOpen,
  gig,
  onClose,
}) => {
  const {
    currentUser,
    currentGigBids,
    placeBid,
    openReverseAuctionRoom,
    closeReverseAuctionRoom,
    showNotification,
  } = useGigMe();

  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [ceilingPrice, setCeilingPrice] = useState<number>(gig.price);
  const [customBidAmount, setCustomBidAmount] = useState<number>(0);
  const [proposalMinutes, setProposalMinutes] = useState<number>(30);
  const [proposalNote, setProposalNote] = useState<string>('');
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(900);

  const isOwner = currentUser?.id === gig.clientId;
  const isRoomOpen = !!gig.auctionRoomOpen;

  // Lọc danh sách thầu cho đơn này và sắp xếp giá thấp nhất lên đầu
  const sortedBids = [...currentGigBids].sort((a, b) => a.offeredPrice - b.offeredPrice);
  const lowestCurrentPrice = sortedBids.length > 0 ? sortedBids[0].offeredPrice : (gig.lowestBidPrice || gig.price);
  const bestBid = sortedBids.length > 0 ? sortedBids[0] : null;

  // Đếm ngược thời gian phòng đấu giá
  useEffect(() => {
    if (!isRoomOpen) return;
    const duration = (gig.auctionRoomDurationMinutes || 15) * 60;
    const elapsed = Math.floor((Date.now() - (gig.auctionRoomCreatedAt || Date.now())) / 1000);
    const remaining = Math.max(0, duration - elapsed);
    setTimeLeftSeconds(remaining);

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRoomOpen, gig.auctionRoomCreatedAt, gig.auctionRoomDurationMinutes]);

  useEffect(() => {
    if (lowestCurrentPrice > 5000) {
      setCustomBidAmount(lowestCurrentPrice - 5000);
    } else {
      setCustomBidAmount(lowestCurrentPrice);
    }
  }, [lowestCurrentPrice]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartAuction = () => {
    if (!isOwner) {
      showNotification('Từ chối thao tác', 'Chỉ người thuê mới có quyền mở phòng đấu giá!');
      return;
    }
    openReverseAuctionRoom(gig.id, durationMinutes, ceilingPrice);
  };

  const handlePlaceBid = () => {
    if (!currentUser) return;
    if (isOwner) {
      showNotification('Không hợp lệ', 'Bạn là chủ đơn nên không thể tự đặt giá thầu!');
      return;
    }
    if (customBidAmount >= lowestCurrentPrice) {
      showNotification(
        'Giá chưa hợp lệ',
        `Trong đấu giá ngược, mức giá của bạn phải thấp hơn giá hiện tại (${lowestCurrentPrice.toLocaleString()}đ)!`
      );
      return;
    }
    if (customBidAmount < 10000) {
      showNotification('Giá quá thấp', 'Mức giá tối thiểu của một công việc là 10.000đ.');
      return;
    }

    placeBid(
      gig.id,
      customBidAmount,
      proposalMinutes,
      proposalNote || `Chào giá ${customBidAmount.toLocaleString()}đ cam kết làm nhanh trong ${proposalMinutes} phút`
    );
    setProposalNote('');
  };

  const handleSelectWinner = (bid: BidEntity) => {
    if (!isOwner) return;
    closeReverseAuctionRoom(gig.id, bid.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-500/30 overflow-hidden my-6">
        {/* Header Phòng Đấu Giá */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md border border-white/20">
                <Gavel className="w-6 h-6 text-yellow-300 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold">Phòng Đấu Giá Ngược Thời Gian Thực</h2>
                  {isRoomOpen ? (
                    <span className="flex items-center space-x-1 px-2.5 py-0.5 text-xs font-black bg-red-500 text-white rounded-full animate-pulse shadow">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      <span>LIVE</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-white/20 text-white rounded-full">
                      CHƯA KÍCH HOẠT
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-100 mt-0.5">
                  Freelancer trả giá giảm dần • Người thuê chọn mức giá tốt nhất để tiết kiệm chi phí
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Thông tin đơn đang đấu giá */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {gig.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {gig.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {gig.description}
                </p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <span className="text-[11px] text-slate-400 block">Ngân sách gốc:</span>
                <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200 line-through">
                  {gig.price.toLocaleString()}đ
                </span>
              </div>
            </div>
          </div>

          {/* TRƯỜNG HỢP 1: PHÒNG CHƯA MỞ */}
          {!isRoomOpen && (
            <div className="space-y-4">
              {isOwner ? (
                /* GIAO DIỆN DÀNH CHO NGƯỜI THUÊ ĐỂ MỞ PHÒNG */
                <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/20 border-2 border-dashed border-amber-300 dark:border-amber-800 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 mx-auto flex items-center justify-center">
                    <Play className="w-6 h-6 ml-0.5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Bạn là Người Thuê: Hãy Mở Phòng Đấu Giá Ngược!
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-1">
                      Khi mở phòng, các Freelancer sẽ cạnh tranh giảm giá để nhận việc. Phần tiền chênh lệch tiết kiệm được sẽ được hoàn trả thẳng vào ví của bạn ngay sau khi chốt!
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-left">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Thời gian mở phòng:
                      </label>
                      <select
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                      >
                        <option value={10}>10 Phút (Siêu Tốc)</option>
                        <option value={15}>15 Phút (Chuẩn)</option>
                        <option value={30}>30 Phút (Thư Thả)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Giá trần xuất phát:
                      </label>
                      <input
                        type="number"
                        value={ceilingPrice}
                        onChange={(e) => setCeilingPrice(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleStartAuction}
                    className="w-full max-w-md mx-auto py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/30 flex items-center justify-center space-x-2 transition-transform active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Kích Hoạt Phòng Đấu Giá Ngay ({durationMinutes} Phút)</span>
                  </button>
                </div>
              ) : (
                /* GIAO DIỆN DÀNH CHO FREELANCER KHI CHỦ VIỆC CHƯA MỞ PHÒNG (Đúng yêu cầu: k có quyền tự tạo phòng) */
                <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-500 mx-auto flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Chủ Việc Chưa Mở Phòng Đấu Giá Ngược
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Theo quy chế của GigMe, <strong className="text-amber-600 dark:text-amber-400">chỉ người thuê (Client)</strong> mới có quyền quyết định mở phòng đấu giá ngược trực tiếp. Freelancer không thể tự tạo phòng.
                  </p>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-xs text-slate-600 dark:text-slate-300">
                    💡 Bạn có thể nhận đơn trực tiếp với mức thù lao gốc{' '}
                    <strong className="text-emerald-600 font-bold">{gig.price.toLocaleString()}đ</strong>{' '}
                    ở màn hình chi tiết hoặc chờ chủ việc kích hoạt phòng đấu giá.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TRƯỜNG HỢP 2: PHÒNG ĐANG MỞ (LIVE RUNNING) */}
          {isRoomOpen && (
            <div className="space-y-5 animate-fadeIn">
              {/* Thanh đếm ngược và giá tốt nhất */}
              <div className="grid grid-cols-2 gap-3">
                {/* Đồng hồ đếm ngược */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 to-amber-500/10 border border-rose-500/30 flex items-center space-x-3">
                  <div className="p-3 bg-rose-500/20 text-rose-600 rounded-2xl">
                    <Clock className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                      Thời gian còn lại:
                    </span>
                    <div className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                      {formatTime(timeLeftSeconds)}
                    </div>
                  </div>
                </div>

                {/* Giá thấp nhất hiện tại */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 flex items-center space-x-3">
                  <div className="p-3 bg-emerald-500/20 text-emerald-600 rounded-2xl">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                      Giá thấp nhất hiện tại:
                    </span>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                      {lowestCurrentPrice.toLocaleString()}đ
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông báo tiết kiệm cho Người thuê */}
              {isOwner && gig.price > lowestCurrentPrice && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between text-xs">
                  <span className="text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5 font-semibold">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>
                      Bạn đang tiết kiệm được{' '}
                      <strong className="font-black text-emerald-600 dark:text-emerald-400">
                        {(gig.price - lowestCurrentPrice).toLocaleString()}đ
                      </strong>{' '}
                      từ phòng đấu giá ngược!
                    </span>
                  </span>
                </div>
              )}

              {/* Form đặt giá dành cho Freelancer */}
              {!isOwner && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-amber-300 dark:border-amber-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>Đưa Ra Mức Giá Cạnh Tranh Của Bạn:</span>
                    </span>
                    <span className="text-xs text-slate-400">
                      Phải nhỏ hơn {lowestCurrentPrice.toLocaleString()}đ
                    </span>
                  </div>

                  {/* Nút bấm giảm nhanh */}
                  <div className="flex items-center space-x-2">
                    {[5000, 10000, 15000].map((step) => {
                      const suggestedVal = Math.max(10000, lowestCurrentPrice - step);
                      return (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setCustomBidAmount(suggestedVal)}
                          className="flex-1 py-1.5 px-2 bg-white dark:bg-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-400 transition-colors"
                        >
                          -{step.toLocaleString()}đ ({suggestedVal.toLocaleString()}đ)
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Mức giá bạn nhận (VNĐ):</label>
                      <input
                        type="number"
                        value={customBidAmount}
                        onChange={(e) => setCustomBidAmount(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-black text-amber-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Thời gian cam kết (Phút):</label>
                      <input
                        type="number"
                        value={proposalMinutes}
                        onChange={(e) => setProposalMinutes(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={proposalNote}
                    onChange={(e) => setProposalNote(e.target.value)}
                    placeholder="Ghi chú kinh nghiệm hoặc cam kết giao bài..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                  />

                  <button
                    onClick={handlePlaceBid}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition-transform active:scale-98"
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Gửi Mức Giá Thầu: {customBidAmount.toLocaleString()}đ</span>
                  </button>
                </div>
              )}

              {/* Danh sách các đề xuất đang cạnh tranh */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Diễn biến đặt giá ({sortedBids.length} lượt thầu):
                  </span>
                  <span className="text-[11px] text-slate-400">Sắp xếp: Giá thấp nhất ở trên</span>
                </div>

                {sortedBids.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-400">
                      Chưa có lượt đặt giá nào. Hãy là người đầu tiên đưa ra mức giá tốt nhất!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {sortedBids.map((bid, index) => {
                      const isBest = index === 0;
                      return (
                        <div
                          key={bid.id}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                            isBest
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700 ring-2 ring-emerald-500/20 shadow-sm'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/60'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                                isBest
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              #{index + 1}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {bid.freelancerName}
                                </span>
                                {isBest && (
                                  <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded">
                                    TOP 1 GIÁ TỐT
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Cam kết {bid.estimatedMinutes} phút • {bid.proposalNote}
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex items-center space-x-3">
                            <div>
                              <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                {bid.offeredPrice.toLocaleString()}đ
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Tiết kiệm {(gig.price - bid.offeredPrice).toLocaleString()}đ
                              </span>
                            </div>

                            {/* Nút chốt thầu dành cho Client */}
                            {isOwner && (
                              <button
                                onClick={() => handleSelectWinner(bid)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-transform active:scale-95 flex items-center space-x-1"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Chốt Kèo Này</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            🔒 Được bảo chứng bởi GigMe Smart Escrow
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
