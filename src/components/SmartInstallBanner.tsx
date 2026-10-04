import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { triggerHaptic } from '../utils/haptics';
import { useGigMe } from '../context/GigMeContext';

interface SmartInstallBannerProps {
  onOpenDownloadAppModal?: () => void;
}

export const SmartInstallBanner: React.FC<SmartInstallBannerProps> = ({ onOpenDownloadAppModal }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { language } = useGigMe();
  const [dismissed, setDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Check if user dismissed previously in this session
    const isDismissed = sessionStorage.getItem('gigme_smart_banner_dismissed') === 'true';
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    triggerHaptic('light');
    setDismissed(true);
    try {
      sessionStorage.setItem('gigme_smart_banner_dismissed', 'true');
    } catch {}
  };

  const handleInstallClick = async () => {
    triggerHaptic('medium');
    if (isInstallable) {
      setIsInstalling(true);
      const success = await install();
      setIsInstalling(false);
      if (success) {
        triggerHaptic('success');
        setInstalledSuccess(true);
        setTimeout(() => setDismissed(true), 2500);
      }
    } else {
      // If iOS or native prompt not triggered yet, open the detailed guide modal
      if (onOpenDownloadAppModal) {
        onOpenDownloadAppModal();
      }
    }
  };

  // If already running in standalone PWA or user dismissed, don't show
  if (isInstalled || dismissed) return null;

  return (
    <div className="relative z-40 bg-gradient-to-r from-[#0C1B2F] via-[#122E54] to-[#0D223E] border-b border-[#3064AE]/40 px-3 py-2 text-xs shadow-md animate-slide-up">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#3064AE] to-[#00E5FF] p-0.5 shadow-sm shrink-0 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-white text-xs truncate">
                {language === 'vi' ? 'Cài App GigMe Lên Điện Thoại' : 'Install GigMe App on Phone'}
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" /> {language === 'vi' ? '1 Chạm' : '1-Tap'}
              </span>
            </div>
            <p className="text-[11px] text-[#C5E5EC]/80 truncate">
              {isIOS
                ? language === 'vi'
                  ? 'Thêm vào Màn hình chính Safari để nhận thông báo việc làm và tin nhắn 24/7'
                  : 'Add to Safari Home Screen for 24/7 gig alerts and messages'
                : language === 'vi'
                  ? 'Nhận thông báo đơn hàng và tin nhắn ngay trên Màn hình khóa'
                  : 'Get instant gig alerts and chat directly on your Lock Screen'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          {installedSuccess ? (
            <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Đã Cài Đặt!' : 'Installed!'}</span>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#3064AE] hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs flex items-center space-x-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isInstalling
                  ? language === 'vi' ? 'Đang cài...' : 'Installing...'
                  : isIOS
                  ? language === 'vi' ? 'Xem Cách Cài' : 'How to Install'
                  : language === 'vi' ? 'Cài Ngay' : 'Install'}
              </span>
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title={language === 'vi' ? 'Đóng banner' : 'Dismiss banner'}
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
