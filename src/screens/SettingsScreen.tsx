import React, { useState } from 'react';
import {
  Settings,
  Fingerprint,
  KeyRound,
  Cloud,
  Phone,
  Moon,
  Sun,
  Volume2,
  Globe,
  Scale,
  ShieldAlert,
  LogOut,
  ChevronRight,
  Download,
  Smartphone,
  Check,
  AlertTriangle,
  X,
  ShieldCheck,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { useTranslation } from '../context/LanguageContext';
import { triggerHaptic } from '../utils/haptics';
import { playNotificationSound } from '../utils/audio';
import { PhonePrivacyMode } from '../types';
import { FriendBackupRestoreModal } from '../components/FriendBackupRestoreModal';
import { DownloadAppDialog } from '../components/DownloadAppDialog';

interface SettingsScreenProps {
  onOpenAdminDashboard?: () => void;
  onOpenCampusLaw?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onOpenAdminDashboard,
  onOpenCampusLaw,
}) => {
  const {
    currentUser,
    logout,
    setupOrChangePin,
    setBiometricsWithPassword,
    updateUserProfile,
    setNotificationSound,
    showNotification,
  } = useGigMe();
  const { language, setLanguage, t } = useTranslation();

  // Modals state
  const [showPinModal, setShowPinModal] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showPhonePrivacyModal, setShowPhonePrivacyModal] = useState(false);
  const [showDownloadApp, setShowDownloadApp] = useState(false);

  // PIN modal inputs
  const [pinAccountPassword, setPinAccountPassword] = useState('');
  const [showPinPassword, setShowPinPassword] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Biometrics modal inputs
  const [bioAccountPassword, setBioAccountPassword] = useState('');
  const [showBioPassword, setShowBioPassword] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);
  const [bioScanned, setBioScanned] = useState(false);

  // Phone privacy input
  const [selectedPrivacy, setSelectedPrivacy] = useState<PhonePrivacyMode>(
    currentUser?.phonePrivacy || 'ESCROW_ONLY'
  );

  if (!currentUser) return null;

  const hasExistingPin = !!currentUser.securityPin && currentUser.securityPin.length === 6;
  const isSuperAdmin = currentUser.id === '000000000' || currentUser.role === 'ADMIN';

  // Handler: PIN Submit
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (!pinAccountPassword.trim()) {
      setPinError(language === 'vi' ? 'Vui lòng nhập mật khẩu tài khoản để xác nhận!' : 'Please enter your account password!');
      return;
    }

    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setPinError(language === 'vi' ? 'Mã PIN mới phải bao gồm đúng 6 chữ số!' : 'New PIN must be exactly 6 digits!');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError(language === 'vi' ? 'Mã PIN xác nhận không khớp!' : 'Confirm PIN does not match!');
      return;
    }

    const res = await setupOrChangePin(
      pinAccountPassword.trim(),
      newPin,
      hasExistingPin ? oldPin : undefined
    );

    if (res.success) {
      setShowPinModal(false);
      setPinAccountPassword('');
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      triggerHaptic('success');
      showNotification(
        language === 'vi' ? 'Cập Nhật PIN Thành Công! 🔐' : 'PIN Updated! 🔐',
        language === 'vi'
          ? 'Mã PIN bảo mật 6 số của bạn đã được cập nhật thành công.'
          : 'Your 6-digit wallet security PIN has been updated.',
        true
      );
    } else {
      setPinError(res.error || (language === 'vi' ? 'Không thể cập nhật mã PIN' : 'Failed to update PIN'));
      triggerHaptic('error');
    }
  };

  // Handler: Biometrics Toggle
  const handleBiometricsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBioError(null);

    if (!bioAccountPassword.trim()) {
      setBioError(language === 'vi' ? 'Vui lòng nhập mật khẩu tài khoản!' : 'Please enter your account password!');
      return;
    }

    const nextState = !currentUser.isBiometricsEnabled;
    const res = await setBiometricsWithPassword(bioAccountPassword.trim(), nextState);

    if (res.success) {
      setShowBioModal(false);
      setBioAccountPassword('');
      setBioScanned(false);
      triggerHaptic('success');
      showNotification(
        language === 'vi' ? 'Sinh Trắc Học Đã Cập Nhật 🧬' : 'Biometrics Updated 🧬',
        nextState
          ? (language === 'vi' ? 'Đã kích hoạt xác thực vân tay / FaceID thành công.' : 'Biometric authentication enabled.')
          : (language === 'vi' ? 'Đã tắt xác thực sinh trắc học.' : 'Biometric authentication disabled.'),
        true
      );
    } else {
      setBioError(res.error || (language === 'vi' ? 'Mật khẩu không chính xác' : 'Incorrect password'));
      triggerHaptic('error');
    }
  };

  // Handler: Phone Privacy Submit
  const handleSavePhonePrivacy = () => {
    updateUserProfile({ phonePrivacy: selectedPrivacy });
    setShowPhonePrivacyModal(false);
    triggerHaptic('success');
    showNotification(
      language === 'vi' ? 'Cập Nhật Quyền Riêng Tư 🛡️' : 'Privacy Updated 🛡️',
      language === 'vi'
        ? `Đã áp dụng chính sách hiển thị SĐT: ${
            selectedPrivacy === 'PRIVATE'
              ? 'Ẩn hoàn toàn'
              : selectedPrivacy === 'PUBLIC'
              ? 'Công khai'
              : 'Chỉ khi có giao dịch Escrow'
          }`
        : 'Phone privacy settings have been updated.',
      true
    );
  };

  return (
    <div className="max-w-xl mx-auto px-3 sm:px-4 py-4 space-y-4 pb-28 animate-fadeIn">
      {/* HEADER */}
      <div className="flex items-center space-x-3 p-4 rounded-3xl bg-gradient-to-r from-[#12233B] via-[#0E1B2E] to-[#12233B] border border-[#C5E5EC]/20 shadow-xl">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#3064AE] via-[#417AC6] to-[#C5E5EC] flex items-center justify-center text-white shadow-lg border border-[#C5E5EC]/30">
          <Settings className="w-6 h-6 animate-spin-slow" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
            <span>{language === 'vi' ? 'Cài Đặt Hệ Thống & Bảo Mật' : 'System & Security Settings'}</span>
          </h2>
          <p className="text-[11px] text-[#C5E5EC]/70">
            {language === 'vi'
              ? 'Quản lý mã PIN ví, sinh trắc học, quyền riêng tư, giao diện & âm thanh'
              : 'Manage wallet PIN, Biometrics, privacy, theme & audio'}
          </p>
        </div>
      </div>

      {/* KHỐI 1: BẢO MẬT TÀI KHOẢN & VÍ TIỀN */}
      <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/25 p-5 shadow-xl space-y-3">
        <div className="flex items-center space-x-2 pb-1 border-b border-[#C5E5EC]/15">
          <ShieldCheck className="w-4 h-4 text-[#E0FAEB]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            {language === 'vi' ? 'Bảo Mật Tài Khoản & Ví Escrow' : 'Account & Escrow Vault Security'}
          </h3>
        </div>

        {/* 1. MÃ PIN VÍ BẢO MẬT 6 SỐ */}
        <button
          type="button"
          onClick={() => {
            setPinAccountPassword('');
            setOldPin('');
            setNewPin('');
            setConfirmPin('');
            setPinError(null);
            setShowPinModal(true);
          }}
          className="w-full p-3.5 rounded-2xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/15 flex items-center justify-between transition text-left cursor-pointer active:scale-98"
        >
          <div className="flex items-center space-x-3">
            <KeyRound className="w-5 h-5 text-[#C5E5EC]" />
            <div>
              <h4 className="font-bold text-white text-xs flex items-center space-x-2">
                <span>{language === 'vi' ? 'Mã PIN Ví Bảo Mật 6 Số' : '6-Digit Wallet PIN'}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    hasExistingPin
                      ? 'bg-[#E0FAEB]/20 text-[#E0FAEB] border border-[#E0FAEB]/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {hasExistingPin ? (language === 'vi' ? 'Đã có PIN' : 'Active PIN') : (language === 'vi' ? 'Chưa có PIN' : 'No PIN')}
                </span>
              </h4>
              <p className="text-[10px] text-[#C5E5EC]/70">
                {language === 'vi'
                  ? 'Bắt buộc khi rút tiền Napas 247 và duyệt giải ngân bảo chứng Escrow'
                  : 'Required for Napas withdrawals and Escrow disbursement approval'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#C5E5EC]/60" />
        </button>

        {/* 2. BIOMETRICS (VÂN TAY / FACEID) */}
        <div className="w-full p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/15 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Fingerprint className="w-5 h-5 text-[#E0FAEB]" />
            <div>
              <h4 className="font-bold text-white text-xs flex items-center space-x-2">
                <span>{language === 'vi' ? 'Sinh Trắc Học (Vân Tay / FaceID)' : 'Biometrics (Fingerprint / FaceID)'}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    currentUser.isBiometricsEnabled
                      ? 'bg-[#E0FAEB]/20 text-[#E0FAEB] border border-[#E0FAEB]/30'
                      : 'bg-slate-700/50 text-slate-300'
                  }`}
                >
                  {currentUser.isBiometricsEnabled ? (language === 'vi' ? 'Đang Bật' : 'Enabled') : (language === 'vi' ? 'Chưa Bật' : 'Disabled')}
                </span>
              </h4>
              <p className="text-[10px] text-[#C5E5EC]/70">
                {language === 'vi'
                  ? 'Đăng nhập nhanh 1 chạm an toàn không cần gõ mật khẩu'
                  : 'Fast 1-touch secure authentication without typing password'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setBioAccountPassword('');
              setBioScanned(false);
              setBioError(null);
              setShowBioModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#3064AE]/30 hover:bg-[#3064AE]/50 border border-[#C5E5EC]/30 text-white font-bold text-xs transition cursor-pointer active:scale-95"
          >
            {currentUser.isBiometricsEnabled ? (language === 'vi' ? 'Cấu Hình' : 'Config') : (language === 'vi' ? 'Kích Hoạt' : 'Enable')}
          </button>
        </div>

        {/* 3. QUYỀN RIÊNG TƯ SỐ ĐIỆN THOẠI (PHONE PRIVACY GUARD) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setSelectedPrivacy(currentUser.phonePrivacy || 'ESCROW_ONLY');
            setShowPhonePrivacyModal(true);
          }}
          className="w-full p-3.5 rounded-2xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/15 flex items-center justify-between transition text-left cursor-pointer active:scale-98"
        >
          <div className="flex items-center space-x-3">
            <Phone className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="font-bold text-white text-xs flex items-center space-x-2">
                <span>{language === 'vi' ? 'Quyền Riêng Tư Số Điện Thoại' : 'Phone Privacy Guard'}</span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                    currentUser.phonePrivacy === 'PRIVATE'
                      ? 'bg-slate-700/60 text-slate-300 border-slate-600'
                      : currentUser.phonePrivacy === 'PUBLIC'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  {currentUser.phonePrivacy === 'PRIVATE'
                    ? (language === 'vi' ? 'Ẩn Hoàn Toàn' : 'Hidden')
                    : currentUser.phonePrivacy === 'PUBLIC'
                    ? (language === 'vi' ? 'Công Khai' : 'Public')
                    : (language === 'vi' ? 'Chỉ Khi Escrow' : 'Escrow Only')}
                </span>
              </h4>
              <p className="text-[10px] text-[#C5E5EC]/70">
                {language === 'vi'
                  ? 'Bảo vệ SĐT khỏi làm phiền, chỉ hiển thị với đối tác sau khi đã cọc hoặc nhận việc'
                  : 'Shield phone from spam, reveal only to verified Escrow partners'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#C5E5EC]/60" />
        </button>

        {/* 4. CLOUD FRIEND BACKUP & RESTORE */}
        <button
          type="button"
          onClick={() => setShowBackupModal(true)}
          className="w-full p-3.5 rounded-2xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/15 flex items-center justify-between transition text-left cursor-pointer active:scale-98"
        >
          <div className="flex items-center space-x-3">
            <Cloud className="w-5 h-5 text-sky-400" />
            <div>
              <h4 className="font-bold text-white text-xs flex items-center space-x-1.5">
                <span>{language === 'vi' ? 'Sao Lưu & Phục Hồi Danh Bạ Cloud' : 'Cloud Friend Backup & Restore'}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
                  9 Số ID
                </span>
              </h4>
              <p className="text-[10px] text-[#C5E5EC]/70">
                {language === 'vi'
                  ? 'Bảo toàn danh bạ bạn bè campus, không lo mất khi đổi máy hoặc đăng nhập lại'
                  : 'Preserve campus contacts, restore anytime with your 9-digit ID code'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#C5E5EC]/60" />
        </button>
      </div>

      {/* KHỐI 2: TÙY CHỌN ỨNG DỤNG & GIAO DIỆN */}
      <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/25 p-5 shadow-xl space-y-3">
        <div className="flex items-center space-x-2 pb-1 border-b border-[#C5E5EC]/15">
          <Sparkles className="w-4 h-4 text-[#C5E5EC]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            {language === 'vi' ? 'Tùy Chọn Ứng Dụng & Trải Nghiệm' : 'App Preferences & Interface'}
          </h3>
        </div>

        {/* 1. ÂM THANH THÔNG BÁO */}
        <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/15 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Volume2 className="w-5 h-5 text-cyan-400" />
              <div>
                <h4 className="font-bold text-white text-xs">
                  {language === 'vi' ? 'Âm Thanh Thông Báo Ting Ting' : 'Notification Audio Tone'}
                </h4>
                <p className="text-[10px] text-[#C5E5EC]/70">
                  {language === 'vi' ? 'Chọn giai điệu khi có kèo mới hoặc giải ngân ví' : 'Select sound alert for payouts & new gigs'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                playNotificationSound(currentUser.notificationSound || 'BANK_TING');
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-[#3064AE]/30 hover:bg-[#3064AE]/50 text-[#C5E5EC] font-bold border border-[#C5E5EC]/20 transition cursor-pointer"
            >
              {language === 'vi' ? 'Nghe thử' : 'Test sound'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            {[
              { key: 'DING_DEFAULT', labelVi: 'Ding Mặc Định', labelEn: 'Default Ding' },
              { key: 'BANK_TING', labelVi: 'Ting Ting Tiền Về', labelEn: 'Bank Ting Ting' },
              { key: 'CASH_COUNT', labelVi: 'Tiếng Đếm Tiền', labelEn: 'Cash Count' },
              { key: 'SOFT_VIBRATE', labelVi: 'Rung Nhẹ Êm', labelEn: 'Soft Haptic' },
            ].map((snd) => {
              const isSelected = (currentUser.notificationSound || 'DING_DEFAULT') === snd.key;
              return (
                <button
                  key={snd.key}
                  type="button"
                  onClick={() => {
                    setNotificationSound(snd.key as any);
                    playNotificationSound(snd.key as any);
                    triggerHaptic('light');
                  }}
                  className={`p-2 rounded-xl text-center font-bold text-[11px] border transition cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#3064AE] to-[#255294] text-white border-[#E0FAEB]/40 shadow-sm'
                      : 'bg-[#0E1B2E] hover:bg-[#162B48] text-[#C5E5EC]/80 border-[#C5E5EC]/15'
                  }`}
                >
                  <span>{language === 'vi' ? snd.labelVi : snd.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. CHUYỂN ĐỔI NGÔN NGỮ (LANGUAGE) */}
        <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/15 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Globe className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="font-bold text-white text-xs">
                {language === 'vi' ? 'Ngôn Ngữ Ứng Dụng' : 'App Language'}
              </h4>
              <p className="text-[10px] text-[#C5E5EC]/70">
                {language === 'vi' ? 'Hỗ trợ Tiếng Việt và English' : 'Vietnamese & English supported'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 bg-[#0E1B2E] p-1 rounded-xl border border-[#C5E5EC]/20 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setLanguage('vi');
                triggerHaptic('light');
              }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                language === 'vi'
                  ? 'bg-[#3064AE] text-white font-extrabold shadow-sm'
                  : 'text-[#C5E5EC]/60 hover:text-white'
              }`}
            >
              🇻🇳 Tiếng Việt
            </button>
            <button
              type="button"
              onClick={() => {
                setLanguage('en');
                triggerHaptic('light');
              }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                language === 'en'
                  ? 'bg-[#3064AE] text-white font-extrabold shadow-sm'
                  : 'text-[#C5E5EC]/60 hover:text-white'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>
      </div>

      {/* KHỐI 3: PHÁP LÝ & BỘ LUẬT CAMPUS */}
      <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/25 p-5 shadow-xl space-y-3">
        <div className="flex items-center space-x-2 pb-1 border-b border-[#C5E5EC]/15">
          <Scale className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            {language === 'vi' ? 'Pháp Lý & Bộ Luật Campus' : 'Campus Legal Code & Compliance'}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            if (onOpenCampusLaw) {
              onOpenCampusLaw();
            }
          }}
          className="w-full p-3.5 rounded-2xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/15 flex items-center justify-between transition text-left cursor-pointer active:scale-98"
        >
          <div className="flex items-center space-x-3">
            <Scale className="w-5 h-5 text-amber-400" />
            <div>
              <h4 className="font-bold text-white text-xs flex items-center space-x-2">
                <span>{language === 'vi' ? 'Bộ Luật & Điều Khoản GigMe Campus' : 'GigMe Campus Code of Conduct'}</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {language === 'vi' ? 'Đã Cam Kết' : 'Signed'}
                </span>
              </h4>
              <p className="text-[10px] text-[#C5E5EC]/70">
                {language === 'vi'
                  ? 'Xem lại 18+ điều khoản: Quy chế Smart Escrow, Chợ KTX, phòng chống Fake GPS'
                  : 'Review all 18+ articles: Smart Escrow, Dorm market rules, anti-cheat'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#C5E5EC]/60" />
        </button>
      </div>

      {/* KHỐI 4: CÀI ĐẶT THIẾT BỊ & TẢI ỨNG DỤNG */}
      <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/25 p-5 shadow-xl space-y-3">
        <div className="flex items-center space-x-2 pb-1 border-b border-[#C5E5EC]/15">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            {language === 'vi' ? 'Cài Đặt Lên Điện Thoại & APK' : 'Mobile App & Downloads'}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setShowDownloadApp(true);
          }}
          className="w-full p-3.5 rounded-2xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/15 flex items-center justify-between transition text-left cursor-pointer active:scale-98"
        >
          <div className="flex items-center space-x-3">
            <Download className="w-5 h-5 text-[#00E5FF]" />
            <div>
              <h4 className="font-bold text-white text-xs">
                {language === 'vi' ? 'Tải Ứng Dụng GigMe (PWA & APK)' : 'Install GigMe (PWA & APK)'}
              </h4>
              <p className="text-[10px] text-[#C5E5EC]/70">
                {language === 'vi'
                  ? 'Cài đặt 1 chạm lên màn hình chính hoặc tải file GigMe.apk trực tiếp'
                  : '1-tap install on Home Screen or download GigMe.apk directly'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#C5E5EC]/60" />
        </button>
      </div>

      {/* KHỐI 5: QUẢN TRỊ VIÊN & TÀI KHOẢN */}
      <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/25 p-5 shadow-xl space-y-3">
        {/* MASTER ADMIN PANEL LINK */}
        {isSuperAdmin && (
          <button
            id="admin-dashboard-link-btn"
            type="button"
            onClick={onOpenAdminDashboard}
            className="w-full p-3.5 rounded-2xl bg-red-950/40 hover:bg-red-950/60 border border-red-500/40 flex items-center justify-between transition text-left cursor-pointer active:scale-98"
          >
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <div>
                <h4 className="font-extrabold text-red-300 text-xs">
                  {language === 'vi' ? 'Trung Tâm Điều Hành Quản Trị Viên' : 'Master Admin Dashboard'}
                </h4>
                <p className="text-[10px] text-red-400/80">
                  {language === 'vi'
                    ? 'Quản lý người dùng, duyệt KYC, phân xử tranh chấp Escrow'
                    : 'Manage platform users, KYC review, and dispute arbitration'}
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-red-500 text-white font-bold">Admin Master</span>
          </button>
        )}

        {/* LOGOUT BUTTON */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm(language === 'vi' ? 'Bạn có chắc chắn muốn đăng xuất khỏi thiết bị này không?' : 'Are you sure you want to log out?')) {
              triggerHaptic('medium');
              logout();
            }
          }}
          className="w-full p-3.5 rounded-2xl bg-[#12233B] hover:bg-red-950/30 border border-[#C5E5EC]/15 hover:border-red-500/40 flex items-center justify-between transition text-left text-red-400 cursor-pointer active:scale-98"
        >
          <div className="flex items-center space-x-3">
            <LogOut className="w-5 h-5 text-red-400" />
            <span className="font-extrabold text-xs">{language === 'vi' ? 'Đăng Xuất Tài Khoản' : 'Log Out of Account'}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-red-400/60" />
        </button>
      </div>

      {/* FOOTER METADATA */}
      <div className="text-center py-2 space-y-1 text-[11px] text-[#C5E5EC]/50 font-mono">
        <p>GigMe Student Campus Platform • Version 2.5 (Cyber Dark)</p>
        <p>ID Tài Khoản: {currentUser.id} • {currentUser.email}</p>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: THIẾT LẬP / ĐỔI MÃ PIN 6 SỐ */}
      {/* ========================================================================= */}
      {showPinModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPinModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/30 p-6 text-white shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-[#C5E5EC]/20">
              <h3 className="font-extrabold text-sm flex items-center space-x-2 text-[#E0FAEB]">
                <KeyRound className="w-4 h-4 text-[#C5E5EC]" />
                <span>
                  {hasExistingPin
                    ? language === 'vi'
                      ? 'Đổi Mã PIN Ví Bảo Mật 6 Số'
                      : 'Change 6-Digit Security PIN'
                    : language === 'vi'
                    ? 'Thiết Lập Mã PIN Mới (Chưa Có PIN)'
                    : 'Set Up New PIN (No PIN yet)'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="text-[#C5E5EC]/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-[#C5E5EC]/80 leading-relaxed">
              {hasExistingPin
                ? language === 'vi'
                  ? 'Để đổi mã PIN, bạn cần nhập Mật Khẩu tài khoản xác nhận danh tính kèm Mã PIN cũ hiện tại.'
                  : 'To change your PIN, enter your account password and your current 6-digit PIN.'
                : language === 'vi'
                ? 'Để tạo mã PIN lần đầu, bạn cần nhập Mật Khẩu tài khoản để xác nhận trước.'
                : 'To set up a PIN for the first time, please enter your account password first.'}
            </p>

            {pinError && (
              <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <form onSubmit={handlePinSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                  {language === 'vi' ? 'Mật khẩu tài khoản' : 'Account password'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPinPassword ? 'text' : 'password'}
                    required
                    value={pinAccountPassword}
                    onChange={(e) => setPinAccountPassword(e.target.value)}
                    className="w-full px-3 pr-10 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:outline-none"
                    placeholder={
                      language === 'vi' ? 'Nhập mật khẩu tài khoản của bạn' : 'Enter your account password'
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinPassword(!showPinPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#C5E5EC]/60 hover:text-white"
                  >
                    {showPinPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>

              {hasExistingPin && (
                <div>
                  <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                    {language === 'vi' ? 'Mã PIN cũ (6 số)' : 'Current PIN (6 digits)'}{' '}
                    <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:outline-none font-mono text-center tracking-widest text-base"
                    placeholder="••••••"
                  />
                </div>
              )}

              <div>
                <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                  {language === 'vi' ? 'Mã PIN mới (6 chữ số)' : 'New PIN (6 digits)'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:outline-none font-mono text-center tracking-widest text-base"
                  placeholder="••••••"
                />
              </div>

              <div>
                <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                  {language === 'vi' ? 'Xác nhận mã PIN mới' : 'Confirm new PIN'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:outline-none font-mono text-center tracking-widest text-base"
                  placeholder="••••••"
                />
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#12233B] text-[#C5E5EC] font-bold hover:bg-[#162B48] transition cursor-pointer"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] to-[#255294] text-white font-extrabold shadow-lg transition hover:brightness-110 cursor-pointer"
                >
                  {language === 'vi' ? 'Xác Nhận Lưu' : 'Confirm Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: KÍCH HOẠT / HỦY VÂN TAY FACEID */}
      {/* ========================================================================= */}
      {showBioModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBioModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/30 p-6 text-white shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-[#C5E5EC]/20">
              <h3 className="font-extrabold text-sm flex items-center space-x-2 text-[#E0FAEB]">
                <Fingerprint className="w-4 h-4 text-[#E0FAEB]" />
                <span>
                  {currentUser.isBiometricsEnabled
                    ? language === 'vi'
                      ? 'Tắt Xác Thực Sinh Trắc Học'
                      : 'Disable Biometrics'
                    : language === 'vi'
                    ? 'Kích Hoạt Vân Tay / FaceID'
                    : 'Enable Biometrics'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowBioModal(false)}
                className="text-[#C5E5EC]/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-[#C5E5EC]/80 leading-relaxed">
              {currentUser.isBiometricsEnabled
                ? language === 'vi'
                  ? 'Nhập mật khẩu tài khoản để xác nhận tắt tính năng đăng nhập sinh trắc học.'
                  : 'Enter account password to confirm disabling biometric authentication.'
                : language === 'vi'
                ? 'Để bật tính năng, vui lòng nhập mật khẩu tài khoản và quét ngón tay hoặc khuôn mặt qua WebAuthn/FIDO2.'
                : 'Enter your password to link your biometric sensor for one-touch secure login.'}
            </p>

            {bioError && (
              <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{bioError}</span>
              </div>
            )}

            <form onSubmit={handleBiometricsSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                  {language === 'vi' ? 'Mật khẩu tài khoản' : 'Account password'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showBioPassword ? 'text' : 'password'}
                    required
                    value={bioAccountPassword}
                    onChange={(e) => setBioAccountPassword(e.target.value)}
                    className="w-full px-3 pr-10 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:outline-none"
                    placeholder={
                      language === 'vi' ? 'Nhập mật khẩu tài khoản của bạn' : 'Enter your account password'
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowBioPassword(!showBioPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#C5E5EC]/60 hover:text-white"
                  >
                    {showBioPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>

              {!currentUser.isBiometricsEnabled && (
                <div className="p-3 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Fingerprint className={`w-6 h-6 ${bioScanned ? 'text-emerald-400' : 'text-[#C5E5EC]'}`} />
                    <div>
                      <p className="font-bold text-white text-xs">
                        {language === 'vi' ? 'Cảm biến vân tay / FaceID' : 'Sensor scan'}
                      </p>
                      <p className="text-[10px] text-[#C5E5EC]/70">
                        {bioScanned
                          ? (language === 'vi' ? 'Đã nhận diện thành công!' : 'Sensor verified!')
                          : (language === 'vi' ? 'Nhấn để kiểm tra cảm biến thiết bị' : 'Tap to scan sensor')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('success');
                      setBioScanned(true);
                      showNotification(
                        language === 'vi' ? 'Cảm biến sẵn sàng' : 'Sensor ready',
                        language === 'vi' ? 'Đã quét cảm biến WebAuthn hợp lệ.' : 'WebAuthn sensor verified.',
                        true
                      );
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                      bioScanned
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-[#3064AE]/30 text-white border border-[#C5E5EC]/30'
                    }`}
                  >
                    {bioScanned ? '✓ Đã Quét' : 'Quét Ngay'}
                  </button>
                </div>
              )}

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBioModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#12233B] text-[#C5E5EC] font-bold hover:bg-[#162B48] transition cursor-pointer"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl font-extrabold shadow-lg transition hover:brightness-110 cursor-pointer ${
                    currentUser.isBiometricsEnabled
                      ? 'bg-rose-600 text-white'
                      : 'bg-gradient-to-r from-[#3064AE] to-[#255294] text-white'
                  }`}
                >
                  {currentUser.isBiometricsEnabled
                    ? (language === 'vi' ? 'Tắt Tính Năng' : 'Disable')
                    : (language === 'vi' ? 'Lưu & Bật Vân Tay' : 'Save & Enable')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: QUYỀN RIÊNG TƯ SỐ ĐIỆN THOẠI */}
      {/* ========================================================================= */}
      {showPhonePrivacyModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPhonePrivacyModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/30 p-6 text-white shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-[#C5E5EC]/20">
              <h3 className="font-extrabold text-sm flex items-center space-x-2 text-[#E0FAEB]">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>
                  {language === 'vi' ? 'Quyền Riêng Tư Số Điện Thoại' : 'Phone Privacy Guard'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPhonePrivacyModal(false)}
                className="text-[#C5E5EC]/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-[#C5E5EC]/80 leading-relaxed">
              {language === 'vi'
                ? 'Lựa chọn phương thức hiển thị số điện thoại của bạn trên nền tảng nhằm tránh bị làm phiền:'
                : 'Choose how your phone number appears across GigMe to avoid unsolicited spam:'}
            </p>

            <div className="space-y-2.5">
              {[
                {
                  key: 'ESCROW_ONLY' as PhonePrivacyMode,
                  title: language === 'vi' ? 'Chỉ Khi Escrow (Khuyên dùng)' : 'Escrow Only (Recommended)',
                  badge: language === 'vi' ? 'Khuyên Dùng' : 'Recommended',
                  badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                  desc:
                    language === 'vi'
                      ? 'Số điện thoại chỉ hiển thị đầy đủ cho đối tác sau khi đã cọc giữ đồ hoặc đã được duyệt nhận việc. Người lạ chỉ thấy dạng 0909 ••• 918.'
                      : 'Revealed to counterparties only after Escrow lock or gig acceptance.',
                },
                {
                  key: 'PRIVATE' as PhonePrivacyMode,
                  title: language === 'vi' ? 'Ẩn Hoàn Toàn (Bảo Mật Tối Đa)' : 'Completely Private',
                  badge: language === 'vi' ? 'Bảo Mật 100%' : '100% Private',
                  badgeColor: 'bg-slate-700 text-slate-300 border-slate-600',
                  desc:
                    language === 'vi'
                      ? 'Luôn che số điện thoại với tất cả mọi người. Mọi trao đổi bắt buộc qua hệ thống Chat bảo mật của GigMe.'
                      : 'Always hides phone number from everyone. In-app chat required.',
                },
                {
                  key: 'PUBLIC' as PhonePrivacyMode,
                  title: language === 'vi' ? 'Công Khai Toàn Sàn' : 'Public to All',
                  badge: language === 'vi' ? 'Công Khai' : 'Public',
                  badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
                  desc:
                    language === 'vi'
                      ? 'Hiển thị đầy đủ số điện thoại cho mọi sinh viên khi xem hồ sơ hoặc bài đăng của bạn.'
                      : 'Reveals phone number to anyone viewing your profile or gigs.',
                },
              ].map((opt) => (
                <label
                  key={opt.key}
                  className={`block p-3.5 rounded-2xl border transition cursor-pointer ${
                    selectedPrivacy === opt.key
                      ? 'bg-[#12233B] border-emerald-500/60 shadow-md ring-1 ring-emerald-500/40'
                      : 'bg-[#12233B]/60 hover:bg-[#12233B] border-[#C5E5EC]/15'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="phonePrivacyOption"
                      checked={selectedPrivacy === opt.key}
                      onChange={() => setSelectedPrivacy(opt.key)}
                      className="mt-1 text-emerald-500 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-white text-xs">{opt.title}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border font-bold ${opt.badgeColor}`}>
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#C5E5EC]/70 mt-1 leading-relaxed">{opt.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="pt-2 flex space-x-2">
              <button
                type="button"
                onClick={() => setShowPhonePrivacyModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#12233B] text-[#C5E5EC] font-bold hover:bg-[#162B48] transition cursor-pointer"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSavePhonePrivacy}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] to-[#255294] text-white font-extrabold shadow-lg transition hover:brightness-110 cursor-pointer"
              >
                {language === 'vi' ? 'Lưu Thiết Lập' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: SAO LƯU DANH BẠ CLOUD 9 SỐ ID */}
      {showBackupModal && (
        <FriendBackupRestoreModal isOpen={showBackupModal} onClose={() => setShowBackupModal(false)} />
      )}

      {/* MODAL 5: TẢI APP & APK */}
      {showDownloadApp && (
        <DownloadAppDialog isOpen={showDownloadApp} onClose={() => setShowDownloadApp(false)} />
      )}
    </div>
  );
};
