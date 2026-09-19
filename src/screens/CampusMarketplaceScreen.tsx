import { cloudService } from '../services/cloudSync';
import React, { useState } from 'react';
import {
  BookOpen,
  ShoppingBag,
  Tag,
  Gift,
  Search,
  PlusCircle,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  PhoneCall,
  MessageSquare,
  Sparkles,
  Filter,
  X,
  Lock,
  UploadCloud,
  Trash2,
  Film,
  Image as ImageIcon,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { formatVnd, MarketplaceItemEntity, MarketplaceMediaItem } from '../types';
import { playNotificationSound } from '../utils/audio';

// Dữ liệu chợ KTX: Khởi tạo trống 100% theo dữ liệu thật từ người dùng
const INITIAL_MARKETPLACE_ITEMS: MarketplaceItemEntity[] = [];

export const CampusMarketplaceScreen: React.FC<{
  onOpenChat?: () => void;
  onOpenWallet?: () => void;
}> = ({ onOpenChat, onOpenWallet }) => {
  const { currentUser, showNotification } = useGigMe();
  const [items, setItems] = useState<MarketplaceItemEntity[]>(() => {
    try {
      const saved = localStorage.getItem('gigme_marketplace_items_real_v4');
      return saved ? JSON.parse(saved) : INITIAL_MARKETPLACE_ITEMS;
    } catch {
      return INITIAL_MARKETPLACE_ITEMS;
    }
  });

  // Sync with Firestore Realtime
  React.useEffect(() => {
    const unsub = cloudService.subscribeMarketplace((cloudItems) => {
      if (cloudItems) {
        setItems(cloudItems);
      }
    });
    return () => unsub();
  }, []);

  // Save to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('gigme_marketplace_items_real_v4', JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [dealFilter, setDealFilter] = useState<'ALL' | 'UNDER_50K' | 'FREE' | 'DORM'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New item form states
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState(0);
  const [newCategory, setNewCategory] = useState<'TEXTBOOK' | 'TECH' | 'STATIONERY' | 'FREE_DONATION' | 'HOUSING_ESSENTIAL'>('TEXTBOOK');
  const [newCondition, setNewCondition] = useState<'NEW_99' | 'GOOD_90' | 'FAIR_80'>('NEW_99');
  const [newSchool, setNewSchool] = useState('ĐH Tôn Đức Thắng (TDTU)');
  const [newDescription, setNewDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<MarketplaceMediaItem[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    fileList.forEach((file) => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (!isImage && !isVideo) {
        showNotification('Định dạng không hỗ trợ', `Tệp "${file.name}" không phải là ảnh hoặc video.`, false);
        return;
      }

      if (file.size > 25 * 1024 * 1024) {
        showNotification('Tệp quá lớn', `Tệp "${file.name}" vượt quá 25MB.`, false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result as string;
        if (result) {
          const newMedia: MarketplaceMediaItem = {
            id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            type: isVideo ? 'video' : 'image',
            url: result,
            name: file.name,
          };
          setUploadedFiles((prev) => [...prev, newMedia]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeUploadedFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const CATEGORIES = [
    { id: 'ALL', label: 'Tất cả đồ dùng' },
    { id: 'TEXTBOOK', label: '📚 Giáo trình & Sách' },
    { id: 'FREE_DONATION', label: '🎁 Tặng Miễn Phí (0đ)' },
    { id: 'TECH', label: '💻 Đồ công nghệ & Casio' },
    { id: 'HOUSING_ESSENTIAL', label: '🏠 Đồ dùng KTX' },
    { id: 'STATIONERY', label: '✏️ Văn phòng phẩm & Dụng cụ' },
  ];

  const filteredItems = items.filter((item) => {
    const matchCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.schoolName.toLowerCase().includes(searchQuery.toLowerCase());

    let matchDeal = true;
    if (dealFilter === 'UNDER_50K') {
      matchDeal = item.price > 0 && item.price <= 50000;
    } else if (dealFilter === 'FREE') {
      matchDeal = item.price === 0;
    } else if (dealFilter === 'DORM') {
      matchDeal = item.category === 'HOUSING_ESSENTIAL' || item.description.toLowerCase().includes('ktx') || item.title.toLowerCase().includes('ktx');
    }

    return matchCategory && matchSearch && matchDeal;
  });

  const handleEscrowHold = (item: MarketplaceItemEntity) => {
    if (item.price > 0 && currentUser && currentUser.walletBalance < item.price) {
      playNotificationSound('SOFT_VIBRATE');
      showNotification(
        '⚠️ Số dư ví chưa đủ',
        `Bạn cần có tối thiểu ${formatVnd(item.price)} trong Ví để cọc giữ món qua Smart Escrow. Hãy nạp thêm tiền vào ví!`,
        false
      );
      if (onOpenWallet) onOpenWallet();
      return;
    }

    playNotificationSound('ESCROW_LOCK');
    const updatedItem: MarketplaceItemEntity = { ...item, status: 'RESERVED' };
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? updatedItem : i))
    );
    cloudService.saveMarketplaceItem(updatedItem);

    showNotification(
      '🔒 Đã đặt cọc giữ món thành công qua Smart Escrow!',
      item.price === 0
        ? `Bạn đã đăng ký nhận món quà tặng "${item.title}". Người cho sẽ liên hệ để bàn giao!`
        : `Số tiền ${formatVnd(item.price)} đã được bảo chứng trên Smart Escrow. Khi bạn gặp mặt kiểm tra hàng xong, tiền mới giải ngân cho người bán!`,
      true,
      true
    );
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playNotificationSound('SUCCESS_CHIME');

    const firstImage = uploadedFiles.find((f) => f.type === 'image');
    const firstVideo = uploadedFiles.find((f) => f.type === 'video');
    const defaultPlaceholder =
      newCategory === 'TEXTBOOK'
        ? 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80';

    const newItem: MarketplaceItemEntity = {
      id: `item_${Date.now()}`,
      title: newTitle,
      description: newDescription,
      category: newCategory,
      price: Number(newPrice),
      originalPrice: Number(newPrice) * 2 || 100000,
      condition: newCondition,
      schoolName: newSchool,
      sellerId: currentUser?.id || 's_user',
      sellerName: currentUser?.name || 'Sinh viên GigMe',
      sellerPhone: currentUser?.phone || '0909***123',
      status: 'AVAILABLE',
      imageUrl: firstImage ? firstImage.url : firstVideo ? 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80' : defaultPlaceholder,
      mediaFiles: uploadedFiles,
      createdAt: Date.now(),
    };

    setItems([newItem, ...items]);
    cloudService.saveMarketplaceItem(newItem);
    setShowCreateModal(false);
    setNewTitle('');
    setNewDescription('');
    setUploadedFiles([]);
    showNotification(
      '🎉 Đăng thanh lý thành công!',
      `Món đồ "${newTitle}" kèm ${uploadedFiles.length} tệp phương tiện đã được đưa lên Khu Vực Thanh Lý Đồ Cũ Sinh Viên.`,
      true,
      true
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28 text-white space-y-6 animate-fade-in">
      {/* Header Banner with Brand Proportional Style: Cobalt 60%, Crystal 30%, Ethereal 10% */}
      <div className="rounded-3xl bg-gradient-to-r from-[#18345E] via-[#0F1E36] to-[#0A1424] border border-[#C5E5EC]/25 p-6 shadow-2xl relative overflow-hidden">
        {/* Left Decorative Proportional Brand Gradient Bar */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-brand-tri-gradient" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#3064AE]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pl-2">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#3064AE]/25 border border-[#C5E5EC]/30 text-[#C5E5EC] text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#E0FAEB] inline-block mr-1 shadow-xs" />
              <ShoppingBag className="w-4 h-4 text-[#C5E5EC]" />
              <span>Campus Flea Market • Chợ Đồ Cũ Sinh Viên</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Khu Vực Thanh Lý Đồ Cũ Sinh Viên
            </h1>
            <p className="text-xs text-[#C5E5EC]/85 max-w-lg">
              Săn giáo trình cũ, bàn ghế KTX, đồ công nghệ, đồ gia dụng giá sinh viên hoặc nhận đồ tặng 0đ. 100% an tâm với Smart Escrow bảo chứng giao dịch!
            </p>
          </div>

          <button
            onClick={() => {
              playNotificationSound('BUTTON_CLICK');
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#3064AE] via-[#437DD2] to-[#C5E5EC] text-white font-extrabold text-xs hover:brightness-110 shadow-lg shadow-[#3064AE]/30 transition flex items-center space-x-1.5 shrink-0 border border-[#E0FAEB]/30 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Đăng Thanh Lý / Cho 0đ</span>
          </button>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="space-y-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Tìm giáo trình, máy tính Casio, áo blouse, đồ KTX..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 text-xs text-white placeholder:text-slate-500 focus:border-[#3064AE]"
          />
        </div>

        {/* Flea Market Quick Filter Tags */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Bộ lọc nhanh:</span>
          <button
            onClick={() => {
              playNotificationSound('BUTTON_CLICK');
              setDealFilter('ALL');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition ${
              dealFilter === 'ALL'
                ? 'bg-[#3064AE] text-white shadow-sm border border-[#C5E5EC]/40'
                : 'bg-[#0E1B2E] text-slate-300 border border-[#C5E5EC]/15 hover:border-[#C5E5EC]/30'
            }`}
          >
            🔥 Tất cả đồ thanh lý
          </button>
          <button
            onClick={() => {
              playNotificationSound('BUTTON_CLICK');
              setDealFilter('UNDER_50K');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition ${
              dealFilter === 'UNDER_50K'
                ? 'bg-[#3064AE] text-white shadow-sm border border-[#C5E5EC]/40'
                : 'bg-[#0E1B2E] text-slate-300 border border-[#C5E5EC]/15 hover:border-[#C5E5EC]/30'
            }`}
          >
            🏷️ Đồng giá &lt; 50.000đ
          </button>
          <button
            onClick={() => {
              playNotificationSound('BUTTON_CLICK');
              setDealFilter('FREE');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition ${
              dealFilter === 'FREE'
                ? 'bg-[#3064AE] text-[#E0FAEB] shadow-sm border border-[#E0FAEB]/40'
                : 'bg-[#0E1B2E] text-slate-300 border border-[#C5E5EC]/15 hover:border-[#C5E5EC]/30'
            }`}
          >
            🎁 Tặng Miễn Phí (0đ)
          </button>
          <button
            onClick={() => {
              playNotificationSound('BUTTON_CLICK');
              setDealFilter('DORM');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition ${
              dealFilter === 'DORM'
                ? 'bg-[#3064AE] text-white shadow-sm border border-[#C5E5EC]/40'
                : 'bg-[#0E1B2E] text-slate-300 border border-[#C5E5EC]/15 hover:border-[#C5E5EC]/30'
            }`}
          >
            🏠 Dọn phòng Ký túc xá
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                playNotificationSound('BUTTON_CLICK');
                setCategoryFilter(c.id);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                categoryFilter === c.id
                  ? 'bg-[#3064AE] text-white shadow-md shadow-[#3064AE]/30 border border-[#C5E5EC]/40 font-black'
                  : 'bg-[#101D30] border border-[#C5E5EC]/15 text-slate-300 hover:border-[#C5E5EC]/30'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="rounded-3xl bg-gradient-to-b from-[#111F35] to-[#0C1626] border border-[#C5E5EC]/20 overflow-hidden shadow-xl flex flex-col justify-between group hover:border-[#C5E5EC]/50 transition duration-200 relative"
          >
            {/* Top Brand Accent Stripe */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#3064AE] via-[#C5E5EC] to-[#E0FAEB] opacity-70 group-hover:opacity-100 transition-opacity z-20" />
            <div>
              {/* Image & Badges */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute top-2 left-2 flex gap-1">
                  {item.price === 0 ? (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-black font-black text-[10px] shadow">
                      TẶNG 0Đ
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-sm text-emerald-400 font-mono font-bold text-[11px] border border-emerald-500/30">
                      {formatVnd(item.price)}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-lg bg-[#0F172A]/90 text-cyan-300 font-bold text-[10px] border border-slate-700">
                    {item.condition === 'NEW_99' ? 'Mới 99%' : 'Tốt 90%'}
                  </span>
                </div>

                {/* Media Files Indicators */}
                {item.mediaFiles && item.mediaFiles.length > 0 && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
                    {item.mediaFiles.some((m) => m.type === 'video') && (
                      <span className="px-2 py-0.5 rounded-md bg-red-600/90 text-white font-bold text-[9px] flex items-center gap-1 shadow">
                        <Film className="w-2.5 h-2.5" /> Video
                      </span>
                    )}
                    {item.mediaFiles.length > 1 && (
                      <span className="px-2 py-0.5 rounded-md bg-black/80 text-emerald-300 font-bold text-[9px] flex items-center gap-1 shadow backdrop-blur-sm border border-emerald-500/30">
                        <ImageIcon className="w-2.5 h-2.5" /> +{item.mediaFiles.length} tệp
                      </span>
                    )}
                  </div>
                )}

                {item.status === 'RESERVED' && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center">
                    <span className="px-3 py-1 rounded-xl bg-amber-500 text-black font-extrabold text-xs shadow-lg">
                      ĐÃ ĐẶT CỌC GIỮ MÓN
                    </span>
                  </div>
                )}
              </div>

              {/* Info Body */}
              <div className="p-4 space-y-2 text-xs">
                <h3 className="font-extrabold text-sm text-white line-clamp-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="flex items-center space-x-1 text-[11px] text-slate-300 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="line-clamp-1">{item.schoolName}</span>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-4 pt-0 border-t border-slate-800/80 mt-2">
              <div className="flex items-center justify-between py-2 text-[11px] text-slate-400">
                <span>Người đăng: <strong>{item.sellerName}</strong></span>
                <span className="text-emerald-400 font-bold flex items-center space-x-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Escrow Bảo Lãnh</span>
                </span>
              </div>

              <button
                disabled={item.status === 'RESERVED'}
                onClick={() => handleEscrowHold(item)}
                className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition flex items-center justify-center space-x-1.5 shadow-md ${
                  item.status === 'RESERVED'
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : item.price === 0
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black hover:brightness-110 shadow-emerald-500/20'
                    : 'bg-[#131E30] hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {item.price === 0 ? (
                  <>
                    <Gift className="w-4 h-4" />
                    <span>Nhận Quà Tặng 0đ Ngay</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Đặt Cọc Giữ Món (Escrow)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State when no real items exist */}
      {filteredItems.length === 0 && (
        <div className="rounded-3xl bg-[#0F172A] border border-slate-800 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-white">Chợ KTX hiện chưa có tin đăng nào</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tất cả dữ liệu đều là thật từ sinh viên và cộng đồng. Bạn có giáo trình cũ, máy tính, hoặc đồ dùng không dùng tới? Hãy là người đầu tiên đăng bài!
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 transition flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Đăng Thanh Lý Hoặc Tặng 0đ Ngay</span>
          </button>
        </div>
      )}

      {/* Modal: Create Item Listing */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-[#0F172A] border-2 border-emerald-500/40 p-6 text-white shadow-2xl my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm text-white">Đăng Bán / Tặng Giáo Trình & Đồ Dùng</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tên món đồ / Tên sách giáo trình</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giáo trình Giải tích 2 ĐH Bách Khoa"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white"
                />
              </div>

              {/* Gửi file: Ảnh và Video, hỗ trợ nhiều file, có thể xóa khi nhầm file */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">
                    Đính kèm hình ảnh & video thực tế
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {uploadedFiles.length > 0 ? `${uploadedFiles.length} tệp đã chọn` : 'Chấp nhận ảnh/video'}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-emerald-500/40 rounded-2xl bg-[#131E30]/50 hover:bg-[#131E30] hover:border-emerald-400 transition cursor-pointer text-center group">
                    <div className="flex items-center space-x-2 text-emerald-400 mb-1">
                      <UploadCloud className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                        Bấm để chọn hoặc kéo thả tệp
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Tải lên nhiều ảnh (JPG, PNG, WEBP) hoặc video (MP4, MOV). Có thể xóa khi chọn nhầm!
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Danh sách file đã tải lên kèm xem trước và nút xóa */}
                  {uploadedFiles.length > 0 && (
                    <div className="grid grid-cols-3 gap-2.5 pt-1">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="relative group rounded-xl overflow-hidden border border-slate-700 bg-black aspect-square flex items-center justify-center shadow-md"
                        >
                          {file.type === 'image' ? (
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950">
                              <video src={file.url} className="w-full h-full object-cover" />
                              <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] text-emerald-300 font-bold flex items-center shadow">
                                <Film className="w-3 h-3 mr-0.5 text-red-400" /> Video
                              </span>
                            </div>
                          )}

                          {/* Nút xóa file khi nhầm file */}
                          <button
                            type="button"
                            onClick={() => removeUploadedFile(file.id)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-red-600/90 hover:bg-red-500 text-white shadow-lg transition-transform transform active:scale-90"
                            title="Xóa tệp này (khi nhầm file)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="absolute bottom-0 inset-x-0 bg-black/75 px-1 py-0.5 text-[9px] text-slate-200 truncate">
                            {file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Danh mục</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white"
                  >
                    <option value="TEXTBOOK">Giáo trình & Sách</option>
                    <option value="FREE_DONATION">Tặng Miễn Phí (0đ)</option>
                    <option value="TECH">Đồ công nghệ</option>
                    <option value="HOUSING_ESSENTIAL">Đồ dùng KTX</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Giá mong muốn (0đ nếu tặng)
                  </label>
                  <input
                    type="number"
                    step="5000"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 font-mono font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tình trạng món đồ</label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white"
                  >
                    <option value="NEW_99">Mới 99% (Rất đẹp)</option>
                    <option value="GOOD_90">Còn tốt 90%</option>
                    <option value="FAIR_80">Dùng được 80%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Khu vực / Trường Đại học</label>
                  <input
                    type="text"
                    required
                    value={newSchool}
                    onChange={(e) => setNewSchool(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mô tả chi tiết & Điểm hẹn giao dịch</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ghi chú chi tiết về tình trạng, thời gian có thể hẹn gặp..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-extrabold text-sm hover:brightness-110 shadow-lg shadow-emerald-500/25 transition"
              >
                Đăng Món Đồ Lên Diễn Đàn Ngay
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
