import React from 'react';
import { Radar, Wallet, UserCheck, PlusCircle, MessageSquare, Trophy, BookOpen } from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';

export type TabScreen =
  | 'HOME'
  | 'CREATE_GIG'
  | 'WALLET'
  | 'PROFILE'
  | 'CHAT'
  | 'ADMIN'
  | 'LEADERBOARD'
  | 'MARKETPLACE';

interface BottomNavProps {
  currentTab: TabScreen;
  onSelectTab: (tab: TabScreen) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { currentSelectedGig, roleMode } = useGigMe();
  const isClient = roleMode === 'CLIENT';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0A0E17]/95 backdrop-blur-lg border-t border-sky-100 dark:border-[#1E293B] px-1 sm:px-3 py-1.5 shadow-[0_-4px_20px_rgba(2,132,199,0.07)] dark:shadow-2xl">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Tab 1: Radar Discovery */}
        <button
          id="nav-home-btn"
          onClick={() => onSelectTab('HOME')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition ${
            currentTab === 'HOME'
              ? 'text-[#0284C7] dark:text-[#00E5FF] bg-sky-50/80 dark:bg-sky-950/40 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-[#0284C7] dark:hover:text-slate-200'
          }`}
        >
          <Radar className={`w-4 h-4 sm:w-5 sm:h-5 ${currentTab === 'HOME' ? 'animate-pulse' : ''}`} />
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">Radar</span>
        </button>

        {/* Tab 2: Tin Nhắn Chat (Kế mục Radar) */}
        <button
          id="nav-chat-btn"
          onClick={() => onSelectTab('CHAT')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition relative ${
            currentTab === 'CHAT'
              ? 'text-[#0284C7] dark:text-[#00E5FF] bg-sky-50/80 dark:bg-sky-950/40 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-[#0284C7] dark:hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">Tin Nhắn</span>
        </button>

        {/* Tab 3: Campus Flea Market (Thanh lý đồ cũ) */}
        <button
          id="nav-marketplace-btn"
          onClick={() => onSelectTab('MARKETPLACE')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition ${
            currentTab === 'MARKETPLACE'
              ? 'text-[#0284C7] dark:text-[#00E5FF] bg-sky-50/80 dark:bg-sky-950/40 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-[#0284C7] dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">Chợ KTX</span>
        </button>

        {/* Central Action: Đăng Kèo */}
        <div className="px-1 shrink-0">
          <button
            id="nav-create-btn"
            onClick={() => onSelectTab('CREATE_GIG')}
            className="relative -top-3 flex flex-col items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-[#0284C7] via-sky-500 to-[#0369A1] text-white border-2 border-white dark:border-sky-400/30 shadow-lg shadow-sky-500/30 dark:shadow-[0_0_20px_rgba(2,132,199,0.5)] ring-4 ring-sky-100 dark:ring-sky-950/50 transition transform hover:scale-105 active:scale-95"
            title="Đăng việc nhanh"
          >
            <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.4]" />
          </button>
        </div>

        {/* Tab 4: Bảng Xếp Hạng Top Trợ Thủ */}
        <button
          id="nav-leaderboard-btn"
          onClick={() => onSelectTab('LEADERBOARD')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition ${
            currentTab === 'LEADERBOARD'
              ? 'text-[#0284C7] dark:text-[#00E5FF] bg-sky-50/80 dark:bg-sky-950/40 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-[#0284C7] dark:hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">BXH Top</span>
        </button>

        {/* Tab 5: Wallet & Escrow */}
        <button
          id="nav-wallet-btn"
          onClick={() => onSelectTab('WALLET')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition ${
            currentTab === 'WALLET'
              ? 'text-[#0284C7] dark:text-[#00E5FF] bg-sky-50/80 dark:bg-sky-950/40 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-[#0284C7] dark:hover:text-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">Ví</span>
        </button>

        {/* Tab 6: 2-in-1 Profile */}
        <button
          id="nav-profile-btn"
          onClick={() => onSelectTab('PROFILE')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition ${
            currentTab === 'PROFILE'
              ? 'text-[#0284C7] dark:text-[#00E5FF] bg-sky-50/80 dark:bg-sky-950/40 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-[#0284C7] dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">Hồ Sơ</span>
        </button>
      </div>
    </nav>
  );
};
