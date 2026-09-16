import React, { useState } from 'react';
import {
  Wrench,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  Power,
  Server,
  Cloud,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';

interface AdminMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminMaintenanceModal: React.FC<AdminMaintenanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { maintenanceConfig, setMaintenanceMode } = useGigMe();

  const [isActive, setIsActive] = useState<boolean>(maintenanceConfig.isActive);
  const [title, setTitle] = useState<string>(
    maintenanceConfig.title || 'Hệ Thống Đang Nâng Cấp & Bảo Trì Kỹ Thuật'
  );
  const [message, setMessage] = useState<string>(
    maintenanceConfig.message ||
      'GigMe đang tiến hành bảo trì cơ sở hạ tầng đám mây và nâng cấp tính năng khớp việc sinh viên. Các chức năng giao dịch tạm khóa.'
  );

  // Time preset in minutes or custom
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [isCustomTime, setIsCustomTime] = useState<boolean>(false);
  const [customDateTime, setCustomDateTime] = useState<string>(() => {
    const d = new Date(maintenanceConfig.endTime || Date.now() + 30 * 60 * 1000);
    // Format to YYYY-MM-DDTHH:mm
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });

  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const presets = [
    { label: '15 Phút', minutes: 15 },
    { label: '30 Phút', minutes: 30 },
    { label: '1 Giờ', minutes: 60 },
    { label: '2 Giờ', minutes: 120 },
    { label: '4 Giờ', minutes: 240 },
    { label: '12 Giờ', minutes: 720 },
    { label: '24 Giờ', minutes: 1440 },
  ];

  const handleApply = async () => {
    setIsSaving(true);
    try {
      let finalEndTime = Date.now() + durationMinutes * 60 * 1000;
      if (isCustomTime && customDateTime) {
        const parsed = new Date(customDateTime).getTime();
        if (!isNaN(parsed) && parsed > Date.now()) {
          finalEndTime = parsed;
        }
      }

      await setMaintenanceMode({
        isActive,
        title: title.trim(),
        message: message.trim(),
        startTime: Date.now(),
        endTime: finalEndTime,
        allowedTabs: ['PROFILE'],
      });

      onClose();
    } catch (err) {
      console.error('Lỗi áp dụng bảo trì:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickTurnOff = async () => {
    setIsSaving(true);
    try {
      await setMaintenanceMode({
        isActive: false,
      });
      setIsActive(false);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 to-[#0A0E17] border border-amber-500/40 rounded-3xl p-6 sm:p-7 text-white shadow-[0_0_50px_rgba(245,158,11,0.2)] max-h-[92vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start space-x-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
            <Wrench className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-white">
                Bảo Trì Toàn Hệ Thống (Web & Mobile App)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                MASTER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Liên kết thật qua Firestore & Realtime Engine. Khi kích hoạt, tất cả người dùng chỉ được phép xem thông tin cá nhân.
            </p>
          </div>
        </div>

        {/* Current State Indicator */}
        <div
          className={`p-4 rounded-2xl border mb-6 flex items-center justify-between transition ${
            isActive
              ? 'bg-amber-950/40 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isActive ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <div>
              <div className="text-xs font-black">
                Trạng thái: {isActive ? 'ĐANG BẢO TRÌ (Toàn sàn tạm dừng)' : 'ĐANG MỞ CỬA (Hoạt động bình thường)'}
              </div>
              <div className="text-[11px] text-slate-400">
                {isActive
                  ? `Dự kiến mở lại: ${new Date(maintenanceConfig.endTime).toLocaleString('vi-VN')}`
                  : 'Người dùng có thể đăng việc, ứng tuyển và rút nạp tiền'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition ${
              isActive
                ? 'bg-amber-500 text-black shadow-lg hover:brightness-110'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isActive ? 'BẢO TRÌ: BẬT' : 'BẢO TRÌ: TẮT'}</span>
          </button>
        </div>

        {/* Maintenance Duration Form */}
        <div className="space-y-5">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Thời Gian Dự Kiến Bảo Trì (Web & App tự động mở lại khi hết giờ)</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-3">
              {presets.map((preset) => {
                const isSelected = !isCustomTime && durationMinutes === preset.minutes;
                return (
                  <button
                    key={preset.minutes}
                    type="button"
                    onClick={() => {
                      setIsCustomTime(false);
                      setDurationMinutes(preset.minutes);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold text-center transition border ${
                      isSelected
                        ? 'bg-amber-500 text-black border-amber-400 shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Or custom datetime */}
            <div className="flex items-center space-x-3 pt-1">
              <button
                type="button"
                onClick={() => setIsCustomTime(!isCustomTime)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                  isCustomTime
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Tự Chọn Ngày & Giờ Cụ Thể
              </button>

              {isCustomTime && (
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Tiêu Đề Thông Báo Bảo Trì (Hiển thị người dùng)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Hệ Thống Đang Nâng Cấp & Bảo Trì Kỹ Thuật"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Nội Dung Chi Tiết / Lý Do Bảo Trì
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Giải thích lý do bảo trì, nâng cấp để sinh viên và nhà tuyển dụng nắm rõ..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-amber-400 focus:outline-none resize-none"
            />
          </div>

          {/* Restriction Rule Reminder */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>Chính Sách Khóa Trong Thời Gian Bảo Trì:</span>
            </div>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
              <li>
                <span className="text-emerald-400 font-bold">Cho phép:</span> Xem thông tin cá nhân, kiểm tra CCCD / Thẻ sinh viên, xem lịch sử và đánh giá.
              </li>
              <li>
                <span className="text-red-400 font-bold">Khóa hoàn toàn:</span> Đăng việc mới, ứng tuyển, nạp/rút tiền ví Escrow, gửi tin nhắn và chợ đồ cũ.
              </li>
              <li>
                <span className="text-cyan-400 font-bold">Quyền Master Admin:</span> Admin vẫn có quyền truy cập kiểm tra mọi màn hình với thanh thông báo bảo trì ghim ở đầu.
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800 gap-3">
          {maintenanceConfig.isActive ? (
            <button
              type="button"
              onClick={handleQuickTurnOff}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 font-bold text-xs hover:bg-red-900/80 transition"
            >
              Tắt Bảo Trì Ngay Lập Tức
            </button>
          ) : (
            <div className="text-[11px] text-slate-500 font-mono flex items-center space-x-1.5">
              <Cloud className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sẵn sàng đồng bộ đa nền tảng</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-xs shadow-lg hover:brightness-110 transition flex items-center space-x-1.5"
            >
              {isSaving ? (
                <span>Đang Lưu...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isActive ? 'Áp Dụng Chế Độ Bảo Trì' : 'Lưu Cấu Hình'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
