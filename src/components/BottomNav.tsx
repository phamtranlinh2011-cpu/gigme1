import React from 'react';
import { Radar, Wallet, UserCheck, PlusCircle, MessageSquare, BookOpen, Settings } from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { useTranslation } from '../context/LanguageContext';
import { triggerHaptic } from '../utils/haptics';

export type TabScreen =
  | 'HOME'
  | 'CREATE_GIG'
  | 'WALLET'
  | 'PROFILE'
  | 'CHAT'
  | 'ADMIN'
  | 'MARKETPLACE'
  | 'SETTINGS'
  | 'LAW';

interface BottomNavProps {
  currentTab: TabScreen;
  onSelectTab: (tab: TabScreen) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { currentSelectedGig, roleMode, allChats, currentUser } = useGigMe();
  const { t } = useTranslation();
  const isClient = roleMode === 'CLIENT';

  const unreadChatCount = React.useMemo(() => {
    if (!currentUser || !allChats) return 0;
    return allChats.filter((m) => {
      if (m.senderId === currentUser.id || m.isRead) return false;
      return m.partnerId === currentUser.id || (!m.partnerId && m.threadId?.includes(currentUser.id));
    }).length;
  }, [allChats, currentUser]);

  const handleTabClick = (tab: TabScreen) => {
    triggerHaptic('light');
    onSelectTab(tab);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-lg border-t border-slate-200 dark:border-[#C5E5EC]/20 px-1 sm:px-3 pt-1.5 pb-2 pb-safe shadow-[0_-4px_25px_rgba(48,100,174,0.1)] dark:shadow-[0_-4px_25px_rgba(48,100,174,0.25)] transition-colors duration-200"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Tab 1: Radar Discovery */}
        <button
          id="nav-home-btn"
          onClick={() => handleTabClick('HOME')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition cursor-pointer ${
            currentTab === 'HOME'
              ? 'text-[#3064AE] dark:text-[#E0FAEB] bg-[#3064AE]/10 dark:bg-[#3064AE]/35 font-black border border-[#3064AE]/30 dark:border-[#C5E5EC]/30 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-[#C5E5EC]/70 dark:hover:text-white'
          }`}
        >
          <Radar className={`w-4 h-4 sm:w-5 sm:h-5 ${currentTab === 'HOME' ? 'animate-pulse text-[#3064AE] dark:text-[#E0FAEB]' : ''}`} />
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">{t('navHome')}</span>
        </button>

        {/* Tab 2: Tin Nhắn Chat (Kế mục Radar) */}
        <button
          id="nav-chat-btn"
          onClick={() => handleTabClick('CHAT')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition relative cursor-pointer ${
            currentTab === 'CHAT'
              ? 'text-[#3064AE] dark:text-[#E0FAEB] bg-[#3064AE]/10 dark:bg-[#3064AE]/35 font-black border border-[#3064AE]/30 dark:border-[#C5E5EC]/30 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-[#C5E5EC]/70 dark:hover:text-white'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#E0FAEB] text-[#09111D] text-[9px] font-black flex items-center justify-center border border-[#09111D] shadow-sm animate-pulse">
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">{t('navChat')}</span>
        </button>

        {/* Tab 3: Campus Flea Market (Thanh lý đồ cũ) */}
        <button
          id="nav-marketplace-btn"
          onClick={() => handleTabClick('MARKETPLACE')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition cursor-pointer ${
            currentTab === 'MARKETPLACE'
              ? 'text-[#3064AE] dark:text-[#E0FAEB] bg-[#3064AE]/10 dark:bg-[#3064AE]/35 font-black border border-[#3064AE]/30 dark:border-[#C5E5EC]/30 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-[#C5E5EC]/70 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">{t('navMarketplace')}</span>
        </button>

        {/* Central Action: Đăng Kèo */}
        <div className="px-1 shrink-0">
          <button
            id="nav-create-btn"
            onClick={() => {
              triggerHaptic('medium');
              onSelectTab('CREATE_GIG');
            }}
            className="relative -top-3 flex flex-col items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-[#3064AE] via-[#417AC6] to-[#C5E5EC] text-white border-2 border-[#E0FAEB]/40 shadow-lg shadow-[#3064AE]/40 ring-4 ring-slate-100 dark:ring-[#0B1528] transition transform hover:scale-110 active:scale-95 cursor-pointer animate-glow-pulse"
            title={t('navCreateGig')}
          >
            <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.4]" />
          </button>
        </div>

        {/* Tab 4: Wallet & Escrow */}
        <button
          id="nav-wallet-btn"
          onClick={() => handleTabClick('WALLET')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition cursor-pointer ${
            currentTab === 'WALLET'
              ? 'text-[#3064AE] dark:text-[#E0FAEB] bg-[#3064AE]/10 dark:bg-[#3064AE]/35 font-black border border-[#3064AE]/30 dark:border-[#C5E5EC]/30 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-[#C5E5EC]/70 dark:hover:text-white'
          }`}
        >
          <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">{t('navWallet')}</span>
        </button>

        {/* Tab 5: 2-in-1 Profile */}
        <button
          id="nav-profile-btn"
          onClick={() => handleTabClick('PROFILE')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition cursor-pointer ${
            currentTab === 'PROFILE'
              ? 'text-[#3064AE] dark:text-[#E0FAEB] bg-[#3064AE]/10 dark:bg-[#3064AE]/35 font-black border border-[#3064AE]/30 dark:border-[#C5E5EC]/30 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-[#C5E5EC]/70 dark:hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">{t('navProfile')}</span>
        </button>

        {/* Tab 6: Cài Đặt Hệ Thống & Bảo Mật */}
        <button
          id="nav-settings-btn"
          onClick={() => handleTabClick('SETTINGS')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition cursor-pointer ${
            currentTab === 'SETTINGS'
              ? 'text-[#3064AE] dark:text-[#E0FAEB] bg-[#3064AE]/10 dark:bg-[#3064AE]/35 font-black border border-[#3064AE]/30 dark:border-[#C5E5EC]/30 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-[#C5E5EC]/70 dark:hover:text-white'
          }`}
          title={t('navSettings')}
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">{t('navSettings')}</span>
        </button>
      </div>
    </nav>
  );
};
