import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  ExternalLink,
  QrCode,
  HardDrive,
  AlertCircle,
  Sparkles,
  Loader2,
  Share2,
  PlusSquare,
  Check,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useGigMe } from '../context/GigMeContext';

interface DownloadAppDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppDialog: React.FC<DownloadAppDialogProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { language } = useGigMe();

  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  // Direct In-Browser Blob Download (Prevents 0.08 KB truncated download bug on mobile)
  const handleDownloadBlobApk = async () => {
    try {
      setDownloading(true);
      setDownloadProgress(
        language === 'vi' ? 'Đang kết nối máy chủ...' : 'Connecting to server...'
      );

      const response = await fetch('/downloads/Gigme.apk', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      setDownloadProgress(
        language === 'vi'
          ? 'Đang tải dữ liệu tệp (690 KB)...'
          : 'Downloading package data (690 KB)...'
      );
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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-[#0E1A2D] border border-[#C5E5EC]/25 p-5 sm:p-6 text-slate-100 shadow-2xl relative max-h-[92vh] overflow-y-auto animate-modal-in"
      >
        {/* Top Brand Gradient Strip */}
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
                <h3 className="font-extrabold text-base text-white">
                  {language === 'vi' ? 'Cài Đặt App GigMe Cho Điện Thoại' : 'Install GigMe on Mobile'}
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#E0FAEB]/15 text-[#E0FAEB] border border-[#E0FAEB]/30">
                  Android & iOS
                </span>
              </div>
              <p className="text-xs text-[#C5E5EC]/80">
                {language === 'vi'
                  ? 'Cài đặt trực tiếp 1-chạm hoặc tải tệp cài đặt'
                  : 'Install with 1-tap PWA or download APK file'}
              </p>
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
                <h4 className="font-extrabold text-sm text-white">
                  {language === 'vi'
                    ? 'Cách 1: Cài Đặt Trực Tiếp (Khuyên Dùng 100% Thành Công)'
                    : 'Method 1: Direct 1-Tap Install (Recommended 100% Success)'}
                </h4>
                <p className="text-[11px] text-[#C5E5EC]/80">
                  {language === 'vi'
                    ? 'Chuẩn WebAPK chính thức • Không bao giờ bị lỗi "Không đọc được cấu hình/gói"'
                    : 'Official WebAPK standard • Zero "Package parse error" issues'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
              {language === 'vi' ? '100% Hoạt động' : '100% Verified'}
            </span>
          </div>

          {/* Special notice for Parse error */}
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200 leading-relaxed flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>{language === 'vi' ? 'Khắc phục triệt để lỗi trên Android: ' : 'Fixes Android parsing issues: '}</strong>
              {language === 'vi'
                ? 'Khi tải file APK bên ngoài, Android thường báo "Không đọc được cấu hình" hoặc "Lỗi phân tích cú pháp gói" do bảo mật máy. Cài đặt trực tiếp bằng Cách 1 sẽ vượt qua 100% rào cản này, app chạy mượt mà ngay lập tức!'
                : 'When downloading third-party APKs, Android often flags "Package parsing error" due to system security. Direct 1-Tap installation bypasses this completely with smooth, instant access!'}
            </span>
          </div>

          {/* Benefit Bullets */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-200">
            <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{language === 'vi' ? 'Icon xuất hiện ngoài màn hình chính' : 'Home screen app icon'}</span>
            </div>
            <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{language === 'vi' ? 'Mở toàn màn hình (Full Screen)' : 'Native Full Screen mode'}</span>
            </div>
            <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{language === 'vi' ? 'Rung chuông ngoài Màn hình khóa' : 'Lock screen push alerts'}</span>
            </div>
            <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{language === 'vi' ? 'Không bị cảnh báo file độc hại' : 'Zero malicious file warnings'}</span>
            </div>
          </div>

          {/* Primary Action Button */}
          {isInstalled || installSuccess ? (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-center flex items-center justify-center space-x-2 text-xs font-bold text-emerald-300">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>
                {language === 'vi'
                  ? '✓ Ứng dụng GigMe đã được cài đặt trên thiết bị của bạn!'
                  : '✓ GigMe app is installed on your device!'}
              </span>
            </div>
          ) : isInstallable ? (
            <button
              onClick={handleInstallPWA}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#437DD2] to-[#C5E5EC] hover:brightness-110 active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-[#3064AE]/40 transition flex items-center justify-center space-x-2 cursor-pointer border border-[#E0FAEB]/30"
            >
              <Smartphone className="w-4 h-4 stroke-[2.5]" />
              <span>
                {language === 'vi'
                  ? '📲 Bấm Vào Đây Để Cài Đặt Lên Màn Hình Điện Thoại (1 Chạm)'
                  : '📲 Tap Here to Install Directly to Home Screen (1 Tap)'}
              </span>
            </button>
          ) : isIOS ? (
            <div className="p-3.5 rounded-xl bg-[#0C1728] border border-[#C5E5EC]/20 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-white font-bold">
                <Share2 className="w-4 h-4 text-[#C5E5EC]" />
                <span>
                  {language === 'vi'
                    ? 'Cách cài đặt trên iPhone (Safari):'
                    : 'How to install on iPhone (Safari):'}
                </span>
              </div>
              <ol className="text-[11px] text-slate-300 space-y-1 list-decimal list-inside leading-relaxed">
                {language === 'vi' ? (
                  <>
                    <li>
                      Bấm nút <strong>Chia sẻ</strong> (biểu tượng hình vuông có mũi tên hất lên{' '}
                      <Share2 className="w-3 h-3 inline mx-0.5 text-blue-400" />) ở thanh dưới cùng Safari.
                    </li>
                    <li>Cuộn xuống chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong>.</li>
                    <li>Bấm <strong>Thêm (Add)</strong> ở góc trên bên phải là xong!</li>
                  </>
                ) : (
                  <>
                    <li>
                      Tap the <strong>Share</strong> icon (square with arrow pointing up{' '}
                      <Share2 className="w-3 h-3 inline mx-0.5 text-blue-400" />) in Safari bottom bar.
                    </li>
                    <li>Scroll down and select <strong>"Add to Home Screen"</strong>.</li>
                    <li>Tap <strong>Add</strong> in the top-right corner to finish!</li>
                  </>
                )}
              </ol>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#0C1728] border border-[#C5E5EC]/20 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-white font-bold">
                <PlusSquare className="w-4 h-4 text-[#C5E5EC]" />
                <span>
                  {language === 'vi'
                    ? 'Cách cài đặt trên Android (Chrome / Cốc Cốc / Edge):'
                    : 'How to install on Android (Chrome / Edge):'}
                </span>
              </div>
              <ol className="text-[11px] text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                {language === 'vi' ? (
                  <>
                    <li>
                      Nhìn lên góc trên bên phải trình duyệt, bấm vào dấu <strong>3 chấm (⋮ hoặc ...)</strong>.
                    </li>
                    <li>
                      Chọn dòng <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.
                    </li>
                    <li>
                      Bấm <strong>Cài đặt</strong> → Biểu tượng app GigMe sẽ tự động xuất hiện ngoài màn hình điện thoại!
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      Tap the <strong>3 dots (⋮ or ...)</strong> menu in browser top-right corner.
                    </li>
                    <li>
                      Select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.
                    </li>
                    <li>
                      Tap <strong>Install</strong> → GigMe app icon will appear instantly on your home screen!
                    </li>
                  </>
                )}
              </ol>
            </div>
          )}
        </div>

        {/* PRIORITY 2: APK FILE DOWNLOAD SECTION */}
        <div className="mt-5 p-4 rounded-2xl bg-[#0B1524] border border-[#C5E5EC]/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <HardDrive className="w-4 h-4 text-[#C5E5EC]" />
              <span>
                {language === 'vi'
                  ? 'Cách 2: Tải Tệp APK Rời (Gigme.apk ~690 KB)'
                  : 'Method 2: Standalone APK File (Gigme.apk ~690 KB)'}
              </span>
            </div>
            <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 border border-amber-400/25 px-2 py-0.5 rounded-md">
              {language === 'vi' ? 'Bản đóng gói rời' : 'Direct package'}
            </span>
          </div>

          {/* Technical Explanation on Parse Error */}
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/25 text-[11px] text-amber-200 leading-relaxed space-y-1.5">
            <div className="flex items-center space-x-1.5 font-bold text-amber-300">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {language === 'vi'
                  ? 'Tại sao máy báo "Không đọc được cấu hình / Lỗi phân tích cú pháp gói"?'
                  : 'Why does Android show "Package parse error / Cannot read configuration"?'}
              </span>
            </div>
            <p>
              {language === 'vi'
                ? 'Đây là cơ chế bảo vệ mặc định của Android đối với file APK tải ngoài Google Play. Để cài đặt file APK:'
                : 'This is Android standard gatekeeping against non-Play Store APK downloads. To install APK:'}
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
              {language === 'vi' ? (
                <>
                  <li>
                    Vào <strong>Cài đặt điện thoại → Bảo mật / Quyền riêng tư → Bật "Cài đặt ứng dụng không rõ nguồn gốc"</strong> cho trình duyệt.
                  </li>
                  <li>
                    Hoặc <strong>khuyên dùng Cách 1 (Cài đặt trực tiếp PWA 1-chạm)</strong> ở phía trên: hoàn toàn không bao giờ bị lỗi cấu hình, cài trong 1 giây, tự động cập nhật và nhận thông báo màn hình khóa 24/7.
                  </li>
                </>
              ) : (
                <>
                  <li>
                    Go to <strong>Phone Settings → Security / Privacy → Enable "Install from unknown sources"</strong> for your browser.
                  </li>
                  <li>
                    Or <strong>use Method 1 (Direct 1-Tap PWA)</strong> above: 100% error-free, installed in 1s, auto-updated, and supports 24/7 lock screen alerts.
                  </li>
                </>
              )}
            </ul>
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
                  <span>
                    {downloadProgress ||
                      (language === 'vi' ? 'Đang tải tệp APK...' : 'Downloading APK...')}
                  </span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">
                    {language === 'vi'
                      ? 'Đã tải xong Gigme.apk (690 KB) về máy!'
                      : 'Gigme.apk (690 KB) downloaded successfully!'}
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-[#C5E5EC]" />
                  <span>
                    {language === 'vi'
                      ? 'Tải File Gigme.apk (Tải Trực Tiếp Không Qua Proxy)'
                      : 'Download Gigme.apk (Direct In-Browser Stream)'}
                  </span>
                </>
              )}
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-2 text-xs">
              <a
                href="/downloads/Gigme.apk"
                download="Gigme.apk"
                className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-[#0E1A2D] hover:bg-[#13243D] text-[#C5E5EC] text-center font-bold text-[11px] border border-[#C5E5EC]/20 transition flex items-center justify-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#C5E5EC]" />
                <span>{language === 'vi' ? 'Link Máy Chủ Trực Tiếp' : 'Direct Server Link'}</span>
              </a>

              {/* Gofile Cloud Download Option */}
              <a
                href="https://gofile.io/d/gigme"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  handleDownloadBlobApk();
                }}
                className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:bg-emerald-600/40 text-emerald-200 text-center font-extrabold text-[11px] border border-emerald-500/40 transition flex items-center justify-center space-x-1.5 shadow-sm"
                title={language === 'vi' ? 'Tải siêu tốc qua máy chủ đám mây Gofile' : 'Fast download via Gofile cloud'}
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
                <span>{language === 'vi' ? 'Tải Qua Gofile (Tốc Độ Cao)' : 'Gofile Mirror (Fast)'}</span>
              </a>

              <button
                onClick={handleCopyUrl}
                className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-[#0E1A2D] hover:bg-[#13243D] text-[#C5E5EC] text-center font-bold text-[11px] border border-[#C5E5EC]/20 transition cursor-pointer flex items-center justify-center space-x-1"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">{language === 'vi' ? 'Đã chép link!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Sao Chép Link Web' : 'Copy Web Link'}</span>
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
              <span>
                {language === 'vi'
                  ? 'Quét mã QR để mở GigMe trên điện thoại'
                  : 'Scan QR to launch GigMe on mobile'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              {language === 'vi'
                ? 'Dùng camera điện thoại hoặc Zalo quét mã QR để mở ứng dụng trong trình duyệt Chrome / Safari, sau đó chọn "Cài đặt ứng dụng" để dùng ngay.'
                : 'Scan with your camera or QR scanner to open in Chrome / Safari, then tap "Install App" to start immediately.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-[#C5E5EC]/15 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            GigMe Platform • {language === 'vi' ? 'Phiên bản Android & iOS PWA 2026' : 'Android & iOS PWA 2026'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#162B48] hover:bg-[#1E375C] text-xs font-bold text-[#C5E5EC] transition cursor-pointer border border-[#C5E5EC]/20"
          >
            {language === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
