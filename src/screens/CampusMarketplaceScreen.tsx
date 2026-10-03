import { cloudService } from '../services/cloudSync';
import React, { useState, useEffect, useMemo } from 'react';
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
  Share2,
  RotateCcw,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { formatVnd, MarketplaceItemEntity, MarketplaceMediaItem } from '../types';
import { playNotificationSound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

// Dữ liệu chợ KTX: Khởi tạo trống 100% theo dữ liệu thật từ người dùng
const INITIAL_MARKETPLACE_ITEMS: MarketplaceItemEntity[] = [];

export const CampusMarketplaceScreen: React.FC<{
  onOpenChat?: () => void;
  onOpenWallet?: () => void;
  onOpenLaw?: () => void;
}> = ({ onOpenChat, onOpenWallet, onOpenLaw }) => {
  const { currentUser, showNotification, sendChat, updateUserProfile } = useGigMe();
  const [items, setItems] = useState<MarketplaceItemEntity[]>(() => {
    try {
      const saved = localStorage.getItem('gigme_marketplace_items_real_v4');
      return saved ? JSON.parse(saved) : INITIAL_MARKETPLACE_ITEMS;
    } catch {
      return INITIAL_MARKETPLACE_ITEMS;
    }
  });

  // Sync with Firestore Realtime
  useEffect(() => {
    const unsub = cloudService.subscribeMarketplace((cloudItems) => {
      if (cloudItems) {
        setItems(cloudItems);
      }
    });
    return () => unsub();
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gigme_marketplace_items_real_v4', JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [dealFilter, setDealFilter] = useState<'ALL' | 'UNDER_50K' | 'FREE' | 'DORM' | 'RESERVED'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'RESERVED' | 'SOLD'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC'>('NEWEST');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<MarketplaceItemEntity | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync selectedItemForDetail with updated items list if changed in real-time
  useEffect(() => {
    if (selectedItemForDetail) {
      const freshItem = items.find((i) => i.id === selectedItemForDetail.id);
      if (freshItem) {
        setSelectedItemForDetail(freshItem);
      }
    }
  }, [items]);

  const handleChatWithSeller = (item: MarketplaceItemEntity) => {
    triggerHaptic('light');
    if (!currentUser) {
      showNotification('Vui lòng đăng nhập', 'Bạn cần đăng nhập để trò chuyện với người bán.');
      return;
    }
    if (item.sellerId === currentUser.id) {
      showNotification('Món đồ của bạn', 'Đây là món đồ do chính bạn đăng bán!');
      return;
    }

    sendChat(
      `Chào bạn, mình quan tâm món đồ "${item.title}" (${item.price === 0 ? 'Tặng miễn phí 0đ' : formatVnd(item.price)}) bạn đang đăng trên Chợ KTX!`,
      'NONE',
      null,
      0,
      undefined,
      undefined,
      item.sellerId,
      item.sellerName
    );

    showNotification('Đã mở cuộc trò chuyện 💬', `Đang chuyển sang phòng chat với ${item.sellerName}...`);
    if (onOpenChat) {
      onOpenChat();
    }
  };

  const handleDeleteItem = async (itemId: string, itemTitle: string) => {
    triggerHaptic('medium');
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    await cloudService.deleteMarketplaceItem(itemId);
    showNotification('Đã gỡ bài đăng', `Đã xóa "${itemTitle}" khỏi Chợ KTX.`);
    if (selectedItemForDetail?.id === itemId) {
      setSelectedItemForDetail(null);
    }
  };

  // Cọc giữ món qua Smart Escrow
  const handleEscrowHold = (item: MarketplaceItemEntity) => {
    if (!currentUser) {
      showNotification('Cần đăng nhập', 'Vui lòng đăng nhập để đặt cọc giữ món.');
      return;
    }

    if (item.sellerId === currentUser.id) {
      triggerHaptic('error');
      showNotification('Món đồ của bạn', 'Bạn là người đăng món đồ này nên không thể tự đặt cọc giữ chỗ!', false);
      return;
    }

    if (item.status === 'RESERVED') {
      showNotification('Đã có người cọc', 'Món đồ này hiện đã có người cọc giữ chỗ!');
      return;
    }

    if (item.price > 0 && currentUser.walletBalance < item.price) {
      playNotificationSound('SOFT_VIBRATE');
      showNotification(
        '⚠️ Số dư ví chưa đủ',
        `Bạn cần có tối thiểu ${formatVnd(item.price)} trong Ví để cọc giữ món qua Smart Escrow. Hiện tại số dư: ${formatVnd(currentUser.walletBalance)}. Hãy nạp thêm tiền vào ví!`,
        false
      );
      if (onOpenWallet) onOpenWallet();
      return;
    }

    playNotificationSound('ESCROW_LOCK');
    triggerHaptic('success');

    // Khóa tiền ký quỹ thực tế từ ví nếu là món có phí
    if (item.price > 0) {
      updateUserProfile({
        walletBalance: currentUser.walletBalance - item.price,
        escrowLockedBalance: (currentUser.escrowLockedBalance || 0) + item.price,
      });
    }

    const updatedItem: MarketplaceItemEntity = {
      ...item,
      status: 'RESERVED',
    };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));
    cloudService.saveMarketplaceItem(updatedItem);

    if (selectedItemForDetail?.id === item.id) {
      setSelectedItemForDetail(updatedItem);
    }

    showNotification(
      '🔒 Đã đặt cọc giữ món qua Smart Escrow!',
      item.price === 0
        ? `Bạn đã đăng ký nhận quà tặng "${item.title}". Hãy liên hệ người tặng để hẹn nhận tại KTX!`
        : `Số tiền ${formatVnd(item.price)} đã được phong tỏa trong Quỹ Smart Escrow. Tiền chỉ giải ngân khi bạn gặp mặt kiểm tra hàng xong!`,
      true,
      true
    );
  };

  // Hoàn tất giao dịch (Đã nhận đồ -> giải ngân & đánh dấu SOLD)
  const handleCompleteHandover = (item: MarketplaceItemEntity) => {
    triggerHaptic('success');
    playNotificationSound('SUCCESS_CHIME');

    // Nếu người mua đang giữ escrow thì giải ngân
    if (item.price > 0 && currentUser && (currentUser.escrowLockedBalance || 0) >= item.price) {
      updateUserProfile({
        escrowLockedBalance: Math.max(0, (currentUser.escrowLockedBalance || 0) - item.price),
      });
    }

    const updatedItem: MarketplaceItemEntity = {
      ...item,
      status: 'SOLD',
    };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));
    cloudService.saveMarketplaceItem(updatedItem);

    if (selectedItemForDetail?.id === item.id) {
      setSelectedItemForDetail(updatedItem);
    }

    showNotification(
      '🎉 Giao dịch hoàn tất thành công!',
      `Đã xác nhận nhận món đồ "${item.title}". Smart Escrow đã hoàn tất giải ngân an toàn.`,
      true,
      true
    );
  };

  // Hủy cọc giữ món (hoàn tiền lại ví)
  const handleCancelReservation = (item: MarketplaceItemEntity) => {
    triggerHaptic('medium');

    // Hoàn lại tiền từ escrowLockedBalance về walletBalance
    if (item.price > 0 && currentUser && (currentUser.escrowLockedBalance || 0) >= item.price) {
      updateUserProfile({
        walletBalance: currentUser.walletBalance + item.price,
        escrowLockedBalance: Math.max(0, (currentUser.escrowLockedBalance || 0) - item.price),
      });
    }

    const updatedItem: MarketplaceItemEntity = {
      ...item,
      status: 'AVAILABLE',
    };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));
    cloudService.saveMarketplaceItem(updatedItem);

    if (selectedItemForDetail?.id === item.id) {
      setSelectedItemForDetail(updatedItem);
    }

    showNotification(
      'Đã hủy cọc giữ chỗ ↩️',
      item.price > 0
        ? `Đã hoàn trả ${formatVnd(item.price)} về số dư ví khả dụng của bạn. Món đồ đã mở lại cho người khác!`
        : `Đã hủy nhận món đồ. Món đồ đã mở lại cho sinh viên khác.`,
      true,
      false
    );
  };

  // Đổi trạng thái bởi người bán hoặc Admin
  const handleToggleStatusBySeller = (item: MarketplaceItemEntity, newStatus: 'AVAILABLE' | 'SOLD') => {
    triggerHaptic('medium');
    const updatedItem: MarketplaceItemEntity = { ...item, status: newStatus };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));
    cloudService.saveMarketplaceItem(updatedItem);
    if (selectedItemForDetail?.id === item.id) {
      setSelectedItemForDetail(updatedItem);
    }
    showNotification(
      'Đã cập nhật trạng thái',
      newStatus === 'SOLD'
        ? `Đã đánh dấu "${item.title}" là Đã bán / Đã tặng.`
        : `Đã mở lại trạng thái Mở Bán cho "${item.title}".`
    );
  };

  // Share item link
  const handleShareItem = (item: MarketplaceItemEntity) => {
    triggerHaptic('light');
    const text = `[Chợ KTX GigMe] ${item.title} - Giá: ${item.price === 0 ? 'Tặng 0đ' : formatVnd(item.price)} tại ${item.schoolName}. Escrow bảo lãnh 100%!`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    showNotification('Đã sao chép liên kết!', 'Thông tin món đồ đã được lưu vào bộ nhớ tạm.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // New item form states
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState(0);
  const [newCategory, setNewCategory] = useState<
    'TEXTBOOK' | 'TECH' | 'STATIONERY' | 'FREE_DONATION' | 'HOUSING_ESSENTIAL'
  >('TEXTBOOK');
  const [newCondition, setNewCondition] = useState<'NEW_99' | 'GOOD_90' | 'FAIR_80'>('NEW_99');
  const [newSchool, setNewSchool] = useState('Ký túc xá Khu B ĐHQG TP.HCM');
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

  const filteredItems = useMemo(() => {
    const list = items.filter((item) => {
      // Category filter
      const matchCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

      // Search query
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sellerName.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      let matchStatus = true;
      if (statusFilter !== 'ALL') {
        matchStatus = item.status === statusFilter;
      }

      // Deal filter
      let matchDeal = true;
      if (dealFilter === 'UNDER_50K') {
        matchDeal = item.price > 0 && item.price <= 50000;
      } else if (dealFilter === 'FREE') {
        matchDeal = item.price === 0;
      } else if (dealFilter === 'DORM') {
        const dormKeywords = ['ktx', 'ký túc xá', 'phòng', 'bàn học', 'quạt', 'đèn', 'nệm'];
        matchDeal =
          item.category === 'HOUSING_ESSENTIAL' ||
          dormKeywords.some(
            (kw) =>
              item.description.toLowerCase().includes(kw) ||
              item.title.toLowerCase().includes(kw) ||
              item.schoolName.toLowerCase().includes(kw)
          );
      } else if (dealFilter === 'RESERVED') {
        matchDeal = item.status === 'RESERVED';
      }

      return matchCategory && matchSearch && matchStatus && matchDeal;
    });

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === 'PRICE_ASC') return a.price - b.price;
      if (sortBy === 'PRICE_DESC') return b.price - a.price;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [items, categoryFilter, searchQuery, statusFilter, dealFilter, sortBy]);

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
      title: newTitle.trim(),
      description: newDescription.trim(),
      category: newCategory,
      price: Number(newPrice),
      originalPrice: Number(newPrice) * 2 || 100000,
      condition: newCondition,
      schoolName: newSchool.trim(),
      sellerId: currentUser?.id || 's_user',
      sellerName: currentUser?.name || 'Sinh viên GigMe',
      sellerPhone: currentUser?.phone || '0909***123',
      status: 'AVAILABLE',
      imageUrl: firstImage
        ? firstImage.url
        : firstVideo
        ? 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80'
        : defaultPlaceholder,
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
      `Món đồ "${newTitle}" kèm ${uploadedFiles.length} tệp phương tiện đã được đưa lên Chợ KTX Sinh Viên.`,
      true,
      true
    );
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'TEXTBOOK':
        return '📚 Giáo trình & Sách';
      case 'TECH':
        return '💻 Công nghệ & Casio';
      case 'STATIONERY':
        return '✏️ Văn phòng phẩm';
      case 'FREE_DONATION':
        return '🎁 Tặng miễn phí (0đ)';
      case 'HOUSING_ESSENTIAL':
        return '🏠 Đồ dùng KTX';
      default:
        return '📦 Đồ dùng sinh viên';
    }
  };

  const getConditionLabel = (cond: string) => {
    switch (cond) {
      case 'NEW_99':
        return 'Mới 99% (Rất đẹp)';
      case 'GOOD_90':
        return 'Còn tốt 90%';
      case 'FAIR_80':
        return 'Dùng được 80%';
      default:
        return 'Đã qua sử dụng';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28 text-white space-y-6 animate-fade-in">
      {/* Header Banner with Brand Proportional Style: Cobalt 60%, Crystal 30%, Ethereal 10% */}
      <div className="rounded-3xl bg-gradient-to-r from-[#18345E] via-[#0F1E36] to-[#0A1424] border border-[#C5E5EC]/25 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
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
              Chợ Đồ Cũ &amp; Giáo Trình KTX
            </h1>
            <p className="text-xs text-[#C5E5EC]/85 max-w-lg leading-relaxed">
              Săn giáo trình cũ, bàn học KTX, máy tính Casio, đồ gia dụng giá sinh viên hoặc nhận đồ tặng 0đ. 100% an tâm với Smart Escrow bảo chứng giao dịch theo <strong>Điều 18 Bộ Luật Campus</strong>!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
            {onOpenLaw && (
              <button
                onClick={onOpenLaw}
                className="px-3.5 py-2.5 rounded-2xl bg-[#0E1B2E] hover:bg-[#13243C] text-[#C5E5EC] font-bold text-xs border border-[#C5E5EC]/25 transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                title="Xem Điều 18: Quy chế Chợ KTX"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Quy Chế Chợ</span>
              </button>
            )}

            <button
              onClick={() => {
                playNotificationSound('BUTTON_CLICK');
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#3064AE] via-[#437DD2] to-[#C5E5EC] text-white font-extrabold text-xs hover:brightness-110 shadow-lg shadow-[#3064AE]/30 transition flex items-center justify-center space-x-1.5 border border-[#E0FAEB]/30 cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Đăng Bán / Tặng 0đ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#C5E5EC]/60 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Tìm giáo trình, máy tính Casio, áo blouse, đồ KTX, phòng ký túc xá..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-20 py-2.5 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 text-xs text-white placeholder:text-[#C5E5EC]/40 focus:border-[#3064AE] focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 px-2 py-0.5 text-[10px] font-bold rounded-lg bg-white/10 hover:bg-white/20 text-[#C5E5EC] transition"
              >
                Xóa tìm
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 text-xs text-[#C5E5EC] font-bold focus:outline-none"
            >
              <option value="NEWEST">Mới nhất trước</option>
              <option value="PRICE_ASC">Giá: Thấp &rarr; Cao</option>
              <option value="PRICE_DESC">Giá: Cao &rarr; Thấp</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Deal Tags */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs touch-pan-x">
          <span className="text-[11px] font-bold text-[#C5E5EC]/70 uppercase tracking-wider shrink-0">Bộ lọc:</span>
          <button
            onClick={() => {
              triggerHaptic('light');
              setDealFilter('ALL');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition cursor-pointer ${
              dealFilter === 'ALL'
                ? 'bg-[#3064AE] text-white shadow-sm border border-[#C5E5EC]/40'
                : 'bg-[#0E1B2E] text-slate-300 border border-[#C5E5EC]/15 hover:border-[#C5E5EC]/30'
            }`}
          >
            🔥 Tất cả
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              setDealFilter('FREE');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition cursor-pointer ${
              dealFilter === 'FREE'
                ? 'bg-emerald-600 text-white shadow-sm border border-emerald-400/40'
                : 'bg-[#0E1B2E] text-slate-300 border border-[#C5E5EC]/15 hover:border-[#C5E5EC]/30'
            }`}
          >
            🎁 Tặng Miễn Phí (0đ)
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              setDealFilter('UNDER_50K');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition cursor-pointer ${
              dealFilter === 'UNDER_50K'
                ? 'bg-[#3064AE] text-white shadow-sm border border-[#C5E5EC]/40'
                : 'bg-[#0E1B2E] text-slate-300 border border-[#C5E5EC]/15 hover:border-[#C5E5EC]/30'
            }`}
          >
            🏷️ Dưới 50.000đ
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              setDealFilter('DORM');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition cursor-pointer ${
              dealFilter === 'DORM'
                ? 'bg-[#3064AE] text-white shadow-sm border border-[#C5E5EC]/40'
                : 'bg-[#0E1B2E] text-slate-300 border border-[#C5E5EC]/15 hover:border-[#C5E5EC]/30'
            }`}
          >
            🏠 Dọn Ký túc xá
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              setDealFilter('RESERVED');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition cursor-pointer ${
              dealFilter === 'RESERVED'
                ? 'bg-amber-600 text-white shadow-sm border border-amber-400/40'
                : 'bg-[#0E1B2E] text-slate-300 border border-[#C5E5EC]/15 hover:border-[#C5E5EC]/30'
            }`}
          >
            🔒 Đang cọc giữ món
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                triggerHaptic('light');
                setCategoryFilter(c.id);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
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
            className="rounded-3xl bg-gradient-to-b from-[#111F35] to-[#0C1626] border border-[#C5E5EC]/20 overflow-hidden shadow-xl flex flex-col justify-between group hover:border-[#C5E5EC]/50 transition duration-200 relative cursor-pointer"
            onClick={() => {
              triggerHaptic('light');
              setSelectedItemForDetail(item);
              setActiveMediaIndex(0);
            }}
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
                <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
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
                    {item.condition === 'NEW_99' ? 'Mới 99%' : item.condition === 'GOOD_90' ? 'Tốt 90%' : '80%'}
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
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-15">
                    <span className="px-3 py-1 rounded-xl bg-amber-500 text-black font-black text-xs shadow-lg flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> ĐÃ ĐẶT CỌC GIỮ MÓN
                    </span>
                  </div>
                )}

                {item.status === 'SOLD' && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-15">
                    <span className="px-3 py-1 rounded-xl bg-slate-700 text-slate-200 font-black text-xs shadow-lg flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> ĐÃ BÀN GIAO XONG
                    </span>
                  </div>
                )}
              </div>

              {/* Info Body */}
              <div className="p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[10px] text-[#C5E5EC]/70">
                  <span className="font-bold text-amber-300">{getCategoryLabel(item.category)}</span>
                  <span>{new Date(item.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                </div>

                <h3 className="font-extrabold text-sm text-white line-clamp-2 leading-snug group-hover:text-emerald-300 transition-colors">
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
            <div className="p-4 pt-0 border-t border-slate-800/80 mt-2 space-y-2">
              <div className="flex items-center justify-between py-1 text-[11px] text-slate-400">
                <div className="flex items-center space-x-1.5 truncate max-w-[65%]">
                  <span className="truncate">Người đăng: <strong className="text-white">{item.sellerName}</strong></span>
                  {(currentUser?.id === item.sellerId || currentUser?.role === 'ADMIN' || currentUser?.id === '000000000') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id, item.title);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition cursor-pointer"
                      title="Gỡ tin đăng này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <span className="text-emerald-400 font-bold flex items-center space-x-0.5 shrink-0 text-[10px]">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Escrow Bảo Lãnh</span>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChatWithSeller(item);
                  }}
                  className="py-2 px-3 rounded-xl bg-[#12233B] hover:bg-[#182C48] text-cyan-300 font-bold text-xs border border-cyan-500/30 flex items-center justify-center space-x-1 transition cursor-pointer"
                  title="Nhắn tin với người bán"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Nhắn Tin</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('light');
                    setSelectedItemForDetail(item);
                    setActiveMediaIndex(0);
                  }}
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center space-x-1 transition cursor-pointer"
                  title="Xem chi tiết"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Chi Tiết</span>
                </button>

                <button
                  disabled={item.status === 'SOLD'}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.status === 'RESERVED') {
                      setSelectedItemForDetail(item);
                      return;
                    }
                    handleEscrowHold(item);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs transition flex items-center justify-center space-x-1.5 shadow-md cursor-pointer ${
                    item.status === 'SOLD'
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : item.status === 'RESERVED'
                      ? 'bg-amber-600/90 text-white hover:bg-amber-500'
                      : item.price === 0
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black hover:brightness-110 shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-emerald-900/40 border border-emerald-400/30'
                  }`}
                >
                  {item.status === 'SOLD' ? (
                    <span>Đã bán</span>
                  ) : item.status === 'RESERVED' ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Xem cọc</span>
                    </>
                  ) : item.price === 0 ? (
                    <>
                      <Gift className="w-4 h-4" />
                      <span>Nhận 0đ</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Cọc Giữ Món</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State when no real items match */}
      {filteredItems.length === 0 && (
        <div className="rounded-3xl bg-[#0F172A] border border-slate-800 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-white">Chợ KTX hiện chưa có món đồ phù hợp bộ lọc</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tất cả bài đăng đều là thật từ sinh viên và cộng đồng campus. Bạn có giáo trình cũ, máy tính, hoặc đồ dùng phòng ký túc xá? Hãy là người đầu tiên đăng bài!
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            <button
              onClick={() => {
                setCategoryFilter('ALL');
                setDealFilter('ALL');
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
            >
              Xóa bộ lọc
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Đăng Thanh Lý Hoặc Tặng 0đ Ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 MODAL CHI TIẾT MÓN ĐỒ (ITEM DETAIL MODAL) - HOÀN THIỆN ĐẦY ĐỦ 100% */}
      {/* ========================================================================= */}
      {selectedItemForDetail && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedItemForDetail(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fadeIn overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-3xl bg-[#0C1628] border-2 border-[#C5E5EC]/30 text-white shadow-2xl my-6 overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#C5E5EC]/15 flex items-center justify-between bg-gradient-to-r from-[#11233E] to-[#0A1424]">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShoppingBag className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">Chi Tiết Món Đồ KTX</h3>
                  <p className="text-[11px] text-[#C5E5EC]/70">Bảo chứng an toàn bởi Smart Escrow</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleShareItem(selectedItemForDetail)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-[#C5E5EC] hover:text-white transition cursor-pointer"
                  title="Chia sẻ thông tin món đồ"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedItemForDetail(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
              {/* Media Gallery / Video Player */}
              <div className="space-y-2">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video sm:h-72 w-full flex items-center justify-center border border-[#C5E5EC]/20 shadow-inner">
                  {selectedItemForDetail.mediaFiles && selectedItemForDetail.mediaFiles.length > 0 ? (
                    selectedItemForDetail.mediaFiles[activeMediaIndex]?.type === 'video' ? (
                      <video
                        src={selectedItemForDetail.mediaFiles[activeMediaIndex].url}
                        controls
                        className="w-full h-full object-contain"
                        autoPlay={false}
                      />
                    ) : (
                      <img
                        src={selectedItemForDetail.mediaFiles[activeMediaIndex]?.url || selectedItemForDetail.imageUrl}
                        alt={selectedItemForDetail.title}
                        className="w-full h-full object-contain"
                      />
                    )
                  ) : (
                    <img
                      src={selectedItemForDetail.imageUrl}
                      alt={selectedItemForDetail.title}
                      className="w-full h-full object-contain"
                    />
                  )}

                  {/* Status Overlay Badge */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {selectedItemForDetail.status === 'AVAILABLE' && (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/90 text-black font-black text-xs shadow-md">
                        🟢 ĐANG MỞ BÁN / TẶNG
                      </span>
                    )}
                    {selectedItemForDetail.status === 'RESERVED' && (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-black font-black text-xs shadow-md flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> ĐÃ ĐẶT CỌC GIỮ MÓN
                      </span>
                    )}
                    {selectedItemForDetail.status === 'SOLD' && (
                      <span className="px-2.5 py-1 rounded-xl bg-slate-700 text-white font-black text-xs shadow-md flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> ĐÃ BÀN GIAO HOÀN TẤT
                      </span>
                    )}
                  </div>
                </div>

                {/* Thumbnails list if multiple media files exist */}
                {selectedItemForDetail.mediaFiles && selectedItemForDetail.mediaFiles.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {selectedItemForDetail.mediaFiles.map((m, idx) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setActiveMediaIndex(idx)}
                        className={`relative w-16 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                          activeMediaIndex === idx
                            ? 'border-emerald-400 ring-2 ring-emerald-400/40'
                            : 'border-slate-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        {m.type === 'video' ? (
                          <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                            <Film className="w-5 h-5 text-red-400" />
                          </div>
                        ) : (
                          <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-center font-mono py-0.5">
                          #{idx + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title & Price Section */}
              <div className="p-4 rounded-2xl bg-[#0F1E36] border border-[#C5E5EC]/20 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-[#3064AE]/30 text-[#C5E5EC] font-bold text-xs border border-[#C5E5EC]/30">
                      {getCategoryLabel(selectedItemForDetail.category)}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-cyan-950/60 text-cyan-300 font-bold text-xs border border-cyan-500/30">
                      {getConditionLabel(selectedItemForDetail.condition)}
                    </span>
                  </div>

                  <div className="text-right">
                    {selectedItemForDetail.price === 0 ? (
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-black text-sm sm:text-base flex items-center gap-1.5">
                        <Gift className="w-4 h-4 text-emerald-400" />
                        <span>TẶNG MIỄN PHÍ 0Đ</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline space-x-2">
                        <span className="font-mono font-black text-xl sm:text-2xl text-emerald-400">
                          {formatVnd(selectedItemForDetail.price)}
                        </span>
                        {selectedItemForDetail.originalPrice > selectedItemForDetail.price && (
                          <span className="text-xs text-slate-400 line-through">
                            {formatVnd(selectedItemForDetail.originalPrice)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <h2 className="text-base sm:text-lg font-black text-white leading-snug">
                  {selectedItemForDetail.title}
                </h2>

                <div className="flex items-center space-x-2 text-xs text-[#C5E5EC]/90">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Khu vực / KTX: <strong className="text-white">{selectedItemForDetail.schoolName}</strong></span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">
                  Mô tả chi tiết &amp; Điểm hẹn nhận đồ:
                </h4>
                <div className="p-3.5 rounded-2xl bg-[#0A1324] border border-[#C5E5EC]/15 text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedItemForDetail.description}
                </div>
              </div>

              {/* Seller Profile & Escrow Guarantee Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0F1E38] to-[#0A1220] border border-[#C5E5EC]/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[#3064AE] border border-[#C5E5EC]/30 flex items-center justify-center font-black text-white text-sm">
                      {selectedItemForDetail.sellerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-1.5">
                        <span>{selectedItemForDetail.sellerName}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          Đã Xác Thực
                        </span>
                      </div>
                      <p className="text-[11px] text-[#C5E5EC]/70">
                        ID Sinh Viên: <span className="font-mono text-white">{selectedItemForDetail.sellerId}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleChatWithSeller(selectedItemForDetail)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-400/40 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Nhắn Người Bán</span>
                  </button>
                </div>

                {/* Escrow Legal Seal */}
                <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start space-x-2 text-[11px] text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong>Bảo Chứng Smart Escrow 100%: </strong>
                    Tiền cọc được khóa an toàn tại sàn. Người bán chỉ nhận được tiền khi hai bên đã gặp mặt trực tiếp kiểm tra hàng tại KTX và bạn bấm "Xác Nhận Đã Nhận Đồ".
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 border-t border-[#C5E5EC]/15 bg-[#09111D] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedItemForDetail(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-bold text-xs transition cursor-pointer"
                >
                  Đóng
                </button>

                {/* Seller / Admin controls */}
                {(currentUser?.id === selectedItemForDetail.sellerId ||
                  currentUser?.role === 'ADMIN' ||
                  currentUser?.id === '000000000') && (
                  <>
                    {selectedItemForDetail.status !== 'SOLD' ? (
                      <button
                        type="button"
                        onClick={() => handleToggleStatusBySeller(selectedItemForDetail, 'SOLD')}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs transition cursor-pointer"
                      >
                        Đánh dấu Đã Bán / Tặng
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleStatusBySeller(selectedItemForDetail, 'AVAILABLE')}
                        className="px-3.5 py-2.5 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-blue-300 border border-blue-500/40 font-bold text-xs transition cursor-pointer"
                      >
                        Mở Lại Mở Bán
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(selectedItemForDetail.id, selectedItemForDetail.title)}
                      className="p-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/40 transition cursor-pointer"
                      title="Xóa bài đăng này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Main buyer action buttons */}
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                {selectedItemForDetail.status === 'AVAILABLE' && (
                  <button
                    type="button"
                    onClick={() => handleEscrowHold(selectedItemForDetail)}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-black font-black text-xs hover:brightness-110 shadow-lg shadow-emerald-500/30 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {selectedItemForDetail.price === 0 ? (
                      <>
                        <Gift className="w-4 h-4" />
                        <span>ĐĂNG KÝ NHẬN 0Đ NGAY</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>ĐẶT CỌC GIỮ MÓN QUA SMART ESCROW</span>
                      </>
                    )}
                  </button>
                )}

                {selectedItemForDetail.status === 'RESERVED' && (
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleCancelReservation(selectedItemForDetail)}
                      className="px-3.5 py-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-500/40 font-bold text-xs transition cursor-pointer flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Hủy Cọc</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCompleteHandover(selectedItemForDetail)}
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ĐÃ NHẬN ĐỒ &amp; HOÀN TẤT</span>
                    </button>
                  </div>
                )}

                {selectedItemForDetail.status === 'SOLD' && (
                  <div className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs border border-slate-700">
                    Giao dịch này đã hoàn tất
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ĐĂNG BÁN / TẶNG ĐỒ KTX (CREATE LISTING MODAL) */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-[#0F172A] border-2 border-emerald-500/40 p-6 text-white shadow-2xl my-8 space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm text-white">Đăng Bán / Tặng Giáo Trình &amp; Đồ Dùng KTX</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tên món đồ / Tên sách giáo trình <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giáo trình Giải tích 2 ĐH Bách Khoa, Máy tính Casio 580VN..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Upload media: Photos & Videos */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">
                    Đính kèm hình ảnh &amp; video thực tế
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

                  {/* Uploaded media previews */}
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

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => removeUploadedFile(file.id)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-red-600/90 hover:bg-red-500 text-white shadow-lg transition-transform transform active:scale-90 cursor-pointer"
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
                    className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="TEXTBOOK">📚 Giáo trình &amp; Sách</option>
                    <option value="FREE_DONATION">🎁 Tặng Miễn Phí (0đ)</option>
                    <option value="TECH">💻 Đồ công nghệ &amp; Casio</option>
                    <option value="HOUSING_ESSENTIAL">🏠 Đồ dùng KTX</option>
                    <option value="STATIONERY">✏️ Văn phòng phẩm &amp; Dụng cụ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Giá mong muốn (0đ nếu tặng)
                  </label>
                  <input
                    type="number"
                    step="5000"
                    min="0"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tình trạng món đồ</label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="NEW_99">Mới 99% (Rất đẹp)</option>
                    <option value="GOOD_90">Còn tốt 90%</option>
                    <option value="FAIR_80">Dùng được 80%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Khu vực / Tòa nhà KTX</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: KTX Khu B, Tòa BA4..."
                    value={newSchool}
                    onChange={(e) => setNewSchool(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mô tả chi tiết &amp; Điểm hẹn giao dịch <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ghi chú chi tiết về tình trạng, thời gian có thể hẹn gặp tại KTX..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-[#09111D] border border-slate-800 text-[11px] text-[#C5E5EC]/80 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tuân thủ Điều 18: Nghiêm cấm hàng cấm, chất kích thích, tài liệu đề thi trái phép.</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-extrabold text-sm hover:brightness-110 shadow-lg shadow-emerald-500/25 transition cursor-pointer"
              >
                Đăng Món Đồ Lên Chợ KTX Ngay
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
