import React, { useState } from 'react';
import {
  Users,
  X,
  QrCode,
  CheckCircle2,
  DollarSign,
  UserPlus,
  ShieldCheck,
  Check,
  Camera,
  KeyRound,
} from 'lucide-react';
import { GigEntity } from '../types';
import { useGigMe } from '../context/GigMeContext';
import { triggerHaptic } from '../utils/haptics';

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
    language,
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
    triggerHaptic('medium');
    joinMultiWorkerGig(gig.id);
  };

  const handleManualCheckIn = () => {
    if (!enteredCode.trim()) {
      triggerHaptic('error');
      showNotification(
        language === 'vi' ? 'Chưa nhập mã' : 'Missing Code',
        language === 'vi'
          ? 'Vui lòng nhập mã bảo mật điểm danh từ người thuê.'
          : 'Please enter the check-in security code provided by client.'
      );
      return;
    }
    triggerHaptic('success');
    checkInMultiWorker(gig.id, enteredCode.trim());
    setEnteredCode('');
  };

  const handleSimulateQrScan = () => {
    if (!secretCode) {
      triggerHaptic('error');
      showNotification(
        language === 'vi' ? 'Chưa có mã' : 'No Code Available',
        language === 'vi'
          ? 'Chủ việc chưa kích hoạt mã bảo mật QR cho ca làm này.'
          : 'Client has not generated a QR check-in code for this shift.'
      );
      return;
    }
    triggerHaptic('light');
    setIsScanningSimulation(true);
    setTimeout(() => {
      triggerHaptic('success');
      checkInMultiWorker(gig.id, secretCode);
      setIsScanningSimulation(false);
    }, 900);
  };

  const handlePayoutAll = () => {
    triggerHaptic('escrow');
    payoutMultiWorkers(gig.id);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-teal-500/30 overflow-hidden my-6"
      >
        {/* Header Nhóm Làm Việc */}
        <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md border border-white/20">
                <Users className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold">
                    {language === 'vi' ? 'Đơn Việc Nhóm & Điểm Danh QR' : 'Group Gig & QR Check-in'}
                  </h2>
                  <span className="px-2 py-0.5 text-xs font-bold bg-white/20 rounded-full border border-white/30 text-white">
                    {workers.length}/{totalNeeded} {language === 'vi' ? 'Trợ Thủ' : 'Helpers'}
                  </span>
                </div>
                <p className="text-xs text-teal-100 mt-0.5">
                  {language === 'vi'
                    ? 'Check-in hiện trường bằng QR động • Smart Escrow tự động chia đều thù lao'
                    : 'On-site dynamic QR check-in • Smart Escrow auto-splits payouts'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
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
                {language === 'vi'
                  ? `Yêu cầu ${totalNeeded} người • ${gig.estimatedDurationMinutes || 60} phút`
                  : `Requires ${totalNeeded} people • ${gig.estimatedDurationMinutes || 60} mins`}
              </p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <span className="text-[11px] text-slate-400 block">
                {language === 'vi' ? 'Thù lao mỗi người:' : 'Payout per person:'}
              </span>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {payoutPerPerson.toLocaleString()}đ
              </div>
              <span className="text-[10px] text-slate-400">
                {language === 'vi' ? '(Sau 10% phí sàn)' : '(After 10% platform fee)'}
              </span>
            </div>
          </div>

          {/* DÀNH CHO NGƯỜI THUÊ (CLIENT) - BẢNG ĐIỀU HÀNH & MÃ QR ĐIỂM DANH */}
          {isOwner ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Khung Mã QR Điểm Danh Hiện Trường */}
                <div className="p-5 rounded-3xl bg-gradient-to-b from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 border-2 border-teal-300 dark:border-teal-800 text-center flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-teal-800 dark:text-teal-300 mb-2">
                    {language === 'vi' ? 'MÃ QR ĐIỂM DANH HIỆN TRƯỜNG' : 'ON-SITE QR CHECK-IN CODE'}
                  </span>

                  {/* QR Code SVG */}
                  <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 relative group">
                    <svg
                      className="w-36 h-36"
                      viewBox="0 0 100 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect x="5" y="5" width="25" height="25" rx="4" fill="#0f766e" />
                      <rect x="9" y="9" width="17" height="17" rx="2" fill="white" />
                      <rect x="13" y="13" width="9" height="9" fill="#0f766e" />

                      <rect x="70" y="5" width="25" height="25" rx="4" fill="#0f766e" />
                      <rect x="74" y="9" width="17" height="17" rx="2" fill="white" />
                      <rect x="78" y="13" width="9" height="9" fill="#0f766e" />

                      <rect x="5" y="70" width="25" height="25" rx="4" fill="#0f766e" />
                      <rect x="9" y="74" width="17" height="17" rx="2" fill="white" />
                      <rect x="13" y="78" width="9" height="9" fill="#0f766e" />

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
                    <span className="text-[11px] text-slate-500 block">
                      {language === 'vi' ? 'Hoặc đọc mã 6 số cho trợ thủ:' : 'Or share 6-digit code with helpers:'}
                    </span>
                    <div className="text-xl font-black text-teal-700 dark:text-teal-300 tracking-widest bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-teal-200 dark:border-teal-700 inline-block mt-1">
                      {secretCode}
                    </div>
                  </div>
                </div>

                {/* Tình hình quân số & Nút giải ngân */}
                <div className="flex flex-col justify-between space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      {language === 'vi' ? 'Tiến độ điểm danh hiện trường:' : 'On-site check-in progress:'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${(checkedInCount / totalNeeded) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-teal-600">
                        {checkedInCount}/{totalNeeded} {language === 'vi' ? 'Có Mặt' : 'Present'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                      {language === 'vi'
                        ? 'Khi các bạn đã hoàn thành công việc theo phân công, hãy bấm nút bên dưới để giải ngân tiền thù lao từ Smart Escrow chia đều cho từng bạn.'
                        : 'Once helpers finish their assigned duties, tap below to release equal Escrow disbursements to each member.'}
                    </p>
                  </div>

                  {/* Nút Nghiệm thu & Giải ngân chia đều */}
                  <button
                    onClick={handlePayoutAll}
                    disabled={checkedInCount === 0 || gig.status === 'COMPLETED'}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>
                      {gig.status === 'COMPLETED'
                        ? language === 'vi'
                          ? 'Đã Giải Ngân Hoàn Tất'
                          : 'Disbursement Completed'
                        : language === 'vi'
                        ? `Nghiệm Thu & Giải Ngân Cho ${checkedInCount} Bạn`
                        : `Approve & Disburse to ${checkedInCount} Helpers`}
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
                    {language === 'vi' ? 'Tham Gia Đội Ngũ Trợ Thủ Ca Này' : 'Join This Helper Team'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    {language === 'vi' ? (
                      <>
                        Ca làm việc này cần <strong>{totalNeeded} bạn</strong>. Sau khi hoàn thành và check-in, mỗi bạn nhận về{' '}
                        <strong className="text-emerald-600 font-bold">{payoutPerPerson.toLocaleString()}đ</strong> trực tiếp vào ví!
                      </>
                    ) : (
                      <>
                        This shift needs <strong>{totalNeeded} helpers</strong>. Upon completing and checking in, each receives{' '}
                        <strong className="text-emerald-600 font-bold">{payoutPerPerson.toLocaleString()} VND</strong> directly into wallet!
                      </>
                    )}
                  </p>
                  <button
                    onClick={handleJoin}
                    disabled={workers.length >= totalNeeded}
                    className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {workers.length >= totalNeeded
                      ? language === 'vi'
                        ? 'Ca Làm Đã Đủ Người'
                        : 'Shift Is Full'
                      : language === 'vi'
                      ? 'Đăng Ký Tham Gia Ngay'
                      : 'Join Shift Now'}
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
                      {language === 'vi' ? 'Bạn Đã Check-in Thành Công!' : 'Check-in Confirmed!'}
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                      {language === 'vi' ? (
                        <>
                          Đã ghi nhận có mặt lúc{' '}
                          {currentWorker?.checkedInAt
                            ? new Date(currentWorker.checkedInAt).toLocaleTimeString('vi-VN')
                            : 'mới đây'}{' '}
                          • Thù lao {payoutPerPerson.toLocaleString()}đ sẽ được tự động giải ngân khi chủ việc nghiệm thu.
                        </>
                      ) : (
                        <>
                          Arrival verified at{' '}
                          {currentWorker?.checkedInAt
                            ? new Date(currentWorker.checkedInAt).toLocaleTimeString('en-US')
                            : 'just now'}{' '}
                          • Payout of {payoutPerPerson.toLocaleString()} VND will be released upon client approval.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                /* Đã tham gia nhưng chưa check in */
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-teal-300 dark:border-teal-800 space-y-4">
                  <div className="flex items-center space-x-2">
                    <QrCode className="w-5 h-5 text-teal-600" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {language === 'vi'
                        ? 'Điểm Danh Khi Đã Có Mặt Tại Hiện Trường'
                        : 'Check-in Once Present On-Site'}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Cách 1: Quét QR 1 chạm */}
                    <button
                      onClick={handleSimulateQrScan}
                      disabled={isScanningSimulation}
                      className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-400 dark:border-teal-700 hover:bg-teal-500/20 text-center transition-all flex flex-col items-center justify-center space-y-2 cursor-pointer"
                    >
                      <div className="p-2.5 bg-teal-500 text-white rounded-xl">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-teal-800 dark:text-teal-200">
                        {isScanningSimulation
                          ? language === 'vi'
                            ? 'Đang quét Camera...'
                            : 'Scanning Camera...'
                          : language === 'vi'
                          ? 'Quét Mã QR Của Chủ Việc'
                          : 'Scan Client QR Code'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {language === 'vi' ? 'Tự động nhận diện điểm danh' : 'Instant check-in verification'}
                      </span>
                    </button>

                    {/* Cách 2: Nhập mã 6 số */}
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2">
                      <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400 text-[11px] font-semibold">
                        <KeyRound className="w-3.5 h-3.5 text-teal-500" />
                        <span>{language === 'vi' ? 'Hoặc nhập mã 6 số:' : 'Or enter 6-digit code:'}</span>
                      </div>
                      <input
                        type="text"
                        maxLength={32}
                        value={enteredCode}
                        onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                        placeholder={language === 'vi' ? 'Nhập mã bảo mật...' : 'Enter security code...'}
                        className="w-full p-2 text-center text-sm font-black tracking-wider rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                      <button
                        onClick={handleManualCheckIn}
                        className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        {language === 'vi' ? 'Xác Nhận Check-in' : 'Confirm Check-in'}
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
                {language === 'vi'
                  ? `Danh sách thành viên (${workers.length}/${totalNeeded}):`
                  : `Team Members (${workers.length}/${totalNeeded}):`}
              </span>
              <span className="text-[11px] text-slate-400">
                {checkedInCount}/{workers.length} {language === 'vi' ? 'Đã Check-in' : 'Checked In'}
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
                            {language === 'vi' ? 'BẠN' : 'YOU'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {w.isCheckedIn
                          ? `${language === 'vi' ? 'Đã check-in' : 'Checked in'} ${
                              w.checkedInAt
                                ? new Date(w.checkedInAt).toLocaleTimeString(
                                    language === 'vi' ? 'vi-VN' : 'en-US'
                                  )
                                : ''
                            }`
                          : language === 'vi'
                          ? 'Chưa có mặt tại hiện trường'
                          : 'Not yet arrived on-site'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {w.isPaid ? (
                      <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>{language === 'vi' ? 'Đã Nhận Tiền' : 'Paid'}</span>
                      </span>
                    ) : w.isCheckedIn ? (
                      <span className="px-2.5 py-1 text-[11px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-xl flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-teal-600" />
                        <span>{language === 'vi' ? 'Đã Check-in' : 'Checked In'}</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-xl">
                        {language === 'vi' ? 'Chờ Điểm Danh' : 'Awaiting Check-in'}
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
            <span>
              {language === 'vi'
                ? 'Smart Escrow bảo chứng thanh toán minh bạch'
                : 'Smart Escrow guarantees transparent payout'}
            </span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            {language === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
