import React, { useState } from 'react';
import {
  Users,
  X,
  QrCode,
  CheckCircle2,
  Clock,
  DollarSign,
  UserPlus,
  ShieldCheck,
  Check,
  AlertCircle,
  Sparkles,
  Camera,
  KeyRound,
} from 'lucide-react';
import { GigEntity } from '../types';
import { useGigMe } from '../context/GigMeContext';
import { validateSecurityToken } from '../utils/securityTokens';

interface MultiWorkerCheckInModalProps {
  isOpen: boolean;
  gig: GigEntity;
  onClose: () => void;
}

export const MultiWorkerCheckInModal: React.FC<MultiWorkerCheckInModalProps> = ({
  isOpen,
  gig,
  onClose,
}) => {
  const {
    currentUser,
    joinMultiWorkerGig,
    checkInMultiWorker,
    payoutMultiWorkers,
    showNotification,
  } = useGigMe();

  const [enteredCode, setEnteredCode] = useState<string>('');
  const [isScanningSimulation, setIsScanningSimulation] = useState<boolean>(false);

  if (!isOpen) return null;

  const isOwner = currentUser?.id === gig.clientId;
  const workers = gig.multiWorkers || [];
  const currentWorker = workers.find((w) => w.workerId === currentUser?.id);
  const isJoined = !!currentWorker;
  const isCheckedIn = !!currentWorker?.isCheckedIn;
  const totalNeeded = gig.totalWorkersNeeded || 1;
  const checkedInCount = workers.filter((w) => w.isCheckedIn).length;
  const rewardPerPerson = Math.floor(gig.price / totalNeeded);
  const payoutPerPerson = Math.floor(rewardPerPerson * 0.9); // 10% platform fee
  const secretCode = gig.checkInSecretCode || '';

  const handleJoin = () => {
    joinMultiWorkerGig(gig.id);
  };

  const handleManualCheckIn = () => {
    if (!enteredCode.trim()) {
      showNotification('Chưa nhập mã', 'Vui lòng nhập mã bảo mật điểm danh từ người thuê.');
      return;
    }
    checkInMultiWorker(gig.id, enteredCode.trim());
    setEnteredCode('');
  };

  const handleSimulateQrScan = () => {
    if (!secretCode) {
      showNotification('Chưa có mã', 'Chủ việc chưa kích hoạt mã bảo mật QR cho ca làm này.');
      return;
    }
    setIsScanningSimulation(true);
    setTimeout(() => {
      checkInMultiWorker(gig.id, secretCode);
      setIsScanningSimulation(false);
    }, 900);
  };

  const handlePayoutAll = () => {
    payoutMultiWorkers(gig.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-teal-500/30 overflow-hidden my-6">
        {/* Header Nhóm Làm Việc */}
        <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md border border-white/20">
                <Users className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold">Đơn Việc Nhóm & Điểm Danh QR</h2>
                  <span className="px-2 py-0.5 text-xs font-bold bg-white/20 rounded-full border border-white/30 text-white">
                    {workers.length}/{totalNeeded} Trợ Thủ
                  </span>
                </div>
                <p className="text-xs text-teal-100 mt-0.5">
                  Check-in hiện trường bằng QR động • Smart Escrow tự động chia đều thù lao
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Thông tin đơn và thù lao theo đầu người */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                {gig.locationName}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {gig.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Yêu cầu {totalNeeded} người • {gig.estimatedDurationMinutes || 60} phút
              </p>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <span className="text-[11px] text-slate-400 block">Thù lao mỗi người:</span>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {payoutPerPerson.toLocaleString()}đ
              </div>
              <span className="text-[10px] text-slate-400">(Sau 10% phí sàn)</span>
            </div>
          </div>

          {/* DÀNH CHO NGƯỜI THUÊ (CLIENT) - BẢNG ĐIỀU HÀNH & MÃ QR ĐIỂM DANH */}
          {isOwner ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Khung Mã QR Điểm Danh Hiện Trường */}
                <div className="p-5 rounded-3xl bg-gradient-to-b from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 border-2 border-teal-300 dark:border-teal-800 text-center flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-teal-800 dark:text-teal-300 mb-2">
                    MÃ QR ĐIỂM DANH HIỆN TRƯỜNG
                  </span>

                  {/* Giả lập QR Code SVG cực đẹp */}
                  <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 relative group">
                    <svg
                      className="w-36 h-36"
                      viewBox="0 0 100 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* 3 góc định vị QR */}
                      <rect x="5" y="5" width="25" height="25" rx="4" fill="#0f766e" />
                      <rect x="9" y="9" width="17" height="17" rx="2" fill="white" />
                      <rect x="13" y="13" width="9" height="9" fill="#0f766e" />

                      <rect x="70" y="5" width="25" height="25" rx="4" fill="#0f766e" />
                      <rect x="74" y="9" width="17" height="17" rx="2" fill="white" />
                      <rect x="78" y="13" width="9" height="9" fill="#0f766e" />

                      <rect x="5" y="70" width="25" height="25" rx="4" fill="#0f766e" />
                      <rect x="9" y="74" width="17" height="17" rx="2" fill="white" />
                      <rect x="13" y="78" width="9" height="9" fill="#0f766e" />

                      {/* Các điểm dữ liệu QR */}
                      <rect x="35" y="10" width="8" height="8" fill="#14b8a6" />
                      <rect x="48" y="10" width="14" height="8" fill="#0f766e" />
                      <rect x="35" y="22" width="18" height="8" fill="#0f766e" />
                      <rect x="58" y="22" width="6" height="8" fill="#14b8a6" />

                      <rect x="10" y="38" width="8" height="18" fill="#0f766e" />
                      <rect x="22" y="38" width="14" height="8" fill="#14b8a6" />
                      <rect x="22" y="48" width="8" height="18" fill="#0f766e" />

                      <rect x="38" y="38" width="24" height="24" rx="4" fill="#0d9488" />
                      <circle cx="50" cy="50" r="6" fill="white" />

                      <rect x="68" y="38" width="10" height="8" fill="#0f766e" />
                      <rect x="82" y="38" width="8" height="14" fill="#14b8a6" />
                      <rect x="68" y="52" width="22" height="8" fill="#0f766e" />

                      <rect x="38" y="70" width="12" height="12" fill="#14b8a6" />
                      <rect x="54" y="70" width="18" height="8" fill="#0f766e" />
                      <rect x="44" y="84" width="28" height="10" fill="#0f766e" />
                      <rect x="76" y="80" width="14" height="14" fill="#14b8a6" />
                    </svg>
                  </div>

                  <div className="mt-3 text-center">
                    <span className="text-[11px] text-slate-500 block">Hoặc đọc mã 6 số cho trợ thủ:</span>
                    <div className="text-xl font-black text-teal-700 dark:text-teal-300 tracking-widest bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-teal-200 dark:border-teal-700 inline-block mt-1">
                      {secretCode}
                    </div>
                  </div>
                </div>

                {/* Tình hình quân số & Nút giải ngân */}
                <div className="flex flex-col justify-between space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Tiến độ điểm danh hiện trường:
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${(checkedInCount / totalNeeded) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-teal-600">
                        {checkedInCount}/{totalNeeded} Có Mặt
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                      Khi các bạn đã hoàn thành công việc theo phân công, hãy bấm nút bên dưới để giải ngân tiền thù lao từ Smart Escrow chia đều cho từng bạn.
                    </p>
                  </div>

                  {/* Nút Nghiệm thu & Giải ngân chia đều */}
                  <button
                    onClick={handlePayoutAll}
                    disabled={checkedInCount === 0 || gig.status === 'COMPLETED'}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>
                      {gig.status === 'COMPLETED'
                        ? 'Đã Giải Ngân Hoàn Tất'
                        : `Nghiệm Thu & Giải Ngân Cho ${checkedInCount} Bạn`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* DÀNH CHO FREELANCER (TRỢ THỦ) */
            <div className="space-y-4">
              {!isJoined ? (
                /* Chưa tham gia */
                <div className="p-6 rounded-3xl bg-teal-50/70 dark:bg-teal-950/20 border-2 border-dashed border-teal-300 dark:border-teal-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-600 mx-auto flex items-center justify-center">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Tham Gia Đội Ngũ Trợ Thủ Ca Này
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    Ca làm việc này cần <strong>{totalNeeded} bạn</strong>. Sau khi hoàn thành và check-in, mỗi bạn nhận về{' '}
                    <strong className="text-emerald-600 font-bold">{payoutPerPerson.toLocaleString()}đ</strong> trực tiếp vào ví!
                  </p>
                  <button
                    onClick={handleJoin}
                    disabled={workers.length >= totalNeeded}
                    className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition-transform active:scale-95 disabled:opacity-50"
                  >
                    {workers.length >= totalNeeded ? 'Ca Làm Đã Đủ Người' : 'Đăng Ký Tham Gia Ngay'}
                  </button>
                </div>
              ) : isCheckedIn ? (
                /* Đã check in thành công */
                <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center space-x-3">
                  <div className="p-3 bg-emerald-500 text-white rounded-2xl">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      Bạn Đã Check-in Thành Công!
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Đã ghi nhận có mặt lúc{' '}
                      {currentWorker?.checkedInAt
                        ? new Date(currentWorker.checkedInAt).toLocaleTimeString('vi-VN')
                        : 'mới đây'}{' '}
                      • Thù lao {payoutPerPerson.toLocaleString()}đ sẽ được tự động giải ngân khi chủ việc nghiệm thu.
                    </p>
                  </div>
                </div>
              ) : (
                /* Đã tham gia nhưng chưa check in */
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-teal-300 dark:border-teal-800 space-y-4">
                  <div className="flex items-center space-x-2">
                    <QrCode className="w-5 h-5 text-teal-600" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Điểm Danh Khi Đã Có Mặt Tại Hiện Trường
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Cách 1: Quét QR 1 chạm */}
                    <button
                      onClick={handleSimulateQrScan}
                      disabled={isScanningSimulation}
                      className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-400 dark:border-teal-700 hover:bg-teal-500/20 text-center transition-all flex flex-col items-center justify-center space-y-2"
                    >
                      <div className="p-2.5 bg-teal-500 text-white rounded-xl">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-teal-800 dark:text-teal-200">
                        {isScanningSimulation ? 'Đang quét Camera...' : 'Quét Mã QR Của Chủ Việc'}
                      </span>
                      <span className="text-[10px] text-slate-400">Tự động nhận diện điểm danh</span>
                    </button>

                    {/* Cách 2: Nhập mã 6 số */}
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2">
                      <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400 text-[11px] font-semibold">
                        <KeyRound className="w-3.5 h-3.5 text-teal-500" />
                        <span>Hoặc nhập mã 6 số:</span>
                      </div>
                      <input
                        type="text"
                        maxLength={32}
                        value={enteredCode}
                        onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                        placeholder="Nhập mã bảo mật..."
                        className="w-full p-2 text-center text-sm font-black tracking-wider rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                      <button
                        onClick={handleManualCheckIn}
                        className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl"
                      >
                        Xác Nhận Check-in
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Danh sách thành viên trong nhóm */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Danh sách thành viên ({workers.length}/{totalNeeded}):
              </span>
              <span className="text-[11px] text-slate-400">
                {checkedInCount}/{workers.length} Đã Check-in
              </span>
            </div>

            <div className="space-y-2">
              {workers.map((w, idx) => (
                <div
                  key={w.id}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center text-xs font-black">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {w.workerName}
                        </span>
                        {w.workerId === currentUser?.id && (
                          <span className="px-1.5 py-0.2 text-[10px] font-bold bg-blue-100 text-blue-700 rounded">
                            BẠN
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {w.isCheckedIn
                          ? `Đã check-in ${w.checkedInAt ? new Date(w.checkedInAt).toLocaleTimeString('vi-VN') : ''}`
                          : 'Chưa có mặt tại hiện trường'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {w.isPaid ? (
                      <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Đã Nhận Tiền</span>
                      </span>
                    ) : w.isCheckedIn ? (
                      <span className="px-2.5 py-1 text-[11px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-xl flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-teal-600" />
                        <span>Đã Check-in</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-xl">
                        Chờ Điểm Danh
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Smart Escrow bảo chứng thanh toán minh bạch</span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
