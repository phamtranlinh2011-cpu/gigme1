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
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { formatVnd, USER_TIERS, UserEntity } from '../types';

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
  } = useGigMe();

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

  const [activeTab, setActiveTab] = useState<'DISPUTES' | 'USERS' | 'VAULT'>('DISPUTES');
  const [userSearch, setUserSearch] = useState('');

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

  const disputedGigs = rawGigs.filter((g) => g.status === 'DISPUTED');

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
      <div className="flex bg-[#0F172A] p-1 rounded-2xl border border-slate-800 font-bold">
        <button
          onClick={() => setActiveTab('DISPUTES')}
          className={`flex-1 py-2 rounded-xl transition ${
            activeTab === 'DISPUTES' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Khiếu Nại & Trọng Tài ({disputedGigs.length})
        </button>

        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex-1 py-2 rounded-xl transition ${
            activeTab === 'USERS' ? 'bg-[#00E5FF] text-black shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Người Dùng & KYC ({allUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('VAULT')}
          className={`flex-1 py-2 rounded-xl transition ${
            activeTab === 'VAULT' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Kiểm Toán Quỹ Escrow
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
    </div>
  );
};
