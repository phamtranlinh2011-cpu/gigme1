import React, { useState, useRef } from 'react';
import { Camera, Upload, Check, X, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';

export interface AvatarOption {
  id: string;
  name: string;
  category: string;
  url: string;
}

export const AVATAR_PRESETS: AvatarOption[] = [
  {
    id: 'gigme_mascot_core',
    name: 'GigMe Escrow Mascot',
    category: 'Mascot',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='gmBg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%230A1220'/><stop offset='100%25' stop-color='%23050912'/></linearGradient><linearGradient id='gmBolt' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%2300E5FF'/><stop offset='60%25' stop-color='%2300B4D8'/><stop offset='100%25' stop-color='%23FF6B00'/></linearGradient></defs><circle cx='50' cy='50' r='48' fill='url(%23gmBg)' stroke='%2300E5FF' stroke-width='2.5'/><path d='M50 16 L80 30 V56 C80 72 68 84 50 88 C32 84 20 72 20 56 V30 Z' fill='%230D1B2A' stroke='%2300E5FF' stroke-width='2'/><polygon points='54,26 38,52 52,52 46,74 66,44 52,44' fill='url(%23gmBolt)'/><circle cx='70' cy='32' r='3' fill='%23FFB703'/><circle cx='28' cy='68' r='2.5' fill='%2300E5FF'/></svg>",
  },
  {
    id: 'tdtu_student_boy',
    name: 'Sinh Viên Campus Năng Động',
    category: 'Sinh Viên',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='boyBg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%230F172A'/><stop offset='100%25' stop-color='%231E293B'/></linearGradient><linearGradient id='shirtGrad' x1='0' y1='0' x2='0' y2='1'><stop offset='0%25' stop-color='%230284C7'/><stop offset='100%25' stop-color='%230369A1'/></linearGradient></defs><circle cx='50' cy='50' r='48' fill='url(%23boyBg)' stroke='%2338BDF8' stroke-width='2'/><circle cx='50' cy='40' r='18' fill='%23FCD34D'/><path d='M30 35 C32 20 68 20 70 35 C64 26 36 26 30 35 Z' fill='%230F172A'/><circle cx='44' cy='39' r='2.5' fill='%230F172A'/><circle cx='56' cy='39' r='2.5' fill='%230F172A'/><path d='M46 47 Q50 51 54 47' stroke='%23B45309' stroke-width='2' fill='none' stroke-linecap='round'/><path d='M22 86 C22 66 78 66 78 86 Z' fill='url(%23shirtGrad)'/><rect x='44' y='64' width='12' height='16' rx='2' fill='%23EF4444'/><circle cx='50' cy='72' r='2' fill='%23FFFFFF'/></svg>",
  },
  {
    id: 'tdtu_student_girl',
    name: 'Nữ Sinh Gia Sư & Tri Thức',
    category: 'Sinh Viên',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='girlBg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%231E112A'/><stop offset='100%25' stop-color='%232D1537'/></linearGradient></defs><circle cx='50' cy='50' r='48' fill='url(%23girlBg)' stroke='%23F472B6' stroke-width='2'/><path d='M26 44 C26 22 74 22 74 44 C74 72 74 80 26 80 Z' fill='%23374151'/><circle cx='50' cy='42' r='17' fill='%23FDE047'/><circle cx='43' cy='41' r='4.5' fill='none' stroke='%23DB2777' stroke-width='1.5'/><circle cx='57' cy='41' r='4.5' fill='none' stroke='%23DB2777' stroke-width='1.5'/><path d='M47.5 41 H52.5' stroke='%23DB2777' stroke-width='1.5'/><circle cx='43' cy='41' r='2' fill='%231F2937'/><circle cx='57' cy='41' r='2' fill='%231F2937'/><path d='M46 49 Q50 53 54 49' stroke='%23DB2777' stroke-width='2' fill='none' stroke-linecap='round'/><path d='M24 88 C24 68 76 68 76 88 Z' fill='%23EC4899'/><polygon points='50,68 45,78 55,78' fill='%23FFFFFF'/></svg>",
  },
  {
    id: 'cyber_coder',
    name: 'Dev Coder Bách Khoa IT',
    category: 'Công Nghệ',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='codeBg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%23050C1A'/><stop offset='100%25' stop-color='%230B1E3B'/></linearGradient></defs><circle cx='50' cy='50' r='48' fill='url(%23codeBg)' stroke='%2300E5FF' stroke-width='2'/><circle cx='50' cy='40' r='18' fill='%23FCA5A5'/><path d='M20 86 C20 64 80 64 80 86 Z' fill='%230F172A' stroke='%2300E5FF' stroke-width='1.5'/><rect x='33' y='35' width='34' height='12' rx='3' fill='%2309131F' stroke='%2300E5FF' stroke-width='1.8'/><circle cx='41' cy='41' r='2.5' fill='%2300E5FF'/><circle cx='59' cy='41' r='2.5' fill='%2300E5FF'/><text x='50' y='76' font-family='monospace' font-size='9' font-weight='bold' fill='%2300E5FF' text-anchor='middle'>&lt;DEV/&gt;</text></svg>",
  },
  {
    id: 'speed_shipper',
    name: 'Shipper Campus Hỏa Tốc',
    category: 'Giao Nhận',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='shipBg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%231F0F05'/><stop offset='100%25' stop-color='%23361A0A'/></linearGradient></defs><circle cx='50' cy='50' r='48' fill='url(%23shipBg)' stroke='%23FF6B00' stroke-width='2'/><path d='M30 38 C30 20 70 20 70 38 L72 44 H28 Z' fill='%23FF6B00'/><rect x='34' y='32' width='32' height='8' rx='2' fill='%230F172A' stroke='%23FFD166' stroke-width='1'/><circle cx='50' cy='45' r='16' fill='%23FBBF24'/><circle cx='44' cy='44' r='2.5' fill='%231F2937'/><circle cx='56' cy='44' r='2.5' fill='%231F2937'/><path d='M46 51 Q50 54 54 51' stroke='%23000' stroke-width='2' fill='none' stroke-linecap='round'/><path d='M22 88 C22 66 78 66 78 88 Z' fill='%23EA580C'/><polygon points='50,66 43,76 49,76 47,84 57,74 51,74' fill='%23FFD166'/></svg>",
  },
  {
    id: 'uiux_designer',
    name: 'Designer Sáng Tạo UI/UX',
    category: 'Thiết Kế',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='artBg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%231E0A24'/><stop offset='100%25' stop-color='%23330F3D'/></linearGradient></defs><circle cx='50' cy='50' r='48' fill='url(%23artBg)' stroke='%23C084FC' stroke-width='2'/><circle cx='50' cy='42' r='17' fill='%23FED7AA'/><path d='M24 88 C24 66 76 66 76 88 Z' fill='%237E22CE'/><circle cx='34' cy='28' r='5' fill='%2300E5FF'/><circle cx='44' cy='22' r='5' fill='%23FF6B00'/><circle cx='56' cy='22' r='5' fill='%23EAB308'/><circle cx='66' cy='28' r='5' fill='%2310B981'/><circle cx='44' cy='41' r='2.5' fill='%233B0764'/><circle cx='56' cy='41' r='2.5' fill='%233B0764'/><path d='M46 50 Q50 54 54 50' stroke='%239333EA' stroke-width='2' fill='none'/></svg>",
  },
  {
    id: 'game_master',
    name: 'Game Master Cày Rank VIP',
    category: 'Gaming',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='gameBg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%23061A13'/><stop offset='100%25' stop-color='%230D2E22'/></linearGradient></defs><circle cx='50' cy='50' r='48' fill='url(%23gameBg)' stroke='%2310B981' stroke-width='2'/><circle cx='50' cy='41' r='17' fill='%23A7F3D0'/><path d='M26 38 C26 18 74 18 74 38' fill='none' stroke='%2310B981' stroke-width='5' stroke-linecap='round'/><rect x='23' y='34' width='7' height='15' rx='3' fill='%2334D399'/><rect x='70' y='34' width='7' height='15' rx='3' fill='%2334D399'/><path d='M28 46 L38 54' stroke='%2334D399' stroke-width='2.5'/><circle cx='40' cy='55' r='3' fill='%23EF4444'/><circle cx='44' cy='40' r='2.5' fill='%23064E3B'/><circle cx='56' cy='40' r='2.5' fill='%23064E3B'/><path d='M22 88 C22 66 78 66 78 88 Z' fill='%23047857'/></svg>",
  },
  {
    id: 'business_cafe',
    name: 'Quản Lý Shop & Cafe Campus',
    category: 'Kinh Doanh',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='bizBg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%231A150D'/><stop offset='100%25' stop-color='%232B2215'/></linearGradient></defs><circle cx='50' cy='50' r='48' fill='url(%23bizBg)' stroke='%23F59E0B' stroke-width='2'/><circle cx='50' cy='40' r='17' fill='%23FED7AA'/><circle cx='44' cy='39' r='2.5' fill='%23451A03'/><circle cx='56' cy='39' r='2.5' fill='%23451A03'/><path d='M46 48 Q50 51 54 48' stroke='%23B45309' stroke-width='2' fill='none'/><path d='M22 88 C22 65 78 65 78 88 Z' fill='%23451A03'/><polygon points='50,65 44,78 50,88 56,78' fill='%23F59E0B'/><circle cx='50' cy='74' r='2' fill='%23FFFFFF'/></svg>",
  },
  {
    id: 'admin_gold',
    name: 'Quản Trị Viên Tối Cao (Master)',
    category: 'Admin',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='admBg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%232B0606'/><stop offset='100%25' stop-color='%23450A0A'/></linearGradient></defs><circle cx='50' cy='50' r='48' fill='url(%23admBg)' stroke='%23EF4444' stroke-width='2'/><circle cx='50' cy='43' r='17' fill='%23FEE2E2'/><polygon points='34,22 41,31 50,18 59,31 66,22 64,36 36,36' fill='%23FBBF24' stroke='%23D97706' stroke-width='1.5'/><circle cx='44' cy='42' r='2.5' fill='%237F1D1D'/><circle cx='56' cy='42' r='2.5' fill='%237F1D1D'/><path d='M46 51 Q50 55 54 51' stroke='%23DC2626' stroke-width='2' fill='none'/><path d='M22 88 C22 66 78 66 78 88 Z' fill='%23B91C1C'/><path d='M47 68 L50 72 L57 65' stroke='%23FBBF24' stroke-width='2.5' fill='none' stroke-linecap='round'/></svg>",
  },
];

export const AvatarPickerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile, showNotification } = useGigMe();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('TẤT CẢ');
  const [previewAvatar, setPreviewAvatar] = useState<string>(
    currentUser?.avatarUrl || ''
  );
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !currentUser) return null;

  const categories = ['TẤT CẢ', 'Sinh Viên', 'Công Nghệ', 'Thiết Kế', 'Giao Nhận', 'Gaming', 'Kinh Doanh'];

  const filteredPresets =
    selectedCategory === 'TẤT CẢ'
      ? AVATAR_PRESETS
      : AVATAR_PRESETS.filter((p) => p.category === selectedCategory);

  const handleSelectPreset = (url: string) => {
    setPreviewAvatar(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Tập tin không hợp lệ', 'Vui lòng chọn ảnh định dạng JPG, PNG hoặc WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('Ảnh quá lớn', 'Kích thước ảnh tối đa là 5MB.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create an optimized square canvas avatar (256x256)
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 256, 256);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPreviewAvatar(compressedDataUrl);
        }
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = () => {
    updateUserProfile({ avatarUrl: previewAvatar });
    showNotification('Đã cập nhật ảnh đại diện!', 'Ảnh đại diện mới đã được lưu và đồng bộ toàn hệ thống.', true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-[#0F172A] border border-[#1E293B] p-5 sm:p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-[#00E5FF]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Thay Đổi Ảnh Đại Diện</h3>
              <p className="text-[11px] text-slate-400">Chọn avatar mẫu phong cách hoặc tải ảnh cá nhân</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Preview */}
        <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/80">
          <div className="flex items-center space-x-4">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.3)] bg-slate-900 shrink-0">
              {previewAvatar ? (
                <img
                  src={previewAvatar}
                  alt="Preview Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-2xl text-black bg-gradient-to-tr from-[#00E5FF] to-indigo-600">
                  {(currentUser.name || 'G').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-extrabold text-white">{currentUser.name}</div>
              <div className="text-[11px] text-[#00E5FF] font-medium">{currentUser.email || currentUser.phone}</div>
              <div className="text-[10px] text-slate-400 mt-1">Độ phân giải hiển thị chuẩn HD</div>
            </div>
          </div>

          {/* Upload Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition shrink-0"
            >
              <Upload className="w-4 h-4 text-[#00E5FF]" />
              <span>{isProcessing ? 'Đang nén ảnh...' : 'Tải ảnh từ máy'}</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-3 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-[#00E5FF] text-black shadow-md shadow-cyan-500/25'
                  : 'bg-[#131E30] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid of presets */}
        <div className="grid grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
          {filteredPresets.map((preset) => {
            const isSelected = previewAvatar === preset.url;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.url)}
                className={`relative group p-1.5 rounded-2xl border transition text-center flex flex-col items-center ${
                  isSelected
                    ? 'border-[#00E5FF] bg-cyan-500/15 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                    : 'border-slate-800 bg-[#131E30] hover:border-slate-700'
                }`}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden mb-1">
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] text-slate-300 font-semibold truncate w-full">
                  {preset.name}
                </span>
                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#00E5FF] text-black flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Save Actions */}
        <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-end space-x-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800"
          >
            Hủy
          </button>
          <button
            onClick={handleSaveAvatar}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-cyan-500 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/25 hover:brightness-110 transition"
          >
            Lưu Ảnh Đại Diện
          </button>
        </div>
      </div>
    </div>
  );
};
