import React, { useEffect, useState } from 'react';
import { Bell, Sparkles, X, CheckCircle2, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { triggerHaptic } from '../utils/haptics';

export const GamificationBanner: React.FC = () => {
  const { notification, dismissNotification } = useGigMe();
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

  const isWarning = notification.title.toLowerCase().includes('cảnh báo') || 
                    notification.title.toLowerCase().includes('chưa đủ') || 
                    notification.title.toLowerCase().includes('lỗi');

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
              {notification.title}
            </h4>
            {notification.isDingSound && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#E0FAEB]/20 text-[#E0FAEB] font-mono font-bold border border-[#E0FAEB]/30 animate-pulse">
                ĐING! 🔔
              </span>
            )}
          </div>
          <p className="text-xs text-[#C5E5EC]/90 mt-1 leading-snug font-medium line-clamp-3">
            {notification.message}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={handleClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors duration-150 cursor-pointer shrink-0"
          title="Đóng thông báo"
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

