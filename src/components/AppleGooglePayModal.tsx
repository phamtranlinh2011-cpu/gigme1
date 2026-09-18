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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 text-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-extrabold text-base text-slate-900">Thanh Toán 1-Chạm</h3>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-sky-50 text-[#0284C7] border border-sky-200">
                  NFC & Token
                </span>
              </div>
              <p className="text-xs text-slate-500">{purpose}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-lg font-black text-slate-900">Giao Dịch Thành Công!</h4>
            <p className="text-xs text-slate-500 font-mono">
              +{formatVnd(amount)} • Đã ghi nhận vào Ví Smart Escrow
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Amount Selection */}
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">
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
                        ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {amt >= 1000000 ? `${amt / 1000000} Triệu` : `${amt / 1000}k`}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 block">
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
                    ? 'border-black bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${selectedMethod === 'APPLE_PAY' ? 'bg-white/10 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-black text-xs block">Apple Pay (Face ID / Touch ID)</span>
                    <span className={`text-[10px] block ${selectedMethod === 'APPLE_PAY' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Thanh toán an toàn không chia sẻ số thẻ thực
                    </span>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedMethod === 'APPLE_PAY' ? 'border-white bg-white text-black' : 'border-slate-300'}`}>
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
                    ? 'border-blue-600 bg-blue-50/80 text-blue-950 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-white text-blue-600 border border-slate-200">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-black text-xs block">Google Pay (Google Wallet)</span>
                    <span className="text-[10px] text-slate-500 block">
                      1 chạm qua vân tay điện thoại Android
                    </span>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedMethod === 'GOOGLE_PAY' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>
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
                    ? 'border-emerald-500 bg-emerald-50/60 text-slate-900 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-black text-xs block">Thẻ Sinh Viên Liên Kết Ngân Hàng</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 font-bold">
                          Đặc quyền
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        Thẻ sinh viên chip đa năng kiêm thẻ ghi nợ ngân hàng
                      </span>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedMethod === 'STUDENT_CARD' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>
                    {selectedMethod === 'STUDENT_CARD' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>

                {selectedMethod === 'STUDENT_CARD' && (
                  <div className="pt-2 border-t border-emerald-200/60 grid grid-cols-4 gap-1.5 text-center">
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
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Bảo mật PCI DSS Cấp 1:</strong> Không lưu thông tin nhạy cảm, mã hóa Tokenization chuẩn quốc tế.
              </span>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={isProcessing}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm text-white shadow-md transition flex items-center justify-center space-x-2 active:scale-95 ${
                selectedMethod === 'APPLE_PAY'
                  ? 'bg-black hover:bg-slate-900'
                  : selectedMethod === 'GOOGLE_PAY'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
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
