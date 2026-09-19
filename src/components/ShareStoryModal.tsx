import React, { useState } from 'react';
import {
  Share2,
  Sparkles,
  Check,
  Copy,
  X,
  Smartphone,
  ExternalLink,
  Award,
  HeartHandshake,
} from 'lucide-react';
import { ShareStoryParams, generateShareStoryText, shareToPlatform } from '../utils/shareUtils';
import { useGigMe } from '../context/GigMeContext';

interface ShareStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: ShareStoryParams;
}

export const ShareStoryModal: React.FC<ShareStoryModalProps> = ({
  isOpen,
  onClose,
  params,
}) => {
  const { showNotification } = useGigMe();
  const [copied, setCopied] = useState(false);
  const [sharingPlatform, setSharingPlatform] = useState<string | null>(null);

  if (!isOpen) return null;

  const { headline, caption, hashtags, fullMessage, installUrl } = generateShareStoryText(params);

  const handleShare = async (platform: 'NATIVE' | 'FACEBOOK' | 'TIKTOK' | 'INSTAGRAM' | 'COPY') => {
    setSharingPlatform(platform);
    try {
      const res = await shareToPlatform(platform, params);
      if (res.success) {
        if (platform === 'COPY') {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
          showNotification('Đã sao chép!', 'Đã sao chép nội dung & link cài app vào clipboard để bạn dán lên Story!', true);
        } else if (platform === 'INSTAGRAM') {
          showNotification('Mở Instagram Story', 'Đã sao chép caption & link cài app! Hãy dán vào sticker link trên Story của bạn.', true);
        } else if (platform === 'TIKTOK') {
          showNotification('Mở TikTok', 'Đã sao chép caption & link tải app! Hãy dán vào video/story TikTok của bạn.', true);
        } else if (platform === 'FACEBOOK') {
          showNotification('Chia sẻ Facebook', 'Đang mở cửa sổ chia sẻ Facebook kèm link cài ứng dụng GigMe.', true);
        } else {
          showNotification('Chia sẻ thành công', 'Cảm ơn bạn đã lan tỏa GigMe tới bạn bè campus!', true);
        }
      }
    } finally {
      setSharingPlatform(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0E1B2E] border border-[#C5E5EC]/30 rounded-3xl shadow-2xl overflow-hidden text-white my-4">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#12233B] border-b border-[#C5E5EC]/20 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white/10 border border-white/20">
              <Share2 className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Chia Sẻ Story 1 Chạm</h3>
              <p className="text-[11px] text-[#C5E5EC]/80">Khoe khoảnh khắc kèm link cài app GigMe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#C5E5EC] hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Story Visual Preview Card (9:16 aspect ratio mini-card) */}
          <div className="relative rounded-2xl overflow-hidden p-5 bg-gradient-to-br from-[#12233B] via-[#1B3252] to-[#0A1424] border border-[#C5E5EC]/30 shadow-lg text-center space-y-3">
            {/* Background glowing blur */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#3064AE]/30 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Badge or Tip Header icon */}
            <div className="flex justify-center">
              {params.type === 'TIP' ? (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-slate-900 shadow-lg shadow-amber-400/20">
                  <HeartHandshake className="w-8 h-8" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-sky-500/20">
                  {params.badgeIcon || '🎖️'}
                </div>
              )}
            </div>

            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#E0FAEB]/15 text-[#E0FAEB] border border-[#E0FAEB]/30 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                {params.type === 'TIP' ? '🎉 Tip Thưởng Campus' : '🌟 Thành Tựu Xuất Sắc'}
              </span>
              <h4 className="text-base font-black text-white">{headline}</h4>
              <p className="text-xs text-[#C5E5EC]/90 mt-1 leading-relaxed px-2">
                {caption}
              </p>
            </div>

            {/* Link Preview Pill */}
            <div className="p-2.5 rounded-xl bg-[#09111D]/80 border border-[#C5E5EC]/20 flex items-center justify-between text-left">
              <div className="min-w-0 pr-2">
                <p className="text-[10px] text-[#C5E5EC]/60 uppercase font-bold">Link Tải Ứng Dụng</p>
                <p className="text-xs font-mono text-[#E0FAEB] truncate font-semibold">{installUrl}</p>
              </div>
              <span className="px-2 py-1 rounded-lg bg-[#3064AE]/40 text-[#C5E5EC] text-[10px] font-extrabold border border-[#C5E5EC]/30 shrink-0">
                1-Click Install
              </span>
            </div>
          </div>

          {/* Social Platforms 1-Tap Share Buttons */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-[#C5E5EC]/80 uppercase tracking-wider">
              Chọn nền tảng chia sẻ nhanh:
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Facebook */}
              <button
                onClick={() => handleShare('FACEBOOK')}
                disabled={sharingPlatform === 'FACEBOOK'}
                className="p-3 rounded-2xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/40 text-white flex flex-col items-center justify-center space-y-1.5 transition active:scale-95 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center font-black text-sm">
                  f
                </div>
                <span className="text-xs font-bold">Facebook</span>
              </button>

              {/* Instagram */}
              <button
                onClick={() => handleShare('INSTAGRAM')}
                disabled={sharingPlatform === 'INSTAGRAM'}
                className="p-3 rounded-2xl bg-gradient-to-tr from-purple-500/15 via-pink-500/15 to-orange-500/15 hover:from-purple-500/25 hover:to-orange-500/25 border border-pink-500/40 text-white flex flex-col items-center justify-center space-y-1.5 transition active:scale-95 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center text-xs font-black">
                  IG
                </div>
                <span className="text-xs font-bold">Instagram</span>
              </button>

              {/* TikTok */}
              <button
                onClick={() => handleShare('TIKTOK')}
                disabled={sharingPlatform === 'TIKTOK'}
                className="p-3 rounded-2xl bg-black/40 hover:bg-black/60 border border-slate-600 text-white flex flex-col items-center justify-center space-y-1.5 transition active:scale-95 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-black">
                  TT
                </div>
                <span className="text-xs font-bold">TikTok</span>
              </button>
            </div>

            {/* Native Share button (if supported) & Copy link */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleShare('NATIVE')}
                className="p-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] to-[#255294] hover:brightness-110 border border-[#C5E5EC]/30 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Chia Sẻ Thiết Bị</span>
              </button>

              <button
                onClick={() => handleShare('COPY')}
                className="p-2.5 rounded-xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/20 text-[#C5E5EC] hover:text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã Sao Chép!' : 'Sao Chép Caption'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
