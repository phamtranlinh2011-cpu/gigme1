import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 flex items-center space-x-2 rounded-2xl bg-amber-500/90 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-black shadow-2xl border border-amber-300 animate-pulse">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Chế độ ngoại tuyến (Offline Mode) — Đang hiển thị dữ liệu bộ nhớ đệm an toàn.</span>
    </div>
  );
};
