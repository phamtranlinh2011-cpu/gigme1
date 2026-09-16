import React, { useState, useEffect } from 'react';
import {
  WifiOff,
  Phone,
  MapPin,
  Clock,
  Trash2,
  X,
  ExternalLink,
  ShieldCheck,
  Search,
  CheckCircle2,
  FileText,
  Smartphone,
} from 'lucide-react';
import { offlineCacheManager, CachedOfflineGig } from '../utils/offlineCache';
import { formatVnd } from '../types';

interface OfflineGigsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGig?: (gigId: string) => void;
}

export const OfflineGigsModal: React.FC<OfflineGigsModalProps> = ({
  isOpen,
  onClose,
  onSelectGig,
}) => {
  const [cachedGigs, setCachedGigs] = useState<CachedOfflineGig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCachedGigs(offlineCacheManager.getCachedGigs());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = cachedGigs.filter(
    (g) =>
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.clientPhone.includes(searchTerm)
  );

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    offlineCacheManager.removeCachedGig(id);
    setCachedGigs(offlineCacheManager.getCachedGigs());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in text-xs">
      <div className="w-full max-w-lg rounded-3xl bg-[#0F172A] border border-amber-500/40 p-5 text-white shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm text-white">
                  Kho Việc Đã Lưu Offline (PWA Cache)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                  {cachedGigs.length} đơn
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Xem địa chỉ & SĐT khách hàng khi vào thang máy hoặc mất sóng 4G
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informational Callout */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30 text-amber-200 text-[11px] flex items-center space-x-2 shrink-0">
          <Smartphone className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Bảo lưu thông tin 100%:</strong> Các đơn việc bạn từng xem chi tiết được lưu trữ trực tiếp trên bộ nhớ máy điện thoại. Dù mất mạng hoàn toàn, bạn vẫn gọi điện được cho khách qua mạng viễn thông.
          </span>
        </div>

        {/* Search filter */}
        <div className="relative shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-xs"
            placeholder="Tìm theo tên việc, địa chỉ, người thuê..."
          />
        </div>

        {/* Cached Gigs List */}
        <div className="overflow-y-auto space-y-3 flex-1 pr-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <FileText className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-bold text-slate-300">Chưa có đơn việc nào được lưu offline</p>
              <p className="text-slate-500 text-[11px] max-w-xs mx-auto">
                Khi bạn bấm vào xem chi tiết bất kỳ đơn việc nào trên trang chủ, hệ thống sẽ tự động lưu bộ nhớ đệm cho bạn.
              </p>
            </div>
          ) : (
            filtered.map((gig) => (
              <div
                key={gig.id}
                onClick={() => {
                  if (onSelectGig) {
                    onSelectGig(gig.id);
                    onClose();
                  }
                }}
                className="p-4 rounded-2xl bg-[#131E30] border border-slate-700/80 hover:border-cyan-500/60 transition space-y-2.5 cursor-pointer group shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                      {gig.category}
                    </span>
                    <h4 className="font-extrabold text-white text-xs mt-1 group-hover:text-cyan-300 transition">
                      {gig.title}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-[#00E5FF] text-sm block">
                      {formatVnd(gig.price)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(gig.savedAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Location with MapPin */}
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 text-[11px]">
                  <div className="flex items-start space-x-1.5 text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="font-semibold">{gig.location}</span>
                  </div>
                  <p className="text-slate-400 text-[10px] line-clamp-2 pl-5">
                    {gig.description}
                  </p>
                </div>

                {/* Client Phone & Emergency Call Actions */}
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <div className="flex items-center space-x-1.5 text-slate-300">
                    <span className="text-slate-400">Khách:</span>
                    <strong className="text-white font-bold">{gig.clientName}</strong>
                    <span className="font-mono text-emerald-400 font-bold">
                      ({gig.clientPhone})
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Native Phone Call Anchor (Works offline over cellular) */}
                    <a
                      href={`tel:${gig.clientPhone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] transition flex items-center space-x-1 shadow-sm"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Gọi Khách</span>
                    </a>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyPhone(gig.clientPhone);
                      }}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Sao chép SĐT"
                    >
                      {copiedPhone === gig.clientPhone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <span className="text-[10px] font-bold px-1">Chép số</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleRemove(gig.id, e)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                      title="Xóa khỏi bộ nhớ cache"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>PWA LocalStorage Offline Cache Sync</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
