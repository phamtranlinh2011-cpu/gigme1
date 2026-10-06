import React, { useState } from 'react';
import {
  ShieldAlert,
  LogOut,
  RotateCw,
  Mail,
  Phone,
  AlertTriangle,
  Lock,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { triggerHaptic } from '../utils/haptics';

export const AccountLockedScreen: React.FC = () => {
  const { currentUser, logout, refreshCloudConnection, showNotification, language } = useGigMe();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    triggerHaptic('light');
    setIsRefreshing(true);
    try {
      if (refreshCloudConnection) {
        await refreshCloudConnection();
      }
      showNotification(
        language === 'vi' ? 'Đã làm mới dữ liệu' : 'Data Refreshed',
        language === 'vi'
          ? 'Đang kiểm tra trạng thái mở khóa từ máy chủ...'
          : 'Checking unlock status from server...',
        true
      );
    } catch {
      // ignore
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  const handleLogout = () => {
    triggerHaptic('medium');
    logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#080F1D] via-[#0C1728] to-[#080F1D] text-slate-100">
      <div className="w-full max-w-md rounded-3xl bg-[#0F1D33]/95 border border-red-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden animate-fadeIn">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#3064AE]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Warning Icon Badge */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center text-red-400 shadow-xl shadow-red-950/50">
              <ShieldAlert className="w-10 h-10 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-red-600 border-2 border-[#0F1D33] flex items-center justify-center text-white">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold uppercase tracking-wider border border-red-500/30 mb-3">
            {language === 'vi' ? 'Tài Khoản Bị Đình Chỉ' : 'Account Suspended'}
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {language === 'vi' ? 'Tài Khoản Đã Bị Khóa' : 'Account Has Been Locked'}
          </h2>

          <p className="text-xs sm:text-[13px] text-slate-300 mt-2 leading-relaxed">
            {language === 'vi'
              ? 'Tài khoản của bạn đã bị Ban Quản Trị GigMe tạm đình chỉ hoạt động do vi phạm quy định cộng đồng hoặc đang trong diện kiểm tra bảo mật khẩn cấp.'
              : 'Your GigMe account has been suspended by administration due to terms of service violation or urgent security audit.'}
          </p>
        </div>

        {/* User identification info */}
        <div className="mt-6 p-3.5 rounded-2xl bg-[#091322] border border-white/10 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-400">
            <span>{language === 'vi' ? 'Chủ tài khoản:' : 'Account Name:'}</span>
            <span className="text-white font-bold">{currentUser?.name || '---'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>{language === 'vi' ? 'Mã định danh (ID 9 số):' : '9-Digit ID:'}</span>
            <span className="font-mono text-cyan-300 font-bold tracking-wider">{currentUser?.id || '---'}</span>
          </div>
          {currentUser?.email && (
            <div className="flex justify-between items-center text-slate-400">
              <span>Email:</span>
              <span className="text-slate-200 truncate max-w-[200px]">{currentUser.email}</span>
            </div>
          )}
          {currentUser?.phone && (
            <div className="flex justify-between items-center text-slate-400">
              <span>{language === 'vi' ? 'Số điện thoại:' : 'Phone:'}</span>
              <span className="text-slate-200">{currentUser.phone}</span>
            </div>
          )}
        </div>

        {/* Disabled privileges warning */}
        <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-2.5 text-[11px] text-amber-200/90">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-snug">
            {language === 'vi'
              ? 'Trong thời gian khóa: Mọi chức năng nhận việc, đăng việc, nạp rút tiền ví và nhắn tin đều bị vô hiệu hóa để bảo vệ quỹ Escrow.'
              : 'During suspension: All gig posting, accepting, wallet operations, and messaging features are disabled to safeguard Escrow.'}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full py-3 px-4 rounded-2xl bg-[#1A3359] hover:bg-[#234475] active:scale-98 text-white font-bold text-xs flex items-center justify-center space-x-2 border border-[#C5E5EC]/30 transition shadow-md cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 text-[#C5E5EC] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? (language === 'vi' ? 'Đang kiểm tra...' : 'Checking...') : (language === 'vi' ? 'Kiểm tra lại trạng thái mở khóa' : 'Check Unlock Status')}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 rounded-2xl bg-red-600/80 hover:bg-red-600 active:scale-98 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-red-950/40 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{language === 'vi' ? 'Đăng xuất khỏi thiết bị này' : 'Log Out From This Device'}</span>
          </button>
        </div>

        {/* Admin Support Contact Info */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center space-y-1.5 text-slate-400 text-[11px]">
          <p className="font-semibold text-slate-300">
            {language === 'vi' ? 'Cần khiếu nại hoặc mở khóa tài khoản?' : 'Need to appeal or unlock your account?'}
          </p>
          <div className="flex items-center justify-center space-x-4 pt-1">
            <a
              href="mailto:admin@gigme.vn"
              className="text-[#C5E5EC] hover:underline flex items-center space-x-1"
            >
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>admin@gigme.vn</span>
            </a>
            <span>•</span>
            <a
              href="tel:0909120918"
              className="text-[#E0FAEB] hover:underline flex items-center space-x-1"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>0909 120 918</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
