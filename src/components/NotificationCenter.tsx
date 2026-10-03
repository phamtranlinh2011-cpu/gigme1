import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  MessageSquare,
  DollarSign,
  Wallet,
  ShieldCheck,
  Zap,
  Sparkles,
  ExternalLink,
  X,
  Radio,
  Smartphone,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { formatVnd, ChatMessageEntity, WalletTransactionEntity, GigEntity } from '../types';
import { cloudService, realtimeManager } from '../services/cloudSync';

export interface NotificationItem {
  id: string;
  type: 'MESSAGE' | 'PAYMENT' | 'ESCROW' | 'GIG';
  title: string;
  body: string;
  timestamp: number;
  isRead: boolean;
  linkAction?: 'CHAT' | 'WALLET' | 'GIG';
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
  onOpenChat,
  onSelectGigDetail,
}) => {
  const {
    currentUser,
    sendWebPushNotification,
    rawGigs,
    markConversationAsRead,
    toggleFcm,
    language,
  } = useGigMe();

  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'ALL' | 'MESSAGE' | 'PAYMENT'>('ALL');
  const [isFirestoreLive, setIsFirestoreLive] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Notifications state loaded from cache or defaults
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'welcome_notif',
        type: 'ESCROW',
        title: '🛡️ Bảo vệ Smart Escrow kích hoạt',
        body: 'Hệ thống ký quỹ bảo chứng 100% thù lao tự động cho sinh viên.',
        timestamp: Date.now() - 3600000,
        isRead: false,
        linkAction: 'WALLET',
      },
    ];
  });

  // Save to localStorage whenever notifications change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
    } catch {
      // ignore
    }
  }, [notifications]);

  // Close dropdown when clicking outside (Supports both Mouse and Touch events)
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
    if (seenIdsRef.current.has(item.id)) return;
    seenIdsRef.current.add(item.id);

    setNotifications((prev) => [item, ...prev.filter((n) => n.id !== item.id)]);

    // Trigger FCM lockscreen push & audio if new event occurred after mount
    if (triggerPush && item.timestamp > mountTimeRef.current - 15000) {
      sendWebPushNotification(item.title, item.body, '/pwa-192x192.png');
    }
  };

  // ==================== REAL-TIME FIRESTORE PULL ====================
  useEffect(() => {
    if (!currentUser) return;
    const currentUserId = currentUser.id;

    let unsubMessages: (() => void) | null = null;
    let unsubTransactions: (() => void) | null = null;
    let unsubGigs: (() => void) | null = null;

    try {
      // 1. Subscribe to Chat Messages in Firestore
      const messagesRef = collection(db, 'messages');
      unsubMessages = onSnapshot(
        messagesRef,
        (snapshot) => {
          setIsFirestoreLive(true);
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as ChatMessageEntity;
            if (!data) return;

            // Only notify if message is sent by someone else to the current user
            const isSentToMe =
              data.partnerId === currentUserId ||
              (!data.partnerId && data.senderId !== currentUserId);

            if (isSentToMe && data.senderId !== currentUserId) {
              const notifId = `msg_${data.id || change.doc.id}`;
              const isRecent = data.timestamp > mountTimeRef.current - 10000;

              if (change.type === 'added' || (change.type === 'modified' && isRecent)) {
                addNotification(
                  {
                    id: notifId,
                    type: 'MESSAGE',
                    title: `💬 Tin nhắn từ ${data.senderName || 'Người dùng'}`,
                    body: data.message || 'Đã gửi một tệp đính kèm hoặc hình ảnh.',
                    timestamp: data.timestamp || Date.now(),
                    isRead: data.isRead ?? false,
                    linkAction: 'CHAT',
                    targetId: data.threadId || data.gigId || data.senderId,
                  },
                  isRecent
                );
              }
            }
          });
        },
        (error) => {
          console.warn('Firestore messages subscription offline/fallback:', error);
          setIsFirestoreLive(false);
        }
      );

      // 2. Subscribe to Transactions (Payment Statuses) in Firestore
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
              if (data.type === 'ESCROW_PAYOUT' || data.type === 'ESCROW_RELEASE') iconPrefix = '🎉';
              else if (data.type === 'ADMIN_REFUND') iconPrefix = '↩️';
              else if (data.type === 'VIETQR_DEPOSIT' || data.type === 'EWALLET_DEPOSIT') iconPrefix = '⚡';
              else if (data.type === 'BANK_WITHDRAWAL' || data.type === 'EWALLET_WITHDRAW') iconPrefix = '🏦';

              addNotification(
                {
                  id: notifId,
                  type: 'PAYMENT',
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

      // 3. Subscribe to Gigs (Status Transitions) in Firestore
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

    // Hybrid Fallback: Also listen to local SSE event stream from Express
    const unsubSSEChat = realtimeManager.on('chat_saved', (data: ChatMessageEntity) => {
      if (data && data.senderId !== currentUserId) {
        addNotification(
          {
            id: `sse_chat_${data.id}_${Date.now()}`,
            type: 'MESSAGE',
            title: `💬 Tin nhắn từ ${data.senderName || 'Bạn bè'}`,
            body: data.message || 'Tin nhắn mới',
            timestamp: data.timestamp || Date.now(),
            isRead: false,
            linkAction: 'CHAT',
            targetId: data.threadId || data.gigId || data.senderId,
          },
          true
        );
      }
    });

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
      if (unsubMessages) unsubMessages();
      if (unsubTransactions) unsubTransactions();
      if (unsubGigs) unsubGigs();
      unsubSSEChat();
      unsubSSETx();
    };
  }, [currentUser?.id]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filterTab === 'ALL') return notifications;
    if (filterTab === 'MESSAGE') return notifications.filter((n) => n.type === 'MESSAGE');
    if (filterTab === 'PAYMENT') return notifications.filter((n) => n.type === 'PAYMENT' || n.type === 'ESCROW');
    return notifications;
  }, [notifications, filterTab]);

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
    seenIdsRef.current.clear();
  };

  const handleNotificationClick = (item: NotificationItem) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );

    setIsOpen(false);

    if (item.linkAction === 'CHAT') {
      if (item.targetId) {
        markConversationAsRead(item.targetId);
      }
      onOpenChat?.();
    } else if (item.linkAction === 'WALLET') {
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
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/30 text-[#C5E5EC] hover:text-white transition active:scale-95 shadow-sm cursor-pointer group"
        title={language === 'vi' ? 'Trung tâm thông báo Realtime (Firestore & Lock Screen)' : 'Realtime Notification Center (Firestore & Lock Screen)'}
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
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[380px] max-w-[92vw] bg-[#0E1B2E]/98 backdrop-blur-xl border border-[#C5E5EC]/30 rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.7)] z-50 overflow-hidden animate-modal-in text-slate-100 divide-y divide-[#C5E5EC]/15">
          {/* Header */}
          <div className="p-3.5 bg-[#12233B]/90 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-[#3064AE]/30 text-[#E0FAEB] border border-[#C5E5EC]/20">
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
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="p-1.5 rounded-lg hover:bg-[#162B48] text-[#C5E5EC] hover:text-[#E0FAEB] transition text-[11px] flex items-center space-x-1 cursor-pointer"
                  title={language === 'vi' ? 'Đánh dấu tất cả đã đọc' : 'Mark all as read'}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="p-1.5 rounded-lg hover:bg-red-950/40 text-slate-400 hover:text-red-300 transition cursor-pointer"
                  title={language === 'vi' ? 'Xóa danh sách thông báo' : 'Clear all notifications'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
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
                  ? 'Màn hình khóa: Chưa kích hoạt'
                  : 'Lock Screen: Inactive'}
              </span>
            </div>
            {onOpenFcmPush && (
              <button
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

          {/* Filter Tabs */}
          <div className="flex items-center px-3 py-1.5 bg-[#0B1528] gap-1 text-[11px]">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterTab === 'ALL'
                  ? 'bg-[#3064AE] text-white shadow-xs'
                  : 'text-[#C5E5EC]/70 hover:text-white hover:bg-[#12233B]'
              }`}
            >
              {language === 'vi' ? 'Tất cả' : 'All'} ({notifications.length})
            </button>
            <button
              onClick={() => setFilterTab('MESSAGE')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterTab === 'MESSAGE'
                  ? 'bg-[#3064AE] text-white shadow-xs'
                  : 'text-[#C5E5EC]/70 hover:text-white hover:bg-[#12233B]'
              }`}
            >
              {language === 'vi' ? 'Tin nhắn Gig' : 'Messages'}
            </button>
            <button
              onClick={() => setFilterTab('PAYMENT')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterTab === 'PAYMENT'
                  ? 'bg-[#3064AE] text-white shadow-xs'
                  : 'text-[#C5E5EC]/70 hover:text-white hover:bg-[#12233B]'
              }`}
            >
              {language === 'vi' ? 'Thanh toán & Ví' : 'Wallet & Escrow'}
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-[#C5E5EC]/10 scrollbar-thin">
            {filteredNotifications.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-[#12233B] flex items-center justify-center text-slate-400 border border-[#C5E5EC]/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-xs font-bold text-white">
                  {language === 'vi' ? 'Chưa có thông báo nào' : 'No notifications yet'}
                </p>
                <p className="text-[11px] text-[#C5E5EC]/60">
                  {language === 'vi'
                    ? 'Các thông báo tin nhắn và thanh toán mới từ Firestore sẽ hiển thị trực tiếp tại đây!'
                    : 'New message and payment alerts from Firestore will appear here in real time!'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                let IconComponent = Zap;
                let iconColor = 'text-amber-300';
                let iconBg = 'bg-amber-500/20 border-amber-500/30';

                if (item.type === 'MESSAGE') {
                  IconComponent = MessageSquare;
                  iconColor = 'text-sky-300';
                  iconBg = 'bg-sky-500/20 border-sky-500/30';
                } else if (item.type === 'PAYMENT') {
                  IconComponent = DollarSign;
                  iconColor = 'text-emerald-300';
                  iconBg = 'bg-emerald-500/20 border-emerald-500/30';
                } else if (item.type === 'ESCROW') {
                  IconComponent = ShieldCheck;
                  iconColor = 'text-purple-300';
                  iconBg = 'bg-purple-500/20 border-purple-500/30';
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3 transition flex items-start space-x-3 cursor-pointer group hover:bg-[#162B48]/80 ${
                      !item.isRead ? 'bg-[#12233B]/70' : 'bg-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 border ${iconBg}`}>
                      <IconComponent className={`w-4 h-4 ${iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs truncate ${
                            !item.isRead ? 'font-black text-white' : 'font-semibold text-slate-300'
                          }`}
                        >
                          {item.title}
                        </p>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
                        )}
                      </div>

                      <p className="text-[11px] text-[#C5E5EC]/80 line-clamp-2 leading-relaxed">
                        {item.body}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-2.5 h-2.5 text-[#C5E5EC]/50" />
                          <span>{formatRelativeTime(item.timestamp)}</span>
                        </span>
                        {item.linkAction && (
                          <span className="text-cyan-300 group-hover:underline font-bold flex items-center space-x-0.5">
                            <span>
                              {item.linkAction === 'CHAT'
                                ? language === 'vi'
                                  ? 'Vào chat'
                                  : 'Open chat'
                                : item.linkAction === 'WALLET'
                                ? language === 'vi'
                                  ? 'Mở ví'
                                  : 'Open wallet'
                                : language === 'vi'
                                ? 'Xem việc'
                                : 'View gig'}
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

          {/* Footer with FCM quick action */}
          <div className="p-2.5 bg-[#0B1528] flex items-center justify-between text-[11px]">
            <button
              onClick={() => {
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
