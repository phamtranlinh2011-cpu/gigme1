import React, { useState } from 'react';
import { WifiOff, ChevronRight } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { OfflineGigsModal } from './OfflineGigsModal';
import { useGigMe } from '../context/GigMeContext';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showModal, setShowModal] = useState(false);
  const { language } = useGigMe();

  if (isOnline) return null;

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 flex items-center justify-between gap-2 rounded-2xl bg-amber-500/95 backdrop-blur-md px-4 py-2.5 text-xs font-black text-black shadow-2xl border border-amber-300 cursor-pointer hover:bg-amber-400 transition animate-pulse"
      >
        <div className="flex items-center space-x-2 min-w-0">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span className="truncate">
            {language === 'vi'
              ? 'Chế độ ngoại tuyến (Mất sóng 4G/Thang máy) • Bấm để xem việc đã lưu!'
              : 'Offline Mode (No 4G/Elevator) • Tap to view cached gigs!'}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 shrink-0" />
      </div>

      <OfflineGigsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};
