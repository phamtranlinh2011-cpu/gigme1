import React, { useState } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  KeyRound,
  ShieldCheck,
  Send,
  Sparkles,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { playNotificationSound } from '../utils/audio';

interface EduEmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UNIVERSITY_MAP: Record<string, string> = {
  'hcmut.edu.vn': 'ĐH Bách Khoa TP.HCM',
  'tdtu.edu.vn': 'ĐH Tôn Đức Thắng',
  'uit.edu.vn': 'ĐH Công Nghệ Thông Tin TP.HCM',
  'hcmus.edu.vn': 'ĐH Khoa Học Tự Nhiên TP.HCM',
  'ueh.edu.vn': 'ĐH Kinh Tế TP.HCM (UEH)',
  'ftu.edu.vn': 'ĐH Ngoại Thương',
  'vnu.edu.vn': 'ĐH Quốc Gia Hà Nội',
  'hust.edu.vn': 'ĐH Bách Khoa Hà Nội',
  'neu.edu.vn': 'ĐH Kinh Tế Quốc Dân',
  'fpt.edu.vn': 'ĐH FPT',
  'rmit.edu.vn': 'ĐH RMIT Việt Nam',
  'vlu.edu.vn': 'ĐH Văn Lang',
  'hutech.edu.vn': 'ĐH HUTECH',
  'uel.edu.vn': 'ĐH Kinh Tế - Luật TP.HCM',
};

