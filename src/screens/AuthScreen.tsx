import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { MoSmsSession } from '../types';
import { cloudService } from '../services/cloudSync';

export const AuthScreen: React.FC = () => {
  const {
    login,
    register,
    sendOtp,
    resetPasswordWithOtp,
    loginWithPhoneOtp,
    requestMoSms,
    checkMoSmsStatus,
    simulateMoSms,
    loginWithMoSms,
    loginSocial,
    generatedOtp,
    otpTargetContact,
    otpExpiresAt,
    showNotification,
  } = useGigMe();

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
  const [regName, setRegName] = useState('');
  const [regGmail, setRegGmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCccd, setRegCccd] = useState('');
  const [regGender, setRegGender] = useState('Nam');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

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
  const [moShowWebhookDoc, setMoShowWebhookDoc] = useState(false);

  // Phone OTP login
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneOtpInput, setPhoneOtpInput] = useState('');
  const [phoneCountdown, setPhoneCountdown] = useState(0);

  // Forgot Password
  const [forgotContact, setForgotContact] = useState('');
  const [forgotOtpInput, setForgotOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotCountdown, setForgotCountdown] = useState(0);

  // State for inline feedback
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [socialLoadingProvider, setSocialLoadingProvider] = useState<string | null>(null);

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
        showNotification('Cổng Quản Trị Hệ Thống 🔓', 'Đã mở khóa cổng đăng nhập nhanh dành cho Quản trị viên!');
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

  // MO SMS Auto Polling & SSE Realtime Listener
  useEffect(() => {
    if (!moSession || moSession.isVerified) return;

    // 1. Polling cổng backend cứ 2.5s / lần
    const interval = setInterval(async () => {
      const statusRes = await checkMoSmsStatus(moSession.sessionId);
      if (statusRes && statusRes.isVerified) {
        setMoSession((prev) => (prev ? { ...prev, isVerified: true } : null));
        clearInterval(interval);
        const verifiedPhone = statusRes.senderPhone || phoneInput || '0988668899';
        await loginWithMoSms(verifiedPhone);
      }
    }, 2500);

    // 2. Lắng nghe SSE thời gian thực từ Webhook nhà mạng
    const unsub = cloudService.subscribeMoSmsVerified(async (data) => {
      if (data && data.sessionId === moSession.sessionId) {
        setMoSession((prev) => (prev ? { ...prev, isVerified: true } : null));
        clearInterval(interval);
        await loginWithMoSms(data.phone || phoneInput || '0988668899');
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
    try {
      const res = await requestMoSms({
        phone: phoneInput.trim(),
        shortcode: moShortcode,
        keyword: moKeyword,
      });
      if (res.success && res.session) {
        setMoSession(res.session);
        showNotification(
          'Đã tạo cú pháp tin nhắn MO! 📨',
          `Vui lòng soạn "${res.session.syntax}" gửi tới ${res.session.shortcode} để xác thực.`,
          true
        );
      } else {
        setAuthError(res.error || 'Không thể tạo cú pháp MO. Vui lòng thử lại!');
      }
    } finally {
      setMoLoading(false);
    }
  };

  const handleCopySyntax = () => {
    if (!moSession) return;
    navigator.clipboard.writeText(moSession.syntax);
    setMoCopiedSyntax(true);
    setTimeout(() => setMoCopiedSyntax(false), 2000);
    showNotification('Đã sao chép cú pháp', `Đã chép "${moSession.syntax}" vào khay nhớ tạm.`);
  };

  const handleCopyShortcode = () => {
    if (!moSession) return;
    navigator.clipboard.writeText(moSession.shortcode);
    setMoCopiedShortcode(true);
    setTimeout(() => setMoCopiedShortcode(false), 2000);
    showNotification('Đã sao chép đầu số', `Đã chép đầu số ${moSession.shortcode}.`);
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
        setAuthError('Không thể đăng nhập bằng tài khoản mẫu. Vui lòng thử lại!');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!loginContact.trim()) {
      setAuthError('Vui lòng nhập Gmail hoặc Số điện thoại!');
      return;
    }
    if (!loginPassword.trim()) {
      setAuthError('Vui lòng nhập mật khẩu đăng nhập!');
      return;
    }
    setIsLoggingIn(true);
    try {
      const success = await login(loginContact, loginPassword);
      if (!success) {
        setAuthError('Tài khoản hoặc mật khẩu không chính xác. Bạn có thể nhấn Tài Khoản Mẫu bên trên để vào ngay!');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setAuthError(null);
    setSocialLoadingProvider(provider);
    try {
      await loginSocial(provider);
    } finally {
      setSocialLoadingProvider(null);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const name = regName.trim();
    const gmail = regGmail.trim().toLowerCase();
    const phone = regPhone.trim();
    const cccd = regCccd.trim();
    const pass = regPassword.trim();
    const confirm = regConfirmPassword.trim();

    if (!name) {
      setAuthError('Vui lòng nhập họ và tên của bạn!');
      return;
    }
    if (!gmail) {
      setAuthError('Các tài khoản khi tạo bắt buộc phải có địa chỉ Gmail!');
      return;
    }
    if (!gmail.includes('@')) {
      setAuthError('Địa chỉ Gmail không đúng định dạng!');
      return;
    }

    // IP account limit check: if >= 3 accounts on this IP, must provide Phone or CCCD (1 in 2)
    if (requiresExtraKyc || ipAccountCount >= 3) {
      const hasPhone = phone.length >= 9;
      const hasCccd = cccd.length >= 9;
      if (!hasPhone && !hasCccd) {
        setAuthError(
          `Địa chỉ IP của bạn đã tạo ${ipAccountCount} tài khoản. Từ tài khoản thứ 4 trở đi, bạn bắt buộc phải nhập Số Điện Thoại HOẶC Căn Cước Công Dân (CCCD) [1 trong 2]!`
        );
        return;
      }
    }

    if (pass.length < 6) {
      setAuthError('Mật khẩu bảo mật phải có tối thiểu 6 ký tự!');
      return;
    }
    if (pass !== confirm) {
      setAuthError('Mật khẩu xác nhận không trùng khớp. Vui lòng nhập lại!');
      return;
    }

    const birth = regBirthDate.trim() || '01/01/2000';
    setIsLoggingIn(true);
    try {
      const res = await register(name, gmail, regGender, birth, pass, confirm, phone, cccd);
      if (!res.success) {
        setAuthError(res.error || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin!');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSendPhoneOtp = () => {
    if (!phoneInput.trim()) {
      showNotification('Thiếu số điện thoại', 'Vui lòng nhập số điện thoại trước khi bấm gửi mã!');
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
      setAuthError('Vui lòng nhập số điện thoại của bạn!');
      return;
    }
    if (!phoneOtpInput.trim()) {
      setAuthError('Bạn chưa nhập mã OTP! Bắt buộc phải có mã OTP 6 số để đăng nhập.');
      return;
    }
    if (phoneOtpInput.trim().length !== 6) {
      setAuthError('Mã OTP phải có đúng 6 chữ số!');
      return;
    }
    const success = loginWithPhoneOtp(phoneInput, phoneOtpInput);
    if (!success) {
      setAuthError('Mã OTP không hợp lệ hoặc đã hết hạn (3 phút). Vui lòng thử lại!');
    }
  };

  const handleSendForgotOtp = () => {
    setAuthError(null);
    if (!forgotContact.trim()) {
      setAuthError('Vui lòng nhập Gmail hoặc Số điện thoại để nhận OTP!');
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
      setAuthError('Bạn chưa nhập mã OTP! Không thể đặt lại mật khẩu.');
      return;
    }
    if (forgotOtpInput.trim().length !== 6) {
      setAuthError('Mã OTP phải gồm 6 chữ số!');
      return;
    }
    if (newPassword.trim().length < 6) {
      setAuthError('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }
    const ok = await resetPasswordWithOtp(forgotOtpInput, newPassword);
    if (ok) {
      setActiveTab('LOGIN');
      setAuthError(null);
    } else {
      setAuthError('Mã OTP không hợp lệ, sai quá số lần hoặc đã hết hạn!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#081120] via-[#0E1B2E] to-[#081120] flex flex-col justify-center items-center px-4 py-8 text-white selection:bg-[#3064AE]/40 selection:text-[#C5E5EC] relative overflow-hidden">
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
            className="w-20 h-20 rounded-2xl mx-auto shadow-xl border border-[#C5E5EC]/30 object-cover mb-3 ring-2 ring-[#3064AE]/30 cursor-pointer select-none active:scale-95 transition-transform"
          />
          <h1 className="text-3xl font-black tracking-tight text-white select-none">
            Gig<span className="text-[#C5E5EC]">Me</span>
          </h1>
          <p className="text-xs text-[#C5E5EC]/80 mt-1 max-w-xs mx-auto">
            Nền tảng việc làm sinh viên & Smart Escrow bảo chứng 100%
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
            Đăng Nhập
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
            Đăng Ký
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
              <span>Tự Nhắn SMS (MO)</span>
              <span className="text-[9px] px-1 py-0.5 rounded bg-[#E0FAEB] text-[#0E1B2E] font-extrabold uppercase tracking-tight">0đ Phí</span>
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
              {/* Cổng Quản Trị Viên Hệ Thống - Chỉ hiển thị khi có tham số bí mật (?admin=1) hoặc chạm logo 5 lần */}
              {isAdminMode && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/40 text-xs animate-fade-in shadow-lg shadow-purple-950/40">
                  <span className="text-[11px] text-purple-200 font-semibold flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-400" /> Cổng Quản Trị Hệ Thống (Admin)
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('admin@admin.vn', 'admin1507')}
                      disabled={isLoggingIn}
                      className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold transition active:scale-95 shadow-xs cursor-pointer"
                    >
                      Đăng Nhập Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAdminMode(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
                      title="Ẩn cổng admin"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">Gmail hoặc Số điện thoại</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#C5E5EC]/50 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      id="login-contact-input"
                      required
                      value={loginContact}
                      onChange={(e) => setLoginContact(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none transition"
                      placeholder="09xxxxxxxx hoặc email@sinhvien.edu.vn"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[#C5E5EC]/90 font-semibold">Mật khẩu</label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('FORGOT')}
                      className="text-[11px] text-[#C5E5EC] font-bold hover:underline cursor-pointer"
                    >
                      Quên mật khẩu?
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
                  <span>Đăng Nhập Vào GigMe</span>
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
                    <span>Yêu Cầu Bảo Mật IP (Đã tạo {ipAccountCount} tài khoản)</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Địa chỉ IP của bạn đã tạo trên 3 tài khoản. Từ tài khoản thứ 4 trở đi, hệ thống yêu cầu xác thực bổ sung: <strong>Bắt buộc nhập Số Điện Thoại HOẶC Căn Cước Công Dân (CCCD)</strong> [1 trong 2].
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">Họ và tên đầy đủ</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#C5E5EC]/50 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none transition"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#C5E5EC]/90 font-semibold">
                    Địa chỉ Gmail <span className="text-rose-400 font-bold">* Bắt buộc</span>
                  </label>
                  <span className="text-[10px] text-[#C5E5EC]/60">1 tài khoản / 1 Gmail</span>
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
                      Số điện thoại {requiresExtraKyc && !regCccd ? <span className="text-amber-400 font-bold">*</span> : ''}
                    </label>
                    <span className="text-[10px] text-[#C5E5EC]/60">1 TK / 1 SĐT</span>
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#C5E5EC]/50 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl bg-[#12233B] border ${
                        requiresExtraKyc && !regPhone && !regCccd ? 'border-amber-500' : 'border-[#C5E5EC]/25'
                      } text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none transition`}
                      placeholder="09xxxxxxxx"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#C5E5EC]/90 font-semibold">
                      Số CCCD (12 số) {requiresExtraKyc && !regPhone ? <span className="text-amber-400 font-bold">*</span> : ''}
                    </label>
                    <span className="text-[10px] text-[#C5E5EC]/60">1 TK / 1 CCCD</span>
                  </div>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-[#C5E5EC]/50 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      maxLength={12}
                      value={regCccd}
                      onChange={(e) => setRegCccd(e.target.value.replace(/\D/g, ''))}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl bg-[#12233B] border ${
                        requiresExtraKyc && !regPhone && !regCccd ? 'border-amber-500' : 'border-[#C5E5EC]/25'
                      } text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none font-mono transition`}
                      placeholder="00120300xxxx"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">Giới tính</label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white focus:border-[#C5E5EC] focus:outline-none"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">Ngày sinh</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-[#C5E5EC]/50 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={regBirthDate}
                      onChange={(e) => setRegBirthDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:outline-none"
                      placeholder="15/08/2003"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">Mật khẩu (≥6 ký tự)</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
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
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[#C5E5EC]/90 font-semibold">Xác nhận</label>
                    {regConfirmPassword && (
                      <span className={`text-[10px] font-bold ${regPassword === regConfirmPassword ? 'text-[#E0FAEB]' : 'text-rose-400'}`}>
                        {regPassword === regConfirmPassword ? '✓ Khớp' : '✗ Chưa khớp'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showRegConfirm ? 'text' : 'password'}
                      required
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
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20 text-[10px] text-[#C5E5EC]/70 space-y-1">
                <p>🔒 <strong>Quy tắc bảo mật GigMe:</strong> 1 Số điện thoại, 1 Gmail hoặc 1 CCCD chỉ được liên kết với 1 tài khoản duy nhất.</p>
              </div>

              <button
                type="submit"
                id="submit-register-btn"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-black text-sm hover:brightness-110 shadow-lg shadow-[#3064AE]/25 transition mt-2 active:scale-95 border border-[#E0FAEB]/30 cursor-pointer"
              >
                Đăng Ký Tài Khoản Mới
              </button>
            </form>
          )}

          {/* 3. PHONE & MO SMS LOGIN */}
          {activeTab === 'PHONE_OTP' && (
            <div className="space-y-4 text-xs">
              {/* MO SMS ONLY (Người dùng tự nhắn tin SMS chủ động) */}
                <div className="space-y-3.5">
                  {/* Explanation Banner */}
                  <div className="p-3 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-[#C5E5EC] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold flex items-center text-[#C5E5EC]">
                        <Sparkles className="w-3.5 h-3.5 mr-1 text-[#E0FAEB]" /> Cơ Chế SMS MO (Mobile Originated)
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#E0FAEB]/20 text-[#E0FAEB] text-[10px] font-semibold border border-[#E0FAEB]/30">
                        Chính Chủ 100%
                      </span>
                    </div>
                    <p className="text-[11px] text-[#C5E5EC]/80 leading-relaxed">
                      Bạn chủ động mở ứng dụng tin nhắn và gửi cú pháp đến đầu số tổng đài. Cước phí được <strong>nhà mạng viễn thông trừ trực tiếp vào tài khoản SIM</strong> (1.000đ – 1.500đ/tin). Chủ nền tảng <strong>không tốn chi phí</strong> gửi SMS Brandname!
                    </p>
                  </div>

                  {/* Input Phone & Config */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">Số điện thoại của bạn (tùy chọn)</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#C5E5EC]/50 absolute left-3 top-2.5" />
                        <input
                          type="tel"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none"
                          placeholder="09xxxxxxxx"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">Đầu số tổng đài dịch vụ</label>
                      <select
                        value={moShortcode}
                        onChange={(e) => setMoShortcode(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none"
                      >
                        <option value="8077">8077 (Cước 1.000đ / tin - Khuyên Dùng)</option>
                        <option value="8177">8177 (Cước 1.500đ / tin)</option>
                        <option value="8577">8577 (Cước 5.000đ / tin)</option>
                        <option value="6089">6089 (Cước 1.000đ / tin)</option>
                      </select>
                    </div>
                  </div>

                  {/* Button Generate Session */}
                  {!moSession ? (
                    <button
                      type="button"
                      onClick={handleGenerateMoSession}
                      disabled={moLoading}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-extrabold text-sm hover:brightness-110 shadow-lg shadow-[#3064AE]/25 transition active:scale-95 flex items-center justify-center space-x-2 border border-[#E0FAEB]/30 cursor-pointer"
                    >
                      {moLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Đang khởi tạo cú pháp...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Tạo Cú Pháp Tin Nhắn MO</span>
                        </>
                      )}
                    </button>
                  ) : (
                    /* Active MO Session Details */
                    <div className="space-y-3 p-4 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/30 shadow-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-[#C5E5EC] font-bold">
                          <Radio className="w-4 h-4 text-[#E0FAEB] animate-pulse" />
                          <span>Cú Pháp Xác Thực Chủ Động</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-[#0E1B2E] text-[#E0FAEB] text-[10px] font-mono border border-[#C5E5EC]/30">
                          {moSession.feeText}
                        </span>
                      </div>

                      {/* Syntax Box */}
                      <div className="p-3.5 rounded-xl bg-[#081120] border border-[#C5E5EC]/30 text-center space-y-2">
                        <div className="text-[11px] text-[#C5E5EC]/70 uppercase tracking-wider font-semibold">
                          Soạn tin nhắn SMS theo cú pháp chính xác:
                        </div>
                        <div className="font-mono text-xl font-black text-[#E0FAEB] tracking-widest selection:bg-[#3064AE] selection:text-white py-1">
                          {moSession.syntax}
                        </div>
                        <div className="text-xs text-[#C5E5EC]/90 flex items-center justify-center space-x-1.5">
                          <span>Gửi đến đầu số:</span>
                          <strong className="text-amber-300 font-mono text-base px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/40">
                            {moSession.shortcode}
                          </strong>
                        </div>
                      </div>

                      {/* Primary Deeplink Action */}
                      <a
                        href={moSession.deeplink}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-black text-sm hover:brightness-110 shadow-lg shadow-[#3064AE]/25 transition active:scale-95 flex items-center justify-center space-x-2 text-center border border-[#E0FAEB]/30 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 shrink-0" />
                        <span>Mở Trình Nhắn Tin SMS Để Gửi Ngay</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>

                      {/* Copy actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleCopySyntax}
                          className="py-1.5 px-2 rounded-lg bg-[#0E1B2E] hover:bg-[#152844] text-[#C5E5EC] text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition border border-[#C5E5EC]/25 cursor-pointer"
                        >
                          {moCopiedSyntax ? <Check className="w-3.5 h-3.5 text-[#E0FAEB]" /> : <Copy className="w-3.5 h-3.5 text-[#C5E5EC]/70" />}
                          <span>{moCopiedSyntax ? 'Đã Chép Cú Pháp' : 'Chép Cú Pháp'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyShortcode}
                          className="py-1.5 px-2 rounded-lg bg-[#0E1B2E] hover:bg-[#152844] text-[#C5E5EC] text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition border border-[#C5E5EC]/25 cursor-pointer"
                        >
                          {moCopiedShortcode ? <Check className="w-3.5 h-3.5 text-[#E0FAEB]" /> : <Copy className="w-3.5 h-3.5 text-[#C5E5EC]/70" />}
                          <span>{moCopiedShortcode ? 'Đã Chép Đầu Số' : 'Chép Đầu Số'}</span>
                        </button>
                      </div>

                      {/* Live Radar Listening Indicator */}
                      <div className="p-2.5 rounded-xl bg-[#0E1B2E] border border-[#E0FAEB]/30 flex items-center space-x-2 text-[#E0FAEB]">
                        <div className="relative flex h-3 w-3 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E0FAEB] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E0FAEB]"></span>
                        </div>
                        <span className="text-[11px] leading-tight font-medium text-[#C5E5EC]">
                          Hệ thống đang kết nối Webhook viễn thông và tự động đăng nhập khi tin nhắn MO tới tổng đài...
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
                            {moSimulating ? 'Đang mô phỏng xác thực...' : 'Mô Phỏng Tổng Đài Nhận Tin Nhắn (Dành cho thử nghiệm)'}
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
                          Đổi mã xác thực khác
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Webhook Documentation Dropdown */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setMoShowWebhookDoc(!moShowWebhookDoc)}
                      className="text-[11px] text-[#C5E5EC]/70 hover:text-[#C5E5EC] flex items-center space-x-1 font-medium cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#C5E5EC]/60" />
                      <span>{moShowWebhookDoc ? 'Ẩn hướng dẫn kết nối Webhook SMS Gateway' : 'Xem cấu hình kết nối Webhook cho tổng đài SMS viễn thông'}</span>
                    </button>

                    {moShowWebhookDoc && (
                      <div className="mt-2 p-3 rounded-xl bg-[#081120] border border-[#C5E5EC]/20 text-[11px] text-[#C5E5EC] space-y-2 font-mono">
                        <div className="text-[#E0FAEB] font-bold">Endpoint nhận tin nhắn từ SMS Gateway:</div>
                        <div className="p-2 rounded bg-black/60 border border-[#C5E5EC]/20 break-all text-[10px] text-[#E0FAEB] select-all">
                          POST /api/sms/mo-callback
                        </div>
                        <div className="text-[#C5E5EC]/70 text-[10px]">
                          Hỗ trợ định dạng JSON body hoặc Query parameters của Viettel, VinaPhone, MobiFone, SpeedSMS, eSMS:
                        </div>
                        <pre className="p-2 rounded bg-black/60 text-[10px] text-[#C5E5EC] overflow-x-auto">
{`{
  "phone": "0988668899",
  "message": "${moSession ? moSession.syntax : 'XACTHUC 123456'}",
  "shortcode": "${moShortcode}"
}`}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
            </div>
          )}

          {/* 4. FORGOT PASSWORD */}
          {activeTab === 'FORGOT' && (
            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white">Khôi phục mật khẩu qua OTP</h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('LOGIN')}
                  className="text-[#C5E5EC] font-bold hover:underline text-[11px] cursor-pointer"
                >
                  Quay lại đăng nhập
                </button>
              </div>

              <div>
                <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">Gmail hoặc Số điện thoại tài khoản</label>
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
                    {forgotCountdown > 0 ? `Gửi lại (${forgotCountdown}s)` : 'Nhận OTP'}
                  </button>
                </div>
              </div>

              {generatedOtp && (
                <div className="p-3 rounded-xl bg-[#12233B] border border-[#E0FAEB]/30 text-[#E0FAEB] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold flex items-center text-[#E0FAEB]">
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-[#E0FAEB]" /> Tin nhắn OTP:
                    </span>
                    <span className="text-[10px] text-[#C5E5EC] font-mono">Hiệu lực 3 phút</span>
                  </div>
                  <div className="flex items-center space-x-2 py-1">
                    <span className="text-xs text-[#C5E5EC]/80">Mã xác thực:</span>
                    <strong className="font-mono text-base tracking-[0.2em] text-[#E0FAEB] bg-[#0E1B2E] px-2.5 py-0.5 rounded-lg border border-[#E0FAEB]/40 shadow-xs">
                      {generatedOtp}
                    </strong>
                  </div>
                  <p className="text-[10px] text-[#C5E5EC]/70">
                    * Bắt buộc nhập chính xác 6 số này vào ô bên dưới để đặt lại mật khẩu mới.
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[#C5E5EC]/90 font-semibold">Nhập mã OTP 6 số</label>
                  <span className="text-[10px] text-rose-400 font-medium">* Bắt buộc nhập mã</span>
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
                  placeholder="Nhập đủ 6 chữ số OTP"
                />
              </div>

              <div>
                <label className="block text-[#C5E5EC]/90 mb-1 font-semibold">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 pr-10 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:bg-[#152844] focus:outline-none"
                    placeholder="Mật khẩu tối thiểu 6 ký tự"
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
                Cập Nhật Mật Khẩu Mới
              </button>
            </form>
          )}

          {/* Social Logins */}
          <div className="mt-6 pt-4 border-t border-[#C5E5EC]/20 text-center">
            <span className="text-[11px] text-[#C5E5EC]/70 block mb-3 font-semibold">Hoặc tiếp tục nhanh với</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSocialLogin('Google')}
                disabled={socialLoadingProvider !== null}
                className="py-2.5 rounded-xl bg-[#12233B] hover:bg-[#162C4E] border border-[#C5E5EC]/20 font-bold text-xs text-slate-200 transition flex items-center justify-center space-x-1.5 disabled:opacity-50 shadow-xs active:scale-95 cursor-pointer"
              >
                {socialLoadingProvider === 'Google' ? (
                  <span className="w-3 h-3 border-2 border-slate-400 border-t-slate-100 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                )}
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('Facebook')}
                disabled={socialLoadingProvider !== null}
                className="py-2.5 rounded-xl bg-[#12233B] hover:bg-[#162C4E] border border-[#C5E5EC]/20 font-bold text-xs text-[#1877F2] transition flex items-center justify-center space-x-1.5 disabled:opacity-50 shadow-xs active:scale-95 cursor-pointer"
              >
                {socialLoadingProvider === 'Facebook' ? (
                  <span className="w-3 h-3 border-2 border-blue-400 border-t-blue-200 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                )}
                <span>Facebook</span>
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('Apple')}
                disabled={socialLoadingProvider !== null}
                className="py-2.5 rounded-xl bg-[#12233B] hover:bg-[#162C4E] border border-[#C5E5EC]/20 font-bold text-xs text-white transition flex items-center justify-center space-x-1.5 disabled:opacity-50 shadow-xs active:scale-95 cursor-pointer"
              >
                {socialLoadingProvider === 'Apple' ? (
                  <span className="w-3 h-3 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.35-.57.65-1.07 1.7-0.93 2.73 1.01.08 2.03-.49 2.65-1.23"/>
                  </svg>
                )}
                <span>Apple</span>
              </button>
            </div>
          </div>
        </div>

        {/* Copyright Notice */}
        <div className="mt-8 text-center text-xs text-[#C5E5EC]/70 space-y-1">
          <p className="font-medium">© 2026 GigMe Student Platform. Bản quyền thuộc về GigMe Campus.</p>
          <p className="text-[11px] text-[#C5E5EC]/50">Tất cả quyền được bảo lưu. Nền tảng Siêu kết nối việc làm sinh viên an toàn 100%.</p>
        </div>
      </div>
    </div>
  );
};
