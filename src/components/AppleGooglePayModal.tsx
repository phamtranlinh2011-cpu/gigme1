import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { formatVnd } from '../types';
import { playNotificationSound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface AppleGooglePayModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number;
  purpose?: string;
  onSuccess?: (amount: number) => void;
}

export const AppleGooglePayModal: React.FC<AppleGooglePayModalProps> = ({
  isOpen,
  onClose,
  defaultAmount = 100000,
  purpose = 'Nạp ví Smart Escrow GigMe',
  onSuccess,
}) => {
  const { currentUser, topUpWallet, showNotification } = useGigMe();
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [selectedMethod, setSelectedMethod] = useState<'APPLE_PAY' | 'GOOGLE_PAY' | 'STUDENT_CARD'>('APPLE_PAY');
  const [studentBank, setStudentBank] = useState<'BIDV' | 'VIETINBANK' | 'AGRIBANK' | 'TPBANK'>('BIDV');
  const [studentCardSuffix, setStudentCardSuffix] = useState<string>('8829');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  const handlePay = async () => {
    setIsProcessing(true);
    triggerHaptic('medium');

    // Simulate 1-tap biometric authorization (FaceID / Fingerprint / Web Payment)
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      triggerHaptic('escrow');
      playNotificationSound('BANK_TING');

      // Top up into wallet
      topUpWallet(amount, `1-Chạm qua ${selectedMethod === 'APPLE_PAY' ? 'Apple Pay' : selectedMethod === 'GOOGLE_PAY' ? 'Google Pay' : `Thẻ Sinh Viên ${studentBank}`}`);

      if (onSuccess) {
        onSuccess(amount);
      }

      showNotification(
        'Thanh toán 1-Chạm thành công!',
        `Đã nạp ${amount.toLocaleString('vi-VN')}đ qua ${selectedMethod === 'APPLE_PAY' ? 'Apple Pay' : selectedMethod === 'GOOGLE_PAY' ? 'Google Pay' : `Thẻ sinh viên ${studentBank}`}. Tiền đã sẵn sàng trong ví Smart Escrow!`
      );

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1400);
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-[#0B1528] border border-cyan-500/30 p-6 text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-extrabold text-base text-white">Thanh Toán 1-Chạm</h3>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                  NFC & Token
                </span>
              </div>
              <p className="text-xs text-slate-400">{purpose}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-500/40 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-lg font-black text-white">Giao Dịch Thành Công!</h4>
            <p className="text-xs text-emerald-300 font-mono">
              +{formatVnd(amount)} • Đã ghi nhận vào Ví Smart Escrow
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Amount Selection */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Chọn số tiền nạp vào ví:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setAmount(amt);
                    }}
                    className={`py-2 px-2 rounded-xl font-mono text-xs font-bold transition border ${
                      amount === amt
                        ? 'bg-cyan-500 text-white border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-[#101E36] text-slate-300 border-slate-700 hover:bg-[#16294a]'
                    }`}
                  >
                    {amt >= 1000000 ? `${amt / 1000000} Triệu` : `${amt / 1000}k`}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Phương thức 1-chạm:
              </label>

              {/* Apple Pay Option */}
              <div
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedMethod('APPLE_PAY');
                }}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  selectedMethod === 'APPLE_PAY'
                    ? 'border-white/50 bg-black text-white shadow-md'
                    : 'border-slate-800 bg-[#101E36] hover:bg-[#16294a] text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${selectedMethod === 'APPLE_PAY' ? 'bg-white/20 text-white' : 'bg-slate-800 text-white'}`}>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-black text-xs block text-white">Apple Pay (Face ID / Touch ID)</span>
                    <span className="text-[10px] block text-slate-400">
                      Thanh toán an toàn không chia sẻ số thẻ thực
                    </span>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedMethod === 'APPLE_PAY' ? 'border-white bg-white text-black' : 'border-slate-600'}`}>
                  {selectedMethod === 'APPLE_PAY' && <div className="w-2 h-2 rounded-full bg-slate-900" />}
                </div>
              </div>

              {/* Google Pay Option */}
              <div
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedMethod('GOOGLE_PAY');
                }}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  selectedMethod === 'GOOGLE_PAY'
                    ? 'border-cyan-400 bg-blue-950/60 text-white shadow-md'
                    : 'border-slate-800 bg-[#101E36] hover:bg-[#16294a] text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-blue-600/30 text-cyan-300 border border-blue-500/30">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-black text-xs block text-white">Google Pay (Google Wallet)</span>
                    <span className="text-[10px] text-slate-400 block">
                      1 chạm qua vân tay điện thoại Android
                    </span>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedMethod === 'GOOGLE_PAY' ? 'border-cyan-400 bg-cyan-400 text-black' : 'border-slate-600'}`}>
                  {selectedMethod === 'GOOGLE_PAY' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>

              {/* Thẻ Sinh Viên Liên Kết Ngân Hàng */}
              <div
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedMethod('STUDENT_CARD');
                }}
                className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2.5 ${
                  selectedMethod === 'STUDENT_CARD'
                    ? 'border-emerald-400 bg-emerald-950/40 text-white shadow-md'
                    : 'border-slate-800 bg-[#101E36] hover:bg-[#16294a] text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-emerald-900/40 text-emerald-400 border border-emerald-500/30">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-black text-xs block text-white">Thẻ Sinh Viên Liên Kết Ngân Hàng</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-300 font-bold border border-emerald-500/30">
                          Đặc quyền
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Thẻ sinh viên chip đa năng kiêm thẻ ghi nợ ngân hàng
                      </span>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedMethod === 'STUDENT_CARD' ? 'border-emerald-400 bg-emerald-400 text-black' : 'border-slate-600'}`}>
                    {selectedMethod === 'STUDENT_CARD' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>

                {selectedMethod === 'STUDENT_CARD' && (
                  <div className="pt-2 border-t border-emerald-500/20 grid grid-cols-4 gap-1.5 text-center">
                    {(['BIDV', 'VIETINBANK', 'AGRIBANK', 'TPBANK'] as const).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          setStudentBank(b);
                        }}
                        className={`py-1.5 rounded-lg text-[10px] font-black uppercase transition border ${
                          studentBank === b
                            ? 'bg-emerald-500 text-white border-emerald-400'
                            : 'bg-[#12233c] text-slate-300 border-slate-700 hover:bg-[#193052]'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-white">Bảo mật PCI DSS Cấp 1:</strong> Không lưu thông tin nhạy cảm, mã hóa Tokenization chuẩn quốc tế.
              </span>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={isProcessing}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm text-white shadow-md transition flex items-center justify-center space-x-2 active:scale-95 ${
                selectedMethod === 'APPLE_PAY'
                  ? 'bg-neutral-900 hover:bg-black border border-white/20'
                  : selectedMethod === 'GOOGLE_PAY'
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" />
                  <span>Đang xác thực sinh trắc học 1-Chạm...</span>
                </>
              ) : (
                <>
                  <span>
                    Chạm Để Thanh Toán {formatVnd(amount)} ({selectedMethod === 'APPLE_PAY' ? 'Apple Pay' : selectedMethod === 'GOOGLE_PAY' ? 'Google Pay' : studentBank})
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
