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
    checkDepositEligibility,
  } = useGigMe();

  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [isApplePayOpen, setIsApplePayOpen] = useState(false);
  const [isEWalletOpen, setIsEWalletOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [isBankWithdrawOpen, setIsBankWithdrawOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // Transaction filter
  const [txFilter, setTxFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE' | 'ESCROW'>('ALL');

  const txList = userTransactions || [];
  const filteredTx = txList.filter((tx) => {
    if (txFilter === 'ALL') return true;
    if (txFilter === 'INCOME') return tx.type === 'INCOME' || tx.type === 'ESCROW_RELEASE' || tx.type === 'ESCROW_PAYOUT' || tx.type === 'VIETQR_DEPOSIT' || tx.type === 'EWALLET_DEPOSIT';
    if (txFilter === 'EXPENSE') return tx.type === 'EXPENSE' || tx.type === 'ESCROW_LOCK' || tx.type === 'BANK_WITHDRAWAL' || tx.type === 'EWALLET_WITHDRAW';
    if (txFilter === 'ESCROW') return tx.type === 'ESCROW_LOCK' || tx.type === 'ESCROW_RELEASE' || tx.type === 'ESCROW_PAYOUT';
    return true;
  });

  const isVerified = Boolean(
    currentUser?.isKycApproved ||
    currentUser?.isNfcVerified ||
    currentUser?.isStudentVerified ||
    currentUser?.isKycVerified
  );

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 text-slate-900 dark:text-white space-y-4 sm:space-y-6">
      {/* Balance Card with Cobalt Blue (60%), Crystal Blue (30%), Ethereal Green (10%) Brand Styling */}
      <div className="rounded-3xl bg-gradient-to-r from-[#18345E] via-[#10223D] to-[#0A1526] border border-[#C5E5EC]/25 text-white p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Left Decorative Proportional Brand Gradient Bar */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-brand-tri-gradient" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#3064AE]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 pl-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-[#3064AE]/30 text-[#C5E5EC] border border-[#C5E5EC]/20">
                <Wallet className="w-5 h-5 text-[#C5E5EC]" />
              </div>
              <span className="text-xs font-bold text-[#C5E5EC]">Ví Smart Escrow GigMe</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsStatementOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-[#3064AE]/20 hover:bg-[#3064AE]/40 border border-[#C5E5EC]/30 text-xs text-[#C5E5EC] font-bold flex items-center space-x-1 transition"
                title="Xuất sao kê PDF / Excel"
              >
                <Download className="w-3.5 h-3.5 text-[#E0FAEB]" />
                <span className="hidden sm:inline">Sao Kê</span>
              </button>
              <button
                onClick={() => setShowBalance((p) => !p)}
                className="text-[#C5E5EC] hover:text-white p-1"
                title="Ẩn/hiện số dư"
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#E0FAEB]" />}
              </button>
            </div>
          </div>

          <div>
            <span className="text-xs text-[#C5E5EC]/80 font-semibold">Số dư khả dụng:</span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5 tracking-tight">
              {showBalance ? formatVnd(currentUser?.walletBalance || 0) : '•••••••• đ'}
            </div>
            <div className="flex items-center space-x-2 mt-1.5 text-xs">
              <span className="text-[#C5E5EC]/70">Đang giữ trong Smart Escrow:</span>
              <span className="font-bold text-[#E0FAEB] font-mono">
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
              className="py-3 px-3 rounded-2xl bg-gradient-to-r from-[#3064AE] via-[#417AC6] to-[#C5E5EC] text-white font-extrabold text-xs hover:brightness-110 shadow-lg shadow-[#3064AE]/30 transition flex items-center justify-center space-x-1.5 active:scale-95 border border-[#E0FAEB]/30 cursor-pointer"
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
              className="py-3 px-3 rounded-2xl bg-[#0E1B2E] hover:bg-[#152742] border border-[#C5E5EC]/30 text-[#C5E5EC] font-extrabold text-xs transition flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 text-[#E0FAEB] stroke-[2.5]" />
              <span>Rút Napas 247 (&lt;3s)</span>
            </button>
          </div>

          {/* Deposit Limit Safety Note */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-[#C5E5EC]/80">
            <span className="flex items-center space-x-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Hạn mức nạp: Tối đa 10M/lần • Giãn cách 1h • Max 30M/ngày</span>
            </span>
            <span className="font-mono text-[#E0FAEB]">
              Hôm nay: {formatVnd(checkDepositEligibility().todayDeposited)}/30M
            </span>
          </div>
        </div>
      </div>

      {/* Default Bank Card (Napas 247) */}
      <div className="rounded-3xl bg-[#12233B] border border-[#C5E5EC]/20 p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-[#3064AE]/25 text-[#C5E5EC]">
              <Building2 className="w-4 h-4 text-[#C5E5EC]" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-white flex items-center space-x-1.5">
                <span>Tài Khoản Nhận Tiền Mặc Định</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E0FAEB]/15 text-[#E0FAEB] font-bold border border-[#E0FAEB]/30">
                  Napas 247
                </span>
              </h4>
              <p className="text-[10px] text-[#C5E5EC]/70">Tự động điền khi rút tiền, giải ngân siêu tốc 24/7</p>
            </div>
          </div>
          <button
            onClick={() => {
              playNotificationSound('BUTTON_CLICK');
              setIsBankWithdrawOpen(true);
            }}
            className="text-[11px] font-bold text-[#C5E5EC] hover:underline"
          >
            {currentUser?.defaultBank ? 'Đổi tài khoản' : '+ Liên kết ngay'}
          </button>
        </div>

        {currentUser?.defaultBank ? (
          <div className="p-3.5 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-xs">{currentUser.defaultBank.bankName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#18345E] text-[#C5E5EC] font-mono font-bold">
                  •••• {currentUser.defaultBank.accountNumber.slice(-4)}
                </span>
              </div>
              <div className="text-[11px] text-[#C5E5EC]/80 font-mono flex items-center space-x-2">
                <span className="text-white font-semibold uppercase">{currentUser.defaultBank.accountHolder}</span>
                <span className="text-[#E0FAEB] text-[10px] font-bold">✓ Đã khớp E-KYC</span>
              </div>
            </div>
            <button
              onClick={() => {
                playNotificationSound('BUTTON_CLICK');
                setIsBankWithdrawOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#3064AE] to-[#255294] hover:brightness-110 text-white font-extrabold text-xs shadow-xs transition flex items-center space-x-1 active:scale-95 border border-[#C5E5EC]/30 cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Rút Về TK Này</span>
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-[#0E1B2E] border border-dashed border-[#C5E5EC]/30 flex items-center justify-between">
            <div className="text-xs text-[#C5E5EC]/80">
              Chưa lưu tài khoản ngân hàng. Nhấn để cài đặt số tài khoản Napas 247 nhận tiền tức thì.
            </div>
            <button
              onClick={() => {
                playNotificationSound('BUTTON_CLICK');
                setIsBankWithdrawOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#162B48] hover:bg-[#1E375C] border border-[#C5E5EC]/30 text-[#C5E5EC] font-bold text-xs shrink-0 ml-2 shadow-xs cursor-pointer"
            >
              Thiết lập
            </button>
          </div>
        )}
      </div>

      {/* Payment Services & Student Support Hub */}
      <div className="space-y-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#C5E5EC]/70 block px-1">
          Cổng thanh toán & Dịch vụ sinh viên
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Card 1: MoMo / ZaloPay Gateway */}
          <button
            onClick={() => setIsGatewayOpen(true)}
            className="p-3.5 rounded-2xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/20 text-left transition flex items-center justify-between group shadow-sm active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-pink-500/15 text-pink-400 shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h5 className="font-extrabold text-xs text-white group-hover:text-pink-400 transition truncate">
                  Cổng MoMo & ZaloPay
                </h5>
                <p className="text-[10px] text-[#C5E5EC]/70 truncate">App-to-App 1 chạm tức thì</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30 font-bold shrink-0">
              SDK
            </span>
          </button>

          {/* Card 2: Open API Auto Scanner */}
          <button
            onClick={() => setIsQrOpen(true)}
            className="p-3.5 rounded-2xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/20 text-left transition flex items-center justify-between group shadow-sm active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-[#3064AE]/25 text-[#C5E5EC] shrink-0">
                <QrCode className="w-4 h-4 text-[#C5E5EC]" />
              </div>
              <div className="min-w-0">
                <h5 className="font-extrabold text-xs text-white group-hover:text-[#C5E5EC] transition truncate">
                  Tự Động Khớp VietQR
                </h5>
                <p className="text-[10px] text-[#C5E5EC]/70 truncate">Open API Casso/SePAY 3 giây</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#3064AE]/20 text-[#C5E5EC] border border-[#C5E5EC]/30 font-bold shrink-0">
              AUTO
            </span>
          </button>

          {/* Card 3: E-Wallet */}
          <button
            id="ewallet-btn"
            onClick={() => setIsEWalletOpen(true)}
            className="p-3.5 rounded-2xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/20 text-left transition flex items-center justify-between group shadow-sm active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-[#0E1B2E] text-[#C5E5EC] shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h5 className="font-extrabold text-xs text-white group-hover:text-[#C5E5EC] transition truncate">
                  Ví Điện Tử Đã Liên Kết
                </h5>
                <p className="text-[10px] text-[#C5E5EC]/70 truncate">Quản lý ví ShopeePay / Viettel</p>
              </div>
            </div>
            <span className="text-[10px] text-[#C5E5EC] shrink-0">&rarr;</span>
          </button>

          {/* Card 4: Apple Pay / Google Pay / Thẻ Sinh Viên Liên Kết */}
          <button
            id="apple-pay-btn"
            onClick={() => {
              triggerHaptic('light');
              setIsApplePayOpen(true);
            }}
            className="p-3.5 rounded-2xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/20 text-left transition flex items-center justify-between group shadow-sm active:scale-[0.99] sm:col-span-2 cursor-pointer"
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
      <div className="p-4 rounded-3xl bg-[#12233B] border border-[#C5E5EC]/20 space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-white flex items-center space-x-1.5">
            <Smartphone className="w-4 h-4 text-[#C5E5EC]" />
            <span>Liên Kết Ví Điện Tử (MoMo, ZaloPay, Viettel Money)</span>
          </h4>
          <button
            onClick={() => setIsEWalletOpen(true)}
            className="text-[11px] text-[#C5E5EC] hover:underline font-bold cursor-pointer"
          >
            Quản lý &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/15 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-300 font-black text-[10px] flex items-center justify-center border border-pink-500/30">
                M
              </span>
              <div>
                <span className="font-bold text-white block text-[11px]">MoMo</span>
                <span className="text-[10px] text-[#C5E5EC]/70 font-mono">
                  {currentUser?.connectedMoMo || 'Chưa liên kết'}
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                currentUser?.connectedMoMo
                  ? 'bg-[#E0FAEB]/15 text-[#E0FAEB] border-[#E0FAEB]/30'
                  : 'bg-[#182C48] text-slate-400 border-slate-700'
              }`}
            >
              {currentUser?.connectedMoMo ? 'Đã nối' : 'Chưa nối'}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/15 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-[#3064AE]/30 text-[#C5E5EC] font-black text-[10px] flex items-center justify-center border border-[#C5E5EC]/30">
                Z
              </span>
              <div>
                <span className="font-bold text-white block text-[11px]">ZaloPay</span>
                <span className="text-[10px] text-[#C5E5EC]/70 font-mono">
                  {currentUser?.connectedZaloPay || 'Chưa liên kết'}
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                currentUser?.connectedZaloPay
                  ? 'bg-[#E0FAEB]/15 text-[#E0FAEB] border-[#E0FAEB]/30'
                  : 'bg-[#182C48] text-slate-400 border-slate-700'
              }`}
            >
              {currentUser?.connectedZaloPay ? 'Đã nối' : 'Chưa nối'}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/15 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-red-500/20 text-red-300 font-black text-[10px] flex items-center justify-center border border-red-500/30">
                V
              </span>
              <div>
                <span className="font-bold text-white block text-[11px]">Viettel Money</span>
                <span className="text-[10px] text-[#C5E5EC]/70 font-mono">
                  {currentUser?.connectedViettelMoney || 'Chưa liên kết'}
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                currentUser?.connectedViettelMoney
                  ? 'bg-[#E0FAEB]/15 text-[#E0FAEB] border-[#E0FAEB]/30'
                  : 'bg-[#182C48] text-slate-400 border-slate-700'
              }`}
            >
              {currentUser?.connectedViettelMoney ? 'Đã nối' : 'Chưa nối'}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions History Header & Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-extrabold text-sm text-white flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-[#C5E5EC]" />
            <span>Lịch Sử Giao Dịch ({filteredTx.length})</span>
          </h3>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsStatementOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/20 text-[10px] text-[#C5E5EC] font-bold flex items-center space-x-1 transition shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#E0FAEB]" />
              <span>Xuất PDF/Excel</span>
            </button>

            {/* Filter tabs */}
            <div className="flex bg-[#0E1B2E] p-1 rounded-xl border border-[#C5E5EC]/20 text-[10px] font-bold">
              {(['ALL', 'INCOME', 'EXPENSE', 'ESCROW'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTxFilter(filter)}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    txFilter === filter ? 'bg-[#3064AE] text-white shadow-xs font-extrabold' : 'text-[#C5E5EC]/70 hover:text-white'
                  }`}
                >
                  {filter === 'ALL'
                    ? 'Tất cả'
                    : filter === 'INCOME'
                    ? 'Thu'
                    : filter === 'EXPENSE'
                    ? 'Chi'
                    : 'Escrow'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        {filteredTx.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/15 text-[#C5E5EC]/60 text-xs shadow-xs">
            Chưa có giao dịch nào trong danh mục này.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTx.map((tx) => {
              const isPlus = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/15 hover:border-[#C5E5EC]/35 flex items-center justify-between transition text-xs shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-xl ${
                        isPlus ? 'bg-[#E0FAEB]/15 text-[#E0FAEB]' : 'bg-orange-500/15 text-orange-400'
                      }`}
                    >
                      {isPlus ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>

                    <div>
                      <h4 className="font-extrabold text-white text-xs">{tx.title || tx.description || 'Giao dịch ví'}</h4>
                      <p className="text-[10px] text-[#C5E5EC]/70">
                        {tx.subtitle ? `${tx.subtitle} • ` : ''}
                        {new Date(tx.timestamp).toLocaleString('vi-VN')} • Mã: {tx.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono font-black text-sm block ${
                        isPlus ? 'text-[#E0FAEB]' : 'text-slate-200'
                      }`}
                    >
                      {isPlus ? `+${formatVnd(tx.amount)}` : formatVnd(tx.amount)}
                    </span>
                    <span className="text-[10px] text-[#C5E5EC]/70 font-semibold">{tx.type}</span>
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
