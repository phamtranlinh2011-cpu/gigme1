import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  ExternalLink,
  QrCode,
  ShieldCheck,
  FileCheck,
  Cpu,
  HardDrive,
  Info,
  AlertCircle,
  Sparkles,
  Loader2,
  Share2,
  PlusSquare,
  Check,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DownloadAppDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppDialog: React.FC<DownloadAppDialogProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const apkDownloadUrl = `${window.location.origin}/downloads/Gigme.apk`;

  // Direct In-Browser Blob Download (Prevents 0.08 KB truncated download bug on mobile)
  const handleDownloadBlobApk = async () => {
    try {
      setDownloading(true);
      setDownloadProgress('Đang kết nối máy chủ...');

      const response = await fetch('/downloads/Gigme.apk', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      setDownloadProgress('Đang tải dữ liệu tệp (690 KB)...');
      const blob = await response.blob();
      
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'Gigme.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 6000);
    } catch (err) {
      console.warn('Lỗi tải blob APK, chuyển hướng link dự phòng:', err);
      setDownloading(false);
      // Fallback direct navigation
      window.location.href = '/downloads/Gigme.apk';
    }
  };

  const handleInstallPWA = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    window.location.origin
  )}&bgcolor=FFFFFF&color=3064AE&margin=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-[#0E1A2D] border border-[#C5E5EC]/25 p-6 text-slate-100 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Top Brand Gradient Strip (Cobalt 60% -> Crystal 30% -> Ethereal 10%) */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#3064AE] via-[#437DD2] to-[#C5E5EC]" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#C5E5EC]/15 pt-1">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#3064AE] via-[#437DD2] to-[#C5E5EC] p-0.5 shadow-md shadow-[#3064AE]/30">
              <img
                src="/logo.png"
                alt="GigMe Logo"
                className="w-full h-full rounded-[14px] object-cover bg-[#0A0F1D]"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base text-white">Cài Đặt App GigMe Cho Điện Thoại</h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#E0FAEB]/15 text-[#E0FAEB] border border-[#E0FAEB]/30">
                  Android & iOS
                </span>
              </div>
              <p className="text-xs text-[#C5E5EC]/80">Cài đặt trực tiếp 1-chạm hoặc tải tệp cài đặt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#162742] text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRIORITY 1: OFFICIAL 1-TAP PWA INSTALL (RECOMMENDED - 100% SUCCESS) */}
        <div className="mt-5 p-5 rounded-2xl bg-gradient-to-br from-[#122846] via-[#102038] to-[#0A1424] border-2 border-[#3064AE] shadow-xl space-y-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-[#3064AE] text-white">
                <Sparkles className="w-4 h-4 text-[#E0FAEB]" />
              </span>
              <div>
                <h4 className="font-extrabold text-sm text-white">Cách 1: Cài Đặt Trực Tiếp (Khuyên Dùng)</h4>
                <p className="text-[11px] text-[#C5E5EC]/80">Chuẩn WebAPK chính thức • Không lo lỗi đọc file • Tự động cập nhật</p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
              100% Hoạt động
            </span>
          </div>

          {/* Benefit Bullets */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-200">
            <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Icon xuất hiện ngoài màn hình chính</span>
            </div>
            <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Mở toàn màn hình (Full Screen)</span>
            </div>
            <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Rung chuông ngoài Màn hình khóa</span>
            </div>
            <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Không bị cảnh báo file độc hại</span>
            </div>
          </div>

          {/* Primary Action Button */}
          {isInstalled || installSuccess ? (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-center flex items-center justify-center space-x-2 text-xs font-bold text-emerald-300">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>✓ Ứng dụng GigMe đã được cài đặt trên thiết bị của bạn!</span>
            </div>
          ) : isInstallable ? (
            <button
              onClick={handleInstallPWA}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#437DD2] to-[#C5E5EC] hover:brightness-110 active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-[#3064AE]/40 transition flex items-center justify-center space-x-2 cursor-pointer border border-[#E0FAEB]/30"
            >
              <Smartphone className="w-4 h-4 stroke-[2.5]" />
              <span>📲 Bấm Vào Đây Để Cài Đặt Lên Màn Hình Điện Thoại (1 Chạm)</span>
            </button>
          ) : isIOS ? (
            <div className="p-3.5 rounded-xl bg-[#0C1728] border border-[#C5E5EC]/20 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-white font-bold">
                <Share2 className="w-4 h-4 text-[#C5E5EC]" />
                <span>Cách cài đặt trên iPhone (Safari):</span>
              </div>
              <ol className="text-[11px] text-slate-300 space-y-1 list-decimal list-inside leading-relaxed">
                <li>Bấm nút <strong>Chia sẻ</strong> (biểu tượng hình vuông có mũi tên hất lên <Share2 className="w-3 h-3 inline mx-0.5 text-blue-400" />) ở thanh dưới cùng Safari.</li>
                <li>Cuộn xuống chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong>.</li>
                <li>Bấm <strong>Thêm (Add)</strong> ở góc trên bên phải là xong!</li>
              </ol>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#0C1728] border border-[#C5E5EC]/20 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-white font-bold">
                <PlusSquare className="w-4 h-4 text-[#C5E5EC]" />
                <span>Cách cài đặt trên Android (Chrome / Cốc Cốc / Edge):</span>
              </div>
              <ol className="text-[11px] text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>
                  Nhìn lên góc trên bên phải trình duyệt, bấm vào dấu <strong>3 chấm (⋮ hoặc ...)</strong>.
                </li>
                <li>
                  Chọn dòng <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.
                </li>
                <li>
                  Bấm <strong>Cài đặt</strong> &rarr; Biểu tượng app GigMe sẽ tự động xuất hiện ngoài màn hình điện thoại!
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* PRIORITY 2: APK FILE DOWNLOAD SECTION (EXPLAINED CLEARLY) */}
        <div className="mt-5 p-4 rounded-2xl bg-[#0B1524] border border-[#C5E5EC]/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <HardDrive className="w-4 h-4 text-[#C5E5EC]" />
              <span>Cách 2: Tải Tệp APK Rời (Gigme.apk ~690 KB)</span>
            </div>
            <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 border border-amber-400/25 px-2 py-0.5 rounded-md">
              Bản đóng gói rời
            </span>
          </div>

          {/* Technical Explanation on Parse Error */}
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/25 text-[11px] text-amber-200 leading-relaxed space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-amber-300">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Giải thích lỗi "Không đọc được file / Lỗi phân tích cú pháp":</span>
            </div>
            <p>
              Khi tải file APK rời ngoài CH Play, một số dòng điện thoại (Samsung, Xiaomi, Oppo...) sẽ chặn do chưa bật <em>"Cho phép cài đặt từ nguồn không xác định"</em> hoặc thiếu chữ ký Google Play. Nếu gặp lỗi này, bạn <strong>hãy dùng Cách 1 (Cài đặt trực tiếp)</strong> ở trên để vào app ngay mà không bao giờ bị lỗi!
            </p>
          </div>

          {/* In-Browser Blob Download Button */}
          <div className="space-y-2">
            <button
              onClick={handleDownloadBlobApk}
              disabled={downloading}
              className="w-full py-3 px-4 rounded-xl bg-[#162B48] hover:bg-[#1E375C] border border-[#C5E5EC]/30 text-white font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-md"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C5E5EC]" />
                  <span>{downloadProgress || 'Đang tải tệp APK...'}</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Đã tải xong Gigme.apk (690 KB) về máy!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-[#C5E5EC]" />
                  <span>Tải File Gigme.apk (Tải Trực Tiếp Không Qua Proxy)</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between gap-2 text-xs">
              <a
                href="/downloads/Gigme.apk"
                download="Gigme.apk"
                className="flex-1 py-2 px-3 rounded-xl bg-[#0E1A2D] hover:bg-[#13243D] text-[#C5E5EC] text-center font-bold text-[11px] border border-[#C5E5EC]/15 transition"
              >
                Link Dự Phòng (Trực tiếp)
              </a>
              <button
                onClick={handleCopyUrl}
                className="flex-1 py-2 px-3 rounded-xl bg-[#0E1A2D] hover:bg-[#13243D] text-[#C5E5EC] text-center font-bold text-[11px] border border-[#C5E5EC]/15 transition cursor-pointer flex items-center justify-center space-x-1"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Đã chép link!</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Sao Chép Link Mở Trình Duyệt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* QR Code Scan section */}
        <div className="mt-4 p-4 rounded-2xl bg-[#0B1524] border border-[#C5E5EC]/15 flex flex-col sm:flex-row items-center gap-4">
          <div className="p-2 rounded-xl bg-white border border-[#C5E5EC]/30 shadow-sm shrink-0">
            <img
              src={qrCodeUrl}
              alt="Mã QR mở GigMe trên điện thoại"
              className="w-22 h-22 rounded-lg object-contain"
            />
          </div>
          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-xs font-extrabold text-white">
              <QrCode className="w-4 h-4 text-[#C5E5EC]" />
              <span>Quét mã QR để mở GigMe trên điện thoại</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Dùng camera điện thoại hoặc Zalo quét mã QR để mở ứng dụng trong trình duyệt Chrome / Safari, sau đó chọn <strong>"Cài đặt ứng dụng"</strong> để dùng ngay.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-[#C5E5EC]/15 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">GigMe Platform • Phiên bản Android & iOS PWA 2026</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#162B48] hover:bg-[#1E375C] text-xs font-bold text-[#C5E5EC] transition cursor-pointer border border-[#C5E5EC]/20"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
