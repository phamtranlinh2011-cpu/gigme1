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
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { formatVnd } from '../types';

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
  const { depositEWallet, showNotification } = useGigMe();
  const [provider, setProvider] = useState<'MOMO' | 'ZALOPAY'>(defaultProvider);
  const [amount, setAmount] = useState(defaultAmount);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const orderId = `GME_${Date.now()}`;
  const momoDeepLink = `momo://app?action=payWithApp&partnerCode=MOMO_GIGME&orderId=${orderId}&amount=${amount}&orderInfo=${encodeURIComponent(
    'Nap tien GigMe Smart Escrow'
  )}`;
  const zalopayDeepLink = `zalopay://launch/payment?app_id=2554&app_trans_id=${orderId}&amount=${amount}&app_user=student_gigme`;

  const handlePayAppToApp = () => {
    setIsProcessing(true);
    // Simulate App-to-App launch & SDK handshake
    try {
      const link = provider === 'MOMO' ? momoDeepLink : zalopayDeepLink;
      window.location.href = link;
    } catch {
      // Fallback
    }

    setTimeout(() => {
      depositEWallet(provider === 'MOMO' ? 'MOMO' : 'ZALOPAY', amount);
      setIsProcessing(false);
      setIsSuccess(true);
      showNotification(
        `🎉 Thanh toán ${provider === 'MOMO' ? 'Ví MoMo' : 'ZaloPay'} thành công!`,
        `Đã nạp +${formatVnd(amount)} vào ví thông qua ${
          provider === 'MOMO' ? 'MoMo App-to-App' : 'ZaloPay SDK One-Click'
        }.`,
        true,
        true
      );
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-[#0F172A] border-2 border-slate-700 p-6 text-white shadow-2xl space-y-5">
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
                Cổng Thanh Toán {provider === 'MOMO' ? 'MoMo' : 'ZaloPay'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {provider === 'MOMO' ? 'MoMo App-to-App Deep Link' : 'ZaloPay SDK Payment Gateway'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
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
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition ${
              provider === 'MOMO'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🌸 Ví MoMo</span>
            <span className="text-[10px] bg-pink-900/50 px-1 rounded">App-to-App</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setProvider('ZALOPAY');
              setIsSuccess(false);
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition ${
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
              <h4 className="text-base font-black text-white">Thanh Toán Hoàn Tất!</h4>
              <p className="text-xs text-slate-300 mt-1">
                Tiền đã cộng vào Ví Smart Escrow của bạn qua {provider === 'MOMO' ? 'MoMo' : 'ZaloPay'}.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-emerald-400 text-black font-extrabold text-xs hover:brightness-110 transition"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Amount Presets */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Số tiền thanh toán (VND)</label>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[20000, 50000, 100000, 200000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v)}
                    className={`py-1.5 rounded-lg border font-bold text-xs transition ${
                      amount === v
                        ? provider === 'MOMO'
                          ? 'bg-pink-500 text-white border-pink-500'
                          : 'bg-blue-500 text-white border-blue-500'
                        : 'bg-[#131E30] text-slate-300 border-slate-700'
                    }`}
                  >
                    {v / 1000}k
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 font-mono font-bold text-white text-base"
              />
            </div>

            {/* Gateway Details */}
            <div className="p-3.5 rounded-2xl bg-[#131E30] border border-slate-800 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-[#00E5FF]">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phí giao dịch:</span>
                <span className="text-emerald-400 font-bold">0đ (Miễn phí qua GigMe Campus)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bảo mật:</span>
                <span className="text-slate-200 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Chuẩn PCI DSS Quốc Tế</span>
                </span>
              </div>
            </div>

            {/* App-to-App Launch Button */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handlePayAppToApp}
              className={`w-full py-3 rounded-2xl font-extrabold text-sm flex items-center justify-center space-x-2 transition shadow-lg ${
                provider === 'MOMO'
                  ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-pink-500 text-white shadow-pink-500/25 hover:brightness-110'
                  : 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-500 text-white shadow-blue-500/25 hover:brightness-110'
              } disabled:opacity-50`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang Mở Ứng Dụng {provider === 'MOMO' ? 'MoMo' : 'ZaloPay'}...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>
                    Mở Ứng Dụng {provider === 'MOMO' ? 'MoMo' : 'ZaloPay'} Thanh Toán &rarr;
                  </span>
                </>
              )}
            </button>

            <p className="text-[10px] text-slate-400 text-center">
              Chạm nút trên để chuyển thẳng sang ứng dụng {provider === 'MOMO' ? 'MoMo' : 'ZaloPay'} trên điện thoại
              hoặc xác thực giao dịch nhanh.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
