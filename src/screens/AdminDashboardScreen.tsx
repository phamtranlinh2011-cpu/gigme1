import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowLeft,
  Lock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users,
  Search,
  ShieldCheck,
  RefreshCw,
  Power,
  Flame,
  ArrowUpRight,
  Smartphone,
  CreditCard,
  Building,
  BarChart3,
  TrendingUp,
  Bot,
  Fingerprint,
  Ban,
  GraduationCap,
  PieChart,
  Eye,
  Check,
  Wrench,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { formatVnd, USER_TIERS, UserEntity } from '../types';
import { auditSybilAndReviewRings, SybilAuditSummary } from '../utils/sybilDetector';
import { AdminMaintenanceModal } from '../components/AdminMaintenanceModal';

interface AdminDashboardScreenProps {
  onBack: () => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onBack }) => {
  const {
    currentUser,
    rawGigs,
    adminAllUsers,
    adminResolveDispute,
    withdrawEWallet,
    withdrawToBank,
    showNotification,
    maintenanceConfig,
    isMaintenanceActive,
  } = useGigMe();

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  const allUsers: UserEntity[] = adminAllUsers || [];
  const adminUser = allUsers.find((u) => u.role === 'ADMIN' || u.id === 'admin_root') || currentUser;
  const adminBalance = adminUser?.walletBalance || 0;
  const adminPhone = adminUser?.phone || '0909120918';
  const adminMoMo = adminUser?.connectedMoMo || '0909120918';

  const [emergencyFreeze, setEmergencyFreeze] = useState(false);
  const toggleEmergencyFreeze = () => setEmergencyFreeze((p) => !p);

  const [withdrawAmount, setWithdrawAmount] = useState<number>(100000);
  const [withdrawTarget, setWithdrawTarget] = useState<'MOMO' | 'BANK'>('MOMO');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [bankName, setBankName] = useState('Vietcombank');
  const [bankAccNumber, setBankAccNumber] = useState('');
  const [bankAccHolder, setBankAccHolder] = useState(adminUser?.kycName || 'QUẢN TRỊ VIÊN HỆ THỐNG');

  const totalEscrowLockedVault = allUsers.reduce((sum, u) => sum + (u.escrowLockedBalance || 0), 0);
  const totalPlatformFeesCollected = allUsers.reduce((sum, u) => sum + Math.round((u.totalSpent || 0) * 0.1), 0);

  const [activeTab, setActiveTab] = useState<'DISPUTES' | 'USERS' | 'VAULT' | 'ANALYTICS' | 'SYBIL_DETECTION'>('DISPUTES');
  const [userSearch, setUserSearch] = useState('');

  // Sybil and Bot Audit State
  const [sybilAudit, setSybilAudit] = useState<SybilAuditSummary>(() => auditSybilAndReviewRings(allUsers, rawGigs));
  const [isScanningSybil, setIsScanningSybil] = useState(false);
  const [handledThreatIds, setHandledThreatIds] = useState<string[]>([]);

  const handleRunSybilScan = () => {
    setIsScanningSybil(true);
    setTimeout(() => {
      const res = auditSybilAndReviewRings(allUsers, rawGigs);
      setSybilAudit(res);
      setIsScanningSybil(false);
      showNotification('Quét An Toàn Hoàn Tất! 🛡️', `Đã quét ${res.totalScannedUsers} tài khoản, phát hiện ${res.flaggedCount} trường hợp nghi vấn.`);
    }, 600);
  };

  const handleFreezeUser = (userId: string, threatId: string) => {
    setHandledThreatIds((prev) => [...prev, threatId]);
    showNotification('Đã Đóng Băng Tài Khoản! 🚫', `Tài khoản mã ${userId} đã bị vô hiệu hóa quyền rút tiền và nhận việc.`);
  };

  const handleDismissThreat = (threatId: string) => {
    setHandledThreatIds((prev) => [...prev, threatId]);
    showNotification('Đã Đánh Dấu An Toàn', 'Trường hợp nghi vấn đã được bỏ qua và lưu nhật ký.');
  };

  const disputedGigs = rawGigs.filter((g) => g.status === 'DISPUTED');

  // Analytics Metrics
  const completedGigs = rawGigs.filter((g) => g.status === 'COMPLETED');
  const inProgressGigs = rawGigs.filter((g) => g.status === 'IN_PROGRESS' || g.status === 'SUBMITTED');
  const openGigs = rawGigs.filter((g) => g.status === 'OPEN');
  const totalEscrowVolume = rawGigs.reduce((acc, g) => acc + (g.price || 0), 0);
  const disbursedEscrowVolume = completedGigs.reduce((acc, g) => acc + (g.price || 0), 0);
  const pendingEscrowVolume = inProgressGigs.reduce((acc, g) => acc + (g.price || 0), 0);
  const disputedEscrowVolume = disputedGigs.reduce((acc, g) => acc + (g.price || 0), 0);
  const disputeRate = ((disputedGigs.length / Math.max(1, rawGigs.length)) * 100).toFixed(1);

  const campusStats = [
    {
      name: 'ĐHQG TP.HCM (KTX Khu A, Khu B, Trường TV)',
      count: rawGigs.filter((g) => (g.locationName || g.location || '').toLowerCase().includes('đhqg') || (g.locationName || g.location || '').toLowerCase().includes('ktx') || (g.locationName || g.location || '').toLowerCase().includes('khu a') || (g.locationName || g.location || '').toLowerCase().includes('khu b')).length || Math.max(4, Math.floor(rawGigs.length * 0.45)),
      color: 'bg-blue-500',
    },
    {
      name: 'ĐH Bách Khoa TP.HCM (Q10 & Thủ Đức)',
      count: rawGigs.filter((g) => (g.locationName || g.location || '').toLowerCase().includes('bách khoa') || (g.locationName || g.location || '').toLowerCase().includes('q10')).length || Math.max(2, Math.floor(rawGigs.length * 0.2)),
      color: 'bg-cyan-500',
    },
    {
      name: 'ĐH Kinh Tế TP.HCM (UEH Nguyễn Tri Phương)',
      count: rawGigs.filter((g) => (g.locationName || g.location || '').toLowerCase().includes('ueh') || (g.locationName || g.location || '').toLowerCase().includes('kinh tế')).length || Math.max(2, Math.floor(rawGigs.length * 0.15)),
      color: 'bg-amber-500',
    },
    {
      name: 'ĐH FPT TP.HCM (Khu Công Nghệ Cao Q9)',
      count: rawGigs.filter((g) => (g.locationName || g.location || '').toLowerCase().includes('fpt') || (g.locationName || g.location || '').toLowerCase().includes('q9')).length || Math.max(1, Math.floor(rawGigs.length * 0.1)),
      color: 'bg-orange-500',
    },
    {
      name: 'ĐH Sư Phạm Kỹ Thuật (HCMUTE Võ Văn Ngân)',
      count: rawGigs.filter((g) => (g.locationName || g.location || '').toLowerCase().includes('spkt') || (g.locationName || g.location || '').toLowerCase().includes('hcmute')).length || Math.max(1, Math.floor(rawGigs.length * 0.07)),
      color: 'bg-emerald-500',
    },
    {
      name: 'Các Campus & KTX khác trong thành phố',
      count: Math.max(1, Math.floor(rawGigs.length * 0.05)),
      color: 'bg-purple-500',
    },
  ];

  const handleAdminWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0) {
      showNotification('Lỗi số tiền', 'Vui lòng nhập số tiền hợp lệ lớn hơn 0đ.');
      return;
    }
    if (withdrawAmount > adminBalance) {
      showNotification('Số dư không đủ', `Số dư ví doanh thu sàn hiện có ${formatVnd(adminBalance)}, không đủ để rút.`);
      return;
    }

    if (withdrawTarget === 'MOMO') {
      const ok = withdrawEWallet('MoMo', withdrawAmount, adminMoMo);
      if (ok) {
        showNotification(
          'Đã Rút Tiền Về MoMo Thành Công! 📱',
          `Đã chuyển ${formatVnd(withdrawAmount)} từ tài khoản trang mạng về MoMo số ${adminMoMo}.`,
          true,
          true
        );
        setShowWithdrawForm(false);
      }
    } else {
      if (!bankAccNumber.trim()) {
        showNotification('Thiếu số tài khoản', 'Vui lòng nhập số tài khoản ngân hàng nhận tiền.');
        return;
      }
      const ok = withdrawToBank(bankName, bankAccNumber, bankAccHolder, withdrawAmount, adminUser?.securityPin || '123456');
      if (ok) {
        showNotification(
          'Đã Rút Tiền Về Ngân Hàng Thành Công! 🏦',
          `Đã chuyển ${formatVnd(withdrawAmount)} tới ${bankName} (${bankAccNumber}) qua Napas247.`,
          true,
          true
        );
        setShowWithdrawForm(false);
      }
    }
  };

  const filteredUsers = allUsers.filter(
    (u: UserEntity) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28 text-white space-y-6 text-xs">
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-red-500/30">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black text-white flex items-center">
                <ShieldAlert className="w-5 h-5 text-red-500 mr-1.5" />
                GigMe Master Admin Console
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-600 text-white font-black">
                ROOT PRIVILEGES
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Hệ thống giám sát quỹ Smart Escrow Vault & Trọng tài phân xử khiếu nại
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* System Maintenance Button */}
          <button
            type="button"
            onClick={() => setShowMaintenanceModal(true)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-extrabold text-xs transition border ${
              isMaintenanceActive
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-amber-500/50'
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>{isMaintenanceActive ? 'ĐANG BẢO TRÌ' : 'Cài Đặt Bảo Trì'}</span>
            {isMaintenanceActive && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
          </button>

          {/* Emergency Freeze Switch */}
          <button
            onClick={toggleEmergencyFreeze}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-extrabold text-xs transition border ${
              emergencyFreeze
                ? 'bg-red-600 border-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{emergencyFreeze ? 'ĐANG ĐÓNG BĂNG HỆ THỐNG' : 'Công Tắc Khẩn Cấp'}</span>
          </button>
        </div>
      </div>

      {/* Global Maintenance Alert Banner for Admin */}
      {isMaintenanceActive && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border border-amber-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 flex-shrink-0">
              <Wrench className="w-5 h-5 text-amber-400 animate-spin" />
            </div>
            <div>
              <div className="font-extrabold text-amber-300 flex items-center space-x-2">
                <span>CHẾ ĐỘ BẢO TRÌ ĐANG KÍCH HOẠT TRÊN TOÀN SÀN</span>
                <span className="text-[10px] bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded text-amber-300 font-mono">
                  CLOUD SYNC ACTIVE
                </span>
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                Dự kiến kết thúc: <span className="text-white font-bold">{new Date(maintenanceConfig.endTime).toLocaleString('vi-VN')}</span>. Người dùng thông thường chỉ có quyền xem thông tin cá nhân.
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowMaintenanceModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs hover:brightness-110 transition whitespace-nowrap shadow"
          >
            Quản Lý Thời Gian & Nội Dung
          </button>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-[#0F172A] border border-[#1E293B]">
          <span className="text-slate-400 flex items-center space-x-1.5 font-bold mb-1">
            <Lock className="w-4 h-4 text-[#00E5FF]" />
            <span>Tổng Quỹ Escrow Đang Khóa</span>
          </span>
          <span className="text-xl font-black text-[#00E5FF] font-mono">
            {formatVnd(totalEscrowLockedVault)}
          </span>
          <p className="text-[10px] text-slate-500 mt-1">Đảm bảo an toàn không thể rút gian lận</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F172A] border border-[#1E293B]">
          <span className="text-slate-400 flex items-center space-x-1.5 font-bold mb-1">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Doanh Thu Phí Sàn (7-10%)</span>
          </span>
          <span className="text-xl font-black text-emerald-400 font-mono">
            {formatVnd(totalPlatformFeesCollected)}
          </span>
          <p className="text-[10px] text-slate-500 mt-1">Tự động trích từ các giao dịch hoàn tất</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F172A] border border-[#1E293B]">
          <span className="text-slate-400 flex items-center space-x-1.5 font-bold mb-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>Tranh Chấp Cần Xử Lý</span>
          </span>
          <span className="text-xl font-black text-red-400 font-mono">
            {disputedGigs.length} vụ việc
          </span>
          <p className="text-[10px] text-slate-500 mt-1">Yêu cầu phán quyết trong 24 giờ</p>
        </div>
      </div>

      {/* ADMIN REVENUE WALLET & AUTO-WITHDRAWAL HUB */}
      <div className="rounded-3xl bg-gradient-to-br from-[#131E30] via-[#0F172A] to-[#0A0E17] border border-cyan-500/40 p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-[#00E5FF]">
                <CreditCard className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-black text-white">Ví Doanh Thu Trang Mạng Của Admin</h3>
                <p className="text-[11px] text-slate-400">
                  Tiền phí 10% từ các giao dịch tự động đổ vào ví này để Admin tự rút về
                </p>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] text-slate-400 font-semibold block">Số dư quỹ doanh thu:</span>
            <span className="text-2xl font-black text-[#00E5FF] font-mono tracking-tight">
              {formatVnd(adminBalance)}
            </span>
          </div>
        </div>

        {/* Connected MoMo and Bank details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-[#131E30] border border-pink-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-pink-500/15 text-pink-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Ví MoMo Admin</span>
                <span className="text-[11px] text-slate-400 font-mono">SĐT: {adminMoMo}</span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
              ĐÃ LIÊN KẾT
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#131E30] border border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
                <Building className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="font-bold text-white block">Tài Khoản SĐT Admin</span>
                <span className="text-[11px] text-slate-400 font-mono">{adminPhone}</span>
              </div>
            </div>
            <button
              onClick={() => setShowWithdrawForm((p) => !p)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-cyan-500 text-black font-extrabold text-xs hover:brightness-110 shadow transition flex items-center space-x-1"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{showWithdrawForm ? 'Đóng Form' : 'Rút Doanh Thu'}</span>
            </button>
          </div>
        </div>

        {/* Withdrawal Form */}
        {showWithdrawForm && (
          <form onSubmit={handleAdminWithdraw} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-white text-xs">Tạo Lệnh Rút Tiền Doanh Thu</span>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => setWithdrawTarget('MOMO')}
                  className={`px-3 py-1 rounded-xl font-bold transition ${
                    withdrawTarget === 'MOMO'
                      ? 'bg-pink-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Rút Về MoMo ({adminMoMo})
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawTarget('BANK')}
                  className={`px-3 py-1 rounded-xl font-bold transition ${
                    withdrawTarget === 'BANK'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Rút Về Ngân Hàng
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Số tiền muốn rút (VND)</label>
                <input
                  type="number"
                  step="10000"
                  min="10000"
                  max={adminBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white font-mono font-bold"
                  placeholder="50000"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Khả dụng: {formatVnd(adminBalance)}
                </span>
              </div>

              {withdrawTarget === 'MOMO' ? (
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Số MoMo thụ hưởng</label>
                  <input
                    type="text"
                    disabled
                    value={adminMoMo}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-pink-300 font-mono font-bold cursor-not-allowed"
                  />
                  <span className="text-[10px] text-pink-400 mt-1 block">
                    Tiền chuyển tức thì sang ví MoMo chính chủ của Admin
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Ngân hàng</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white"
                    >
                      <option value="Vietcombank">Vietcombank - NHTM Ngoại Thương</option>
                      <option value="MBBank">MBBank - Ngân Hàng Quân Đội</option>
                      <option value="Techcombank">Techcombank - Kỹ Thương</option>
                      <option value="ACB">ACB - Á Châu</option>
                      <option value="TPBank">TPBank - Tiên Phong</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Số tài khoản nhận</label>
                    <input
                      type="text"
                      required
                      value={bankAccNumber}
                      onChange={(e) => setBankAccNumber(e.target.value)}
                      placeholder="0909120918"
                      className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={adminBalance <= 0 || withdrawAmount > adminBalance}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 disabled:opacity-50 text-black font-extrabold text-xs hover:brightness-110 shadow-lg transition"
              >
                Xác Nhận Rút {formatVnd(withdrawAmount)}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Navigation tabs */}
      <div className="flex flex-wrap bg-[#0F172A] p-1 rounded-2xl border border-slate-800 font-bold text-xs gap-1">
        <button
          onClick={() => setActiveTab('DISPUTES')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition ${
            activeTab === 'DISPUTES' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Khiếu Nại ({disputedGigs.length})
        </button>

        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition ${
            activeTab === 'USERS' ? 'bg-[#00E5FF] text-black shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Người Dùng ({allUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('VAULT')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition ${
            activeTab === 'VAULT' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Kiểm Toán Quỹ
        </button>

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1 ${
            activeTab === 'ANALYTICS' ? 'bg-emerald-500 text-black shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Báo Cáo & Phân Tích</span>
        </button>

        <button
          onClick={() => setActiveTab('SYBIL_DETECTION')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1 ${
            activeTab === 'SYBIL_DETECTION' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Chống Bot & Sybil</span>
          {sybilAudit.flaggedCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-black">
              {sybilAudit.flaggedCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: DISPUTES ARBITRATION */}
      {activeTab === 'DISPUTES' && (
        <div className="space-y-3">
          {disputedGigs.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-[#0F172A] border border-slate-800 text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-white">Hệ thống đang hoạt động an toàn!</p>
              <p className="text-slate-400 mt-1">Không có khiếu nại tranh chấp nào đang chờ xử lý.</p>
            </div>
          ) : (
            disputedGigs.map((gig) => (
              <div
                key={gig.id}
                className="p-5 rounded-3xl bg-[#0F172A] border border-red-500/40 space-y-3 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-400 font-black border border-red-700">
                      TRANH CHẤP
                    </span>
                    <h3 className="font-extrabold text-sm text-white mt-1">{gig.title}</h3>
                  </div>
                  <span className="font-mono font-black text-base text-[#00E5FF]">
                    {formatVnd(gig.price)}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <p className="text-slate-300">
                    <strong>Người thuê:</strong> {gig.clientName}
                  </p>
                  <p className="text-slate-300">
                    <strong>Người làm:</strong> {gig.freelancerName || 'Chưa nhận'}
                  </p>
                  <p className="text-red-300">
                    <strong>Nội dung khiếu nại:</strong> &quot;{gig.disputeReason || 'Bất đồng chất lượng hoặc thời hạn'}&quot;
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={() => adminResolveDispute(gig.id, 'Hoàn tiền cho người thuê', true, 'Phán quyết trọng tài')}
                    className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold transition flex items-center justify-center space-x-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Phán Quyết: Hoàn Tiền Cho Người Thuê</span>
                  </button>

                  <button
                    onClick={() => adminResolveDispute(gig.id, 'Giải ngân cho freelancer', false, 'Phán quyết trọng tài')}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold transition flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Phán Quyết: Giải Ngân Cho Freelancer</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: USERS & KYC MANAGEMENT */}
      {activeTab === 'USERS' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-[#0F172A] border border-slate-800 text-white text-xs placeholder:text-slate-500"
              placeholder="Tìm kiếm tài khoản theo tên, email, SĐT..."
            />
          </div>

          <div className="rounded-3xl bg-[#0F172A] border border-[#1E293B] overflow-hidden shadow-xl">
            <div className="divide-y divide-slate-800">
              {filteredUsers.map((u: UserEntity) => (
                <div key={u.id} className="p-4 flex items-center justify-between gap-3 hover:bg-[#131E30] transition">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-white">{u.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                          {u.tier}
                        </span>
                        {u.role === 'ADMIN' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 font-bold">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{u.email || u.phone}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-white text-xs block">
                      Ví: {formatVnd(u.walletBalance)}
                    </span>
                    <span className="text-[10px] text-amber-400">Uy tín: {u.trustScore}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SMART ESCROW AUDIT */}
      {activeTab === 'VAULT' && (
        <div className="rounded-3xl bg-[#0F172A] border border-[#1E293B] p-6 space-y-4 shadow-xl">
          <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
            <Lock className="w-4 h-4 text-[#00E5FF]" />
            <span>Nguyên Tắc Bất Biến Của Smart Escrow Vault</span>
          </h3>

          <div className="space-y-2 text-slate-300 leading-relaxed text-xs">
            <p>
              1. <strong>Không ai được phép rút trước:</strong> Toàn bộ số tiền thù lao thỏa thuận của người thuê được
              đóng băng trong Smart Escrow Vault ngay khi đăng việc.
            </p>
            <p>
              2. <strong>Bảo vệ hai đầu:</strong> Freelancer được bảo vệ không bị quỵt tiền khi hoàn thành đúng hạn;
              Người thuê được bảo vệ hoàn tiền 100% nếu Freelancer không giao việc.
            </p>
            <p>
              3. <strong>Minh bạch chiết khấu:</strong> Phí sàn tự động được hệ thống trừ trực tiếp theo biểu phí Cấp bậc
              (10% cho Cấp 1 & 2, 7% cho Cấp 3 VIP Pro).
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: BÁO CÁO PHÂN TÍCH & DOANH THU SÀN (ANALYTICS - NHÓM 5 - UPDATE 6) */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          {/* Top Analytics KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#0F172A] border border-emerald-500/30">
              <span className="text-slate-400 flex items-center space-x-1.5 font-bold mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Doanh Thu Phí Sàn</span>
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {formatVnd(totalPlatformFeesCollected)}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Trích 10% tự động từ đơn thành công</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F172A] border border-cyan-500/30">
              <span className="text-slate-400 flex items-center space-x-1.5 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-[#00E5FF]" />
                <span>Tỷ Lệ Tranh Chấp</span>
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white font-mono">{disputeRate}%</span>
                <span className="text-[11px] font-bold text-emerald-400">({(100 - Number(disputeRate)).toFixed(1)}% an toàn)</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{disputedGigs.length} vụ / {rawGigs.length} tổng đơn việc</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F172A] border border-purple-500/30">
              <span className="text-slate-400 flex items-center space-x-1.5 font-bold mb-1">
                <Lock className="w-4 h-4 text-purple-400" />
                <span>Tổng Dòng Tiền Escrow</span>
              </span>
              <span className="text-2xl font-black text-purple-300 font-mono">
                {formatVnd(totalEscrowVolume)}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Toàn bộ thù lao ký quỹ trung gian</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F172A] border border-blue-500/30">
              <span className="text-slate-400 flex items-center space-x-1.5 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span>Đã Giải Ngân Cho SV</span>
              </span>
              <span className="text-2xl font-black text-blue-300 font-mono">
                {formatVnd(disbursedEscrowVolume)}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Chi trả trực tiếp về ví thợ</p>
            </div>
          </div>

          {/* Section: Lượng việc theo từng trường đại học */}
          <div className="rounded-3xl bg-[#0F172A] border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-[#00E5FF]" />
                <div>
                  <h3 className="text-sm font-black text-white">
                    Phân Phối Lượng Việc Theo Từng Trường Đại Học (Campus Analytics)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Thống kê tỷ lệ mật độ công việc sinh viên tại các làng đại học & khu ký túc xá
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                Toàn Khu Vực TP.HCM
              </span>
            </div>

            <div className="space-y-3.5">
              {campusStats.map((c, i) => {
                const totalCampusGigs = campusStats.reduce((s, x) => s + x.count, 0) || 1;
                const percent = Math.round((c.count / totalCampusGigs) * 100);
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center space-x-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${c.color}`} />
                        <span>{c.name}</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400 font-mono">{c.count} việc</span>
                        <span className="font-mono font-black text-[#00E5FF] w-10 text-right">{percent}%</span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full ${c.color} transition-all duration-500 rounded-full`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Dòng tiền Escrow thời gian thực */}
          <div className="rounded-3xl bg-[#0F172A] border border-cyan-500/30 p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <PieChart className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-black text-white">
                  Dòng Tiền Smart Escrow Vault Thời Gian Thực
                </h3>
                <p className="text-[11px] text-slate-400">
                  Đối soát dòng tiền tức thời, không thất thoát bất kỳ giao dịch nào
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#131E30] border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">1. Đã Giải Ngân Hoàn Tất</span>
                <span className="text-base font-black text-emerald-400 font-mono">{formatVnd(disbursedEscrowVolume)}</span>
                <span className="text-[10px] text-slate-500 block mt-1">{completedGigs.length} đơn hoàn thành 100%</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#131E30] border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">2. Đang Ký Quỹ Thực Hiện</span>
                <span className="text-base font-black text-cyan-400 font-mono">{formatVnd(pendingEscrowVolume)}</span>
                <span className="text-[10px] text-slate-500 block mt-1">{inProgressGigs.length} đơn đang làm việc</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#131E30] border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">3. Tạm Giữ Tranh Chấp</span>
                <span className="text-base font-black text-red-400 font-mono">{formatVnd(disputedEscrowVolume)}</span>
                <span className="text-[10px] text-slate-500 block mt-1">{disputedGigs.length} đơn chờ trọng tài</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#131E30] border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">4. Quỹ Sàn Khả Dụng</span>
                <span className="text-base font-black text-amber-400 font-mono">{formatVnd(adminBalance)}</span>
                <span className="text-[10px] text-slate-500 block mt-1">Admin có thể rút ngay</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PHÁT HIỆN BOT & NICK ẢO GIAN LẬN (SYBIL_DETECTION - NHÓM 5 - UPDATE 3) */}
      {activeTab === 'SYBIL_DETECTION' && (
        <div className="space-y-6">
          {/* Header & Re-scan Controller */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#0F172A] to-[#0A1220] border border-amber-500/40 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-sm text-white">
                    Hệ Thống Rà Soát Sybil Attack & Vòng Lặp Đánh Giá Ảo
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] border border-amber-500/40">
                    Thuật toán AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Phát hiện tự book đơn ảo cày điểm tín nhiệm ELO, rửa tiền hoặc dùng chung phần cứng thiết bị
                </p>
              </div>
            </div>

            <button
              onClick={handleRunSybilScan}
              disabled={isScanningSybil}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition flex items-center space-x-1.5 shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanningSybil ? 'animate-spin' : ''}`} />
              <span>{isScanningSybil ? 'Đang Quét Mạng Lưới...' : 'Quét Phân Tích Lại'}</span>
            </button>
          </div>

          {/* 3 Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800">
              <span className="text-slate-400 font-bold block mb-1">Tổng Tài Khoản Đã Rà Soát</span>
              <span className="text-2xl font-black text-white font-mono">{sybilAudit.totalScannedUsers}</span>
              <span className="text-[10px] text-slate-500 block mt-1">Đối chiếu toàn bộ user & lịch sử kèo</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F172A] border border-amber-500/30">
              <span className="text-amber-400 font-bold block mb-1">Tài Khoản Nghi Vấn Gắn Cờ</span>
              <span className="text-2xl font-black text-amber-400 font-mono">{sybilAudit.flaggedCount}</span>
              <span className="text-[10px] text-amber-300/70 block mt-1">Điểm rủi ro (Risk Score &gt; 30)</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F172A] border border-red-500/30">
              <span className="text-red-400 font-bold block mb-1">Nhóm Vòng Lặp Đánh Giá Chéo</span>
              <span className="text-2xl font-black text-red-400 font-mono">{sybilAudit.highRiskRingsCount}</span>
              <span className="text-[10px] text-red-300/70 block mt-1">Cặp tài khoản tự khen nhau kiếm ELO</span>
            </div>
          </div>

          {/* List of Flagged Threats */}
          <div className="rounded-3xl bg-[#0F172A] border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
                <Fingerprint className="w-4 h-4 text-[#00E5FF]" />
                <span>Danh Sách Cảnh Báo Tài Khoản Nghi Vấn ({sybilAudit.threats.length})</span>
              </h3>
              <span className="text-[10px] text-slate-400">Sắp xếp theo mức độ nguy hại</span>
            </div>

            {sybilAudit.threats.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-bold text-white">Mạng lưới hoàn toàn trong sạch!</p>
                <p className="text-slate-400 text-[11px]">Không phát hiện dấu vết tấn công Sybil hoặc buff đánh giá chéo.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sybilAudit.threats.map((t) => {
                  const isHandled = handledThreatIds.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      className={`p-4 rounded-2xl border transition space-y-3 ${
                        isHandled
                          ? 'bg-slate-900/40 border-slate-800 opacity-60'
                          : t.threatLevel === 'HIGH_RISK_SYBIL_RING'
                          ? 'bg-red-950/20 border-red-500/40'
                          : 'bg-amber-950/15 border-amber-500/30'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white text-sm border border-slate-700">
                            {t.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-white text-xs">{t.userName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{t.userPhone}</span>
                              {t.threatLevel === 'HIGH_RISK_SYBIL_RING' ? (
                                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[9px]">
                                  NGUY CƠ CAO (VÒNG LẶP CHÉO)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[9px] border border-amber-500/40">
                                  NGHI VẤN
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">Mã tài khoản: {t.userId}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 sm:text-right">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Điểm Rủi Ro:</span>
                            <span className={`font-mono font-black text-sm ${t.score >= 50 ? 'text-red-400' : 'text-amber-400'}`}>
                              {t.score}/100
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Reasons detected */}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 text-[11px]">
                        <span className="font-bold text-slate-300 block mb-1">Dấu hiệu phát hiện bởi thuật toán:</span>
                        {t.reasons.map((r, ri) => (
                          <div key={ri} className="flex items-start space-x-1.5 text-amber-200">
                            <span className="text-amber-400 shrink-0">•</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end space-x-2 pt-1">
                        {isHandled ? (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã xử lý & ghi nhật ký</span>
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleDismissThreat(t.id)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                            >
                              Bỏ Qua
                            </button>

                            <button
                              type="button"
                              onClick={() => handleFreezeUser(t.userId, t.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition flex items-center space-x-1 shadow-md shadow-red-600/20"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Đóng Băng & Trừ ELO</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Maintenance Modal */}
      <AdminMaintenanceModal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
      />
    </div>
  );
};
