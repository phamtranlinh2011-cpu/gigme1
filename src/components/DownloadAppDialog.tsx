import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  Share2,
  ExternalLink,
  QrCode,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface DownloadAppDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppDialog: React.FC<DownloadAppDialogProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<'ANDROID' | 'IOS' | 'PC'>('ANDROID');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      // Fallback instruction
      alert('Để cài đặt: Bấm vào biểu tượng 3 chấm (⋮) trên Chrome và chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính"');
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const appUrl = window.location.href;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(appUrl)}&bgcolor=0F172A&color=00E5FF&margin=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-[#0F172A] border border-[#00E5FF]/40 p-6 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="GigMe Logo"
              className="w-10 h-10 rounded-full object-cover border border-cyan-400/40 shadow-lg shadow-cyan-500/20"
            />
            <div>
              <h3 className="font-extrabold text-base flex items-center space-x-1.5">
                <span>Tải & Cài Đặt GigMe App</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PWA Mobile
                </span>
              </h3>
              <p className="text-xs text-slate-400">Ứng dụng hoạt động mượt mà toàn màn hình trên điện thoại</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick 1-Click Install Button if supported */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900 border border-[#00E5FF]/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-[#00E5FF] animate-pulse" />
              <span className="text-xs font-bold text-white">Cài đặt trực tiếp vào màn hình chính</span>
            </div>
            {isInstalled && (
              <span className="text-[11px] text-emerald-400 font-bold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Đã cài đặt
              </span>
            )}
          </div>

          <button
            onClick={handleInstallClick}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00E5FF] to-cyan-500 text-black font-extrabold text-xs sm:text-sm hover:brightness-110 shadow-lg shadow-cyan-500/25 transition flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>{deferredPrompt ? 'Cài Đặt App GigMe Lên Máy Ngay' : 'Thêm Vào Màn Hình Chính Điện Thoại'}</span>
          </button>
        </div>

        {/* Device Switcher Tabs */}
        <div className="flex items-center gap-2 mt-5 p-1 rounded-xl bg-[#131E30] border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('ANDROID')}
            className={`flex-1 py-2 rounded-lg font-bold transition ${
              activeTab === 'ANDROID'
                ? 'bg-[#00E5FF] text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Android (Samsung, Xiaomi, Oppo...)
          </button>
          <button
            onClick={() => setActiveTab('IOS')}
            className={`flex-1 py-2 rounded-lg font-bold transition ${
              activeTab === 'IOS'
                ? 'bg-[#00E5FF] text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            iPhone (iOS)
          </button>
          <button
            onClick={() => setActiveTab('PC')}
            className={`flex-1 py-2 rounded-lg font-bold transition ${
              activeTab === 'PC'
                ? 'bg-[#00E5FF] text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Máy Tính (PC / Laptop)
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4 p-4 rounded-2xl bg-[#131E30]/70 border border-slate-800/80 text-xs space-y-3">
          {activeTab === 'ANDROID' && (
            <div className="space-y-3">
              <h4 className="font-bold text-white flex items-center space-x-1.5 text-cyan-300">
                <span>Cách cài đặt trên thiết bị Android:</span>
              </h4>
              <ol className="space-y-2.5 text-slate-300 list-decimal list-inside leading-relaxed">
                <li>
                  Mở link ứng dụng này trên trình duyệt <strong>Google Chrome</strong> hoặc <strong>Cốc Cốc</strong>.
                </li>
                <li>
                  Nhấn vào biểu tượng <strong>Menu 3 chấm (⋮)</strong> ở góc trên bên phải màn hình.
                </li>
                <li>
                  Chọn dòng <strong>"Cài đặt ứng dụng"</strong> (Install App) hoặc <strong>"Thêm vào màn hình chính"</strong> (Add to Home screen).
                </li>
                <li>
                  Xác nhận <strong>"Cài đặt"</strong>. Biểu tượng GigMe sẽ xuất hiện ngay trên màn hình như app tải từ CH Play!
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'IOS' && (
            <div className="space-y-3">
              <h4 className="font-bold text-white flex items-center space-x-1.5 text-cyan-300">
                <span>Cách cài đặt trên iPhone / iPad (iOS):</span>
              </h4>
              <ol className="space-y-2.5 text-slate-300 list-decimal list-inside leading-relaxed">
                <li>
                  Mở ứng dụng bằng trình duyệt <strong>Safari</strong> trên iPhone.
                </li>
                <li>
                  Nhấn nút <strong>Chia sẻ (Share <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-cyan-400" />)</strong> ở thanh dưới cùng của Safari.
                </li>
                <li>
                  Cuộn xuống và chọn <strong>"Thêm vào MH chính"</strong> (Add to Home Screen).
                </li>
                <li>
                  Nhấn <strong>"Thêm"</strong> ở góc trên bên phải. Icon GigMe sẽ nằm ngoài màn hình chính iPhone để bạn mở nhanh toàn màn hình.
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'PC' && (
            <div className="space-y-3">
              <h4 className="font-bold text-white flex items-center space-x-1.5 text-cyan-300">
                <span>Cách cài đặt trên Google Chrome máy tính:</span>
              </h4>
              <ol className="space-y-2.5 text-slate-300 list-decimal list-inside leading-relaxed">
                <li>
                  Nhìn vào thanh địa chỉ URL (Omnibox) góc bên phải trên Google Chrome hoặc Edge.
                </li>
                <li>
                  Nhấn vào biểu tượng <strong>Cài đặt GigMe (Install icon)</strong>.
                </li>
                <li>
                  Nhấn <strong>"Cài đặt"</strong> để mở GigMe dưới dạng cửa sổ Desktop App độc lập.
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* QR Code Scan section */}
        <div className="mt-4 p-4 rounded-2xl bg-[#0B111E] border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
          <div className="p-2 rounded-xl bg-[#0F172A] border border-[#00E5FF]/30 shrink-0">
            <img
              src={qrCodeUrl}
              alt="Mã QR mở GigMe trên điện thoại"
              className="w-28 h-28 rounded-lg object-contain"
            />
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-xs font-bold text-white">
              <QrCode className="w-4 h-4 text-[#00E5FF]" />
              <span>Quét mã QR bằng camera điện thoại</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Bật camera điện thoại hoặc Zalo quét mã QR này để mở trực tiếp GigMe trên máy của bạn và cài đặt ngay.
            </p>
            <button
              onClick={handleCopyUrl}
              className="px-3 py-1.5 rounded-xl bg-[#1E293B] hover:bg-[#2A3A52] text-white text-[11px] font-bold transition flex items-center space-x-1 mx-auto sm:mx-0"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Đã sao chép link app!</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>Sao chép link chia sẻ</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Close footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1E293B] hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
