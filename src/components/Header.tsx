import React, { useState } from 'react';
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
  const isClient = roleMode === 'CLIENT';
  const tierConfig = currentUser ? USER_TIERS[currentUser.tier] : USER_TIERS.NEWBIE;

  return (
    <header className={`sticky top-0 z-40 w-full backdrop-blur-md ${isDarkMode ? 'bg-[#0A0E17]/90 border-b border-[#1E293B]' : 'bg-white/95 border-b border-slate-200 shadow-sm'} transition-colors duration-200`}>
      {/* Admin Master Alert Bar */}
      {isAdminRole && (
        <div className="bg-gradient-to-r from-red-900 via-red-700 to-rose-900 px-4 py-1.5 flex items-center justify-between text-xs text-white">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span className="font-bold tracking-wide">QUYỀN QUẢN TRỊ VIÊN TỐI CAO (MASTER ROOT)</span>
          </div>
          <button
            id="admin-dashboard-btn"
            onClick={onOpenAdmin}
            className="px-2.5 py-0.5 rounded bg-white text-red-900 font-bold hover:bg-yellow-100 transition shadow-sm"
          >
            Mở Admin &rarr;
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer select-none shrink-0">
          <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#00E5FF] to-[#FF6B00] shadow-[0_0_12px_rgba(0,229,255,0.4)]">
            <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-black fill-current" />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white">Gig</span>
              <span className="text-lg sm:text-xl font-extrabold text-[#00E5FF]">Me</span>
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#1A2333] text-[#00E5FF] border border-[#00E5FF]/30">
                VN
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Siêu kết nối việc làm siêu nhỏ & Smart Escrow
            </p>
          </div>
        </div>

        {/* Center: Dual Mode Switcher (Client vs Freelancer) */}
        <div className="flex items-center bg-[#131B2A] p-0.5 sm:p-1 rounded-xl border border-[#23334D] shadow-inner">
          <button
            id="mode-client-btn"
            onClick={() => {
              if (!isClient) toggleRoleMode();
            }}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
              isClient
                ? 'bg-[#00E5FF] text-black shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Thuê</span>
          </button>

          <button
            id="mode-freelancer-btn"
            onClick={() => {
              if (isClient) toggleRoleMode();
            }}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
              !isClient
                ? 'bg-[#FF6B00] text-black shadow-[0_0_12px_rgba(255,107,0,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Làm</span>
          </button>
        </div>

        {/* Shortcuts: BXH Campus & Chợ KTX (Desktop only) */}
        <div className="hidden lg:flex items-center space-x-1.5 text-xs">
          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              className="px-2.5 py-1.5 rounded-xl bg-[#131B2A] hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold transition flex items-center space-x-1"
            >
              <span>🏆 BXH Top</span>
            </button>
          )}
          {onOpenMarketplace && (
            <button
              onClick={onOpenMarketplace}
              className="px-2.5 py-1.5 rounded-xl bg-[#131B2A] hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold transition flex items-center space-x-1"
            >
              <span>📚 Chợ KTX</span>
            </button>
          )}
        </div>

        {/* Right Section: Compact on mobile, rich on desktop */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Cloud Sync Status (Desktop only) */}
          <div
            className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400"
            title="Đồng bộ hóa đám mây Firebase Firestore 24/7 theo thời gian thực"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{isCloudConnected ? 'Cloud Realtime' : 'Cloud Syncing...'}</span>
          </div>

          {/* Wallet Balance Chip (Always visible, compact on mobile) */}
          <button
            id="header-wallet-btn"
            onClick={onOpenWallet}
            className="flex items-center space-x-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-[#131B2A] hover:bg-[#1A263B] border border-[#23334D] transition group"
          >
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00E5FF] group-hover:scale-110 transition" />
            <div className="text-left leading-none">
              <span className="text-[9px] text-slate-400 hidden sm:block font-medium">Ví</span>
              <span className="text-xs font-black text-white">
                {currentUser ? formatVnd(currentUser.walletBalance) : '0đ'}
              </span>
            </div>
          </button>

          {/* DESKTOP ONLY BUTTONS */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Tải App Button */}
            <button
              id="header-download-app-btn"
              onClick={onOpenDownloadApp}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#00E5FF] text-black font-extrabold text-xs hover:brightness-110 shadow-md shadow-emerald-500/20 transition cursor-pointer"
              title="Tải & Cài đặt App cho Android & iPhone"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tải App</span>
            </button>

            {/* Post Gig Quick Action for Client */}
            {isClient && (
              <button
                id="header-post-gig-btn"
                onClick={onOpenCreateGig}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] text-black font-bold text-xs hover:brightness-110 shadow-[0_0_10px_rgba(0,229,255,0.3)] transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Đăng việc</span>
              </button>
            )}

            {/* User Tier Badge */}
            {currentUser && (
              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[11px] font-bold border ${
                  currentUser.tier === 'PRO'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : currentUser.tier === 'VERIFIED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-500/10 text-slate-400 border-slate-700'
                }`}
              >
                {currentUser.tier === 'PRO' ? (
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                ) : currentUser.tier === 'VERIFIED' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : null}
                <span>{tierConfig.badgeText}</span>
              </div>
            )}

            {/* FCM Push */}
            {onOpenFcmPush && (
              <button
                id="header-fcm-btn"
                onClick={onOpenFcmPush}
                className="p-2 rounded-xl bg-[#131B2A] hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 transition relative"
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
                className="p-2 rounded-xl bg-[#131B2A] hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
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
                className="flex items-center space-x-1 p-2 rounded-xl bg-[#131B2A] hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition text-xs font-bold"
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
              className="p-2 rounded-xl bg-[#131B2A] hover:bg-[#1A263B] border border-[#23334D] text-slate-300 transition"
              title="Đổi giao diện sáng/tối"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
            </button>

            {/* Profile */}
            <button
              id="header-profile-btn"
              onClick={onOpenProfile}
              className="flex items-center space-x-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#131B2A] hover:bg-[#1A263B] border border-[#23334D] transition"
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow shrink-0 border border-white/20">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : currentUser ? (
                  currentUser.name.charAt(0).toUpperCase()
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <span className="text-xs font-semibold text-slate-200 hidden lg:block">
                {currentUser?.name || 'Tài khoản'}
              </span>
            </button>

            {/* Logout button */}
            <button
              id="header-logout-btn"
              onClick={logout}
              className="p-2 rounded-xl bg-[#131B2A] hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-[#23334D] hover:border-red-500/40 transition"
              title="Đăng xuất khỏi tài khoản"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* MOBILE ONLY MENU TOGGLE BUTTON (Avoids crowded button clutter) */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-xl bg-[#131B2A] hover:bg-[#1A263B] border border-[#23334D] text-slate-200 transition"
            title="Mở menu tiện ích"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 text-white" /> : <MoreVertical className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* MOBILE POPUP ACTION DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[56px] bg-[#0B1322]/98 border-b border-[#1E293B] shadow-2xl p-4 space-y-3 z-50 backdrop-blur-xl animate-fade-in max-h-[85vh] overflow-y-auto">
          {/* User brief info */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#131E30] border border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow shrink-0 border border-white/20">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : currentUser ? (
                  currentUser.name.charAt(0).toUpperCase()
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="font-extrabold text-white text-xs">{currentUser?.name || 'Sinh viên'}</p>
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                  <span className="text-amber-400 font-bold">{tierConfig.badgeText}</span>
                  <span>•</span>
                  <span className="text-cyan-400 font-bold">{currentUser?.eloRating ?? 0} ELO</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenProfile();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#1E2A3F] hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
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
                className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-left hover:bg-rose-900/30 transition flex items-center space-x-2.5"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <p className="font-bold text-rose-300">SOS SafeWalk</p>
                  <p className="text-[10px] text-rose-400/80">Bảo vệ đêm</p>
                </div>
              </button>
            )}

            {onOpenFcmPush && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenFcmPush();
                }}
                className="p-3 rounded-xl bg-orange-950/40 border border-orange-500/40 text-left hover:bg-orange-900/30 transition flex items-center space-x-2.5"
              >
                <Bell className="w-4 h-4 text-orange-400 shrink-0" />
                <div>
                  <p className="font-bold text-orange-300">FCM Push</p>
                  <p className="text-[10px] text-orange-400/80">Báo hỏa tốc</p>
                </div>
              </button>
            )}

            {onOpenEloModal && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenEloModal();
                }}
                className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-left hover:bg-amber-900/30 transition flex items-center space-x-2.5"
              >
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="font-bold text-amber-300">Huy hiệu ELO</p>
                  <p className="text-[10px] text-amber-400/80">{currentUser?.eloRating ?? 0} điểm</p>
                </div>
              </button>
            )}

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenDownloadApp();
              }}
              className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-left hover:bg-emerald-900/30 transition flex items-center space-x-2.5"
            >
              <Download className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-emerald-300">Cài Đặt App</p>
                <p className="text-[10px] text-emerald-400/80">Android / iOS</p>
              </div>
            </button>
          </div>

          {/* Theme & Admin bottom bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            <button
              onClick={toggleDarkMode}
              className="flex items-center space-x-2 py-2 px-3 rounded-xl bg-[#131E30] text-slate-300 font-bold"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
              <span>{isDarkMode ? 'Giao diện Sáng' : 'Giao diện Tối'}</span>
            </button>

            {isAdminRole && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="py-2 px-3 rounded-xl bg-red-600/30 border border-red-500/40 text-red-300 font-bold"
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
            className="w-full py-2.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 font-bold text-xs flex items-center justify-center space-x-2 transition"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Đăng Xuất Tài Khoản</span>
          </button>
        </div>
      )}
    </header>
  );
};
