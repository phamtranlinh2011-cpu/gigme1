import React, { useState } from 'react';
import {
  Smartphone,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  X,
  ArrowRight,
  RefreshCw,
  QrCode,
  ShieldAlert,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { formatVnd } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface MoMoZaloPayGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProvider?: 'MOMO' | 'ZALOPAY';
  defaultAmount?: number;
}

export const MoMoZaloPayGatewayModal: React.FC<MoMoZaloPayGatewayModalProps> = ({
  isOpen,
  onClose,
  defaultProvider = 'MOMO',
  defaultAmount = 50000,
}) => {
  const { depositEWallet, showNotification, checkDepositEligibility, language } = useGigMe();
  const [provider, setProvider] = useState<'MOMO' | 'ZALOPAY'>(defaultProvider);
  const [amount, setAmount] = useState(defaultAmount);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const eligibility = checkDepositEligibility(amount);

  if (!isOpen) return null;

  const orderId = `GME_${Date.now()}`;
  const momoDeepLink = `momo://app?action=payWithApp&partnerCode=MOMO_GIGME&orderId=${orderId}&amount=${amount}&orderInfo=${encodeURIComponent(
    'Nap tien GigMe Smart Escrow'
  )}`;
  const zalopayDeepLink = `zalopay://launch/payment?app_id=2554&app_trans_id=${orderId}&amount=${amount}&app_user=student_gigme`;

  const handlePayAppToApp = () => {
    if (!eligibility.allowed) {
      triggerHaptic('error');
      showNotification(
        language === 'vi' ? 'Giới hạn nạp tiền ⚠️' : 'Deposit Limit ⚠️',
        eligibility.reason || (language === 'vi' ? 'Chưa đủ điều kiện nạp tiền' : 'Deposit conditions not met')
      );
      return;
    }

    triggerHaptic('medium');
    setIsProcessing(true);
    // Simulate App-to-App launch & SDK handshake
    try {
      const link = provider === 'MOMO' ? momoDeepLink : zalopayDeepLink;
      window.location.href = link;
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const ok = depositEWallet(provider === 'MOMO' ? 'MOMO' : 'ZALOPAY', amount);
      if (!ok) {
        triggerHaptic('error');
        setIsProcessing(false);
        return;
      }
      setIsProcessing(false);
      setIsSuccess(true);
      triggerHaptic('success');
      showNotification(
        language === 'vi'
          ? `🎉 Thanh toán ${provider === 'MOMO' ? 'Ví MoMo' : 'ZaloPay'} thành công!`
          : `🎉 ${provider === 'MOMO' ? 'MoMo Wallet' : 'ZaloPay'} Payment Successful!`,
        language === 'vi'
          ? `Đã nạp +${formatVnd(amount)} vào ví thông qua ${
              provider === 'MOMO' ? 'MoMo App-to-App' : 'ZaloPay SDK One-Click'
            }.`
          : `Added +${formatVnd(amount)} into escrow via ${
              provider === 'MOMO' ? 'MoMo App-to-App' : 'ZaloPay SDK One-Click'
            }.`,
        true,
        true
      );
    }, 1500);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-[#0F172A] border-2 border-slate-700 p-6 text-white shadow-2xl space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-2.5 rounded-2xl ${
                provider === 'MOMO'
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                {language === 'vi'
                  ? `Cổng Thanh Toán ${provider === 'MOMO' ? 'MoMo' : 'ZaloPay'}`
                  : `${provider === 'MOMO' ? 'MoMo' : 'ZaloPay'} Payment Gateway`}
              </h3>
              <p className="text-[11px] text-slate-400">
                {provider === 'MOMO' ? 'MoMo App-to-App Deep Link' : 'ZaloPay SDK Payment Gateway'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#131E30] border border-slate-700">
          <button
            type="button"
            onClick={() => {
              setProvider('MOMO');
              setIsSuccess(false);
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer ${
              provider === 'MOMO'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>{language === 'vi' ? '🌸 Ví MoMo' : '🌸 MoMo Wallet'}</span>
            <span className="text-[10px] bg-pink-900/50 px-1 rounded">App-to-App</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setProvider('ZALOPAY');
              setIsSuccess(false);
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer ${
              provider === 'ZALOPAY'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⚡ ZaloPay</span>
            <span className="text-[10px] bg-blue-900/50 px-1 rounded">SDK</span>
          </button>
        </div>

        {isSuccess ? (
          <div className="py-6 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h4 className="text-base font-black text-white">
                {language === 'vi' ? 'Thanh Toán Hoàn Tất!' : 'Payment Completed!'}
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                {language === 'vi'
                  ? `Tiền đã cộng vào Ví Smart Escrow của bạn qua ${provider === 'MOMO' ? 'MoMo' : 'ZaloPay'}.`
                  : `Funds credited to your Smart Escrow Wallet via ${provider === 'MOMO' ? 'MoMo' : 'ZaloPay'}.`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-emerald-400 text-black font-extrabold text-xs hover:brightness-110 transition cursor-pointer"
            >
              {language === 'vi' ? 'Đóng Cửa Sổ' : 'Close Window'}
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Security Limits Banner */}
            <div className="p-3 rounded-2xl bg-[#131E30] border border-slate-700 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span className="flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{language === 'vi' ? 'Quy định nạp ví an toàn' : 'Safe Deposit Policy'}</span>
                </span>
                <span className="text-[10px] bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-500/30 text-cyan-300">
                  Max 10M • 1h Cooldown • Max 30M/day
                </span>
              </div>
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>{language === 'vi' ? 'Đã nạp hôm nay:' : 'Deposited today:'}</span>
                <span className="font-mono font-bold text-slate-200">
                  {formatVnd(eligibility.todayDeposited)} / 30.000.000đ (
                  {language === 'vi' ? 'còn lại: ' : 'remaining: '}
                  {formatVnd(eligibility.remainingDailyQuota)})
                </span>
              </div>
              {eligibility.cooldownMinutesLeft > 0 && (
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center space-x-2 text-[11px] font-bold">
                  <Clock className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
                  <span>
                    {language === 'vi'
                      ? `Giãn cách: Vui lòng đợi ${eligibility.cooldownMinutesLeft} phút nữa để thực hiện lần nạp tiếp theo.`
                      : `Cooldown: Please wait ${eligibility.cooldownMinutesLeft} minutes before next deposit.`}
                  </span>
                </div>
              )}
              {!eligibility.allowed && eligibility.cooldownMinutesLeft === 0 && eligibility.reason && (
                <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-center space-x-2 text-[11px] font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{eligibility.reason}</span>
                </div>
              )}
            </div>

            {/* Amount Presets */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-slate-400 font-semibold">
                  {language === 'vi' ? 'Số tiền thanh toán (Tối đa 10M)' : 'Payment Amount (Max 10M)'}
                </label>
                <span className="font-mono font-bold text-cyan-400">{formatVnd(amount)}</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-2">
                {[50000, 100000, 500000, 1000000, 5000000, 10000000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v)}
                    className={`py-1.5 rounded-lg border font-bold text-xs transition cursor-pointer ${
                      amount === v
                        ? provider === 'MOMO'
                          ? 'bg-pink-500 text-white border-pink-500 shadow-sm shadow-pink-500/30'
                          : 'bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-500/30'
                        : 'bg-[#131E30] text-slate-300 border-slate-700'
                    }`}
                  >
                    {v >= 1000000 ? `${v / 1000000}M` : `${v / 1000}k`}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="number"
                  max="10000000"
                  step="10000"
                  value={amount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAmount(Math.min(10000000, Math.max(0, val)));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 font-mono font-bold text-white text-base"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">VNĐ</span>
              </div>
            </div>

            {/* Gateway Details */}
            <div className="p-3.5 rounded-2xl bg-[#131E30] border border-slate-800 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'vi' ? 'Mã đơn hàng:' : 'Order ID:'}</span>
                <span className="font-mono font-bold text-[#00E5FF]">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'vi' ? 'Phí giao dịch:' : 'Gateway Fee:'}</span>
                <span className="text-emerald-400 font-bold">
                  {language === 'vi' ? '0đ (Miễn phí qua GigMe Campus)' : '0đ (Free via GigMe Campus)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'vi' ? 'Bảo mật:' : 'Security:'}</span>
                <span className="text-slate-200 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{language === 'vi' ? 'Chuẩn PCI DSS Quốc Tế' : 'PCI DSS Compliant'}</span>
                </span>
              </div>
            </div>

            {/* App-to-App Launch Button */}
            <button
              type="button"
              disabled={isProcessing || !eligibility.allowed}
              onClick={handlePayAppToApp}
              className={`w-full py-3 rounded-2xl font-extrabold text-sm flex items-center justify-center space-x-2 transition shadow-lg cursor-pointer ${
                provider === 'MOMO'
                  ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-pink-500 text-white shadow-pink-500/25 hover:brightness-110'
                  : 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-500 text-white shadow-blue-500/25 hover:brightness-110'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>
                    {language === 'vi'
                      ? `Đang Mở Ứng Dụng ${provider === 'MOMO' ? 'MoMo' : 'ZaloPay'}...`
                      : `Opening ${provider === 'MOMO' ? 'MoMo' : 'ZaloPay'} App...`}
                  </span>
                </>
              ) : eligibility.cooldownMinutesLeft > 0 ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>
                    {language === 'vi'
                      ? `Đang Giãn Cách (Đợi ${eligibility.cooldownMinutesLeft} phút)`
                      : `Cooldown Active (Wait ${eligibility.cooldownMinutesLeft} mins)`}
                  </span>
                </>
              ) : !eligibility.allowed ? (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>{language === 'vi' ? 'Không Thể Nạp (Vượt Hạn Mức)' : 'Cannot Deposit (Limit Exceeded)'}</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>
                    {language === 'vi'
                      ? `Mở Ứng Dụng ${provider === 'MOMO' ? 'MoMo' : 'ZaloPay'} Thanh Toán →`
                      : `Launch ${provider === 'MOMO' ? 'MoMo' : 'ZaloPay'} App to Pay →`}
                  </span>
                </>
              )}
            </button>

            <p className="text-[10px] text-slate-400 text-center">
              {language === 'vi'
                ? `Chạm nút trên để chuyển thẳng sang ứng dụng ${provider === 'MOMO' ? 'MoMo' : 'ZaloPay'} trên điện thoại hoặc xác thực giao dịch nhanh.`
                : `Tap above to open ${provider === 'MOMO' ? 'MoMo' : 'ZaloPay'} natively on your phone for instant checkout.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
