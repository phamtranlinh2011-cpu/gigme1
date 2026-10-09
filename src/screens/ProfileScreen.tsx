import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  SmartphoneNfc,
  Award,
  Lock,
  KeyRound,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Star,
  CheckCircle2,
  Plus,
  X,
  Flame,
  Fingerprint,
  Smartphone,
  Phone,
  Building2,
  AlertTriangle,
  TrendingUp,
  Check,
  Camera,
  Wrench,
  Copy,
  Cloud,
  Mail,
  Edit3,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { useTranslation } from '../context/LanguageContext';
import { USER_TIERS, formatVnd, PhonePrivacyMode, maskPhoneNumber } from '../types';
import { playNotificationSound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { BusinessUpgradeDialog } from '../components/AdvancedDialogs';
import { AvatarPickerModal } from '../components/AvatarPickerModal';
import { StudentEloModal } from '../components/StudentEloModal';
import { VerifiedIdentityBadge } from '../components/VerifiedIdentityBadge';
import { EduEmailVerificationModal } from '../components/EduEmailVerificationModal';
import { FriendBackupRestoreModal } from '../components/FriendBackupRestoreModal';

interface ProfileScreenProps {
  onOpenNfcDialog: () => void;
  onOpenFaceDialog?: () => void;
  onOpenSsoDialog: () => void;
  onOpenAdminDashboard: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenNfcDialog,
  onOpenFaceDialog,
  onOpenSsoDialog,
  onOpenAdminDashboard,
}) => {
  const {
    currentUser,
    logout,
    roleMode,
    toggleRole,
    setWalletPin,
    toggleBiometrics,
    isDarkMode,
    isMaintenanceActive,
    maintenanceConfig,
    showNotification,
    updateUserProfile,
    userTransactions,
    setupOrChangePin,
    setBiometricsWithPassword,
    validateUserPassword,
  } = useGigMe();
  const { language, t } = useTranslation();

  // 1. SKILLS STATE (Ban đầu mảng rỗng nếu chưa add kỹ năng nào)
  const [skills, setSkills] = useState<string[]>(currentUser?.skills || []);
  const [newSkill, setNewSkill] = useState('');

  // Sync with currentUser
  useEffect(() => {
    if (currentUser?.skills) {
      setSkills(currentUser.skills);
    }
  }, [currentUser?.skills]);

  // Modals state
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showEloModal, setShowEloModal] = useState(false);
  const [showEduModal, setShowEduModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showPhonePrivacyModal, setShowPhonePrivacyModal] = useState(false);

  // Edit profile name split state: Họ và tên đệm / Tên
  const [editLastName, setEditLastName] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPhonePrivacy, setEditPhonePrivacy] = useState<PhonePrivacyMode>('ESCROW_ONLY');
  const [editSchool, setEditSchool] = useState('');
  const [editFaculty, setEditFaculty] = useState('');
  const [editBio, setEditBio] = useState('');

  // PIN modal inputs
  const [pinAccountPassword, setPinAccountPassword] = useState('');
  const [showPinPassword, setShowPinPassword] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Biometrics modal inputs
  const [bioAccountPassword, setBioAccountPassword] = useState('');
  const [showBioPassword, setShowBioPassword] = useState(false);
  const [bioScanned, setBioScanned] = useState(false);
  const [isScanningBio, setIsScanningBio] = useState(false);
  const [isSubmittingBio, setIsSubmittingBio] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);

  const [simulatedAlert, setSimulatedAlert] = useState(false);

  if (!currentUser) return null;

  // Check PIN existence
  const hasExistingPin = Boolean(currentUser.securityPin && currentUser.securityPin.trim().length === 6);

  // Check deposit & KYC for skills limit
  const hasDeposited = Boolean(
    currentUser.hasDeposited ||
    (userTransactions && userTransactions.some((t) => t.type.includes('DEPOSIT') && t.isSuccess)) ||
    (currentUser.walletBalance > 0 && (currentUser.depositCount ?? 0) > 0) ||
    currentUser.totalSpent > 0
  );
  const hasKycCccd = Boolean(
    currentUser.isKycApproved ||
    currentUser.isNfcVerified ||
    currentUser.isKycVerified ||
    (currentUser.cccdNumber && currentUser.cccdNumber.trim().length >= 9) ||
    currentUser.tier === 'CCCD_VERIFIED' ||
    currentUser.tier === 'VERIFIED'
  );

  let maxSkills = 1;
  let skillTierLabel = language === 'vi' ? 'Tài khoản mới (Tối đa 1 kỹ năng)' : 'New Account (Max 1 skill)';
  if (hasDeposited) {
    maxSkills = 5;
    skillTierLabel = language === 'vi' ? 'Tài khoản đã nạp tiền (Mở khóa 5 kỹ năng)' : 'Funded Account (Unlocked 5 skills)';
  } else if (hasKycCccd) {
    maxSkills = 3;
    skillTierLabel = language === 'vi' ? 'Tài khoản xác thực CCCD (Mở khóa 3 kỹ năng)' : 'ID Verified Account (Unlocked 3 skills)';
  }

  // Open Edit Profile modal with split name
  const handleOpenEditModal = () => {
    triggerHaptic('light');
    const lastName = currentUser.lastName || (currentUser.name ? currentUser.name.split(' ').slice(0, -1).join(' ') : '');
    const firstName = currentUser.firstName || (currentUser.name ? currentUser.name.split(' ').slice(-1).join(' ') : '');
    setEditLastName(lastName);
    setEditFirstName(firstName);
    setEditPhone(currentUser.phone || '');
    setEditPhonePrivacy(currentUser.phonePrivacy || 'ESCROW_ONLY');
    setEditSchool(currentUser.studentSchool || '');
    setEditFaculty(currentUser.studentFaculty || '');
    setEditBio(currentUser.bio || '');
    setShowEditProfileModal(true);
  };

  // Quick Change Phone Privacy from Settings / Profile Card
  const handleQuickChangePhonePrivacy = (mode: PhonePrivacyMode) => {
    triggerHaptic('success');
    updateUserProfile({ phonePrivacy: mode });
    showNotification(
      language === 'vi' ? 'Đã đổi quyền riêng tư SĐT! 🛡️' : 'Phone Privacy Updated! 🛡️',
      mode === 'ESCROW_ONLY'
        ? (language === 'vi' ? 'Chỉ đối tác giao dịch Escrow / đã nhận việc mới xem được SĐT.' : 'Only Escrow partners can see your phone number.')
        : mode === 'PRIVATE'
        ? (language === 'vi' ? 'Số điện thoại của bạn hiện được ẩn hoàn toàn với bên ngoài.' : 'Your phone number is completely hidden.')
        : (language === 'vi' ? 'Số điện thoại của bạn đang hiển thị công khai.' : 'Your phone number is publicly visible.'),
      true
    );
    setShowPhonePrivacyModal(false);
  };

  // Save Edit Profile with combined <= 30 chars rule
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const lastName = editLastName.trim();
    const firstName = editFirstName.trim();
    const combinedName = `${lastName} ${firstName}`.trim();

    if (!lastName) {
      triggerHaptic('error');
      showNotification(
        language === 'vi' ? 'Lỗi' : 'Error',
        language === 'vi' ? 'Vui lòng nhập họ và tên đệm (VD: Nguyễn Văn).' : 'Please enter your last and middle name (e.g. Smith).'
      );
      return;
    }
    if (!firstName) {
      triggerHaptic('error');
      showNotification(
        language === 'vi' ? 'Lỗi' : 'Error',
        language === 'vi' ? 'Vui lòng nhập tên (VD: An).' : 'Please enter your first name (e.g. John).'
      );
      return;
    }
    if (combinedName.length > 30) {
      triggerHaptic('error');
      showNotification(
        language === 'vi' ? 'Lỗi' : 'Error',
        language === 'vi'
          ? `Họ tên đệm và tên ghi gộp lại không được quá 30 ký tự (hiện tại: ${combinedName.length} ký tự).`
          : `Combined full name cannot exceed 30 characters (currently: ${combinedName.length} characters).`
      );
      return;
    }

    triggerHaptic('success');
    const campusBadge = editSchool.trim()
      ? `${editSchool.trim()}${editFaculty.trim() ? ` • ${editFaculty.trim()}` : ''}`
      : '';
    updateUserProfile({
      name: combinedName,
      lastName,
      firstName,
      phone: editPhone.trim(),
      phonePrivacy: editPhonePrivacy,
      studentSchool: editSchool.trim(),
      studentFaculty: editFaculty.trim(),
      campusBadge,
      bio: editBio.trim(),
    });
    showNotification(
      language === 'vi' ? 'Cập nhật thành công! ✨' : 'Updated Successfully! ✨',
      language === 'vi' ? 'Hồ sơ cá nhân của bạn đã được lưu.' : 'Your profile has been saved.'
    );
    setShowEditProfileModal(false);
  };

  // Handle Add Skill (max 30 chars, tiered limit)
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (!trimmed) return;

    if (skills.includes(trimmed)) {
      showNotification(
        language === 'vi' ? 'Thông báo' : 'Notice',
        language === 'vi' ? 'Kỹ năng này đã có trong hồ sơ của bạn.' : 'This skill is already in your profile.'
      );
      return;
    }

    if (trimmed.length > 30) {
      triggerHaptic('error');
      showNotification(
        language === 'vi' ? 'Vượt quá độ dài' : 'Length Exceeded',
        language === 'vi' ? 'Mỗi thẻ kỹ năng không được quá 30 ký tự!' : 'Each skill tag cannot exceed 30 characters!'
      );
      return;
    }

    if (skills.length >= maxSkills) {
      triggerHaptic('error');
      let reason = language === 'vi'
        ? 'Tài khoản mới chỉ add tối đa 1 kỹ năng. Hãy xác thực CCCD để mở khóa 3 kỹ năng hoặc thực hiện nạp tiền để mở khóa tối đa 5 kỹ năng!'
        : 'New accounts can add max 1 skill. Verify ID to unlock 3 skills or deposit funds to unlock 5 skills!';
      if (maxSkills === 3) {
        reason = language === 'vi'
          ? 'Tài khoản xác thực CCCD add tối đa 3 kỹ năng. Hãy nạp tiền vào ví để mở khóa tối đa 5 kỹ năng!'
          : 'ID-verified accounts can add max 3 skills. Deposit funds to unlock up to 5 skills!';
      } else if (maxSkills === 5) {
        reason = language === 'vi'
          ? 'Bạn đã đạt giới hạn tối đa 5 kỹ năng cho tài khoản của mình.'
          : 'You have reached the maximum limit of 5 skills for your account.';
      }
      showNotification(language === 'vi' ? 'Giới hạn thẻ kỹ năng' : 'Skill Tag Limit', reason);
      return;
    }

    triggerHaptic('success');
    const updated = [...skills, trimmed];
    setSkills(updated);
    setNewSkill('');
    updateUserProfile({ skills: updated });
    showNotification(
      language === 'vi' ? 'Đã thêm kỹ năng ✨' : 'Skill Added ✨',
      language === 'vi' ? `Đã lưu thẻ "${trimmed}" vào hồ sơ.` : `Saved skill "${trimmed}" to profile.`
    );
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    triggerHaptic('light');
    const updated = skills.filter((s) => s !== skillToRemove);
    setSkills(updated);
    updateUserProfile({ skills: updated });
  };

  // Handle PIN Form Submit (Requires Password; if has PIN, also requires old PIN)
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (!pinAccountPassword.trim()) {
      setPinError(
        language === 'vi'
          ? 'Vui lòng nhập mật khẩu tài khoản để xác nhận trước!'
          : 'Please enter your account password to confirm first!'
      );
      return;
    }

    if (hasExistingPin) {
      if (!oldPin.trim() || oldPin.trim().length !== 6) {
        setPinError(
          language === 'vi'
            ? 'Vui lòng nhập đúng mã PIN 6 số cũ!'
            : 'Please enter your current 6-digit PIN correctly!'
        );
        return;
      }
    }

    if (!/^\d{6}$/.test(newPin.trim())) {
      setPinError(
        language === 'vi'
          ? 'Mã PIN 6 số mới phải gồm đúng 6 chữ số!'
          : 'New 6-digit PIN must contain exactly 6 digits!'
      );
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setPinError(
        language === 'vi'
          ? 'Mã PIN mới và xác nhận mã PIN không trùng khớp!'
          : 'New PIN and confirmation PIN do not match!'
      );
      return;
    }

    setIsSubmittingPin(true);
    try {
      const res = await setupOrChangePin(pinAccountPassword, newPin.trim(), hasExistingPin ? oldPin.trim() : undefined);
      if (res.success) {
        setShowPinModal(false);
        setPinAccountPassword('');
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
        setPinError(null);
      } else {
        setPinError(
          res.error ||
            (language === 'vi'
              ? 'Thao tác không thành công. Vui lòng kiểm tra lại mật khẩu!'
              : 'Operation failed. Please check your password!')
        );
      }
    } finally {
      setIsSubmittingPin(false);
    }
  };

  // Handle Biometrics Trigger Scan
  const handleTriggerBioScan = async () => {
    setIsScanningBio(true);
    setBioError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setBioScanned(true);
      triggerHaptic('success');
      showNotification(
        language === 'vi' ? 'Đã quét vân tay! 👆' : 'Fingerprint Scanned! 👆',
        language === 'vi' ? 'Xác thực cảm biến vân tay thành công.' : 'Fingerprint sensor verification successful.'
      );
    } finally {
      setIsScanningBio(false);
    }
  };

  // Handle Biometrics Submit (Requires Password; if changing/turning off, requires password + scan)
  const handleBioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBioError(null);

    if (!bioAccountPassword.trim()) {
      setBioError(
        language === 'vi'
          ? 'Vui lòng nhập mật khẩu tài khoản để xác nhận danh tính trước!'
          : 'Please enter account password to verify identity first!'
      );
      return;
    }

    if (!bioScanned) {
      setBioError(
        language === 'vi'
          ? 'Vui lòng chạm vào nút cảm biến để quét xác thực vân tay trước!'
          : 'Please tap the sensor button to scan fingerprint first!'
      );
      return;
    }

    setIsSubmittingBio(true);
    try {
      const targetState = !currentUser.isBiometricsEnabled;
      const res = await setBiometricsWithPassword(bioAccountPassword, targetState);
      if (res.success) {
        setShowBioModal(false);
        setBioAccountPassword('');
        setBioScanned(false);
        setBioError(null);
      } else {
        setBioError(
          res.error ||
            (language === 'vi' ? 'Mật khẩu tài khoản không chính xác!' : 'Account password is incorrect!')
        );
      }
    } finally {
      setIsSubmittingBio(false);
    }
  };

  const currentTierConfig = USER_TIERS[currentUser.tier];
  const isSuperAdmin =
    currentUser.role === 'ADMIN' ||
    currentUser.id === '000000000' ||
    currentUser.email === 'admin@admin.vn' ||
    currentUser.phone === '0909120918' ||
    currentUser.id === 'admin_root';

  const trustScore = currentUser.trustScore ?? 0;
  const getTrustRating = (score: number) => {
    if (score >= 800)
      return {
        label: language === 'vi' ? 'Hạng AAA - Xuất Sắc' : 'Tier AAA - Excellent',
        badge: 'bg-[#E0FAEB]/20 text-[#E0FAEB] border border-[#E0FAEB]/30',
      };
    if (score >= 740)
      return {
        label: language === 'vi' ? 'Hạng AA - Rất Tốt' : 'Tier AA - Very Good',
        badge: 'bg-[#C5E5EC]/20 text-[#C5E5EC] border border-[#C5E5EC]/30',
      };
    if (score >= 670)
      return {
        label: language === 'vi' ? 'Hạng A - Uy Tín' : 'Tier A - Reputable',
        badge: 'bg-[#3064AE]/30 text-[#C5E5EC] border border-[#C5E5EC]/30',
      };
    if (score >= 300)
      return {
        label: language === 'vi' ? 'Hạng B - Đang Cải Thiện' : 'Tier B - Improving',
        badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      };
    return {
      label: language === 'vi' ? 'Chưa Tích Lũy Điểm' : 'No Score Accumulated',
      badge: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
    };
  };
  const trustInfo = getTrustRating(trustScore);

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 text-white space-y-4 sm:space-y-6 text-xs">
      {/* Maintenance Mode Notice */}
      {isMaintenanceActive && (
        <div className="rounded-2xl bg-[#0E1B2E] border border-amber-500/40 p-4 shadow-lg flex items-start space-x-3">
          <Wrench className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1 flex-1">
            <div className="font-extrabold text-amber-300 text-xs flex items-center space-x-2">
              <span>{language === 'vi' ? 'HỆ THỐNG ĐANG BẢO TRÌ NÂNG CẤP' : 'SYSTEM UNDER UPGRADE MAINTENANCE'}</span>
              <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-mono">
                {language === 'vi' ? 'Chế độ xem hồ sơ được phép' : 'Profile view allowed'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {language === 'vi'
                ? 'Bạn đang xem thông tin cá nhân của mình. Các tính năng nạp rút tiền và giao dịch tạm thời khóa đến '
                : 'You are viewing your personal profile. Deposits, withdrawals, and transactions are locked until '}
              <span className="text-white font-bold">
                {new Date(maintenanceConfig.endTime).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US')}
              </span>.
            </p>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/25 p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-brand-tri-gradient" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative group shrink-0">
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[#C5E5EC]/60 group-hover:border-[#E0FAEB] shadow-lg shadow-[#3064AE]/30 transition-transform active:scale-95 bg-[#09111D] flex items-center justify-center relative cursor-pointer"
                title={language === 'vi' ? 'Bấm để thay đổi ảnh đại diện' : 'Click to change avatar'}
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#3064AE] to-[#417AC6] flex items-center justify-center font-black text-2xl text-white">
                    {(currentUser.name || 'G').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white drop-shadow" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#3064AE] text-white hover:bg-[#255294] shadow-md transition border-2 border-[#0E1B2E] cursor-pointer"
                title={language === 'vi' ? 'Thay đổi ảnh đại diện' : 'Change avatar'}
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="text-sm sm:text-base font-extrabold text-white truncate">{currentUser.name}</h2>
                {(currentUser.isNfcVerified || currentUser.isStudentVerified || currentUser.isEduVerified) && (
                  <VerifiedIdentityBadge
                    isCccdVerified={!!currentUser.isNfcVerified}
                    isStudentVerified={!!(currentUser.isStudentVerified || currentUser.isEduVerified)}
                    school={currentUser.studentSchool}
                    faculty={currentUser.studentFaculty}
                    size="sm"
                    showText={true}
                    interactive={true}
                    onBadgeClick={onOpenNfcDialog}
                  />
                )}
              </div>

              {/* Name Details Split display */}
              <div className="text-[11px] text-[#C5E5EC]/80 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                <span>{t('lastNameLabel')}: <strong className="text-white">{currentUser.lastName || (currentUser.name ? currentUser.name.split(' ').slice(0, -1).join(' ') : '') || '—'}</strong></span>
                <span>{t('firstNameLabel')}: <strong className="text-[#E0FAEB]">{currentUser.firstName || (currentUser.name ? currentUser.name.split(' ').pop() : '') || '—'}</strong></span>
              </div>

              <div className="flex items-center space-x-2 mt-1.5 text-[11px] text-[#C5E5EC]/70 flex-wrap gap-y-1">
                <span className="font-mono bg-[#12233B] px-2 py-0.5 rounded border border-[#C5E5EC]/20 text-[#E0FAEB]">
                  ID: {currentUser.id}
                </span>
                <span>•</span>
                <span className="truncate">
                  {currentUser.studentSchool
                    ? `${currentUser.studentSchool}${currentUser.studentFaculty ? ` • ${currentUser.studentFaculty}` : ''}`
                    : (language === 'vi' ? 'Chưa cập nhật trường' : 'School not updated')}
                </span>
              </div>

              {/* Contact Phone & Privacy Badge */}
              <div className="flex items-center space-x-2 mt-1.5 text-[11px] text-[#C5E5EC]/70 flex-wrap gap-y-1">
                <span className="flex items-center space-x-1 font-mono text-white">
                  <Phone className="w-3.5 h-3.5 text-[#E0FAEB]" />
                  <span>{currentUser.phone || (language === 'vi' ? 'Chưa thêm SĐT' : 'No phone')}</span>
                </span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setShowPhonePrivacyModal(true);
                  }}
                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer hover:brightness-110 active:scale-95 ${
                    currentUser.phonePrivacy === 'PRIVATE'
                      ? 'bg-slate-800/80 text-slate-300 border-slate-600'
                      : currentUser.phonePrivacy === 'PUBLIC'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                      : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                  }`}
                  title={language === 'vi' ? 'Nhấp để đổi quyền riêng tư số điện thoại' : 'Click to change phone privacy'}
                >
                  <span>
                    {currentUser.phonePrivacy === 'PRIVATE'
                      ? '🔒 ' + (language === 'vi' ? 'Ẩn SĐT với người ngoài' : 'Hidden publicly')
                      : currentUser.phonePrivacy === 'PUBLIC'
                      ? '🌐 ' + (language === 'vi' ? 'SĐT Công khai' : 'Public phone')
                      : '🛡️ ' + (language === 'vi' ? 'Chỉ hiện khi Escrow' : 'Escrow only')}
                  </span>
                </button>
              </div>

              {currentUser.bio && (
                <p className="text-[11px] text-slate-300 italic mt-1 line-clamp-2">
                  &ldquo;{currentUser.bio}&rdquo;
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={handleOpenEditModal}
              className="px-3 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#182F4E] border border-[#C5E5EC]/30 text-[#C5E5EC] hover:text-white font-bold text-xs transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t('editProfileBtn')}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowEloModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-extrabold text-xs shadow-md transition flex items-center space-x-1 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-black" />
              <span>{currentUser.eloRating ?? 200} ELO</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trust Score & Verification Card */}
      <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/25 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#E0FAEB]" />
            <h3 className="font-black text-sm text-white">{t('trustScoreTitle')}</h3>
          </div>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold ${trustInfo.badge}`}>
            {trustInfo.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/15 text-center">
            <div className="text-lg font-black text-white">{trustScore}/100</div>
            <div className="text-[10px] text-[#C5E5EC]/70 mt-0.5">{t('trustScore')}</div>
          </div>
          <div className="p-3 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/15 text-center">
            <div className="text-lg font-black text-amber-400">
              {currentUser.rating > 0 ? `${currentUser.rating.toFixed(1)} ★` : '0.0 ★'}
            </div>
            <div className="text-[10px] text-[#C5E5EC]/70 mt-0.5">
              {currentUser.reviewCount || 0} {t('reviewsCount')}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/15 text-center">
            <div className="text-lg font-black text-[#E0FAEB]">{currentUser.completedGigs || 0}</div>
            <div className="text-[10px] text-[#C5E5EC]/70 mt-0.5">{t('completedGigsCount')}</div>
          </div>
          <div className="p-3 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/15 text-center">
            <div className="text-lg font-black text-cyan-400">{currentUser.onTimeRate || 100}%</div>
            <div className="text-[10px] text-[#C5E5EC]/70 mt-0.5">{t('onTimeRate')}</div>
          </div>
        </div>
      </div>

      {/* Identification & KYC Cards */}
      <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/25 p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#E0FAEB]" />
            <span>{t('identityVerificationCenter')}</span>
          </h3>
          <span className="text-[10px] text-[#C5E5EC]/70">
            {language === 'vi' ? 'Phòng chống bùng tiền & lừa đảo' : 'Escrow protection & trust'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: CCCD NFC */}
          <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-extrabold text-white text-xs flex items-center space-x-1.5">
                  <SmartphoneNfc className="w-4 h-4 text-[#C5E5EC]" />
                  <span>{t('nfcCccdTitle')}</span>
                </span>
                {currentUser.isNfcVerified || currentUser.isKycApproved ? (
                  <span className="text-[#E0FAEB] font-bold text-[10px] flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-0.5" /> {t('verifiedStatus')}
                  </span>
                ) : (
                  <span className="text-amber-300 font-bold px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-[9px]">
                    {t('unverifiedStatus')}
                  </span>
                )}
              </div>
              <p className="text-[#C5E5EC]/70 text-[10px] leading-relaxed">
                {t('nfcCccdDesc')}
              </p>
            </div>
            <button
              onClick={onOpenNfcDialog}
              className="mt-2.5 w-full py-1.5 rounded-xl bg-[#3064AE]/30 hover:bg-[#3064AE]/50 border border-[#C5E5EC]/30 text-[#C5E5EC] hover:text-white font-bold text-xs transition cursor-pointer"
            >
              {currentUser.isNfcVerified ? (language === 'vi' ? 'Xem Thẻ CCCD' : 'View ID Card') : (language === 'vi' ? 'Quét CCCD NFC →' : 'Scan NFC ID →')}
            </button>
          </div>

          {/* Card 2: Student SSO */}
          <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-extrabold text-white text-xs flex items-center space-x-1.5">
                  <GraduationCap className="w-4 h-4 text-[#C5E5EC]" />
                  <span>{t('ssoSchoolTitle')}</span>
                </span>
                {currentUser.isStudentVerified ? (
                  <span className="text-[#E0FAEB] font-bold text-[10px] flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-0.5" /> {t('verifiedStatus')}
                  </span>
                ) : (
                  <span className="text-amber-300 font-bold px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-[9px]">
                    {t('unverifiedStatus')}
                  </span>
                )}
              </div>
              <p className="text-[#C5E5EC]/70 text-[10px] leading-relaxed">
                {t('ssoSchoolDesc')}
              </p>
            </div>
            <button
              onClick={onOpenSsoDialog}
              className="mt-2.5 w-full py-1.5 rounded-xl bg-[#3064AE]/30 hover:bg-[#3064AE]/50 border border-[#C5E5EC]/30 text-[#C5E5EC] hover:text-white font-bold text-xs transition cursor-pointer"
            >
              {currentUser.isStudentVerified ? (language === 'vi' ? 'Xem Trường Học' : 'View Campus') : (language === 'vi' ? 'Cổng Trường SSO →' : 'Campus SSO →')}
            </button>
          </div>

          {/* Card 3: Edu Email */}
          <div className="p-3.5 rounded-2xl bg-[#12233B] border border-sky-400/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-extrabold text-white text-xs flex items-center space-x-1.5">
                  <Mail className="w-4 h-4 text-sky-400" />
                  <span>{t('eduEmailTitle')}</span>
                </span>
                {currentUser.isEduVerified ? (
                  <span className="text-sky-300 font-bold text-[10px] flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-0.5 text-sky-400" /> {t('verifiedStatus')}
                  </span>
                ) : (
                  <span className="text-sky-300 font-bold px-1.5 py-0.2 rounded bg-sky-500/15 border border-sky-400/30 text-[9px]">
                    {language === 'vi' ? 'Nhận Tích Xanh' : 'Get Verified'}
                  </span>
                )}
              </div>
              <p className="text-[#C5E5EC]/70 text-[10px] leading-relaxed">
                {t('eduEmailDesc')}
              </p>
            </div>
            <button
              onClick={() => setShowEduModal(true)}
              className="mt-2.5 w-full py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 hover:text-white font-bold text-xs transition cursor-pointer"
            >
              {currentUser.isEduVerified ? (language === 'vi' ? 'Xem Email .edu' : 'View .edu Email') : (language === 'vi' ? 'Xác Thực Email →' : 'Verify Email →')}
            </button>
          </div>
        </div>
      </div>

      {/* 3. THẺ KỸ NĂNG & LĨNH VỰC NHẬN VIỆC */}
      <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/25 p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-[#C5E5EC]" />
            <span>{t('skillsSectionTitle')}</span>
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#12233B] border border-[#C5E5EC]/25 text-[#E0FAEB] font-bold">
            {skills.length} / {maxSkills} {language === 'vi' ? 'kỹ năng' : 'skills'}
          </span>
        </div>

        <p className="text-[#C5E5EC]/70 text-[11px] leading-relaxed">
          {t('skillsSectionDesc')}
        </p>

        {/* Current Skills list */}
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20 text-[#E0FAEB] text-xs font-bold"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-[#C5E5EC]/60 hover:text-rose-400 cursor-pointer transition"
                  title={language === 'vi' ? 'Xóa kỹ năng' : 'Remove skill'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-[#12233B]/50 border border-[#C5E5EC]/15 text-center text-[11px] text-[#C5E5EC]/60 italic">
            {language === 'vi'
              ? 'Chưa có thẻ kỹ năng nào. Hãy thêm kỹ năng để bắt đầu nhận việc phù hợp!'
              : 'No skill tags added yet. Add your skills to start matching gigs!'}
          </div>
        )}

        {/* Add Skill form */}
        <form onSubmit={handleAddSkill} className="space-y-1 pt-1">
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={30}
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              disabled={skills.length >= maxSkills}
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white text-xs placeholder:text-[#C5E5EC]/40 focus:outline-none focus:border-[#3064AE] disabled:opacity-50"
              placeholder={
                skills.length >= maxSkills
                  ? language === 'vi'
                    ? `Đã đạt tối đa ${maxSkills} kỹ năng`
                    : `Reached max ${maxSkills} skills`
                  : language === 'vi'
                  ? 'Thêm kỹ năng mới (VD: Thiết kế Canva, Lập trình C++...)'
                  : 'Add new skill (e.g. Canva Design, Python...)'
              }
            />
            <button
              type="submit"
              disabled={skills.length >= maxSkills || !newSkill.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#3064AE] to-[#255294] text-white font-extrabold text-xs transition border border-[#C5E5EC]/30 flex items-center space-x-1 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Thêm' : 'Add'}</span>
            </button>
          </div>
          <div className="flex justify-between items-center text-[10px] text-[#C5E5EC]/60 px-1">
            <span>{language === 'vi' ? 'Tối đa 30 ký tự mỗi kỹ năng' : 'Max 30 characters per skill'}</span>
            <span>{newSkill.trim().length}/30</span>
          </div>
        </form>
      </div>

      {/* 4. BẢO MẬT & TIỆN ÍCH ỨNG DỤNG */}
      <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/25 p-5 sm:p-6 shadow-xl space-y-2.5">
        <h3 className="text-sm font-extrabold text-white mb-1">{t('securitySectionTitle')}</h3>

        {/* 1. BIOMETRICS (VÂN TAY / FACEID) */}
        <div className="w-full p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/15 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Fingerprint className="w-5 h-5 text-[#E0FAEB]" />
            <div>
              <h4 className="font-bold text-white text-xs flex items-center space-x-2">
                <span>{t('biometricsTitle')}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                  currentUser.isBiometricsEnabled
                    ? 'bg-[#E0FAEB]/20 text-[#E0FAEB] border border-[#E0FAEB]/30'
                    : 'bg-slate-700/50 text-slate-300'
                }`}>
                  {currentUser.isBiometricsEnabled ? (language === 'vi' ? 'Đang Bật' : 'Enabled') : (language === 'vi' ? 'Chưa Bật' : 'Disabled')}
                </span>
              </h4>
              <p className="text-[10px] text-[#C5E5EC]/70">
                {t('biometricsDesc')}
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
            {currentUser.isBiometricsEnabled ? (language === 'vi' ? 'Cấu Hình' : 'Settings') : (language === 'vi' ? 'Kích Hoạt' : 'Enable')}
          </button>
        </div>

        {/* 2. MÃ PIN VÍ BẢO MẬT 6 SỐ */}
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
          className="w-full p-3.5 rounded-2xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/15 flex items-center justify-between transition text-left cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <KeyRound className="w-5 h-5 text-[#C5E5EC]" />
            <div>
              <h4 className="font-bold text-white text-xs flex items-center space-x-2">
                <span>{t('pinSecurityTitle')}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                  hasExistingPin
                    ? 'bg-[#E0FAEB]/20 text-[#E0FAEB] border border-[#E0FAEB]/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {hasExistingPin ? (language === 'vi' ? 'Đã có PIN' : 'Active PIN') : (language === 'vi' ? 'Chưa có PIN' : 'No PIN')}
                </span>
              </h4>
              <p className="text-[10px] text-[#C5E5EC]/70">
                {t('pinSecurityDesc')}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#C5E5EC]/60" />
        </button>

        {/* 3. CLOUD FRIEND BACKUP & RESTORE */}
        <button
          type="button"
          onClick={() => setShowBackupModal(true)}
          className="w-full p-3.5 rounded-2xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/15 flex items-center justify-between transition text-left cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <Cloud className="w-5 h-5 text-sky-400" />
            <div>
              <h4 className="font-bold text-white text-xs flex items-center space-x-1.5">
                <span>{t('cloudBackupTitle')}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">Cloud Sync</span>
              </h4>
              <p className="text-[10px] text-[#C5E5EC]/70">
                {t('cloudBackupDesc')}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#C5E5EC]/60" />
        </button>

        {/* 4. QUYỀN RIÊNG TƯ SỐ ĐIỆN THOẠI (PHONE PRIVACY GUARD) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setShowPhonePrivacyModal(true);
          }}
          className="w-full p-3.5 rounded-2xl bg-[#12233B] hover:bg-[#162B48] border border-[#C5E5EC]/15 flex items-center justify-between transition text-left cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <Phone className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="font-bold text-white text-xs flex items-center space-x-2">
                <span>{language === 'vi' ? 'Quyền Riêng Tư Số Điện Thoại' : 'Phone Privacy Guard'}</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                  currentUser.phonePrivacy === 'PRIVATE'
                    ? 'bg-slate-700/60 text-slate-300 border-slate-600'
                    : currentUser.phonePrivacy === 'PUBLIC'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                }`}>
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

        {/* 4. MASTER ADMIN PANEL ENTRY (CHỈ DÀNH CHO ROOT ADMIN 000000000) */}
        {isSuperAdmin && (
          <button
            id="admin-dashboard-link-btn"
            type="button"
            onClick={onOpenAdminDashboard}
            className="w-full p-3.5 rounded-2xl bg-red-950/40 hover:bg-red-950/60 border border-red-500/40 flex items-center justify-between transition text-left cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <div>
                <h4 className="font-extrabold text-red-300 text-xs">{t('adminPanel')}</h4>
                <p className="text-[10px] text-red-400/80">
                  {language === 'vi'
                    ? 'Quản lý người dùng toàn sàn, quỹ Escrow, phân xử tranh chấp'
                    : 'Manage platform users, Escrow vaults, and disputes'}
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-red-500 text-white font-bold">Admin</span>
          </button>
        )}

        {/* 5. LOGOUT */}
        <button
          type="button"
          onClick={logout}
          className="w-full p-3.5 rounded-2xl bg-[#12233B] hover:bg-red-950/30 border border-[#C5E5EC]/15 hover:border-red-500/40 flex items-center justify-between transition text-left text-red-400 cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <LogOut className="w-5 h-5" />
            <span className="font-extrabold text-xs">{t('logoutDevice')}</span>
          </div>
        </button>
      </div>

      {/* PIN SETUP / CHANGE MODAL */}
      {showPinModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPinModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
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
              {/* Account password (required for both create and change) */}
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
                    className="absolute right-3 top-2.5 text-[#C5E5EC]/60 hover:text-white cursor-pointer"
                  >
                    {showPinPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* If user already has PIN: Old PIN input */}
              {hasExistingPin && (
                <div>
                  <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                    {language === 'vi' ? 'Mã PIN 6 số cũ hiện tại' : 'Current 6-digit PIN'}{' '}
                    <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono tracking-widest text-center text-base font-bold focus:border-[#C5E5EC] focus:outline-none"
                    placeholder="••••••"
                  />
                </div>
              )}

              {/* New PIN */}
              <div>
                <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                  {language === 'vi' ? 'Mã PIN 6 số mới' : 'New 6-digit PIN'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono tracking-widest text-center text-base font-bold focus:border-[#C5E5EC] focus:outline-none"
                  placeholder="••••••"
                />
              </div>

              {/* Confirm New PIN */}
              <div>
                <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                  {language === 'vi' ? 'Nhập lại Mã PIN 6 số mới' : 'Re-enter new 6-digit PIN'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono tracking-widest text-center text-base font-bold focus:border-[#C5E5EC] focus:outline-none"
                  placeholder="••••••"
                />
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#C5E5EC] font-bold text-xs transition cursor-pointer"
                >
                  {language === 'vi' ? 'Hủy Bỏ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPin}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-black text-xs hover:brightness-110 shadow-lg border border-[#E0FAEB]/30 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPin
                    ? language === 'vi'
                      ? 'Đang xử lý...'
                      : 'Processing...'
                    : hasExistingPin
                    ? language === 'vi'
                      ? 'Cập Nhật Mã PIN'
                      : 'Update PIN'
                    : language === 'vi'
                    ? 'Kích Hoạt Mã PIN'
                    : 'Activate PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BIOMETRICS CONFIRMATION MODAL */}
      {showBioModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBioModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/30 p-6 text-white shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-[#C5E5EC]/20">
              <h3 className="font-extrabold text-sm flex items-center space-x-2 text-[#E0FAEB]">
                <Fingerprint className="w-5 h-5 text-[#C5E5EC]" />
                <span>
                  {currentUser.isBiometricsEnabled
                    ? language === 'vi'
                      ? 'Đổi / Tắt Dấu Vân Tay'
                      : 'Modify / Disable Biometrics'
                    : language === 'vi'
                    ? 'Kích Hoạt Dấu Vân Tay'
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
                  ? 'Để thay đổi vân tay hoặc tắt tính năng, bạn cần nhập Mật Khẩu tài khoản + xác nhận vân tay cũ trên thiết bị.'
                  : 'To change or disable biometrics, enter your account password and verify your fingerprint.'
                : language === 'vi'
                ? 'Để kích hoạt dấu vân tay, bạn cần nhập Mật Khẩu tài khoản để xác nhận trước khi liên kết cảm biến.'
                : 'To enable biometrics, enter your account password before linking the sensor.'}
            </p>

            {bioError && (
              <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{bioError}</span>
              </div>
            )}

            <form onSubmit={handleBioSubmit} className="space-y-3.5 text-xs">
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
                    placeholder={language === 'vi' ? 'Nhập mật khẩu tài khoản' : 'Enter account password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowBioPassword(!showBioPassword)}
                    className="absolute right-3 top-2.5 text-[#C5E5EC]/60 hover:text-white cursor-pointer"
                  >
                    {showBioPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sensor Scan Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleTriggerBioScan}
                  disabled={isScanningBio}
                  className={`w-full py-3 rounded-2xl border transition flex items-center justify-center space-x-2 cursor-pointer ${
                    bioScanned
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-[#E0FAEB]'
                      : 'bg-[#12233B] hover:bg-[#162B48] border-[#3064AE]/40 text-white'
                  }`}
                >
                  {isScanningBio ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>
                        {language === 'vi' ? 'Đang quét cảm biến vân tay...' : 'Scanning fingerprint sensor...'}
                      </span>
                    </>
                  ) : bioScanned ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold">
                        {language === 'vi' ? 'Đã xác nhận vân tay thành công!' : 'Fingerprint confirmed successfully!'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4 text-[#E0FAEB]" />
                      <span>
                        {currentUser.isBiometricsEnabled
                          ? language === 'vi'
                            ? 'Chạm Quét Vân Tay Cũ Để Xác Nhận'
                            : 'Tap to Verify Fingerprint'
                          : language === 'vi'
                          ? 'Chạm Quét Cảm Biến Để Đăng Ký Vân Tay'
                          : 'Tap Sensor to Register Fingerprint'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBioModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#C5E5EC] font-bold text-xs transition cursor-pointer"
                >
                  {language === 'vi' ? 'Hủy Bỏ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBio || !bioScanned}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-black text-xs hover:brightness-110 shadow-lg border border-[#E0FAEB]/30 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingBio
                    ? language === 'vi'
                      ? 'Đang lưu...'
                      : 'Saving...'
                    : currentUser.isBiometricsEnabled
                    ? language === 'vi'
                      ? 'Xác Nhận Tắt / Đổi'
                      : 'Confirm Disable / Change'
                    : language === 'vi'
                    ? 'Kích Hoạt Vân Tay'
                    : 'Activate Biometrics'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL (HỌ VÀ TÊN ĐỆM / TÊN TÁCH BIỆT - GỘP KHÔNG QUÁ 30 KÝ TỰ) */}
      {showEditProfileModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditProfileModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-[#0E1B2E] border border-cyan-500/30 p-5 sm:p-6 text-white shadow-2xl my-6 space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-[#C5E5EC]/20">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    {language === 'vi' ? 'Chỉnh Sửa Hồ Sơ Cá Nhân' : 'Edit Personal Profile'}
                  </h3>
                  <p className="text-[10px] text-[#C5E5EC]/70">
                    {language === 'vi'
                      ? 'Cập nhật thông tin hiển thị với cộng đồng sinh viên'
                      : 'Update information visible to the campus community'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="p-1 rounded-xl text-[#C5E5EC]/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              {/* Split Name Fields: Họ và tên đệm + Tên */}
              <div className="space-y-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[#C5E5EC]/90 mb-1 font-bold">
                      {language === 'vi' ? 'Họ và tên đệm' : 'Last and Middle Name'}{' '}
                      <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={25}
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/30 text-white font-bold text-xs focus:outline-none focus:border-cyan-400"
                      placeholder={language === 'vi' ? 'Ví dụ: Nguyễn Văn' : 'e.g. Smith'}
                    />
                  </div>
                  <div>
                    <label className="block text-[#C5E5EC]/90 mb-1 font-bold">
                      {language === 'vi' ? 'Tên' : 'First Name'} <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={15}
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/30 text-white font-bold text-xs focus:outline-none focus:border-cyan-400"
                      placeholder={language === 'vi' ? 'Ví dụ: An' : 'e.g. John'}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-[#C5E5EC]/70 px-1 pt-0.5">
                  <span>
                    {language === 'vi'
                      ? 'Ví dụ: Họ và tên đệm: Nguyễn Văn / Tên: An. Gộp lại không quá 30 ký tự.'
                      : 'e.g. Combined full name cannot exceed 30 characters.'}
                  </span>
                  <span
                    className={`font-mono ${
                      (editLastName.trim() + ' ' + editFirstName.trim()).trim().length > 30
                        ? 'text-rose-400 font-bold'
                        : ''
                    }`}
                  >
                    {(editLastName.trim() + ' ' + editFirstName.trim()).trim().length}/30
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[#C5E5EC]/80 mb-1 font-bold">
                  {language === 'vi' ? 'Số điện thoại liên hệ' : 'Contact Phone'}
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/30 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  placeholder={language === 'vi' ? 'Ví dụ: 0909120918' : 'e.g. 0909120918'}
                />

                {/* Phone Privacy Radio Selector */}
                <div className="mt-2 p-2.5 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/15 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#C5E5EC]">
                    <span className="flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{language === 'vi' ? 'Quyền riêng tư hiển thị số điện thoại:' : 'Phone privacy:'}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    {[
                      {
                        key: 'ESCROW_ONLY',
                        icon: '🛡️',
                        title: language === 'vi' ? 'Chỉ khi Escrow' : 'Escrow Only',
                        desc: language === 'vi' ? 'Hiện khi đã nhận việc / cọc đồ' : 'Visible upon contract/deposit',
                        rec: true,
                      },
                      {
                        key: 'PRIVATE',
                        icon: '🔒',
                        title: language === 'vi' ? 'Ẩn hoàn toàn' : 'Hidden',
                        desc: language === 'vi' ? 'Chỉ chat nội bộ GigMe' : 'In-app chat only',
                      },
                      {
                        key: 'PUBLIC',
                        icon: '🌐',
                        title: language === 'vi' ? 'Công khai' : 'Public',
                        desc: language === 'vi' ? 'Hiện số trên hồ sơ' : 'Always visible',
                      },
                    ].map((p) => {
                      const isSel = editPhonePrivacy === p.key;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection');
                            setEditPhonePrivacy(p.key as PhonePrivacyMode);
                          }}
                          className={`p-2 rounded-xl border text-left transition cursor-pointer relative ${
                            isSel
                              ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-xs ring-1 ring-cyan-400/40'
                              : 'bg-[#12233B] border-[#C5E5EC]/15 text-[#C5E5EC]/70 hover:text-white'
                          }`}
                        >
                          {p.rec && (
                            <span className="absolute top-1 right-1 text-[8px] font-bold px-1 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                              {language === 'vi' ? 'Khuyên dùng' : 'Best'}
                            </span>
                          )}
                          <div className="text-xs">{p.icon}</div>
                          <div className="font-extrabold text-[10px] mt-0.5">{p.title}</div>
                          <div className="text-[9px] text-[#C5E5EC]/60 leading-tight mt-0.5">{p.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[#C5E5EC]/80 mb-1 font-bold flex items-center justify-between">
                  <span>{language === 'vi' ? 'Trường Đại Học / Cao Đẳng / Ký Túc Xá' : 'University / College / Dormitory'}</span>
                  <span className="text-[10px] text-cyan-400 font-normal">
                    {language === 'vi' ? 'Chọn nhanh hoặc tự nhập' : 'Quick select or custom'}
                  </span>
                </label>
                <input
                  type="text"
                  value={editSchool}
                  onChange={(e) => setEditSchool(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/30 text-white text-xs focus:outline-none focus:border-cyan-400 font-semibold"
                  placeholder={
                    language === 'vi'
                      ? 'Ví dụ: ĐH Bách Khoa, ĐH Kinh Tế, ĐH Quốc Gia...'
                      : 'e.g. University of Technology, Dorm B...'
                  }
                />
                {/* University quick chips */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['ĐH Bách Khoa', 'ĐH Kinh Tế', 'ĐH Quốc Gia', 'ĐH Sư Phạm Kỹ Thuật', 'ĐH Ngoại Thương', 'ĐH CNTT', 'ĐH Y Dược'].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setEditSchool(u)}
                      className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold transition cursor-pointer ${
                        editSchool === u
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-[#182C48] border-[#C5E5EC]/20 text-[#C5E5EC]/70 hover:text-white'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#C5E5EC]/80 mb-1 font-bold flex items-center justify-between">
                  <span>{language === 'vi' ? 'Khoa / Viện / Chuyên Ngành Đào Tạo' : 'Faculty / Department'}</span>
                  <span className="text-[10px] text-[#E0FAEB] font-normal">
                    {language === 'vi' ? 'Gắn huy hiệu uy tín' : 'Verified badge'}
                  </span>
                </label>
                <input
                  type="text"
                  value={editFaculty}
                  onChange={(e) => setEditFaculty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/30 text-white text-xs focus:outline-none focus:border-cyan-400 font-semibold"
                  placeholder={
                    language === 'vi'
                      ? 'Ví dụ: Khoa CNTT, Quản Trị Kinh Doanh, Khoa Cơ Khí...'
                      : 'e.g. Computer Science, Business Administration...'
                  }
                />
                {/* Faculty quick chips */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['Khoa CNTT', 'Quản Trị Kinh Doanh', 'Khoa Cơ Khí', 'Khoa Ngoại Ngữ', 'Khoa Điện - Điện Tử', 'Khoa Y Dược'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setEditFaculty(f)}
                      className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold transition cursor-pointer ${
                        editFaculty === f
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-[#182C48] border-[#C5E5EC]/20 text-[#C5E5EC]/70 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Campus Badge Preview */}
              {editSchool.trim() && (
                <div className="p-2.5 rounded-2xl bg-[#0A1628] border border-cyan-500/30 flex items-center justify-between">
                  <span className="text-[10px] text-[#C5E5EC]/80 font-bold">
                    {language === 'vi' ? 'Xem trước Huy Hiệu Học Đường:' : 'Campus Badge Preview:'}
                  </span>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-[#E0FAEB] border border-cyan-400/40 text-[10px] font-bold">
                    <GraduationCap className="w-3 h-3 text-cyan-300" />
                    <span>{editSchool.trim()}{editFaculty.trim() ? ` • ${editFaculty.trim()}` : ''} ✓</span>
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[#C5E5EC]/80 mb-1 font-bold">
                  {language === 'vi' ? 'Giới thiệu bản thân (Bio / Slogan)' : 'Bio / Short Introduction'}
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/30 text-white text-xs focus:outline-none focus:border-cyan-400"
                  placeholder={
                    language === 'vi'
                      ? 'Ví dụ: Sinh viên năm 3 chăm chỉ, chuyên gia sư Toán & hỗ trợ cài máy tính, giao hàng KTX siêu nhanh!'
                      : 'e.g. 3rd-year hardworking student, math tutor, laptop maintenance & fast dorm deliveries!'
                  }
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#C5E5EC] font-bold text-xs transition cursor-pointer"
                >
                  {language === 'vi' ? 'Hủy Bỏ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-extrabold text-xs shadow-lg shadow-cyan-900/40 transition cursor-pointer"
                >
                  {language === 'vi' ? 'Lưu Thay Đổi' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHONE PRIVACY GUARD STANDALONE MODAL */}
      {showPhonePrivacyModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPhonePrivacyModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/30 p-5 sm:p-6 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center pb-3 border-b border-[#C5E5EC]/20">
              <h3 className="font-extrabold text-sm flex items-center space-x-2 text-[#E0FAEB]">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>
                  {language === 'vi' ? 'Quyền Riêng Tư Số Điện Thoại' : 'Phone Number Privacy Guard'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPhonePrivacyModal(false)}
                className="text-[#C5E5EC]/70 hover:text-white p-1 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-[#C5E5EC]/80 leading-relaxed">
              {language === 'vi'
                ? 'Bảo vệ thông tin cá nhân của bạn khỏi các cuộc gọi làm phiền, chào mời tiếp thị hoặc quấy rối ngoài giờ. Bạn có toàn quyền quyết định ai được xem số điện thoại của mình:'
                : 'Protect your phone number from spam or after-hours calls. You have full control over who can view your contact number:'}
            </p>

            <div className="space-y-2.5">
              {[
                {
                  key: 'ESCROW_ONLY',
                  icon: '🛡️',
                  title: language === 'vi' ? 'Chỉ khi giao dịch Escrow' : 'Escrow Partners Only',
                  badge: language === 'vi' ? 'Khuyên dùng bảo vệ sinh viên' : 'Recommended',
                  badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
                  desc: language === 'vi'
                    ? 'Người thuê hoặc người mua chỉ xem được SĐT khi bạn và họ đã cọc giữ đồ hoặc đã nhận việc qua Smart Escrow.'
                    : 'Your phone is hidden from public view and only revealed to users with an active Escrow contract or reservation.',
                  preview: currentUser.phone ? `${currentUser.phone.slice(0, 4)} ••• ${currentUser.phone.slice(-3)}` : '0909 ••• 918',
                },
                {
                  key: 'PRIVATE',
                  icon: '🔒',
                  title: language === 'vi' ? 'Ẩn hoàn toàn (Bảo mật tối đa)' : 'Completely Private',
                  badge: language === 'vi' ? 'Bảo mật 100%' : '100% Private',
                  badgeColor: 'bg-slate-700/60 text-slate-300 border-slate-600',
                  desc: language === 'vi'
                    ? 'Luôn che số điện thoại với tất cả mọi người. Mọi trao đổi bắt buộc qua hệ thống Chat bảo mật của GigMe.'
                    : 'Your phone number is always hidden. All communications must go through GigMe encrypted in-app chat.',
                  preview: currentUser.phone ? `${currentUser.phone.slice(0, 4)} ••• •••` : '0909 ••• •••',
                },
                {
                  key: 'PUBLIC',
                  icon: '🌐',
                  title: language === 'vi' ? 'Hiển thị công khai' : 'Public Display',
                  badge: language === 'vi' ? 'Công khai' : 'Public',
                  badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
                  desc: language === 'vi'
                    ? 'Bất kỳ sinh viên nào vào xem hồ sơ hoặc tìm kiếm bạn đều có thể thấy và gọi trực tiếp.'
                    : 'Anyone on campus can view your full phone number on your profile.',
                  preview: currentUser.phone || '0909120918',
                },
              ].map((opt) => {
                const isSelected = (currentUser.phonePrivacy || 'ESCROW_ONLY') === opt.key;
                return (
                  <div
                    key={opt.key}
                    onClick={() => handleQuickChangePhonePrivacy(opt.key as PhonePrivacyMode)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#18345E] border-cyan-400 ring-1 ring-cyan-400/50'
                        : 'bg-[#12233B] border-[#C5E5EC]/15 hover:bg-[#162B48]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{opt.icon}</span>
                        <div>
                          <h4 className="font-extrabold text-xs text-white flex items-center space-x-2">
                            <span>{opt.title}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${opt.badgeColor}`}>
                              {opt.badge}
                            </span>
                          </h4>
                          <span className="text-[10px] font-mono text-[#E0FAEB]">
                            {language === 'vi' ? 'Hiển thị:' : 'Preview:'} <strong>{opt.preview}</strong>
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-500 text-black'
                            : 'border-[#C5E5EC]/30 bg-[#0E1B2E]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-[#C5E5EC]/70 mt-1.5 leading-relaxed pl-7">
                      {opt.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPhonePrivacyModal(false)}
                className="px-4 py-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-white font-bold text-xs transition cursor-pointer"
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTHER DIALOGS */}
      <BusinessUpgradeDialog isOpen={showBusinessModal} onClose={() => setShowBusinessModal(false)} />
      <AvatarPickerModal isOpen={showAvatarModal} onClose={() => setShowAvatarModal(false)} />
      <StudentEloModal isOpen={showEloModal} onClose={() => setShowEloModal(false)} />
      <EduEmailVerificationModal isOpen={showEduModal} onClose={() => setShowEduModal(false)} />
      <FriendBackupRestoreModal isOpen={showBackupModal} onClose={() => setShowBackupModal(false)} />
    </div>
  );
};