export const EduEmailVerificationModal: React.FC<EduEmailVerificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, updateUserProfile, showNotification } = useGigMe();

  const [step, setStep] = useState<'INPUT_EMAIL' | 'ENTER_OTP' | 'SUCCESS'>('INPUT_EMAIL');
  const [email, setEmail] = useState('');
  const [detectedSchool, setDetectedSchool] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  if (!isOpen) return null;

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setErrorMsg('');
    const parts = val.toLowerCase().trim().split('@');
    if (parts.length === 2) {
      const domain = parts[1];
      if (UNIVERSITY_MAP[domain]) {
        setDetectedSchool(UNIVERSITY_MAP[domain]);
      } else if (domain.endsWith('.edu.vn')) {
        const schoolCode = domain.replace('.edu.vn', '').toUpperCase();
        setDetectedSchool(`Đại Học ${schoolCode}`);
      } else if (domain.endsWith('.edu')) {
        setDetectedSchool('Đại Học Quốc Tế (.edu)');
      } else {
        setDetectedSchool('');
      }
    } else {
      setDetectedSchool('');
    }
  };

  const handleSendOtp = () => {
    const clean = email.trim().toLowerCase();
    const isEdu = clean.endsWith('.edu.vn') || clean.endsWith('.edu');
    if (!isEdu || !clean.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ email có đuôi trường học (.edu.vn hoặc .edu)');
      return;
    }

    setIsSending(true);
    setErrorMsg('');

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otpCode);

    setTimeout(() => {
      setIsSending(false);
      setStep('ENTER_OTP');
      setCountdown(60);
      playNotificationSound('DING_DEFAULT');
      showNotification(
        'Mã Xác Thực Sinh Viên Đã Gửi',
        `Mã OTP của bạn: ${otpCode} (Gửi đến ${clean})`
      );

      // Countdown interval
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 600);
  };

  const handleVerifyOtp = () => {
    if (!otpInput || otpInput.trim() !== generatedOtp) {
      setErrorMsg('Mã OTP không chính xác. Vui lòng kiểm tra lại mã gồm 6 số.');
      return;
    }

    setErrorMsg('');
    const schoolName = detectedSchool || 'Đại Học Chính Quy';

    // Update currentUser with verified edu status & trust score
    if (currentUser) {
      const updatedTrust = Math.min(850, (currentUser.trustScore || 500) + 50);
      updateUserProfile({
        isEduVerified: true,
        eduEmail: email.trim().toLowerCase(),
        eduVerifiedAt: Date.now(),
        isStudentVerified: true,
        studentSchool: schoolName,
        trustScore: updatedTrust,
      });
    }

    playNotificationSound('LEVEL_UP');
    setStep('SUCCESS');
    showNotification(
      '🎉 Xác Thực Thành Công!',
      `Đã cấp Tích Xanh Sinh Viên ${schoolName} và cộng +50 TrustScore.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-[#0E1B2E] border border-sky-400/40 p-6 text-white shadow-2xl relative overflow-hidden">
        {/* Background ambient light */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#C5E5EC]/20 relative">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-2xl bg-sky-500/20 border border-sky-400/30 text-sky-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center space-x-1.5">
                <span>Xác Thực Email Trường (.edu.vn)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 font-bold">
                  Tích Xanh Chính Quy
                </span>
              </h3>
              <p className="text-[11px] text-[#C5E5EC]/70">
                Nhận huy hiệu vinh danh, gia tăng 100% độ tin cậy và mở khóa gói thầu lớn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-[#C5E5EC]/70 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Input Email */}
        {step === 'INPUT_EMAIL' && (
          <div className="py-4 space-y-4">
            <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-sky-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Đặc quyền khi xác thực email .edu.vn:</span>
              </div>
              <ul className="space-y-1 text-[#C5E5EC]/80 text-[11px] list-disc list-inside">
                <li>Huy hiệu Tích Xanh & Tên trường hiển thị tại Chat, Xếp Hạng & Bài Đăng</li>
                <li>Cộng ngay <strong>+50 Điểm Tín Nhiệm (TrustScore)</strong></li>
                <li>Được ưu tiên chọn khi nộp đơn vào các dự án trợ giảng, đồ án học thuật</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#C5E5EC]/90">
                Nhập địa chỉ Email do trường Đại học cấp:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#C5E5EC]/50 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="ví dụ: sinhvien@hcmut.edu.vn, ten@tdtu.edu.vn..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/30 text-white placeholder:text-[#C5E5EC]/40 text-xs focus:border-sky-400 focus:outline-none transition"
                />
              </div>

              {detectedSchool && (
                <div className="flex items-center space-x-2 p-2 rounded-xl bg-sky-950/40 border border-sky-500/30 text-sky-300 text-xs mt-1">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>
                    Trường nhận diện: <strong>{detectedSchool}</strong>
                  </span>
                </div>
              )}

              {errorMsg && (
                <p className="text-[11px] text-rose-300 font-medium flex items-center space-x-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </p>
              )}
            </div>

            {/* Quick Demo Selector */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-[#C5E5EC]/60 block">Chọn nhanh trường mẫu để thử nghiệm:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { domain: 'hcmut.edu.vn', label: 'BK TP.HCM' },
                  { domain: 'tdtu.edu.vn', label: 'Tôn Đức Thắng' },
                  { domain: 'uit.edu.vn', label: 'UIT' },
                  { domain: 'ueh.edu.vn', label: 'UEH' },
                  { domain: 'hust.edu.vn', label: 'BK Hà Nội' },
                ].map((item) => (
                  <button
                    key={item.domain}
                    type="button"
                    onClick={() => handleEmailChange(`sinhvien.${item.domain.split('.')[0]}@${item.domain}`)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-[#12233B] hover:bg-[#1b345a] text-[#C5E5EC] border border-[#C5E5EC]/20 transition cursor-pointer"
                  >
                    @{item.domain}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSendOtp}
              disabled={isSending}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-cyan-500 text-white font-extrabold text-xs sm:text-sm hover:brightness-110 shadow-lg shadow-sky-500/20 transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <span>Đang tạo mã OTP...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi Mã Xác Thực OTP 6 Số &rarr;</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 2: Enter OTP */}
        {step === 'ENTER_OTP' && (
          <div className="py-4 space-y-4">
            <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-400/30 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sky-300 font-bold">Mã OTP đã được gửi đến:</span>
                <span className="font-mono text-white font-bold">{email}</span>
              </div>
              {/* Simulation Banner for Easy Verification */}
              <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-between text-xs">
                <span className="text-sky-200">Mã OTP kiểm thử: <strong className="font-mono text-white text-sm tracking-widest">{generatedOtp}</strong></span>
                <button
                  type="button"
                  onClick={() => setOtpInput(generatedOtp)}
                  className="px-2 py-0.5 rounded bg-sky-500 hover:bg-sky-400 text-white font-bold text-[10px] transition cursor-pointer"
                >
                  Tự động điền
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#C5E5EC]/90">
                Nhập mã OTP 6 chữ số:
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#C5E5EC]/50 absolute left-3.5 top-3" />
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => {
                    setOtpInput(e.target.value.replace(/\D/g, ''));
                    setErrorMsg('');
                  }}
                  placeholder="ví dụ: 682914"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/30 text-white placeholder:text-[#C5E5EC]/40 text-sm font-mono tracking-widest text-center font-black focus:border-sky-400 focus:outline-none transition"
                />
              </div>

              {errorMsg && (
                <p className="text-[11px] text-rose-300 font-medium flex items-center space-x-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep('INPUT_EMAIL')}
                className="text-[#C5E5EC]/70 hover:text-white underline text-[11px] cursor-pointer"
              >
                &larr; Đổi địa chỉ email khác
              </button>

              {countdown > 0 ? (
                <span className="text-[11px] text-[#C5E5EC]/60">Gửi lại mã sau: {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-sky-300 hover:text-sky-200 font-bold text-[11px] underline cursor-pointer"
                >
                  Gửi lại mã OTP
                </button>
              )}
            </div>

            <button
              onClick={handleVerifyOtp}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-cyan-500 text-white font-extrabold text-xs sm:text-sm hover:brightness-110 shadow-lg shadow-sky-500/20 transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác Thực Tích Xanh Sinh Viên</span>
            </button>
          </div>
        )}

        {/* STEP 3: Success Celebration */}
        {step === 'SUCCESS' && (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-sky-500/20 border-2 border-sky-400 mx-auto flex items-center justify-center text-sky-400 shadow-xl shadow-sky-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base sm:text-lg font-black text-white">
                Chúc Mừng Bạn Đã Nhận Tích Xanh!
              </h4>
              <p className="text-xs text-[#C5E5EC]/80 max-w-xs mx-auto">
                Tài khoản của bạn đã được liên kết chính thức với trường{' '}
                <strong className="text-sky-300">{detectedSchool || 'Đại Học Chính Quy'}</strong>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#12233B] border border-sky-400/30 max-w-sm mx-auto flex items-center justify-around text-xs">
              <div>
                <span className="text-[10px] text-[#C5E5EC]/70 block">Huy Hiệu Cấp</span>
                <span className="font-extrabold text-sky-300 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Tích Xanh .edu.vn</span>
                </span>
              </div>
              <div className="border-l border-[#C5E5EC]/20 pl-4">
                <span className="text-[10px] text-[#C5E5EC]/70 block">Thưởng Tín Nhiệm</span>
                <span className="font-extrabold text-emerald-400 font-mono text-sm">+50 Trust</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              Hoàn Tất & Xem Hồ Sơ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
