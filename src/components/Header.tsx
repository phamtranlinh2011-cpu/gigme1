import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  ShieldAlert,
  User,
  Award,
  Download,
  LogOut,
  QrCode,
  Smartphone,
  Scale,
  ShoppingBag,
  ChevronDown,
  Globe,
  Check,
  X,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { useTranslation } from '../context/LanguageContext';
import { formatVnd } from '../types';
import { NotificationCenter } from './NotificationCenter';
import { triggerHaptic } from '../utils/haptics';

interface HeaderProps {
  onOpenCreateGig: () => void;
  onOpenWallet: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onOpenDownloadApp: () => void;
  onOpenMarketplace?: () => void;
  onOpenChat?: () => void;
  onOpenLaw?: () => void;
  onOpenFcmPush?: () => void;
  onOpenEloModal?: () => void;
  onOpenVietQrScanner?: () => void;
  onOpenPaymentGateway?: () => void;
  onSelectGigDetail?: (gigId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateGig,
  onOpenWallet,
  onOpenProfile,
  onOpenAdmin,
  onOpenDownloadApp,
  onOpenMarketplace,
  onOpenChat,
  onOpenLaw,
  onOpenFcmPush,
  onOpenEloModal,
  onOpenVietQrScanner,
  onOpenPaymentGateway,
  onSelectGigDetail,
}) => {
  const {
    currentUser,
    isAdminRole,
    logout,
    showNotification,
  } = useGigMe();
  const { language, setLanguage, t } = useTranslation();

  // Local state for Language Dropdown Menu (placed next to Wallet button)
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Local state for Right Profile Dropdown Menu
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Handle outside click for both dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (langDropdownRef.current && !langDropdownRef.current.contains(target)) {
        setIsLangDropdownOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAction = (callback?: () => void) => {
    triggerHaptic('light');
    setIsDropdownOpen(false);
    setIsLangDropdownOpen(false);
    if (callback) {
      callback();
    }
  };

  const handleSelectLanguage = (lang: 'vi' | 'en') => {
    if (lang === language) return;
    setLanguage(lang);
    showNotification(
      lang === 'en' ? 'Language Changed 🌐' : 'Đã Đổi Ngôn Ngữ 🌐',
      lang === 'en'
        ? 'Interface, action buttons, and notifications updated to English.'
        : 'Giao diện, nút hành động và thông báo đã chuyển sang Tiếng Việt.',
      true,
      false,
      'Language Changed 🌐',
      'Interface, action buttons, and notifications updated to English.'
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-[#0B1528]/95 border-b border-slate-200 dark:border-[#C5E5EC]/20 shadow-[0_2px_15px_-3px_rgba(48,100,174,0.12)] dark:shadow-[0_2px_20px_-3px_rgba(48,100,174,0.25)] transition-colors duration-200">
      {/* Top Accent Brand Gradient Line (Cobalt 60% -> Crystal 30% -> Ethereal 10%) */}
      <div className="h-0.5 w-full bg-brand-horiz-gradient" />

      {/* Admin Alert Notice Bar (Only if user has Admin privileges) */}
      {isAdminRole && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-4 py-1 flex items-center justify-between text-xs text-white shadow-xs">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span className="font-bold text-[11px] tracking-wide">{t('rootAdminNotice')}</span>
          </div>
          <button
            id="admin-dashboard-btn"
            onClick={onOpenAdmin}
            className="px-2 py-0.5 rounded-md bg-white text-red-700 font-extrabold text-[10px] hover:bg-yellow-100 transition shadow-xs cursor-pointer"
          >
            {t('openAdmin')} &rarr;
          </button>
        </div>
      )}

      {/* MAIN TOP BAR: Logo on left, Language + Wallet + Notifications + Profile on right */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-13 sm:h-14 flex items-center justify-between gap-2 sm:gap-3">
        {/* LEFT SECTION: BRAND LOGO & IDENTITY ONLY (Không để nút ngôn ngữ ở đây) */}
        <div
          onClick={() => handleAction()}
          className="flex items-center space-x-2 sm:space-x-2.5 cursor-pointer select-none shrink-0"
        >
          <img
            src="/logo.png"
            alt="GigMe Logo"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shadow-sm shadow-[#3064AE]/30 border-2 border-[#C5E5EC]"
          />
          <div>
            <div className="flex items-center space-x-1">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">Gig</span>
              <span className="text-base sm:text-lg font-black text-[#3064AE] dark:text-[#C5E5EC]">Me</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-[#3064AE]/20 dark:bg-[#3064AE]/35 text-[#3064AE] dark:text-[#E0FAEB] border border-[#3064AE]/30 dark:border-[#C5E5EC]/30">
                {t('campusStudent')}
              </span>
            </div>
            <p className="text-[9px] text-slate-500 dark:text-[#C5E5EC]/70 font-medium hidden sm:block leading-none">
              {t('tagline')}
            </p>
          </div>
        </div>

        {/* RIGHT SECTION: Nút Ngôn Ngữ (KẾ VÍ CAMPUS), Ví Tiền, Thông Báo, Tài Khoản */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* 1. NÚT CHUYỂN ĐỔI NGÔN NGỮ KẾ VÍ CAMPUS: Chỉ icon quả cầu + Chữ VI hoặc EN */}
          <div className="relative shrink-0" ref={langDropdownRef}>
            <button
              id="header-lang-dropdown-btn"
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsLangDropdownOpen((prev) => !prev);
              }}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 rounded-xl border transition active:scale-95 cursor-pointer text-xs font-bold ${
                isLangDropdownOpen
                  ? 'bg-slate-200 dark:bg-[#162B48] border-[#3064AE] dark:border-[#C5E5EC]/60 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#12233B] dark:hover:bg-[#162B48] border-slate-200 dark:border-[#C5E5EC]/25 text-slate-800 dark:text-slate-100'
              }`}
              title={t('switchLanguage')}
            >
              <Globe className="w-3.5 h-3.5 text-[#3064AE] dark:text-[#C5E5EC]" />
              <span className="font-extrabold text-[11px] font-mono tracking-tight uppercase">
                {language === 'vi' ? 'VI' : 'EN'}
              </span>
            </button>

            {/* BẢNG CHỌN NGÔN NGỮ (GIỮ NGUYÊN BẢNG ĐẦY ĐỦ THIẾT KẾ ĐẸP) */}
            {isLangDropdownOpen && (
              <div className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 w-52 sm:w-56 rounded-2xl bg-white dark:bg-[#0D182A] border border-slate-200 dark:border-[#C5E5EC]/30 shadow-2xl p-2.5 space-y-1.5 z-50 animate-fadeIn text-slate-800 dark:text-slate-100">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-[#C5E5EC]/60 uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Globe className="w-3 h-3 text-[#3064AE] dark:text-[#C5E5EC]" />
                    <span>{t('language')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLangDropdownOpen(false)}
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#12233B] text-slate-400 hover:text-slate-600 dark:text-[#C5E5EC]/70 dark:hover:text-white cursor-pointer transition"
                    title={t('close')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectLanguage('vi')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    language === 'vi'
                      ? 'bg-[#3064AE]/15 text-[#3064AE] dark:text-[#E0FAEB] border border-[#3064AE]/30 dark:border-[#C5E5EC]/30'
                      : 'hover:bg-slate-100 dark:hover:bg-[#12233B] text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base">🇻🇳</span>
                    <div className="text-left">
                      <p className="font-bold leading-tight">Tiếng Việt</p>
                      <p className="text-[10px] text-slate-400 dark:text-[#C5E5EC]/60 leading-tight">
                        {language === 'vi' ? 'Mặc định Campus' : 'Campus Default'}
                      </p>
                    </div>
                  </div>
                  {language === 'vi' && <Check className="w-4 h-4 text-[#3064AE] dark:text-[#E0FAEB] shrink-0" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectLanguage('en')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    language === 'en'
                      ? 'bg-[#3064AE]/15 text-[#3064AE] dark:text-[#E0FAEB] border border-[#3064AE]/30 dark:border-[#C5E5EC]/30'
                      : 'hover:bg-slate-100 dark:hover:bg-[#12233B] text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base">🇬🇧</span>
                    <div className="text-left">
                      <p className="font-bold leading-tight">English</p>
                      <p className="text-[10px] text-slate-400 dark:text-[#C5E5EC]/60 leading-tight">International</p>
                    </div>
                  </div>
                  {language === 'en' && <Check className="w-4 h-4 text-[#3064AE] dark:text-[#E0FAEB] shrink-0" />}
                </button>
              </div>
            )}
          </div>

          {/* 2. VÍ CAMPUS (NẰM NGAY KẾ BÊN NÚT NGÔN NGỮ) */}
          <button
            id="header-wallet-btn"
            onClick={() => {
              triggerHaptic('light');
              onOpenWallet();
            }}
            className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#12233B] dark:hover:bg-[#162B48] border border-slate-200 dark:border-[#C5E5EC]/25 transition group shadow-2xs active:scale-95 cursor-pointer"
            title={t('campusWallet')}
          >
            <div className="p-1 rounded-lg bg-[#3064AE] text-[#E0FAEB] shadow-xs">
              <Wallet className="w-3.5 h-3.5 group-hover:scale-105 transition" />
            </div>
            <div className="text-left leading-none">
              <span className="text-[9px] text-slate-500 dark:text-[#C5E5EC]/80 hidden sm:block font-bold">{t('campusWallet')}</span>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono">
                {currentUser ? formatVnd(currentUser.walletBalance) : '0đ'}
              </span>
            </div>
          </button>

          {/* 3. NOTIFICATION CENTER */}
          <NotificationCenter
            onOpenFcmPush={onOpenFcmPush}
            onOpenWallet={onOpenWallet}
            onOpenChat={onOpenChat}
            onSelectGigDetail={onSelectGigDetail}
          />

          {/* 4. USER AVATAR & NAME WITH DROPDOWN MENU */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="header-profile-menu-btn"
              onClick={() => {
                triggerHaptic('light');
                setIsDropdownOpen((prev) => !prev);
              }}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border transition active:scale-95 cursor-pointer ${
                isDropdownOpen
                  ? 'bg-slate-200 dark:bg-[#162B48] border-[#3064AE] dark:border-[#C5E5EC]/50 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#12233B] dark:hover:bg-[#162B48] border-slate-200 dark:border-[#C5E5EC]/25'
              }`}
              title={t('account')}
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-gradient-to-br from-[#3064AE] to-[#255294] border border-[#C5E5EC]/40 flex items-center justify-center font-bold text-xs text-white shadow-2xs shrink-0">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : currentUser ? (
                  currentUser.name.charAt(0).toUpperCase()
                ) : (
                  <User className="w-4 h-4 text-[#C5E5EC]" />
                )}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-white max-w-[70px] sm:max-w-[130px] truncate leading-none">
                {currentUser?.name || currentUser?.firstName || t('account')}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 dark:text-[#C5E5EC] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* SLEEK DROPDOWN POPOVER MENU */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#0D182A] border border-slate-200 dark:border-[#C5E5EC]/25 shadow-2xl p-3 space-y-2.5 z-50 animate-fadeIn text-slate-800 dark:text-slate-100">
                {/* User Info Header Card */}
                <div
                  onClick={() => handleAction(onOpenProfile)}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-[#12233B] dark:hover:bg-[#162C4A] border border-slate-200 dark:border-[#C5E5EC]/20 flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-[#3064AE] to-[#255294] text-white flex items-center justify-center font-bold text-sm shrink-0 border border-[#C5E5EC]/30">
                      {currentUser?.avatarUrl ? (
                        <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                      ) : (
                        currentUser?.name?.charAt(0).toUpperCase() || 'S'
                      )}
                    </div>
                    <div className="min-w-0 leading-tight">
                      <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                        {currentUser?.name || (language === 'vi' ? 'Sinh viên Campus' : 'Campus Student')}
                      </p>
                      <div className="text-[10px] text-slate-500 dark:text-[#C5E5EC]/80 mt-0.5 space-y-0.5">
                        <p className="truncate">
                          {t('lastNameLabel')}: <span className="font-bold text-slate-700 dark:text-[#E0FAEB]">{currentUser?.lastName || (currentUser?.name ? currentUser.name.split(' ').slice(0, -1).join(' ') : '') || '—'}</span>
                        </p>
                        <p className="truncate">
                          {t('firstNameLabel')}: <span className="font-bold text-[#3064AE] dark:text-[#C5E5EC]">{currentUser?.firstName || (currentUser?.name ? currentUser.name.split(' ').pop() : '') || '—'}</span>
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-[#C5E5EC]/60 font-mono truncate mt-1">
                        ID: {currentUser?.id || '000000000'} • {currentUser?.eloRating ?? 0} ELO
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#3064AE] dark:text-[#C5E5EC] shrink-0 pl-1">
                    {t('profile')} &rarr;
                  </span>
                </div>

                {/* Section 1: Financial & Payments */}
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-[#C5E5EC]/60 px-1">
                    {t('walletAndPay')}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {onOpenVietQrScanner && (
                      <button
                        type="button"
                        onClick={() => handleAction(onOpenVietQrScanner)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#101F35] dark:hover:bg-[#142642] border border-slate-200 dark:border-[#C5E5EC]/15 text-left flex items-center space-x-2 transition cursor-pointer active:scale-95"
                      >
                        <div className="p-1.5 rounded-lg bg-[#3064AE]/15 text-[#3064AE] dark:text-[#E0FAEB]">
                          <QrCode className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 leading-tight">
                          <p className="font-bold text-xs truncate">{t('scanVietQr')}</p>
                          <p className="text-[9px] text-slate-500 dark:text-[#C5E5EC]/70 truncate">{t('scanVietQrDesc')}</p>
                        </div>
                      </button>
                    )}

                    {onOpenPaymentGateway && (
                      <button
                        type="button"
                        onClick={() => handleAction(onOpenPaymentGateway)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#101F35] dark:hover:bg-[#142642] border border-slate-200 dark:border-pink-500/20 text-left flex items-center space-x-2 transition cursor-pointer active:scale-95"
                      >
                        <div className="p-1.5 rounded-lg bg-pink-500/15 text-pink-600 dark:text-pink-300">
                          <Smartphone className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 leading-tight">
                          <p className="font-bold text-xs truncate">{t('quickTopup')}</p>
                          <p className="text-[9px] text-slate-500 dark:text-pink-300/70 truncate">{t('quickTopupDesc')}</p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Section 2: Campus Utilities */}
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-[#C5E5EC]/60 px-1">
                    {t('campusUtilities')}
                  </div>
                  <div className="space-y-1">
                    {onOpenMarketplace && (
                      <button
                        type="button"
                        onClick={() => handleAction(onOpenMarketplace)}
                        className="w-full p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#101F35] dark:hover:bg-[#142642] border border-slate-200 dark:border-[#C5E5EC]/15 text-left flex items-center justify-between transition cursor-pointer active:scale-95"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-bold text-xs">{t('dormMarket')}</p>
                            <p className="text-[9px] text-slate-500 dark:text-[#C5E5EC]/70">{t('dormMarketDesc')}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                          0đ
                        </span>
                      </button>
                    )}

                    {onOpenLaw && (
                      <button
                        type="button"
                        onClick={() => handleAction(onOpenLaw)}
                        className="w-full p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#101F35] dark:hover:bg-[#142642] border border-slate-200 dark:border-[#C5E5EC]/15 text-left flex items-center justify-between transition cursor-pointer active:scale-95"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            <Scale className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-bold text-xs">{t('campusLaw')}</p>
                            <p className="text-[9px] text-slate-500 dark:text-[#C5E5EC]/70">{t('campusLawDesc')}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300">
                          § 18
                        </span>
                      </button>
                    )}

                    {onOpenEloModal && (
                      <button
                        type="button"
                        onClick={() => handleAction(onOpenEloModal)}
                        className="w-full p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#101F35] dark:hover:bg-[#142642] border border-slate-200 dark:border-[#C5E5EC]/15 text-left flex items-center justify-between transition cursor-pointer active:scale-95"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-[#3064AE]/15 text-[#3064AE] dark:text-[#E0FAEB]">
                            <Award className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-bold text-xs">{t('eloBadge')}</p>
                            <p className="text-[9px] text-slate-500 dark:text-[#C5E5EC]/70">{t('eloBadgeDesc')}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 font-mono">
                          {currentUser?.eloRating ?? 0} ELO
                        </span>
                      </button>
                    )}

                    {!isStandalone && (
                      <button
                        type="button"
                        onClick={() => handleAction(onOpenDownloadApp)}
                        className="w-full p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#101F35] dark:hover:bg-[#142642] border border-slate-200 dark:border-[#C5E5EC]/15 text-left flex items-center justify-between transition cursor-pointer active:scale-95"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-[#3064AE]/15 text-[#3064AE] dark:text-[#C5E5EC]">
                            <Download className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-bold text-xs">{t('downloadApp')}</p>
                            <p className="text-[9px] text-slate-500 dark:text-[#C5E5EC]/70">{t('downloadAppDesc')}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#3064AE]/20 text-[#3064AE] dark:text-[#C5E5EC]">
                          PWA / APK
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Section 3: Admin & Logout */}
                <div className="pt-1.5 border-t border-slate-200 dark:border-[#C5E5EC]/15 space-y-1">
                  {isAdminRole && (
                    <button
                      type="button"
                      onClick={() => handleAction(onOpenAdmin)}
                      className="w-full p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-left flex items-center justify-between transition cursor-pointer active:scale-95"
                    >
                      <div className="flex items-center space-x-2">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                        <span className="font-bold text-xs">{t('adminPanel')}</span>
                      </div>
                      <span className="text-[10px] font-bold">&rarr;</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      triggerHaptic('medium');
                      logout();
                    }}
                    className="w-full p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('logoutDevice')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
