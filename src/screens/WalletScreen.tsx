import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  QrCode,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  CreditCard,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Smartphone,
  Building2,
  Download,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { formatVnd, TransactionEntity } from '../types';
import { playNotificationSound } from '../utils/audio';
import {
  DynamicVietQrDialog,
  StatementDialog,
  EWalletDialog,
  BankWithdrawDialog,
} from '../components/AdvancedDialogs';
import { MoMoZaloPayGatewayModal } from '../components/MoMoZaloPayGatewayModal';
import { AppleGooglePayModal } from '../components/AppleGooglePayModal';
import { triggerHaptic } from '../utils/haptics';

interface WalletScreenProps {
  onOpenVerify: () => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ onOpenVerify }) => {
  const {
    currentUser,
    userTransactions,
    withdrawFunds,
    requestMicroLoan,
  } = useGigMe();

  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [isApplePayOpen, setIsApplePayOpen] = useState(false);
  const [isEWalletOpen, setIsEWalletOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [isBankWithdrawOpen, setIsBankWithdrawOpen] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // Micro loan fields
  const [loanAmount, setLoanAmount] = useState(200000);
  const [loanReason, setLoanReason] = useState('Đóng tiền giáo trình & ăn trưa');

  // Transaction filter
  const [txFilter, setTxFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE' | 'ESCROW' | 'LOAN'>('ALL');

  const txList = userTransactions || [];
  const filteredTx = txList.filter((tx) => {
    if (txFilter === 'ALL') return true;
    if (txFilter === 'INCOME') return tx.type === 'INCOME' || tx.type === 'ESCROW_RELEASE' || tx.type === 'ESCROW_PAYOUT' || tx.type === 'VIETQR_DEPOSIT' || tx.type === 'EWALLET_DEPOSIT';
    if (txFilter === 'EXPENSE') return tx.type === 'EXPENSE' || tx.type === 'ESCROW_LOCK' || tx.type === 'BANK_WITHDRAWAL' || tx.type === 'EWALLET_WITHDRAW';
    if (txFilter === 'ESCROW') return tx.type === 'ESCROW_LOCK' || tx.type === 'ESCROW_RELEASE' || tx.type === 'ESCROW_PAYOUT';
    if (txFilter === 'LOAN') return tx.type === 'LOAN_DISBURSE';
    return true;
  });

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = requestMicroLoan(loanAmount, loanReason);
    if (ok) {
      setShowLoanModal(false);
    }
  };

  const isVerified = Boolean(
    currentUser?.isKycApproved ||
    currentUser?.isNfcVerified ||
    currentUser?.isStudentVerified ||
    currentUser?.isKycVerified
  );

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 text-slate-900 dark:text-white space-y-4 sm:space-y-6">
      {/* Balance Card with modern executive styling */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-sky-500/20 text-[#0284C7]">
                <Wallet className="w-5 h-5 text-sky-400" />
              </div>
              <span className="text-xs font-bold text-slate-200">Ví Smart Escrow GigMe</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsStatementOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-sky-300 font-bold flex items-center space-x-1 transition"
                title="Xuất sao kê PDF / Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sao Kê</span>
              </button>
              <button
                onClick={() => setShowBalance((p) => !p)}
                className="text-slate-300 hover:text-white p-1"
                title="Ẩn/hiện số dư"
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-300 font-semibold">Số dư khả dụng:</span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5 tracking-tight">
              {showBalance ? formatVnd(currentUser?.walletBalance || 0) : '•••••••• đ'}
            </div>
            <div className="flex items-center space-x-2 mt-1.5 text-xs">
              <span className="text-slate-300">Đang giữ trong Smart Escrow:</span>
              <span className="font-bold text-sky-400 font-mono">
                {showBalance ? formatVnd(currentUser?.escrowLockedBalance || 0) : '••••••'}
              </span>
            </div>
          </div>

          {/* Quick Primary Actions: Nap VietQR Pro & Rut Napas 247 */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              id="top-up-qr-btn"
              onClick={() => {
                playNotificationSound('BUTTON_CLICK');
                setIsQrOpen(true);
              }}
              className="py-3 px-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-extrabold text-xs hover:brightness-105 shadow-sm transition flex items-center justify-center space-x-1.5 active:scale-95"
            >
              <QrCode className="w-4 h-4 stroke-[2.5]" />
              <span>Nạp VietQR Pro 24/7</span>
            </button>

            <button
              id="withdraw-btn"
              onClick={() => {
                playNotificationSound('BUTTON_CLICK');
                setIsBankWithdrawOpen(true);
              }}
              className="py-3 px-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs transition flex items-center justify-center space-x-1.5 active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4 text-rose-400 stroke-[2.5]" />
              <span>Rút Napas 247 (&lt;3s)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Default Bank Card (Napas 247) */}
      <div className="rounded-3xl bg-white border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 flex items-center space-x-1.5">
                <span>Tài Khoản Nhận Tiền Mặc Định</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  Napas 247
                </span>
              </h4>
              <p className="text-[10px] text-slate-500">Tự động điền khi rút tiền, giải ngân siêu tốc 24/7</p>
            </div>
          </div>
          <button
            onClick={() => {
              playNotificationSound('BUTTON_CLICK');
              setIsBankWithdrawOpen(true);
            }}
            className="text-[11px] font-bold text-[#0284C7] hover:underline"
          >
            {currentUser?.defaultBank ? 'Đổi tài khoản' : '+ Liên kết ngay'}
          </button>
        </div>

        {currentUser?.defaultBank ? (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-xs">{currentUser.defaultBank.bankName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold">
                  •••• {currentUser.defaultBank.accountNumber.slice(-4)}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono flex items-center space-x-2">
                <span className="text-slate-800 font-semibold uppercase">{currentUser.defaultBank.accountHolder}</span>
                <span className="text-emerald-600 text-[10px] font-bold">✓ Đã khớp E-KYC</span>
              </div>
            </div>
            <button
              onClick={() => {
                playNotificationSound('BUTTON_CLICK');
                setIsBankWithdrawOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 hover:brightness-105 text-white font-extrabold text-xs shadow-xs transition flex items-center space-x-1 active:scale-95"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Rút Về TK Này</span>
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Chưa lưu tài khoản ngân hàng. Nhấn để cài đặt số tài khoản Napas 247 nhận tiền tức thì.
            </div>
            <button
              onClick={() => {
                playNotificationSound('BUTTON_CLICK');
                setIsBankWithdrawOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[#0284C7] font-bold text-xs shrink-0 ml-2 shadow-xs"
            >
              Thiết lập
            </button>
          </div>
        )}
      </div>

      {/* Payment Services & Student Support Hub */}
      <div className="space-y-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block px-1">
          Cổng thanh toán & Dịch vụ sinh viên
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Card 1: MoMo / ZaloPay Gateway */}
          <button
            onClick={() => setIsGatewayOpen(true)}
            className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition flex items-center justify-between group shadow-xs active:scale-[0.99]"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-pink-50 text-pink-600 shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h5 className="font-extrabold text-xs text-slate-900 group-hover:text-pink-600 transition truncate">
                  Cổng MoMo & ZaloPay
                </h5>
                <p className="text-[10px] text-slate-500 truncate">App-to-App 1 chạm tức thì</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200 font-bold shrink-0">
              SDK
            </span>
          </button>

          {/* Card 2: Open API Auto Scanner */}
          <button
            onClick={() => setIsQrOpen(true)}
            className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition flex items-center justify-between group shadow-xs active:scale-[0.99]"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-sky-50 text-[#0284C7] shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h5 className="font-extrabold text-xs text-slate-900 group-hover:text-[#0284C7] transition truncate">
                  Tự Động Khớp VietQR
                </h5>
                <p className="text-[10px] text-slate-500 truncate">Open API Casso/SePAY 3 giây</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-50 text-[#0284C7] border border-sky-200 font-bold shrink-0">
              AUTO
            </span>
          </button>

          {/* Card 3: E-Wallet */}
          <button
            id="ewallet-btn"
            onClick={() => setIsEWalletOpen(true)}
            className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition flex items-center justify-between group shadow-xs active:scale-[0.99]"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h5 className="font-extrabold text-xs text-slate-900 group-hover:text-[#0284C7] transition truncate">
                  Ví Điện Tử Đã Liên Kết
                </h5>
                <p className="text-[10px] text-slate-500 truncate">Quản lý ví ShopeePay / Viettel</p>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 shrink-0">&rarr;</span>
          </button>

          {/* Card 4: SOS Micro-loan */}
          <button
            id="student-loan-btn"
            onClick={() => {
              if (!isVerified) {
                onOpenVerify();
              } else {
                setShowLoanModal(true);
              }
            }}
            className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-purple-200 text-left transition flex items-center justify-between group shadow-xs active:scale-[0.99]"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div className="min-w-0">
                <h5 className="font-extrabold text-xs text-slate-900 group-hover:text-purple-600 transition truncate">
                  Vay Khẩn Cấp SOS 0%
                </h5>
                <p className="text-[10px] text-slate-500 truncate">Hạn mức sinh viên 200k - 500k</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold shrink-0">
              0% LÃI
            </span>
          </button>

          {/* Card 5: Apple Pay / Google Pay / Thẻ Sinh Viên Liên Kết */}
          <button
            id="apple-pay-btn"
            onClick={() => {
              triggerHaptic('light');
              setIsApplePayOpen(true);
            }}
            className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition flex items-center justify-between group shadow-xs active:scale-[0.99] sm:col-span-2"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-slate-900 text-white shrink-0">
                <Zap className="w-4 h-4 text-sky-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h5 className="font-extrabold text-xs text-slate-900 group-hover:text-[#0284C7] transition truncate">
                    Apple Pay & Google Pay (1-Chạm)
                  </h5>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-50 text-[#0284C7] font-bold border border-sky-200">
                    Thẻ sinh viên chip
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate">
                  Xác thực vân tay / Face ID hoặc thẻ sinh viên đa năng BIDV, VietinBank, Agribank
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-white font-bold shrink-0">
              1-TAP
            </span>
          </button>
        </div>
      </div>

      {/* Connected Wallets Status (MoMo, ZaloPay, Viettel Money) */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-900 flex items-center space-x-1.5">
            <Smartphone className="w-4 h-4 text-pink-500" />
            <span>Liên Kết Ví Điện Tử (MoMo, ZaloPay, Viettel Money)</span>
          </h4>
          <button
            onClick={() => setIsEWalletOpen(true)}
            className="text-[11px] text-[#0284C7] hover:underline font-bold"
          >
            Quản lý &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-pink-100 text-pink-600 font-black text-[10px] flex items-center justify-center">
                M
              </span>
              <div>
                <span className="font-bold text-slate-900 block text-[11px]">MoMo</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {currentUser?.connectedMoMo || 'Chưa liên kết'}
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                currentUser?.connectedMoMo
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {currentUser?.connectedMoMo ? 'Đã nối' : 'Chưa nối'}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 font-black text-[10px] flex items-center justify-center">
                Z
              </span>
              <div>
                <span className="font-bold text-slate-900 block text-[11px]">ZaloPay</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {currentUser?.connectedZaloPay || 'Chưa liên kết'}
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                currentUser?.connectedZaloPay
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {currentUser?.connectedZaloPay ? 'Đã nối' : 'Chưa nối'}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-red-100 text-red-600 font-black text-[10px] flex items-center justify-center">
                V
              </span>
              <div>
                <span className="font-bold text-slate-900 block text-[11px]">Viettel Money</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {currentUser?.connectedViettelMoney || 'Chưa liên kết'}
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                currentUser?.connectedViettelMoney
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {currentUser?.connectedViettelMoney ? 'Đã nối' : 'Chưa nối'}
            </span>
          </div>
        </div>
      </div>

      {/* Student SOS Micro-Loan Feature Highlight */}
      <div className="p-4 rounded-3xl bg-purple-50/70 border border-purple-200 flex items-start justify-between gap-3 text-xs shadow-xs">
        <div>
          <div className="flex items-center space-x-1.5 text-purple-900 font-extrabold">
            <Zap className="w-4 h-4 text-amber-500 fill-current" />
            <span>Gói Cứu Trợ Sinh Viên SOS (0% Lãi Suất)</span>
          </div>
          <p className="text-slate-600 mt-1 leading-relaxed">
            Hạn mức tối đa <strong>500.000đ</strong> dành riêng cho sinh viên đã xác thực cấp 2. Tự động trả dần khi
            nhận thù lao các kèo tiếp theo.
          </p>
          <div className="flex items-center space-x-3 mt-2 text-[11px] text-purple-700">
            <span>
              Hạn mức còn lại: <strong>{formatVnd(currentUser?.microLoanCreditLimit || 500000)}</strong>
            </span>
            <span>•</span>
            <span>Giải ngân ngay trong 5 giây</span>
          </div>
        </div>

        <button
          onClick={() => {
            if (!isVerified) {
              onOpenVerify();
            } else {
              setShowLoanModal(true);
            }
          }}
          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shrink-0 transition shadow-xs active:scale-95"
        >
          {isVerified ? 'Vay Nhanh' : 'Xác Thực Để Vay'}
        </button>
      </div>

      {/* Transactions History Header & Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-[#0284C7]" />
            <span>Lịch Sử Giao Dịch ({filteredTx.length})</span>
          </h3>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsStatementOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[10px] text-slate-700 font-bold flex items-center space-x-1 transition shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất PDF/Excel</span>
            </button>

            {/* Filter tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-[10px] font-bold">
              {(['ALL', 'INCOME', 'EXPENSE', 'ESCROW', 'LOAN'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTxFilter(filter)}
                  className={`px-2 py-1 rounded-lg transition ${
                    txFilter === filter ? 'bg-white text-slate-900 shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {filter === 'ALL'
                    ? 'Tất cả'
                    : filter === 'INCOME'
                    ? 'Thu'
                    : filter === 'EXPENSE'
                    ? 'Chi'
                    : filter === 'ESCROW'
                    ? 'Escrow'
                    : 'Vay SOS'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        {filteredTx.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-white border border-slate-200 text-slate-400 text-xs shadow-xs">
            Chưa có giao dịch nào trong danh mục này.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTx.map((tx) => {
              const isPlus = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 flex items-center justify-between transition text-xs shadow-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-xl ${
                        isPlus ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                      }`}
                    >
                      {isPlus ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">{tx.title || tx.description || 'Giao dịch ví'}</h4>
                      <p className="text-[10px] text-slate-500">
                        {tx.subtitle ? `${tx.subtitle} • ` : ''}
                        {new Date(tx.timestamp).toLocaleString('vi-VN')} • Mã: {tx.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono font-black text-sm block ${
                        isPlus ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {isPlus ? `+${formatVnd(tx.amount)}` : formatVnd(tx.amount)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">{tx.type}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* VietQR Dialog */}
      <DynamicVietQrDialog isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />

      {/* E-Wallet (MoMo / ZaloPay / Viettel Money) Dialog */}
      <EWalletDialog isOpen={isEWalletOpen} onClose={() => setIsEWalletOpen(false)} />

      {/* Financial Statement Export Dialog (PDF / Excel) */}
      <StatementDialog isOpen={isStatementOpen} onClose={() => setIsStatementOpen(false)} />

      {/* Napas247 Bank Withdraw Dialog */}
      <BankWithdrawDialog isOpen={isBankWithdrawOpen} onClose={() => setIsBankWithdrawOpen(false)} />

      {/* STUDENT LOAN MODAL */}
      {showLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 text-slate-900 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-sm flex items-center space-x-1.5 text-purple-700">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Vay Cứu Trợ Sinh Viên 0% Lãi Suất</span>
              </h3>
              <button onClick={() => setShowLoanModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLoanSubmit} className="py-4 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-800">
                Chương trình hỗ trợ sinh viên khó khăn đột xuất. Khoản vay sẽ được chuyển trực tiếp vào ví ngay lập tức
                với 0đ phụ phí!
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Chọn số tiền cần vay</label>
                <div className="grid grid-cols-3 gap-2">
                  {[100000, 200000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setLoanAmount(amt)}
                      className={`py-2 rounded-xl border font-bold transition ${
                        loanAmount === amt
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {formatVnd(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Mục đích sử dụng</label>
                <input
                  type="text"
                  required
                  value={loanReason}
                  onChange={(e) => setLoanReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:border-purple-600 focus:outline-none"
                  placeholder="Đóng tiền trọ, mua thuốc, ăn uống..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-sm hover:brightness-105 shadow-sm transition active:scale-95"
              >
                Nhận Tiền Giải Ngân Ngay Lập Tức
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MoMo App-to-App & ZaloPay SDK Gateway Modal */}
      <MoMoZaloPayGatewayModal
        isOpen={isGatewayOpen}
        onClose={() => setIsGatewayOpen(false)}
      />

      {/* Apple Pay & Google Pay & Thẻ Sinh Viên Modal */}
      <AppleGooglePayModal
        isOpen={isApplePayOpen}
        onClose={() => setIsApplePayOpen(false)}
      />
    </div>
  );
};
