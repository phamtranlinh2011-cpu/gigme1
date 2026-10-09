import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bell,
  BellRing,
  CheckCheck,
  Check,
  Trash2,
  DollarSign,
  Wallet,
  ShieldCheck,
  Zap,
  ExternalLink,
  X,
  Radio,
  Smartphone,
  ChevronRight,
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  Briefcase,
  Info,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { formatVnd, WalletTransactionEntity, GigEntity, FirestoreNotificationEntity } from '../types';
import { realtimeManager } from '../services/cloudSync';
import { isAudioMuted, setAudioMuted } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

export interface NotificationItem {
  id: string;
  type: 'GIG' | 'PAYMENT' | 'ESCROW' | 'SYSTEM';
  title: string;
  body: string;
  timestamp: number;
  isRead: boolean;
  linkAction?: 'GIG' | 'WALLET';
  targetId?: string;
  amount?: number;
}

interface NotificationCenterProps {
  onOpenFcmPush?: () => void;
  onOpenWallet?: () => void;
  onOpenChat?: () => void;
  onSelectGigDetail?: (gigId: string) => void;
}

const STORAGE_KEY = 'gigme_notifications_center_v2';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onOpenFcmPush,
  onOpenWallet,
  onSelectGigDetail,
}) => {
  const {
    currentUser,
    sendWebPushNotification,
    language,
  } = useGigMe();

  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'ALL' | 'GIG' | 'PAYMENT' | 'SYSTEM'>('ALL');
  const [isFirestoreLive, setIsFirestoreLive] = useState(false);
  const [audioMuted, setAudioMutedState] = useState<boolean>(() => isAudioMuted());
  const popoverRef = useRef<HTMLDivElement>(null);

  // Notifications state loaded from cache (Lọc bỏ triệt để các tin nhắn chat cũ)
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: any[] = JSON.parse(saved);
        // Lọc bỏ bất kỳ thông báo tin nhắn chat nào
        return parsed.filter((n) => n && n.type !== 'MESSAGE');
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'welcome_notif',
        type: 'ESCROW',
        title: '🛡️ Bảo vệ Smart Escrow kích hoạt',
        body: 'Hệ thống ký quỹ bảo chứng 100% thù lao tự động cho sinh viên campus.',
        timestamp: Date.now() - 3600000,
        isRead: false,
        linkAction: 'WALLET',
      },
    ];
  });

  // Save to localStorage whenever notifications change (lưu tối đa 50 thông báo)
  useEffect(() => {
    try {
      const cleanList = notifications.filter((n) => n && (n as any).type !== 'MESSAGE').slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
    } catch {
      // ignore
    }
  }, [notifications]);

  // Close dropdown when clicking outside (Supports Mouse & Touch)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Ref to record mount time to avoid firing push alerts on stale initial snapshot
  const mountTimeRef = useRef<number>(Date.now());
  const seenIdsRef = useRef<Set<string>>(new Set(notifications.map((n) => n.id)));

  // Helper to add notification with de-duplication and FCM trigger
  const addNotification = (item: NotificationItem, triggerPush = true) => {
    // Tuyệt đối không thêm thông báo tin nhắn chat vào đây
    if ((item as any).type === 'MESSAGE') return;

    if (seenIdsRef.current.has(item.id)) return;
    seenIdsRef.current.add(item.id);

    setNotifications((prev) => [item, ...prev.filter((n) => n.id !== item.id)]);

    // Trigger FCM lockscreen push & audio if new event occurred after mount
    if (triggerPush && item.timestamp > mountTimeRef.current - 15000) {
      sendWebPushNotification(item.title, item.body, '/pwa-192x192.png');
    }
  };

  // ==================== REAL-TIME FIRESTORE PULL (LOẠI BỎ TIN NHẮN CHAT) ====================
  useEffect(() => {
    if (!currentUser) return;
    const currentUserId = currentUser.id;

    let unsubNotifs: (() => void) | null = null;
    let unsubTransactions: (() => void) | null = null;
    let unsubGigs: (() => void) | null = null;

    try {
      // 1. Lắng nghe thông báo việc làm mới & thông báo hệ thống ('notifications' collection)
      const notifsRef = collection(db, 'notifications');
      unsubNotifs = onSnapshot(
        notifsRef,
        (snapshot) => {
          setIsFirestoreLive(true);
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data() as FirestoreNotificationEntity;
              if (!data) return;

              // Bỏ qua tin nhắn chat nếu có
              if ((data as any).type === 'MESSAGE' || (data as any).type === 'CHAT') return;

              // Kiểm tra đối tượng nhận thông báo
              if (data.userId && data.userId !== 'ALL' && data.userId !== currentUserId) return;

              const isRecent = (data.createdAt || Date.now()) > mountTimeRef.current - 15000;
              const notifId = data.id || `notif_${change.doc.id}`;

              let itemType: 'GIG' | 'SYSTEM' = 'SYSTEM';
              let linkAction: 'GIG' | undefined = undefined;

              if (data.type === 'NEW_GIG' || data.type === 'STATUS_UPDATE') {
                itemType = 'GIG';
                linkAction = data.gigId ? 'GIG' : undefined;
              }

              addNotification(
                {
                  id: notifId,
                  type: itemType,
                  title: data.title || (data.type === 'NEW_GIG' ? '🔥 Việc Mới Vừa Đăng!' : '⚡ Cập Nhật Tiến Độ'),
                  body: data.message || '',
                  timestamp: data.createdAt || Date.now(),
                  isRead: false,
                  linkAction,
                  targetId: data.gigId,
                },
                isRecent
              );
            }
          });
        },
        (error) => {
          console.warn('Firestore notifications subscription offline/fallback:', error);
          setIsFirestoreLive(false);
        }
      );

      // 2. Lắng nghe biến động số dư và giao dịch tài chính ('transactions' collection)
      const txRef = collection(db, 'transactions');
      unsubTransactions = onSnapshot(
        txRef,
        (snapshot) => {
          setIsFirestoreLive(true);
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as WalletTransactionEntity;
            if (!data || data.userId !== currentUserId) return;

            const notifId = `tx_${data.id || change.doc.id}`;
            const isRecent = data.timestamp > mountTimeRef.current - 10000;

            if (change.type === 'added') {
              let iconPrefix = '💰';
              let notifType: 'PAYMENT' | 'ESCROW' = 'PAYMENT';
              if (data.type === 'ESCROW_PAYOUT' || data.type === 'ESCROW_RELEASE') {
                iconPrefix = '🎉';
                notifType = 'ESCROW';
              } else if (data.type === 'ADMIN_REFUND') {
                iconPrefix = '↩️';
              } else if (data.type === 'VIETQR_DEPOSIT' || data.type === 'EWALLET_DEPOSIT') {
                iconPrefix = '⚡';
              } else if (data.type === 'BANK_WITHDRAWAL' || data.type === 'EWALLET_WITHDRAW') {
                iconPrefix = '🏦';
              }

              addNotification(
                {
                  id: notifId,
                  type: notifType,
                  title: `${iconPrefix} ${data.title || 'Biến động số dư ví'}`,
                  body: `${data.subtitle || ''} (${data.amount > 0 ? '+' : ''}${formatVnd(data.amount)})`,
                  timestamp: data.timestamp || Date.now(),
                  isRead: false,
                  linkAction: 'WALLET',
                  targetId: data.id,
                  amount: data.amount,
                },
                isRecent
              );
            }
          });
        },
        (error) => {
          console.warn('Firestore transactions subscription offline/fallback:', error);
          setIsFirestoreLive(false);
        }
      );

      // 3. Lắng nghe các mốc tiến độ đơn việc của chính mình ('gigs' collection)
      const gigsRef = collection(db, 'gigs');
      unsubGigs = onSnapshot(
        gigsRef,
        (snapshot) => {
          setIsFirestoreLive(true);
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as GigEntity;
            if (!data) return;

            const isMyClientGig = data.clientId === currentUserId;
            const isMyWorkerGig = data.freelancerId === currentUserId;

            if (isMyClientGig || isMyWorkerGig) {
              const notifId = `gig_status_${data.id}_${data.status}_${data.completedAt || data.acceptedAt || data.createdAt}`;
              const isRecent =
                (data.completedAt || data.acceptedAt || data.createdAt || 0) >
                mountTimeRef.current - 10000;

              if (change.type === 'modified' && isRecent) {
                let title = '';
                let body = '';

                if (data.status === 'IN_PROGRESS' && isMyClientGig) {
                  title = '⚡ Thợ đã nhận đơn việc của bạn!';
                  body = `"${data.title}" đã được nhận bởi ${data.freelancerName || 'Freelancer sinh viên'}.`;
                } else if (data.status === 'SUBMITTED' && isMyClientGig) {
                  title = '📸 Thợ đã nộp minh chứng nghiệm thu!';
                  body = `Đơn "${data.title}" đang chờ bạn xác nhận giải ngân Smart Escrow.`;
                } else if (data.status === 'COMPLETED' && isMyWorkerGig) {
                  title = '💰 Giải ngân thù lao thành công!';
                  body = `Khách đã hoàn tất nghiệm thu đơn "${data.title}". Thù lao đã vào ví!`;
                }

                if (title && body) {
                  addNotification(
                    {
                      id: notifId,
                      type: 'GIG',
                      title,
                      body,
                      timestamp: Date.now(),
                      isRead: false,
                      linkAction: 'GIG',
                      targetId: data.id,
                    },
                    true
                  );
                }
              }
            }
          });
        },
        (error) => {
          console.warn('Firestore gigs subscription fallback:', error);
          setIsFirestoreLive(false);
        }
      );
    } catch (err) {
      console.warn('Error setting up Firestore subscriptions:', err);
    }

    // Hybrid Fallback: Lắng nghe giao dịch ví cục bộ qua SSE Express
    const unsubSSETx = realtimeManager.on('transaction_saved', (data: WalletTransactionEntity) => {
      if (data && data.userId === currentUserId) {
        addNotification(
          {
            id: `sse_tx_${data.id}_${Date.now()}`,
            type: 'PAYMENT',
            title: `💰 ${data.title || 'Biến động số dư ví'}`,
            body: `${data.subtitle || ''} (${formatVnd(data.amount)})`,
            timestamp: data.timestamp || Date.now(),
            isRead: false,
            linkAction: 'WALLET',
            targetId: data.id,
            amount: data.amount,
          },
          true
        );
      }
    });

    return () => {
      if (unsubNotifs) unsubNotifs();
      if (unsubTransactions) unsubTransactions();
      if (unsubGigs) unsubGigs();
      unsubSSETx();
    };
  }, [currentUser?.id]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filterTab === 'ALL') return notifications;
    if (filterTab === 'GIG') return notifications.filter((n) => n.type === 'GIG');
    if (filterTab === 'PAYMENT') return notifications.filter((n) => n.type === 'PAYMENT' || n.type === 'ESCROW');
    if (filterTab === 'SYSTEM') return notifications.filter((n) => n.type === 'SYSTEM');
    return notifications;
  }, [notifications, filterTab]);

  const handleMarkAllAsRead = () => {
    triggerHaptic('light');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearAll = () => {
    triggerHaptic('medium');
    setNotifications([]);
    seenIdsRef.current.clear();
  };

  const handleDeleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    triggerHaptic('light');
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleToggleRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    triggerHaptic('light');
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const handleToggleAudio = () => {
    const next = !audioMuted;
    setAudioMutedState(next);
    setAudioMuted(next);
    triggerHaptic('light');
  };

  const handleNotificationClick = (item: NotificationItem) => {
    triggerHaptic('light');
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );

    setIsOpen(false);

    if (item.linkAction === 'WALLET') {
      onOpenWallet?.();
    } else if (item.linkAction === 'GIG' && item.targetId) {
      onSelectGigDetail?.(item.targetId);
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diffSeconds < 60) return language === 'vi' ? 'Vừa xong' : 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return language === 'vi' ? `${diffMinutes} phút trước` : `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return language === 'vi' ? `${diffHours} giờ trước` : `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return language === 'vi' ? `${diffDays} ngày trước` : `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Header Notification Center Bell Trigger */}
      <button
        id="notification-center-trigger-btn"
        onClick={() => {
          triggerHaptic('light');
          setIsOpen((prev) => !prev);
        }}
        className="relative p-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/30 text-[#C5E5EC] hover:text-white transition active:scale-95 shadow-sm cursor-pointer group"
        title={language === 'vi' ? 'Trung tâm thông báo Realtime (Firestore & Màn hình khóa)' : 'Realtime Notification Center (Firestore & Lock Screen)'}
        aria-label={language === 'vi' ? 'Thông báo' : 'Notifications'}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4 h-4 text-amber-300 animate-wiggle" />
        ) : (
          <Bell className="w-4 h-4 text-[#C5E5EC] group-hover:text-white transition" />
        )}

        {/* Live Firestore status indicator dot */}
        <span
          className={`absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full ${
            isFirestoreLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
          }`}
          title={
            isFirestoreLive
              ? language === 'vi'
                ? 'Firestore Realtime đang kết nối trực tiếp'
                : 'Firestore Realtime directly connected'
              : language === 'vi'
              ? 'Chế độ đồng bộ cục bộ'
              : 'Local sync mode'
          }
        />

        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-rose-500 text-white font-extrabold text-[10px] shadow-md border border-[#0B1528] animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Notification Center Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[390px] max-w-[94vw] bg-[#0E1B2E]/98 backdrop-blur-xl border border-[#C5E5EC]/30 rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.7)] z-50 overflow-hidden animate-modal-in text-slate-100 divide-y divide-[#C5E5EC]/15">
          {/* Header */}
          <div className="p-3.5 bg-[#12233B]/95 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-[#3064AE]/35 text-[#E0FAEB] border border-[#C5E5EC]/20">
                <Bell className="w-4 h-4 text-[#E0FAEB]" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-xs font-black text-white tracking-wide uppercase">
                    {language === 'vi' ? 'Thông Báo' : 'Notifications'}
                  </h3>
                  <span className="flex items-center space-x-1 text-[9px] px-1.5 py-0.5 rounded-md bg-[#3064AE]/40 text-[#C5E5EC] font-semibold border border-[#C5E5EC]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>Realtime</span>
                  </span>
                </div>
                <p className="text-[10px] text-[#C5E5EC]/70">
                  {unreadCount > 0
                    ? language === 'vi'
                      ? `${unreadCount} thông báo chưa đọc`
                      : `${unreadCount} unread notifications`
                    : language === 'vi'
                    ? 'Bạn đã đọc hết thông báo'
                    : 'All notifications caught up'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {/* Audio Mute/Unmute quick toggle button */}
              <button
                type="button"
                onClick={handleToggleAudio}
                className={`p-1.5 rounded-lg transition text-[11px] cursor-pointer ${
                  audioMuted
                    ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                    : 'hover:bg-[#162B48] text-[#C5E5EC] hover:text-[#E0FAEB]'
                }`}
                title={
                  audioMuted
                    ? language === 'vi' ? 'Bật âm thanh thông báo' : 'Unmute notification sound'
                    : language === 'vi' ? 'Tắt âm thanh thông báo' : 'Mute notification sound'
                }
              >
                {audioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="p-1.5 rounded-lg hover:bg-[#162B48] text-[#C5E5EC] hover:text-[#E0FAEB] transition text-[11px] cursor-pointer"
                  title={language === 'vi' ? 'Đánh dấu tất cả đã đọc' : 'Mark all as read'}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1.5 rounded-lg hover:bg-red-950/40 text-slate-400 hover:text-red-300 transition cursor-pointer"
                  title={language === 'vi' ? 'Xóa toàn bộ thông báo' : 'Clear all notifications'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#162B48] text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* FCM Lock Screen & Push Banner */}
          <div className="px-3.5 py-2 bg-gradient-to-r from-[#3064AE]/20 via-[#12233B] to-[#3064AE]/10 flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span className="text-[#C5E5EC] truncate font-medium">
                {currentUser?.fcmEnabled
                  ? language === 'vi'
                    ? 'Đẩy Màn hình khóa: BẬT 24/7'
                    : 'Lock Screen Push: ON 24/7'
                  : language === 'vi'
                  ? 'Màn hình khóa: Đang hoạt động'
                  : 'Lock Screen: Active'}
              </span>
            </div>
            {onOpenFcmPush && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenFcmPush();
                }}
                className="px-2 py-0.5 rounded-md bg-[#3064AE] hover:bg-[#417AC6] text-[#E0FAEB] font-bold text-[10px] transition cursor-pointer shrink-0 border border-[#C5E5EC]/30"
              >
                {language === 'vi' ? 'Cài đặt FCM →' : 'FCM Setup →'}
              </button>
            )}
          </div>

          {/* Filter Tabs (Việc làm, Ví tiền, Hệ thống - Đã gỡ bỏ lọc tin nhắn chat) */}
          <div className="flex items-center px-2.5 py-1.5 bg-[#0B1528] gap-1 text-[11px] overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setFilterTab('ALL');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                filterTab === 'ALL'
                  ? 'bg-[#3064AE] text-white shadow-xs'
                  : 'text-[#C5E5EC]/70 hover:text-white hover:bg-[#12233B]'
              }`}
            >
              {language === 'vi' ? 'Tất cả' : 'All'} ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setFilterTab('GIG');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                filterTab === 'GIG'
                  ? 'bg-[#3064AE] text-white shadow-xs'
                  : 'text-[#C5E5EC]/70 hover:text-white hover:bg-[#12233B]'
              }`}
            >
              {language === 'vi' ? '⚡ Việc làm' : '⚡ Gigs'}
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setFilterTab('PAYMENT');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                filterTab === 'PAYMENT'
                  ? 'bg-[#3064AE] text-white shadow-xs'
                  : 'text-[#C5E5EC]/70 hover:text-white hover:bg-[#12233B]'
              }`}
            >
              {language === 'vi' ? '💰 Ví & Escrow' : '💰 Wallet'}
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setFilterTab('SYSTEM');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                filterTab === 'SYSTEM'
                  ? 'bg-[#3064AE] text-white shadow-xs'
                  : 'text-[#C5E5EC]/70 hover:text-white hover:bg-[#12233B]'
              }`}
            >
              {language === 'vi' ? '📢 Hệ thống' : '📢 System'}
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[350px] overflow-y-auto divide-y divide-[#C5E5EC]/10 scrollbar-thin">
            {filteredNotifications.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-[#12233B] flex items-center justify-center text-slate-400 border border-[#C5E5EC]/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-xs font-bold text-white">
                  {language === 'vi' ? 'Chưa có thông báo nào' : 'No notifications yet'}
                </p>
                <p className="text-[11px] text-[#C5E5EC]/60 max-w-xs mx-auto">
                  {filterTab === 'GIG'
                    ? (language === 'vi' ? 'Thông báo về công việc mới và cập nhật tiến độ sẽ hiển thị ở đây.' : 'Job updates and new campus gigs will appear here.')
                    : filterTab === 'PAYMENT'
                    ? (language === 'vi' ? 'Biến động số dư nạp/rút và giải ngân Escrow sẽ hiển thị ở đây.' : 'Wallet balance and Escrow release alerts will appear here.')
                    : (language === 'vi' ? 'Các thông báo việc làm và tài chính từ hệ thống sẽ hiển thị trực tiếp tại đây!' : 'System and job notifications will appear here in real time!')}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                let IconComponent = Zap;
                let iconColor = 'text-cyan-300';
                let iconBg = 'bg-cyan-500/20 border-cyan-500/30';
                let typeBadgeText = language === 'vi' ? 'Việc làm' : 'Gig';
                let badgeClass = 'bg-[#3064AE]/30 text-cyan-300 border-cyan-500/30';

                if (item.type === 'GIG') {
                  IconComponent = Briefcase;
                  iconColor = 'text-cyan-300';
                  iconBg = 'bg-cyan-500/20 border-cyan-500/30';
                  typeBadgeText = language === 'vi' ? 'Việc làm' : 'Gig';
                  badgeClass = 'bg-[#3064AE]/30 text-cyan-300 border-cyan-500/30';
                } else if (item.type === 'PAYMENT') {
                  IconComponent = DollarSign;
                  iconColor = 'text-emerald-300';
                  iconBg = 'bg-emerald-500/20 border-emerald-500/30';
                  typeBadgeText = language === 'vi' ? 'Ví tiền' : 'Wallet';
                  badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                } else if (item.type === 'ESCROW') {
                  IconComponent = ShieldCheck;
                  iconColor = 'text-purple-300';
                  iconBg = 'bg-purple-500/20 border-purple-500/30';
                  typeBadgeText = 'Smart Escrow';
                  badgeClass = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                } else if (item.type === 'SYSTEM') {
                  IconComponent = Info;
                  iconColor = 'text-amber-300';
                  iconBg = 'bg-amber-500/20 border-amber-500/30';
                  typeBadgeText = language === 'vi' ? 'Hệ thống' : 'System';
                  badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3 transition flex items-start space-x-3 cursor-pointer group hover:bg-[#162B48]/90 relative ${
                      !item.isRead ? 'bg-[#12233B]/70' : 'bg-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 border ${iconBg} mt-0.5`}>
                      <IconComponent className={`w-4 h-4 ${iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold border shrink-0 ${badgeClass}`}>
                            {typeBadgeText}
                          </span>
                          <p
                            className={`text-xs truncate ${
                              !item.isRead ? 'font-black text-white' : 'font-semibold text-slate-300'
                            }`}
                          >
                            {item.title}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-1 shrink-0">
                          {!item.isRead && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
                          )}
                          {/* Toggle read status button */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleRead(e, item.id)}
                            className="p-1 rounded hover:bg-[#1A3358] text-slate-400 hover:text-cyan-300 transition cursor-pointer"
                            title={item.isRead ? (language === 'vi' ? 'Đánh dấu chưa đọc' : 'Mark unread') : (language === 'vi' ? 'Đánh dấu đã đọc' : 'Mark read')}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          {/* Delete single notification button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteNotification(e, item.id)}
                            className="p-1 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                            title={language === 'vi' ? 'Xóa thông báo này' : 'Delete notification'}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#C5E5EC]/80 line-clamp-2 leading-relaxed">
                        {item.body}
                      </p>

                      {/* Display amount if present */}
                      {item.amount !== undefined && item.amount !== 0 && (
                        <div className="pt-0.5">
                          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                            item.amount > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {item.amount > 0 ? '+' : ''}{formatVnd(item.amount)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-2.5 h-2.5 text-[#C5E5EC]/50" />
                          <span>{formatRelativeTime(item.timestamp)}</span>
                        </span>
                        {item.linkAction && (
                          <span className="text-cyan-300 group-hover:underline font-bold flex items-center space-x-0.5">
                            <span>
                              {item.linkAction === 'WALLET'
                                ? (language === 'vi' ? 'Mở ví' : 'Open wallet')
                                : (language === 'vi' ? 'Xem việc' : 'View gig')}
                            </span>
                            <ChevronRight className="w-3 h-3 inline" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with quick push testing */}
          <div className="p-2.5 bg-[#0B1528] flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                sendWebPushNotification(
                  language === 'vi' ? '⚡ TEST THÔNG BÁO GIGME' : '⚡ GIGME NOTIFICATION TEST',
                  language === 'vi'
                    ? 'Thông báo màn hình khóa thời gian thực đã sẵn sàng!'
                    : 'Realtime lock screen push notification is active!',
                  '/pwa-192x192.png'
                );
              }}
              className="text-[#C5E5EC] hover:text-white font-bold transition flex items-center space-x-1 cursor-pointer"
            >
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>{language === 'vi' ? 'Bắn thử 1 thông báo' : 'Send test alert'}</span>
            </button>

            {onOpenFcmPush && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenFcmPush();
                }}
                className="text-cyan-300 hover:text-cyan-200 font-bold transition flex items-center space-x-1 cursor-pointer"
              >
                <span>{language === 'vi' ? 'Hạ tầng FCM' : 'FCM Config'}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
