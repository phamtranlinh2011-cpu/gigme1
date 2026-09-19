import React, { useState, useEffect } from 'react';
import {
  Zap,
  Wallet,
  ShieldCheck,
  Moon,
  Sun,
  ShieldAlert,
  User,
  PlusCircle,
  Award,
  Download,
  Bell,
  Radio,
  Flame,
  MoreVertical,
  X,
  Sparkles,
  LogOut,
  QrCode,
  Smartphone,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { formatVnd, USER_TIERS } from '../types';

interface HeaderProps {
  onOpenCreateGig: () => void;
  onOpenWallet: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onOpenDownloadApp: () => void;
  onOpenLeaderboard?: () => void;
  onOpenMarketplace?: () => void;
  onOpenChat?: () => void;
  onOpenFcmPush?: () => void;
  onOpenEloModal?: () => void;
  onOpenVietQrScanner?: () => void;
  onOpenPaymentGateway?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateGig,
  onOpenWallet,
  onOpenProfile,
  onOpenAdmin,
  onOpenDownloadApp,
  onOpenLeaderboard,
  onOpenMarketplace,
  onOpenChat,
  onOpenFcmPush,
  onOpenEloModal,
  onOpenVietQrScanner,
  onOpenPaymentGateway,
}) => {
  const {
    currentUser,
    roleMode,
    toggleRoleMode,
    isDarkMode,
    toggleDarkMode,
    isAdminRole,
    isCloudConnected,
    logout,
  } = useGigMe();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://') ||
        window.location.search.includes('app=true');
      setIsStandalone(Boolean(isStandaloneMode));
    }
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0B1528]/95 dark:bg-[#070D18]/98 border-b border-[#C5E5EC]/20 shadow-[0_4px_25px_-4px_rgba(48,100,174,0.25)] transition-colors duration-200">
      {/* Top Accent Proportional Brand Gradient Stripe (60% Cobalt -> 30% Crystal -> 10% Ethereal) */}
      <div className="h-1 w-full bg-brand-horiz-gradient" />

      {/* Admin Master Alert Bar */}
      {isAdminRole && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-4 py-1.5 flex items-center justify-between text-xs text-white shadow-sm">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span className="font-bold tracking-wide">QUYỀN QUẢN TRỊ VIÊN TỐI CAO (MASTER ROOT)</span>
          </div>
          <button
            id="admin-dashboard-btn"
            onClick={onOpenAdmin}
            className="px-2.5 py-0.5 rounded-lg bg-white text-red-700 font-bold hover:bg-yellow-100 transition shadow-sm cursor-pointer"
          >
            Mở Admin &rarr;
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer select-none shrink-0">
          <img
            src="/logo.png"
            alt="GigMe Logo"
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover shadow-md shadow-[#3064AE]/30 border-2 border-[#C5E5EC]"
          />
          <div>
            <div className="flex items-center space-x-1">
              <span className="text-lg sm:text-xl font-black tracking-tight text-white">Gig</span>
              <span className="text-lg sm:text-xl font-black text-[#C5E5EC]">Me</span>
              <span className="text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#3064AE] to-[#255294] text-[#E0FAEB] border border-[#C5E5EC]/30 shadow-xs">
                Sinh Viên
              </span>
            </div>
            <p className="text-[10px] text-[#C5E5EC]/80 font-medium hidden sm:block">
              Nền tảng việc làm sinh viên & Smart Escrow
            </p>
          </div>
        </div>

        {/* Shortcuts: BXH Campus & Chợ KTX (Desktop only) */}
        <div className="hidden lg:flex items-center space-x-2 text-xs">
          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              className="px-3 py-1.5 rounded-xl bg-[#3064AE]/20 hover:bg-[#3064AE]/35 text-[#C5E5EC] border border-[#C5E5EC]/30 font-extrabold transition flex items-center space-x-1.5 shadow-xs active:scale-95 cursor-pointer"
            >
              <span>🏆 BXH Top</span>
            </button>
          )}
          {onOpenMarketplace && (
            <button
              onClick={onOpenMarketplace}
              className="px-3 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#E0FAEB] border border-[#E0FAEB]/30 font-extrabold transition flex items-center space-x-1.5 shadow-xs active:scale-95 cursor-pointer"
            >
              <span>📚 Chợ KTX</span>
            </button>
          )}
        </div>

        {/* Right Section: Compact on mobile, rich on desktop */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Wallet Balance Chip with Cobalt & Crystal styling */}
          <button
            id="header-wallet-btn"
            onClick={onOpenWallet}
            className="flex items-center space-x-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/30 transition group shadow-sm active:scale-95 cursor-pointer"
          >
            <div className="p-1 rounded-lg bg-[#3064AE] text-[#E0FAEB] shadow-xs border border-[#C5E5EC]/30">
              <Wallet className="w-3.5 h-3.5 group-hover:scale-110 transition" />
            </div>
            <div className="text-left leading-none">
              <span className="text-[9px] text-[#C5E5EC] hidden sm:block font-extrabold">Số dư Ví</span>
              <span className="text-xs sm:text-sm font-black text-white font-mono">
                {currentUser ? formatVnd(currentUser.walletBalance) : '0đ'}
              </span>
            </div>
          </button>

          {/* DESKTOP ONLY BUTTONS */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Tải App APK Button (Ẩn khi đang chạy trong app) */}
            {!isStandalone && (
              <button
                id="header-download-app-btn"
                onClick={onOpenDownloadApp}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#417AC6] to-[#C5E5EC] text-white font-extrabold text-xs hover:brightness-110 shadow-md shadow-[#3064AE]/30 transition cursor-pointer active:scale-95 border border-[#E0FAEB]/30"
                title="Tải File APK cho điện thoại Android"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Tải APK</span>
              </button>
            )}

            {/* Quét VietQR Nạp rút 24/7 */}
            {onOpenVietQrScanner && (
              <button
                id="header-vietqr-btn"
                onClick={onOpenVietQrScanner}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#E0FAEB] border border-[#C5E5EC]/30 transition text-xs font-bold active:scale-95 shadow-sm cursor-pointer"
                title="VietQR: Quét VietQR Nạp rút 24/7"
              >
                <QrCode className="w-4 h-4 text-[#E0FAEB]" />
                <span className="hidden lg:inline">VietQR 24/7</span>
              </button>
            )}

            {/* Cổng Ví Điện Tử MoMo & ZaloPay */}
            {onOpenPaymentGateway && (
              <button
                id="header-momo-btn"
                onClick={onOpenPaymentGateway}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-pink-300 border border-pink-500/30 transition text-xs font-bold active:scale-95 shadow-sm cursor-pointer"
                title="Cổng Ví Điện Tử MoMo & ZaloPay"
              >
                <Smartphone className="w-4 h-4 text-pink-400" />
                <span className="hidden lg:inline">MoMo & ZaloPay</span>
              </button>
            )}

            {/* ELO Điểm Tín Nhiệm Huy hiệu & rank */}
            {onOpenEloModal && (
              <button
                id="header-elo-btn"
                onClick={onOpenEloModal}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#E0FAEB] border border-[#C5E5EC]/30 transition text-xs font-bold active:scale-95 shadow-sm cursor-pointer"
                title="ELO: Điểm Tín Nhiệm Huy hiệu & rank"
              >
                <Award className="w-4 h-4 text-[#C5E5EC]" />
                <span className="hidden xl:inline">{currentUser?.eloRating ?? 0} ELO</span>
              </button>
            )}

            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/30 text-[#C5E5EC] transition active:scale-95 shadow-sm cursor-pointer"
              title={isDarkMode ? 'Đang ở Chế độ Siêu Tối (Bấm để chuyển sang Xanh Cobalt)' : 'Đang ở Chế độ Xanh Cobalt (Bấm để chuyển sang Siêu Tối)'}
            >
              {isDarkMode ? <Moon className="w-4 h-4 text-[#C5E5EC]" /> : <Sun className="w-4 h-4 text-[#E0FAEB]" />}
            </button>

            {/* Profile */}
            <button
              id="header-profile-btn"
              onClick={onOpenProfile}
              className="flex items-center space-x-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/30 transition active:scale-95 shadow-sm cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-gradient-to-br from-[#3064AE] to-[#255294] border border-[#C5E5EC]/40 flex items-center justify-center font-bold text-xs text-white shadow shrink-0">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : currentUser ? (
                  currentUser.name.charAt(0).toUpperCase()
                ) : (
                  <User className="w-4 h-4 text-[#C5E5EC]" />
                )}
              </div>
              <span className="text-xs font-semibold text-white hidden lg:block">
                {currentUser?.name || 'Tài khoản'}
              </span>
            </button>

            {/* Logout button */}
            <button
              id="header-logout-btn"
              onClick={logout}
              className="p-2 rounded-xl bg-[#12233B] hover:bg-red-950/40 text-[#C5E5EC] hover:text-red-400 border border-[#C5E5EC]/20 hover:border-red-500/40 transition active:scale-95 shadow-sm cursor-pointer"
              title="Đăng xuất khỏi tài khoản"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* MOBILE ONLY MENU TOGGLE BUTTON */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/30 text-[#C5E5EC] transition active:scale-95 shadow-sm cursor-pointer"
            title="Mở menu tiện ích"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 text-white" /> : <MoreVertical className="w-4 h-4 text-[#C5E5EC]" />}
          </button>
        </div>
      </div>

      {/* MOBILE POPUP ACTION DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[56px] bg-[#0E1B2E]/98 border-b border-[#C5E5EC]/25 shadow-2xl p-4 space-y-3 z-50 backdrop-blur-xl animate-fade-in max-h-[85vh] overflow-y-auto text-white">
          {/* User brief info */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-[#3064AE] to-[#255294] border border-[#C5E5EC]/30 flex items-center justify-center font-bold text-sm text-white shadow shrink-0">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : currentUser ? (
                  currentUser.name.charAt(0).toUpperCase()
                ) : (
                  <User className="w-4 h-4 text-[#C5E5EC]" />
                )}
              </div>
              <div>
                <p className="font-extrabold text-white text-xs">{currentUser?.name || 'Sinh viên'}</p>
                <div className="flex items-center space-x-1.5 text-[10px] text-[#C5E5EC]">
                  <span className="text-[#E0FAEB] font-bold">{currentUser?.eloRating ?? 0} ELO</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenProfile();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#3064AE] to-[#255294] text-white text-xs font-bold transition hover:brightness-110 shadow-sm border border-[#C5E5EC]/30 cursor-pointer"
            >
              Hồ sơ &rarr;
            </button>
          </div>

          {/* Quick grid of utilities */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* 1. VietQR Quét VietQR Nạp rút 24/7 */}
            {onOpenVietQrScanner && (
              <button
                id="mobile-vietqr-btn"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenVietQrScanner();
                }}
                className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20 text-left hover:bg-[#162B48] transition flex items-center space-x-2.5 cursor-pointer active:scale-95"
              >
                <div className="p-1.5 rounded-lg bg-[#3064AE]/30 text-[#E0FAEB] shrink-0 border border-[#C5E5EC]/20">
                  <QrCode className="w-4 h-4 text-[#E0FAEB]" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">Quét VietQR</p>
                  <p className="text-[10px] text-[#C5E5EC]/80 truncate">Nạp rút 24/7</p>
                </div>
              </button>
            )}

            {/* 2. MoMo Cổng Ví Điện Tử MoMo & ZaloPay */}
            {onOpenPaymentGateway && (
              <button
                id="mobile-momo-btn"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenPaymentGateway();
                }}
                className="p-3 rounded-xl bg-[#12233B] border border-pink-500/20 text-left hover:bg-[#162B48] transition flex items-center space-x-2.5 cursor-pointer active:scale-95"
              >
                <div className="p-1.5 rounded-lg bg-pink-950/40 text-pink-300 shrink-0 border border-pink-400/20">
                  <Smartphone className="w-4 h-4 text-pink-300" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">Cổng Ví MoMo</p>
                  <p className="text-[10px] text-pink-300/80 truncate">MoMo & ZaloPay</p>
                </div>
              </button>
            )}

            {/* 3. ELO Điểm Tín Nhiệm Huy hiệu & rank */}
            {onOpenEloModal && (
              <button
                id="mobile-elo-btn"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenEloModal();
                }}
                className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20 text-left hover:bg-[#162B48] transition flex items-center space-x-2.5 cursor-pointer active:scale-95"
              >
                <div className="p-1.5 rounded-lg bg-[#3064AE]/30 text-[#E0FAEB] shrink-0 border border-[#C5E5EC]/20">
                  <Award className="w-4 h-4 text-[#E0FAEB]" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">Điểm Tín Nhiệm</p>
                  <p className="text-[10px] text-[#C5E5EC]/80 truncate">Huy hiệu & rank</p>
                </div>
              </button>
            )}

            {!isStandalone && (
              <button
                id="mobile-download-apk-btn"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenDownloadApp();
                }}
                className="p-3 rounded-xl bg-[#12233B] border border-[#3064AE]/40 text-left hover:bg-[#162B48] transition flex items-center space-x-2.5 cursor-pointer active:scale-95"
              >
                <div className="p-1.5 rounded-lg bg-[#3064AE]/40 text-[#C5E5EC] shrink-0 border border-[#C5E5EC]/20">
                  <Download className="w-4 h-4 text-[#C5E5EC]" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">Tải File APK</p>
                  <p className="text-[10px] text-[#E0FAEB] truncate">Android Package</p>
                </div>
              </button>
            )}
          </div>

          {/* Theme & Admin bottom bar */}
          <div className="flex items-center justify-between pt-2 border-t border-[#C5E5EC]/15 text-xs">
            <button
              onClick={toggleDarkMode}
              className="flex items-center space-x-2 py-2 px-3 rounded-xl bg-[#12233B] text-[#C5E5EC] font-bold border border-[#C5E5EC]/20 cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-[#E0FAEB]" /> : <Moon className="w-4 h-4 text-[#C5E5EC]" />}
              <span>{isDarkMode ? 'Giao diện Sáng' : 'Giao diện Tối'}</span>
            </button>

            {isAdminRole && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm cursor-pointer"
              >
                Bảng Admin
              </button>
            )}
          </div>

          {/* Logout Action */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              logout();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Đăng Xuất Tài Khoản</span>
          </button>
        </div>
      )}
    </header>
  );
};
