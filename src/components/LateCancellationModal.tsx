// Hủy Việc Có Phạt Trễ Hạn & Trung Tâm Kỷ Luật (Late Cancellation & Penalty Protection Modal)
// Nhận việc < 10 phút hủy miễn phí. Sau 10 phút phạt trừ 5 điểm Trust Score & bồi thường công di chuyển
import React, { useState } from 'react';
import { AlertTriangle, Clock, ShieldAlert, X, CheckCircle2, UserX, ShieldCheck, DollarSign } from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { GigEntity, formatVnd } from '../types';

export type CancellationModalMode =
  | 'WORKER_CANCEL'
  | 'CLIENT_CANCEL'
  | 'NO_SHOW_REPORT'
  | 'WORKER_NO_SHOW_REPORT';

interface LateCancellationModalProps {
  isOpen: boolean;
  gig: GigEntity;
  mode?: CancellationModalMode;
  onClose: () => void;
}

export const LateCancellationModal: React.FC<LateCancellationModalProps> = ({
  isOpen,
  gig,
  mode,
  onClose,
}) => {
  const { currentUser, cancelGigByWorker, cancelGigByClient, reportNoShow } = useGigMe();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tự động xác định chế độ nếu không truyền vào
  const activeMode: CancellationModalMode =
    mode ||
    (currentUser?.id === gig.clientId ? 'CLIENT_CANCEL' : 'WORKER_CANCEL');

  // Khởi tạo lý do theo mode
  const getDefaultReason = (m: CancellationModalMode) => {
    switch (m) {
      case 'CLIENT_CANCEL':
        return gig.status === 'OPEN'
          ? 'Thay đổi kế hoạch, không cần hỗ trợ nữa'
          : 'Có việc bận đột xuất, không thể tiếp tục công việc';
      case 'NO_SHOW_REPORT':
        return 'Thợ không đến điểm hẹn và không liên lạc được qua điện thoại';
      case 'WORKER_NO_SHOW_REPORT':
        return 'Đã đến đúng địa điểm hẹn nhưng gọi khách nhiều lần không nhấc máy';
      case 'WORKER_CANCEL':
      default:
        return 'Bận việc đột xuất không thể tới địa điểm';
    }
  };

  const [reason, setReason] = useState(() => getDefaultReason(activeMode));
  const [customReason, setCustomReason] = useState('');

  if (!isOpen) return null;

  const acceptedTime = gig.acceptedAt || gig.createdAt || Date.now();
  const elapsedMinutes = Math.max(1, Math.round((Date.now() - acceptedTime) / (1000 * 60)));
  const isLate = elapsedMinutes > 10;
  const isGigOpen = gig.status === 'OPEN';

  // Số tiền phạt bồi thường
  const penaltyAmount = isLate
    ? Math.min(Math.max(20000, Math.round(gig.price * 0.1)), 50000)
    : 0;

  const noShowPenaltyWorker = Math.min(30000, Math.round(gig.price * 0.15));
  const noShowCompWorker = Math.max(30000, Math.round(gig.price * 0.5));

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const finalReason = customReason.trim() ? customReason : reason;

    if (activeMode === 'CLIENT_CANCEL') {
      cancelGigByClient(gig.id, finalReason);
    } else if (activeMode === 'NO_SHOW_REPORT') {
      reportNoShow(gig.id, 'CLIENT', finalReason);
    } else if (activeMode === 'WORKER_NO_SHOW_REPORT') {
      reportNoShow(gig.id, 'WORKER', finalReason);
    } else {
      cancelGigByWorker(gig.id, finalReason);
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-[#0F172A] border-2 border-red-500/40 p-5 sm:p-6 text-white shadow-[0_0_50px_rgba(239,68,68,0.25)] relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
          <div className={`p-3 rounded-2xl border ${
            activeMode === 'NO_SHOW_REPORT' || activeMode === 'WORKER_NO_SHOW_REPORT'
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
              : 'bg-red-500/20 text-red-400 border-red-500/30'
          }`}>
            {activeMode === 'NO_SHOW_REPORT' || activeMode === 'WORKER_NO_SHOW_REPORT' ? (
              <UserX className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="font-black text-base text-white">
              {activeMode === 'CLIENT_CANCEL'
                ? isGigOpen
                  ? 'Hủy Đăng Bài & Hoàn Tiền'
                  : 'Hủy Đơn Đang Thực Hiện'
                : activeMode === 'NO_SHOW_REPORT'
                ? 'Báo Cáo Thợ Bỏ Kèo (No-Show)'
                : activeMode === 'WORKER_NO_SHOW_REPORT'
                ? 'Báo Cáo Khách Boom Đơn'
                : 'Xác Nhận Hủy Nhận Việc'}
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-[260px]">Đơn: {gig.title}</p>
          </div>
        </div>

        {/* Content Body Based On Mode */}
        {activeMode === 'CLIENT_CANCEL' && isGigOpen ? (
          // Khách hủy đơn OPEN (Chưa có thợ)
          <div className="mt-4 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2.5 text-xs">
            <div className="flex items-center space-x-2 text-emerald-300 font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Miễn Phí 100% & Hoàn Tiền Cọc Ngay</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Đơn việc chưa có trợ thủ nào tiếp nhận. Khi hủy lúc này, toàn bộ <strong className="text-emerald-400 font-mono">{formatVnd(gig.price)}</strong> tiền ký quỹ Escrow sẽ được hoàn trả ngay lập tức vào ví của bạn.
            </p>
          </div>
        ) : activeMode === 'NO_SHOW_REPORT' ? (
          // Khách báo thợ bỏ kèo No-show
          <div className="mt-4 p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-purple-300 font-black">
              <ShieldAlert className="w-5 h-5 text-purple-400 shrink-0" />
              <span>QUY TẮC KỶ LUẬT: THỢ BỎ BOM (NO-SHOW)</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Sau khi bạn xác nhận báo cáo thợ không đến điểm hẹn hoặc mất liên lạc:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-200 text-[11px]">
              <li>Hoàn lại <strong className="text-emerald-400">{formatVnd(gig.price)}</strong> tiền cọc Escrow cho bạn</li>
              <li>Trừ <strong className="text-rose-400">-15 điểm</strong> Trust Score kỷ luật của thợ</li>
              <li>Thu phạt <strong className="text-yellow-300">{formatVnd(noShowPenaltyWorker)}</strong> từ thợ bồi thường vào ví bạn</li>
            </ul>
          </div>
        ) : activeMode === 'WORKER_NO_SHOW_REPORT' ? (
          // Thợ báo khách boom đơn
          <div className="mt-4 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-amber-300 font-black">
              <DollarSign className="w-5 h-5 text-amber-400 shrink-0" />
              <span>BẢO HIỂM CÔNG DI CHUYỂN: KHÁCH BOOM HÀNG</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Bạn đã có mặt tại địa điểm hẹn nhưng người thuê không nhận cuộc gọi hoặc hủy ngang:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-200 text-[11px]">
              <li>Trích bồi thường <strong className="text-yellow-300">{formatVnd(noShowCompWorker)}</strong> công di chuyển từ Escrow vào ví bạn</li>
              <li>Trừ <strong className="text-rose-400">-15 điểm</strong> Trust Score của người thuê vì hành vi boom kèo</li>
            </ul>
          </div>
        ) : (
          // Hủy kèo In-Progress (Thợ hoặc Khách sau khi đã ghép đơn)
          <div className="mt-4 p-4 rounded-2xl bg-[#131E30] border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-cyan-400" />
                Thời gian kể từ khi nhận kèo:
              </span>
              <span className="font-mono font-bold text-white text-sm">
                {elapsedMinutes} phút
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Khung giờ hủy miễn phí:</span>
              <span className="font-bold text-emerald-400">10 phút đầu tiên</span>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              {isLate ? (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 space-y-1.5">
                  <div className="flex items-center space-x-1.5 font-black text-xs text-red-200">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span>CẢNH BÁO: HỦY ĐƠN TRỄ HẠN (&gt; 10 PHÚT)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Đơn đã được giữ quá 10 phút, đối phương đã chuẩn bị hoặc đang trên đường di chuyển. Theo quy định nền tảng GigMe:
                  </p>
                  <ul className="text-[11px] list-disc list-inside font-semibold text-red-300 space-y-0.5">
                    <li>Trừ <strong className="text-white">-5 điểm</strong> Trust Score uy tín</li>
                    <li>Phạt <strong className="text-yellow-300">{formatVnd(penaltyAmount)}</strong> bồi thường chi phí xăng xe/thời gian cho bên bị hủy</li>
                  </ul>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[11px]">
                    <strong>Hủy trong hạn (Dưới 10 phút):</strong> Miễn trừ phạt hoàn toàn, không bị trừ điểm uy tín và hoàn tiền đầy đủ.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reason Form */}
        <form onSubmit={handleCancelSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-semibold">Lý do chi tiết:</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white"
            >
              {activeMode === 'CLIENT_CANCEL' ? (
                <>
                  <option value="Thay đổi kế hoạch, không cần hỗ trợ nữa">Thay đổi kế hoạch, không cần hỗ trợ nữa</option>
                  <option value="Tìm được người hỗ trợ khác nhanh hơn">Tìm được người hỗ trợ khác nhanh hơn</option>
                  <option value="Nhập sai thông tin công việc hoặc địa điểm">Nhập sai thông tin công việc hoặc địa điểm</option>
                  <option value="Thợ phản hồi quá chậm">Thợ phản hồi quá chậm</option>
                  <option value="Lý do khác">Lý do khác</option>
                </>
              ) : activeMode === 'NO_SHOW_REPORT' ? (
                <>
                  <option value="Thợ không đến điểm hẹn và không liên lạc được qua điện thoại">Thợ không đến điểm hẹn và không liên lạc được qua điện thoại</option>
                  <option value="Thợ trễ hẹn quá 20 phút không có lý do">Thợ trễ hẹn quá 20 phút không có lý do</option>
                  <option value="Thợ tự ý hủy kèo không báo trước">Thợ tự ý hủy kèo không báo trước</option>
                  <option value="Lý do khác">Lý do khác</option>
                </>
              ) : activeMode === 'WORKER_NO_SHOW_REPORT' ? (
                <>
                  <option value="Đã đến đúng địa điểm hẹn nhưng gọi khách nhiều lần không nhấc máy">Đã đến đúng địa điểm hẹn nhưng gọi khách nhiều lần không nhấc máy</option>
                  <option value="Khách đổi địa điểm quá xa so với mô tả ban đầu">Khách đổi địa điểm quá xa so với mô tả ban đầu</option>
                  <option value="Khách boom hàng và từ chối gặp mặt">Khách boom hàng và từ chối gặp mặt</option>
                  <option value="Lý do khác">Lý do khác</option>
                </>
              ) : (
                <>
                  <option value="Bận việc đột xuất không thể tới địa điểm">Bận việc đột xuất không thể tới địa điểm</option>
                  <option value="Xe bị hỏng hóc hoặc sự cố dọc đường">Xe bị hỏng hóc hoặc sự cố dọc đường</option>
                  <option value="Không liên lạc được với người thuê">Không liên lạc được với người thuê</option>
                  <option value="Khoảng cách thực tế xa hơn dự kiến">Khoảng cách thực tế xa hơn dự kiến</option>
                  <option value="Lý do khác">Lý do khác</option>
                </>
              )}
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
              Quay Lại
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2.5 rounded-xl font-black transition shadow-lg ${
                isLate && !isGigOpen
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/30'
                  : activeMode === 'NO_SHOW_REPORT'
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30'
              }`}
            >
              {isSubmitting
                ? 'Đang xử lý...'
                : isLate && !isGigOpen
                ? 'Chấp Nhận Phạt & Hủy'
                : activeMode === 'NO_SHOW_REPORT'
                ? 'Gửi Báo Cáo Xử Phạt'
                : 'Xác Nhận Hủy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
