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
  AlertTriangle,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { useTranslation } from '../context/LanguageContext';
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
import { TransactionHistoryTable } from '../components/TransactionHistoryTable';
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
    checkWithdrawalEligibility,
    isOverBalanceLimit,
  } = useGigMe();
  const { language, t } = useTranslation();

  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [isApplePayOpen, setIsApplePayOpen] = useState(false);
  const [isEWalletOpen, setIsEWalletOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [isBankWithdrawOpen, setIsBankWithdrawOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(false);

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
      {/* CẢNH BÁO SỐ DƯ VƯỢT TRẦN 200 TRIỆU (ÉP RÚT TIỀN) */}
      {isOverBalanceLimit && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-950/85 border-2 border-rose-500 text-rose-200 shadow-2xl flex items-start space-x-3.5 animate-pulse">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-white uppercase tracking-wider">
                {language === 'vi'
                  ? '⚠️ TÀI KHOẢN VƯỢT HẠN MỨC 200 TRIỆU (ÉP RÚT TIỀN)'
                  : '⚠️ BALANCE EXCEEDS 200M CEILING (MANDATORY WITHDRAWAL)'}
              </h4>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white uppercase">
                {language === 'vi' ? 'TẠM KHÓA GIAO DỊCH' : 'TRANSACTIONS LOCKED'}
              </span>
            </div>
            <p className="text-xs text-rose-200/90 leading-relaxed">
              {language === 'vi' ? (
                <>
                  Theo quy định nền tảng: Mỗi tài khoản chỉ được phép tích lũy tối đa <strong>200.000.000đ</strong>.
                  Tài khoản của bạn hiện có <strong>{formatVnd(currentUser?.walletBalance || 0)}</strong>. Các tính năng nạp tiền, đăng việc và nhận việc đã bị tạm dừng. Vui lòng bấm <strong>"Rút Tiền Ngay"</strong> để chuyển bớt tiền về ngân hàng!
                </>
              ) : (
                <>
                  Platform policy: Each account may hold a maximum of <strong>200,000,000 VND</strong>.
                  Your current balance is <strong>{formatVnd(currentUser?.walletBalance || 0)}</strong>. Deposits, job posting, and job claiming are temporarily paused. Please tap <strong>"Withdraw Now"</strong> to transfer funds back to your bank!
                </>
              )}
            </p>
            <button
              onClick={() => {
                playNotificationSound('BUTTON_CLICK');
                setIsBankWithdrawOpen(true);
              }}
              className="mt-1 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:brightness-110 text-white font-extrabold text-xs shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              <span>{language === 'vi' ? 'Rút Tiền Về Ngân Hàng Ngay →' : 'Withdraw to Bank Now →'}</span>
            </button>
          </div>
        </div>
      )}

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
              <span className="text-xs font-bold text-[#C5E5EC]">
                {language === 'vi' ? 'Ví Smart Escrow GigMe' : 'GigMe Smart Escrow Wallet'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsStatementOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-[#3064AE]/20 hover:bg-[#3064AE]/40 border border-[#C5E5EC]/30 text-xs text-[#C5E5EC] font-bold flex items-center space-x-1 transition"
                title={language === 'vi' ? 'Xuất sao kê PDF / Excel' : 'Export Statement (PDF/Excel)'}
              >
                <Download className="w-3.5 h-3.5 text-[#E0FAEB]" />
                <span className="hidden sm:inline">{language === 'vi' ? 'Sao Kê' : 'Statement'}</span>
              </button>
              <button
                onClick={() => setShowBalance((p) => !p)}
                className="text-[#C5E5EC] hover:text-white p-1"
                title={language === 'vi' ? 'Ẩn/hiện số dư' : 'Toggle balance visibility'}
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#E0FAEB]" />}
              </button>
            </div>
          </div>

          <div>
            <span className="text-xs text-[#C5E5EC]/80 font-semibold">{t('availableBalance')}:</span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5 tracking-tight">
              {showBalance ? formatVnd(currentUser?.walletBalance || 0) : '•••••••• đ'}
            </div>
            <div className="flex items-center space-x-2 mt-1.5 text-xs">
              <span className="text-[#C5E5EC]/70">{t('escrowHoldingBalance')}:</span>
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
              <span>{t('depositBtn')} (VietQR)</span>
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
              <span>{t('withdrawBtn')} (Napas)</span>
            </button>
          </div>

          {/* Deposit & Withdrawal Limits Safety Rules */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-[#C5E5EC]/80">
              <span className="flex items-center space-x-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{t('depositSafetyNotice')}</span>
              </span>
              <span className="font-mono text-[#E0FAEB]">
                {formatVnd(checkDepositEligibility().todayDeposited)}/30M
              </span>
            </div>

            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-[#C5E5EC]/80">
              <span className="flex items-center space-x-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>{t('withdrawalSafetyNotice')}</span>
              </span>
              <span className="font-mono text-cyan-300 font-bold">
                {checkWithdrawalEligibility().isAdminBypass ? 'Admin Bypass ✓' : 'Max 3M'}
              </span>
            </div>
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
                <span>{t('defaultBankTitle')}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E0FAEB]/15 text-[#E0FAEB] font-bold border border-[#E0FAEB]/30">
                  Napas 247
                </span>
              </h4>
              <p className="text-[10px] text-[#C5E5EC]/70">{t('defaultBankDesc')}</p>
            </div>
          </div>
          <button
            onClick={() => {
              playNotificationSound('BUTTON_CLICK');
              setIsBankWithdrawOpen(true);
            }}
            className="text-[11px] font-bold text-[#C5E5EC] hover:underline cursor-pointer"
          >
            {currentUser?.defaultBank ? t('changeAccount') : t('linkNow')}
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
                <span className="text-[#E0FAEB] text-[10px] font-bold">{t('ekycVerified')}</span>
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
              <span>{t('withdrawToThisBank')}</span>
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-[#0E1B2E] border border-dashed border-[#C5E5EC]/30 flex items-center justify-between">
            <div className="text-xs text-[#C5E5EC]/80">
              {t('noBankLinked')}
            </div>
            <button
              onClick={() => {
                playNotificationSound('BUTTON_CLICK');
                setIsBankWithdrawOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#162B48] hover:bg-[#1E375C] border border-[#C5E5EC]/30 text-[#C5E5EC] font-bold text-xs shrink-0 ml-2 shadow-xs cursor-pointer"
            >
              {t('setup')}
            </button>
          </div>
        )}
      </div>

      {/* Payment Services & Student Support Hub */}
      <div className="space-y-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#C5E5EC]/70 block px-1">
          {t('gatewaysAndServices')}
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
                  {t('momoZaloGateway')}
                </h5>
                <p className="text-[10px] text-[#C5E5EC]/70 truncate">{t('momoZaloDesc')}</p>
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
                  {t('autoVietQr')}
                </h5>
                <p className="text-[10px] text-[#C5E5EC]/70 truncate">{t('autoVietQrDesc')}</p>
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
                  {t('linkedEWallets')}
                </h5>
                <p className="text-[10px] text-[#C5E5EC]/70 truncate">{t('linkedEWalletsDesc')}</p>
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
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                <Zap className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h5 className="font-extrabold text-xs text-white group-hover:text-cyan-300 transition truncate">
                    {t('appleGooglePay')}
                  </h5>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 font-bold border border-cyan-500/30">
                    {language === 'vi' ? 'NFC 1-Chạm' : '1-Tap NFC'}
                  </span>
                </div>
                <p className="text-[10px] text-[#C5E5EC]/70 truncate">
                  {t('appleGooglePayDesc')}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-bold shrink-0">
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
            <span>{language === 'vi' ? 'Liên Kết Ví Điện Tử (MoMo, ZaloPay, Viettel Money)' : 'E-Wallet Integrations (MoMo, ZaloPay, Viettel)'}</span>
          </h4>
          <button
            onClick={() => setIsEWalletOpen(true)}
            className="text-[11px] text-[#C5E5EC] hover:underline font-bold cursor-pointer"
          >
            {t('manage')} &rarr;
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
                  {currentUser?.connectedMoMo || (language === 'vi' ? 'Chưa liên kết' : 'Not linked')}
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
              {currentUser?.connectedMoMo ? t('connected') : t('notConnected')}
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
                  {currentUser?.connectedZaloPay || (language === 'vi' ? 'Chưa liên kết' : 'Not linked')}
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
              {currentUser?.connectedZaloPay ? t('connected') : t('notConnected')}
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
                  {currentUser?.connectedViettelMoney || (language === 'vi' ? 'Chưa liên kết' : 'Not linked')}
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
              {currentUser?.connectedViettelMoney ? t('connected') : t('notConnected')}
            </span>
          </div>
        </div>
      </div>

      {/* Bảng Lịch Sử Giao Dịch Chi Tiết (Truy vấn Sub-collection users/{userId}/transactions từ Firestore) */}
      <TransactionHistoryTable
        userId={currentUser?.id}
        fallbackTransactions={userTransactions}
        onOpenStatementModal={() => setIsStatementOpen(true)}
        language={language}
      />

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
