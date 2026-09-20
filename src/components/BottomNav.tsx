import React from 'react';
import { Radar, Wallet, UserCheck, PlusCircle, MessageSquare, BookOpen } from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';

export type TabScreen =
  | 'HOME'
  | 'CREATE_GIG'
  | 'WALLET'
  | 'PROFILE'
  | 'CHAT'
  | 'ADMIN'
  | 'MARKETPLACE';

interface BottomNavProps {
  currentTab: TabScreen;
  onSelectTab: (tab: TabScreen) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { currentSelectedGig, roleMode } = useGigMe();
  const isClient = roleMode === 'CLIENT';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B1528]/95 dark:bg-[#070D18]/98 backdrop-blur-lg border-t border-[#C5E5EC]/20 px-1 sm:px-3 py-1.5 shadow-[0_-4px_25px_rgba(48,100,174,0.25)]">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Tab 1: Radar Discovery */}
        <button
          id="nav-home-btn"
          onClick={() => onSelectTab('HOME')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition cursor-pointer ${
            currentTab === 'HOME'
              ? 'text-[#E0FAEB] bg-[#3064AE]/35 font-black border border-[#C5E5EC]/30 shadow-xs'
              : 'text-[#C5E5EC]/70 hover:text-white'
          }`}
        >
          <Radar className={`w-4 h-4 sm:w-5 sm:h-5 ${currentTab === 'HOME' ? 'animate-pulse text-[#E0FAEB]' : ''}`} />
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">Radar</span>
        </button>

        {/* Tab 2: Tin Nhắn Chat (Kế mục Radar) */}
        <button
          id="nav-chat-btn"
          onClick={() => onSelectTab('CHAT')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition relative cursor-pointer ${
            currentTab === 'CHAT'
              ? 'text-[#E0FAEB] bg-[#3064AE]/35 font-black border border-[#C5E5EC]/30 shadow-xs'
              : 'text-[#C5E5EC]/70 hover:text-white'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#E0FAEB] animate-pulse" />
          </div>
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">Tin Nhắn</span>
        </button>

        {/* Tab 3: Campus Flea Market (Thanh lý đồ cũ) */}
        <button
          id="nav-marketplace-btn"
          onClick={() => onSelectTab('MARKETPLACE')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition cursor-pointer ${
            currentTab === 'MARKETPLACE'
              ? 'text-[#E0FAEB] bg-[#3064AE]/35 font-black border border-[#C5E5EC]/30 shadow-xs'
              : 'text-[#C5E5EC]/70 hover:text-white'
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
            className="relative -top-3 flex flex-col items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-[#3064AE] via-[#417AC6] to-[#C5E5EC] text-white border-2 border-[#E0FAEB]/40 shadow-lg shadow-[#3064AE]/40 ring-4 ring-[#0B1528] transition transform hover:scale-105 active:scale-95 cursor-pointer"
            title="Đăng việc nhanh"
          >
            <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.4]" />
          </button>
        </div>

        {/* Tab 4: Wallet & Escrow */}
        <button
          id="nav-wallet-btn"
          onClick={() => onSelectTab('WALLET')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition cursor-pointer ${
            currentTab === 'WALLET'
              ? 'text-[#E0FAEB] bg-[#3064AE]/35 font-black border border-[#C5E5EC]/30 shadow-xs'
              : 'text-[#C5E5EC]/70 hover:text-white'
          }`}
        >
          <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">Ví</span>
        </button>

        {/* Tab 6: 2-in-1 Profile */}
        <button
          id="nav-profile-btn"
          onClick={() => onSelectTab('PROFILE')}
          className={`flex-1 min-w-0 flex flex-col items-center py-1 px-1 rounded-xl transition cursor-pointer ${
            currentTab === 'PROFILE'
              ? 'text-[#E0FAEB] bg-[#3064AE]/35 font-black border border-[#C5E5EC]/30 shadow-xs'
              : 'text-[#C5E5EC]/70 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">Hồ Sơ</span>
        </button>
      </div>
    </nav>
  );
};
