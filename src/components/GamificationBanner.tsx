import React, { useEffect, useState } from 'react';
import { Bell, Sparkles, X, CheckCircle2, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { triggerHaptic } from '../utils/haptics';

export const GamificationBanner: React.FC = () => {
  const { notification, dismissNotification, language } = useGigMe();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!notification) {
      setIsExiting(false);
      return;
    }

    // Auto-dismiss after 4.5 seconds with smooth exit animation
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        dismissNotification();
        setIsExiting(false);
      }, 250);
    }, 4500);

    return () => {
      clearTimeout(exitTimer);
    };
  }, [notification, dismissNotification]);

  if (!notification) return null;

  const handleClose = () => {
    triggerHaptic('light');
    setIsExiting(true);
    setTimeout(() => {
      dismissNotification();
      setIsExiting(false);
    }, 200);
  };

  const getTranslatedTitle = () => {
    if (language === 'vi') {
      return notification.titleVi || notification.title;
    }
    if (notification.titleEn) return notification.titleEn;
    const raw = notification.title;
    if (raw.includes('Đã sao chép')) return 'Copied! 📋';
    if (raw.includes('Nạp tiền') || raw.includes('Nạp Tiền')) return 'Deposit Successful!';
    if (raw.includes('Rút tiền') || raw.includes('Rút Tiền')) return 'Withdrawal Successful!';
    if (raw.includes('Xác thực CCCD')) return 'CCCD Verified Successfully 🛡️';
    if (raw.includes('Face Liveness')) return 'Face Liveness Verified 👤';
    if (raw.includes('Biến động số dư')) return 'Balance Update 🔔';
    if (raw.includes('Giao diện tối')) return 'Default Dark Theme';
    if (raw.includes('tắt toàn bộ âm thanh')) return 'Muted All Sounds 🔇';
    if (raw.includes('bật âm thanh')) return 'Audio Enabled 🔊';
    if (raw.includes('Giới hạn nạp tiền')) return 'Deposit Limit Warning ⚠️';
    if (raw.includes('Thiếu SĐT')) return 'Missing E-Wallet Phone';
    if (raw.includes('không hợp lệ')) return 'Invalid Value';
    if (raw.includes('Hộp Quà')) return 'Mystery Box Opened 🎁';
    if (raw.includes('Lỗi')) return 'Error ⚠️';
    if (raw.includes('Cảnh báo')) return 'Warning ⚠️';
    if (raw.includes('Thành công')) return 'Success ✅';
    return raw;
  };

  const getTranslatedMessage = () => {
    if (language === 'vi') {
      return notification.messageVi || notification.message;
    }
    if (notification.messageEn) return notification.messageEn;
    const raw = notification.message;
    if (raw.includes('Đã sao chép số tài khoản')) return 'Bank account number copied to clipboard.';
    if (raw.includes('Đã sao chép nội dung')) return 'Transfer syntax content copied to clipboard.';
    if (raw.includes('Đã đọc trọn vẹn dữ liệu từ chip')) return 'Biometric chip data successfully read matching C06 standards.';
    if (raw.includes('Số dư đã được nạp tự động')) return 'Balance has been automatically credited to your account!';
    if (raw.includes('Hệ thống GigMe được thiết lập mặc định ở chế độ Giao Diện Tối')) return 'GigMe is configured by default in Cyber Dark Mode.';
    if (raw.includes('Vui lòng nhập số điện thoại')) return 'Please enter your registered e-wallet phone number.';
    if (raw.includes('Số tiền nạp tối thiểu')) return 'Minimum deposit amount is 10,000 VND.';
    if (raw.includes('Số tiền rút tối thiểu')) return 'Minimum withdrawal amount is 10,000 VND.';
    return raw;
  };

  const displayTitle = getTranslatedTitle();
  const displayMessage = getTranslatedMessage();

  const isWarning =
    displayTitle.toLowerCase().includes('cảnh báo') ||
    displayTitle.toLowerCase().includes('warning') ||
    displayTitle.toLowerCase().includes('chưa đủ') ||
    displayTitle.toLowerCase().includes('lỗi') ||
    displayTitle.toLowerCase().includes('error');

  return (
    <div
      role="alert"
      className={`fixed top-18 right-3 sm:right-5 z-50 max-w-sm w-[calc(100vw-1.5rem)] sm:w-full transition-all duration-250 ease-out ${
        isExiting
          ? 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
          : 'animate-toast-spring pointer-events-auto'
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl bg-[#0E1B2E]/95 backdrop-blur-xl border border-[#C5E5EC]/30 p-3.5 text-white shadow-[0_12px_40px_rgba(48,100,174,0.35)] flex items-start space-x-3 group">
        {/* Top Animated Color Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3064AE] via-[#00E5FF] to-[#E0FAEB]" />

        {/* Dynamic Icon */}
        <div
          className={`p-2.5 rounded-xl shrink-0 mt-0.5 shadow-md transition-transform duration-300 group-hover:scale-105 ${
            isWarning
              ? 'bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-amber-500/20'
              : notification.isCelebration
              ? 'bg-gradient-to-tr from-[#00E5FF] via-[#3064AE] to-[#E0FAEB] text-slate-950 shadow-cyan-500/30'
              : 'bg-gradient-to-tr from-[#3064AE] to-[#437DD2] text-[#E0FAEB] shadow-[#3064AE]/30'
          }`}
        >
          {isWarning ? (
            <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
          ) : notification.isCelebration ? (
            <Sparkles className="w-5 h-5 fill-current animate-soft-float" />
          ) : (
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-white truncate max-w-[200px]">
              {displayTitle}
            </h4>
            {notification.isDingSound && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#E0FAEB]/20 text-[#E0FAEB] font-mono font-bold border border-[#E0FAEB]/30 animate-pulse">
                {language === 'vi' ? 'ĐING! 🔔' : 'DING! 🔔'}
              </span>
            )}
          </div>
          <p className="text-xs text-[#C5E5EC]/90 mt-1 leading-snug font-medium line-clamp-3">
            {displayMessage}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={handleClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors duration-150 cursor-pointer shrink-0"
          title={language === 'vi' ? 'Đóng thông báo' : 'Dismiss notification'}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress Countdown Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-[#00E5FF] to-[#3064AE] transition-all ease-linear"
            style={{
              animation: 'toast-progress 4.5s linear forwards',
            }}
          />
        </div>
      </div>
    </div>
  );
};
