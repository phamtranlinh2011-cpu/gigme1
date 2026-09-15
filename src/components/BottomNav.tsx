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

  const activeColor = isClient ? 'text-[#00E5FF]' : 'text-[#FF6B00]';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0E17]/95 backdrop-blur-lg border-t border-[#1E293B] px-1 sm:px-3 py-1 sm:py-1.5 shadow-2xl">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Tab 1: Radar Discovery */}
        <button
          id="nav-home-btn"
          onClick={() => onSelectTab('HOME')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition ${
            currentTab === 'HOME' ? activeColor : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radar className={`w-4 h-4 sm:w-5 sm:h-5 ${currentTab === 'HOME' ? 'animate-pulse' : ''}`} />
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">Radar</span>
        </button>

        {/* Tab 2: Campus Flea Market (Thanh lý đồ cũ) */}
        <button
          id="nav-marketplace-btn"
          onClick={() => onSelectTab('MARKETPLACE')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition ${
            currentTab === 'MARKETPLACE' ? activeColor : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">Flea Market</span>
        </button>

        {/* Central Action: Đăng Kèo */}
        <div className="px-1 shrink-0">
          <button
            id="nav-create-btn"
            onClick={() => onSelectTab('CREATE_GIG')}
            className={`relative -top-3 flex flex-col items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-full shadow-lg border-2 transition transform hover:scale-105 active:scale-95 ${
              isClient
                ? 'bg-[#00E5FF] text-black border-[#00E5FF]/40 shadow-[0_0_20px_rgba(0,229,255,0.5)]'
                : 'bg-[#FF6B00] text-black border-[#FF6B00]/40 shadow-[0_0_20px_rgba(255,107,0,0.5)]'
            }`}
            title="Đăng việc nhanh"
          >
            <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.3]" />
          </button>
        </div>

        {/* Tab 3: Bảng Xếp Hạng Top Trợ Thủ */}
        <button
          id="nav-leaderboard-btn"
          onClick={() => onSelectTab('LEADERBOARD')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition ${
            currentTab === 'LEADERBOARD' ? activeColor : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">BXH Top</span>
        </button>

        {/* Tab 4: Wallet & Escrow */}
        <button
          id="nav-wallet-btn"
          onClick={() => onSelectTab('WALLET')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition ${
            currentTab === 'WALLET' ? activeColor : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">Ví</span>
        </button>

        {/* Tab 5: 2-in-1 Profile */}
        <button
          id="nav-profile-btn"
          onClick={() => onSelectTab('PROFILE')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition ${
            currentTab === 'PROFILE' ? activeColor : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">Hồ Sơ</span>
        </button>
      </div>
    </nav>
  );
};
