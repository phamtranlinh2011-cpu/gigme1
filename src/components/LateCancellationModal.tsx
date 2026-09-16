// Hủy Việc Có Phạt Trễ Hạn (Late Cancellation Protection Modal)
// Nhận việc < 10 phút hủy miễn phí. Sau 10 phút phạt trừ 5 điểm Trust Score & 20.000đ bồi thường cho khách
import React, { useState } from 'react';
import { AlertTriangle, Clock, ShieldAlert, X, CheckCircle2 } from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { GigEntity, formatVnd } from '../types';

interface LateCancellationModalProps {
  isOpen: boolean;
  gig: GigEntity;
  onClose: () => void;
}

export const LateCancellationModal: React.FC<LateCancellationModalProps> = ({
  isOpen,
  gig,
  onClose,
}) => {
  const { cancelGigByWorker } = useGigMe();
  const [reason, setReason] = useState('Bận việc đột xuất không thể tới địa điểm');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const acceptedTime = gig.acceptedAt || gig.createdAt || Date.now();
  const elapsedMinutes = Math.max(1, Math.round((Date.now() - acceptedTime) / (1000 * 60)));
  const isLate = elapsedMinutes > 10;
  const penaltyAmount = isLate
    ? Math.min(Math.max(20000, Math.round(gig.price * 0.1)), 50000)
    : 0;

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const finalReason = customReason.trim() ? customReason : reason;
    cancelGigByWorker(gig.id, finalReason);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-[#0F172A] border-2 border-red-500/40 p-5 sm:p-6 text-white shadow-[0_0_50px_rgba(239,68,68,0.25)] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-base text-white">Xác Nhận Hủy Nhận Việc</h3>
            <p className="text-xs text-slate-400">Đơn việc: {gig.title}</p>
          </div>
        </div>

        {/* Elapsed Time & Policy Check */}
        <div className="mt-4 p-4 rounded-2xl bg-[#131E30] border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center">
              <Clock className="w-4 h-4 mr-1.5 text-cyan-400" />
              Thời gian đã trôi qua:
            </span>
            <span className="font-mono font-bold text-white text-sm">
              {elapsedMinutes} phút
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Giới hạn hủy miễn phí:</span>
            <span className="font-bold text-emerald-400">10 phút đầu</span>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            {isLate ? (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 space-y-1.5">
                <div className="flex items-center space-x-1.5 font-black text-xs text-red-200">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>CẢNH BÁO: HỦY ĐƠN TRỄ HẠN (>10 PHÚT)</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Bạn đã giữ đơn quá 10 phút, làm lỡ dở thời gian của khách hàng. Theo quy định nền tảng:
                </p>
                <ul className="text-[11px] list-disc list-inside font-semibold text-red-300 space-y-0.5">
                  <li>Trừ <strong className="text-white">-5 điểm</strong> Trust Score uy tín</li>
                  <li>Phạt <strong className="text-yellow-300">{formatVnd(penaltyAmount)}</strong> từ ví thợ bồi thường vào ví khách</li>
                </ul>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px]">
                  <strong>Hủy trong hạn (Dưới 10 phút):</strong> Bạn được miễn phạt hoàn toàn và không bị trừ điểm uy tín Trust Score.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Reason Form */}
        <form onSubmit={handleCancelSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-semibold">Lý do hủy nhận việc:</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white"
            >
              <option value="Bận việc đột xuất không thể tới địa điểm">Bận việc đột xuất không thể tới địa điểm</option>
              <option value="Xe bị hỏng hóc hoặc sự cố dọc đường">Xe bị hỏng hóc hoặc sự cố dọc đường</option>
              <option value="Không liên lạc được với người thuê">Không liên lạc được với người thuê</option>
              <option value="Khoảng cách thực tế xa hơn dự kiến">Khoảng cách thực tế xa hơn dự kiến</option>
              <option value="Lý do khác">Lý do khác</option>
            </select>
          </div>

          {reason === 'Lý do khác' && (
            <div>
              <input
                type="text"
                required
                placeholder="Nhập lý do cụ thể..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white"
              />
            </div>
          )}

          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
            >
              Giữ Lại Đơn
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2.5 rounded-xl font-black transition shadow-lg ${
                isLate
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/30'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/30'
              }`}
            >
              {isLate ? `Chấp Nhận Phạt & Hủy` : `Xác Nhận Hủy`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
