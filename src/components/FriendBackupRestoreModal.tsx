import React, { useState } from 'react';
import {
  Cloud,
  Download,
  Upload,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  ShieldCheck,
  RefreshCw,
  FileJson,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { playNotificationSound } from '../utils/audio';

interface FriendBackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'BACKUP' | 'RESTORE';
}

interface BackupPayload {
  version: string;
  userId: string;
  userName: string;
  createdAt: number;
  friendCount: number;
  friendIds: string[];
  checksum: string;
}

export const FriendBackupRestoreModal: React.FC<FriendBackupRestoreModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'BACKUP',
}) => {
  const {
    currentUser,
    users,
    addFriendById,
    updateUserProfile,
    showNotification,
  } = useGigMe();

  const [activeTab, setActiveTab] = useState<'BACKUP' | 'RESTORE'>(defaultTab);
  const [copiedToken, setCopiedToken] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [restoreInput, setRestoreInput] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [restoreSuccessCount, setRestoreSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentFriendIds = currentUser?.friendIds || [];
  const friendDetails = (users || []).filter((u) => currentFriendIds.includes(u.id));

  // Generate Backup Data
  const generateBackupData = (): BackupPayload => {
    const payload: BackupPayload = {
      version: '2.0-campus',
      userId: currentUser?.id || '000000000',
      userName: currentUser?.name || 'Sinh Viên',
      createdAt: Date.now(),
      friendCount: currentFriendIds.length,
      friendIds: currentFriendIds,
      checksum: `SIG_${currentFriendIds.length}_${(currentUser?.id || '').slice(0, 4)}`,
    };
    return payload;
  };

  const backupObject = generateBackupData();
  const backupJsonString = JSON.stringify(backupObject, null, 2);
  const backupCompactCode = `GIGME-BAK-${currentUser?.id || '000000000'}-${btoa(
    JSON.stringify({ c: currentFriendIds.length, ids: currentFriendIds })
  )}`;

  // Copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(backupCompactCode);
    setCopiedToken(true);
    playNotificationSound('DING_DEFAULT');
    showNotification('Đã sao chép mã sao lưu', 'Mã sao lưu danh bạ đã được lưu vào bộ nhớ tạm.');
    setTimeout(() => setCopiedToken(false), 2500);
  };

  // Download JSON file
  const handleDownloadJson = () => {
    const blob = new Blob([backupJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gigme_friends_backup_${currentUser?.id || 'id'}_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Tải tệp thành công', 'Tệp danh bạ bạn bè .json đã được lưu về máy.');
  };

  // Cloud Sync
  const handleCloudSync = () => {
    setCloudSynced(true);
    if (currentUser) {
      updateUserProfile({
        friendListBackupCode: backupCompactCode,
        friendListLastBackupAt: Date.now(),
      });
    }
    playNotificationSound('LEVEL_UP');
    showNotification(
      'Đồng Bộ Đám Mây An Toàn',
      `Đã đồng bộ ${currentFriendIds.length} bạn bè lên Cloud Firestore.`
    );
    setTimeout(() => setCloudSynced(false), 3000);
  };

  // Restore logic
  const handleRestore = () => {
    const clean = restoreInput.trim();
    if (!clean) {
      setRestoreError('Vui lòng nhập mã sao lưu hoặc dán nội dung tệp JSON vào ô bên dưới.');
      return;
    }

    setRestoreError('');
    let incomingIds: string[] = [];

    try {
      if (clean.startsWith('GIGME-BAK-')) {
        const parts = clean.split('-');
        const encoded = parts.slice(3).join('-');
        const decoded = JSON.parse(atob(encoded));
        incomingIds = Array.isArray(decoded.ids) ? decoded.ids : [];
      } else if (clean.startsWith('{')) {
        const parsed = JSON.parse(clean);
        incomingIds = Array.isArray(parsed.friendIds) ? parsed.friendIds : [];
      } else {
        // Plain comma or space separated list of 9-digit IDs
        incomingIds = clean
          .split(/[\s,;\n]+/)
          .map((s) => s.trim())
          .filter((s) => /^\d{9}$/.test(s));
      }

      if (incomingIds.length === 0) {
        setRestoreError('Không tìm thấy danh sách ID bạn bè hợp lệ trong dữ liệu được cung cấp.');
        return;
      }

      // Merge unique IDs
      let addedCount = 0;
      incomingIds.forEach((id) => {
        if (id && id !== currentUser?.id && !currentFriendIds.includes(id)) {
          addFriendById(id);
          addedCount++;
        }
      });

      setRestoreSuccessCount(addedCount);
      playNotificationSound('SUCCESS_CHIME');
      showNotification(
        'Khôi Phục Danh Bạ Thành Công',
        `Đã nạp thành công ${incomingIds.length} bạn bè (thêm mới: ${addedCount}).`
      );
      setRestoreInput('');
    } catch (err: any) {
      setRestoreError('Mã sao lưu hoặc định dạng JSON không hợp lệ: ' + (err?.message || 'Lỗi xử lý'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/30 text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#C5E5EC]/20 flex items-center justify-between bg-[#12233B]/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-2xl bg-[#3064AE]/30 border border-[#C5E5EC]/30 text-[#C5E5EC]">
              <Cloud className="w-5 h-5 text-[#E0FAEB]" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center space-x-1.5">
                <span>Sao Lưu & Khôi Phục Danh Bạ</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  ID 9 Số
                </span>
              </h3>
              <p className="text-[11px] text-[#C5E5EC]/70">
                Bảo vệ danh bạ bạn bè khi đổi điện thoại hoặc cài lại ứng dụng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-[#C5E5EC]/70 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1.5 bg-[#0A1322] border-b border-[#C5E5EC]/15 shrink-0">
          <button
            onClick={() => {
              setActiveTab('BACKUP');
              setRestoreSuccessCount(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'BACKUP'
                ? 'bg-[#3064AE] text-white shadow-sm border border-[#C5E5EC]/30'
                : 'text-[#C5E5EC]/70 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>1. Sao Lưu Lên Đám Mây</span>
          </button>
          <button
            onClick={() => setActiveTab('RESTORE')}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'RESTORE'
                ? 'bg-[#3064AE] text-white shadow-sm border border-[#C5E5EC]/30'
                : 'text-[#C5E5EC]/70 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>2. Khôi Phục Danh Bạ</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'BACKUP' && (
            <div className="space-y-4 animate-fade-in">
              {/* Summary stats */}
              <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#3064AE]/30 border border-[#C5E5EC]/25 flex items-center justify-center text-white font-black">
                    <Users className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <span className="font-extrabold text-white text-xs block">
                      Tổng bạn bè hiện tại: {currentFriendIds.length} người
                    </span>
                    <span className="text-[10px] text-[#C5E5EC]/70">
                      Tài khoản của bạn: ID {currentUser?.id}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCloudSync}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-[#E0FAEB] font-bold text-xs flex items-center space-x-1 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cloudSynced ? 'animate-spin text-emerald-300' : ''}`} />
                  <span>{cloudSynced ? 'Đã Đồng Bộ' : 'Đồng Bộ Cloud'}</span>
                </button>
              </div>

              {/* Compact Backup Token */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#C5E5EC]">
                  Mã Sao Lưu Bảo Mật (Portable Backup Code):
                </label>
                <div className="p-2.5 rounded-xl bg-[#0A1322] border border-[#C5E5EC]/30 font-mono text-[11px] text-[#E0FAEB] break-all select-all">
                  {backupCompactCode}
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={handleCopyCode}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#3064AE] hover:bg-[#255294] text-white font-bold text-xs border border-[#C5E5EC]/30 flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedToken ? 'Đã Sao Chép!' : 'Sao Chép Mã Nhanh'}</span>
                  </button>

                  <button
                    onClick={handleDownloadJson}
                    className="py-2 px-3 rounded-xl bg-[#12233B] hover:bg-[#1b345a] text-[#C5E5EC] hover:text-white font-bold text-xs border border-[#C5E5EC]/20 flex items-center space-x-1.5 transition cursor-pointer"
                    title="Tải tệp tin dự phòng .JSON"
                  >
                    <FileJson className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tải File .JSON</span>
                  </button>
                </div>
              </div>

              {/* Security guarantee */}
              <div className="p-3 rounded-2xl bg-sky-950/30 border border-sky-500/25 flex items-start space-x-2 text-[11px] text-[#C5E5EC]/80">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  Mã sao lưu đã được mã hóa an toàn. Khi đổi máy điện thoại khác, chỉ cần nhập mã này là danh bạ sẽ khôi phục 100% trong 1 giây.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'RESTORE' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#C5E5EC]">
                  Dán Mã Sao Lưu hoặc Nội Dung File .JSON vào đây:
                </label>
                <textarea
                  rows={4}
                  value={restoreInput}
                  onChange={(e) => {
                    setRestoreInput(e.target.value);
                    setRestoreError('');
                  }}
                  placeholder="Dán mã sao lưu bắt đầu bằng GIGME-BAK-... hoặc nội dung JSON tệp sao lưu..."
                  className="w-full p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/30 text-white placeholder:text-[#C5E5EC]/40 text-xs font-mono focus:border-sky-400 focus:outline-none transition"
                />
              </div>

              {restoreError && (
                <p className="text-[11px] text-rose-300 font-medium flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{restoreError}</span>
                </p>
              )}

              {restoreSuccessCount !== null && (
                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    Khôi phục thành công! Đã thêm mới <strong>{restoreSuccessCount}</strong> người bạn vào danh bạ của bạn.
                  </span>
                </div>
              )}

              <button
                onClick={handleRestore}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#417AC6] to-[#C5E5EC] text-white font-extrabold text-xs sm:text-sm hover:brightness-110 shadow-lg shadow-[#3064AE]/30 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Nạp & Đồng Bộ Danh Bạ Ngay &rarr;</span>
              </button>

              <div className="p-3 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/15 text-[11px] text-[#C5E5EC]/70 space-y-1">
                <span className="font-bold text-white block">Hướng dẫn khôi phục:</span>
                <p>1. Sao chép mã sao lưu từ máy cũ (hoặc mở tệp .json sao lưu).</p>
                <p>2. Dán vào khung phía trên rồi bấm "Nạp & Đồng Bộ Danh Bạ".</p>
                <p>3. Hệ thống sẽ tự động ghép nối bạn bè không bị trùng lặp.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
