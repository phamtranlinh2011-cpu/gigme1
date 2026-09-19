import React, { useState, useEffect } from 'react';
import { ShieldAlert, Wrench, Clock, User, ArrowRight, ShieldCheck, RefreshCw, Lock } from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';

interface SystemMaintenanceOverlayProps {
  onGoToProfile: () => void;
  onGoToAdmin?: () => void;
}

export const SystemMaintenanceOverlay: React.FC<SystemMaintenanceOverlayProps> = ({
  onGoToProfile,
  onGoToAdmin,
}) => {
  const { maintenanceConfig, currentUser, setMaintenanceMode } = useGigMe();
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = (maintenanceConfig.endTime || Date.now()) - Date.now();
      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [maintenanceConfig.endTime]);

  const formattedEndTime = new Date(maintenanceConfig.endTime).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const formattedEndDate = new Date(maintenanceConfig.endTime).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-gradient-to-b from-[#12233B] via-[#0E1B2E] to-[#0A1628] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative overflow-hidden backdrop-blur-xl text-center">
        {/* Top ambient glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-48 bg-amber-500/20 blur-3xl rounded-full pointer-events-none" />

        {/* Live Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs mb-6">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <Wrench className="w-3.5 h-3.5 text-amber-400" />
          <span className="tracking-wide uppercase">Chế Độ Bảo Trì Hệ Thống Đang Bật</span>
        </div>

        {/* Main Icon */}
        <div className="relative mx-auto w-24 h-24 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-amber-600/30 to-orange-500/10 border border-amber-500/40 rotate-6" />
          <div className="absolute inset-0 rounded-3xl bg-[#081120] border border-[#C5E5EC]/25 flex items-center justify-center shadow-inner">
            <Lock className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        {/* Title & Message */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-3">
          {maintenanceConfig.title || 'Hệ Thống Đang Nâng Cấp & Bảo Trì Kỹ Thuật'}
        </h2>
        <p className="text-sm text-[#C5E5EC]/85 leading-relaxed mb-6 max-w-md mx-auto">
          {maintenanceConfig.message ||
            'GigMe đang tiến hành bảo trì cơ sở hạ tầng đám mây và tối ưu hóa hệ thống khớp việc sinh viên. Các chức năng giao dịch tạm khóa.'}
        </p>

        {/* Realtime Countdown Display */}
        <div className="bg-[#081120] border border-[#C5E5EC]/20 rounded-2xl p-4 mb-6 max-w-md mx-auto">
          <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-[#C5E5EC]/70 mb-3">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Thời gian đếm ngược dự kiến mở lại:</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#12233B] border border-[#C5E5EC]/20 rounded-xl p-2.5">
              <span className="block text-2xl font-mono font-black text-amber-300">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-[#C5E5EC]/70 font-bold uppercase tracking-wider">Giờ</span>
            </div>
            <div className="bg-[#12233B] border border-[#C5E5EC]/20 rounded-xl p-2.5">
              <span className="block text-2xl font-mono font-black text-amber-300">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-[#C5E5EC]/70 font-bold uppercase tracking-wider">Phút</span>
            </div>
            <div className="bg-[#12233B] border border-[#C5E5EC]/20 rounded-xl p-2.5">
              <span className="block text-2xl font-mono font-black text-amber-300">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-[#C5E5EC]/70 font-bold uppercase tracking-wider">Giây</span>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-[#C5E5EC]/70">
            Dự kiến mở cửa: <span className="text-white font-bold">{formattedEndTime}</span> ngày{' '}
            <span className="text-white font-bold">{formattedEndDate}</span>
          </div>
        </div>

        {/* Permissions notice */}
        <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-200/90 text-left mb-6 max-w-md mx-auto flex items-start space-x-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-300">Quyền truy cập trong thời gian bảo trì:</div>
            <div className="text-[11px] text-[#C5E5EC]/80">
              Chỉ tính năng <span className="text-[#E0FAEB] font-bold">Xem thông tin cá nhân</span> được phép hoạt động. Tất cả các trang tạo việc, ví tiền, chat và chợ sinh viên sẽ tạm ẩn để bảo vệ dữ liệu tài chính.
            </div>
          </div>
        </div>

        {/* Action Button: View Profile */}
        <div className="space-y-3 max-w-md mx-auto">
          <button
            onClick={onGoToProfile}
            className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-[#3064AE] to-[#255294] text-[#E0FAEB] border border-[#C5E5EC]/30 font-extrabold text-sm shadow-[0_4px_20px_rgba(48,100,174,0.35)] hover:brightness-110 active:scale-[0.98] transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>Xem Thông Tin Cá Nhân Của Tôi</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {isAdmin && (
            <div className="pt-2 border-t border-[#C5E5EC]/20">
              <div className="text-[11px] text-[#E0FAEB] font-bold mb-2">
                Root Admin Bypass: Bạn có quyền quản trị tối cao
              </div>
              <div className="flex gap-2">
                {onGoToAdmin && (
                  <button
                    onClick={onGoToAdmin}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#12233B] hover:bg-[#152844] text-[#C5E5EC] border border-[#C5E5EC]/20 font-bold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#E0FAEB]" />
                    <span>Vào Admin Console</span>
                  </button>
                )}
                <button
                  onClick={() => setMaintenanceMode({ isActive: false })}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 font-bold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tắt Bảo Trì Ngay</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Real Cloud Link Status */}
        <div className="mt-6 pt-4 border-t border-[#C5E5EC]/20 flex items-center justify-center space-x-2 text-[10px] text-[#C5E5EC]/60 font-mono">
          <div className="w-1.5 h-1.5 rounded-full bg-[#E0FAEB] animate-pulse" />
          <span>Liên kết thật thời gian thực: Firestore Cloud & SSE Stream Engine</span>
        </div>
      </div>
    </div>
  );
};
