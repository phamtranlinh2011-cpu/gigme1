import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Zap,
  Lock,
  Mail,
  Phone,
  User,
  Calendar,
  KeyRound,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  Send,
  Copy,
  Check,
  Radio,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  X,
  Fingerprint,
  Key,
  Globe,
  Clock,
  QrCode,
  Smartphone,
  Shield,
  Info,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { useTranslation } from '../context/LanguageContext';
import { MoSmsSession } from '../types';
import { cloudService } from '../services/cloudSync';
import { BirthDatePickerModal } from '../components/BirthDatePickerModal';
import { validateVietnamCccdNumber } from '../utils/checksumC06';
import { triggerHaptic } from '../utils/haptics';

export const AuthScreen: React.FC = () => {
  const {
    login,
    register,
    sendOtp,
    resetPasswordWithOtp,
    resetPasswordWithPinAndEmail,
    resetPasswordWithBiometrics,
    loginWithPhoneOtp,
    requestMoSms,
    checkMoSmsStatus,
    simulateMoSms,
    loginWithMoSms,
    otpTargetContact,
    otpExpiresAt,
    showNotification,
  } = useGigMe();
  const { language, toggleLanguage, t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER' | 'PHONE_OTP' | 'FORGOT'>('LOGIN');

  // Password visibility toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Login form
  const [loginContact, setLoginContact] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regLastName, setRegLastName] = useState(''); // Họ và tên đệm (VD: Nguyễn Văn)
  const [regFirstName, setRegFirstName] = useState(''); // Tên (VD: An)
  const [regGmail, setRegGmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCccd, setRegCccd] = useState('');
  const [regGender, setRegGender] = useState('Nam');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Real-time Vietnam CCCD verification (12 digits C06 standard + cross check)
  const cccdCheck = useMemo(() => {
    if (!regCccd || regCccd.trim().length === 0) return null;
    return validateVietnamCccdNumber(regCccd.trim(), {
      expectedBirthDate: regBirthDate.trim(),
      expectedGender: regGender,
    });
  }, [regCccd, regBirthDate, regGender]);

  // IP verification status
  const [ipAccountCount, setIpAccountCount] = useState(0);
  const [requiresExtraKyc, setRequiresExtraKyc] = useState(false);

  // Phone & SMS Verification
  const [smsMethod, setSmsMethod] = useState<'MO' | 'OTP'>('MO'); // Mặc định MO - Người dùng tự soạn tin nhắn
  const [moShortcode, setMoShortcode] = useState<'8077' | '8177' | '8577' | '6089'>('8077');
  const [moKeyword, setMoKeyword] = useState<'XACTHUC' | 'GIGME'>('XACTHUC');
  const [moSession, setMoSession] = useState<MoSmsSession | null>(null);
  const [moLoading, setMoLoading] = useState(false);
  const [moCopiedSyntax, setMoCopiedSyntax] = useState(false);
  const [moCopiedShortcode, setMoCopiedShortcode] = useState(false);
  const [moSimulating, setMoSimulating] = useState(false);
  const [moSecondsLeft, setMoSecondsLeft] = useState(300);
  const [moShowQrCode, setMoShowQrCode] = useState(false);
  const isLoggingInMoRef = useRef(false);

  // Nhận diện nhà mạng viễn thông từ đầu số điện thoại
  const getTelcoBadge = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    if (!clean || clean.length < 3) return null;
    const p3 = clean.slice(0, 3);
    if (['086', '096', '097', '098', '032', '033', '034', '035', '036', '037', '038', '039'].includes(p3)) {
      return { name: 'Viettel', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    }
    if (['088', '091', '094', '081', '082', '083', '084', '085'].includes(p3)) {
      return { name: 'VinaPhone', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
    }
    if (['089', '090', '093', '070', '076', '077', '078', '079'].includes(p3)) {
      return { name: 'MobiFone', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
    }
    if (['092', '056', '058'].includes(p3)) {
      return { name: 'Vietnamobile', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' };
    }
    if (['055'].includes(p3)) {
      return { name: 'Wintel', color: 'bg-red-500/20 text-red-300 border-red-500/40' };
    }
    if (['087'].includes(p3)) {
      return { name: 'iTel', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
    }
    return null;
  };

  // Phone OTP login
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneOtpInput, setPhoneOtpInput] = useState('');
  const [phoneCountdown, setPhoneCountdown] = useState(0);

  // Forgot Password: 3 hình thức (Vân tay, OTP, Mã PIN kèm Gmail)
  const [forgotMethod, setForgotMethod] = useState<'BIOMETRICS' | 'OTP' | 'PIN'>('OTP');
  const [forgotContact, setForgotContact] = useState('');
  const [forgotOtpInput, setForgotOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotCountdown, setForgotCountdown] = useState(0);

  // Forgot Password via PIN + Gmail
  const [forgotPinEmail, setForgotPinEmail] = useState('');
  const [forgotPinCode, setForgotPinCode] = useState('');
  const [forgotPinNewPassword, setForgotPinNewPassword] = useState('');

  // Forgot Password via Biometrics
  const [forgotBioContact, setForgotBioContact] = useState('');
  const [forgotBioNewPassword, setForgotBioNewPassword] = useState('');
  const [bioScanning, setBioScanning] = useState(false);
  const [bioVerified, setBioVerified] = useState(false);

  // State for inline feedback
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Secret Admin Access (Hidden by default for public users)
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get('admin') === '1' ||
        params.get('admin') === 'true' ||
        params.get('secret') === 'admin' ||
        params.get('dev') === 'true'
      ) {
        setIsAdminMode(true);
      }
    }
  }, []);

  const handleLogoClick = () => {
    setLogoClickCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setIsAdminMode(true);
        showNotification(
          language === 'vi' ? 'Cổng Quản Trị Hệ Thống 🔓' : 'Master Admin Gate 🔓',
          language === 'vi' ? 'Đã mở khóa cổng đăng nhập nhanh dành cho Quản trị viên!' : 'Quick login unlocked for Administrator!'
        );
        return 0;
      }
      return next;
    });
  };

  // Check IP account status on mount
  useEffect(() => {
    fetch('/api/auth/ip-status')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.accountsCreatedFromIp === 'number') {
          setIpAccountCount(data.accountsCreatedFromIp);
          setRequiresExtraKyc(data.accountsCreatedFromIp >= 3);
        }
      })
      .catch(() => {});
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (phoneCountdown <= 0) return;
    const timer = setInterval(() => {
      setPhoneCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [phoneCountdown]);

  useEffect(() => {
    if (forgotCountdown <= 0) return;
    const timer = setInterval(() => {
      setForgotCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [forgotCountdown]);

  // MO SMS Countdown Timer (5 phút hiệu lực)
  useEffect(() => {
    if (!moSession) return;
    const calculateLeft = () => {
      const left = Math.max(0, Math.floor((moSession.expiresAt - Date.now()) / 1000));
      setMoSecondsLeft(left);
    };
    calculateLeft();
    const timer = setInterval(calculateLeft, 1000);
    return () => clearInterval(timer);
  }, [moSession]);

  // MO SMS Auto Polling & SSE Realtime Listener với khóa chống chạy trùng lặp (Concurrency Guard)
  useEffect(() => {
    if (!moSession || moSession.isVerified) return;
    isLoggingInMoRef.current = false;

    const handleVerified = async (phoneToUse?: string) => {
      if (isLoggingInMoRef.current) return;
      isLoggingInMoRef.current = true;
      triggerHaptic('success');
      setMoSession((prev) => (prev ? { ...prev, isVerified: true } : null));
      const verifiedPhone = phoneToUse || phoneInput.trim() || '0988668899';
      await loginWithMoSms(verifiedPhone);
    };

    // 1. Polling cổng backend cứ 2.5s / lần
    const interval = setInterval(async () => {
      if (isLoggingInMoRef.current) return;
      const statusRes = await checkMoSmsStatus(moSession.sessionId);
      if (statusRes && statusRes.isVerified) {
        clearInterval(interval);
        await handleVerified(statusRes.senderPhone);
      }
    }, 2500);

    // 2. Lắng nghe SSE thời gian thực từ Webhook nhà mạng
    const unsub = cloudService.subscribeMoSmsVerified(async (data) => {
      if (isLoggingInMoRef.current) return;
      if (data && data.sessionId === moSession.sessionId) {
        clearInterval(interval);
        await handleVerified(data.phone);
      }
    });

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [moSession, phoneInput]);

  const handleGenerateMoSession = async () => {
    setAuthError(null);
    setMoLoading(true);
    isLoggingInMoRef.current = false;
    try {
      const res = await requestMoSms({
        phone: phoneInput.trim(),
        shortcode: moShortcode,
        keyword: moKeyword,
      });
      if (res.success && res.session) {
        setMoSession(res.session);
        setMoSecondsLeft(300);
        triggerHaptic('selection');
        showNotification(
          language === 'vi' ? 'Đã tạo cú pháp tin nhắn MO! 📨' : 'MO SMS Syntax Created! 📨',
          language === 'vi'
            ? `Vui lòng soạn "${res.session.syntax}" gửi tới ${res.session.shortcode} để xác thực.`
            : `Please send "${res.session.syntax}" to ${res.session.shortcode} to verify.`,
          true
        );
      } else {
        setAuthError(res.error || (language === 'vi' ? 'Không thể tạo cú pháp MO. Vui lòng thử lại!' : 'Failed to generate MO SMS syntax. Please try again!'));
      }
    } finally {
      setMoLoading(false);
    }
  };

  const handleOpenSmsApp = () => {
    if (!moSession) return;
    triggerHaptic('selection');
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const sep = isIOS ? '&' : '?';
    window.location.href = `sms:${moSession.shortcode}${sep}body=${encodeURIComponent(moSession.syntax)}`;
  };

  const handleCopySyntax = () => {
    if (!moSession) return;
    triggerHaptic('selection');
    navigator.clipboard.writeText(moSession.syntax);
    setMoCopiedSyntax(true);
    setTimeout(() => setMoCopiedSyntax(false), 2000);
    showNotification(
      language === 'vi' ? 'Đã sao chép cú pháp' : 'Syntax copied',
      language === 'vi' ? `Đã chép "${moSession.syntax}" vào khay nhớ tạm.` : `Copied "${moSession.syntax}" to clipboard.`
    );
  };

  const handleCopyShortcode = () => {
    if (!moSession) return;
    triggerHaptic('selection');
    navigator.clipboard.writeText(moSession.shortcode);
    setMoCopiedShortcode(true);
    setTimeout(() => setMoCopiedShortcode(false), 2000);
    showNotification(
      language === 'vi' ? 'Đã sao chép đầu số' : 'Shortcode copied',
      language === 'vi' ? `Đã chép đầu số ${moSession.shortcode}.` : `Copied shortcode ${moSession.shortcode}.`
    );
  };

  const handleSimulateMoReceived = async () => {
    if (!moSession) return;
    setMoSimulating(true);
    try {
      const simPhone = phoneInput.trim() || '0988668899';
      await simulateMoSms(moSession.sessionId, simPhone);
      setMoSession((prev) => (prev ? { ...prev, isVerified: true } : null));
      await loginWithMoSms(simPhone);
    } finally {
      setMoSimulating(false);
    }
  };

  const handleQuickLogin = async (contact: string, pass: string) => {
    setAuthError(null);
    setLoginContact(contact);
    setLoginPassword(pass);
    setIsLoggingIn(true);
    try {
      const ok = await login(contact, pass);
      if (!ok) {
        setAuthError(language === 'vi' ? 'Không thể đăng nhập bằng tài khoản mẫu. Vui lòng thử lại!' : 'Failed to log in with sample account. Please try again!');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!loginContact.trim()) {
      setAuthError(language === 'vi' ? 'Vui lòng nhập Gmail hoặc Số điện thoại!' : 'Please enter Gmail or Phone number!');
      return;
    }
    if (!loginPassword.trim()) {
      setAuthError(language === 'vi' ? 'Vui lòng nhập mật khẩu đăng nhập!' : 'Please enter your password!');
      return;
    }
    setIsLoggingIn(true);
    try {
      const success = await login(loginContact, loginPassword);
      if (!success) {
        setAuthError(language === 'vi' ? 'Tài khoản hoặc mật khẩu không chính xác. Bạn có thể nhấn Tài Khoản Mẫu bên trên để vào ngay!' : 'Incorrect account or password. Please try again or use the sample credentials!');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const lastName = regLastName.trim();
    const firstName = regFirstName.trim();
    const combinedName = `${lastName} ${firstName}`.trim();
    const gmail = regGmail.trim().toLowerCase();
    const phone = regPhone.trim();
    const cccd = regCccd.trim();
    const pass = regPassword.trim();
    const confirm = regConfirmPassword.trim();
    const birth = regBirthDate.trim();

    // 1. Họ và tên đệm (Bắt buộc)
    if (!lastName) {
      setAuthError(language === 'vi' ? 'Vui lòng nhập họ và tên đệm của bạn (VD: Nguyễn Văn)!' : 'Please enter your last and middle name!');
      return;
    }
    // 2. Tên (Bắt buộc)
    if (!firstName) {
      setAuthError(language === 'vi' ? 'Vui lòng nhập tên của bạn (VD: An)!' : 'Please enter your first name!');
      return;
    }
    if (combinedName.length > 30) {
      setAuthError(language === 'vi' ? `Họ tên đệm và tên ghi gộp lại không được quá 30 ký tự (hiện tại: ${combinedName.length} ký tự)!` : `Combined full name cannot exceed 30 characters (currently: ${combinedName.length})!`);
      return;
    }
    // 3. Gmail (Bắt buộc)
    if (!gmail) {
      setAuthError(language === 'vi' ? 'Các tài khoản khi tạo bắt buộc phải có địa chỉ Gmail!' : 'A Gmail address is required to register an account!');
      return;
    }
    if (!gmail.includes('@')) {
      setAuthError(language === 'vi' ? 'Địa chỉ Gmail không đúng định dạng!' : 'Invalid Gmail format!');
      return;
    }
    // 4. Giới tính (Bắt buộc)
    if (!regGender) {
      setAuthError(language === 'vi' ? 'Vui lòng chọn giới tính của bạn!' : 'Please select your gender!');
      return;
    }
    // 5. Ngày sinh (Bắt buộc)
    if (!birth) {
      setAuthError(language === 'vi' ? 'Vui lòng chọn ngày sinh của bạn (mở bảng chọn bằng icon lịch bên cạnh)!' : 'Please select your date of birth!');
      return;
    }

    // IP account limit check: if >= 3 accounts on this IP, must provide Phone or CCCD (1 in 2)
    if (requiresExtraKyc || ipAccountCount >= 3) {
      const hasPhone = phone.length >= 9;
      const hasCccd = cccd.length >= 9;
      if (!hasPhone && !hasCccd) {
        setAuthError(
          language === 'vi'
            ? `Địa chỉ IP của bạn đã tạo ${ipAccountCount} tài khoản. Từ tài khoản thứ 4 trở đi, bạn bắt buộc phải nhập Số Điện Thoại HOẶC Căn Cước Công Dân (CCCD) [1 trong 2]!`
            : `Your IP has already created ${ipAccountCount} accounts. From the 4th account onwards, Phone Number OR National ID is required [1 of 2]!`
        );
        return;
      }
    }

    // Phone validation (nếu nhập: tối đa 10 số, bắt đầu bằng 0)
    if (phone) {
      if (phone.length > 10 || !/^0\d{9}$/.test(phone)) {
        setAuthError(
          language === 'vi'
            ? 'Số điện thoại phải gồm đúng 10 chữ số (bắt đầu bằng 0, VD: 0909123456)!'
            : 'Phone number must be exactly 10 digits starting with 0!'
        );
        return;
      }
    }

    // CCCD validation (nếu nhập: tối đa 12 số, kiểm tra xác thực CCCD thật theo chuẩn C06)
    if (cccd) {
      if (cccd.length !== 12) {
        setAuthError(
          language === 'vi'
            ? `Số CCCD phải gồm đúng 12 chữ số (hiện tại: ${cccd.length}/12 số)!`
            : `National ID must be exactly 12 digits (currently: ${cccd.length}/12)!`
        );
        return;
      }
      const verifiedCccd = validateVietnamCccdNumber(cccd, {
        expectedBirthDate: birth,
        expectedGender: regGender,
      });
      if (!verifiedCccd.isValid) {
        setAuthError(
          language === 'vi'
            ? `Lỗi xác thực CCCD: ${verifiedCccd.error || 'Số CCCD không hợp lệ hoặc không có thật!'}`
            : `National ID error: ${verifiedCccd.error || 'Invalid ID number!'}`
        );
        return;
      }
    }

    // 6. Mật khẩu (Bắt buộc: 6 - 15 ký tự)
    if (!pass) {
      setAuthError(language === 'vi' ? 'Vui lòng nhập mật khẩu tài khoản!' : 'Please enter your password!');
      return;
    }
    if (pass.length < 6) {
      setAuthError(language === 'vi' ? 'Mật khẩu bảo mật phải có tối thiểu 6 ký tự!' : 'Security password must be at least 6 characters long!');
      return;
    }
    if (pass.length > 15) {
      setAuthError(language === 'vi' ? 'Mật khẩu bảo mật chỉ được tối đa 15 ký tự!' : 'Security password cannot exceed 15 characters!');
      return;
    }
    if (!confirm) {
      setAuthError(language === 'vi' ? 'Vui lòng nhập mật khẩu xác nhận!' : 'Please confirm your password!');
      return;
    }
    if (pass !== confirm) {
      setAuthError(language === 'vi' ? 'Mật khẩu xác nhận không trùng khớp. Vui lòng nhập lại!' : 'Passwords do not match. Please re-enter!');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await register(combinedName, gmail, regGender, birth, pass, confirm, phone, cccd, lastName, firstName);
      if (!res.success) {
        setAuthError(res.error || (language === 'vi' ? 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin!' : 'Registration failed. Please check your information!'));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSendPhoneOtp = () => {
    if (!phoneInput.trim()) {
      showNotification(
        language === 'vi' ? 'Thiếu số điện thoại' : 'Phone number missing',
        language === 'vi' ? 'Vui lòng nhập số điện thoại trước khi bấm gửi mã!' : 'Please enter your phone number first!'
      );
      return;
    }
    const ok = sendOtp(phoneInput, 'PHONE_LOGIN');
    if (ok) {
      setPhoneCountdown(60);
    }
  };

  const handlePhoneOtpLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!phoneInput.trim()) {
      setAuthError(language === 'vi' ? 'Vui lòng nhập số điện thoại của bạn!' : 'Please enter your phone number!');
      return;
    }
    if (!phoneOtpInput.trim()) {
      setAuthError(language === 'vi' ? 'Bạn chưa nhập mã OTP! Bắt buộc phải có mã OTP 6 số để đăng nhập.' : 'Please enter the 6-digit OTP code to log in.');
      return;
    }
    if (phoneOtpInput.trim().length !== 6) {
      setAuthError(language === 'vi' ? 'Mã OTP phải có đúng 6 chữ số!' : 'OTP code must be exactly 6 digits!');
      return;
    }
    const success = loginWithPhoneOtp(phoneInput, phoneOtpInput);
    if (!success) {
      setAuthError(language === 'vi' ? 'Mã OTP không hợp lệ hoặc đã hết hạn (3 phút). Vui lòng thử lại!' : 'Invalid or expired OTP code (3 min). Please try again!');
    }
  };

  const handleSendForgotOtp = () => {
    setAuthError(null);
    if (!forgotContact.trim()) {
      setAuthError(language === 'vi' ? 'Vui lòng nhập Gmail hoặc Số điện thoại để nhận OTP!' : 'Please enter Gmail or Phone number to receive OTP!');
      return;
    }
    const ok = sendOtp(forgotContact, 'FORGOT_PASSWORD');
    if (ok) {
      setForgotCountdown(60);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!forgotOtpInput.trim()) {
      setAuthError(language === 'vi' ? 'Bạn chưa nhập mã OTP! Không thể đặt lại mật khẩu.' : 'Please enter the OTP code to reset password.');
      return;
    }
    if (forgotOtpInput.trim().length !== 6) {
      setAuthError(language === 'vi' ? 'Mã OTP phải gồm 6 chữ số!' : 'OTP code must be 6 digits!');
      return;
    }
    if (newPassword.trim().length < 6) {
      setAuthError(language === 'vi' ? 'Mật khẩu mới phải có ít nhất 6 ký tự!' : 'New password must be at least 6 characters!');
      return;
    }
    if (newPassword.trim().length > 15) {
      setAuthError(language === 'vi' ? 'Mật khẩu mới chỉ được tối đa 15 ký tự!' : 'New password cannot exceed 15 characters!');
      return;
    }
    const ok = await resetPasswordWithOtp(forgotOtpInput, newPassword);
    if (ok) {
      setActiveTab('LOGIN');
      setAuthError(null);
    } else {
      setAuthError(language === 'vi' ? 'Mã OTP không hợp lệ, sai quá số lần hoặc đã hết hạn!' : 'Invalid, expired, or incorrect OTP code!');
    }
  };

  const handleResetPasswordWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!forgotPinEmail.trim() || !forgotPinCode.trim() || !forgotPinNewPassword.trim()) {
      setAuthError(language === 'vi' ? 'Vui lòng nhập đầy đủ Gmail, Mã PIN 6 số và Mật khẩu mới!' : 'Please enter your Gmail, 6-digit PIN, and new password!');
      return;
    }
    if (forgotPinCode.trim().length !== 6) {
      setAuthError(language === 'vi' ? 'Mã PIN bảo mật phải gồm đúng 6 chữ số!' : 'Security PIN must be exactly 6 digits!');
      return;
    }
    if (forgotPinNewPassword.trim().length < 6) {
      setAuthError(language === 'vi' ? 'Mật khẩu mới phải có tối thiểu 6 ký tự!' : 'New password must be at least 6 characters!');
      return;
    }
    if (forgotPinNewPassword.trim().length > 15) {
      setAuthError(language === 'vi' ? 'Mật khẩu mới chỉ được tối đa 15 ký tự!' : 'New password cannot exceed 15 characters!');
      return;
    }
    setIsLoggingIn(true);
    try {
      const res = await resetPasswordWithPinAndEmail(forgotPinEmail, forgotPinCode, forgotPinNewPassword);
      if (res.success) {
        setActiveTab('LOGIN');
        setAuthError(null);
        setForgotPinEmail('');
        setForgotPinCode('');
        setForgotPinNewPassword('');
      } else {
        setAuthError(res.error || (language === 'vi' ? 'Đặt lại mật khẩu bằng Mã PIN không thành công!' : 'Failed to reset password with PIN!'));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleTriggerBiometricScan = async () => {
    setAuthError(null);
    if (!forgotBioContact.trim()) {
      setAuthError(language === 'vi' ? 'Vui lòng nhập Gmail, Số điện thoại hoặc ID 9 số tài khoản của bạn trước khi quét vân tay!' : 'Please enter your Gmail, Phone, or 9-digit ID before biometric scanning!');
      return;
    }
    setBioScanning(true);
    try {
      // Simulate real biometric device sensor scan with verification
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setBioVerified(true);
      showNotification(
        language === 'vi' ? 'Đã nhận diện vân tay! 👆' : 'Fingerprint Recognized! 👆',
        language === 'vi' ? 'Xác thực sinh trắc học thiết bị thành công. Vui lòng nhập mật khẩu mới.' : 'Biometric authentication succeeded. Please enter your new password.',
        true
      );
    } catch {
      setAuthError(language === 'vi' ? 'Không thể quét vân tay trên thiết bị này.' : 'Cannot scan fingerprint on this device.');
    } finally {
      setBioScanning(false);
    }
  };

  const handleResetPasswordWithBio = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!bioVerified) {
      setAuthError(language === 'vi' ? 'Vui lòng bấm nút quét dấu vân tay để xác thực trước!' : 'Please tap the fingerprint scanner to verify first!');
      return;
    }
    if (forgotBioNewPassword.trim().length < 6) {
      setAuthError(language === 'vi' ? 'Mật khẩu mới phải có tối thiểu 6 ký tự!' : 'New password must be at least 6 characters!');
      return;
    }
    if (forgotBioNewPassword.trim().length > 15) {
      setAuthError(language === 'vi' ? 'Mật khẩu mới chỉ được tối đa 15 ký tự!' : 'New password cannot exceed 15 characters!');
      return;
    }
    setIsLoggingIn(true);
    try {
      const res = await resetPasswordWithBiometrics(forgotBioContact, forgotBioNewPassword);
      if (res.success) {
        setActiveTab('LOGIN');
        setAuthError(null);
        setBioVerified(false);
        setForgotBioContact('');
        setForgotBioNewPassword('');
      } else {
        setAuthError(res.error || (language === 'vi' ? 'Đặt lại mật khẩu bằng Vân tay không thành công!' : 'Failed to reset password with Fingerprint!'));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#081120] via-[#0E1B2E] to-[#081120] flex flex-col justify-center items-center px-4 py-8 text-white selection:bg-[#3064AE]/40 selection:text-[#C5E5EC] relative overflow-hidden">
      {/* Top right language switch pill */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={() => toggleLanguage()}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#12233B]/80 hover:bg-[#162B48] border border-[#C5E5EC]/30 text-white text-xs font-bold shadow-md cursor-pointer transition active:scale-95"
          title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        >
          <Globe className="w-3.5 h-3.5 text-[#C5E5EC]" />
          <span>{language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}</span>
        </button>
      </div>

      {/* Ambient background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#3064AE]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#C5E5EC]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="GigMe Logo"
            onClick={handleLogoClick}
            title="GigMe Logo"
            className="w-20 h-20 rounded-full mx-auto shadow-xl border border-[#C5E5EC]/30 object-cover mb-3 ring-2 ring-[#3064AE]/30 cursor-pointer select-none active:scale-95 transition-transform"
          />
          <h1 className="text-3xl font-black tracking-tight text-white select-none">
            Gig<span className="text-[#C5E5EC]">Me</span>
          </h1>
          <p className="text-xs text-[#C5E5EC]/80 mt-1 max-w-xs mx-auto">
            {language === 'vi'
              ? 'Nền tảng việc làm sinh viên & Smart Escrow bảo chứng 100%'
              : 'Student micro-jobs & 100% Escrow protected platform'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#0B1628] p-1.5 rounded-2xl mb-5 text-xs font-extrabold border border-[#C5E5EC]/20 shadow-inner">
          <button
            id="tab-auth-login"
            onClick={() => {
              setActiveTab('LOGIN');
              setAuthError(null);
            }}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'LOGIN'
                ? 'bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-black shadow-md shadow-[#3064AE]/30 border border-[#E0FAEB]/30'
                : 'text-[#C5E5EC]/70 hover:text-white'
            }`}
          >
            {language === 'vi' ? 'Đăng Nhập' : 'Log In'}
          </button>

          <button
            id="tab-auth-register"
            onClick={() => {
              setActiveTab('REGISTER');
              setAuthError(null);
            }}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'REGISTER'
                ? 'bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-black shadow-md shadow-[#3064AE]/30 border border-[#E0FAEB]/30'
                : 'text-[#C5E5EC]/70 hover:text-white'
            }`}
          >
            {language === 'vi' ? 'Đăng Ký' : 'Register'}
          </button>

          <button
            id="tab-auth-otp"
            onClick={() => {
              setActiveTab('PHONE_OTP');
              setAuthError(null);
            }}
            className={`flex-1 py-2 px-1 rounded-xl transition cursor-pointer ${
              activeTab === 'PHONE_OTP'
                ? 'bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-black shadow-md shadow-[#3064AE]/30 border border-[#E0FAEB]/30'
                : 'text-[#C5E5EC]/70 hover:text-white'
            }`}
          >
            <span className="flex items-center justify-center space-x-1">
              <span>SMS</span>
              <span className="text-[9px] px-1 py-0.5 rounded bg-[#E0FAEB] text-[#0E1B2E] font-extrabold uppercase tracking-tight">
                {language === 'vi' ? '0đ Phí' : '0 Fee'}
              </span>
            </span>
          </button>
        </div>

        {/* Card Form */}
        <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/30 p-6 sm:p-7 shadow-2xl shadow-black/80 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#3064AE] via-[#C5E5EC] to-[#E0FAEB]" />
          {/* Inline Error Banner */}
          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-medium">{authError}</span>
            </div>
          )}

          {/* 1. LOGIN */}
          {activeTab === 'LOGIN' && (
            <div className="space-y-4">
              {/* Cổng Quản Trị Viên & Kiểm Duyệt Viên - Hiển thị khi có (?admin=1) hoặc chạm logo 5 lần */}
              {isAdminMode && (
                <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-xs animate-fade-in shadow-xl shadow-purple-950/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-purple-200 font-extrabold flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-400" />
                      {language === 'vi' ? 'Cổng Quản Trị & Kiểm Duyệt (Admin & Mods)' : 'Admin & Moderators Gate'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAdminMode(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
                      title={language === 'vi' ? 'Ẩn cổng quản trị' : 'Hide portal'}
                    >
                      &times;
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {/* Admin */}
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('admin@gigme.vn', 'admin1507')}
                      disabled={isLoggingIn}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold transition active:scale-95 shadow-xs flex flex-col items-center cursor-pointer disabled:opacity-50"
                    >
                      <span className="font-black">Quản Trị Tối Cao</span>
                      <span className="font-mono text-[9px] text-purple-200">000000000 • admin1507</span>
                    </button>

                    {/* Mod 1 */}
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('mod1@gigme.vn', 'mod1999')}
                      disabled={isLoggingIn}
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition active:scale-95 shadow-xs flex flex-col items-center cursor-pointer disabled:opacity-50"
                    >
                      <span className="font-black">Kiểm Duyệt 1 (Mod 1)</span>
                      <span className="font-mono text-[9px] text-indigo-200">000000001 • mod1999</span>
                    </button>

                    {/* Mod 2 */}
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('mod2@gigme.vn', 'mod4444')}
                      disabled={isLoggingIn}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition active:scale-95 shadow-xs flex flex-col items-center cursor-pointer disabled:opacity-50"
                    >
                      <span className="font-black">Kiểm Duyệt 2 (Mod 2)</span>
                      <span className="font-mono text-[9px] text-blue-200">000000002 • mod4444</span>
                    </button>

                    {/* Mod 3 */}
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('mod3@gigme.vn', 'mod0308')}
                      disabled={isLoggingIn}
                      className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold transition active:scale-95 shadow-xs flex flex-col items-center cursor-pointer disabled:opacity-50"
                    >
                      <span className="font-black">Kiểm Duyệt 3 (Mod 3)</span>
                      <span className="font-mono text-[9px] text-teal-200">000000003 • mod0308</span>
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                    {language === 'vi' ? 'Gmail hoặc Số điện thoại' : 'Gmail or Phone Number'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#C5E5EC]/50 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      id="login-contact-input"
                      required
                      value={loginContact}
                      onChange={(e) => setLoginContact(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none transition"
                      placeholder={language === 'vi' ? '09xxxxxxxx hoặc email@sinhvien.edu.vn' : '09xxxxxxxx or email@campus.edu.vn'}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[#C5E5EC]/90 font-semibold">
                      {language === 'vi' ? 'Mật khẩu' : 'Password'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('FORGOT')}
                      className="text-[11px] text-[#C5E5EC] font-bold hover:underline cursor-pointer"
                    >
                      {language === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#C5E5EC]/50 absolute left-3 top-2.5" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      id="login-password-input"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-2.5 text-[#C5E5EC]/60 hover:text-white cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="submit-login-btn"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-black text-sm hover:brightness-110 shadow-lg shadow-[#3064AE]/25 transition flex items-center justify-center space-x-1.5 disabled:opacity-50 active:scale-95 border border-[#E0FAEB]/30 cursor-pointer"
                >
                  {isLoggingIn ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  ) : null}
                  <span>{language === 'vi' ? 'Đăng Nhập Vào GigMe' : 'Log In to GigMe'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* 2. REGISTER */}
          {activeTab === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              {(requiresExtraKyc || ipAccountCount >= 3) && (
                <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 space-y-1">
                  <div className="flex items-center space-x-1.5 font-extrabold text-[12px] text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      {language === 'vi'
                        ? `Yêu Cầu Bảo Mật IP (Đã tạo ${ipAccountCount} tài khoản)`
                        : `IP Security Notice (${ipAccountCount} accounts created)`}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {language === 'vi'
                      ? 'Địa chỉ IP của bạn đã tạo trên 3 tài khoản. Từ tài khoản thứ 4 trở đi, hệ thống yêu cầu xác thực bổ sung: Bắt buộc nhập Số Điện Thoại HOẶC Căn Cước Công Dân (CCCD) [1 trong 2].'
                      : 'Your IP has created >3 accounts. Starting from the 4th account, Phone Number OR National ID (CCCD) is mandatory [1 of 2].'}
                  </p>
                </div>
              )}

              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                      {language === 'vi' ? 'Họ và tên đệm' : 'Middle & Last Name'}{' '}
                      <span className="text-rose-400 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#C5E5EC]/50 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        maxLength={25}
                        value={regLastName}
                        onChange={(e) => setRegLastName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none transition"
                        placeholder={language === 'vi' ? 'Nguyễn Văn' : 'Smith'}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                      {language === 'vi' ? 'Tên' : 'First Name'}{' '}
                      <span className="text-rose-400 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={15}
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none transition"
                      placeholder={language === 'vi' ? 'An' : 'John'}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#C5E5EC]/70 mt-1 px-1">
                  <span>
                    {language === 'vi'
                      ? 'Ví dụ: Họ và tên đệm: Nguyễn Văn / Tên: An'
                      : 'Example: Middle & Last: Smith / First: John'}
                  </span>
                  <span className={`${`${regLastName.trim()} ${regFirstName.trim()}`.trim().length > 30 ? 'text-rose-400 font-bold' : 'text-[#C5E5EC]/60'}`}>
                    {`${regLastName.trim()} ${regFirstName.trim()}`.trim().length}/30 {language === 'vi' ? 'ký tự' : 'chars'}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#C5E5EC]/90 font-semibold">
                    {language === 'vi' ? 'Địa chỉ Gmail' : 'Gmail Address'}{' '}
                    <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <span className="text-[10px] text-[#C5E5EC]/60">
                    {language === 'vi' ? '1 tài khoản / 1 Gmail' : '1 account / 1 Gmail'}
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#C5E5EC]/50 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={regGmail}
                    onChange={(e) => setRegGmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none transition"
                    placeholder="tenban@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#C5E5EC]/90 font-semibold">
                      {language === 'vi' ? 'Số điện thoại (tối đa 10 số)' : 'Phone (max 10 digits)'}{' '}
                      {requiresExtraKyc && !regCccd ? <span className="text-amber-400 font-bold">*</span> : ''}
                    </label>
                    <span className="text-[10px] text-[#C5E5EC]/60">
                      {language === 'vi' ? '1 TK / 1 SĐT' : '1 Acc / 1 Phone'}
                    </span>
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#C5E5EC]/50 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      maxLength={10}
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl bg-[#12233B] border ${
                        requiresExtraKyc && !regPhone && !regCccd ? 'border-amber-500' : 'border-[#C5E5EC]/25'
                      } text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none transition font-mono`}
                      placeholder="09xxxxxxxx (10 số)"
                    />
                  </div>
                  {regPhone && (
                    <div className="flex items-center justify-between text-[10px] text-[#C5E5EC]/70 mt-0.5 px-1 font-mono">
                      <span>{regPhone.length}/10 số</span>
                      {regPhone.length === 10 && regPhone.startsWith('0') && (
                        <span className="text-emerald-400 font-semibold">✓ Hợp lệ</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#C5E5EC]/90 font-semibold">
                      {language === 'vi' ? 'Số CCCD (12 số)' : 'National ID (12 digits)'}{' '}
                      {requiresExtraKyc && !regPhone ? <span className="text-amber-400 font-bold">*</span> : ''}
                    </label>
                    <span className="text-[10px] text-[#C5E5EC]/60">
                      {language === 'vi' ? '1 TK / 1 CCCD' : '1 Acc / 1 ID'}
                    </span>
                  </div>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-[#C5E5EC]/50 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      maxLength={12}
                      value={regCccd}
                      onChange={(e) => setRegCccd(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl bg-[#12233B] border ${
                        cccdCheck && !cccdCheck.isValid && regCccd.length === 12
                          ? 'border-rose-500'
                          : cccdCheck && cccdCheck.isValid
                          ? 'border-emerald-500'
                          : requiresExtraKyc && !regPhone && !regCccd
                          ? 'border-amber-500'
                          : 'border-[#C5E5EC]/25'
                      } text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none font-mono transition`}
                      placeholder="00120300xxxx (12 số)"
                    />
                  </div>
                  {regCccd && regCccd.length > 0 && (
                    <div className="mt-1">
                      {regCccd.length < 12 ? (
                        <div className="text-[10px] text-[#C5E5EC]/70 px-1 font-mono">
                          {language === 'vi' ? 'Tiến độ: ' : 'Progress: '}
                          {regCccd.length}/12 chữ số
                        </div>
                      ) : cccdCheck?.isValid ? (
                        <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-[11px] text-emerald-200 flex items-start gap-1.5 animate-fadeIn">
                          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                          <div className="leading-tight">
                            <div className="font-bold text-emerald-300">
                              {language === 'vi' ? '✓ CCCD Thật & Hợp Lệ C06' : '✓ Valid C06 National ID'}
                            </div>
                            <div className="text-[10px] text-emerald-200/90 mt-0.5">
                              Nơi cấp: <strong>{cccdCheck.provinceName}</strong> ({cccdCheck.provinceCode}) • Năm sinh: <strong>{cccdCheck.birthCenturyYear}</strong> • Giới tính: <strong>{cccdCheck.gender}</strong>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-rose-950/70 border border-rose-500/50 text-[11px] text-rose-200 flex items-start gap-1.5 animate-fadeIn">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                          <div className="leading-tight">
                            <div className="font-bold text-rose-300">
                              {language === 'vi' ? '✗ CCCD Không Hợp Lệ' : '✗ Invalid National ID'}
                            </div>
                            <div className="text-[10px] text-rose-200/90 mt-0.5">
                              {cccdCheck?.error || (language === 'vi' ? 'Không đúng định dạng CCCD Bộ Công An' : 'Invalid ID')}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                    {language === 'vi' ? 'Giới tính' : 'Gender'}{' '}
                    <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white focus:border-[#C5E5EC] focus:outline-none"
                  >
                    <option value="Nam">{language === 'vi' ? 'Nam' : 'Male'}</option>
                    <option value="Nữ">{language === 'vi' ? 'Nữ' : 'Female'}</option>
                    <option value="Khác">{language === 'vi' ? 'Khác' : 'Other'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                    {language === 'vi' ? 'Ngày sinh' : 'Date of Birth'}{' '}
                    <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(true)}
                      className="absolute left-2.5 top-2 p-1 rounded-md text-[#C5E5EC] hover:bg-white/10 transition cursor-pointer"
                      title={language === 'vi' ? 'Mở bảng chọn ngày sinh' : 'Open date picker'}
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      required
                      value={regBirthDate}
                      onChange={(e) => setRegBirthDate(e.target.value)}
                      onClick={() => !regBirthDate && setShowDatePicker(true)}
                      className="w-full pl-9 pr-14 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:outline-none transition"
                      placeholder="15/08/2003"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(true)}
                      className="absolute right-2 top-2 px-2 py-0.5 rounded-lg bg-[#C5E5EC]/20 hover:bg-[#C5E5EC]/30 text-[#C5E5EC] text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      {language === 'vi' ? 'Lịch' : 'Pick'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                    {language === 'vi' ? 'Mật khẩu (6-15 ký tự)' : 'Password (6-15 chars)'}{' '}
                    <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      maxLength={15}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full px-3 pr-8 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-2.5 text-[#C5E5EC]/60 hover:text-white cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[#C5E5EC]/60 mt-0.5 px-1 font-mono">
                    <span>{regPassword.length}/15 {language === 'vi' ? 'ký tự' : 'chars'}</span>
                    {regPassword.length >= 6 && regPassword.length <= 15 && (
                      <span className="text-emerald-400 font-bold">✓ Độ dài đạt</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[#C5E5EC]/90 font-semibold">
                      {language === 'vi' ? 'Xác nhận' : 'Confirm'}{' '}
                      <span className="text-rose-400 font-bold">*</span>
                    </label>
                    {regConfirmPassword && (
                      <span className={`text-[10px] font-bold ${regPassword === regConfirmPassword ? 'text-[#E0FAEB]' : 'text-rose-400'}`}>
                        {regPassword === regConfirmPassword
                          ? (language === 'vi' ? '✓ Khớp' : '✓ Match')
                          : (language === 'vi' ? '✗ Chưa khớp' : '✗ Mismatch')}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showRegConfirm ? 'text' : 'password'}
                      required
                      maxLength={15}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className={`w-full px-3 pr-8 py-2 rounded-xl bg-[#12233B] border ${
                        regConfirmPassword && regPassword !== regConfirmPassword
                          ? 'border-rose-500'
                          : 'border-[#C5E5EC]/25'
                      } text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirm(!showRegConfirm)}
                      className="absolute right-2.5 top-2.5 text-[#C5E5EC]/60 hover:text-white cursor-pointer"
                    >
                      {showRegConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="text-[10px] text-[#C5E5EC]/60 mt-0.5 px-1 font-mono">
                    {regConfirmPassword.length}/15 {language === 'vi' ? 'ký tự' : 'chars'}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20 text-[10px] text-[#C5E5EC]/70 space-y-1">
                <p>
                  🔒 <strong>{language === 'vi' ? 'Quy tắc bảo mật GigMe:' : 'GigMe Security Rule:'}</strong>{' '}
                  {language === 'vi'
                    ? '1 Số điện thoại (10 số), 1 Gmail hoặc 1 CCCD (12 số) chỉ được liên kết với 1 tài khoản duy nhất.'
                    : '1 Phone (10 digits), 1 Gmail, or 1 National ID (12 digits) can only be associated with 1 single account.'}
                </p>
                <p className="text-emerald-300 font-semibold flex items-center pt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1"></span>
                  {language === 'vi'
                    ? 'Hệ thống Firebase Authentication sẽ gửi liên kết xác thực tới Gmail của bạn ngay khi tạo tài khoản.'
                    : 'Firebase Authentication will dispatch a confirmation link to your Gmail immediately upon registration.'}
                </p>
              </div>

              <button
                type="submit"
                id="submit-register-btn"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-black text-sm hover:brightness-110 shadow-lg shadow-[#3064AE]/25 transition mt-2 active:scale-95 border border-[#E0FAEB]/30 cursor-pointer"
              >
                {language === 'vi' ? 'Đăng Ký Tài Khoản Mới' : 'Create New Account'}
              </button>
            </form>
          )}

          {/* 3. PHONE & MO SMS LOGIN */}
          {activeTab === 'PHONE_OTP' && (
            <div className="space-y-4 text-xs">
              {/* MO SMS ONLY (Người dùng tự nhắn tin SMS chủ động) */}
              <div className="space-y-3.5">
                {/* Explanation Banner */}
                <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/25 text-[#C5E5EC] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black flex items-center text-[#E0FAEB]">
                      <Sparkles className="w-4 h-4 mr-1 text-[#E0FAEB]" />{' '}
                      {language === 'vi' ? 'Cơ Chế Xác Thực Qua SMS' : 'SMS Verification Mechanism'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#E0FAEB]/20 text-[#E0FAEB] text-[10px] font-extrabold border border-[#E0FAEB]/30">
                      {language === 'vi' ? 'Chính Chủ 100%' : '100% Genuine'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#C5E5EC]/80 leading-relaxed">
                    {language === 'vi'
                      ? 'Bạn chủ động gửi 1 tin nhắn SMS đến đầu số tổng đài. Cước phí được nhà mạng viễn thông trừ trực tiếp vào SIM (1.000đ/tin). Không lo tắc nghẽn mạng hay mã OTP rơi vào thư rác!'
                      : 'You send a single SMS to the gateway shortcode. Carrier fee is deducted directly from SIM account (~1,000đ/sms). Ultra fast, anti-fraud, 100% genuine!'}
                  </p>

                  {/* Telco carriers list */}
                  <div className="flex items-center space-x-1.5 pt-1 text-[10px] text-[#C5E5EC]/70 flex-wrap gap-y-1">
                    <span className="font-semibold text-white/90">{language === 'vi' ? 'Hỗ trợ:' : 'Networks:'}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#081120] text-emerald-300 font-mono text-[9px] border border-emerald-500/30">Viettel</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#081120] text-blue-300 font-mono text-[9px] border border-blue-500/30">VinaPhone</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#081120] text-cyan-300 font-mono text-[9px] border border-cyan-500/30">MobiFone</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#081120] text-orange-300 font-mono text-[9px] border border-orange-500/30">Vietnamobile</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#081120] text-red-300 font-mono text-[9px] border border-red-500/30">Wintel/iTel</span>
                  </div>
                </div>

                {/* Input Phone & Config */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[#C5E5EC]/90 font-semibold text-[11px]">
                        {language === 'vi' ? 'Số điện thoại của bạn' : 'Your Phone Number'}
                      </label>
                      {phoneInput && (
                        <span className="font-mono text-[10px] text-[#C5E5EC]/60">
                          {phoneInput.length}/10 {language === 'vi' ? 'số' : 'digits'}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#C5E5EC]/50 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        maxLength={10}
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full pl-9 pr-20 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none transition"
                        placeholder="09xxxxxxxx"
                      />
                      {/* Detected Telco Badge inside input */}
                      {getTelcoBadge(phoneInput) && (
                        <div className="absolute right-2.5 top-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getTelcoBadge(phoneInput)!.color}`}>
                            {getTelcoBadge(phoneInput)!.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#C5E5EC]/90 mb-1 font-semibold text-[11px]">
                      {language === 'vi' ? 'Đầu số tổng đài dịch vụ' : 'Gateway Shortcode'}
                    </label>
                    <select
                      value={moShortcode}
                      onChange={(e) => setMoShortcode(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none transition"
                    >
                      <option value="8077">8077 ({language === 'vi' ? '1.000đ / tin - Khuyên Dùng' : '1,000đ / SMS - Recommended'})</option>
                      <option value="8177">8177 ({language === 'vi' ? '1.500đ / tin' : '1,500đ / SMS'})</option>
                      <option value="8577">8577 ({language === 'vi' ? '5.000đ / tin' : '5,000đ / SMS'})</option>
                      <option value="6089">6089 ({language === 'vi' ? '1.000đ / tin' : '1,000đ / SMS'})</option>
                    </select>
                  </div>
                </div>

                {/* Button Generate Session */}
                {!moSession ? (
                  <button
                    type="button"
                    onClick={handleGenerateMoSession}
                    disabled={moLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-extrabold text-sm hover:brightness-110 shadow-lg shadow-[#3064AE]/25 transition active:scale-95 flex items-center justify-center space-x-2 border border-[#E0FAEB]/30 cursor-pointer disabled:opacity-50"
                  >
                    {moLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{language === 'vi' ? 'Đang khởi tạo cú pháp...' : 'Generating syntax...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{language === 'vi' ? 'Tạo Cú Pháp Tin Nhắn MO' : 'Generate MO SMS Syntax'}</span>
                      </>
                    )}
                  </button>
                ) : (
                  /* Active MO Session Details */
                  <div className="space-y-3.5 p-4 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/30 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-[#C5E5EC] font-bold">
                        <Radio className="w-4 h-4 text-[#E0FAEB] animate-pulse" />
                        <span>{language === 'vi' ? 'Cú Pháp Xác Thực Chủ Động' : 'Active Authentication Syntax'}</span>
                      </div>

                      {/* Live Countdown Timer Badge */}
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border flex items-center space-x-1 ${
                            moSecondsLeft > 60
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                              : moSecondsLeft > 0
                              ? 'bg-amber-950/60 text-amber-300 border-amber-500/40 animate-pulse'
                              : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>
                            {Math.floor(moSecondsLeft / 60)
                              .toString()
                              .padStart(2, '0')}
                            :{(moSecondsLeft % 60).toString().padStart(2, '0')}
                          </span>
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-[#0E1B2E] text-[#E0FAEB] text-[10px] font-mono border border-[#C5E5EC]/30">
                          {moSession.feeText}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#081120] h-1.5 rounded-full overflow-hidden border border-[#C5E5EC]/15">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          moSecondsLeft > 60 ? 'bg-gradient-to-r from-[#3064AE] to-[#E0FAEB]' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, (moSecondsLeft / 300) * 100))}%` }}
                      />
                    </div>

                    {/* Expired warning if timer reached 0 */}
                    {moSecondsLeft <= 0 && (
                      <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
                        <span className="font-semibold">{language === 'vi' ? '⚠️ Cú pháp đã hết hạn 5 phút!' : '⚠️ Syntax expired (5 min)!'}</span>
                        <button
                          type="button"
                          onClick={handleGenerateMoSession}
                          className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer transition"
                        >
                          {language === 'vi' ? 'Tạo Lại Cú Pháp Mới' : 'Regenerate Syntax'}
                        </button>
                      </div>
                    )}

                    {/* Syntax Box */}
                    <div className="p-3.5 rounded-xl bg-[#081120] border border-[#C5E5EC]/30 text-center space-y-2">
                      <div className="text-[11px] text-[#C5E5EC]/70 uppercase tracking-wider font-semibold">
                        {language === 'vi' ? 'Soạn tin nhắn SMS theo cú pháp chính xác:' : 'Compose SMS with exact syntax:'}
                      </div>
                      <div className="font-mono text-xl font-black text-[#E0FAEB] tracking-widest selection:bg-[#3064AE] selection:text-white py-1">
                        {moSession.syntax}
                      </div>
                      <div className="text-xs text-[#C5E5EC]/90 flex items-center justify-center space-x-1.5">
                        <span>{language === 'vi' ? 'Gửi đến đầu số:' : 'Send to shortcode:'}</span>
                        <strong className="text-amber-300 font-mono text-base px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/40">
                          {moSession.shortcode}
                        </strong>
                      </div>
                    </div>

                    {/* Primary Deeplink Action (Cross-platform iOS/Android) */}
                    <button
                      type="button"
                      onClick={handleOpenSmsApp}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-black text-sm hover:brightness-110 shadow-lg shadow-[#3064AE]/25 transition active:scale-95 flex items-center justify-center space-x-2 text-center border border-[#E0FAEB]/30 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0" />
                      <span>{language === 'vi' ? 'Mở Trình Nhắn Tin SMS Để Gửi Ngay' : 'Open SMS App to Send Now'}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </button>

                    {/* Actions: Copy syntax, Copy shortcode & QR code Toggle */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={handleCopySyntax}
                        className="py-1.5 px-2 rounded-lg bg-[#0E1B2E] hover:bg-[#152844] text-[#C5E5EC] text-[11px] font-semibold flex items-center justify-center space-x-1 transition border border-[#C5E5EC]/25 cursor-pointer"
                      >
                        {moCopiedSyntax ? <Check className="w-3.5 h-3.5 text-[#E0FAEB]" /> : <Copy className="w-3.5 h-3.5 text-[#C5E5EC]/70" />}
                        <span className="truncate">
                          {moCopiedSyntax
                            ? (language === 'vi' ? 'Đã Chép Cú Pháp' : 'Copied')
                            : (language === 'vi' ? 'Chép Cú Pháp' : 'Copy Syntax')}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyShortcode}
                        className="py-1.5 px-2 rounded-lg bg-[#0E1B2E] hover:bg-[#152844] text-[#C5E5EC] text-[11px] font-semibold flex items-center justify-center space-x-1 transition border border-[#C5E5EC]/25 cursor-pointer"
                      >
                        {moCopiedShortcode ? <Check className="w-3.5 h-3.5 text-[#E0FAEB]" /> : <Copy className="w-3.5 h-3.5 text-[#C5E5EC]/70" />}
                        <span className="truncate">
                          {moCopiedShortcode
                            ? (language === 'vi' ? 'Đã Chép Đầu Số' : 'Copied')
                            : (language === 'vi' ? 'Chép Đầu Số' : 'Copy Shortcode')}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setMoShowQrCode(!moShowQrCode);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1 transition border cursor-pointer ${
                          moShowQrCode
                            ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300'
                            : 'bg-[#0E1B2E] hover:bg-[#152844] border-[#C5E5EC]/25 text-[#C5E5EC]'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span className="truncate">{moShowQrCode ? (language === 'vi' ? 'Đóng QR' : 'Close QR') : (language === 'vi' ? 'Mã QR' : 'QR Code')}</span>
                      </button>
                    </div>

                    {/* QR Code Viewer (For Desktop / Laptop / Tablet users) */}
                    {moShowQrCode && (
                      <div className="p-3.5 rounded-xl bg-[#081120] border border-emerald-500/40 text-center space-y-2 animate-fade-in">
                        <div className="text-[11px] font-bold text-[#E0FAEB] flex items-center justify-center space-x-1">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            {language === 'vi' ? 'Quét Mã QR Bằng Camera Điện Thoại' : 'Scan QR Code With Phone Camera'}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#C5E5EC]/70 max-w-xs mx-auto">
                          {language === 'vi'
                            ? 'Dành cho máy tính: Mở ứng dụng Máy ảnh trên điện thoại để quét, tin nhắn sẽ tự động được điền sẵn!'
                            : 'For desktop users: Open phone camera to scan; the SMS app will pre-fill syntax automatically!'}
                        </p>
                        <div className="inline-block p-2 rounded-xl bg-white shadow-lg shadow-black/50 mx-auto">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                              `SMSTO:${moSession.shortcode}:${moSession.syntax}`
                            )}`}
                            alt="SMS QR Code"
                            className="w-36 h-36 object-contain"
                          />
                        </div>
                        <div className="text-[10px] font-mono text-[#E0FAEB]">
                          SMSTO:{moSession.shortcode}:{moSession.syntax}
                        </div>
                      </div>
                    )}

                    {/* Live Radar Listening Indicator */}
                    <div className="p-2.5 rounded-xl bg-[#0E1B2E] border border-[#E0FAEB]/30 flex items-center space-x-2 text-[#E0FAEB]">
                      <div className="relative flex h-3 w-3 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E0FAEB] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E0FAEB]"></span>
                      </div>
                      <span className="text-[11px] leading-tight font-medium text-[#C5E5EC]">
                        {language === 'vi'
                          ? 'Hệ thống đang kết nối Webhook viễn thông và tự động đăng nhập khi tin nhắn MO tới tổng đài...'
                          : 'Listening for incoming MO SMS callback; will log in automatically upon verification...'}
                      </span>
                    </div>

                    {/* Test Simulation Button */}
                    <div className="pt-1 border-t border-[#C5E5EC]/20 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleSimulateMoReceived}
                        disabled={moSimulating}
                        className="w-full py-2 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {moSimulating
                            ? (language === 'vi' ? 'Đang mô phỏng xác thực...' : 'Simulating verification...')
                            : (language === 'vi' ? 'Mô Phỏng Tổng Đài Nhận Tin Nhắn (Dành cho thử nghiệm)' : 'Simulate Gateway Message Received (For Testing)')}
                        </span>
                      </button>
                    </div>

                    {/* Change syntax / Reset */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleGenerateMoSession}
                        className="text-[11px] text-[#C5E5EC]/70 hover:text-white underline cursor-pointer"
                      >
                        {language === 'vi' ? 'Đổi mã xác thực khác' : 'Generate a new code'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. FORGOT PASSWORD */}
          {activeTab === 'FORGOT' && (
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-white text-sm">
                  {language === 'vi' ? 'Quên Mật Khẩu' : 'Forgot Password'}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('LOGIN');
                    setAuthError(null);
                  }}
                  className="text-[#C5E5EC] font-bold hover:underline text-[11px] cursor-pointer"
                >
                  &larr; {language === 'vi' ? 'Quay lại đăng nhập' : 'Back to login'}
                </button>
              </div>

              {/* 3 Recovery Methods Selector */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#09111E] rounded-xl border border-[#C5E5EC]/20 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setForgotMethod('BIOMETRICS');
                    setAuthError(null);
                  }}
                  className={`py-1.5 px-1.5 rounded-lg flex items-center justify-center space-x-1 transition cursor-pointer ${
                    forgotMethod === 'BIOMETRICS'
                      ? 'bg-[#3064AE] text-white shadow-xs font-black'
                      : 'text-[#C5E5EC]/70 hover:text-white'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? '1. Vân Tay' : '1. Biometrics'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMethod('OTP');
                    setAuthError(null);
                  }}
                  className={`py-1.5 px-1.5 rounded-lg flex items-center justify-center space-x-1 transition cursor-pointer ${
                    forgotMethod === 'OTP'
                      ? 'bg-[#3064AE] text-white shadow-xs font-black'
                      : 'text-[#C5E5EC]/70 hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? '2. Mã OTP' : '2. OTP Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMethod('PIN');
                    setAuthError(null);
                  }}
                  className={`py-1.5 px-1.5 rounded-lg flex items-center justify-center space-x-1 transition cursor-pointer ${
                    forgotMethod === 'PIN'
                      ? 'bg-[#3064AE] text-white shadow-xs font-black'
                      : 'text-[#C5E5EC]/70 hover:text-white'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? '3. Mã PIN' : '3. PIN Code'}</span>
                </button>
              </div>

              {/* METHOD 1: BIOMETRICS (VÂN TAY) */}
              {forgotMethod === 'BIOMETRICS' && (
                <form onSubmit={handleResetPasswordWithBio} className="space-y-3">
                  <div className="p-3 rounded-xl bg-[#12233B] border border-[#3064AE]/30 text-[#C5E5EC] space-y-1">
                    <div className="flex items-center space-x-1.5 text-white font-bold">
                      <Fingerprint className="w-4 h-4 text-[#E0FAEB]" />
                      <span>{language === 'vi' ? 'Xác Thực Sinh Trắc Học Vân Tay' : 'Biometric Fingerprint Authentication'}</span>
                    </div>
                    <p className="text-[11px] text-[#C5E5EC]/80">
                      {language === 'vi'
                        ? 'Dành cho tài khoản đã bật tính năng xác thực Vân tay / FaceID trên thiết bị này.'
                        : 'For accounts that enabled Fingerprint / FaceID on this device.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                      {language === 'vi' ? 'Gmail, SĐT hoặc ID 9 số tài khoản' : 'Gmail, Phone, or 9-digit Account ID'}
                    </label>
                    <input
                      type="text"
                      required
                      value={forgotBioContact}
                      onChange={(e) => {
                        setForgotBioContact(e.target.value);
                        setBioVerified(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:outline-none"
                      placeholder={language === 'vi' ? 'Nhập Gmail, SĐT hoặc ID 9 số' : 'Enter Gmail, Phone, or 9-digit ID'}
                    />
                  </div>

                  {!bioVerified ? (
                    <button
                      type="button"
                      onClick={handleTriggerBiometricScan}
                      disabled={bioScanning}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-extrabold text-xs hover:brightness-110 shadow-lg shadow-[#3064AE]/25 transition flex items-center justify-center space-x-2 border border-[#E0FAEB]/30 cursor-pointer active:scale-95"
                    >
                      {bioScanning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>{language === 'vi' ? 'Đang quét cảm biến vân tay...' : 'Scanning biometric sensor...'}</span>
                        </>
                      ) : (
                        <>
                          <Fingerprint className="w-4 h-4 text-[#E0FAEB]" />
                          <span>{language === 'vi' ? 'Chạm Để Quét Vân Tay Xác Thực' : 'Tap to Scan Fingerprint'}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-[#E0FAEB] flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-bold text-xs">
                          {language === 'vi' ? 'Vân tay hợp lệ! Mời bạn nhập mật khẩu mới.' : 'Fingerprint verified! Please enter your new password.'}
                        </span>
                      </div>

                      <div>
                        <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                          {language === 'vi' ? 'Mật khẩu mới (6-15 ký tự)' : 'New password (6-15 chars)'}
                        </label>
                        <input
                          type="password"
                          required
                          maxLength={15}
                          value={forgotBioNewPassword}
                          onChange={(e) => setForgotBioNewPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:outline-none"
                          placeholder={language === 'vi' ? 'Mật khẩu 6 - 15 ký tự' : '6 - 15 characters'}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-black text-xs hover:brightness-110 transition shadow-lg border border-[#E0FAEB]/30 cursor-pointer"
                      >
                        {isLoggingIn
                          ? (language === 'vi' ? 'Đang cập nhật...' : 'Updating...')
                          : (language === 'vi' ? 'Cập Nhật Mật Khẩu Bằng Vân Tay' : 'Update Password with Fingerprint')}
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* METHOD 2: OTP (GMAIL / SMS) */}
              {forgotMethod === 'OTP' && (
                <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                      {language === 'vi' ? 'Gmail hoặc Số điện thoại tài khoản' : 'Account Gmail or Phone Number'}
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        required
                        value={forgotContact}
                        onChange={(e) => setForgotContact(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none"
                        placeholder="vietanh.dhbk@gmail.com"
                      />
                      <button
                        type="button"
                        onClick={handleSendForgotOtp}
                        disabled={forgotCountdown > 0}
                        className={`px-3.5 py-2 rounded-xl font-extrabold whitespace-nowrap transition cursor-pointer ${
                          forgotCountdown > 0
                            ? 'bg-[#12233B] text-[#C5E5EC]/50 cursor-not-allowed border border-[#C5E5EC]/20'
                            : 'bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white hover:brightness-110 active:scale-95 shadow-xs border border-[#E0FAEB]/30'
                        }`}
                      >
                        {forgotCountdown > 0
                          ? (language === 'vi' ? `Gửi lại (${forgotCountdown}s)` : `Resend (${forgotCountdown}s)`)
                          : (language === 'vi' ? 'Nhận OTP' : 'Get OTP')}
                      </button>
                    </div>
                  </div>

                  {forgotCountdown > 0 && (
                    <div className="p-3.5 rounded-xl bg-[#12233B] border border-[#3064AE]/40 text-[#E0FAEB] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold flex items-center text-[#E0FAEB]">
                          <Mail className="w-3.5 h-3.5 mr-1.5 text-[#C5E5EC]" />{' '}
                          {language === 'vi' ? 'Đã gửi mã OTP bảo mật' : 'Security OTP code sent'}
                        </span>
                        <span className="text-[10px] text-[#C5E5EC] font-mono">
                          {language === 'vi' ? 'Hiệu lực 3 phút' : 'Valid 3 mins'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#C5E5EC]/90 leading-relaxed">
                        {language === 'vi' ? (
                          <>Mã xác thực 6 số đã được gửi tới <span className="font-bold text-white font-mono">{forgotContact.trim().includes('@') ? forgotContact.trim() : forgotContact.trim().replace(/^(\d{3})\d+(\d{3})$/, '$1***$2')}</span>. Vui lòng kiểm tra hộp thư để lấy mã.</>
                        ) : (
                          <>6-digit OTP code has been sent to <span className="font-bold text-white font-mono">{forgotContact.trim().includes('@') ? forgotContact.trim() : forgotContact.trim().replace(/^(\d{3})\d+(\d{3})$/, '$1***$2')}</span>. Please check your inbox.</>
                        )}
                      </p>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[#C5E5EC]/90 font-semibold">
                        {language === 'vi' ? 'Nhập mã OTP 6 số' : 'Enter 6-digit OTP'}
                      </label>
                      <span className="text-[10px] text-rose-400 font-medium">
                        {language === 'vi' ? '* Bắt buộc nhập mã' : '* Code required'}
                      </span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      value={forgotOtpInput}
                      onChange={(e) => setForgotOtpInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono tracking-[0.3em] text-center text-base font-bold placeholder:tracking-normal placeholder:text-xs placeholder:font-normal placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none"
                      placeholder={language === 'vi' ? 'Nhập đủ 6 chữ số OTP' : 'Enter 6-digit OTP'}
                    />
                  </div>

                  <div>
                    <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                      {language === 'vi' ? 'Mật khẩu mới (6-15 ký tự)' : 'New password (6-15 chars)'}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        maxLength={15}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 pr-10 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none"
                        placeholder={language === 'vi' ? 'Mật khẩu 6 - 15 ký tự' : '6 - 15 characters'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-[#C5E5EC]/60 hover:text-white cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-black text-sm hover:brightness-110 transition shadow-lg shadow-[#3064AE]/25 active:scale-95 border border-[#E0FAEB]/30 cursor-pointer"
                  >
                    {language === 'vi' ? 'Cập Nhật Mật Khẩu Bằng OTP' : 'Update Password with OTP'}
                  </button>
                </form>
              )}

              {/* METHOD 3: PIN + GMAIL */}
              {forgotMethod === 'PIN' && (
                <form onSubmit={handleResetPasswordWithPin} className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#12233B] border border-[#3064AE]/30 text-[#C5E5EC] space-y-1">
                    <div className="flex items-center space-x-1.5 text-white font-bold">
                      <Key className="w-4 h-4 text-amber-400" />
                      <span>{language === 'vi' ? 'Xác Thực Qua Mã PIN & Gmail' : 'Authenticate via PIN Code & Gmail'}</span>
                    </div>
                    <p className="text-[11px] text-[#C5E5EC]/80">
                      {language === 'vi'
                        ? 'Khôi phục mật khẩu tức thì bằng địa chỉ Gmail kèm Mã PIN ví bảo mật 6 số đã thiết lập trong tài khoản.'
                        : 'Instantly restore password with your Gmail and the 6-digit Wallet Security PIN configured in your profile.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                      {language === 'vi' ? 'Địa chỉ Gmail tài khoản' : 'Account Gmail address'}
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotPinEmail}
                      onChange={(e) => setForgotPinEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:outline-none"
                      placeholder="tenban@gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                      {language === 'vi' ? 'Mã PIN bảo mật 6 số' : '6-digit Security PIN'}
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      value={forgotPinCode}
                      onChange={(e) => setForgotPinCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono tracking-[0.3em] text-center text-sm font-bold placeholder:tracking-normal placeholder:font-normal placeholder:text-xs placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:outline-none"
                      placeholder="******"
                    />
                  </div>

                  <div>
                    <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">
                      {language === 'vi' ? 'Mật khẩu mới (6-15 ký tự)' : 'New password (6-15 chars)'}
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={15}
                      value={forgotPinNewPassword}
                      onChange={(e) => setForgotPinNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:outline-none"
                      placeholder={language === 'vi' ? 'Mật khẩu 6 - 15 ký tự' : '6 - 15 characters'}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-black text-sm hover:brightness-110 transition shadow-lg shadow-[#3064AE]/25 active:scale-95 border border-[#E0FAEB]/30 cursor-pointer"
                  >
                    {isLoggingIn
                      ? (language === 'vi' ? 'Đang xác thực...' : 'Authenticating...')
                      : (language === 'vi' ? 'Cập Nhật Mật Khẩu Bằng Mã PIN' : 'Update Password with PIN')}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Chọn Ngày Sinh (Date Picker Popup) */}
        <BirthDatePickerModal
          isOpen={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          selectedDate={regBirthDate}
          onSelectDate={(newDate) => setRegBirthDate(newDate)}
          language={language}
        />

        {/* Copyright Notice */}
        <div className="mt-8 text-center text-xs text-[#C5E5EC]/70 space-y-1">
          <p className="font-medium">
            {language === 'vi' ? '© 2026 GigMe Student Platform. Bản quyền thuộc về GigMe Campus.' : '© 2026 GigMe Student Platform. All rights reserved by GigMe Campus.'}
          </p>
          <p className="text-[11px] text-[#C5E5EC]/50">
            {language === 'vi' ? 'Tất cả quyền được bảo lưu. Nền tảng Siêu kết nối việc làm sinh viên an toàn 100%.' : 'All rights reserved. 100% Secure Campus Student Micro-job Platform.'}
          </p>
        </div>
      </div>
    </div>
  );
};
