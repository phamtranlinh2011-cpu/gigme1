import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Zap,
  DollarSign,
  TrendingDown,
  ShieldAlert,
  Volume2,
  CheckCircle2,
  X,
  Send,
  Smartphone,
  Copy,
  Check,
  Radio,
  Lock,
  Timer,
  Sparkles,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { playNotificationSound } from '../utils/audio';

interface FcmPushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FcmPushNotificationModal: React.FC<FcmPushNotificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, toggleFcm, sendTestFcmPush, setNotificationSound, sendWebPushNotification } = useGigMe();

  const isEnabled = currentUser?.fcmEnabled ?? false;
  const fcmToken = currentUser?.fcmToken || 'web_push_device_token_live_ready';

  const [copiedToken, setCopiedToken] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<string>('default');
  const [lockScreenCountdown, setLockScreenCountdown] = useState<number | null>(null);

  const [subFlashGigs, setSubFlashGigs] = useState(true);
  const [subEscrow, setSubEscrow] = useState(true);
  const [subReverseAuction, setSubReverseAuction] = useState(true);
  const [subSafeWalk, setSubSafeWalk] = useState(true);


  const [history, setHistory] = useState<
    Array<{ id: string; title: string; body: string; time: string; type: string }>
  >([
    {
      id: 'fcm_1',
      title: '⚡ Kèo hỏa tốc 50m quanh bạn!',
      body: 'Giao tài liệu KTX Khu B - Thù lao: 45.000đ (Smart Escrow đã khóa)',
      time: 'Vừa xong',
      type: 'FLASH',
    },
    {
      id: 'fcm_2',
      title: '💰 Giải ngân thù lao thành công',
      body: 'Bạn đã nhận 120.000đ cho đơn việc "Gia sư Giải tích 2".',
      time: '15 phút trước',
      type: 'ESCROW',
    },
    {
      id: 'fcm_3',
      title: '📉 Phòng Đấu Giá Ngược có giá mới',
      body: 'Một sinh viên vừa hạ giá chào đơn "Vẽ poster Canva" xuống 80.000đ!',
      time: '1 giờ trước',
      type: 'BID',
    },
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = () => {
    if (!isEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then((permission) => {
        setBrowserPermission(permission);
      });
    }
    toggleFcm(!isEnabled);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(fcmToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const triggerLockScreenTest = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        Notification.requestPermission().then((permission) => {
          setBrowserPermission(permission);
          if (permission === 'granted') {
            startLockScreenCountdown();
          }
        });
        return;
      }
    }
    startLockScreenCountdown();
  };

  const startLockScreenCountdown = () => {
    setLockScreenCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setLockScreenCountdown(count);
      } else {
        clearInterval(interval);
        setLockScreenCountdown(null);
        // Dispatch lockscreen push notification via Service Worker
        sendWebPushNotification(
          '⚡ KÈO HỎA TỐC 50M: GIAO TRÀ SỮA KTX!',
          'Thù lao 40.000đ • Smart Escrow đã khóa bảo chứng 100% • Mở máy nhận ngay!',
          '/pwa-192x192.png'
        );
        setHistory((prev) => [
          {
            id: `fcm_${Date.now()}`,
            title: '⚡ KÈO HỎA TỐC 50M: GIAO TRÀ SỮA KTX!',
            body: 'Thù lao 40.000đ • Đã bắn thông báo ra Màn hình khóa',
            time: 'Vừa xong',
            type: 'FLASH',
          },
          ...prev,
        ]);
      }
    }, 1000);
  };

  const triggerTestNotification = (type: 'FLASH' | 'ESCROW' | 'AUCTION' | 'SOS') => {

    let title = '';
    let body = '';

    switch (type) {
      case 'FLASH':
        title = '⚡ KÈO HỎA TỐC GẦN BẠN (50M)!';
        body = 'Ship trà sữa KTX Nhà H2 qua Cổng 1 • Thù lao 35.000đ • Nhận ngay kẻo lỡ!';
        break;
      case 'ESCROW':
        title = '💰 SMART ESCROW ĐÃ GIẢI NGÂN!';
        body = 'Số dư ví khả dụng của bạn vừa cộng thêm 150.000đ. Nhấn để kiểm tra ví.';
        break;
      case 'AUCTION':
        title = '📉 ĐẤU GIÁ NGƯỢC: GIÁ MỚI SIÊU HẤP DẪN';
        body = 'Freelancer Minh Tuấn vừa giảm giá chào thầu đơn còn 95.000đ!';
        break;
      case 'SOS':
        title = '🚨 SOS SAFEWALK BẢO VỆ ĐÊM';
        body = 'Bạn cùng phòng báo đã về đến phòng KTX an toàn lúc 23:45.';
        break;
    }

    sendTestFcmPush(title, body, type);
    setHistory((prev) => [
      {
        id: `fcm_${Date.now()}`,
        title,
        body,
        time: 'Vừa xong',
        type,
      },
      ...prev,
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-blue-500/30 overflow-hidden my-4 text-slate-900 dark:text-white">
        {/* Header với phong cách Firebase Cloud Messaging */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30">
              <BellRing className="w-6 h-6 text-yellow-200 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black tracking-tight">FCM Push Notification</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/25 text-white font-extrabold uppercase tracking-wider">
                  Hỏa Tốc 24/7
                </span>
              </div>
              <p className="text-xs text-orange-100 mt-0.5">
                Bắn thông báo đẩy tức thì theo bán kính định vị & sự kiện Escrow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Main Activation Banner */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-orange-50/40 dark:from-slate-800/80 dark:to-orange-950/20 border border-orange-500/30">
            <div className="flex items-start space-x-3">
              <div
                className={`p-2.5 rounded-xl ${
                  isEnabled
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}
              >
                <Radio className={`w-5 h-5 ${isEnabled ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-extrabold text-sm">
                    {isEnabled ? 'Trạng thái: Đang Lắng Nghe FCM' : 'Trạng thái: Đang Tắt FCM'}
                  </h4>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isEnabled
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {isEnabled ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Quyền trình duyệt Web: <span className="font-bold text-orange-500">{browserPermission}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleToggle}
              className={`px-4 py-2 rounded-xl font-extrabold text-xs transition shadow-md ${
                isEnabled
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
              }`}
            >
              {isEnabled ? 'Tắt Thông Báo' : 'Bật FCM Ngay'}
            </button>
          </div>

          {/* Device Token Pill */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
                <Smartphone className="w-4 h-4 text-orange-500" />
                <span>Mã Thiết Bị Firebase FCM Token:</span>
              </span>
              <button
                onClick={handleCopyToken}
                className="flex items-center space-x-1 text-orange-600 dark:text-orange-400 hover:underline font-bold cursor-pointer"
              >
                {copiedToken ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép token</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
              {fcmToken}
            </div>
          </div>

          {/* Lock Screen Web Push Notification Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0C1728] via-[#102038] to-[#12233B] border border-[#3064AE]/50 space-y-3 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-xl bg-[#3064AE]/20 text-[#C5E5EC] border border-[#3064AE]/30">
                  <Lock className="w-5 h-5 text-[#C5E5EC]" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-extrabold text-sm text-white">Thông Báo Đẩy Màn Hình Khóa</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3064AE]/40 text-[#E0FAEB] font-black uppercase tracking-wider">
                      PWA 24/7
                    </span>
                  </div>
                  <p className="text-xs text-[#C5E5EC]/80 mt-0.5">
                    Rung chuông & đẩy banner lên màn hình khóa điện thoại cả khi khóa màn hình
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span>Quyền hệ thống Lock Screen:</span>
                <span className={`font-bold ${browserPermission === 'granted' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {browserPermission === 'granted' ? '✓ Đã Bật (Cho Phép)' : 'Chưa Cấp Quyền'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Service Worker Lock Screen:</span>
                <span className="font-bold text-emerald-400">✓ Sẵn sàng (sw.js)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Nhịp rung cảm ứng (Haptic):</span>
                <span className="font-mono text-[11px] text-[#C5E5EC]">[200ms, 100ms, 200ms]</span>
              </div>
            </div>

            <button
              onClick={triggerLockScreenTest}
              disabled={lockScreenCountdown !== null}
              className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-md ${
                lockScreenCountdown !== null
                  ? 'bg-amber-500 text-black animate-pulse'
                  : 'bg-gradient-to-r from-[#3064AE] via-[#417AC6] to-[#C5E5EC] hover:brightness-110 text-white'
              }`}
            >
              {lockScreenCountdown !== null ? (
                <>
                  <Timer className="w-4 h-4 animate-spin" />
                  <span>Khóa màn hình điện thoại ngay! ({lockScreenCountdown}s...)</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>📲 Bắn Thử Ra Màn Hình Khóa Ngay (Đếm ngược 3s)</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-400 italic">
              *Hướng dẫn: Bấm nút trên, lập tức bấm nút Nguồn khóa màn hình điện thoại hoặc về màn hình chính. Sau 3 giây máy sẽ rung và bắn thông báo GigMe trực tiếp ngoài màn hình khóa.
            </p>
          </div>


          {/* Notification Channels Selection */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Kênh thông báo đăng ký:
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={subFlashGigs}
                  onChange={(e) => setSubFlashGigs(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4"
                />
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="font-bold">Kèo hỏa tốc &lt; 50m</span>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={subEscrow}
                  onChange={(e) => setSubEscrow(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4"
                />
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold">Biến động Smart Escrow</span>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={subReverseAuction}
                  onChange={(e) => setSubReverseAuction(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4"
                />
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-blue-500" />
                  <span className="font-bold">Phòng đấu giá ngược</span>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={subSafeWalk}
                  onChange={(e) => setSubSafeWalk(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4"
                />
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span className="font-bold">Cảnh báo SOS SafeWalk</span>
                </div>
              </label>
            </div>
          </div>

          {/* Sound Preferences */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center space-x-1.5">
                <Volume2 className="w-4 h-4 text-orange-500" />
                <span>Âm thanh thông báo ting ting:</span>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { key: 'BANK_TING', label: 'Ting Ngân Hàng' },
                { key: 'CASH_COUNT', label: 'Tiền Rào Rạt' },
                { key: 'DING_DEFAULT', label: 'Chuông Kép' },
                { key: 'SOFT_VIBRATE', label: 'Rung Nhẹ' },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => {
                    setNotificationSound(s.key as any);
                    playNotificationSound(s.key as any);
                  }}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-orange-500/10 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold transition text-center"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dispatch Quick Notification Samples */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mẫu thông báo đẩy hỏa tốc hệ thống:
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => triggerTestNotification('FLASH')}
                className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold flex items-center justify-center space-x-1.5 transition"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Kèo Gấp 50m</span>
              </button>
              <button
                onClick={() => triggerTestNotification('ESCROW')}
                className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold flex items-center justify-center space-x-1.5 transition"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Smart Escrow</span>
              </button>
              <button
                onClick={() => triggerTestNotification('AUCTION')}
                className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 font-bold flex items-center justify-center space-x-1.5 transition"
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Đấu Giá Ngược</span>
              </button>
              <button
                onClick={() => triggerTestNotification('SOS')}
                className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30 font-bold flex items-center justify-center space-x-1.5 transition"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Cảnh Báo SafeWalk</span>
              </button>
            </div>
          </div>

          {/* FCM Push History */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Lịch sử thông báo đẩy vừa nhận:
            </h5>
            <div className="space-y-1.5">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start space-x-2.5 text-xs"
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      h.type === 'FLASH'
                        ? 'bg-amber-500/20 text-amber-500'
                        : h.type === 'ESCROW'
                        ? 'bg-emerald-500/20 text-emerald-500'
                        : h.type === 'SOS'
                        ? 'bg-red-500/20 text-red-500'
                        : 'bg-blue-500/20 text-blue-500'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {h.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">{h.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {h.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-md transition"
          >
            Đã Hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
