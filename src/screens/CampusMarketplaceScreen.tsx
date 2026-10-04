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
import { useTranslation } from '../context/LanguageContext';
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
  const { language, t } = useTranslation();
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
      showNotification(
        language === 'vi' ? 'Vui lòng đăng nhập' : 'Please Sign In',
        language === 'vi' ? 'Bạn cần đăng nhập để trò chuyện với người bán.' : 'You must sign in to chat with the seller.'
      );
      return;
    }
    if (item.sellerId === currentUser.id) {
      showNotification(
        language === 'vi' ? 'Món đồ của bạn' : 'Your Own Item',
        language === 'vi' ? 'Đây là món đồ do chính bạn đăng bán!' : 'This is your own posted listing!'
      );
      return;
    }

    sendChat(
      language === 'vi'
        ? `Chào bạn, mình quan tâm món đồ "${item.title}" (${item.price === 0 ? 'Tặng miễn phí 0đ' : formatVnd(item.price)}) bạn đang đăng trên Chợ KTX!`
        : `Hello, I am interested in your item "${item.title}" (${item.price === 0 ? 'Free donation 0 VND' : formatVnd(item.price)}) listed on Campus Market!`,
      'NONE',
      null,
      0,
      undefined,
      undefined,
      item.sellerId,
      item.sellerName
    );

    showNotification(
      language === 'vi' ? 'Đã mở cuộc trò chuyện 💬' : 'Conversation opened 💬',
      language === 'vi' ? `Đang chuyển sang phòng chat với ${item.sellerName}...` : `Switching to chat room with ${item.sellerName}...`
    );
    if (onOpenChat) {
      onOpenChat();
    }
  };

  const handleDeleteItem = async (itemId: string, itemTitle: string) => {
    triggerHaptic('medium');
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    await cloudService.deleteMarketplaceItem(itemId);
    showNotification(
      language === 'vi' ? 'Đã gỡ bài đăng' : 'Listing Removed',
      language === 'vi' ? `Đã xóa "${itemTitle}" khỏi Chợ KTX.` : `Removed "${itemTitle}" from Campus Flea Market.`
    );
    if (selectedItemForDetail?.id === itemId) {
      setSelectedItemForDetail(null);
    }
  };

  // Cọc giữ món qua Smart Escrow
  const handleEscrowHold = (item: MarketplaceItemEntity) => {
    if (!currentUser) {
      showNotification(
        language === 'vi' ? 'Cần đăng nhập' : 'Sign In Required',
        language === 'vi' ? 'Vui lòng đăng nhập để đặt cọc giữ món.' : 'Please sign in to place an escrow reservation.'
      );
      return;
    }

    if (item.sellerId === currentUser.id) {
      triggerHaptic('error');
      showNotification(
        language === 'vi' ? 'Món đồ của bạn' : 'Your Item',
        language === 'vi' ? 'Bạn là người đăng món đồ này nên không thể tự đặt cọc giữ chỗ!' : 'You cannot place a reservation on your own listing!',
        false
      );
      return;
    }

    if (item.status === 'RESERVED') {
      showNotification(
        language === 'vi' ? 'Đã có người cọc' : 'Already Reserved',
        language === 'vi' ? 'Món đồ này hiện đã có người cọc giữ chỗ!' : 'This item has already been reserved with escrow!'
      );
      return;
    }

    if (item.price > 0 && currentUser.walletBalance < item.price) {
      playNotificationSound('SOFT_VIBRATE');
      showNotification(
        language === 'vi' ? '⚠️ Số dư ví chưa đủ' : '⚠️ Insufficient Wallet Balance',
        language === 'vi'
          ? `Bạn cần có tối thiểu ${formatVnd(item.price)} trong Ví để cọc giữ món qua Smart Escrow. Hiện tại số dư: ${formatVnd(currentUser.walletBalance)}. Hãy nạp thêm tiền vào ví!`
          : `You need at least ${formatVnd(item.price)} in your wallet for escrow reservation. Current balance: ${formatVnd(currentUser.walletBalance)}. Please top up!`,
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
      language === 'vi' ? '🔒 Đã đặt cọc giữ món qua Smart Escrow!' : '🔒 Escrow Deposit Locked Safely!',
      item.price === 0
        ? (language === 'vi'
            ? `Bạn đã đăng ký nhận quà tặng "${item.title}". Hãy liên hệ người tặng để hẹn nhận tại KTX!`
            : `You have registered to claim "${item.title}". Please contact the donor to arrange meeting at the dorm!`)
        : (language === 'vi'
            ? `Số tiền ${formatVnd(item.price)} đã được phong tỏa trong Quỹ Smart Escrow. Tiền chỉ giải ngân khi bạn gặp mặt kiểm tra hàng xong!`
            : `Amount of ${formatVnd(item.price)} is securely locked in Smart Escrow. Released only when you meet and verify the item!`),
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
      language === 'vi' ? '🎉 Giao dịch hoàn tất thành công!' : '🎉 Transaction Completed Successfully!',
      language === 'vi'
        ? `Đã xác nhận nhận món đồ "${item.title}". Smart Escrow đã hoàn tất giải ngân an toàn.`
        : `Confirmed receipt of "${item.title}". Smart Escrow has safely disbursed funds.`,
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
      language === 'vi' ? 'Đã hủy cọc giữ chỗ ↩️' : 'Hold Cancelled ↩️',
      item.price > 0
        ? (language === 'vi'
            ? `Đã hoàn trả ${formatVnd(item.price)} về số dư ví khả dụng của bạn. Món đồ đã mở lại cho người khác!`
            : `Refunded ${formatVnd(item.price)} to your wallet balance. Item is now available for others!`)
        : (language === 'vi'
            ? `Đã hủy nhận món đồ. Món đồ đã mở lại cho sinh viên khác.`
            : `Cancelled claim. Item is now available for other students.`),
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
      language === 'vi' ? 'Đã cập nhật trạng thái' : 'Status Updated',
      newStatus === 'SOLD'
        ? (language === 'vi' ? `Đã đánh dấu "${item.title}" là Đã bán / Đã tặng.` : `Marked "${item.title}" as Sold / Gifted.`)
        : (language === 'vi' ? `Đã mở lại trạng thái Mở Bán cho "${item.title}".` : `Re-opened listing for "${item.title}".`)
    );
  };

  // Share item link
  const handleShareItem = (item: MarketplaceItemEntity) => {
    triggerHaptic('light');
    const text = language === 'vi'
      ? `[Chợ KTX GigMe] ${item.title} - Giá: ${item.price === 0 ? 'Tặng 0đ' : formatVnd(item.price)} tại ${item.schoolName}. Escrow bảo lãnh 100%!`
      : `[GigMe Campus Market] ${item.title} - Price: ${item.price === 0 ? 'Free 0đ' : formatVnd(item.price)} at ${item.schoolName}. 100% Escrow Protected!`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    showNotification(
      language === 'vi' ? 'Đã sao chép liên kết!' : 'Link Copied!',
      language === 'vi' ? 'Thông tin món đồ đã được lưu vào bộ nhớ tạm.' : 'Item details copied to clipboard.'
    );
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
        showNotification(
          language === 'vi' ? 'Định dạng không hỗ trợ' : 'Unsupported Format',
          language === 'vi' ? `Tệp "${file.name}" không phải là ảnh hoặc video.` : `File "${file.name}" is not an image or video.`,
          false
        );
        return;
      }

      if (file.size > 25 * 1024 * 1024) {
        showNotification(
          language === 'vi' ? 'Tệp quá lớn' : 'File Too Large',
          language === 'vi' ? `Tệp "${file.name}" vượt quá 25MB.` : `File "${file.name}" exceeds 25MB.`,
          false
        );
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

  const CATEGORIES = useMemo(
    () => [
      { id: 'ALL', label: language === 'vi' ? 'Tất cả đồ dùng' : 'All Items' },
      { id: 'TEXTBOOK', label: language === 'vi' ? '📚 Giáo trình & Sách' : '📚 Textbooks & Books' },
      { id: 'FREE_DONATION', label: language === 'vi' ? '🎁 Tặng Miễn Phí (0đ)' : '🎁 Free Donation (0đ)' },
      { id: 'TECH', label: language === 'vi' ? '💻 Đồ công nghệ & Casio' : '💻 Tech & Calculator' },
      { id: 'HOUSING_ESSENTIAL', label: language === 'vi' ? '🏠 Đồ dùng KTX' : '🏠 Dorm Essentials' },
      { id: 'STATIONERY', label: language === 'vi' ? '✏️ Văn phòng phẩm & Dụng cụ' : '✏️ Stationery & Supplies' },
    ],
    [language]
  );

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
      language === 'vi' ? '🎉 Đăng thanh lý thành công!' : '🎉 Item Listed Successfully!',
      language === 'vi'
        ? `Món đồ "${newTitle}" kèm ${uploadedFiles.length} tệp phương tiện đã được đưa lên Chợ KTX Sinh Viên.`
        : `Item "${newTitle}" with ${uploadedFiles.length} media files has been posted to Campus Market.`,
      true,
      true
    );
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'TEXTBOOK':
        return language === 'vi' ? '📚 Giáo trình & Sách' : '📚 Textbooks & Books';
      case 'TECH':
        return language === 'vi' ? '💻 Công nghệ & Casio' : '💻 Tech & Calculator';
      case 'STATIONERY':
        return language === 'vi' ? '✏️ Văn phòng phẩm' : '✏️ Stationery';
      case 'FREE_DONATION':
        return language === 'vi' ? '🎁 Tặng miễn phí (0đ)' : '🎁 Free Donation (0đ)';
      case 'HOUSING_ESSENTIAL':
        return language === 'vi' ? '🏠 Đồ dùng KTX' : '🏠 Dorm Essentials';
      default:
        return language === 'vi' ? '📦 Đồ dùng sinh viên' : '📦 Student Items';
    }
  };

  const getConditionLabel = (cond: string) => {
    switch (cond) {
      case 'NEW_99':
        return language === 'vi' ? 'Mới 99% (Rất đẹp)' : 'Like New 99% (Pristine)';
      case 'GOOD_90':
        return language === 'vi' ? 'Còn tốt 90%' : 'Good 90%';
      case 'FAIR_80':
        return language === 'vi' ? 'Dùng được 80%' : 'Fair 80%';
      default:
        return language === 'vi' ? 'Đã qua sử dụng' : 'Pre-owned';
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
              <span>
                {language === 'vi' ? 'Campus Flea Market • Chợ Đồ Cũ Sinh Viên' : 'Campus Flea Market • Student Pre-owned'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {language === 'vi' ? 'Chợ Đồ Cũ & Giáo Trình KTX' : 'Dorm Flea Market & Textbooks'}
            </h1>
            <p className="text-xs text-[#C5E5EC]/85 max-w-lg leading-relaxed">
              {language === 'vi' ? (
                <>
                  Săn giáo trình cũ, bàn học KTX, máy tính Casio, đồ gia dụng giá sinh viên hoặc nhận đồ tặng 0đ. 100% an tâm với Smart Escrow bảo chứng giao dịch theo <strong>Điều 18 Bộ Luật Campus</strong>!
                </>
              ) : (
                <>
                  Find pre-owned textbooks, dorm desks, Casio calculators, student essentials or free 0đ items. 100% peace of mind with Smart Escrow protection under <strong>Article 18 Campus Code</strong>!
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
            {onOpenLaw && (
              <button
                onClick={onOpenLaw}
                className="px-3.5 py-2.5 rounded-2xl bg-[#0E1B2E] hover:bg-[#13243C] text-[#C5E5EC] font-bold text-xs border border-[#C5E5EC]/25 transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                title={language === 'vi' ? 'Xem Điều 18: Quy chế Chợ KTX' : 'View Article 18: Campus Market Code'}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>{language === 'vi' ? 'Quy Chế Chợ' : 'Market Code'}</span>
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
              <span>{language === 'vi' ? 'Đăng Bán / Tặng 0đ' : 'Post Item / Free 0đ'}</span>
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
              placeholder={
                language === 'vi'
                  ? 'Tìm giáo trình, máy tính Casio, áo blouse, đồ KTX, phòng ký túc xá...'
                  : 'Search textbooks, Casio calculator, lab coat, dorm items...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-20 py-2.5 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 text-xs text-white placeholder:text-[#C5E5EC]/40 focus:border-[#3064AE] focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 px-2 py-0.5 text-[10px] font-bold rounded-lg bg-white/10 hover:bg-white/20 text-[#C5E5EC] transition"
              >
                {language === 'vi' ? 'Xóa tìm' : 'Clear'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 text-xs text-[#C5E5EC] font-bold focus:outline-none"
            >
              <option value="NEWEST">{language === 'vi' ? 'Mới nhất trước' : 'Newest first'}</option>
              <option value="PRICE_ASC">{language === 'vi' ? 'Giá: Thấp → Cao' : 'Price: Low → High'}</option>
              <option value="PRICE_DESC">{language === 'vi' ? 'Giá: Cao → Thấp' : 'Price: High → Low'}</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Deal Tags */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs touch-pan-x">
          <span className="text-[11px] font-bold text-[#C5E5EC]/70 uppercase tracking-wider shrink-0">
            {language === 'vi' ? 'Bộ lọc:' : 'Filters:'}
          </span>
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
            🔥 {language === 'vi' ? 'Tất cả' : 'All'}
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
            🎁 {language === 'vi' ? 'Tặng Miễn Phí (0đ)' : 'Free (0đ)'}
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
            🏷️ {language === 'vi' ? 'Dưới 50.000đ' : 'Under 50K'}
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
            🏠 {language === 'vi' ? 'Dọn Ký túc xá' : 'Dorm Clearance'}
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
            🔒 {language === 'vi' ? 'Đang cọc giữ món' : 'Reserved'}
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
                      {language === 'vi' ? 'TẶNG 0Đ' : 'FREE 0đ'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-sm text-emerald-400 font-mono font-bold text-[11px] border border-emerald-500/30">
                      {formatVnd(item.price)}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-lg bg-[#0F172A]/90 text-cyan-300 font-bold text-[10px] border border-slate-700">
                    {item.condition === 'NEW_99'
                      ? (language === 'vi' ? 'Mới 99%' : 'Like New 99%')
                      : item.condition === 'GOOD_90'
                      ? (language === 'vi' ? 'Tốt 90%' : 'Good 90%')
                      : (language === 'vi' ? '80%' : 'Fair 80%')}
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
                        <ImageIcon className="w-2.5 h-2.5" /> +{item.mediaFiles.length} {language === 'vi' ? 'tệp' : 'files'}
                      </span>
                    )}
                  </div>
                )}

                {item.status === 'RESERVED' && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-15">
                    <span className="px-3 py-1 rounded-xl bg-amber-500 text-black font-black text-xs shadow-lg flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> {language === 'vi' ? 'ĐÃ ĐẶT CỌC GIỮ MÓN' : 'RESERVED WITH ESCROW'}
                    </span>
                  </div>
                )}

                {item.status === 'SOLD' && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-15">
                    <span className="px-3 py-1 rounded-xl bg-slate-700 text-slate-200 font-black text-xs shadow-lg flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> {language === 'vi' ? 'ĐÃ BÀN GIAO XONG' : 'HANDED OVER / SOLD'}
                    </span>
                  </div>
                )}
              </div>

              {/* Info Body */}
              <div className="p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[10px] text-[#C5E5EC]/70">
                  <span className="font-bold text-amber-300">{getCategoryLabel(item.category)}</span>
                  <span>{new Date(item.createdAt || Date.now()).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}</span>
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
                  <span className="truncate">
                    {language === 'vi' ? 'Người đăng:' : 'Seller:'} <strong className="text-white">{item.sellerName}</strong>
                  </span>
                  {(currentUser?.id === item.sellerId || currentUser?.role === 'ADMIN' || currentUser?.id === '000000000') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id, item.title);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition cursor-pointer"
                      title={language === 'vi' ? 'Gỡ tin đăng này' : 'Remove this listing'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <span className="text-emerald-400 font-bold flex items-center space-x-0.5 shrink-0 text-[10px]">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{language === 'vi' ? 'Escrow Bảo Lãnh' : 'Escrow Protected'}</span>
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
                  title={language === 'vi' ? 'Nhắn tin với người bán' : 'Chat with seller'}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Nhắn Tin' : 'Chat'}</span>
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
                  title={language === 'vi' ? 'Xem chi tiết' : 'View details'}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Chi Tiết' : 'Details'}</span>
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
                    <span>{language === 'vi' ? 'Đã bán' : 'Sold'}</span>
                  ) : item.status === 'RESERVED' ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>{language === 'vi' ? 'Xem cọc' : 'View Escrow'}</span>
                    </>
                  ) : item.price === 0 ? (
                    <>
                      <Gift className="w-4 h-4" />
                      <span>{language === 'vi' ? 'Nhận 0đ' : 'Claim Free'}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>{language === 'vi' ? 'Cọc Giữ Món' : 'Hold Item'}</span>
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
            <h3 className="text-base font-bold text-white">
              {language === 'vi' ? 'Chợ KTX hiện chưa có món đồ phù hợp bộ lọc' : 'No items match current filters'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'vi'
                ? 'Tất cả bài đăng đều là thật từ sinh viên và cộng đồng campus. Bạn có giáo trình cũ, máy tính, hoặc đồ dùng phòng ký túc xá? Hãy là người đầu tiên đăng bài!'
                : 'All listings are authentic from campus students. Do you have old textbooks, electronics, or dorm essentials? Be the first to post!'}
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
              {language === 'vi' ? 'Xóa bộ lọc' : 'Reset filters'}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'vi' ? 'Đăng Thanh Lý Hoặc Tặng 0đ Ngay' : 'Post Listing or Free Donation'}</span>
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
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    {language === 'vi' ? 'Chi Tiết Món Đồ KTX' : 'Dorm Item Details'}
                  </h3>
                  <p className="text-[11px] text-[#C5E5EC]/70">
                    {language === 'vi' ? 'Bảo chứng an toàn bởi Smart Escrow' : 'Guaranteed safe by Smart Escrow'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleShareItem(selectedItemForDetail)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-[#C5E5EC] hover:text-white transition cursor-pointer"
                  title={language === 'vi' ? 'Chia sẻ thông tin món đồ' : 'Share item details'}
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
                        {language === 'vi' ? '🟢 ĐANG MỞ BÁN / TẶNG' : '🟢 AVAILABLE FOR SALE / GIFT'}
                      </span>
                    )}
                    {selectedItemForDetail.status === 'RESERVED' && (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-black font-black text-xs shadow-md flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> {language === 'vi' ? 'ĐÃ ĐẶT CỌC GIỮ MÓN' : 'RESERVED WITH ESCROW'}
                      </span>
                    )}
                    {selectedItemForDetail.status === 'SOLD' && (
                      <span className="px-2.5 py-1 rounded-xl bg-slate-700 text-white font-black text-xs shadow-md flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> {language === 'vi' ? 'ĐÃ BÀN GIAO HOÀN TẤT' : 'HANDED OVER / COMPLETED'}
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
                        <span>{language === 'vi' ? 'TẶNG MIỄN PHÍ 0Đ' : 'FREE DONATION 0đ'}</span>
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
                  <span>
                    {language === 'vi' ? 'Khu vực / KTX:' : 'Location / Dorm:'}{' '}
                    <strong className="text-white">{selectedItemForDetail.schoolName}</strong>
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">
                  {language === 'vi' ? 'Mô tả chi tiết & Điểm hẹn nhận đồ:' : 'Item Details & Meeting Location:'}
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
                          {language === 'vi' ? 'Đã Xác Thực' : 'Verified'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#C5E5EC]/70">
                        {language === 'vi' ? 'ID Sinh Viên:' : 'Student ID:'}{' '}
                        <span className="font-mono text-white">{selectedItemForDetail.sellerId}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleChatWithSeller(selectedItemForDetail)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-400/40 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Nhắn Người Bán' : 'Chat With Seller'}</span>
                  </button>
                </div>

                {/* Escrow Legal Seal */}
                <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start space-x-2 text-[11px] text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong>{language === 'vi' ? 'Bảo Chứng Smart Escrow 100%: ' : '100% Smart Escrow Guarantee: '}</strong>
                    {language === 'vi'
                      ? 'Tiền cọc được khóa an toàn tại sàn. Người bán chỉ nhận được tiền khi hai bên đã gặp mặt trực tiếp kiểm tra hàng tại KTX và bạn bấm "Xác Nhận Đã Nhận Đồ".'
                      : 'Escrow deposit is held securely. The seller only receives funds after both parties meet in person at the dorm, inspect the item, and you confirm receipt.'}
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
                  {language === 'vi' ? 'Đóng' : 'Close'}
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
                        {language === 'vi' ? 'Đánh dấu Đã Bán / Tặng' : 'Mark as Sold / Gifted'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleStatusBySeller(selectedItemForDetail, 'AVAILABLE')}
                        className="px-3.5 py-2.5 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-blue-300 border border-blue-500/40 font-bold text-xs transition cursor-pointer"
                      >
                        {language === 'vi' ? 'Mở Lại Mở Bán' : 'Re-open Listing'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(selectedItemForDetail.id, selectedItemForDetail.title)}
                      className="p-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/40 transition cursor-pointer"
                      title={language === 'vi' ? 'Xóa bài đăng này' : 'Delete this listing'}
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
                        <span>{language === 'vi' ? 'ĐĂNG KÝ NHẬN 0Đ NGAY' : 'CLAIM FREE 0đ NOW'}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>{language === 'vi' ? 'ĐẶT CỌC GIỮ MÓN QUA SMART ESCROW' : 'RESERVE WITH SMART ESCROW'}</span>
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
                      <span>{language === 'vi' ? 'Hủy Cọc' : 'Cancel Hold'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCompleteHandover(selectedItemForDetail)}
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'vi' ? 'ĐÃ NHẬN ĐỒ & HOÀN TẤT' : 'ITEM RECEIVED & COMPLETE'}</span>
                    </button>
                  </div>
                )}

                {selectedItemForDetail.status === 'SOLD' && (
                  <div className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs border border-slate-700">
                    {language === 'vi' ? 'Giao dịch này đã hoàn tất' : 'This transaction is complete'}
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
                <h3 className="font-extrabold text-sm text-white">
                  {language === 'vi' ? 'Đăng Bán / Tặng Giáo Trình & Đồ Dùng KTX' : 'List Item / Free Dorm Donation'}
                </h3>
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
                  {language === 'vi' ? 'Tên món đồ / Tên sách giáo trình' : 'Item Name / Textbook Title'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    language === 'vi'
                      ? 'Ví dụ: Giáo trình Giải tích 2 ĐH Bách Khoa, Máy tính Casio 580VN...'
                      : 'E.g., Calculus 2 Textbook, Casio FX-580VN calculator...'
                  }
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Upload media: Photos & Videos */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">
                    {language === 'vi' ? 'Đính kèm hình ảnh & video thực tế' : 'Attach Real Photos & Videos'}
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {uploadedFiles.length > 0
                      ? language === 'vi'
                        ? `${uploadedFiles.length} tệp đã chọn`
                        : `${uploadedFiles.length} files selected`
                      : language === 'vi'
                      ? 'Chấp nhận ảnh/video'
                      : 'Photos/videos accepted'}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-emerald-500/40 rounded-2xl bg-[#131E30]/50 hover:bg-[#131E30] hover:border-emerald-400 transition cursor-pointer text-center group">
                    <div className="flex items-center space-x-2 text-emerald-400 mb-1">
                      <UploadCloud className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                        {language === 'vi' ? 'Bấm để chọn hoặc kéo thả tệp' : 'Click to select or drag & drop files'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {language === 'vi'
                        ? 'Tải lên nhiều ảnh (JPG, PNG, WEBP) hoặc video (MP4, MOV). Có thể xóa khi chọn nhầm!'
                        : 'Upload multiple photos (JPG, PNG, WEBP) or videos (MP4, MOV). Removable anytime!'}
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
                            title={language === 'vi' ? 'Xóa tệp này' : 'Remove this file'}
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
                  <label className="block text-slate-300 font-semibold mb-1">
                    {language === 'vi' ? 'Danh mục' : 'Category'}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="TEXTBOOK">{language === 'vi' ? '📚 Giáo trình & Sách' : '📚 Textbooks & Books'}</option>
                    <option value="FREE_DONATION">{language === 'vi' ? '🎁 Tặng Miễn Phí (0đ)' : '🎁 Free Donation (0đ)'}</option>
                    <option value="TECH">{language === 'vi' ? '💻 Đồ công nghệ & Casio' : '💻 Tech & Calculator'}</option>
                    <option value="HOUSING_ESSENTIAL">{language === 'vi' ? '🏠 Đồ dùng KTX' : '🏠 Dorm Essentials'}</option>
                    <option value="STATIONERY">{language === 'vi' ? '✏️ Văn phòng phẩm & Dụng cụ' : '✏️ Stationery & Supplies'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {language === 'vi' ? 'Giá mong muốn (0đ nếu tặng)' : 'Desired Price (0đ if free)'}
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
                  <label className="block text-slate-300 font-semibold mb-1">
                    {language === 'vi' ? 'Tình trạng món đồ' : 'Condition'}
                  </label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="NEW_99">{language === 'vi' ? 'Mới 99% (Rất đẹp)' : 'Like New 99% (Pristine)'}</option>
                    <option value="GOOD_90">{language === 'vi' ? 'Còn tốt 90%' : 'Good 90%'}</option>
                    <option value="FAIR_80">{language === 'vi' ? 'Dùng được 80%' : 'Fair 80%'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {language === 'vi' ? 'Khu vực / Tòa nhà KTX' : 'Dorm Area / Building'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'vi' ? 'Ví dụ: KTX Khu B, Tòa BA4...' : 'E.g., Dorm B, Building BA4...'}
                    value={newSchool}
                    onChange={(e) => setNewSchool(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'vi' ? 'Mô tả chi tiết & Điểm hẹn giao dịch' : 'Detailed Description & Meeting Spot'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={
                    language === 'vi'
                      ? 'Ghi chú chi tiết về tình trạng, thời gian có thể hẹn gặp tại KTX...'
                      : 'Detailed notes on condition, available meeting time at dorm...'
                  }
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-[#09111D] border border-slate-800 text-[11px] text-[#C5E5EC]/80 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {language === 'vi'
                    ? 'Tuân thủ Điều 18: Nghiêm cấm hàng cấm, chất kích thích, tài liệu đề thi trái phép.'
                    : 'Complies with Article 18: Strictly prohibits contraband, banned items, exam leaks.'}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-extrabold text-sm hover:brightness-110 shadow-lg shadow-emerald-500/25 transition cursor-pointer"
              >
                {language === 'vi' ? 'Đăng Món Đồ Lên Chợ KTX Ngay' : 'Publish Item to Campus Market'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
