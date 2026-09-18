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
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0A162D]/95 dark:bg-[#000000]/98 border-b border-cyan-500/25 dark:border-[#121824] shadow-[0_4px_20px_-4px_rgba(0,180,255,0.12)] dark:shadow-none transition-colors duration-200">
      {/* Top Accent Gradient Stripe */}
      <div className="h-0.5 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-500" />

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
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover shadow-md shadow-sky-500/20 border-2 border-cyan-400"
          />
          <div>
            <div className="flex items-center space-x-1">
              <span className="text-lg sm:text-xl font-black tracking-tight text-white">Gig</span>
              <span className="text-lg sm:text-xl font-black text-[#00E5FF]">Me</span>
              <span className="text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xs">
                Sinh Viên
              </span>
            </div>
            <p className="text-[10px] text-cyan-200/80 dark:text-slate-400 font-medium hidden sm:block">
              Nền tảng việc làm sinh viên & Smart Escrow
            </p>
          </div>
        </div>

        {/* Shortcuts: BXH Campus & Chợ KTX (Desktop only) */}
        <div className="hidden lg:flex items-center space-x-2 text-xs">
          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-extrabold transition flex items-center space-x-1.5 shadow-xs active:scale-95"
            >
              <span>🏆 BXH Top</span>
            </button>
          )}
          {onOpenMarketplace && (
            <button
              onClick={onOpenMarketplace}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-extrabold transition flex items-center space-x-1.5 shadow-xs active:scale-95"
            >
              <span>📚 Chợ KTX</span>
            </button>
          )}
        </div>

        {/* Right Section: Compact on mobile, rich on desktop */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Wallet Balance Chip with high-tech blue styling */}
          <button
            id="header-wallet-btn"
            onClick={onOpenWallet}
            className="flex items-center space-x-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#0e2246] dark:bg-[#080B12] hover:bg-[#142e5c] dark:hover:bg-[#101524] border border-cyan-500/40 dark:border-slate-800 transition group shadow-xs active:scale-95"
          >
            <div className="p-1 rounded-lg bg-cyan-500 dark:bg-cyan-600 text-white shadow-xs">
              <Wallet className="w-3.5 h-3.5 group-hover:scale-110 transition" />
            </div>
            <div className="text-left leading-none">
              <span className="text-[9px] text-cyan-300 dark:text-slate-400 hidden sm:block font-extrabold">Số dư Ví</span>
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
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-extrabold text-xs hover:brightness-110 shadow-sm shadow-blue-500/25 transition cursor-pointer active:scale-95"
                title="Tải File APK cho điện thoại Android"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Tải APK</span>
              </button>
            )}

            {/* SOS SafeWalk */}
            {onOpenSafeWalk && (
              <button
                id="header-safewalk-btn"
                onClick={onOpenSafeWalk}
                className="p-2 rounded-xl bg-[#0e2246] dark:bg-[#080B12] hover:bg-[#152e5a] dark:hover:bg-[#121826] text-rose-400 border border-rose-500/30 dark:border-slate-800 transition active:scale-95 shadow-sm"
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
                className="flex items-center space-x-1 p-2 rounded-xl bg-[#0e2246] dark:bg-[#080B12] hover:bg-[#152e5a] dark:hover:bg-[#121826] text-amber-300 border border-amber-500/30 dark:border-slate-800 transition text-xs font-bold active:scale-95 shadow-sm"
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
              className="p-2 rounded-xl bg-[#0e2246] dark:bg-[#080B12] hover:bg-[#152e5a] dark:hover:bg-[#121826] border border-cyan-500/40 dark:border-slate-800 text-cyan-300 dark:text-slate-400 transition active:scale-95 shadow-sm"
              title={isDarkMode ? 'Đang ở Chế độ Siêu Tối (Bấm để chuyển sang Xanh Dạ Quang)' : 'Đang ở Chế độ Xanh Dạ Quang (Bấm để chuyển sang Siêu Tối)'}
            >
              {isDarkMode ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-sky-300" />}
            </button>

            {/* Profile */}
            <button
              id="header-profile-btn"
              onClick={onOpenProfile}
              className="flex items-center space-x-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#0e2246] dark:bg-[#080B12] hover:bg-[#152e5a] dark:hover:bg-[#121826] border border-cyan-500/40 dark:border-slate-800 transition active:scale-95 shadow-sm"
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xs text-white shadow shrink-0">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : currentUser ? (
                  currentUser.name.charAt(0).toUpperCase()
                ) : (
                  <User className="w-4 h-4" />
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
