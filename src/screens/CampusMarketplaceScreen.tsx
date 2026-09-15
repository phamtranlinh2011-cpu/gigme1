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
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { formatVnd, MarketplaceItemEntity } from '../types';
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
      imageUrl:
        newCategory === 'TEXTBOOK'
          ? 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80',
      createdAt: Date.now(),
    };

    setItems([newItem, ...items]);
    cloudService.saveMarketplaceItem(newItem);
    setShowCreateModal(false);
    setNewTitle('');
    setNewDescription('');
    showNotification(
      '🎉 Đăng thanh lý thành công!',
      `Món đồ "${newTitle}" đã được đưa lên Khu Vực Thanh Lý Đồ Cũ Sinh Viên. Sinh viên quanh campus sẽ nhận thông báo!`,
      true,
      true
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28 text-white space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#101D33] via-[#0B1322] to-[#070D18] border-2 border-emerald-500/40 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <ShoppingBag className="w-4 h-4" />
              <span>Campus Flea Market • Chợ Đồ Cũ Sinh Viên</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Khu Vực Thanh Lý Đồ Cũ Sinh Viên
            </h1>
            <p className="text-xs text-slate-300 max-w-lg">
              Săn giáo trình cũ, bàn ghế KTX, đồ công nghệ, đồ gia dụng giá sinh viên hoặc nhận đồ tặng 0đ. 100% an tâm với Smart Escrow bảo chứng giao dịch!
            </p>
          </div>

          <button
            onClick={() => {
              playNotificationSound('BUTTON_CLICK');
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-extrabold text-xs hover:brightness-110 shadow-lg shadow-emerald-500/25 transition flex items-center space-x-1.5 shrink-0"
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
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0F172A] border border-slate-700 text-xs text-white placeholder:text-slate-500"
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
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'bg-[#131E30] text-slate-300 border border-slate-700 hover:border-slate-500'
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
                ? 'bg-amber-400 text-black shadow-sm'
                : 'bg-[#131E30] text-slate-300 border border-slate-700 hover:border-slate-500'
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
                ? 'bg-emerald-400 text-black shadow-sm'
                : 'bg-[#131E30] text-slate-300 border border-slate-700 hover:border-slate-500'
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
                ? 'bg-purple-400 text-black shadow-sm'
                : 'bg-[#131E30] text-slate-300 border border-slate-700 hover:border-slate-500'
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
                  ? 'bg-emerald-400 text-black shadow-md shadow-emerald-500/20'
                  : 'bg-[#0F172A] border border-slate-700 text-slate-300 hover:border-slate-500'
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
            className="rounded-3xl bg-[#0F172A] border border-slate-800 overflow-hidden shadow-xl flex flex-col justify-between group hover:border-emerald-500/40 transition duration-200"
          >
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
