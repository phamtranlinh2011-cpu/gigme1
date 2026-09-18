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
  onOpenSafeWalk?: () => void;
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
  onOpenSafeWalk,
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
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-gradient-to-r from-sky-100/85 via-white/95 to-indigo-50/85 dark:bg-[#0A0E17]/95 border-b border-sky-200/80 shadow-[0_4px_20px_-4px_rgba(2,132,199,0.08)] transition-colors duration-200">
      {/* Top Accent Gradient Stripe */}
      <div className="h-0.5 w-full bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-600" />

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
            className="px-2.5 py-0.5 rounded-lg bg-white text-red-700 font-bold hover:bg-yellow-100 transition shadow-sm"
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
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover shadow-md shadow-sky-500/20 border-2 border-sky-400"
          />
          <div>
            <div className="flex items-center space-x-1">
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900">Gig</span>
              <span className="text-lg sm:text-xl font-black text-[#0284C7]">Me</span>
              <span className="text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-xs">
                Sinh Viên
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
              Nền tảng việc làm sinh viên & Smart Escrow
            </p>
          </div>
        </div>

        {/* Shortcuts: BXH Campus & Chợ KTX (Desktop only) */}
        <div className="hidden lg:flex items-center space-x-2 text-xs">
          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-800 border border-amber-200 font-extrabold transition flex items-center space-x-1.5 shadow-xs active:scale-95"
            >
              <span>🏆 BXH Top</span>
            </button>
          )}
          {onOpenMarketplace && (
            <button
              onClick={onOpenMarketplace}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-800 border border-emerald-200 font-extrabold transition flex items-center space-x-1.5 shadow-xs active:scale-95"
            >
              <span>📚 Chợ KTX</span>
            </button>
          )}
        </div>

        {/* Right Section: Compact on mobile, rich on desktop */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Wallet Balance Chip with lively soft-blue gradient */}
          <button
            id="header-wallet-btn"
            onClick={onOpenWallet}
            className="flex items-center space-x-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-100 via-blue-50 to-indigo-100/70 hover:from-sky-200 hover:to-blue-100 border border-sky-300 transition group shadow-xs active:scale-95"
          >
            <div className="p-1 rounded-lg bg-sky-500 text-white shadow-xs">
              <Wallet className="w-3.5 h-3.5 group-hover:scale-110 transition" />
            </div>
            <div className="text-left leading-none">
              <span className="text-[9px] text-sky-700 hidden sm:block font-extrabold">Số dư Ví</span>
              <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">
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
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 text-white font-extrabold text-xs hover:brightness-105 shadow-sm shadow-blue-500/25 transition cursor-pointer active:scale-95"
                title="Tải File APK cho điện thoại Android"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Tải APK</span>
              </button>
            )}

            {/* FCM Push */}
            {onOpenFcmPush && (
              <button
                id="header-fcm-btn"
                onClick={onOpenFcmPush}
                className="p-2 rounded-xl bg-slate-50 hover:bg-orange-50 text-orange-600 border border-slate-200 hover:border-orange-200 transition relative active:scale-95 shadow-sm"
                title="Thông báo đẩy hỏa tốc (Firebase Cloud Messaging)"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              </button>
            )}

            {/* SOS SafeWalk */}
            {onOpenSafeWalk && (
              <button
                id="header-safewalk-btn"
                onClick={onOpenSafeWalk}
                className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 transition active:scale-95 shadow-sm"
                title="Chế độ bảo vệ an toàn đêm (SOS SafeWalk)"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
            )}

            {/* ELO Modal */}
            {onOpenEloModal && (
              <button
                id="header-elo-btn"
                onClick={onOpenEloModal}
                className="flex items-center space-x-1 p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition text-xs font-bold active:scale-95 shadow-sm"
                title="Hệ thống chấm điểm tín nhiệm & Huy hiệu ELO sinh viên"
              >
                <Award className="w-4 h-4" />
                <span className="hidden xl:inline">{currentUser?.eloRating ?? 0} ELO</span>
              </button>
            )}

            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition active:scale-95 shadow-sm"
              title="Đổi giao diện sáng/tối"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-sky-600" />}
            </button>

            {/* Profile */}
            <button
              id="header-profile-btn"
              onClick={onOpenProfile}
              className="flex items-center space-x-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition active:scale-95 shadow-sm"
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow shrink-0">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : currentUser ? (
                  currentUser.name.charAt(0).toUpperCase()
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <span className="text-xs font-semibold text-slate-800 hidden lg:block">
                {currentUser?.name || 'Tài khoản'}
              </span>
            </button>

            {/* Logout button */}
            <button
              id="header-logout-btn"
              onClick={logout}
              className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 transition active:scale-95 shadow-sm"
              title="Đăng xuất khỏi tài khoản"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* MOBILE ONLY MENU TOGGLE BUTTON */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition active:scale-95 shadow-sm"
            title="Mở menu tiện ích"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 text-slate-900" /> : <MoreVertical className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* MOBILE POPUP ACTION DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[56px] bg-white/98 border-b border-slate-200 shadow-2xl p-4 space-y-3 z-50 backdrop-blur-xl animate-fade-in max-h-[85vh] overflow-y-auto">
          {/* User brief info */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow shrink-0">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : currentUser ? (
                  currentUser.name.charAt(0).toUpperCase()
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-xs">{currentUser?.name || 'Sinh viên'}</p>
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                  <span className="text-sky-600 font-bold">{currentUser?.eloRating ?? 0} ELO</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenProfile();
              }}
              className="px-3 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-bold transition hover:bg-sky-600 shadow-sm"
            >
              Hồ sơ &rarr;
            </button>
          </div>

          {/* Quick grid of utilities */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {onOpenSafeWalk && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenSafeWalk();
                }}
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-left hover:bg-rose-100 transition flex items-center space-x-2.5"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold text-rose-800">SOS SafeWalk</p>
                  <p className="text-[10px] text-rose-600">Bảo vệ đêm</p>
                </div>
              </button>
            )}

            {onOpenFcmPush && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenFcmPush();
                }}
                className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-left hover:bg-orange-100 transition flex items-center space-x-2.5"
              >
                <Bell className="w-4 h-4 text-orange-600 shrink-0" />
                <div>
                  <p className="font-bold text-orange-800">FCM Push</p>
                  <p className="text-[10px] text-orange-600">Báo hỏa tốc</p>
                </div>
              </button>
            )}

            {onOpenEloModal && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenEloModal();
                }}
                className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-left hover:bg-amber-100 transition flex items-center space-x-2.5"
              >
                <Award className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold text-amber-800">Huy hiệu ELO</p>
                  <p className="text-[10px] text-amber-600">{currentUser?.eloRating ?? 0} điểm</p>
                </div>
              </button>
            )}

            {!isStandalone && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenDownloadApp();
                }}
                className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-left hover:bg-emerald-100 transition flex items-center space-x-2.5"
              >
                <Download className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-800">Tải File APK</p>
                  <p className="text-[10px] text-emerald-600">Android Package</p>
                </div>
              </button>
            )}
          </div>

          {/* Theme & Admin bottom bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
            <button
              onClick={toggleDarkMode}
              className="flex items-center space-x-2 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 font-bold"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-sky-600" />}
              <span>{isDarkMode ? 'Giao diện Sáng' : 'Giao diện Tối'}</span>
            </button>

            {isAdminRole && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="py-2 px-3 rounded-xl bg-red-600 text-white font-bold shadow-sm"
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
            className="w-full py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs flex items-center justify-center space-x-2 transition"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            <span>Đăng Xuất Tài Khoản</span>
          </button>
        </div>
      )}
    </header>
  );
};
