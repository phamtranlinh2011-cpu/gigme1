import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  RefreshCw,
  Copy,
  Check,
  FileText,
  ShieldCheck,
  FileSpreadsheet,
  ExternalLink,
  Receipt,
  X,
  Database,
  Filter
} from 'lucide-react';
import { WalletTransactionEntity, formatVnd } from '../types';
import { subscribeToTransactions, fetchUserTransactionsFromFirestore } from '../lib/firebase';
import { triggerHaptic } from '../utils/haptics';

interface TransactionHistoryTableProps {
  userId?: string;
  fallbackTransactions?: WalletTransactionEntity[];
  onOpenStatementModal?: () => void;
  language?: 'vi' | 'en';
}

export const TransactionHistoryTable: React.FC<TransactionHistoryTableProps> = ({
  userId,
  fallbackTransactions = [],
  onOpenStatementModal,
  language = 'vi',
}) => {
  const [firestoreTxs, setFirestoreTxs] = useState<WalletTransactionEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DEPOSIT' | 'WITHDRAW' | 'ESCROW' | 'REFUND'>('ALL');
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<WalletTransactionEntity | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Subscribe directly to Firestore sub-collection users/{userId}/transactions
  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);

    // Initial fetch from Firestore
    fetchUserTransactionsFromFirestore(userId)
      .then((list) => {
        if (list && list.length > 0) {
          setFirestoreTxs(list);
        }
      })
      .catch((err) => console.warn('Fetch subcollection transactions err:', err))
      .finally(() => setIsLoading(false));

    // Real-time listener
    const unsub = subscribeToTransactions(
      userId,
      (updatedList) => {
        if (updatedList) {
          setFirestoreTxs(updatedList);
        }
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
      }
    );

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [userId]);

  const handleManualRefresh = async () => {
    if (!userId) return;
    triggerHaptic('light');
    setIsLoading(true);
    try {
      const list = await fetchUserTransactionsFromFirestore(userId);
      if (list && list.length > 0) {
        setFirestoreTxs(list);
      }
    } catch {
      // Safe fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = (id: string) => {
    triggerHaptic('selection');
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Merge Firestore subcollection transactions with context fallback transactions
  const allMergedTxs = useMemo(() => {
    const map = new Map<string, WalletTransactionEntity>();
    (firestoreTxs || []).forEach((t) => map.set(t.id, t));
    (fallbackTransactions || []).forEach((t) => {
      if (!map.has(t.id)) map.set(t.id, t);
    });
    const list = Array.from(map.values());
    list.sort((a, b) => b.timestamp - a.timestamp);
    return list;
  }, [firestoreTxs, fallbackTransactions]);

  // Filtered list
  const filteredTxs = useMemo(() => {
    return allMergedTxs.filter((tx) => {
      // Filter by type
      if (filterType === 'DEPOSIT') {
        const isDep =
          tx.type === 'INCOME' ||
          tx.type === 'VIETQR_DEPOSIT' ||
          tx.type === 'EWALLET_DEPOSIT' ||
          tx.amount > 0;
        if (!isDep) return false;
      } else if (filterType === 'WITHDRAW') {
        const isWith =
          tx.type === 'EXPENSE' ||
          tx.type === 'BANK_WITHDRAWAL' ||
          tx.type === 'EWALLET_WITHDRAW';
        if (!isWith) return false;
      } else if (filterType === 'ESCROW') {
        const isEscrow =
          tx.type === 'ESCROW_LOCK' ||
          tx.type === 'ESCROW_RELEASE' ||
          tx.type === 'ESCROW_PAYOUT';
        if (!isEscrow) return false;
      } else if (filterType === 'REFUND') {
        const isRefund =
          tx.type === 'REFUND' ||
          (tx.title && tx.title.toLowerCase().includes('hoàn')) ||
          (tx.description && tx.description.toLowerCase().includes('hoàn'));
        if (!isRefund) return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (tx.title || '').toLowerCase().includes(q);
        const matchDesc = (tx.description || '').toLowerCase().includes(q);
        const matchSub = (tx.subtitle || '').toLowerCase().includes(q);
        const matchId = (tx.id || '').toLowerCase().includes(q);
        const matchBank = (tx.bankName || '').toLowerCase().includes(q);
        return matchTitle || matchDesc || matchSub || matchId || matchBank;
      }

      return true;
    });
  }, [allMergedTxs, filterType, searchQuery]);

  const getTransactionBadge = (tx: WalletTransactionEntity) => {
    const isPlus = tx.amount > 0;
    if (tx.type === 'VIETQR_DEPOSIT' || tx.type === 'INCOME') {
      return {
        label: language === 'vi' ? 'Nạp VietQR' : 'VietQR Deposit',
        style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        isPlus: true,
      };
    }
    if (tx.type === 'BANK_WITHDRAWAL' || tx.type === 'EXPENSE') {
      return {
        label: language === 'vi' ? 'Rút Tiền Ngân Hàng' : 'Bank Withdrawal',
        style: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        isPlus: false,
      };
    }
    if (tx.type === 'ESCROW_PAYOUT' || tx.type === 'ESCROW_RELEASE') {
      return {
        label: language === 'vi' ? 'Thù Lao Escrow' : 'Escrow Payout',
        style: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        isPlus: true,
      };
    }
    if (tx.type === 'ESCROW_LOCK') {
      return {
        label: language === 'vi' ? 'Ký Quỹ Smart Escrow' : 'Escrow Lock',
        style: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        isPlus: false,
      };
    }
    return {
      label: tx.type || (language === 'vi' ? 'Giao Dịch Ví' : 'Wallet'),
      style: isPlus
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        : 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      isPlus,
    };
  };

  const getStatusBadge = (tx: WalletTransactionEntity) => {
    if (tx.status === 'REJECTED') {
      return {
        label: language === 'vi' ? 'Bị Từ Chối' : 'Rejected',
        style: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      };
    }
    if (tx.status === 'PENDING' || (!tx.status && !tx.isSuccess)) {
      return {
        label: language === 'vi' ? 'Đang Xử Lý' : 'Processing',
        style: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      };
    }
    return {
      label: language === 'vi' ? 'Hoàn Tất' : 'Completed',
      style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    };
  };

  return (
    <div className="space-y-3.5 animate-fade-in">
      {/* Real-time Subcollection Sync Indicator */}
      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 text-[11px] shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[#C5E5EC] font-semibold flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-[#E0FAEB]" />
            <span>
              {language === 'vi'
                ? `Firestore Sub-collection: users/${userId || '...'}/transactions`
                : `Firestore Sub-collection: users/${userId || '...'}/transactions`}
            </span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC] border border-[#C5E5EC]/20 transition cursor-pointer active:scale-95 disabled:opacity-40"
            title={language === 'vi' ? 'Làm mới từ Firestore' : 'Refresh from Firestore'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#E0FAEB]' : ''}`} />
          </button>
          {onOpenStatementModal && (
            <button
              type="button"
              onClick={onOpenStatementModal}
              className="px-2.5 py-1 rounded-lg bg-[#3064AE]/30 hover:bg-[#3064AE]/50 text-[#C5E5EC] border border-[#C5E5EC]/25 font-bold flex items-center space-x-1 transition text-[10px] cursor-pointer"
            >
              <FileSpreadsheet className="w-3 h-3 text-[#E0FAEB]" />
              <span>{language === 'vi' ? 'Xuất Báo Cáo' : 'Export Report'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Header, Search & Filter Bar */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-extrabold text-sm text-white flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-[#C5E5EC]" />
            <span>
              {language === 'vi' ? 'Lịch Sử Giao Dịch & Biến Động Số Dư' : 'Transaction History & Balance Ledger'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#3064AE]/40 text-[#C5E5EC] font-mono text-[11px] font-bold border border-[#C5E5EC]/25">
              {filteredTxs.length}
            </span>
          </h3>
        </div>

        {/* Search input & Filter Chips */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#C5E5EC]/60 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'vi'
                  ? 'Tìm mã giao dịch, ngân hàng, nội dung...'
                  : 'Search transaction ID, bank, note...'
              }
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0E1B2E] border border-[#C5E5EC]/25 text-white text-xs placeholder:text-[#C5E5EC]/40 focus:outline-hidden focus:border-[#C5E5EC]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[#C5E5EC]/50 hover:text-white"
              >
                &times;
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[11px] font-bold">
            {[
              { key: 'ALL', label: language === 'vi' ? 'Tất cả' : 'All' },
              { key: 'DEPOSIT', label: language === 'vi' ? 'Nạp tiền' : 'Deposits' },
              { key: 'WITHDRAW', label: language === 'vi' ? 'Rút tiền' : 'Withdrawals' },
              { key: 'ESCROW', label: 'Escrow' },
              { key: 'REFUND', label: language === 'vi' ? 'Hoàn tiền' : 'Refunds' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilterType(f.key as any)}
                className={`px-2.5 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer border ${
                  filterType === f.key
                    ? 'bg-[#3064AE] text-white border-[#C5E5EC]/40 shadow-xs'
                    : 'bg-[#0E1B2E] text-[#C5E5EC]/70 hover:text-white border-[#C5E5EC]/15'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table View (Desktop & Tablet) */}
      <div className="hidden md:block rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#12233B] text-[#C5E5EC]/80 border-b border-[#C5E5EC]/15 font-bold">
                <th className="py-3 px-3.5">
                  {language === 'vi' ? 'Loại & Mã GD' : 'Type & Tx ID'}
                </th>
                <th className="py-3 px-3">
                  {language === 'vi' ? 'Chi Tiết / Nội Dung' : 'Details / Note'}
                </th>
                <th className="py-3 px-3">
                  {language === 'vi' ? 'Phương Thức' : 'Method'}
                </th>
                <th className="py-3 px-3 text-right">
                  {language === 'vi' ? 'Số Tiền' : 'Amount'}
                </th>
                <th className="py-3 px-3 text-center">
                  {language === 'vi' ? 'Trạng Thái' : 'Status'}
                </th>
                <th className="py-3 px-3 text-center">
                  {language === 'vi' ? 'Biên Lai' : 'Receipt'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C5E5EC]/10">
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#C5E5EC]/60">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-[#C5E5EC]/30" />
                    <p className="font-semibold">
                      {language === 'vi'
                        ? 'Chưa có giao dịch nào phù hợp với bộ lọc'
                        : 'No transactions found matching filter'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTxs.map((tx) => {
                  const badge = getTransactionBadge(tx);
                  const status = getStatusBadge(tx);
                  const isPlus = tx.amount > 0;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#12233B]/60 transition-colors group cursor-pointer"
                      onClick={() => setSelectedTxForReceipt(tx)}
                    >
                      {/* Cột 1: Loại GD, Ngày giờ & Mã */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                              isPlus
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {isPlus ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <span className="font-extrabold text-white block">
                              {badge.label}
                            </span>
                            <div className="flex items-center space-x-1.5 text-[10px] text-[#C5E5EC]/60">
                              <span>
                                {new Date(tx.timestamp).toLocaleString(
                                  language === 'vi' ? 'vi-VN' : 'en-US',
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  }
                                )}
                              </span>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyId(tx.id);
                                }}
                                className="font-mono text-[#C5E5EC]/80 hover:text-white flex items-center space-x-0.5"
                                title="Copy Transaction ID"
                              >
                                <span>{tx.id.slice(0, 8)}...</span>
                                {copiedId === tx.id ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Nội dung & Mã Kèo */}
                      <td className="py-3 px-3">
                        <div className="max-w-[220px]">
                          <span className="font-bold text-white block truncate">
                            {tx.title || tx.description || (language === 'vi' ? 'Giao dịch ví' : 'Wallet Transaction')}
                          </span>
                          <span className="text-[10px] text-[#C5E5EC]/60 block truncate">
                            {tx.subtitle || tx.description || 'Smart Escrow verified'}
                          </span>
                        </div>
                      </td>

                      {/* Cột 3: Phương thức thanh toán */}
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-semibold text-[#C5E5EC]/80 block">
                          {tx.bankName
                            ? `${tx.bankName} ${tx.accountNumber ? `(•${tx.accountNumber.slice(-4)})` : ''}`
                            : tx.type === 'VIETQR_DEPOSIT'
                            ? 'VietQR Pro 247'
                            : tx.type === 'ESCROW_PAYOUT'
                            ? 'Smart Escrow Vault'
                            : 'Ví GigMe'}
                        </span>
                        {tx.accountHolderName && (
                          <span className="text-[10px] text-[#C5E5EC]/50 font-mono block">
                            {tx.accountHolderName}
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Biến động số tiền */}
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-mono font-black text-sm block ${
                            isPlus ? 'text-emerald-400' : 'text-slate-100'
                          }`}
                        >
                          {isPlus ? `+${formatVnd(tx.amount)}` : formatVnd(tx.amount)}
                        </span>
                        <span className="text-[9px] text-[#C5E5EC]/50 font-semibold">
                          Phí: 0đ (Miễn phí)
                        </span>
                      </td>

                      {/* Cột 5: Trạng thái */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${status.style}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      {/* Cột 6: Xem biên lai */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTxForReceipt(tx);
                          }}
                          className="p-1.5 rounded-lg bg-[#12233B] hover:bg-[#3064AE] text-[#C5E5EC] hover:text-white transition cursor-pointer"
                          title={language === 'vi' ? 'Xem biên lai điện tử' : 'View Receipt'}
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Responsive Cards View */}
      <div className="block md:hidden space-y-2">
        {filteredTxs.length === 0 ? (
          <div className="py-10 text-center rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/15 text-[#C5E5EC]/60 text-xs">
            <Clock className="w-7 h-7 mx-auto mb-2 text-[#C5E5EC]/30" />
            <p className="font-semibold">
              {language === 'vi'
                ? 'Không có giao dịch nào phù hợp'
                : 'No matching transactions'}
            </p>
          </div>
        ) : (
          filteredTxs.map((tx) => {
            const badge = getTransactionBadge(tx);
            const status = getStatusBadge(tx);
            const isPlus = tx.amount > 0;

            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTxForReceipt(tx)}
                className="p-3.5 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/15 hover:border-[#C5E5EC]/40 transition active:scale-[0.99] cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
                        isPlus
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {isPlus ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span className="font-extrabold text-white text-xs">
                      {badge.label}
                    </span>
                  </div>

                  <span
                    className={`font-mono font-black text-sm ${
                      isPlus ? 'text-emerald-400' : 'text-slate-100'
                    }`}
                  >
                    {isPlus ? `+${formatVnd(tx.amount)}` : formatVnd(tx.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#C5E5EC]/70 pt-1 border-t border-[#C5E5EC]/10">
                  <div className="truncate max-w-[200px]">
                    <span className="block font-semibold text-white truncate">
                      {tx.title || tx.description || 'Giao dịch ví'}
                    </span>
                    <span className="text-[10px] text-[#C5E5EC]/50 font-mono">
                      {new Date(tx.timestamp).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${status.style}`}
                  >
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Biên Lai Điện Tử Smart Escrow (Electronic Receipt) */}
      {selectedTxForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/30 p-5 space-y-4 shadow-2xl text-xs relative">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#C5E5EC]/15">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-[#E0FAEB]" />
                <h4 className="font-black text-white text-sm">
                  {language === 'vi' ? 'Biên Lai Giao Dịch Điện Tử' : 'Electronic Transaction Receipt'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxForReceipt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Amount Callout */}
            <div className="text-center py-3 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20">
              <span className="text-[11px] text-[#C5E5EC]/70 font-semibold block">
                {language === 'vi' ? 'Số tiền thực nhận / chuyển' : 'Transaction Amount'}
              </span>
              <span
                className={`font-mono font-black text-2xl mt-1 block ${
                  selectedTxForReceipt.amount > 0 ? 'text-emerald-400' : 'text-white'
                }`}
              >
                {selectedTxForReceipt.amount > 0
                  ? `+${formatVnd(selectedTxForReceipt.amount)}`
                  : formatVnd(selectedTxForReceipt.amount)}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 mt-1">
                <ShieldCheck className="w-3 h-3" />
                <span>{language === 'vi' ? 'Ký Quỹ Smart Escrow Bảo Chứng 100%' : '100% Escrow Guaranteed'}</span>
              </span>
            </div>

            {/* Breakdown Information List */}
            <div className="space-y-2 divide-y divide-[#C5E5EC]/10 text-xs text-[#C5E5EC]">
              <div className="flex items-center justify-between pt-1.5">
                <span className="text-[#C5E5EC]/70">{language === 'vi' ? 'Mã Giao Dịch (TxHash):' : 'Transaction Hash:'}</span>
                <button
                  type="button"
                  onClick={() => handleCopyId(selectedTxForReceipt.id)}
                  className="font-mono text-white font-bold flex items-center space-x-1 hover:text-[#E0FAEB]"
                >
                  <span>{selectedTxForReceipt.id.slice(0, 16)}...</span>
                  <Copy className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-1.5">
                <span className="text-[#C5E5EC]/70">{language === 'vi' ? 'Loại Giao Dịch:' : 'Transaction Type:'}</span>
                <span className="font-bold text-white">
                  {getTransactionBadge(selectedTxForReceipt).label}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1.5">
                <span className="text-[#C5E5EC]/70">{language === 'vi' ? 'Thời Gian Khởi Tạo:' : 'Timestamp:'}</span>
                <span className="font-mono text-white">
                  {new Date(selectedTxForReceipt.timestamp).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1.5">
                <span className="text-[#C5E5EC]/70">{language === 'vi' ? 'Phương Thức Thanh Toán:' : 'Payment Channel:'}</span>
                <span className="font-semibold text-white">
                  {selectedTxForReceipt.bankName || 'VietQR Pro 247'}
                </span>
              </div>

              {selectedTxForReceipt.accountNumber && (
                <div className="flex items-center justify-between pt-1.5">
                  <span className="text-[#C5E5EC]/70">{language === 'vi' ? 'Số Tài Khoản Đối Ứng:' : 'Account Number:'}</span>
                  <span className="font-mono text-white font-bold">
                    {selectedTxForReceipt.accountNumber}
                  </span>
                </div>
              )}

              {selectedTxForReceipt.accountHolderName && (
                <div className="flex items-center justify-between pt-1.5">
                  <span className="text-[#C5E5EC]/70">{language === 'vi' ? 'Chủ Tài Khoản:' : 'Account Holder:'}</span>
                  <span className="font-bold text-white uppercase">
                    {selectedTxForReceipt.accountHolderName}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1.5">
                <span className="text-[#C5E5EC]/70">{language === 'vi' ? 'Trạng Thái Xác Thực:' : 'Status:'}</span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    getStatusBadge(selectedTxForReceipt).style
                  }`}
                >
                  {getStatusBadge(selectedTxForReceipt).label}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedTxForReceipt(null)}
                className="px-4 py-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-white font-bold transition cursor-pointer"
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
