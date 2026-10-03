import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { triggerHaptic } from '../utils/haptics';

interface SmartInstallBannerProps {
  onOpenDownloadAppModal?: () => void;
}

export const SmartInstallBanner: React.FC<SmartInstallBannerProps> = ({ onOpenDownloadAppModal }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
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
              <span className="font-extrabold text-white text-xs truncate">Cài App GigMe Lên Điện Thoại</span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" /> 1 Chạm
              </span>
            </div>
            <p className="text-[11px] text-[#C5E5EC]/80 truncate">
              {isIOS
                ? 'Thêm vào Màn hình chính Safari để nhận thông báo việc làm và tin nhắn 24/7'
                : 'Nhận thông báo đơn hàng và tin nhắn ngay trên Màn hình khóa'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          {installedSuccess ? (
            <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã Cài Đặt!</span>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#3064AE] hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs flex items-center space-x-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isInstalling ? 'Đang cài...' : isIOS ? 'Xem Cách Cài' : 'Cài Ngay'}</span>
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Đóng banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
