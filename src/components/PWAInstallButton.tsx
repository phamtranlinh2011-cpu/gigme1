import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, show minimal badge or hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (compact) {
      return (
        <button
          id="pwa-install-compact-btn"
          onClick={install}
          title="Cài đặt GigMe về điện thoại / máy tính"
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#00E5FF]/20 to-[#FF6B00]/20 border border-[#00E5FF]/40 text-[#00E5FF] hover:brightness-125 text-xs font-bold transition shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cài App</span>
        </button>
      );
    }

    return (
      <button
        id="pwa-install-full-btn"
        onClick={install}
        className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00E5FF] to-cyan-600 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/20 hover:brightness-110 transition"
      >
        <Download className="w-4 h-4" />
        <span>Cài Đặt Ứng Dụng GigMe (PWA)</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-install-ios-btn"
          onClick={() => setShowIOSGuide(true)}
          className={
            compact
              ? "flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold hover:bg-slate-700 transition"
              : "flex items-center justify-center space-x-2 w-full py-2.5 px-4 rounded-xl bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold text-xs hover:bg-slate-700 transition"
          }
        >
          <Smartphone className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span>Cài trên iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 shadow-2xl text-white">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-800">
                <h3 className="font-extrabold text-sm flex items-center space-x-2 text-cyan-400">
                  <Smartphone className="w-4 h-4" />
                  <span>Cài Đặt Trên iPhone / iPad</span>
                </h3>
                <button onClick={() => setShowIOSGuide(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                1. Bấm vào nút <strong>Chia sẻ (Share <span className="inline-block px-1 rounded bg-slate-800 font-mono">⎋</span>)</strong> trên thanh công cụ Safari.<br /><br />
                2. Cuộn xuống và chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong>.<br /><br />
                3. Bấm <strong>Thêm</strong>. Biểu tượng GigMe sẽ xuất hiện trên màn hình điện thoại như ứng dụng gốc không cần tải từ App Store!
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-[#00E5FF] text-black font-extrabold text-xs"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
