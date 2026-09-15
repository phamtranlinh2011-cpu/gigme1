import React, { useEffect } from 'react';
import { Bell, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';

export const GamificationBanner: React.FC = () => {
  const { notification, dismissNotification } = useGigMe();

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      dismissNotification();
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification, dismissNotification]);

  if (!notification) return null;

  return (
    <div className="fixed top-18 right-4 z-50 max-w-sm w-full animate-bounce-short">
      <div className="rounded-2xl bg-[#0F1D30] border-2 border-[#00E5FF] shadow-[0_10px_30px_rgba(0,229,255,0.3)] p-3.5 text-white flex items-start space-x-3 backdrop-blur-md">
        <div className="p-2 rounded-xl bg-gradient-to-tr from-[#00E5FF] to-[#FF6B00] text-black shrink-0 mt-0.5">
          {notification.isCelebration ? (
            <Sparkles className="w-5 h-5 fill-current animate-spin-slow" />
          ) : (
            <CheckCircle2 className="w-5 h-5 fill-current" />
          )}
        </div>

        <div className="flex-1 pr-2">
          <div className="flex items-center space-x-1.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#00E5FF]">
              {notification.title}
            </h4>
            {notification.isDingSound && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                ĐING! 🔔
              </span>
            )}
          </div>
          <p className="text-xs text-slate-200 mt-1 leading-snug font-medium">
            {notification.message}
          </p>
        </div>

        <button
          onClick={dismissNotification}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
