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
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';

export const AuthScreen: React.FC = () => {
  const {
    login,
    register,
    sendOtp,
    resetPasswordWithOtp,
    loginWithPhoneOtp,
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
  const [regContact, setRegContact] = useState('');
  const [regGender, setRegGender] = useState('Nam');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

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
    const contact = regContact.trim();
    const pass = regPassword.trim();
    const confirm = regConfirmPassword.trim();

    if (!name) {
      setAuthError('Vui lòng nhập họ và tên của bạn!');
      return;
    }
    if (!contact) {
      setAuthError('Vui lòng nhập Gmail hoặc Số điện thoại!');
      return;
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
      const success = await register(name, contact, regGender, birth, pass, confirm);
      if (!success) {
        setAuthError('Gmail hoặc Số điện thoại này đã được đăng ký. Bạn có thể bấm Đăng nhập ngay!');
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
    <div className="min-h-screen bg-[#0A0E17] flex flex-col justify-center items-center px-4 py-8 text-white selection:bg-[#00E5FF] selection:text-black">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="GigMe Logo"
            className="w-24 h-24 rounded-full mx-auto shadow-[0_0_35px_rgba(0,229,255,0.4)] border-2 border-cyan-400/40 object-cover mb-3"
          />
          <h1 className="text-3xl font-black tracking-tight">
            Gig<span className="text-[#00E5FF]">Me</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Nền tảng việc làm sinh viên & Smart Escrow bảo chứng 100%
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#131E30] p-1 rounded-2xl border border-slate-800 mb-6 text-xs font-extrabold">
          <button
            id="tab-auth-login"
            onClick={() => {
              setActiveTab('LOGIN');
              setAuthError(null);
            }}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === 'LOGIN' ? 'bg-[#00E5FF] text-black shadow-md' : 'text-slate-400 hover:text-white'
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
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === 'REGISTER' ? 'bg-[#FF6B00] text-black shadow-md' : 'text-slate-400 hover:text-white'
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
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === 'PHONE_OTP' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Đăng Nhập SĐT (OTP)
          </button>
        </div>

        {/* Card Form */}
        <div className="rounded-3xl bg-[#0F172A] border border-[#1E293B] p-6 shadow-2xl">
          {/* Inline Error Banner */}
          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-medium">{authError}</span>
            </div>
          )}

          {/* 1. LOGIN */}
          {activeTab === 'LOGIN' && (
            <div className="space-y-4">
              {/* Quick 1-Click Demo Accounts Bar */}
              <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-cyan-300 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Tài Khoản Thử Nghiệm 1-Chạm:
                  </span>
                  <span className="text-[10px] text-cyan-400/80 font-mono">Bấm là vào</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('0912345678', '123456')}
                    disabled={isLoggingIn}
                    className="p-2 rounded-xl bg-[#131E30] hover:bg-cyan-900/40 border border-slate-700 hover:border-cyan-500/50 text-left transition active:scale-95"
                  >
                    <div className="text-[11px] font-bold text-emerald-400 flex items-center">
                      <span>👨‍💻 Sinh Viên</span>
                    </div>
                    <div className="text-[10px] text-slate-300 font-semibold truncate">Huy (Bách Khoa)</div>
                    <div className="text-[9px] text-slate-500 font-mono">0912345678</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('0987654321', '123456')}
                    disabled={isLoggingIn}
                    className="p-2 rounded-xl bg-[#131E30] hover:bg-cyan-900/40 border border-slate-700 hover:border-cyan-500/50 text-left transition active:scale-95"
                  >
                    <div className="text-[11px] font-bold text-amber-400 flex items-center">
                      <span>🛒 Khách Thuê</span>
                    </div>
                    <div className="text-[10px] text-slate-300 font-semibold truncate">Hà (Kinh Tế)</div>
                    <div className="text-[9px] text-slate-500 font-mono">0987654321</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@admin.vn', 'admin1507')}
                    disabled={isLoggingIn}
                    className="p-2 rounded-xl bg-[#131E30] hover:bg-cyan-900/40 border border-slate-700 hover:border-cyan-500/50 text-left transition active:scale-95"
                  >
                    <div className="text-[11px] font-bold text-purple-400 flex items-center">
                      <span>🛡️ Admin Sàn</span>
                    </div>
                    <div className="text-[10px] text-slate-300 font-semibold truncate">Ban Quản Trị</div>
                    <div className="text-[9px] text-slate-500 font-mono">admin1507</div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Gmail hoặc Số điện thoại</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      id="login-contact-input"
                      required
                      value={loginContact}
                      onChange={(e) => setLoginContact(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                      placeholder="0912345678 hoặc sinhvien@gmail.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-400 font-semibold">Mật khẩu</label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('FORGOT')}
                      className="text-[11px] text-[#00E5FF] hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      id="login-password-input"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="submit-login-btn"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-cyan-500 text-black font-extrabold text-sm hover:brightness-110 shadow-lg shadow-cyan-500/20 transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
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
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Họ và tên đầy đủ</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:border-orange-500 focus:outline-none"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Gmail hoặc Số điện thoại</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={regContact}
                    onChange={(e) => setRegContact(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:border-orange-500 focus:outline-none"
                    placeholder="0912345678 hoặc sinhvien@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Giới tính</label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Ngày sinh (Tùy chọn)</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={regBirthDate}
                      onChange={(e) => setRegBirthDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white"
                      placeholder="15/08/2003"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Mật khẩu (≥6 ký tự)</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full px-3 pr-8 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:border-orange-500 focus:outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-400 font-semibold">Xác nhận</label>
                    {regConfirmPassword && (
                      <span className={`text-[10px] font-bold ${regPassword === regConfirmPassword ? 'text-emerald-400' : 'text-rose-400'}`}>
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
                      className={`w-full px-3 pr-8 py-2 rounded-xl bg-[#131E30] border ${
                        regConfirmPassword && regPassword !== regConfirmPassword
                          ? 'border-rose-500/80'
                          : 'border-slate-700'
                      } text-white focus:border-orange-500 focus:outline-none`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirm(!showRegConfirm)}
                      className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showRegConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                id="submit-register-btn"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-amber-500 text-black font-extrabold text-sm hover:brightness-110 shadow-lg shadow-orange-500/20 transition mt-2"
              >
                Đăng Ký Tài Khoản Mới
              </button>
            </form>
          )}

          {/* 3. PHONE OTP LOGIN */}
          {activeTab === 'PHONE_OTP' && (
            <form onSubmit={handlePhoneOtpLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Số điện thoại di động</label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white font-mono"
                      placeholder="0912345678"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendPhoneOtp}
                    disabled={phoneCountdown > 0}
                    className={`px-3.5 py-2 rounded-xl font-extrabold whitespace-nowrap transition ${
                      phoneCountdown > 0
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-[#00E5FF] text-black hover:brightness-110'
                    }`}
                  >
                    {phoneCountdown > 0 ? `Gửi lại (${phoneCountdown}s)` : 'Gửi Mã OTP'}
                  </button>
                </div>
              </div>

              {generatedOtp && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1" /> Tin nhắn SMS OTP:
                    </span>
                    <span className="text-[10px] text-emerald-300 font-mono">Hiệu lực 3 phút</span>
                  </div>
                  <div className="flex items-center space-x-2 py-1">
                    <span className="text-xs text-slate-300">Mã xác thực của bạn:</span>
                    <strong className="font-mono text-base tracking-[0.2em] text-emerald-300 bg-black/50 px-2.5 py-0.5 rounded-lg border border-emerald-500/40">
                      {generatedOtp}
                    </strong>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    * Bắt buộc phải nhập chính xác 6 số này vào ô bên dưới mới có thể đăng nhập.
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-400 font-semibold">Nhập mã OTP 6 số</label>
                  <span className="text-[10px] text-rose-400 font-medium">* Bắt buộc nhập mã</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={phoneOtpInput}
                    onChange={(e) => setPhoneOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#131E30] border border-slate-700 text-white font-mono tracking-[0.3em] text-center text-base font-bold placeholder:tracking-normal placeholder:text-xs placeholder:font-normal placeholder:text-slate-500"
                    placeholder="Nhập đủ 6 chữ số OTP"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-sm hover:brightness-110 shadow-lg shadow-purple-600/20 transition"
              >
                Xác Thực OTP & Đăng Nhập
              </button>
            </form>
          )}

          {/* 4. FORGOT PASSWORD */}
          {activeTab === 'FORGOT' && (
            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white">Khôi phục mật khẩu qua OTP</h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('LOGIN')}
                  className="text-[#00E5FF] hover:underline text-[11px]"
                >
                  Quay lại đăng nhập
                </button>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Gmail hoặc Số điện thoại tài khoản</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    value={forgotContact}
                    onChange={(e) => setForgotContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white"
                    placeholder="vietanh.dhbk@gmail.com"
                  />
                  <button
                    type="button"
                    onClick={handleSendForgotOtp}
                    disabled={forgotCountdown > 0}
                    className={`px-3.5 py-2 rounded-xl font-extrabold whitespace-nowrap transition ${
                      forgotCountdown > 0
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-[#00E5FF] text-black hover:brightness-110'
                    }`}
                  >
                    {forgotCountdown > 0 ? `Gửi lại (${forgotCountdown}s)` : 'Nhận OTP'}
                  </button>
                </div>
              </div>

              {generatedOtp && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1" /> Tin nhắn OTP:
                    </span>
                    <span className="text-[10px] text-emerald-300 font-mono">Hiệu lực 3 phút</span>
                  </div>
                  <div className="flex items-center space-x-2 py-1">
                    <span className="text-xs text-slate-300">Mã xác thực:</span>
                    <strong className="font-mono text-base tracking-[0.2em] text-emerald-300 bg-black/50 px-2.5 py-0.5 rounded-lg border border-emerald-500/40">
                      {generatedOtp}
                    </strong>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    * Bắt buộc nhập chính xác 6 số này vào ô bên dưới để đặt lại mật khẩu mới.
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-400 font-semibold">Nhập mã OTP 6 số</label>
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
                  className="w-full px-3 py-2.5 rounded-xl bg-[#131E30] border border-slate-700 text-white font-mono tracking-[0.3em] text-center text-base font-bold placeholder:tracking-normal placeholder:text-xs placeholder:font-normal placeholder:text-slate-500"
                  placeholder="Nhập đủ 6 chữ số OTP"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 pr-10 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="Mật khẩu tối thiểu 6 ký tự"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#00E5FF] text-black font-extrabold text-sm hover:brightness-110 transition"
              >
                Cập Nhật Mật Khẩu Mới
              </button>
            </form>
          )}

          {/* Social Logins */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 block mb-3 font-semibold">Hoặc tiếp tục nhanh với</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSocialLogin('Google')}
                disabled={socialLoadingProvider !== null}
                className="py-2.5 rounded-xl bg-[#131E30] hover:bg-slate-800 border border-slate-700 font-bold text-xs text-white transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {socialLoadingProvider === 'Google' ? (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                className="py-2.5 rounded-xl bg-[#131E30] hover:bg-slate-800 border border-slate-700 font-bold text-xs text-blue-400 transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {socialLoadingProvider === 'Facebook' ? (
                  <span className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
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
                className="py-2.5 rounded-xl bg-[#131E30] hover:bg-slate-800 border border-slate-700 font-bold text-xs text-slate-200 transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {socialLoadingProvider === 'Apple' ? (
                  <span className="w-3 h-3 border-2 border-slate-200/30 border-t-slate-200 rounded-full animate-spin" />
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
      </div>
    </div>
  );
};
