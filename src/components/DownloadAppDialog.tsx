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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 text-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 p-0.5 shadow-md shadow-sky-500/20">
              <img
                src="/logo.png"
                alt="GigMe Logo"
                className="w-full h-full rounded-[14px] object-cover bg-white"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base text-slate-900">Tải App Gigme (File APK)</h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Android APK
                </span>
              </div>
              <p className="text-xs text-slate-500">Cài đặt trực tiếp file Gigme.apk cho điện thoại Android</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big APK Download Card */}
        <div className="mt-5 p-5 rounded-2xl bg-gradient-to-br from-sky-50/80 via-white to-emerald-50/50 border border-sky-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-sky-900">
              <Smartphone className="w-4 h-4 text-sky-600" />
              <span>Gói cài đặt Android Package Kit (APK)</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-bold bg-emerald-100/60 px-2 py-0.5 rounded-md flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Đã quét sạch & bảo mật
            </span>
          </div>

          {/* APK Specs Grid */}
          <div className="grid grid-cols-3 gap-2 text-[11px] py-1">
            <div className="p-2.5 rounded-xl bg-white/90 border border-slate-100 text-center shadow-2xs">
              <div className="flex justify-center mb-1 text-sky-600">
                <HardDrive className="w-4 h-4" />
              </div>
              <span className="block text-slate-400 text-[10px]">Tệp tin</span>
              <span className="font-bold text-slate-800 truncate">Gigme.apk</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/90 border border-slate-100 text-center shadow-2xs">
              <div className="flex justify-center mb-1 text-emerald-600">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="block text-slate-400 text-[10px]">Hệ điều hành</span>
              <span className="font-bold text-slate-800">Android 7.0+</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/90 border border-slate-100 text-center shadow-2xs">
              <div className="flex justify-center mb-1 text-amber-600">
                <FileCheck className="w-4 h-4" />
              </div>
              <span className="block text-slate-400 text-[10px]">Phiên bản</span>
              <span className="font-bold text-slate-800">Bản chuẩn (Release)</span>
            </div>
          </div>

          {/* Download Action Button */}
          <button
            onClick={handleDownloadApk}
            disabled={downloading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-emerald-500 text-white font-extrabold text-sm hover:brightness-105 active:scale-[0.99] shadow-md shadow-sky-500/25 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-75"
          >
            {downloading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" />
                <span>Đang tải xuống tệp Gigme.apk...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Đã bắt đầu tải Gigme.apk!</span>
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
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2.5">
          <h4 className="font-extrabold text-slate-800 flex items-center space-x-1.5 text-sky-700">
            <Info className="w-4 h-4" />
            <span>3 bước cài đặt file APK trên điện thoại:</span>
          </h4>
          <ol className="space-y-2 text-slate-600 list-decimal list-inside leading-relaxed text-[11px]">
            <li>
              Bấm nút <strong>"Tải File Gigme.apk"</strong> ở trên để tải tệp về máy.
            </li>
            <li>
              Mở thanh thông báo điện thoại hoặc vào ứng dụng <strong>Quản lý tệp (Files / Tải về)</strong> rồi bấm vào tệp <strong>Gigme.apk</strong>.
            </li>
            <li>
              Nếu máy hỏi <em>"Cho phép cài đặt ứng dụng từ nguồn này"</em>, hãy bật <strong>Cho phép</strong> rồi bấm <strong>Cài đặt</strong> là xong.
            </li>
          </ol>
        </div>

        {/* QR Code Scan section */}
        <div className="mt-4 p-4 rounded-2xl bg-sky-50/40 border border-sky-100 flex flex-col sm:flex-row items-center gap-4">
          <div className="p-2 rounded-xl bg-white border border-sky-200 shadow-sm shrink-0">
            <img
              src={qrCodeUrl}
              alt="Mã QR tải APK trực tiếp"
              className="w-24 h-24 rounded-lg object-contain"
            />
          </div>
          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-xs font-extrabold text-slate-800">
              <QrCode className="w-4 h-4 text-sky-600" />
              <span>Quét mã QR để tải trực tiếp lên điện thoại</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Dùng máy ảnh điện thoại hoặc Zalo quét mã để tải file APK về máy ngay lập tức mà không cần gõ link.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
              <button
                onClick={handleCopyUrl}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold transition flex items-center space-x-1 shadow-2xs"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Đã chép link APK!</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                    <span>Sao chép link tải APK</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">Bản build Release chính thức cho Android</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
