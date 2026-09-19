import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  Share2,
  ExternalLink,
  QrCode,
  ShieldCheck,
  FileCheck,
  Cpu,
  HardDrive,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface DownloadAppDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppDialog: React.FC<DownloadAppDialogProps> = ({ isOpen, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const apkDownloadUrl = `${window.location.origin}/api/download/gigme.apk`;

  const handleDownloadApk = () => {
    setDownloading(true);
    // Trigger download
    const link = document.createElement('a');
    link.href = '/api/download/gigme.apk';
    link.download = 'Gigme.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    }, 1200);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(apkDownloadUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    apkDownloadUrl
  )}&bgcolor=FFFFFF&color=0284C7&margin=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-[#0E1A2D] border border-[#C5E5EC]/25 p-6 text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto overflow-hidden">
        {/* Top Brand Gradient Strip (Cobalt 60% -> Crystal 30% -> Ethereal 10%) */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand-horiz-gradient" />

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
                <h3 className="font-extrabold text-base text-white">Tải App Gigme (Mobile & Web)</h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#E0FAEB]/15 text-[#E0FAEB] border border-[#E0FAEB]/30">
                  Android APK & PWA
                </span>
              </div>
              <p className="text-xs text-[#C5E5EC]/80">Cài đặt trực tiếp file Gigme.apk hoặc thêm vào màn hình chính</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#162742] text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big APK Download Card */}
        <div className="mt-5 p-5 rounded-2xl bg-gradient-to-br from-[#13243D] via-[#0F1D30] to-[#0A1424] border border-[#C5E5EC]/25 shadow-lg space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#C5E5EC]">
              <Smartphone className="w-4 h-4 text-[#C5E5EC]" />
              <span>Gói cài đặt Android Package Kit (APK)</span>
            </div>
            <span className="text-[11px] text-[#E0FAEB] font-bold bg-[#E0FAEB]/15 border border-[#E0FAEB]/30 px-2 py-0.5 rounded-md flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#E0FAEB]" /> Đã quét sạch & bảo mật
            </span>
          </div>

          {/* APK Specs Grid */}
          <div className="grid grid-cols-3 gap-2 text-[11px] py-1">
            <div className="p-2.5 rounded-xl bg-[#0C1728]/80 border border-[#C5E5EC]/15 text-center shadow-2xs">
              <div className="flex justify-center mb-1 text-[#C5E5EC]">
                <HardDrive className="w-4 h-4" />
              </div>
              <span className="block text-slate-400 text-[10px]">Tệp tin</span>
              <span className="font-bold text-white truncate">Gigme.apk</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0C1728]/80 border border-[#C5E5EC]/15 text-center shadow-2xs">
              <div className="flex justify-center mb-1 text-[#E0FAEB]">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="block text-slate-400 text-[10px]">Hệ điều hành</span>
              <span className="font-bold text-white">Android & Web</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0C1728]/80 border border-[#C5E5EC]/15 text-center shadow-2xs">
              <div className="flex justify-center mb-1 text-amber-400">
                <FileCheck className="w-4 h-4" />
              </div>
              <span className="block text-slate-400 text-[10px]">Phiên bản</span>
              <span className="font-bold text-white">Bản chuẩn (Release)</span>
            </div>
          </div>

          {/* Download Action Button with Cobalt Blue to Crystal Blue gradient */}
          <button
            onClick={handleDownloadApk}
            disabled={downloading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#417AC6] to-[#C5E5EC] text-white font-extrabold text-sm hover:brightness-110 active:scale-[0.99] shadow-lg shadow-[#3064AE]/35 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-75 border border-[#E0FAEB]/30"
          >
            {downloading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" />
                <span>Đang tải xuống tệp Gigme.apk...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#E0FAEB]" />
                <span className="text-[#E0FAEB]">Đã bắt đầu tải Gigme.apk!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Tải File Gigme.apk Cho Điện Thoại</span>
              </>
            )}
          </button>
        </div>

        {/* Step-by-step Installation Instructions */}
        <div className="mt-4 p-4 rounded-2xl bg-[#0C1728] border border-[#C5E5EC]/15 text-xs space-y-2.5">
          <h4 className="font-extrabold text-[#C5E5EC] flex items-center space-x-1.5">
            <Info className="w-4 h-4 text-[#C5E5EC]" />
            <span>3 bước cài đặt file APK trên điện thoại:</span>
          </h4>
          <ol className="space-y-2 text-slate-300 list-decimal list-inside leading-relaxed text-[11px]">
            <li>
              Bấm nút <strong className="text-white">"Tải File Gigme.apk"</strong> ở trên để tải tệp về máy.
            </li>
            <li>
              Mở thanh thông báo điện thoại hoặc vào ứng dụng <strong className="text-white">Quản lý tệp (Files / Tải về)</strong> rồi bấm vào tệp <strong className="text-white">Gigme.apk</strong>.
            </li>
            <li>
              Nếu máy hỏi <em>"Cho phép cài đặt ứng dụng từ nguồn này"</em>, hãy bật <strong className="text-[#E0FAEB]">Cho phép</strong> rồi bấm <strong className="text-[#E0FAEB]">Cài đặt</strong> là xong.
            </li>
          </ol>
        </div>

        {/* QR Code Scan section */}
        <div className="mt-4 p-4 rounded-2xl bg-[#13243D]/70 border border-[#C5E5EC]/20 flex flex-col sm:flex-row items-center gap-4">
          <div className="p-2 rounded-xl bg-white border border-[#C5E5EC]/50 shadow-sm shrink-0">
            <img
              src={qrCodeUrl}
              alt="Mã QR tải APK trực tiếp"
              className="w-24 h-24 rounded-lg object-contain"
            />
          </div>
          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-xs font-extrabold text-white">
              <QrCode className="w-4 h-4 text-[#C5E5EC]" />
              <span>Quét mã QR để tải trực tiếp lên điện thoại</span>
            </div>
            <p className="text-[11px] text-[#C5E5EC]/80 leading-snug">
              Dùng máy ảnh điện thoại hoặc Zalo quét mã để tải file APK về máy ngay lập tức mà không cần gõ link.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
              <button
                onClick={handleCopyUrl}
                className="px-3 py-1.5 rounded-lg bg-[#162B48] hover:bg-[#1E375C] border border-[#C5E5EC]/30 text-[#C5E5EC] text-[11px] font-bold transition flex items-center space-x-1 shadow-2xs"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#E0FAEB]" />
                    <span className="text-[#E0FAEB]">Đã chép link APK!</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3.5 h-3.5 text-[#C5E5EC]" />
                    <span>Sao chép link tải APK</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-[#C5E5EC]/15 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">Bản build Release chính thức cho Android & Web</span>
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
