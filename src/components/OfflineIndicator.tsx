import React, { useState } from 'react';
import { WifiOff, ChevronRight } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { OfflineGigsModal } from './OfflineGigsModal';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showModal, setShowModal] = useState(false);

  if (isOnline) return null;

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 flex items-center justify-between gap-2 rounded-2xl bg-amber-500/95 backdrop-blur-md px-4 py-2.5 text-xs font-black text-black shadow-2xl border border-amber-300 cursor-pointer hover:bg-amber-400 transition animate-pulse"
      >
        <div className="flex items-center space-x-2 min-w-0">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span className="truncate">Chế độ ngoại tuyến (Mất sóng 4G/Thang máy) • Bấm để xem việc đã lưu!</span>
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
